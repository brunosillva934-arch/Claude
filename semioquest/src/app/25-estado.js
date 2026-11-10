// Estado do estudante, XP, conquistas, cartões.
const Ub = (a) => new Gb(a || {}),
  vf = "semioquest:v1",
  ks = () => ({
    v: 1,
    onboarded: !1,
    settings: { theme: "system", font: 1, novosPorDia: 20 },
    xp: 0,
    dias: {},
    lidos: {},
    estudados: {},
    cards: {},
    filaNovos: [],
    novosHoje: { data: ao(), n: 0 },
    stats: {},
    itens: {},
    casos: {},
    conquistas: {},
    relatos: [],
    notas: {},
    favoritos: {},
    contadores: {},
    quadros: {},
  });
function Wb() {
  try {
    const a = localStorage.getItem(vf);
    if (a) return { ...ks(), ...JSON.parse(a) };
  } catch (a) {}
  return ks();
}
let ba = Wb();
const ut = new Set();
let Su = null;
function bf() {
  clearTimeout(Su),
    (Su = setTimeout(() => {
      try {
        localStorage.setItem(vf, JSON.stringify(ba));
      } catch (a) {}
    }, 150));
}
let yr = null;
const xf = (a) => {
  yr = a;
};
function W(a) {
  const e = Kb(ba);
  a(e), (e.atualizadoEm = Math.max(Date.now(), (ba.atualizadoEm || 0) + 1)), (ba = e), bf(), ut.forEach((o) => o()), yr == null || yr();
}
function Cf(a) {
  (ba = { ...ks(), ...a }), bf(), ut.forEach((e) => e());
}
const Ml = (a) => (a.xp || 0) + Object.keys(a.cards || {}).length + Object.keys(a.lidos || {}).length;
function Kb(a) {
  return JSON.parse(JSON.stringify(a));
}
const Ya = () => ba,
  Jb = (a) => (
    ut.add(a),
    () => {
      ut.delete(a);
    }
  );
function ea(a) {
  const e = S.useRef(null),
    o = () => ((e.current && e.current.s === ba) || (e.current = { s: ba, v: a(ba) }), e.current.v);
  return S.useSyncExternalStore(Jb, o);
}
const lo = [
  { nome: "Calouro", xp: 0 },
  { nome: "Acadêmico", xp: 300 },
  { nome: "Monitor", xp: 1e3 },
  { nome: "Interno", xp: 2500 },
  { nome: "Residente", xp: 5e3 },
  { nome: "Preceptor", xp: 1e4 },
];
function Vc(a) {
  let e = 0;
  for (let i = 0; i < lo.length; i++) a >= lo[i].xp && (e = i);
  const o = lo[e + 1];
  return { atual: lo[e], prox: o, pct: o ? (a - lo[e].xp) / (o.xp - lo[e].xp) : 1 };
}
let Rr = null;
const Xb = (a) => {
    Rr = a;
  },
  ca = (a) => (Rr == null ? void 0 : Rr(a));
function ne(a, e) {
  const o = (i) => {
    i.xp += a;
    const r = ao();
    i.dias[r] = (i.dias[r] || 0) + a;
  };
  e ? o(e) : W(o);
}
function Ot(a) {
  let e = 0;
  const o = new Date(),
    i = (t) => `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
  a[i(o)] || o.setDate(o.getDate() - 1);
  let r = !1;
  for (let t = 0; t < 3650; t++) {
    if (a[i(o)]) e++;
    else if (!r && e > 0) r = !0;
    else break;
    o.setDate(o.getDate() - 1);
  }
  return e;
}
function Ft(a, e, o) {
  W((i) => {
    const r = i.stats[a] || { c: 0, t: 0, ema: 0.5 };
    if (((r.c += e ? 1 : 0), (r.t += 1), (r.ema = r.ema * 0.85 + (e ? 0.15 : 0)), (i.stats[a] = r), o)) {
      const t = i.itens[o] || { c: 0, t: 0 };
      (t.c += e ? 1 : 0), (t.t += 1), (i.itens[o] = t);
    }
    e && ne(5, i), (i.contadores.respostas = (i.contadores.respostas || 0) + 1), e && (i.contadores.acertos = (i.contadores.acertos || 0) + 1);
  }),
    Us();
}
const qf = Ub({ enable_fuzz: !0, request_retention: 0.9 }),
  Af = (a) => ({ ...a, due: new Date(a.due), last_review: a.last_review ? new Date(a.last_review) : void 0 }),
  Yb = (a) => ({ ...a, due: a.due.toISOString(), last_review: a.last_review ? a.last_review.toISOString() : void 0 });
function Ee(a, e = !1, o) {
  const i = (t) => {
    const n = Mt(),
      l = a.filter((c) => n.has(c) && !t.cards[c] && !t.filaNovos.includes(c));
    return (t.filaNovos = e ? [...l, ...t.filaNovos] : [...t.filaNovos, ...l]), l.length;
  };
  if (o) return i(o);
  let r = 0;
  return (
    W((t) => {
      r = i(t);
    }),
    r
  );
}
function Ht(a) {
  W((e) => {
    const o = [];
    for (const i of a) {
      const r = e.cards[i];
      r && r.state === Y.Review ? (e.cards[i] = { ...r, due: new Date().toISOString() }) : r || o.push(i);
    }
    Ee(o, !0, e);
  });
}
function Qc() {
  const a = ba,
    e = Date.now(),
    o = Mt(),
    i = Object.entries(a.cards)
      .filter(([n, l]) => o.has(n) && new Date(l.due).getTime() <= e)
      .sort((n, l) => new Date(n[1].due).getTime() - new Date(l[1].due).getTime())
      .map(([n]) => n),
    r = a.novosHoje.data === ao() ? a.novosHoje.n : 0,
    t = a.filaNovos.filter((n) => o.has(n)).slice(0, Math.max(0, a.settings.novosPorDia - r));
  return { vencidos: i, novos: t };
}
function Pf(a) {
  const e = ba.cards[a] ? Af(ba.cards[a]) : Ls(new Date()),
    o = qf.repeat(e, new Date()),
    i = {};
  for (const r of [H.Again, H.Hard, H.Good, H.Easy]) i[r] = Zb(o[r].card.due.getTime() - Date.now());
  return i;
}
function Zb(a) {
  const e = a / 6e4;
  if (e < 60) return `${Math.max(1, Math.round(e))} min`;
  const o = e / 60;
  if (o < 24) return `${Math.round(o)} h`;
  const i = o / 24;
  if (i < 30) return `${Math.round(i)} d`;
  const r = i / 30;
  return r < 12 ? `${Math.round(r)} m` : `${(i / 365).toFixed(1)} a`;
}
function Sf(a, e) {
  let o = new Date();
  return (
    W((i) => {
      const r = !i.cards[a],
        t = i.cards[a] ? Af(i.cards[a]) : Ls(new Date()),
        n = qf.next(t, new Date(), e);
      (i.cards[a] = Yb(n.card)),
        (o = n.card.due),
        r && ((i.filaNovos = i.filaNovos.filter((l) => l !== a)), i.novosHoje.data !== ao() && (i.novosHoje = { data: ao(), n: 0 }), (i.novosHoje.n += 1)),
        (i.contadores.revisoes = (i.contadores.revisoes || 0) + 1),
        ne(2, i);
    }),
    Us(),
    o
  );
}
function jf() {
  const a = new Date();
  return (
    a.setDate(a.getDate() + 1),
    a.setHours(23, 59, 59),
    Object.values(ba.cards).filter((e) => {
      const o = new Date(e.due).getTime();
      return o > Date.now() && o <= a.getTime();
    }).length
  );
}
function zf(a) {
  (ba.lidos[a] && ba.ultimo === a) ||
    W((e) => {
      e.lidos[a] || ((e.lidos[a] = Date.now()), ne(10, e)), (e.ultimo = a);
    });
}
function Ef(a) {
  const e = Va.get(a);
  if (!e) return 0;
  let o = 0;
  return (
    W((i) => {
      i.estudados[a] || ((i.estudados[a] = Date.now()), ne(20, i)),
        (o = Ee(
          e.cartoes.map((r) => r.id),
          !1,
          i,
        ));
    }),
    Us(),
    o
  );
}
const mt = [
  { id: "primeiro-caso", nome: "Primeira consulta", desc: "Concluir o primeiro Paciente Virtual" },
  { id: "caso-90", nome: "Exame impecável", desc: "Tirar 90 ou mais num Paciente Virtual" },
  { id: "osce", nome: "Aprovado na estação", desc: "Concluir um caso no modo OSCE com 70 ou mais" },
  { id: "ouvido", nome: "Ouvido Absoluto", desc: "Acertar 10 sons seguidos no Estetoscópio" },
  { id: "detetive", nome: "Epônimo Ambulante", desc: "Acertar 10 sinais seguidos no Detetive" },
  { id: "sequencia", nome: "Mão na ordem", desc: "Fazer 5 sequências sem errar" },
  { id: "leitor", nome: "Rato de biblioteca", desc: "Ler 20 tópicos" },
  { id: "revisor", nome: "Memória de elefante", desc: "Fazer 200 revisões de cartões" },
  { id: "semana", nome: "Plantão de 7 dias", desc: "Estudar 7 dias seguidos" },
  { id: "todos-casos", nome: "Enfermaria completa", desc: "Concluir todos os casos disponíveis" },
  { id: "quadros-10", nome: "Quadro a quadro", desc: "Dominar 10 quadros do caderno" },
  { id: "area-fechada", nome: "Área fechada", desc: "Dominar todos os quadros de uma área do caderno" },
  { id: "ia-primeira", nome: "Primeiro plantão com IA", desc: "Concluir uma estação da Clínica IA" },
  { id: "ia-10", nome: "Residente digital", desc: "Concluir 10 estações da Clínica IA" },
  { id: "ia-nota10", nome: "Nota máxima", desc: "Tirar 9 ou mais numa estação da Clínica IA" },
  { id: "ia-sistemas", nome: "Clínico geral", desc: "Treinar 6 sistemas diferentes na Clínica IA" },
  { id: "ia-osce", nome: "Aprovado na prova prática", desc: "Média 7 ou mais num Circuito OSCE da Clínica IA" },
];
function Ia(a) {
  if (ba.conquistas[a]) return;
  const e = mt.find((o) => o.id === a);
  W((o) => {
    (o.conquistas[a] = Date.now()), ne(50, o);
  }),
    e && ca(`Conquista: ${e.nome} (+50 XP)`);
}
function _c(a, e = 1) {
  W((o) => {
    o.contadores[a] = (o.contadores[a] || 0) + e;
  });
}
function Us(a) {
  const e = ba;
  Object.keys(e.lidos).length >= 20 && Ia("leitor"),
    (e.contadores.revisoes || 0) >= 200 && Ia("revisor"),
    Ot(e.dias) >= 7 && Ia("semana"),
    a && Object.keys(e.casos).length >= a && Ia("todos-casos");
}
function If(a, e) {
  W((o) => {
    o.relatos.push({ id: String(Date.now()), alvo: a, texto: e, data: Date.now() });
  });
}
function yl() {
  return btoa(unescape(encodeURIComponent(JSON.stringify(ba))));
}
function Df(a) {
  try {
    const e = JSON.parse(decodeURIComponent(escape(atob(a.trim()))));
    return e.v !== 1
      ? !1
      : (W((o) => {
          Object.assign(o, ks(), e);
        }),
        !0);
  } catch (e) {
    return !1;
  }
}
function Tf() {
  W((a) => {
    Object.assign(a, ks(), { onboarded: !0, settings: a.settings });
  });
}
function Nf(a) {
  W((e) => {
    const o = e.quadros[a] || {};
    o.visto || ne(3, e), (o.visto = Date.now()), (e.quadros[a] = o);
  });
}
function Or(a) {
  var o;
  let e = !1;
  if (
    (W((i) => {
      const r = i.quadros[a] || {};
      r.dominado ? delete r.dominado : ((r.dominado = Date.now()), ne(15, i), (e = !0)), (r.visto = r.visto || Date.now()), (i.quadros[a] = r);
    }),
    e)
  ) {
    const i = ba;
    Object.values(i.quadros).filter((n) => n.dominado).length >= 10 && Ia("quadros-10");
    const t = (o = Ve.get(a)) == null ? void 0 : o.area;
    t &&
      ra.quadros
        .filter((n) => n.area === t)
        .every((n) => {
          var l;
          return (l = i.quadros[n.num]) == null ? void 0 : l.dominado;
        }) &&
      Ia("area-fechada");
  }
  return e;
}
const Mf = (a = 6) =>
  Object.entries(ba.quadros)
    .filter(([, e]) => e.visto && !e.dominado)
    .sort((e, o) => (e[1].visto || 0) - (o[1].visto || 0))
    .slice(0, a)
    .map(([e]) => e);
pb((a) => {
  var o;
  const e = (o = ba.cartoesUsuario) == null ? void 0 : o[a];
  return e ? { id: a, frente: ze(e.f), verso: ze(e.b), deck: `Clínica IA · ${se(e.s)}`, sistema: e.s, rota: e.o } : null;
});
function yf(a) {
  var o;
  W((i) => {
    const r = i.ia || { sessoes: [], stats: {} };
    r.sessoes = [a, ...r.sessoes.filter((d) => d.id !== a.id)].slice(0, 15).map((d, u) => {
      var m;
      return u < 4 ? d : { ...d, falas: void 0, resposta: (m = d.resposta) == null ? void 0 : m.slice(0, 800) };
    });
    const t = (r.stats[a.sistema] = r.stats[a.sistema] || {}),
      n = (t[a.modo] = t[a.modo] || { n: 0, soma: 0, melhor: 0 });
    (n.n += 1), (n.soma += a.nota), (n.melhor = Math.max(n.melhor, a.nota));
    const cp = (a.avaliacao && a.avaliacao.competencias) || {};
    r.comp = r.comp || {};
    for (const k of Object.keys(cp)) {
      if (typeof cp[k] != "number") continue;
      const c0 = r.comp[k] || { n: 0, soma: 0, ult: [] };
      (c0.n += 1), (c0.soma += cp[k]), (c0.ult = [...(c0.ult || []), cp[k]].slice(-8)), (r.comp[k] = c0);
    }
    (i.ia = r),
      (i.contadores.estacoes = (i.contadores.estacoes || 0) + 1),
      ne(Math.round(a.nota * 3) + 5, i);
    const l = i.stats[a.sistema] || { c: 0, t: 0, ema: 0.5 },
      c = a.nota >= 6;
    (l.c += c ? 1 : 0), (l.t += 1), (l.ema = l.ema * 0.85 + (c ? 0.15 : 0)), (i.stats[a.sistema] = l);
  });
  const e = ba;
  Ia("ia-primeira"),
    (e.contadores.estacoes || 0) >= 10 && Ia("ia-10"),
    a.nota >= 9 && Ia("ia-nota10"),
    Object.keys(((o = e.ia) == null ? void 0 : o.stats) || {}).length >= 6 && Ia("ia-sistemas");
}
function Rf(a) {
  W((e) => {
    var i;
    const o = (i = e.ia) == null ? void 0 : i.sessoes.find((r) => r.id === a);
    o && (o.cartoes = !0);
  });
}
function Of(a, e, o) {
  const i = Date.now().toString(36),
    r = a.map((t, n) => `u:${i}:${n}`);
  return (
    W((t) => {
      const n = { ...(t.cartoesUsuario || {}) };
      a.forEach((c, d) => {
        n[r[d]] = { f: c.frente, b: c.verso, s: e, o };
      });
      const l = Object.keys(n);
      if (l.length > 400) for (const c of l.slice(0, l.length - 400)) t.cards[c] || delete n[c];
      t.cartoesUsuario = n;
    }),
    Ee(r, !0)
  );
}
const ax = Object.freeze(
    Object.defineProperty(
      {
        __proto__: null,
        CONQUISTAS: mt,
        PATENTES: lo,
        Rating: H,
        adicionarCartoes: Ee,
        adicionarCartoesUsuario: Of,
        alternarDominado: Or,
        cartoesVencendoAmanha: jf,
        checarConquistas: Us,
        conquistar: Ia,
        contar: _c,
        estudarTopico: Ef,
        exportar: yl,
        filaRevisao: Qc,
        ganharXP: ne,
        get: Ya,
        importar: Df,
        lerTopico: zf,
        marcarErro: Ht,
        marcarSessaoComCartoes: Rf,
        onMudanca: xf,
        onToast: Xb,
        patente: Vc,
        pesoProgresso: Ml,
        previsoes: Pf,
        quadrosParaRevisar: Mf,
        registrar: Ft,
        registrarSessaoIA: yf,
        relatar: If,
        responder: Sf,
        sequencia: Ot,
        set: W,
        substituirEstado: Cf,
        toast: ca,
        useEstado: ea,
        verQuadro: Nf,
        zerar: Tf,
      },
      Symbol.toStringTag,
      { value: "Module" },
    ),
  ),
  Rl = new Set(),
  $c = () => Rl.forEach((a) => a());
