// Questões inéditas geradas pela IA.
function Wc(a, e = 3800) {
  const o = a.modulos.flatMap((n) => Li(n)).map((n) => `• ${n.titulo}: ${va(n.resumo.join(" "), 260)}`),
    i = a.areas.flatMap((n) => Le(n)).map((n) => n.titulo),
    r = O.sinais.filter((n) => n.sistema === a.id || a.modulos.includes(n.sistema)).map((n) => n.nome);
  let t = `Sistema: ${a.nome}. Ordem do exame: ${a.ordem}.
Manobras do sistema: ${a.manobras.join("; ")}.
Síndromes cobradas: ${a.sindromes.join("; ")}.`;
  return (
    r.length &&
      (t += `
Sinais do atlas: ${r.slice(0, 30).join("; ")}.`),
    o.length &&
      (t += `
Tópicos do app:
${o.join(`
`)}`),
    i.length &&
      (t += `
Quadros do caderno da área: ${i.slice(0, 40).join("; ")}.`),
    t.length > e ? t.slice(0, e) + "…" : t
  );
}
function hi(a, e = 5e3) {
  const o = a.linhas.map((r) =>
      a.transposto
        ? `- ${r[0]}: ` +
          a.colunas
            .slice(1)
            .map((t, n) => `${t} = ${r[n + 1] || "—"}`)
            .join("; ")
        : `- ${r[a.rotulo] || r[0]}: ` +
          a.colunas
            .map((t, n) => (n === a.rotulo ? "" : `${t} = ${r[n] || "—"}`))
            .filter(Boolean)
            .join("; "),
    ),
    i = `Quadro ${a.num} — ${a.titulo}${a.subtitulo ? " (" + a.subtitulo + ")" : ""}
${o.join(`
`)}${
      a.nota
        ? `
Nota: ` + a.nota
        : ""
    }`;
  return i.length > e ? i.slice(0, e) + "…" : i;
}
function Cs(a, e = 9e3) {
  return va(`<h1>${a.titulo}</h1><p>${a.resumo.join(" ")}</p>` + a.secoes.map((o) => `<h2>${o.titulo}</h2>${o.html}`).join(""), e);
}
function br(a, e) {
  if (a.semQuiz) return [];
  const o = [];
  return (
    a.linhas.forEach((i, r) => {
      const t = a.transposto ? i[0] : df(a, r, 0).entidade;
      if (!t) return;
      const n = a.linhas[r]
        .map((l, c) => `qd:${a.num}:${r}:${c}`)
        .filter((l) => {
          const c = Number(l.split(":")[3]);
          return a.transposto ? c > 0 : c !== a.rotulo;
        });
      o.push({ cod: `${e}${o.length + 1}`, rotulo: `Quadro ${a.num} · ${t}`, cartoes: n, item: `q${a.num}:ia${r}`, href: `#/quadro/${a.num}` });
    }),
    o
  );
}
const jn = (a) =>
  a.cartoes.map((e, o) => ({
    cod: `C${o + 1}`,
    rotulo: `${va(e.f, 140)} → ${va(e.b, 160)}`,
    cartoes: [e.id],
    item: `topico:${a.id}`,
    href: `#/topico/${a.id}`,
  }));
function Eu(a, e) {
  var o, i, r;
  if (a === "topico") {
    const t = e ? Va.get(e) : void 0;
    return t
      ? {
          titulo: t.titulo,
          sub: ((o = Vi.get(t.modulo)) == null ? void 0 : o.titulo) || "",
          sistema: t.modulo,
          contexto: Cs(t),
          alvos: jn(t),
          sair: `#/topico/${t.id}`,
        }
      : null;
  }
  if (a === "quadro") {
    const t = e ? Ve.get(e) : void 0;
    return t
      ? { titulo: `Quadro ${t.num}`, sub: t.titulo, sistema: `area-${t.area}`, contexto: hi(t, 8e3), alvos: br(t, "L"), sair: `#/quadro/${t.num}` }
      : null;
  }
  if (a === "area") {
    const t = e ? Qi.get(Number(e)) : void 0;
    if (!t) return null;
    const n = X(Le(t.num).filter((c) => !c.semQuiz)).slice(0, 4),
      l = n.flatMap((c, d) => br(c, `Q${d + 1}L`)).slice(0, 50);
    return {
      titulo: t.titulo,
      sub: `Caderno · ${n.map((c) => c.num).join(", ")}`,
      sistema: `area-${t.num}`,
      contexto: n.map((c) => hi(c, 2400)).join(`

`),
      alvos: l,
      sair: `#/area/${t.num}`,
    };
  }
  if (a === "sistema") {
    const t = e ? ja.get(e) : void 0;
    if (!t) return null;
    const n = X(O.topicos.filter((d) => t.modulos.includes(d.modulo))).slice(0, 2),
      l = X(t.areas.flatMap((d) => Le(d)).filter((d) => !d.semQuiz)).slice(0, n.length ? 2 : 3),
      c = [...n.flatMap((d, u) => jn(d).map((m) => ({ ...m, cod: `T${u + 1}${m.cod}` }))), ...l.flatMap((d, u) => br(d, `Q${u + 1}L`))].slice(0, 60);
    return {
      titulo: t.nome,
      sub: `Anamnese, exame físico e síndromes · ${[...n.map((d) => d.titulo), ...l.map((d) => "Quadro " + d.num)].join(" · ")}`,
      sistema: t.id,
      contexto:
        Wc(t, 2500) +
        `

` +
        [...n.map((d) => Cs(d, 3500)), ...l.map((d) => hi(d, 2500))].join(`

`) +
        `
Varie entre anamnese (o que perguntar e o que sugere), técnica de exame, achados e síndromes deste sistema.`,
      alvos: c,
      sair: `#/ia/s/${t.id}`,
    };
  }
  if (a === "fraquezas") {
    const t = Ya(),
      n = Object.entries(t.stats)
        .filter(([, f]) => f.t >= 3)
        .sort((f, h) => f[1].ema - h[1].ema)
        .map(([f]) => f),
      l = [],
      c = [];
    for (const f of n.slice(0, 3)) {
      if (f.startsWith("area-")) {
        c.push(...X(Le(Number(f.slice(5))).filter((b) => !b.semQuiz)).slice(0, 1));
        continue;
      }
      const h = O.topicos.filter((b) => {
        var z;
        return b.modulo === f || ((z = ja.get(f)) == null ? void 0 : z.modulos.includes(b.modulo));
      });
      if (h.length) l.push(...X(h).slice(0, 1));
      else {
        const b = ((i = ja.get(f)) == null ? void 0 : i.areas) || [];
        c.push(...X(b.flatMap((z) => Le(z)).filter((z) => !z.semQuiz)).slice(0, 1));
      }
    }
    if (!l.length && !c.length) {
      const f = Object.keys(t.lidos)
        .map((h) => Va.get(h))
        .filter(Boolean);
      l.push(...X(f.length ? f : O.topicos.filter((h) => ["resp", "cardio", "vit"].some((b) => h.id.startsWith(b)))).slice(0, 2));
    }
    const d = l.slice(0, 2),
      u = c.slice(0, 2),
      m = [...d.flatMap((f, h) => jn(f).map((b) => ({ ...b, cod: `T${h + 1}${b.cod}` }))), ...u.flatMap((f, h) => br(f, `Q${h + 1}L`))].slice(0, 60),
      p = [...d.map((f) => f.titulo), ...u.map((f) => `Quadro ${f.num}`)];
    return {
      titulo: "Treino nas suas fraquezas",
      sub: n.length ? `${n.slice(0, 3).map(se).join(" · ")}` : "Ainda sem dados suficientes — usando o que você leu",
      sistema: ((r = d[0]) == null ? void 0 : r.modulo) || (u[0] ? `area-${u[0].area}` : "geral"),
      contexto:
        [...d.map((f) => Cs(f, 4500)), ...u.map((f) => hi(f, 3e3))].join(`

`) +
        `
(Conteúdos: ${p.join("; ")})`,
      alvos: m,
      sair: "#/jogar",
    };
  }
  return null;
}
function vx({ tipo: a, id: e }) {
  const o = Za(),
    [i, r] = S.useState(() => Eu(a, e)),
    [t, n] = S.useState(5),
    [l, c] = S.useState("intermediário"),
    [d, u] = S.useState("intro"),
    [m, p] = S.useState([]),
    [f, h] = S.useState(0),
    [b, z] = S.useState(null),
    g = S.useRef(null);
  if (
    (S.useEffect(
      () => () => {
        var v;
        return (v = g.current) == null ? void 0 : v.abort();
      },
      [],
    ),
    !i)
  )
    return s.jsxs("div", {
      className: "page",
      children: [s.jsx(Q, { title: "Questões com IA" }), s.jsx("p", { className: "pad", children: "Conteúdo não encontrado." })],
    });
  if (!o)
    return s.jsxs("div", {
      className: "page",
      children: [
        s.jsx(Q, { title: "Questões com IA" }),
        s.jsx("div", {
          className: "pad",
          children: s.jsxs("div", {
            className: "card soft",
            children: [
              s.jsx("b", { children: "Recurso da versão online" }),
              s.jsx("p", {
                className: "small",
                children: "As questões geradas pelo Claude aparecem quando o SemioQuest roda como artefato no Claude, com a IA autorizada.",
              }),
            ],
          }),
        }),
      ],
    });
  const x = async () => {
    const v = ((a === "area" || a === "fraquezas" || a === "sistema") && Eu(a, e)) || i;
    r(v), u("gerando"), z(null), (g.current = new AbortController());
    const C = `Você elabora questões de prova de semiologia médica para estudantes de medicina brasileiros.
Crie ${t} questões de múltipla escolha, nível ${l}, baseadas EXCLUSIVAMENTE no conteúdo abaixo (não use fatos que não estejam nele; não invente números).
Cada questão:
- "caso": vinheta clínica de 2 a 4 frases (idade, sexo, queixa e achados pertinentes) — ou "" quando a pergunta for direta sobre técnica/conceito (no máximo 1/3 das questões).
- "pergunta": curta e inequívoca.
- "alternativas": exatamente 4, curtas, homogêneas e plausíveis; só uma correta; sem "todas/nenhuma das anteriores".
- "correta": índice 0–3 da correta.
- "explicacao": 3–4 frases: por que a correta está certa e, para cada alternativa errada, em poucas palavras, o que a afasta.
- "alvo": o código (da lista ALVOS) do item que a questão testa, ou "".
Varie o que é cobrado (reconhecer achado, técnica ou interpretação de manobra, diferenciar entidades parecidas, raciocínio sindrômico, o próximo passo do exame) e não repita alvo se houver outros.
Padrão de prova: o enunciado deve permitir responder antes de ler as alternativas; distratores são erros que estudantes realmente cometem, do mesmo tipo e tamanho da correta; nada de pistas gramaticais, de "sempre" e "nunca", nem de alternativa visivelmente mais longa. Nível básico = reconhecimento direto; intermediário = aplicar a um caso; avançado = dois passos de raciocínio (achado → síndrome → causa ou manobra que discrimina), com um dado que distrai.
Antes de responder, confira cada questão: há exatamente uma alternativa correta e ela decorre do CONTEÚDO.

ALVOS:
${
  v.alvos.map((P) => `${P.cod}: ${P.rotulo}`).join(`
`) || "(nenhum)"
}

CONTEÚDO:
${v.contexto}

Responda APENAS com JSON: {"questoes": [{"caso": "", "pergunta": "", "alternativas": ["", "", "", ""], "correta": 0, "explicacao": "", "alvo": ""}]}`;
    try {
      const P = await To(C, {
          signal: g.current.signal,
          nivel: l === "avançado" ? "complex" : "default",
          validar: (A) => {
            const I = (Array.isArray(A == null ? void 0 : A.questoes) ? A.questoes : Array.isArray(A) ? A : []).filter(
              (R) =>
                R &&
                typeof R.pergunta == "string" &&
                Array.isArray(R.alternativas) &&
                R.alternativas.length === 4 &&
                new Set(R.alternativas.map((N) => String(N).trim())).size === 4 &&
                R.alternativas.every((N) => String(N).trim()) &&
                Number.isInteger(R.correta) &&
                R.correta >= 0 &&
                R.correta < 4,
            );
            return I.length >= Math.min(3, t) ? I.slice(0, t) : null;
          },
        }),
        E = Jo(Date.now() % 1e5),
        j = new Map(v.alvos.map((A) => [A.cod, A]));
      p(
        P.map((A, D) => {
          const I = A.alternativas.map((y) => String(y).trim().slice(0, 220)),
            R = I[A.correta],
            N = j.get(String(A.alvo || "").trim());
          return {
            id: `ia-${f}-${D}`,
            enunciado: s.jsxs(s.Fragment, {
              children: [
                A.caso && s.jsx("p", { className: "vinheta", children: String(A.caso).slice(0, 900) }),
                s.jsx("b", { children: String(A.pergunta).slice(0, 300) }),
              ],
            }),
            opcoes: X(I, E),
            correta: R,
            explicacao:
              me(String(A.explicacao || "").slice(0, 900)) +
              (N ? `<p class="small muted">Testou: ${N.rotulo.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</p>` : ""),
            link: N ? { href: N.href, txt: "Rever o conteúdo" } : void 0,
            sistema: v.sistema,
            item: N == null ? void 0 : N.item,
            cartoes: N ? N.cartoes.slice(0, 3) : [],
          };
        }),
      ),
        h((A) => A + 1),
        u("quiz");
    } catch (P) {
      u("intro"), P.code !== "aborted" && z(P.message);
    } finally {
      g.current = null;
    }
  };
  return d === "quiz"
    ? s.jsx(Xo, { titulo: `IA · ${i.titulo}`, questoes: m, sairHref: i.sair, novo: x }, f)
    : s.jsxs("div", {
        className: "page",
        children: [
          s.jsx(Q, { title: "Questões com IA" }),
          s.jsxs("div", {
            className: "pad",
            children: [
              s.jsxs("div", {
                className: "card",
                children: [
                  s.jsx("small", { className: "muted", children: a === "fraquezas" ? "Treino personalizado" : "Baseadas em" }),
                  s.jsx("h2", { className: "mt0", children: i.titulo }),
                  s.jsx("p", { className: "muted small", children: i.sub }),
                ],
              }),
              s.jsx("p", {
                className: "small",
                children:
                  "O Claude escreve questões inéditas no estilo de prova (vinheta clínica + 4 alternativas) usando só este conteúdo. Erros viram cartões na sua revisão.",
              }),
              s.jsx("h3", { className: "sub-h", children: "Quantidade" }),
              s.jsx("div", {
                className: "seg full",
                children: [5, 10].map((v) =>
                  s.jsxs("button", { className: t === v ? "on" : "", disabled: d === "gerando", onClick: () => n(v), children: [v, " questões"] }, v),
                ),
              }),
              s.jsx("h3", { className: "sub-h", children: "Nível" }),
              s.jsx("div", {
                className: "seg full",
                children: ["básico", "intermediário", "avançado"].map((v) =>
                  s.jsx(
                    "button",
                    { className: l === v ? "on" : "", disabled: d === "gerando", onClick: () => c(v), children: v[0].toUpperCase() + v.slice(1) },
                    v,
                  ),
                ),
              }),
              b && s.jsx("div", { className: "ia-erro", children: b }),
              d === "gerando"
                ? s.jsxs("div", {
                    className: "gerando",
                    children: [
                      s.jsx("div", { className: "pulso", children: s.jsx(q, { n: "spark", size: 28 }) }),
                      s.jsx("b", { children: "O Claude está escrevendo as questões…" }),
                      s.jsx("small", { className: "muted", children: t === 10 ? "Cerca de 30 a 60 segundos." : "Cerca de 15 a 30 segundos." }),
                      s.jsx("button", {
                        className: "btn ghost",
                        onClick: () => {
                          var v;
                          return (v = g.current) == null ? void 0 : v.abort();
                        },
                        children: "Cancelar",
                      }),
                    ],
                  })
                : s.jsxs("button", { className: "btn", onClick: x, children: [s.jsx(q, { n: "spark", size: 18 }), " Gerar questões"] }),
              s.jsx("p", { className: "ia-nota", children: "Questões geradas por IA podem conter imprecisões. Na dúvida, confira no conteúdo." }),
            ],
          }),
        ],
      });
}
