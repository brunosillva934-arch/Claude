// Competências: barras do resultado de cada estação, mapa acumulado no Perfil e sugestão de nível.
const corNota = (v) => (v >= 8 ? "" : v >= 6 ? "warn" : "bad");
function CompBarras({ valores, contagem }) {
  const linhas = COMPETENCIAS.filter(([k]) => typeof valores[k] == "number");
  return linhas.length
    ? s.jsx("div", {
        className: "comp",
        children: linhas.map(([k, nome]) =>
          s.jsxs(
            "div",
            {
              className: "comp-l",
              children: [
                s.jsxs("span", { children: [nome, contagem && contagem[k] ? s.jsxs("small", { className: "muted", children: [" · ", contagem[k]] }) : null] }),
                s.jsx("span", { className: "comp-b", children: s.jsx("i", { className: corNota(valores[k]), style: { width: Math.max(4, valores[k] * 10) + "%" } }) }),
                s.jsx("b", { children: Hr(valores[k]) }),
              ],
            },
            k,
          ),
        ),
      })
    : null;
}
// Média por competência em todas as estações já feitas, com a tendência das últimas.
function CompPerfil() {
  const comp = ea((x) => (x.ia && x.ia.comp) || null);
  if (!comp || !Object.keys(comp).length)
    return s.jsx("p", { className: "muted small pad-x", children: "Faça estações na Clínica IA para ver suas notas por competência: coleta de dados, técnica, interpretação, raciocínio, comunicação e registro." });
  const medias = {},
    cont = {};
  let pior = null;
  for (const [k] of COMPETENCIAS) {
    const c = comp[k];
    if (!c || !c.n) continue;
    (medias[k] = Math.round((c.soma / c.n) * 10) / 10), (cont[k] = c.n + (c.n > 1 ? " estações" : " estação"));
    c.n >= 2 && (pior === null || medias[k] < medias[pior]) && (pior = k);
  }
  return s.jsxs("div", {
    className: "pad-x",
    children: [
      s.jsx(CompBarras, { valores: medias, contagem: cont }),
      pior && medias[pior] < 8 && s.jsxs("p", { className: "comp-n", children: ["Ponto a trabalhar: ", s.jsx("b", { children: COMP_NOME[pior].toLowerCase() }), ". Os treinos sugeridos ao fim de cada estação levam isso em conta."] }),
    ],
  });
}
// Sugere subir ou descer de nível conforme a média recente no sistema.
function SugestaoNivel({ sis, nivel, setNivel }) {
  const sess = ea((x) => ((x.ia && x.ia.sessoes) || []).filter((m) => m.sistema === sis && m.nivel === nivel).slice(0, 4));
  if (sess.length < 3) return null;
  const media = sess.reduce((a, b) => a + b.nota, 0) / sess.length,
    i = Nx.indexOf(nivel),
    alvo = media >= 8 && i < Nx.length - 1 ? Nx[i + 1] : media < 5 && i > 0 ? Nx[i - 1] : null;
  return alvo
    ? s.jsxs("p", {
        className: "muted small mt",
        children: [
          "Sua média recente no nível ",
          nivel,
          " é ",
          Hr(media),
          ". ",
          s.jsxs("button", { className: "linkbtn small", onClick: () => setNivel(alvo), children: ["Mudar para ", alvo] }),
        ],
      })
    : null;
}
// Linha com microfone para ditar em campos de resposta longa.
function DitadoLinha({ onTexto }) {
  const v = useVoz();
  return v.ditado
    ? s.jsxs("div", {
        className: "voz-bar",
        children: [
          s.jsx(MicBtn, { onTexto }),
          s.jsx("span", { className: v.ouvindo ? "falando" : "", children: v.ouvindo ? v.parcial || "Ouvindo… fale sua resposta." : "Prefere falar? Toque no microfone e dite a resposta." }),
        ],
      })
    : null;
}
