// Plano de estudos da semana.
function Tx() {
  const a = Za(),
    e = ea((b) => b.planoIA),
    [o, i] = S.useState(!1),
    [r, t] = S.useState(null),
    [n, l] = S.useState(""),
    [c, d] = S.useState(40);
  if (!a) return null;
  const u = async () => {
      var C;
      i(!0), t(null);
      const b = Ya(),
        z = Object.entries(b.stats)
          .filter(([, P]) => P.t >= 2)
          .map(([P, E]) => `${se(P)} (${P}): ${Math.round((E.c / E.t) * 100)}% de ${E.t}`)
          .join("; "),
        g = Object.entries(((C = b.ia) == null ? void 0 : C.stats) || {})
          .map(
            ([P, E]) =>
              `${P}: ` +
              Object.entries(E)
                .map(([j, A]) => `${j} média ${Hr(A.soma / A.n)} (${A.n})`)
                .join(", "),
          )
          .join(" | "),
        x = Object.keys(b.lidos).length,
        v = `Monte um PLANO DE ESTUDO de semiologia para 7 dias para um estudante de medicina, usando as atividades do app SemioQuest.
Tempo por dia: cerca de ${c} minutos. ${n.trim() ? `Objetivo do estudante: "${n.trim().slice(0, 200)}".` : ""}
DESEMPENHO NOS JOGOS: ${z || "sem dados"}
DESEMPENHO NA CLÍNICA IA: ${g || "sem dados"}
Tópicos lidos: ${x} de ${O.topicos.length}. Cartões para revisar hoje: ${b.filaNovos.length} novos na fila.
ATIVIDADES DISPONÍVEIS (use só estas, com estes ids):
- "estacao": sistema ∈ [${Ks.map((P) => P.id).join(", ")}], modo ∈ [${Xc.map((P) => `${P.id} (${P.nome})`).join(", ")}]
- "questoes": sistema (questões inéditas do sistema)
- "topico": id ∈ [${O.topicos.map((P) => P.id).join(", ")}]
- "revisar": revisão espaçada dos cartões
- "circuito": prova prática simulada de 4 estações (opcional "sistema")
Princípios: priorize os pontos fracos, intercale sistemas, alterne anamnese e exame físico, inclua revisão espaçada quase todo dia, 2 a 4 itens por dia, e um circuito no fim de semana. Se não houver dados, comece pelos fundamentos (geral, respiratório, cardiovascular).
Responda APENAS com JSON: {"resumo": "2 frases explicando a lógica do plano", "dias": [{"titulo": "Dia 1", "foco": "tema do dia", "minutos": 40, "itens": [{"tipo": "estacao", "sistema": "…", "modo": "…", "texto": "o que fazer e por quê, curto"}]}]}`;
      try {
        const P = await To(v, {
          nivel: "default",
          validar: (E) => {
            if (!E || !Array.isArray(E.dias)) return null;
            const j = E.dias
              .slice(0, 7)
              .map((A, D) => ({
                titulo: String((A == null ? void 0 : A.titulo) || `Dia ${D + 1}`).slice(0, 30),
                foco: String((A == null ? void 0 : A.foco) || "").slice(0, 120),
                minutos: Number(A == null ? void 0 : A.minutos) || c,
                itens: (Array.isArray(A == null ? void 0 : A.itens) ? A.itens : [])
                  .map((I) => {
                    const R = String((I == null ? void 0 : I.texto) || "").slice(0, 200);
                    return (I == null ? void 0 : I.tipo) === "estacao" && ja.has(I.sistema) && De.has(I.modo)
                      ? { tipo: "estacao", sistema: I.sistema, modo: I.modo, texto: R }
                      : (I == null ? void 0 : I.tipo) === "questoes" && ja.has(I.sistema)
                        ? { tipo: "questoes", sistema: I.sistema, texto: R }
                        : (I == null ? void 0 : I.tipo) === "topico" && Va.has(I.id)
                          ? { tipo: "topico", id: I.id, texto: R }
                          : (I == null ? void 0 : I.tipo) === "revisar"
                            ? { tipo: "revisar", texto: R }
                            : (I == null ? void 0 : I.tipo) === "circuito"
                              ? { tipo: "circuito", sistema: ja.has(I.sistema) ? I.sistema : void 0, texto: R }
                              : null;
                  })
                  .filter(Boolean)
                  .slice(0, 5),
              }))
              .filter((A) => A.itens.length);
            return j.length >= 3 ? { criado: Date.now(), resumo: String(E.resumo || "").slice(0, 500), dias: j, feitos: {} } : null;
          },
        });
        W((E) => {
          E.planoIA = P;
        }),
          ca("Plano da semana pronto");
      } catch (P) {
        t(P.message);
      } finally {
        i(!1);
      }
    },
    m = (b) =>
      W((z) => {
        const g = z.planoIA;
        g && (g.feitos[b] = !g.feitos[b]);
      }),
    p = (b) => {
      var z, g, x, v, C;
      return b.tipo === "estacao"
        ? `${(z = De.get(b.modo)) == null ? void 0 : z.nome} · ${(g = ja.get(b.sistema)) == null ? void 0 : g.curto}`
        : b.tipo === "questoes"
          ? `Questões · ${(x = ja.get(b.sistema)) == null ? void 0 : x.curto}`
          : b.tipo === "topico"
            ? ((v = Va.get(b.id)) == null ? void 0 : v.titulo) || "Tópico"
            : b.tipo === "circuito"
              ? `Circuito OSCE${b.sistema ? " · " + ((C = ja.get(b.sistema)) == null ? void 0 : C.curto) : ""}`
              : "Revisão espaçada";
    },
    f = e ? e.dias.reduce((b, z) => b + z.itens.length, 0) : 0,
    h = e ? Object.values(e.feitos).filter(Boolean).length : 0;
  return s.jsx(w, {
    title: "Plano da semana",
    children:
      !e || o
        ? s.jsx("div", {
            className: "pad-x",
            children: s.jsxs("div", {
              className: "card",
              children: [
                s.jsx("p", {
                  className: "small mt0",
                  children: "O Claude olha o seu desempenho e monta 7 dias de estudo com as atividades do app, priorizando seus pontos fracos.",
                }),
                s.jsx("input", {
                  className: "input",
                  value: n,
                  maxLength: 160,
                  onChange: (b) => l(b.target.value),
                  placeholder: "Objetivo (opcional): ex.: prova prática de cardio na sexta",
                  disabled: o,
                }),
                s.jsx("div", {
                  className: "seg full mt",
                  children: [20, 40, 60].map((b) =>
                    s.jsxs("button", { className: c === b ? "on" : "", onClick: () => d(b), disabled: o, children: [b, " min/dia"] }, b),
                  ),
                }),
                r && s.jsx("div", { className: "ia-erro", children: r }),
                s.jsxs("button", {
                  className: "btn mt",
                  disabled: o,
                  onClick: u,
                  children: [s.jsx(q, { n: "spark", size: 18 }), " ", o ? "Montando o plano…" : "Montar meu plano"],
                }),
              ],
            }),
          })
        : s.jsxs("div", {
            className: "pad-x",
            children: [
              s.jsxs("div", {
                className: "card soft",
                children: [
                  s.jsx("div", { className: "prose small", dangerouslySetInnerHTML: { __html: me(e.resumo) } }),
                  s.jsxs("small", { className: "muted", children: [h, "/", f, " atividades feitas"] }),
                ],
              }),
              e.dias.map((b, z) =>
                s.jsxs(
                  "details",
                  {
                    className: "log plano-dia",
                    open: z === Math.min(e.dias.length - 1, Math.floor((Date.now() - e.criado) / 864e5)),
                    children: [
                      s.jsxs("summary", {
                        children: [
                          s.jsx("b", { children: b.titulo }),
                          " · ",
                          b.foco,
                          " ",
                          s.jsxs("small", { className: "muted", children: ["· ", b.minutos, " min"] }),
                        ],
                      }),
                      b.itens.map((g, x) => {
                        const v = `${z}:${x}`;
                        return s.jsxs(
                          "div",
                          {
                            className: "plano-it " + (e.feitos[v] ? "feito" : ""),
                            children: [
                              s.jsx("button", {
                                className: "ck-btn",
                                "aria-label": "Marcar como feito",
                                onClick: () => m(v),
                                children: e.feitos[v] && s.jsx(q, { n: "check", size: 14 }),
                              }),
                              s.jsxs("a", {
                                href: Ix(g),
                                children: [
                                  s.jsx(q, { n: Dx(g), size: 16 }),
                                  " ",
                                  s.jsxs("span", { children: [s.jsx("b", { children: p(g) }), s.jsx("small", { children: g.texto })] }),
                                ],
                              }),
                            ],
                          },
                          v,
                        );
                      }),
                    ],
                  },
                  z,
                ),
              ),
              s.jsxs("button", {
                className: "btn ghost mt",
                onClick: () =>
                  W((b) => {
                    b.planoIA = void 0;
                  }),
                children: [s.jsx(q, { n: "refresh", size: 16 }), " Refazer o plano"],
              }),
            ],
          }),
  });
}
const Nx = ["Básico", "Intermediário", "Avançado"],
  Mx = {
    abdome: ["Inspeção", "Ausculta", "Percussão", "Palpação"],
    neurologico: ["Observo", "Peço ao paciente", "Pesquiso", "Testo"],
    mental: ["Observo", "Pergunto"],
    osteoarticular: ["Inspeção", "Palpação", "Mobilizo", "Teste especial"],
    pele: ["Inspeção", "Palpação", "Manobra"],
    "mamas-genital": ["Inspeção", "Palpação", "Manobra"],
    especiais: ["Observo", "Meço", "Examino"],
  },
  yx = ["respiratorio", "cardiovascular", "geral", "vascular", "abdome"],
  Bo = (a) => String(Math.round(a * 10) / 10).replace(".", ","),
  kt = (a) => (a >= 8 ? "ok" : a >= 6 ? "warn" : "bad"),
  Zf = (a) => new Date(a).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
function ag() {
  const a = ea((o) => o.settings.iaNivel || "Intermediário"),
    e = ea((o) => !!o.settings.iaOsce);
  return {
    nivel: a,
    osce: e,
    setNivel: (o) =>
      W((i) => {
        i.settings.iaNivel = o;
      }),
    setOsce: (o) =>
      W((i) => {
        i.settings.iaOsce = o;
      }),
  };
}
function Yc() {
  return s.jsx("div", {
    className: "pad",
    children: s.jsxs("div", {
      className: "card soft",
      children: [
        s.jsx("b", { children: "A IA do Claude não está disponível agora" }),
        s.jsx("p", {
          className: "small",
          children:
            "Para usar a Clínica IA, abra o SemioQuest no Claude com sua conta e autorize o uso da IA quando ela for pedida. O restante do app continua funcionando.",
        }),
      ],
    }),
  });
}
