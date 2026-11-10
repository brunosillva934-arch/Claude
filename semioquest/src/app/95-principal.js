// Rotas, barra de abas e montagem.
function y1() {
  const a = ox();
  return (
    S.useEffect(() => {
      Me(), window.scrollTo(0, 0);
    }, [a]),
    a
  );
}
function R1(a) {
  const [e, o] = a.replace(/^#/, "").split("?"),
    i = e.split("/").filter(Boolean).map(decodeURIComponent),
    r = new URLSearchParams(o || "");
  switch (i[0]) {
    case void 0:
      return { el: s.jsx(zu, {}), tab: "home" };
    case "biblioteca":
      return { el: s.jsx(Bx, {}), tab: "bib" };
    case "modulo":
      return { el: s.jsx(wx, { id: i[1] }), tab: "bib" };
    case "topico":
      return { el: s.jsx(Vx, { id: i[1] }), tab: "bib" };
    case "sinais":
      return { el: s.jsx(Qx, {}), tab: "bib" };
    case "sinal":
      return { el: s.jsx(_x, { id: i[1] }), tab: "bib" };
    case "sons":
      return { el: s.jsx($x, {}), tab: "bib" };
    case "som":
      return { el: s.jsx(Gx, { id: i[1] }), tab: "bib" };
    case "tabelas":
      return { el: s.jsx(Ux, {}), tab: "bib" };
    case "sindrome":
      return { el: s.jsx(Wx, { id: i[1] }), tab: "bib" };
    case "glossario":
      return { el: s.jsx(Kx, { foco: i[1] }), tab: "bib" };
    case "quadros":
      return { el: s.jsx(bx, {}), tab: "bib" };
    case "area":
      return { el: s.jsx(xx, { n: Number(i[1]) }), tab: "bib" };
    case "quadro":
      return { el: s.jsx(Cx, { num: i[1] }, i[1]), tab: "bib" };
    case "busca":
      return { el: s.jsx(Jx, { q0: r.get("q") || "" }), tab: "" };
    case "jogar":
      return { el: s.jsx(Du, {}), tab: "jogar" };
    case "jogo":
      switch (i[1]) {
        case "caso":
          return { el: s.jsx(h1, { id: i[2], osce: r.get("osce") === "1" }, a), tab: "jogar", full: !0 };
        case "estetoscopio":
          return { el: s.jsx(S1, { modo: i[2] }, a), tab: "jogar", full: !0 };
        case "detetive":
          return { el: s.jsx(j1, { modo: i[2] }, a), tab: "jogar", full: !0 };
        case "sequencia":
          return { el: s.jsx(z1, { id: i[2] }, a), tab: "jogar", full: !0 };
        case "sindrome":
          return { el: s.jsx(I1, { id: i[2] }, a), tab: "jogar", full: !0 };
        case "desafio":
          return { el: s.jsx(N1, {}, a), tab: "home", full: !0 };
        case "quadro":
          return { el: s.jsx(T1, { num: i[2] }, a), tab: "jogar", full: !0 };
        case "novo-caso":
          return { el: s.jsx(M1, { sis0: r.get("s") || void 0 }), tab: "ia" };
        case "ia":
          return { el: s.jsx(vx, { tipo: i[2], id: i[3] }, a), tab: "jogar", full: !0 };
        case "area":
          return i[2] ? { el: s.jsx(Fu, { n: i[2] }, a), tab: "jogar", full: !0 } : { el: s.jsx(Fu, {}, a), tab: "jogar" };
      }
      return { el: s.jsx(Du, {}), tab: "jogar" };
    case "ia":
      if (i[1] === "preceptor") return { el: s.jsx(Preceptor, { q0: r.get("q") || "" }), tab: "ia" };
      return i[1] === "s"
        ? { el: s.jsx(Ox, { id: i[2] }, i[2]), tab: "ia" }
        : i[1] === "e"
          ? { el: s.jsx(eg, { sis: i[2], modo: i[3], item0: r.get("item") || void 0 }, a), tab: "ia", full: !0 }
          : i[1] === "h"
            ? { el: s.jsx(kx, { id: i[2] }, i[2]), tab: "ia" }
            : i[1] === "osce"
              ? { el: s.jsx(Ex, { sis: i[2] }, a), tab: "ia", full: !0 }
              : { el: s.jsx(Rx, {}), tab: "ia" };
    case "revisar":
      return { el: s.jsx(Xx, {}), tab: "rev" };
    case "perfil":
      return { el: s.jsx(a1, {}), tab: "perfil" };
    default:
      return { el: s.jsx(zu, {}), tab: "home" };
  }
}
const O1 = [
  { id: "home", href: "#/", icon: "home", label: "Início" },
  { id: "bib", href: "#/biblioteca", icon: "book", label: "Biblioteca" },
  { id: "jogar", href: "#/jogar", icon: "play", label: "Jogar" },
  { id: "ia", href: "#/ia", icon: "spark", label: "Clínica IA" },
  { id: "rev", href: "#/revisar", icon: "cards", label: "Revisar" },
  { id: "perfil", href: "#/perfil", icon: "user", label: "Perfil" },
];
function F1() {
  const a = y1(),
    e = ea((n) => n.settings.theme),
    o = ea((n) => n.settings.font),
    i = ea((n) => n.onboarded),
    r = Qf();
  if (
    (S.useEffect(() => {
      var d;
      const n = document.documentElement,
        l = window.matchMedia("(prefers-color-scheme: dark)"),
        c = () => {
          n.dataset.theme = e === "dark" || (e === "system" && l.matches) ? "dark" : "light";
        };
      return (
        c(),
        (n.dataset.font = String(o)),
        (d = l.addEventListener) == null || d.call(l, "change", c),
        () => {
          var u;
          return (u = l.removeEventListener) == null ? void 0 : u.call(l, "change", c);
        }
      );
    }, [e, o]),
    !i && r.modo === "conectando")
  )
    return s.jsxs("div", {
      className: "onb",
      children: [
        s.jsx("div", { className: "onb-ic pulso", children: s.jsx(q, { n: "cloud", size: 48 }) }),
        s.jsx("p", { children: "Carregando seu progresso…" }),
      ],
    });
  if (!i) return s.jsx(e1, {});
  const t = R1(a);
  return s.jsxs("div", {
    className: "app " + (t.full ? "full" : ""),
    children: [
      s.jsx("main", { className: "main", children: t.el }),
      !t.full &&
        s.jsx("nav", {
          className: "tabbar",
          children: O1.map((n) =>
            s.jsxs(
              "a",
              { href: n.href, className: t.tab === n.id ? "on" : "", children: [s.jsx(q, { n: n.icon, size: 22 }), s.jsx("span", { children: n.label })] },
              n.id,
            ),
          ),
        }),
      s.jsx(ix, {}),
    ],
  });
}
Jp(document.getElementById("root")).render(s.jsx(F1, {}));
Wf();
