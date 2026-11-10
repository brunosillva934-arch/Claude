// Simulado: questões de prova do banco fixo (conteudo/questoes.mjs). Funciona sem IA.
// Prioriza as questões ainda não feitas e as que o estudante errou; erros viram cartões do tópico.
const SIM_N = 10;
function simQuestao(z, rnd) {
  const top = z.topico ? Va.get(z.topico) : null;
  return {
    id: "qb-" + z.id,
    enunciado: s.jsxs(s.Fragment, { children: [z.caso && s.jsx("p", { className: "vinheta", children: z.caso }), s.jsx("b", { children: z.pergunta })] }),
    opcoes: X(z.alternativas, rnd),
    correta: z.alternativas[z.correta],
    explicacao: `<p>${ze(z.explicacao)}</p>`,
    link: top ? { href: `#/topico/${top.id}`, txt: "Rever o tópico" } : void 0,
    sistema: z.sistema,
    item: "qb:" + z.id,
    cartoes: top
      ? X(
          top.cartoes.map((c) => c.id),
          rnd,
        ).slice(0, 2)
      : [],
  };
}
function simEscolher(sis, n) {
  const feitos = Ya().itens,
    aproveitamento = (z) => {
      const i = feitos["qb:" + z.id];
      return i && i.t ? 1 + i.c / i.t : 0;
    };
  return X(O.questoes.filter((z) => sis === "misto" || z.sistema === sis))
    .sort((a, b) => aproveitamento(a) - aproveitamento(b))
    .slice(0, n);
}
function Simulado({ sis }) {
  const itens = ea((x) => x.itens),
    [rodada, setRodada] = S.useState(0),
    questoes = S.useMemo(() => {
      if (!sis) return [];
      const rnd = Jo((Date.now() % 1e5) + rodada);
      return simEscolher(sis, SIM_N).map((z) => simQuestao(z, rnd));
    }, [sis, rodada]);
  if (sis)
    return questoes.length
      ? s.jsx(Xo, { titulo: sis === "misto" ? "Simulado misto" : `Simulado · ${se(sis)}`, questoes, sairHref: "#/jogo/simulado", icone: "target", novo: () => setRodada((n) => n + 1) }, sis + rodada)
      : s.jsxs("div", { className: "page", children: [s.jsx(Q, { title: "Simulado" }), s.jsx("p", { className: "pad", children: "Ainda não há questões deste sistema." })] });
  const porSis = new Map();
  for (const z of O.questoes) porSis.set(z.sistema, [...(porSis.get(z.sistema) || []), z]);
  const acertou = (z) => {
      const i = itens["qb:" + z.id];
      return !!(i && i.c > 0);
    },
    total = O.questoes.filter(acertou).length;
  return s.jsxs("div", {
    className: "page",
    children: [
      s.jsx(Q, { title: "Simulado de prova" }),
      s.jsx("p", {
        className: "pad muted",
        children: `${O.questoes.length} questões em vinheta clínica, no estilo de prova, com explicação e link para o tópico. Cada rodada tem ${SIM_N} questões e começa pelas que você ainda não fez ou errou.`,
      }),
      s.jsxs("div", {
        className: "list",
        children: [
          s.jsx(B, {
            href: "#/jogo/simulado/misto",
            icon: s.jsx(q, { n: "target" }),
            title: "Simulado misto",
            sub: `Todos os sistemas · ${total} de ${O.questoes.length} já acertadas`,
          }),
          [...porSis.entries()].map(([id, lista]) =>
            s.jsx(
              B,
              {
                href: `#/jogo/simulado/${id}`,
                icon: s.jsx("span", { className: "num", children: lista.length }),
                title: se(id),
                sub: `${lista.filter(acertou).length} de ${lista.length} já acertadas`,
              },
              id,
            ),
          ),
        ],
      }),
    ],
  });
}
