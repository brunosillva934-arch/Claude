package app.prescricoes.drive;

import android.app.Activity;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.content.res.Configuration;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
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

import java.io.ByteArrayOutputStream;
import java.io.Closeable;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;

/**
 * Uma tela só: um WebView com a página embutida em assets/index.html, que já traz as fichas.
 * O app não pede permissão nenhuma e não usa a rede. O que esta classe faz pela página:
 * guarda favoritas e a receita montada num arquivo privado, copia e compartilha texto
 * e pinta as barras do sistema com as cores do tema.
 */
public class MainActivity extends Activity {
    private static final int LIMITE_ENVIO = 180000;

    private WebView web;
    private boolean pronta;
    private File pasta;

    @Override
    protected void onCreate(Bundle estado) {
        super.onCreate(estado);
        pasta = new File(getFilesDir(), "dados");
        pasta.mkdirs();
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);

        web = new WebView(this);
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(false); // file:///android_asset continua aberto mesmo assim
        s.setAllowContentAccess(false);
        s.setSupportZoom(false);
        s.setTextZoom(100); // o tamanho da letra é ajustado dentro do app
        web.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView v, String url) {
                pronta = true;
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView v, String url) {
                return true; // a página não navega para lugar nenhum
            }
        });
        web.setWebChromeClient(new WebChromeClient());
        web.addJavascriptInterface(new Ponte(), "Android");
        setContentView(web);

        if (estado != null) web.restoreState(estado);
        if (web.getUrl() == null) web.loadUrl("file:///android_asset/index.html");
    }

    @Override
    protected void onSaveInstanceState(Bundle estado) {
        super.onSaveInstanceState(estado);
        if (web != null) web.saveState(estado);
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

    /* ── utilidades ──────────────────────────────────────────────────── */

    private void dizer(final String msg) {
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                Toast.makeText(MainActivity.this, msg, Toast.LENGTH_SHORT).show();
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

    private static byte[] lerTudo(InputStream in) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        byte[] buf = new byte[16384];
        int n;
        while ((n = in.read(buf)) != -1) out.write(buf, 0, n);
        return out.toByteArray();
    }

    private File arquivoDe(String chave) {
        if (chave == null || !chave.matches("[A-Za-z0-9_-]{1,80}")) return null;
        return new File(pasta, chave + ".json");
    }

    private void pintarBarras(String cor, boolean claro) {
        try {
            Window w = getWindow();
            int c = Color.parseColor(cor);
            if (web != null) web.setBackgroundColor(c);
            // antes do Android 6 os ícones da barra são sempre claros: barra clara os esconderia
            w.setStatusBarColor(claro && Build.VERSION.SDK_INT < 23 ? Color.rgb(0x1f, 0x6f, 0x86) : c);
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
                return new String(lerTudo(in), "UTF-8");
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
        public void compartilhar(final String titulo, final String texto) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    if (texto == null) return;
                    if (texto.length() > LIMITE_ENVIO) {
                        dizer("Texto grande demais para compartilhar.");
                        return;
                    }
                    Intent i = new Intent(Intent.ACTION_SEND);
                    i.setType("text/plain");
                    i.putExtra(Intent.EXTRA_SUBJECT, titulo == null ? "Receita" : titulo);
                    i.putExtra(Intent.EXTRA_TEXT, texto);
                    try {
                        startActivity(Intent.createChooser(i, "Compartilhar"));
                    } catch (Exception e) {
                        dizer("Nenhum app para compartilhar.");
                    }
                }
            });
        }

        @JavascriptInterface
        public void copiar(final String texto) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    if (texto == null) return;
                    try {
                        ClipboardManager cm = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
                        cm.setPrimaryClip(ClipData.newPlainText("Receita", texto));
                    } catch (Exception e) {
                        dizer("Não deu para copiar.");
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
