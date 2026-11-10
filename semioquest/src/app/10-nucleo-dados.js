// Índices dos dados, baralho de cartões, busca e utilidades.
const O = Zv,
  io = (a) => new Map(a.map((e) => [e.id, e])),
  Vi = io(O.modulos),
  Va = io(O.topicos),
  Hc = io(O.sinais),
  Gs = io(O.sons),
  El = io(O.casos),
  ub = io(O.sequencias),
  rf = io(O.sindromes);
io(O.glossario);
const tf = io(O.regioes),
  ra = O.caderno,
  Ve = new Map(ra.quadros.map((a) => [a.num, a])),
  Qi = new Map(ra.areas.map((a) => [a.num, a])),
  Le = (a) => ra.quadros.filter((e) => e.area === a),
  nf = (a) => (ra.modulos[a] || []).map((e) => Ve.get(e)).filter(Boolean),
  mb = (a) => (ra.topicos[a] || []).map((e) => Ve.get(e)).filter(Boolean),
  lf = {
    geral: "Exame geral",
    vitais: "Sinais vitais",
    anamnese: "Anamnese",
    fundamentos: "Fundamentos",
    sintomas: "Sinais e sintomas",
    respiratorio: "Respiratório",
    cardiovascular: "Cardiovascular",
    abdome: "Abdome",
    neurologico: "Neurológico",
    "cabeca-pescoco": "Cabeça e pescoço",
    osteoarticular: "Osteoarticular",
    pele: "Pele",
    vascular: "Vascular periférico",
    "mamas-genital": "Mamas e geniturinário",
    mental: "Estado mental",
    especiais: "Criança, gestante e idoso",
  };
for (const a of O.caderno.areas) lf[`area-${a.num}`] = `Caderno · ${a.titulo}`;
const se = (a) => lf[a] || a,
  Li = (a) => O.topicos.filter((e) => e.modulo === a).sort((e, o) => e.ordem - o.ordem),
  ze = (a) => String(a).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
let Nr = null;
const pb = (a) => {
  Nr = a;
};
class fb {
  constructor(e) {
    (this.base = e), (this.cache = new Map());
  }
  get(e) {
    if (this.base.has(e)) return this.base.get(e);
    if (e.startsWith("u:")) return (Nr == null ? void 0 : Nr(e)) || void 0;
    if (e.startsWith("qd:")) return this.cache.has(e) || this.cache.set(e, cf(e)), this.cache.get(e) || void 0;
  }
  has(e) {
    return !!this.get(e);
  }
  keys() {
    return this.base.keys();
  }
}
function cf(a) {
  var d;
  const e = a.match(/^qd:([\d.]+):(\d+):(\d+)$/);
  if (!e) return null;
  const o = Ve.get(e[1]),
    i = Number(e[2]),
    r = Number(e[3]),
    t = o == null ? void 0 : o.linhas[i],
    n = t == null ? void 0 : t[r];
  if (!o || !t || !n || n === "—") return null;
  const { entidade: l, atributo: c } = df(o, i, r);
  return {
    id: a,
    deck: `Caderno · ${((d = Qi.get(o.area)) == null ? void 0 : d.titulo) || "Área " + o.area}`,
    sistema: `area-${o.area}`,
    rota: `#/quadro/${o.num}`,
    frente: `<small class="muted">Quadro ${o.num} · ${ze(o.titulo)}</small><p><b>${ze(l)}</b> — ${ze(c.toLowerCase())}?</p>`,
    verso: `<p>${ze(n)}</p>`,
  };
}
function df(a, e, o) {
  const i = a.linhas[e];
  return a.transposto ? { entidade: a.colunas[o], atributo: i[0] } : { entidade: a.agrupado ? `${i[0]} — ${i[1]}` : i[a.rotulo], atributo: a.colunas[o] };
}
function Nt(a) {
  if (a.semQuiz) return null;
  const e = [],
    o = new Map(),
    i = new Set(),
    r = (l) => {
      let c = l || "—",
        d = 2;
      for (; i.has(c); ) c = `${l} (${d++})`;
      return i.add(c), c;
    };
  let t = [];
  const n = (l) => !l || l === "—" || l === "-";
  if (a.transposto)
    (t = a.linhas.map((l, c) => ({ id: "r" + c, nome: l[0] }))),
      a.colunas.forEach((l, c) => {
        if (c === 0 || a.excluir.includes(c)) return;
        const d = r(l),
          u = {};
        a.linhas.forEach((m, p) => {
          n(m[c]) || ((u["r" + p] = m[c]), o.set(`${d}|r${p}`, `qd:${a.num}:${p}:${c}`));
        }),
          e.push({ nome: d, valores: u });
      });
  else {
    const l = a.colunas.map((c, d) => ({ c: d, nome: c })).filter(({ c }) => c !== a.rotulo && !(a.agrupado && c <= 1) && !a.excluir.includes(c));
    (t = l.map(({ c, nome: d }) => ({ id: "c" + c, nome: d }))),
      a.linhas.forEach((c, d) => {
        const u = r(a.agrupado ? `${c[0]} — ${c[1]}` : c[a.rotulo]),
          m = {};
        for (const { c: p } of l) n(c[p]) || ((m["c" + p] = c[p]), o.set(`${u}|c${p}`, `qd:${a.num}:${d}:${p}`));
        e.push({ nome: u, valores: m });
      });
  }
  return e.length < 2 || !t.length
    ? null
    : { id: "q" + a.num, titulo: `${a.num} ${a.titulo}`, sistema: `area-${a.area}`, colunas: t, linhas: e, cartao: (l, c) => o.get(`${l}|${c}`) || "" };
}
const vu = (a) => {
  const e = [];
  return (
    a.linhas.forEach((o, i) =>
      o.forEach((r, t) => {
        const n = `qd:${a.num}:${i}:${t}`;
        cf(n) && !(a.transposto ? t === 0 : t === a.rotulo || (a.agrupado && t <= 1)) && !a.excluir.includes(t) && e.push(n);
      }),
    ),
    a.semQuiz ? [] : e
  );
};
let hr = null;
function Mt() {
  if (hr) return hr;
  const a = new Map();
  for (const e of O.topicos) {
    const o = Vi.get(e.modulo);
    for (const i of e.cartoes)
      a.set(i.id, { id: i.id, frente: i.f, verso: i.b, deck: (o == null ? void 0 : o.titulo) || e.modulo, sistema: e.modulo, rota: `#/topico/${e.id}` });
  }
  for (const e of O.sinais)
    a.set(`sinal:${e.id}:a`, {
      id: `sinal:${e.id}:a`,
      frente: `<b>${e.nome}</b> — o que sugere e como se pesquisa?`,
      verso: `<p><b>Sugere:</b> ${e.sugere}</p><p>${e.tecnica}</p><p><b>Positivo:</b> ${e.positivo}</p>`,
      deck: "Atlas de Sinais",
      sistema: e.sistema,
      rota: `#/sinal/${e.id}`,
    }),
      a.set(`sinal:${e.id}:b`, {
        id: `sinal:${e.id}:b`,
        frente: `Qual sinal? <p>${e.tecnica} <b>Positivo:</b> ${e.positivo}</p>`,
        verso: `<b>${e.nome}</b> — ${e.sugere}`,
        deck: "Atlas de Sinais",
        sistema: e.sistema,
        rota: `#/sinal/${e.id}`,
      });
  for (const e of O.sons)
    a.set(`som:${e.id}`, {
      id: `som:${e.id}`,
      frente: `Ouça e identifique o som (${e.categoria === "cardiaco" ? "cardíaco" : "pulmonar"}).`,
      verso: `<b>${e.nome}</b><p>${e.descricao}</p>`,
      deck: "Banco de Sons",
      sistema: e.categoria === "cardiaco" ? "cardiovascular" : "respiratorio",
      rota: `#/som/${e.id}`,
      som: e.id,
    });
  for (const e of O.sindromes)
    for (const o of e.linhas)
      for (const i of e.colunas) {
        const r = `sind:${e.id}:${Mr(o.nome)}:${i.id}`;
        a.set(r, {
          id: r,
          frente: `<b>${o.nome}</b>: ${i.nome.toLowerCase()}?`,
          verso: o.valores[i.id],
          deck: e.titulo,
          sistema: e.sistema,
          rota: `#/sindrome/${e.id}`,
        });
      }
  for (const e of O.sequencias) {
    const o = `seq:${e.id}`;
    a.set(o, {
      id: o,
      frente: `Qual a sequência correta? <b>${e.titulo}</b>`,
      verso: "<ol>" + e.passos.map((i) => `<li>${i}</li>`).join("") + "</ol>",
      deck: "Sequências",
      sistema: e.sistema,
    });
  }
  return (hr = new fb(a)), hr;
}
const Mr = (a) =>
    a
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, ""),
  ge = (a) => a.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
let bn = null,
  Il = null;
function gb() {
  var o, i;
  if (bn) return bn;
  const a = new Si({
      fields: ["titulo", "texto"],
      storeFields: ["tipo", "titulo", "sub", "rota"],
      processTerm: (r) => ge(r),
      searchOptions: { boost: { titulo: 3 }, prefix: !0, fuzzy: 0.2, combineWith: "OR" },
    }),
    e = [];
  for (const r of O.topicos)
    e.push({
      id: "t:" + r.id,
      tipo: "Tópico",
      titulo: r.titulo,
      texto: r.texto + " " + r.cartoes.map((t) => t.f + " " + t.b).join(" "),
      sub: ((o = Vi.get(r.modulo)) == null ? void 0 : o.titulo) || "",
      rota: "#/topico/" + r.id,
    });
  for (const r of O.sinais)
    e.push({ id: "s:" + r.id, tipo: "Sinal", titulo: r.nome, texto: r.sugere + " " + r.textoTecnica, sub: r.sugere, rota: "#/sinal/" + r.id });
  for (const r of O.sons)
    e.push({
      id: "o:" + r.id,
      tipo: "Som",
      titulo: r.nome,
      texto: r.descricao.replace(/<[^>]+>/g, " ") + " " + r.onde,
      sub: r.categoria === "cardiaco" ? "Som cardíaco" : "Som pulmonar",
      rota: "#/som/" + r.id,
    });
  for (const r of O.glossario)
    e.push({
      id: "g:" + r.id,
      tipo: "Glossário",
      titulo: r.termo,
      texto: r.def.replace(/<[^>]+>/g, " ") + " " + r.sinonimos.join(" "),
      sub: r.def.replace(/<[^>]+>/g, "").slice(0, 80),
      rota: "#/glossario/" + r.id,
    });
  for (const r of O.casos) e.push({ id: "c:" + r.id, tipo: "Caso", titulo: r.titulo, texto: r.queixa, sub: r.queixa, rota: "#/jogo/caso/" + r.id });
  for (const r of ra.quadros)
    e.push({
      id: "q:" + r.num,
      tipo: "Quadro",
      titulo: `${r.num} ${r.titulo}`,
      texto: [r.subtitulo, r.nota, r.colunas.join(" "), r.linhas.map((t) => t.join(" ")).join(" ")].join(" "),
      sub: ((i = Qi.get(r.area)) == null ? void 0 : i.titulo) || "",
      rota: "#/quadro/" + r.num,
    });
  for (const r of O.sindromes)
    e.push({
      id: "y:" + r.id,
      tipo: "Tabela",
      titulo: r.titulo,
      texto: r.linhas.map((t) => t.nome + " " + Object.values(t.valores).join(" ")).join(" "),
      sub: "Tabela comparativa",
      rota: "#/sindrome/" + r.id,
    });
  a.addAll(e), (bn = a), (Il = new Map());
  for (const r of O.glossario) {
    const t = [r.termo, ...r.sinonimos].map(ge);
    for (const n of t) Il.set(n, t);
  }
  return a;
}
function hb(a) {
  const e = gb(),
    o = ge(a.trim());
  if (o.length < 2) return [];
  const i = new Set();
  for (const [t, n] of Il) (o.includes(t) || (t.length > 4 && t.startsWith(o))) && n.forEach((l) => i.add(l));
  const r = [o, ...i].join(" ");
  return e
    .search(r)
    .slice(0, 40)
    .map((t) => ({ id: t.id, tipo: t.tipo, titulo: t.titulo, sub: t.sub, rota: t.rota }));
}
function Jo(a) {
  let e = a >>> 0 || 1;
  return () => ((e ^= e << 13), (e >>>= 0), (e ^= e >> 17), (e ^= e << 5), (e >>>= 0), e / 4294967296);
}
function X(a, e = Math.random) {
  const o = a.slice();
  for (let i = o.length - 1; i > 0; i--) {
    const r = Math.floor(e() * (i + 1));
    [o[i], o[r]] = [o[r], o[i]];
  }
  return o;
}
const ao = () => {
    const a = new Date();
    return `${a.getFullYear()}-${String(a.getMonth() + 1).padStart(2, "0")}-${String(a.getDate()).padStart(2, "0")}`;
  },
  vb = () => Number(ao().replace(/-/g, "")),
  bb = new Set([
    "sugere",
    "lesao",
    "doenca",
    "sindrome",
    "aguda",
    "agudo",
    "grave",
    "cronica",
    "cronico",
    "sobretudo",
    "mesmo",
    "pequena",
    "baixa",
    "acuracia",
    "normal",
    "quando",
  ]),
  bu = (a) =>
    new Set(
      ge(a.replace(/<[^>]+>/g, " "))
        .split(/[^a-z0-9]+/)
        .filter((e) => e.length >= 5 && !bb.has(e)),
    );
function Dl(a, e) {
  const o = bu(a),
    i = bu(e);
  for (const n of o) if (i.has(n)) return !0;
  const r = ge(a).split(/[^a-z0-9]+/)[0],
    t = ge(e).split(/[^a-z0-9]+/)[0];
  return r.length >= 4 && r === t;
}
