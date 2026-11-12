/* Desenha o ícone do app: um "a)" em Newsreader itálico sobre o azul do gerador.
   uso: node icone.js   (precisa do Playwright; os PNG gerados já estão em res/) */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const RAIZ = __dirname;
const fonte = fs.readFileSync(path.join(RAIZ, 'web/fontes/newsreader-latin-600-italic.woff2')).toString('base64');
const AZUL = '#2b4b9b';

/* lado em px, tamanho da letra em relação ao lado, fundo (ou transparente), raio do canto */
function pagina(lado, escala, fundo, raio) {
  return `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:N;font-style:italic;font-weight:600;src:url(data:font/woff2;base64,${fonte}) format("woff2")}
html,body{margin:0;background:transparent}
.q{width:${lado}px;height:${lado}px;display:grid;place-items:center;background:${fundo};border-radius:${raio}px}
.t{font:italic 600 ${Math.round(lado * escala)}px/1 N,serif;color:#fff;letter-spacing:-.02em;transform:translate(-1.5%,2%)}
</style><div class="q"><div class="t">a)</div></div>`;
}

(async () => {
  const b = await chromium.launch();
  const tirar = async (arquivo, lado, escala, fundo, raio) => {
    const p = await (await b.newContext({ viewport: { width: lado, height: lado }, deviceScaleFactor: 1 })).newPage();
    await p.setContent(pagina(lado, escala, fundo, raio));
    await p.evaluate(() => document.fonts.ready);
    fs.mkdirSync(path.dirname(arquivo), { recursive: true });
    await p.screenshot({ path: arquivo, omitBackground: true });
    await p.close();
  };
  /* ícone adaptável (Android 8+): 108 dp, com o desenho dentro dos 66 dp centrais */
  await tirar(path.join(RAIZ, 'res/mipmap-xxhdpi/ic_frente.png'), 324, 0.48, 'transparent', 0);
  /* ícone antigo, um por densidade */
  for (const [pasta, lado] of [['mdpi', 48], ['hdpi', 72], ['xhdpi', 96], ['xxhdpi', 144], ['xxxhdpi', 192]])
    await tirar(path.join(RAIZ, `res/mipmap-${pasta}/ic_launcher.png`), lado, 0.62, AZUL, Math.round(lado * 0.22));
  /* prévia opcional, recortada em círculo como o lançador faz: node icone.js previa.png */
  if (process.argv[2]) await tirar(path.resolve(process.argv[2]), 324, 0.48, AZUL, 162);
  await b.close();
  console.log('ícones gerados');
})();
