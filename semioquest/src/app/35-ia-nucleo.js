// Ligação com o Claude (sample), sincronização (db/user) e caixa de conversa.
let Gc = "carregando",
  Ol = null,
  Lf = 0;
const Fl = new Set(),
  kf = (a) => {
    (Gc = a), Fl.forEach((e) => e());
  };
async function Hl(a) {
  let e = window.claude;
  for (let o = 0; !(e != null && e.use) && o < 16; o++) await new Promise((i) => setTimeout(i, 250)), (e = window.claude);
  if (!(e != null && e.use)) return null;
  try {
    return await Promise.race([e.use(a), new Promise((o) => setTimeout(() => o(null), 11e3))]);
  } catch (o) {
    return null;
  }
}
Hl("sample").then((a) => {
  (Ol = a), kf(a ? "pronto" : "ausente");
});
function Za() {
  return S.useSyncExternalStore(
    (a) => (
      Fl.add(a),
      () => {
        Fl.delete(a);
      }
    ),
    () => Gc === "pronto",
  );
}
class mo extends Error {
  constructor(e, o) {
    super(o), (this.code = e);
  }
}
// Traduz o erro do sample (contrato do artefato) para uma mensagem em português e um código interno.
// "aborted" é o código interno de cancelamento: quem chama não mostra erro nesse caso.
const MSG_IA = {
  not_granted: "A IA do Claude não foi autorizada nesta página.",
  sampling_disabled: "A IA do Claude está desligada para esta conta ou organização.",
  capability_disabled: "A IA do Claude está desligada para esta conta ou organização.",
  not_declared: "Esta página não foi publicada com acesso à IA.",
  session_expired: "Sua sessão expirou. Recarregue a página e entre de novo.",
  rate_limited: "Muitas perguntas seguidas. Espere meio minuto e tente de novo.",
  refused: "O Claude não pôde responder a este pedido. Reformule e tente de novo.",
  prompt_too_large: "O conteúdo ficou grande demais para uma só pergunta. Encerre a estação ou comece uma nova.",
  empty_completion: "O Claude não devolveu resposta. Tente de novo.",
  invalid_json: "O Claude respondeu num formato inesperado. Tente de novo.",
  tools_unavailable: "A busca na biblioteca não está disponível nesta tela.",
  upstream_error: "A conexão com o Claude falhou. Tente de novo em instantes.",
};
function Bf(a) {
  if (a instanceof mo) return a;
  const e = (a == null ? void 0 : a.code) || "erro";
  if (e === "cancelled" || e === "aborted" || (a == null ? void 0 : a.name) === "AbortError") return new mo("aborted", "Cancelado.");
  if (e === "not_granted" || e === "sampling_disabled" || e === "capability_disabled" || e === "not_declared") kf("negado");
  if (e === "rate_limited") Lf = Date.now() + 3e4;
  const o = new mo(e, MSG_IA[e] || "Não consegui falar com o Claude agora. Tente de novo em instantes.");
  return (o.parcial = (a == null ? void 0 : a.text) || ""), o;
}
function wf() {
  if (!Ol || Gc !== "pronto") throw new mo("ausente", "A IA não está disponível aqui.");
  if (Date.now() < Lf) throw new mo("rate_limited", "Muitas perguntas seguidas. Espere alguns segundos.");
  return Ol;
}
// Texto livre (com streaming). e: { nivel, signal, onText, tools }
async function Vf(a, e = {}) {
  const o = wf(),
    i = { modelTier: e.nivel || "default", cache: !1, signal: e.signal, onText: e.onText ? ({ text: r }) => e.onText(r) : void 0 };
  e.tools && e.tools.length && (i.tools = e.tools);
  try {
    return (await o(a, i)).text;
  } catch (r) {
    throw Bf(r);
  }
}
// JSON validado. Uma única nova tentativa, só quando o formato veio errado.
async function To(a, e = {}) {
  const o = wf();
  let i = null;
  for (let r = 0; r < 2; r++)
    try {
      const t = await o.json(a, { modelTier: e.nivel || "default", cache: !1, signal: e.signal }),
        n = e.validar ? e.validar(t) : t;
      if (n) return n;
      i = new mo("formato", "O Claude respondeu num formato inesperado. Tente de novo.");
    } catch (t) {
      const n = Bf(t);
      if (n.code !== "invalid_json" && n.code !== "empty_completion") throw n;
      i = n;
    }
  throw i;
}
const rx = (a) => a.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"),
  is = (a) =>
    rx(a)
      .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
      .replace(/(^|[\s(])\*(?!\s)(.+?)\*(?=[\s).,;:!?]|$)/g, "$1<i>$2</i>")
      .replace(/`([^`]+)`/g, "<code>$1</code>");
function me(a) {
  const e = a.replace(/\r/g, "").split(`
`),
    o = [];
  let i = null,
    r = [];
  const t = () => {
      r.length && (o.push("<p>" + r.join("<br>") + "</p>"), (r = []));
    },
    n = () => {
      i && (o.push(`</${i}>`), (i = null));
    };
  for (const l of e) {
    const c = l.trimEnd();
    let d;
    if (!c.trim()) {
      t(), n();
      continue;
    }
    if ((d = c.match(/^\s*#{1,4}\s+(.*)$/))) {
      t(), n(), o.push(`<h4>${is(d[1])}</h4>`);
      continue;
    }
    if ((d = c.match(/^\s*[-*•]\s+(.*)$/))) {
      t(), i !== "ul" && (n(), o.push("<ul>"), (i = "ul")), o.push(`<li>${is(d[1])}</li>`);
      continue;
    }
    if ((d = c.match(/^\s*\d+[.)]\s+(.*)$/))) {
      t(), i !== "ol" && (n(), o.push("<ol>"), (i = "ol")), o.push(`<li>${is(d[1])}</li>`);
      continue;
    }
    if (/^\s*\|.*\|\s*$/.test(c)) {
      if ((n(), /^\s*\|[\s:|-]+\|\s*$/.test(c))) continue;
      r.push(
        is(
          c
            .trim()
            .replace(/^\||\|$/g, "")
            .split("|")
            .map((u) => u.trim())
            .join(" · "),
        ),
      );
      continue;
    }
    n(), r.push(is(c));
  }
  return t(), n(), o.join("");
}
function va(a, e = 6e3) {
  const o = String(a || "")
    .replace(
      /<(br|\/p|\/li|\/h\d|\/tr)>/gi,
      `
`,
    )
    .replace(/<\/t[dh]>/gi, " | ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(
      /\n\s*\n+/g,
      `
`,
    )
    .trim();
  return o.length > e ? o.slice(0, e) + "…" : o;
}
const tx = `Você é o Claude atuando como preceptor de semiologia médica para um estudante brasileiro de medicina dentro do app SemioQuest.
Regras:
- Responda em português do Brasil, com terminologia semiológica correta (referências: Porto, Bates, McGee) e frases curtas.
- Baseie-se no conteúdo do app fornecido. Se algo for além dele, diga que é complemento e seja conservador: não invente números, estudos, epônimos nem razões de verossimilhança.
- Foque em semiologia: anamnese, inspeção, palpação, percussão, ausculta, manobras, registro e raciocínio sindrômico. Não dê doses nem esquemas terapêuticos.
- Ensine como preceptor: explique o porquê (mecanismo), diga como se faz à beira do leito, aponte a armadilha mais comum e, quando couber, termine com uma pergunta curta que faça o estudante aplicar o que leu.
- Se o estudante errar um conceito, corrija com clareza e sem rodeios.
- Use markdown simples (negrito, listas curtas). Sem tabelas largas. No máximo cerca de 180 palavras, salvo pedido explícito.
- Se pedirem algo fora do tema ou perigoso, redirecione para o estudo.`;
let Lt = { modo: "conectando" };
const Ll = new Set(),
  ho = (a) => {
    (Lt = a), Ll.forEach((e) => e());
  },
  Qf = () =>
    S.useSyncExternalStore(
      (a) => (
        Ll.add(a),
        () => {
          Ll.delete(a);
        }
      ),
      () => Lt,
    ),
  ft = 16,
  nx = 25e4;
let Uo = null,
  Bs = "",
  Di = {},
  Ti = null,
  cs = !1,
  Sn = !1,
  kl = !1;
function lx(a) {
  let e = 2166136261;
  for (let o = 0; o < a.length; o++) (e ^= a.charCodeAt(o)), (e = Math.imul(e, 16777619));
  return e >>> 0;
}
const _f = { "ia-casos": "casosIA", "ia-sessoes": "ia", "ia-cartoes": "cartoesUsuario" };
function $f(a) {
  const { cards: e, casosIA: o, ia: i, cartoesUsuario: r, ...t } = a,
    n = { estado: JSON.stringify(t) };
  (n["ia-casos"] = JSON.stringify({ v: o || [] })), (n["ia-sessoes"] = JSON.stringify({ v: i || null })), (n["ia-cartoes"] = JSON.stringify({ v: r || {} }));
  const l = Array.from({ length: ft }, () => ({}));
  for (const [c, d] of Object.entries(e || {})) l[lx(c) % ft][c] = d;
  return (
    l.forEach((c, d) => {
      n["cards-" + d] = JSON.stringify(c);
    }),
    n
  );
}
const cx = { "ia-casos": '{"v":[]}', "ia-sessoes": '{"v":null}', "ia-cartoes": '{"v":{}}' },
  dx = (a) => {
    var e;
    return (e = Di[a]) != null ? e : a.startsWith("cards-") ? "{}" : cx[a];
  },
  ux = (a, e) => Promise.race([a, new Promise((o, i) => setTimeout(() => i({ code: "timeout" }), e))]),
  mx = (a) => new Promise((e) => setTimeout(e, a));
async function Gf() {
  const a = ["estado", ...Object.keys(_f), ...Array.from({ length: ft }, (r, t) => "cards-" + t)],
    e = await ux(Promise.all(a.map((r) => Uo.doc(`${Bs}/${r}`).get())), 1e4),
    o = {};
  let i = null;
  return (
    e.forEach((r, t) => {
      const n = r != null && r.exists ? r.data() : null;
      n && typeof n.json == "string" && ((o[a[t]] = n.json), t === 0 && (i = n));
    }),
    { remoto: o, meta: i }
  );
}
function Uf(a) {
  const e = JSON.parse(a.estado),
    o = {};
  for (let r = 0; r < ft; r++) {
    const t = a["cards-" + r];
    t && Object.assign(o, JSON.parse(t));
  }
  const i = {};
  for (const [r, t] of Object.entries(_f)) {
    try {
      const n = a[r] ? JSON.parse(a[r]).v : void 0;
      n && (i[t] = n);
    } catch (n) {}
    !(t in i) && e[t] !== void 0 && (i[t] = e[t]);
  }
  Cf({ ...e, ...i, cards: o }), (Di = $f(Ya()));
}
async function Wf() {
  const [a, e] = await Promise.all([Hl("db"), Hl("user")]);
  let o = null;
  try {
    o = e ? await e.id() : null;
  } catch (r) {
    o = null;
  }
  if (!a || !o) {
    ho({ modo: "local", msg: "Progresso salvo só neste navegador." });
    return;
  }
  (Uo = a), (Bs = `data/users/${o}`);
  try {
    const { remoto: r, meta: t } = await Gf(),
      n = Ya();
    if (t) {
      const l = (t.atualizadoEm || 0) > (n.atualizadoEm || 0),
        c = Ml(n) === 0 && Ml(JSON.parse(r.estado)) > 0;
      l || c ? Uf(r) : ((Di = { ...r }), xs(500));
    } else (Di = {}), xs(500);
    ho({ modo: "ok", quando: Date.now() });
  } catch (r) {
    ho({
      modo: "erro",
      msg:
        (r == null ? void 0 : r.code) === "timeout"
          ? "A conta não respondeu; o progresso fica neste navegador por enquanto."
          : "Não consegui ler o progresso da conta.",
    }),
      (r == null ? void 0 : r.code) === "timeout" &&
        setTimeout(() => {
          Lt.modo === "erro" && Wf();
        }, 3e4);
    return;
  }
  xf(() => xs());
  try {
    Uo.doc(`${Bs}/estado`).onSnapshot(
      (r) => {
        const t = r != null && r.exists ? r.data() : null;
        !t || typeof t.json != "string" || t.json === Di.estado || cs || ((t.atualizadoEm || 0) > (Ya().atualizadoEm || 0) && px());
      },
      () => {},
    );
  } catch (r) {}
  const i = () => {
    Ti && (clearTimeout(Ti), (Ti = null), Kf());
  };
  document.addEventListener("visibilitychange", () => {
    document.visibilityState === "hidden" && i();
  }),
    window.addEventListener("pagehide", i);
}
async function px() {
  try {
    const { remoto: a, meta: e } = await Gf();
    e && (e.atualizadoEm || 0) > (Ya().atualizadoEm || 0) && (Uf(a), ho({ modo: "ok", quando: Date.now(), msg: "Atualizado com outro aparelho." }));
  } catch (a) {}
}
function xs(a = 3500) {
  !Uo ||
    kl ||
    (clearTimeout(Ti),
    (Ti = setTimeout(() => {
      (Ti = null), Kf();
    }, a)));
}
async function fx(a, e) {
  try {
    await Uo.doc(`${Bs}/${a}`).set(e);
  } catch (o) {
    if ((o == null ? void 0 : o.code) !== "unavailable") throw o;
    await mx(800 + Math.random() * 1200), await Uo.doc(`${Bs}/${a}`).set(e);
  }
}
async function Kf() {
  if (!Uo || kl) return;
  if (cs) {
    Sn = !0;
    return;
  }
  cs = !0;
  const a = Ya(),
    e = $f(a),
    o = Object.keys(e)
      .filter((i) => e[i] !== dx(i))
      .sort((i, r) => (i === "estado" ? 1 : r === "estado" ? -1 : 0));
  if (!o.length) {
    cs = !1;
    return;
  }
  ho({ modo: "salvando", quando: Lt.quando });
  try {
    let i = !1;
    for (const r of o) {
      if (e[r].length > nx) {
        if (r === "estado" || r.startsWith("cards-")) throw { code: "grande" };
        i = !0;
        continue;
      }
      await fx(r, r === "estado" ? { json: e[r], atualizadoEm: a.atualizadoEm || 0, v: 1 } : { json: e[r] }), (Di[r] = e[r]);
    }
    ho(i ? { modo: "ok", quando: Date.now(), msg: "Parte do histórico da IA ficou só neste navegador (grande demais)." } : { modo: "ok", quando: Date.now() });
  } catch (i) {
    const r = (i == null ? void 0 : i.code) || "erro";
    r === "resource_exhausted" || r === "unavailable" || r === "erro"
      ? (ho({ modo: "erro", msg: "Conta ocupada; tento salvar de novo em instantes." }), setTimeout(() => xs(0), 2e4))
      : ((kl = !0),
        ho({
          modo: "local",
          msg:
            r === "invalid_argument"
              ? "Sem permissão para salvar nesta conta; o progresso fica neste navegador."
              : r === "quota_exceeded"
                ? "O espaço de dados deste artefato acabou; o progresso fica neste navegador."
                : r === "grande"
                  ? "Progresso grande demais para a conta; o progresso fica neste navegador."
                  : "A sincronização foi desligada nesta visita; o progresso fica neste navegador.",
        }));
  } finally {
    (cs = !1), Sn && ((Sn = !1), xs(1500));
  }
}
const gx = (a) => `Agora você é um examinador de prova prática/oral de semiologia. Conduza uma arguição sobre o conteúdo abaixo.
- Faça UMA pergunta por vez, aberta e objetiva (técnica de exame, achado esperado, interpretação, diferencial semiológico). Comece pela mais simples e aumente a dificuldade.
- Quando o estudante responder, comece por **Correto**, **Parcial** ou **Incorreto**, explique em 2–3 frases o que faltou ou o que estava certo e então faça a próxima pergunta.
- Numere as perguntas (Pergunta 1/${a}, 2/${a}…). Depois da resposta à pergunta ${a}, não pergunte mais: dê **Nota final (0–10)**, 2 pontos fortes e 2 pontos para revisar.
- Não dê a resposta antes de o estudante tentar, a menos que ele peça.`;
function we({ titulo: a = "Pergunte ao Claude", contexto: e, sugestoes: o = [], arguicao: i = !1, perguntas: r = 5, aberto: t = !1, compacto: n = !1 }) {
  const l = Za(),
    [c, d] = S.useState(t),
    [u, m] = S.useState([]),
    [p, f] = S.useState(""),
    [h, b] = S.useState(null),
    [z, g] = S.useState(null),
    x = S.useRef(null),
    v = S.useRef(""),
    C = S.useRef(null);
  if (
    (S.useEffect(
      () => () => {
        var D;
        return (D = x.current) == null ? void 0 : D.abort();
      },
      [],
    ),
    S.useEffect(() => {
      var D;
      (h !== null || u.length) && ((D = C.current) == null || D.scrollIntoView({ block: "nearest", behavior: "smooth" }));
    }, [u.length, h === null]),
    !l)
  )
    return null;
  const P = () => `${tx}

${
  i
    ? gx(r) +
      `

`
    : ""
}=== Conteúdo do app (contexto) ===
${typeof e == "function" ? e() : e}
=== fim do contexto ===

`,
    E = h !== null,
    j = async (D, I = !1) => {
      if (!D.trim() || E) return;
      g(null);
      const R = [...u, { role: "user", content: D.trim(), oculto: I }];
      m(R), f(""), b(""), (v.current = "");
      let N = R.slice(-16);
      N[0].role !== "user" && (N = N.slice(1));
      const y = N.map(($, U) => ({
        role: $.role,
        content:
          (U === 0
            ? P() +
              (N.length < R.length
                ? `(Mensagens antigas omitidas.)

`
                : "") +
              ($.oculto ? "" : "Estudante: ")
            : "") + ($.oculto ? "Comece a arguição agora com a Pergunta 1." : $.content),
      }));
      x.current = new AbortController();
      try {
        const $ = await Vf(y, {
          onText: (U) => {
            (v.current = U), b(U);
          },
          signal: x.current.signal,
          nivel: "default",
        });
        m([...R, { role: "assistant", content: $ }]), u.length || (ne(3), _c("ia"));
      } catch ($) {
        $.code === "aborted" && v.current
          ? m([...R, { role: "assistant", content: v.current + " …" }])
          : (m(u), $.code !== "aborted" && (g($.message), I || f(D)));
      } finally {
        b(null), (x.current = null);
      }
    };
  if (!c)
    return s.jsxs("button", {
      className: "ia-cta " + (n ? "compacto" : ""),
      onClick: () => d(!0),
      children: [
        s.jsx("span", { className: "ia-ic", children: s.jsx(q, { n: i ? "chat" : "spark", size: 18 }) }),
        s.jsxs("span", {
          children: [
            s.jsx("b", { children: a }),
            !n && s.jsx("small", { children: i ? `${r} perguntas abertas, corrigidas na hora` : "Tire dúvidas sobre esta tela com a IA" }),
          ],
        }),
        s.jsx(q, { n: "right", size: 18, cls: "muted" }),
      ],
    });
  const A = u.filter((D) => !D.oculto);
  return s.jsxs("div", {
    className: "ia-box",
    children: [
      s.jsxs("div", {
        className: "ia-h",
        children: [
          s.jsx("span", { className: "ia-ic", children: s.jsx(q, { n: i ? "chat" : "spark", size: 18 }) }),
          s.jsx("b", { children: a }),
          u.length > 0 &&
            !E &&
            s.jsxs("button", {
              className: "linkbtn small",
              onClick: () => {
                m([]), g(null);
              },
              children: [s.jsx(q, { n: "refresh", size: 14 }), " Nova"],
            }),
          s.jsx("button", {
            className: "iconbtn",
            "aria-label": "Fechar",
            onClick: () => {
              var D;
              (D = x.current) == null || D.abort(), d(!1);
            },
            children: s.jsx(q, { n: "x", size: 18 }),
          }),
        ],
      }),
      s.jsxs("div", {
        className: "ia-chat",
        children: [
          A.map((D, I) =>
            D.role === "user"
              ? s.jsx("div", { className: "ia-msg eu", children: D.content }, I)
              : s.jsx("div", { className: "ia-msg cl prose", dangerouslySetInnerHTML: { __html: me(D.content) } }, I),
          ),
          E &&
            s.jsx("div", {
              className: "ia-msg cl prose",
              children: h
                ? s.jsx("span", { dangerouslySetInnerHTML: { __html: me(h) } })
                : s.jsxs("span", { className: "digitando", children: [s.jsx("i", {}), s.jsx("i", {}), s.jsx("i", {})] }),
            }),
          z && s.jsx("div", { className: "ia-erro", children: z }),
          s.jsx("div", { ref: C }),
        ],
      }),
      i && u.length === 0 && !E
        ? s.jsxs("button", { className: "btn", onClick: () => j("começar", !0), children: [s.jsx(q, { n: "play", size: 16 }), " Começar arguição"] })
        : s.jsxs(s.Fragment, {
            children: [
              u.length === 0 &&
                o.length > 0 &&
                !E &&
                s.jsx("div", { className: "ia-sug", children: o.map((D) => s.jsx("button", { className: "chip", onClick: () => j(D), children: D }, D)) }),
              s.jsxs("form", {
                className: "ia-form",
                onSubmit: (D) => {
                  D.preventDefault(), j(p);
                },
                children: [
                  s.jsx("textarea", {
                    value: p,
                    rows: 1,
                    placeholder: i ? "Sua resposta…" : "Escreva sua dúvida…",
                    onChange: (D) => f(D.target.value),
                    onKeyDown: (D) => {
                      D.key === "Enter" && !D.shiftKey && (D.preventDefault(), j(p));
                    },
                  }),
                  E
                    ? s.jsx("button", {
                        type: "button",
                        className: "iconbtn solid",
                        "aria-label": "Parar",
                        onClick: () => {
                          var D;
                          return (D = x.current) == null ? void 0 : D.abort();
                        },
                        children: s.jsx(q, { n: "stop", size: 18 }),
                      })
                    : s.jsx("button", {
                        type: "submit",
                        className: "iconbtn solid",
                        "aria-label": "Enviar",
                        disabled: !p.trim(),
                        children: s.jsx(q, { n: "send", size: 18 }),
                      }),
                ],
              }),
            ],
          }),
      s.jsx("p", { className: "ia-nota", children: "Respostas geradas por IA podem errar. Confira no conteúdo e com seu professor." }),
    ],
  });
}
