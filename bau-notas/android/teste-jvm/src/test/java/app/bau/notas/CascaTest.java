package app.bau.notas;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;
import static org.robolectric.Shadows.shadowOf;

import android.os.Looper;
import android.webkit.WebView;

import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.Robolectric;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;
import org.robolectric.annotation.Config;

/**
 * Confere, com o framework do Android 14 e o SQLite de verdade, o caminho de
 * que o app depende para abrir: banco, ponte e criação da tela.
 */
@RunWith(RobolectricTestRunner.class)
@Config(sdk = 34, manifest = Config.NONE)
public class CascaTest {

    private static JSONArray lote(String... instrucoes) throws Exception {
        JSONArray a = new JSONArray();
        for (String i : instrucoes) {
            a.put(new JSONObject(i));
        }
        return a;
    }

    @Test
    public void bancoGravaELeComTiposCertos() throws Exception {
        Banco banco = new Banco(RuntimeEnvironment.getApplication());
        banco.lote(lote(
                "{\"sql\":\"CREATE TABLE t (id TEXT PRIMARY KEY NOT NULL, n INTEGER, x REAL, s TEXT)\"}",
                "{\"sql\":\"INSERT INTO t (id, n, x, s) VALUES (?, ?, ?, ?)\",\"params\":[\"a\",1731700000000,0.5,null]}",
                "{\"sql\":\"INSERT INTO t (id, n, x, s) VALUES (?, ?, ?, ?)\",\"params\":[\"b\",2,1.25,\"Hipertensão — ção\"]}",
                "{\"sql\":\"PRAGMA user_version = 3\"}"));

        JSONObject versao = new JSONObject(banco.consultar("PRAGMA user_version", null));
        assertEquals("user_version", versao.getJSONArray("colunas").getString(0));
        assertEquals(3, versao.getJSONArray("linhas").getJSONArray(0).getInt(0));

        JSONObject r = new JSONObject(banco.consultar("SELECT id, n, x, s FROM t WHERE n > ? ORDER BY id", new JSONArray("[1]")));
        assertEquals("[\"id\",\"n\",\"x\",\"s\"]", r.getJSONArray("colunas").toString());
        JSONArray linhas = r.getJSONArray("linhas");
        assertEquals(2, linhas.length());
        assertEquals(1731700000000L, linhas.getJSONArray(0).getLong(1));
        assertEquals(0.5, linhas.getJSONArray(0).getDouble(2), 0.0);
        assertTrue(linhas.getJSONArray(0).isNull(3));
        assertEquals("Hipertensão — ção", linhas.getJSONArray(1).getString(3));

        // Parâmetro de texto e ausência de resultados.
        JSONObject vazio = new JSONObject(banco.consultar("SELECT id FROM t WHERE id = ?", new JSONArray("[\"zzz\"]")));
        assertEquals(0, vazio.getJSONArray("linhas").length());
        banco.fechar();
    }

    @Test
    public void loteComErroNaoGravaNada() throws Exception {
        Banco banco = new Banco(RuntimeEnvironment.getApplication());
        banco.lote(lote("{\"sql\":\"CREATE TABLE t (id TEXT PRIMARY KEY NOT NULL)\"}"));
        try {
            banco.lote(lote(
                    "{\"sql\":\"INSERT INTO t (id) VALUES (?)\",\"params\":[\"a\"]}",
                    "{\"sql\":\"INSERT INTO tabela_que_nao_existe (id) VALUES (?)\",\"params\":[\"b\"]}"));
            fail("deveria ter falhado");
        } catch (Exception esperado) {
            // a transação inteira é desfeita
        }
        JSONObject r = new JSONObject(banco.consultar("SELECT count(*) AS n FROM t", null));
        assertEquals(0, r.getJSONArray("linhas").getJSONArray(0).getInt(0));
        banco.fechar();
    }

    @Test
    public void notaGrandeCabeNaLeitura() throws Exception {
        Banco banco = new Banco(RuntimeEnvironment.getApplication());
        banco.lote(lote("{\"sql\":\"CREATE TABLE notas (id TEXT PRIMARY KEY NOT NULL, conteudo TEXT)\"}"));
        // Cerca de 3 MB de texto numa única nota: mais que a janela padrão do Android (2 MB).
        StringBuilder texto = new StringBuilder();
        while (texto.length() < 3 * 1024 * 1024) {
            texto.append("Dor torácica, dispneia e síncope. ");
        }
        JSONObject instrucao = new JSONObject();
        instrucao.put("sql", "INSERT INTO notas (id, conteudo) VALUES (?, ?)");
        instrucao.put("params", new JSONArray().put("n1").put(texto.toString()));
        banco.lote(new JSONArray().put(instrucao));
        JSONObject r = new JSONObject(banco.consultar("SELECT conteudo FROM notas WHERE id = ?", new JSONArray("[\"n1\"]")));
        assertEquals(texto.length(), r.getJSONArray("linhas").getJSONArray(0).getString(0).length());
        banco.fechar();
    }

    @Test
    public void telaAbreEAPonteResponde() throws Exception {
        MainActivity tela = Robolectric.buildActivity(MainActivity.class).setup().get();
        WebView web = tela.web;
        assertNotNull(web);
        assertEquals("https://localhost/index.html", shadowOf(web).getLastLoadedUrl());
        assertTrue(web.getSettings().getJavaScriptEnabled());
        assertFalse(web.getSettings().getAllowFileAccess());
        assertNotNull(shadowOf(web).getJavascriptInterface("BauNativo"));

        // Chamada síncrona: informações do sistema (é a primeira coisa que a página pede).
        JSONObject info = new JSONObject(tela.ponte.chamarSinc("sistema.info", "{}"));
        assertTrue(info.getBoolean("ok"));
        assertEquals(34, info.getJSONObject("valor").getInt("sdk"));
        assertFalse(info.getJSONObject("valor").getBoolean("noturno"));

        // Gravação síncrona (usada quando o app vai para segundo plano) e leitura assíncrona.
        JSONObject gravou = new JSONObject(tela.ponte.chamarSinc("sql.lote",
                "{\"instrucoes\":[{\"sql\":\"CREATE TABLE c (chave TEXT PRIMARY KEY NOT NULL, valor TEXT NOT NULL)\"},"
                        + "{\"sql\":\"INSERT OR REPLACE INTO c (chave, valor) VALUES (?, ?)\",\"params\":[\"visao\",\"arvore\"]}]}"));
        assertTrue(gravou.toString(), gravou.getBoolean("ok"));

        tela.ponte.chamar(7, "sql.consultar", "{\"sql\":\"SELECT chave, valor FROM c\",\"params\":[]}");
        String js = esperarResposta(web);
        assertEquals("window.__bau&&window.__bau.r(7,true,{\"colunas\":[\"chave\",\"valor\"],\"linhas\":[[\"visao\",\"arvore\"]]})", js);

        // Erro de SQL volta como resposta de falha, sem derrubar o app.
        tela.ponte.chamar(8, "sql.consultar", "{\"sql\":\"SELECT * FROM nao_existe\"}");
        js = esperarResposta(web);
        assertTrue(js, js.startsWith("window.__bau&&window.__bau.r(8,false,\""));

        JSONObject desconhecido = new JSONObject(tela.ponte.chamarSinc("nao.existe", "{}"));
        assertFalse(desconhecido.getBoolean("ok"));

        // Barras do sistema, toque e minimizar não podem lançar exceção.
        assertTrue(new JSONObject(tela.ponte.chamarSinc("sistema.barras",
                "{\"status\":\"#FFFFFF\",\"navegacao\":\"#F3F5F8\",\"fundoClaro\":true}")).getBoolean("ok"));
        assertTrue(new JSONObject(tela.ponte.chamarSinc("sistema.toque", "{}")).getBoolean("ok"));
        shadowOf(Looper.getMainLooper()).idle();
        assertEquals(0xFFFFFFFF, tela.getWindow().getStatusBarColor());

        // Botão voltar: é entregue à página.
        tela.onBackPressed();
        assertTrue(shadowOf(web).getLastEvaluatedJavascript().contains("__bau.voltar"));
    }

    /** Espera a fila da ponte processar e a resposta ser entregue ao WebView. */
    private static String esperarResposta(WebView web) throws Exception {
        String antes = shadowOf(web).getLastEvaluatedJavascript();
        for (int i = 0; i < 200; i++) {
            shadowOf(Looper.getMainLooper()).idle();
            String agora = shadowOf(web).getLastEvaluatedJavascript();
            if (agora != null && !agora.equals(antes)) {
                return agora;
            }
            Thread.sleep(10);
        }
        throw new AssertionError("a ponte não respondeu");
    }
}
