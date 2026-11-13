package app.fichario.medico;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.database.Cursor;
import android.database.MatrixCursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import android.provider.OpenableColumns;

import java.io.File;
import java.io.FileNotFoundException;

/**
 * Entrega, só para leitura, o arquivo que o "Enviar o fichário" acabou de gerar
 * (cache/envio/nome.json). O app que recebe o compartilhamento ganha permissão
 * só para esse endereço, e só enquanto precisar dele.
 */
public class Arquivos extends ContentProvider {
    static final String AUTORIDADE = "app.fichario.medico.arquivos";

    static File pasta(File cache) {
        return new File(cache, "envio");
    }

    static Uri endereco(String nome) {
        return Uri.parse("content://" + AUTORIDADE + "/" + Uri.encode(nome));
    }

    @Override
    public boolean onCreate() {
        return true;
    }

    private File arquivo(Uri u) {
        String nome = u.getLastPathSegment();
        if (nome == null || !nome.matches("[A-Za-z0-9._-]{1,80}")) return null;
        File f = new File(pasta(getContext().getCacheDir()), nome);
        return f.isFile() ? f : null;
    }

    @Override
    public ParcelFileDescriptor openFile(Uri u, String modo) throws FileNotFoundException {
        File f = arquivo(u);
        if (f == null) throw new FileNotFoundException();
        return ParcelFileDescriptor.open(f, ParcelFileDescriptor.MODE_READ_ONLY);
    }

    @Override
    public Cursor query(Uri u, String[] colunas, String selecao, String[] args, String ordem) {
        File f = arquivo(u);
        if (f == null) return null;
        if (colunas == null) colunas = new String[] { OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE };
        MatrixCursor c = new MatrixCursor(colunas, 1);
        Object[] linha = new Object[colunas.length];
        for (int i = 0; i < colunas.length; i++) {
            if (OpenableColumns.DISPLAY_NAME.equals(colunas[i])) linha[i] = f.getName();
            else if (OpenableColumns.SIZE.equals(colunas[i])) linha[i] = f.length();
        }
        c.addRow(linha);
        return c;
    }

    @Override
    public String getType(Uri u) {
        return "application/json";
    }

    @Override
    public Uri insert(Uri u, ContentValues v) {
        return null;
    }

    @Override
    public int delete(Uri u, String s, String[] a) {
        return 0;
    }

    @Override
    public int update(Uri u, ContentValues v, String s, String[] a) {
        return 0;
    }
}
