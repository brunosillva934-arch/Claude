// Síntese dos sons cardíacos e pulmonares (Web Audio).
const sa = 22050;
function ji(a, e) {
  const o = Jo(e),
    i = new Float32Array(a);
  for (let r = 0; r < a; r++) i[r] = o() * 2 - 1;
  return i;
}
function zi(a, e, o) {
  const i = Math.sqrt(e * o),
    r = i / Math.max(10, o - e),
    t = (2 * Math.PI * i) / sa,
    n = Math.sin(t) / (2 * r),
    l = Math.cos(t),
    c = 1 + n,
    d = n / c,
    u = -n / c,
    m = (-2 * l) / c,
    p = (1 - n) / c;
  for (let h = 0; h < 2; h++) {
    let b = 0,
      z = 0,
      g = 0,
      x = 0;
    for (let v = 0; v < a.length; v++) {
      const C = a[v],
        P = d * C + u * z - m * g - p * x;
      (z = b), (b = C), (x = g), (g = P), (a[v] = P);
    }
  }
  let f = 0;
  for (let h = 0; h < a.length; h++) f += a[h] * a[h];
  f = Math.sqrt(f / Math.max(1, a.length)) || 1;
  for (let h = 0; h < a.length; h++) a[h] /= f;
  return a;
}
function da(a, e, o, i) {
  const r = a.length;
  let t = Math.round(e * sa);
  t = ((t % r) + r) % r;
  for (let n = 0; n < o.length; n++) a[(t + n) % r] += o[n] * i;
}
function uf(a, e = 0.85) {
  let o = 0;
  for (let i = 0; i < a.length; i++) o = Math.max(o, Math.abs(a[i]));
  if (o > 0) for (let i = 0; i < a.length; i++) a[i] *= e / o;
  return a;
}
const xb = {
  b1: { f: 58, h: 118, d: 0.03, len: 0.1 },
  b2: { f: 82, h: 170, d: 0.022, len: 0.075 },
  b3: { f: 36, h: 64, d: 0.035, len: 0.09 },
  b4: { f: 40, h: 72, d: 0.03, len: 0.08 },
};
function Qe(a, e) {
  const o = xb[a],
    i = Math.round(o.len * sa),
    r = new Float32Array(i),
    t = zi(ji(i, e), 60, 320);
  for (let n = 0; n < i; n++) {
    const l = n / sa,
      c = (1 - Math.exp(-l / 0.004)) * Math.exp(-l / o.d);
    r[n] = c * (0.7 * Math.sin(2 * Math.PI * o.f * l) + 0.35 * Math.sin(2 * Math.PI * o.h * l + 1) + 0.18 * t[n]);
  }
  return r;
}
function xn(a, e, o) {
  const i = Math.round(0.035 * sa),
    r = new Float32Array(i),
    t = zi(ji(i, o), 200, 900);
  for (let n = 0; n < i; n++) {
    const l = n / sa,
      c = Math.exp(-l / e);
    r[n] = c * (0.8 * Math.sin(2 * Math.PI * a * l) + 0.3 * t[n]);
  }
  return r;
}
function Cn(a, e, o) {
  var d, u, m;
  const i = Math.max(1, Math.round(e * sa)),
    r = { plato: [150, 520], diamante: [110, 460], decrescendo: [260, 760], ruflar: [55, 150], tardio: [160, 520], curto: [120, 380], continuo: [120, 520] }[
      a.forma
    ],
    t = zi(ji(i, o), (d = a.f1) != null ? d : r[0], (u = a.f2) != null ? u : r[1]),
    n = Jo(o + 9),
    l = (m = a.pico) != null ? m : 0.45;
  let c = 0;
  for (let p = 0; p < i; p++) {
    const f = p / i;
    let h = 1;
    switch (a.forma) {
      case "plato":
        h = Math.min(1, f / 0.06, (1 - f) / 0.04);
        break;
      case "tardio":
        h = Math.min(1, f / 0.2, (1 - f) / 0.05);
        break;
      case "diamante":
      case "curto":
        h = f < l ? Math.pow(f / l, 1.4) : Math.pow((1 - f) / (1 - l), 1.2);
        break;
      case "decrescendo":
        h = Math.min(1, f / 0.03) * Math.pow(1 - f, 1.6);
        break;
      case "continuo":
        h = f < 0.55 ? 0.35 + 0.65 * (f / 0.55) : 1 - 0.75 * ((f - 0.55) / 0.45);
        break;
      case "ruflar":
        h = Math.min(1, f / 0.1);
        break;
    }
    a.forma === "ruflar" && (p % 400 === 0 && (c = 0.45 + n() * 0.55), (h *= c)), (t[p] *= Math.max(0, h));
  }
  return t;
}
function Cb(a) {
  var p, f, h;
  const e = a.fc || 72,
    o = 60 / e,
    i = Jo(e * 31 + 7),
    r = Math.max(4, Math.round(8 / o)),
    t = Array.from({ length: r }, () => (a.irregular ? o * (0.62 + i() * 0.76) : o)),
    n = t.reduce((b, z) => b + z, 0),
    l = new Float32Array(Math.ceil(n * sa)),
    c = n / 2,
    d = a.desdobramento || "nenhum";
  let u = 0.05,
    m = 1;
  for (let b = 0; b < r; b++) {
    const z = t[b],
      g = Math.min(0.36, 0.11 + 0.28 * Math.min(z, 1)),
      x = ((u + g) % c) / c,
      v = x < 0.42 ? Math.sin((Math.PI * x) / 0.42) : 0,
      C = ((p = a.b1) != null ? p : 1) * (a.irregular ? 0.55 + i() * 0.7 : 1);
    a.b4 && da(l, u - 0.1, Qe("b4", m++), a.b4),
      da(l, u, Qe("b1", m++), C),
      da(l, u + 0.022, Qe("b1", m++), C * 0.45),
      a.cliqueEjecao && da(l, u + 0.065, xn(330, 0.006, m++), a.cliqueEjecao),
      a.cliqueMeso && da(l, u + g * 0.52, xn(300, 0.007, m++), a.cliqueMeso);
    const P = u + g,
      E = (f = a.a2) != null ? f : 1,
      j = (h = a.p2) != null ? h : 0.6;
    let A = 0,
      D = !1;
    d === "fisiologico"
      ? (A = 0.006 + 0.044 * v)
      : d === "amplo"
        ? (A = 0.035 + 0.035 * v)
        : d === "fixo"
          ? (A = 0.05)
          : d === "paradoxal" && ((A = 0.05 * (1 - v) + 0.004), (D = !0)),
      A < 0.014
        ? da(l, P, Qe("b2", m++), E + j * 0.35)
        : D
          ? (da(l, P, Qe("b2", m++), j), da(l, P + A, Qe("b2", m++), E))
          : (da(l, P, Qe("b2", m++), E), da(l, P + A, Qe("b2", m++), j)),
      a.estalido && da(l, P + 0.075, xn(420, 0.005, m++), a.estalido),
      a.b3 && da(l, P + 0.15, Qe("b3", m++), a.b3);
    for (const I of a.sopros || []) {
      let R = 0,
        N = 0;
      if (
        (I.fase === "sis"
          ? I.forma === "plato"
            ? ((R = u + 0.02), (N = P + 0.01))
            : I.forma === "tardio"
              ? ((R = u + g * 0.56), (N = P - 0.005))
              : I.forma === "curto"
                ? ((R = u + 0.08), (N = u + g * 0.62))
                : ((R = u + 0.07), (N = P - 0.03))
          : I.fase === "dia"
            ? I.forma === "ruflar"
              ? ((R = P + 0.1), (N = u + z - 0.03))
              : ((R = P + 0.012), (N = P + (z - g) * 0.62))
            : ((R = u + 0.04), (N = u + z - 0.02)),
        da(l, R, Cn(I, N - R, m++), I.amp * 0.22),
        I.forma === "ruflar" && !a.irregular)
      ) {
        const y = Cn({ ...I, forma: "diamante", pico: 0.85 }, 0.16, m++);
        da(l, u + z - 0.18, y, I.amp * 0.3);
      }
    }
    if (a.atrito) {
      const I = a.irregular ? [u + g * 0.45, P + 0.13] : [u - 0.09, u + g * 0.45, P + 0.13];
      for (const R of I) da(l, R, Cn({ forma: "curto", f1: 280, f2: 1400, pico: 0.3 }, 0.075, m++), a.atrito * 0.5);
    }
    u += z;
  }
  return uf(l);
}
function qb(a) {
  var h;
  const e = a.fr || 14,
    o = 60 / e,
    i = a.ie || 2,
    r = 2,
    t = o * r,
    n = Math.ceil(t * sa),
    l = new Float32Array(n),
    c = o / (1 + i),
    d = o - c,
    u = Jo(Math.round(e * 97 + (a.crepFinas || 0) * 13 + (a.sibilos || 0) * 7)),
    m = (h = a.amp) != null ? h : 1,
    p = {
      vesicular: { f: [110, 480], i: 1, e: 0.32, ef: 0.35, gap: 0 },
      diminuido: { f: [110, 420], i: 0.22, e: 0.08, ef: 0.3, gap: 0 },
      ausente: { f: [110, 400], i: 0.03, e: 0.02, ef: 0.3, gap: 0 },
      broncovesicular: { f: [170, 820], i: 0.85, e: 0.75, ef: 0.7, gap: 0.05 },
      bronquico: { f: [260, 1250], i: 0.7, e: 1, ef: 0.9, gap: 0.12 },
      traqueal: { f: [300, 1800], i: 1, e: 1, ef: 0.95, gap: 0.08 },
    }[a.base];
  let f = 3;
  for (let b = 0; b < r; b++) {
    const z = b * o,
      g = Math.round(c * sa),
      x = zi(ji(g, f++), p.f[0], p.f[1]);
    for (let j = 0; j < g; j++) {
      const A = j / g;
      x[j] *= Math.min(1, A / 0.25) * Math.min(1, (1 - A) / 0.12) * (0.75 + 0.25 * A);
    }
    da(l, z, x, p.i * m * 0.35);
    const v = Math.round(d * p.ef * sa),
      C = zi(ji(v, f++), p.f[0], p.f[1] * 0.9);
    for (let j = 0; j < v; j++) {
      const A = j / v;
      C[j] *= Math.min(1, A / 0.12) * Math.pow(1 - A, 1.2);
    }
    da(l, z + c + p.gap, C, p.e * m * 0.35);
    const P = Math.round((a.crepFinas || 0) * 16);
    for (let j = 0; j < P; j++) {
      const A = z + c * (0.55 + 0.43 * u()),
        D = Math.round(0.004 * sa),
        I = new Float32Array(D),
        R = 650 + u() * 350;
      for (let N = 0; N < D; N++) {
        const y = N / sa;
        I[N] = Math.exp(-y / 9e-4) * Math.sin(2 * Math.PI * R * y);
      }
      da(l, A, I, (0.35 + 0.4 * u()) * 0.9);
    }
    const E = Math.round((a.crepGrossas || 0) * 7);
    for (let j = 0; j < E; j++) {
      const A = j % 3 === 2 ? z + c + d * (0.05 + 0.35 * u()) : z + c * (0.05 + 0.4 * u()),
        D = Math.round(0.014 * sa),
        I = new Float32Array(D),
        R = 200 + u() * 120;
      for (let N = 0; N < D; N++) {
        const y = N / sa;
        I[N] = Math.exp(-y / 0.0035) * Math.sin(2 * Math.PI * R * y + 2 * Math.sin(2 * Math.PI * 60 * y));
      }
      da(l, A, I, 0.55 + 0.3 * u());
    }
    if (a.sibilos) {
      const j = z + c + 0.04,
        A = Math.round(d * 0.92 * sa),
        D = new Float32Array(A),
        I = [430, 575, 700];
      for (let y = 0; y < A; y++) {
        const $ = y / sa,
          U = y / A,
          xa = Math.min(1, U / 0.1) * Math.min(1, (1 - U) / 0.15);
        let $a = 0;
        I.forEach((F, V) => {
          $a += Math.sin(2 * Math.PI * F * $ * (1 + 0.012 * Math.sin(2 * Math.PI * (4 + V) * $))) / (V + 1.4);
        }),
          (D[y] = xa * $a);
      }
      da(l, j, D, a.sibilos * 0.32);
      const R = Math.round(c * 0.3 * sa),
        N = new Float32Array(R);
      for (let y = 0; y < R; y++) {
        const $ = y / sa,
          U = y / R;
        N[y] = Math.min(1, U / 0.2, (1 - U) / 0.2) * Math.sin(2 * Math.PI * 520 * $);
      }
      da(l, z + c * 0.68, N, a.sibilos * 0.12);
    }
    if (a.roncos) {
      const j = [
        [z + c * 0.2, c * 0.7],
        [z + c + 0.05, d * 0.85],
      ];
      for (const [A, D] of j) {
        const I = Math.round(D * sa),
          R = new Float32Array(I);
        for (let N = 0; N < I; N++) {
          const y = N / sa,
            $ = N / I,
            U = Math.min(1, $ / 0.12, (1 - $) / 0.12) * (0.6 + 0.4 * Math.abs(Math.sin(2 * Math.PI * 22 * y)));
          R[N] = U * (Math.sin(2 * Math.PI * 125 * y) + 0.55 * Math.sin(2 * Math.PI * 250 * y) + 0.3 * Math.sin(2 * Math.PI * 375 * y));
        }
        da(l, A, R, a.roncos * 0.28);
      }
    }
    if (a.estridor) {
      const j = Math.round(c * 0.9 * sa),
        A = new Float32Array(j);
      for (let D = 0; D < j; D++) {
        const I = D / sa,
          R = D / j,
          N = Math.min(1, R / 0.15) * Math.min(1, (1 - R) / 0.1);
        A[D] = N * (Math.sin(2 * Math.PI * 980 * I) + 0.4 * Math.sin(2 * Math.PI * 1960 * I) + 0.2 * Math.sin(2 * Math.PI * 1470 * I));
      }
      da(l, z + c * 0.05, A, a.estridor * 0.4);
    }
    if (a.atrito)
      for (const [j, A] of [
        [z + c * 0.65, c * 0.33],
        [z + c + 0.02, d * 0.3],
      ]) {
        const D = 5 + Math.floor(u() * 3);
        for (let I = 0; I < D; I++) {
          const R = j + (A * I) / D + u() * 0.02,
            N = Math.round(0.03 * sa),
            y = zi(ji(N, f++), 180, 650);
          for (let $ = 0; $ < N; $++) {
            const U = $ / N;
            y[$] *= Math.sin(Math.PI * U) * (0.6 + 0.4 * Math.sin(2 * Math.PI * 90 * ($ / sa)));
          }
          da(l, R, y, a.atrito * 0.35);
        }
      }
  }
  return uf(l, 0.8);
}
const qn = new Map();
function Lc(a) {
  if (qn.has(a)) return qn.get(a);
  const e = Gs.get(a);
  if (!e) return null;
  const o = e.spec,
    i = o.tipo === "coracao" ? Cb(o) : qb(o);
  return qn.set(a, i), i;
}
const Ab = (a) => {
  var e;
  return (((e = Lc(a)) == null ? void 0 : e.length) || 0) / sa;
};
let xe = null,
  ls = null,
  Go = null,
  mf = 0;
const Tl = new Set(),
  pf = () => Tl.forEach((a) => a());
function dt(a) {
  const e = Lc(a);
  if (e) {
    try {
      xe || (xe = new (window.AudioContext || window.webkitAudioContext)()), xe.state === "suspended" && xe.resume(), Me(!1);
      const o = xe.createBuffer(1, e.length, sa);
      o.getChannelData(0).set(e);
      const i = xe.createBufferSource();
      (i.buffer = o), (i.loop = !0);
      const r = xe.createGain();
      (r.gain.value = 1), i.connect(r).connect(xe.destination), i.start(), (ls = i), (Go = a), (mf = xe.currentTime);
    } catch (o) {
      Go = null;
    }
    pf();
  }
}
function Me(a = !0) {
  try {
    ls == null || ls.stop();
  } catch (e) {}
  (ls = null), (Go = null), a && pf();
}
function ff(a) {
  Go === a ? Me() : dt(a);
}
function Pb() {
  if (!xe || !Go) return 0;
  const a = Ab(Go);
  return a ? ((xe.currentTime - mf) % a) / a : 0;
}
function kc() {
  return S.useSyncExternalStore(
    (a) => (Tl.add(a), () => Tl.delete(a)),
    () => Go,
  );
}
document.addEventListener("visibilitychange", () => {
  document.hidden && Me();
});
