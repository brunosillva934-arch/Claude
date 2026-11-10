// Estetoscópio, Detetive, Sequência, Monte a Síndrome, Desafio e simulados.
function S1({ modo: a }) {
  const [e, o] = S.useState(null),
    [i, r] = S.useState(0),
    t = S.useMemo(() => (e ? P1(e.cat, e.nivel) : []), [e, i]);
  return e
    ? s.jsx(
        Xo,
        {
          titulo: "Estetoscópio",
          sairHref: "#/jogar",
          questoes: t,
          novo: () => r((n) => n + 1),
          onFim: (n, l, c) => {
            c >= 10 && Ia("ouvido");
          },
        },
        i,
      )
    : s.jsxs("div", {
        className: "page",
        children: [
          s.jsx(Q, { title: "Estetoscópio" }),
          s.jsxs("div", {
            className: "pad",
            children: [
              s.jsxs("div", {
                className: "card soft",
                children: [
                  s.jsx(q, { n: "ear" }),
                  " ",
                  s.jsx("b", { children: "Use fones de ouvido." }),
                  s.jsx("p", {
                    className: "small",
                    children: "Os sons são sintetizados para treinar padrão e tempo. Graves como B3, B4 e o ruflar quase somem no alto-falante do celular.",
                  }),
                ],
              }),
              s.jsx(w, {
                title: "O que treinar",
                children: [
                  ["cardiaco", "Sons cardíacos", "heart"],
                  ["pulmonar", "Sons pulmonares", "lungs"],
                  ["misto", "Misturado", "steth"],
                ].map(([n, l, c]) =>
                  s.jsxs(
                    "div",
                    {
                      className: "card",
                      children: [
                        s.jsxs("div", { className: "row-flat", children: [s.jsx(q, { n: c }), s.jsx("b", { children: l })] }),
                        s.jsx("div", {
                          className: "btns",
                          children: [1, 2, 3].map((d) =>
                            s.jsx(
                              "button",
                              {
                                className: "btn " + (d > 1 ? "ghost" : ""),
                                onClick: () => o({ cat: n, nivel: d }),
                                children: ["Básico", "Intermediário", "Avançado"][d - 1],
                              },
                              d,
                            ),
                          ),
                        }),
                      ],
                    },
                    n,
                  ),
                ),
              }),
              s.jsxs("a", { className: "btn ghost", href: "#/sons", children: [s.jsx(q, { n: "list", size: 18 }), " Ouvir o Banco de Sons"] }),
            ],
          }),
        ],
      });
}
function rg(a, e, o, i = Math.random) {
  const r = O.sinais.filter((d) => d.id !== a.id),
    t = r.filter((d) => d.sistema === a.sistema),
    n = t.length >= 3 ? t : r;
  if (e === "nome") {
    const d = X(n, i)
      .slice(0, 3)
      .map((u) => u.nome);
    return {
      id: a.id + o,
      sistema: a.sistema,
      item: "sinal:" + a.id,
      cartoes: [`sinal:${a.id}:b`],
      enunciado: s.jsxs(s.Fragment, {
        children: [
          s.jsx("b", { children: "Qual é o sinal?" }),
          s.jsx("p", { dangerouslySetInnerHTML: { __html: `${a.tecnica} <b>Positivo:</b> ${a.positivo}` } }),
          s.jsx("small", { className: "muted", children: se(a.sistema) }),
        ],
      }),
      opcoes: X([a.nome, ...d], i),
      correta: a.nome,
      explicacao: `<p><b>${a.nome}</b> — sugere ${a.sugere.charAt(0).toLowerCase() + a.sugere.slice(1)}.</p>${a.significado ? `<p>${a.significado}</p>` : ""}`,
      link: { href: `#/sinal/${a.id}`, txt: "Ficha do sinal" },
    };
  }
  let l = Array.from(new Set(n.map((d) => d.sugere).filter((d) => !Dl(d, a.sugere))));
  l.length < 3 && (l = Array.from(new Set(r.map((d) => d.sugere).filter((d) => !Dl(d, a.sugere)))));
  const c = X(l, i).slice(0, 3);
  return {
    id: a.id + o,
    sistema: a.sistema,
    item: "sinal:" + a.id,
    cartoes: [`sinal:${a.id}:a`],
    enunciado: s.jsxs(s.Fragment, {
      children: [
        s.jsxs("b", { children: ["O que sugere o ", a.nome.charAt(0).toLowerCase() + a.nome.slice(1), "?"] }),
        s.jsxs("small", { className: "muted", children: [" ", se(a.sistema)] }),
      ],
    }),
    opcoes: X([a.sugere, ...c], i),
    correta: a.sugere,
    explicacao: `<p>${a.tecnica} <b>Positivo:</b> ${a.positivo}</p>${a.significado ? `<p>${a.significado}</p>` : ""}`,
    link: { href: `#/sinal/${a.id}`, txt: "Ficha do sinal" },
  };
}
function j1({ modo: a }) {
  const [e, o] = S.useState(0),
    i = a === "relampago",
    r = i ? 60 : 10,
    t = S.useMemo(
      () =>
        X(O.sinais)
          .slice(0, r)
          .map((n, l) => rg(n, Math.random() < 0.5 ? "nome" : "sugere", l + e * 100)),
      [e, r],
    );
  return s.jsx(
    Xo,
    {
      titulo: i ? "Relâmpago" : "Detetive de Sinais",
      questoes: t,
      limiteSeg: i ? 60 : void 0,
      novo: () => o((n) => n + 1),
      onFim: (n, l, c) => {
        c >= 10 && Ia("detetive");
      },
    },
    e,
  );
}
function z1({ id: a }) {
  return a
    ? s.jsx(E1, { id: a }, a)
    : s.jsxs("div", {
        className: "page",
        children: [
          s.jsx(Q, { title: "Sequência Certa" }),
          s.jsx("p", { className: "pad muted", children: "Toque nas etapas na ordem em que você as faria. Cada erro conta, e no fim você vê a explicação." }),
          s.jsx("div", {
            className: "list",
            children: O.sequencias.map((e) =>
              s.jsx(
                B,
                { href: `#/jogo/sequencia/${e.id}`, icon: s.jsx(q, { n: "list" }), title: e.titulo, sub: `${e.passos.length} etapas · ${se(e.sistema)}` },
                e.id,
              ),
            ),
          }),
        ],
      });
}
function E1({ id: a }) {
  const e = ub.get(a),
    [o, i] = S.useState(0),
    r = S.useMemo(() => {
      let b = X(e.passos);
      return b.join() === e.passos.join() && (b = b.reverse()), b;
    }, [a, o]),
    [t, n] = S.useState([]),
    [l, c] = S.useState(0),
    [d, u] = S.useState(null),
    m = t.length === e.passos.length,
    p = (b) => {
      if (!(m || t.includes(b)))
        if (b === e.passos[t.length]) {
          const z = [...t, b];
          n(z),
            u(null),
            z.length === e.passos.length &&
              (Ft(e.sistema, l === 0, "seq:" + e.id),
              l > 0 ? Ht(["seq:" + e.id]) : Ee(["seq:" + e.id]),
              l === 0 && (_c("seqPerfeitas"), (Ya().contadores.seqPerfeitas || 0) >= 5 && Ia("sequencia")));
        } else c((z) => z + 1), u(b), setTimeout(() => u(null), 600);
    },
    f = O.sequencias.findIndex((b) => b.id === a),
    h = O.sequencias[(f + 1) % O.sequencias.length];
  return s.jsxs("div", {
    className: "page game",
    children: [
      s.jsxs("header", {
        className: "game-top",
        children: [
          s.jsx("a", { className: "iconbtn", href: "#/jogo/sequencia", "aria-label": "Sair", children: s.jsx(q, { n: "x" }) }),
          s.jsxs("div", {
            className: "game-title",
            children: [
              s.jsx("b", { children: "Sequência Certa" }),
              s.jsxs("small", { children: [t.length, "/", e.passos.length, " · ", l, " erro", l === 1 ? "" : "s"] }),
            ],
          }),
          s.jsx("span", {}),
        ],
      }),
      s.jsxs("div", {
        className: "pad",
        children: [
          s.jsx("h2", { className: "t-title small", children: e.titulo }),
          s.jsx("p", { className: "muted", children: e.contexto }),
          s.jsx("ol", { className: "seq-feitos", children: t.map((b) => s.jsx("li", { children: b }, b)) }),
          !m &&
            s.jsx("div", {
              className: "seq-opcoes",
              children: r
                .filter((b) => !t.includes(b))
                .map((b) => s.jsx("button", { className: "opcao " + (d === b ? "shake errada" : ""), onClick: () => p(b), children: b }, b)),
            }),
          m &&
            s.jsxs("div", {
              className: "expl " + (l === 0 ? "ok" : "bad"),
              children: [
                s.jsx("b", { children: l === 0 ? "Sequência perfeita!" : `Concluída com ${l} erro${l === 1 ? "" : "s"}.` }),
                s.jsx(Ba, { html: e.explicacao }),
                s.jsxs("div", {
                  className: "btns",
                  children: [
                    s.jsx("button", {
                      className: "btn ghost",
                      onClick: () => {
                        n([]), c(0), i((b) => b + 1);
                      },
                      children: "Repetir",
                    }),
                    s.jsx("a", { className: "btn", href: `#/jogo/sequencia/${h.id}`, children: "Próxima" }),
                  ],
                }),
              ],
            }),
        ],
      }),
    ],
  });
}
function ad(a, e, o = Math.random, i) {
  const r = i || ((c, d) => `sind:${a.id}:${Mr(c)}:${d}`),
    t = [],
    n = a.linhas.filter((c) => a.colunas.some((d) => c.valores[d.id]));
  if (n.length < 2) return t;
  let l = 0;
  for (let c = 0; c < e && l < 200; c++) {
    l++;
    const d = n[Math.floor(o() * n.length)],
      u = a.colunas.filter((f) => d.valores[f.id]),
      m = `<dl class="mini-dl">${u.map((f) => `<dt>${ze(f.nome)}</dt><dd>${ze(d.valores[f.id])}</dd>`).join("")}</dl>`,
      p = n.filter((f) => f.nome !== d.nome);
    if (c % 2 === 0 || l > 40) {
      const f = X(u, o).slice(0, Math.min(u.length, 3));
      if (!f.length || p.length < 1) {
        c--;
        continue;
      }
      t.push({
        id: `${a.id}-${c}-${l}`,
        sistema: a.sistema,
        item: `${a.id}:${Mr(d.nome)}`,
        cartoes: u.map((h) => r(d.nome, h.id)).filter(Boolean),
        enunciado: s.jsxs(s.Fragment, {
          children: [
            s.jsx("b", { children: "Qual destas combina com os achados?" }),
            s.jsx("dl", {
              className: "mini-dl",
              children: f.map((h) => s.jsxs(vi.Fragment, { children: [s.jsx("dt", { children: h.nome }), s.jsx("dd", { children: d.valores[h.id] })] }, h.id)),
            }),
            s.jsx("small", { className: "muted", children: a.titulo }),
          ],
        }),
        opcoes: X(
          [
            d.nome,
            ...X(
              p.map((h) => h.nome),
              o,
            ).slice(0, 3),
          ],
          o,
        ),
        correta: d.nome,
        explicacao: `<p><b>${ze(d.nome)}</b></p>${m}${d.nota ? `<p>${ze(d.nota)}</p>` : ""}`,
        link: { href: Ou(a.id), txt: "Ver o quadro completo" },
      });
    } else {
      if (!u.length) {
        c--;
        continue;
      }
      const f = u[Math.floor(o() * u.length)],
        h = d.valores[f.id],
        b = Array.from(new Set(p.map((g) => g.valores[f.id]).filter(Boolean))).filter((g) => g !== h && !Dl(g, h));
      if (b.length < 2) {
        c--;
        continue;
      }
      const z = X(b, o).slice(0, 3);
      t.push({
        id: `${a.id}-${c}-${l}`,
        sistema: a.sistema,
        item: `${a.id}:${Mr(d.nome)}`,
        cartoes: [r(d.nome, f.id)].filter(Boolean),
        enunciado: s.jsxs(s.Fragment, {
          children: [
            s.jsx("b", { children: d.nome }),
            s.jsxs("p", { children: ["Como está: ", s.jsx("b", { children: f.nome.toLowerCase() }), "?"] }),
            s.jsx("small", { className: "muted", children: a.titulo }),
          ],
        }),
        opcoes: X([h, ...z], o),
        correta: h,
        explicacao: m,
        link: { href: Ou(a.id), txt: "Ver o quadro completo" },
      });
    }
  }
  return t;
}
const Ou = (a) => (a.startsWith("q") && /^q\d/.test(a) ? `#/quadro/${a.slice(1)}` : `#/sindrome/${a}`);
function I1({ id: a }) {
  const [e, o] = S.useState(0),
    i = a ? rf.get(a) : null,
    r = S.useMemo(() => (i ? ad(i, 8) : []), [a, e]);
  return i
    ? s.jsx(Xo, { titulo: i.titulo, questoes: r, sairHref: "#/jogo/sindrome", novo: () => o((t) => t + 1) }, e)
    : s.jsxs("div", {
        className: "page",
        children: [
          s.jsx(Q, { title: "Monte a Síndrome" }),
          s.jsx("p", {
            className: "pad muted",
            children: "Escolha uma tabela. As perguntas alternam entre “quais achados → qual síndrome” e “qual síndrome → qual achado”.",
          }),
          s.jsx("div", {
            className: "list",
            children: O.sindromes.map((t) =>
              s.jsx(
                B,
                { href: `#/jogo/sindrome/${t.id}`, icon: s.jsx(q, { n: "puzzle" }), title: t.titulo, sub: `${t.linhas.length} itens · ${se(t.sistema)}` },
                t.id,
              ),
            ),
          }),
        ],
      });
}
function ed(a, e, o = Math.random) {
  const i = Ve.get(a);
  if (!i) return [];
  const r = Nt(i);
  if (!r) return [];
  const t = r.linhas.reduce((n, l) => n + Object.keys(l.valores).length, 0);
  return ad(r, Math.min(e, Math.max(4, t)), o, r.cartao);
}
const D1 = () => ra.quadros.filter((a) => !a.semQuiz && Nt(a));
function T1({ num: a }) {
  const [e, o] = S.useState(0),
    i = S.useMemo(() => (a === "aleatorio" ? X(D1())[0].num : a), [a, e]),
    r = Ve.get(i),
    t = S.useMemo(() => ed(i, 10), [i, e]);
  return !r || !t.length
    ? s.jsxs("div", {
        className: "page",
        children: [s.jsx(Q, { title: "Quadro" }), s.jsx("p", { className: "pad", children: "Este quadro não gera questões." })],
      })
    : s.jsx(Xo, { titulo: `Quadro ${r.num}`, questoes: t, sairHref: `#/quadro/${r.num}`, novo: () => o((n) => n + 1) }, i + e);
}
function Fu({ n: a }) {
  const [e, o] = S.useState(0),
    i = a ? Qi.get(Number(a)) : null,
    r = S.useMemo(() => {
      if (!i) return [];
      const t = X(Le(i.num).filter((c) => !c.semQuiz && Nt(c))),
        n = [];
      let l = 0;
      for (; n.length < 15 && t.length && l < 60; ) {
        const c = t[l % t.length];
        n.push(...ed(c.num, 1)), l++;
      }
      return n.slice(0, 15);
    }, [a, e]);
  return i
    ? s.jsx(Xo, { titulo: `Simulado · ${i.titulo}`, questoes: r, sairHref: `#/area/${i.num}`, novo: () => o((t) => t + 1) }, e)
    : s.jsxs("div", {
        className: "page",
        children: [
          s.jsx(Q, { title: "Simulado por área" }),
          s.jsx("p", { className: "pad muted", children: "15 questões tiradas de quadros diferentes da área. Os erros viram cartões de revisão." }),
          s.jsx("div", {
            className: "list",
            children: ra.areas.map((t) =>
              s.jsx(
                B,
                {
                  href: `#/jogo/area/${t.num}`,
                  icon: s.jsx("span", { className: "num", children: t.num }),
                  title: t.titulo,
                  sub: `${Le(t.num).length} quadros`,
                },
                t.num,
              ),
            ),
          }),
        ],
      });
}
function N1() {
  var o;
  const a = ((o = Ya().desafio) == null ? void 0 : o.data) === ao(),
    e = S.useMemo(() => {
      const i = Jo(vb()),
        r = [];
      return (
        X(O.sinais, i)
          .slice(0, 2)
          .forEach((d, u) => r.push(rg(d, u === 0 ? "nome" : "sugere", u, i))),
        X(O.sindromes, i)
          .slice(0, 1)
          .forEach((d) => r.push(ad(d, 1, i)[0])),
        X(
          ra.quadros.filter((d) => !d.semQuiz && Nt(d)),
          i,
        )
          .slice(0, 2)
          .forEach((d) => {
            const u = ed(d.num, 1, i)[0];
            u && r.push(u);
          }),
        X(
          O.sons.filter((d) => (d.nivel || 1) <= 2),
          i,
        )
          .slice(0, 1)
          .forEach((d, u) => {
            const m = X(
              O.sons.filter((p) => p.categoria === d.categoria && p.id !== d.id),
              i,
            )
              .slice(0, 3)
              .map((p) => p.nome);
            r.push({
              id: "som" + u,
              enunciado: s.jsx("b", { children: "Que som é este?" }),
              opcoes: X([d.nome, ...m], i),
              correta: d.nome,
              som: d.id,
              explicacao: `<p><b>${d.nome}.</b> ${d.descricao}</p>`,
              sistema: d.categoria === "cardiaco" ? "cardiovascular" : "respiratorio",
              item: "som:" + d.id,
              cartoes: ["som:" + d.id],
            });
          }),
        X(r, i)
      );
    }, []);
  return a
    ? s.jsxs("div", {
        className: "page",
        children: [
          s.jsx(Q, { title: "Desafio do Dia" }),
          s.jsxs("div", {
            className: "pad center",
            children: [
              s.jsxs("div", {
                className: "score ok",
                children: [
                  s.jsx("b", { children: Ya().desafio.acertos }),
                  s.jsx("span", { children: "de 6" }),
                  s.jsx("small", { children: "Desafio de hoje concluído" }),
                ],
              }),
              s.jsx("p", { className: "muted", children: "Volte amanhã para um novo desafio. Enquanto isso:" }),
              s.jsxs("a", { className: "btn", href: "#/revisar", children: [s.jsx(q, { n: "cards", size: 18 }), " Revisar cartões"] }),
            ],
          }),
        ],
      })
    : s.jsx(Xo, {
        titulo: "Desafio do Dia",
        questoes: e,
        sairHref: "#/",
        onFim: (i) => {
          W((r) => {
            (r.desafio = { data: ao(), acertos: i }), ne(30, r);
          });
        },
      });
}
const Hu = [
  "Escolhendo o paciente…",
  "Escrevendo a história clínica…",
  "Calibrando os sinais vitais…",
  "Posicionando os achados no exame…",
  "Conferindo a coerência do caso…",
  "Preparando a síntese…",
];
function M1({ sis0: a }) {
  const e = Za(),
    o = ea((C) => C.casosIA || []),
    [i, r] = S.useState(a && Bl.some((C) => C.id === a) ? a : "surpresa"),
    [t, n] = S.useState("Intermediário"),
    [l, c] = S.useState(""),
    [d, u] = S.useState(!1),
    [m, p] = S.useState(!1),
    [f, h] = S.useState(0),
    [b, z] = S.useState(null),
    g = S.useRef(null);
  S.useEffect(
    () => () => {
      var C;
      return (C = g.current) == null ? void 0 : C.abort();
    },
    [],
  ),
    S.useEffect(() => {
      if (!m) return;
      const C = setInterval(() => h((P) => (P + 1) % Hu.length), 4500);
      return () => clearInterval(C);
    }, [m]);
  const x = async () => {
      p(!0), z(null), h(0), (g.current = new AbortController());
      try {
        const C = [...O.casos.map((E) => `${E.titulo} (${E.sintese.hipotese.correta})`), ...o.map((E) => `${E.titulo} (${E.sintese.hipotese.correta})`)],
          P = await d1({ sistema: i, nivel: t, tema: l, evitar: C }, g.current.signal);
        W((E) => {
          (E.casosIA = [P, ...(E.casosIA || [])].slice(0, 8)), (E.contadores.gerados = (E.contadores.gerados || 0) + 1);
        }),
          pt(`#/jogo/caso/${P.id}${d ? "?osce=1" : ""}`);
      } catch (C) {
        C.code !== "aborted" && z(C.message);
      } finally {
        p(!1), (g.current = null);
      }
    },
    v = (C) => {
      W((P) => {
        P.casosIA = (P.casosIA || []).filter((E) => E.id !== C);
      }),
        ca("Paciente removido");
    };
  return e
    ? s.jsxs("div", {
        className: "page",
        children: [
          s.jsx(Q, { title: "Paciente inédito" }),
          s.jsxs("div", {
            className: "pad",
            children: [
              s.jsxs("div", {
                className: "card soft ia-intro",
                children: [
                  s.jsx(q, { n: "spark", size: 22 }),
                  s.jsx("p", {
                    className: "small",
                    children:
                      "O Claude cria um paciente novo — história, sinais vitais e achados de exame coerentes — usando as manobras e os sons do app. Você conversa com ele, examina e faz a síntese como nos casos prontos.",
                  }),
                ],
              }),
              s.jsx("h3", { className: "sub-h", children: "Sistema" }),
              s.jsx("div", {
                className: "chips wrap",
                children: Bl.map((C) =>
                  s.jsx("button", { className: "chip " + (i === C.id ? "sel" : ""), onClick: () => r(C.id), disabled: m, children: C.nome }, C.id),
                ),
              }),
              s.jsx("h3", { className: "sub-h", children: "Dificuldade" }),
              s.jsx("div", {
                className: "seg full",
                children: t1.map((C) => s.jsx("button", { className: t === C ? "on" : "", onClick: () => n(C), disabled: m, children: C }, C)),
              }),
              s.jsx("h3", { className: "sub-h", children: "Tema (opcional)" }),
              s.jsx("input", {
                className: "input",
                value: l,
                maxLength: 120,
                disabled: m,
                onChange: (C) => c(C.target.value),
                placeholder: "Ex.: dor torácica em idosa, sopro em jovem, edema de MMII…",
              }),
              s.jsxs("label", {
                className: "toggle mt",
                children: [
                  s.jsx("input", { type: "checkbox", checked: d, onChange: (C) => u(C.target.checked), disabled: m }),
                  s.jsx("span", { children: "Atender no modo OSCE (10 minutos)" }),
                ],
              }),
              b && s.jsx("div", { className: "ia-erro", children: b }),
              m
                ? s.jsxs("div", {
                    className: "gerando",
                    children: [
                      s.jsx("div", { className: "pulso", children: s.jsx(q, { n: "body", size: 30 }) }),
                      s.jsx("b", { children: Hu[f] }),
                      s.jsx("small", { className: "muted", children: "Costuma levar de 20 a 60 segundos." }),
                      s.jsx("button", {
                        className: "btn ghost",
                        onClick: () => {
                          var C;
                          return (C = g.current) == null ? void 0 : C.abort();
                        },
                        children: "Cancelar",
                      }),
                    ],
                  })
                : s.jsxs("button", { className: "btn", onClick: x, children: [s.jsx(q, { n: "spark", size: 18 }), " Gerar paciente"] }),
              s.jsx("p", {
                className: "ia-nota",
                children: "Casos gerados por IA são para treino e podem ter imprecisões. Os casos prontos do app foram revisados.",
              }),
            ],
          }),
          o.length > 0 &&
            s.jsxs(w, {
              title: "Seus pacientes gerados",
              children: [
                o.map((C) =>
                  s.jsx(
                    B,
                    {
                      href: `#/jogo/caso/${C.id}`,
                      icon: s.jsx(q, { n: "body" }),
                      title: C.titulo,
                      sub: C.queixa,
                      right: s.jsxs("span", {
                        className: "row-acts",
                        children: [
                          s.jsx(Ta, { cls: "soft", children: "IA" }),
                          s.jsx("button", {
                            className: "iconbtn",
                            "aria-label": "Remover",
                            onClick: (P) => {
                              P.preventDefault(), P.stopPropagation(), v(C.id);
                            },
                            children: s.jsx(q, { n: "x", size: 16 }),
                          }),
                        ],
                      }),
                    },
                    C.id,
                  ),
                ),
                s.jsxs("p", { className: "muted small pad-x", children: ["Os últimos 8 ficam salvos", " ", "na sua conta."] }),
              ],
            }),
        ],
      })
    : s.jsxs("div", {
        className: "page",
        children: [
          s.jsx(Q, { title: "Paciente inédito" }),
          s.jsx("div", {
            className: "pad",
            children: s.jsxs("div", {
              className: "card soft",
              children: [
                s.jsx("b", { children: "Recurso da versão online" }),
                s.jsx("p", {
                  className: "small",
                  children:
                    "Gerar pacientes novos usa a IA do Claude, disponível quando o SemioQuest é aberto como artefato no Claude com a IA autorizada. Os 13 casos prontos continuam em Jogar.",
                }),
              ],
            }),
          }),
        ],
      });
}
