// Telas da Clínica IA.
function Rx() {
  var n, l, c;
  const a = Za(),
    e = ea((d) => d.ia),
    o = (e == null ? void 0 : e.sessoes) || [],
    i = Object.values((e == null ? void 0 : e.stats) || {}).reduce((d, u) => d + Object.values(u).reduce((m, p) => m + p.n, 0), 0),
    r = Object.values((e == null ? void 0 : e.stats) || {}).reduce((d, u) => d + Object.values(u).reduce((m, p) => m + p.soma, 0), 0),
    t = (d) => {
      const u = e == null ? void 0 : e.stats[d];
      if (!u) return null;
      const m = Object.values(u).reduce((f, h) => f + h.n, 0),
        p = Object.values(u).reduce((f, h) => f + h.soma, 0);
      return { n: m, media: p / m };
    };
  return s.jsxs("div", {
    className: "page",
    children: [
      s.jsx(Q, { title: "Clínica IA", back: !1 }),
      a
        ? s.jsxs(s.Fragment, {
            children: [
              s.jsx("div", {
                className: "pad",
                children: s.jsxs("div", {
                  className: "clin-hero",
                  children: [
                    s.jsxs("div", {
                      className: "clin-hero-t",
                      children: [
                        s.jsx("span", { className: "ia-ic big", children: s.jsx(q, { n: "spark", size: 24 }) }),
                        s.jsxs("div", {
                          children: [
                            s.jsx("b", { children: "Treine com um preceptor que não cansa" }),
                            s.jsx("small", {
                              children: "Anamnese, exame físico, raciocínio e comunicação em 12 sistemas. Cada estação é inédita e corrigida por checklist.",
                            }),
                          ],
                        }),
                      ],
                    }),
                    s.jsxs("div", {
                      className: "clin-stats",
                      children: [
                        s.jsxs("div", { children: [s.jsx("b", { children: i }), s.jsx("small", { children: "estações" })] }),
                        s.jsxs("div", { children: [s.jsx("b", { children: i ? Bo(r / i) : "—" }), s.jsx("small", { children: "nota média" })] }),
                        s.jsxs("div", {
                          children: [
                            s.jsxs("b", { children: [Object.keys((e == null ? void 0 : e.stats) || {}).length, "/12"] }),
                            s.jsx("small", { children: "sistemas" }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              }),
              o[0] &&
                s.jsx(w, {
                  title: "Continuar",
                  children: s.jsx(B, {
                    href: `#/ia/s/${o[0].sistema}`,
                    icon: s.jsx(q, { n: ((n = ja.get(o[0].sistema)) == null ? void 0 : n.icone) || "body" }),
                    title: ((l = ja.get(o[0].sistema)) == null ? void 0 : l.nome) || o[0].sistema,
                    sub: `Última: ${(c = De.get(o[0].modo)) == null ? void 0 : c.nome} · nota ${Bo(o[0].nota)}`,
                  }),
                }),
              s.jsx(w, {
                title: "Escolha o sistema",
                children: s.jsx("div", {
                  className: "sis-grid",
                  children: Ks.map((d) => {
                    const u = t(d.id);
                    return s.jsxs(
                      "a",
                      {
                        className: "sis-card",
                        href: `#/ia/s/${d.id}`,
                        children: [
                          s.jsx(q, { n: d.icone, size: 26 }),
                          s.jsx("b", { children: d.curto }),
                          s.jsx("small", { children: u ? `${u.n} estaç${u.n > 1 ? "ões" : "ão"} · média ${Bo(u.media)}` : "Começar" }),
                          u && s.jsx("i", { className: "sis-dot " + kt(u.media) }),
                        ],
                      },
                      d.id,
                    );
                  }),
                }),
              }),
              s.jsx("div", {
                className: "pad-x",
                children: s.jsxs("a", {
                  className: "clin-banner osce",
                  href: "#/ia/osce",
                  children: [
                    s.jsx("span", { className: "ia-ic big", children: s.jsx(q, { n: "clock", size: 24 }) }),
                    s.jsxs("span", {
                      children: [
                        s.jsx("b", { children: "Circuito OSCE" }),
                        s.jsx("small", { children: "Prova prática simulada: 4 estações seguidas, cronometradas, com nota final" }),
                      ],
                    }),
                    s.jsx(q, { n: "right", size: 18 }),
                  ],
                }),
              }),
              s.jsx(Tx, {}),
              s.jsxs(w, {
                title: "Também com IA",
                children: [
                  s.jsx(B, {
                    href: "#/jogo/novo-caso",
                    icon: s.jsx(q, { n: "body" }),
                    title: "Paciente Virtual inédito",
                    sub: "Caso completo com exame clicável, sons e síntese",
                  }),
                  s.jsx(B, {
                    href: "#/jogo/ia/fraquezas",
                    icon: s.jsx(q, { n: "flag" }),
                    title: "Treino nas suas fraquezas",
                    sub: "Questões inéditas nos sistemas em que você mais erra",
                  }),
                ],
              }),
              o.length > 0 && s.jsx(w, { title: "Histórico", children: o.map((d) => s.jsx(Zc, { x: d, mostrarSis: !0 }, d.id)) }),
              s.jsx("p", {
                className: "ia-nota pad-x",
                children:
                  "Os cenários e as correções são gerados pela IA a partir do conteúdo do app e podem conter imprecisões. Confira no conteúdo e com seu professor.",
              }),
            ],
          })
        : s.jsx(Yc, {}),
    ],
  });
}
function Zc({ x: a, mostrarSis: e }) {
  var o, i;
  return s.jsx(B, {
    href: `#/ia/h/${a.id}`,
    icon: s.jsx("span", { className: "nota-mini " + kt(a.nota), children: Bo(a.nota) }),
    title: a.titulo,
    sub: `${((o = De.get(a.modo)) == null ? void 0 : o.nome) || a.modo}${e ? " · " + (((i = ja.get(a.sistema)) == null ? void 0 : i.curto) || a.sistema) : ""} · ${Zf(a.data)}`,
  });
}
function Ox({ id: a }) {
  const e = Za(),
    o = ja.get(a),
    i = ea((d) => {
      var u;
      return (u = d.ia) == null ? void 0 : u.stats[a];
    }),
    r = ea((d) => {
      var u;
      return (((u = d.ia) == null ? void 0 : u.sessoes) || []).filter((m) => m.sistema === a);
    }),
    { nivel: t, osce: n, setNivel: l, setOsce: c } = ag();
  return o
    ? s.jsxs("div", {
        className: "page",
        children: [
          s.jsx(Q, { title: o.nome }),
          e
            ? s.jsxs(s.Fragment, {
                children: [
                  s.jsxs("div", {
                    className: "pad",
                    children: [
                      s.jsx("div", {
                        className: "seg full",
                        children: Nx.map((d) => s.jsx("button", { className: t === d ? "on" : "", onClick: () => l(d), children: d }, d)),
                      }),
                      s.jsxs("label", {
                        className: "toggle mt",
                        children: [
                          s.jsx("input", { type: "checkbox", checked: n, onChange: (d) => c(d.target.checked) }),
                          s.jsx("span", { children: "Modo OSCE: estações de conversa com cronômetro" }),
                        ],
                      }),
                    ],
                  }),
                  qx.map((d) =>
                    s.jsxs(
                      w,
                      {
                        title: d.nome,
                        children: [
                          s.jsx("p", { className: "muted small pad-x sec-desc", children: d.desc }),
                          Xc.filter((u) => u.grupo === d.id).map((u) => {
                            const m = i == null ? void 0 : i[u.id];
                            return s.jsx(
                              B,
                              {
                                href: `#/ia/e/${o.id}/${u.id}`,
                                icon: s.jsx(q, { n: u.icone }),
                                title: u.nome,
                                sub: u.desc,
                                right: m
                                  ? s.jsx("span", { className: "nota-mini " + kt(m.melhor), title: "melhor nota", children: Bo(m.melhor) })
                                  : s.jsx(Ta, { cls: "soft", children: "novo" }),
                              },
                              u.id,
                            );
                          }),
                        ],
                      },
                      d.id,
                    ),
                  ),
                  s.jsxs(w, {
                    title: "Mais deste sistema",
                    children: [
                      s.jsx(B, {
                        href: `#/ia/osce/${o.id}`,
                        icon: s.jsx(q, { n: "clock" }),
                        title: "Circuito OSCE deste sistema",
                        sub: "4 estações seguidas com cronômetro e nota final",
                      }),
                      s.jsx(B, {
                        href: `#/jogo/ia/sistema/${o.id}`,
                        icon: s.jsx(q, { n: "puzzle" }),
                        title: "Questões inéditas do sistema",
                        sub: "Vinhetas clínicas de múltipla escolha, com cartões dos erros",
                      }),
                      yx.includes(o.id) &&
                        s.jsx(B, {
                          href: `#/jogo/novo-caso?s=${o.id}`,
                          icon: s.jsx(q, { n: "body" }),
                          title: "Paciente Virtual inédito",
                          sub: "Caso com exame clicável, sons sintetizados e síntese",
                        }),
                      o.modulos
                        .filter((d) => d !== "especiais")
                        .slice(0, 2)
                        .map((d) =>
                          s.jsx(
                            B,
                            {
                              href: `#/modulo/${d}`,
                              icon: s.jsx(q, { n: "book" }),
                              title: "Estudar o conteúdo",
                              sub: "Tópicos e quadros do caderno deste sistema",
                            },
                            d,
                          ),
                        ),
                      s.jsx("div", {
                        className: "pad-x",
                        children: s.jsx(we, {
                          titulo: `Pergunte ao Claude: ${o.curto}`,
                          contexto: () => Wc(o, 5e3),
                          sugestoes: [
                            "Qual a sequência do exame deste sistema?",
                            "Quais perguntas não podem faltar na anamnese?",
                            "Quais síndromes mais caem na prova prática?",
                            "Monte um roteiro de estudo de 1 semana",
                          ],
                        }),
                      }),
                    ],
                  }),
                  r.length > 0 && s.jsx(w, { title: "Suas estações neste sistema", children: r.map((d) => s.jsx(Zc, { x: d }, d.id)) }),
                ],
              })
            : s.jsx(Yc, {}),
        ],
      })
    : s.jsxs("div", {
        className: "page",
        children: [s.jsx(Q, { title: "Clínica IA" }), s.jsx("p", { className: "pad", children: "Sistema não encontrado." })],
      });
}
const Iu = ["Preparando o paciente…", "Escrevendo a ficha do caso…", "Conferindo a coerência clínica…", "Montando o gabarito do preceptor…"],
  Fx = ["O preceptor está lendo o que você fez…", "Conferindo o checklist…", "Escrevendo a resposta-modelo…"];
function Tn({ frases: a, onCancelar: e }) {
  const [o, i] = S.useState(0);
  return (
    S.useEffect(() => {
      const r = setInterval(() => i((t) => (t + 1) % a.length), 4e3);
      return () => clearInterval(r);
    }, [a]),
    s.jsxs("div", {
      className: "gerando",
      children: [
        s.jsx("div", { className: "pulso", children: s.jsx(q, { n: "spark", size: 28 }) }),
        s.jsx("b", { children: a[o] }),
        s.jsx("small", { className: "muted", children: "Costuma levar de 15 a 45 segundos." }),
        e && s.jsx("button", { className: "btn ghost", onClick: e, children: "Cancelar" }),
      ],
    })
  );
}
function eg({ sis: a, modo: e, item0: o, circuito: i }) {
  var oa;
  const r = Za(),
    t = ja.get(a),
    n = De.get(e),
    { nivel: l, osce: c } = ag(),
    [d, u] = S.useState("intro"),
    [m, p] = S.useState(o || ""),
    [f, h] = S.useState(""),
    [b, z] = S.useState(null),
    [g, x] = S.useState(""),
    [v, C] = S.useState([]),
    [P, E] = S.useState("anamnese"),
    [j, A] = S.useState(""),
    [D, I] = S.useState(null),
    [R, N] = S.useState(null),
    [y, $] = S.useState(0),
    U = S.useRef(null);
  S.useEffect(
    () => () => {
      var G;
      return (G = U.current) == null ? void 0 : G.abort();
    },
    [],
  ),
    S.useEffect(() => {
      window.scrollTo(0, 0);
    }, [d]),
    S.useEffect(() => {
      var G;
      i && d === "intro" && t && n && ((G = xa.current) == null || G.call(xa));
    }, []);
  const xa = S.useRef(null),
    $a = ea((G) => {
      var J;
      return (((J = G.ia) == null ? void 0 : J.sessoes) || []).filter((ga) => ga.sistema === a && ga.modo === e);
    });
  if (!t || !n)
    return s.jsxs("div", {
      className: "page",
      children: [s.jsx(Q, { title: "Clínica IA" }), s.jsx("p", { className: "pad", children: "Estação não encontrada." })],
    });
  if (!r && d !== "resultado") return s.jsxs("div", { className: "page", children: [s.jsx(Q, { title: n.nome }), s.jsx(Yc, {})] });
  const F = (c || !!i) && !!n.osceMin && n.tipo !== "resposta",
    V = async () => {
      var G, J;
      u("gerando"), I(null), (U.current = new AbortController());
      try {
        const ga = f.trim() || m,
          he = await Px(
            n,
            t,
            l,
            ga,
            $a.map((so) => so.titulo),
            U.current.signal,
          ),
          Ga = (G = he.oculto) == null ? void 0 : G.abertura;
        z(he),
          x(""),
          A(""),
          E("anamnese"),
          C(
            typeof Ga == "string" && Ga.trim() && n.tipo !== "resposta" && ((J = n.papel) == null ? void 0 : J.call(n, "anamnese")) !== "examinador"
              ? [{ de: "ia", txt: Ga.trim(), fase: "anamnese" }]
              : [],
          ),
          $(Date.now()),
          u("jogo");
      } catch (ga) {
        u("intro"), ga.code !== "aborted" && I(ga.message);
      } finally {
        U.current = null;
      }
    };
  xa.current = V;
  const _ = async () => {
    if (!b) return;
    u("avaliando"), I(null), (U.current = new AbortController());
    const G = F ? Math.max(1, Math.round((Date.now() - y) / 6e4)) : void 0;
    try {
      const J = await jx(n, t, l, b, n.tipo === "resposta" ? { resposta: g } : { falas: v, conclusao: n.conclusao ? j : void 0, minutos: G }, U.current.signal),
        ga = {
          id: "s" + Date.now().toString(36),
          sistema: t.id,
          modo: n.id,
          titulo: b.titulo,
          data: Date.now(),
          nota: J.nota,
          nivel: l,
          item: b.item,
          enunciado: b.enunciado.slice(0, 3e3),
          resposta: n.tipo === "resposta" ? g.slice(0, 3e3) : void 0,
          conclusao: j ? j.slice(0, 1200) : void 0,
          falas: n.tipo !== "resposta" ? v.slice(-30).map((he) => ({ ...he, txt: he.txt.slice(0, 400) })) : void 0,
          avaliacao: J,
        };
      if ((yf(ga), i)) {
        i.onFim(ga);
        return;
      }
      N(ga), u("resultado"), ca(`Nota ${Bo(J.nota)} · +${Math.round(J.nota * 3) + 5} XP`);
    } catch (J) {
      u(n.tipo === "resposta" ? "jogo" : "concluir"), J.code !== "aborted" && I(J.message);
    } finally {
      U.current = null;
    }
  };
  if (i && (d === "intro" || d === "gerando"))
    return s.jsxs("div", {
      className: "page",
      children: [
        s.jsx(Q, { title: i.rotulo }),
        s.jsxs("div", {
          className: "pad",
          children: [
            s.jsxs("div", {
              className: "card estacao-intro",
              children: [
                s.jsxs("div", {
                  className: "ia-h",
                  children: [s.jsx("span", { className: "ia-ic", children: s.jsx(q, { n: n.icone, size: 18 }) }), s.jsx("b", { children: n.nome })],
                }),
                s.jsxs("p", { children: [t.nome, " · ", n.desc, "."] }),
              ],
            }),
            D
              ? s.jsxs(s.Fragment, {
                  children: [
                    s.jsx("div", { className: "ia-erro", children: D }),
                    s.jsx("button", { className: "btn", onClick: V, children: "Tentar de novo" }),
                  ],
                })
              : s.jsx(Tn, { frases: Iu }),
          ],
        }),
      ],
    });
  if (d === "intro" || d === "gerando") {
    const G = (oa = n.escolha) == null ? void 0 : oa.call(n, t);
    return s.jsxs("div", {
      className: "page",
      children: [
        s.jsx(Q, { title: n.nome }),
        s.jsxs("div", {
          className: "pad",
          children: [
            s.jsxs("div", {
              className: "card estacao-intro",
              children: [
                s.jsxs("div", {
                  className: "ia-h",
                  children: [s.jsx("span", { className: "ia-ic", children: s.jsx(q, { n: n.icone, size: 18 }) }), s.jsx("b", { children: t.nome })],
                }),
                s.jsxs("p", { children: [n.desc, "."] }),
                s.jsx("h4", { className: "mini-h", children: "O preceptor avalia" }),
                s.jsx("ul", {
                  className: "avalia",
                  children: n.avalia.map((J) => s.jsxs("li", { children: [s.jsx(q, { n: "check", size: 14 }), " ", J] }, J)),
                }),
                s.jsxs("div", {
                  className: "chips wrap",
                  children: [
                    s.jsx(Ta, { children: l }),
                    F && s.jsxs(Ta, { cls: "warn", children: ["OSCE · ", n.osceMin, " min"] }),
                    n.tipo !== "resposta" && s.jsx(Ta, { cls: "soft", children: "conversa" }),
                  ],
                }),
              ],
            }),
            G &&
              s.jsxs(s.Fragment, {
                children: [
                  s.jsx("h3", { className: "sub-h", children: G.rotulo }),
                  s.jsxs("div", {
                    className: "chips wrap",
                    children: [
                      s.jsx("button", {
                        className: "chip " + (!m && !f ? "sel" : ""),
                        disabled: d === "gerando",
                        onClick: () => {
                          p(""), h("");
                        },
                        children: "Sorteio",
                      }),
                      G.opcoes.map((J) =>
                        s.jsx(
                          "button",
                          {
                            className: "chip " + (m === J && !f ? "sel" : ""),
                            disabled: d === "gerando",
                            onClick: () => {
                              p(J), h("");
                            },
                            children: J,
                          },
                          J,
                        ),
                      ),
                    ],
                  }),
                  s.jsx("input", {
                    className: "input mt",
                    value: f,
                    maxLength: 120,
                    disabled: d === "gerando",
                    onChange: (J) => h(J.target.value),
                    placeholder: "Ou escreva outro tema…",
                  }),
                ],
              }),
            D && s.jsx("div", { className: "ia-erro", children: D }),
            d === "gerando"
              ? s.jsx(Tn, {
                  frases: Iu,
                  onCancelar: () => {
                    var J;
                    return (J = U.current) == null ? void 0 : J.abort();
                  },
                })
              : s.jsxs("button", { className: "btn mt", onClick: V, children: [s.jsx(q, { n: "play", size: 18 }), " Começar estação"] }),
            s.jsx("p", { className: "muted small mt", children: "Nível e modo OSCE se ajustam na página do sistema." }),
          ],
        }),
        $a.length > 0 && d === "intro" && s.jsx(w, { title: "Suas tentativas", children: $a.map((J) => s.jsx(Zc, { x: J }, J.id)) }),
      ],
    });
  }
  return d === "avaliando"
    ? s.jsxs("div", { className: "page", children: [s.jsx(Q, { title: n.nome }), s.jsx("div", { className: "pad", children: s.jsx(Tn, { frases: Fx }) })] })
    : d === "resultado" && R
      ? s.jsx(og, {
          sessao: R,
          onNova: () => {
            u("intro"), z(null), N(null);
          },
        })
      : b
        ? n.tipo === "resposta"
          ? s.jsxs("div", {
              className: "page game",
              children: [
                s.jsxs("header", {
                  className: "game-top",
                  children: [
                    s.jsx("button", { className: "iconbtn", "aria-label": "Sair", onClick: Ws, children: s.jsx(q, { n: "x" }) }),
                    s.jsxs("div", {
                      className: "game-title",
                      children: [s.jsx("b", { children: b.titulo }), s.jsxs("small", { children: [i ? i.rotulo + " · " : "", n.nome, " · ", t.curto] })],
                    }),
                    s.jsx("span", {}),
                  ],
                }),
                s.jsxs("div", {
                  className: "pad",
                  children: [
                    s.jsx("div", { className: "card enunciado-ia prose", dangerouslySetInnerHTML: { __html: me(b.enunciado) } }),
                    s.jsx("textarea", { className: "resposta-ia", rows: 11, value: g, placeholder: n.placeholder, onChange: (G) => x(G.target.value) }),
                    D && s.jsx("div", { className: "ia-erro", children: D }),
                    s.jsx("button", { className: "btn", disabled: g.trim().length < 15, onClick: _, children: "Enviar para correção" }),
                    s.jsx("button", { className: "btn ghost mt", onClick: _, children: "Não sei — mostrar a resposta-modelo" }),
                  ],
                }),
              ],
            })
          : d === "concluir"
            ? s.jsxs("div", {
                className: "page game",
                children: [
                  s.jsxs("header", {
                    className: "game-top",
                    children: [
                      s.jsx("button", { className: "iconbtn", "aria-label": "Voltar à conversa", onClick: () => u("jogo"), children: s.jsx(q, { n: "back" }) }),
                      s.jsxs("div", {
                        className: "game-title",
                        children: [s.jsx("b", { children: "Encerrar a estação" }), s.jsx("small", { children: n.nome })],
                      }),
                      s.jsx("span", {}),
                    ],
                  }),
                  s.jsxs("div", {
                    className: "pad",
                    children: [
                      n.conclusao
                        ? s.jsxs(s.Fragment, {
                            children: [
                              s.jsx("h3", { className: "sub-h", children: "Sua conclusão" }),
                              s.jsx("p", { className: "muted small", children: n.conclusao }),
                              s.jsx("textarea", {
                                className: "resposta-ia",
                                rows: 7,
                                value: j,
                                onChange: (G) => A(G.target.value),
                                placeholder: "Ex.: Síndrome de … Hipótese principal: … porque …",
                              }),
                            ],
                          })
                        : s.jsx("p", { children: "Pronto para a correção? O preceptor vai ler toda a conversa." }),
                      D && s.jsx("div", { className: "ia-erro", children: D }),
                      s.jsx("button", { className: "btn", onClick: _, children: "Avaliar minha estação" }),
                      s.jsx("button", { className: "btn ghost mt", onClick: () => u("jogo"), children: "Continuar a conversa" }),
                    ],
                  }),
                ],
              })
            : s.jsx(Lx, {
                rotulo: i == null ? void 0 : i.rotulo,
                m: n,
                s: t,
                cen: b,
                falas: v,
                setFalas: C,
                fase: P,
                setFase: E,
                limite: F ? n.osceMin * 60 : 0,
                inicio: y,
                onEncerrar: () => u("concluir"),
              })
        : null;
}
function Hx({ inicio: a, limite: e, onFim: o }) {
  const [i, r] = S.useState(Date.now()),
    t = S.useRef(!1);
  S.useEffect(() => {
    const l = setInterval(() => r(Date.now()), 1e3);
    return () => clearInterval(l);
  }, []);
  const n = Math.max(0, e - Math.floor((i - a) / 1e3));
  return (
    S.useEffect(() => {
      n === 0 && !t.current && ((t.current = !0), ca("Tempo esgotado! Encerre a estação."), o());
    }, [n]),
    s.jsxs("span", {
      className: "crono " + (n < 60 ? "bad" : n < 180 ? "warn" : ""),
      children: [s.jsx(q, { n: "clock", size: 14 }), " ", Math.floor(n / 60), ":", String(n % 60).padStart(2, "0")],
    })
  );
}
function Lx({ rotulo: a, m: e, s: o, cen: i, falas: r, setFalas: t, fase: n, setFase: l, limite: c, inicio: d, onEncerrar: u }) {
  const [m, p] = S.useState(""),
    [f, h] = S.useState(null),
    [b, z] = S.useState(null),
    [g, x] = S.useState(!1),
    [v, C] = S.useState(!0),
    P = S.useRef(null),
    E = S.useRef(null);
  S.useEffect(
    () => () => {
      var y;
      return (y = P.current) == null ? void 0 : y.abort();
    },
    [],
  ),
    S.useEffect(() => {
      var y;
      (y = E.current) == null || y.scrollIntoView({ block: "end", behavior: "smooth" });
    }, [r.length, f === null]);
  const j = e.papel(n),
    A = f !== null,
    D = e.tipo === "completo" ? r.filter((y) => (y.fase || "anamnese") === n) : r,
    I = async (y) => {
      const $ = y.trim();
      if (!$ || A) return;
      z(null), p(""), h(""), C(!1);
      const U = r;
      t([...U, { de: "eu", txt: $, fase: n }]), (P.current = new AbortController());
      try {
        const xa = await Sx(e, o, i, U, n, $, h, P.current.signal);
        t(($a) => [...$a, { de: "ia", txt: xa.trim(), fase: n }]);
      } catch (xa) {
        t(U), xa.code !== "aborted" && (z(xa.message), p($));
      } finally {
        h(null), (P.current = null);
      }
    },
    R = r.filter((y) => y.de === "eu").length,
    N = Mx[o.id] || ["Inspeção", "Palpação", "Percussão", "Ausculta"];
  return s.jsxs("div", {
    className: "page game conversa-ia",
    children: [
      s.jsxs("header", {
        className: "game-top",
        children: [
          s.jsx("button", { className: "iconbtn", "aria-label": "Sair", onClick: Ws, children: s.jsx(q, { n: "x" }) }),
          s.jsxs("div", {
            className: "game-title",
            children: [
              s.jsx("b", { children: i.titulo }),
              s.jsxs("small", { children: [a ? a + " · " : "", e.nome, " · ", o.curto, R ? ` · ${R} fala${R > 1 ? "s" : ""}` : ""] }),
            ],
          }),
          c ? s.jsx(Hx, { inicio: d, limite: c, onFim: u }) : s.jsx("span", {}),
        ],
      }),
      s.jsxs("div", {
        className: "pad",
        children: [
          s.jsxs("button", {
            className: "enun-toggle",
            onClick: () => C(!v),
            children: [s.jsx(q, { n: "clipboard", size: 16 }), " Cenário ", s.jsx(q, { n: v ? "x" : "right", size: 14 })],
          }),
          v && s.jsx("div", { className: "card enunciado-ia prose", dangerouslySetInnerHTML: { __html: me(i.enunciado) } }),
          e.tipo === "completo" &&
            s.jsxs("div", {
              className: "seg full",
              children: [
                s.jsxs("button", {
                  className: n === "anamnese" ? "on" : "",
                  onClick: () => l("anamnese"),
                  children: [s.jsx(q, { n: "chat", size: 16 }), " Anamnese"],
                }),
                s.jsxs("button", {
                  className: n === "exame" ? "on" : "",
                  onClick: () => l("exame"),
                  children: [s.jsx(q, { n: "steth", size: 16 }), " Exame físico"],
                }),
              ],
            }),
          s.jsxs("div", {
            className: "chat",
            children: [
              D.length === 0 &&
                !A &&
                s.jsx("p", {
                  className: "muted small center",
                  children: j === "examinador" ? "Comece pelo preparo e diga o que você faz, uma etapa por vez." : "Comece a conversa.",
                }),
              D.map((y, $) =>
                y.de === "eu"
                  ? s.jsx("div", { className: "bubble med", children: y.txt }, $)
                  : s.jsxs(
                      "div",
                      {
                        className: "bubble " + (j === "examinador" ? "achado" : "pac"),
                        children: [
                          j === "examinador" && s.jsx("small", { className: "rot", children: "Achado" }),
                          s.jsx("span", { dangerouslySetInnerHTML: { __html: me(y.txt) } }),
                        ],
                      },
                      $,
                    ),
              ),
              A &&
                s.jsx("div", {
                  className: "bubble " + (j === "examinador" ? "achado" : "pac"),
                  children: f
                    ? s.jsx("span", { dangerouslySetInnerHTML: { __html: me(f) } })
                    : s.jsxs("span", { className: "digitando", children: [s.jsx("i", {}), s.jsx("i", {}), s.jsx("i", {})] }),
                }),
              s.jsx("div", { ref: E }),
            ],
          }),
          b && s.jsx("div", { className: "ia-erro", children: b }),
          j === "examinador" &&
            s.jsxs("div", {
              className: "atalhos",
              children: [
                s.jsxs("div", {
                  className: "chips wrap",
                  children: [
                    N.map((y) => s.jsx("button", { className: "chip", disabled: A, onClick: () => p(($) => ($ ? $ + " " : "") + y + ": "), children: y }, y)),
                    s.jsx("button", { className: "chip " + (g ? "sel" : ""), onClick: () => x(!g), children: g ? "Ocultar manobras" : "Manobras…" }),
                  ],
                }),
                g &&
                  s.jsx("div", {
                    className: "chips wrap mt",
                    children: o.manobras.map((y) =>
                      s.jsx("button", { className: "chip soft", disabled: A, onClick: () => I(`Realizo: ${y}`), children: y }, y),
                    ),
                  }),
              ],
            }),
          s.jsxs("form", {
            className: "ia-form chatbar",
            onSubmit: (y) => {
              y.preventDefault(), I(m);
            },
            children: [
              s.jsx("textarea", {
                value: m,
                rows: 2,
                placeholder: D.length < 2 ? e.placeholder : j === "examinador" ? "Próxima etapa ou manobra…" : "Sua próxima fala…",
                onChange: (y) => p(y.target.value),
                onKeyDown: (y) => {
                  y.key === "Enter" && !y.shiftKey && (y.preventDefault(), I(m));
                },
              }),
              A
                ? s.jsx("button", {
                    type: "button",
                    className: "iconbtn solid",
                    "aria-label": "Parar",
                    onClick: () => {
                      var y;
                      return (y = P.current) == null ? void 0 : y.abort();
                    },
                    children: s.jsx(q, { n: "stop", size: 18 }),
                  })
                : s.jsx("button", {
                    type: "submit",
                    className: "iconbtn solid",
                    "aria-label": "Enviar",
                    disabled: !m.trim(),
                    children: s.jsx(q, { n: "send", size: 18 }),
                  }),
            ],
          }),
          s.jsxs("button", {
            className: "btn sticky",
            disabled: R === 0 || A,
            onClick: u,
            children: [s.jsx(q, { n: "check", size: 18 }), " Encerrar e avaliar"],
          }),
        ],
      }),
    ],
  });
}
function kx({ id: a }) {
  const e = ea((o) => {
    var i;
    return (i = o.ia) == null ? void 0 : i.sessoes.find((r) => r.id === a);
  });
  return e
    ? s.jsx(og, { sessao: e, onNova: () => pt(`#/ia/e/${e.sistema}/${e.modo}`), historico: !0 })
    : s.jsxs("div", {
        className: "page",
        children: [
          s.jsx(Q, { title: "Estação" }),
          s.jsx("p", { className: "pad", children: "Esta estação não está mais no histórico (guardamos as 15 últimas)." }),
        ],
      });
}
function og({ sessao: a, onNova: e, historico: o }) {
  const i = Za(),
    r = a.avaliacao,
    t = De.get(a.modo),
    n = ja.get(a.sistema),
    l = ea((f) => {
      var h, b;
      return !!((b = (h = f.ia) == null ? void 0 : h.sessoes.find((z) => z.id === a.id)) != null && b.cartoes);
    }),
    [c, d] = S.useState(!1),
    u = { ok: "check", parcial: "refresh", faltou: "x" },
    m = async () => {
      if (!(!t || !n)) {
        d(!0);
        try {
          const f = await zx(t, n, r),
            h = Of(f, n.id, `#/ia/h/${a.id}`);
          Rf(a.id), ca(`${h} cartões na frente da sua fila de revisão`);
        } catch (f) {
          ca(f.message);
        } finally {
          d(!1);
        }
      }
    },
    p = () => `Estação "${t == null ? void 0 : t.nome}" — ${n == null ? void 0 : n.nome}. Nível ${a.nivel}.
Enunciado: ${a.enunciado.slice(0, 1500)}
${a.resposta ? `Resposta do estudante: ${a.resposta.slice(0, 2e3)}` : ""}
${
  a.falas
    ? `Conversa: ${a.falas
        .map((f) => `${f.de === "eu" ? "Estudante" : "Paciente/simulador"}: ${f.txt}`)
        .join(" | ")
        .slice(0, 3e3)}`
    : ""
}
${a.conclusao ? `Conclusão do estudante: ${a.conclusao}` : ""}
Correção: nota ${r.nota}; ${r.resumo}; diagnóstico: ${r.diagnostico || "-"}; faltou: ${r.checklist
      .filter((f) => f.status !== "ok")
      .map((f) => f.item)
      .join("; ")}; melhorar: ${r.melhorar.join("; ")}; modelo: ${r.modelo.slice(0, 1500)}`;
  return s.jsxs("div", {
    className: "page",
    children: [
      s.jsx(Q, { title: o ? "Estação" : "Resultado" }),
      s.jsxs("div", {
        className: "pad",
        children: [
          s.jsxs("div", {
            className: "res-head",
            children: [
              s.jsxs("div", { className: "nota-ia " + kt(r.nota), children: [s.jsx("b", { children: Bo(r.nota) }), s.jsx("span", { children: "/10" })] }),
              s.jsxs("div", {
                children: [
                  s.jsx("b", { children: a.titulo }),
                  s.jsxs("small", { children: [t == null ? void 0 : t.nome, " · ", n == null ? void 0 : n.curto, " · ", a.nivel, " · ", Zf(a.data)] }),
                ],
              }),
            ],
          }),
          r.resumo && s.jsx("p", { children: r.resumo }),
          r.diagnostico &&
            s.jsxs("div", {
              className: "card dx-ia",
              children: [
                s.jsx("small", { children: "O caso era" }),
                s.jsx("div", { className: "prose", dangerouslySetInnerHTML: { __html: me(r.diagnostico) } }),
              ],
            }),
          s.jsx("h3", { className: "sub-h", children: "Checklist do preceptor" }),
          s.jsx("ul", {
            className: "check-ia",
            children: r.checklist.map((f, h) =>
              s.jsxs(
                "li",
                {
                  className: f.status,
                  children: [
                    s.jsx("span", { className: "ck", children: s.jsx(q, { n: u[f.status], size: 14 }) }),
                    s.jsxs("div", { children: [s.jsx("b", { children: f.item }), f.comentario && s.jsx("small", { children: f.comentario })] }),
                  ],
                },
                h,
              ),
            ),
          }),
          r.fortes.length > 0 &&
            s.jsxs(s.Fragment, {
              children: [
                s.jsx("h3", { className: "sub-h", children: "Mandou bem" }),
                s.jsx("ul", { className: "lista-ia ok", children: r.fortes.map((f, h) => s.jsx("li", { children: f }, h)) }),
              ],
            }),
          r.melhorar.length > 0 &&
            s.jsxs(s.Fragment, {
              children: [
                s.jsx("h3", { className: "sub-h", children: "Para melhorar" }),
                s.jsx("ul", { className: "lista-ia warn", children: r.melhorar.map((f, h) => s.jsx("li", { children: f }, h)) }),
              ],
            }),
          r.dica && s.jsxs("div", { className: "card dica-ia", children: [s.jsx(q, { n: "star", size: 18 }), s.jsx("span", { children: r.dica })] }),
          s.jsxs("details", {
            className: "log",
            open: !0,
            children: [
              s.jsx("summary", { children: "Resposta-modelo" }),
              s.jsx("div", { className: "prose", dangerouslySetInnerHTML: { __html: me(r.modelo) } }),
            ],
          }),
          s.jsxs("details", {
            className: "log",
            children: [
              s.jsx("summary", { children: "Cenário e o que você fez" }),
              s.jsx("div", { className: "prose", dangerouslySetInnerHTML: { __html: me(a.enunciado) } }),
              a.resposta &&
                s.jsxs(s.Fragment, { children: [s.jsx("h4", { children: "Sua resposta" }), s.jsx("p", { className: "pre", children: a.resposta })] }),
              a.falas &&
                a.falas.map((f, h) =>
                  s.jsxs(
                    "div",
                    {
                      className: "log-i",
                      children: [
                        s.jsxs("small", {
                          children: [f.de === "eu" ? "Você" : "Resposta", f.fase && (t == null ? void 0 : t.tipo) === "completo" ? ` · ${f.fase}` : ""],
                        }),
                        s.jsx("span", { children: f.txt }),
                      ],
                    },
                    h,
                  ),
                ),
              a.conclusao &&
                s.jsxs(s.Fragment, { children: [s.jsx("h4", { children: "Sua conclusão" }), s.jsx("p", { className: "pre", children: a.conclusao })] }),
            ],
          }),
          i &&
            s.jsxs("button", {
              className: "btn ghost",
              disabled: c || l,
              onClick: m,
              children: [s.jsx(q, { n: "cards", size: 18 }), " ", l ? "Cartões já criados" : c ? "Criando cartões…" : "Transformar meus erros em cartões"],
            }),
          i &&
            s.jsx(we, {
              titulo: "Discutir esta estação com o Claude",
              contexto: p,
              sugestoes: ["Por que perdi pontos?", "Explique a resposta-modelo", "Como treinar isso para a prova prática?"],
            }),
          s.jsxs("div", {
            className: "btns",
            children: [
              i && s.jsxs("button", { className: "btn", onClick: e, children: [s.jsx(q, { n: "refresh", size: 18 }), " Nova estação"] }),
              s.jsx("a", { className: "btn ghost", href: `#/ia/s/${a.sistema}`, children: "Voltar ao sistema" }),
            ],
          }),
          s.jsx("p", { className: "ia-nota", children: "Correção gerada por IA. Use como orientação e confira no conteúdo." }),
        ],
      }),
    ],
  });
}
function ig({ sistema: a }) {
  const e = Za(),
    o = ja.get(a) || Ks.find((i) => i.modulos.includes(a));
  return !e || !o
    ? null
    : s.jsx(B, {
        href: `#/ia/s/${o.id}`,
        icon: s.jsx(q, { n: "spark" }),
        title: `Treinar ${o.curto} na Clínica IA`,
        sub: "Entrevista, exame guiado, OSCE de técnica, casos e diferenciais",
        cls: "row-ia",
      });
}
