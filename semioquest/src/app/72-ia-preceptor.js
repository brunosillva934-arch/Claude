// Preceptor: conversa livre com o Claude, ancorada na biblioteca do app.
// A cada pergunta a página busca os trechos mais pertinentes (tópicos, sinais, tabelas, sons, glossário e quadros)
// e os envia junto, para que a resposta se apoie no conteúdo e traga as fontes como links.
const PREC_MODOS = [
    { id: "explicar", nome: "Explicar", instr: "Explique de forma direta e didática, do mecanismo ao que se faz à beira do leito." },
    {
      id: "socratico",
      nome: "Socrático",
      instr: "Não entregue a resposta de imediato: conduza com UMA pergunta por vez, partindo do que o estudante já sabe. Depois de duas ou três trocas, feche com a síntese.",
    },
    { id: "comparar", nome: "Comparar", instr: "Responda comparando lado a lado, em lista curta de diferenças que discriminam uma coisa da outra à beira do leito." },
    {
      id: "pratica",
      nome: "Passo a passo",
      instr: "Responda como se faz na prática: posição do paciente e do examinador, passo a passo numerado, o que é normal, o que é alterado e o erro mais comum.",
    },
    {
      id: "teste",
      nome: "Me teste",
      instr: "Faça perguntas ao estudante sobre o tema, uma por vez, em dificuldade crescente. Corrija cada resposta em duas frases, começando por Correto, Parcial ou Incorreto, e faça a seguinte. Depois de cinco perguntas, diga o que revisar.",
    },
    {
      id: "memorizar",
      nome: "Memorizar",
      instr: "Ajude a memorizar: organize em três a cinco pontos, proponha um recurso de memória em português (diga que é só um recurso de memória) e termine com duas perguntas de autoavaliação.",
    },
  ],
  PREC_SUGESTOES = [
    "Como diferenciar B3 de B4 à beira do leito?",
    "Quais achados afastam ascite?",
    "Passo a passo da palpação do baço",
    "Neurônio motor superior × inferior",
    "Como apresentar um caso em 2 minutos?",
    "Paralisia facial central ou periférica?",
  ],
  PREC_STOP = new Set(
    "a o as os um uma uns umas de da do das dos e ou em no na nos nas que como qual quais para por com sem ser sao foi era me se eu voce ele ela isso esse essa este esta quando onde porque sobre mais menos entre qual diferenca diferencas diferenciar explique explica explicar faz fazer feito pesquisa pesquisar pesquiso tem ter pode posso devo deve quero saber ajuda ajude dica dicas melhor forma jeito".split(
      " ",
    ),
  );
function precTermos(texto) {
  return ge(texto)
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2 && !PREC_STOP.has(w));
}
// Do tópico, só as seções que mais casam com a pergunta.
function precTrechoTopico(t, termos) {
  const pontuar = (txt) => {
      const n = ge(txt);
      return termos.reduce((a, w) => a + (n.includes(w) ? 1 : 0), 0);
    },
    secs = t.secoes
      .map((sec, i) => ({ sec, i, p: pontuar(sec.titulo) * 2 + pontuar(va(sec.html, 4e3)) }))
      .sort((a, b) => b.p - a.p || a.i - b.i)
      .slice(0, 2)
      .sort((a, b) => a.i - b.i);
  return `${t.titulo}. ${va(t.resumo.join(" "), 500)}\n` + secs.map(({ sec }) => `• ${sec.titulo}: ${va(sec.html, 1100)}`).join("\n");
}
function precTextoFonte(h, termos) {
  const tipo = h.id[0],
    id = h.id.slice(2);
  if (tipo === "t") {
    const t = Va.get(id);
    return t ? precTrechoTopico(t, termos) : "";
  }
  if (tipo === "s") {
    const x = Hc.get(id);
    return x
      ? `${x.nome}. Sugere: ${x.sugere}. Técnica: ${va(x.tecnica, 500)} Positivo quando: ${va(x.positivo, 300)} ${x.significado ? "Significado: " + va(x.significado, 300) : ""} ${x.acuracia ? "Acurácia: " + va(x.acuracia, 300) : ""} ${x.armadilha ? "Armadilha: " + va(x.armadilha, 300) : ""}`
      : "";
  }
  if (tipo === "o") {
    const x = Gs.get(id);
    return x ? `${x.nome}. ${va(x.descricao, 500)} Onde: ${x.onde}. Significado: ${va(x.significado, 400)}` : "";
  }
  if (tipo === "g") {
    const x = O.glossario.find((g) => g.id === id);
    return x ? `${x.termo}: ${va(x.def, 300)}` : "";
  }
  if (tipo === "q") {
    const x = Ve.get(id);
    return x ? hi(x, 1500) : "";
  }
  if (tipo === "y") {
    const x = rf.get(id);
    return x
      ? `${x.titulo}. ` + x.linhas.map((l) => `${l.nome}: ` + x.colunas.map((c) => `${c.nome} = ${l.valores[c.id]}`).join("; ")).join(" | ").slice(0, 1600)
      : "";
  }
  return "";
}
function precBuscar(pergunta, anterior) {
  let termos = precTermos(pergunta);
  termos.length < 2 && anterior && (termos = [...termos, ...precTermos(anterior)]);
  if (!termos.length) return [];
  const hits = hb(termos.join(" ")).filter((h) => h.tipo !== "Caso"),
    cota = { Tópico: 2, Sinal: 2, Tabela: 1, Quadro: 1, Som: 1, Glossário: 1 },
    out = [];
  for (const h of hits) {
    if (out.length >= 5) break;
    if (!cota[h.tipo]) continue;
    const texto = precTextoFonte(h, termos);
    texto && (cota[h.tipo]--, out.push({ tipo: h.tipo, titulo: h.titulo, rota: h.rota, texto }));
  }
  return out;
}
function Preceptor({ q0 }) {
  const ia = Za(),
    [modo, setModo] = S.useState("explicar"),
    [msgs, setMsgs] = S.useState([]),
    [txt, setTxt] = S.useState(q0 || ""),
    [parcial, setParcial] = S.useState(null),
    [erro, setErro] = S.useState(null),
    ctl = S.useRef(null),
    ult = S.useRef(""),
    fim = S.useRef(null);
  S.useEffect(
    () => () => {
      var a;
      pararDitado(), (a = ctl.current) == null || a.abort();
    },
    [],
  ),
    S.useEffect(() => {
      var a;
      (parcial !== null || msgs.length) && ((a = fim.current) == null || a.scrollIntoView({ block: "nearest", behavior: "smooth" }));
    }, [msgs.length, parcial === null]);
  if (!ia) return s.jsxs("div", { className: "page", children: [s.jsx(Q, { title: "Preceptor" }), s.jsx(Yc, {})] });
  const ocupado = parcial !== null,
    enviar = async (pergunta) => {
      const p = pergunta.trim();
      if (!p || ocupado) return;
      setErro(null), pararDitado();
      const antes = msgs,
        anterior = [...antes].reverse().find((m) => m.role === "user"),
        fontes = precBuscar(p, anterior && anterior.content),
        m = PREC_MODOS.find((x) => x.id === modo) || PREC_MODOS[0],
        cabecalho = `${tx}
MODO DESTA CONVERSA: ${m.instr}
${
  fontes.length
    ? `=== Trechos da biblioteca do app para esta pergunta (fonte principal; ao usar um trecho, cite o número entre colchetes, como [1]) ===
${fontes.map((f, i) => `[${i + 1}] ${f.tipo} — ${f.titulo}\n${f.texto}`).join("\n\n")}
=== fim dos trechos ===
Se os trechos não cobrirem a pergunta, diga isso em uma frase e complete com conhecimento geral, de forma conservadora.`
    : "A busca na biblioteca do app não achou trechos para esta pergunta: avise em uma frase e responda com conhecimento geral, de forma conservadora."
}

Mensagem do estudante: `,
        nova = [...antes, { role: "user", content: p }];
      setMsgs(nova), setTxt(""), setParcial(""), (ult.current = "");
      let janela = nova.slice(-12);
      janela[0].role !== "user" && (janela = janela.slice(1));
      const turnos = janela.map((x, i) => ({ role: x.role, content: i === janela.length - 1 ? cabecalho + x.content : x.content }));
      ctl.current = new AbortController();
      try {
        const r = await Vf(turnos, {
          signal: ctl.current.signal,
          nivel: "default",
          onText: (t) => {
            (ult.current = t), setParcial(t);
          },
        });
        setMsgs([...nova, { role: "assistant", content: r, fontes }]), antes.length || (ne(3), _c("ia"));
      } catch (e) {
        e.code === "aborted" && ult.current
          ? setMsgs([...nova, { role: "assistant", content: ult.current + " …", fontes }])
          : (setMsgs(antes), e.code !== "aborted" && (setErro(e.message), setTxt(p)));
      } finally {
        setParcial(null), (ctl.current = null);
      }
    };
  return s.jsxs("div", {
    className: "page",
    children: [
      s.jsx(Q, { title: "Preceptor" }),
      s.jsxs("div", {
        className: "pad",
        children: [
          msgs.length === 0 &&
            !ocupado &&
            s.jsxs("div", {
              className: "card estacao-intro",
              children: [
                s.jsxs("div", {
                  className: "ia-h",
                  children: [s.jsx("span", { className: "ia-ic", children: s.jsx(q, { n: "grad", size: 18 }) }), s.jsx("b", { children: "Tire dúvidas com base na biblioteca" })],
                }),
                s.jsxs("p", {
                  children: [
                    "O Claude responde usando os ",
                    O.topicos.length,
                    " tópicos, os ",
                    O.sinais.length,
                    " sinais e as tabelas do app, e mostra de onde tirou cada resposta.",
                  ],
                }),
              ],
            }),
          s.jsx("h3", { className: "sub-h", children: "Como você quer aprender" }),
          s.jsx("div", {
            className: "prec-modos",
            children: PREC_MODOS.map((m) =>
              s.jsx("button", { className: "chip " + (modo === m.id ? "sel" : ""), disabled: ocupado, onClick: () => setModo(m.id), children: m.nome }, m.id),
            ),
          }),
          s.jsxs("div", {
            className: "ia-chat",
            children: [
              msgs.map((m, i) =>
                m.role === "user"
                  ? s.jsx("div", { className: "ia-msg eu", children: m.content }, i)
                  : s.jsxs(
                      "div",
                      {
                        className: "ia-msg cl prose",
                        children: [
                          s.jsx("div", { dangerouslySetInnerHTML: { __html: me(m.content) } }),
                          m.fontes &&
                            m.fontes.length > 0 &&
                            s.jsx("div", {
                              className: "prec-fontes",
                              children: m.fontes.map((f, j) => s.jsxs("a", { href: f.rota, children: ["[", j + 1, "] ", f.titulo] }, j)),
                            }),
                        ],
                      },
                      i,
                    ),
              ),
              ocupado &&
                s.jsx("div", {
                  className: "ia-msg cl prose",
                  children: parcial
                    ? s.jsx("span", { dangerouslySetInnerHTML: { __html: me(parcial) } })
                    : s.jsxs("span", { className: "digitando", children: [s.jsx("i", {}), s.jsx("i", {}), s.jsx("i", {})] }),
                }),
              erro && s.jsx("div", { className: "ia-erro", children: erro }),
              s.jsx("div", { ref: fim }),
            ],
          }),
          msgs.length === 0 &&
            !ocupado &&
            s.jsx("div", { className: "ia-sug", children: PREC_SUGESTOES.map((x) => s.jsx("button", { className: "chip", onClick: () => enviar(x), children: x }, x)) }),
          s.jsx(DitadoLinha, { onTexto: (y) => setTxt((a) => (a ? a + y : y.replace(/^\s+/, ""))) }),
          s.jsxs("form", {
            className: "ia-form",
            onSubmit: (e) => {
              e.preventDefault(), enviar(txt);
            },
            children: [
              s.jsx("textarea", {
                id: "sq-preceptor",
                value: txt,
                rows: 2,
                placeholder: modo === "teste" ? "Diga o tema em que quer ser testado, ou responda…" : "Escreva sua dúvida…",
                onChange: (e) => setTxt(e.target.value),
                onKeyDown: (e) => {
                  e.key === "Enter" && !e.shiftKey && (e.preventDefault(), enviar(txt));
                },
              }),
              ocupado
                ? s.jsx("button", {
                    type: "button",
                    className: "iconbtn solid",
                    "aria-label": "Parar",
                    onClick: () => {
                      var a;
                      return (a = ctl.current) == null ? void 0 : a.abort();
                    },
                    children: s.jsx(q, { n: "stop", size: 18 }),
                  })
                : s.jsx("button", { type: "submit", className: "iconbtn solid", "aria-label": "Enviar", disabled: !txt.trim(), children: s.jsx(q, { n: "send", size: 18 }) }),
            ],
          }),
          msgs.length > 0 &&
            !ocupado &&
            s.jsxs("button", {
              className: "btn ghost mt",
              onClick: () => {
                setMsgs([]), setErro(null);
              },
              children: [s.jsx(q, { n: "refresh", size: 16 }), " Nova conversa"],
            }),
          s.jsx("p", { className: "ia-nota", children: "Respostas geradas por IA podem errar. Abra as fontes e confira com seu professor." }),
        ],
      }),
    ],
  });
}
