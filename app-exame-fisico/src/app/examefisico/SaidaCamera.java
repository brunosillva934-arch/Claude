package app.examefisico;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.database.Cursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;

import java.io.File;
import java.io.FileNotFoundException;

/**
 * Um único endereço, content://app.examefisico.camera/foto.jpg, onde o app de câmera grava a
 * foto tirada. Não é exportado: a câmera só escreve nele com a permissão temporária que o
 * app concede no pedido. O arquivo fica no cache e é apagado depois de processado.
 */
public class SaidaCamera extends ContentProvider {
    public static final Uri ENDERECO = Uri.parse("content://app.examefisico.camera/foto.jpg");

    static File arquivo(android.content.Context c) {
        return new File(c.getCacheDir(), "camera.jpg");
    }

    @Override
    public boolean onCreate() {
        return true;
    }

    @Override
    public ParcelFileDescriptor openFile(Uri uri, String modo) throws FileNotFoundException {
        if (!"/foto.jpg".equals(uri.getPath())) throw new FileNotFoundException(uri.toString());
        int m = modo != null && modo.contains("w")
            ? ParcelFileDescriptor.MODE_READ_WRITE | ParcelFileDescriptor.MODE_CREATE | ParcelFileDescriptor.MODE_TRUNCATE
            : ParcelFileDescriptor.MODE_READ_ONLY;
        return ParcelFileDescriptor.open(arquivo(getContext()), m);
    }

    @Override
    public String getType(Uri uri) {
        return "image/jpeg";
    }

    @Override
    public Cursor query(Uri uri, String[] p, String s, String[] a, String o) {
        return null;
    }

    @Override
    public Uri insert(Uri uri, ContentValues v) {
        return null;
    }

    @Override
    public int update(Uri uri, ContentValues v, String s, String[] a) {
        return 0;
    }

    @Override
    public int delete(Uri uri, String s, String[] a) {
        return 0;
    }
}
