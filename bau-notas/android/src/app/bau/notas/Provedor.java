package app.bau.notas;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.database.Cursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;

import java.io.File;
import java.io.FileNotFoundException;
import java.util.List;

/**
 * Entrega ao app de câmera um único arquivo temporário, onde ele grava a foto
 * (cache/camera/foto.jpg). Não é exportado: a câmera só o alcança pela
 * permissão de escrita concedida na hora, junto com o pedido da foto.
 */
public final class Provedor extends ContentProvider {
    static final String AUTORIDADE = "app.bau.notas.arquivos";

    static Uri uriDaFoto() {
        return Uri.parse("content://" + AUTORIDADE + "/camera/foto.jpg");
    }

    static File arquivoDaFoto(File cache) {
        File pasta = new File(cache, "camera");
        if (!pasta.isDirectory()) {
            pasta.mkdirs();
        }
        return new File(pasta, "foto.jpg");
    }

    @Override
    public boolean onCreate() {
        return true;
    }

    @Override
    public ParcelFileDescriptor openFile(Uri uri, String modo) throws FileNotFoundException {
        List<String> partes = uri.getPathSegments();
        if (partes.size() != 2 || !"camera".equals(partes.get(0)) || !"foto.jpg".equals(partes.get(1))) {
            throw new FileNotFoundException(uri.toString());
        }
        return ParcelFileDescriptor.open(arquivoDaFoto(getContext().getCacheDir()), ParcelFileDescriptor.parseMode(modo));
    }

    @Override
    public String getType(Uri uri) {
        return "image/jpeg";
    }

    @Override
    public Cursor query(Uri uri, String[] colunas, String selecao, String[] args, String ordem) {
        return null;
    }

    @Override
    public Uri insert(Uri uri, ContentValues valores) {
        return null;
    }

    @Override
    public int delete(Uri uri, String selecao, String[] args) {
        return 0;
    }

    @Override
    public int update(Uri uri, ContentValues valores, String selecao, String[] args) {
        return 0;
    }
}
