// Roteador, ícones e componentes básicos.
let Ie = ["#/"];
const Ff = () => Ie[Ie.length - 1];
function pt(a) {
  a !== Ff() && (Ie.push(a), Ie.length > 60 && (Ie = Ie.slice(-60)), $c());
}
function ex(a) {
  (Ie[Ie.length - 1] = a), $c();
}
function Ws() {
  Ie.length > 1 ? Ie.pop() : (Ie = ["#/"]), $c();
}
(window.__sqIr = pt),
  document.addEventListener("click", (a) => {
    var i, r;
    if (a.defaultPrevented || a.button !== 0 || a.metaKey || a.ctrlKey) return;
    const e = (r = (i = a.target) == null ? void 0 : i.closest) == null ? void 0 : r.call(i, "a"),
      o = e == null ? void 0 : e.getAttribute("href");
    o && o.startsWith("#/") && (a.preventDefault(), pt(o));
  });
function ox() {
  return S.useSyncExternalStore(
    (a) => (
      Rl.add(a),
      () => {
        Rl.delete(a);
      }
    ),
    Ff,
  );
}
const ju = {
  home: "M3 11.5 12 4l9 7.5M5.5 10v9.5h4.5v-5.5h4v5.5h4.5V10",
  book: "M4 5.5C4 4.7 4.7 4 5.5 4H11v15.5H5.5c-.8 0-1.5.7-1.5 1.5V5.5zM20 5.5c0-.8-.7-1.5-1.5-1.5H13v15.5h5.5c.8 0 1.5.7 1.5 1.5V5.5z",
  play: "M6 9.5h4M8 7.5v4M15 9h.01M17.5 11.5h.01M7 5h10a4 4 0 0 1 4 4v3.5a4.5 4.5 0 0 1-8.2 2.6l-.3-.4h-1l-.3.4A4.5 4.5 0 0 1 3 12.5V9a4 4 0 0 1 4-4z",
  cards: "M7 4h11a2 2 0 0 1 2 2v9M4 8.5A1.5 1.5 0 0 1 5.5 7h9A1.5 1.5 0 0 1 16 8.5v10a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 4 18.5z",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20.5c.8-3.6 3.9-6 7.5-6s6.7 2.4 7.5 6",
  search: "M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM15.5 15.5 20 20",
  back: "M15 5l-7 7 7 7",
  right: "M9 5l7 7-7 7",
  heart: "M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z",
  lungs:
    "M12 4v7m0 0c-1 1.2-2.5 1.8-2.5 1.8M12 11c1 1.2 2.5 1.8 2.5 1.8M8.5 7.5C6 8 4 11.5 4 15.5c0 2.2 1 3.5 2.6 3.5 2 0 3.4-1.4 3.4-4V9.2c0-1-.6-1.8-1.5-1.7zM15.5 7.5C18 8 20 11.5 20 15.5c0 2.2-1 3.5-2.6 3.5-2 0-3.4-1.4-3.4-4V9.2c0-1 .6-1.8 1.5-1.7z",
  steth: "M6 3.5v5a4.5 4.5 0 0 0 9 0v-5M10.5 13v2.5a4.5 4.5 0 0 0 9 0V14M19.5 14a1.75 1.75 0 1 0 0-3.5 1.75 1.75 0 0 0 0 3.5z",
  clipboard:
    "M9 4.5h6v2H9zM7.5 5.5H6a1.5 1.5 0 0 0-1.5 1.5v12A1.5 1.5 0 0 0 6 20.5h12a1.5 1.5 0 0 0 1.5-1.5V7A1.5 1.5 0 0 0 18 5.5h-1.5M8 11h8M8 14.5h8M8 18h5",
  thermo: "M14 14.8V5a2 2 0 1 0-4 0v9.8a4 4 0 1 0 4 0zM12 9v7",
  eye: "M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  gauge: "M4.5 17a8 8 0 1 1 15 0M12 13l3.5-4M12 14a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
  check: "M5 12.5l4.5 4.5L19 7.5",
  x: "M6 6l12 12M18 6 6 18",
  volume: "M4 9.5h3.5L12 5.5v13l-4.5-4H4zM16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11",
  pause: "M8 5.5v13M16 5.5v13",
  playIcon: "M7 4.5v15l12-7.5z",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3.5 2",
  trophy: "M8 4.5h8v5a4 4 0 0 1-8 0zM8 6.5H5a3 3 0 0 0 3 4M16 6.5h3a3 3 0 0 1-3 4M12 13.5v3M8.5 20h7M9.5 16.5h5V20h-5z",
  flame: "M12 21c3.6 0 6-2.5 6-6 0-3.8-3-5.8-3.5-9.5C12 7.5 11 10 11 12c-1.2-.6-2-2-2-3.5C7 10.2 6 12.5 6 15c0 3.5 2.4 6 6 6z",
  flag: "M5.5 21V4.5M5.5 5h11l-2 3.5 2 3.5h-11",
  star: "M12 4l2.4 5 5.4.6-4 3.7 1.1 5.4L12 16l-4.9 2.7 1.1-5.4-4-3.7 5.4-.6z",
  ear: "M7 9.5a5 5 0 0 1 10 0c0 3-2.5 4-3 6.5-.4 2-1.6 3.5-3.5 3.5A2.5 2.5 0 0 1 8 17M10 9.5a2 2 0 0 1 4 0c0 1.2-1 1.6-1.5 2.5",
  puzzle: "M10 4.5a2 2 0 0 1 4 0V6h4v4h-1.5a2 2 0 0 0 0 4H18v4.5h-4.5V17a2 2 0 0 0-4 0v1.5H6V14h1.5a2 2 0 0 0 0-4H6V6h4z",
  list: "M9 6.5h11M9 12h11M9 17.5h11M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01",
  body: "M12 6.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM7 9h10M12 9v5.5M12 14.5 9.5 21M12 14.5l2.5 6.5M7 9l-1.5 5.5M17 9l1.5 5.5",
  settings:
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2-1.2L14.2 3h-4l-.4 2.6a7 7 0 0 0-2 1.2l-2.4-.9-2 3.4 2 1.5a7 7 0 0 0 0 2.4l-2 1.5 2 3.4 2.4-.9a7 7 0 0 0 2 1.2l.4 2.6h4l.4-2.6a7 7 0 0 0 2-1.2l2.3.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5.5M12 7.5h.01",
  bolt: "M13 3 5 13.5h6L10 21l8-10.5h-6z",
  table: "M4 5h16v14H4zM4 10h16M4 14.5h16M10 5v14",
  hand: "M8 13V6.5a1.5 1.5 0 0 1 3 0V12M11 11V5a1.5 1.5 0 0 1 3 0v6M14 11V6.5a1.5 1.5 0 0 1 3 0V14c0 4-2.5 6.5-6 6.5-2.5 0-4-1.2-5.2-3.5L4 13.5a1.4 1.4 0 0 1 2.4-1.4L8 14.5",
  drop: "M12 3.5s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z",
  brain:
    "M9 4.5a3 3 0 0 0-3 3 3 3 0 0 0-1.5 5.5A3 3 0 0 0 7 18a2.5 2.5 0 0 0 5 .5V5.5a1.5 1.5 0 0 0-3-1zM15 4.5a3 3 0 0 1 3 3 3 3 0 0 1 1.5 5.5A3 3 0 0 1 17 18a2.5 2.5 0 0 1-5 .5",
  bone: "M7 4.5a2.5 2.5 0 0 0-2 4l10 10a2.5 2.5 0 1 0 4-2l-10-10a2.5 2.5 0 0 0-2-2z",
  skin: "M4 7c3 0 3-2 6-2s3 2 6 2 3-2 4-2v12c-1 0-1 2-4 2s-3-2-6-2-3 2-6 2V7zM9 11h.01M14 13h.01",
  abdomen: "M7 4c-1 4-2 7-2 10a7 7 0 0 0 14 0c0-3-1-6-2-10M12 14.5h.01M9 9.5h6",
  refresh: "M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4.5V9H15",
  spark: "M11 3.5l1.9 5.6 5.6 1.9-5.6 1.9L11 18.5l-1.9-5.6L3.5 11l5.6-1.9zM18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z",
  send: "M4.5 12 20 4.5 15.5 20l-3-6.5zM12.5 13.5 20 4.5",
  stop: "M7.5 7.5h9v9h-9z",
  chat: "M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v8.5a1.5 1.5 0 0 1-1.5 1.5H10l-4.5 3.5V17H5a1.5 1.5 0 0 1-1.5-1.5V7A1.5 1.5 0 0 1 5 5.5z",
  cloud: "M7 18.5h10.5a4 4 0 0 0 .6-8 6 6 0 0 0-11.6 1.6A3.3 3.3 0 0 0 7 18.5z",
  pen: "M4.5 19.5l1-4L16 5a2 2 0 0 1 3 3L8.5 18.5zM14 7l3 3",
  mic: "M12 15a3 3 0 0 0 3-3V7a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3zM6.5 11.5a5.5 5.5 0 0 0 11 0M12 17v3.5M9 20.5h6",
  target: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zM12 12h.01",
  layers: "M12 3.5l8.5 4.5L12 12.5 3.5 8zM3.5 12l8.5 4.5 8.5-4.5M3.5 16l8.5 4.5 8.5-4.5",
  grad: "M2.5 9 12 4.5 21.5 9 12 13.5zM6.5 11v4.5c1.5 1.5 3.4 2.2 5.5 2.2s4-.7 5.5-2.2V11M21.5 9v5",
};
function q({ n: a, size: e = 22, cls: o = "" }) {
  return s.jsx("svg", {
    className: "ic " + o,
    width: e,
    height: e,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
    children: s.jsx("path", { d: ju[a] || ju.info }),
  });
}
function Q({ title: a, back: e = !0, right: o }) {
  return s.jsxs("header", {
    className: "topbar",
    children: [
      e
        ? s.jsx("button", { className: "iconbtn", "aria-label": "Voltar", onClick: Ws, children: s.jsx(q, { n: "back" }) })
        : s.jsx("span", { className: "brandmark", children: "SQ" }),
      s.jsx("h1", { children: a }),
      s.jsx("div", {
        className: "topbar-right",
        children: o != null ? o : s.jsx("a", { className: "iconbtn", href: "#/busca", "aria-label": "Buscar", children: s.jsx(q, { n: "search" }) }),
      }),
    ],
  });
}
const Ba = ({ html: a, cls: e = "" }) => s.jsx("div", { className: "prose " + e, dangerouslySetInnerHTML: { __html: a } }),
  eo = ({ pct: a, cls: e = "" }) =>
    s.jsx("div", { className: "bar " + e, children: s.jsx("i", { style: { width: `${Math.max(0, Math.min(100, a * 100))}%` } }) }),
  Ta = ({ children: a, cls: e = "" }) => s.jsx("span", { className: "chip " + e, children: a });
function w({ title: a, children: e, action: o }) {
  return s.jsxs("section", { className: "sec", children: [s.jsxs("div", { className: "sec-h", children: [s.jsx("h2", { children: a }), o] }), e] });
}
function B({ href: a, icon: e, title: o, sub: i, right: r, onClick: t, cls: n = "" }) {
  const l = s.jsxs(s.Fragment, {
    children: [
      e && s.jsx("span", { className: "row-ic", children: e }),
      s.jsxs("span", { className: "row-t", children: [s.jsx("b", { children: o }), i && s.jsx("small", { children: i })] }),
      r != null ? r : a ? s.jsx(q, { n: "right", size: 18, cls: "muted" }) : null,
    ],
  });
  return a ? s.jsx("a", { className: "row " + n, href: a, children: l }) : s.jsx("button", { className: "row " + n, onClick: t, children: l });
}
function ii({ open: a, onClose: e, title: o, children: i }) {
  return a
    ? s.jsx("div", {
        className: "modal-bg",
        onClick: e,
        children: s.jsxs("div", {
          className: "modal",
          onClick: (r) => r.stopPropagation(),
          role: "dialog",
          "aria-label": o,
          children: [
            s.jsxs("div", {
              className: "modal-h",
              children: [
                s.jsx("h3", { children: o }),
                s.jsx("button", { className: "iconbtn", onClick: e, "aria-label": "Fechar", children: s.jsx(q, { n: "x" }) }),
              ],
            }),
            s.jsx("div", { className: "modal-b", children: i }),
          ],
        }),
      })
    : null;
}
function _i({ alvo: a }) {
  const [e, o] = S.useState(!1),
    [i, r] = S.useState("");
  return s.jsxs(s.Fragment, {
    children: [
      s.jsxs("button", { className: "linkbtn small", onClick: () => o(!0), children: [s.jsx(q, { n: "flag", size: 16 }), " Reportar erro"] }),
      s.jsxs(ii, {
        open: e,
        onClose: () => o(!1),
        title: "Reportar erro",
        children: [
          s.jsxs("p", {
            className: "muted",
            children: [
              "Descreva o que está errado ou confuso em ",
              s.jsx("b", { children: a }),
              ". O relato fica salvo no aparelho; em Perfil você copia a lista para enviar.",
            ],
          }),
          s.jsx("textarea", { value: i, onChange: (t) => r(t.target.value), rows: 5, placeholder: "Ex.: a irradiação desse sopro está trocada…" }),
          s.jsx("button", {
            className: "btn",
            disabled: !i.trim(),
            onClick: () => {
              If(a, i.trim()), r(""), o(!1), ca("Relato salvo. Obrigado!");
            },
            children: "Salvar relato",
          }),
        ],
      }),
    ],
  });
}
function Hf({ id: a, h: e = 64 }) {
  const o = S.useRef(null),
    i = kc() === a;
  return (
    S.useEffect(() => {
      const r = o.current;
      if (!r) return;
      const t = Lc(a);
      if (!t) return;
      const n = window.devicePixelRatio || 1,
        l = r.clientWidth || 300;
      (r.width = l * n), (r.height = e * n);
      const c = r.getContext("2d");
      c.scale(n, n);
      const d = getComputedStyle(r).color,
        u = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#e07a3f";
      let m = 0;
      const p = () => {
        c.clearRect(0, 0, l, e);
        const f = t.length / l;
        c.fillStyle = d;
        for (let h = 0; h < l; h++) {
          let b = 0;
          const z = Math.floor(h * f),
            g = Math.floor((h + 1) * f);
          for (let v = z; v < g; v += 3) b = Math.max(b, Math.abs(t[v]));
          const x = b * (e / 2 - 2);
          c.fillRect(h, e / 2 - x, 1, Math.max(1, x * 2));
        }
        if (i) {
          const h = Pb() * l;
          (c.fillStyle = u), c.fillRect(h - 1, 0, 2, e), (m = requestAnimationFrame(p));
        }
      };
      return p(), () => cancelAnimationFrame(m);
    }, [a, i, e]),
    s.jsx("canvas", { ref: o, className: "fono", style: { height: e }, "aria-hidden": "true" })
  );
}
function $i({ id: a, label: e, mostrarNome: o = !1, fono: i = !0 }) {
  const r = kc() === a,
    t = Gs.get(a);
  return t
    ? s.jsxs("div", {
        className: "som " + (r ? "on" : ""),
        children: [
          s.jsx("button", {
            className: "som-btn",
            onClick: () => ff(a),
            "aria-label": r ? "Pausar" : "Tocar",
            children: s.jsx(q, { n: r ? "pause" : "playIcon", size: 20 }),
          }),
          s.jsxs("div", {
            className: "som-info",
            children: [s.jsx("b", { children: e != null ? e : o ? t.nome : "Ouvir" }), i && s.jsx(Hf, { id: a, h: 40 })],
          }),
        ],
      })
    : null;
}
function ix() {
  const [a, e] = S.useState([]);
  return (
    S.useEffect(() => {
      Xb((i) => {
        const r = Date.now() + Math.random();
        e((t) => [...t, { id: r, m: i }]), setTimeout(() => e((t) => t.filter((n) => n.id !== r)), 2600);
      });
    }, []),
    s.jsx("div", { className: "toasts", children: a.map((o) => s.jsx("div", { className: "toast", children: o.m }, o.id)) })
  );
}
function sx({ opcoes: a, correta: e, escolhida: o, onEscolher: i, render: r }) {
  return s.jsx("div", {
    className: "opcoes",
    children: a.map((t) => {
      let n = "opcao";
      return (
        o && (t === e ? (n += " certa") : t === o ? (n += " errada") : (n += " apagada")),
        s.jsx("button", { className: n, disabled: !!o, onClick: () => i(t), children: r ? r(t) : t }, t)
      );
    }),
  });
}
