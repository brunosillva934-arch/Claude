package app.examefisico;

import android.app.Activity;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.content.res.Configuration;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.graphics.Matrix;
import android.media.ExifInterface;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.Base64;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewParent;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.Closeable;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.ArrayList;

/**
 * Uma tela só: um WebView com a página embutida em assets/index.html.
 * Sem rede e sem permissões. Esta classe faz pela página o que ela não faz sozinha:
 * guarda o roteiro e os exames em arquivos privados, salva e abre cópias de segurança
 * pelo seletor do sistema e entrega o texto do exame para outros apps.
 */
public class MainActivity extends Activity {
    private static final int PEDIR_ARQUIVO = 41;
    private static final int PEDIR_DESTINO = 42;
    private static final int PEDIR_FOTO = 43;
    private static final int PEDIR_CAMERA = 44;
    private static final int LIMITE_FOTO = 40 * 1024 * 1024;
    private static final int LADO_FOTO = 1280;   // maior lado da foto guardada
    private static final int LADO_MINI = 360;    // miniatura para listas
    private static final int LIMITE_ARQUIVO = 32 * 1024 * 1024;
    private static final int LIMITE_ENVIO = 180000;

    private WebView web;
    private boolean pronta;
    private File pasta;
    private String paraSalvar;
    private File pastaFotos;
    /** Fotos já processadas que a página ainda não buscou (nomes, sem extensão). */
    private final ArrayList<String> fotosProntas = new ArrayList<String>();
    /** Arquivos lidos que a página ainda não buscou: {nome, texto}. */
    private final ArrayList<String[]> pendentes = new ArrayList<String[]>();

    @Override
    protected void onCreate(Bundle estado) {
        super.onCreate(estado);
        pasta = new File(getFilesDir(), "dados");
        pasta.mkdirs();
        pastaFotos = new File(getFilesDir(), "fotos");
        pastaFotos.mkdirs();
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);

        web = new WebView(this);
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setSupportZoom(false);
        web.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView v, String url) {
                pronta = true;
                avisar();
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView v, String url) {
                return true; // a página não navega para lugar nenhum
            }
        });
        web.setWebChromeClient(new WebChromeClient());
        web.addJavascriptInterface(new Ponte(), "Android");
        setContentView(web);

        if (estado == null) receber(getIntent());
        web.loadUrl("file:///android_asset/index.html");
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        receber(intent);
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (web != null) web.onResume();
    }

    @Override
    protected void onPause() {
        if (web != null) {
            if (pronta) web.evaluateJavascript("window.__pausa&&window.__pausa()", null);
            web.onPause();
        }
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        if (web != null) {
            ViewParent pai = web.getParent();
            if (pai instanceof ViewGroup) ((ViewGroup) pai).removeView(web);
            web.destroy();
            web = null;
        }
        super.onDestroy();
    }

    @Override
    public void onConfigurationChanged(Configuration nova) {
        super.onConfigurationChanged(nova);
        if (web != null && pronta) web.evaluateJavascript("window.__tema&&window.__tema()", null);
    }

    @Override
    public void onBackPressed() {
        if (web == null || !pronta) {
            finish();
            return;
        }
        web.evaluateJavascript("(window.__voltar?window.__voltar():false)", new ValueCallback<String>() {
            @Override
            public void onReceiveValue(String tratou) {
                if (!"true".equals(tratou)) finish();
            }
        });
    }

    @Override
    protected void onActivityResult(int pedido, int resultado, Intent dados) {
        super.onActivityResult(pedido, resultado, dados);
        if (pedido == PEDIR_FOTO) {
            if (resultado == RESULT_OK && dados != null && dados.getData() != null) processarFoto(dados.getData(), null);
            return;
        }
        if (pedido == PEDIR_CAMERA) {
            File f = SaidaCamera.arquivo(this);
            if (resultado == RESULT_OK && f.isFile() && f.length() > 0) processarFoto(null, f);
            else f.delete();
            return;
        }
        if (pedido == PEDIR_ARQUIVO) {
            if (resultado == RESULT_OK && dados != null && dados.getData() != null) lerEmFundo(dados.getData());
        } else if (pedido == PEDIR_DESTINO) {
            final String texto = paraSalvar;
            paraSalvar = null;
            if (resultado != RESULT_OK || dados == null) return;
            final Uri destino = dados.getData();
            if (destino == null || texto == null) {
                dizer("Não deu para salvar. Tente de novo.");
                return;
            }
            new Thread(new Runnable() {
                @Override
                public void run() {
                    boolean ok = false;
                    OutputStream out = null;
                    try {
                        out = getContentResolver().openOutputStream(destino, "wt");
                        if (out != null) {
                            out.write(texto.getBytes("UTF-8"));
                            out.flush();
                            ok = true;
                        }
                    } catch (Exception e) {
                        ok = false;
                    } finally {
                        fechar(out);
                    }
                    dizer(ok ? "Arquivo salvo." : "Não deu para salvar nesse lugar.");
                }
            }).start();
        }
    }

    /* ── o que chega de fora ─────────────────────────────────────────── */

    /** Uma cópia de segurança aberta com o app ("abrir com"). */
    private void receber(Intent in) {
        if (in == null || !Intent.ACTION_VIEW.equals(in.getAction()) || in.getData() == null) return;
        lerEmFundo(in.getData());
    }

    private void lerEmFundo(final Uri u) {
        new Thread(new Runnable() {
            @Override
            public void run() {
                String texto = lerTexto(u);
                if (texto == null) {
                    dizer("Não consegui ler o arquivo.");
                    return;
                }
                synchronized (pendentes) {
                    pendentes.add(new String[] { "arquivo", texto });
                }
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        avisar();
                    }
                });
            }
        }).start();
    }

    private String lerTexto(Uri u) {
        if (u == null || !"content".equals(u.getScheme())) return null;
        InputStream in = null;
        try {
            in = getContentResolver().openInputStream(u);
            if (in == null) return null;
            byte[] b = lerTudo(in, LIMITE_ARQUIVO);
            int ini = (b.length >= 3 && (b[0] & 0xFF) == 0xEF && (b[1] & 0xFF) == 0xBB && (b[2] & 0xFF) == 0xBF) ? 3 : 0;
            return new String(b, ini, b.length - ini, "UTF-8");
        } catch (Exception e) {
            return null;
        } finally {
            fechar(in);
        }
    }

    /** Diz à página que há arquivo ou foto esperando; ela busca com Android.pendentes() e Android.fotosProntas(). */
    private void avisar() {
        if (web == null || !pronta) return;
        boolean tem, foto;
        synchronized (pendentes) {
            tem = !pendentes.isEmpty();
        }
        synchronized (fotosProntas) {
            foto = !fotosProntas.isEmpty();
        }
        if (tem) web.evaluateJavascript("window.__chegou&&window.__chegou()", null);
        if (foto) web.evaluateJavascript("window.__fotoPronta&&window.__fotoPronta()", null);
    }

    /* ── fotos ───────────────────────────────────────────────────────── */

    private File arquivoFoto(String nome, boolean mini) {
        if (nome == null || !nome.matches("[A-Za-z0-9_-]{1,80}")) return null;
        return new File(pastaFotos, nome + (mini ? "_m.jpg" : ".jpg"));
    }

    private void abrirGaleria() {
        Intent i = new Intent(Intent.ACTION_GET_CONTENT);
        i.addCategory(Intent.CATEGORY_OPENABLE);
        i.setType("image/*");
        try {
            startActivityForResult(Intent.createChooser(i, "Escolha a foto"), PEDIR_FOTO);
        } catch (Exception e) {
            dizer("Nenhum app de galeria encontrado.");
        }
    }

    private void abrirCamera() {
        Intent i = new Intent(android.provider.MediaStore.ACTION_IMAGE_CAPTURE);
        i.putExtra(android.provider.MediaStore.EXTRA_OUTPUT, SaidaCamera.ENDERECO);
        i.setClipData(ClipData.newRawUri("foto", SaidaCamera.ENDERECO));
        i.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_READ_URI_PERMISSION);
        try {
            SaidaCamera.arquivo(this).delete();
            startActivityForResult(i, PEDIR_CAMERA);
        } catch (Exception e) {
            dizer("Nenhum app de câmera encontrado. Tire a foto e use \"Galeria\".");
        }
    }

    /** Lê a foto, endireita pelo EXIF, reduz e grava foto e miniatura. Roda fora da tela. */
    private void processarFoto(final Uri origem, final File arquivo) {
        new Thread(new Runnable() {
            @Override
            public void run() {
                File entrada = arquivo;
                Bitmap b = null, cheia = null, mini = null;
                try {
                    if (origem != null) {
                        entrada = new File(getCacheDir(), "entrada.jpg");
                        InputStream in = getContentResolver().openInputStream(origem);
                        if (in == null) throw new Exception("sem dados");
                        FileOutputStream out = new FileOutputStream(entrada);
                        try {
                            byte[] buf = new byte[16384];
                            int n;
                            long total = 0;
                            while ((n = in.read(buf)) != -1) {
                                total += n;
                                if (total > LIMITE_FOTO) throw new Exception("grande demais");
                                out.write(buf, 0, n);
                            }
                        } finally {
                            fechar(in);
                            fechar(out);
                        }
                    }
                    BitmapFactory.Options o = new BitmapFactory.Options();
                    o.inJustDecodeBounds = true;
                    BitmapFactory.decodeFile(entrada.getPath(), o);
                    if (o.outWidth <= 0 || o.outHeight <= 0) throw new Exception("não é imagem");
                    int maior = Math.max(o.outWidth, o.outHeight), amostra = 1;
                    while (maior / (amostra * 2) >= LADO_FOTO) amostra *= 2;
                    BitmapFactory.Options o2 = new BitmapFactory.Options();
                    o2.inSampleSize = amostra;
                    b = BitmapFactory.decodeFile(entrada.getPath(), o2);
                    if (b == null) throw new Exception("não decodificou");
                    cheia = escalar(b, LADO_FOTO, giro(entrada));
                    mini = escalar(cheia, LADO_MINI, 0);
                    String nome = "u" + Long.toString(System.currentTimeMillis(), 36) + Integer.toString((int) (Math.random() * 1296), 36);
                    gravarJpeg(cheia, arquivoFoto(nome, false), 82);
                    gravarJpeg(mini, arquivoFoto(nome, true), 78);
                    synchronized (fotosProntas) {
                        fotosProntas.add(nome);
                    }
                    runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            avisar();
                        }
                    });
                } catch (Throwable e) { // inclui falta de memória com fotos enormes
                    dizer("Não consegui usar essa foto.");
                } finally {
                    if (mini != null && mini != cheia) mini.recycle();
                    if (cheia != null && cheia != b) cheia.recycle();
                    if (b != null) b.recycle();
                    if (entrada != null) entrada.delete();
                }
            }
        }).start();
    }

    private static int giro(File f) {
        try {
            int o = new ExifInterface(f.getPath()).getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL);
            if (o == ExifInterface.ORIENTATION_ROTATE_90 || o == ExifInterface.ORIENTATION_TRANSPOSE) return 90;
            if (o == ExifInterface.ORIENTATION_ROTATE_180) return 180;
            if (o == ExifInterface.ORIENTATION_ROTATE_270 || o == ExifInterface.ORIENTATION_TRANSVERSE) return 270;
        } catch (Exception e) {
            // sem EXIF: fica como está
        }
        return 0;
    }

    private static Bitmap escalar(Bitmap b, int lado, int graus) {
        float s = Math.min(1f, lado / (float) Math.max(b.getWidth(), b.getHeight()));
        if (s >= 1f && graus == 0) return b;
        Matrix m = new Matrix();
        m.postScale(s, s);
        if (graus != 0) m.postRotate(graus);
        return Bitmap.createBitmap(b, 0, 0, b.getWidth(), b.getHeight(), m, true);
    }

    private static void gravarJpeg(Bitmap b, File destino, int qualidade) throws Exception {
        File tmp = new File(destino.getPath() + ".tmp");
        FileOutputStream out = new FileOutputStream(tmp);
        try {
            if (!b.compress(Bitmap.CompressFormat.JPEG, qualidade, out)) throw new Exception("não comprimiu");
            out.getFD().sync();
        } finally {
            fechar(out);
        }
        if (!tmp.renameTo(destino)) throw new Exception("não gravou");
    }

    private static byte[] lerArquivo(File f) throws Exception {
        FileInputStream in = new FileInputStream(f);
        try {
            return lerTudo(in, Integer.MAX_VALUE);
        } finally {
            fechar(in);
        }
    }

    /* ── utilidades ──────────────────────────────────────────────────── */

    private void dizer(final String msg) {
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                Toast.makeText(MainActivity.this, msg, Toast.LENGTH_LONG).show();
            }
        });
    }

    private static void fechar(Closeable c) {
        if (c == null) return;
        try {
            c.close();
        } catch (Exception e) {
            // já estava fechado
        }
    }

    private static byte[] lerTudo(InputStream in, int limite) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        byte[] buf = new byte[16384];
        int n;
        long total = 0;
        while ((n = in.read(buf)) != -1) {
            total += n;
            if (total > limite) throw new Exception("arquivo grande demais");
            out.write(buf, 0, n);
        }
        return out.toByteArray();
    }

    private File arquivoDe(String chave) {
        if (chave == null || !chave.matches("[A-Za-z0-9_-]{1,80}")) return null;
        return new File(pasta, chave + ".json");
    }

    private void abrirSeletor() {
        Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        i.addCategory(Intent.CATEGORY_OPENABLE);
        i.setType("*/*");
        i.putExtra(Intent.EXTRA_MIME_TYPES, new String[] { "application/json", "text/plain", "application/octet-stream" });
        try {
            startActivityForResult(i, PEDIR_ARQUIVO);
        } catch (Exception semSeletor) {
            Intent g = new Intent(Intent.ACTION_GET_CONTENT);
            g.addCategory(Intent.CATEGORY_OPENABLE);
            g.setType("*/*");
            try {
                startActivityForResult(Intent.createChooser(g, "Escolha a cópia"), PEDIR_ARQUIVO);
            } catch (Exception e) {
                dizer("Este aparelho não tem seletor de arquivos.");
            }
        }
    }

    private void pintarBarras(String cor, boolean claro) {
        try {
            Window w = getWindow();
            int c = Color.parseColor(cor);
            if (web != null) web.setBackgroundColor(c);
            // antes do Android 6 os ícones da barra são sempre claros: barra clara os esconderia
            w.setStatusBarColor(claro && Build.VERSION.SDK_INT < 23 ? Color.rgb(0x48, 0x53, 0x4f) : c);
            w.setNavigationBarColor(claro && Build.VERSION.SDK_INT < 26 ? Color.BLACK : c);
            if (Build.VERSION.SDK_INT >= 23) {
                final int ICONES_ESCUROS_TOPO = 0x2000; // View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR
                final int ICONES_ESCUROS_BASE = 0x10;   // View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR (API 26)
                View d = w.getDecorView();
                int f = d.getSystemUiVisibility() & ~(ICONES_ESCUROS_TOPO | ICONES_ESCUROS_BASE);
                if (claro) f |= ICONES_ESCUROS_TOPO | (Build.VERSION.SDK_INT >= 26 ? ICONES_ESCUROS_BASE : 0);
                d.setSystemUiVisibility(f);
            }
        } catch (Exception e) {
            // cor inválida: fica como estava
        }
    }

    /* ── a ponte que a página enxerga como window.Android ────────────── */

    private class Ponte {
        @JavascriptInterface
        public String ler(String chave) {
            File f = arquivoDe(chave);
            if (f == null || !f.isFile()) return "";
            FileInputStream in = null;
            try {
                in = new FileInputStream(f);
                return new String(lerTudo(in, Integer.MAX_VALUE), "UTF-8");
            } catch (Exception e) {
                return "";
            } finally {
                fechar(in);
            }
        }

        @JavascriptInterface
        public boolean guardar(String chave, String valor) {
            File f = arquivoDe(chave);
            if (f == null || valor == null) return false;
            File tmp = new File(pasta, chave + ".tmp");
            FileOutputStream out = null;
            try {
                pasta.mkdirs();
                out = new FileOutputStream(tmp);
                out.write(valor.getBytes("UTF-8"));
                out.getFD().sync();
                out.close();
                out = null;
                return tmp.renameTo(f); // troca inteira: ou vale o arquivo novo, ou continua o antigo
            } catch (Exception e) {
                return false;
            } finally {
                fechar(out);
            }
        }

        @JavascriptInterface
        public String pendentes() {
            JSONArray lista = new JSONArray();
            synchronized (pendentes) {
                for (String[] p : pendentes) {
                    try {
                        JSONObject o = new JSONObject();
                        o.put("nome", p[0]);
                        o.put("texto", p[1]);
                        lista.put(o);
                    } catch (Exception e) {
                        // um arquivo ruim não derruba os outros
                    }
                }
                pendentes.clear();
            }
            return lista.toString();
        }

        @JavascriptInterface
        public void escolher() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    abrirSeletor();
                }
            });
        }

        @JavascriptInterface
        public void compartilhar(final String titulo, final String texto) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    if (texto == null) return;
                    if (texto.length() > LIMITE_ENVIO) {
                        dizer("Texto grande demais para compartilhar. Use \"Salvar TXT\".");
                        return;
                    }
                    Intent i = new Intent(Intent.ACTION_SEND);
                    i.setType("text/plain");
                    i.putExtra(Intent.EXTRA_SUBJECT, titulo == null ? "Exame físico" : titulo);
                    i.putExtra(Intent.EXTRA_TEXT, texto);
                    try {
                        startActivity(Intent.createChooser(i, "Enviar o exame"));
                    } catch (Exception e) {
                        dizer("Nenhum app para receber o texto.");
                    }
                }
            });
        }

        @JavascriptInterface
        public void copiar(final String texto) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    try {
                        ClipboardManager cm = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
                        cm.setPrimaryClip(ClipData.newPlainText("Exame físico", texto));
                        if (Build.VERSION.SDK_INT < 33) dizer("Texto copiado."); // do Android 13 em diante o sistema já avisa
                    } catch (Exception e) {
                        dizer("Não deu para copiar. Use \"Salvar TXT\".");
                    }
                }
            });
        }

        @JavascriptInterface
        public void salvarComo(final String nome, final String texto, final String tipo) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    if (texto == null) return;
                    paraSalvar = texto;
                    Intent i = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                    i.addCategory(Intent.CATEGORY_OPENABLE);
                    i.setType(tipo == null || tipo.length() == 0 ? "text/plain" : tipo);
                    i.putExtra(Intent.EXTRA_TITLE, nome == null ? "exame.txt" : nome);
                    try {
                        startActivityForResult(i, PEDIR_DESTINO);
                    } catch (Exception e) {
                        paraSalvar = null;
                        dizer("Este aparelho não tem seletor de arquivos.");
                    }
                }
            });
        }

        @JavascriptInterface
        public void barras(final String cor, final boolean claro) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    pintarBarras(cor, claro);
                }
            });
        }

        @JavascriptInterface
        public boolean escuro() {
            int modo = getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK;
            return modo == Configuration.UI_MODE_NIGHT_YES;
        }

        /** Abre câmera (true) ou galeria (false); a foto chega por window.__fotoPronta(). */
        @JavascriptInterface
        public void escolherFoto(final boolean camera) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    if (camera) abrirCamera();
                    else abrirGaleria();
                }
            });
        }

        @JavascriptInterface
        public String fotosProntas() {
            JSONArray l = new JSONArray();
            synchronized (fotosProntas) {
                for (String n : fotosProntas) l.put(n);
                fotosProntas.clear();
            }
            return l.toString();
        }

        /** A foto como data URL, para a página mostrar sem acesso a arquivos. */
        @JavascriptInterface
        public String foto(String nome, boolean mini) {
            File f = arquivoFoto(nome, mini);
            if (f == null) return "";
            if (mini && !f.isFile()) f = arquivoFoto(nome, false);
            try {
                return "data:image/jpeg;base64," + Base64.encodeToString(lerArquivo(f), Base64.NO_WRAP);
            } catch (Exception e) {
                return "";
            }
        }

        @JavascriptInterface
        public void apagarFoto(String nome) {
            File f = arquivoFoto(nome, false), m = arquivoFoto(nome, true);
            if (f != null) f.delete();
            if (m != null) m.delete();
        }

        @JavascriptInterface
        public String listarFotos() {
            JSONArray l = new JSONArray();
            String[] nomes = pastaFotos.list();
            if (nomes != null) for (String n : nomes) if (n.endsWith(".jpg") && !n.endsWith("_m.jpg")) l.put(n.substring(0, n.length() - 4));
            return l.toString();
        }

        /** Para a cópia de segurança: a foto inteira em base64. */
        @JavascriptInterface
        public String fotoBase64(String nome) {
            File f = arquivoFoto(nome, false);
            try {
                return f == null ? "" : Base64.encodeToString(lerArquivo(f), Base64.NO_WRAP);
            } catch (Exception e) {
                return "";
            }
        }

        /** Na restauração: grava a foto e refaz a miniatura. */
        @JavascriptInterface
        public boolean gravarFoto(String nome, String base64) {
            File f = arquivoFoto(nome, false);
            if (f == null || base64 == null) return false;
            Bitmap b = null, mini = null;
            try {
                byte[] dados = Base64.decode(base64, Base64.DEFAULT);
                FileOutputStream out = new FileOutputStream(f);
                try {
                    out.write(dados);
                } finally {
                    fechar(out);
                }
                b = BitmapFactory.decodeByteArray(dados, 0, dados.length);
                if (b == null) return false;
                mini = escalar(b, LADO_MINI, 0);
                gravarJpeg(mini, arquivoFoto(nome, true), 78);
                return true;
            } catch (Throwable e) {
                return false;
            } finally {
                if (mini != null && mini != b) mini.recycle();
                if (b != null) b.recycle();
            }
        }

        /** Abre um endereço https no navegador do aparelho (busca de imagens, fonte de uma foto). */
        @JavascriptInterface
        public void abrir(final String url) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    if (url == null || !url.startsWith("https://")) return;
                    try {
                        startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
                    } catch (Exception e) {
                        dizer("Nenhum navegador encontrado.");
                    }
                }
            });
        }

        @JavascriptInterface
        public String versao() {
            try {
                return getPackageManager().getPackageInfo(getPackageName(), 0).versionName;
            } catch (Exception e) {
                return "";
            }
        }
    }
}
