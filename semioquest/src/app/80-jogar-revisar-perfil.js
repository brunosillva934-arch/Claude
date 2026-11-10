// Abas Jogar, Revisar e Perfil; onboarding.
function Du() {
  const a = ea((r) => r.casos),
    [e, o] = S.useState(!1),
    i = Array.from(new Set(O.casos.map((r) => r.sistema)));
  return s.jsxs("div", {
    className: "page",
    children: [
      s.jsx(Q, { title: "Jogar", back: !1 }),
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
                    s.jsx("small", { children: "12 sistemas · anamnese, exame físico, OSCE, casos e comunicação" }),
                  ],
                }),
                s.jsx(q, { n: "right", size: 18 }),
              ],
            }),
            s.jsxs("div", {
              className: "ia-grid",
              children: [
                s.jsxs("a", {
                  className: "gtile ia",
                  href: "#/jogo/novo-caso",
                  children: [
                    s.jsx(q, { n: "spark", size: 26 }),
                    s.jsx("b", { children: "Paciente inédito" }),
                    s.jsx("small", { children: "O Claude cria um caso novo para você atender" }),
                  ],
                }),
                s.jsxs("a", {
                  className: "gtile ia",
                  href: "#/jogo/ia/fraquezas",
                  children: [
                    s.jsx(q, { n: "flag", size: 26 }),
                    s.jsx("b", { children: "Treino nas fraquezas" }),
                    s.jsx("small", { children: "Questões inéditas no que você mais erra" }),
                  ],
                }),
              ],
            }),
            s.jsx("p", {
              className: "muted small pad-x",
              children: "Nos casos do Paciente Virtual, a anamnese agora pode ser por conversa livre: escreva a pergunta como falaria.",
            }),
          ],
        }),
      }),
      s.jsx(w, {
        title: "Treinos rápidos",
        children: s.jsxs("div", {
          className: "games",
          children: [
            s.jsxs("a", {
              className: "gtile",
              href: "#/jogo/simulado",
              children: [
                s.jsx(q, { n: "target", size: 26 }),
                s.jsx("b", { children: "Simulado de prova" }),
                s.jsxs("small", { children: [O.questoes.length, " vinhetas clínicas com explicação, por sistema"] }),
              ],
            }),
            s.jsxs("a", {
              className: "gtile",
              href: "#/jogo/estetoscopio/quiz",
              children: [
                s.jsx(q, { n: "ear", size: 26 }),
                s.jsx("b", { children: "Estetoscópio" }),
                s.jsx("small", { children: "Que som é esse? Bulhas, sopros e ruídos pulmonares" }),
              ],
            }),
            s.jsxs("a", {
              className: "gtile",
              href: "#/jogo/detetive/classico",
              children: [
                s.jsx(q, { n: "search", size: 26 }),
                s.jsx("b", { children: "Detetive de Sinais" }),
                s.jsx("small", { children: "Técnica → nome, nome → significado" }),
              ],
            }),
            s.jsxs("a", {
              className: "gtile",
              href: "#/jogo/detetive/relampago",
              children: [
                s.jsx(q, { n: "bolt", size: 26 }),
                s.jsx("b", { children: "Relâmpago" }),
                s.jsx("small", { children: "60 segundos de sinais, sem pausa" }),
              ],
            }),
            s.jsxs("a", {
              className: "gtile",
              href: "#/jogo/sequencia",
              children: [
                s.jsx(q, { n: "list", size: 26 }),
                s.jsx("b", { children: "Sequência Certa" }),
                s.jsx("small", { children: "Ponha as etapas do exame em ordem" }),
              ],
            }),
            s.jsxs("a", {
              className: "gtile",
              href: "#/jogo/sindrome",
              children: [
                s.jsx(q, { n: "puzzle", size: 26 }),
                s.jsx("b", { children: "Monte a Síndrome" }),
                s.jsx("small", { children: "Achados → síndrome e vice-versa" }),
              ],
            }),
            s.jsxs("a", {
              className: "gtile",
              href: "#/jogo/desafio",
              children: [
                s.jsx(q, { n: "flame", size: 26 }),
                s.jsx("b", { children: "Desafio do Dia" }),
                s.jsx("small", { children: "6 questões mistas, uma vez por dia" }),
              ],
            }),
          ],
        }),
      }),
      s.jsxs(w, {
        title: "Caderno de Quadros",
        children: [
          s.jsx(B, {
            href: "#/jogo/area",
            icon: s.jsx(q, { n: "bolt" }),
            title: "Simulado por área",
            sub: `15 questões de quadros diferentes · ${ra.areas.length} áreas`,
          }),
          s.jsx(B, {
            href: "#/jogo/quadro/aleatorio",
            icon: s.jsx(q, { n: "refresh" }),
            title: "Quadro aleatório",
            sub: `10 questões de um dos ${ra.quadros.length} quadros`,
          }),
        ],
      }),
      s.jsxs(w, {
        title: "Paciente Virtual",
        action: s.jsxs("label", {
          className: "toggle",
          children: [s.jsx("input", { type: "checkbox", checked: e, onChange: (r) => o(r.target.checked) }), s.jsx("span", { children: "Modo OSCE" })],
        }),
        children: [
          s.jsx("p", {
            className: "muted small pad-x",
            children: e
              ? "Modo OSCE: 10 minutos de consulta, checklist de comunicação e técnica. Cada pergunta e manobra gasta tempo."
              : "Consulta completa: anamnese, exame físico tocando no corpo, síntese e feedback.",
          }),
          i.map((r) =>
            s.jsxs(
              "div",
              {
                children: [
                  s.jsx("h3", { className: "sub-h", children: se(r) }),
                  O.casos
                    .filter((t) => t.sistema === r)
                    .map((t) => {
                      const n = a[t.id];
                      return s.jsx(
                        B,
                        {
                          href: `#/jogo/caso/${t.id}${e ? "?osce=1" : ""}`,
                          icon: s.jsx(q, { n: "body" }),
                          title: t.titulo,
                          sub: t.queixa,
                          right: n
                            ? s.jsx(Ta, { cls: n.melhor >= 80 ? "ok" : n.melhor >= 60 ? "warn" : "bad", children: n.melhor })
                            : s.jsx(Ta, { cls: "soft", children: t.nivel }),
                        },
                        t.id,
                      );
                    }),
                ],
              },
              r,
            ),
          ),
        ],
      }),
    ],
  });
}
function Xx() {
  const [a, e] = S.useState(null),
    o = ea((n) => Object.keys(n.cards).length),
    i = ea(() => Qc()),
    r = ea((n) => n.filaNovos.length);
  if (a) return s.jsx(Yx, { ids: a, onFim: () => e(null) });
  const t = i.vencidos.length + i.novos.length;
  return s.jsxs("div", {
    className: "page",
    children: [
      s.jsx(Q, { title: "Revisar", back: !1 }),
      s.jsxs("div", {
        className: "pad",
        children: [
          s.jsxs("div", {
            className: "card review-hero",
            children: [
              s.jsxs("div", {
                className: "grid3",
                children: [
                  s.jsxs("div", { children: [s.jsx("b", { children: i.vencidos.length }), s.jsx("small", { children: "para revisar" })] }),
                  s.jsxs("div", { children: [s.jsx("b", { children: i.novos.length }), s.jsx("small", { children: "novos hoje" })] }),
                  s.jsxs("div", { children: [s.jsx("b", { children: jf() }), s.jsx("small", { children: "vencem amanhã" })] }),
                ],
              }),
              s.jsx("button", {
                className: "btn",
                disabled: !t,
                onClick: () => e([...i.vencidos, ...i.novos]),
                children: t ? `Começar (${t})` : "Nada para hoje",
              }),
              s.jsxs("p", { className: "muted small", children: [o, " cartões em estudo · ", r, " aguardando na fila de novos"] }),
            ],
          }),
          s.jsx("p", {
            className: "muted small",
            children:
              "A revisão usa o algoritmo FSRS: cada cartão volta pouco antes de você esquecer. Cartões novos entram quando você marca um tópico como estudado ou erra algo num jogo.",
          }),
          s.jsx(Zx, {}),
          s.jsxs(w, {
            title: "Adicionar cartões por módulo",
            children: [
              O.modulos
                .filter((n) => n.disponivel && Li(n.id).length)
                .map((n) => {
                  const l = Li(n.id).flatMap((c) => c.cartoes.map((d) => d.id));
                  return s.jsx(
                    B,
                    {
                      icon: s.jsx("span", { className: "num", children: n.num }),
                      title: n.titulo,
                      sub: `${l.length} cartões`,
                      right: s.jsx(q, { n: "cards", size: 18, cls: "muted" }),
                      onClick: () => {
                        const c = Ee(l);
                        ca(c ? `${c} cartões na fila de novos` : "Todos já estão na sua revisão");
                      },
                    },
                    n.id,
                  );
                }),
              s.jsx(B, {
                icon: s.jsx(q, { n: "search" }),
                title: "Atlas de Sinais",
                sub: `${O.sinais.length * 2} cartões`,
                onClick: () => {
                  const n = Ee(O.sinais.flatMap((l) => [`sinal:${l.id}:a`, `sinal:${l.id}:b`]));
                  ca(n ? `${n} cartões na fila` : "Já estão na revisão");
                },
                right: s.jsx(q, { n: "cards", size: 18, cls: "muted" }),
              }),
              s.jsx(B, {
                icon: s.jsx(q, { n: "ear" }),
                title: "Banco de Sons",
                sub: `${O.sons.length} cartões`,
                onClick: () => {
                  const n = Ee(O.sons.map((l) => `som:${l.id}`));
                  ca(n ? `${n} cartões na fila` : "Já estão na revisão");
                },
                right: s.jsx(q, { n: "cards", size: 18, cls: "muted" }),
              }),
              s.jsx(B, {
                icon: s.jsx(q, { n: "table" }),
                title: "Tabelas de síndromes",
                sub: "Cada célula vira um cartão",
                onClick: () => {
                  const n = Array.from(Mt().keys()).filter((c) => c.startsWith("sind:")),
                    l = Ee(n);
                  ca(l ? `${l} cartões na fila` : "Já estão na revisão");
                },
                right: s.jsx(q, { n: "cards", size: 18, cls: "muted" }),
              }),
            ],
          }),
        ],
      }),
    ],
  });
}
function Yx({ ids: a, onFim: e }) {
  const [o, i] = S.useState(a),
    [r, t] = S.useState(!1),
    [n, l] = S.useState(0);
  S.useEffect(() => (document.body.classList.add("no-tabs"), () => document.body.classList.remove("no-tabs")), []);
  const c = Mt(),
    d = o[0],
    u = d ? c.get(d) : null,
    m = S.useMemo(() => (d ? Pf(d) : {}), [d, n]);
  if (!u)
    return s.jsxs("div", {
      className: "page game",
      children: [
        s.jsxs("header", {
          className: "game-top",
          children: [
            s.jsx("button", { className: "iconbtn", onClick: e, "aria-label": "Fechar", children: s.jsx(q, { n: "x" }) }),
            s.jsxs("div", { className: "game-title", children: [s.jsx("b", { children: "Revisão" }), s.jsx("small", { children: "concluída" })] }),
            s.jsx("span", {}),
          ],
        }),
        s.jsxs("div", {
          className: "pad center",
          children: [
            s.jsxs("div", {
              className: "score ok",
              children: [
                s.jsx("b", { children: n }),
                s.jsx("span", { children: "revisões" }),
                s.jsxs("small", { children: ["+", n * 2, " XP · Sessão concluída"] }),
              ],
            }),
            s.jsx("button", { className: "btn", onClick: e, children: "Voltar" }),
          ],
        }),
      ],
    });
  const p = (f) => {
    Me();
    const h = Sf(d, f),
      b = o.slice(1);
    h.getTime() - Date.now() < 15 * 6e4 && b.push(d), i(b), t(!1), l((z) => z + 1);
  };
  return s.jsxs("div", {
    className: "page game",
    children: [
      s.jsxs("header", {
        className: "game-top",
        children: [
          s.jsx("button", {
            className: "iconbtn",
            onClick: () => {
              Me(), e();
            },
            "aria-label": "Fechar",
            children: s.jsx(q, { n: "x" }),
          }),
          s.jsxs("div", {
            className: "game-title",
            children: [s.jsx("b", { children: "Revisão" }), s.jsxs("small", { children: [o.length, " restantes · ", u.deck] })],
          }),
          s.jsx("span", {}),
        ],
      }),
      s.jsx(eo, { pct: n / Math.max(1, n + o.length), cls: "thin flat" }),
      s.jsxs("div", {
        className: "pad",
        children: [
          s.jsxs("div", {
            className: "flash",
            onClick: () => !r && t(!0),
            children: [
              s.jsx(Ba, { html: u.frente, cls: "flash-f" }),
              u.som && s.jsx("div", { onClick: (f) => f.stopPropagation(), children: s.jsx($i, { id: u.som, label: "Tocar" }) }),
              r &&
                s.jsxs(s.Fragment, {
                  children: [
                    s.jsx("hr", {}),
                    s.jsx(Ba, { html: u.verso, cls: "flash-b" }),
                    u.rota &&
                      s.jsxs("a", {
                        className: "linkbtn small",
                        href: u.rota,
                        onClick: (f) => f.stopPropagation(),
                        children: [s.jsx(q, { n: "book", size: 14 }), " Ver no conteúdo"],
                      }),
                  ],
                }),
            ],
          }),
          r
            ? s.jsxs("div", {
                className: "rate",
                children: [
                  s.jsxs("button", {
                    className: "r-again",
                    onClick: () => p(H.Again),
                    children: [s.jsx("b", { children: "Errei" }), s.jsx("small", { children: m[H.Again] })],
                  }),
                  s.jsxs("button", {
                    className: "r-hard",
                    onClick: () => p(H.Hard),
                    children: [s.jsx("b", { children: "Difícil" }), s.jsx("small", { children: m[H.Hard] })],
                  }),
                  s.jsxs("button", {
                    className: "r-good",
                    onClick: () => p(H.Good),
                    children: [s.jsx("b", { children: "Bom" }), s.jsx("small", { children: m[H.Good] })],
                  }),
                  s.jsxs("button", {
                    className: "r-easy",
                    onClick: () => p(H.Easy),
                    children: [s.jsx("b", { children: "Fácil" }), s.jsx("small", { children: m[H.Easy] })],
                  }),
                ],
              })
            : s.jsx("button", { className: "btn", onClick: () => t(!0), children: "Mostrar resposta" }),
        ],
      }),
    ],
  });
}
function Zx() {
  const a = ea((i) => i.quadros),
    e = ea(() => Mf(6)),
    o = Object.values(a).filter((i) => i.dominado).length;
  return s.jsxs(w, {
    title: "Quadros para revisar",
    action: s.jsx("a", { className: "linkbtn small", href: "#/quadros", children: "Caderno" }),
    children: [
      e.length === 0
        ? s.jsx("p", {
            className: "muted small",
            children: "Quadros que você abrir e ainda não marcar como dominados aparecem aqui, do mais antigo para o mais recente.",
          })
        : e.map((i) => {
            const r = Ve.get(i);
            return s.jsx(
              B,
              {
                href: `#/quadro/${i}`,
                icon: s.jsx("span", { className: "num num-read", children: s.jsx("small", { children: i }) }),
                title: r.titulo,
                sub: "Recite e marque como dominado",
              },
              i,
            );
          }),
      s.jsxs("p", { className: "muted small", children: [o, " de ", ra.quadros.length, " quadros dominados."] }),
    ],
  });
}
function Tu(a) {
  try {
    navigator.clipboard.writeText(a).then(
      () => ca("Copiado"),
      () => Nu(a),
    );
  } catch (e) {
    Nu(a);
  }
}
function Nu(a) {
  const e = document.createElement("textarea");
  (e.value = a), document.body.appendChild(e), e.select();
  try {
    document.execCommand("copy"), ca("Copiado");
  } catch (o) {
    ca("Não foi possível copiar");
  }
  e.remove();
}
function a1() {
  const a = ea((u) => u),
    e = Vc(a.xp),
    [o, i] = S.useState(""),
    [r, t] = S.useState(""),
    n = Object.entries(a.stats)
      .filter(([, u]) => u.t >= 3)
      .sort((u, m) => m[1].t - u[1].t),
    l = Array.from({ length: 14 }, (u, m) => {
      const p = new Date();
      p.setDate(p.getDate() - (13 - m));
      const f = `${p.getFullYear()}-${String(p.getMonth() + 1).padStart(2, "0")}-${String(p.getDate()).padStart(2, "0")}`;
      return { k: f, v: a.dias[f] || 0, l: "DSTQQSS"[p.getDay()] };
    }),
    c = Math.max(20, ...l.map((u) => u.v)),
    d = a.relatos.map((u) => `• [${new Date(u.data).toLocaleDateString("pt-BR")}] ${u.alvo}: ${u.texto}`).join(`
`);
  return s.jsxs("div", {
    className: "page",
    children: [
      s.jsx(Q, { title: "Perfil", back: !1 }),
      s.jsxs("div", {
        className: "pad",
        children: [
          s.jsxs("div", {
            className: "card profile",
            children: [
              s.jsx("div", { className: "avatar big", children: s.jsx(q, { n: "steth", size: 30 }) }),
              s.jsxs("div", {
                className: "grow",
                children: [
                  s.jsx("h2", { children: e.atual.nome }),
                  s.jsx(eo, { pct: e.pct }),
                  s.jsxs("small", { className: "muted", children: [a.xp, " XP", e.prox ? ` · próximo: ${e.prox.nome} (${e.prox.xp})` : ""] }),
                ],
              }),
            ],
          }),
          s.jsx(Jf, {}),
          s.jsxs("div", {
            className: "grid3 stats",
            children: [
              s.jsxs("div", { children: [s.jsx("b", { children: Ot(a.dias) }), s.jsx("small", { children: "dias seguidos" })] }),
              s.jsxs("div", {
                children: [s.jsxs("b", { children: [Object.keys(a.lidos).length, "/", O.topicos.length] }), s.jsx("small", { children: "tópicos lidos" })],
              }),
              s.jsxs("div", {
                children: [s.jsxs("b", { children: [Object.keys(a.casos).length, "/", O.casos.length] }), s.jsx("small", { children: "casos feitos" })],
              }),
              s.jsxs("div", {
                children: [
                  s.jsxs("b", { children: [a.contadores.respostas ? Math.round(((a.contadores.acertos || 0) / a.contadores.respostas) * 100) : 0, "%"] }),
                  s.jsx("small", { children: "acertos" }),
                ],
              }),
              s.jsxs("div", { children: [s.jsx("b", { children: Object.keys(a.cards).length }), s.jsx("small", { children: "cartões em estudo" })] }),
              s.jsxs("div", { children: [s.jsx("b", { children: a.contadores.revisoes || 0 }), s.jsx("small", { children: "revisões" })] }),
              s.jsxs("div", {
                children: [
                  s.jsx("b", { children: Object.values(a.quadros).filter((u) => u.dominado).length }),
                  s.jsx("small", { children: "quadros dominados" }),
                ],
              }),
              s.jsxs("div", {
                children: [s.jsx("b", { children: Object.values(a.quadros).filter((u) => u.visto).length }), s.jsx("small", { children: "quadros vistos" })],
              }),
              s.jsxs("div", {
                children: [
                  s.jsx("b", {
                    children:
                      (a.contadores.estacoes || 0) +
                      (a.contadores.ia || 0) +
                      (a.contadores.conversas || 0) +
                      (a.contadores.registros || 0) +
                      (a.contadores.gerados || 0),
                  }),
                  s.jsx("small", { children: "sessões com IA" }),
                ],
              }),
            ],
          }),
          s.jsx(w, {
            title: "Últimos 14 dias",
            children: s.jsx("div", {
              className: "spark",
              children: l.map((u) =>
                s.jsxs(
                  "div",
                  {
                    title: `${u.k}: ${u.v} XP`,
                    children: [
                      s.jsx("i", { style: { height: `${Math.max(3, (u.v / c) * 56)}px` }, className: u.v ? "on" : "" }),
                      s.jsx("small", { children: u.l }),
                    ],
                  },
                  u.k,
                ),
              ),
            }),
          }),
          s.jsx(w, { title: "Competências na Clínica IA", children: s.jsx(CompPerfil, {}) }),
          s.jsxs(w, {
            title: "Mapa de domínio",
            children: [
              n.length === 0 && s.jsx("p", { className: "muted small", children: "Jogue alguns treinos para ver seu domínio por sistema." }),
              n.map(([u, m]) =>
                s.jsxs(
                  "div",
                  {
                    className: "dom",
                    children: [
                      s.jsx("span", { children: se(u) }),
                      s.jsx(eo, { pct: m.ema, cls: m.ema >= 0.75 ? "ok" : m.ema >= 0.5 ? "warn" : "bad" }),
                      s.jsxs("b", { children: [Math.round(m.ema * 100), "%"] }),
                    ],
                  },
                  u,
                ),
              ),
              n.length > 0 && s.jsx("p", { className: "muted small", children: "O domínio pesa mais as respostas recentes." }),
            ],
          }),
          s.jsx(w, {
            title: `Conquistas (${Object.keys(a.conquistas).length}/${mt.length})`,
            children: s.jsx("div", {
              className: "badges",
              children: mt.map((u) =>
                s.jsxs(
                  "div",
                  {
                    className: "badge " + (a.conquistas[u.id] ? "on" : ""),
                    children: [s.jsx(q, { n: "trophy", size: 20 }), s.jsx("b", { children: u.nome }), s.jsx("small", { children: u.desc })],
                  },
                  u.id,
                ),
              ),
            }),
          }),
          s.jsx(w, {
            title: "Patentes",
            children: s.jsx("div", {
              className: "patentes",
              children: lo.map((u) => s.jsxs("span", { className: a.xp >= u.xp ? "on" : "", children: [u.nome, s.jsx("small", { children: u.xp })] }, u.nome)),
            }),
          }),
          Object.keys(a.favoritos).length > 0 &&
            s.jsx(w, {
              title: "Favoritos",
              children: Object.keys(a.favoritos).map(
                (u) => Va.get(u) && s.jsx(B, { href: `#/topico/${u}`, icon: s.jsx(q, { n: "star" }), title: Va.get(u).titulo }, u),
              ),
            }),
          s.jsxs(w, {
            title: "Ajustes",
            children: [
              s.jsxs("div", {
                className: "setting",
                children: [
                  s.jsx("span", { children: "Tema" }),
                  s.jsx("div", {
                    className: "seg small",
                    children: [
                      ["system", "Sistema"],
                      ["light", "Claro"],
                      ["dark", "Escuro"],
                    ].map(([u, m]) =>
                      s.jsx(
                        "button",
                        {
                          className: a.settings.theme === u ? "on" : "",
                          onClick: () =>
                            W((p) => {
                              p.settings.theme = u;
                            }),
                          children: m,
                        },
                        u,
                      ),
                    ),
                  }),
                ],
              }),
              s.jsxs("div", {
                className: "setting",
                children: [
                  s.jsx("span", { children: "Tamanho da letra" }),
                  s.jsx("div", {
                    className: "seg small",
                    children: ["A", "A", "A"].map((u, m) =>
                      s.jsx(
                        "button",
                        {
                          style: { fontSize: 12 + m * 3 },
                          className: a.settings.font === m ? "on" : "",
                          onClick: () =>
                            W((p) => {
                              p.settings.font = m;
                            }),
                          children: u,
                        },
                        m,
                      ),
                    ),
                  }),
                ],
              }),
              s.jsxs("div", {
                className: "setting",
                children: [
                  s.jsx("span", { children: "Cartões novos por dia" }),
                  s.jsx("div", {
                    className: "seg small",
                    children: [10, 20, 40].map((u) =>
                      s.jsx(
                        "button",
                        {
                          className: a.settings.novosPorDia === u ? "on" : "",
                          onClick: () =>
                            W((m) => {
                              m.settings.novosPorDia = u;
                            }),
                          children: u,
                        },
                        u,
                      ),
                    ),
                  }),
                ],
              }),
            ],
          }),
          s.jsxs(w, {
            title: "Dados",
            children: [
              s.jsx(B, {
                icon: s.jsx(q, { n: "flag" }),
                title: `Relatos de erro (${a.relatos.length})`,
                sub: "Copie e me envie para corrigir na próxima versão",
                onClick: () => i("relatos"),
              }),
              s.jsx(B, {
                icon: s.jsx(q, { n: "cards" }),
                title: "Copiar backup do progresso",
                sub: "Gera um código para guardar ou passar a outro aparelho",
                onClick: () => i("backup"),
              }),
              s.jsx(B, {
                icon: s.jsx(q, { n: "refresh" }),
                title: "Restaurar backup",
                onClick: () => {
                  t(""), i("restaurar");
                },
              }),
              s.jsx(B, { icon: s.jsx(q, { n: "x" }), title: "Zerar progresso", onClick: () => i("zerar") }),
              s.jsx(B, { icon: s.jsx(q, { n: "info" }), title: "Sobre o SemioQuest", onClick: () => i("sobre") }),
            ],
          }),
        ],
      }),
      s.jsx(ii, {
        open: o === "relatos",
        onClose: () => i(""),
        title: "Relatos de erro",
        children:
          a.relatos.length === 0
            ? s.jsx("p", { className: "muted", children: "Nenhum relato ainda. Use “Reportar erro” no fim de cada tópico, sinal ou caso." })
            : s.jsxs(s.Fragment, {
                children: [
                  s.jsx("textarea", { readOnly: !0, rows: 8, value: d }),
                  s.jsxs("div", {
                    className: "btns",
                    children: [
                      s.jsx("button", { className: "btn", onClick: () => Tu(d), children: "Copiar lista" }),
                      s.jsx("button", {
                        className: "btn ghost",
                        onClick: () => {
                          W((u) => {
                            u.relatos = [];
                          }),
                            i("");
                        },
                        children: "Limpar",
                      }),
                    ],
                  }),
                ],
              }),
      }),
      s.jsxs(ii, {
        open: o === "backup",
        onClose: () => i(""),
        title: "Backup do progresso",
        children: [
          s.jsx("p", {
            className: "muted small",
            children: "Guarde este código num lugar seguro (notas, e-mail). Para restaurar, cole em “Restaurar backup”.",
          }),
          s.jsx("textarea", { readOnly: !0, rows: 6, value: o === "backup" ? yl() : "" }),
          s.jsx("button", { className: "btn", onClick: () => Tu(yl()), children: "Copiar código" }),
        ],
      }),
      s.jsxs(ii, {
        open: o === "restaurar",
        onClose: () => i(""),
        title: "Restaurar backup",
        children: [
          s.jsx("p", { className: "muted small", children: "Cole o código do backup. O progresso atual será substituído." }),
          s.jsx("textarea", { rows: 6, value: r, onChange: (u) => t(u.target.value) }),
          s.jsx("button", {
            className: "btn",
            disabled: !r.trim(),
            onClick: () => {
              Df(r) ? (ca("Progresso restaurado"), i("")) : ca("Código inválido");
            },
            children: "Restaurar",
          }),
        ],
      }),
      s.jsxs(ii, {
        open: o === "zerar",
        onClose: () => i(""),
        title: "Zerar progresso?",
        children: [
          s.jsxs("p", {
            children: [
              "Isso apaga XP, cartões, estatísticas e anotações",
              " (aqui e na sua conta)",
              ". Não dá para desfazer, a menos que você tenha um backup.",
            ],
          }),
          s.jsxs("div", {
            className: "btns",
            children: [
              s.jsx("button", {
                className: "btn danger",
                onClick: () => {
                  Tf(), i(""), ca("Progresso zerado");
                },
                children: "Zerar tudo",
              }),
              s.jsx("button", { className: "btn ghost", onClick: () => i(""), children: "Cancelar" }),
            ],
          }),
        ],
      }),
      s.jsxs(ii, {
        open: o === "sobre",
        onClose: () => i(""),
        title: "Sobre o SemioQuest",
        children: [
          s.jsxs("p", {
            children: [
              s.jsxs("b", { children: ["SemioQuest ", Xf, " online"] }),
              " — a mesma base do app Android, rodando como artefato no Claude. Aqui a IA do Claude conversa como paciente, corrige seu prontuário, tira dúvidas e cria questões e pacientes inéditos, sempre a partir do conteúdo do app. Seu progresso fica numa área privada da sua conta: nem o dono do artefato vê.",
            ],
          }),
          s.jsx("p", {
            children:
              "Conteúdo escrito do zero, alinhado às referências clássicas (Porto, Bates, López & Laurentys; acurácia segundo McGee e a série Rational Clinical Examination do JAMA).",
          }),
          s.jsx("p", { children: "Os sons são sintetizados: aproximações didáticas de padrão e tempo, não gravações reais." }),
          s.jsxs("p", {
            children: [
              "O Caderno de Quadros vem do material “",
              ra.fonte,
              "”, integrado ao app a seu pedido. Segundo o próprio caderno, os quadros foram gerados por IA: confira com o livro-texto e as diretrizes vigentes.",
            ],
          }),
          s.jsx("p", { children: "Respostas, correções, questões e casos gerados pela IA podem conter erros: use como apoio e confira no conteúdo." }),
          s.jsx("p", {
            className: "muted small",
            children: "Material de estudo. Não substitui aulas, livros-texto nem a prática supervisionada com pacientes.",
          }),
        ],
      }),
    ],
  });
}
function e1() {
  const [a, e] = S.useState(0),
    o = [
      {
        ic: "steth",
        t: "Semiologia na prática",
        p: `${O.topicos.length} tópicos detalhados, ${O.sinais.length} sinais no Atlas, ${O.sons.length} sons de ausculta e um caderno com ${O.caderno.quadros.length} quadros comparativos.`,
      },
      {
        ic: "body",
        t: "Examine pacientes virtuais",
        p: `Faça a anamnese, toque no corpo para examinar, monte a síndrome e receba nota com feedback. São ${O.casos.length} casos, com modo OSCE cronometrado.`,
      },
      { ic: "cards", t: "Errou? Vira revisão", p: "Cada erro nos jogos vira um cartão de repetição espaçada, que volta pouco antes de você esquecer." },
      {
        ic: "spark",
        t: "Com a IA do Claude",
        p: "Na Clínica IA você treina anamnese, exame físico, técnica de OSCE, diferenciais e comunicação em 12 sistemas, com correção por checklist. Há ainda circuito de prova prática, plano da semana, tutor em cada tela e questões e pacientes inéditos. Seu progresso fica salvo na sua conta.",
      },
      {
        ic: "info",
        t: "Antes de começar",
        p: "Use fones de ouvido nos sons: eles são sintetizados para treinar padrão e tempo. O app é material de estudo e não substitui aulas nem a prática supervisionada.",
      },
    ],
    i = o[a];
  return s.jsxs("div", {
    className: "onb",
    children: [
      s.jsx("div", { className: "onb-ic", children: s.jsx(q, { n: i.ic, size: 56 }) }),
      s.jsx("h1", { children: i.t }),
      s.jsx("p", { children: i.p }),
      s.jsx("div", { className: "dots", children: o.map((r, t) => s.jsx("i", { className: t === a ? "on" : "" }, t)) }),
      s.jsx("button", {
        className: "btn light",
        onClick: () =>
          a < o.length - 1
            ? e(a + 1)
            : W((r) => {
                r.onboarded = !0;
              }),
        children: a < o.length - 1 ? "Continuar" : "Começar a estudar",
      }),
      a < o.length - 1 &&
        s.jsx("button", {
          className: "linkbtn light",
          onClick: () =>
            W((r) => {
              r.onboarded = !0;
            }),
          children: "Pular",
        }),
    ],
  });
}
