// Biblioteca: módulos, tópicos, atlas, sons, tabelas, glossário, busca.
function Bx() {
  const a = ea((i) => i.lidos),
    e = ea((i) => i.quadros),
    o = Object.values(e).filter((i) => i.dominado).length;
  return s.jsxs("div", {
    className: "page",
    children: [
      s.jsx(Q, { title: "Biblioteca", back: !1 }),
      s.jsx("div", {
        className: "pad",
        children: s.jsxs("a", {
          className: "card cad-tile",
          href: "#/quadros",
          children: [
            s.jsx(q, { n: "table", size: 28 }),
            s.jsxs("span", {
              children: [
                s.jsx("b", { children: "Caderno de Quadros" }),
                s.jsxs("small", { children: [ra.quadros.length, " quadros em ", ra.areas.length, " áreas · ", o, " dominados"] }),
              ],
            }),
            s.jsx(q, { n: "right", size: 18, cls: "muted" }),
          ],
        }),
      }),
      s.jsx(w, {
        title: "Referência rápida",
        children: s.jsxs("div", {
          className: "grid2",
          children: [
            s.jsxs("a", {
              className: "tile",
              href: "#/sinais",
              children: [s.jsx(q, { n: "search" }), s.jsx("b", { children: O.sinais.length }), s.jsx("span", { children: "Atlas de Sinais" })],
            }),
            s.jsxs("a", {
              className: "tile",
              href: "#/sons",
              children: [s.jsx(q, { n: "ear" }), s.jsx("b", { children: O.sons.length }), s.jsx("span", { children: "Banco de Sons" })],
            }),
            s.jsxs("a", {
              className: "tile",
              href: "#/tabelas",
              children: [s.jsx(q, { n: "table" }), s.jsx("b", { children: O.sindromes.length }), s.jsx("span", { children: "Tabelas de síndromes" })],
            }),
            s.jsxs("a", {
              className: "tile",
              href: "#/glossario",
              children: [s.jsx(q, { n: "list" }), s.jsx("b", { children: O.glossario.length }), s.jsx("span", { children: "Glossário" })],
            }),
          ],
        }),
      }),
      s.jsx(w, {
        title: "Módulos",
        children: O.modulos.map((i) => {
          const r = Li(i.id),
            t = r.filter((n) => a[n.id]).length;
          if (!i.disponivel || r.length === 0) {
            const n = nf(i.id).length;
            return s.jsx(
              B,
              {
                href: `#/modulo/${i.id}`,
                cls: n ? "" : "row-off",
                icon: s.jsx("span", { className: "num", children: i.num }),
                title: i.titulo,
                sub: n ? `Tópicos na fase ${i.fase} · ${n} quadros do caderno já disponíveis` : `Em breve · fase ${i.fase}`,
              },
              i.id,
            );
          }
          return s.jsx(
            B,
            {
              href: `#/modulo/${i.id}`,
              icon: s.jsx("span", { className: "num", children: i.num }),
              title: i.titulo,
              sub: s.jsxs(s.Fragment, {
                children: [s.jsxs("span", { children: [r.length, " tópicos · ", t, " lidos"] }), s.jsx(eo, { pct: t / r.length, cls: "thin" })],
              }),
            },
            i.id,
          );
        }),
      }),
    ],
  });
}
function wx({ id: a }) {
  const e = Vi.get(a),
    o = ea((t) => ({ lidos: t.lidos, estudados: t.estudados }));
  if (!e)
    return s.jsxs("div", {
      className: "page",
      children: [s.jsx(Q, { title: "Módulo" }), s.jsx("p", { className: "pad", children: "Módulo não encontrado." })],
    });
  const i = Li(a),
    r = nf(a);
  return s.jsxs("div", {
    className: "page",
    children: [
      s.jsx(Q, { title: `${e.num}. ${e.titulo}` }),
      s.jsx("p", { className: "pad muted", children: e.descricao }),
      !i.length &&
        s.jsx("div", {
          className: "pad",
          children: s.jsxs("div", {
            className: "card soft",
            children: [
              s.jsxs("b", { children: ["Tópicos detalhados chegam na fase ", e.fase, "."] }),
              s.jsx("p", { className: "small", children: "Enquanto isso, estude pelos quadros do caderno abaixo e pelos sinais desse sistema no Atlas." }),
            ],
          }),
        }),
      s.jsx("div", {
        className: "list",
        children: i.map((t, n) =>
          s.jsx(
            B,
            {
              href: `#/topico/${t.id}`,
              icon: s.jsx("span", {
                className: "num " + (o.estudados[t.id] ? "num-ok" : o.lidos[t.id] ? "num-read" : ""),
                children: o.estudados[t.id] ? s.jsx(q, { n: "check", size: 16 }) : n + 1,
              }),
              title: t.titulo,
              sub: `${t.nivel} · ${t.cartoes.length} cartões${t.casos.length ? ` · ${t.casos.length} caso${t.casos.length > 1 ? "s" : ""}` : ""}`,
            },
            t.id,
          ),
        ),
      }),
      s.jsx("div", { className: "list", children: s.jsx(ig, { sistema: a }) }),
      s.jsx(Yf, { lista: r }),
    ],
  });
}
function Vx({ id: a }) {
  const e = Za(),
    o = Va.get(a),
    i = ea((h) => ({ estudado: !!h.estudados[a], fav: !!h.favoritos[a], nota: h.notas[a] || "" })),
    [r, t] = S.useState(i.nota),
    [n, l] = S.useState(!!i.nota);
  if (
    (S.useEffect(() => {
      o && zf(o.id);
    }, [a]),
    !o)
  )
    return s.jsxs("div", {
      className: "page",
      children: [s.jsx(Q, { title: "Tópico" }), s.jsx("p", { className: "pad", children: "Tópico não encontrado." })],
    });
  const c = Vi.get(o.modulo),
    d = Li(o.modulo),
    u = d.findIndex((h) => h.id === o.id),
    m = d[u - 1],
    p = d[u + 1],
    f = () =>
      W((h) => {
        r.trim() ? (h.notas[a] = r) : delete h.notas[a];
      });
  return s.jsxs("div", {
    className: "page topic",
    children: [
      s.jsx(Q, {
        title: c.titulo,
        right: s.jsx("button", {
          className: "iconbtn " + (i.fav ? "fav" : ""),
          "aria-label": "Favoritar",
          onClick: () =>
            W((h) => {
              h.favoritos[a] ? delete h.favoritos[a] : (h.favoritos[a] = !0);
            }),
          children: s.jsx(q, { n: "star" }),
        }),
      }),
      s.jsxs("article", {
        className: "pad",
        children: [
          s.jsxs("div", {
            className: "chips",
            children: [
              s.jsx(Ta, { children: o.nivel }),
              s.jsxs(Ta, { cls: "soft", children: [c.num, ".", u + 1] }),
              i.estudado && s.jsx(Ta, { cls: "ok", children: "Estudado" }),
            ],
          }),
          s.jsx("h1", { className: "t-title", children: o.titulo }),
          s.jsxs("div", {
            className: "resumo",
            children: [
              s.jsx("b", { children: "Em 3 linhas" }),
              s.jsx("ul", { children: o.resumo.map((h, b) => s.jsx("li", { dangerouslySetInnerHTML: { __html: h } }, b)) }),
            ],
          }),
          o.secoes.length > 2 &&
            s.jsx("nav", {
              className: "toc",
              children: o.secoes.map((h, b) =>
                s.jsx(
                  "a",
                  {
                    href: `#/topico/${a}`,
                    onClick: (z) => {
                      var g;
                      z.preventDefault(), (g = document.getElementById(`s${b}`)) == null || g.scrollIntoView({ behavior: "smooth", block: "start" });
                    },
                    children: h.titulo,
                  },
                  b,
                ),
              ),
            }),
          o.secoes.map((h, b) =>
            s.jsxs(
              "section",
              {
                id: `s${b}`,
                className: "tsec tsec-" + h.titulo.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").split(" ")[0],
                children: [s.jsx("h2", { children: h.titulo }), s.jsx(Ba, { html: h.html })],
              },
              b,
            ),
          ),
          o.sons.length > 0 && s.jsx(w, { title: "Ouça", children: o.sons.map((h) => s.jsx($i, { id: h, mostrarNome: !0 }, h)) }),
          o.sinais.length > 0 &&
            s.jsx(w, {
              title: "Sinais relacionados",
              children: s.jsx("div", {
                className: "chips wrap",
                children: o.sinais.map((h) => {
                  var b;
                  return s.jsx("a", { className: "chip link", href: `#/sinal/${h}`, children: (b = Hc.get(h)) == null ? void 0 : b.nome }, h);
                }),
              }),
            }),
          s.jsx(Yf, { lista: mb(o.id), titulo: "Quadros relacionados do caderno" }),
          e &&
            s.jsxs(w, {
              title: "Estudar com o Claude",
              children: [
                s.jsx(we, {
                  contexto: () => Cs(o),
                  sugestoes: [
                    "Explique o essencial em 5 linhas",
                    "Me dê um macete para memorizar",
                    "Como isso cai na prova prática?",
                    "Qual o erro mais comum do estudante aqui?",
                  ],
                }),
                s.jsx(we, { arguicao: !0, titulo: "Arguição oral", contexto: () => Cs(o) }),
                s.jsx(B, {
                  href: `#/jogo/ia/topico/${o.id}`,
                  icon: s.jsx(q, { n: "spark" }),
                  title: "Questões inéditas deste tópico",
                  sub: "Vinhetas clínicas no estilo de prova, escritas pelo Claude",
                }),
                s.jsx(ig, { sistema: o.modulo }),
              ],
            }),
          s.jsxs(w, {
            title: "Praticar agora",
            children: [
              o.casos.map((h) => {
                var b, z;
                return s.jsx(
                  B,
                  {
                    href: `#/jogo/caso/${h}`,
                    icon: s.jsx(q, { n: "body" }),
                    title: (b = El.get(h)) == null ? void 0 : b.titulo,
                    sub: (z = El.get(h)) == null ? void 0 : z.queixa,
                  },
                  h,
                );
              }),
              s.jsx(B, {
                onClick: () => {
                  const h = Ef(o.id);
                  ca(h ? `${h} cartões entraram na sua revisão` : "Tópico marcado como estudado");
                },
                icon: s.jsx(q, { n: "cards" }),
                title: i.estudado ? "Estudado — adicionar cartões que faltam" : `Marcar como estudado (+${o.cartoes.length} cartões)`,
                sub: "Os cartões voltam na revisão espaçada",
              }),
            ],
          }),
          s.jsx("div", {
            className: "nota-box",
            children: n
              ? s.jsxs(s.Fragment, {
                  children: [
                    s.jsx("label", { htmlFor: "nota", children: s.jsx("b", { children: "Minha anotação" }) }),
                    s.jsx("textarea", { id: "nota", value: r, onChange: (h) => t(h.target.value), onBlur: f, rows: 4, placeholder: "O professor enfatizou…" }),
                  ],
                })
              : s.jsxs("button", { className: "linkbtn", onClick: () => l(!0), children: [s.jsx(q, { n: "clipboard", size: 16 }), " Adicionar anotação"] }),
          }),
          s.jsx("div", { className: "t-foot", children: s.jsx(_i, { alvo: `Tópico: ${o.titulo}` }) }),
          s.jsxs("div", {
            className: "prevnext",
            children: [
              m ? s.jsxs("a", { href: `#/topico/${m.id}`, children: [s.jsx(q, { n: "back", size: 16 }), " ", m.titulo] }) : s.jsx("span", {}),
              p ? s.jsxs("a", { href: `#/topico/${p.id}`, children: [p.titulo, " ", s.jsx(q, { n: "right", size: 16 })] }) : s.jsx("span", {}),
            ],
          }),
        ],
      }),
    ],
  });
}
function Qx() {
  const [a, e] = S.useState("todos"),
    [o, i] = S.useState(""),
    r = S.useMemo(() => Array.from(new Set(O.sinais.map((n) => n.sistema))), []),
    t = O.sinais
      .filter((n) => (a === "todos" || n.sistema === a) && (!o || ge(n.nome + " " + n.sugere).includes(ge(o))))
      .sort((n, l) => n.nome.localeCompare(l.nome, "pt"));
  return s.jsxs("div", {
    className: "page",
    children: [
      s.jsx(Q, { title: "Atlas de Sinais" }),
      s.jsxs("div", {
        className: "pad",
        children: [
          s.jsx("input", { className: "input", placeholder: "Filtrar por nome ou significado", value: o, onChange: (n) => i(n.target.value) }),
          s.jsxs("div", {
            className: "chips scroll",
            children: [
              s.jsxs("button", { className: "chip " + (a === "todos" ? "sel" : ""), onClick: () => e("todos"), children: ["Todos (", O.sinais.length, ")"] }),
              r.map((n) => s.jsx("button", { className: "chip " + (a === n ? "sel" : ""), onClick: () => e(n), children: se(n) }, n)),
            ],
          }),
        ],
      }),
      s.jsxs("div", {
        className: "list",
        children: [
          t.map((n) => s.jsx(B, { href: `#/sinal/${n.id}`, title: n.nome, sub: n.sugere }, n.id)),
          !t.length && s.jsx("p", { className: "pad muted", children: "Nenhum sinal encontrado." }),
        ],
      }),
      s.jsx("div", {
        className: "pad",
        children: s.jsxs("a", {
          className: "btn ghost",
          href: "#/jogo/detetive/classico",
          children: [s.jsx(q, { n: "search", size: 18 }), " Treinar no Detetive de Sinais"],
        }),
      }),
    ],
  });
}
function _x({ id: a }) {
  const e = Hc.get(a);
  if (!e)
    return s.jsxs("div", { className: "page", children: [s.jsx(Q, { title: "Sinal" }), s.jsx("p", { className: "pad", children: "Sinal não encontrado." })] });
  const o = e.topico ? Va.get(e.topico) : null;
  return s.jsxs("div", {
    className: "page",
    children: [
      s.jsx(Q, { title: "Atlas de Sinais" }),
      s.jsxs("article", {
        className: "pad",
        children: [
          s.jsx("div", { className: "chips", children: s.jsx(Ta, { children: se(e.sistema) }) }),
          s.jsx("h1", { className: "t-title", children: e.nome }),
          s.jsxs("div", { className: "resumo", children: [s.jsx("b", { children: "Sugere" }), s.jsx("p", { children: e.sugere })] }),
          s.jsxs("section", { className: "tsec", children: [s.jsx("h2", { children: "Técnica" }), s.jsx(Ba, { html: e.tecnica })] }),
          s.jsxs("section", { className: "tsec", children: [s.jsx("h2", { children: "Positivo quando" }), s.jsx(Ba, { html: e.positivo })] }),
          e.significado && s.jsxs("section", { className: "tsec", children: [s.jsx("h2", { children: "Significado" }), s.jsx(Ba, { html: e.significado })] }),
          e.acuracia &&
            s.jsxs("section", { className: "tsec tsec-acuracia", children: [s.jsx("h2", { children: "Acurácia" }), s.jsx(Ba, { html: e.acuracia })] }),
          e.armadilha &&
            s.jsxs("section", { className: "tsec tsec-armadilhas", children: [s.jsx("h2", { children: "Armadilha" }), s.jsx(Ba, { html: e.armadilha })] }),
          o && s.jsx(w, { title: "Estude o tópico", children: s.jsx(B, { href: `#/topico/${o.id}`, icon: s.jsx(q, { n: "book" }), title: o.titulo }) }),
          s.jsx(we, {
            compacto: !0,
            titulo: "Perguntar ao Claude sobre este sinal",
            contexto: () =>
              `Sinal: ${e.nome} (${se(e.sistema)}). Sugere: ${e.sugere}. Técnica: ${va(e.tecnica)}. Positivo: ${va(e.positivo)}. Significado: ${va(e.significado)}. Acurácia: ${va(e.acuracia)}. Armadilha: ${va(e.armadilha)}.`,
            sugestoes: ["Como faço passo a passo?", "Com o que posso confundir?", "Como descrever no prontuário?"],
          }),
          s.jsx("div", { className: "t-foot", children: s.jsx(_i, { alvo: `Sinal: ${e.nome}` }) }),
        ],
      }),
    ],
  });
}
function $x() {
  const a = kc(),
    e = [
      ["cardiaco", "Sons cardíacos"],
      ["pulmonar", "Sons pulmonares"],
    ];
  return s.jsxs("div", {
    className: "page",
    children: [
      s.jsx(Q, { title: "Banco de Sons" }),
      s.jsx("p", {
        className: "pad muted small",
        children:
          "Sons sintetizados para treino de padrão e tempo. Use fones de ouvido: alto-falantes de celular quase não reproduzem graves, como B3 e o ruflar.",
      }),
      e.map(([o, i]) =>
        s.jsx(
          w,
          {
            title: i,
            children: O.sons
              .filter((r) => r.categoria === o)
              .map((r) =>
                s.jsxs(
                  "div",
                  {
                    className: "row som-row " + (a === r.id ? "on" : ""),
                    children: [
                      s.jsx("button", {
                        className: "som-btn",
                        onClick: () => ff(r.id),
                        "aria-label": "Tocar " + r.nome,
                        children: s.jsx(q, { n: a === r.id ? "pause" : "playIcon", size: 18 }),
                      }),
                      s.jsxs("a", {
                        className: "row-t",
                        href: `#/som/${r.id}`,
                        children: [s.jsx("b", { children: r.nome }), s.jsx("small", { children: r.onde })],
                      }),
                      s.jsx(q, { n: "right", size: 18, cls: "muted" }),
                    ],
                  },
                  r.id,
                ),
              ),
          },
          o,
        ),
      ),
      s.jsx("div", {
        className: "pad",
        children: s.jsxs("a", { className: "btn ghost", href: "#/jogo/estetoscopio/quiz", children: [s.jsx(q, { n: "ear", size: 18 }), " Testar o ouvido"] }),
      }),
    ],
  });
}
function Gx({ id: a }) {
  const e = Gs.get(a);
  if (!e)
    return s.jsxs("div", { className: "page", children: [s.jsx(Q, { title: "Som" }), s.jsx("p", { className: "pad", children: "Som não encontrado." })] });
  const o = e.topico ? Va.get(e.topico) : null;
  return s.jsxs("div", {
    className: "page",
    children: [
      s.jsx(Q, { title: "Banco de Sons" }),
      s.jsxs("article", {
        className: "pad",
        children: [
          s.jsxs("div", {
            className: "chips",
            children: [s.jsx(Ta, { children: e.categoria === "cardiaco" ? "Cardíaco" : "Pulmonar" }), s.jsx(Ta, { cls: "soft", children: "Sintetizado" })],
          }),
          s.jsx("h1", { className: "t-title", children: e.nome }),
          s.jsx($i, { id: e.id, label: "Tocar em loop", fono: !1 }),
          s.jsx(Hf, { id: e.id, h: 90 }),
          s.jsx("p", { className: "muted small", children: "O traçado mostra a intensidade ao longo do tempo; a linha laranja acompanha o som." }),
          s.jsxs("section", { className: "tsec", children: [s.jsx("h2", { children: "Como soa" }), s.jsx(Ba, { html: e.descricao })] }),
          e.onde && s.jsxs("section", { className: "tsec", children: [s.jsx("h2", { children: "Onde se ouve melhor" }), s.jsx("p", { children: e.onde })] }),
          e.significado && s.jsxs("section", { className: "tsec", children: [s.jsx("h2", { children: "Significado" }), s.jsx(Ba, { html: e.significado })] }),
          o && s.jsx(w, { title: "Estude o tópico", children: s.jsx(B, { href: `#/topico/${o.id}`, icon: s.jsx(q, { n: "book" }), title: o.titulo }) }),
          s.jsx(we, {
            compacto: !0,
            titulo: "Perguntar ao Claude sobre este som",
            contexto: () =>
              `Som de ausculta: ${e.nome} (${e.categoria}). Como soa: ${va(e.descricao)}. Onde: ${e.onde}. Significado: ${va(e.significado)}. Observação: no app o som é sintetizado.`,
            sugestoes: ["Como diferenciar de sons parecidos?", "Que manobras acentuam este som?", "Como descrever no prontuário?"],
          }),
          s.jsx("div", { className: "t-foot", children: s.jsx(_i, { alvo: `Som: ${e.nome}` }) }),
        ],
      }),
    ],
  });
}
function Ux() {
  return s.jsxs("div", {
    className: "page",
    children: [
      s.jsx(Q, { title: "Tabelas de síndromes" }),
      s.jsx("p", { className: "pad muted", children: "Comparações lado a lado dos achados que separam uma síndrome da outra." }),
      s.jsx("div", {
        className: "list",
        children: O.sindromes.map((a) =>
          s.jsx(B, { href: `#/sindrome/${a.id}`, icon: s.jsx(q, { n: "table" }), title: a.titulo, sub: `${a.linhas.length} itens · ${se(a.sistema)}` }, a.id),
        ),
      }),
    ],
  });
}
function Wx({ id: a }) {
  const e = rf.get(a),
    [o, i] = S.useState("cards");
  return e
    ? s.jsxs("div", {
        className: "page",
        children: [
          s.jsx(Q, { title: "Tabela" }),
          s.jsxs("div", {
            className: "pad",
            children: [
              s.jsx("h1", { className: "t-title", children: e.titulo }),
              e.descricao && s.jsx("p", { className: "muted", children: e.descricao }),
              s.jsxs("div", {
                className: "seg",
                children: [
                  s.jsx("button", { className: o === "cards" ? "on" : "", onClick: () => i("cards"), children: "Cartões" }),
                  s.jsx("button", { className: o === "tabela" ? "on" : "", onClick: () => i("tabela"), children: "Tabela" }),
                ],
              }),
              o === "cards"
                ? e.linhas.map((r) =>
                    s.jsxs(
                      "div",
                      {
                        className: "card sind-card",
                        children: [
                          s.jsx("h3", { children: r.nome }),
                          s.jsx("dl", {
                            children: e.colunas.map((t) =>
                              s.jsxs(vi.Fragment, { children: [s.jsx("dt", { children: t.nome }), s.jsx("dd", { children: r.valores[t.id] })] }, t.id),
                            ),
                          }),
                          r.nota && s.jsx("p", { className: "muted small", children: r.nota }),
                        ],
                      },
                      r.nome,
                    ),
                  )
                : s.jsx("div", {
                    className: "table-wrap",
                    children: s.jsxs("table", {
                      className: "tbl",
                      children: [
                        s.jsx("thead", {
                          children: s.jsxs("tr", { children: [s.jsx("th", {}), e.colunas.map((r) => s.jsx("th", { children: r.nome }, r.id))] }),
                        }),
                        s.jsx("tbody", {
                          children: e.linhas.map((r) =>
                            s.jsxs(
                              "tr",
                              { children: [s.jsx("th", { children: r.nome }), e.colunas.map((t) => s.jsx("td", { children: r.valores[t.id] }, t.id))] },
                              r.nome,
                            ),
                          ),
                        }),
                      ],
                    }),
                  }),
              s.jsxs("a", { className: "btn", href: `#/jogo/sindrome/${e.id}`, children: [s.jsx(q, { n: "puzzle", size: 18 }), " Jogar Monte a Síndrome"] }),
              s.jsx("div", { className: "t-foot", children: s.jsx(_i, { alvo: `Tabela: ${e.titulo}` }) }),
            ],
          }),
        ],
      })
    : s.jsxs("div", { className: "page", children: [s.jsx(Q, { title: "Tabela" }), s.jsx("p", { className: "pad", children: "Tabela não encontrada." })] });
}
function Kx({ foco: a }) {
  const [e, o] = S.useState("");
  S.useEffect(() => {
    a &&
      setTimeout(() => {
        var r;
        return (r = document.getElementById("g-" + a)) == null ? void 0 : r.scrollIntoView({ block: "center" });
      }, 50);
  }, [a]);
  const i = O.glossario.filter((r) => !e || ge(r.termo + " " + r.sinonimos.join(" ")).includes(ge(e))).sort((r, t) => r.termo.localeCompare(t.termo, "pt"));
  return s.jsxs("div", {
    className: "page",
    children: [
      s.jsx(Q, { title: "Glossário" }),
      s.jsx("div", {
        className: "pad",
        children: s.jsx("input", { className: "input", placeholder: "Filtrar termos", value: e, onChange: (r) => o(r.target.value) }),
      }),
      s.jsx("div", {
        className: "pad",
        children: i.map((r) =>
          s.jsxs(
            "div",
            {
              id: "g-" + r.id,
              className: "gloss " + (a === r.id ? "foco" : ""),
              children: [
                s.jsx("b", { children: r.termo }),
                r.sinonimos.length > 0 && s.jsxs("small", { className: "muted", children: [" · também: ", r.sinonimos.join(", ")] }),
                s.jsx(Ba, { html: r.def }),
              ],
            },
            r.id,
          ),
        ),
      }),
    ],
  });
}
function Jx({ q0: a }) {
  const [e, o] = S.useState(a),
    i = S.useRef(null);
  S.useEffect(() => {
    var n;
    (n = i.current) == null || n.focus();
  }, []);
  const r = S.useMemo(() => hb(e), [e]),
    t = S.useMemo(() => {
      const n = new Map();
      for (const l of r) n.has(l.tipo) || n.set(l.tipo, []), n.get(l.tipo).push(l);
      return Array.from(n.entries());
    }, [r]);
  return s.jsxs("div", {
    className: "page",
    children: [
      s.jsxs("header", {
        className: "topbar",
        children: [
          s.jsx("button", { className: "iconbtn", "aria-label": "Voltar", onClick: Ws, children: s.jsx(q, { n: "back" }) }),
          s.jsx("input", { ref: i, className: "input search-in", placeholder: "Sinal, sopro, manobra, termo…", value: e, onChange: (n) => o(n.target.value) }),
        ],
      }),
      e.trim().length < 2
        ? s.jsxs("div", {
            className: "pad muted",
            children: [
              s.jsx("p", { children: "Busca em todo o conteúdo, sem internet. Sinônimos valem: “estertor” encontra crepitações." }),
              s.jsx("div", {
                className: "chips wrap",
                children: ["sopro", "B3", "Murphy", "frêmito", "edema", "Kussmaul", "ictus", "egofonia"].map((n) =>
                  s.jsx("button", { className: "chip", onClick: () => o(n), children: n }, n),
                ),
              }),
            ],
          })
        : r.length === 0
          ? s.jsxs("p", { className: "pad muted", children: ["Nada encontrado para “", e, "”."] })
          : t.map(([n, l]) => s.jsx(w, { title: n, children: l.slice(0, 12).map((c) => s.jsx(B, { href: c.rota, title: c.titulo, sub: c.sub }, c.id)) }, n)),
    ],
  });
}
