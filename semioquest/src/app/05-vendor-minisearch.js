// MiniSearch (busca textual) — código de terceiros, descompilado do bundle original.
const ab = "ENTRIES",
  Xp = "KEYS",
  Yp = "VALUES",
  Ma = "";
class pn {
  constructor(e, o) {
    const i = e._tree,
      r = Array.from(i.keys());
    (this.set = e), (this._type = o), (this._path = r.length > 0 ? [{ node: i, keys: r }] : []);
  }
  next() {
    const e = this.dive();
    return this.backtrack(), e;
  }
  dive() {
    if (this._path.length === 0) return { done: !0, value: void 0 };
    const { node: e, keys: o } = ai(this._path);
    if (ai(o) === Ma) return { done: !1, value: this.result() };
    const i = e.get(ai(o));
    return this._path.push({ node: i, keys: Array.from(i.keys()) }), this.dive();
  }
  backtrack() {
    if (this._path.length === 0) return;
    const e = ai(this._path).keys;
    e.pop(), !(e.length > 0) && (this._path.pop(), this.backtrack());
  }
  key() {
    return (
      this.set._prefix +
      this._path
        .map(({ keys: e }) => ai(e))
        .filter((e) => e !== Ma)
        .join("")
    );
  }
  value() {
    return ai(this._path).node.get(Ma);
  }
  result() {
    switch (this._type) {
      case Yp:
        return this.value();
      case Xp:
        return this.key();
      default:
        return [this.key(), this.value()];
    }
  }
  [Symbol.iterator]() {
    return this;
  }
}
const ai = (a) => a[a.length - 1],
  eb = (a, e, o) => {
    const i = new Map();
    if (e === void 0) return i;
    const r = e.length + 1,
      t = r + o,
      n = new Uint8Array(t * r).fill(o + 1);
    for (let l = 0; l < r; ++l) n[l] = l;
    for (let l = 1; l < t; ++l) n[l * r] = l;
    return Zp(a, e, o, i, n, 1, r, ""), i;
  },
  Zp = (a, e, o, i, r, t, n, l) => {
    const c = t * n;
    a: for (const d of a.keys())
      if (d === Ma) {
        const u = r[c - 1];
        u <= o && i.set(l, [a.get(d), u]);
      } else {
        let u = t;
        for (let m = 0; m < d.length; ++m, ++u) {
          const p = d[m],
            f = n * u,
            h = f - n;
          let b = r[f];
          const z = Math.max(0, u - o - 1),
            g = Math.min(n - 1, u + o);
          for (let x = z; x < g; ++x) {
            const v = p !== e[x],
              C = r[h + x] + +v,
              P = r[h + x + 1] + 1,
              E = r[f + x] + 1,
              j = (r[f + x + 1] = Math.min(C, P, E));
            j < b && (b = j);
          }
          if (b > o) continue a;
        }
        Zp(a.get(d), e, o, i, r, u, n, l + d);
      }
  };
class go {
  constructor(e = new Map(), o = "") {
    (this._size = void 0), (this._tree = e), (this._prefix = o);
  }
  atPrefix(e) {
    if (!e.startsWith(this._prefix)) throw new Error("Mismatched prefix");
    const [o, i] = ct(this._tree, e.slice(this._prefix.length));
    if (o === void 0) {
      const [r, t] = Oc(i);
      for (const n of r.keys())
        if (n !== Ma && n.startsWith(t)) {
          const l = new Map();
          return l.set(n.slice(t.length), r.get(n)), new go(l, e);
        }
    }
    return new go(o, e);
  }
  clear() {
    (this._size = void 0), this._tree.clear();
  }
  delete(e) {
    return (this._size = void 0), ob(this._tree, e);
  }
  entries() {
    return new pn(this, ab);
  }
  forEach(e) {
    for (const [o, i] of this) e(o, i, this);
  }
  fuzzyGet(e, o) {
    return eb(this._tree, e, o);
  }
  get(e) {
    const o = Sl(this._tree, e);
    return o !== void 0 ? o.get(Ma) : void 0;
  }
  has(e) {
    const o = Sl(this._tree, e);
    return o !== void 0 && o.has(Ma);
  }
  keys() {
    return new pn(this, Xp);
  }
  set(e, o) {
    if (typeof e != "string") throw new Error("key must be a string");
    return (this._size = void 0), fn(this._tree, e).set(Ma, o), this;
  }
  get size() {
    if (this._size) return this._size;
    this._size = 0;
    const e = this.entries();
    for (; !e.next().done; ) this._size += 1;
    return this._size;
  }
  update(e, o) {
    if (typeof e != "string") throw new Error("key must be a string");
    this._size = void 0;
    const i = fn(this._tree, e);
    return i.set(Ma, o(i.get(Ma))), this;
  }
  fetch(e, o) {
    if (typeof e != "string") throw new Error("key must be a string");
    this._size = void 0;
    const i = fn(this._tree, e);
    let r = i.get(Ma);
    return r === void 0 && i.set(Ma, (r = o())), r;
  }
  values() {
    return new pn(this, Yp);
  }
  [Symbol.iterator]() {
    return this.entries();
  }
  static from(e) {
    const o = new go();
    for (const [i, r] of e) o.set(i, r);
    return o;
  }
  static fromObject(e) {
    return go.from(Object.entries(e));
  }
}
const ct = (a, e, o = []) => {
    if (e.length === 0 || a == null) return [a, o];
    for (const i of a.keys()) if (i !== Ma && e.startsWith(i)) return o.push([a, i]), ct(a.get(i), e.slice(i.length), o);
    return o.push([a, e]), ct(void 0, "", o);
  },
  Sl = (a, e) => {
    if (e.length === 0 || a == null) return a;
    for (const o of a.keys()) if (o !== Ma && e.startsWith(o)) return Sl(a.get(o), e.slice(o.length));
  },
  fn = (a, e) => {
    const o = e.length;
    a: for (let i = 0; a && i < o; ) {
      for (const t of a.keys())
        if (t !== Ma && e[i] === t[0]) {
          const n = Math.min(o - i, t.length);
          let l = 1;
          for (; l < n && e[i + l] === t[l]; ) ++l;
          const c = a.get(t);
          if (l === t.length) a = c;
          else {
            const d = new Map();
            d.set(t.slice(l), c), a.set(e.slice(i, i + l), d), a.delete(t), (a = d);
          }
          i += l;
          continue a;
        }
      const r = new Map();
      return a.set(e.slice(i), r), r;
    }
    return a;
  },
  ob = (a, e) => {
    const [o, i] = ct(a, e);
    if (o !== void 0) {
      if ((o.delete(Ma), o.size === 0)) af(i);
      else if (o.size === 1) {
        const [r, t] = o.entries().next().value;
        ef(i, r, t);
      }
    }
  },
  af = (a) => {
    if (a.length === 0) return;
    const [e, o] = Oc(a);
    if ((e.delete(o), e.size === 0)) af(a.slice(0, -1));
    else if (e.size === 1) {
      const [i, r] = e.entries().next().value;
      i !== Ma && ef(a.slice(0, -1), i, r);
    }
  },
  ef = (a, e, o) => {
    if (a.length === 0) return;
    const [i, r] = Oc(a);
    i.set(r + e, o), i.delete(r);
  },
  Oc = (a) => a[a.length - 1],
  Fc = "or",
  of = "and",
  ib = "and_not";
class Si {
  constructor(e) {
    if ((e == null ? void 0 : e.fields) == null) throw new Error('MiniSearch: option "fields" must be provided');
    const o = e.autoVacuum == null || e.autoVacuum === !0 ? vn : e.autoVacuum;
    (this._options = {
      ...hn,
      ...e,
      autoVacuum: o,
      searchOptions: { ...pu, ...(e.searchOptions || {}) },
      autoSuggestOptions: { ...lb, ...(e.autoSuggestOptions || {}) },
    }),
      (this._index = new go()),
      (this._documentCount = 0),
      (this._documentIds = new Map()),
      (this._idToShortId = new Map()),
      (this._fieldIds = {}),
      (this._fieldLength = new Map()),
      (this._avgFieldLength = []),
      (this._nextId = 0),
      (this._storedFields = new Map()),
      (this._dirtCount = 0),
      (this._currentVacuum = null),
      (this._enqueuedVacuum = null),
      (this._enqueuedVacuumConditions = zl),
      this.addFields(this._options.fields);
  }
  add(e) {
    const { extractField: o, stringifyField: i, tokenize: r, processTerm: t, fields: n, idField: l } = this._options,
      c = o(e, l);
    if (c == null) throw new Error(`MiniSearch: document does not have ID field "${l}"`);
    if (this._idToShortId.has(c)) throw new Error(`MiniSearch: duplicate ID ${c}`);
    const d = this.addDocumentId(c);
    this.saveStoredFields(d, e);
    for (const u of n) {
      const m = o(e, u);
      if (m == null) continue;
      const p = r(i(m, u), u),
        f = this._fieldIds[u],
        h = new Set(p).size;
      this.addFieldLength(d, f, this._documentCount - 1, h);
      for (const b of p) {
        const z = t(b, u);
        if (Array.isArray(z)) for (const g of z) this.addTerm(f, d, g);
        else z && this.addTerm(f, d, z);
      }
    }
  }
  addAll(e) {
    for (const o of e) this.add(o);
  }
  addAllAsync(e, o = {}) {
    const { chunkSize: i = 10 } = o,
      r = { chunk: [], promise: Promise.resolve() },
      { chunk: t, promise: n } = e.reduce(
        ({ chunk: l, promise: c }, d, u) => (
          l.push(d),
          (u + 1) % i === 0 ? { chunk: [], promise: c.then(() => new Promise((m) => setTimeout(m, 0))).then(() => this.addAll(l)) } : { chunk: l, promise: c }
        ),
        r,
      );
    return n.then(() => this.addAll(t));
  }
  remove(e) {
    const { tokenize: o, processTerm: i, extractField: r, stringifyField: t, fields: n, idField: l } = this._options,
      c = r(e, l);
    if (c == null) throw new Error(`MiniSearch: document does not have ID field "${l}"`);
    const d = this._idToShortId.get(c);
    if (d == null) throw new Error(`MiniSearch: cannot remove document with ID ${c}: it is not in the index`);
    for (const u of n) {
      const m = r(e, u);
      if (m == null) continue;
      const p = o(t(m, u), u),
        f = this._fieldIds[u],
        h = new Set(p).size;
      this.removeFieldLength(d, f, this._documentCount, h);
      for (const b of p) {
        const z = i(b, u);
        if (Array.isArray(z)) for (const g of z) this.removeTerm(f, d, g);
        else z && this.removeTerm(f, d, z);
      }
    }
    this._storedFields.delete(d), this._documentIds.delete(d), this._idToShortId.delete(c), this._fieldLength.delete(d), (this._documentCount -= 1);
  }
  removeAll(e) {
    if (e) for (const o of e) this.remove(o);
    else {
      if (arguments.length > 0) throw new Error("Expected documents to be present. Omit the argument to remove all documents.");
      (this._index = new go()),
        (this._documentCount = 0),
        (this._documentIds = new Map()),
        (this._idToShortId = new Map()),
        (this._fieldLength = new Map()),
        (this._avgFieldLength = []),
        (this._storedFields = new Map()),
        (this._nextId = 0);
    }
  }
  discard(e) {
    const o = this._idToShortId.get(e);
    if (o == null) throw new Error(`MiniSearch: cannot discard document with ID ${e}: it is not in the index`);
    this._idToShortId.delete(e),
      this._documentIds.delete(o),
      this._storedFields.delete(o),
      (this._fieldLength.get(o) || []).forEach((i, r) => {
        this.removeFieldLength(o, r, this._documentCount, i);
      }),
      this._fieldLength.delete(o),
      (this._documentCount -= 1),
      (this._dirtCount += 1),
      this.maybeAutoVacuum();
  }
  maybeAutoVacuum() {
    if (this._options.autoVacuum === !1) return;
    const { minDirtFactor: e, minDirtCount: o, batchSize: i, batchWait: r } = this._options.autoVacuum;
    this.conditionalVacuum({ batchSize: i, batchWait: r }, { minDirtCount: o, minDirtFactor: e });
  }
  discardAll(e) {
    const o = this._options.autoVacuum;
    try {
      this._options.autoVacuum = !1;
      for (const i of e) this.discard(i);
    } finally {
      this._options.autoVacuum = o;
    }
    this.maybeAutoVacuum();
  }
  replace(e) {
    const { idField: o, extractField: i } = this._options,
      r = i(e, o);
    this.discard(r), this.add(e);
  }
  vacuum(e = {}) {
    return this.conditionalVacuum(e);
  }
  conditionalVacuum(e, o) {
    return this._currentVacuum
      ? ((this._enqueuedVacuumConditions = this._enqueuedVacuumConditions && o),
        this._enqueuedVacuum != null
          ? this._enqueuedVacuum
          : ((this._enqueuedVacuum = this._currentVacuum.then(() => {
              const i = this._enqueuedVacuumConditions;
              return (this._enqueuedVacuumConditions = zl), this.performVacuuming(e, i);
            })),
            this._enqueuedVacuum))
      : this.vacuumConditionsMet(o) === !1
        ? Promise.resolve()
        : ((this._currentVacuum = this.performVacuuming(e)), this._currentVacuum);
  }
  async performVacuuming(e, o) {
    const i = this._dirtCount;
    if (this.vacuumConditionsMet(o)) {
      const r = e.batchSize || jl.batchSize,
        t = e.batchWait || jl.batchWait;
      let n = 1;
      for (const [l, c] of this._index) {
        for (const [d, u] of c) for (const [m] of u) this._documentIds.has(m) || (u.size <= 1 ? c.delete(d) : u.delete(m));
        this._index.get(l).size === 0 && this._index.delete(l), n % r === 0 && (await new Promise((d) => setTimeout(d, t))), (n += 1);
      }
      this._dirtCount -= i;
    }
    await null, (this._currentVacuum = this._enqueuedVacuum), (this._enqueuedVacuum = null);
  }
  vacuumConditionsMet(e) {
    if (e == null) return !0;
    let { minDirtCount: o, minDirtFactor: i } = e;
    return (o = o || vn.minDirtCount), (i = i || vn.minDirtFactor), this.dirtCount >= o && this.dirtFactor >= i;
  }
  get isVacuuming() {
    return this._currentVacuum != null;
  }
  get dirtCount() {
    return this._dirtCount;
  }
  get dirtFactor() {
    return this._dirtCount / (1 + this._documentCount + this._dirtCount);
  }
  has(e) {
    return this._idToShortId.has(e);
  }
  getStoredFields(e) {
    const o = this._idToShortId.get(e);
    if (o != null) return this._storedFields.get(o);
  }
  search(e, o = {}) {
    const { searchOptions: i } = this._options,
      r = { ...i, ...o },
      t = this.executeQuery(e, o),
      n = [];
    for (const [l, { score: c, terms: d, match: u }] of t) {
      const m = d.length || 1,
        p = { id: this._documentIds.get(l), score: c * m, terms: Object.keys(u), queryTerms: d, match: u };
      Object.assign(p, this._storedFields.get(l)), (r.filter == null || r.filter(p)) && n.push(p);
    }
    return (e === Si.wildcard && r.boostDocument == null) || n.sort(gu), n;
  }
  autoSuggest(e, o = {}) {
    o = { ...this._options.autoSuggestOptions, ...o };
    const i = new Map();
    for (const { score: t, terms: n } of this.search(e, o)) {
      const l = n.join(" "),
        c = i.get(l);
      c != null ? ((c.score += t), (c.count += 1)) : i.set(l, { score: t, terms: n, count: 1 });
    }
    const r = [];
    for (const [t, { score: n, terms: l, count: c }] of i) r.push({ suggestion: t, terms: l, score: n / c });
    return r.sort(gu), r;
  }
  get documentCount() {
    return this._documentCount;
  }
  get termCount() {
    return this._index.size;
  }
  static loadJSON(e, o) {
    if (o == null) throw new Error("MiniSearch: loadJSON should be given the same options used when serializing the index");
    return this.loadJS(JSON.parse(e), o);
  }
  static async loadJSONAsync(e, o) {
    if (o == null) throw new Error("MiniSearch: loadJSON should be given the same options used when serializing the index");
    return this.loadJSAsync(JSON.parse(e), o);
  }
  static getDefault(e) {
    if (hn.hasOwnProperty(e)) return gn(hn, e);
    throw new Error(`MiniSearch: unknown option "${e}"`);
  }
  static loadJS(e, o) {
    const { index: i, documentIds: r, fieldLength: t, storedFields: n, serializationVersion: l } = e,
      c = this.instantiateMiniSearch(e, o);
    (c._documentIds = fr(r)), (c._fieldLength = fr(t)), (c._storedFields = fr(n));
    for (const [d, u] of c._documentIds) c._idToShortId.set(u, d);
    for (const [d, u] of i) {
      const m = new Map();
      for (const p of Object.keys(u)) {
        let f = u[p];
        l === 1 && (f = f.ds), m.set(parseInt(p, 10), fr(f));
      }
      c._index.set(d, m);
    }
    return c;
  }
  static async loadJSAsync(e, o) {
    const { index: i, documentIds: r, fieldLength: t, storedFields: n, serializationVersion: l } = e,
      c = this.instantiateMiniSearch(e, o);
    (c._documentIds = await gr(r)), (c._fieldLength = await gr(t)), (c._storedFields = await gr(n));
    for (const [u, m] of c._documentIds) c._idToShortId.set(m, u);
    let d = 0;
    for (const [u, m] of i) {
      const p = new Map();
      for (const f of Object.keys(m)) {
        let h = m[f];
        l === 1 && (h = h.ds), p.set(parseInt(f, 10), await gr(h));
      }
      ++d % 1e3 === 0 && (await sf(0)), c._index.set(u, p);
    }
    return c;
  }
  static instantiateMiniSearch(e, o) {
    const { documentCount: i, nextId: r, fieldIds: t, averageFieldLength: n, dirtCount: l, serializationVersion: c } = e;
    if (c !== 1 && c !== 2) throw new Error("MiniSearch: cannot deserialize an index created with an incompatible version");
    const d = new Si(o);
    return (
      (d._documentCount = i),
      (d._nextId = r),
      (d._idToShortId = new Map()),
      (d._fieldIds = t),
      (d._avgFieldLength = n),
      (d._dirtCount = l || 0),
      (d._index = new go()),
      d
    );
  }
  executeQuery(e, o = {}) {
    if (e === Si.wildcard) return this.executeWildcardQuery(o);
    if (typeof e != "string") {
      const p = { ...o, ...e, queries: void 0 },
        f = e.queries.map((h) => this.executeQuery(h, p));
      return this.combineResults(f, p.combineWith);
    }
    const { tokenize: i, processTerm: r, searchOptions: t } = this._options,
      n = { tokenize: i, processTerm: r, ...t, ...o },
      { tokenize: l, processTerm: c } = n,
      m = l(e)
        .flatMap((p) => c(p))
        .filter((p) => !!p)
        .map(nb(n))
        .map((p) => this.executeQuerySpec(p, n));
    return this.combineResults(m, n.combineWith);
  }
  executeQuerySpec(e, o) {
    const i = { ...this._options.searchOptions, ...o },
      r = (i.fields || this._options.fields).reduce((b, z) => ({ ...b, [z]: gn(i.boost, z) || 1 }), {}),
      { boostDocument: t, weights: n, maxFuzzy: l, bm25: c } = i,
      { fuzzy: d, prefix: u } = { ...pu.weights, ...n },
      m = this._index.get(e.term),
      p = this.termResults(e.term, e.term, 1, e.termBoost, m, r, t, c);
    let f, h;
    if ((e.prefix && (f = this._index.atPrefix(e.term)), e.fuzzy)) {
      const b = e.fuzzy === !0 ? 0.2 : e.fuzzy,
        z = b < 1 ? Math.min(l, Math.round(e.term.length * b)) : b;
      z && (h = this._index.fuzzyGet(e.term, z));
    }
    if (f)
      for (const [b, z] of f) {
        const g = b.length - e.term.length;
        if (!g) continue;
        h == null || h.delete(b);
        const x = (u * b.length) / (b.length + 0.3 * g);
        this.termResults(e.term, b, x, e.termBoost, z, r, t, c, p);
      }
    if (h)
      for (const b of h.keys()) {
        const [z, g] = h.get(b);
        if (!g) continue;
        const x = (d * b.length) / (b.length + g);
        this.termResults(e.term, b, x, e.termBoost, z, r, t, c, p);
      }
    return p;
  }
  executeWildcardQuery(e) {
    const o = new Map(),
      i = { ...this._options.searchOptions, ...e };
    for (const [r, t] of this._documentIds) {
      const n = i.boostDocument ? i.boostDocument(t, "", this._storedFields.get(r)) : 1;
      o.set(r, { score: n, terms: [], match: {} });
    }
    return o;
  }
  combineResults(e, o = Fc) {
    if (e.length === 0) return new Map();
    const i = o.toLowerCase(),
      r = sb[i];
    if (!r) throw new Error(`Invalid combination operator: ${o}`);
    return e.reduce(r) || new Map();
  }
  toJSON() {
    const e = [];
    for (const [o, i] of this._index) {
      const r = {};
      for (const [t, n] of i) r[t] = Object.fromEntries(n);
      e.push([o, r]);
    }
    return {
      documentCount: this._documentCount,
      nextId: this._nextId,
      documentIds: Object.fromEntries(this._documentIds),
      fieldIds: this._fieldIds,
      fieldLength: Object.fromEntries(this._fieldLength),
      averageFieldLength: this._avgFieldLength,
      storedFields: Object.fromEntries(this._storedFields),
      dirtCount: this._dirtCount,
      index: e,
      serializationVersion: 2,
    };
  }
  termResults(e, o, i, r, t, n, l, c, d = new Map()) {
    if (t == null) return d;
    for (const u of Object.keys(n)) {
      const m = n[u],
        p = this._fieldIds[u],
        f = t.get(p);
      if (f == null) continue;
      let h = f.size;
      const b = this._avgFieldLength[p];
      for (const z of f.keys()) {
        if (!this._documentIds.has(z)) {
          this.removeTerm(p, z, o), (h -= 1);
          continue;
        }
        const g = l ? l(this._documentIds.get(z), o, this._storedFields.get(z)) : 1;
        if (!g) continue;
        const x = f.get(z),
          v = this._fieldLength.get(z)[p],
          C = tb(x, h, this._documentCount, v, b, c),
          P = i * r * m * g * C,
          E = d.get(z);
        if (E) {
          (E.score += P), cb(E.terms, e);
          const j = gn(E.match, o);
          j ? j.push(u) : (E.match[o] = [u]);
        } else d.set(z, { score: P, terms: [e], match: { [o]: [u] } });
      }
    }
    return d;
  }
  addTerm(e, o, i) {
    const r = this._index.fetch(i, hu);
    let t = r.get(e);
    if (t == null) (t = new Map()), t.set(o, 1), r.set(e, t);
    else {
      const n = t.get(o);
      t.set(o, (n || 0) + 1);
    }
  }
  removeTerm(e, o, i) {
    if (!this._index.has(i)) {
      this.warnDocumentChanged(o, e, i);
      return;
    }
    const r = this._index.fetch(i, hu),
      t = r.get(e);
    t == null || t.get(o) == null ? this.warnDocumentChanged(o, e, i) : t.get(o) <= 1 ? (t.size <= 1 ? r.delete(e) : t.delete(o)) : t.set(o, t.get(o) - 1),
      this._index.get(i).size === 0 && this._index.delete(i);
  }
  warnDocumentChanged(e, o, i) {
    for (const r of Object.keys(this._fieldIds))
      if (this._fieldIds[r] === o) {
        this._options.logger(
          "warn",
          `MiniSearch: document with ID ${this._documentIds.get(e)} has changed before removal: term "${i}" was not present in field "${r}". Removing a document after it has changed can corrupt the index!`,
          "version_conflict",
        );
        return;
      }
  }
  addDocumentId(e) {
    const o = this._nextId;
    return this._idToShortId.set(e, o), this._documentIds.set(o, e), (this._documentCount += 1), (this._nextId += 1), o;
  }
  addFields(e) {
    for (let o = 0; o < e.length; o++) this._fieldIds[e[o]] = o;
  }
  addFieldLength(e, o, i, r) {
    let t = this._fieldLength.get(e);
    t == null && this._fieldLength.set(e, (t = [])), (t[o] = r);
    const l = (this._avgFieldLength[o] || 0) * i + r;
    this._avgFieldLength[o] = l / (i + 1);
  }
  removeFieldLength(e, o, i, r) {
    if (i === 1) {
      this._avgFieldLength[o] = 0;
      return;
    }
    const t = this._avgFieldLength[o] * i - r;
    this._avgFieldLength[o] = t / (i - 1);
  }
  saveStoredFields(e, o) {
    const { storeFields: i, extractField: r } = this._options;
    if (i == null || i.length === 0) return;
    let t = this._storedFields.get(e);
    t == null && this._storedFields.set(e, (t = {}));
    for (const n of i) {
      const l = r(o, n);
      l !== void 0 && (t[n] = l);
    }
  }
}
Si.wildcard = Symbol("*");
const gn = (a, e) => (Object.prototype.hasOwnProperty.call(a, e) ? a[e] : void 0),
  sb = {
    [Fc]: (a, e) => {
      for (const o of e.keys()) {
        const i = a.get(o);
        if (i == null) a.set(o, e.get(o));
        else {
          const { score: r, terms: t, match: n } = e.get(o);
          (i.score = i.score + r), (i.match = Object.assign(i.match, n)), fu(i.terms, t);
        }
      }
      return a;
    },
    [of]: (a, e) => {
      const o = new Map();
      for (const i of e.keys()) {
        const r = a.get(i);
        if (r == null) continue;
        const { score: t, terms: n, match: l } = e.get(i);
        fu(r.terms, n), o.set(i, { score: r.score + t, terms: r.terms, match: Object.assign(r.match, l) });
      }
      return o;
    },
    [ib]: (a, e) => {
      for (const o of e.keys()) a.delete(o);
      return a;
    },
  },
  rb = { k: 1.2, b: 0.7, d: 0.5 },
  tb = (a, e, o, i, r, t) => {
    const { k: n, b: l, d: c } = t;
    return Math.log(1 + (o - e + 0.5) / (e + 0.5)) * (c + (a * (n + 1)) / (a + n * (1 - l + (l * i) / r)));
  },
  nb = (a) => (e, o, i) => {
    const r = typeof a.fuzzy == "function" ? a.fuzzy(e, o, i) : a.fuzzy || !1,
      t = typeof a.prefix == "function" ? a.prefix(e, o, i) : a.prefix === !0,
      n = typeof a.boostTerm == "function" ? a.boostTerm(e, o, i) : 1;
    return { term: e, fuzzy: r, prefix: t, termBoost: n };
  },
  hn = {
    idField: "id",
    extractField: (a, e) => a[e],
    stringifyField: (a, e) => a.toString(),
    tokenize: (a) => a.split(db),
    processTerm: (a) => a.toLowerCase(),
    fields: void 0,
    searchOptions: void 0,
    storeFields: [],
    logger: (a, e) => {
      typeof (console == null ? void 0 : console[a]) == "function" && console[a](e);
    },
    autoVacuum: !0,
  },
  pu = { combineWith: Fc, prefix: !1, fuzzy: !1, maxFuzzy: 6, boost: {}, weights: { fuzzy: 0.45, prefix: 0.375 }, bm25: rb },
  lb = { combineWith: of, prefix: (a, e, o) => e === o.length - 1 },
  jl = { batchSize: 1e3, batchWait: 10 },
  zl = { minDirtFactor: 0.1, minDirtCount: 20 },
  vn = { ...jl, ...zl },
  cb = (a, e) => {
    a.includes(e) || a.push(e);
  },
  fu = (a, e) => {
    for (const o of e) a.includes(o) || a.push(o);
  },
  gu = ({ score: a }, { score: e }) => e - a,
  hu = () => new Map(),
  fr = (a) => {
    const e = new Map();
    for (const o of Object.keys(a)) e.set(parseInt(o, 10), a[o]);
    return e;
  },
  gr = async (a) => {
    const e = new Map();
    let o = 0;
    for (const i of Object.keys(a)) e.set(parseInt(i, 10), a[i]), ++o % 1e3 === 0 && (await sf(0));
    return e;
  },
  sf = (a) => new Promise((e) => setTimeout(e, a)),
  db = /[\n\r\p{Z}\p{P}]+/u;
