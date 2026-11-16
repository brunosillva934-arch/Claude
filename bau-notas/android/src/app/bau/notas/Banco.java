package app.bau.notas;

import android.content.Context;
import android.database.Cursor;
import android.database.CursorWindow;
import android.database.DatabaseErrorHandler;
import android.database.sqlite.SQLiteCursor;
import android.database.sqlite.SQLiteCursorDriver;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteQuery;
import android.util.Base64;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * O banco de dados do Baú: um arquivo SQLite na área privada do app
 * (databases/bau.db). Todo o SQL é escrito no lado web (src/dados); aqui só
 * se executa o que chega pela ponte.
 */
final class Banco {
    static final String ARQUIVO = "bau.db";
    private static final String TAG = "Bau";
    /** Espaço para ler uma linha grande de uma vez (uma nota muito longa). */
    private static final long JANELA = 8L * 1024 * 1024;

    private final SQLiteDatabase db;

    Banco(Context contexto) {
        db = contexto.openOrCreateDatabase(ARQUIVO, Context.MODE_PRIVATE, null, new DatabaseErrorHandler() {
            @Override
            public void onCorruption(SQLiteDatabase banco) {
                // O comportamento padrão do Android é APAGAR o arquivo corrompido.
                // Num app de notas isso seria o pior desfecho: o arquivo é mantido
                // e o erro aparece na tela, para que seja possível tentar recuperá-lo.
                Log.e(TAG, "Banco corrompido; o arquivo foi preservado: " + banco.getPath());
            }
        });
    }

    void fechar() {
        db.close();
    }

    /** Executa as instruções numa única transação: ou todas valem, ou nenhuma. */
    void lote(JSONArray instrucoes) throws JSONException {
        db.beginTransaction();
        try {
            for (int i = 0; i < instrucoes.length(); i++) {
                JSONObject instrucao = instrucoes.getJSONObject(i);
                String sql = instrucao.getString("sql");
                JSONArray params = instrucao.optJSONArray("params");
                if (params == null || params.length() == 0) {
                    db.execSQL(sql);
                } else {
                    db.execSQL(sql, valores(params));
                }
            }
            db.setTransactionSuccessful();
        } finally {
            db.endTransaction();
        }
    }

    /** Devolve {"colunas":[...], "linhas":[[...], ...]} em JSON. */
    String consultar(String sql, JSONArray params) throws JSONException {
        final Object[] valores = params == null ? new Object[0] : valores(params);
        Cursor cursor = db.rawQueryWithFactory(new SQLiteDatabase.CursorFactory() {
            @Override
            public Cursor newCursor(SQLiteDatabase banco, SQLiteCursorDriver driver, String tabela, SQLiteQuery consulta) {
                for (int i = 0; i < valores.length; i++) {
                    Object v = valores[i];
                    int posicao = i + 1;
                    if (v == null) {
                        consulta.bindNull(posicao);
                    } else if (v instanceof Long) {
                        consulta.bindLong(posicao, ((Long) v).longValue());
                    } else if (v instanceof Double) {
                        consulta.bindDouble(posicao, ((Double) v).doubleValue());
                    } else {
                        consulta.bindString(posicao, v.toString());
                    }
                }
                SQLiteCursor c = new SQLiteCursor(driver, tabela, consulta);
                c.setWindow(new CursorWindow("bau", JANELA));
                return c;
            }
        }, sql, null, null);
        try {
            JSONArray colunas = new JSONArray();
            int n = cursor.getColumnCount();
            for (int i = 0; i < n; i++) {
                colunas.put(cursor.getColumnName(i));
            }
            JSONArray linhas = new JSONArray();
            while (cursor.moveToNext()) {
                JSONArray linha = new JSONArray();
                for (int i = 0; i < n; i++) {
                    switch (cursor.getType(i)) {
                        case Cursor.FIELD_TYPE_NULL:
                            linha.put(JSONObject.NULL);
                            break;
                        case Cursor.FIELD_TYPE_INTEGER:
                            linha.put(cursor.getLong(i));
                            break;
                        case Cursor.FIELD_TYPE_FLOAT:
                            linha.put(cursor.getDouble(i));
                            break;
                        case Cursor.FIELD_TYPE_BLOB:
                            linha.put(Base64.encodeToString(cursor.getBlob(i), Base64.NO_WRAP));
                            break;
                        default:
                            linha.put(cursor.getString(i));
                            break;
                    }
                }
                linhas.put(linha);
            }
            JSONObject resposta = new JSONObject();
            resposta.put("colunas", colunas);
            resposta.put("linhas", linhas);
            return resposta.toString();
        } finally {
            cursor.close();
        }
    }

    /** Converte os parâmetros do JSON nos tipos que o SQLite do Android aceita. */
    private static Object[] valores(JSONArray params) throws JSONException {
        Object[] saida = new Object[params.length()];
        for (int i = 0; i < saida.length; i++) {
            Object v = params.get(i);
            if (v == null || v == JSONObject.NULL) {
                saida[i] = null;
            } else if (v instanceof Boolean) {
                saida[i] = Long.valueOf(((Boolean) v).booleanValue() ? 1L : 0L);
            } else if (v instanceof Integer || v instanceof Long) {
                saida[i] = Long.valueOf(((Number) v).longValue());
            } else if (v instanceof Number) {
                double d = ((Number) v).doubleValue();
                // Números inteiros que chegaram como ponto flutuante (datas em milissegundos).
                if (d == Math.rint(d) && Math.abs(d) < 9.0e15) {
                    saida[i] = Long.valueOf((long) d);
                } else {
                    saida[i] = Double.valueOf(d);
                }
            } else {
                saida[i] = v.toString();
            }
        }
        return saida;
    }
}
