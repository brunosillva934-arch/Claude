// ts-fsrs (repetição espaçada) — código de terceiros, descompilado do bundle original.
class Bc extends Error {
  constructor(e = "FSRS Error") {
    var o;
    super(e), (this.name = "FSRSError"), (o = Error.captureStackTrace) == null || o.call(Error, this, Bc);
  }
}
class Aa extends Bc {
  constructor(e) {
    var o;
    super(e), (this.name = "FSRSValidationError"), (o = Error.captureStackTrace) == null || o.call(Error, this, Aa);
  }
}
var Y = ((a) => ((a[(a.New = 0)] = "New"), (a[(a.Learning = 1)] = "Learning"), (a[(a.Review = 2)] = "Review"), (a[(a.Relearning = 3)] = "Relearning"), a))(
    Y || {},
  ),
  H = ((a) => (
    (a[(a.Manual = 0)] = "Manual"), (a[(a.Again = 1)] = "Again"), (a[(a.Hard = 2)] = "Hard"), (a[(a.Good = 3)] = "Good"), (a[(a.Easy = 4)] = "Easy"), a
  ))(H || {});
class Z {
  static card(e) {
    return { ...e, state: Z.state(e.state), due: Z.time(e.due), last_review: e.last_review ? Z.time(e.last_review) : void 0 };
  }
  static rating(e) {
    if (typeof e == "string") {
      const o = e.charAt(0).toUpperCase(),
        i = e.slice(1).toLowerCase(),
        r = H[`${o}${i}`];
      if (r === void 0) throw new Aa(`Invalid rating:[${e}]`);
      return r;
    } else if (typeof e == "number") return e;
    throw new Aa(`Invalid rating:[${e}]`);
  }
  static state(e) {
    if (typeof e == "string") {
      const o = e.charAt(0).toUpperCase(),
        i = e.slice(1).toLowerCase(),
        r = Y[`${o}${i}`];
      if (r === void 0) throw new Aa(`Invalid state:[${e}]`);
      return r;
    } else if (typeof e == "number") return e;
    throw new Aa(`Invalid state:[${e}]`);
  }
  static time(e) {
    if (e instanceof Date) return e;
    const o = new Date(e);
    if (typeof e == "object" && e !== null && !Number.isNaN(Date.parse(e) || +o)) return o;
    if (typeof e == "string") {
      const i = Date.parse(e);
      if (Number.isNaN(i)) throw new Aa(`Invalid date:[${e}]`);
      return new Date(i);
    } else if (typeof e == "number") return new Date(e);
    throw new Aa(`Invalid date:[${e}]`);
  }
  static review_log(e) {
    return { ...e, due: Z.time(e.due), rating: Z.rating(e.rating), state: Z.state(e.state), review: Z.time(e.review) };
  }
}
/* istanbul ignore next -- @preserve */ Date.prototype.scheduler = function (a, e) {
  return Se(this, a, e);
};
/* istanbul ignore next -- @preserve */ Date.prototype.diff = function (a, e) {
  return Ei(this, a, e);
};
/* istanbul ignore next -- @preserve */ Date.prototype.format = function () {
  return Sb(this);
};
/* istanbul ignore next -- @preserve */ Date.prototype.dueFormat = function (a, e, o) {
  return jb(this, a, e, o);
};
function Se(a, e, o) {
  return new Date(o ? Z.time(a).getTime() + e * 24 * 60 * 60 * 1e3 : Z.time(a).getTime() + e * 60 * 1e3);
}
function Ei(a, e, o) {
  if (!a || !e) throw new Aa("Invalid date");
  const i = Z.time(a).getTime() - Z.time(e).getTime();
  let r = 0;
  switch (o) {
    case "days":
      r = Math.floor(i / (24 * 60 * 60 * 1e3));
      break;
    case "minutes":
      r = Math.floor(i / (60 * 1e3));
      break;
  }
  return r;
}
function Sb(a) {
  const e = Z.time(a),
    o = e.getFullYear(),
    i = e.getMonth() + 1,
    r = e.getDate(),
    t = e.getHours(),
    n = e.getMinutes(),
    l = e.getSeconds();
  return `${o}-${es(i)}-${es(r)} ${es(t)}:${es(n)}:${es(l)}`;
}
function es(a) {
  return a < 10 ? `0${a}` : `${a}`;
}
const An = [60, 60, 24, 31, 12],
  Pn = ["second", "min", "hour", "day", "month", "year"];
function jb(a, e, o, i = Pn) {
  (a = Z.time(a)), (e = Z.time(e)), i.length !== Pn.length && (i = Pn);
  let r = a.getTime() - e.getTime(),
    t = 0;
  for (r /= 1e3, t = 0; t < An.length && !(r < An[t]); t++) r /= An[t];
  return `${Math.floor(r)}${o ? i[t] : ""}`;
}
const zb = Object.freeze([H.Again, H.Hard, H.Good, H.Easy]),
  Eb = [
    { start: 2.5, end: 7, factor: 0.15 },
    { start: 7, end: 20, factor: 0.1 },
    { start: 20, end: 1 / 0, factor: 0.05 },
  ];
function Ib(a, e, o) {
  let i = 1;
  for (const n of Eb) i += n.factor * Math.max(Math.min(a, n.end) - n.start, 0);
  a = Math.min(a, o);
  let r = Math.max(2, Math.round(a - i));
  const t = Math.min(Math.round(a + i), o);
  return a > e && (r = Math.max(r, e + 1)), (r = Math.min(r, t)), { min_ivl: r, max_ivl: t };
}
function je(a, e, o) {
  return Math.min(Math.max(a, e), o);
}
function qe(a, e) {
  const o = 10 ** e;
  return Math.round(a * o) / o;
}
function Db(a, e) {
  const o = Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate()),
    i = Date.UTC(e.getUTCFullYear(), e.getUTCMonth(), e.getUTCDate());
  return Math.floor((i - o) / 864e5);
}
const Tb = (a) => {
    const e = a.slice(-1),
      o = parseInt(a.slice(0, -1), 10);
    if (Number.isNaN(o) || !Number.isFinite(o) || o < 0) throw new Aa(`Invalid step value: ${a}`);
    switch (e) {
      case "m":
        return o;
      case "h":
        return o * 60;
      case "d":
        return o * 1440;
      default:
        throw new Aa(`Invalid step unit: ${a}, expected m/h/d`);
    }
  },
  Nb = (a, e, o) => {
    const i = e === Y.Relearning || e === Y.Review ? a.relearning_steps : a.learning_steps,
      r = i.length;
    if (r === 0 || o >= r) return {};
    const t = i[0],
      n = Tb,
      l = () => n(t),
      c = () => {
        if (r === 1) return Math.round(n(t) * 1.5);
        const f = i[1];
        return Math.round((n(t) + n(f)) / 2);
      },
      d = (f) => (f < 0 || f >= r ? null : i[f]),
      u = (f) => n(f),
      m = {},
      p = d(Math.max(0, o));
    if (e === Y.Review) return (m[H.Again] = { scheduled_minutes: n(p), next_step: 0 }), m;
    {
      (m[H.Again] = { scheduled_minutes: l(), next_step: 0 }), (m[H.Hard] = { scheduled_minutes: c(), next_step: o });
      const f = d(o + 1);
      if (f) {
        const h = u(f);
        h && (m[H.Good] = { scheduled_minutes: Math.round(h), next_step: o + 1 });
      }
    }
    return m;
  };
function Mb() {
  const a = this.review_time.getTime(),
    e = this.current.reps,
    o = this.current.difficulty * this.current.stability;
  return `${a}_${e}_${o}`;
}
var yt = ((a) => ((a.SCHEDULER = "Scheduler"), (a.LEARNING_STEPS = "LearningSteps"), (a.SEED = "Seed"), a))(yt || {});
class gf {
  constructor(e, o, i, r) {
    Ca(this, "last");
    Ca(this, "current");
    Ca(this, "review_time");
    Ca(this, "next", new Map());
    Ca(this, "algorithm");
    Ca(this, "strategies");
    Ca(this, "elapsed_days", 0);
    (this.algorithm = i), (this.last = Z.card(e)), (this.current = Z.card(e)), (this.review_time = Z.time(o)), (this.strategies = r), this.init();
  }
  checkGrade(e) {
    if (!Number.isFinite(e) || e < 1 || e > 4) throw new Aa(`Invalid grade "${e}",expected 1-4`);
  }
  init() {
    const { state: e, last_review: o } = this.current;
    let i = 0;
    e !== Y.New && o && (i = Db(o, this.review_time)),
      (this.current.last_review = this.review_time),
      (this.elapsed_days = i),
      (this.current.elapsed_days = i),
      (this.current.reps += 1);
    let r = Mb;
    if (this.strategies) {
      const t = this.strategies.get(yt.SEED);
      t && (r = t);
    }
    this.algorithm.seed = r.call(this);
  }
  preview() {
    return {
      [H.Again]: this.review(H.Again),
      [H.Hard]: this.review(H.Hard),
      [H.Good]: this.review(H.Good),
      [H.Easy]: this.review(H.Easy),
      [Symbol.iterator]: this.previewIterator.bind(this),
    };
  }
  *previewIterator() {
    for (const e of zb) yield this.review(e);
  }
  review(e) {
    const { state: o } = this.last;
    let i;
    switch ((this.checkGrade(e), o)) {
      case Y.New:
        i = this.newState(e);
        break;
      case Y.Learning:
      case Y.Relearning:
        i = this.learningState(e);
        break;
      case Y.Review:
        i = this.reviewState(e);
        break;
    }
    return i;
  }
  buildLog(e) {
    const { last_review: o, due: i, elapsed_days: r } = this.last;
    return {
      rating: e,
      state: this.current.state,
      due: o || i,
      stability: this.current.stability,
      difficulty: this.current.difficulty,
      elapsed_days: this.elapsed_days,
      last_elapsed_days: r,
      scheduled_days: this.current.scheduled_days,
      learning_steps: this.current.learning_steps,
      review: this.review_time,
    };
  }
}
class yb {
  constructor(e) {
    Ca(this, "c");
    Ca(this, "s0");
    Ca(this, "s1");
    Ca(this, "s2");
    const o = Rb();
    (this.c = 1),
      (this.s0 = o(" ")),
      (this.s1 = o(" ")),
      (this.s2 = o(" ")),
      e == null && (e = Date.now()),
      (this.s0 -= o(e)),
      this.s0 < 0 && (this.s0 += 1),
      (this.s1 -= o(e)),
      this.s1 < 0 && (this.s1 += 1),
      (this.s2 -= o(e)),
      this.s2 < 0 && (this.s2 += 1);
  }
  next() {
    const e = 2091639 * this.s0 + this.c * 23283064365386963e-26;
    return (this.s0 = this.s1), (this.s1 = this.s2), (this.c = e | 0), (this.s2 = e - this.c), this.s2;
  }
  set state(e) {
    (this.c = e.c), (this.s0 = e.s0), (this.s1 = e.s1), (this.s2 = e.s2);
  }
  get state() {
    return { c: this.c, s0: this.s0, s1: this.s1, s2: this.s2 };
  }
}
function Rb() {
  let a = 4022871197;
  return function (o) {
    o = String(o);
    for (let i = 0; i < o.length; i++) {
      a += o.charCodeAt(i);
      let r = 0.02519603282416938 * a;
      (a = r >>> 0), (r -= a), (r *= a), (a = r >>> 0), (r -= a), (a += r * 4294967296);
    }
    return (a >>> 0) * 23283064365386963e-26;
  };
}
function Ob(a) {
  const e = new yb(a),
    o = () => e.next();
  return (
    (o.int32 = () => (e.next() * 4294967296) | 0),
    (o.double = () => o() + ((o() * 2097152) | 0) * 11102230246251565e-32),
    (o.state = () => e.state),
    (o.importState = (i) => ((e.state = i), o)),
    o
  );
}
const Fb = 0.9,
  Hb = 36500,
  Lb = !1,
  Rt = !0,
  kb = Object.freeze(["1m", "10m"]),
  Bb = Object.freeze(["10m"]),
  Ge = 0.001,
  vr = 100,
  xu = 0.5,
  wb = 0.1542,
  Cu = Object.freeze([
    0.212,
    1.2931,
    2.3065,
    8.2956,
    6.4133,
    0.8334,
    3.0194,
    0.001,
    1.8722,
    0.1666,
    0.796,
    1.4835,
    0.0614,
    0.2629,
    1.6483,
    0.6014,
    1.8729,
    0.5425,
    0.0912,
    0.0658,
    wb,
  ]),
  qu = 2,
  Vb = (a, e = Rt) => [
    [Ge, vr],
    [Ge, vr],
    [Ge, vr],
    [Ge, vr],
    [1, 10],
    [0.001, 4],
    [0.001, 4],
    [0.001, 0.75],
    [0, 4.5],
    [0, 0.8],
    [0.001, 3.5],
    [0.001, 5],
    [0.001, 0.25],
    [0.001, 0.9],
    [0, 4],
    [0, 1],
    [1, 6],
    [0, a],
    [0, a],
    [e ? 0.01 : 0, 0.8],
    [0.1, 0.8],
  ],
  Ii = (a, e, o = Rt) => {
    const i = Vb(qu, o).slice(0, a.length);
    if (Math.max(0, e) > 1) {
      const r = je(a[11] || 0, i[11][0], i[11][1]),
        t = je(a[13] || 0, i[13][0], i[13][1]),
        n = je(a[14] || 0, i[14][0], i[14][1]),
        l = -(Math.log(r) + Math.log(Math.pow(2, t) - 1) + n * 0.3) / e,
        c = je(qe(Math.sqrt(Math.max(l, 0)), 8), 0.01, qu);
      i[17] && (i[17] = [i[17][0], c]), i[18] && (i[18] = [i[18][0], c]);
    }
    return i.map(([r, t], n) => je(a[n] || 0, r, t));
  },
  wc = (a, e = 0, o = Rt) => {
    if (a === void 0) return [...Cu];
    switch (a.length) {
      case 21:
        return Ii(Array.from(a), e, o);
      case 19:
        return console.debug("[FSRS-6]auto fill w from 19 to 21 length"), Ii(Array.from(a), e, o).concat([0, xu]);
      case 17: {
        const i = Ii(Array.from(a), e, o);
        return (
          (i[4] = +(i[5] * 2 + i[4]).toFixed(8)),
          (i[5] = +(Math.log(i[5] * 3 + 1) / 3).toFixed(8)),
          (i[6] = +(i[6] + 0.5).toFixed(8)),
          console.debug("[FSRS-6]auto fill w from 17 to 21 length"),
          i.concat([0, 0, 0, xu])
        );
      }
      default:
        return console.warn("[FSRS]Invalid parameters length, using default parameters"), [...Cu];
    }
  },
  Qb = (a) => {
    var t, n;
    const e = Array.isArray(a == null ? void 0 : a.learning_steps) ? a.learning_steps : kb,
      o = Array.isArray(a == null ? void 0 : a.relearning_steps) ? a.relearning_steps : Bb,
      i = (t = a == null ? void 0 : a.enable_short_term) != null ? t : Rt,
      r = wc(a == null ? void 0 : a.w, o.length, i);
    return {
      request_retention: (a == null ? void 0 : a.request_retention) || Fb,
      maximum_interval: (a == null ? void 0 : a.maximum_interval) || Hb,
      w: r,
      enable_fuzz: (n = a == null ? void 0 : a.enable_fuzz) != null ? n : Lb,
      enable_short_term: i,
      learning_steps: e,
      relearning_steps: o,
    };
  };
function Ls(a, e) {
  return {
    due: a ? Z.time(a) : new Date(),
    stability: 0,
    difficulty: 0,
    elapsed_days: 0,
    scheduled_days: 0,
    reps: 0,
    lapses: 0,
    learning_steps: 0,
    state: Y.New,
    last_review: void 0,
  };
}
const hf = (a) => {
  const e = typeof a == "number" ? -a : -a[20],
    o = Math.exp(Math.pow(e, -1) * Math.log(0.9)) - 1;
  return { decay: e, factor: qe(o, 8) };
};
function Nl(a, e, o) {
  const { decay: i, factor: r } = hf(a);
  return qe(Math.pow(1 + (r * e) / o, i), 8);
}
class _b {
  constructor(e) {
    Ca(this, "param");
    Ca(this, "intervalModifier");
    Ca(this, "_seed");
    Ca(this, "prepare_parameters", (e) => {
      const o = Qb(e);
      return (o.w = Ii(Array.from(o.w), o.relearning_steps.length, o.enable_short_term)), o;
    });
    Ca(this, "forgetting_curve");
    (this.param = new Proxy(this.prepare_parameters(e), this.params_handler_proxy())),
      (this.intervalModifier = this.calculate_interval_modifier(this.param.request_retention)),
      (this.forgetting_curve = Nl.bind(this, this.param.w));
  }
  get interval_modifier() {
    return this.intervalModifier;
  }
  set seed(e) {
    this._seed = e;
  }
  calculate_interval_modifier(e) {
    if (e <= 0 || e > 1) throw new Aa("Requested retention rate should be in the range (0,1]");
    const { decay: o, factor: i } = hf(this.param.w);
    return qe((Math.pow(e, 1 / o) - 1) / i, 8);
  }
  get parameters() {
    return this.param;
  }
  set parameters(e) {
    this.update_parameters(e);
  }
  params_handler_proxy() {
    const e = this;
    return {
      set: function (o, i, r) {
        return (
          i === "request_retention" && Number.isFinite(r)
            ? (e.intervalModifier = e.calculate_interval_modifier(Number(r)))
            : i === "w" &&
              ((r = wc(r, o.relearning_steps.length, o.enable_short_term)),
              (r = Ii(Array.from(r), o.relearning_steps.length, o.enable_short_term)),
              (e.forgetting_curve = Nl.bind(this, r)),
              (e.intervalModifier = e.calculate_interval_modifier(Number(o.request_retention)))),
          Reflect.set(o, i, r),
          !0
        );
      },
    };
  }
  update_parameters(e) {
    const o = this.prepare_parameters(e);
    for (const i in o) {
      const r = i;
      this.param[r] = o[r];
    }
  }
  init_stability(e) {
    return Math.max(this.param.w[e - 1], 0.1);
  }
  init_difficulty(e) {
    const o = this.param.w,
      i = o[4] - Math.exp((e - 1) * o[5]) + 1;
    return qe(i, 8);
  }
  apply_fuzz(e, o) {
    if (!this.param.enable_fuzz || e < 2.5) return Math.round(e);
    const r = Ob(this._seed)(),
      { min_ivl: t, max_ivl: n } = Ib(e, o, this.param.maximum_interval);
    return Math.floor(r * (n - t + 1) + t);
  }
  next_interval(e, o) {
    const i = Math.min(Math.max(1, Math.round(e * this.intervalModifier)), this.param.maximum_interval);
    return this.apply_fuzz(i, o);
  }
  linear_damping(e, o) {
    return qe((e * (10 - o)) / 9, 8);
  }
  next_difficulty(e, o) {
    const i = -this.param.w[6] * (o - 3),
      r = e + this.linear_damping(i, e);
    return je(this.mean_reversion(this.init_difficulty(H.Easy), r), 1, 10);
  }
  mean_reversion(e, o) {
    const i = this.param.w;
    return qe(i[7] * e + (1 - i[7]) * o, 8);
  }
  next_recall_stability(e, o, i, r) {
    const t = this.param.w,
      n = H.Hard === r ? t[15] : 1,
      l = H.Easy === r ? t[16] : 1;
    return qe(je(o * (1 + Math.exp(t[8]) * (11 - e) * Math.pow(o, -t[9]) * (Math.exp((1 - i) * t[10]) - 1) * n * l), Ge, 36500), 8);
  }
  next_forget_stability(e, o, i) {
    const r = this.param.w;
    return qe(je(r[11] * Math.pow(e, -r[12]) * (Math.pow(o + 1, r[13]) - 1) * Math.exp((1 - i) * r[14]), Ge, 36500), 8);
  }
  next_short_term_stability(e, o) {
    const i = this.param.w,
      r = Math.pow(e, -i[19]) * Math.exp(i[17] * (o - 3 + i[18])),
      t = o >= H.Hard ? Math.max(r, 1) : r;
    return qe(je(e * t, Ge, 36500), 8);
  }
  next_state(e, o, i, r) {
    const { difficulty: t, stability: n } = e != null ? e : { difficulty: 0, stability: 0 };
    if (o < 0) throw new Aa(`Invalid delta_t "${o}"`);
    if (i < 0 || i > 4) throw new Aa(`Invalid grade "${i}"`);
    if (t === 0 && n === 0) return { difficulty: je(this.init_difficulty(i), 1, 10), stability: this.init_stability(i) };
    if (i === 0) return { difficulty: t, stability: n };
    if (t < 1 || n < Ge) throw new Aa(`Invalid memory state { difficulty: ${t}, stability: ${n} }`);
    const l = this.param.w;
    r = typeof r == "number" ? r : this.forgetting_curve(o, n);
    let c;
    if (o === 0 && this.param.enable_short_term) c = this.next_short_term_stability(n, i);
    else if (i === 1) {
      const u = this.next_forget_stability(t, n, r);
      let [m, p] = [0, 0];
      this.param.enable_short_term && ((m = l[17]), (p = l[18]));
      const f = n / Math.exp(m * p);
      c = je(qe(f, 8), Ge, u);
    } else c = this.next_recall_stability(t, n, r, i);
    return { difficulty: this.next_difficulty(t, i), stability: c };
  }
}
class Au extends gf {
  constructor(o, i, r, t) {
    super(o, i, r, t);
    Ca(this, "learningStepsStrategy");
    let n = Nb;
    if (this.strategies) {
      const l = this.strategies.get(yt.LEARNING_STEPS);
      l && (n = l);
    }
    this.learningStepsStrategy = n;
  }
  getLearningInfo(o, i) {
    var c, d, u, m;
    const r = this.algorithm.parameters;
    o.learning_steps = o.learning_steps || 0;
    const t = this.learningStepsStrategy(r, o.state, o.learning_steps),
      n = Math.max(0, (d = (c = t[i]) == null ? void 0 : c.scheduled_minutes) != null ? d : 0),
      l = Math.max(0, (m = (u = t[i]) == null ? void 0 : u.next_step) != null ? m : 0);
    return { scheduled_minutes: n, next_steps: l };
  }
  applyLearningSteps(o, i, r) {
    const { scheduled_minutes: t, next_steps: n } = this.getLearningInfo(this.current, i);
    if (t > 0 && t < 1440) (o.learning_steps = n), (o.scheduled_days = 0), (o.state = r), (o.due = Se(this.review_time, Math.round(t), !1));
    else if (((o.state = Y.Review), t >= 1440))
      (o.learning_steps = n), (o.due = Se(this.review_time, Math.round(t), !1)), (o.scheduled_days = Math.floor(t / 1440));
    else {
      o.learning_steps = 0;
      const l = this.algorithm.next_interval(o.stability, this.elapsed_days);
      (o.scheduled_days = l), (o.due = Se(this.review_time, l, !0));
    }
  }
  newState(o) {
    const i = this.next.get(o);
    if (i) return i;
    const r = this.next_ds(this.elapsed_days, o);
    this.applyLearningSteps(r, o, Y.Learning);
    const t = { card: r, log: this.buildLog(o) };
    return this.next.set(o, t), t;
  }
  learningState(o) {
    const i = this.next.get(o);
    if (i) return i;
    const r = this.next_ds(this.elapsed_days, o);
    this.applyLearningSteps(r, o, this.last.state);
    const t = { card: r, log: this.buildLog(o) };
    return this.next.set(o, t), t;
  }
  reviewState(o) {
    const i = this.next.get(o);
    if (i) return i;
    const r = this.elapsed_days,
      t = this.algorithm.forgetting_curve(r, this.current.stability),
      n = this.next_ds(r, H.Again, t),
      l = this.next_ds(r, H.Hard, t),
      c = this.next_ds(r, H.Good, t),
      d = this.next_ds(r, H.Easy, t);
    this.next_interval(l, c, d, r), this.next_state(l, c, d), this.applyLearningSteps(n, H.Again, Y.Relearning), (n.lapses += 1);
    const u = { card: n, log: this.buildLog(H.Again) },
      m = { card: l, log: super.buildLog(H.Hard) },
      p = { card: c, log: super.buildLog(H.Good) },
      f = { card: d, log: super.buildLog(H.Easy) };
    return this.next.set(H.Again, u), this.next.set(H.Hard, m), this.next.set(H.Good, p), this.next.set(H.Easy, f), this.next.get(o);
  }
  next_ds(o, i, r) {
    const t = this.algorithm.next_state({ difficulty: this.current.difficulty, stability: this.current.stability }, o, i, r),
      n = Z.card(this.current);
    return (n.difficulty = t.difficulty), (n.stability = t.stability), n;
  }
  next_interval(o, i, r, t) {
    let n, l;
    (n = this.algorithm.next_interval(o.stability, t)), (l = this.algorithm.next_interval(i.stability, t)), (n = Math.min(n, l)), (l = Math.max(l, n + 1));
    const c = Math.max(this.algorithm.next_interval(r.stability, t), l + 1);
    (o.scheduled_days = n),
      (o.due = Se(this.review_time, n, !0)),
      (i.scheduled_days = l),
      (i.due = Se(this.review_time, l, !0)),
      (r.scheduled_days = c),
      (r.due = Se(this.review_time, c, !0));
  }
  next_state(o, i, r) {
    (o.state = Y.Review), (o.learning_steps = 0), (i.state = Y.Review), (i.learning_steps = 0), (r.state = Y.Review), (r.learning_steps = 0);
  }
}
class Pu extends gf {
  newState(e) {
    const o = this.next.get(e);
    if (o) return o;
    (this.current.scheduled_days = 0), (this.current.elapsed_days = 0);
    const i = 0,
      r = this.next_ds(i, H.Again),
      t = this.next_ds(i, H.Hard),
      n = this.next_ds(i, H.Good),
      l = this.next_ds(i, H.Easy);
    return this.next_interval(r, t, n, l, i), this.next_state(r, t, n, l), this.update_next(r, t, n, l), this.next.get(e);
  }
  next_ds(e, o, i) {
    const r = this.algorithm.next_state({ difficulty: this.current.difficulty, stability: this.current.stability }, e, o, i),
      t = Z.card(this.current);
    return (t.difficulty = r.difficulty), (t.stability = r.stability), t;
  }
  learningState(e) {
    return this.reviewState(e);
  }
  reviewState(e) {
    const o = this.next.get(e);
    if (o) return o;
    const i = this.elapsed_days,
      r = this.algorithm.forgetting_curve(i, this.current.stability),
      t = this.next_ds(i, H.Again, r),
      n = this.next_ds(i, H.Hard, r),
      l = this.next_ds(i, H.Good, r),
      c = this.next_ds(i, H.Easy, r);
    return this.next_interval(t, n, l, c, i), this.next_state(t, n, l, c), (t.lapses += 1), this.update_next(t, n, l, c), this.next.get(e);
  }
  next_interval(e, o, i, r, t) {
    let n, l, c, d;
    (n = this.algorithm.next_interval(e.stability, t)),
      (l = this.algorithm.next_interval(o.stability, t)),
      (c = this.algorithm.next_interval(i.stability, t)),
      (d = this.algorithm.next_interval(r.stability, t)),
      (n = Math.min(n, l)),
      (l = Math.max(l, n + 1)),
      (c = Math.max(c, l + 1)),
      (d = Math.max(d, c + 1)),
      (e.scheduled_days = n),
      (e.due = Se(this.review_time, n, !0)),
      (o.scheduled_days = l),
      (o.due = Se(this.review_time, l, !0)),
      (i.scheduled_days = c),
      (i.due = Se(this.review_time, c, !0)),
      (r.scheduled_days = d),
      (r.due = Se(this.review_time, d, !0));
  }
  next_state(e, o, i, r) {
    (e.state = Y.Review),
      (e.learning_steps = 0),
      (o.state = Y.Review),
      (o.learning_steps = 0),
      (i.state = Y.Review),
      (i.learning_steps = 0),
      (r.state = Y.Review),
      (r.learning_steps = 0);
  }
  update_next(e, o, i, r) {
    const t = { card: e, log: this.buildLog(H.Again) },
      n = { card: o, log: super.buildLog(H.Hard) },
      l = { card: i, log: super.buildLog(H.Good) },
      c = { card: r, log: super.buildLog(H.Easy) };
    this.next.set(H.Again, t), this.next.set(H.Hard, n), this.next.set(H.Good, l), this.next.set(H.Easy, c);
  }
}
class $b {
  constructor(e) {
    Ca(this, "fsrs");
    this.fsrs = e;
  }
  replay(e, o, i) {
    return this.fsrs.next(e, o, i);
  }
  handleManualRating(e, o, i, r, t, n, l) {
    if (typeof o == "undefined") throw new Aa("reschedule: state is required for manual rating");
    let c, d;
    if (o === Y.New)
      (c = {
        rating: H.Manual,
        state: o,
        due: l != null ? l : i,
        stability: e.stability,
        difficulty: e.difficulty,
        elapsed_days: r,
        last_elapsed_days: e.elapsed_days,
        scheduled_days: e.scheduled_days,
        learning_steps: e.learning_steps,
        review: i,
      }),
        (d = Ls(i)),
        (d.last_review = i);
    else {
      if (typeof l == "undefined") throw new Aa("reschedule: due is required for manual rating");
      const u = Ei(l, i, "days");
      (c = {
        rating: H.Manual,
        state: e.state,
        due: e.last_review || e.due,
        stability: e.stability,
        difficulty: e.difficulty,
        elapsed_days: r,
        last_elapsed_days: e.elapsed_days,
        scheduled_days: e.scheduled_days,
        learning_steps: e.learning_steps,
        review: i,
      }),
        (d = {
          ...e,
          state: o,
          due: l,
          last_review: i,
          stability: t || e.stability,
          difficulty: n || e.difficulty,
          elapsed_days: r,
          scheduled_days: u,
          reps: e.reps + 1,
        });
    }
    return { card: d, log: c };
  }
  reschedule(e, o) {
    const i = [];
    let r = Ls(e.due);
    for (const t of o) {
      let n;
      if (((t.review = Z.time(t.review)), t.rating === H.Manual)) {
        let l = 0;
        r.state !== Y.New && r.last_review && (l = Ei(t.review, r.last_review, "days")),
          (n = this.handleManualRating(r, t.state, t.review, l, t.stability, t.difficulty, t.due ? Z.time(t.due) : void 0));
      } else n = this.replay(r, t.review, t.rating);
      i.push(n), (r = n.card);
    }
    return i;
  }
  calculateManualRecord(e, o, i, r) {
    if (!i) return null;
    const { card: t, log: n } = i,
      l = Z.card(e);
    return l.due.getTime() === t.due.getTime()
      ? null
      : ((l.scheduled_days = Ei(t.due, l.due, "days")),
        this.handleManualRating(l, t.state, Z.time(o), n.elapsed_days, r ? t.stability : void 0, r ? t.difficulty : void 0, t.due));
  }
}
function os(a, e) {
  return typeof e == "function" ? e(a) : a;
}
class Gb extends _b {
  constructor(o) {
    super(o);
    Ca(this, "strategyHandler", new Map());
    Ca(this, "Scheduler");
    const { enable_short_term: i } = this.parameters;
    this.Scheduler = i ? Au : Pu;
  }
  params_handler_proxy() {
    const o = this;
    return {
      set: function (i, r, t) {
        return (
          r === "request_retention" && Number.isFinite(t)
            ? (o.intervalModifier = o.calculate_interval_modifier(Number(t)))
            : r === "enable_short_term"
              ? (o.Scheduler = t === !0 ? Au : Pu)
              : r === "w" &&
                ((t = wc(t, i.relearning_steps.length, i.enable_short_term)),
                (t = Ii(Array.from(t), i.relearning_steps.length, i.enable_short_term)),
                (o.forgetting_curve = Nl.bind(this, t)),
                (o.intervalModifier = o.calculate_interval_modifier(Number(i.request_retention)))),
          Reflect.set(i, r, t),
          !0
        );
      },
    };
  }
  useStrategy(o, i) {
    return this.strategyHandler.set(o, i), this;
  }
  clearStrategy(o) {
    return o ? this.strategyHandler.delete(o) : this.strategyHandler.clear(), this;
  }
  getScheduler(o, i) {
    const t = this.strategyHandler.get(yt.SCHEDULER) || this.Scheduler;
    return new t(o, i, this, this.strategyHandler);
  }
  repeat(o, i, r) {
    const n = this.getScheduler(o, i).preview();
    return os(n, r);
  }
  next(o, i, r, t) {
    const n = this.getScheduler(o, i),
      l = Z.rating(r);
    if (l === H.Manual) throw new Aa("Cannot review a manual rating");
    const c = n.review(l);
    return os(c, t);
  }
  get_retrievability(o, i, r = !0) {
    const t = Z.card(o);
    i = i ? Z.time(i) : new Date();
    const n = t.state !== Y.New ? Math.max(Ei(i, t.last_review, "days"), 0) : 0,
      l = t.state !== Y.New ? this.forgetting_curve(n, +t.stability.toFixed(8)) : 0;
    return r ? `${(l * 100).toFixed(2)}%` : l;
  }
  rollback(o, i, r) {
    const t = Z.card(o),
      n = Z.review_log(i);
    if (n.rating === H.Manual) throw new Aa("Cannot rollback a manual rating");
    let l, c, d;
    switch (n.state) {
      case Y.New:
        (l = n.due), (c = void 0), (d = 0);
        break;
      case Y.Learning:
      case Y.Relearning:
      case Y.Review:
        (l = n.review), (c = n.due), (d = t.lapses - (n.rating === H.Again && n.state === Y.Review ? 1 : 0));
        break;
    }
    const u = {
      ...t,
      due: l,
      stability: n.stability,
      difficulty: n.difficulty,
      elapsed_days: n.last_elapsed_days,
      scheduled_days: n.scheduled_days,
      reps: Math.max(0, t.reps - 1),
      lapses: Math.max(0, d),
      learning_steps: n.learning_steps,
      state: n.state,
      last_review: c,
    };
    return os(u, r);
  }
  forget(o, i, r = !1, t) {
    const n = Z.card(o);
    i = Z.time(i);
    const l = n.state === Y.New ? 0 : Ei(i, n.due, "days"),
      c = {
        rating: H.Manual,
        state: n.state,
        due: n.due,
        stability: n.stability,
        difficulty: n.difficulty,
        elapsed_days: 0,
        last_elapsed_days: n.elapsed_days,
        scheduled_days: l,
        learning_steps: n.learning_steps,
        review: i,
      },
      u = {
        card: {
          ...n,
          due: i,
          stability: 0,
          difficulty: 0,
          elapsed_days: 0,
          scheduled_days: 0,
          reps: r ? 0 : n.reps,
          lapses: r ? 0 : n.lapses,
          learning_steps: 0,
          state: Y.New,
          last_review: n.last_review,
        },
        log: c,
      };
    return os(u, t);
  }
  reschedule(o, i = [], r = {}) {
    const { recordLogHandler: t, reviewsOrderBy: n, skipManual: l = !0, now: c = new Date(), update_memory_state: d = !1 } = r;
    n && typeof n == "function" && i.sort(n), l && (i = i.filter((b) => b.rating !== H.Manual));
    const u = new $b(this),
      m = u.reschedule(r.first_card || Ls(), i),
      p = m.length,
      f = Z.card(o),
      h = u.calculateManualRecord(f, c, p ? m[p - 1] : void 0, d);
    return { collections: typeof t == "function" ? m.map(t) : m, reschedule_item: h ? os(h, t) : null };
  }
}
