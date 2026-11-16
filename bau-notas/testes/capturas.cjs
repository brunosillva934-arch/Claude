// Capturas de tela em alta resolução das telas principais da etapa 1.
// uso: node testes/capturas.cjs [pasta]
const { chromium } = require('playwright');
const { URL } = require('./comum.cjs');

const saida = process.argv[2] || 'testes/telas';

async function abrir(largura, altura, tema = 'light') {
  const navegador = await chromium.launch();
  const contexto = await navegador.newContext({
    viewport: { width: largura, height: altura },
    deviceScaleFactor: 2,
    hasTouch: true,
    colorScheme: tema,
  });
  const pagina = await contexto.newPage();
  await pagina.goto(URL);
  await pagina.waitForSelector('.no');
  await pagina.waitForTimeout(600);
  return { navegador, pagina };
}
const alvo = (pagina, titulo) =>
  pagina.locator(`.rotulo-longe[data-rotulo="${titulo}"], .arvore:not([data-longe]) .no[data-titulo="${titulo}"]`).first();

(async () => {
  // 1. Abertura em paisagem: a árvore inteira.
  let { navegador, pagina } = await abrir(1280, 800);
  await pagina.screenshot({ path: `${saida}/1-abertura.png` });

  // 2. Nó selecionado: caminho destacado, botões e nota ao lado.
  await alvo(pagina, 'Tromboembolismo pulmonar').tap();
  await pagina.waitForTimeout(600);
  await pagina.screenshot({ path: `${saida}/2-no-selecionado-e-nota.png` });

  // 3. De perto: cartões com ícone, cor do tipo e rótulo do ramo sobre a linha.
  await pagina.locator('[data-acao="painel"]').tap();
  await pagina.waitForTimeout(400);
  for (let i = 0; i < 4; i++) await pagina.locator('[data-acao="zoom-mais"]').tap();
  await pagina.waitForTimeout(700);
  await pagina.screenshot({ path: `${saida}/3-de-perto.png` });

  // 4. Menu do toque longo.
  await pagina.locator('.acao-no[data-acao="mais"]').tap();
  await pagina.waitForTimeout(300);
  await pagina.screenshot({ path: `${saida}/4-menu-do-no.png` });
  await navegador.close();

  // 5. Retrato.
  ({ navegador, pagina } = await abrir(800, 1280));
  await alvo(pagina, 'Dissecção de aorta').tap();
  await pagina.waitForTimeout(500);
  await pagina.screenshot({ path: `${saida}/5-retrato.png` });
  await navegador.close();

  // 6. Tema escuro, lista recuada com a nota ao lado.
  ({ navegador, pagina } = await abrir(1280, 800, 'dark'));
  await alvo(pagina, 'IAM com supra de ST').tap();
  await pagina.waitForTimeout(500);
  await pagina.screenshot({ path: `${saida}/6-tema-escuro.png` });
  await navegador.close();
})();
