// Apoio aos testes: abre o app no Chromium com as dimensões de um tablet.
// O Playwright já vem instalado no ambiente (não é dependência do projeto).
const { chromium } = require('playwright');

const URL = process.env.BAU_URL || 'http://127.0.0.1:4173/?memoria=1';

async function abrir({ largura = 1280, altura = 800, toque = true, tema = 'light', url = URL } = {}) {
  const navegador = await chromium.launch();
  const contexto = await navegador.newContext({
    viewport: { width: largura, height: altura },
    deviceScaleFactor: 1,
    hasTouch: toque,
    colorScheme: tema,
  });
  const pagina = await contexto.newPage();
  const erros = [];
  pagina.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') erros.push(`[${m.type()}] ${m.text()}`);
  });
  pagina.on('pageerror', (e) => erros.push(`[pageerror] ${e.message}`));
  await pagina.goto(url);
  await pagina.waitForSelector('.no, .linha, .vazio', { timeout: 15000 });
  await pagina.waitForTimeout(500);
  return { navegador, contexto, pagina, erros };
}

/** Nó da árvore pelo título. */
function no(pagina, titulo) {
  return pagina.locator(`.no[data-titulo="${titulo}"]`).first();
}

/** Zoom e deslocamento atuais do canvas. */
async function enquadramento(pagina) {
  return pagina.evaluate(() => {
    const t = document.querySelector('.react-flow__viewport').style.transform;
    const m = /translate\(([-\d.]+)px,\s*([-\d.]+)px\)\s*scale\(([-\d.]+)\)/.exec(t);
    return m ? { x: +m[1], y: +m[2], zoom: +m[3] } : null;
  });
}

module.exports = { abrir, no, enquadramento, URL };
