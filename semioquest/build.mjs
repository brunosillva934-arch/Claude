#!/usr/bin/env node
// Monta o SemioQuest num único arquivo HTML (../semioquest.html), pronto para publicar como artefato.
//   node semioquest/build.mjs            → gera ../semioquest.html
//   node semioquest/build.mjs --check    → só valida o conteúdo, sem escrever
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const RAIZ = dirname(fileURLToPath(import.meta.url));
const ler = (...p) => readFileSync(join(RAIZ, ...p), "utf8");
const json = (...p) => JSON.parse(ler(...p));
const avisos = [];
const erros = [];
const erro = (m) => erros.push(m);
const aviso = (m) => avisos.push(m);

// ───────────────────────── Markdown → HTML (subconjunto usado nos tópicos) ─────────────────────────
const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const ROTAS = {
  topico: (id) => ["xref xref-topico", `#/topico/${id}`],
  sinal: (id) => ["xref xref-sinal", `#/sinal/${id}`],
  caso: (id) => ["xref xref-caso", `#/jogo/caso/${id}`],
  som: (id) => ["xref xref-som", `#/som/${id}`],
  tabela: (id) => ["xref xref-tabela", `#/sindrome/${id}`],
  quadro: (id) => ["xref xref-quadro", `#/quadro/${id}`],
};
const refs = []; // {tipo, id, onde}
function inline(t, onde) {
  let h = esc(t);
  h = h.replace(/\[([^\]]+)\]\((topico|sinal|caso|som|tabela|quadro):([^)\s]+)\)/g, (_, txt, tipo, id) => {
    refs.push({ tipo, id, onde });
    const [cls, href] = ROTAS[tipo](id);
    return `<a class="${cls}" href="${href}">${txt}</a>`;
  });
  h = h.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  h = h.replace(/(^|[\s(“"'/])\*(?!\s)([^*]+?)\*(?=[\s).,;:!?”"'/]|$)/g, "$1<em>$2</em>");
  h = h.replace(/`([^`]+)`/g, "<code>$1</code>");
  return h;
}
const CALLOUTS = { dica: "Dica prática", alerta: "Atenção", prova: "Como cai em prova", evidencia: "O que a evidência diz", perola: "Pérola clínica" };
function md(texto, onde) {
  const L = texto.replace(/\r/g, "").split("\n");
  const out = [];
  let i = 0;
  const celulas = (l) =>
    l
      .trim()
      .replace(/^\||\|$/g, "")
      .split(/(?<!\\)\|/)
      .map((c) => inline(c.trim().replace(/\\\|/g, "|"), onde));
  while (i < L.length) {
    const l = L[i];
    if (!l.trim()) {
      i++;
      continue;
    }
    let m;
    if ((m = l.match(/^###\s+(.*)$/))) {
      out.push(`<h4>${inline(m[1], onde)}</h4>`);
      i++;
      continue;
    }
    if (/^\s*\|/.test(l)) {
      const linhas = [];
      while (i < L.length && /^\s*\|/.test(L[i])) linhas.push(L[i++]);
      if (linhas.length < 2 || !/^\s*\|[\s:|-]+\|\s*$/.test(linhas[1])) erro(`${onde}: tabela sem linha separadora`);
      const cab = celulas(linhas[0]);
      const corpo = linhas.slice(2).map(celulas);
      for (const r of corpo) if (r.length !== cab.length) erro(`${onde}: linha de tabela com ${r.length} células (cabeçalho tem ${cab.length}): ${r[0]}`);
      out.push(
        `<table><thead><tr>${cab.map((c) => `<th>${c}</th>`).join("")}</tr></thead><tbody>${corpo
          .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`)
          .join("")}</tbody></table>`,
      );
      continue;
    }
    if (/^>\s?/.test(l)) {
      const bloco = [];
      while (i < L.length && /^>\s?/.test(L[i])) bloco.push(L[i++].replace(/^>\s?/, ""));
      let tipo = "dica";
      const t = bloco[0].match(/^\[!(\w+)\]\s*(.*)$/);
      if (t) {
        tipo = t[1];
        bloco[0] = t[2];
        if (!CALLOUTS[tipo]) erro(`${onde}: callout desconhecido [!${tipo}]`);
      }
      out.push(`<div class="cx cx-${tipo}"><b class="cx-t">${CALLOUTS[tipo] || ""}</b>${md(bloco.join("\n"), onde)}</div>`);
      continue;
    }
    if (/^\s*([-*]|\d+[.)])\s+/.test(l)) {
      // lista (com um nível de aninhamento por recuo de 2+ espaços)
      const ord = /^\s*\d+[.)]\s+/.test(l);
      const itens = [];
      while (i < L.length && (/^\s*([-*]|\d+[.)])\s+/.test(L[i]) || (/^\s{2,}\S/.test(L[i]) && itens.length))) {
        const cur = L[i];
        const topo = cur.match(/^([-*]|\d+[.)])\s+(.*)$/);
        if (topo) itens.push({ t: topo[2], sub: [] });
        else {
          const sub = cur.match(/^\s{2,}([-*]|\d+[.)])\s+(.*)$/);
          if (sub) itens[itens.length - 1].sub.push(sub[2]);
          else itens[itens.length - 1].t += " " + cur.trim();
        }
        i++;
      }
      const tag = ord ? "ol" : "ul";
      out.push(
        `<${tag}>${itens
          .map((it) => `<li>${inline(it.t, onde)}${it.sub.length ? `<ul>${it.sub.map((x) => `<li>${inline(x, onde)}</li>`).join("")}</ul>` : ""}</li>`)
          .join("")}</${tag}>`,
      );
      continue;
    }
    const par = [];
    while (i < L.length && L[i].trim() && !/^(###\s|>\s?|\s*\||\s*([-*]|\d+[.)])\s+)/.test(L[i])) par.push(L[i++].trim());
    out.push(`<p>${inline(par.join(" "), onde)}</p>`);
  }
  return out.join("\n");
}
const semTags = (h) =>
  h
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();

// ───────────────────────── Tópicos em conteudo/topicos/*.md ─────────────────────────
// Formato:
//   @modulo abdome
//   @topico abd-anatomia
//   titulo: …        nivel: Básico|Clínico|Avançado
//   resumo: … (3 linhas)      sinais: a, b      sons: …      casos: …
//   ## Seção
//   (markdown)
//   @cartoes
//   Pergunta :: Resposta
function lerTopicosMd(arquivo, texto) {
  const topicos = [];
  let modulo = null;
  let cur = null;
  let secao = null;
  let emCartoes = false;
  const fechaSecao = () => {
    if (cur && secao) {
      cur.secoes.push({ titulo: secao.titulo, html: md(secao.linhas.join("\n"), `${arquivo}#${cur.id}/${secao.titulo}`) + "\n" });
    }
    secao = null;
  };
  const fechaTopico = () => {
    fechaSecao();
    if (cur) topicos.push(cur);
    cur = null;
    emCartoes = false;
  };
  for (const bruta of texto.replace(/\r/g, "").split("\n")) {
    let m;
    if ((m = bruta.match(/^@modulo\s+(\S+)/))) {
      fechaTopico();
      modulo = m[1];
      continue;
    }
    if ((m = bruta.match(/^@topico\s+(\S+)/))) {
      fechaTopico();
      if (!modulo) erro(`${arquivo}: @topico antes de @modulo`);
      cur = { id: m[1], modulo, titulo: "", nivel: "Básico", resumo: [], sinais: [], sons: [], casos: [], secoes: [], cartoes: [] };
      continue;
    }
    if (!cur) continue;
    if (/^@cartoes\s*$/.test(bruta)) {
      fechaSecao();
      emCartoes = true;
      continue;
    }
    if (emCartoes) {
      if (!bruta.trim()) continue;
      const p = bruta.split(" :: ");
      if (p.length !== 2) erro(`${arquivo}#${cur.id}: cartão sem " :: " → ${bruta.slice(0, 60)}`);
      else cur.cartoes.push({ f: inline(p[0].trim(), arquivo), b: inline(p[1].trim(), arquivo) });
      continue;
    }
    if ((m = bruta.match(/^##\s+(.*)$/))) {
      fechaSecao();
      secao = { titulo: m[1].trim(), linhas: [] };
      continue;
    }
    if (secao) {
      secao.linhas.push(bruta);
      continue;
    }
    if ((m = bruta.match(/^(titulo|nivel|resumo|sinais|sons|casos):\s*(.*)$/))) {
      const [, k, v] = m;
      if (k === "titulo" || k === "nivel") cur[k] = v.trim();
      else if (k === "resumo") cur.resumo.push(v.trim());
      else
        cur[k] = v
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean);
    }
  }
  fechaTopico();
  return topicos;
}

// ───────────────────────── Dados: base + conteúdo novo ─────────────────────────
const base = {};
for (const k of ["modulos", "topicos", "sinais", "sons", "regioes", "casos", "sequencias", "sindromes", "glossario", "comunicacao", "caderno"]) base[k] = json("src", "data", k + ".json");

const dirTop = join(RAIZ, "conteudo", "topicos");
const novos = [];
if (existsSync(dirTop))
  for (const f of readdirSync(dirTop).sort()) if (f.endsWith(".md")) novos.push(...lerTopicosMd(f, readFileSync(join(dirTop, f), "utf8")));

async function extra(nome) {
  const p = join(RAIZ, "conteudo", nome + ".mjs");
  if (!existsSync(p)) return null;
  return (await import(pathToFileURL(p).href)).default;
}
const slug = (a) =>
  a
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const porId = (lista, novosItens, rotulo) => {
  const m = new Map(lista.map((x) => [x.id, x]));
  for (const n of novosItens || []) {
    if (!n.id) erro(`${rotulo}: item sem id`);
    m.set(n.id, { ...(m.get(n.id) || {}), ...n });
  }
  return [...m.values()];
};

const D = { ...base };

// módulos: tudo o que tiver tópico fica disponível; conteudo/modulos.mjs pode ajustar títulos e descrições
D.modulos = porId(base.modulos, await extra("modulos"), "modulos");

// tópicos
{
  const m = new Map(base.topicos.map((t) => [t.id, t]));
  const ordem = {};
  for (const t of base.topicos) ordem[t.modulo] = Math.max(ordem[t.modulo] || 0, t.ordem);
  for (const t of novos) {
    if (!t.titulo) erro(`tópico ${t.id}: sem título`);
    if (t.resumo.length !== 3) erro(`tópico ${t.id}: resumo deve ter 3 linhas (tem ${t.resumo.length})`);
    if (t.secoes.length < 3) erro(`tópico ${t.id}: poucas seções (${t.secoes.length})`);
    if (t.cartoes.length < 5) erro(`tópico ${t.id}: poucos cartões (${t.cartoes.length})`);
    const antigo = m.get(t.id);
    t.ordem = antigo ? antigo.ordem : (ordem[t.modulo] = (ordem[t.modulo] || 0) + 1);
    t.resumo = t.resumo.map((r) => inline(r, t.id));
    t.cartoes = t.cartoes.map((c, i) => ({ id: `top:${t.id}:${i}`, ...c }));
    t.texto = semTags(t.resumo.join(" ") + " " + t.secoes.map((s) => s.titulo + " " + s.html).join(" "));
    m.set(t.id, t);
  }
  D.topicos = [...m.values()];
}
const modComTopico = new Set(D.topicos.map((t) => t.modulo));
D.modulos = D.modulos.map((m) => ({ ...m, disponivel: modComTopico.has(m.id), fase: 1 }));
for (const t of D.topicos) if (!D.modulos.some((m) => m.id === t.modulo)) erro(`tópico ${t.id}: módulo inexistente ${t.modulo}`);

// sinais
D.sinais = porId(base.sinais, await extra("sinais"), "sinais").map((s) => ({
  significado: "",
  acuracia: "",
  armadilha: "",
  topico: null,
  ...s,
  textoTecnica: `${s.tecnica} ${s.positivo}`,
}));
// sons, sequências, tabelas, casos, regiões
D.sons = porId(base.sons, await extra("sons"), "sons");
D.sequencias = porId(base.sequencias, await extra("sequencias"), "sequencias");
D.sindromes = porId(base.sindromes, await extra("sindromes"), "sindromes");
D.casos = porId(base.casos, await extra("casos"), "casos");
{
  const add = (await extra("regioes")) || {};
  D.regioes = base.regioes.map((r) => ({ ...r, manobras: porId(r.manobras, add[r.id], `regioes.${r.id}`) }));
  for (const k of Object.keys(add)) if (!base.regioes.some((r) => r.id === k)) erro(`regioes: região inexistente ${k}`);
}
// glossário
{
  const m = new Map(base.glossario.map((g) => [g.id, g]));
  for (const g of (await extra("glossario")) || []) {
    const id = g.id || slug(g.termo);
    m.set(id, { sinonimos: [], ...g, id });
  }
  D.glossario = [...m.values()].sort((a, b) => a.termo.localeCompare(b.termo, "pt-BR"));
}
// vínculo tópico ↔ quadros do caderno
{
  const add = (await extra("caderno-vinculos")) || {};
  D.caderno = { ...base.caderno, topicos: { ...base.caderno.topicos, ...(add.topicos || {}) }, modulos: { ...base.caderno.modulos, ...(add.modulos || {}) } };
}
// questões de banco fixo (simulados) e estações prontas
D.questoes = (await extra("questoes")) || [];

// ───────────────────────── Validação cruzada ─────────────────────────
const ids = (l) => new Set(l.map((x) => x.id));
const S = { topico: ids(D.topicos), sinal: ids(D.sinais), som: ids(D.sons), caso: ids(D.casos), tabela: ids(D.sindromes), quadro: new Set(D.caderno.quadros.map((q) => q.num)) };
for (const r of refs) if (!S[r.tipo].has(r.id)) erro(`${r.onde}: link para ${r.tipo}:${r.id} não existe`);
for (const t of D.topicos) {
  for (const x of t.sinais) if (!S.sinal.has(x)) erro(`tópico ${t.id}: sinal inexistente ${x}`);
  for (const x of t.sons) if (!S.som.has(x)) erro(`tópico ${t.id}: som inexistente ${x}`);
  for (const x of t.casos) if (!S.caso.has(x)) erro(`tópico ${t.id}: caso inexistente ${x}`);
}
for (const s of D.sinais) {
  for (const k of ["nome", "sistema", "sugere", "tecnica", "positivo"]) if (!s[k]) erro(`sinal ${s.id}: falta ${k}`);
  if (s.topico && !S.topico.has(s.topico)) erro(`sinal ${s.id}: tópico inexistente ${s.topico}`);
}
{
  const man = new Map();
  for (const r of D.regioes) for (const m of r.manobras) man.set(m.id, { ...m, regiao: r.id });
  for (const c of D.casos) {
    for (const k of ["titulo", "queixa", "sistema", "abertura", "vitais", "anamnese", "exame", "sintese"]) if (!c[k]) erro(`caso ${c.id}: falta ${k}`);
    for (const e of c.exame || []) {
      const m = man.get(e.id);
      if (!m) {
        // manobra própria do caso: precisa dizer região, nome e tipo
        if (!D.regioes.some((r) => r.id === e.regiao) || !e.nome || !e.tipo) erro(`caso ${c.id}: manobra própria ${e.id} sem região/nome/tipo válidos`);
      } else if (m.regiao !== e.regiao) erro(`caso ${c.id}: manobra ${e.id} está na região ${m.regiao}, não ${e.regiao}`);
      if (e.som && !S.som.has(e.som)) erro(`caso ${c.id}: som inexistente ${e.som}`);
    }
    for (const k of ["sindrome", "hipotese"]) {
      const s = c.sintese?.[k];
      if (!s || !s.opcoes?.includes(s.correta)) erro(`caso ${c.id}: síntese.${k} sem a correta entre as opções`);
    }
    for (const x of c.revisar || []) if (!S.topico.has(x)) erro(`caso ${c.id}: revisar → tópico inexistente ${x}`);
    if (!(c.anamnese || []).some((q) => q.tipo === "chave")) erro(`caso ${c.id}: sem pergunta-chave`);
    if (!(c.exame || []).some((q) => q.chave)) erro(`caso ${c.id}: sem achado-chave`);
  }
}
for (const t of D.sindromes) for (const l of t.linhas) for (const c of t.colunas) if (!l.valores[c.id]) erro(`tabela ${t.id}: linha "${l.nome}" sem coluna ${c.id}`);
for (const q of D.sequencias) if ((q.passos || []).length < 4) erro(`sequência ${q.id}: menos de 4 passos`);
for (const q of D.questoes) {
  if (!q.id || !q.sistema || !q.pergunta || !Array.isArray(q.alternativas) || q.alternativas.length !== 4 || !(q.correta >= 0 && q.correta < 4) || !q.explicacao) erro(`questão ${q.id}: campos incompletos`);
  if (new Set(q.alternativas).size !== 4) erro(`questão ${q.id}: alternativas repetidas`);
  if (q.topico && !S.topico.has(q.topico)) erro(`questão ${q.id}: tópico inexistente ${q.topico}`);
}
{
  const vistos = new Set();
  for (const k of ["topicos", "sinais", "sons", "casos", "sequencias", "sindromes", "questoes"])
    for (const x of D[k]) {
      const c = k + ":" + x.id;
      if (vistos.has(c)) erro(`id repetido ${c}`);
      vistos.add(c);
    }
}

D.geradoEm = new Date().toISOString();
const resumo = `${D.topicos.length} tópicos · ${D.sinais.length} sinais · ${D.sons.length} sons · ${D.casos.length} casos · ${D.sequencias.length} sequências · ${D.sindromes.length} tabelas · ${D.glossario.length} termos · ${D.questoes.length} questões · ${D.caderno.quadros.length} quadros`;
for (const a of avisos) console.warn("aviso:", a);
if (erros.length) {
  for (const e of erros) console.error("ERRO:", e);
  console.error(`\n${erros.length} erro(s) de conteúdo.`);
  process.exit(1);
}
if (process.argv.includes("--check")) {
  console.log("Conteúdo válido:", resumo);
  process.exit(0);
}

// ───────────────────────── Montagem ─────────────────────────
const LS = String.fromCharCode(0x2028);
const PS = String.fromCharCode(0x2029);
const paraScript = (t) => t.replace(/<\/(script)/gi, "<\\/$1").replace(/<!--/g, "<\\!--").split(LS).join("\\u2028").split(PS).join("\\u2029");
const css = ["base.css", "extra.css"].filter((f) => existsSync(join(RAIZ, "src", "styles", f))).map((f) => ler("src", "styles", f)).join("\n");
const app = readdirSync(join(RAIZ, "src", "app"))
  .filter((f) => f.endsWith(".js"))
  .sort()
  .map((f) => `/* ── ${f} ── */\n` + ler("src", "app", f))
  .join("\n");
if (/<\/script/i.test(app)) erro("o código do app contém </script");
const REACT = "https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js";
const REACT_DOM = "https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js";
const html = `<title>SemioQuest</title>
<meta name="theme-color" content="#0b5f5a">
<style>
${css}
</style>
<div id="root"><p class="sq-boot">Carregando o SemioQuest…</p></div>
<script src="${REACT}"></script>
<script src="${REACT_DOM}"></script>
<script>
(function () {
"use strict";
if (!window.React || !window.ReactDOM) {
  document.getElementById("root").innerHTML = '<p class="sq-boot">Não consegui carregar os componentes da página. Verifique a conexão e recarregue.</p>';
  return;
}
const Zv = ${paraScript(JSON.stringify(D))};
${app}
})();
</script>
`;
const saida = join(RAIZ, "..", "semioquest.html");
writeFileSync(saida, html);
console.log(`semioquest.html: ${(Buffer.byteLength(html) / 1024).toFixed(0)} KB — ${resumo}`);
