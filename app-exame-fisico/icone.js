/* Desenha o ícone do app: um estetoscópio em traço branco sobre o verde do app.
   uso: node icone.js         ícones do Android, em res/
        node icone.js --pwa   ícones da versão web, em pwa/icones/
   (precisa do Playwright; os PNG gerados já estão no repositório) */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const RAIZ = __dirname;
const VERDE = '#0f6b63';
/* desenho em 100 x 100, centrado: olivas, tubos em U, haste e a campânula à direita */
const DESENHO = `
<g transform="translate(-3.5 3)"><g fill="none" stroke="#fff" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round">
  <path d="M33 24v20a13 13 0 0 0 26 0V24"/>
  <path d="M46 57v7a12 12 0 0 0 24 0v-6"/>
  <circle cx="70" cy="50.5" r="7.5"/>
</g>
<g fill="#fff"><circle cx="33" cy="22" r="4"/><circle cx="59" cy="22" r="4"/><circle cx="70" cy="50.5" r="2.4"/></g></g>`;

/* lado em px, escala do desenho em relação ao lado, fundo (ou transparente), raio do canto */
function pagina(lado, escala, fundo, raio) {
  const d = Math.round(lado * escala);
  return `<!doctype html><meta charset="utf-8"><style>
html,body{margin:0;background:transparent}
.q{width:${lado}px;height:${lado}px;display:grid;place-items:center;background:${fundo};border-radius:${raio}px}
</style><div class="q"><svg width="${d}" height="${d}" viewBox="0 0 100 100">${DESENHO}</svg></div>`;
}

(async () => {
  const b = await chromium.launch();
  const tirar = async (arquivo, lado, escala, fundo, raio) => {
    const p = await (await b.newContext({ viewport: { width: lado, height: lado }, deviceScaleFactor: 1 })).newPage();
    await p.setContent(pagina(lado, escala, fundo, raio));
    fs.mkdirSync(path.dirname(arquivo), { recursive: true });
    await p.screenshot({ path: arquivo, omitBackground: true });
    await p.close();
  };
  if (process.argv[2] === '--pwa') {
    const P = n => path.join(RAIZ, 'pwa/icones', n);
    await tirar(P('icone-192.png'), 192, 1.15, VERDE, Math.round(192 * 0.22));
    await tirar(P('icone-512.png'), 512, 1.15, VERDE, Math.round(512 * 0.22));
    /* "maskable": fundo até a borda, desenho dentro do círculo central de 80% */
    await tirar(P('icone-mascara-512.png'), 512, 0.9, VERDE, 0);
    /* iPhone: quadrado cheio, o sistema arredonda os cantos */
    await tirar(P('apple-touch-icon.png'), 180, 1.1, VERDE, 0);
    await tirar(P('favicon-32.png'), 32, 1.25, VERDE, 7);
    fs.writeFileSync(P('icone.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="${VERDE}"/>` +
      `<g transform="translate(50 50) scale(1.15) translate(-50 -50)">${DESENHO}</g></svg>\n`);
    await b.close();
    console.log('ícones da versão web gerados');
    return;
  }
  /* ícone adaptável (Android 8+): 108 dp, com o desenho dentro dos 66 dp centrais */
  await tirar(path.join(RAIZ, 'res/mipmap-xxhdpi/ic_frente.png'), 324, 0.6, 'transparent', 0);
  /* ícone antigo, um por densidade */
  for (const [pasta, lado] of [['mdpi', 48], ['hdpi', 72], ['xhdpi', 96], ['xxhdpi', 144], ['xxxhdpi', 192]])
    await tirar(path.join(RAIZ, `res/mipmap-${pasta}/ic_launcher.png`), lado, 1.15, VERDE, Math.round(lado * 0.22));
  /* prévia opcional, recortada em círculo como o lançador faz: node icone.js previa.png */
  if (process.argv[2]) await tirar(path.resolve(process.argv[2]), 324, 0.78, VERDE, 162);
  await b.close();
  console.log('ícones gerados');
})();
