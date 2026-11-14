/* Confere o conteúdo antes de montar: caminho que não existe, nomes repetidos no mesmo
   lugar, motivos sem nota. uso: node conferir.js   (sai com erro se algo estiver errado) */
const fs = require('fs');
const path = require('path');
global.window = {};
const web = path.join(__dirname, 'web');
require(path.join(web, 'dados.js'));
for (const f of fs.readdirSync(path.join(web, 'conteudo')).filter(f => f.endsWith('.js')).sort())
  require(path.join(web, 'conteudo', f));

const W = global.window, erros = [...W.SEMENTE_AVISOS];
const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
const c = { areas: W.SEMENTE.length, topicos: 0, achados: 0, esperados: 0, anormais: 0, motivos: 0, novos: 0, imagens: 0 };
const usadas = {};
(function andar(lista, onde) {
  const vistos = {};
  for (const it of lista) {
    const chave = (it.k === 't' ? 't:' : 'a:') + norm(it.nome);
    if (vistos[chave]) erros.push('nome repetido em ' + (onde || 'raiz') + ': ' + it.nome);
    vistos[chave] = 1;
    if ((it.ver || 1) > 1) c.novos++;
    if (it.k === 't') { if (onde) c.topicos++; andar(it.itens, (onde ? onde + ' › ' : '') + it.nome); continue; }
    c.achados++;
    it.k === 'e' ? c.esperados++ : c.anormais++;
    const ms = {};
    for (const m of it.motivos) {
      c.motivos++;
      if (ms[norm(m[0])]) erros.push('motivo repetido em ' + it.nome + ': ' + m[0]);
      ms[norm(m[0])] = 1;
      if (!m[1]) erros.push('motivo sem nota em ' + it.nome + ': ' + m[0]);
    }
    if (it.k === 'x' && !it.motivos.length) erros.push('anormal sem motivo: ' + onde + ' › ' + it.nome);
    for (const f of it.fotos || []) {
      c.imagens++;
      usadas[f.arq] = 1;
      if (!/^fotos\/[a-z0-9_-]+\.(jpg|png|svg)$/.test(f.arq)) erros.push('nome de imagem inválido: ' + f.arq);
      else if (!fs.existsSync(path.join(web, f.arq))) erros.push('imagem não encontrada: ' + f.arq);
      if (!f.credito) erros.push('imagem sem crédito: ' + f.arq);
    }
  }
})(W.SEMENTE, '');
for (const f of fs.existsSync(path.join(web, 'fotos')) ? fs.readdirSync(path.join(web, 'fotos')) : [])
  if (!usadas['fotos/' + f]) erros.push('imagem que nenhum achado usa: fotos/' + f);
console.log('conteúdo versão ' + W.SEMENTE_VERSAO + ': ' + c.areas + ' áreas, ' + c.topicos + ' tópicos, ' + c.achados +
  ' achados (' + c.esperados + ' esperados, ' + c.anormais + ' anormais), ' + c.motivos + ' motivos, ' + c.imagens + ' imagens');
if (erros.length) { console.error(erros.join('\n')); process.exit(1); }
