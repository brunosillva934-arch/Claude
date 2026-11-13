/* Desenha o ícone do app: o cartão de fichário com aba, em branco sobre o verde do app.
   uso: node icone.js   (precisa do Playwright; os PNG gerados já estão em res/) */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const RAIZ = __dirname;
const VERDE = '#0c6a5c';
const CARTAO = '<path fill="#fff" d="M4 10a2.5 2.5 0 0 1 2.5-2.5h6.2l2.3 3h10.5A2.5 2.5 0 0 1 28 13v11.5a2.5 2.5 0 0 1-2.5 2.5h-19A2.5 2.5 0 0 1 4 24.5z"/>'
  + `<path fill="none" stroke="${VERDE}" stroke-width="2" stroke-linecap="round" d="M9.5 17h13M9.5 21.5h8"/>`;

/* lado em px, tamanho do desenho em relação ao lado, fundo (ou transparente), raio do canto */
function pagina(lado, escala, fundo, raio) {
  const d = Math.round(lado * escala);
  return `<!doctype html><meta charset="utf-8"><style>
html,body{margin:0;background:transparent}
.q{width:${lado}px;height:${lado}px;display:grid;place-items:center;background:${fundo};border-radius:${raio}px}
svg{width:${d}px;height:${d}px;transform:translateY(-3%)}
</style><div class="q"><svg viewBox="0 0 32 32">${CARTAO}</svg></div>`;
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
  /* ícone adaptável (Android 8+): 108 dp, com o desenho dentro dos 66 dp centrais */
  await tirar(path.join(RAIZ, 'res/mipmap-xxhdpi/ic_frente.png'), 324, 0.5, 'transparent', 0);
  /* ícone antigo, um por densidade */
  for (const [pasta, lado] of [['mdpi', 48], ['hdpi', 72], ['xhdpi', 96], ['xxhdpi', 144], ['xxxhdpi', 192]])
    await tirar(path.join(RAIZ, `res/mipmap-${pasta}/ic_launcher.png`), lado, 0.66, VERDE, Math.round(lado * 0.22));
  /* prévia opcional, recortada em círculo como o lançador faz: node icone.js previa.png */
  if (process.argv[2]) await tirar(path.resolve(process.argv[2]), 324, 0.5, VERDE, 162);
  await b.close();
  console.log('ícones gerados');
})();
