/* Gráficos em SVG feitos à mão, sem biblioteca e sem rede.
   Regras que valem para todos: marcas finas (linha de 2px, barra de no máximo 24px com
   ponta arredondada e base reta), grade em linha fina, um eixo só, texto sempre na cor
   da tinta (a cor da categoria vai na marca), toque ou passar o dedo mostra o valor e
   cada gráfico traz a mesma informação numa tabela, para quem prefere ler números. */
(function () {
  "use strict";
  const NS = "http://www.w3.org/2000/svg";

  function s(tag, at, pai) {
    const e = document.createElementNS(NS, tag);
    if (at) for (const k in at) if (at[k] != null) e.setAttribute(k, at[k]);
    if (pai) pai.appendChild(e);
    return e;
  }
  function el(tag, cls, texto) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (texto != null) e.textContent = texto;
    return e;
  }

  /* marcas redondas no eixo: 0, 10, 20… ou 0, 2,5, 5… */
  function marcas(max, n) {
    n = n || 4;
    if (!(max > 0)) max = 1;
    const bruto = max / n;
    const mag = Math.pow(10, Math.floor(Math.log10(bruto)));
    let passo = mag;
    for (const f of [1, 2, 2.5, 5, 10]) { if (f * mag >= bruto) { passo = f * mag; break; } }
    const topo = Math.ceil(max / passo - 1e-9) * passo;
    const lista = [];
    for (let v = 0; v <= topo + passo / 1e6; v += passo) lista.push(+v.toFixed(6));
    return lista;
  }

  /* barra com a ponta de dado arredondada (4px) e a base reta */
  function barraPath(x, y, w, h, r) {
    r = Math.max(0, Math.min(r, h, w / 2));
    if (r === 0) return `M${x} ${y}h${w}v${h}h${-w}Z`;
    return `M${x} ${y + h}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h}Z`;
  }

  /* ── a dica (tooltip) ─────────────────────────────────────────── */
  const dica = () => document.getElementById("dica");
  let donoDica = null;
  function mostrarDica(ev, conteudo, dono) {
    const d = dica();
    if (!d) return;
    d.replaceChildren();
    if (conteudo.tit) d.appendChild(el("div", "d-tit", conteudo.tit));
    for (const l of conteudo.linhas || []) {
      const lin = el("div", "d-lin");
      if (l.cat) { const k = el("i", "d-chave"); k.dataset.cat = l.cat; lin.appendChild(k); }
      lin.appendChild(el("b", null, l.valor));
      if (l.nome) lin.appendChild(el("span", null, l.nome));
      d.appendChild(lin);
    }
    d.hidden = false;
    donoDica = dono || null;
    const r = d.getBoundingClientRect();
    const vw = window.innerWidth, margem = 8;
    let x = ev.clientX - r.width / 2;
    let y = ev.clientY - r.height - 16;
    if (y < margem) y = ev.clientY + 20;
    x = Math.max(margem, Math.min(vw - r.width - margem, x));
    d.style.left = x + "px";
    d.style.top = y + "px";
  }
  function esconderDica() {
    const d = dica();
    if (d && !d.hidden) {
      d.hidden = true;
      if (donoDica && donoDica.limpar) donoDica.limpar();
      donoDica = null;
      return true;
    }
    return false;
  }
  document.addEventListener("pointerdown", function (e) {
    if (!e.target.closest || !e.target.closest(".graf")) esconderDica();
  }, true);
  window.addEventListener("scroll", esconderDica, { passive: true });

  function tabela(cab, linhas, titulo) {
    const det = el("details", "tabela");
    det.appendChild(el("summary", null, titulo || "Ver em tabela"));
    const caixa = el("div", "rolar");
    const t = el("table");
    const th = el("tr");
    cab.forEach(c => th.appendChild(el("th", null, c)));
    const thead = el("thead"); thead.appendChild(th); t.appendChild(thead);
    const tb = el("tbody");
    linhas.forEach(l => {
      const tr = el("tr");
      l.forEach(c => tr.appendChild(el("td", null, c)));
      tb.appendChild(tr);
    });
    t.appendChild(tb);
    caixa.appendChild(t);
    det.appendChild(caixa);
    return det;
  }

  function legenda(itens) {
    const l = el("div", "leg");
    itens.forEach(i => {
      const sp = el("span");
      const k = el("i", i.tipo || "cx");
      if (i.cat) k.dataset.cat = i.cat;
      if (i.cor) k.style.background = i.cor;
      sp.appendChild(k);
      sp.appendChild(document.createTextNode(i.nome));
      l.appendChild(sp);
    });
    return l;
  }

  /* ── barras, simples ou empilhadas ────────────────────────────────
     o = { largura, altura, grupos:[{rotulo, partes:[{cat, valor}], dica:{tit, linhas}}],
           formato(v), titulo (texto da tabela), referencia:{valor, rotulo},
           rotularUltimo, cabTabela, linhaTabela(g) } */
  function barras(o) {
    const W = Math.max(240, o.largura), H = o.altura || 180;
    const esq = 38, dir = 8, topo = 14, baixo = 24;
    const pw = W - esq - dir, ph = H - topo - baixo;
    const n = Math.max(1, o.grupos.length);
    const totais = o.grupos.map(g => g.partes.reduce((a, p) => a + (p.valor || 0), 0));
    const max = Math.max(o.referencia ? o.referencia.valor : 0, ...totais, 0);
    const tk = marcas(max || 1, 4);
    const ymax = tk[tk.length - 1];
    const Y = v => topo + ph - (v / ymax) * ph;
    const banda = pw / n;
    const bw = Math.max(2, Math.min(24, banda - 2 >= 6 ? banda * 0.62 : banda - 2));

    const caixa = el("div", "graf");
    const svg = s("svg", { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: "img", "aria-label": o.rotuloAcessivel || "gráfico de barras" }, null);
    tk.forEach(v => {
      const y = Y(v);
      if (v !== 0) s("line", { x1: esq, x2: W - dir, y1: y, y2: y, class: "grade" }, svg);
      const t = s("text", { x: esq - 6, y: y + 3.5, "text-anchor": "end" }, svg);
      t.textContent = o.formatoEixo ? o.formatoEixo(v) : String(v);
    });

    const passoRot = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(pw / 46))));
    const gs = [];
    o.grupos.forEach((g, i) => {
      const cx = esq + banda * i + banda / 2;
      const x = cx - bw / 2;
      const grupo = s("g", null, svg);
      let base = Y(0);
      const vis = g.partes.filter(p => p.valor > 0);
      vis.forEach((p, j) => {
        const h = (p.valor / ymax) * ph;
        const ultima = j === vis.length - 1;
        const vao = j > 0 && h > 3 ? 2 : 0;           /* 2px de superfície entre segmentos */
        const y = base - h;
        const path = s("path", { d: barraPath(x, y + vao, bw, h - vao, ultima ? 4 : 0) }, grupo);
        path.setAttribute("style", `fill:var(--cat-${p.cat || "marca"},var(--marca))`);
        if (p.cat === "marca") path.setAttribute("style", "fill:var(--marca)");
        base = y;
      });
      if ((i % passoRot === 0 || i === n - 1) && g.rotulo && (i === n - 1 || n - 1 - i >= passoRot * 0.6)) {
        const t = s("text", { x: cx, y: H - 6, "text-anchor": "middle" }, svg);
        t.textContent = g.rotulo;
      }
      if (o.rotularUltimo && i === n - 1 && totais[i] > 0) {
        const t = s("text", { x: cx, y: Y(totais[i]) - 5, "text-anchor": "middle", class: "rot-dado" }, svg);
        t.textContent = o.formato ? o.formato(totais[i]) : totais[i];
      }
      const alvo = s("rect", { x: esq + banda * i, y: topo, width: banda, height: ph, fill: "transparent", class: "alvo", tabindex: g.dica ? 0 : null }, svg);
      gs.push(grupo);
      if (g.dica) {
        const dono = { limpar: () => grupo.classList.remove("marcado") };
        const ver = ev => { gs.forEach(x => x.classList.remove("marcado")); grupo.classList.add("marcado"); mostrarDica(ev, g.dica, dono); };
        alvo.addEventListener("pointerdown", ver);
        alvo.addEventListener("pointermove", ev => { if (ev.pointerType === "mouse" || ev.buttons) ver(ev); });
        alvo.addEventListener("pointerleave", ev => { if (ev.pointerType === "mouse") esconderDica(); });
        alvo.addEventListener("focus", () => { const r = alvo.getBoundingClientRect(); ver({ clientX: r.left + r.width / 2, clientY: r.top + 20 }); });
        alvo.addEventListener("blur", esconderDica);
      }
    });
    s("line", { x1: esq, x2: W - dir, y1: Y(0), y2: Y(0), class: "base" }, svg);
    if (o.referencia && o.referencia.valor > 0) {
      const y = Y(o.referencia.valor);
      const ref = s("g", { "pointer-events": "none" }, svg);
      s("line", { x1: esq, x2: W - dir, y1: y, y2: y, class: "ref" }, ref);
      const t = s("text", { x: W - dir, y: y - 5, "text-anchor": "end", class: "rot-dado halo" }, ref);
      t.textContent = o.referencia.rotulo;
    }
    caixa.appendChild(svg);
    if (o.legenda) caixa.appendChild(legenda(o.legenda));
    if (o.tabela) caixa.appendChild(tabela(o.tabela.cab, o.tabela.linhas, o.tabela.titulo));
    return caixa;
  }

  /* ── linha: um ponto por sessão e a média móvel por cima ──────────
     o = { largura, altura, cat, pontos:[{y, rotulo, dica}], media:[y|null], formatoEixo,
           destaque:{indice, texto}, legenda, tabela } */
  function linha(o) {
    const W = Math.max(240, o.largura), H = o.altura || 190;
    const esq = 38, dir = 12, topo = 18, baixo = 24;
    const pw = W - esq - dir, ph = H - topo - baixo;
    const n = o.pontos.length;
    const vals = o.pontos.map(p => p.y).concat((o.media || []).filter(v => v != null));
    const tk = marcas(Math.max(...vals, 0) || 1, 4);
    const ymax = tk[tk.length - 1];
    const X = i => n <= 1 ? esq + pw / 2 : esq + (i / (n - 1)) * pw;
    const Y = v => topo + ph - (v / ymax) * ph;
    const cor = `var(--cat-${o.cat},var(--marca))`;

    const caixa = el("div", "graf");
    const svg = s("svg", { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: "img", "aria-label": o.rotuloAcessivel || "gráfico de linha" }, null);
    tk.forEach(v => {
      const y = Y(v);
      if (v !== 0) s("line", { x1: esq, x2: W - dir, y1: y, y2: y, class: "grade" }, svg);
      const t = s("text", { x: esq - 6, y: y + 3.5, "text-anchor": "end" }, svg);
      t.textContent = o.formatoEixo ? o.formatoEixo(v) : String(v);
    });
    s("line", { x1: esq, x2: W - dir, y1: Y(0), y2: Y(0), class: "base" }, svg);

    /* datas só nas pontas (e no meio, se couber), para não embolar */
    const rotX = n <= 1 ? [0] : pw > 300 && n > 4 ? [0, Math.floor((n - 1) / 2), n - 1] : [0, n - 1];
    rotX.forEach((i, k) => {
      if (!o.pontos[i]) return;
      const t = s("text", { x: X(i), y: H - 6, "text-anchor": n <= 1 ? "middle" : k === 0 ? "start" : k === rotX.length - 1 ? "end" : "middle" }, svg);
      t.textContent = o.pontos[i].rotulo;
    });

    if (o.media && n > 1) {
      let d = "";
      o.media.forEach((v, i) => { if (v == null) return; d += (d ? "L" : "M") + X(i).toFixed(1) + " " + Y(v).toFixed(1); });
      if (d) s("path", { d, fill: "none", style: `stroke:${cor}`, "stroke-width": 2, "stroke-linejoin": "round", "stroke-linecap": "round" }, svg);
    }
    const bolas = o.pontos.map((p, i) => {
      const c = s("circle", { cx: X(i), cy: Y(p.y), r: 4, style: `fill:${cor};stroke:var(--sup)`, "stroke-width": 2, opacity: o.media ? 0.55 : 1 }, svg);
      return c;
    });
    if (o.destaque && o.pontos[o.destaque.indice]) {
      const i = o.destaque.indice;
      const x = X(i), y = Y(o.pontos[i].y);
      bolas[i].setAttribute("opacity", 1);
      const t = s("text", { x: Math.max(esq + 2, Math.min(W - dir - 2, x)), y: y + 18 > topo + ph - 4 ? y - 10 : y + 18, "text-anchor": x < esq + 50 ? "start" : x > W - dir - 50 ? "end" : "middle", class: "rot-dado halo" }, svg);
      t.textContent = o.destaque.texto;
    }

    /* mira: a linha vertical acha a sessão mais próxima do dedo */
    const mira = s("line", { x1: 0, x2: 0, y1: topo, y2: topo + ph, class: "mira", visibility: "hidden" }, svg);
    const alvo = s("rect", { x: esq - 10, y: 0, width: pw + 20, height: H, fill: "transparent", class: "alvo", tabindex: 0 }, svg);
    let atual = -1;
    const dono = {
      limpar: () => {
        mira.setAttribute("visibility", "hidden");
        if (atual >= 0) bolas[atual].setAttribute("r", 4);
        atual = -1;
      }
    };
    const pegar = ev => {
      const r = svg.getBoundingClientRect();
      const px = (ev.clientX - r.left) * (W / r.width);
      let i = n <= 1 ? 0 : Math.round(((px - esq) / pw) * (n - 1));
      i = Math.max(0, Math.min(n - 1, i));
      mostrar(i, ev);
    };
    const mostrar = (i, ev) => {
      if (atual >= 0) bolas[atual].setAttribute("r", 4);
      atual = i;
      bolas[i].setAttribute("r", 6);
      mira.setAttribute("x1", X(i)); mira.setAttribute("x2", X(i));
      mira.setAttribute("visibility", "visible");
      const r = svg.getBoundingClientRect();
      mostrarDica({ clientX: r.left + X(i) * (r.width / W), clientY: ev.clientY != null ? Math.min(ev.clientY, r.top + Y(o.pontos[i].y) * (r.height / H)) : r.top + 20 }, o.pontos[i].dica, dono);
    };
    alvo.addEventListener("pointerdown", pegar);
    alvo.addEventListener("pointermove", ev => { if (ev.pointerType === "mouse" || ev.buttons) pegar(ev); });
    alvo.addEventListener("pointerleave", ev => { if (ev.pointerType === "mouse") esconderDica(); });
    alvo.addEventListener("keydown", ev => {
      if (ev.key === "ArrowRight" || ev.key === "ArrowLeft") {
        ev.preventDefault();
        mostrar(Math.max(0, Math.min(n - 1, (atual < 0 ? n - 1 : atual + (ev.key === "ArrowRight" ? 1 : -1)))), {});
      }
    });
    alvo.addEventListener("focus", () => mostrar(atual < 0 ? n - 1 : atual, {}));
    alvo.addEventListener("blur", esconderDica);

    caixa.appendChild(svg);
    if (o.legenda) caixa.appendChild(legenda(o.legenda));
    if (o.tabela) caixa.appendChild(tabela(o.tabela.cab, o.tabela.linhas, o.tabela.titulo));
    return caixa;
  }

  /* ── calendário de constância: uma coluna por semana, seg a dom ──
     o = { largura, semanas, hoje (Date), dia(chave)->{n, min}, chave(Date), nomeDia(Date), nomeMes(Date) } */
  function calor(o) {
    const sem = o.semanas || 18;
    const esq = 26, topo = 16, gap = 3;
    const lado = Math.max(9, Math.min(18, Math.floor((o.largura - esq) / sem) - gap));
    const W = esq + sem * (lado + gap), H = topo + 7 * (lado + gap);
    const caixa = el("div", "graf");
    const svg = s("svg", { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: "img", "aria-label": o.rotuloAcessivel || "calendário de treinos" }, null);
    svg.style.maxWidth = W + "px";
    const hoje = new Date(o.hoje.getFullYear(), o.hoje.getMonth(), o.hoje.getDate());
    const dsem = (hoje.getDay() + 6) % 7;                 /* 0 = segunda */
    const inicio = new Date(hoje); inicio.setDate(hoje.getDate() - dsem - (sem - 1) * 7);
    ["seg", "", "qua", "", "sex", "", ""].forEach((r, i) => {
      if (!r) return;
      const t = s("text", { x: 0, y: topo + i * (lado + gap) + lado - 2 }, svg);
      t.textContent = r;
    });
    let mesAnterior = -1;
    const celulas = [];
    for (let w = 0; w < sem; w++) {
      for (let d = 0; d < 7; d++) {
        const dia = new Date(inicio); dia.setDate(inicio.getDate() + w * 7 + d);
        if (dia > hoje) continue;
        if (d === 0 && dia.getMonth() !== mesAnterior) {
          if (w < sem - 1 || mesAnterior === -1) {
            const t = s("text", { x: esq + w * (lado + gap), y: 11 }, svg);
            t.textContent = o.nomeMes(dia);
          }
          mesAnterior = dia.getMonth();
        }
        const info = o.dia(o.chave(dia)) || { n: 0, min: 0 };
        const nivel = Math.min(4, info.n);
        const r = s("rect", { x: esq + w * (lado + gap), y: topo + d * (lado + gap), width: lado, height: lado, rx: 3, style: `fill:var(--q${nivel})`, class: "alvo" }, svg);
        if (+dia === +hoje) r.setAttribute("style", `fill:var(--q${nivel});stroke:var(--tinta-2);stroke-width:1.5`);
        celulas.push(r);
        const conteudo = {
          tit: o.nomeDia(dia),
          linhas: [{ valor: info.n === 0 ? "sem treino" : info.n + (info.n === 1 ? " sessão" : " sessões"), nome: info.min > 0 ? o.formatoMin(info.min) : "" }]
        };
        const dono = { limpar: () => r.classList.remove("marcado") };
        const ver = ev => { celulas.forEach(c => c.classList.remove("marcado")); r.classList.add("marcado"); mostrarDica(ev, conteudo, dono); };
        r.addEventListener("pointerdown", ver);
        r.addEventListener("pointermove", ev => { if (ev.pointerType === "mouse") ver(ev); });
        r.addEventListener("pointerleave", ev => { if (ev.pointerType === "mouse") esconderDica(); });
      }
    }
    caixa.appendChild(svg);
    const leg = el("div", "calor-leg");
    leg.appendChild(document.createTextNode("menos"));
    for (let i = 0; i <= 4; i++) { const q = el("i"); q.style.background = `var(--q${i})`; leg.appendChild(q); }
    leg.appendChild(document.createTextNode("mais sessões"));
    caixa.appendChild(leg);
    return caixa;
  }

  /* anel de progresso do botão de treino */
  function anel(fracao) {
    const svg = s("svg", { viewBox: "0 0 100 100", "aria-hidden": "true" }, null);
    s("circle", { cx: 50, cy: 50, r: 46, class: "anel-trilho" }, svg);
    const c = 2 * Math.PI * 46;
    const a = s("circle", { cx: 50, cy: 50, r: 46, class: "anel", "stroke-dasharray": c.toFixed(2), "stroke-dashoffset": (c * (1 - Math.max(0, Math.min(1, fracao)))).toFixed(2), transform: "rotate(-90 50 50)" }, svg);
    if (!(fracao > 0)) a.setAttribute("visibility", "hidden");
    svg.definir = f => {
      a.setAttribute("stroke-dashoffset", (c * (1 - Math.max(0, Math.min(1, f)))).toFixed(2));
      a.setAttribute("visibility", f > 0 ? "visible" : "hidden");
    };
    return svg;
  }

  window.Graf = { barras, linha, calor, anel, tabela, legenda, esconderDica, marcas };
})();
