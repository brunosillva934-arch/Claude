// Captura de tela simples da abertura. uso: node testes/ver.cjs [pasta]
const { abrir, enquadramento } = require('./comum.cjs');
(async () => {
  const saida = process.argv[2] || 'testes/telas';
  const { navegador, pagina, erros } = await abrir();
  await pagina.screenshot({ path: `${saida}/01-abertura-paisagem.png` });
  console.log('nós na tela:', await pagina.locator('.no').count());
  console.log('enquadramento:', JSON.stringify(await enquadramento(pagina)));
  console.log(erros.join('\n') || 'sem erros no console');
  await navegador.close();
})();
