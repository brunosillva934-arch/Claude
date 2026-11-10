// Caderno de quadros.
function Kc() {
  return s.jsxs("p", { className: "muted small aviso-cad", children: [s.jsx(q, { n: "info", size: 14 }), " ", ra.aviso, " Fonte: ", ra.fonte, "."] });
}
function bx() {
  const a = ea((u) => u.quadros),
    [e, o] = S.useState(""),
    [i, r] = S.useState(!1),
    t = ra.quadros.length,
    n = Object.values(a).filter((u) => u.dominado).length,
    l = Object.values(a).filter((u) => u.visto).length,
    c = ge(e.trim()),
    d = S.useMemo(
      () =>
        c.length < 2
          ? []
          : ra.quadros.filter((u) => ge(`${u.num} ${u.titulo} ${u.colunas.join(" ")} ${u.linhas.map((m) => m[0]).join(" ")}`).includes(c)).slice(0, 40),
      [c],
    );
  return s.jsxs("div", {
    className: "page",
    children: [
      s.jsx(Q, { title: "Caderno de Quadros" }),
      s.jsxs("div", {
        className: "pad",
        children: [
          s.jsxs("div", {
            className: "card cad-hero",
            children: [
              s.jsxs("b", { children: [t, " quadros comparativos em ", ra.areas.length, " áreas"] }),
              s.jsx("p", { className: "small", children: "O que muda de uma situação para outra — do exame físico à prova de residência." }),
              s.jsxs("div", {
                className: "grid3",
                children: [
                  s.jsxs("div", { children: [s.jsx("b", { children: n }), s.jsx("small", { children: "dominados" })] }),
                  s.jsxs("div", { children: [s.jsx("b", { children: l }), s.jsx("small", { children: "vistos" })] }),
                  s.jsxs("div", { children: [s.jsx("b", { children: t - n }), s.jsx("small", { children: "a dominar" })] }),
                ],
              }),
              s.jsx(eo, { pct: n / t }),
            ],
          }),
          s.jsxs("button", { className: "linkbtn", onClick: () => r(!i), children: [s.jsx(q, { n: "info", size: 16 }), " Como estudar com o caderno"] }),
          i &&
            s.jsx("ol", {
              className: "metodo",
              children: ra.metodo.map((u, m) => s.jsxs("li", { children: [s.jsxs("b", { children: [u.titulo, "."] }), " ", u.texto] }, m)),
            }),
          s.jsx("input", { className: "input", placeholder: "Buscar quadro (ex.: icterícia, Light, Wells)", value: e, onChange: (u) => o(u.target.value) }),
        ],
      }),
      c.length >= 2
        ? s.jsxs("div", {
            className: "list",
            children: [
              d.map((u) => s.jsx(Jc, { q: u }, u.num)),
              !d.length &&
                s.jsxs("p", { className: "pad muted", children: ["Nenhum quadro com “", e, "”. A busca geral (lupa) procura também dentro das células."] }),
            ],
          })
        : s.jsx(w, {
            title: "Áreas",
            children: ra.areas.map((u) => {
              const m = Le(u.num),
                p = m.filter((f) => {
                  var h;
                  return (h = a[f.num]) == null ? void 0 : h.dominado;
                }).length;
              return s.jsx(
                B,
                {
                  href: `#/area/${u.num}`,
                  icon: s.jsx("span", { className: "num", children: u.num }),
                  title: u.titulo,
                  sub: s.jsxs(s.Fragment, {
                    children: [s.jsxs("span", { children: [m.length, " quadros · ", p, " dominados"] }), s.jsx(eo, { pct: p / m.length, cls: "thin" })],
                  }),
                },
                u.num,
              );
            }),
          }),
      s.jsx("div", { className: "pad", children: s.jsx(Kc, {}) }),
    ],
  });
}
function Jc({ q: a }) {
  const e = ea((o) => o.quadros[a.num]);
  return s.jsx(B, {
    href: `#/quadro/${a.num}`,
    icon: s.jsx("span", {
      className: "num " + (e != null && e.dominado ? "num-ok" : e != null && e.visto ? "num-read" : ""),
      children: e != null && e.dominado ? s.jsx(q, { n: "check", size: 16 }) : s.jsx("small", { children: a.num }),
    }),
    title: a.titulo,
    sub: `${a.linhas.length} linhas · ${a.colunas.length} colunas${a.semQuiz ? " · só leitura" : ""}`,
  });
}
function xx({ n: a }) {
  const e = Qi.get(a);
  if (!e)
    return s.jsxs("div", { className: "page", children: [s.jsx(Q, { title: "Área" }), s.jsx("p", { className: "pad", children: "Área não encontrada." })] });
  const o = Le(a);
  return s.jsxs("div", {
    className: "page",
    children: [
      s.jsx(Q, { title: `${e.num}. ${e.titulo}` }),
      s.jsxs("div", {
        className: "pad",
        children: [
          s.jsx("p", { className: "muted", children: e.intro }),
          s.jsxs("a", { className: "btn", href: `#/jogo/area/${a}`, children: [s.jsx(q, { n: "bolt", size: 18 }), " Simulado da área (15 questões)"] }),
          s.jsx(Uc, {
            children: s.jsxs("a", {
              className: "btn ghost mt",
              href: `#/jogo/ia/area/${a}`,
              children: [s.jsx(q, { n: "spark", size: 18 }), " Questões inéditas com o Claude"],
            }),
          }),
        ],
      }),
      s.jsx("div", { className: "list", children: o.map((i) => s.jsx(Jc, { q: i }, i.num)) }),
      s.jsx("div", { className: "pad", children: s.jsx(Kc, {}) }),
    ],
  });
}
function Cx({ num: a }) {
  const e = Za(),
    o = Ve.get(a),
    i = ea((C) => C.quadros[a]),
    [r, t] = S.useState(o != null && o.transposto ? "colunas" : "linhas"),
    [n, l] = S.useState(new Set());
  if (
    (S.useEffect(() => {
      o && Nf(o.num), l(new Set());
    }, [a]),
    !o)
  )
    return s.jsxs("div", {
      className: "page",
      children: [s.jsx(Q, { title: "Quadro" }), s.jsx("p", { className: "pad", children: "Quadro não encontrado." })],
    });
  const c = Qi.get(o.area),
    d = Le(o.area),
    u = d.findIndex((C) => C.num === o.num),
    m = d[u - 1],
    p = d[u + 1],
    f = Object.entries(ra.topicos)
      .filter(([, C]) => C.includes(o.num))
      .map(([C]) => Va.get(C))
      .filter(Boolean),
    h = Object.entries(ra.modulos)
      .filter(([, C]) => C.includes(o.num))
      .map(([C]) => Vi.get(C))
      .filter(Boolean),
    b = vu(o).length,
    z = (C) => (o.agrupado ? `${C[0]} — ${C[1]}` : C[o.rotulo]),
    g = o.colunas.map((C, P) => ({ c: C, i: P })).filter(({ i: C }) => C !== o.rotulo && !(o.agrupado && C <= 1)),
    x = (C) => l((P) => new Set(P).add(C)),
    v = o.linhas.length * g.length;
  return s.jsxs("div", {
    className: "page",
    children: [
      s.jsx(Q, {
        title: `Quadro ${o.num}`,
        right: s.jsx("button", {
          className: "iconbtn " + (i != null && i.dominado ? "fav" : ""),
          "aria-label": "Marcar como dominado",
          onClick: () => {
            const C = Or(o.num);
            ca(C ? "Quadro dominado (+15 XP)" : "Marcação removida");
          },
          children: s.jsx(q, { n: "check" }),
        }),
      }),
      s.jsxs("article", {
        className: "pad",
        children: [
          s.jsxs("div", {
            className: "chips",
            children: [
              s.jsx("a", { className: "chip link", href: `#/area/${o.area}`, children: c.titulo }),
              i != null && i.dominado ? s.jsx(Ta, { cls: "ok", children: "Dominado" }) : s.jsx(Ta, { cls: "soft", children: "Não dominado" }),
              o.semQuiz && s.jsx(Ta, { cls: "soft", children: "Só leitura" }),
            ],
          }),
          s.jsx("h1", { className: "t-title", children: o.titulo }),
          o.subtitulo && s.jsx("p", { className: "muted", children: s.jsx("i", { children: o.subtitulo }) }),
          s.jsx("div", {
            className: "seg seg-wrap",
            children: ["linhas", ...(o.colunas.length >= 3 ? ["colunas"] : []), "tabela", "recitar"].map((C) =>
              s.jsx(
                "button",
                {
                  className: r === C ? "on" : "",
                  onClick: () => {
                    t(C), l(new Set());
                  },
                  children: { linhas: "Por linha", colunas: "Por coluna", tabela: "Tabela", recitar: "Recitar" }[C],
                },
                C,
              ),
            ),
          }),
          r === "linhas" &&
            o.linhas.map((C, P) =>
              s.jsxs(
                "div",
                {
                  className: "card sind-card",
                  children: [
                    s.jsx("h3", { children: z(C) }),
                    s.jsx("dl", {
                      children: g.map(({ c: E, i: j }) =>
                        s.jsxs(vi.Fragment, { children: [s.jsx("dt", { children: E }), s.jsx("dd", { children: C[j] || "—" })] }, j),
                      ),
                    }),
                  ],
                },
                P,
              ),
            ),
          r === "colunas" &&
            o.colunas.map((C, P) =>
              P === o.rotulo || (o.agrupado && P <= 1)
                ? null
                : s.jsxs(
                    "div",
                    {
                      className: "card sind-card",
                      children: [
                        s.jsx("h3", { children: C }),
                        s.jsx("dl", {
                          children: o.linhas.map((E, j) =>
                            s.jsxs(vi.Fragment, { children: [s.jsx("dt", { children: z(E) }), s.jsx("dd", { children: E[P] || "—" })] }, j),
                          ),
                        }),
                      ],
                    },
                    P,
                  ),
            ),
          r === "tabela" &&
            s.jsx("div", {
              className: "table-wrap",
              children: s.jsxs("table", {
                className: "tbl",
                children: [
                  s.jsx("thead", { children: s.jsx("tr", { children: o.colunas.map((C, P) => s.jsx("th", { children: C }, P)) }) }),
                  s.jsx("tbody", {
                    children: o.linhas.map((C, P) =>
                      s.jsx("tr", { children: C.map((E, j) => (j === 0 ? s.jsx("th", { children: E }, j) : s.jsx("td", { children: E }, j))) }, P),
                    ),
                  }),
                ],
              }),
            }),
          r === "recitar" &&
            s.jsxs(s.Fragment, {
              children: [
                s.jsxs("div", {
                  className: "recite-bar",
                  children: [
                    s.jsxs("span", { className: "small muted", children: [n.size, " de ", v, " conferidas"] }),
                    s.jsx("button", {
                      className: "linkbtn small",
                      onClick: () => l(new Set(o.linhas.flatMap((C, P) => g.map(({ i: E }) => `${P}:${E}`)))),
                      children: "Revelar tudo",
                    }),
                    s.jsx("button", { className: "linkbtn small", onClick: () => l(new Set()), children: "Esconder" }),
                  ],
                }),
                s.jsx("p", { className: "muted small", children: "Diga em voz alta o que espera em cada célula e toque para conferir." }),
                o.linhas.map((C, P) =>
                  s.jsxs(
                    "div",
                    {
                      className: "card sind-card",
                      children: [
                        s.jsx("h3", { children: z(C) }),
                        s.jsx("dl", {
                          children: g.map(({ c: E, i: j }) => {
                            const A = `${P}:${j}`,
                              D = n.has(A);
                            return s.jsxs(
                              vi.Fragment,
                              {
                                children: [
                                  s.jsx("dt", { children: E }),
                                  s.jsx("dd", {
                                    children: D ? C[j] || "—" : s.jsx("button", { className: "oculto", onClick: () => x(A), children: "toque para ver" }),
                                  }),
                                ],
                              },
                              j,
                            );
                          }),
                        }),
                      ],
                    },
                    P,
                  ),
                ),
                n.size === v &&
                  !(i != null && i.dominado) &&
                  s.jsxs("div", {
                    className: "expl ok",
                    children: [
                      s.jsx("b", { children: "Conseguiu reproduzir o quadro de memória?" }),
                      s.jsx("button", {
                        className: "btn",
                        onClick: () => {
                          Or(o.num), ca("Quadro dominado (+15 XP)");
                        },
                        children: "Marcar como dominado",
                      }),
                    ],
                  }),
              ],
            }),
          o.nota &&
            s.jsxs("div", {
              className: "resumo",
              children: [s.jsx("b", { children: "Nota do quadro" }), s.jsx("p", { className: "nota-q", children: o.nota })],
            }),
          s.jsxs(w, {
            title: "Praticar",
            children: [
              o.semQuiz
                ? s.jsx("p", { className: "muted small", children: "Este quadro é uma lista paralela: estude no modo Tabela ou Recitar." })
                : s.jsxs(s.Fragment, {
                    children: [
                      s.jsx(B, {
                        href: `#/jogo/quadro/${o.num}`,
                        icon: s.jsx(q, { n: "puzzle" }),
                        title: "Gerar 10 questões deste quadro",
                        sub: "Cada erro vira um cartão com a linha e a coluna",
                      }),
                      s.jsx(B, {
                        icon: s.jsx(q, { n: "cards" }),
                        title: `Adicionar ${b} cartões à revisão`,
                        sub: "Entram na fila de cartões novos",
                        onClick: () => {
                          const C = Ee(vu(o));
                          ca(C ? `${C} cartões na fila de novos` : "Já estão na sua revisão");
                        },
                      }),
                    ],
                  }),
              s.jsx(B, {
                icon: s.jsx(q, { n: "check" }),
                title: i != null && i.dominado ? "Dominado — desmarcar" : "Marcar como dominado",
                sub: "Os não dominados voltam na aba Revisar",
                onClick: () => {
                  const C = Or(o.num);
                  ca(C ? "Quadro dominado (+15 XP)" : "Marcação removida");
                },
              }),
            ],
          }),
          e &&
            s.jsxs(w, {
              title: "Estudar com o Claude",
              children: [
                s.jsx(we, {
                  contexto: () => hi(o, 8e3),
                  sugestoes: [
                    "Qual a diferença-chave entre as linhas?",
                    "Crie um mnemônico para este quadro",
                    "Monte um caso clínico com uma das linhas",
                    "Quais linhas mais se confundem?",
                  ],
                }),
                s.jsx(we, { arguicao: !0, perguntas: 4, titulo: "Arguição sobre este quadro", contexto: () => hi(o, 8e3) }),
                !o.semQuiz &&
                  s.jsx(B, {
                    href: `#/jogo/ia/quadro/${o.num}`,
                    icon: s.jsx(q, { n: "spark" }),
                    title: "Questões inéditas com vinheta clínica",
                    sub: "O Claude escreve; os erros viram cartões da linha testada",
                  }),
              ],
            }),
          (f.length > 0 || h.length > 0) &&
            s.jsxs(w, {
              title: "No SemioQuest",
              children: [
                f.map((C) => s.jsx(B, { href: `#/topico/${C.id}`, icon: s.jsx(q, { n: "book" }), title: C.titulo, sub: "Tópico relacionado" }, C.id)),
                h
                  .filter((C) => !f.length)
                  .map((C) =>
                    s.jsx(
                      B,
                      { href: `#/modulo/${C.id}`, icon: s.jsx("span", { className: "num", children: C.num }), title: C.titulo, sub: "Módulo relacionado" },
                      C.id,
                    ),
                  ),
              ],
            }),
          s.jsx(Kc, {}),
          s.jsxs("p", { className: "muted small", children: ["Página ", o.pagina, " do caderno original."] }),
          s.jsx("div", { className: "t-foot", children: s.jsx(_i, { alvo: `Quadro ${o.num}: ${o.titulo}` }) }),
          s.jsxs("div", {
            className: "prevnext",
            children: [
              m ? s.jsxs("a", { href: `#/quadro/${m.num}`, children: [s.jsx(q, { n: "back", size: 16 }), " ", m.num, " ", m.titulo] }) : s.jsx("span", {}),
              p ? s.jsxs("a", { href: `#/quadro/${p.num}`, children: [p.num, " ", p.titulo, " ", s.jsx(q, { n: "right", size: 16 })] }) : s.jsx("span", {}),
            ],
          }),
        ],
      }),
    ],
  });
}
function Yf({ lista: a, titulo: e = "Quadros do caderno" }) {
  return a.length ? s.jsx(w, { title: e, children: a.map((o) => s.jsx(Jc, { q: o }, o.num)) }) : null;
}
