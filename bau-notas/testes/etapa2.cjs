// Teste de aceite da etapa 2: editor tipo Word, sumário, modo foco e
// estabilidade da escrita (10 páginas digitadas, 5.000 palavras coladas,
// teclado abrindo e fechando), em paisagem e em retrato.
// uso: npm run build && npm run previa &  ;  node testes/etapa2.cjs [pasta-das-capturas]
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
const html = () => pagina.locator('.texto-nota').innerHTML();
/** O HTML tem <tag ...>texto</tag> (os blocos podem levar a classe do bloco atual)? */
const tem = async (tag, texto) => new RegExp(`<${tag}(\\s[^>]*)?>${texto}</${tag}>`).test(await html());
const cmd = async (id) => {
  await pagina.locator(`.botao-editor[data-comando="${id}"]`).click();
  await pagina.waitForTimeout(120);
};
const item = async (id) => {
  await pagina.locator(`.menu-item[data-item="${id}"]`).click();
  await pagina.waitForTimeout(150);
};
/** Seleciona a última palavra do texto. */
const selecionarUltimaPalavra = () =>
  pagina.evaluate(() => {
    const e = window.__bauEditor;
    const fim = e.state.doc.content.size - 1;
    e.commands.focus();
    e.commands.setTextSelection({ from: fim - 6, to: fim });
  });
/** Cursor dentro da área visível do texto (com a folga de margem)? */
const cursorVisivel = () =>
  pagina.evaluate(() => {
    const e = window.__bauEditor;
    const c = e.view.coordsAtPos(e.state.selection.head);
    const a = document.querySelector('.nota-rolagem').getBoundingClientRect();
    return { ok: c.top >= a.top - 1 && c.bottom <= a.bottom + 1, cursor: Math.round(c.bottom), topo: Math.round(a.top), base: Math.round(a.bottom) };
  });
/** Começa a registrar a rolagem do texto (para detectar tremor e saltos). */
const gravarRolagem = () =>
  pagina.evaluate(() => {
    const el = document.querySelector('.nota-rolagem');
    window.__rolagens = [];
    window.__aoRolar && el.removeEventListener('scroll', window.__aoRolar);
    window.__aoRolar = () => window.__rolagens.push(el.scrollTop);
    el.addEventListener('scroll', window.__aoRolar, { passive: true });
  });
const rolagens = () => pagina.evaluate(() => window.__rolagens.slice());
/** Quantas vezes a rolagem mudou de direção (tremor = ir e voltar). */
const inversoes = (v) => {
  let n = 0;
  let dir = 0;
  for (let i = 1; i < v.length; i++) {
    const d = Math.sign(v[i] - v[i - 1]);
    if (d && dir && d !== dir) n++;
    if (d) dir = d;
  }
  return n;
};
/** Cursor no fim (ou no começo) do texto, pelo próprio editor. */
const irAoFim = () => pagina.evaluate(() => window.__bauEditor.commands.focus('end'));
const irAoComeco = () => pagina.evaluate(() => window.__bauEditor.commands.focus('start'));
const PARAGRAFO =
  'A troponina deve ser dosada na chegada e repetida conforme o protocolo da unidade, sem atrasar a reperfusão quando o eletrocardiograma já indica supra de ST. ';

async function abrirNotaEmTelaCheia(titulo) {
  await alvo(titulo).tap();
  await pagina.waitForTimeout(500);
  if (await pagina.locator('[data-acao="tela-cheia"]').count()) {
    await pagina.locator('[data-acao="tela-cheia"]').click();
  } else {
    await pagina.locator('.acao-no[data-acao="abrir"]').tap();
  }
  await pagina.waitForTimeout(500);
}

async function testeDeEstabilidade(rotulo, largura, altura) {
  console.log(`\n${rotulo}: estabilidade da escrita (${largura}×${altura})`);
  const aberto = await abrir({ largura, altura });
  pagina = aberto.pagina;
  await abrirNotaEmTelaCheia('Troponina');
  // "Teclado aberto": a janela encolhe ~40%, como faz o adjustResize no Android.
  const alturaComTeclado = Math.round(altura * 0.6);
  await pagina.locator('.texto-nota').click();
  await irAoFim();
  await pagina.setViewportSize({ width: largura, height: alturaComTeclado });
  await pagina.waitForTimeout(400);
  confere('com o teclado aberto, o cursor continua visível', (await cursorVisivel()).ok, JSON.stringify(await cursorVisivel()));

  // 10 páginas digitadas sem parar (~3.300 palavras): 120 parágrafos, tecla a tecla nos primeiros.
  await gravarRolagem();
  let invisivel = 0;
  const t0 = Date.now();
  for (let i = 0; i < 120; i++) {
    await pagina.keyboard.press('Enter');
    if (i < 6) await pagina.keyboard.type(PARAGRAFO, { delay: 0 });
    else await pagina.keyboard.insertText(PARAGRAFO);
    if (!(await cursorVisivel()).ok) invisivel++;
  }
  const dt = Date.now() - t0;
  const v = await rolagens();
  const palavras = await pagina.evaluate(() => window.__bauEditor.state.doc.textContent.split(/\s+/).length);
  confere('10 páginas digitadas', palavras > 3000, `${palavras} palavras em ${(dt / 1000).toFixed(1)} s`);
  confere('o cursor nunca sumiu', invisivel === 0, `${invisivel} vezes fora da tela`);
  confere('a rolagem só andou para baixo (sem tremer nem voltar)', inversoes(v) === 0 && v.every((x, i) => i === 0 || x >= v[i - 1]), `${v.length} rolagens, ${inversoes(v)} inversões`);
  await pagina.screenshot({ path: `${saida}/70-${rotulo}-10-paginas.png` });

  // Colar 5.000 palavras e continuar escrevendo no fim.
  const colado = Array.from({ length: 50 }, (_, i) => `Parágrafo colado ${i + 1}. ` + 'palavra '.repeat(98)).join('\n\n');
  await pagina.evaluate((texto) => {
    const dt = new DataTransfer();
    dt.setData('text/plain', texto);
    document.querySelector('.texto-nota').dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
  }, colado);
  await pagina.waitForTimeout(400);
  const total = await pagina.evaluate(() => window.__bauEditor.state.doc.textContent.split(/\s+/).length);
  confere('5.000 palavras coladas', total > palavras + 4900, `${total} palavras no total`);
  confere('depois de colar, o cursor está visível', (await cursorVisivel()).ok);
  await gravarRolagem();
  const t1 = Date.now();
  await pagina.keyboard.type(' E continuo escrevendo no fim, sem o texto pular.', { delay: 0 });
  const porTecla = (Date.now() - t1) / 50;
  confere('continuar escrevendo no fim: cursor visível e sem tremer', (await cursorVisivel()).ok && inversoes(await rolagens()) === 0);
  confere('digitação rápida mesmo com o texto longo', porTecla < 40, `${porTecla.toFixed(1)} ms por tecla`);

  // Abrir e fechar o teclado no meio do texto.
  await pagina.evaluate(() => {
    const e = window.__bauEditor;
    const meio = Math.floor(e.state.doc.content.size / 2);
    e.commands.setTextSelection(meio);
    e.commands.scrollIntoView();
  });
  await pagina.setViewportSize({ width: largura, height: altura });
  await pagina.waitForTimeout(400);
  await gravarRolagem();
  await pagina.setViewportSize({ width: largura, height: alturaComTeclado });
  await pagina.waitForTimeout(400);
  const aoAbrir = await rolagens();
  confere('teclado abre no meio do texto: cursor visível', (await cursorVisivel()).ok, JSON.stringify(await cursorVisivel()));
  confere('ajuste feito de uma vez', aoAbrir.length <= 1, `${aoAbrir.length} rolagens`);
  await gravarRolagem();
  await pagina.setViewportSize({ width: largura, height: altura });
  await pagina.waitForTimeout(400);
  confere('teclado fecha: nada pula', (await rolagens()).length === 0 && (await cursorVisivel()).ok);
  await pagina.screenshot({ path: `${saida}/71-${rotulo}-teclado.png` });
  confere('sem erros no console', aberto.erros.length === 0, aberto.erros.slice(0, 3).join(' || '));
  await aberto.navegador.close();
}

(async () => {
  const aberto = await abrir({ largura: 1280, altura: 800 });
  pagina = aberto.pagina;

  console.log('\n1. Barra de ferramentas');
  await abrirNotaEmTelaCheia('IAM com supra de ST');
  const botoes = await pagina.locator('.barra-editor .botao-editor').evaluateAll((b) => b.map((x) => [x.dataset.comando, x.getBoundingClientRect().height]));
  confere('todos os recursos da barra', ['desfazer', 'refazer', 'fonte', 'tamanho', 'negrito', 'italico', 'sublinhado', 'tachado', 'cor', 'marca-texto', 'h1', 'h2', 'h3', 'h4', 'marcadores', 'numerada', 'tarefas', 'recuar', 'desrecuar', 'alinhamento', 'citacao', 'tabela', 'linha', 'imagem', 'sobrescrito', 'subscrito', 'limpar', 'foco'].every((id) => botoes.some((b) => b[0] === id)), botoes.length + ' botões');
  confere('botões de pelo menos 48 px', botoes.every((b) => b[1] >= 48));
  const alturaBarra = (await pagina.locator('.nota-barra').boundingBox()).height;

  console.log('\n2. Formatação');
  await pagina.locator('.texto-nota').click();
  await irAoFim();
  await pagina.keyboard.press('Enter');
  await pagina.keyboard.type('Dose de ataque');
  await selecionarUltimaPalavra();
  await cmd('negrito');
  confere('negrito', await tem('strong', 'ataque'));
  await pagina.keyboard.press('Control+i');
  confere('itálico pelo atalho Ctrl+I', /<em>(<strong>)?ataque/.test(await html()));
  await cmd('fonte');
  await item('fonte-serifa');
  confere('fonte com serifa', (await html()).includes('Source Serif 4'));
  await cmd('tamanho');
  await item('tamanho-22px');
  confere('tamanho 22', (await html()).includes('font-size: 22px'));
  await cmd('cor');
  await item('cor-Vermelho');
  confere('cor do texto', /color: (rgb\(214, 69, 69\)|#D64545)/i.test(await html()));
  await cmd('marca-texto');
  await item('marca-Amarelo');
  confere('marca-texto', (await html()).includes('<mark'));
  await cmd('limpar');
  confere('limpar formatação', !(await html()).includes('ataque</strong>') && !(await html()).includes('<mark'));
  await cmd('desfazer');
  confere('desfazer', (await html()).includes('<mark'));
  await cmd('refazer');
  confere('refazer', !(await html()).includes('<mark'));
  await cmd('h4');
  confere('título 4', await tem('h4', 'Dose de ataque'));
  await pagina.keyboard.press('Control+Alt+2');
  confere('título 2 pelo atalho Ctrl+Alt+2', await tem('h2', 'Dose de ataque'));
  await irAoFim();
  await pagina.keyboard.type('Nível 1');
  await cmd('recuar');
  confere('recuo do parágrafo', (await html()).includes('data-recuo="1"'));
  await cmd('alinhamento');
  await item('alinhar-center');
  confere('alinhamento centralizado', (await html()).includes('text-align: center'));
  await pagina.keyboard.press('Enter');
  await cmd('tarefas');
  await pagina.keyboard.type('Pedir troponina');
  confere('lista de verificação', (await html()).includes('data-type="taskList"'));
  await pagina.keyboard.press('Enter');
  await pagina.keyboard.press('Enter');
  await pagina.keyboard.type('H');
  await cmd('subscrito');
  await pagina.keyboard.type('2');
  await cmd('subscrito');
  await pagina.keyboard.type('O e m');
  await cmd('sobrescrito');
  await pagina.keyboard.type('2');
  confere('subscrito e sobrescrito', (await html()).includes('<sub>2</sub>') && (await html()).includes('<sup>2</sup>'));
  await pagina.keyboard.press('Enter');
  await cmd('tabela');
  confere('tabela 3×3 com cabeçalho', (await pagina.locator('.texto-nota table th').count()) === 3 && (await pagina.locator('.texto-nota table tr').count()) === 3);
  await cmd('tabela');
  await item('linha-abaixo');
  confere('tabela: linha nova', (await pagina.locator('.texto-nota table tr').count()) === 4);
  await irAoFim();
  await cmd('linha');
  confere('linha horizontal', (await pagina.locator('.texto-nota hr').count()) >= 1);
  await cmd('citacao');
  await pagina.keyboard.type('Tempo é músculo.');
  confere('citação', /<blockquote[\s>]/.test(await html()) && (await html()).includes('Tempo é músculo.'));

  // Imagem (no navegador, pelo seletor de arquivos; no tablet, pela galeria ou câmera).
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
  const imagensAntes = await pagina.locator('.texto-nota img').count();
  const escolha = pagina.waitForEvent('filechooser');
  await cmd('imagem');
  await item('imagem-galeria');
  await (await escolha).setFiles({ name: 'exame.png', mimeType: 'image/png', buffer: png });
  await pagina.waitForTimeout(600);
  confere('imagem inserida (reduzida e guardada na nota)', (await pagina.locator('.texto-nota img').count()) === imagensAntes + 1);
  confere('a barra não mudou de altura', (await pagina.locator('.nota-barra').boundingBox()).height === alturaBarra);

  console.log('\n3. Colar do Word e do Google Docs');
  await irAoFim();
  await pagina.keyboard.press('Enter');
  const sujo =
    '<meta charset="utf-8"><style>p{color:red}</style><!--[if gte mso 9]><xml>lixo</xml><![endif]-->' +
    '<b style="font-weight:normal;" id="docs-internal-guid-123"><p dir="ltr" style="line-height:1.38"><span style="font-size:11pt;font-family:Arial;color:#ff0000;font-weight:700;background-color:#ffff00">Colado</span>' +
    '<span style="font-size:11pt;font-family:Arial;font-style:italic"> do Docs</span></p></b>' +
    '<p class="MsoNormal" style="mso-margin-top-alt:auto"><span lang="PT-BR" style="font-family:Calibri">Texto do Word<o:p></o:p></span></p>';
  await pagina.evaluate((h) => {
    const dt = new DataTransfer();
    dt.setData('text/html', h);
    dt.setData('text/plain', 'Colado do Docs Texto do Word');
    document.querySelector('.texto-nota').dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
  }, sujo);
  await pagina.waitForTimeout(300);
  const depois = await html();
  confere('mantém negrito e itálico', depois.includes('<strong>Colado</strong>') && depois.includes('<em> do Docs</em>'));
  confere('tira fontes, cores e estilos de fora', !/Arial|Calibri|#ff0000|mso-|lixo/i.test(depois) && depois.includes('Texto do Word'));

  if (process.env.DEPURAR) console.log(await pagina.evaluate(() => [...document.querySelectorAll('.texto-nota h1, .texto-nota h2, .texto-nota h3, .texto-nota h4')].map((h) => h.outerHTML).join('\n')));
  console.log('\n4. Sumário');
  await pagina.waitForTimeout(500);
  let itens = await pagina.locator('.sumario.fixo .sumario-item').evaluateAll((e) => e.map((x) => x.dataset.sumario));
  confere('em tela cheia, sumário fixo à direita', itens.join('|') === 'Diagnóstico|Tratamento inicial|Reperfusão|Dose de ataque', itens.join('|'));
  confere('contador de palavras', /\d+ palavras/.test(await pagina.locator('.contador-palavras').textContent()));
  await pagina.locator('.texto-nota').click();
  // Um parágrafo novo no começo do texto.
  await pagina.evaluate(() => window.__bauEditor.chain().focus().insertContentAt(0, { type: 'paragraph' }).setTextSelection(1).run());
  await pagina.keyboard.type('Resumo');
  await pagina.keyboard.press('Control+Alt+1');
  await pagina.waitForTimeout(700);
  itens = await pagina.locator('.sumario.fixo .sumario-item').evaluateAll((e) => e.map((x) => x.dataset.sumario));
  confere('atualiza enquanto se escreve', itens[0] === 'Resumo', itens.join('|'));
  confere('recuo por nível', (await pagina.locator('.sumario-item.nivel-1').count()) === 1 && (await pagina.locator('.sumario-item.nivel-2').count()) === 4);
  await pagina.locator('.sumario-item[data-sumario="Reperfusão"]').click();
  await pagina.waitForTimeout(300);
  const distancia = await pagina.evaluate(() => {
    const h = [...document.querySelectorAll('.texto-nota h2')].find((x) => x.textContent === 'Reperfusão');
    return Math.round(h.getBoundingClientRect().top - document.querySelector('.nota-rolagem').getBoundingClientRect().top);
  });
  confere('tocar num item leva até o título', distancia >= 0 && distancia < 60, distancia + ' px do topo');
  confere('a seção atual fica destacada', (await pagina.locator('.sumario-item.atual').getAttribute('data-sumario')) === 'Reperfusão');
  await pagina.locator('.nota-rolagem').evaluate((el) => (el.scrollTop = 0));
  await pagina.waitForTimeout(200);
  confere('ao rolar, o destaque acompanha', (await pagina.locator('.sumario-item.atual').getAttribute('data-sumario')) === 'Resumo');
  await pagina.screenshot({ path: `${saida}/72-sumario-fixo.png` });
  await pagina.locator('[data-acao="sumario"]').click();
  await pagina.waitForTimeout(200);
  confere('o sumário fixo pode ser recolhido', (await pagina.locator('.sumario.fixo').count()) === 0);
  await pagina.locator('[data-acao="sumario"]').click();
  await pagina.locator('[data-acao="tela-cheia"]').click();
  await pagina.waitForTimeout(400);
  confere('na tela dividida não há painel fixo', (await pagina.locator('.sumario.fixo').count()) === 0);
  await pagina.locator('[data-acao="sumario"]').click();
  await pagina.waitForTimeout(300);
  confere('na tela dividida, o sumário desliza por cima', await pagina.locator('.sumario.deslizante').isVisible());
  await pagina.screenshot({ path: `${saida}/73-sumario-deslizante.png` });
  await pagina.evaluate(() => window.__bau.voltar());
  await pagina.waitForTimeout(200);
  confere('voltar fecha o sumário', (await pagina.locator('.sumario.deslizante').count()) === 0);

  console.log('\n5. Modo foco');
  await pagina.locator('.texto-nota').click();
  await cmd('foco');
  await pagina.waitForTimeout(300);
  confere('entra pelo botão da barra', (await pagina.locator('.app[data-foco]').count()) === 1);
  confere('esconde árvore, barras e sumário',
    (await pagina.locator('.barra-superior, .nota-cabecalho, .nota-barra, .sumario, .area-arvore:not([hidden])').count()) === 0);
  // Caracteres por linha num texto corrido de verdade (o texto da própria nota).
  const largura = await pagina.evaluate(() => {
    const p = document.querySelector('.texto-nota p');
    const amostra = 'Dor típica com supradesnivelamento de ST em duas derivações contíguas no eletrocardiograma, que confirma a lesão.';
    const s = document.createElement('span');
    s.style.whiteSpace = 'nowrap';
    s.textContent = amostra;
    p.appendChild(s);
    const porCaractere = s.getBoundingClientRect().width / amostra.length;
    s.remove();
    return Math.round(document.querySelector('.texto-nota').getBoundingClientRect().width / porCaractere);
  });
  confere('coluna de ~70 caracteres', largura >= 62 && largura <= 78, largura + ' caracteres');
  await pagina.locator('[data-acao="foco-esmaecer"]').click();
  await pagina.waitForTimeout(250);
  const opacidades = await pagina.evaluate(() => [...document.querySelectorAll('.texto-nota > *')].map((e) => [e.classList.contains('bloco-atual'), getComputedStyle(e).opacity]));
  confere('esmaecer os parágrafos fora de edição', opacidades.some(([a, o]) => a && o === '1') && opacidades.some(([a, o]) => !a && Number(o) < 0.5));
  await pagina.locator('[data-acao="foco-maquina"]').click();
  await pagina.locator('.texto-nota').click();
  await pagina.keyboard.type(' mais texto');
  await pagina.waitForTimeout(250);
  const meio = await pagina.evaluate(() => {
    const e = window.__bauEditor;
    const c = e.view.coordsAtPos(e.state.selection.head);
    const a = document.querySelector('.nota-rolagem').getBoundingClientRect();
    return Math.abs((c.top - a.top) / a.height - 0.45);
  });
  confere('máquina de escrever: linha atual no meio da tela', meio < 0.08, meio.toFixed(2));
  await pagina.screenshot({ path: `${saida}/74-modo-foco.png` });
  await pagina.evaluate(() => window.__bau.voltar());
  await pagina.waitForTimeout(300);
  confere('o voltar do Android sai do foco', (await pagina.locator('.app[data-foco]').count()) === 0);
  await pagina.keyboard.press('Control+Shift+F');
  await pagina.waitForTimeout(250);
  confere('Ctrl+Shift+F entra no foco', (await pagina.locator('.app[data-foco]').count()) === 1);
  await pagina.keyboard.press('Escape');
  await pagina.waitForTimeout(250);
  confere('Esc sai do foco', (await pagina.locator('.app[data-foco]').count()) === 0);
  await pagina.locator('[data-acao="foco-maquina"]').count();
  confere('sem erros no console', aberto.erros.length === 0, aberto.erros.slice(0, 3).join(' || '));
  await aberto.navegador.close();

  await testeDeEstabilidade('paisagem', 1280, 800);
  await testeDeEstabilidade('retrato', 800, 1280);

  console.log(falhas === 0 ? '\nTudo certo.' : `\n${falhas} falha(s).`);
  process.exit(falhas === 0 ? 0 : 1);
})().catch((e) => {
  console.error(e);
  process.exit(2);
});
