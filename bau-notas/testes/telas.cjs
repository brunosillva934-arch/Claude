// Várias árvores na mesma tela e nó novo entre dois que já existem.
// uso: npm run build && npm run previa &  ;  node testes/telas.cjs [pasta-das-capturas]
const { abrir } = require('./comum.cjs');

const saida = process.argv[2] || 'testes/telas';
let falhas = 0;
function confere(nome, ok, detalhe = '') {
  console.log(`${ok ? '  ok  ' : 'FALHA '} ${nome}${detalhe ? '  — ' + detalhe : ''}`);
  if (!ok) falhas++;
}

let pagina;
const alvo = (titulo) =>
  pagina.locator(`.rotulo-longe[data-rotulo="${titulo}"], .arvore:not([data-longe]) .no[data-titulo="${titulo}"]`).first();
const verTudo = async () => {
  await pagina.locator('[data-acao="ver-tudo"]').tap();
  await pagina.waitForTimeout(450);
};
/** Solta a seleção (os botões do nó selecionado cobrem vizinhos) e toca no nó. */
const toca = async (t) => {
  const caixa = await pagina.locator('.arvore').boundingBox();
  await pagina.touchscreen.tap(caixa.x + 30, caixa.y + 30);
  await pagina.waitForTimeout(420);
  await alvo(t).tap();
};
const filhos = (t) => pagina.evaluate((x) => window.__bauTeste.filhosDe(x), t);
const raizes = () => pagina.evaluate(() => window.__bauTeste.raizes());
const menu = async (item) => {
  await pagina.locator('.acao-no[data-acao="mais"]').tap();
  await pagina.waitForTimeout(250);
  await pagina.locator(`.menu-item[data-item="${item}"]`).tap();
  await pagina.waitForTimeout(350);
};

(async () => {
  const aberto = await abrir({ largura: 1280, altura: 800 });
  const { navegador, erros } = aberto;
  pagina = aberto.pagina;

  console.log('\n1. Várias árvores na mesma tela');
  const antes = await pagina.evaluate(() => window.__bauTeste.nosDaArvoreAtual());
  await pagina.locator('[data-acao="nova-arvore-na-tela"]').tap();
  await pagina.waitForTimeout(400);
  confere('"+ Árvore" cria uma raiz nova com o título em edição', await pagina.locator('.no-entrada').isVisible());
  await pagina.keyboard.type('Dispneia');
  await pagina.keyboard.press('Enter');
  await pagina.waitForTimeout(300);
  confere('duas árvores na tela', (await raizes()).join(',') === 'Dor torácica,Dispneia', (await raizes()).join(','));
  await pagina.locator('.acao-no[data-acao="filho"]').tap();
  await pagina.waitForTimeout(300);
  await pagina.keyboard.type('Asma');
  await pagina.keyboard.press('Enter');
  await pagina.waitForTimeout(300);
  confere('a árvore nova ganha filhos', (await filhos('Dispneia')).join(',') === 'Asma');
  confere('a contagem da tela inclui as duas', (await pagina.evaluate(() => window.__bauTeste.nosDaArvoreAtual())) === antes + 2);
  await verTudo();
  const visiveis = await pagina.evaluate(() => {
    const a = document.querySelector('.arvore').getBoundingClientRect();
    return ['Dor torácica', 'Dispneia', 'Asma', 'Descompressão torácica'].every((t) => {
      const el = document.querySelector(`.rotulo-longe[data-rotulo="${t}"]`) || document.querySelector(`.no[data-titulo="${t}"]`);
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return r.top >= a.top && r.bottom <= a.bottom;
    });
  });
  confere('"Ver tudo" mostra as duas árvores, uma embaixo da outra', visiveis);
  const yDor = await pagina.evaluate(() => window.__bauTeste.posicao('Dor torácica').y);
  const yDisp = await pagina.evaluate(() => window.__bauTeste.posicao('Dispneia').y);
  confere('a árvore nova fica abaixo da primeira', yDisp > yDor);
  await pagina.screenshot({ path: `${saida}/60-duas-arvores.png` });

  console.log('\n2. Nó entre dois que já existem');
  await toca('Eletrocardiograma');
  await pagina.waitForTimeout(400);
  confere('botão "+ Entre" ao lado do nó', await pagina.locator('.acao-no[data-acao="entre"]').isVisible());
  await pagina.locator('.acao-no[data-acao="entre"]').tap();
  await pagina.waitForTimeout(400);
  await pagina.keyboard.type('Primeiros minutos');
  await pagina.screenshot({ path: `${saida}/61-inserir-entre.png` });
  await pagina.keyboard.press('Enter');
  await pagina.waitForTimeout(400);
  const doIam = await filhos('IAM com supra de ST');
  confere('o novo nó ocupa o lugar no ramo', doIam[0] === 'Primeiros minutos', doIam.join(','));
  confere('e o nó de antes passa a ser filho dele', (await filhos('Primeiros minutos')).join(',') === 'Eletrocardiograma');
  confere('o rótulo do ramo acompanha o nó novo',
    (await pagina.evaluate(() => [window.__bauTeste.rotulo('Primeiros minutos'), window.__bauTeste.rotulo('Eletrocardiograma')])).join('|') === 'em 10 min|');
  await verTudo();
  await pagina.screenshot({ path: `${saida}/62-depois-de-inserir.png` });

  // Cancelar (título vazio) devolve tudo ao lugar.
  await toca('Troponina');
  await pagina.waitForTimeout(350);
  await pagina.locator('.acao-no[data-acao="entre"]').tap();
  await pagina.waitForTimeout(350);
  await pagina.keyboard.press('Escape');
  await pagina.waitForTimeout(350);
  confere('cancelar devolve o nó ao lugar', (await filhos('IAM com supra de ST')).join(',') === doIam.join(','), (await filhos('IAM com supra de ST')).join(','));

  // Na raiz: o nó novo vira a raiz.
  await verTudo();
  await toca('Dispneia');
  await pagina.waitForTimeout(350);
  await pagina.locator('.acao-no[data-acao="entre"]').tap();
  await pagina.waitForTimeout(350);
  await pagina.keyboard.type('Pneumologia');
  await pagina.keyboard.press('Enter');
  await pagina.waitForTimeout(350);
  confere('"+ Pai" numa raiz cria a raiz nova acima', (await raizes()).join(',') === 'Dor torácica,Pneumologia' && (await filhos('Pneumologia')).join(',') === 'Dispneia');

  console.log('\n3. Separar, mover e excluir árvores da tela');
  await verTudo();
  await toca('Pericardite aguda');
  await pagina.waitForTimeout(350);
  await menu('separar');
  confere('"Separar como árvore própria" põe o ramo como árvore na tela', (await raizes()).join(',') === 'Dor torácica,Pneumologia,Pericardite aguda');
  await pagina.locator('.aviso-acao', { hasText: 'Desfazer' }).tap();
  await pagina.waitForTimeout(350);
  confere('desfazer devolve ao lugar', (await filhos('Dor torácica')).includes('Pericardite aguda') && (await raizes()).length === 2);
  await verTudo();
  await toca('Pneumologia');
  await pagina.waitForTimeout(350);
  await menu('mover');
  await toca('Dor torácica');
  await pagina.waitForTimeout(400);
  confere('uma árvore da tela vai para dentro de outro nó', (await filhos('Dor torácica')).includes('Pneumologia') && (await raizes()).length === 1);
  await pagina.locator('.aviso-acao', { hasText: 'Desfazer' }).tap();
  await pagina.waitForTimeout(400);
  confere('desfazer devolve como árvore da tela', (await raizes()).join(',') === 'Dor torácica,Pneumologia', (await raizes()).join(','));
  await verTudo();
  await toca('Pneumologia');
  await pagina.waitForTimeout(350);
  await menu('excluir');
  confere('excluir uma árvore da tela pede confirmação', await pagina.locator('.dialogo').isVisible());
  await pagina.locator('.dialogo [data-acao="ok"]').tap();
  await pagina.waitForTimeout(400);
  confere('só ela sai; a principal fica', (await raizes()).join(',') === 'Dor torácica');
  await pagina.locator('.aviso-acao', { hasText: 'Desfazer' }).tap();
  await pagina.waitForTimeout(400);
  confere('desfazer traz de volta', (await raizes()).join(',') === 'Dor torácica,Pneumologia');

  confere('sem erros no console', erros.length === 0, erros.slice(0, 5).join(' || '));
  await navegador.close();
  console.log(falhas === 0 ? '\nTudo certo.' : `\n${falhas} falha(s).`);
  process.exit(falhas === 0 ? 0 : 1);
})().catch((e) => {
  console.error(e);
  process.exit(2);
});
