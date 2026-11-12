/* Discursivas · treino — responde no celular os TXT baixados no gerador.
   Sem rede: tudo o que se lê vem do arquivo, tudo o que se escreve fica no aparelho.
   O texto do TXT entra na página sempre como texto, nunca como HTML. */
(function () {
  "use strict";
  const A = window.Android || null;          /* ponte do app; no navegador, cai no localStorage */
  const Leitor = window.Leitor;
  const NS = "http://www.w3.org/2000/svg";

  /* ── guarda ─────────────────────────────────── */
  const Arm = {
    ler(k) { try { const v = A ? A.ler(k) : localStorage.getItem("dt-" + k); return v ? JSON.parse(v) : null; } catch (e) { return null; } },
    guardar(k, v) { try { const s = JSON.stringify(v); if (A) return !!A.guardar(k, s); localStorage.setItem("dt-" + k, s); return true; } catch (e) { return false; } },
    apagar(k) { try { if (A) A.apagar(k); else localStorage.removeItem("dt-" + k); } catch (e) { /* nada a fazer */ } }
  };

  /* ── estado ─────────────────────────────────── */
  const PADRAO = { tema: "auto", tam: "m", relogio: true, foco: false };
  const E = { tela: "biblioteca", indice: [], arq: null, qi: 0, passo: 0, enun: true, prefs: Object.assign({}, PADRAO) };
  window.__E = E;

  /* ── utilidades ─────────────────────────────── */
  function el(tag, attrs) {
    const partes = tag.split("."), n = document.createElement(partes[0] || "div");
    if (partes.length > 1) n.className = partes.slice(1).join(" ");
    if (attrs) for (const k in attrs) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k.slice(0, 2) === "on") n.addEventListener(k.slice(2), v);
      else if (k === "dataset") Object.assign(n.dataset, v);
      else if (k === "disabled" || k === "checked" || k === "value" || k === "hidden") n[k] = v;
      else n.setAttribute(k, v === true ? "" : String(v));
    }
    for (let i = 2; i < arguments.length; i++) junta(n, arguments[i]);
    return n;
  }
  function junta(n, f) {
    if (f == null || f === false) return;
    if (Array.isArray(f)) { for (const x of f) junta(n, x); return; }
    n.appendChild(f.nodeType ? f : document.createTextNode(String(f)));
  }
  const ICONES = {
    voltar: "M15 5l-7 7 7 7", avancar: "M9 5l7 7-7 7", mais: "M12 5v14M5 12h14", fechar: "M6 6l12 12M18 6L6 18",
    certo: "M5 12.5l4.5 4.5L19 7.5",
    ajustes: "M4 7h8M17 7h3M4 17h3M12 17h8M14.5 7m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0M9.5 17m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0",
    foco: "M4 9V5h4M16 5h4v4M20 15v4h-4M8 19H4v-4M12 12m-2.4 0a2.4 2.4 0 1 0 4.8 0a2.4 2.4 0 1 0 -4.8 0",
    lixo: "M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12", enviar: "M12 15V4M8 7.5L12 4l4 3.5M5 13v6h14v-6",
    menu: "M12 6h.01M12 12h.01M12 18h.01", copiar: "M9 9h10v11H9zM5 15V4h10", salvar: "M12 4v11M8 11.5l4 3.5 4-3.5M5 19h14"
  };
  function ico(nome, tam) {
    const s = document.createElementNS(NS, "svg"), p = document.createElementNS(NS, "path");
    s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("width", tam || 22); s.setAttribute("height", tam || 22);
    s.setAttribute("fill", "none"); s.setAttribute("stroke", "currentColor"); s.setAttribute("stroke-width", nome === "menu" ? "2.8" : "1.8");
    s.setAttribute("stroke-linecap", "round"); s.setAttribute("stroke-linejoin", "round"); s.setAttribute("aria-hidden", "true");
    p.setAttribute("d", ICONES[nome]); s.appendChild(p);
    return s;
  }
  const botaoIcone = (nome, rotulo, acao, extra) => el("button.icone-b", Object.assign({ type: "button", "aria-label": rotulo, onclick: acao }, extra || {}), ico(nome));
  const fmt = n => String(Math.round((Number(n) || 0) * 100) / 100).replace(".", ",");
  const plural = (n, um, varios) => n + " " + (n === 1 ? um : varios);
  const hoje = () => { const d = new Date(), z = x => ("0" + x).slice(-2); return d.getFullYear() + "-" + z(d.getMonth() + 1) + "-" + z(d.getDate()); };
  function tempoTxt(s) { s = Math.max(0, Math.floor(s || 0)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), z = x => ("0" + x).slice(-2); return (h ? h + ":" + z(m) : m) + ":" + z(s % 60); }
  const paragrafos = (texto, tag) => String(texto || "").split(/\n{2,}/).filter(Boolean).map(p => el(tag, null, p));
  let avisoT = null;
  function aviso(txt) { const n = document.getElementById("aviso"); n.textContent = txt; n.dataset.on = "1"; clearTimeout(avisoT); avisoT = setTimeout(() => { n.dataset.on = "0"; }, 2600); }
  const tentar = f => { try { f(); } catch (e) { aviso("Isso não funcionou neste aparelho."); } };
  function crescer(ta) { ta.style.height = "auto"; ta.style.height = ta.scrollHeight + 2 + "px"; }
  function ajustarCaixas() { document.querySelectorAll("textarea.resposta, textarea.just").forEach(crescer); }

  /* ── respostas ──────────────────────────────── */
  const qAtual = () => E.arq.pacote.questoes[E.qi];
  const olhar = (resp, i) => (resp && resp.q && resp.q[i]) || null;
  function respDe(i) {
    const R = E.arq.resp; if (!R.q) R.q = {};
    const r = R.q[i] || (R.q[i] = {});
    for (const k of ["itens", "just", "auto", "bate"]) if (!r[k] || typeof r[k] !== "object") r[k] = {};
    if (!Array.isArray(r.tent)) r.tent = [];
    if (!r.tempo) r.tempo = 0;
    return r;
  }
  const algum = o => Object.keys(o || {}).some(k => o[k] && String(o[k]).trim());
  const temRascunho = r => !!r && (algum(r.itens) || algum(r.just) || !!r.marcada || (r.tent || []).length > 0);
  function notaDisc(q, r) {
    const esp = q.espelho;
    if (!esp || !esp.itens.length) return null;
    let total = 0, max = 0, feitos = 0, n = 0, zeraTudo = false; const porItem = {};
    for (const it of esp.itens) {
      const a = (r.auto || {})[it.l] || {}; let s = 0, m = 0;
      it.q.forEach((x, k) => { m += x.pts; n++; const f = (a.q || [])[k]; if (f != null) { feitos++; s += x.pts * f; } });
      it.graves.forEach((g, k) => { if ((a.g || [])[k]) { s = 0; if (/quest/i.test(g.pen)) zeraTudo = true; } });
      porItem[it.l] = { valor: s, max: m }; total += s; max += m;
    }
    if (zeraTudo) { total = 0; for (const k in porItem) porItem[k].valor = 0; }
    return { total, max, feitos, n, porItem };
  }
  function notaDe(q, r) {
    if (!r || !r.entregue) return null;
    if (q.tipo === "obj") return r.nota == null ? null : { valor: r.nota, max: 10, completa: true };
    const n = notaDisc(q, r);
    return n && n.n ? { valor: n.total, max: n.max, completa: n.feitos === n.n } : null;
  }
  function estadoDe(q, r) {
    if (r && r.entregue) { const n = notaDe(q, r); return { k: "entregue", txt: !n ? "entregue" : n.completa ? fmt(n.valor) + " / " + fmt(n.max) : "falta corrigir" }; }
    return temRascunho(r) ? { k: "rascunho", txt: "rascunho" } : { k: "branco", txt: "em branco" };
  }
  function resumoDe(pacote, resp) {
    let entregues = 0, rasc = 0, soma = 0, comNota = 0;
    pacote.questoes.forEach((q, i) => {
      const r = olhar(resp, i); if (!r) return;
      if (r.entregue) { entregues++; const n = notaDe(q, r); if (n && n.completa && n.max) { soma += n.valor / n.max * 10; comNota++; } }
      else if (temRascunho(r)) rasc++;
    });
    return { n: pacote.questoes.length, entregues, rasc, media: comNota ? soma / comNota : null };
  }
  function textoResumo(s) {
    if (!s) return "ainda não aberto";
    const p = [];
    p.push(s.entregues ? s.entregues + " de " + s.n + " entregues" : "nenhuma entregue");
    if (s.rasc) p.push(s.rasc + " em rascunho");
    if (s.media != null) p.push("média " + fmt(Math.round(s.media * 10) / 10));
    return p.join(" · ");
  }

  let sujoT = null;
  function sujo() { clearTimeout(sujoT); sujoT = setTimeout(gravar, 450); }
  function gravar() {
    clearTimeout(sujoT); sujoT = null;
    if (!E.arq) return;
    if (!Arm.guardar("resp-" + E.arq.id, E.arq.resp)) { aviso("Não consegui salvar. Confira o espaço livre do aparelho."); return; }
    const ent = E.indice.find(x => x.id === E.arq.id);
    if (ent) { const novo = resumoDe(E.arq.pacote, E.arq.resp); if (JSON.stringify(novo) !== JSON.stringify(ent.resumo)) { ent.resumo = novo; Arm.guardar("indice", E.indice); } }
  }
  const guardarPrefs = () => Arm.guardar("prefs", E.prefs);
  const guardarLugar = () => Arm.guardar("onde", { tela: E.tela, id: E.arq ? E.arq.id : null, qi: E.qi });

  /* ── tema e barras do sistema ───────────────── */
  function aplicarTema() {
    const p = E.prefs.tema;
    let escuro = p === "escuro";
    if (p === "auto") { try { escuro = A ? !!A.escuro() : matchMedia("(prefers-color-scheme: dark)").matches; } catch (e) { escuro = false; } }
    document.documentElement.dataset.theme = escuro ? "dark" : "light";
    document.documentElement.dataset.tam = E.prefs.tam;
    barras();
  }
  let telaAcesa = null;
  function barras() {
    if (!A) return;
    try {
      const foco = document.body.classList.contains("foco");
      const cor = getComputedStyle(document.documentElement).getPropertyValue(foco ? "--paper" : "--surface").trim();
      A.barras(cor, document.documentElement.dataset.theme !== "dark");
      const acesa = E.tela === "questao" && !!E.prefs.foco;
      if (acesa !== telaAcesa) { telaAcesa = acesa; A.telaLigada(acesa); }
    } catch (e) { /* aparelho antigo: segue sem pintar as barras */ }
  }

  /* ── cronômetro ─────────────────────────────── */
  let tique = null;
  function relogio() {
    clearInterval(tique); tique = null;
    if (E.tela !== "questao" || !E.arq) return;
    const r = respDe(E.qi);
    if (r.entregue) return;
    tique = setInterval(() => {
      if (document.hidden) return;
      r.tempo = (r.tempo || 0) + 1;
      const n = document.getElementById("relogio"); if (n) n.textContent = tempoTxt(r.tempo);
      if (r.tempo % 20 === 0 && temRascunho(r)) sujo();
    }, 1000);
  }

  /* ── navegação ──────────────────────────────── */
  function desenhar(manter) {
    const y = window.scrollY, app = document.getElementById("app");
    document.body.classList.toggle("foco", E.tela === "questao" && !!E.prefs.foco);
    const novo = E.tela === "arquivo" ? telaArquivo() : E.tela === "questao" ? telaQuestao() : telaBiblioteca();
    while (app.firstChild) app.removeChild(app.firstChild);
    app.appendChild(novo);
    ajustarCaixas();
    window.scrollTo(0, manter ? y : 0);
    barras(); relogio();
    const atual = document.querySelector(".faixa [aria-current='true']");
    if (atual && atual.scrollIntoView) atual.scrollIntoView({ block: "nearest", inline: "center" });
  }
  function ir(tela, manter) { gravar(); E.tela = tela; if (tela === "biblioteca") E.arq = null; guardarLugar(); desenhar(manter); }
  function abrirArquivo(id, qi) {
    const ent = E.indice.find(x => x.id === id), texto = Arm.ler("txt-" + id);
    if (!ent || typeof texto !== "string") { aviso("Não achei mais esse arquivo no aparelho."); return false; }
    gravar();
    const pacote = Leitor.lerPacote(texto);
    E.arq = { id, ent, pacote, resp: Arm.ler("resp-" + id) || { q: {} } };
    if (qi != null && pacote.questoes[qi]) { E.qi = qi; E.tela = "questao"; primeiroPasso(); } else { E.qi = 0; E.tela = "arquivo"; }
    guardarLugar(); desenhar();
    return true;
  }
  function primeiroPasso() {
    const q = qAtual(), r = respDe(E.qi);
    const k = q.itens.findIndex(i => !(r.itens[i.l] || "").trim());
    E.passo = k < 0 ? Math.max(0, q.itens.length - 1) : k;
    E.enun = !temRascunho(r);
  }
  function irQuestao(i) { gravar(); E.qi = i; E.tela = "questao"; primeiroPasso(); guardarLugar(); desenhar(); }
  function proximaAberta() {
    const P = E.arq.pacote, n = P.questoes.length;
    for (let d = 0; d < n; d++) { const i = d; const r = olhar(E.arq.resp, i); if (!r || !r.entregue) return i; }
    return -1;
  }
  function alternarFoco() { E.prefs.foco = !E.prefs.foco; guardarPrefs(); if (E.tela === "questao") primeiroPasso(); desenhar(); if (E.tela === "questao") aviso(E.prefs.foco ? "Modo foco: uma caixa por vez." : "Modo foco desligado."); }

  /* ── importar ───────────────────────────────── */
  function pareceBinario(t) {
    const amostra = t.slice(0, 4000); let ruins = 0;
    for (let i = 0; i < amostra.length; i++) { const c = amostra.charCodeAt(i); if (c === 0xFFFD || (c < 32 && c !== 9 && c !== 10 && c !== 13)) ruins++; }
    return ruins > amostra.length * 0.02;
  }
  function importar(lista) {
    let novos = 0, repetidos = 0, ruins = 0, cheio = false, ultimo = null;
    for (const a of lista || []) {
      const texto = String((a && a.texto) || "");
      if (!texto.trim() || pareceBinario(texto)) { ruins++; continue; }
      const id = Leitor.impressao(texto);
      if (E.indice.some(x => x.id === id)) { repetidos++; ultimo = id; continue; }
      const p = Leitor.lerPacote(texto);
      if (!p.questoes.length) { ruins++; continue; }
      if (!Arm.guardar("txt-" + id, texto)) { cheio = true; break; }
      const nome = String(a.nome || "").replace(/\.txt$/i, "");
      E.indice.unshift({ id, nome, titulo: maiuscula(p.titulo || nome || "Questões"), data: p.data || "", n: p.questoes.length,
        disc: p.questoes.filter(q => q.tipo !== "obj").length, obj: p.questoes.filter(q => q.tipo === "obj").length,
        detalhe: p.questoes.length === 1 ? p.questoes[0].dif || "" : "", quando: Date.now(), reconhecido: p.reconhecido, resumo: null });
      novos++; ultimo = id;
    }
    if (novos) Arm.guardar("indice", E.indice);
    if (cheio) aviso("Sem espaço para guardar o arquivo.");
    else if (ruins && !novos && !repetidos) aviso(ruins === 1 ? "Esse arquivo não é um TXT de questões." : "Esses arquivos não são TXT de questões.");
    else if (novos + repetidos === 1 && ultimo) { if (repetidos) aviso("Esse arquivo já estava aqui."); abrirArquivo(ultimo); return; }
    else if (novos || repetidos) aviso([novos ? plural(novos, "arquivo importado", "arquivos importados") : "", repetidos ? plural(repetidos, "já estava aqui", "já estavam aqui") : "", ruins ? plural(ruins, "ignorado", "ignorados") : ""].filter(Boolean).join(" · "));
    if (E.tela === "biblioteca") desenhar();
  }
  function escolherArquivos() {
    if (A) { try { A.escolher(); } catch (e) { aviso("Não consegui abrir os arquivos do aparelho."); } return; }
    document.getElementById("seletor").click();
  }
  window.__chegou = function () { try { importar(JSON.parse(A.pendentes() || "[]")); } catch (e) { aviso("Não consegui ler o arquivo."); } };
  function removerArquivo(id) {
    Arm.apagar("txt-" + id); Arm.apagar("resp-" + id);
    E.indice = E.indice.filter(x => x.id !== id); Arm.guardar("indice", E.indice);
    E.arq = null; E.tela = "biblioteca"; guardarLugar(); desenhar(); aviso("Arquivo removido.");
  }

  /* ── folhas (o que sobe de baixo) ───────────── */
  function fecharFolha() { const a = document.getElementById("veu-ancora"); while (a.firstChild) a.removeChild(a.firstChild); }
  const folhaAberta = () => !!document.getElementById("veu-ancora").firstChild;
  function abrirFolha(conteudo) {
    fecharFolha();
    const veu = el("div.veu", { onclick: ev => { if (ev.target === veu) fecharFolha(); } }, el("div.folha", { role: "dialog", "aria-modal": "true" }, conteudo));
    document.getElementById("veu-ancora").appendChild(veu);
    return veu;
  }
  function confirmar(titulo, texto, rotulo, acao, perigo) {
    abrirFolha([el("h2", null, titulo), texto ? el("p", null, texto) : null,
      el("div.linha-acoes", null, el("button.botao", { type: "button", onclick: fecharFolha }, "Cancelar"),
        el("button.botao." + (perigo ? "perigo" : "principal"), { type: "button", id: "bt-sim", onclick: () => { fecharFolha(); acao(); } }, rotulo))]);
  }
  function segmento(opcoes, atual, aoEscolher, larga) {
    const seg = el("div.seg" + (larga ? ".larga" : ""), { role: "group" });
    opcoes.forEach(o => seg.appendChild(el("button", { type: "button", "aria-pressed": String(o[0] === atual), onclick: () => { [].forEach.call(seg.children, (b, j) => b.setAttribute("aria-pressed", String(opcoes[j][0] === o[0]))); aoEscolher(o[0]); } }, o[1])));
    return seg;
  }
  function abrirAjustes() {
    abrirFolha([el("h2", null, "Ajustes"),
      el("div.ajuste", null, el("span", null, "Tema"), segmento([["auto", "Do aparelho"], ["claro", "Claro"], ["escuro", "Escuro"]], E.prefs.tema, v => { E.prefs.tema = v; guardarPrefs(); aplicarTema(); }, true)),
      el("div.ajuste", null, el("span", null, "Tamanho do texto"), segmento([["p", "Menor"], ["m", "Normal"], ["g", "Maior"]], E.prefs.tam, v => { E.prefs.tam = v; guardarPrefs(); aplicarTema(); ajustarCaixas(); }, true)),
      el("div.ajuste", null, el("span", null, "Cronômetro por questão"), segmento([[true, "Mostrar"], [false, "Esconder"]], E.prefs.relogio, v => { E.prefs.relogio = v; guardarPrefs(); const n = document.getElementById("relogio"); if (n) n.hidden = !v; }, true)),
      el("p.miudo", null, "Funciona sem internet. As questões e as suas respostas ficam só neste aparelho" + (A ? " · versão " + versao() : "") + "."),
      el("div.linha-acoes", null, el("button.botao.principal", { type: "button", onclick: fecharFolha }, "Pronto"))]);
  }
  function versao() { try { return A.versao(); } catch (e) { return ""; } }
  function abrirColar() {
    const ta = el("textarea", { placeholder: "Cole aqui o conteúdo do TXT", "aria-label": "Conteúdo do TXT" });
    abrirFolha([el("h2", null, "Colar o texto"), el("p", null, "Serve quando o arquivo não aparece na lista: abra o TXT em qualquer app, copie tudo e cole aqui."), ta,
      el("div.linha-acoes", null, el("button.botao", { type: "button", onclick: fecharFolha }, "Cancelar"),
        el("button.botao.principal", { type: "button", id: "bt-colar", onclick: () => { const t = ta.value; if (!t.trim()) { aviso("Cole o texto primeiro."); return; } fecharFolha(); importar([{ nome: "colado em " + hoje(), texto: t }]); } }, "Importar"))]);
  }
  function abrirMenuArquivo() {
    const a = E.arq, nome = (a.ent.titulo || "respostas").replace(/[^\wÀ-ÿ]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "respostas";
    const linhas = [el("h2", null, "Este arquivo")];
    const texto = () => { gravar(); return textoRespostas(a); };
    if (A) {
      linhas.push(el("button.opcao", { type: "button", onclick: () => { fecharFolha(); tentar(() => A.compartilhar(a.ent.titulo || "Minhas respostas", texto())); } }, ico("enviar"), "Compartilhar minhas respostas"));
      linhas.push(el("button.opcao", { type: "button", onclick: () => { fecharFolha(); tentar(() => A.salvarComo(nome + "-respostas.txt", texto())); } }, ico("salvar"), "Salvar minhas respostas em TXT"));
      linhas.push(el("button.opcao", { type: "button", onclick: () => { fecharFolha(); tentar(() => A.copiar(texto())); } }, ico("copiar"), "Copiar minhas respostas"));
    } else linhas.push(el("button.opcao", { type: "button", id: "bt-exportar", onclick: () => { fecharFolha(); baixarNoNavegador(nome + "-respostas.txt", texto()); } }, ico("salvar"), "Baixar minhas respostas em TXT"));
    linhas.push(el("button.opcao.perigo", { type: "button", id: "bt-remover", onclick: () => confirmar("Remover este arquivo?", "As questões e tudo o que você respondeu nele saem do aparelho.", "Remover", () => removerArquivo(a.id), true) }, ico("lixo"), "Remover do aparelho"));
    abrirFolha(linhas);
  }
  function baixarNoNavegador(nome, texto) {
    window.__exportado = texto;
    try { const u = URL.createObjectURL(new Blob([texto], { type: "text/plain" })), l = el("a", { href: u, download: nome }); document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(u), 2000); } catch (e) { aviso("Não deu para baixar aqui."); }
  }

  /* ── exportar o que foi respondido ──────────── */
  function textoRespostas(a) {
    const REG = "=".repeat(60), L = [REG, (a.ent.titulo || "Questões") + " — minhas respostas", "exportado em " + hoje(), REG, ""];
    a.pacote.questoes.forEach((q, i) => {
      const r = olhar(a.resp, i) || {}, it = r.itens || {}, ju = r.just || {};
      L.push("QUESTÃO " + q.n + " — " + q.tema);
      const meta = q.meta.concat(q.dif ? [q.dif] : []).join(" · "); if (meta) L.push(meta);
      L.push("");
      q.momentos.forEach(m => { if (q.momentos.length > 1) L.push("[MOMENTO " + m.n + "]"); L.push(m.texto, ""); });
      if (q.tipo === "obj") {
        if (q.comando) L.push(q.comando, "");
        q.alternativas.forEach(x => { L.push(x.l + ") " + x.txt); if ((ju[x.l] || "").trim()) L.push("   minha justificativa: " + ju[x.l].trim()); });
        const antes = (r.tent || []).filter(l => l !== r.marcada);
        L.push("", "MARQUEI: " + (r.marcada || "—") + (antes.length ? " (antes: " + antes.join(", ") + ")" : "") + (r.entregue && q.gabarito ? " · gabarito " + q.gabarito : ""));
      } else q.itens.forEach(x => { L.push((q.tipo === "livre" && !x.comando ? "RESPOSTA" : x.l + ") " + x.comando), (q.tipo === "livre" && !x.comando ? "" : "RESPOSTA: ") + ((it[x.l] || "").trim() || "(em branco)"), ""); });
      const n = notaDe(q, r);
      if (n) L.push((q.tipo === "obj" ? "NOTA: " : n.completa ? "AUTOAVALIAÇÃO: " : "AUTOAVALIAÇÃO (incompleta): ") + fmt(n.valor) + " de " + fmt(n.max));
      if (r.tempo) L.push("tempo: " + tempoTxt(r.tempo));
      L.push("", REG, "");
    });
    return L.join("\n").replace(/\n{3,}/g, "\n\n");
  }

  /* ── tela: biblioteca ───────────────────────── */
  function telaBiblioteca() {
    const f = document.createDocumentFragment();
    f.appendChild(el("header.topo", null, el("div.marca", null, "Discursivas ", el("em", null, "treino")), el("span.cresce"), botaoIcone("ajustes", "Ajustes", abrirAjustes)));
    const m = el("main.miolo");
    if (!E.indice.length) {
      m.appendChild(el("section.vazio", null,
        el("p.sobre", null, "Sem internet · tudo fica no aparelho"),
        el("h1", null, "Responda aqui as questões que você baixou"),
        el("p.apoio", null, "Cada item ganha a sua caixa de resposta. O espelho fica lacrado até você entregar; depois é você quem confere, quesito por quesito."),
        el("div.linha-acoes", null, el("button.botao.principal", { type: "button", id: "bt-importar", onclick: escolherArquivos }, ico("mais", 20), "Importar TXT"),
          el("button.botao", { type: "button", id: "bt-exemplo", onclick: () => importar([{ nome: "exemplo", texto: window.EXEMPLO_TXT || "" }]) }, "Ver um exemplo")),
        el("ol.passos-ajuda", null,
          el("li", null, "No gerador, monte a sessão e toque em baixar: vem um TXT com as questões e os espelhos."),
          el("li", null, "Aqui, toque em Importar TXT e escolha o arquivo na pasta de downloads. Pode escolher vários."),
          el("li", null, "Também funciona pelo gerenciador de arquivos: abra o TXT e escolha este app.")),
        el("button.botao.leve", { type: "button", id: "bt-abrir-colar", onclick: abrirColar }, "O arquivo não aparece? Colar o texto")));
    } else {
      m.appendChild(el("div.cabeca-lista", null, el("h1", null, "Seus arquivos"), el("span.cresce"), el("button.botao.principal", { type: "button", id: "bt-importar", onclick: escolherArquivos }, ico("mais", 20), "Importar")));
      const lista = el("div.lista");
      E.indice.forEach(a => {
        const s = a.resumo, pe = s ? s.entregues / s.n * 100 : 0, pr = s ? s.rasc / s.n * 100 : 0;
        const tipos = [a.disc ? plural(a.disc, "discursiva", "discursivas") : "", a.obj ? plural(a.obj, "objetiva", "objetivas") : ""].filter(Boolean).join(" · ");
        lista.appendChild(el("button.cartao", { type: "button", dataset: { id: a.id }, onclick: () => abrirArquivo(a.id) },
          el("div.titulo", null, a.titulo), el("div.sub.mono", null, [a.data, tipos, a.detalhe].filter(Boolean).join(" · ")),
          a.nome && a.nome.toLowerCase() !== String(a.titulo).toLowerCase() ? el("div.sub.mono.arquivo", null, a.nome) : null,
          el("div.progresso", null, el("i", { style: "width:" + pe + "%" }), el("i.r", { style: "width:" + pr + "%" })),
          el("div.estado", null, textoResumo(s))));
      });
      m.appendChild(lista);
      m.appendChild(el("div.linha-acoes", { style: "margin-top:18px" }, el("button.botao.leve", { type: "button", id: "bt-abrir-colar", onclick: abrirColar }, "Colar o texto de um TXT")));
    }
    f.appendChild(m);
    return f;
  }

  /* ── tela: arquivo ──────────────────────────── */
  const maiuscula = t => { t = String(t || ""); return t.charAt(0).toUpperCase() + t.slice(1); };
  const temaDe = q => maiuscula((q.espelho && q.espelho.tema) || q.tema || "Questão " + q.n);
  /* numa sessão de um tema só, o que distingue as questões é o assunto da árvore e o primeiro comando */
  const nomeCurto = q => q.assunto ? maiuscula(q.assunto.split(" › ").pop()) : temaDe(q);
  const trechoDe = q => (q.tipo === "obj" ? q.comando : (q.itens[0] && q.itens[0].comando)) || (q.momentos[0] && q.momentos[0].texto) || "";
  const tipoTxt = q => q.tipo === "obj" ? "objetiva" : q.tipo === "disc" ? "discursiva" : "texto livre";
  function chaveFoco() {
    return el("button.chave", { type: "button", id: "chave-foco", role: "switch", "aria-checked": String(!!E.prefs.foco), onclick: ev => { E.prefs.foco = !E.prefs.foco; guardarPrefs(); ev.currentTarget.setAttribute("aria-checked", String(E.prefs.foco)); } },
      el("span.cresce", null, el("b", null, "Modo foco"), el("small", null, "Uma caixa por vez, sem barras nem lista, tela sempre acesa.")), el("span.interruptor"));
  }
  function telaArquivo() {
    const a = E.arq, P = a.pacote, s = resumoDe(P, a.resp), f = document.createDocumentFragment();
    f.appendChild(el("header.topo", null, botaoIcone("voltar", "Voltar aos arquivos", () => ir("biblioteca"), { id: "bt-voltar" }), el("div.topo-titulo.cresce", null, a.ent.titulo), botaoIcone("menu", "Opções do arquivo", abrirMenuArquivo, { id: "bt-menu" })));
    const m = el("main.miolo.arq");
    m.appendChild(el("p.sobre", null, [a.ent.data, plural(P.questoes.length, "questão", "questões")].filter(Boolean).join(" · ")));
    m.appendChild(el("h1", null, a.ent.titulo));
    if (a.ent.nome && a.ent.nome !== a.ent.titulo) m.appendChild(el("div.nome.mono", null, a.ent.nome));
    if (!P.reconhecido) m.appendChild(el("div.aviso-formato", null, "Este arquivo não segue o formato do gerador. Importei o texto inteiro, com uma caixa de resposta."));
    m.appendChild(el("div.progresso", { style: "margin-top:16px" }, el("i", { style: "width:" + s.entregues / s.n * 100 + "%" }), el("i.r", { style: "width:" + s.rasc / s.n * 100 + "%" })));
    m.appendChild(el("p.resumo", null, textoResumo(s)));
    const prox = proximaAberta();
    m.appendChild(el("div.linha-acoes", null, prox >= 0
      ? el("button.botao.principal", { type: "button", id: "bt-continuar", onclick: () => irQuestao(prox) }, s.entregues || s.rasc ? "Continuar na questão " + (prox + 1) : "Começar")
      : el("button.botao", { type: "button", id: "bt-continuar", onclick: () => irQuestao(0) }, "Rever desde a primeira")));
    m.appendChild(chaveFoco());
    m.appendChild(el("div.titulo-secao", null, "Questões"));
    const lista = el("div");
    P.questoes.forEach((q, i) => {
      const e = estadoDe(q, olhar(a.resp, i));
      lista.appendChild(el("button.linha-q", { type: "button", onclick: () => irQuestao(i) }, el("span.num.mono", null, i + 1),
        el("span", null, el("div.t", null, nomeCurto(q)), el("div.tr", null, trechoDe(q).slice(0, 160)), el("div.s", null, [tipoTxt(q)].concat(q.meta.slice(2), q.dif ? [q.dif] : []).join(" · "))),
        el("span.selo", { dataset: { k: e.k } }, e.txt)));
    });
    m.appendChild(lista);
    f.appendChild(m);
    return f;
  }

  /* ── tela: questão ──────────────────────────── */
  function relogioEl(r) { return el("span.relogio.mono", { id: "relogio", hidden: !E.prefs.relogio, title: "Tempo nesta questão" }, tempoTxt(r.tempo)); }
  function faixaNumeros() {
    const fx = el("nav.faixa", { "aria-label": "Questões do arquivo" });
    E.arq.pacote.questoes.forEach((q, i) => fx.appendChild(el("button", { type: "button", dataset: { k: estadoDe(q, olhar(E.arq.resp, i)).k }, "aria-current": String(i === E.qi), "aria-label": "Questão " + (i + 1), onclick: () => { if (i !== E.qi) irQuestao(i); } }, i + 1)));
    return fx;
  }
  function contagem(txt, limite) {
    const p = (String(txt).match(/\S+/g) || []).length, l = Math.ceil(p / 12);
    return { passou: limite > 0 && l > limite, txt: (limite > 0 ? "≈ " + l + " de " + limite + " linhas · " : "") + plural(p, "palavra", "palavras") };
  }
  function blocoEnunciado(q, ate, recolhe) {
    const ms = q.momentos.filter(m => ate == null || m.n <= ate);
    if (!ms.length) return null;
    const varios = q.momentos.length > 1;
    const corpo = el("div.enun-corpo", null, ms.map(m => [varios ? el("div.momento.mono", null, "Momento " + m.n) : null, paragrafos(m.texto, "p.prosa")]));
    if (!recolhe) return el("section.enun", null, corpo);
    const s = el("section.enun.recolhe", { dataset: { aberto: E.enun ? "1" : "0" } });
    s.appendChild(el("button.enun-cab", { type: "button", id: "bt-enun", onclick: () => { E.enun = !E.enun; s.dataset.aberto = E.enun ? "1" : "0"; } }, ico("avancar", 18), el("span.mono", null, "Enunciado"), el("span.enun-dica.cresce", null, "toque para abrir ou recolher")));
    s.appendChild(corpo);
    return s;
  }
  function blocoItem(q, r, it) {
    const livre = q.tipo === "livre" && !it.comando;
    const ta = el("textarea.resposta", { rows: 5, id: "resp-" + it.l, placeholder: livre ? "Sua resposta" : "Sua resposta ao item " + it.l, "aria-label": livre ? "Sua resposta" : "Resposta ao item " + it.l, autocapitalize: "sentences" });
    ta.value = r.itens[it.l] || "";
    const conta = el("div.conta.mono");
    const conferir = () => { const c = contagem(ta.value, it.linhas); conta.textContent = c.txt + (c.passou ? " · passou do limite" : ""); conta.dataset.passou = c.passou ? "1" : "0"; };
    ta.addEventListener("input", () => {
      r.itens[it.l] = ta.value; crescer(ta); conferir(); sujo();
      const p = document.querySelector(".passos [data-l='" + it.l + "']"); if (p) p.dataset.feito = ta.value.trim() ? "1" : "0";
    });
    conferir();
    return el("section.item", { dataset: { l: it.l } }, livre ? null : el("div.item-cab", null, el("span.letra", null, it.l), el("p.comando", null, it.comando)), ta, conta);
  }
  function atualizarNota() {
    const q = qAtual(), r = respDe(E.qi), n = notaDisc(q, r);
    if (!n) return;
    const g = document.getElementById("nota-total"), d = document.getElementById("nota-dica");
    if (g) g.textContent = fmt(n.total);
    if (d) d.textContent = n.feitos === n.n ? "Todos os quesitos conferidos." : "Compare cada resposta com o espelho e marque os quesitos: " + (n.feitos ? "faltam " + (n.n - n.feitos) + " de " + n.n + "." : plural(n.n, "quesito", "quesitos") + ".");
    for (const l in n.porItem) { const x = document.getElementById("nota-" + l); if (x) x.textContent = "item " + l + ": " + fmt(n.porItem[l].valor) + " de " + fmt(n.porItem[l].max); }
  }
  function gabaritoItem(r, ei) {
    const a = r.auto[ei.l] || (r.auto[ei.l] = {});
    if (!Array.isArray(a.q)) a.q = []; if (!Array.isArray(a.g)) a.g = [];
    const cx = el("div.gab");
    cx.appendChild(el("div.rot.mono", null, "Resposta nota máxima" + (ei.etapa ? " · " + ei.etapa : "")));
    junta(cx, paragrafos(ei.max, "p.gab-max")); junta(cx, paragrafos(ei.extra, "p.gab-max"));
    if (ei.q.length) cx.appendChild(el("div.rot.mono", null, "Quesitos · quanto a sua resposta cumpriu"));
    ei.q.forEach((x, k) => {
      const ops = [[0, "0"], [0.5, "½"], [1, fmt(x.pts)]], seg = el("div.seg", { role: "group", "aria-label": "Pontos deste quesito" });
      ops.forEach(o => seg.appendChild(el("button", { type: "button", dataset: { f: String(o[0]) }, "aria-pressed": String(a.q[k] === o[0]), "aria-label": o[0] === 0 ? "não cumpriu" : o[0] === 1 ? "cumpriu, " + o[1] + " pontos" : "cumpriu pela metade",
        onclick: () => { a.q[k] = a.q[k] === o[0] ? null : o[0]; [].forEach.call(seg.children, (b, j) => b.setAttribute("aria-pressed", String(a.q[k] === ops[j][0]))); atualizarNota(); sujo(); } }, o[1])));
      cx.appendChild(el("div.quesito", null, el("p", null, x.txt, x.just ? el("span.exige", null, "exige o porquê") : null), seg));
    });
    if (ei.alt) cx.appendChild(el("p.aceito", null, el("b", null, "Aceito também: "), ei.alt));
    ei.graves.forEach((g, k) => {
      const cb = el("input", { type: "checkbox", checked: !!a.g[k], "aria-label": "Cometi este erro grave" });
      cb.addEventListener("change", () => { a.g[k] = cb.checked; atualizarNota(); sujo(); });
      cx.appendChild(el("label.grave", null, cb, el("span", null, el("b", null, "Erro grave" + (g.tipo ? " (" + g.tipo + ")" : "") + " · " + g.pen + ". "), g.erro, g.cons ? " → " + g.cons + "." : "", el("em", null, " Marque se você escreveu isso."))));
    });
    cx.appendChild(el("div.nota-item.mono", { id: "nota-" + ei.l }));
    return cx;
  }
  function blocoItemCorrigido(q, r, it) {
    const txt = (r.itens[it.l] || "").trim(), livre = q.tipo === "livre" && !it.comando;
    const s = el("section.item.corrigido", { dataset: { l: it.l } }, livre ? null : el("div.item-cab", null, el("span.letra", null, it.l), el("p.comando", null, it.comando)),
      el("div.rot.mono", null, "Sua resposta"), el("div.minha" + (txt ? "" : ".branco"), null, txt || "em branco"));
    const ei = q.espelho && q.espelho.itens.find(x => x.l === it.l);
    if (ei) s.appendChild(gabaritoItem(r, ei));
    return s;
  }
  function blocoResultado(q, r) {
    const b = el("section.resultado");
    if (q.tipo === "obj") {
      const certa = q.gabarito && r.marcada === q.gabarito;
      b.appendChild(el("div.rot.mono", null, !q.gabarito ? "Sem gabarito no arquivo" : certa ? (r.nota === 10 ? "Acertou de primeira" : "Acertou na segunda tentativa") : "Não acertou"));
      if (q.gabarito) { b.appendChild(el("div.nota-grande", null, fmt(r.nota || 0), el("small", null, " / 10"))); b.appendChild(el("p", null, "Gabarito: " + q.gabarito + ". Leia o comentário de cada alternativa, inclusive das que você descartou certo.")); }
      else b.appendChild(el("p", null, "O arquivo não trouxe o gabarito desta questão."));
      return b;
    }
    const n = notaDisc(q, r);
    b.appendChild(el("div.rot.mono", null, "Sua correção"));
    if (!n) { b.appendChild(el("p", null, q.espelho ? "O espelho desta questão veio num formato que não reconheci: ele está inteiro no fim da página." : "Este arquivo não trouxe o espelho desta questão.")); return b; }
    b.appendChild(el("div.nota-grande", null, el("span", { id: "nota-total" }, fmt(n.total)), el("small", null, " / " + fmt(n.max))));
    b.appendChild(el("p", { id: "nota-dica" }));
    return b;
  }
  function blocoRodape(q) {
    const e = q.espelho, b = el("section.rodape");
    if (!e) return b;
    const nota = (rot, txt, cls) => { if (txt) b.appendChild(el("div.nota-rod" + (cls || ""), null, el("div.rot.mono", null, rot), el("p", null, txt))); };
    nota("Ponte clínica", e.ponte); nota("Contra a resposta decorada", e.anti);
    nota("Confira na fonte antes de confiar", e.conferir, ".conferir"); nota("Fonte", e.fonte);
    if (e.extra) nota("Outras notas do espelho", e.extra);
    if (e.veredito || e.validacao.length) b.appendChild(el("details.nota-rod", null, el("summary", null, "Como esta questão foi validada"), el("ul", null, (e.veredito ? ["veredito: " + e.veredito] : []).concat(e.validacao).map(t => el("li", null, t)))));
    const semLeitura = e.tipo === "disc" ? !e.itens.length : !e.comentarios.length;
    if (semLeitura && e.bruto) b.appendChild(el("div.nota-rod", null, el("div.rot.mono", null, "Espelho como veio no arquivo"), el("div.cru", null, e.bruto)));
    return b;
  }

  /* objetiva */
  function marcar(l) {
    const r = respDe(E.qi); r.marcada = r.marcada === l ? null : l;
    document.querySelectorAll("section.alt").forEach(s => { const on = s.dataset.l === r.marcada; s.dataset.marcada = on ? "1" : "0"; const c = s.querySelector(".alt-cab"); if (c) c.setAttribute("aria-pressed", String(on)); });
    const b = document.getElementById("bt-centro"); if (b) b.disabled = !r.marcada;
    sujo();
  }
  function altAberta(r, a) {
    const fora = r.tent.indexOf(a.l) >= 0;
    const ta = el("textarea.just", { rows: 1, id: "just-" + a.l, placeholder: "Por que " + a.l + " está certa ou errada?", "aria-label": "Sua justificativa para a alternativa " + a.l, autocapitalize: "sentences" });
    ta.value = r.just[a.l] || "";
    ta.addEventListener("input", () => { r.just[a.l] = ta.value; crescer(ta); sujo(); });
    return el("section.alt", { dataset: { l: a.l, marcada: r.marcada === a.l ? "1" : "0", fora: fora ? "1" : "0" } },
      el("button.alt-cab", { type: "button", id: "alt-" + a.l, disabled: fora, "aria-pressed": String(r.marcada === a.l), onclick: () => marcar(a.l) }, el("span.letra", null, a.l), el("span.alt-txt", null, a.txt)), ta);
  }
  function altCorrigida(q, r, a) {
    const c = q.espelho && q.espelho.comentarios.find(x => x.l === a.l);
    const certa = q.gabarito ? a.l === q.gabarito : !!(c && c.ok), sua = r.marcada === a.l || r.tent.indexOf(a.l) >= 0;
    const pe = el("div.alt-pe");
    const selo = certa ? (sua ? "Correta · você marcou" : "Correta") : sua ? "Você marcou" : "";
    if (selo) pe.appendChild(el("div.veredicto.mono", null, selo));
    if (c && c.por) pe.appendChild(el("p.por", null, c.por));
    if (c && c.grave) pe.appendChild(el("div.grave-obj", null, (sua ? "Marcar esta foi um erro grave: " : "Marcar esta seria um erro grave: ") + c.grave + "."));
    const meu = (r.just[a.l] || "").trim();
    if (meu) pe.appendChild(el("div.minha-just", null, el("div.rot.mono", null, "Sua justificativa"), el("p", null, meu),
      c && c.por ? el("div.bateu", null, el("span", null, "Bateu com o comentário?"), segmento([[false, "não"], [true, "sim"]], r.bate[a.l] == null ? null : r.bate[a.l], v => { r.bate[a.l] = v; sujo(); })) : null));
    return el("section.alt.vista", { dataset: { l: a.l, estado: certa ? "certa" : sua ? "errada" : "neutra" } },
      el("div.alt-cab", null, el("span.letra", null, a.l), el("span.alt-txt", null, a.txt)), pe.firstChild ? pe : null);
  }
  function fecharObj(r, nota) { r.fim = true; r.entregue = Date.now(); r.nota = nota; }
  function confirmarObj() {
    const q = qAtual(), r = respDe(E.qi);
    if (!r.marcada) return;
    if (!q.gabarito) fecharObj(r, null);
    else if (r.marcada === q.gabarito) fecharObj(r, r.tent.length ? 5 : 10);
    else { r.tent.push(r.marcada); if (r.tent.length >= 2 || q.alternativas.length <= 2) fecharObj(r, 0); else r.marcada = null; }
    gravar(); desenhar(!r.fim);
  }
  function desistirObj() { const r = respDe(E.qi); fecharObj(r, 0); gravar(); desenhar(); }

  function entregar() {
    const q = qAtual(), r = respDe(E.qi), vazios = q.itens.filter(i => !(r.itens[i.l] || "").trim()).length;
    const vai = () => { r.entregue = Date.now(); gravar(); desenhar(); atualizarNota(); };
    if (vazios) confirmar(vazios === q.itens.length ? "Entregar em branco?" : vazios === 1 ? "Há 1 item em branco" : "Há " + vazios + " itens em branco", "Depois de entregar, o espelho abre e as caixas fecham.", "Entregar assim", vai);
    else vai();
  }
  function reabrir() {
    confirmar("Reabrir esta questão?", "O que você escreveu continua. A correção que você marcou é apagada.", "Reabrir", () => {
      const r = respDe(E.qi); r.entregue = null; r.auto = {}; r.bate = {}; r.tent = []; r.marcada = null; r.fim = false; r.nota = null;
      gravar(); primeiroPasso(); desenhar();
    });
  }

  function telaQuestao() {
    const P = E.arq.pacote, q = qAtual(), r = respDe(E.qi), N = P.questoes.length, foco = !!E.prefs.foco, feito = !!r.entregue;
    const umPorVez = foco && !feito && q.tipo !== "obj" && q.itens.length > 0;
    if (E.passo >= q.itens.length) E.passo = Math.max(0, q.itens.length - 1);
    const f = document.createDocumentFragment();

    /* topo */
    if (foco) {
      const passos = umPorVez && q.itens.length > 1 ? el("div.passos", null, q.itens.map((it, k) => el("button", { type: "button", dataset: { l: it.l, feito: (r.itens[it.l] || "").trim() ? "1" : "0" }, "aria-current": String(k === E.passo), "aria-label": "Item " + it.l, onclick: () => { gravar(); E.passo = k; E.enun = false; desenhar(); } }, it.l))) : null;
      f.appendChild(el("header.topo", null, botaoIcone("fechar", "Sair do modo foco", alternarFoco, { id: "bt-foco" }), el("div.onde.mono", null, "Questão " + (E.qi + 1) + "/" + N), el("span.cresce"), passos, relogioEl(r)));
    } else {
      f.appendChild(el("header.topo", null, botaoIcone("voltar", "Voltar à lista", () => ir("arquivo"), { id: "bt-voltar" }), el("div.onde.mono", null, (E.qi + 1) + " / " + N), el("span.cresce"), relogioEl(r),
        el("button.botao.pequeno", { type: "button", id: "bt-foco", onclick: alternarFoco }, ico("foco", 17), el("span", null, "Modo foco")), botaoIcone("ajustes", "Ajustes", abrirAjustes)));
    }

    /* miolo */
    const m = el("main.miolo.questao");
    if (!foco && N > 1) m.appendChild(faixaNumeros());
    m.appendChild(el("div.q-cab", null, el("p.sobre", null, "Questão " + (E.qi + 1) + " de " + N + " · " + tipoTxt(q) + (q.exemplo ? " · exemplo" : "")), el("h1", null, temaDe(q)),
      q.meta.length || q.dif ? el("div.chips", null, q.meta.concat(q.dif ? [q.dif] : []).join(" · ")) : null, q.assunto ? el("div.assunto", null, "assunto: " + q.assunto) : null));
    if (feito) m.appendChild(blocoResultado(q, r));

    if (q.tipo === "obj") {
      junta(m, blocoEnunciado(q, null, false));
      if (q.comando) m.appendChild(el("p.pergunta", null, q.comando));
      if (!feito && r.tent.length) m.appendChild(el("div.aviso-tent", { id: "aviso-tent" }, el("span", null, "Não é a " + r.tent[r.tent.length - 1] + ". Você tem mais uma tentativa, valendo metade."), el("button", { type: "button", id: "bt-desistir", onclick: desistirObj }, "Ver o gabarito")));
      q.alternativas.forEach(a => m.appendChild(feito ? altCorrigida(q, r, a) : altAberta(r, a)));
    } else if (umPorVez) {
      const it = q.itens[E.passo];
      junta(m, blocoEnunciado(q, it.momento, true));
      m.appendChild(blocoItem(q, r, it));
    } else {
      junta(m, blocoEnunciado(q, null, false));
      q.itens.forEach(it => m.appendChild(feito ? blocoItemCorrigido(q, r, it) : blocoItem(q, r, it)));
    }
    if (feito) m.appendChild(blocoRodape(q));
    f.appendChild(m);

    /* base */
    const base = el("footer.base"), ultima = E.qi >= N - 1;
    const seguir = () => { if (ultima) ir("arquivo"); else irQuestao(E.qi + 1); };
    if (umPorVez) {
      const fim = E.passo >= q.itens.length - 1;
      base.appendChild(botaoIcone("voltar", "Item anterior", () => { gravar(); E.passo--; E.enun = false; desenhar(); }, { id: "bt-ant", disabled: E.passo === 0 }));
      base.appendChild(fim ? el("button.botao.principal", { type: "button", id: "bt-centro", onclick: entregar }, "Entregar e ver o espelho")
        : el("button.botao.principal", { type: "button", id: "bt-centro", onclick: () => { gravar(); E.passo++; E.enun = false; desenhar(); } }, "Próximo item", ico("avancar", 18)));
    } else if (foco && feito) {
      base.appendChild(el("button.botao", { type: "button", id: "bt-reabrir", onclick: reabrir }, "Reabrir"));
      base.appendChild(el("button.botao.principal", { type: "button", id: "bt-prox", onclick: seguir }, ultima ? "Voltar à lista" : "Próxima questão", ultima ? null : ico("avancar", 18)));
    } else {
      if (!foco) base.appendChild(botaoIcone("voltar", "Questão anterior", () => irQuestao(E.qi - 1), { id: "bt-ant", disabled: E.qi === 0 }));
      base.appendChild(feito ? el("button.botao", { type: "button", id: "bt-reabrir", onclick: reabrir }, "Reabrir")
        : q.tipo === "obj" ? el("button.botao.principal", { type: "button", id: "bt-centro", disabled: !r.marcada, onclick: confirmarObj }, r.tent.length ? "Confirmar a segunda tentativa" : "Confirmar a resposta")
          : el("button.botao.principal", { type: "button", id: "bt-centro", onclick: entregar }, "Entregar e ver o espelho"));
      if (!foco) base.appendChild(botaoIcone("avancar", ultima ? "Voltar à lista" : "Próxima questão", seguir, { id: "bt-prox" }));
    }
    f.appendChild(base);
    if (feito && q.tipo !== "obj") setTimeout(atualizarNota, 0);
    return f;
  }

  /* ── botão voltar do Android ────────────────── */
  window.__voltar = function () {
    if (folhaAberta()) { fecharFolha(); return true; }
    if (E.tela === "questao") { if (E.prefs.foco) alternarFoco(); else ir("arquivo"); return true; }
    if (E.tela === "arquivo") { ir("biblioteca"); return true; }
    return false;
  };
  window.__pausa = gravar;
  window.__tema = aplicarTema;

  /* ── partida ────────────────────────────────── */
  let cheia = window.innerHeight, largura = window.innerWidth;
  window.addEventListener("resize", () => {
    if (window.innerWidth !== largura) { largura = window.innerWidth; cheia = window.innerHeight; }
    cheia = Math.max(cheia, window.innerHeight);
    document.body.classList.toggle("teclado", window.innerHeight < cheia * 0.75);
    ajustarCaixas();
  });
  document.addEventListener("visibilitychange", () => { if (document.hidden) gravar(); });
  window.addEventListener("pagehide", gravar);
  document.getElementById("seletor").addEventListener("change", ev => {
    const arqs = [].slice.call(ev.target.files || []);
    Promise.all(arqs.map(a => new Promise(ok => { const fr = new FileReader(); fr.onload = () => ok({ nome: a.name, texto: String(fr.result || "") }); fr.onerror = () => ok({ nome: a.name, texto: "" }); fr.readAsText(a); }))).then(l => { ev.target.value = ""; importar(l); });
  });
  try { matchMedia("(prefers-color-scheme: dark)").addEventListener("change", aplicarTema); } catch (e) { /* WebView antigo */ }

  E.indice = Arm.ler("indice") || [];
  E.prefs = Object.assign({}, PADRAO, Arm.ler("prefs") || {});
  aplicarTema();
  const onde = Arm.ler("onde");
  if (!(onde && onde.id && E.indice.some(x => x.id === onde.id) && abrirArquivo(onde.id, onde.tela === "questao" ? onde.qi : null))) desenhar();
  if (A) window.__chegou();
})();
