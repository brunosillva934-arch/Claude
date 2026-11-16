package app.bau.notas;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Matrix;
import android.media.ExifInterface;
import android.net.Uri;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Imagens das notas (fotos de exames, figuras). Ficam na área privada do app
 * (files/imagens), reduzidas a no máximo 1600 px no lado maior e com a rotação
 * da câmera já aplicada. A página as pede como https://localhost/imagens/…,
 * servidas pela MainActivity.
 */
final class Imagens {
    static final String PASTA = "imagens";
    private static final int LADO_MAXIMO = 1600;
    private static final Pattern NOME = Pattern.compile("[a-f0-9-]{36}\\.jpg");

    private Imagens() {
    }

    static File pasta(Context contexto) {
        File pasta = new File(contexto.getFilesDir(), PASTA);
        if (!pasta.isDirectory() && !pasta.mkdirs()) {
            throw new IllegalStateException("Não foi possível criar a pasta de imagens");
        }
        return pasta;
    }

    /** Arquivo de uma imagem pelo nome, ou null se o nome não for de uma imagem do app. */
    static File arquivo(Context contexto, String nome) {
        if (nome == null || !NOME.matcher(nome).matches()) {
            return null;
        }
        File f = new File(pasta(contexto), nome);
        return f.isFile() ? f : null;
    }

    /** Lê a imagem de origem, reduz, endireita e grava. Devolve o nome do arquivo. */
    static String salvar(Context contexto, Uri origem) throws IOException {
        BitmapFactory.Options medidas = new BitmapFactory.Options();
        medidas.inJustDecodeBounds = true;
        InputStream entrada = contexto.getContentResolver().openInputStream(origem);
        if (entrada == null) {
            throw new IOException("Imagem não encontrada");
        }
        try {
            BitmapFactory.decodeStream(entrada, null, medidas);
        } finally {
            entrada.close();
        }
        if (medidas.outWidth <= 0 || medidas.outHeight <= 0) {
            throw new IOException("O arquivo escolhido não é uma imagem");
        }
        // Lê já reduzida (potência de 2), para não estourar a memória com fotos grandes.
        int amostra = 1;
        while (Math.max(medidas.outWidth, medidas.outHeight) / (amostra * 2) >= LADO_MAXIMO) {
            amostra *= 2;
        }
        BitmapFactory.Options opcoes = new BitmapFactory.Options();
        opcoes.inSampleSize = amostra;
        Bitmap imagem;
        entrada = contexto.getContentResolver().openInputStream(origem);
        try {
            imagem = BitmapFactory.decodeStream(entrada, null, opcoes);
        } finally {
            if (entrada != null) {
                entrada.close();
            }
        }
        if (imagem == null) {
            throw new IOException("Não foi possível ler a imagem");
        }

        Matrix ajuste = new Matrix();
        int rotacao = rotacao(contexto, origem);
        if (rotacao != 0) {
            ajuste.postRotate(rotacao);
        }
        float escala = Math.min(1f, (float) LADO_MAXIMO / Math.max(imagem.getWidth(), imagem.getHeight()));
        if (escala < 1f) {
            ajuste.postScale(escala, escala);
        }
        if (!ajuste.isIdentity()) {
            Bitmap ajustada = Bitmap.createBitmap(imagem, 0, 0, imagem.getWidth(), imagem.getHeight(), ajuste, true);
            if (ajustada != imagem) {
                imagem.recycle();
                imagem = ajustada;
            }
        }

        String nome = UUID.randomUUID().toString() + ".jpg";
        File destino = new File(pasta(contexto), nome);
        FileOutputStream saida = new FileOutputStream(destino);
        try {
            imagem.compress(Bitmap.CompressFormat.JPEG, 85, saida);
        } finally {
            saida.close();
            imagem.recycle();
        }
        return nome;
    }

    /** Rotação gravada pela câmera nos dados EXIF da foto. */
    private static int rotacao(Context contexto, Uri origem) {
        try {
            InputStream entrada = contexto.getContentResolver().openInputStream(origem);
            if (entrada == null) {
                return 0;
            }
            try {
                int o = new ExifInterface(entrada).getAttributeInt(
                        ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL);
                if (o == ExifInterface.ORIENTATION_ROTATE_90) {
                    return 90;
                }
                if (o == ExifInterface.ORIENTATION_ROTATE_180) {
                    return 180;
                }
                if (o == ExifInterface.ORIENTATION_ROTATE_270) {
                    return 270;
                }
                return 0;
            } finally {
                entrada.close();
            }
        } catch (IOException e) {
            return 0;
        }
    }
}
