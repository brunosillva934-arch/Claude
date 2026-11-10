// Tela inicial e motor de quiz.
function Uc({ children: a }) {
  return Za() ? s.jsx(s.Fragment, { children: a }) : null;
}
const hx = (a) => {
  if (!a) return "";
  const e = Math.round((Date.now() - a) / 1e3);
  return e < 10
    ? "agora"
    : e < 60
      ? `há ${e} s`
      : e < 3600
        ? `há ${Math.round(e / 60)} min`
        : `às ${new Date(a).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
};
function Jf({ compacto: a = !1 }) {
  const e = Qf();
  if (e.modo === "off") return null;
  const o =
      e.modo === "conectando"
        ? "Conectando à sua conta…"
        : e.modo === "salvando"
          ? "Salvando na sua conta…"
          : e.modo === "ok"
            ? `Progresso salvo na sua conta${e.quando ? " · " + hx(e.quando) : ""}`
            : e.msg || "Progresso salvo só neste navegador.",
    i = e.modo === "ok" || e.modo === "salvando" ? "ok" : e.modo === "conectando" ? "" : "warn";
  return a
    ? s.jsxs("p", { className: "nuvem " + i, children: [s.jsx(q, { n: "cloud", size: 15 }), " ", o] })
    : s.jsxs("div", {
        className: "card nuvem-card " + i,
        children: [
          s.jsx(q, { n: "cloud", size: 22 }),
          s.jsxs("div", {
            children: [
              s.jsx("b", { children: o }),
              s.jsx("small", {
                children:
                  e.modo === "ok" || e.modo === "salvando"
                    ? "Abra este artefato em qualquer aparelho com a mesma conta e continue de onde parou. Só você vê seus dados."
                    : "Quando a conta estiver disponível, o progresso volta a ser salvo nela automaticamente.",
              }),
            ],
          }),
        ],
      });
}
function zu() {
  var u, m, p, f, h;
  const a = ea((b) => b),
    e = Vc(a.xp),
    o = Ot(a.dias),
    i = Qc(),
    r = ((u = a.desafio) == null ? void 0 : u.data) === ao(),
    t = a.ultimo ? Va.get(a.ultimo) : null,
    n = Object.entries(a.itens)
      .filter(([, b]) => b.t >= 3 && b.c / b.t < 0.6)
      .sort((b, z) => b[1].c / b[1].t - z[1].c / z[1].t);
  let l = null;
  if (n.length) {
    const [b, z] = n[0],
      [g, x] = b.split(":"),
      v = g.startsWith("q") && /^q\d/.test(g) ? g.slice(1) : "",
      C =
        g === "sinal"
          ? (m = Hc.get(x)) == null
            ? void 0
            : m.nome
          : g === "som"
            ? (p = Gs.get(x)) == null
              ? void 0
              : p.nome
            : v
              ? `Quadro ${v} · ${(f = Ve.get(v)) == null ? void 0 : f.titulo}`
              : null;
    C &&
      (l = {
        titulo: C,
        sub: `Você acertou ${Math.round((z.c / z.t) * 100)}% das vezes`,
        href: g === "sinal" ? `#/sinal/${x}` : g === "som" ? `#/som/${x}` : v ? `#/quadro/${v}` : "#/jogar",
      });
  }
  const c = new Date().getHours(),
    d = c < 12 ? "Bom dia" : c < 18 ? "Boa tarde" : "Boa noite";
  return s.jsxs("div", {
    className: "page",
    children: [
      s.jsxs("header", {
        className: "hero",
        children: [
          s.jsxs("div", {
            className: "hero-top",
            children: [
              s.jsxs("div", { children: [s.jsxs("small", { children: [d, "!"] }), s.jsx("h1", { children: e.atual.nome })] }),
              s.jsxs("a", {
                className: "streak",
                href: "#/perfil",
                "aria-label": "Sequência de dias",
                children: [s.jsx(q, { n: "flame", size: 20 }), " ", o, " ", o === 1 ? "dia" : "dias"],
              }),
            ],
          }),
          s.jsx(eo, { pct: e.pct, cls: "light" }),
          s.jsxs("small", {
            className: "hero-xp",
            children: [a.xp, " XP", e.prox ? ` · faltam ${e.prox.xp - a.xp} para ${e.prox.nome}` : " · patente máxima"],
          }),
          s.jsxs("a", { className: "hero-search", href: "#/busca", children: [s.jsx(q, { n: "search", size: 18 }), " Buscar sinal, sopro, manobra…"] }),
        ],
      }),
      s.jsxs("div", {
        className: "grid2",
        children: [
          s.jsxs("a", {
            className: "tile " + (i.vencidos.length + i.novos.length ? "tile-hot" : ""),
            href: "#/revisar",
            children: [
              s.jsx(q, { n: "cards" }),
              s.jsx("b", { children: i.vencidos.length + i.novos.length }),
              s.jsx("span", { children: "cartões para hoje" }),
            ],
          }),
          s.jsxs("a", {
            className: "tile " + (r ? "tile-done" : "tile-accent"),
            href: "#/jogo/desafio",
            children: [
              s.jsx(q, { n: r ? "check" : "bolt" }),
              s.jsx("b", { children: r ? `${a.desafio.acertos}/6` : "Desafio" }),
              s.jsx("span", { children: r ? "desafio de hoje feito" : "do dia · 6 questões" }),
            ],
          }),
        ],
      }),
      s.jsx(Uc, {
        children: s.jsxs(w, {
          title: "Com a IA do Claude",
          children: [
            s.jsxs("a", {
              className: "clin-banner",
              href: "#/ia",
              children: [
                s.jsx("span", { className: "ia-ic big", children: s.jsx(q, { n: "spark", size: 24 }) }),
                s.jsxs("span", {
                  children: [
                    s.jsx("b", { children: "Clínica IA" }),
                    s.jsx("small", { children: "Treine anamnese e exame físico por sistema, com correção na hora" }),
                  ],
                }),
                s.jsx(q, { n: "right", size: 18 }),
              ],
            }),
            s.jsxs("div", {
              className: "cards-h",
              children: [
                s.jsxs("a", {
                  className: "mini ia",
                  href: "#/ia/preceptor",
                  children: [s.jsx(q, { n: "grad" }), s.jsx("b", { children: "Preceptor" }), s.jsx("small", { children: "dúvidas com fontes da biblioteca" })],
                }),
                s.jsxs("a", {
                  className: "mini ia",
                  href: "#/jogo/novo-caso",
                  children: [s.jsx(q, { n: "spark" }), s.jsx("b", { children: "Paciente inédito" }), s.jsx("small", { children: "caso gerado na hora" })],
                }),
                s.jsxs("a", {
                  className: "mini ia",
                  href: "#/jogo/ia/fraquezas",
                  children: [s.jsx(q, { n: "flag" }), s.jsx("b", { children: "Treino nas fraquezas" }), s.jsx("small", { children: "questões sob medida" })],
                }),
                t
                  ? s.jsxs("a", {
                      className: "mini ia",
                      href: `#/jogo/ia/topico/${t.id}`,
                      children: [s.jsx(q, { n: "chat" }), s.jsx("b", { children: "Questões do tópico" }), s.jsx("small", { children: t.titulo })],
                    })
                  : s.jsxs("a", {
                      className: "mini ia",
                      href: "#/ia/osce",
                      children: [s.jsx(q, { n: "clock" }), s.jsx("b", { children: "Circuito OSCE" }), s.jsx("small", { children: "4 estações com nota final" })],
                    }),
              ],
            }),
          ],
        }),
      }),
      t &&
        s.jsx(w, {
          title: "Continuar estudando",
          children: s.jsx(B, {
            href: `#/topico/${t.id}`,
            icon: s.jsx(q, { n: "book" }),
            title: t.titulo,
            sub: (h = O.modulos.find((b) => b.id === t.modulo)) == null ? void 0 : h.titulo,
          }),
        }),
      s.jsx(w, {
        title: "Praticar agora",
        children: s.jsxs("div", {
          className: "cards-h",
          children: [
            s.jsxs("a", {
              className: "mini",
              href: "#/jogo/simulado",
              children: [s.jsx(q, { n: "target" }), s.jsx("b", { children: "Simulado de prova" }), s.jsxs("small", { children: [O.questoes.length, " vinhetas"] })],
            }),            s.jsxs("a", {
              className: "mini",
              href: "#/jogar",
              children: [s.jsx(q, { n: "body" }), s.jsx("b", { children: "Paciente Virtual" }), s.jsxs("small", { children: [O.casos.length, " casos"] })],
            }),
            s.jsxs("a", {
              className: "mini",
              href: "#/jogo/estetoscopio/quiz",
              children: [s.jsx(q, { n: "ear" }), s.jsx("b", { children: "Estetoscópio" }), s.jsxs("small", { children: [O.sons.length, " sons"] })],
            }),
            s.jsxs("a", {
              className: "mini",
              href: "#/jogo/detetive/classico",
              children: [s.jsx(q, { n: "search" }), s.jsx("b", { children: "Detetive" }), s.jsxs("small", { children: [O.sinais.length, " sinais"] })],
            }),
            s.jsxs("a", {
              className: "mini",
              href: "#/quadros",
              children: [
                s.jsx(q, { n: "table" }),
                s.jsx("b", { children: "Caderno de Quadros" }),
                s.jsxs("small", { children: [ra.quadros.length, " quadros"] }),
              ],
            }),
            s.jsxs("a", {
              className: "mini",
              href: "#/jogo/sindrome",
              children: [s.jsx(q, { n: "puzzle" }), s.jsx("b", { children: "Monte a Síndrome" }), s.jsxs("small", { children: [O.sindromes.length, " tabelas"] })],
            }),
          ],
        }),
      }),
      l && s.jsx(w, { title: "Seu ponto fraco", children: s.jsx(B, { href: l.href, icon: s.jsx(q, { n: "flag" }), title: l.titulo, sub: l.sub }) }),
      !t &&
        s.jsxs(w, {
          title: "Comece por aqui",
          children: [
            s.jsx(B, {
              href: "#/modulo/fundamentos",
              icon: s.jsx(q, { n: "steth" }),
              title: "Fundamentos da semiologia",
              sub: "Os quatro métodos do exame e o raciocínio clínico",
            }),
            s.jsx(B, {
              href: "#/jogo/caso/pac-pneumonia",
              icon: s.jsx(q, { n: "body" }),
              title: "Seu primeiro paciente",
              sub: "Seu Antônio, 64 anos — febre e tosse",
            }),
          ],
        }),
      s.jsx(Jf, { compacto: !0 }),
      s.jsxs("p", {
        className: "foot muted",
        children: [
          "SemioQuest ",
          Xf,
          " · ",
          O.topicos.length,
          " tópicos · ",
          O.sinais.length,
          " sinais · ",
          O.casos.length,
          " casos · ",
          ra.quadros.length,
          " quadros",
          "",
        ],
      }),
    ],
  });
}
const Xf = "2.0";
function Xo({ titulo: a, questoes: e, limiteSeg: o, onFim: i, sairHref: r = "#/jogar", icone: t = "search", novo: n }) {
  const [l, c] = S.useState(0),
    [d, u] = S.useState(null),
    [m, p] = S.useState(0),
    [f, h] = S.useState(0),
    [b, z] = S.useState(0),
    [g, x] = S.useState(!1),
    [v, C] = S.useState(o || 0),
    P = S.useRef(0),
    E = S.useRef(null),
    j = e[l];
  S.useEffect(() => (j != null && j.som && !g && dt(j.som), () => Me()), [l, g]),
    S.useEffect(() => {
      if (!o || g) return;
      const N = setInterval(() => C((y) => (y <= 1 ? (clearInterval(N), A(), 0) : y - 1)), 1e3);
      return () => clearInterval(N);
    }, [o, g]);
  const A = () => {
    x(!0), Me();
  };
  S.useEffect(() => {
    g && (i == null || i(m, P.current, b));
  }, [g]);
  const D = (N) => {
      var $;
      u(N), (P.current += 1);
      const y = N === j.correta;
      if ((Ft(j.sistema, y, j.item), y)) {
        p((xa) => xa + 1);
        const U = f + 1;
        h(U), z((xa) => Math.max(xa, U));
      } else h(0), ($ = j.cartoes) != null && $.length && Ht(j.cartoes);
      o && setTimeout(() => I(), y ? 350 : 1100);
    },
    I = () => {
      u(null), c((N) => (N + 1 >= e.length ? (A(), N) : N + 1));
    };
  if (g || !j) {
    const N = P.current;
    return s.jsxs("div", {
      className: "page game",
      children: [
        s.jsxs("header", {
          className: "game-top",
          children: [
            s.jsx("a", { className: "iconbtn", href: r, "aria-label": "Sair", children: s.jsx(q, { n: "x" }) }),
            s.jsxs("div", { className: "game-title", children: [s.jsx("b", { children: a }), s.jsx("small", { children: "resultado" })] }),
            s.jsx("span", {}),
          ],
        }),
        s.jsxs("div", {
          className: "pad",
          children: [
            s.jsxs("div", {
              className: "score " + (m / Math.max(1, N) >= 0.8 ? "ok" : m / Math.max(1, N) >= 0.6 ? "warn" : "bad"),
              children: [
                s.jsx("b", { children: m }),
                s.jsxs("span", { children: ["de ", N] }),
                s.jsxs("small", { children: ["Melhor sequência: ", b, " · +", m * 5, " XP"] }),
              ],
            }),
            s.jsx("p", { className: "muted center small", children: "Os itens que você errou entraram na revisão espaçada." }),
            s.jsxs("div", {
              className: "btns",
              children: [
                n ? s.jsx("button", { className: "btn", onClick: n, children: "Jogar de novo" }) : null,
                s.jsx("a", { className: "btn ghost", href: r, children: "Sair" }),
              ],
            }),
          ],
        }),
      ],
    });
  }
  const R = d === j.correta;
  return s.jsxs("div", {
    className: "page game",
    children: [
      s.jsxs("header", {
        className: "game-top",
        children: [
          s.jsx("a", { className: "iconbtn", href: r, "aria-label": "Sair", children: s.jsx(q, { n: "x" }) }),
          s.jsxs("div", {
            className: "game-title",
            children: [s.jsx("b", { children: a }), s.jsx("small", { children: o ? `${m} acertos` : `${l + 1} de ${e.length}` })],
          }),
          o
            ? s.jsxs("span", { className: "clock " + (v <= 10 ? "warn" : ""), children: [s.jsx(q, { n: "clock", size: 16 }), " ", v, "s"] })
            : s.jsxs("span", { className: "clock", children: [s.jsx(q, { n: "flame", size: 16 }), " ", f] }),
        ],
      }),
      s.jsx(eo, { pct: o ? v / o : l / e.length, cls: "thin flat" }),
      s.jsxs("div", {
        className: "pad",
        children: [
          s.jsx("div", { className: "enunciado", ref: E, children: j.enunciado }),
          j.som && s.jsx($i, { id: j.som, label: "Tocar de novo" }),
          s.jsx(sx, { opcoes: j.opcoes, correta: j.correta, escolhida: d, onEscolher: D, render: j.renderOpcao }),
          d &&
            !o &&
            s.jsxs("div", {
              className: "expl " + (R ? "ok" : "bad"),
              children: [
                s.jsx("b", { children: R ? "Isso!" : "Não foi dessa vez." }),
                j.explicacao && s.jsx(Ba, { html: j.explicacao }),
                j.link && s.jsxs("a", { className: "linkbtn", href: j.link.href, children: [s.jsx(q, { n: "book", size: 16 }), " ", j.link.txt] }),
                s.jsx(
                  we,
                  {
                    compacto: !0,
                    titulo: "Explicar melhor com o Claude",
                    contexto: () => {
                      var N;
                      return `Questão do jogo "${a}".
Enunciado: ${((N = E.current) == null ? void 0 : N.innerText) || ""}
Alternativas: ${j.opcoes.join(" | ")}
Correta: ${j.correta}
O estudante marcou: ${d}
Explicação do app: ${va(j.explicacao || "", 1500)}`;
                    },
                    sugestoes: R
                      ? ["Me dê um macete para lembrar", "Como isso aparece no exame real?"]
                      : ["Por que errei?", "Por que as outras estão erradas?", "Explique de outro jeito"],
                  },
                  j.id,
                ),
                s.jsx("button", { className: "btn", onClick: I, children: l + 1 >= e.length ? "Ver resultado" : "Próxima" }),
              ],
            }),
        ],
      }),
    ],
  });
}
