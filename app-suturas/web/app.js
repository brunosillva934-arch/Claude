/* Suturas · treino de técnica cirúrgica.
   Técnicas (pontos, nós, coordenação e as que você criar), sessões de treino com
   cronômetro e contador, e as estatísticas que saem delas. Tudo fica no aparelho. */
(function () {
  "use strict";
  const A = window.Android || null;          /* ponte do app; no navegador, cai no localStorage */
  const G = window.Graf;
  const $ = (sel, r) => (r || document).querySelector(sel);
  const app = $("#app");
  const camadaFolhas = $("#folhas");

  /* ── armazenamento ──────────────────────────────────────────────── */
  const memoria = !A && (() => { try { localStorage.setItem("su-teste", "1"); localStorage.removeItem("su-teste"); return false; } catch (e) { return true; } })();
  const MEM = {};
  const Arm = {
    ler(k) { try { const v = A ? A.ler(k) : memoria ? MEM[k] : localStorage.getItem("su-" + k); return v ? JSON.parse(v) : null; } catch (e) { return null; } },
    guardar(k, v) { try { const s = JSON.stringify(v); if (A) return !!A.guardar(k, s); if (memoria) { MEM[k] = s; return true; } localStorage.setItem("su-" + k, s); return true; } catch (e) { return false; } },
    apagar(k) { try { if (A) A.apagar(k); else if (memoria) delete MEM[k]; else localStorage.removeItem("su-" + k); } catch (e) { /* nada a fazer */ } }
  };

  /* ── catálogo inicial ───────────────────────────────────────────── */
  const CATS = [
    { id: "sut", nome: "Suturas", uni: "pontos" },
    { id: "no", nome: "Nós", uni: "nós" },
    { id: "coord", nome: "Coordenação", uni: "repetições" },
    { id: "outro", nome: "Outros", uni: "repetições" }
  ];
  const PADRAO = [
    ["ponto-simples", "Ponto simples", "sut"],
    ["ponto-duplo", "Ponto duplo", "sut"],
    ["u-horizontal", "Ponto em U horizontal", "sut"],
    ["u-vertical", "Ponto em U vertical (Donati)", "sut"],
    ["ponto-x", "Ponto em X", "sut"],
    ["chuleio", "Chuleio simples", "sut"],
    ["chuleio-ancorado", "Chuleio ancorado", "sut"],
    ["intradermica", "Sutura intradérmica", "sut"],
    ["no-cirurgiao", "Nó de cirurgião", "no"],
    ["no-duas-maos", "Nó manual a duas mãos", "no"],
    ["no-uma-mao", "Nó manual a uma mão", "no"],
    ["no-instrumental", "Nó instrumental", "no"],
    ["coord-bimanual", "Coordenação bimanual", "coord", "tempo"],
    ["transferencia", "Transferência com pinças", "coord", "cont", "transferências"],
    ["caixa-lap", "Caixa de laparoscopia", "coord", "tempo"]
  ];
  const NOTAS = ["ruim", "fraca", "ok", "boa", "ótima"];

  function novosDados() {
    return {
      v: 1,
      tecnicas: PADRAO.map(([id, nome, cat, medida, uni]) => ({
        id, nome, cat, medida: medida || "cont", uni: medida === "tempo" ? "min" : uni || catDe(cat).uni, meta: null, desc: "", arquivada: false, padrao: true
      })),
      sessoes: [],
      ajustes: { tema: "auto", volume: true, vibrar: true, periodo: "30" }
    };
  }
  function catDe(id) { return CATS.find(c => c.id === id) || CATS[3]; }
  function arrumar(d) {
    if (!d || typeof d !== "object") return novosDados();
    if (!Array.isArray(d.tecnicas)) d.tecnicas = novosDados().tecnicas;
    if (!Array.isArray(d.sessoes)) d.sessoes = [];
    d.ajustes = Object.assign({ tema: "auto", volume: true, vibrar: true, periodo: "30" }, d.ajustes || {});
    d.tecnicas.forEach(t => {
      if (!CATS.some(c => c.id === t.cat)) t.cat = "outro";
      if (t.medida !== "tempo") t.medida = "cont";
      if (t.medida === "tempo") t.uni = "min";
      if (!t.uni) t.uni = catDe(t.cat).uni;
    });
    const ids = new Set(d.tecnicas.map(t => t.id));
    d.sessoes = d.sessoes.filter(s => s && ids.has(s.tec) && isFinite(s.data));
    return d;
  }

  let D = arrumar(Arm.ler("dados"));
  let T = Arm.ler("treino");                   /* treino em andamento, se houver */
  if (T && !D.tecnicas.some(t => t.id === T.tec)) T = null;
  let cacheOrd = null;
  function salvar() {
    cacheOrd = null;
    if (!Arm.guardar("dados", D)) aviso("Não consegui guardar. Salve uma cópia de segurança em Ajustes.");
  }
  function salvarTreino() { if (T) Arm.guardar("treino", T); else Arm.apagar("treino"); }
  if (!Arm.ler("dados")) salvar();

  /* ── utilidades ─────────────────────────────────────────────────── */
  function h(tag, p) {
    const e = document.createElement(tag);
    if (p) for (const k in p) {
      const v = p[k];
      if (v == null || v === false) continue;
      if (k === "class") e.className = v;
      else if (k === "text") e.textContent = v;
      else if (k.startsWith("on") && typeof v === "function") e.addEventListener(k.slice(2), v);
      else if (k === "dataset") Object.assign(e.dataset, v);
      else e.setAttribute(k, v === true ? "" : v);
    }
    for (let i = 2; i < arguments.length; i++) anexar(e, arguments[i]);
    return e;
  }
  function anexar(e, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) { c.forEach(x => anexar(e, x)); return; }
    e.appendChild(c.nodeType ? c : document.createTextNode(String(c)));
  }
  const ICONES = {
    inicio: '<path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z"/>',
    tecnicas: '<path d="M9.5 6.5h10M9.5 12h10M9.5 17.5h10"/><circle cx="5" cy="6.5" r="1.3"/><circle cx="5" cy="12" r="1.3"/><circle cx="5" cy="17.5" r="1.3"/>',
    treinar: '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4.2l2.6 1.8M9.5 2.8h5M12 2.8v3.2"/>',
    historico: '<path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.6"/><path d="M4 4v4.6h4.6"/><path d="M12 7.8V12l3 1.9"/>',
    ajustes: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2.2"/><circle cx="9" cy="17" r="2.2"/>',
    voltar: '<path d="M15 5l-7 7 7 7"/>',
    seta: '<path d="M9.5 5.5 16 12l-6.5 6.5"/>',
    mais: '<path d="M12 5v14M5 12h14"/>',
    lapis: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
    play: '<path d="M8 5.5v13l10.5-6.5z" fill="currentColor" stroke-linejoin="round"/>',
    pausa: '<path d="M8.5 5.5v13M15.5 5.5v13" stroke-width="3"/>',
    desfazer: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
    falha: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
    fechar: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    lixo: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    baixar: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    subir: '<path d="M12 16V5M7 10l5-5 5 5M5 20h14"/>',
    planilha: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 10h16M4 15h16M10 10v10"/>',
    compartilhar: '<circle cx="6.5" cy="12" r="2.4"/><circle cx="17.5" cy="6" r="2.4"/><circle cx="17.5" cy="18" r="2.4"/><path d="M8.7 10.8l6.6-3.6M8.7 13.2l6.6 3.6"/>',
    arquivo: '<rect x="3.5" y="4" width="17" height="4.5" rx="1"/><path d="M5 8.5V19a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8.5M10 12.5h4"/>',
    tema: '<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 0 0 16z" fill="currentColor"/>',
    volume: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
    vibrar: '<rect x="8" y="4" width="8" height="16" rx="2"/><path d="M4.5 8.5v7M19.5 8.5v7"/>',
    baixo: '<path d="M12 5v14M6 13l6 6 6-6"/>',
    cima: '<path d="M12 19V5M6 11l6-6 6 6"/>'
  };
  function ic(nome, tam) {
    const sp = document.createElement("span");
    sp.setAttribute("aria-hidden", "true");
    sp.style.display = "inline-flex";
    const t = tam || 22;
    sp.innerHTML = `<svg width="${t}" height="${t}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONES[nome] || ""}</svg>`;
    return sp;
  }
  const pad = n => String(n).padStart(2, "0");
  const N0 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
  const N1 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
  const num = (v, c) => (c ? N1 : N0).format(v);
  const pct = v => N0.format(Math.abs(v * 100)) + "%";
  const soma = (arr, k) => arr.reduce((a, s) => a + (s[k] || 0), 0);
  const novoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  function dur(seg) {
    seg = Math.round(seg || 0);
    if (seg < 60) return seg + " s";
    const m = Math.floor(seg / 60), s = seg % 60;
    if (m < 60) return m < 10 && s ? `${m} min ${pad(s)} s` : `${m} min`;
    const hh = Math.floor(m / 60), mm = m % 60;
    return mm ? `${hh} h ${pad(mm)} min` : `${hh} h`;
  }
  function relogio(ms) {
    const t = Math.max(0, Math.floor(ms / 1000)), hh = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
    return hh ? `${hh}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  }
  function ritmoTxt(seg) {
    if (seg == null) return "—";
    if (seg < 99.95) return N1.format(seg) + " s";
    let m = Math.floor(seg / 60), s = Math.round(seg % 60);
    if (s === 60) { m++; s = 0; }
    if (m >= 10) return num(seg / 60) + " min";
    return s ? `${m} min ${pad(s)} s` : `${m} min`;
  }
  function singular(u) {
    u = (u || "").trim();
    const fixo = { "pontos": "ponto", "nós": "nó", "nos": "nó", "repetições": "repetição", "transferências": "transferência", "min": "min" };
    if (fixo[u.toLowerCase()]) return fixo[u.toLowerCase()];
    if (/ões$/i.test(u)) return u.replace(/ões$/i, "ão");
    if (/ns$/i.test(u)) return u.replace(/ns$/i, "m");
    if (/[rz]es$/i.test(u)) return u.slice(0, -2);
    if (/s$/i.test(u)) return u.slice(0, -1);
    return u;
  }
  const uniN = (n, t) => (Math.round(n) === 1 ? singular(t.uni) : t.uni);
  const qtdTxt = (n, t) => num(n) + " " + uniN(n, t);

  const DIAS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  const DIAS_LONGOS = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
  const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const MESES_LONGOS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  function meiaNoite(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
  function chave(d) { d = new Date(d); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function segunda(d) { const x = meiaNoite(d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; }
  function diasAtras(d) { return Math.round((meiaNoite(new Date()) - meiaNoite(d)) / 864e5); }
  function diaTxt(d) {
    d = new Date(d);
    const dif = diasAtras(d);
    if (dif === 0) return "Hoje";
    if (dif === 1) return "Ontem";
    return `${DIAS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]}` + (d.getFullYear() !== new Date().getFullYear() ? " de " + d.getFullYear() : "");
  }
  const dataCurta = d => { d = new Date(d); return `${d.getDate()} ${MESES[d.getMonth()]}`; };
  const hora = d => { d = new Date(d); return pad(d.getHours()) + ":" + pad(d.getMinutes()); };
  function quando(d) {
    const dif = diasAtras(d);
    if (dif === 0) return "hoje";
    if (dif === 1) return "ontem";
    if (dif < 7) return "há " + dif + " dias";
    return "em " + dataCurta(d);
  }

  /* ── consultas ──────────────────────────────────────────────────── */
  const tec = id => D.tecnicas.find(t => t.id === id) || null;
  const tecsAtivas = incluir => D.tecnicas.filter(t => !t.arquivada || t.id === incluir);
  function ordenadas() { if (!cacheOrd) cacheOrd = D.sessoes.slice().sort((a, b) => a.data - b.data); return cacheOrd; }
  const daTec = id => ordenadas().filter(s => s.tec === id);
  const ritmoDe = s => (s.qtd > 0 && s.dur > 0 ? s.dur / s.qtd : null);
  const cont = t => t.medida !== "tempo";

  function estat(t, desde) {
    const ss = daTec(t.id).filter(s => s.data >= (desde || 0));
    const e = { ss, n: ss.length, qtd: soma(ss, "qtd"), dur: soma(ss, "dur"), falhas: soma(ss, "falhas") };
    e.cron = ss.filter(s => ritmoDe(s) != null);
    e.ritmo = e.cron.length ? soma(e.cron, "dur") / soma(e.cron, "qtd") : null;
    e.melhor = null;
    e.cron.forEach(s => { const r = ritmoDe(s); if (!e.melhor || r < e.melhor.r) e.melhor = { r, s }; });
    const ult = e.cron.slice(-3);
    e.recente = ult.length ? soma(ult, "dur") / soma(ult, "qtd") : null;
    const aval = ss.filter(s => s.qual);
    e.qualN = aval.length;
    e.qual = aval.length ? soma(aval, "qual") / aval.length : null;
    e.ultima = ss.length ? ss[ss.length - 1] : null;
    e.maior = ss.reduce((m, s) => (!m || (s.dur || 0) > (m.dur || 0) ? s : m), null);
    if (e.cron.length >= 4) {
      const k = Math.min(3, Math.floor(e.cron.length / 2));
      const a = e.cron.slice(0, k), b = e.cron.slice(-k);
      const ra = soma(a, "dur") / soma(a, "qtd"), rb = soma(b, "dur") / soma(b, "qtd");
      e.evol = { antes: ra, depois: rb, pct: (rb - ra) / ra, k };
    }
    return e;
  }
  function daSemana(t) {
    const ini = +segunda(new Date());
    const ss = daTec(t.id).filter(s => s.data >= ini);
    return cont(t) ? soma(ss, "qtd") : soma(ss, "dur") / 60;
  }
  function sequencia() {
    const dias = new Set(ordenadas().map(s => chave(s.data)));
    const d = meiaNoite(new Date());
    if (!dias.has(chave(d))) d.setDate(d.getDate() - 1);
    let n = 0;
    while (dias.has(chave(d))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  function inicioPeriodo(p) {
    if (p === "tudo") return 0;
    const d = meiaNoite(new Date());
    d.setDate(d.getDate() - (+p - 1));
    return +d;
  }
  function ultimaTec() {
    const ss = ordenadas();
    for (let i = ss.length - 1; i >= 0; i--) { const t = tec(ss[i].tec); if (t && !t.arquivada) return t; }
    return null;
  }

  /* ── avisos e folhas ────────────────────────────────────────────── */
  let tAviso = 0;
  function aviso(msg) {
    const a = $("#aviso");
    a.textContent = msg;
    a.classList.add("ver");
    clearTimeout(tAviso);
    tAviso = setTimeout(() => a.classList.remove("ver"), 2800);
  }
  function vibrar(tipo) { if (A && D.ajustes.vibrar) try { A.vibrar(tipo || 0); } catch (e) { /* sem vibração */ } }

  const pilha = [];
  function abrirFolha(o) {
    const veu = h("div", { class: "veu", onclick: () => fecharFolha() });
    const corpo = h("div", { class: "folha-corpo" }, o.corpo);
    const f = h("div", { class: "folha", role: "dialog", "aria-modal": "true", "aria-label": o.titulo },
      h("div", { class: "alca" }),
      h("div", { class: "folha-cab" }, h("h2", { text: o.titulo }), h("button", { class: "icone-bt", "aria-label": "Fechar", onclick: () => fecharFolha() }, ic("fechar"))),
      corpo,
      o.pe ? h("div", { class: "folha-pe" }, o.pe) : null);
    camadaFolhas.append(veu, f);
    f.getBoundingClientRect();
    veu.classList.add("aberto");
    f.classList.add("aberta");
    const reg = { veu, f, corpo, aoFechar: o.aoFechar };
    pilha.push(reg);
    G.esconderDica();
    ajustarTreino();
    return reg;
  }
  function fecharFolha() {
    const r = pilha.pop();
    if (!r) return false;
    r.veu.classList.remove("aberto");
    r.f.classList.remove("aberta");
    setTimeout(() => { r.veu.remove(); r.f.remove(); }, 240);
    G.esconderDica();
    if (r.aoFechar) r.aoFechar();
    ajustarTreino();
    return true;
  }
  function fecharTodas() { while (pilha.length) fecharFolha(); }
  function confirmar(o) {
    return new Promise(res => {
      let feito = false;
      const fim = v => { if (feito) return; feito = true; fecharFolha(); res(v); };
      abrirFolha({
        titulo: o.titulo,
        corpo: h("p", { style: "color:var(--tinta-2)", text: o.texto }),
        pe: [
          h("button", { class: "bt bt-sec", text: o.nao || "Cancelar", onclick: () => fim(false) }),
          o.outro ? h("button", { class: "bt bt-sec", text: o.outro.rotulo, onclick: () => fim(o.outro.valor) }) : null,
          h("button", { class: "bt " + (o.perigo ? "bt-perigo" : "bt-pri"), text: o.sim || "Confirmar", onclick: () => fim(true) })
        ],
        aoFechar: () => { if (!feito) { feito = true; res(false); } }
      });
    });
  }

  /* ── tema ───────────────────────────────────────────────────────── */
  function aplicarTema() {
    const pref = D.ajustes.tema;
    let escuro = pref === "escuro";
    if (pref === "auto") {
      try { escuro = A ? !!A.escuro() : window.matchMedia("(prefers-color-scheme: dark)").matches; } catch (e) { escuro = false; }
    }
    document.documentElement.dataset.theme = escuro ? "dark" : "light";
    if (A) try { A.barras(escuro ? "#0f1413" : "#f3f6f5", !escuro); } catch (e) { /* sem barras */ }
  }
  try { window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { if (D.ajustes.tema === "auto") aplicarTema(); }); } catch (e) { /* navegador antigo */ }

  /* ── estado da tela ─────────────────────────────────────────────── */
  const E = { tela: "inicio", detalhe: null, periodo: D.ajustes.periodo || "30", filtro: "todas", limite: 60, tecTreino: null, alvo: {}, voltaRol: 0 };

  function larguraGraf(extra) {
    return Math.min(window.innerWidth, 640) - 32 - 34 - (extra || 0);
  }
  function render() {
    G.esconderDica();
    let pag;
    if (E.detalhe && tec(E.detalhe)) pag = pagDetalhe(tec(E.detalhe));
    else {
      E.detalhe = null;
      pag = ({ inicio: pagInicio, tecnicas: pagTecnicas, treinar: pagTreinar, historico: pagHistorico, mais: pagMais })[E.tela]();
    }
    app.replaceChildren(pag, barraNav());
    ajustarTreino();
  }
  function irPara(tela) {
    E.tela = tela;
    E.detalhe = null;
    render();
    window.scrollTo(0, 0);
  }
  function abrirDetalhe(id) {
    E.voltaRol = window.scrollY;
    E.detalhe = id;
    fecharTodas();
    render();
    window.scrollTo(0, 0);
  }
  function fecharDetalhe() {
    E.detalhe = null;
    render();
    window.scrollTo(0, E.voltaRol || 0);
  }

  function barraNav() {
    const itens = [["inicio", "Início"], ["tecnicas", "Técnicas"], ["treinar", "Treinar"], ["historico", "Histórico"], ["mais", "Ajustes"]];
    return h("nav", { class: "nav", "aria-label": "Seções" },
      h("div", { class: "nav-in" }, itens.map(([id, nome]) => h("button", {
        class: id === "treinar" ? "nav-treinar" : null,
        "aria-current": E.tela === id ? "page" : null,
        onclick: () => (E.tela === id && !E.detalhe ? window.scrollTo({ top: 0, behavior: "smooth" }) : irPara(id))
      }, h("span", { class: "nav-ic" }, ic(id === "mais" ? "ajustes" : id, id === "treinar" ? 24 : 22)), id === "treinar" && T ? h("span", { class: "vivo", "aria-label": "treino em andamento" }) : null, nome))));
  }

  function cab(titulo, sub, esquerda, direita) {
    return h("header", { class: "cab" }, esquerda, h("div", { class: "cresce" }, h("h1", { text: titulo }), sub ? h("div", { class: "sub", text: sub }) : null), direita);
  }
  function campo(rotulo) {
    const c = h("div", { class: "campo" }, h("div", { class: "rotulo" }, rotulo));
    for (let i = 1; i < arguments.length; i++) anexar(c, arguments[i]);
    return c;
  }
  function bloco(rot, valor, pequeno, det, cat) {
    return h("div", { class: "bloco", dataset: cat ? { cat } : null },
      h("div", { class: "rot" }, cat ? h("i", { class: "ponto-cat" }) : null, rot),
      h("div", { class: "valor" }, valor, pequeno ? h("small", { text: pequeno }) : null),
      det ? h("div", { class: "det", text: det }) : null);
  }
  function secao(titulo, extra) {
    const s = h("section", { class: "secao" }, h("div", { class: "secao-tit" }, h("h2", { text: titulo }), extra ? h("span", { class: "extra" }, extra) : null));
    for (let i = 2; i < arguments.length; i++) anexar(s, arguments[i]);
    return s;
  }
  function seg(opcoes, atual, aoEscolher, rotulo) {
    return h("div", { class: "seg", role: "group", "aria-label": rotulo || null }, opcoes.map(([v, nome]) =>
      h("button", { "aria-pressed": String(v === atual), onclick: () => aoEscolher(v) }, nome)));
  }
  function qualPontos(q) {
    if (!q) return null;
    return h("span", { class: "qual", "aria-label": "qualidade " + q + " de 5" }, [1, 2, 3, 4, 5].map(i => h("i", { class: i <= q ? "on" : null })));
  }
  function deltaRitmo(p) {
    const bom = p < 0;
    if (Math.abs(p) < 0.005) return h("span", { class: "delta" }, "estável");
    return h("span", { class: "delta " + (bom ? "bom" : "ruim") }, ic(bom ? "baixo" : "cima", 15), pct(p) + (bom ? " mais rápido" : " mais lento"));
  }
  function bannerAndamento() {
    if (!T) return null;
    const t = tec(T.tec);
    return h("button", { class: "andamento", onclick: () => irPara("treinar") },
      h("span", { class: "pulso" }),
      h("div", { class: "cresce" }, h("div", { class: "tit", text: "Treino em andamento" }), h("div", { class: "sub", text: t.nome + (cont(t) ? " · " + qtdTxt(T.marcas.length, t) : "") })),
      h("span", { class: "tempo", "data-relogio": "", text: relogio(decorrido()) }));
  }
  function avisoMemoria() {
    return memoria ? h("div", { class: "memoria", text: "Este navegador não deixa guardar nada: o que você registrar aqui some ao fechar a página." }) : null;
  }

  /* ── início ─────────────────────────────────────────────────────── */
  function pagInicio() {
    const hoje = new Date();
    const ss = ordenadas();
    const icone = $('link[rel="icon"]');
    const pag = h("main", { class: "pagina" },
      h("header", { class: "cab" },
        h("div", { class: "marca-app cresce" },
          icone ? h("img", { src: icone.getAttribute("href"), alt: "" }) : null,
          h("div", null, h("h1", { text: "Suturas" }), h("div", { class: "sub", text: DIAS_LONGOS[hoje.getDay()] + ", " + hoje.getDate() + " de " + MESES_LONGOS[hoje.getMonth()] })))),
      avisoMemoria(),
      bannerAndamento());

    if (!ss.length) {
      pag.appendChild(h("div", { class: "cartao" },
        h("div", { class: "vazio" },
          h("div", { class: "tit", text: "Seu caderno de treino começa aqui" }),
          h("p", { text: "Cronometre e conte os pontos enquanto treina, ou registre uma sessão já feita. Cada técnica ganha ritmo, volume, qualidade e evolução." }),
          h("div", { class: "linha-bts", style: "margin-top:16px" },
            h("button", { class: "bt bt-pri", onclick: () => irPara("treinar") }, ic("play", 18), "Treinar agora"),
            h("button", { class: "bt bt-sec", onclick: () => abrirFormSessao(null) }, "Registrar sessão")))));
      pag.appendChild(secao("Técnicas prontas", null,
        h("div", { class: "cartao" }, h("p", { style: "color:var(--tinta-2)", text: tecsAtivas().length + " técnicas já vêm cadastradas: pontos simples, duplos, em U, em X, chuleios, intradérmica, nós manuais e instrumental, e treinos de coordenação. Crie as suas em Técnicas; elas entram em todas as estatísticas." }),
          h("button", { class: "bt bt-fant", style: "margin:10px 0 0 -12px", onclick: () => irPara("tecnicas") }, "Ver técnicas", ic("seta", 18)))));
      return pag;
    }

    /* esta semana: números, metas e o calendário de constância */
    const ini = +segunda(hoje);
    const sem = ss.filter(s => s.data >= ini);
    const diasSem = new Set(sem.map(s => chave(s.data))).size;
    const seqN = sequencia();
    pag.appendChild(secao("Esta semana", "desde segunda, " + dataCurta(ini),
      h("div", { class: "blocos quatro" },
        bloco("Sessões", num(sem.length), null, sem.length ? null : "nenhuma ainda"),
        bloco("Tempo", soma(sem, "dur") ? dur(soma(sem, "dur")) : "—"),
        bloco("Dias treinados", num(diasSem), "de " + ((hoje.getDay() + 6) % 7 + 1)),
        bloco("Sequência", num(seqN), seqN === 1 ? "dia" : "dias", seqN ? "seguidos, até " + (sem.some(s => diasAtras(s.data) === 0) ? "hoje" : "ontem") : "treine hoje para começar"))));
    const comMeta = tecsAtivas().filter(t => t.meta > 0);
    if (comMeta.length) {
      pag.lastChild.appendChild(h("div", { class: "lista", style: "margin-top:12px" }, comMeta.map(t => metaLinha(t))));
    }
    const porDia = {};
    ss.forEach(s => { const k = chave(s.data); const o = porDia[k] || (porDia[k] = { n: 0, min: 0 }); o.n++; o.min += (s.dur || 0) / 60; });
    const sem18 = new Set(ss.filter(s => diasAtras(s.data) < 18 * 7).map(s => chave(s.data))).size;
    pag.appendChild(h("div", { class: "cartao", style: "margin-top:12px" },
      h("div", { class: "cartao-tit", text: "Constância" }),
      h("div", { class: "cartao-sub", text: sem18 + (sem18 === 1 ? " dia treinado" : " dias treinados") + " nas últimas 18 semanas" }),
      G.calor({
        largura: larguraGraf(), semanas: 18, hoje, chave, dia: k => porDia[k],
        nomeDia: d => diaTxt(d), nomeMes: d => MESES[d.getMonth()], formatoMin: m => dur(m * 60)
      })));

    /* resumo do período: tudo abaixo do filtro respeita o filtro */
    const desde = inicioPeriodo(E.periodo);
    const ps = ss.filter(s => s.data >= desde);
    const resumo = secao("Resumo", null,
      seg([["7", "7 dias"], ["30", "30 dias"], ["90", "90 dias"], ["tudo", "Tudo"]], E.periodo, v => { E.periodo = v; D.ajustes.periodo = v; salvar(); render(); }, "Período"));
    pag.appendChild(resumo);
    if (!ps.length) {
      resumo.appendChild(h("div", { class: "cartao", style: "margin-top:12px" }, h("div", { class: "vazio" }, h("div", { class: "tit", text: "Nenhum treino neste período" }), h("p", { text: "Escolha um período maior ou registre uma sessão." }))));
      return pag;
    }
    const durP = soma(ps, "dur");
    const diasP = new Set(ps.map(s => chave(s.data))).size;
    resumo.appendChild(h("div", { class: "cartao", style: "margin-top:12px" },
      durP > 0
        ? h("div", { class: "heroi" }, h("span", { class: "rot", text: "Tempo de treino" }), h("span", { class: "valor" }, heroiDur(durP)), h("span", { class: "det", text: `em ${num(ps.length)} ${ps.length === 1 ? "sessão" : "sessões"} · ${diasP} ${diasP === 1 ? "dia" : "dias"} de treino` }))
        : h("div", { class: "heroi" }, h("span", { class: "rot", text: "Sessões de treino" }), h("span", { class: "valor", text: num(ps.length) }), h("span", { class: "det", text: `${diasP} ${diasP === 1 ? "dia" : "dias"} de treino · sem tempo registrado` }))));

    /* volume por categoria, somando por unidade (pontos com pontos, nós com nós) */
    const blocos = [];
    CATS.forEach(c => {
      const sc = ps.filter(s => { const t = tec(s.tec); return t && t.cat === c.id; });
      if (!sc.length) return;
      const porUni = {};
      sc.forEach(s => {
        const t = tec(s.tec);
        const u = cont(t) ? t.uni : "min";
        porUni[u] = (porUni[u] || 0) + (cont(t) ? s.qtd || 0 : (s.dur || 0) / 60);
      });
      const unis = Object.keys(porUni).sort((a, b) => porUni[b] - porUni[a]);
      const princ = unis[0];
      const outros = unis.slice(1).map(u => num(porUni[u]) + " " + u);
      const nt = new Set(sc.map(s => s.tec)).size;
      blocos.push(bloco(c.nome, num(porUni[princ]), princ === "min" ? "min" : (Math.round(porUni[princ]) === 1 ? singular(princ) : princ),
        outros.length ? outros.join(" · ") : `${sc.length} ${sc.length === 1 ? "sessão" : "sessões"} · ${nt} ${nt === 1 ? "técnica" : "técnicas"}`, c.id));
    });
    resumo.appendChild(h("div", { class: "blocos", style: "margin-top:12px" }, blocos));

    /* tempo por dia, semana ou mês, empilhado por categoria */
    const bs = baldes(E.periodo, desde);
    const presentes = CATS.filter(c => ps.some(s => tec(s.tec).cat === c.id && s.dur > 0));
    const grupos = bs.map(b => {
      const dentro = ps.filter(s => s.data >= b.ini && s.data < b.fim);
      const partes = presentes.map(c => ({ cat: c.id, valor: soma(dentro.filter(s => tec(s.tec).cat === c.id), "dur") / 60 }));
      const tot = soma(partes, "valor");
      return {
        rotulo: b.rotulo, partes,
        dica: { tit: b.tit, linhas: tot > 0 ? partes.filter(p => p.valor > 0).map(p => ({ cat: p.cat, valor: dur(p.valor * 60), nome: catDe(p.cat).nome })).concat(partes.filter(p => p.valor > 0).length > 1 ? [{ valor: dur(tot * 60), nome: "no total" }] : []) : [{ valor: "sem treino cronometrado" }] },
        linha: [b.tit].concat(presentes.map((c, i) => num(partes[i].valor, 1)), [num(tot, 1)])
      };
    });
    const cartaoTempo = h("div", { class: "cartao", style: "margin-top:12px" },
      h("div", { class: "cartao-tit", text: "Tempo de treino por " + (bs.unidade) }),
      h("div", { class: "cartao-sub", text: "minutos, por categoria" }));
    if (presentes.length) {
      cartaoTempo.appendChild(G.barras({
        largura: larguraGraf(), altura: 180, grupos, formatoEixo: v => num(v),
        rotuloAcessivel: "Minutos de treino por " + bs.unidade,
        legenda: presentes.map(c => ({ cat: c.id, nome: c.nome })),
        tabela: { cab: [bs.unidade[0].toUpperCase() + bs.unidade.slice(1)].concat(presentes.map(c => c.nome + " (min)"), ["Total (min)"]), linhas: grupos.map(g => g.linha) }
      }));
    } else {
      cartaoTempo.appendChild(h("p", { class: "nota-graf", text: "Nenhuma sessão deste período tem tempo registrado. Use o cronômetro em Treinar ou preencha o tempo ao registrar." }));
    }
    resumo.appendChild(cartaoTempo);

    /* por técnica */
    const tecsP = [...new Set(ps.map(s => s.tec))].map(tec).filter(Boolean)
      .map(t => ({ t, e: estat(t, desde) })).sort((a, b) => b.e.n - a.e.n || b.e.dur - a.e.dur);
    pag.appendChild(secao("Por técnica", tecsP.length + (tecsP.length === 1 ? " técnica" : " técnicas"),
      h("div", { class: "lista" }, tecsP.map(({ t, e }) => linhaTec(t, e)))));

    /* evolução do ritmo dentro do período */
    const evol = tecsP.filter(x => x.e.evol).sort((a, b) => a.e.evol.pct - b.e.evol.pct);
    if (evol.length) {
      pag.appendChild(secao("Evolução do ritmo", "primeiras × últimas sessões",
        h("div", { class: "lista" }, evol.map(({ t, e }) => h("button", { class: "item", dataset: { cat: t.cat }, onclick: () => abrirDetalhe(t.id) },
          h("i", { class: "ponto-cat" }),
          h("div", { class: "cresce" }, h("div", { class: "tit", text: t.nome }),
            h("div", { class: "sub", text: `${ritmoTxt(e.evol.antes)} → ${ritmoTxt(e.evol.depois)} por ${singular(t.uni)} · ${e.evol.k} primeiras × ${e.evol.k} últimas` })),
          h("div", { class: "lado" }, deltaRitmo(e.evol.pct)))))));
    }
    return pag;
  }
  function heroiDur(seg) {
    seg = Math.round(seg);
    const m = Math.round(seg / 60);
    if (seg < 60) return [num(seg), h("small", { text: "s" })];
    if (m < 60) return [num(m), h("small", { text: "min" })];
    const hh = Math.floor(m / 60), mm = m % 60;
    return [num(hh), h("small", { text: "h" }), mm ? [" " + pad(mm), h("small", { text: "min" })] : null];
  }
  function baldes(per, desde) {
    const hoje = meiaNoite(new Date());
    let lista;
    if (per === "7" || per === "30") {
      const n = +per;
      lista = Array.from({ length: n }, (_, i) => {
        const d = new Date(hoje); d.setDate(d.getDate() - (n - 1 - i));
        const f = new Date(d); f.setDate(f.getDate() + 1);
        return { ini: +d, fim: +f, rotulo: per === "7" ? DIAS[d.getDay()] : String(d.getDate()), tit: diaTxt(d) };
      });
      lista.unidade = "dia";
      return lista;
    }
    let semanas = 13;
    const prim = ordenadas()[0];
    if (per === "tudo") semanas = prim ? Math.round((+segunda(new Date()) - +segunda(prim.data)) / (7 * 864e5)) + 1 : 8;
    if (semanas <= 26) {
      semanas = Math.max(semanas, 6);
      const s0 = segunda(new Date());
      lista = Array.from({ length: semanas }, (_, i) => {
        const d = new Date(s0); d.setDate(d.getDate() - 7 * (semanas - 1 - i));
        const f = new Date(d); f.setDate(f.getDate() + 7);
        return { ini: Math.max(+d, desde), fim: +f, rotulo: dataCurta(d), tit: "Semana de " + dataCurta(d) };
      });
      lista.unidade = "semana";
      return lista;
    }
    const p = new Date(prim.data), m0 = new Date(p.getFullYear(), p.getMonth(), 1), ag = new Date();
    const n = (ag.getFullYear() - m0.getFullYear()) * 12 + ag.getMonth() - m0.getMonth() + 1;
    lista = Array.from({ length: n }, (_, i) => {
      const d = new Date(m0.getFullYear(), m0.getMonth() + i, 1), f = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      return { ini: +d, fim: +f, rotulo: MESES[d.getMonth()] + (d.getMonth() === 0 ? "/" + String(d.getFullYear()).slice(2) : ""), tit: MESES_LONGOS[d.getMonth()] + " de " + d.getFullYear() };
    });
    lista.unidade = "mês";
    return lista;
  }
  function metaLinha(t) {
    const feito = daSemana(t);
    const fr = Math.min(1, feito / t.meta);
    const uni = cont(t) ? t.uni : "min";
    return h("button", { class: "meta", style: "text-align:left;width:100%", dataset: { cat: t.cat }, onclick: () => abrirDetalhe(t.id) },
      h("div", { class: "meta-top" }, h("i", { class: "ponto-cat" }), h("span", { class: "nome", text: t.nome }),
        h("span", { class: "quanto" }, fr >= 1 ? ic("check", 15) : null, `${num(feito)} de ${num(t.meta)} ${uni}`)),
      h("div", { class: "trilho", role: "meter", "aria-valuemin": "0", "aria-valuemax": String(t.meta), "aria-valuenow": String(Math.round(feito)), "aria-label": "Meta semanal de " + t.nome },
        h("i", { class: feito > 0 ? null : "zero", style: `width:${(fr * 100).toFixed(1)}%` })));
  }
  function linhaTec(t, e) {
    const sub = e.n
      ? (cont(t) ? qtdTxt(e.qtd, t) + " · " : (e.dur ? dur(e.dur) + " · " : "")) + e.n + (e.n === 1 ? " sessão" : " sessões") + " · " + quando(e.ultima.data)
      : "ainda sem treino";
    let lado = null;
    if (cont(t) && e.ritmo != null) lado = h("div", { class: "lado" }, h("b", { text: ritmoTxt(e.recente) }), "por " + singular(t.uni));
    else if (!cont(t) && e.n) lado = h("div", { class: "lado" }, h("b", { text: dur(e.dur / e.n) }), "por sessão");
    return h("div", { class: "item", dataset: { cat: t.cat }, style: "padding:0;gap:0" },
      h("button", { class: "item cresce", style: "border:0", onclick: () => abrirDetalhe(t.id) },
        h("i", { class: "ponto-cat" }),
        h("div", { class: "cresce" }, h("div", { class: "tit", text: t.nome }), h("div", { class: "sub", text: sub })),
        lado),
      h("button", { class: "item-play", style: "margin-right:12px", "aria-label": "Treinar " + t.nome, onclick: () => comecarCom(t.id) }, ic("play", 16)));
  }

  /* ── técnicas ───────────────────────────────────────────────────── */
  function pagTecnicas() {
    const ativas = D.tecnicas.filter(t => !t.arquivada);
    const arq = D.tecnicas.filter(t => t.arquivada);
    const pag = h("main", { class: "pagina" },
      cab("Técnicas", ativas.length + " técnicas · toque para ver a evolução", null,
        h("button", { class: "bt bt-sec", onclick: () => abrirFormTecnica(null) }, ic("mais", 18), "Nova")),
      avisoMemoria());
    CATS.forEach(c => {
      const ts = ativas.filter(t => t.cat === c.id);
      if (!ts.length) return;
      pag.appendChild(h("div", { class: "grupo-tit", dataset: { cat: c.id } }, h("i", { class: "ponto-cat" }), c.nome));
      pag.appendChild(h("div", { class: "lista" }, ts.map(t => linhaTec(t, estat(t)))));
    });
    if (!ativas.length) pag.appendChild(h("div", { class: "cartao" }, h("div", { class: "vazio" }, h("div", { class: "tit", text: "Nenhuma técnica ativa" }), h("p", { text: "Crie uma técnica ou reative uma arquivada." }))));
    pag.appendChild(h("button", { class: "bt bt-fant bt-largo", style: "margin-top:16px", onclick: () => abrirFormTecnica(null) }, ic("mais", 18), "Criar técnica"));
    if (arq.length) {
      const det = h("details", { style: "margin-top:18px" }, h("summary", { class: "grupo-tit", style: "cursor:pointer;list-style:none" }, ic("arquivo", 16), "Arquivadas (" + arq.length + ")"));
      det.appendChild(h("div", { class: "lista" }, arq.map(t => linhaTec(t, estat(t)))));
      pag.appendChild(det);
    }
    return pag;
  }

  function pagDetalhe(t) {
    const e = estat(t);
    const c = cont(t);
    const pag = h("main", { class: "pagina", dataset: { cat: t.cat } },
      cab(t.nome, catDe(t.cat).nome + " · " + (c ? "conta " + t.uni : "conta tempo") + (t.arquivada ? " · arquivada" : ""),
        h("button", { class: "voltar", "aria-label": "Voltar", onclick: fecharDetalhe }, ic("voltar")),
        h("button", { class: "icone-bt", "aria-label": "Editar técnica", onclick: () => abrirFormTecnica(t) }, ic("lapis"))),
      h("div", { class: "linha-bts" },
        h("button", { class: "bt bt-pri", onclick: () => comecarCom(t.id) }, ic("play", 18), "Treinar agora"),
        h("button", { class: "bt bt-sec", onclick: () => abrirFormSessao(null, t.id) }, ic("mais", 18), "Registrar")));
    if (t.desc) pag.appendChild(h("p", { style: "margin-top:12px;color:var(--tinta-2);font-size:.92rem;white-space:pre-wrap", text: t.desc }));

    if (!e.n) {
      pag.appendChild(h("div", { class: "cartao", style: "margin-top:16px" }, h("div", { class: "vazio" },
        h("div", { class: "tit", text: "Nenhuma sessão ainda" }),
        h("p", { text: c ? "Treine com o contador para ver ritmo por " + singular(t.uni) + ", volume e qualidade." : "Treine com o cronômetro para ver tempo por sessão e por semana." }))));
      if (t.meta > 0) pag.appendChild(h("div", { class: "lista", style: "margin-top:12px" }, metaLinha(t)));
      return pag;
    }

    /* números da técnica */
    const fal = e.qtd ? e.falhas / e.qtd : 0;
    const blocos = c ? [
      bloco("Total", num(e.qtd), uniN(e.qtd, t), e.falhas ? `${num(e.falhas)} ${e.falhas === 1 ? "falha" : "falhas"} (${num(fal * 100, 1)}%)` : "nenhuma falha anotada"),
      bloco("Sessões", num(e.n), null, "última " + quando(e.ultima.data)),
      bloco("Ritmo recente", ritmoTxt(e.recente), null, e.recente == null ? "sem tempo registrado" : "por " + singular(t.uni) + (e.cron.length >= 3 ? " · 3 últimas" : e.cron.length === 2 ? " · 2 últimas" : " · 1 sessão")),
      bloco("Melhor ritmo", e.melhor ? ritmoTxt(e.melhor.r) : "—", null, e.melhor ? "por " + singular(t.uni) + ", " + diaTxt(e.melhor.s.data).toLowerCase() : null),
      bloco("Tempo total", e.dur ? dur(e.dur) : "—", null, e.cron.length < e.n ? e.cron.length + " de " + e.n + " cronometradas" : null),
      bloco("Qualidade", e.qual != null ? num(e.qual, 1) : "—", e.qual != null ? "de 5" : null, e.qualN ? e.qualN + (e.qualN === 1 ? " sessão avaliada" : " sessões avaliadas") : "avalie ao salvar")
    ] : [
      bloco("Tempo total", dur(e.dur)),
      bloco("Sessões", num(e.n), null, "última " + quando(e.ultima.data)),
      bloco("Média por sessão", dur(e.dur / e.n)),
      bloco("Maior sessão", e.maior ? dur(e.maior.dur) : "—", null, e.maior ? diaTxt(e.maior.data) : null),
      bloco("Esta semana", dur(daSemana(t) * 60)),
      bloco("Qualidade", e.qual != null ? num(e.qual, 1) : "—", e.qual != null ? "de 5" : null, e.qualN ? e.qualN + (e.qualN === 1 ? " sessão avaliada" : " sessões avaliadas") : "avalie ao salvar")
    ];
    pag.appendChild(h("div", { class: "blocos tres", style: "margin-top:16px" }, blocos));

    if (e.evol) {
      const bom = e.evol.pct < 0;
      pag.appendChild(h("div", { class: "cartao", style: "margin-top:12px" },
        h("div", { style: "display:flex;align-items:center;gap:10px" },
          h("div", { class: "cresce" },
            h("div", { class: "cartao-tit", text: "Evolução" }),
            h("div", { class: "cartao-sub", text: `de ${ritmoTxt(e.evol.antes)} para ${ritmoTxt(e.evol.depois)} por ${singular(t.uni)}, comparando as ${e.evol.k} primeiras com as ${e.evol.k} últimas sessões cronometradas` })),
          deltaRitmo(e.evol.pct)),
        bom ? null : h("p", { class: "nota-graf", text: "Ritmo mais lento nem sempre é ruim: veja se a qualidade subiu junto." })));
    }
    if (t.meta > 0) pag.appendChild(h("div", { class: "lista", style: "margin-top:12px" }, metaLinha(t)));

    /* gráficos */
    const W = larguraGraf();
    if (c) {
      const cartao = h("div", { class: "cartao", style: "margin-top:12px" },
        h("div", { class: "cartao-tit", text: "Ritmo por sessão" }),
        h("div", { class: "cartao-sub", text: "segundos por " + singular(t.uni) + " · menor é melhor" }));
      if (e.cron.length >= 2) {
        const emMin = Math.max(...e.cron.map(ritmoDe)) >= 300;   /* técnica lenta: eixo em minutos */
        if (emMin) cartao.lastChild.textContent = "minutos por " + singular(t.uni) + " · menor é melhor";
        const rs = e.cron.map(s => ritmoDe(s) / (emMin ? 60 : 1));
        const rtx = v => ritmoTxt(v * (emMin ? 60 : 1));
        const media = e.cron.length >= 3 ? e.cron.map((s, i) => { if (i < 2) return null; const j = e.cron.slice(i - 2, i + 1); return soma(j, "dur") / soma(j, "qtd") / (emMin ? 60 : 1); }) : null;
        const iMelhor = rs.indexOf(Math.min(...rs));
        cartao.appendChild(G.linha({
          largura: W, cat: t.cat, rotuloAcessivel: "Ritmo por sessão de " + t.nome,
          pontos: e.cron.map((s, i) => ({
            y: rs[i], rotulo: dataCurta(s.data),
            dica: { tit: diaTxt(s.data) + " · " + hora(s.data), linhas: [
              { cat: t.cat, valor: rtx(rs[i]), nome: "por " + singular(t.uni) },
              media && media[i] != null ? { valor: rtx(media[i]), nome: "média das 3 últimas" } : null,
              { valor: qtdTxt(s.qtd, t), nome: "em " + relogio(s.dur * 1000) }
            ].filter(Boolean) }
          })),
          media, formatoEixo: v => num(v),
          destaque: { indice: iMelhor, texto: "melhor " + rtx(rs[iMelhor]) },
          legenda: media ? [{ tipo: "bo", cat: t.cat, nome: "cada sessão" }, { tipo: "tr", cat: t.cat, nome: "média das 3 últimas" }] : null,
          tabela: { cab: ["Sessão", (emMin ? "min/" : "s/") + singular(t.uni), t.uni, "Tempo"], linhas: e.cron.slice().reverse().map(s => [diaTxt(s.data) + " " + hora(s.data), num(ritmoDe(s) / (emMin ? 60 : 1), 1), num(s.qtd), relogio(s.dur * 1000)]) }
        }));
      } else {
        cartao.appendChild(h("p", { class: "nota-graf", text: "Cronometre pelo menos 2 sessões para ver a curva do ritmo." }));
      }
      pag.appendChild(cartao);
    } else if (e.n >= 1) {
      const ult = e.ss.slice(-24);
      pag.appendChild(h("div", { class: "cartao", style: "margin-top:12px" },
        h("div", { class: "cartao-tit", text: "Minutos por sessão" }),
        h("div", { class: "cartao-sub", text: ult.length < e.n ? "últimas " + ult.length + " sessões" : "todas as sessões" }),
        G.barras({
          largura: W, rotuloAcessivel: "Minutos por sessão de " + t.nome,
          grupos: ult.map(s => ({ rotulo: dataCurta(s.data), partes: [{ cat: t.cat, valor: (s.dur || 0) / 60 }], dica: { tit: diaTxt(s.data) + " · " + hora(s.data), linhas: [{ cat: t.cat, valor: dur(s.dur) }] } })),
          formatoEixo: v => num(v), rotularUltimo: true, formato: v => num(v, 1) + " min",
          tabela: { cab: ["Sessão", "Minutos"], linhas: ult.slice().reverse().map(s => [diaTxt(s.data) + " " + hora(s.data), num((s.dur || 0) / 60, 1)]) }
        })));
    }

    /* volume por semana */
    const semanas = [];
    const s0 = segunda(new Date());
    for (let i = 11; i >= 0; i--) {
      const ini = new Date(s0); ini.setDate(ini.getDate() - 7 * i);
      const fim = new Date(ini); fim.setDate(fim.getDate() + 7);
      const ss = e.ss.filter(s => s.data >= +ini && s.data < +fim);
      semanas.push({ ini, ss, v: c ? soma(ss, "qtd") : soma(ss, "dur") / 60 });
    }
    const uniV = c ? t.uni : "min";
    pag.appendChild(h("div", { class: "cartao", style: "margin-top:12px" },
      h("div", { class: "cartao-tit", text: "Volume por semana" }),
      h("div", { class: "cartao-sub", text: (c ? t.uni : "minutos") + " · últimas 12 semanas" + (t.meta > 0 ? " · linha da meta" : "") }),
      G.barras({
        largura: W, rotuloAcessivel: "Volume semanal de " + t.nome,
        grupos: semanas.map(w => ({ rotulo: dataCurta(w.ini), partes: [{ cat: t.cat, valor: w.v }], dica: { tit: "Semana de " + dataCurta(w.ini), linhas: [{ cat: t.cat, valor: c ? qtdTxt(w.v, t) : dur(w.v * 60), nome: w.ss.length + (w.ss.length === 1 ? " sessão" : " sessões") }] } })),
        formatoEixo: v => num(v), rotularUltimo: true, formato: v => num(v),
        referencia: t.meta > 0 ? { valor: t.meta, rotulo: "meta " + num(t.meta) } : null,
        tabela: { cab: ["Semana", c ? t.uni : "Minutos", "Sessões"], linhas: semanas.slice().reverse().map(w => [dataCurta(w.ini), num(w.v, c ? 0 : 1), String(w.ss.length)]) }
      })));

    /* qualidade */
    const aval = e.ss.filter(s => s.qual);
    if (aval.length >= 2) {
      const media = aval.length >= 3 ? aval.map((s, i) => (i < 2 ? null : (aval[i - 2].qual + aval[i - 1].qual + s.qual) / 3)) : null;
      pag.appendChild(h("div", { class: "cartao", style: "margin-top:12px" },
        h("div", { class: "cartao-tit", text: "Qualidade" }),
        h("div", { class: "cartao-sub", text: "sua nota de 1 a 5 em cada sessão" }),
        G.linha({
          largura: W, altura: 160, cat: t.cat, rotuloAcessivel: "Qualidade por sessão de " + t.nome,
          pontos: aval.map((s, i) => ({ y: s.qual, rotulo: dataCurta(s.data), dica: { tit: diaTxt(s.data) + " · " + hora(s.data), linhas: [{ cat: t.cat, valor: s.qual + " de 5", nome: NOTAS[s.qual - 1] }, media && media[i] != null ? { valor: num(media[i], 1), nome: "média das 3 últimas" } : null].filter(Boolean) } })),
          media, formatoEixo: v => num(v),
          legenda: media ? [{ tipo: "bo", cat: t.cat, nome: "cada sessão" }, { tipo: "tr", cat: t.cat, nome: "média das 3 últimas" }] : null,
          tabela: { cab: ["Sessão", "Nota"], linhas: aval.slice().reverse().map(s => [diaTxt(s.data) + " " + hora(s.data), String(s.qual)]) }
        })));
    }

    /* sessões */
    pag.appendChild(secao("Sessões", e.n + (e.n === 1 ? " registrada" : " registradas"),
      h("div", { class: "lista" }, e.ss.slice().reverse().slice(0, 40).map(s => linhaSessao(s, false)))));
    if (e.n > 40) pag.appendChild(h("button", { class: "bt bt-fant bt-largo", style: "margin-top:8px", onclick: () => { E.filtro = "tec:" + t.id; irPara("historico"); } }, "Ver todas no histórico"));
    return pag;
  }

  function resumoSessao(s, t) {
    const partes = [];
    if (cont(t) && s.qtd) partes.push(qtdTxt(s.qtd, t));
    if (s.dur) partes.push(relogio(s.dur * 1000));
    const r = ritmoDe(s);
    if (cont(t) && r != null) partes.push(ritmoTxt(r) + "/" + singular(t.uni));
    if (s.falhas) partes.push(s.falhas + (s.falhas === 1 ? " falha" : " falhas"));
    return partes.join(" · ");
  }
  function linhaSessao(s, comNome) {
    const t = tec(s.tec);
    return h("button", { class: "item", dataset: { cat: t.cat }, onclick: () => abrirSessao(s.id) },
      h("i", { class: "ponto-cat" }),
      h("div", { class: "cresce" },
        h("div", { class: "tit", text: comNome ? t.nome : diaTxt(s.data) + " · " + hora(s.data) }),
        h("div", { class: "sub", text: (comNome ? hora(s.data) + " · " : "") + resumoSessao(s, t) + (s.nota ? " · “" + s.nota.slice(0, 40) + (s.nota.length > 40 ? "…" : "") + "”" : "") })),
      h("div", { class: "lado" }, qualPontos(s.qual)));
  }

  /* ── histórico ──────────────────────────────────────────────────── */
  function pagHistorico() {
    let ss = ordenadas().slice().reverse();
    const f = E.filtro;
    if (f.startsWith("tec:") && !tec(f.slice(4))) E.filtro = "todas";
    if (E.filtro.startsWith("tec:")) ss = ss.filter(s => s.tec === E.filtro.slice(4));
    else if (E.filtro !== "todas") ss = ss.filter(s => tec(s.tec).cat === E.filtro);
    const pag = h("main", { class: "pagina" },
      cab("Histórico", ordenadas().length + (ordenadas().length === 1 ? " sessão registrada" : " sessões registradas"), null,
        h("button", { class: "bt bt-sec", onclick: () => abrirFormSessao(null) }, ic("mais", 18), "Registrar")),
      avisoMemoria());
    const chips = [["todas", "Todas"]].concat(CATS.filter(c => ordenadas().some(s => tec(s.tec).cat === c.id)).map(c => [c.id, c.nome]));
    if (E.filtro.startsWith("tec:")) chips.push([E.filtro, tec(E.filtro.slice(4)).nome]);
    pag.appendChild(h("div", { class: "chips rolar", role: "group", "aria-label": "Filtro" }, chips.map(([v, nome]) =>
      h("button", { class: "chip", "aria-pressed": String(E.filtro === v), dataset: CATS.some(c => c.id === v) ? { cat: v } : null, onclick: () => { E.filtro = v; E.limite = 60; render(); } },
        CATS.some(c => c.id === v) ? h("i", { class: "ponto-cat" }) : null, nome))));
    if (!ss.length) {
      pag.appendChild(h("div", { class: "cartao", style: "margin-top:14px" }, h("div", { class: "vazio" },
        h("div", { class: "tit", text: ordenadas().length ? "Nada com esse filtro" : "Nenhuma sessão ainda" }),
        h("p", { text: "As sessões que você treinar ou registrar aparecem aqui, da mais nova para a mais antiga." }))));
      return pag;
    }
    let diaAtual = null, lista = null;
    ss.slice(0, E.limite).forEach(s => {
      const k = chave(s.data);
      if (k !== diaAtual) {
        diaAtual = k;
        const doDia = ss.filter(x => chave(x.data) === k);
        const durD = soma(doDia, "dur");
        pag.appendChild(h("div", { class: "grupo-tit", style: "text-transform:none;letter-spacing:0;font-size:.9rem" }, diaTxt(s.data),
          h("span", { style: "font-weight:400;color:var(--tinta-3)", text: " · " + doDia.length + (doDia.length === 1 ? " sessão" : " sessões") + (durD ? " · " + dur(durD) : "") })));
        lista = h("div", { class: "lista" });
        pag.appendChild(lista);
      }
      lista.appendChild(linhaSessao(s, true));
    });
    if (ss.length > E.limite) pag.appendChild(h("button", { class: "bt bt-sec bt-largo", style: "margin-top:14px", onclick: () => { E.limite += 100; render(); } }, "Mostrar mais (" + (ss.length - E.limite) + ")"));
    return pag;
  }

  /* ── sessão: ver, registrar, editar ─────────────────────────────── */
  function abrirSessao(id) {
    const s = D.sessoes.find(x => x.id === id);
    if (!s) return;
    const t = tec(s.tec);
    const r = ritmoDe(s);
    const corpo = h("div", { dataset: { cat: t.cat } },
      h("p", { style: "color:var(--tinta-2);margin-bottom:12px", text: diaTxt(s.data) + " às " + hora(s.data) + (s.origem === "cronometro" ? " · cronometrada" : "") }),
      h("div", { class: "resumo-fim" },
        h("div", null, h("b", { text: cont(t) ? num(s.qtd || 0) : "—" }), h("span", { text: cont(t) ? t.uni : "" })),
        h("div", null, h("b", { text: s.dur ? relogio(s.dur * 1000) : "—" }), h("span", { text: "tempo" })),
        h("div", null, h("b", { text: cont(t) ? ritmoTxt(r) : s.dur ? dur(s.dur) : "—" }), h("span", { text: cont(t) ? "por " + singular(t.uni) : "total" }))),
      h("div", { class: "lista", style: "margin-top:12px;box-shadow:none" },
        h("div", { class: "item" }, h("div", { class: "cresce" }, h("div", { class: "tit", text: "Qualidade" })), h("div", { class: "lado" }, s.qual ? [qualPontos(s.qual), " " + s.qual + " · " + NOTAS[s.qual - 1]] : "não avaliada")),
        cont(t) ? h("div", { class: "item" }, h("div", { class: "cresce" }, h("div", { class: "tit", text: "Falhas" })), h("div", { class: "lado", text: s.falhas ? s.falhas + (s.qtd ? " (" + num(s.falhas / s.qtd * 100, 1) + "%)" : "") : "nenhuma" })) : null));
    if (s.voltas && s.voltas.length >= 2) {
      const m = s.voltas.reduce((a, b) => a + b, 0) / s.voltas.length;
      const iMin = s.voltas.indexOf(Math.min(...s.voltas));
      corpo.appendChild(h("div", { style: "margin-top:16px" },
        h("div", { class: "cartao-tit", text: "Tempo de cada " + singular(t.uni) }),
        h("div", { class: "cartao-sub", text: "segundos · o mais rápido foi o " + (iMin + 1) + "º, com " + num(s.voltas[iMin], 1) + " s" }),
        G.barras({
          largura: Math.min(window.innerWidth, 640) - 40, altura: 170, rotuloAcessivel: "Tempo de cada repetição",
          grupos: s.voltas.map((v, i) => ({ rotulo: String(i + 1), partes: [{ cat: t.cat, valor: v }], dica: { tit: singular(t.uni) + " " + (i + 1), linhas: [{ cat: t.cat, valor: num(v, 1) + " s" }] } })),
          formatoEixo: v => num(v), referencia: { valor: m, rotulo: "média " + num(m, 1) + " s" },
          tabela: { cab: [singular(t.uni)[0].toUpperCase() + singular(t.uni).slice(1), "Segundos"], linhas: s.voltas.map((v, i) => [String(i + 1), num(v, 1)]) }
        })));
    }
    if (s.nota) corpo.appendChild(h("div", { style: "margin-top:14px" }, h("div", { class: "cartao-tit", text: "Anotação" }), h("p", { style: "white-space:pre-wrap;color:var(--tinta-2)", text: s.nota })));
    abrirFolha({
      titulo: t.nome, corpo,
      pe: [
        h("button", { class: "bt bt-perigo estreito", "aria-label": "Apagar sessão", onclick: async () => {
          if (await confirmar({ titulo: "Apagar esta sessão?", texto: "Ela sai do histórico e de todas as estatísticas.", sim: "Apagar", perigo: true })) {
            D.sessoes = D.sessoes.filter(x => x.id !== id); salvar(); fecharTodas(); render(); aviso("Sessão apagada.");
          }
        } }, ic("lixo", 18)),
        h("button", { class: "bt bt-sec", onclick: () => abrirDetalhe(s.tec) }, "Ver técnica"),
        h("button", { class: "bt bt-pri", onclick: () => { fecharFolha(); abrirFormSessao(s); } }, ic("lapis", 18), "Editar")
      ]
    });
  }

  function formSessao(v, opc) {
    const st = { tec: v.tec, qual: v.qual || null };
    const wrap = h("div");
    let selTec = null, entData = null, entHora = null;
    if (opc.trocarTec) {
      selTec = h("select", { class: "entrada", onchange: () => { st.tec = selTec.value; ajustar(); } });
      CATS.forEach(c => {
        const og = h("optgroup", { label: c.nome });
        tecsAtivas(st.tec).filter(t => t.cat === c.id).forEach(t => og.appendChild(h("option", { value: t.id, text: t.nome })));
        if (og.children.length) selTec.appendChild(og);
      });
      selTec.value = st.tec;
      wrap.appendChild(campo("Técnica", selTec));
    }
    if (opc.data) {
      entData = h("input", { type: "date", class: "entrada", value: chave(v.data), max: chave(new Date()) });
      entHora = h("input", { type: "time", class: "entrada", value: hora(v.data) });
      wrap.appendChild(h("div", { class: "duas" }, campo("Dia", entData), campo("Hora", entHora)));
    }
    const mudar = (ent, d) => { ent.value = Math.max(0, (parseInt(ent.value, 10) || 0) + d); ent.dispatchEvent(new Event("input")); };
    const entQtd = h("input", { class: "entrada", type: "number", inputmode: "numeric", min: "0", step: "1", value: v.qtd != null ? String(v.qtd) : "", "aria-label": "Quantidade" });
    const rotQtd = h("span");
    const campoQtd = campo(rotQtd,
      h("div", { class: "passo" }, h("button", { type: "button", "aria-label": "Menos um", onclick: () => mudar(entQtd, -1) }, "−"), entQtd, h("button", { type: "button", "aria-label": "Mais um", onclick: () => mudar(entQtd, 1) }, "+")),
      h("div", { class: "chips", style: "margin-top:8px" }, [10, 20, 30, 50].map(n => h("button", { type: "button", class: "chip", onclick: () => { entQtd.value = n; entQtd.dispatchEvent(new Event("input")); } }, String(n)))));
    wrap.appendChild(campoQtd);
    const seg0 = v.dur || 0;
    const entMin = h("input", { class: "entrada", type: "number", inputmode: "numeric", min: "0", step: "1", value: seg0 ? String(Math.floor(seg0 / 60)) : "", placeholder: "0", "aria-label": "Minutos" });
    const entSeg = h("input", { class: "entrada", type: "number", inputmode: "numeric", min: "0", max: "59", step: "1", value: seg0 ? String(seg0 % 60) : "", placeholder: "0", "aria-label": "Segundos" });
    const rotTempo = h("span");
    const ritmoVivo = h("div", { class: "ajuda" });
    wrap.appendChild(campo(rotTempo, h("div", { class: "tempo-campos" }, entMin, h("span", { text: "min" }), entSeg, h("span", { text: "s" })), ritmoVivo));
    const notas = h("div", { class: "notas5", role: "group", "aria-label": "Qualidade" });
    const pintarNotas = () => [...notas.children].forEach((b, i) => b.setAttribute("aria-pressed", String(st.qual === i + 1)));
    NOTAS.forEach((n, i) => notas.appendChild(h("button", { type: "button", onclick: () => { st.qual = st.qual === i + 1 ? null : i + 1; pintarNotas(); } }, String(i + 1), h("small", { text: n }))));
    pintarNotas();
    wrap.appendChild(campo("Como saiu? (opcional)", notas, h("div", { class: "ajuda", text: "Sua nota para a técnica: aproximação das bordas, tensão, simetria, nós firmes." })));
    const entFal = h("input", { class: "entrada", type: "number", inputmode: "numeric", min: "0", step: "1", value: String(v.falhas || 0), "aria-label": "Falhas" });
    const campoFal = campo("Falhas ou refeitos",
      h("div", { class: "passo" }, h("button", { type: "button", "aria-label": "Menos uma falha", onclick: () => mudar(entFal, -1) }, "−"), entFal, h("button", { type: "button", "aria-label": "Mais uma falha", onclick: () => mudar(entFal, 1) }, "+")),
      h("div", { class: "ajuda", text: "Pontos que precisou refazer, nós que afrouxaram, fio que rompeu." }));
    wrap.appendChild(campoFal);
    const entNota = h("textarea", { class: "entrada", placeholder: "Fio, material, o que melhorar na próxima…", rows: "3" });
    entNota.value = v.nota || "";
    wrap.appendChild(campo("Anotação (opcional)", entNota));

    function ajustar() {
      const t = tec(st.tec);
      const c = cont(t);
      campoQtd.hidden = !c;
      campoFal.hidden = !c;
      rotQtd.textContent = "Quantidade (" + t.uni + ")";
      rotTempo.textContent = c ? "Tempo total (opcional)" : "Tempo total";
      atualizarRitmo();
    }
    function atualizarRitmo() {
      const t = tec(st.tec);
      const q = parseInt(entQtd.value, 10) || 0, d = (parseInt(entMin.value, 10) || 0) * 60 + (parseInt(entSeg.value, 10) || 0);
      ritmoVivo.textContent = cont(t) && q > 0 && d > 0 ? "Ritmo: " + ritmoTxt(d / q) + " por " + singular(t.uni) : "";
    }
    [entQtd, entMin, entSeg].forEach(x => x.addEventListener("input", atualizarRitmo));
    ajustar();

    return {
      el: wrap,
      ler() {
        const t = tec(st.tec);
        const c = cont(t);
        const qtd = c ? parseInt(entQtd.value, 10) || 0 : null;
        const durS = (parseInt(entMin.value, 10) || 0) * 60 + (parseInt(entSeg.value, 10) || 0);
        if (c && qtd < 1) return { erro: "Informe a quantidade (" + t.uni + ")." };
        if (!c && durS < 1) return { erro: "Informe o tempo de treino." };
        let data = v.data;
        if (opc.data) {
          const [a, m, d] = (entData.value || "").split("-").map(Number);
          const [hh, mi] = (entHora.value || "12:00").split(":").map(Number);
          data = +new Date(a, (m || 1) - 1, d || 1, hh || 0, mi || 0);
          if (!a || !isFinite(data)) return { erro: "Confira o dia." };
          if (data > Date.now() + 5 * 60000) return { erro: "Esse dia ainda não chegou." };
        }
        return { tec: t.id, data, qtd: c ? qtd : null, dur: durS || null, qual: st.qual || null, falhas: c ? Math.max(0, parseInt(entFal.value, 10) || 0) : 0, nota: entNota.value.trim() };
      }
    };
  }

  function abrirFormSessao(s, tecId) {
    const editando = !!s;
    const base = s || { tec: tecId || E.tecTreino || (ultimaTec() || tecsAtivas()[0]).id, data: Date.now(), qtd: null, dur: null, qual: null, falhas: 0, nota: "" };
    const f = formSessao(base, { trocarTec: true, data: true });
    abrirFolha({
      titulo: editando ? "Editar sessão" : "Registrar sessão",
      corpo: f.el,
      pe: [
        h("button", { class: "bt bt-sec", text: "Cancelar", onclick: () => fecharFolha() }),
        h("button", { class: "bt bt-pri", onclick: () => {
          const v = f.ler();
          if (v.erro) { aviso(v.erro); return; }
          if (editando) {
            const alvo = D.sessoes.find(x => x.id === s.id);
            if (alvo) {
              if (alvo.voltas && (v.qtd !== alvo.qtd || v.tec !== alvo.tec)) delete alvo.voltas;
              Object.assign(alvo, v);
              salvar();
            }
            fecharFolha(); render(); aviso("Sessão atualizada.");
          } else {
            const antes = estat(tec(v.tec));
            D.sessoes.push(Object.assign({ id: novoId(), origem: "manual" }, v));
            salvar();
            fecharFolha();
            if (E.detalhe === v.tec || (E.tela === "historico" && !E.detalhe)) render(); else abrirDetalhe(v.tec);
            aviso(recorde(antes, v) || "Sessão registrada.");
          }
        } }, ic("check", 18), "Salvar")
      ]
    });
  }
  function recorde(antes, v) {
    const t = tec(v.tec);
    const r = v.qtd > 0 && v.dur > 0 ? v.dur / v.qtd : null;
    if (cont(t) && r != null && antes.melhor && r < antes.melhor.r) return "Novo melhor ritmo: " + ritmoTxt(r) + " por " + singular(t.uni) + "!";
    if (cont(t) && antes.n && v.qtd > Math.max(...antes.ss.map(x => x.qtd || 0))) return "Sessão mais longa até hoje: " + qtdTxt(v.qtd, t) + "!";
    return null;
  }

  /* ── técnica: criar e editar ────────────────────────────────────── */
  function abrirFormTecnica(t) {
    const novo = !t;
    const st = t ? { cat: t.cat, medida: t.medida } : { cat: "sut", medida: "cont" };
    const entNome = h("input", { class: "entrada", type: "text", maxlength: "60", placeholder: "Ex.: Ponto de Sarnoff, anastomose…", value: t ? t.nome : "" });
    const cats = h("div", { class: "cats", role: "group", "aria-label": "Categoria" });
    const pintarCats = () => [...cats.children].forEach(b => b.setAttribute("aria-pressed", String(b.dataset.cat === st.cat)));
    CATS.forEach(c => cats.appendChild(h("button", { type: "button", class: "chip", dataset: { cat: c.id }, onclick: () => {
      const antiga = catDe(st.cat).uni;
      st.cat = c.id;
      if (!entUni.value.trim() || entUni.value.trim() === antiga) entUni.value = c.uni;
      pintarCats(); ajustar();
    } }, h("i", { class: "ponto-cat" }), c.nome)));
    const opcoes = h("div", { class: "opcoes", role: "group", "aria-label": "Como medir" });
    [["cont", "Contagem", "Conta pontos, nós ou repetições; o tempo é opcional e dá o ritmo."], ["tempo", "Só tempo", "Cronometra a sessão inteira. Para coordenação e exercícios contínuos."]].forEach(([v, tit, sub]) =>
      opcoes.appendChild(h("button", { type: "button", class: "opcao", dataset: { v }, onclick: () => { st.medida = v; ajustar(); } },
        h("span", { class: "marcador" }), h("div", null, h("div", { class: "tit", text: tit }), h("div", { class: "sub", text: sub })))));
    const entUni = h("input", { class: "entrada", type: "text", maxlength: "24", value: t && cont(t) ? t.uni : catDe(st.cat).uni, placeholder: "pontos" });
    const sugest = h("div", { class: "chips", style: "margin-top:8px" }, ["pontos", "nós", "repetições", "transferências", "anastomoses"].map(u => h("button", { type: "button", class: "chip", onclick: () => { entUni.value = u; ajustar(); } }, u)));
    const campoUni = campo("Unidade (no plural)", entUni, sugest);
    const entMeta = h("input", { class: "entrada", type: "number", inputmode: "numeric", min: "0", step: "1", value: t && t.meta ? String(t.meta) : "", placeholder: "sem meta" });
    const ajudaMeta = h("div", { class: "ajuda" });
    const entDesc = h("textarea", { class: "entrada", rows: "3", placeholder: "Fio, agulha, material de treino, passo a passo…" });
    entDesc.value = t ? t.desc || "" : "";

    function ajustar() {
      [...opcoes.children].forEach(b => b.setAttribute("aria-pressed", String(b.dataset.v === st.medida)));
      campoUni.hidden = st.medida !== "cont";
      ajudaMeta.textContent = st.medida === "cont" ? "Quantos " + (entUni.value.trim() || "pontos") + " por semana. A barra aparece no início e na técnica." : "Quantos minutos por semana. A barra aparece no início e na técnica.";
    }
    entUni.addEventListener("input", ajustar);
    pintarCats(); ajustar();

    const corpo = h("div", null,
      campo("Nome", entNome),
      campo("Categoria", cats),
      campo("Como medir", opcoes, t && !novo && daTec(t.id).length ? h("div", { class: "ajuda", text: "Mudar a medida não apaga as sessões; quantidades antigas ficam guardadas." }) : null),
      campoUni,
      campo("Meta semanal (opcional)", entMeta, ajudaMeta),
      campo("Observações (opcional)", entDesc));
    const n = t ? daTec(t.id).length : 0;
    const pe = [];
    if (!novo) {
      pe.push(h("button", { class: "bt bt-perigo estreito", "aria-label": "Apagar técnica", onclick: async () => {
        const ok = await confirmar({ titulo: "Apagar “" + t.nome + "”?", texto: n ? "As " + n + (n === 1 ? " sessão registrada também será apagada" : " sessões registradas também serão apagadas") + ". Para guardar o histórico, arquive em vez de apagar." : "A técnica sai da lista.", sim: "Apagar", perigo: true });
        if (!ok) return;
        D.tecnicas = D.tecnicas.filter(x => x.id !== t.id);
        D.sessoes = D.sessoes.filter(x => x.tec !== t.id);
        if (T && T.tec === t.id) { T = null; salvarTreino(); }
        salvar(); fecharTodas(); E.detalhe = null; render(); aviso("Técnica apagada.");
      } }, ic("lixo", 18)));
      pe.push(h("button", { class: "bt bt-sec", onclick: () => {
        t.arquivada = !t.arquivada; salvar(); fecharFolha(); render();
        aviso(t.arquivada ? "Arquivada: some das listas, mas as sessões continuam nas estatísticas." : "Técnica reativada.");
      } }, t.arquivada ? "Reativar" : "Arquivar"));
    } else {
      pe.push(h("button", { class: "bt bt-sec", text: "Cancelar", onclick: () => fecharFolha() }));
    }
    pe.push(h("button", { class: "bt bt-pri", onclick: () => {
      const nome = entNome.value.trim().replace(/\s+/g, " ");
      if (!nome) { aviso("Dê um nome à técnica."); entNome.focus(); return; }
      if (D.tecnicas.some(x => x !== t && x.nome.toLowerCase() === nome.toLowerCase())) { aviso("Já existe uma técnica com esse nome."); return; }
      const uni = st.medida === "tempo" ? "min" : (entUni.value.trim().toLowerCase() || catDe(st.cat).uni);
      const meta = Math.max(0, parseInt(entMeta.value, 10) || 0) || null;
      if (novo) {
        const id = "t-" + novoId();
        D.tecnicas.push({ id, nome, cat: st.cat, medida: st.medida, uni, meta, desc: entDesc.value.trim(), arquivada: false, padrao: false });
        salvar(); fecharFolha(); abrirDetalhe(id); aviso("Técnica criada. Ela já entra nas estatísticas.");
      } else {
        Object.assign(t, { nome, cat: st.cat, medida: st.medida, uni, meta, desc: entDesc.value.trim() });
        salvar(); fecharFolha(); render(); aviso("Técnica salva.");
      }
    } }, ic("check", 18), novo ? "Criar" : "Salvar"));
    abrirFolha({ titulo: novo ? "Nova técnica" : "Editar técnica", corpo, pe });
    if (novo) setTimeout(() => entNome.focus(), 260);
  }

  /* ── treino ao vivo ─────────────────────────────────────────────── */
  let R = {};
  const decorrido = () => (T ? T.acum + (T.desde ? Date.now() - T.desde : 0) : 0);
  const tecT = () => (T ? tec(T.tec) : null);

  function comecarCom(id) {
    if (T && T.tec !== id) {
      aviso("Termine o treino em andamento primeiro.");
      irPara("treinar");
      return;
    }
    E.tecTreino = id;
    fecharTodas();
    irPara("treinar");
  }
  function iniciar() {
    const t = tec(E.tecTreino);
    if (!t) return;
    const alvo = E.alvo[t.id] || 0;
    T = { tec: t.id, alvo, inicio: Date.now(), acum: 0, desde: Date.now(), marcas: [], falhas: 0 };
    salvarTreino();
    vibrar(0);
    render();
  }
  function pausar() {
    if (!T || !T.desde) return;
    T.acum = decorrido();
    T.desde = null;
    salvarTreino();
  }
  function retomar() {
    if (!T || T.desde) return;
    T.desde = Date.now();
    salvarTreino();
  }
  function alternar() {
    if (!T) return;
    if (T.desde) pausar(); else retomar();
    vibrar(0);
    atualizarTreino();
  }
  function contar() {
    if (!T || pilha.length) return;
    const t = tecT();
    if (!cont(t)) { alternar(); return; }
    if (!T.desde) { retomar(); vibrar(0); atualizarTreino(); return; }
    T.marcas.push(decorrido());
    salvarTreino();
    const n = T.marcas.length;
    if (T.alvo && n === T.alvo) { vibrar(1); aviso(qtdTxt(n, t) + "! Meta da sessão cumprida."); }
    else vibrar(0);
    if (R.botao) { R.botao.classList.remove("batida"); void R.botao.offsetWidth; R.botao.classList.add("batida"); setTimeout(() => R.botao && R.botao.classList.remove("batida"), 120); }
    atualizarTreino();
  }
  function desfazer() {
    if (!T || !T.marcas.length) return;
    T.marcas.pop();
    salvarTreino();
    aviso("Último desfeito.");
    atualizarTreino();
  }
  function anotarFalha() {
    if (!T) return;
    T.falhas++;
    salvarTreino();
    vibrar(0);
    aviso("Falha anotada (" + T.falhas + "). Dá para corrigir ao concluir.");
    atualizarTreino();
  }
  async function descartar() {
    if (!T) return;
    const ok = await confirmar({ titulo: "Descartar este treino?", texto: "O tempo e a contagem desta sessão não serão salvos.", sim: "Descartar", perigo: true });
    if (!ok) return;
    T = null; salvarTreino(); fecharTodas(); render();
  }
  function voltas() {
    const v = [];
    T.marcas.forEach((m, i) => v.push(Math.round((m - (i ? T.marcas[i - 1] : 0)) / 100) / 10));
    return v;
  }

  function pagTreinar() { return T ? pagTreinoAtivo() : pagTreinoEscolha(); }

  function pagTreinoEscolha() {
    let t = tec(E.tecTreino);
    if (!t || t.arquivada) t = ultimaTec() || tecsAtivas()[0];
    if (!t) return h("main", { class: "pagina" }, cab("Treinar"), h("div", { class: "cartao" }, h("div", { class: "vazio" }, h("div", { class: "tit", text: "Nenhuma técnica ativa" }), h("button", { class: "bt bt-pri", onclick: () => abrirFormTecnica(null) }, "Criar técnica"))));
    E.tecTreino = t.id;
    const c = cont(t);
    const alvos = c ? [0, 10, 20, 30, 50] : [0, 5, 10, 15, 20, 30];
    if (!alvos.includes(E.alvo[t.id] || 0)) E.alvo[t.id] = 0;
    const e = estat(t);
    const ult = e.ultima;
    const pag = h("main", { class: "pagina" },
      cab("Treinar", c ? "cronômetro e contador" : "cronômetro"),
      avisoMemoria(),
      campo("Técnica", h("button", { class: "treino-tec", dataset: { cat: t.cat }, onclick: escolherTecnica },
        h("i", { class: "ponto-cat" }),
        h("div", { class: "cresce" }, h("div", { class: "tit", text: t.nome }), h("div", { class: "sub", text: catDe(t.cat).nome + " · " + (c ? "conta " + t.uni : "conta tempo") })),
        h("span", { class: "mudo", text: "trocar" }))),
      campo("Meta desta sessão", h("div", { class: "chips", role: "group" }, alvos.map(a => h("button", {
        class: "chip", "aria-pressed": String((E.alvo[t.id] || 0) === a), onclick: () => { E.alvo[t.id] = a; render(); }
      }, a === 0 ? "Livre" : c ? a + " " + t.uni : a + " min")))));
    if (ult) {
      pag.appendChild(h("div", { class: "cartao", style: "margin-top:18px" },
        h("div", { class: "cartao-sub", text: "Último treino, " + quando(ult.data) }),
        h("div", { style: "font-weight:500;margin-top:2px", text: resumoSessao(ult, t) || "sem números" }),
        c && e.melhor ? h("div", { class: "cartao-sub", style: "margin-top:6px", text: "Melhor ritmo: " + ritmoTxt(e.melhor.r) + " por " + singular(t.uni) + " (" + diaTxt(e.melhor.s.data).toLowerCase() + ")" }) : null));
    }
    pag.appendChild(h("button", { class: "bt bt-pri bt-grande bt-largo", style: "margin-top:20px", onclick: iniciar }, ic("play", 20), "Começar"));
    pag.appendChild(h("p", { class: "dica-volume", text: c ? (A ? "Durante o treino, toque no botão grande ou aperte um botão de volume a cada " + singular(t.uni) + "." : "Durante o treino, toque no botão grande ou aperte a barra de espaço a cada " + singular(t.uni) + ".") : "O cronômetro continua mesmo se a tela apagar ou você trocar de app." }));
    pag.appendChild(h("button", { class: "bt bt-fant bt-largo", style: "margin-top:12px", onclick: () => abrirFormSessao(null, t.id) }, "Registrar uma sessão já feita"));
    return pag;
  }
  function escolherTecnica() {
    const corpo = h("div");
    CATS.forEach(c => {
      const ts = tecsAtivas().filter(t => t.cat === c.id);
      if (!ts.length) return;
      corpo.appendChild(h("div", { class: "grupo-tit", dataset: { cat: c.id } }, h("i", { class: "ponto-cat" }), c.nome));
      corpo.appendChild(h("div", { class: "lista", style: "box-shadow:none" }, ts.map(t => h("button", {
        class: "item", "aria-pressed": String(t.id === E.tecTreino), style: t.id === E.tecTreino ? "background:var(--marca-suave)" : null,
        onclick: () => { E.tecTreino = t.id; fecharFolha(); render(); }
      }, h("div", { class: "cresce" }, h("div", { class: "tit", text: t.nome }), h("div", { class: "sub", text: cont(t) ? "conta " + t.uni : "conta tempo" })), t.id === E.tecTreino ? ic("check", 18) : null))));
    });
    corpo.appendChild(h("button", { class: "bt bt-fant bt-largo", style: "margin-top:12px", onclick: () => { fecharFolha(); abrirFormTecnica(null); } }, ic("mais", 18), "Criar técnica"));
    abrirFolha({ titulo: "Escolha a técnica", corpo });
  }

  function pagTreinoAtivo() {
    const t = tecT();
    const c = cont(t);
    R = {};
    R.relogio = h("div", { class: "relogio", "data-relogio": "", role: "timer", text: relogio(decorrido()) });
    R.estado = h("div", { class: "estado" });
    R.anel = G.anel(0);
    R.conta = h("span", { class: "conta" });
    R.uni = h("span", { class: "uni" });
    R.dm = h("span", { class: "dica-mais" });
    R.botao = h("button", { class: "botao-mais", onclick: contar }, R.anel, h("span", { class: "miolo" }, R.conta, R.uni, R.dm));
    R.media = h("b"); R.ultimo = h("b"); R.melhor = h("b");
    R.desfazer = h("button", { class: "bt bt-sec", onclick: desfazer }, ic("desfazer"), "Desfazer");
    R.falha = h("button", { class: "bt bt-sec", onclick: anotarFalha }, ic("falha"), h("span"));
    R.pausa = h("button", { class: "bt bt-sec", onclick: alternar }, h("span"), h("span"));
    const pag = h("main", { class: "pagina", dataset: { cat: t.cat } },
      cab("Treinando", "começou às " + hora(T.inicio) + (T.alvo ? " · meta " + (c ? T.alvo + " " + t.uni : T.alvo + " min") : ""), null,
        h("button", { class: "icone-bt", "aria-label": "Descartar treino", onclick: descartar }, ic("lixo"))),
      h("div", { class: "treino" },
        h("div", { class: "treino-tec", dataset: { cat: t.cat } }, h("i", { class: "ponto-cat" }), h("div", { class: "cresce" }, h("div", { class: "tit", text: t.nome }), h("div", { class: "sub", text: catDe(t.cat).nome }))),
        R.relogio, R.estado,
        c ? h("div", { class: "ritmo-vivo", "aria-live": "off" }, h("div", null, R.media, "média"), h("div", null, R.ultimo, "último"), h("div", null, R.melhor, "melhor")) : null,
        R.botao,
        c ? h("div", { class: "treino-acoes" }, R.desfazer, R.falha, R.pausa) : null,
        h("button", { class: "bt bt-pri bt-grande bt-largo treino-fim", onclick: abrirConcluir }, ic("check", 20), "Concluir e salvar"),
        c ? h("p", { class: "dica-volume", text: A ? (D.ajustes.volume ? "Os botões de volume também contam." : "Ative em Ajustes para contar com os botões de volume.") : "A barra de espaço também conta." }) : null));
    atualizarTreino();
    return pag;
  }
  function atualizarTreino() {
    if (!T || !R.botao) { tique(); return; }
    const t = tecT();
    const c = cont(t);
    const n = T.marcas.length;
    const rodando = !!T.desde;
    R.relogio.classList.toggle("parado", !rodando);
    R.estado.textContent = rodando ? (c ? "" : "rodando") : "pausado";
    R.botao.classList.toggle("pausado", !rodando);
    if (c) {
      R.conta.textContent = rodando ? num(n) : "";
      R.uni.textContent = rodando ? (T.alvo ? "de " + T.alvo + " " + t.uni : uniN(n, t)) : "Retomar";
      R.dm.textContent = rodando ? "toque a cada " + singular(t.uni) : "";
      R.botao.setAttribute("aria-label", rodando ? "Mais um " + singular(t.uni) + ". Contagem: " + n : "Retomar treino");
      R.anel.definir(T.alvo ? n / T.alvo : 0);
      const v = voltas();
      R.media.textContent = n ? ritmoTxt(T.marcas[n - 1] / 1000 / n) : "—";
      R.ultimo.textContent = n ? ritmoTxt(v[n - 1]) : "—";
      R.melhor.textContent = n ? ritmoTxt(Math.min(...v)) : "—";
      R.desfazer.disabled = !n;
      R.falha.lastChild.textContent = T.falhas ? "Falhas: " + T.falhas : "Falha";
    } else {
      R.conta.replaceChildren(ic(rodando ? "pausa" : "play", 56));
      R.uni.textContent = rodando ? "Pausar" : "Retomar";
      R.dm.textContent = T.alvo ? "meta " + T.alvo + " min" : "";
      R.botao.setAttribute("aria-label", rodando ? "Pausar" : "Retomar");
    }
    R.pausa.firstChild.replaceChildren(ic(rodando ? "pausa" : "play"));
    R.pausa.lastChild.textContent = rodando ? "Pausar" : "Retomar";
    tique();
  }
  let intervalo = 0;
  function ajustarTreino() {
    const naTela = !!T && E.tela === "treinar" && !E.detalhe;
    if (A) {
      try {
        A.telaLigada(naTela);
        A.volumeConta(naTela && !pilha.length && D.ajustes.volume && cont(tecT()));
      } catch (e) { /* ponte antiga */ }
    }
    if (T && !intervalo) intervalo = setInterval(tique, 250);
    if (!T && intervalo) { clearInterval(intervalo); intervalo = 0; }
    tique();
  }
  function tique() {
    if (!T) return;
    const ms = decorrido();
    const txt = relogio(ms);
    document.querySelectorAll("[data-relogio]").forEach(e => { if (e.textContent !== txt) e.textContent = txt; });
    const t = tecT();
    if (t && !cont(t) && T.alvo) {
      if (R.anel && R.anel.isConnected) R.anel.definir(ms / (T.alvo * 60000));
      if (!T.avisado && ms >= T.alvo * 60000) { T.avisado = true; salvarTreino(); vibrar(1); aviso(T.alvo + " min! Meta da sessão cumprida."); }
    }
  }

  function abrirConcluir() {
    if (!T) return;
    pausar();
    atualizarTreino();
    const t = tecT();
    const c = cont(t);
    const n = T.marcas.length;
    const durS = Math.round(decorrido() / 1000);
    const f = formSessao({ tec: t.id, data: T.inicio, qtd: c ? n : null, dur: durS, qual: null, falhas: T.falhas, nota: "" }, { trocarTec: false, data: false });
    const e = estat(t);
    const r = c && n ? durS / n : null;
    const corpo = h("div", { dataset: { cat: t.cat } },
      h("div", { class: "resumo-fim" },
        h("div", null, h("b", { text: c ? num(n) : "—" }), h("span", { text: c ? t.uni : "" })),
        h("div", null, h("b", { text: relogio(durS * 1000) }), h("span", { text: "tempo" })),
        h("div", null, h("b", { text: c ? ritmoTxt(r) : dur(durS) }), h("span", { text: c ? "por " + singular(t.uni) : "total" }))),
      c && r != null && e.melhor && r < e.melhor.r ? h("div", { class: "selo" }, ic("check", 18), "Melhor ritmo até hoje (antes: " + ritmoTxt(e.melhor.r) + ")") : null,
      c && r != null && e.recente != null && !(e.melhor && r < e.melhor.r) ? h("p", { class: "nota-graf", text: "Suas 3 últimas sessões tiveram média de " + ritmoTxt(e.recente) + " por " + singular(t.uni) + "." }) : null,
      f.el);
    abrirFolha({
      titulo: "Salvar sessão",
      corpo,
      pe: [
        h("button", { class: "bt bt-perigo estreito", "aria-label": "Descartar treino", onclick: descartar }, ic("lixo", 18)),
        h("button", { class: "bt bt-sec", onclick: () => fecharFolha() }, "Voltar"),
        h("button", { class: "bt bt-pri", onclick: () => {
          const v = f.ler();
          if (v.erro) { aviso(v.erro); return; }
          const antes = estat(t);
          const s = Object.assign({ id: novoId(), origem: "cronometro" }, v);
          if (c && v.qtd === n && n >= 1) s.voltas = voltas();
          D.sessoes.push(s);
          salvar();
          T = null; salvarTreino();
          fecharTodas();
          E.tela = "treinar";
          abrirDetalhe(t.id);
          aviso(recorde(antes, v) || "Sessão salva.");
        } }, ic("check", 18), "Salvar")
      ]
    });
  }

  /* ── ajustes e dados ────────────────────────────────────────────── */
  function pagMais() {
    const linhaChave = (icone, tit, sub, valor, aoMudar) => h("button", { class: "ajuste", role: "switch", "aria-checked": String(!!valor), onclick: aoMudar },
      h("span", { class: "ic" }, ic(icone, 20)), h("div", { class: "cresce" }, h("div", { class: "tit", text: tit }), sub ? h("div", { class: "sub", text: sub }) : null), h("span", { class: "chave" }));
    const linhaAcao = (icone, tit, sub, acao, cls) => h("button", { class: "ajuste " + (cls || ""), onclick: acao },
      h("span", { class: "ic" }, ic(icone, 20)), h("div", { class: "cresce" }, h("div", { class: "tit", text: tit }), sub ? h("div", { class: "sub", text: sub }) : null), ic("seta", 18));
    const versao = A ? (() => { try { return A.versao(); } catch (e) { return ""; } })() : "";
    const n = D.sessoes.length;
    return h("main", { class: "pagina" },
      cab("Ajustes"),
      avisoMemoria(),
      secao("Aparência", null, seg([["auto", "Automático"], ["claro", "Claro"], ["escuro", "Escuro"]], D.ajustes.tema, v => { D.ajustes.tema = v; salvar(); aplicarTema(); render(); }, "Tema")),
      A ? secao("Durante o treino", null, h("div", { class: "lista" },
        linhaChave("volume", "Botões de volume contam", "Volume para cima ou para baixo soma um ponto: bom para quando as mãos estão ocupadas.", D.ajustes.volume, () => { D.ajustes.volume = !D.ajustes.volume; salvar(); render(); }),
        linhaChave("vibrar", "Vibrar a cada toque", "Um toque leve confirma cada contagem.", D.ajustes.vibrar, () => { D.ajustes.vibrar = !D.ajustes.vibrar; salvar(); render(); }))) : null,
      secao("Seus dados", n + (n === 1 ? " sessão" : " sessões") + " · " + D.tecnicas.length + " técnicas", h("div", { class: "lista" },
        linhaAcao("baixar", "Salvar cópia de segurança", "Um arquivo .json com técnicas e sessões. Guarde no Drive ou mande para você.", salvarCopia),
        linhaAcao("subir", "Restaurar cópia", "Junta ou substitui pelo conteúdo de uma cópia salva.", () => { if (A) A.escolher(); else $("#seletor").click(); }),
        linhaAcao("planilha", "Exportar planilha", "CSV com todas as sessões, abre no Excel e no Planilhas Google.", exportarCsv),
        linhaAcao("compartilhar", "Resumo da semana", A ? "Texto pronto para mandar ao preceptor ou ao grupo." : "Copia um texto com o resumo da semana.", compartilharSemana),
        linhaAcao("lixo", "Apagar tudo", "Volta ao começo, com as técnicas de fábrica.", apagarTudo, "perigo"))),
      secao("Sobre", null, h("div", { class: "cartao" },
        h("p", { style: "color:var(--tinta-2);font-size:.92rem", text: "Suturas" + (versao ? " " + versao : "") + ". Seus registros ficam só neste aparelho: o app não usa internet e não pede permissão nenhuma. Salve uma cópia de segurança de vez em quando, principalmente antes de trocar de celular." }))));
  }

  function baixar(nome, tipo, texto) {
    if (A) { A.salvarComo(nome, tipo, texto); return; }
    const url = URL.createObjectURL(new Blob([texto], { type: tipo + ";charset=utf-8" }));
    const a = h("a", { href: url, download: nome });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
  const hojeArquivo = () => { const d = new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); };
  function salvarCopia() {
    const copia = { app: "suturas", versao: 1, exportado: new Date().toISOString(), dados: D };
    baixar("suturas-copia-" + hojeArquivo() + ".json", "application/json", JSON.stringify(copia, null, 1));
  }
  function exportarCsv() {
    if (!D.sessoes.length) { aviso("Ainda não há sessões para exportar."); return; }
    const q = v => { const s = v == null ? "" : String(v); return /[;"\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    const dec = v => (v == null ? "" : String(Math.round(v * 10) / 10).replace(".", ","));
    const linhas = [["data", "hora", "tecnica", "categoria", "quantidade", "unidade", "tempo_s", "tempo", "ritmo_s_por_unidade", "qualidade", "falhas", "origem", "anotacao"].join(";")];
    ordenadas().forEach(s => {
      const t = tec(s.tec);
      linhas.push([chave(s.data), hora(s.data), t.nome, catDe(t.cat).nome, cont(t) ? s.qtd : "", cont(t) ? t.uni : "", s.dur || "", s.dur ? relogio(s.dur * 1000) : "", cont(t) ? dec(ritmoDe(s)) : "", s.qual || "", cont(t) ? s.falhas || 0 : "", s.origem === "cronometro" ? "cronômetro" : "manual", s.nota || ""].map(q).join(";"));
    });
    baixar("suturas-sessoes-" + hojeArquivo() + ".csv", "text/csv", "﻿" + linhas.join("\r\n"));
  }
  function textoSemana() {
    const ini = segunda(new Date());
    const fim = new Date(ini); fim.setDate(fim.getDate() + 6);
    const ss = ordenadas().filter(s => s.data >= +ini);
    const linhas = ["Treino de técnica cirúrgica · semana de " + dataCurta(ini) + " a " + dataCurta(fim), ""];
    if (!ss.length) linhas.push("Nenhuma sessão nesta semana ainda.");
    const porTec = [...new Set(ss.map(s => s.tec))].map(tec);
    porTec.forEach(t => {
      const x = ss.filter(s => s.tec === t.id);
      const cr = x.filter(s => ritmoDe(s) != null);
      let l = "• " + t.nome + ": ";
      if (cont(t)) {
        l += qtdTxt(soma(x, "qtd"), t);
        if (cr.length) l += ", ritmo médio " + ritmoTxt(soma(cr, "dur") / soma(cr, "qtd")) + " por " + singular(t.uni);
      } else l += dur(soma(x, "dur"));
      l += " (" + x.length + (x.length === 1 ? " sessão" : " sessões") + ")";
      linhas.push(l);
    });
    if (ss.length) {
      linhas.push("");
      linhas.push("Total: " + ss.length + (ss.length === 1 ? " sessão" : " sessões") + (soma(ss, "dur") ? ", " + dur(soma(ss, "dur")) + " de treino" : "") + ", " + new Set(ss.map(s => chave(s.data))).size + " dias.");
    }
    return linhas.join("\n");
  }
  function compartilharSemana() {
    const txt = textoSemana();
    if (A) { A.compartilhar("Meu treino da semana", txt); return; }
    if (navigator.clipboard) navigator.clipboard.writeText(txt).then(() => aviso("Resumo copiado."), () => aviso("Não deu para copiar."));
    else aviso("Este navegador não deixa copiar.");
  }
  async function apagarTudo() {
    const ok = await confirmar({ titulo: "Apagar tudo?", texto: "Todas as sessões e as técnicas que você criou serão apagadas deste aparelho. Se quiser guardar, salve uma cópia de segurança antes.", sim: "Apagar tudo", perigo: true });
    if (!ok) return;
    D = novosDados(); T = null; salvarTreino(); salvar(); aplicarTema(); irPara("inicio"); aviso("Tudo apagado.");
  }
  async function processarCopia(texto) {
    let c;
    try { c = JSON.parse(texto); } catch (e) { aviso("Esse arquivo não é uma cópia do Suturas."); return; }
    const d = c && c.app === "suturas" ? c.dados : null;
    if (!d || !Array.isArray(d.tecnicas) || !Array.isArray(d.sessoes)) { aviso("Esse arquivo não é uma cópia do Suturas."); return; }
    const qd = c.exportado ? " salva em " + dataCurta(c.exportado) : "";
    const r = await confirmar({
      titulo: "Restaurar cópia" + qd + "?",
      texto: `A cópia tem ${d.tecnicas.length} técnicas e ${d.sessoes.length} sessões. "Juntar" soma ao que já está aqui, sem repetir; "Substituir" troca tudo pelo conteúdo da cópia.`,
      sim: "Juntar", outro: { rotulo: "Substituir", valor: "substituir" }
    });
    if (!r) return;
    if (r === "substituir") {
      D = arrumar(d);
    } else {
      const tecs = new Map(D.tecnicas.map(t => [t.id, t]));
      d.tecnicas.forEach(t => { if (!tecs.has(t.id)) { D.tecnicas.push(t); tecs.set(t.id, t); } });
      const ids = new Set(D.sessoes.map(s => s.id));
      d.sessoes.forEach(s => { if (!ids.has(s.id)) D.sessoes.push(s); });
      D = arrumar(D);
    }
    salvar(); aplicarTema(); render(); aviso("Cópia restaurada.");
  }
  $("#seletor").addEventListener("change", ev => {
    const f = ev.target.files && ev.target.files[0];
    ev.target.value = "";
    if (!f) return;
    const r = new FileReader();
    r.onload = () => processarCopia(String(r.result || ""));
    r.onerror = () => aviso("Não consegui ler o arquivo.");
    r.readAsText(f);
  });

  /* ── ganchos chamados pelo app Android ──────────────────────────── */
  window.__chegou = function () { try { const t = A.pendente(); if (t) processarCopia(t); } catch (e) { aviso("Não consegui ler o arquivo."); } };
  window.__pausa = function () { salvarTreino(); };
  window.__volta = function () { tique(); if (E.tela === "inicio" && !pilha.length) render(); };
  window.__tema = aplicarTema;
  window.__tecla = function () { if (T && E.tela === "treinar" && !E.detalhe && !pilha.length) contar(); };
  window.__voltar = function () {
    if (G.esconderDica()) return true;
    if (fecharFolha()) return true;
    if (E.detalhe) { fecharDetalhe(); return true; }
    if (E.tela !== "inicio") { irPara("inicio"); return true; }
    return false;
  };

  document.addEventListener("keydown", ev => {
    if (ev.key === "Escape") { if (G.esconderDica() || fecharFolha()) ev.preventDefault(); return; }
    const alvo = ev.target;
    if (alvo && (alvo.tagName === "INPUT" || alvo.tagName === "TEXTAREA" || alvo.tagName === "SELECT")) return;
    if (!T || E.tela !== "treinar" || E.detalhe || pilha.length) return;
    if (ev.key === " " || ev.key === "Enter") {
      if (alvo && alvo.tagName === "BUTTON") alvo.blur();
      ev.preventDefault(); contar();
    } else if (ev.key === "Backspace" || ev.key.toLowerCase() === "z") { ev.preventDefault(); desfazer(); }
    else if (ev.key.toLowerCase() === "f") anotarFalha();
    else if (ev.key.toLowerCase() === "p") alternar();
  });
  let tLarg = 0, largAnt = window.innerWidth;
  window.addEventListener("resize", () => {
    clearTimeout(tLarg);
    tLarg = setTimeout(() => {
      if (Math.abs(window.innerWidth - largAnt) < 30) return;   /* teclado abrindo não conta */
      largAnt = window.innerWidth;
      const y = window.scrollY; render(); window.scrollTo(0, y);
    }, 200);
  });
  document.addEventListener("visibilitychange", () => { if (document.hidden) salvarTreino(); else tique(); });

  aplicarTema();
  if (T) E.tela = "treinar";
  render();
  if (A) window.__chegou();
})();
