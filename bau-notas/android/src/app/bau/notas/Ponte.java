package app.bau.notas;

import android.webkit.JavascriptInterface;

import org.json.JSONObject;

import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

/**
 * Ponte entre a página e o Android. Fica visível no WebView como
 * window.BauNativo (ver src/nativo/ponte.ts).
 *
 * Tudo o que mexe no banco passa por uma única linha de execução, na ordem de
 * chegada: assim uma gravação nunca passa na frente de outra mais antiga, e a
 * tela nunca fica esperando o disco.
 */
final class Ponte {
    private final MainActivity atividade;
    private final Banco banco;
    private final ExecutorService fila = Executors.newSingleThreadExecutor();

    Ponte(MainActivity atividade, Banco banco) {
        this.atividade = atividade;
        this.banco = banco;
    }

    /** Deixa terminar as gravações que já estavam na fila e encerra. */
    void encerrar() {
        fila.shutdown();
        try {
            fila.awaitTermination(3, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    /** Chamada assíncrona: a resposta volta por window.__bau.r(id, ok, valor). */
    @JavascriptInterface
    public void chamar(final int id, final String metodo, final String args) {
        // Escolher imagem espera o usuário (galeria ou câmera): não pode segurar a fila do banco.
        if ("imagem.escolher".equals(metodo)) {
            boolean camera = false;
            try {
                camera = new JSONObject(args).optBoolean("camera", false);
            } catch (Exception e) {
                // sem argumentos: galeria
            }
            atividade.escolherImagem(id, camera);
            return;
        }
        fila.execute(new Runnable() {
            @Override
            public void run() {
                String valor;
                boolean ok;
                try {
                    valor = executar(metodo, new JSONObject(args));
                    ok = true;
                } catch (Throwable e) {
                    valor = JSONObject.quote(mensagem(e));
                    ok = false;
                }
                atividade.responder(id, ok, valor);
            }
        });
    }

    /**
     * Chamada síncrona: só volta quando terminou. As de banco entram na mesma
     * fila das assíncronas (preservando a ordem) e esperam a sua vez.
     */
    @JavascriptInterface
    public String chamarSinc(final String metodo, final String args) {
        try {
            String valor;
            if (metodo.startsWith("sql.")) {
                Future<String> tarefa = fila.submit(new Callable<String>() {
                    @Override
                    public String call() throws Exception {
                        return executar(metodo, new JSONObject(args));
                    }
                });
                valor = tarefa.get();
            } else {
                valor = executar(metodo, new JSONObject(args));
            }
            return "{\"ok\":true,\"valor\":" + valor + "}";
        } catch (ExecutionException e) {
            return "{\"ok\":false,\"valor\":" + JSONObject.quote(mensagem(e.getCause() != null ? e.getCause() : e)) + "}";
        } catch (Throwable e) {
            return "{\"ok\":false,\"valor\":" + JSONObject.quote(mensagem(e)) + "}";
        }
    }

    /** Executa um método e devolve o resultado já em JSON. */
    private String executar(String metodo, JSONObject args) throws Exception {
        if ("sql.lote".equals(metodo)) {
            banco.lote(args.getJSONArray("instrucoes"));
            return "true";
        }
        if ("sql.consultar".equals(metodo)) {
            return banco.consultar(args.getString("sql"), args.optJSONArray("params"));
        }
        if ("sistema.info".equals(metodo)) {
            return atividade.info();
        }
        if ("sistema.barras".equals(metodo)) {
            atividade.pintarBarras(args.getString("status"), args.getString("navegacao"), args.getBoolean("fundoClaro"));
            return "true";
        }
        if ("sistema.toque".equals(metodo)) {
            atividade.toqueHaptico();
            return "true";
        }
        if ("sistema.imersivo".equals(metodo)) {
            atividade.definirImersivo(args.getBoolean("ligado"));
            return "true";
        }
        if ("sistema.minimizar".equals(metodo)) {
            atividade.minimizar();
            return "true";
        }
        throw new IllegalArgumentException("Método desconhecido: " + metodo);
    }

    private static String mensagem(Throwable e) {
        String texto = e.getMessage();
        return e.getClass().getSimpleName() + (texto == null ? "" : ": " + texto);
    }
}
