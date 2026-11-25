/* Desenha o ícone do app: uma agulha curva com o fio dando uma laçada, sobre o verde-cirúrgico.
   uso: node icone.js   (precisa do Playwright; os PNG gerados já estão em res/)
        node icone.js previa.png   (também grava uma prévia recortada em círculo) */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const RAIZ = __dirname;
const VERDE = '#135e55';

/* desenho em 108 unidades, a área segura do ícone adaptável (os 66 centrais) */
const DESENHO = `
  <path d="M30.5 65.0 C 27 80, 44 86, 52 77 C 59 69, 66 80, 79 81" fill="none" stroke="#9fe3d2" stroke-width="3.4" stroke-linecap="round"/>
  <path d="M30.5 62.0 A 23 23 0 0 1 76.5 62.0" fill="none" stroke="#fff" stroke-width="5.2" stroke-linecap="round"/>
  <path d="M76.5 62.0 A 23 23 0 0 1 76.22 65.6" fill="none" stroke="#fff" stroke-width="3.8" stroke-linecap="round"/>
  <path d="M76.22 65.6 A 23 23 0 0 1 75.25 69.49" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round"/>
  <circle cx="30.5" cy="62.0" r="3.6" fill="${VERDE}" stroke="#fff" stroke-width="2.4"/>`;

/* lado em px, escala do desenho (1 = 108 unidades ocupam o lado), fundo, raio do canto */
function pagina(lado, escala, fundo, raio) {
  const s = lado * escala, d = (lado - s) / 2;
  return `<!doctype html><style>html,body{margin:0;background:transparent}
.q{width:${lado}px;height:${lado}px;background:${fundo};border-radius:${raio}px;position:relative}
svg{position:absolute;left:${d}px;top:${d}px}</style>
<div class="q"><svg width="${s}" height="${s}" viewBox="0 0 108 108">${DESENHO}</svg></div>`;
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
  /* ícone adaptável (Android 8+): 108 dp a 3x */
  await tirar(path.join(RAIZ, 'res/mipmap-xxhdpi/ic_frente.png'), 324, 1, 'transparent', 0);
  /* ícone antigo, um por densidade: o desenho um pouco maior, num quadrado arredondado */
  for (const [pasta, lado] of [['mdpi', 48], ['hdpi', 72], ['xhdpi', 96], ['xxhdpi', 144], ['xxxhdpi', 192]])
    await tirar(path.join(RAIZ, `res/mipmap-${pasta}/ic_launcher.png`), lado, 1.3, VERDE, Math.round(lado * 0.22));
  if (process.argv[2]) await tirar(path.resolve(process.argv[2]), 324, 1, VERDE, 162);
  await b.close();
  console.log('ícones gerados');
})();
