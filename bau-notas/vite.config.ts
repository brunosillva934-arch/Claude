import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Política de segurança de conteúdo aplicada só no pacote final.
 * Ela proíbe qualquer origem que não seja o próprio app: mesmo que uma
 * biblioteca tentasse buscar algo na rede, o WebView recusaria.
 */
function politicaDeConteudo(android: boolean): Plugin {
  const regras = [
    "default-src 'self'",
    "script-src 'self'" + (android ? '' : " 'wasm-unsafe-eval'"),
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
  ].join('; ');
  return {
    name: 'bau-politica-de-conteudo',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace(
        '<meta charset="utf-8" />',
        `<meta charset="utf-8" />\n    <meta http-equiv="Content-Security-Policy" content="${regras}" />`,
      );
    },
  };
}

export default defineConfig(({ mode }) => {
  const android = mode === 'android';
  return {
    base: './',
    plugins: [react(), politicaDeConteudo(android)],
    define: {
      __ANDROID__: JSON.stringify(android),
    },
    build: {
      // WebView do Android 10+ atualizado pela loja; ver public/inicio.js para o aviso de versão antiga.
      target: 'chrome100',
      outDir: android ? 'dist-android' : 'dist',
      emptyOutDir: true,
      assetsInlineLimit: 0,
      chunkSizeWarningLimit: 3000,
      modulePreload: { polyfill: false },
      sourcemap: false,
    },
    server: { host: '127.0.0.1', port: 5173, strictPort: true },
    preview: { host: '127.0.0.1', port: 4173, strictPort: true },
  };
});
