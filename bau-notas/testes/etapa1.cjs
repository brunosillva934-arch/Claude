// Teste de aceite da etapa 1: árvore visual (criar, ramificar, mover, recolher,
// excluir/desfazer, "Ver tudo", lista, gaveta, tela dividida e retrato).
// uso: npm run build && npm run previa &  ;  node testes/etapa1.cjs [pasta-das-capturas]
const { abrir, no, enquadramento } = require('./comum.cjs');

const saida = process.argv[2] || 'testes/telas';
let falhas = 0;
function confere(nome, ok, detalhe = '') {
  console.log(`${ok ? '  ok  ' : 'FALHA '} ${nome}${detalhe ? '  — ' + detalhe : ''}`);
  if (!ok) falhas++;
}

async function toqueLongo(pagina, x, y, { arrastarAte, espera = 600 } = {}) {
  const cdp = await pagina.context().newCDPSession(pagina);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] });
  await pagina.waitForTimeout(espera);
  if (arrastarAte) {
    const passos = 12;
    for (let i = 1; i <= passos; i++) {
      const px = x + ((arrastarAte.x - x) * i) / passos;
      const py = y + ((arrastarAte.y - y) * i) / passos;
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: px, y: py, id: 1 }] });
      await pagina.waitForTimeout(30);
    }
    await pagina.waitForTimeout(120);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await cdp.detach();
}

async function arrastarDedo(pagina, de, ate) {
  const cdp = await pagina.context().newCDPSession(pagina);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...de, id: 1 }] });
  for (let i = 1; i <= 8; i++) {
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: de.x + ((ate.x - de.x) * i) / 8, y: de.y + ((ate.y - de.y) * i) / 8, id: 1 }],
    });
    await pagina.waitForTimeout(16);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await cdp.detach();
}

async function pinca(pagina, centro, deDist, ateDist) {
  const cdp = await pagina.context().newCDPSession(pagina);
  const pontos = (d) => [
    { x: centro.x - d / 2, y: centro.y, id: 1 },
    { x: centro.x + d / 2, y: centro.y, id: 2 },
  ];
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pontos(deDist) });
  for (let i = 1; i <= 10; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pontos(deDist + ((ateDist - deDist) * i) / 10) });
    await pagina.waitForTimeout(16);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await cdp.detach();
}

let pagina;
const total = () => pagina.evaluate(() => window.__bauTeste.nosDaArvoreAtual());
const verTudo = async () => {
  await pagina.locator('[data-acao="ver-tudo"]').tap();
  await pagina.waitForTimeout(450);
};
/** Com o zoom reduzido o que se toca é o título; de perto, o cartão do nó. */
const rotuloOuNo = (titulo) =>
  pagina.locator(`.rotulo-longe[data-rotulo="${titulo}"], .arvore:not([data-longe]) .no[data-titulo="${titulo}"]`).first();

/** Toca no fundo da árvore: tira a seleção e os botões "+ Filho"/"+ Irmão" de cima dos vizinhos. */
const soltarSelecao = async () => {
  const caixa = await pagina.locator('.arvore').boundingBox();
  await pagina.touchscreen.tap(caixa.x + 30, caixa.y + 30);
  await pagina.waitForTimeout(450);
};

const centro = async (loc) => {
  const c = await loc.boundingBox();
  return { x: c.x + c.width / 2, y: c.y + c.height / 2 };
};
const paiDe = (pagina, titulo) =>
  pagina.evaluate((t) => {
    const el = [...document.querySelectorAll('.no')].find((n) => n.dataset.titulo === t);
    return el ? el.dataset.no : null;
  }, titulo);

(async () => {
  // ------------------------------------------------------------ paisagem
  const aberto = await abrir({ largura: 1280, altura: 800 });
  const { navegador, erros } = aberto;
  pagina = aberto.pagina;

  console.log('\n1. Abertura');
  confere('26 nós na árvore de exemplo', (await pagina.locator('.no').count()) === 26);
  const dentro = await pagina.evaluate(() => {
    const a = document.querySelector('.arvore').getBoundingClientRect();
    return [...document.querySelectorAll('.no')].every((n) => {
      const r = n.getBoundingClientRect();
      return r.left >= a.left && r.right <= a.right && r.top >= a.top && r.bottom <= a.bottom;
    });
  });
  confere('a árvore inteira cabe na tela ao abrir', dentro);
  const z0 = await enquadramento(pagina);
  await pagina.screenshot({ path: `${saida}/01-abertura-paisagem.png` });

  console.log('\n2. Seleção e tela dividida');
  await rotuloOuNo('IAM com supra de ST').tap();
  await pagina.waitForTimeout(400);
  confere('nó selecionado', (await pagina.locator('.no.selecionado').getAttribute('data-titulo')) === 'IAM com supra de ST');
  confere('caminho desde a raiz destacado', (await pagina.locator('.no.no-caminho').count()) === 1);
  confere('conector do caminho destacado', (await pagina.locator('.react-flow__edge-path.ramo.no-caminho').count()) === 1);
  confere('botões "+ Filho" e "+ Irmão"', (await pagina.locator('.acao-no[data-acao="filho"]').isVisible()) && (await pagina.locator('.acao-no[data-acao="irmao"]').isVisible()));
  confere('nota ao lado (tela dividida)', (await pagina.locator('.app').getAttribute('data-modo')) === 'dividido');
  confere('título da nota no painel', (await pagina.locator('.nota-titulo').inputValue()) === 'IAM com supra de ST');
  await pagina.waitForTimeout(300);
  confere('texto da nota carregado, com menções', (await pagina.locator('.texto-nota .mencao').count()) >= 5);
  await pagina.screenshot({ path: `${saida}/02-selecao-dividida.png` });

  console.log('\n3. Criar filho e irmão');
  await pagina.locator('.acao-no[data-acao="filho"]').tap();
  await pagina.waitForTimeout(350);
  confere('nó novo entra com o título em edição', await pagina.locator('.no-entrada').isVisible());
  confere('campo do título em foco', await pagina.evaluate(() => document.activeElement?.classList.contains('no-entrada')));
  await pagina.keyboard.type('Morfina');
  await pagina.screenshot({ path: `${saida}/03-novo-filho.png` });
  await pagina.keyboard.press('Enter');
  await pagina.waitForTimeout(250);
  confere('filho "Morfina" criado', (await no(pagina, 'Morfina').count()) === 1);
  confere('27 nós', (await total()) === 27);

  await pagina.locator('.acao-no[data-acao="irmao"]').tap();
  await pagina.waitForTimeout(350);
  await pagina.keyboard.type('Hepar');
  await pagina.waitForTimeout(200);
  confere('sugere nota existente ao digitar', (await pagina.locator('.sugestao').count()) >= 1);
  await pagina.screenshot({ path: `${saida}/04-sugestao-nota-existente.png` });
  await pagina.locator('.sugestao', { hasText: 'Heparina não fracionada' }).tap();
  await pagina.waitForTimeout(250);
  confere('nó ligado à nota existente', (await no(pagina, 'Heparina não fracionada').count()) === 1);
  confere('marca de nota repetida no nó', (await no(pagina, 'Heparina não fracionada').locator('.no-repetida').count()) === 1);

  // Cancelar a criação não deixa nó vazio.
  await pagina.locator('.acao-no[data-acao="filho"]').tap();
  await pagina.waitForTimeout(300);
  await pagina.keyboard.press('Escape');
  await pagina.waitForTimeout(200);
  confere('Esc descarta o nó sem título', (await total()) === 28);

  console.log('\n4. Toque longo: menu');
  await verTudo();
  let c = await centro(no(pagina, 'Clopidogrel'));
  await toqueLongo(pagina, c.x, c.y);
  await pagina.waitForTimeout(200);
  confere('toque longo abre o menu', await pagina.locator('.menu').isVisible());
  await pagina.screenshot({ path: `${saida}/05-menu-do-no.png` });
  const itens = await pagina.locator('.menu-item').allTextContents();
  confere('menu tem renomear, tipo, rótulo, recolher, mover, excluir',
    ['Renomear', 'Mudar o tipo', 'rótulo do ramo', 'Recolher', 'Mover', 'Excluir'].every((t) => itens.some((i) => i.includes(t))), itens.join(' | '));
  await pagina.locator('.menu-item[data-item="rotulo"]').tap();
  await pagina.waitForTimeout(250);
  await pagina.keyboard.type('se alergia a AAS');
  await pagina.locator('.dialogo [data-acao="ok"]').tap();
  await pagina.waitForTimeout(300);
  confere('rótulo do ramo aparece sobre a linha', (await pagina.locator('.ramo-rotulo, .ramo-longe', { hasText: 'se alergia a AAS' }).count()) >= 1);

  await verTudo();
  await soltarSelecao();
  c = await centro(no(pagina, 'Morfina'));
  await toqueLongo(pagina, c.x, c.y);
  await pagina.waitForTimeout(200);
  await pagina.locator('.menu-item[data-item="tipo"]').tap();
  await pagina.waitForTimeout(200);
  await pagina.locator('.menu-item[data-item="tipo-medicamento"]').tap();
  await pagina.waitForTimeout(250);
  confere('tipo trocado para Medicamento', (await pagina.locator('.seletor-tipo-nome').textContent()) === 'Medicamento');

  await verTudo();
  await soltarSelecao();
  c = await centro(no(pagina, 'Morfina'));
  await toqueLongo(pagina, c.x, c.y);
  await pagina.waitForTimeout(200);
  await pagina.locator('.menu-item[data-item="renomear"]').tap();
  await pagina.waitForTimeout(300);
  await pagina.keyboard.press('Control+A');
  await pagina.keyboard.type('Morfina IV');
  await pagina.keyboard.press('Enter');
  await pagina.waitForTimeout(450);
  confere('renomear pelo menu', (await no(pagina, 'Morfina IV').count()) === 1);
  confere('painel da nota acompanha o novo título', (await pagina.locator('.nota-titulo').inputValue()) === 'Morfina IV');

  console.log('\n5. Recolher e expandir');
  await verTudo();
  const visiveis = () => pagina.evaluate(() => window.__bauTeste.nosVisiveis());
  const antes = await visiveis();
  await rotuloOuNo('Tromboembolismo pulmonar').tap();
  await pagina.waitForTimeout(300);
  await pagina.locator('.acao-no[data-acao="mais"]').tap();
  await pagina.waitForTimeout(200);
  await pagina.locator('.menu-item[data-item="recolher"]').tap();
  await pagina.waitForTimeout(350);
  confere('recolher esconde os 5 filhos', (await visiveis()) === antes - 5, `${antes} -> ${await visiveis()}`);
  await verTudo();
  await pagina.screenshot({ path: `${saida}/06-ramo-recolhido.png` });
  await pagina.locator('.acao-no[data-acao="mais"]').tap();
  await pagina.waitForTimeout(200);
  await pagina.locator('.menu-item[data-item="recolher"]').tap();
  await pagina.waitForTimeout(350);
  confere('expandir mostra de novo', (await visiveis()) === antes);

  console.log('\n6. Mover (menu) e desfazer');
  await verTudo();
  c = await centro(no(pagina, 'Estudo PEITHO'));
  await toqueLongo(pagina, c.x, c.y);
  await pagina.waitForTimeout(200);
  await pagina.locator('.menu-item[data-item="mover"]').tap();
  await pagina.waitForTimeout(250);
  confere('faixa "Movendo…" visível', await pagina.locator('.faixa-mover').isVisible());
  await pagina.screenshot({ path: `${saida}/07-modo-mover.png` });
  await rotuloOuNo('Pericardite aguda').tap();
  await pagina.waitForTimeout(400);
  const filhosPeric = () => pagina.evaluate(() => window.__bauTeste.filhosDe('Pericardite aguda'));
  confere('nó movido para o novo pai', (await filhosPeric()).includes('Estudo PEITHO'), (await filhosPeric()).join(', '));
  await pagina.locator('.aviso-acao', { hasText: 'Desfazer' }).tap();
  await pagina.waitForTimeout(400);
  confere('desfazer devolve ao pai original', (await pagina.evaluate(() => window.__bauTeste.filhosDe('Tromboembolismo pulmonar'))).includes('Estudo PEITHO'));

  console.log('\n7. Arrastar depois do toque longo');
  await pagina.locator('[data-acao="ver-tudo"]').tap();
  await pagina.waitForTimeout(450);
  c = await centro(no(pagina, 'Esmolol'));
  const destino = await centro(no(pagina, 'Pneumotórax hipertensivo'));
  await toqueLongo(pagina, c.x, c.y, { arrastarAte: destino });
  await pagina.waitForTimeout(400);
  confere('arrastar troca o nó de pai', (await pagina.evaluate(() => window.__bauTeste.filhosDe('Pneumotórax hipertensivo'))).includes('Esmolol'),
    (await pagina.evaluate(() => window.__bauTeste.filhosDe('Pneumotórax hipertensivo'))).join(', '));
  confere('menu fechou ao começar a arrastar', !(await pagina.locator('.menu').isVisible()));
  await pagina.screenshot({ path: `${saida}/08-depois-de-arrastar.png` });
  await pagina.locator('.aviso-acao', { hasText: 'Desfazer' }).tap();
  await pagina.waitForTimeout(350);
  confere('desfazer o arrasto', (await pagina.evaluate(() => window.__bauTeste.filhosDe('Dissecção de aorta'))).includes('Esmolol'));

  console.log('\n8. Excluir com confirmação e desfazer');
  await verTudo();
  c = await centro(no(pagina, 'Pericardite aguda'));
  await toqueLongo(pagina, c.x, c.y);
  await pagina.waitForTimeout(200);
  await pagina.locator('.menu-item[data-item="excluir"]').tap();
  await pagina.waitForTimeout(250);
  confere('pede confirmação', await pagina.locator('.dialogo').isVisible());
  await pagina.screenshot({ path: `${saida}/09-confirmar-exclusao.png` });
  const nAntes = await pagina.evaluate(() => window.__bauTeste.totalNos());
  await pagina.locator('.dialogo [data-acao="ok"]').tap();
  await pagina.waitForTimeout(350);
  confere('ramo excluído (4 nós)', (await pagina.evaluate(() => window.__bauTeste.totalNos())) === nAntes - 4);
  await pagina.locator('.aviso-acao', { hasText: 'Desfazer' }).tap();
  await pagina.waitForTimeout(350);
  confere('desfazer restaura o ramo', (await pagina.evaluate(() => window.__bauTeste.totalNos())) === nAntes);

  console.log('\n9. Gestos no canvas');
  await pagina.locator('[data-acao="ver-tudo"]').tap();
  await pagina.waitForTimeout(450);
  const e1 = await enquadramento(pagina);
  await arrastarDedo(pagina, { x: 150, y: 400 }, { x: 250, y: 330 });
  await pagina.waitForTimeout(200);
  const e2 = await enquadramento(pagina);
  confere('um dedo arrasta o canvas', Math.abs(e2.x - e1.x - 100) < 12 && Math.abs(e2.y - e1.y + 70) < 12, JSON.stringify(e2));
  await pinca(pagina, { x: 300, y: 400 }, 80, 240);
  await pagina.waitForTimeout(200);
  const e3 = await enquadramento(pagina);
  confere('pinça dá zoom', e3.zoom > e2.zoom * 2, `${e2.zoom.toFixed(2)} -> ${e3.zoom.toFixed(2)}`);
  await pagina.screenshot({ path: `${saida}/10-zoom-aproximado.png` });
  await pagina.touchscreen.tap(60, 200);
  await pagina.waitForTimeout(120);
  await pagina.touchscreen.tap(60, 200);
  await pagina.waitForTimeout(600);
  const e4 = await enquadramento(pagina);
  confere('toque duplo no fundo enquadra tudo', Math.abs(e4.zoom - e1.zoom) < 0.02, `${e4.zoom.toFixed(3)} x ${e1.zoom.toFixed(3)}`);

  console.log('\n10. Lista recuada');
  await pagina.locator('[data-acao="visao-lista"]').tap();
  await pagina.waitForTimeout(300);
  const linhas = await pagina.locator('.linha').count();
  confere('lista mostra todos os nós', linhas === (await total()), String(linhas));
  await pagina.locator('.linha[data-titulo="Troponina"]').tap();
  await pagina.waitForTimeout(300);
  confere('seleção na lista abre a nota', (await pagina.locator('.nota-titulo').inputValue()) === 'Troponina');
  await pagina.screenshot({ path: `${saida}/11-lista.png` });
  await pagina.locator('[data-acao="visao-arvore"]').tap();
  await pagina.waitForTimeout(500);
  confere('seleção sincronizada com a árvore', (await pagina.locator('.no.selecionado').getAttribute('data-titulo')) === 'Troponina');

  console.log('\n11. Menu lateral e nota compartilhada');
  await pagina.locator('[data-acao="menu"]').tap();
  await pagina.waitForTimeout(250);
  confere('gaveta lista as árvores', (await pagina.locator('.gaveta-arvore').count()) === 2);
  await pagina.screenshot({ path: `${saida}/12-gaveta.png` });
  await pagina.locator('.gaveta-arvore[data-arvore="Anticoagulação"]').tap();
  await pagina.waitForTimeout(500);
  confere('trocou de árvore', (await pagina.locator('.barra-nome').textContent()) === 'Anticoagulação');
  await rotuloOuNo('Enoxaparina').tap();
  await pagina.waitForTimeout(400);
  confere('mesma nota em várias árvores', /em \d lugares/.test((await pagina.locator('.nota-usos').textContent()) || ''), await pagina.locator('.nota-usos').textContent());
  await pagina.screenshot({ path: `${saida}/13-segunda-arvore.png` });

  console.log('\n12. Voltar (Android) sai um nível por vez');
  await pagina.locator('[data-acao="tela-cheia"]').tap();
  await pagina.waitForTimeout(250);
  confere('nota em tela cheia', (await pagina.locator('.app').getAttribute('data-modo')) === 'nota');
  await pagina.screenshot({ path: `${saida}/14-nota-tela-cheia.png` });
  let tratado = await pagina.evaluate(() => window.__bau.voltar());
  await pagina.waitForTimeout(200);
  confere('voltar: nota -> árvore', tratado === true && (await pagina.locator('.app').getAttribute('data-modo')) === 'dividido');
  tratado = await pagina.evaluate(() => window.__bau.voltar());
  await pagina.waitForTimeout(150);
  confere('voltar na base avisa antes de sair', tratado === true && (await pagina.locator('.aviso').isVisible()));

  console.log('\n13. Árvore com 600 nós');
  await pagina.locator('[data-acao="menu"]').tap();
  await pagina.waitForTimeout(200);
  const t0 = Date.now();
  await pagina.locator('[data-acao="arvore-teste"]').tap();
  await pagina.waitForSelector('.barra-nome:has-text("Teste com 600")');
  await pagina.waitForTimeout(700);
  const t1 = Date.now() - t0;
  confere('árvore de 600 nós criada e enquadrada', (await pagina.evaluate(() => window.__bauTeste.nosDaArvoreAtual())) === 600, `${t1} ms`);
  await pagina.screenshot({ path: `${saida}/15-600-nos.png` });
  const desenhadosNoTodo = await pagina.locator('.no').count();
  for (let i = 0; i < 12; i++) await pagina.locator('[data-acao="zoom-mais"]').tap();
  await pagina.waitForTimeout(900);
  const naTela = await pagina.locator('.no').count();
  confere('com zoom, só os nós visíveis são desenhados', naTela < 120, `${naTela} de 600 (eram ${desenhadosNoTodo} no "ver tudo")`);
  const quadros = await pagina.evaluate(async () => {
    // mede o tempo por quadro durante um arrasto programado
    const tempos = [];
    let ultimo = performance.now();
    let rodando = true;
    const medir = (agora) => { tempos.push(agora - ultimo); ultimo = agora; if (rodando) requestAnimationFrame(medir); };
    requestAnimationFrame(medir);
    await new Promise((r) => setTimeout(r, 900));
    rodando = false;
    return tempos;
  });
  await pagina.screenshot({ path: `${saida}/16-600-nos-zoom.png` });

  confere('sem erros no console', erros.length === 0, erros.slice(0, 5).join(' || '));
  await navegador.close();

  // ------------------------------------------------------------ retrato
  console.log('\n14. Retrato');
  const r = await abrir({ largura: 800, altura: 1280 });
  await r.pagina.screenshot({ path: `${saida}/17-retrato.png` });
  await r.pagina
    .locator('.rotulo-longe[data-rotulo="Dissecção de aorta"], .arvore:not([data-longe]) .no[data-titulo="Dissecção de aorta"]')
    .first()
    .tap();
  await r.pagina.waitForTimeout(350);
  confere('em retrato a nota não divide a tela', (await r.pagina.locator('.app').getAttribute('data-modo')) === 'arvore');
  confere('botão "Abrir" ao lado do nó', await r.pagina.locator('.acao-no[data-acao="abrir"]').isVisible());
  await r.pagina.screenshot({ path: `${saida}/18-retrato-selecao.png` });
  await r.pagina.locator('.acao-no[data-acao="abrir"]').tap();
  await r.pagina.waitForTimeout(400);
  confere('"Abrir" mostra a nota por cima da árvore', (await r.pagina.locator('.app').getAttribute('data-modo')) === 'nota');
  await r.pagina.screenshot({ path: `${saida}/19-retrato-nota.png` });
  await r.pagina.evaluate(() => window.__bau.voltar());
  await r.pagina.waitForTimeout(250);
  confere('voltar fecha a nota e mostra a árvore', (await r.pagina.locator('.app').getAttribute('data-modo')) === 'arvore');
  confere('sem erros no console (retrato)', r.erros.length === 0, r.erros.slice(0, 5).join(' || '));
  await r.navegador.close();

  console.log(falhas === 0 ? '\nTudo certo.' : `\n${falhas} falha(s).`);
  process.exit(falhas === 0 ? 0 : 1);
})().catch((e) => {
  console.error(e);
  process.exit(2);
});
