// Testa o pacote EXATO que vai dentro do APK (dist-android), com a ponte
// Android substituída por uma imitação que fala o mesmo protocolo de
// android/src/app/bau/notas/Ponte.java (SQLite de verdade, via sql.js).
//
// uso: npm run build:android && npx vite preview --outDir dist-android --port 4174 &
//      node testes/android-simulado.cjs [pasta-das-capturas]
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const saida = process.argv[2] || 'testes/telas';
const URL = process.env.BAU_URL_ANDROID || 'http://127.0.0.1:4174/';
let falhas = 0;
function confere(nome, ok, detalhe = '') {
  console.log(`${ok ? '  ok  ' : 'FALHA '} ${nome}${detalhe ? '  — ' + detalhe : ''}`);
  if (!ok) falhas++;
}

const sqlAsm = fs.readFileSync(path.join(__dirname, '../node_modules/sql.js/dist/sql-asm.js'), 'utf8');
const ponteSimulada = `
(() => {
  const mock = (window.__mock = { chamadas: [], barras: null, minimizou: 0, noturno: false });
  let db = null;
  const fila = [];
  initSqlJs().then((SQL) => { db = new SQL.Database(); mock.db = db; for (const f of fila.splice(0)) f(); });
  function executar(metodo, args) {
    mock.chamadas.push(metodo);
    switch (metodo) {
      case 'sql.lote':
        db.run('BEGIN');
        try { for (const i of args.instrucoes) db.run(i.sql, i.params || []); db.run('COMMIT'); }
        catch (e) { db.run('ROLLBACK'); throw e; }
        return true;
      case 'sql.consultar': {
        const st = db.prepare(args.sql);
        st.bind(args.params || []);
        const colunas = st.getColumnNames();
        const linhas = [];
        while (st.step()) linhas.push(st.get());
        st.free();
        return { colunas, linhas };
      }
      case 'sistema.info':
        return { versaoApp: '0.1.0', codigoVersao: 1, android: '14', sdk: 34, webview: '120.0.0.0', modelo: 'Simulado', noturno: mock.noturno };
      case 'sistema.barras': mock.barras = args; return true;
      case 'sistema.toque': return true;
      case 'sistema.minimizar': mock.minimizou++; return true;
    }
    throw new Error('Método desconhecido: ' + metodo);
  }
  window.BauNativo = {
    chamar(id, metodo, argsJson) {
      const rodar = () => {
        let ok = true, valor;
        try { valor = executar(metodo, JSON.parse(argsJson)); } catch (e) { ok = false; valor = String(e); }
        // Como no Android: a resposta chega depois, em outra volta do laço de eventos.
        setTimeout(() => window.__bau.r(id, ok, JSON.parse(JSON.stringify(valor))), 1);
      };
      if (db) rodar(); else fila.push(rodar);
    },
    chamarSinc(metodo, argsJson) {
      try { return JSON.stringify({ ok: true, valor: executar(metodo, JSON.parse(argsJson)) }); }
      catch (e) { return JSON.stringify({ ok: false, valor: String(e) }); }
    },
  };
})();`;

(async () => {
  const navegador = await chromium.launch();
  const contexto = await navegador.newContext({ viewport: { width: 1280, height: 800 }, hasTouch: true });
  const pagina = await contexto.newPage();
  const erros = [];
  const externos = [];
  pagina.on('console', (m) => {
    // O aviso do próprio sql.js (usado só nesta imitação) não conta.
    if ((m.type() === 'error' || m.type() === 'warning') && !m.text().startsWith('sql.js:')) erros.push(`[${m.type()}] ${m.text()}`);
  });
  pagina.on('pageerror', (e) => erros.push(`[pageerror] ${e.message}`));
  pagina.on('request', (r) => { if (!r.url().startsWith(URL)) externos.push(r.url()); });
  await pagina.addInitScript(sqlAsm + '\n' + ponteSimulada);

  await pagina.goto(URL);
  await pagina.waitForSelector('.no', { timeout: 15000 });
  await pagina.waitForTimeout(600);

  console.log('\nPacote do APK com ponte Android simulada');
  const consulta = (sql) => pagina.evaluate((s) => window.__mock.db.exec(s)[0]?.values ?? [], sql);
  confere('a página não pede nada fora do próprio app', externos.length === 0, externos.join(', '));
  confere('política de conteúdo presente', (await pagina.locator('meta[http-equiv="Content-Security-Policy"]').count()) === 1);
  confere('esquema criado pela ponte (versão 3)', (await consulta('PRAGMA user_version'))[0][0] === 3);
  confere('dados de exemplo gravados (35 notas, 8 delas tópicos com recomendação)',
    (await consulta("SELECT count(*), sum(topico), sum(topico = 1 AND resumo <> '') FROM notas"))[0].join(',') === '35,8,8',
    (await consulta("SELECT count(*), sum(topico), sum(topico = 1 AND resumo <> '') FROM notas"))[0].join(','));
  confere('árvore de exemplo na tela', (await pagina.locator('.no').count()) === 26);
  confere('barras do sistema pintadas', await pagina.evaluate(() => window.__mock.barras && window.__mock.barras.fundoClaro === true));

  await pagina.locator('.rotulo-longe[data-rotulo="Troponina"]').tap();
  await pagina.waitForTimeout(500);
  confere('nota lida do banco pela ponte', (await pagina.locator('.texto-nota').textContent()).includes('Marcador de lesão miocárdica'));

  await pagina.locator('.texto-nota').click();
  await pagina.keyboard.press('Control+End');
  await pagina.keyboard.type(' Texto digitado no teste.');
  confere('indicador "Salvando…" enquanto há pendência', (await pagina.locator('.estado-salvar').textContent()).includes('Salvando'));
  await pagina.waitForTimeout(1300);
  confere('indicador "Salvo" depois do salvamento automático', (await pagina.locator('.estado-salvar').textContent()).includes('Salvo'));
  confere('conteúdo gravado no banco', (await consulta("SELECT count(*) FROM notas WHERE titulo = 'Troponina' AND texto LIKE '%Texto digitado no teste.%'"))[0][0] === 1);
  confere('links da nota regravados por id', (await consulta("SELECT count(*) FROM links l JOIN notas n ON n.id = l.origemId WHERE n.titulo = 'Troponina'"))[0][0] === 1);

  // App indo para segundo plano logo depois de digitar: grava na hora, pelo caminho síncrono.
  await pagina.keyboard.type(' Mais um trecho.');
  await pagina.evaluate(() => window.__bau.pausa());
  confere('ao minimizar, grava imediatamente', (await consulta("SELECT count(*) FROM notas WHERE texto LIKE '%Mais um trecho.%'"))[0][0] === 1);

  await pagina.locator('.acao-no[data-acao="filho"]').tap();
  await pagina.waitForTimeout(300);
  await pagina.keyboard.type('Valores de referência');
  await pagina.keyboard.press('Enter');
  await pagina.waitForTimeout(400);
  confere('nó novo gravado', (await consulta("SELECT count(*) FROM nos n JOIN notas t ON t.id = n.notaId WHERE t.titulo = 'Valores de referência' AND n.excluidoEm IS NULL"))[0][0] === 1);

  let r = await pagina.evaluate(() => window.__bau.voltar());
  await pagina.waitForTimeout(100);
  confere('primeiro "voltar" na base só avisa', r === true && (await pagina.evaluate(() => window.__mock.minimizou)) === 0);
  r = await pagina.evaluate(() => window.__bau.voltar());
  await pagina.waitForTimeout(100);
  confere('segundo "voltar" minimiza o app (não encerra)', (await pagina.evaluate(() => window.__mock.minimizou)) === 1);

  await pagina.evaluate(() => window.__bau.tema(true));
  await pagina.waitForTimeout(300);
  confere('tema escuro quando o sistema avisa', (await pagina.locator('html').getAttribute('data-tema')) === 'escuro');
  confere('barras repintadas para o tema escuro', await pagina.evaluate(() => window.__mock.barras.fundoClaro === false));
  await pagina.locator('[data-acao="ver-tudo"]').tap();
  await pagina.waitForTimeout(500);
  await pagina.screenshot({ path: `${saida}/20-tema-escuro.png` });

  // Reabrir o app: tudo o que foi gravado volta do banco (o banco simulado é novo a cada página,
  // então aqui se confere só que nenhuma escrita ficou pendente ou falhou).
  confere('nenhuma gravação falhou', !(await pagina.locator('.estado-salvar.erro').count()));
  confere('sem erros no console', erros.length === 0, erros.slice(0, 5).join(' || '));
  await navegador.close();
  console.log(falhas === 0 ? '\nTudo certo.' : `\n${falhas} falha(s).`);
  process.exit(falhas === 0 ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(2); });
