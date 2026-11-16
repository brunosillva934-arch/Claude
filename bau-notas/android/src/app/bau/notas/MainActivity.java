package app.bau.notas;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.res.Configuration;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.MediaStore;
import android.util.Log;
import android.view.HapticFeedbackConstants;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.webkit.ConsoleMessage;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/**
 * A única tela do app: um WebView que mostra a página embutida no APK.
 *
 * Nada vem da rede. A página é servida a partir dos arquivos do próprio APK
 * (assets/www) por interceptação: o endereço https://localhost/ nunca chega a
 * virar uma conexão, e qualquer outro endereço é recusado aqui mesmo. Além
 * disso o app não tem a permissão de internet, de modo que o Android também
 * não permitiria.
 */
public final class MainActivity extends Activity {
    private static final String TAG = "Bau";
    private static final String ESQUEMA = "https";
    private static final String DOMINIO = "localhost";
    private static final String INICIO = ESQUEMA + "://" + DOMINIO + "/index.html";

    WebView web;
    Banco banco;
    Ponte ponte;
    private volatile boolean noturno;

    @Override
    protected void onCreate(Bundle estado) {
        super.onCreate(estado);
        // O teclado redimensiona a janela de uma vez só; ver AndroidManifest.xml.
        getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);
        noturno = ehNoturno(getResources().getConfiguration());

        banco = new Banco(this);
        ponte = new Ponte(this, banco);
        web = new WebView(this);
        configurar(web);
        setContentView(web, new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        web.requestFocus();
        web.loadUrl(INICIO);
    }

    private void configurar(WebView w) {
        WebSettings c = w.getSettings();
        c.setJavaScriptEnabled(true);
        c.setDomStorageEnabled(true);
        // Só os arquivos do próprio app: nada de file:// nem content://.
        c.setAllowFileAccess(false);
        c.setAllowContentAccess(false);
        c.setGeolocationEnabled(false);
        c.setSupportMultipleWindows(false);
        c.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        // O zoom é só o da árvore, feito pela página; o texto não muda de escala sozinho.
        c.setSupportZoom(false);
        c.setBuiltInZoomControls(false);
        c.setDisplayZoomControls(false);
        c.setTextZoom(100);
        // O tema escuro é o do próprio app; o WebView não deve escurecer as cores por conta própria.
        if (Build.VERSION.SDK_INT >= 33) {
            c.setAlgorithmicDarkeningAllowed(false);
        } else {
            c.setForceDark(WebSettings.FORCE_DARK_OFF);
        }

        // Sem efeito elástico na borda: é uma das causas de "tremor" ao escrever no fim da página.
        w.setOverScrollMode(View.OVER_SCROLL_NEVER);
        w.setVerticalScrollBarEnabled(false);
        w.setHorizontalScrollBarEnabled(false);
        w.setBackgroundColor(noturno ? Color.rgb(0x11, 0x14, 0x18) : Color.rgb(0xF3, 0xF5, 0xF8));
        w.setFocusable(true);
        w.setFocusableInTouchMode(true);
        w.setWebViewClient(new Cliente());
        w.setWebChromeClient(new Cromo());
        w.addJavascriptInterface(ponte, "BauNativo");
    }

    // ------------------------------------------------------------------ página embutida

    private final class Cliente extends WebViewClient {
        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest pedido) {
            Uri endereco = pedido.getUrl();
            if (!ehDoApp(endereco)) {
                Log.w(TAG, "Endereço recusado: " + endereco);
                return vazia(403, "Forbidden");
            }
            String caminho = endereco.getPath();
            if (caminho == null || caminho.isEmpty() || "/".equals(caminho)) {
                caminho = "/index.html";
            }
            // Imagens das notas, guardadas na área privada do app.
            if (caminho.startsWith("/" + Imagens.PASTA + "/")) {
                File arquivo = Imagens.arquivo(MainActivity.this, caminho.substring(Imagens.PASTA.length() + 2));
                if (arquivo == null) {
                    return vazia(404, "Not Found");
                }
                try {
                    return new WebResourceResponse("image/jpeg", null, new FileInputStream(arquivo));
                } catch (IOException e) {
                    return vazia(404, "Not Found");
                }
            }
            if (caminho.contains("..")) {
                return vazia(404, "Not Found");
            }
            try {
                InputStream dados = getAssets().open("www" + caminho);
                String tipo = tipoDe(caminho);
                return new WebResourceResponse(tipo, ehTexto(tipo) ? "UTF-8" : null, dados);
            } catch (IOException e) {
                return vazia(404, "Not Found");
            }
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest pedido) {
            // true = não navegar. O WebView nunca sai da página do app.
            return !ehDoApp(pedido.getUrl());
        }

        @Override
        public void onReceivedError(WebView view, WebResourceRequest pedido, WebResourceError erro) {
            if (pedido.isForMainFrame()) {
                mostrarFalha("Não foi possível abrir a tela do app (" + erro.getErrorCode() + ": "
                        + erro.getDescription() + ").");
            }
        }

        @Override
        public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detalhe) {
            // O Android encerrou o processo que desenha a página (falta de memória, por exemplo).
            // A tela é recriada; as notas estão no banco, nada se perde além do que não tinha sido salvo.
            Log.w(TAG, "Processo de renderização encerrado; recriando a tela.");
            descartarWeb();
            recreate();
            return true;
        }
    }

    private final class Cromo extends WebChromeClient {
        @Override
        public boolean onConsoleMessage(ConsoleMessage m) {
            Log.d(TAG, m.message() + " (" + m.sourceId() + ":" + m.lineNumber() + ")");
            return true;
        }
    }

    private static boolean ehDoApp(Uri endereco) {
        return endereco != null && ESQUEMA.equals(endereco.getScheme()) && DOMINIO.equals(endereco.getHost())
                && endereco.getPort() == -1;
    }

    private static WebResourceResponse vazia(int codigo, String motivo) {
        return new WebResourceResponse("text/plain", "UTF-8", codigo, motivo,
                new HashMap<String, String>(), new ByteArrayInputStream(new byte[0]));
    }

    private static final Map<String, String> TIPOS = new HashMap<String, String>();

    static {
        TIPOS.put("html", "text/html");
        TIPOS.put("js", "text/javascript");
        TIPOS.put("mjs", "text/javascript");
        TIPOS.put("css", "text/css");
        TIPOS.put("json", "application/json");
        TIPOS.put("svg", "image/svg+xml");
        TIPOS.put("png", "image/png");
        TIPOS.put("jpg", "image/jpeg");
        TIPOS.put("jpeg", "image/jpeg");
        TIPOS.put("webp", "image/webp");
        TIPOS.put("gif", "image/gif");
        TIPOS.put("ico", "image/x-icon");
        TIPOS.put("woff2", "font/woff2");
        TIPOS.put("woff", "font/woff");
        TIPOS.put("ttf", "font/ttf");
        TIPOS.put("wasm", "application/wasm");
        TIPOS.put("txt", "text/plain");
    }

    private static String tipoDe(String caminho) {
        int ponto = caminho.lastIndexOf('.');
        String extensao = ponto < 0 ? "" : caminho.substring(ponto + 1).toLowerCase(Locale.ROOT);
        String tipo = TIPOS.get(extensao);
        return tipo == null ? "application/octet-stream" : tipo;
    }

    private static boolean ehTexto(String tipo) {
        return tipo.startsWith("text/") || "application/json".equals(tipo) || "image/svg+xml".equals(tipo);
    }

    private void mostrarFalha(String texto) {
        if (web == null) {
            return;
        }
        String pagina = "<!doctype html><meta charset=utf-8><meta name=viewport content='width=device-width'>"
                + "<body style='font:17px sans-serif;padding:32px;line-height:1.5'><h2>O Baú não conseguiu abrir</h2><p>"
                + texto.replace("&", "&amp;").replace("<", "&lt;") + "</p><p>Suas notas não foram afetadas.</p>";
        web.loadDataWithBaseURL(null, pagina, "text/html", "UTF-8", null);
    }

    // ------------------------------------------------------------------ chamadas vindas da página

    /** Entrega à página a resposta de uma chamada assíncrona. `json` já é JSON válido. */
    void responder(final int id, final boolean ok, final String json) {
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                if (web != null) {
                    web.evaluateJavascript("window.__bau&&window.__bau.r(" + id + "," + ok + "," + json + ")", null);
                }
            }
        });
    }

    String info() throws Exception {
        PackageInfo app = getPackageManager().getPackageInfo(getPackageName(), 0);
        PackageInfo motor = WebView.getCurrentWebViewPackage();
        JSONObject o = new JSONObject();
        o.put("versaoApp", app.versionName);
        o.put("codigoVersao", app.getLongVersionCode());
        o.put("android", Build.VERSION.RELEASE);
        o.put("sdk", Build.VERSION.SDK_INT);
        o.put("webview", motor == null ? "?" : motor.versionName);
        o.put("modelo", Build.MANUFACTURER + " " + Build.MODEL);
        o.put("noturno", noturno);
        return o.toString();
    }

    /** Pinta as barras do sistema nas cores do app. */
    void pintarBarras(final String status, final String navegacao, final boolean fundoClaro) {
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                Window janela = getWindow();
                janela.setStatusBarColor(Color.parseColor(status));
                janela.setNavigationBarColor(Color.parseColor(navegacao));
                if (web != null) {
                    web.setBackgroundColor(Color.parseColor(navegacao));
                }
                if (Build.VERSION.SDK_INT >= 30) {
                    WindowInsetsController controle = janela.getInsetsController();
                    if (controle != null) {
                        int claras = WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
                                | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS;
                        controle.setSystemBarsAppearance(fundoClaro ? claras : 0, claras);
                    }
                } else {
                    View decoracao = janela.getDecorView();
                    int marcas = decoracao.getSystemUiVisibility();
                    int claras = View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                    decoracao.setSystemUiVisibility(fundoClaro ? (marcas | claras) : (marcas & ~claras));
                }
            }
        });
    }

    /** Vibração curta de confirmação (toque longo). Não exige permissão. */
    void toqueHaptico() {
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                if (web != null) {
                    web.performHapticFeedback(HapticFeedbackConstants.LONG_PRESS);
                }
            }
        });
    }

    // ------------------------------------------------------------------ imagens

    private static final int PEDIDO_IMAGEM = 41;
    private int chamadaDeImagem = -1;
    private boolean imagemDaCamera;

    /**
     * Abre a galeria ou a câmera. A câmera é chamada por intent (o app não pede
     * a permissão de câmera) e grava a foto no arquivo entregue pelo Provedor.
     */
    void escolherImagem(final int id, final boolean camera) {
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                if (chamadaDeImagem != -1) {
                    responder(chamadaDeImagem, true, "null");
                }
                chamadaDeImagem = id;
                imagemDaCamera = camera;
                Intent pedido;
                if (camera) {
                    Uri destino = Provedor.uriDaFoto();
                    pedido = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
                    pedido.putExtra(MediaStore.EXTRA_OUTPUT, destino);
                    pedido.setClipData(ClipData.newRawUri("", destino));
                    pedido.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_READ_URI_PERMISSION);
                } else {
                    pedido = new Intent(Intent.ACTION_GET_CONTENT);
                    pedido.setType("image/*");
                    pedido.addCategory(Intent.CATEGORY_OPENABLE);
                }
                try {
                    startActivityForResult(pedido, PEDIDO_IMAGEM);
                } catch (ActivityNotFoundException e) {
                    chamadaDeImagem = -1;
                    responder(id, false, JSONObject.quote(camera
                            ? "Nenhum app de câmera encontrado"
                            : "Nenhum app de galeria encontrado"));
                }
            }
        });
    }

    @Override
    protected void onActivityResult(int pedido, int resultado, Intent dados) {
        if (pedido != PEDIDO_IMAGEM) {
            super.onActivityResult(pedido, resultado, dados);
            return;
        }
        final int id = chamadaDeImagem;
        chamadaDeImagem = -1;
        if (id == -1) {
            return;
        }
        final Uri origem;
        if (resultado != RESULT_OK) {
            origem = null;
        } else if (imagemDaCamera) {
            origem = Uri.fromFile(Provedor.arquivoDaFoto(getCacheDir()));
        } else {
            origem = dados == null ? null : dados.getData();
        }
        if (origem == null) {
            responder(id, true, "null");
            return;
        }
        // Reduzir e gravar fora da linha principal.
        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    String nome = Imagens.salvar(MainActivity.this, origem);
                    responder(id, true, "{\"caminho\":" + JSONObject.quote("/" + Imagens.PASTA + "/" + nome) + "}");
                } catch (Exception e) {
                    responder(id, false, JSONObject.quote("Não foi possível guardar a imagem: " + e.getMessage()));
                } finally {
                    if (imagemDaCamera) {
                        Provedor.arquivoDaFoto(getCacheDir()).delete();
                    }
                }
            }
        }).start();
    }

    // ------------------------------------------------------------------ modo imersivo

    private volatile boolean imersivo;

    /** Modo foco: esconde as barras do sistema (voltam por um instante ao deslizar da borda). */
    void definirImersivo(final boolean ligado) {
        imersivo = ligado;
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                aplicarImersivo();
            }
        });
    }

    private void aplicarImersivo() {
        Window janela = getWindow();
        if (Build.VERSION.SDK_INT >= 30) {
            WindowInsetsController controle = janela.getInsetsController();
            if (controle == null) {
                return;
            }
            if (imersivo) {
                controle.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
                controle.hide(WindowInsets.Type.systemBars());
            } else {
                controle.show(WindowInsets.Type.systemBars());
            }
        } else {
            // Android 10: esconde só a barra de navegação. Esconder também a de status
            // (FULLSCREEN) faria o teclado deixar de redimensionar a tela.
            View decoracao = janela.getDecorView();
            int marcas = decoracao.getSystemUiVisibility();
            int imersivas = View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY;
            decoracao.setSystemUiVisibility(imersivo ? (marcas | imersivas) : (marcas & ~imersivas));
        }
    }

    @Override
    public void onWindowFocusChanged(boolean temFoco) {
        super.onWindowFocusChanged(temFoco);
        // Depois de um diálogo ou de voltar ao app, o Android pode ter mostrado as barras de novo.
        if (temFoco && imersivo) {
            aplicarImersivo();
        }
    }

    /** Manda o app para segundo plano, sem encerrá-lo. */
    void minimizar() {
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                moveTaskToBack(true);
            }
        });
    }

    // ------------------------------------------------------------------ ciclo de vida

    private static boolean ehNoturno(Configuration c) {
        return (c.uiMode & Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES;
    }

    private void avisarPagina(String chamada) {
        if (web != null) {
            web.evaluateJavascript("window.__bau&&window.__bau." + chamada, null);
        }
    }

    /**
     * O botão voltar é sempre entregue à página, que fecha um nível por vez.
     * Se a página não estiver respondendo, o app vai para segundo plano.
     */
    @Override
    public void onBackPressed() {
        if (web == null) {
            moveTaskToBack(true);
            return;
        }
        web.evaluateJavascript("(window.__bau&&window.__bau.voltar)?window.__bau.voltar():false",
                new ValueCallback<String>() {
                    @Override
                    public void onReceiveValue(String tratado) {
                        if (!"true".equals(tratado)) {
                            moveTaskToBack(true);
                        }
                    }
                });
    }

    @Override
    protected void onPause() {
        // Indo para segundo plano: a página grava tudo o que estiver pendente.
        avisarPagina("pausa()");
        super.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        avisarPagina("retomada()");
    }

    @Override
    public void onConfigurationChanged(Configuration nova) {
        super.onConfigurationChanged(nova);
        boolean agora = ehNoturno(nova);
        if (agora != noturno) {
            noturno = agora;
            avisarPagina("tema(" + agora + ")");
        }
    }

    private void descartarWeb() {
        if (web == null) {
            return;
        }
        ViewGroup pai = (ViewGroup) web.getParent();
        if (pai != null) {
            pai.removeView(web);
        }
        web.removeJavascriptInterface("BauNativo");
        web.destroy();
        web = null;
    }

    @Override
    protected void onDestroy() {
        descartarWeb();
        if (ponte != null) {
            ponte.encerrar();
        }
        if (banco != null) {
            banco.fechar();
        }
        super.onDestroy();
    }
}
