// Teste das novidades pedidas depois da etapa 1: tópicos (itens de lista com recomendação),
// busca por nome e conteúdo, ordem alfabética com índice A–Z, filtro por tipo,
// escolha de tema e a árvore inteira visível com a nota ao lado.
// uso: npm run build && npm run previa &  ;  node testes/etapa1b.cjs [pasta-das-capturas]
const { abrir } = require('./comum.cjs');

const saida = process.argv[2] || 'testes/telas';
let falhas = 0;
function confere(nome, ok, detalhe = '') {
  console.log(`${ok ? '  ok  ' : 'FALHA '} ${nome}${detalhe ? '  — ' + detalhe : ''}`);
  if (!ok) falhas++;
}

let pagina;
const rotuloOuNo = (titulo) =>
  pagina.locator(`.rotulo-longe[data-rotulo="${titulo}"], .arvore:not([data-longe]) .no[data-titulo="${titulo}"]`).first();
const resultados = () => pagina.locator('.busca-linha').evaluateAll((els) => els.map((e) => e.dataset.resultado));

(async () => {
  const aberto = await abrir({ largura: 1280, altura: 800 });
  const { navegador, erros } = aberto;
  pagina = aberto.pagina;

  console.log('\n1. Árvore inteira visível com a nota ao lado');
  await rotuloOuNo('IAM com supra de ST').tap();
  await pagina.waitForTimeout(500);
  confere('nota ao lado da árvore', (await pagina.locator('.app').getAttribute('data-modo')) === 'dividido');
  const cortados = await pagina.evaluate(() => {
    const a = document.querySelector('.arvore').getBoundingClientRect();
    const fora = [];
    for (const el of document.querySelectorAll('.rotulo-longe, .no')) {
      const r = el.getBoundingClientRect();
      if (r.width === 0) continue;
      if (el.classList.contains('no') && document.querySelector('.arvore[data-longe]')) continue;
      if (r.right > a.right + 1 || r.left < a.left - 1 || r.bottom > a.bottom + 1 || r.top < a.top - 1) {
        fora.push(el.dataset.rotulo || el.dataset.titulo);
      }
    }
    return fora;
  });
  confere('nenhum título cortado na borda', cortados.length === 0, cortados.join(', '));
  await pagina.screenshot({ path: `${saida}/30-dividida-sem-corte.png` });

  console.log('\n2. Tópicos: itens de lista com recomendação curta');
  // IAM já está selecionado. Um tópico novo, do tipo Medicamento.
  await pagina.locator('.acao-no[data-acao="filho"]').tap();
  await pagina.waitForTimeout(350);
  confere('escolha "Nota | Tópico" e do tipo ao criar',
    (await pagina.locator('.escolha[data-escolha="topico"]').isVisible()) && (await pagina.locator('.escolha-tipo[data-escolha-tipo="Medicamento"]').isVisible()));
  await pagina.locator('.escolha[data-escolha="topico"]').tap();
  await pagina.locator('.escolha-tipo[data-escolha-tipo="Medicamento"]').tap();
  await pagina.waitForTimeout(150);
  confere('campo do nome continua em foco', await pagina.evaluate(() => document.activeElement?.classList.contains('no-entrada')));
  await pagina.keyboard.type('Morfina');
  await pagina.screenshot({ path: `${saida}/31-criar-topico.png` });
  await pagina.keyboard.press('Enter');
  await pagina.waitForTimeout(400);
  const morfina = pagina.locator('.no[data-titulo="Morfina"]');
  confere('tópico criado com a cor do tipo (medicamento)',
    (await morfina.getAttribute('class')).includes('topico') &&
    (await pagina.evaluate(() => window.__bauTeste.tipoDe('Morfina'))) === 'medicamento');
  confere('painel do tópico, com campo de recomendação e sem editor de texto longo',
    (await pagina.locator('.painel-nota[data-topico] .campo.resumo').count()) === 1 && (await pagina.locator('.texto-nota').count()) === 0);
  confere('painel mostra de qual nota é tópico', ((await pagina.locator('.topico-pai').textContent()) || '').includes('IAM com supra de ST'));
  const alturaAntes = (await morfina.boundingBox()).height;
  await pagina.locator('.campo.resumo').tap();
  await pagina.keyboard.type('Só se a dor não ceder com nitrato.');
  await pagina.waitForTimeout(300);
  confere('recomendação aparece no cartão enquanto se digita',
    ((await morfina.locator('.no-resumo').textContent()) || '').includes('Só se a dor não ceder'));
  confere('o cartão cresce para mostrar a recomendação', (await morfina.boundingBox()).height > alturaAntes + 10);
  await pagina.waitForTimeout(1100);
  confere('recomendação gravada', (await pagina.locator('.estado-salvar').textContent()).includes('Salvo'));
  await pagina.screenshot({ path: `${saida}/32-painel-topico.png` });

  // "+ Irmão" de um tópico já vem como tópico do mesmo tipo: dá para listar em série.
  await pagina.locator('.no[data-titulo="Morfina"]').tap();
  await pagina.waitForTimeout(300);
  await pagina.locator('.acao-no[data-acao="irmao"]').tap();
  await pagina.waitForTimeout(350);
  confere('irmão novo já vem como tópico e medicamento',
    (await pagina.locator('.escolha[data-escolha="topico"]').getAttribute('aria-checked')) === 'true' &&
    (await pagina.locator('.escolha-tipo[data-escolha-tipo="Medicamento"]').getAttribute('aria-checked')) === 'true');
  await pagina.keyboard.type('Nitrato');
  await pagina.keyboard.press('Enter');
  await pagina.waitForTimeout(400);

  // Pelo menu: escrever a recomendação.
  await pagina.locator('.acao-no[data-acao="mais"]').tap();
  await pagina.waitForTimeout(250);
  const itens = await pagina.locator('.menu-item').evaluateAll((e) => e.map((x) => x.dataset.item));
  confere('menu do tópico: recomendação, tipo e "transformar em nota"',
    ['resumo', 'tipo', 'topico'].every((i) => itens.includes(i)), itens.join(','));
  await pagina.locator('.menu-item[data-item="resumo"]').tap();
  await pagina.waitForTimeout(250);
  await pagina.keyboard.type('Sublingual; evitar se PAS < 90 mmHg.');
  await pagina.locator('.dialogo [data-acao="ok"]').tap();
  await pagina.waitForTimeout(400);
  confere('recomendação pelo menu aparece no cartão',
    ((await pagina.locator('.no[data-titulo="Nitrato"] .no-resumo').textContent()) || '').includes('Sublingual'));

  // A nota de cima lista os tópicos dela, com as recomendações.
  await pagina.locator('[data-acao="ver-tudo"]').tap();
  await pagina.waitForTimeout(500);
  await rotuloOuNo('IAM com supra de ST').tap();
  await pagina.waitForTimeout(600);
  const listados = await pagina.locator('.itens-do-ramo .item-do-ramo').evaluateAll((e) => e.map((x) => x.dataset.item));
  confere('nota de cima mostra "2 tópicos neste ramo"', listados.join(',') === 'Morfina,Nitrato', listados.join(','));
  confere('com as recomendações', ((await pagina.locator('.itens-do-ramo').textContent()) || '').includes('Sublingual'));
  await pagina.screenshot({ path: `${saida}/33-nota-com-itens.png` });
  await pagina.locator('.item-do-ramo[data-item="Morfina"]').tap();
  await pagina.waitForTimeout(400);
  confere('tocar no item leva a ele', (await pagina.locator('.nota-titulo').inputValue()) === 'Morfina');

  // Tópico vira nota completa: a recomendação passa a ser o primeiro parágrafo.
  await pagina.locator('[data-acao="virar-nota"]').tap();
  await pagina.waitForTimeout(700);
  confere('"Transformar em nota completa" abre o editor com a recomendação',
    ((await pagina.locator('.texto-nota').textContent()) || '').includes('Só se a dor não ceder'));
  await pagina.locator('.acao-no[data-acao="mais"]').tap();
  await pagina.waitForTimeout(250);
  await pagina.locator('.menu-item[data-item="topico"]').tap();
  await pagina.waitForTimeout(400);
  confere('e volta a ser tópico, com a recomendação', (await pagina.locator('.campo.resumo').inputValue()).includes('Só se a dor'));

  // Árvore de exemplo "Anticoagulação": cada classe é nota, os medicamentos são tópicos.
  await pagina.locator('[data-acao="menu"]').tap();
  await pagina.waitForTimeout(200);
  await pagina.locator('.gaveta-arvore[data-arvore="Anticoagulação"]').tap();
  await pagina.waitForTimeout(700);
  const topicosDoExemplo = await pagina.evaluate(() => window.__bauTeste.topicosDaArvoreAtual());
  confere('exemplo com 5 medicamentos em tópicos', topicosDoExemplo.join(',') === 'Apixabana,Dabigatrana,Edoxabana,Rivaroxabana,Varfarina', topicosDoExemplo.join(','));
  await pagina.screenshot({ path: `${saida}/34-arvore-com-topicos.png` });

  console.log('\n3. Busca por nome');
  await pagina.locator('.barra-superior [data-acao="buscar"]').tap();
  await pagina.waitForTimeout(400);
  confere('lupa abre a busca com o campo em foco', await pagina.evaluate(() => document.activeElement?.closest('.busca-campo') !== null));
  await pagina.keyboard.type('tromboembolismo');
  await pagina.waitForTimeout(250);
  let r = await resultados();
  confere('acha pelo nome', r[0] === 'Tromboembolismo pulmonar', r.slice(0, 3).join(' | '));
  await pagina.locator('.busca-campo input').fill('disseccao');
  await pagina.waitForTimeout(250);
  r = await resultados();
  confere('ignora acentos ("disseccao" → "Dissecção de aorta")', r[0] === 'Dissecção de aorta', r.slice(0, 3).join(' | '));
  await pagina.locator('.busca-campo input').fill('enoxparina');
  await pagina.waitForTimeout(250);
  r = await resultados();
  confere('tolera erro de digitação ("enoxparina")', r[0] === 'Enoxaparina', r.slice(0, 3).join(' | '));
  await pagina.locator('.busca-campo input').fill('lancinante');
  await pagina.waitForTimeout(300);
  r = await resultados();
  confere('procura no conteúdo das notas', r.includes('Dissecção de aorta'), r.join(' | '));
  confere('trecho encontrado em destaque', (await pagina.locator('.busca-trecho mark').count()) >= 1);
  confere('mostra o tipo e a árvore', ((await pagina.locator('.busca-linha').first().locator('.busca-detalhe').textContent()) || '').includes('em Dor torácica'));
  await pagina.locator('.busca-campo input').fill('idarucizumabe');
  await pagina.waitForTimeout(250);
  r = await resultados();
  confere('procura na recomendação dos tópicos', r[0] === 'Dabigatrana' && (await pagina.locator('.busca-trecho mark').count()) >= 1, r.join(' | '));
  await pagina.screenshot({ path: `${saida}/35-busca-recomendacao.png` });

  console.log('\n4. Filtro por tipo');
  await pagina.locator('.busca-campo input').fill('');
  await pagina.waitForTimeout(250);
  await pagina.locator('.chip[data-tipo="Medicamento"]').tap();
  await pagina.waitForTimeout(250);
  r = await resultados();
  const tiposVistos = await pagina.locator('.busca-tipo').evaluateAll((e) => [...new Set(e.map((x) => x.textContent))]);
  confere('só medicamentos, notas e tópicos', tiposVistos.every((t) => t.startsWith('Medicamento')) && r.length === 14 && r.includes('Apixabana') && !r.includes('Heparinas'), `${r.length}: ${tiposVistos.join(',')}`);
  await pagina.locator('.chip[data-tipo="Exame"]').tap();
  await pagina.waitForTimeout(250);
  const combinados = await pagina.locator('.busca-tipo').evaluateAll((e) =>
    [...new Set(e.map((x) => x.firstChild.textContent))].sort());
  confere('combina tipos (Medicamento + Exame)', combinados.join(',') === 'Exame,Medicamento', combinados.join(','));
  await pagina.screenshot({ path: `${saida}/36-filtro-tipo.png` });
  await pagina.locator('.chip[data-tipo="Exame"]').tap();
  await pagina.locator('.chip[data-tipo="topicos"]').tap();
  await pagina.waitForTimeout(250);
  r = await resultados();
  const marcados = await pagina.locator('.busca-linha .busca-marca-topico').count();
  // 8 do exemplo (Esmolol, Ibuprofeno, Colchicina e os 5 anticoagulantes) + Morfina e Nitrato.
  confere('"Só tópicos" com Medicamento', r.length === 10 && marcados === r.length && r.includes('Esmolol') && r.includes('Nitrato'), r.join(', '));
  await pagina.locator('.chip[data-tipo="topicos"]').tap();

  console.log('\n5. Ordem alfabética e índice A–Z');
  await pagina.locator('.chip[data-tipo="todos"]').tap();
  await pagina.waitForTimeout(250);
  r = await resultados();
  const ordenado = [...r].sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
  confere('lista em ordem alfabética', JSON.stringify(r) === JSON.stringify(ordenado));
  confere('tópicos entram na lista, com a recomendação', r.includes('Apixabana') && (await pagina.locator('.busca-linha[data-resultado="Apixabana"] .busca-trecho').count()) === 1);
  confere('índice A–Z visível', await pagina.locator('.indice-az').isVisible());
  const letraE = await pagina.locator('.indice-letra[data-indice="E"]').boundingBox();
  const cdp = await pagina.context().newCDPSession(pagina);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: letraE.x + letraE.width / 2, y: letraE.y + letraE.height / 2, id: 1 }] });
  await pagina.waitForTimeout(150);
  confere('bolha com a letra ao tocar', (await pagina.locator('.indice-bolha').textContent()) === 'E');
  await pagina.screenshot({ path: `${saida}/37-indice-az.png` });
  // Desliza até a letra P.
  const letraP = await pagina.locator('.indice-letra[data-indice="P"]').boundingBox();
  for (let i = 1; i <= 8; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: letraE.x + letraE.width / 2, y: letraE.y + ((letraP.y - letraE.y) * i) / 8 + letraP.height / 2, id: 1 }] });
    await pagina.waitForTimeout(25);
  }
  await pagina.waitForTimeout(100);
  confere('deslizar o dedo troca a letra', (await pagina.locator('.indice-bolha').textContent()) === 'P');
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await cdp.detach();
  await pagina.waitForTimeout(150);
  const primeiraVisivel = await pagina.evaluate(() => {
    const lista = document.querySelector('.busca-lista').getBoundingClientRect();
    const linhas = [...document.querySelectorAll('.busca-linha')];
    const vis = linhas.find((l) => l.getBoundingClientRect().top >= lista.top + 30);
    return vis?.dataset.resultado;
  });
  confere('a lista pulou para a letra P', /^P/.test(primeiraVisivel || ''), primeiraVisivel);
  await pagina.locator('.chip[data-tipo="Doença"]').tap();
  await pagina.waitForTimeout(250);
  r = await resultados();
  confere('A–Z com filtro de tipo (só doenças)', r.length === 5 && r[0] === 'Dissecção de aorta', r.join(', '));

  console.log('\n6. Abrir pelo resultado');
  await pagina.locator('.busca-linha[data-resultado="Pericardite aguda"]').tap();
  await pagina.waitForTimeout(600);
  confere('fecha a busca', (await pagina.locator('.busca').count()) === 0);
  confere('abre a nota e seleciona o nó na árvore', (await pagina.locator('.nota-titulo').inputValue()) === 'Pericardite aguda' && (await pagina.locator('.barra-nome').textContent()) === 'Dor torácica');
  await pagina.keyboard.press('Control+k');
  await pagina.waitForTimeout(300);
  confere('Ctrl+K abre a busca', (await pagina.locator('.busca').count()) === 1);
  await pagina.evaluate(() => window.__bau.voltar());
  await pagina.waitForTimeout(200);
  confere('voltar fecha a busca', (await pagina.locator('.busca').count()) === 0);

  console.log('\n7. Tema');
  confere('começa no claro (sistema claro)', (await pagina.locator('html').getAttribute('data-tema')) === 'claro');
  await pagina.locator('[data-acao="menu"]').tap();
  await pagina.waitForTimeout(200);
  await pagina.locator('[data-tema-opcao="escuro"]').tap();
  await pagina.waitForTimeout(250);
  confere('escolher "Escuro" troca o tema na hora', (await pagina.locator('html').getAttribute('data-tema')) === 'escuro');
  await pagina.screenshot({ path: `${saida}/38-gaveta-tema.png` });
  await pagina.evaluate(() => window.__bau.voltar());
  await pagina.waitForTimeout(400);
  await pagina.screenshot({ path: `${saida}/39-tema-escuro.png` });
  await pagina.locator('[data-acao="ver-tudo"]').tap();
  await pagina.waitForTimeout(500);
  const semTitulo = await pagina.evaluate(() => {
    const titulos = new Set([...document.querySelectorAll('.rotulo-longe')].map((r) => r.dataset.rotulo));
    return [...document.querySelectorAll('.no')].map((n) => n.dataset.titulo).filter((t) => !titulos.has(t));
  });
  confere('com o zoom reduzido, todo nó tem título', semTitulo.length === 0, semTitulo.join(', '));
  await pagina.screenshot({ path: `${saida}/40-tema-escuro-tudo.png` });
  confere('sem erros no console', erros.length === 0, erros.slice(0, 5).join(' || '));
  await navegador.close();

  // A escolha sobrevive a reabrir o app (banco no IndexedDB, sem ?memoria).
  console.log('\n8. Tema guardado ao reabrir');
  const b = await abrir({ largura: 1280, altura: 800, url: 'http://127.0.0.1:4173/' });
  await b.pagina.locator('[data-acao="menu"]').tap();
  await b.pagina.waitForTimeout(200);
  await b.pagina.locator('[data-tema-opcao="escuro"]').tap();
  await b.pagina.waitForTimeout(1200);
  await b.pagina.reload();
  await b.pagina.waitForSelector('.no');
  await b.pagina.waitForTimeout(300);
  confere('reabre no escuro', (await b.pagina.locator('html').getAttribute('data-tema')) === 'escuro');
  await b.pagina.evaluate(() => {
    localStorage.clear();
    return new Promise((r) => { const p = indexedDB.deleteDatabase('bau-web'); p.onsuccess = p.onerror = p.onblocked = () => r(); });
  });
  await b.navegador.close();

  console.log(falhas === 0 ? '\nTudo certo.' : `\n${falhas} falha(s).`);
  process.exit(falhas === 0 ? 0 : 1);
})().catch((e) => {
  console.error(e);
  process.exit(2);
});
