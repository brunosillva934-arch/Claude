/* Leitor dos TXT baixados no gerador "Discursivas de Medicina".
   O gerador grava texto puro em 78 colunas: as provas primeiro, os espelhos no fim.
   Aqui o caminho é o inverso: desfaz a quebra de linha e remonta cada questão.
   Regra da casa: nunca perder texto. O que não for reconhecido aparece cru. */
(function (raiz) {
  "use strict";

  const LARGURA = 78;
  const REGUA = /^={20,}\s*$/;
  const DIVISOR = /^(ESPELHO DO CORRETOR|GABARITO COMENTADO|GABARITO E ESPELHO)\s+[—–-]/;
  const CAB_Q = /^QUEST[ÃA]O\s+(\d+)\s+[—–-]\s*(.*)$/;
  const CAB_E = /^(ESPELHO|GABARITO) DA QUEST[ÃA]O\s+(\d+)\s+[—–-]\s*(.*)$/;
  const ATE = /^\s*\(até\s+(\d+)\s+linhas?\)\s*$/i;
  const MOMENTO = /^\[MOMENTO\s+(\d+)\]\s*$/i;
  const EXEMPLO = /^\[EXEMPLO\b/;
  /* começos de linha que o autor quis numa linha nova, mesmo depois de uma linha cheia */
  const MARCADOR = /^(?:[-•–*]\s+|\d{1,2}[.)]\s+|\([a-z0-9]{1,3}\)\s+|[IVX]{1,4}[.)]\s+)/;
  const ROTULO = /^[A-ZÀ-Ý0-9](?:(?![.!?]\s)[^:]){0,60}:(?:\s|$)/;

  const proxima = l => String.fromCharCode(l.charCodeAt(0) + 1);
  const numero = s => { const n = parseFloat(String(s).replace(/\./g, "").replace(",", ".")); return isNaN(n) ? null : n; };

  /* Desfaz a quebra em 78 colunas. O gerador só quebra quando a próxima palavra não cabe;
     então a quebra é "mole" quando a primeira palavra da linha seguinte não caberia na anterior. */
  function desdobra(linhas) {
    const out = []; let atual = null, anterior = "";
    for (const bruta of linhas) {
      const l = String(bruta).replace(/\s+$/, ""), s = l.trim();
      if (!s) { if (atual !== null) { out.push(atual); atual = null; } if (out.length && out[out.length - 1] !== "") out.push(""); continue; }
      if (atual === null) { atual = s; anterior = l; continue; }
      const primeira = s.split(/\s+/)[0];
      const mole = anterior.length + 1 + primeira.length > LARGURA && !MARCADOR.test(s) && !ROTULO.test(s);
      if (mole) atual += " " + s; else { out.push(atual); atual = s; }
      anterior = l;
    }
    if (atual !== null) out.push(atual);
    while (out.length && out[out.length - 1] === "") out.pop();
    return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  }

  /* blocos separados por linha em branco */
  function grupos(linhas) {
    const out = []; let g = [];
    for (const l of linhas) { if (l.trim()) g.push(l); else if (g.length) { out.push(g); g = []; } }
    if (g.length) out.push(g);
    return out;
  }

  /* "A) ... B) ... C) ..." em sequência; a letra esperada evita confundir continuação com alternativa */
  function lerLetras(linhas, primeira) {
    const out = []; let esperada = primeira, atual = null;
    for (const l of linhas) {
      if (new RegExp("^" + esperada + "\\)\\s+\\S").test(l)) { atual = { l: esperada, linhas: [l] }; out.push(atual); esperada = proxima(esperada); }
      else if (atual) atual.linhas.push(l);
    }
    return out.map(a => ({ l: a.l, txt: desdobra(a.linhas).replace(/^[A-Za-z]\)\s+/, "") }));
  }

  function textoLivre(linhas, q, est) {
    let buf = [];
    const fecha = () => {
      const t = desdobra(buf); buf = [];
      if (!t) return;
      const m = q.momentos.find(x => x.n === est.mom);
      if (m) m.texto += "\n\n" + t; else q.momentos.push({ n: est.mom, texto: t });
    };
    for (const l of linhas) {
      const mm = MOMENTO.exec(l.trim());
      if (mm) { fecha(); est.mom = +mm[1]; continue; }
      buf.push(l);
    }
    fecha();
  }

  function lerQuestao(linhas, ordem) {
    const cab = CAB_Q.exec(linhas[0]) || [];
    const q = { idx: ordem, n: +cab[1] || ordem + 1, tema: (cab[2] || "").trim(), meta: [], dif: "", assunto: "", exemplo: false,
      tipo: "livre", momentos: [], itens: [], comando: "", alternativas: [], gabarito: null, espelho: null };
    let k = 1;
    /* cabeçalho: linha de parâmetros e, às vezes, o assunto da árvore */
    const topo = [];
    while (k < linhas.length && linhas[k].trim()) { topo.push(linhas[k]); k++; }
    if (topo.length && topo[0].indexOf(" · ") >= 0 && topo[0].length <= 160) {
      q.meta = topo[0].split(" · ").map(s => s.trim()).filter(Boolean);
      const ult = q.meta[q.meta.length - 1] || "";
      if (/^(dificuldade\s+\d+|aprendizagem)$/i.test(ult)) q.dif = q.meta.pop();
      const resto = topo.slice(1);
      if (resto.length && /^assunto:/i.test(resto[0])) q.assunto = desdobra(resto).replace(/^assunto:\s*/i, "").replace(/\n/g, " ");
      else if (resto.length) k = 2; /* não era cabeçalho: devolve ao corpo */
    } else k = 1;
    const corpo = linhas.slice(k);
    const est = { mom: 1 };
    const fins = []; corpo.forEach((l, i) => { if (ATE.test(l)) fins.push(i); });

    if (fins.length) {
      q.tipo = "disc";
      let ini = 0, esperada = "a";
      for (const t of fins) {
        let s = -1, qualquer = -1;
        for (let i = ini; i < t; i++) {
          const m = /^([a-z])\)\s+\S/.exec(corpo[i]);
          if (!m || (i > ini && corpo[i - 1].trim())) continue;
          if (m[1] === esperada) s = i;
          qualquer = i;
        }
        if (s < 0) s = qualquer;
        if (s < 0) s = ini;
        textoLivre(corpo.slice(ini, s), q, est);
        let comando = desdobra(corpo.slice(s, t)), letra = esperada;
        const m = /^([a-z])\)\s+/.exec(comando);
        if (m) { comando = comando.slice(m[0].length); letra = m[1]; }
        while (q.itens.some(i => i.l === letra) && letra < "z") letra = proxima(letra); /* as respostas são guardadas pela letra: não pode repetir */
        q.itens.push({ l: letra, momento: est.mom, comando, linhas: +ATE.exec(corpo[t])[1] });
        esperada = proxima(letra); ini = t + 1;
      }
      textoLivre(corpo.slice(ini), q, est);
      return q;
    }

    /* objetiva: as alternativas fecham o bloco */
    let fim = corpo.length; while (fim > 0 && !corpo[fim - 1].trim()) fim--;
    let a0 = -1;
    for (let i = fim - 1; i >= 0; i--) if (/^A\)\s+\S/.test(corpo[i]) && (i === 0 || !corpo[i - 1].trim())) { a0 = i; break; }
    const alts = a0 >= 0 ? lerLetras(corpo.slice(a0, fim), "A") : [];
    if (alts.length >= 2) {
      q.tipo = "obj"; q.alternativas = alts;
      textoLivre(corpo.slice(0, a0), q, est);
      const ult = q.momentos[q.momentos.length - 1];
      if (ult) { const ps = ult.texto.split("\n\n"); q.comando = ps.pop(); ult.texto = ps.join("\n\n"); }
      q.momentos = q.momentos.filter(m => m.texto);
      return q;
    }

    /* nada reconhecido: o texto inteiro, com uma caixa de resposta */
    textoLivre(corpo, q, est);
    q.itens = [{ l: "a", momento: est.mom, comando: "", linhas: 0 }];
    return q;
  }

  const ROTULOS = [["ponte", /^Ponte clínica:\s*/i], ["anti", /^Contra a resposta decorada:\s*/i], ["conferir", /^Para conferência humana:\s*/i], ["fonte", /^Fonte:\s*/i]];

  function lerValidacao(grupo, e) {
    const ents = []; let atual = null;
    for (const l of grupo) {
      if (/^(veredito|motivo|candidatos simulados|notas do revisor[^:]*):/i.test(l) || /^\s+-\s+\[/.test(l)) { atual = [l]; ents.push(atual); }
      else if (atual) atual.push(l); else { atual = [l]; ents.push(atual); }
    }
    for (const en of ents) {
      const t = desdobra(en).replace(/\n/g, " ");
      const v = /^veredito:\s*(.*)$/i.exec(t);
      if (v) e.veredito = v[1].trim(); else if (t) e.validacao.push(t.replace(/^-\s+/, ""));
    }
  }

  function lerItemEspelho(grupo) {
    const m = /^([a-z])\)\s*(.*)$/.exec(grupo[0]);
    const it = { l: m[1], etapa: m[2].trim(), max: "", q: [], alt: "", graves: [], extra: "" };
    let atual = { tipo: "max", linhas: [] }; const ents = [atual];
    for (const l of grupo.slice(1)) {
      const s = l.trim();
      if (/^\[\d+(?:[.,]\d+)?\]\s/.test(s)) ents.push(atual = { tipo: "q", linhas: [l] });
      else if (/^Aceito também:/i.test(s)) ents.push(atual = { tipo: "alt", linhas: [l] });
      else if (/^ERRO GRAVE\b/i.test(s)) ents.push(atual = { tipo: "grave", linhas: [l] });
      else atual.linhas.push(l);
    }
    for (const en of ents) {
      const t = desdobra(en.linhas);
      if (!t) continue;
      if (en.tipo === "max") it.max = t;
      else if (en.tipo === "alt") it.alt = t.replace(/^Aceito também:\s*/i, "").replace(/\n/g, " ");
      else if (en.tipo === "q") {
        const mq = /^\[(\d+(?:[.,]\d+)?)\]\s+([\s\S]*)$/.exec(t);
        let txt = mq[2].replace(/\n/g, " "), just = false;
        const mj = /\s+—\s+exige (?:justificativa com dados do caso|explicar o porquê)\s*$/i.exec(txt);
        if (mj) { just = true; txt = txt.slice(0, mj.index); }
        it.q.push({ pts: numero(mq[1]) || 0, txt, just });
      } else {
        const mg = /^ERRO GRAVE\s*(?:\(([^)]*)\))?:?\s*([\s\S]*)$/i.exec(t.replace(/\n/g, " "));
        let corpo = mg[2], pen = "";
        const mp = /\s*\[([^\]]*)\]\s*$/.exec(corpo);
        if (mp) { pen = mp[1]; corpo = corpo.slice(0, mp.index); }
        const c = corpo.indexOf(" -> ");
        it.graves.push({ tipo: (mg[1] || "").trim(), erro: c < 0 ? corpo : corpo.slice(0, c), cons: c < 0 ? "" : corpo.slice(c + 4), pen: pen || "zera o item" });
      }
    }
    return it;
  }

  function lerEspelho(linhas) {
    const cab = CAB_E.exec(linhas[0]);
    const e = { n: +cab[2], tipo: cab[1] === "GABARITO" ? "obj" : "disc", tema: "", pontos: null, gabarito: null, veredito: "", validacao: [],
      ponte: "", anti: "", conferir: "", fonte: "", itens: [], comentarios: [], extra: "", bruto: linhas.join("\n").trim() };
    if (e.tipo === "obj") { const g = /:\s*([A-Z?])\s*$/.exec(cab[3]); if (g && g[1] !== "?") e.gabarito = g[1]; e.tema = cab[3].replace(/:\s*[A-Z?]\s*$/, "").trim(); }
    else { const p = /\s*·\s*([\d.,]+)\s*pontos?\s*$/i.exec(cab[3]); if (p) e.pontos = numero(p[1]); e.tema = (p ? cab[3].slice(0, p.index) : cab[3]).trim(); }
    let k = 1; const topo = [];
    while (k < linhas.length && linhas[k].trim()) { topo.push(linhas[k]); k++; }
    lerValidacao(topo, e);
    for (const g of grupos(linhas.slice(k))) {
      const rot = ROTULOS.find(r => r[1].test(g[0]));
      if (rot) { e[rot[0]] = desdobra(g).replace(rot[1], ""); continue; }
      if (e.tipo === "disc" && /^[a-z]\)(\s|$)/.test(g[0]) && (g.length === 1 || /^\s+\S/.test(g[1]))) { e.itens.push(lerItemEspelho(g)); continue; }
      if (e.tipo === "obj" && !e.comentarios.length && /^A\)\s+\S/.test(g[0])) {
        e.comentarios = lerLetras(g, "A").map(a => {
          let por = a.txt.replace(/\n/g, " "), grave = "", ok = false;
          const mg = /\s*\[erro grave:\s*([^\]]*)\]\s*$/i.exec(por);
          if (mg) { grave = mg[1].trim(); por = por.slice(0, mg.index); }
          if (/^CORRETA\.?\s*/.test(por)) { ok = true; por = por.replace(/^CORRETA\.?\s*/, ""); }
          return { l: a.l, ok, por, grave };
        });
        if (!e.gabarito) { const c = e.comentarios.find(x => x.ok); if (c) e.gabarito = c.l; }
        continue;
      }
      /* sobra: fica junto do último item, ou no pé do espelho */
      const t = desdobra(g), ult = e.itens[e.itens.length - 1];
      if (e.tipo === "disc" && ult && !e.anti && !e.conferir && !e.fonte) ult.extra += (ult.extra ? "\n\n" : "") + t;
      else e.extra += (e.extra ? "\n\n" : "") + t;
    }
    return e;
  }

  function aparar(linhas) {
    let fim = linhas.length;
    while (fim > 0 && (!linhas[fim - 1].trim() || REGUA.test(linhas[fim - 1]) || EXEMPLO.test(linhas[fim - 1]))) fim--;
    return linhas.slice(0, fim);
  }

  function lerPacote(bruto) {
    const texto = String(bruto == null ? "" : bruto).replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
    const L = texto.split("\n");
    const out = { titulo: "", data: "", questoes: [], reconhecido: true };
    let i = 0; while (i < L.length && !L[i].trim()) i++;
    if (REGUA.test(L[i] || "")) {
      let j = i + 1; const cab = [];
      while (j < L.length && j < i + 8 && !REGUA.test(L[j])) { cab.push(L[j]); j++; }
      if (REGUA.test(L[j] || "")) {
        for (const c of cab) { const d = /^gerado em\s+(\S+)/i.exec(c.trim()); if (d) out.data = d[1]; else if (c.trim()) out.titulo += (out.titulo ? " " : "") + c.trim(); }
        i = j + 1;
      }
    }
    let corte = L.length;
    for (let k = i; k < L.length; k++) if (DIVISOR.test(L[k]) || CAB_E.test(L[k])) { corte = k; break; }

    const ini = [];
    for (let k = i; k < corte; k++) if (CAB_Q.test(L[k]) && (k === 0 || !L[k - 1].trim() || REGUA.test(L[k - 1]))) ini.push(k);
    ini.forEach((k, n) => {
      const q = lerQuestao(aparar(L.slice(k, n + 1 < ini.length ? ini[n + 1] : corte)), n);
      for (let b = k - 1; b >= Math.max(i, k - 3); b--) { if (EXEMPLO.test(L[b])) q.exemplo = true; if (L[b].trim()) break; }
      out.questoes.push(q);
    });

    const esp = [];
    for (let k = corte; k < L.length; k++) if (CAB_E.test(L[k])) esp.push(k);
    const gab = {};
    for (let k = corte; k < (esp.length ? esp[0] : L.length); k++) {
      if (!/^Gabarito das objetivas:/i.test(L[k])) continue;
      const fim = L.slice(k).findIndex(l => !l.trim()), bloco = L.slice(k, fim < 0 ? L.length : k + fim).join(" ");
      bloco.replace(/(\d+)\s*-\s*([A-Z])\b/g, (_, n, l) => { gab[+n] = l; return ""; });
    }
    esp.forEach((k, n) => {
      const e = lerEspelho(aparar(L.slice(k, n + 1 < esp.length ? esp[n + 1] : L.length)));
      const q = out.questoes.find(x => x.n === e.n && !x.espelho);
      if (q) q.espelho = e;
    });
    for (const q of out.questoes) {
      if (q.tipo !== "obj") continue;
      q.gabarito = (q.espelho && q.espelho.gabarito) || gab[q.n] || null;
    }

    if (!out.questoes.length) {
      out.reconhecido = false;
      const corpo = desdobra(L.slice(i));
      if (corpo) out.questoes.push({ idx: 0, n: 1, tema: out.titulo || "Texto importado", meta: [], dif: "", assunto: "", exemplo: false, tipo: "livre",
        momentos: [{ n: 1, texto: corpo }], itens: [{ l: "a", momento: 1, comando: "", linhas: 0 }], comando: "", alternativas: [], gabarito: null, espelho: null });
    }
    return out;
  }

  /* identidade do arquivo: o mesmo TXT importado duas vezes cai no mesmo lugar */
  function impressao(texto) {
    const t = String(texto).replace(/\r\n?/g, "\n").trim();
    let a = 0x811c9dc5, b = 0x1b873593;
    for (let i = 0; i < t.length; i++) { const c = t.charCodeAt(i); a = Math.imul(a ^ c, 0x01000193); b = Math.imul(b ^ (c + i), 0x85ebca6b); b ^= b >>> 13; }
    const hex = n => ("0000000" + (n >>> 0).toString(16)).slice(-8);
    return hex(a) + hex(b);
  }

  const api = { lerPacote, desdobra, impressao };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else raiz.Leitor = api;
})(typeof window !== "undefined" ? window : globalThis);
