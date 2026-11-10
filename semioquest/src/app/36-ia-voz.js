// Voz nas estações de conversa: ditado (fala do estudante vira texto) e leitura em voz alta das respostas.
// As duas capacidades são opcionais: onde o visualizador não as oferece, os controles somem e tudo segue por texto.
let ditado = null,
  tts = null,
  alvoDitado = null,
  ditadoSemIdioma = !1;
const vozSubs = new Set(),
  vozEstado = { ditado: !1, tts: !1, ouvindo: !1, falando: !1, parcial: "" };
let vozSnap = { ...vozEstado };
const setVoz = (p) => {
  Object.assign(vozEstado, p), (vozSnap = { ...vozEstado }), vozSubs.forEach((f) => f());
};
const desligarDitado = () => {
  (ditado = null), setVoz({ ditado: !1, ouvindo: !1, parcial: "" });
};
Hl("dictation").then((d) => {
  if (!d) return;
  (ditado = d), setVoz({ ditado: !0 });
  try {
    d.onPartial(({ text }) => setVoz({ parcial: text || "" })),
      d.onFinal(({ text }) => {
        alvoDitado && text && alvoDitado(text);
      }),
      d.onState(({ state, reason }) => {
        setVoz({ ouvindo: state === "listening" || state === "starting", parcial: state === "idle" ? "" : vozEstado.parcial });
        if (state !== "idle") return;
        if (reason === "not_granted") desligarDitado();
        else if (reason === "unavailable") ditadoSemIdioma ? desligarDitado() : (ditadoSemIdioma = !0);
      });
  } catch (e) {
    desligarDitado();
  }
});
Hl("tts").then((t) => {
  if (!t) return;
  (tts = t), setVoz({ tts: !0 });
  try {
    t.onState(({ state }) => setVoz({ falando: state === "speaking" || state === "starting" }));
  } catch (e) {}
});
function useVoz() {
  return S.useSyncExternalStore(
    (f) => (
      vozSubs.add(f),
      () => {
        vozSubs.delete(f);
      }
    ),
    () => vozSnap,
  );
}
// Deve ser chamado direto do clique: o start() do ditado exige o gesto do usuário.
function alternarDitado(aoReceber) {
  if (!ditado) return;
  if (vozEstado.ouvindo) {
    ditado.stop().catch(() => {});
    return;
  }
  (alvoDitado = aoReceber), calarVoz();
  ditado.start(ditadoSemIdioma ? void 0 : { language: "pt-BR" }).catch((e) => {
    const c = e && e.code;
    if (c === "not_granted") desligarDitado(), ca("Ditado não autorizado. Continue digitando.");
    else if (c === "unavailable") ditadoSemIdioma ? desligarDitado() : (ditadoSemIdioma = !0), ca("Ditado indisponível agora. Toque de novo ou digite.");
    else if (c === "rate_limited") ca("Muitos ditados seguidos. Espere um pouco.");
    else if (c !== "stopped" && c !== "dismissed") ca("Não consegui abrir o microfone. Tente de novo ou digite.");
  });
}
function pararDitado() {
  ditado && vozEstado.ouvindo && ditado.stop().catch(() => {});
}
function falar(texto, voz) {
  if (!tts || !texto) return;
  const limpo = va(me(String(texto)), 1900);
  if (!limpo) return;
  tts.speak(limpo, { voice: voz || "buttery", language: "pt-BR" }).catch((e) => {
    const c = e && e.code;
    (c === "not_granted" || c === "unavailable") && ((tts = null), setVoz({ tts: !1, falando: !1 }));
  });
}
function calarVoz() {
  tts && vozEstado.falando && tts.stop().catch(() => {});
}
const VOZES = [
  ["buttery", "Voz 1"],
  ["airy", "Voz 2"],
  ["glassy", "Voz 3"],
  ["rounded", "Voz 4"],
];
// Botão de microfone para qualquer campo de texto. onTexto recebe cada trecho já pronto para anexar.
function MicBtn({ onTexto, disabled }) {
  const v = useVoz();
  return v.ditado
    ? s.jsx("button", {
        type: "button",
        className: "iconbtn mic " + (v.ouvindo ? "on" : ""),
        "aria-label": v.ouvindo ? "Parar ditado" : "Ditar",
        "aria-pressed": v.ouvindo,
        disabled,
        onClick: () => alternarDitado(onTexto),
        children: s.jsx(q, { n: v.ouvindo ? "stop" : "mic", size: 18 }),
      })
    : null;
}
// Barra com o texto provisório do ditado e a opção de ouvir as respostas.
function VozBarra({ rotulo = "Ouvir as respostas" }) {
  const v = useVoz(),
    ouvir = ea((x) => !!x.settings.ouvir),
    voz = ea((x) => x.settings.vozIA || "buttery");
  if (!v.ditado && !v.tts) return null;
  return s.jsxs("div", {
    className: "voz-bar",
    children: [
      v.tts &&
        s.jsxs("label", {
          children: [
            s.jsx("input", {
              type: "checkbox",
              id: "sq-ouvir",
              checked: ouvir,
              onChange: (e) => {
                const on = e.target.checked;
                W((x) => {
                  x.settings.ouvir = on;
                }),
                  on || calarVoz();
              },
            }),
            " ",
            rotulo,
          ],
        }),
      v.tts &&
        ouvir &&
        s.jsx("select", {
          id: "sq-voz",
          className: "input mini",
          "aria-label": "Voz",
          value: voz,
          onChange: (e) => {
            const n = e.target.value;
            W((x) => {
              x.settings.vozIA = n;
            });
          },
          children: VOZES.map(([id, nome]) => s.jsx("option", { value: id, children: nome }, id)),
        }),
      v.falando &&
        s.jsxs("button", { type: "button", className: "linkbtn small", onClick: calarVoz, children: [s.jsx(q, { n: "stop", size: 13 }), " Parar a voz"] }),
      v.ouvindo && s.jsxs("span", { className: "falando", children: [s.jsx(q, { n: "mic", size: 14 }), " ", v.parcial || "Ouvindo…"] }),
      v.ditado && !v.ouvindo && !v.tts && s.jsx("span", { children: "Toque no microfone para ditar." }),
    ],
  });
}
