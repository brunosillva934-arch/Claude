/* Exame físico: um caderno de semiologia em que tudo é editável.
   Árvore: área > tópicos (em qualquer profundidade) > achados (esperado ou anormal) > motivos,
   e cada motivo guarda a nota de como leva ao achado. */
(function () {
  "use strict";

  var A = window.Android || null;
  var app = document.getElementById("app");
  var folhaEl = document.getElementById("folha");
  var avisoEl = document.getElementById("aviso");

  /* ── guardar e ler ─────────────────────────────────────────────── */
  function ler(chave) {
    try {
      var t = A ? A.ler(chave) : window.localStorage.getItem("ef_" + chave);
      return t ? JSON.parse(t) : null;
    } catch (e) { return null; }
  }
  function guardar(chave, valor) {
    try {
      var t = JSON.stringify(valor);
      if (A) return A.guardar(chave, t);
      window.localStorage.setItem("ef_" + chave, t);
      return true;
    } catch (e) { return false; }
  }

  var semente = 0;
  function nid() { semente++; return Date.now().toString(36) + semente.toString(36) + Math.random().toString(36).slice(2, 6); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function norm(s) {
    s = String(s || "").toLowerCase();
    if (s.normalize) s = s.normalize("NFD").replace(/[̀-ͯ]/g, "");
    return s.replace(/\s+/g, " ").trim();
  }
  function plural(n, um, varios) { return n + " " + (n === 1 ? um : varios); }

  /* ── a base ────────────────────────────────────────────────────── */
  function daSemente() {
    function achado(x) {
      var ms = [], i;
      for (i = 0; i < (x.motivos || []).length; i++) ms.push({ id: nid(), nome: x.motivos[i][0], nota: x.motivos[i][1] || "" });
      return { id: nid(), nome: x.nome, nota: x.nota, classe: x.k === "e" ? "e" : "a", motivos: ms };
    }
    function no(t) {
      var n = { id: nid(), nome: t.nome, nota: t.nota, filhos: [], achados: [] }, i;
      for (i = 0; i < t.itens.length; i++) {
        if (t.itens[i].k === "t") n.filhos.push(no(t.itens[i]));
        else n.achados.push(achado(t.itens[i]));
      }
      return n;
    }
    var areas = [], i;
    for (i = 0; i < window.SEMENTE.length; i++) areas.push(no(window.SEMENTE[i]));
    return { v: 1, areas: areas };
  }
  /* aceita um backup mexido à mão: completa o que faltar em vez de quebrar */
  function consertar(b) {
    if (!b || Object.prototype.toString.call(b.areas) !== "[object Array]") return null;
    function no(n) {
      if (!n || typeof n !== "object") return null;
      var r = { id: String(n.id || nid()), nome: String(n.nome || "Sem nome"), nota: String(n.nota || ""), filhos: [], achados: [] }, i, f, a, j, ms;
      for (i = 0; i < (n.filhos || []).length; i++) { f = no(n.filhos[i]); if (f) r.filhos.push(f); }
      for (i = 0; i < (n.achados || []).length; i++) {
        a = n.achados[i];
        if (!a || typeof a !== "object") continue;
        ms = [];
        for (j = 0; j < (a.motivos || []).length; j++) {
          if (a.motivos[j] && typeof a.motivos[j] === "object")
            ms.push({ id: String(a.motivos[j].id || nid()), nome: String(a.motivos[j].nome || "Sem nome"), nota: String(a.motivos[j].nota || "") });
        }
        r.achados.push({ id: String(a.id || nid()), nome: String(a.nome || "Sem nome"), nota: String(a.nota || ""), classe: a.classe === "e" ? "e" : "a", motivos: ms });
      }
      return r;
    }
    var areas = [], i, x;
    for (i = 0; i < b.areas.length; i++) { x = no(b.areas[i]); if (x) areas.push(x); }
    return { v: 1, areas: areas };
  }

  var base = consertar(ler("base"));
  var exames = limparExames(ler("exames"));
  function limparExames(l) {
    if (Object.prototype.toString.call(l) !== "[object Array]") return [];
    l = l.filter(function (x) { return x && x.id && x.marcas && typeof x.marcas === "object"; });
    for (var i = 0; i < l.length; i++) {
      l[i].obs = l[i].obs || {};
      l[i].prov = l[i].prov || {};
      l[i].nome = String(l[i].nome || "Exame");
      l[i].criado = Number(l[i].criado) || Date.now();
    }
    return l;
  }
  var IDX = {};
  var cacheMotivos = null;

  function indexar() {
    IDX = {};
    cacheMotivos = null;
    function andar(no, pai, lista, trilha) {
      IDX[no.id] = { t: "no", o: no, pai: pai, lista: lista, trilha: trilha };
      var tr = trilha.concat([no]), i, j, ac;
      for (i = 0; i < no.achados.length; i++) {
        ac = no.achados[i];
        IDX[ac.id] = { t: "achado", o: ac, pai: no, lista: no.achados, trilha: tr };
        for (j = 0; j < ac.motivos.length; j++) IDX[ac.motivos[j].id] = { t: "motivo", o: ac.motivos[j], pai: ac, lista: ac.motivos, trilha: tr };
      }
      for (i = 0; i < no.filhos.length; i++) andar(no.filhos[i], no, no.filhos, tr);
    }
    for (var i = 0; i < base.areas.length; i++) andar(base.areas[i], null, base.areas, []);
  }
  function salvarBase() {
    indexar();
    if (!guardar("base", base)) aviso("Não consegui salvar no aparelho.");
  }
  var relogioExames = null;
  function salvarExames(logo) {
    clearTimeout(relogioExames);
    if (logo) { guardar("exames", exames); return; }
    relogioExames = setTimeout(function () { guardar("exames", exames); }, 500);
  }

  if (!base) { base = daSemente(); guardar("base", base); }
  indexar();

  function contar(no) {
    var c = { topicos: 0, achados: 0, anormais: 0, motivos: 0 };
    (function andar(n) {
      var i;
      for (i = 0; i < n.achados.length; i++) {
        c.achados++;
        if (n.achados[i].classe === "a") c.anormais++;
        c.motivos += n.achados[i].motivos.length;
      }
      for (i = 0; i < n.filhos.length; i++) { c.topicos++; andar(n.filhos[i]); }
    })(no);
    return c;
  }
  function caminho(trilha, de) {
    var p = [];
    for (var i = de || 0; i < trilha.length; i++) p.push(trilha[i].nome);
    return p.join(" › ");
  }
  /* todos os motivos, juntados pelo nome: é o que permite ver o que mais um motivo explica */
  function motivos() {
    if (cacheMotivos) return cacheMotivos;
    var mapa = {}, lista = [], id, r, k;
    for (id in IDX) {
      r = IDX[id];
      if (r.t !== "motivo") continue;
      k = norm(r.o.nome);
      if (!mapa[k]) { mapa[k] = { chave: k, nome: r.o.nome, itens: [] }; lista.push(mapa[k]); }
      mapa[k].itens.push({ m: r.o, achado: r.pai, trilha: r.trilha });
    }
    lista.sort(function (a, b) { return a.chave < b.chave ? -1 : a.chave > b.chave ? 1 : 0; });
    cacheMotivos = { mapa: mapa, lista: lista };
    return cacheMotivos;
  }

  /* ── estado e navegação ────────────────────────────────────────── */
  var RAIZES = { areas: { v: "areas" }, exames: { v: "exames" }, motivos: { v: "motivos" }, revisao: { v: "revisao" } };
  var S = { aba: "areas", pilha: [{ v: "areas" }], folha: null, rev: { area: "", id: null, aberto: false }, abertas: {} };
  var desfeito = null;

  function atual() { return S.pilha[S.pilha.length - 1]; }
  function ir(rota) { atual().y = window.pageYOffset; S.pilha.push(rota); desenhar(); }
  function voltar() {
    if (S.folha) { fecharFolha(); return true; }
    if (S.pilha.length > 1) { S.pilha.pop(); desenhar(); return true; }
    if (S.aba !== "areas") { trocarAba("areas"); return true; }
    return false;
  }
  function trocarAba(aba) {
    S.aba = aba;
    S.pilha = [{ v: RAIZES[aba].v }];
    desenhar();
  }
  window.__voltar = voltar;
  window.__pausa = function () { salvarExames(true); };

  /* ── ícones ────────────────────────────────────────────────────── */
  function svg(d, t) {
    return '<svg width="' + (t || 22) + '" height="' + (t || 22) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + "</svg>";
  }
  var IC = {
    voltar: svg('<path d="M15 5l-7 7 7 7"/>'),
    seta: svg('<path d="M9 5l7 7-7 7"/>', 18),
    busca: svg('<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>'),
    menu: svg('<circle cx="12" cy="5" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="12" cy="19" r="1.2"/>'),
    lapis: svg('<path d="M4 20l1-4L16.5 4.5a2.1 2.1 0 013 3L8 19l-4 1z"/>', 20),
    mais: svg('<path d="M12 5v14M5 12h14"/>', 18),
    fechar: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
    cima: svg('<path d="M6 14l6-6 6 6"/>'),
    baixo: svg('<path d="M6 10l6 6 6-6"/>'),
    lixo: svg('<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/>', 20),
    certo: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>', 16),
    roteiro: svg('<path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>', 20),
    exame: svg('<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M8.5 12l2.2 2.2L15.5 9.5"/>', 20),
    motivo: svg('<circle cx="6" cy="12" r="2.2"/><circle cx="18" cy="6" r="2.2"/><circle cx="18" cy="18" r="2.2"/><path d="M8 11l8-4M8 13l8 4"/>', 20),
    revisao: svg('<rect x="4" y="7" width="13" height="13" rx="2"/><path d="M8 7V4h12v12h-3"/>', 20)
  };

  /* ── peças de tela ─────────────────────────────────────────────── */
  function topo(titulo, extras) {
    var raiz = S.pilha.length === 1;
    var h = '<header class="topo">';
    if (raiz) h += '<div class="marca cresce">Exame <em>físico</em></div>';
    else h += '<button class="icone-b" data-a="voltar" aria-label="Voltar">' + IC.voltar + '</button><div class="topo-titulo cresce">' + esc(titulo) + "</div>";
    h += extras || "";
    h += '<button class="icone-b" data-a="busca" aria-label="Buscar">' + IC.busca + "</button>";
    if (raiz) h += '<button class="icone-b" data-a="menu" aria-label="Mais opções">' + IC.menu + "</button>";
    return h + "</header>";
  }
  function nav() {
    var abas = [["areas", "Roteiro", IC.roteiro], ["exames", "Exames", IC.exame], ["motivos", "Motivos", IC.motivo], ["revisao", "Revisão", IC.revisao]];
    var h = '<nav class="nav">', i;
    for (i = 0; i < abas.length; i++)
      h += '<button data-a="aba" data-aba="' + abas[i][0] + '"' + (S.aba === abas[i][0] ? ' class="ativa" aria-current="page"' : "") + '><span class="pilula">' + abas[i][2] + "</span>" + abas[i][1] + "</button>";
    return h + "</nav>";
  }
  function trilhaHtml(trilha) {
    if (!trilha.length) return "";
    var h = '<div class="trilha">', i;
    for (i = 0; i < trilha.length; i++)
      h += (i ? "<span>›</span>" : "") + '<button data-a="abrir-no" data-id="' + trilha[i].id + '">' + esc(trilha[i].nome) + "</button>";
    return h + "</div>";
  }
  function notaHtml(rotulo, texto, id, convite) {
    if (texto) return '<div class="nota"><span class="sobre">' + rotulo + "</span>" + esc(texto) + "</div>";
    return '<button class="nota vazia" data-a="editar" data-id="' + id + '">' + convite + "</button>";
  }
  function linhaAchado(ac, sub) {
    return '<button class="linha" data-a="abrir-achado" data-id="' + ac.id + '"><span class="ponto ' + ac.classe + '"></span><span class="cresce"><div class="nome">' + esc(ac.nome) + "</div>" +
      (sub ? '<div class="sub">' + esc(sub) + "</div>" : "") + "</span>" +
      (ac.motivos.length ? '<span class="num">' + plural(ac.motivos.length, "motivo", "motivos") + "</span>" : "") +
      '<span class="seta">' + IC.seta + "</span></button>";
  }

  /* ── telas ─────────────────────────────────────────────────────── */
  function telaAreas() {
    var h = topo() + '<main class="miolo"><div class="sobre">Roteiro</div><h1 class="titulo-pag">Áreas do exame</h1>' +
      '<p class="apoio" style="margin-top:6px">Cada área guarda seus tópicos, os achados esperados e anormais e os motivos de cada achado. Tudo pode ser editado.</p><div class="lista" style="margin-top:18px">';
    var i, c, a;
    for (i = 0; i < base.areas.length; i++) {
      a = base.areas[i];
      c = contar(a);
      h += '<button class="linha area" data-a="abrir-no" data-id="' + a.id + '"><span class="cresce"><div class="nome">' + esc(a.nome) + '</div><div class="sub">' +
        plural(c.topicos, "tópico", "tópicos") + " · " + plural(c.achados, "achado", "achados") + " · " + plural(c.motivos, "motivo", "motivos") + '</div></span><span class="seta">' + IC.seta + "</span></button>";
    }
    if (!base.areas.length) h += '<div class="vazio">Nenhuma área ainda. Crie a primeira ou reponha o conteúdo inicial no menu.</div>';
    h += '</div><button class="novo" data-a="novo-no" data-pai="">' + IC.mais + "Nova área</button></main>";
    return h;
  }

  function telaNo(r) {
    var no = r.o, i, esperados = "", anormais = "", ne = 0, na = 0;
    var h = topo(no.nome, '<button class="icone-b" data-a="editar" data-id="' + no.id + '" aria-label="Editar">' + IC.lapis + "</button>") + '<main class="miolo">';
    h += trilhaHtml(r.trilha) + '<div class="sobre" style="margin-top:6px">' + (r.pai ? "Tópico" : "Área") + '</div><h1 class="titulo-pag">' + esc(no.nome) + "</h1>";
    h += notaHtml("Como examinar", no.nota, no.id, "Escrever como examinar");

    if (no.filhos.length) {
      h += '<div class="secao"><h3>Tópicos</h3><span class="conta">' + no.filhos.length + '</span></div><div class="lista">';
      for (i = 0; i < no.filhos.length; i++) {
        var c = contar(no.filhos[i]);
        h += '<button class="linha" data-a="abrir-no" data-id="' + no.filhos[i].id + '"><span class="ponto t"></span><span class="cresce"><div class="nome">' + esc(no.filhos[i].nome) + '</div><div class="sub">' +
          (c.topicos ? plural(c.topicos, "tópico", "tópicos") + " · " : "") + plural(c.achados, "achado", "achados") + (c.anormais ? " (" + plural(c.anormais, "anormal", "anormais") + ")" : "") +
          '</div></span><span class="seta">' + IC.seta + "</span></button>";
      }
      h += "</div>";
    }
    for (i = 0; i < no.achados.length; i++) {
      if (no.achados[i].classe === "e") { esperados += linhaAchado(no.achados[i]); ne++; }
      else { anormais += linhaAchado(no.achados[i]); na++; }
    }
    if (ne) h += '<div class="secao"><h3>Esperado</h3><span class="conta">' + ne + '</span></div><div class="lista">' + esperados + "</div>";
    if (na) h += '<div class="secao"><h3>Anormal</h3><span class="conta">' + na + '</span></div><div class="lista">' + anormais + "</div>";
    if (!no.filhos.length && !no.achados.length) h += '<div class="vazio" style="margin-top:14px">Vazio por enquanto. Divida em tópicos ou registre os achados deste exame.</div>';
    h += '<div class="dupla" style="margin-top:18px"><button class="novo" data-a="novo-achado" data-pai="' + no.id + '">' + IC.mais + 'Achado</button><button class="novo" data-a="novo-no" data-pai="' + no.id + '">' + IC.mais + "Tópico</button></div>";
    return h + "</main>";
  }

  function telaAchado(r) {
    var ac = r.o, i, m, outros, todos = motivos().mapa;
    var h = topo(ac.nome, '<button class="icone-b" data-a="editar" data-id="' + ac.id + '" aria-label="Editar">' + IC.lapis + "</button>") + '<main class="miolo">';
    h += trilhaHtml(r.trilha) + '<div style="margin-top:10px"><span class="selo ' + ac.classe + '"><span class="ponto ' + ac.classe + '"></span>' + (ac.classe === "e" ? "Achado esperado" : "Achado anormal") + "</span></div>";
    h += '<h1 class="titulo-pag" style="margin-top:8px">' + esc(ac.nome) + "</h1>";
    h += notaHtml("Como reconhecer", ac.nota, ac.id, "Descrever como reconhecer");
    h += '<div class="secao"><h3>' + (ac.classe === "e" ? "Motivos e observações" : "Motivos") + '</h3><span class="conta">' + ac.motivos.length + "</span></div>";
    if (!ac.motivos.length)
      h += '<div class="vazio" style="padding-top:0">' + (ac.classe === "e" ? "Nada registrado. Use para anotar variações do normal, se quiser." : "Nenhum motivo ainda. Adicione o que pode causar este achado e explique o caminho.") + "</div>";
    h += '<div class="lista">';
    for (i = 0; i < ac.motivos.length; i++) {
      m = ac.motivos[i];
      outros = (todos[norm(m.nome)] || { itens: [] }).itens.length - 1;
      h += '<div class="motivo"><div class="cab"><div class="nome cresce">' + esc(m.nome) + '</div><button class="icone-b" data-a="editar" data-id="' + m.id + '" aria-label="Editar motivo">' + IC.lapis + "</button></div>" +
        (m.nota ? '<div class="texto">' + esc(m.nota) + "</div>" : '<div class="texto falta">Sem nota. Toque no lápis e explique como leva ao achado.</div>') +
        (outros > 0 ? '<button class="tambem" data-a="abrir-motivo" data-chave="' + esc(norm(m.nome)) + '">Também explica ' + plural(outros, "outro achado", "outros achados") + " ›</button>" : "") + "</div>";
    }
    h += '</div><button class="novo" data-a="novo-motivo" data-pai="' + ac.id + '">' + IC.mais + "Motivo</button>";
    return h + "</main>";
  }

  function telaMotivos() {
    var lista = motivos().lista, h = topo() + '<main class="miolo"><div class="sobre">Índice</div><h1 class="titulo-pag">Motivos</h1>' +
      '<p class="apoio" style="margin-top:6px">O caminho inverso: escolha um motivo e veja todos os achados que ele explica. Motivos com o mesmo nome são reunidos.</p>';
    var i, letra = "", l;
    if (!lista.length) h += '<div class="vazio">Nenhum motivo registrado ainda.</div>';
    for (i = 0; i < lista.length; i++) {
      l = lista[i].chave.charAt(0).toUpperCase();
      if (l !== letra) { h += (letra ? "</div>" : "") + '<div class="letra">' + esc(l) + '</div><div class="lista">'; letra = l; }
      h += '<button class="linha" data-a="abrir-motivo" data-chave="' + esc(lista[i].chave) + '"><span class="ponto m"></span><span class="cresce"><div class="nome">' + esc(lista[i].nome) + '</div></span><span class="num">' +
        plural(lista[i].itens.length, "achado", "achados") + '</span><span class="seta">' + IC.seta + "</span></button>";
    }
    if (letra) h += "</div>";
    return h + "</main>";
  }

  function telaMotivo(g) {
    var h = topo(g.nome) + '<main class="miolo"><span class="selo m"><span class="ponto m"></span>Motivo</span><h1 class="titulo-pag" style="margin-top:8px">' + esc(g.nome) + "</h1>" +
      '<div class="secao"><h3>Achados que explica</h3><span class="conta">' + g.itens.length + '</span></div><div class="lista">';
    for (var i = 0; i < g.itens.length; i++) {
      var it = g.itens[i];
      h += '<div class="motivo"><button data-a="abrir-achado" data-id="' + it.achado.id + '" style="display:block;width:100%"><div class="cab"><div class="cresce"><div class="nome" style="padding-top:2px">' + esc(it.achado.nome) +
        '</div><div class="dica">' + esc(caminho(it.trilha)) + '</div></div><span class="icone-b">' + IC.seta + "</span></div>" +
        (it.m.nota ? '<div class="texto">' + esc(it.m.nota) + "</div>" : '<div class="texto falta">Sem nota sobre o caminho até este achado.</div>') + "</button></div>";
    }
    return h + "</div></main>";
  }

  /* ── exames ────────────────────────────────────────────────────── */
  function exameDe(id) {
    for (var i = 0; i < exames.length; i++) if (exames[i].id === id) return exames[i];
    return null;
  }
  function dataCurta(ms) {
    var d = new Date(ms);
    function z(n) { return (n < 10 ? "0" : "") + n; }
    return z(d.getDate()) + "/" + z(d.getMonth() + 1) + "/" + d.getFullYear() + " " + z(d.getHours()) + ":" + z(d.getMinutes());
  }
  function contarMarcas(e, areaId) {
    var c = { e: 0, a: 0 }, id;
    for (id in e.marcas) {
      if (areaId && e.marcas[id].area !== areaId) continue;
      if (e.marcas[id].c === "e") c.e++; else c.a++;
    }
    return c;
  }
  function seloContas(c) {
    return (c.e ? '<span class="conta-e">' + c.e + "</span>" : "") + (c.a ? '<span class="conta-a">' + c.a + "</span>" : "");
  }
  function telaExames() {
    var h = topo() + '<main class="miolo"><div class="sobre">Na prática</div><h1 class="titulo-pag">Exames</h1>' +
      '<p class="apoio" style="margin-top:6px">Examine marcando o que encontrou. O app monta o texto do exame e mostra os motivos que os achados anormais têm em comum.</p>' +
      '<button class="botao principal" data-a="novo-exame" style="width:100%;margin-top:16px">' + IC.mais + 'Novo exame</button><div class="lista" style="margin-top:16px">';
    for (var i = exames.length - 1; i >= 0; i--) {
      var c = contarMarcas(exames[i]);
      h += '<button class="linha" data-a="abrir-exame" data-id="' + exames[i].id + '"><span class="cresce"><div class="nome">' + esc(exames[i].nome) + '</div><div class="sub">' + dataCurta(exames[i].criado) + "</div></span>" +
        seloContas(c) + '<span class="seta">' + IC.seta + "</span></button>";
    }
    if (!exames.length) h += '<div class="vazio">Nenhum exame registrado.</div>';
    return h + "</div></main>";
  }
  /* grupos de achados de uma área, na ordem do roteiro */
  function gruposDe(area) {
    var gs = [];
    (function andar(n, nomes) {
      if (n.achados.length) gs.push({ no: n, titulo: nomes.length ? nomes.join(" › ") : "Geral" });
      for (var i = 0; i < n.filhos.length; i++) andar(n.filhos[i], nomes.concat([n.filhos[i].nome]));
    })(area, []);
    return gs;
  }
  function telaExame(e, r) {
    var aba = r.aba || "examinar";
    var h = topo(e.nome, '<button class="icone-b" data-a="editar-exame" data-id="' + e.id + '" aria-label="Renomear ou apagar">' + IC.lapis + "</button>") + '<main class="miolo">';
    h += '<div class="seg"><button data-a="aba-exame" data-aba="examinar"' + (aba === "examinar" ? ' class="ativa"' : "") + '>Examinar</button><button data-a="aba-exame" data-aba="resumo"' + (aba === "resumo" ? ' class="ativa"' : "") + ">Resumo " + seloContas(contarMarcas(e)) + "</button></div>";
    if (aba === "resumo") return h + resumoExame(e) + "</main>";

    h += '<div class="lista" style="margin-top:14px">';
    for (var i = 0; i < base.areas.length; i++) {
      var ar = base.areas[i], aberta = S.abertas[e.id] === ar.id, j, k, gs;
      h += '<div class="dobra' + (aberta ? " aberta" : "") + '"><button class="cabeca" data-a="dobrar" data-id="' + ar.id + '" aria-expanded="' + aberta + '"><span class="nome cresce">' + esc(ar.nome) + "</span>" +
        seloContas(contarMarcas(e, ar.id)) + '<span class="seta">' + IC.seta + "</span></button>";
      if (aberta) {
        gs = gruposDe(ar);
        h += '<div class="dentro"><div class="acoes" style="margin-top:12px"><button class="botao pequeno" data-a="tudo-esperado" data-id="' + ar.id + '">' + IC.certo + "Marcar o esperado no que falta</button></div>";
        for (j = 0; j < gs.length; j++) {
          h += '<div class="grupo"><span>' + esc(gs[j].titulo) + '</span><button data-a="novo-achado" data-pai="' + gs[j].no.id + '">+ achado</button></div>';
          for (k = 0; k < gs[j].no.achados.length; k++) {
            var ac = gs[j].no.achados[k], on = !!e.marcas[ac.id];
            h += '<div class="marca-l ' + ac.classe + (on ? " on" : "") + '"><button class="toque" data-a="marcar" data-id="' + ac.id + '" aria-pressed="' + on + '"><span class="caixa">' + IC.certo + "</span><span>" + esc(ac.nome) + "</span></button>" +
              '<button class="ver" data-a="abrir-achado" data-id="' + ac.id + '" aria-label="Ver motivos de ' + esc(ac.nome) + '">' + IC.seta + "</button></div>";
          }
        }
        if (!gs.length) h += '<div class="vazio">Esta área ainda não tem achados no roteiro.</div>';
        h += '<div class="campo"><label for="obs-' + ar.id + '">Observações desta área</label><textarea id="obs-' + ar.id + '" data-obs="' + ar.id + '" style="min-height:76px" placeholder="Medidas, localização, detalhes">' + esc(e.obs[ar.id] || "") + "</textarea></div></div>";
      }
      h += "</div>";
    }
    return h + "</div></main>";
  }
  /* marcas agrupadas por área, na ordem do roteiro; o que foi apagado do roteiro continua no exame */
  function marcasPorArea(e) {
    var grupos = [], visto = {}, i, id, m, extra = {};
    for (i = 0; i < base.areas.length; i++) {
      var g = { id: base.areas[i].id, nome: base.areas[i].nome, itens: [] };
      (function andar(n) {
        var j;
        for (j = 0; j < n.achados.length; j++)
          if (e.marcas[n.achados[j].id]) { g.itens.push({ id: n.achados[j].id, nome: n.achados[j].nome, c: n.achados[j].classe, vivo: n.achados[j] }); visto[n.achados[j].id] = 1; }
        for (j = 0; j < n.filhos.length; j++) andar(n.filhos[j]);
      })(base.areas[i]);
      grupos.push(g);
    }
    for (id in e.marcas) {
      if (visto[id]) continue;
      m = e.marcas[id];
      if (!extra[m.areaNome]) { extra[m.areaNome] = { id: m.area, nome: m.areaNome, itens: [] }; grupos.push(extra[m.areaNome]); }
      extra[m.areaNome].itens.push({ id: id, nome: m.n, c: m.c, vivo: null });
    }
    return grupos;
  }
  function textoExame(e) {
    var gs = marcasPorArea(e), t = "EXAME FÍSICO\n" + e.nome + " · " + dataCurta(e.criado) + "\n", i, j, nomes, obs, provs = [];
    for (i = 0; i < gs.length; i++) {
      obs = (e.obs[gs[i].id] || "").replace(/\s+$/, "");
      if (!gs[i].itens.length && !obs) continue;
      nomes = [];
      for (j = 0; j < gs[i].itens.length; j++) {
        nomes.push(gs[i].itens[j].nome);
        if (e.prov[gs[i].itens[j].id] && e.prov[gs[i].itens[j].id].length) provs.push(gs[i].itens[j].nome + ": " + e.prov[gs[i].itens[j].id].join(", "));
      }
      t += "\n" + gs[i].nome.toUpperCase() + "\n";
      if (nomes.length) t += nomes.join("; ") + ".\n";
      if (obs) t += "Obs.: " + obs + "\n";
    }
    if (provs.length) t += "\nMOTIVOS PROVÁVEIS\n- " + provs.join("\n- ") + "\n";
    return t;
  }
  function resumoExame(e) {
    var gs = marcasPorArea(e), c = contarMarcas(e), h = "", i, j, k, anormais = [], rep = {}, ordem = [];
    if (!c.e && !c.a) return '<div class="vazio" style="margin-top:14px">Nada marcado ainda. Volte a Examinar e toque nos achados que encontrou.</div>';
    for (i = 0; i < gs.length; i++) for (j = 0; j < gs[i].itens.length; j++) if (gs[i].itens[j].c === "a") anormais.push(gs[i].itens[j]);

    h += '<div class="laudo">' + esc(textoExame(e)) + '</div><div class="acoes" style="margin-top:10px"><button class="botao" data-a="copiar-exame">Copiar</button><button class="botao" data-a="enviar-exame">Compartilhar</button><button class="botao" data-a="salvar-exame">Salvar TXT</button></div>';

    if (anormais.length) {
      h += '<div class="secao"><h3>Anormais e seus motivos</h3><span class="conta">' + anormais.length + '</span></div><p class="dica" style="margin:-4px 0 10px">Toque no motivo que você considera provável; ele entra no texto.</p><div class="lista">';
      for (i = 0; i < anormais.length; i++) {
        var it = anormais[i], ms = it.vivo ? it.vivo.motivos : [], marcados = e.prov[it.id] || [];
        h += '<div class="cartao"><div style="display:flex;align-items:center;gap:8px"><span class="ponto a"></span><div class="nome cresce">' + esc(it.nome) + "</div>" +
          (it.vivo ? '<button class="chip" data-a="abrir-achado" data-id="' + it.id + '">ver notas</button>' : "") + "</div>";
        if (ms.length) {
          h += '<div class="sugestoes">';
          for (k = 0; k < ms.length; k++) {
            var on = marcados.indexOf(ms[k].nome) >= 0, ch = norm(ms[k].nome);
            h += '<button class="chip' + (on ? " ativa" : "") + '" style="white-space:normal;text-align:left;padding:6px 12px" data-a="provavel" data-id="' + it.id + '" data-nome="' + esc(ms[k].nome) + '" aria-pressed="' + on + '">' + esc(ms[k].nome) + "</button>";
            if (!rep[ch]) { rep[ch] = { nome: ms[k].nome, de: [] }; ordem.push(rep[ch]); }
            rep[ch].de.push(it.nome);
          }
          h += "</div>";
        } else h += '<div class="sub">' + (it.vivo ? "Sem motivos registrados para este achado." : "Este achado não está mais no roteiro.") + "</div>";
        h += "</div>";
      }
      h += "</div>";
      ordem = ordem.filter(function (x) { return x.de.length > 1; }).sort(function (a, b) { return b.de.length - a.de.length; });
      if (ordem.length) {
        h += '<div class="secao"><h3>Motivos que se repetem</h3></div><p class="dica" style="margin:-4px 0 10px">Um mesmo motivo por trás de vários achados merece atenção. É uma pista para o raciocínio, não um diagnóstico.</p><div class="lista">';
        for (i = 0; i < ordem.length; i++)
          h += '<button class="linha" data-a="abrir-motivo" data-chave="' + esc(norm(ordem[i].nome)) + '"><span class="ponto m"></span><span class="cresce"><div class="nome">' + esc(ordem[i].nome) + '</div><div class="sub">' + esc(ordem[i].de.join(" · ")) +
            '</div></span><span class="num">' + ordem[i].de.length + '</span><span class="seta">' + IC.seta + "</span></button>";
        h += "</div>";
      }
    }
    return h;
  }

  /* ── revisão ───────────────────────────────────────────────────── */
  function candidatos() {
    var l = [], id, r;
    for (id in IDX) {
      r = IDX[id];
      if (r.t === "achado" && r.o.classe === "a" && r.o.motivos.length && (!S.rev.area || (r.trilha[0] && r.trilha[0].id === S.rev.area))) l.push(id);
    }
    return l;
  }
  function sortear() {
    var l = candidatos(), id;
    if (!l.length) { S.rev.id = null; return; }
    do { id = l[Math.floor(Math.random() * l.length)]; } while (l.length > 1 && id === S.rev.id);
    S.rev.id = id;
    S.rev.aberto = false;
  }
  function telaRevisao() {
    var h = topo() + '<main class="miolo"><div class="sobre">Estudo</div><h1 class="titulo-pag">Revisão</h1>' +
      '<p class="apoio" style="margin:6px 0 12px">Um achado anormal por vez. Tente lembrar os motivos e o caminho de cada um antes de abrir.</p><div class="chips-rolo">' +
      '<button class="chip' + (S.rev.area ? "" : " ativa") + '" data-a="rev-area" data-id="">Todas as áreas</button>';
    for (var i = 0; i < base.areas.length; i++)
      h += '<button class="chip' + (S.rev.area === base.areas[i].id ? " ativa" : "") + '" data-a="rev-area" data-id="' + base.areas[i].id + '">' + esc(base.areas[i].nome) + "</button>";
    h += "</div>";
    if (!S.rev.id || !IDX[S.rev.id] || IDX[S.rev.id].t !== "achado") sortear();
    if (!S.rev.id) return h + '<div class="vazio">Não há achados anormais com motivos aqui. Adicione motivos no roteiro para revisar.</div></main>';
    var r = IDX[S.rev.id], ac = r.o;
    h += '<div class="revisao"><div class="dica">' + esc(caminho(r.trilha)) + "</div><h2>" + esc(ac.nome) + "</h2>" + (ac.nota ? '<p class="apoio">' + esc(ac.nota) + "</p>" : "");
    if (!S.rev.aberto) {
      h += '<p class="pergunta">Quais motivos explicam este achado? São ' + ac.motivos.length + '.</p><div class="acoes" style="margin-top:14px"><button class="botao principal" data-a="rev-abrir">Mostrar motivos</button><button class="botao" data-a="rev-proximo">Pular</button></div></div>';
    } else {
      h += '</div><div class="lista" style="margin-top:10px">';
      for (i = 0; i < ac.motivos.length; i++)
        h += '<div class="motivo" style="padding-top:4px"><div class="nome">' + esc(ac.motivos[i].nome) + "</div>" + (ac.motivos[i].nota ? '<div class="texto" style="margin-top:4px">' + esc(ac.motivos[i].nota) + "</div>" : "") + "</div>";
      h += '</div><div class="acoes" style="margin-top:14px"><button class="botao principal" data-a="rev-proximo">Próximo</button><button class="botao" data-a="abrir-achado" data-id="' + ac.id + '">Abrir no roteiro</button></div>';
    }
    return h + "</main>";
  }

  /* ── desenhar ──────────────────────────────────────────────────── */
  function desenhar(manter) {
    var r = atual(), y = manter ? window.pageYOffset : (r.y || 0), h, alvo, e;
    for (;;) {
      r = atual();
      if (r.v === "no" || r.v === "achado") {
        alvo = IDX[r.id];
        if (alvo && alvo.t === r.v) { h = r.v === "no" ? telaNo(alvo) : telaAchado(alvo); break; }
      } else if (r.v === "motivo") {
        alvo = motivos().mapa[r.chave];
        if (alvo) { h = telaMotivo(alvo); break; }
      } else if (r.v === "exame") {
        e = exameDe(r.id);
        if (e) { h = telaExame(e, r); break; }
      } else {
        h = r.v === "exames" ? telaExames() : r.v === "motivos" ? telaMotivos() : r.v === "revisao" ? telaRevisao() : telaAreas();
        break;
      }
      S.pilha.pop(); /* o destino foi apagado: volta um passo */
      y = atual().y || 0;
    }
    app.innerHTML = h + nav();
    window.scrollTo(0, y);
  }

  /* ── avisos ────────────────────────────────────────────────────── */
  var relogioAviso = null, acaoAviso = null;
  function aviso(msg, rotulo, fn) {
    clearTimeout(relogioAviso);
    acaoAviso = fn || null;
    avisoEl.innerHTML = "<span>" + esc(msg) + "</span>" + (rotulo ? '<button data-a="acao-aviso">' + esc(rotulo) + "</button>" : "");
    avisoEl.className = "on";
    relogioAviso = setTimeout(function () { avisoEl.className = ""; acaoAviso = null; }, fn ? 7000 : 3200);
  }

  /* ── folhas ────────────────────────────────────────────────────── */
  function abrirFolha(f) { S.folha = f; desenharFolha(); }
  function fecharFolha() { S.folha = null; folhaEl.innerHTML = ""; }
  function cabFolha(titulo) {
    return '<div class="cab"><h2 class="cresce">' + esc(titulo) + '</h2><button class="icone-b" data-a="fechar-folha" aria-label="Fechar">' + IC.fechar + "</button></div>";
  }
  var ROT = {
    no: { novo: "Novo tópico", ed: "Editar tópico", nome: "Nome do tópico", nota: "Como examinar", dicaNota: "Técnica, posição do paciente, o que observar.", ex: "Ex.: Fácies" },
    area: { novo: "Nova área", ed: "Editar área", nome: "Nome da área", nota: "Como examinar", dicaNota: "Ordem do exame, preparo, cuidados gerais.", ex: "Ex.: Exame geral" },
    achado: { novo: "Novo achado", ed: "Editar achado", nome: "Nome do achado", nota: "Como reconhecer", dicaNota: "O que você vê, ouve ou sente quando o achado está presente.", ex: "Ex.: Fácies hipocrática" },
    motivo: { novo: "Novo motivo", ed: "Editar motivo", nome: "Motivo", nota: "Como leva ao achado", dicaNota: "O caminho do motivo até o achado, com as suas palavras.", ex: "Ex.: Desnutrição" }
  };
  function desenharFolha() {
    var f = S.folha, h = "", r, o, rot, i;
    if (!f) { folhaEl.innerHTML = ""; return; }
    if (f.tipo === "editar") {
      r = f.id ? IDX[f.id] : null;
      o = r ? r.o : { nome: "", nota: "" };
      rot = ROT[f.alvo === "no" && (r ? !r.pai : !f.pai) ? "area" : f.alvo];
      h = cabFolha(f.id ? rot.ed : rot.novo);
      if (f.alvo === "achado")
        h += '<div class="seg" style="margin-top:6px"><button data-a="classe" data-c="e"' + (f.classe === "e" ? ' class="ativa"' : "") + '><span class="ponto e"></span>Esperado</button><button data-a="classe" data-c="a"' + (f.classe === "a" ? ' class="ativa"' : "") + '><span class="ponto a"></span>Anormal</button></div>';
      h += '<div class="campo"><label for="f-nome">' + rot.nome + '</label><input id="f-nome" type="text" autocomplete="off" autocapitalize="sentences" maxlength="160" placeholder="' + rot.ex + '" value="' + esc(o.nome) + '">' +
        (f.alvo === "motivo" ? '<div class="sugestoes" id="f-sug"></div>' : "") + "</div>";
      h += '<div class="campo"><label for="f-nota">' + rot.nota + '</label><textarea id="f-nota" placeholder="' + rot.dicaNota + '">' + esc(o.nota) + "</textarea></div>";
      h += '<div class="acoes" style="margin-top:16px"><button class="botao principal" data-a="salvar">Salvar</button>' + (f.id ? "" : '<button class="botao" data-a="salvar" data-outro="1">Salvar e criar outro</button>') + "</div>";
      if (f.id) {
        i = r.lista.indexOf(o);
        h += '<div class="rodape"><button class="icone-b" data-a="mover" data-d="-1" aria-label="Mover para cima"' + (i <= 0 ? " disabled" : "") + ">" + IC.cima + '</button><button class="icone-b" data-a="mover" data-d="1" aria-label="Mover para baixo"' + (i >= r.lista.length - 1 ? " disabled" : "") + ">" + IC.baixo +
          '</button><span class="dica cresce">Posição ' + (i + 1) + " de " + r.lista.length + '</span><button class="botao perigo pequeno" data-a="apagar">' + IC.lixo + "Apagar</button></div>";
      }
    } else if (f.tipo === "exame") {
      o = f.id ? exameDe(f.id) : null;
      h = cabFolha(o ? "Editar exame" : "Novo exame") +
        '<div class="campo"><label for="f-nome">Identificação</label><input id="f-nome" type="text" autocomplete="off" maxlength="80" value="' + esc(o ? o.nome : f.sugestao) + '"><span class="dica">Prefira iniciais ou leito ao nome completo: o texto fica guardado no aparelho.</span></div>' +
        '<div class="acoes" style="margin-top:16px"><button class="botao principal" data-a="salvar-exame-nome">' + (o ? "Salvar" : "Começar") + "</button></div>" +
        (o ? '<div class="rodape"><span class="cresce"></span><button class="botao perigo pequeno" data-a="apagar-exame">' + IC.lixo + "Apagar exame</button></div>" : "");
    } else if (f.tipo === "busca") {
      h = cabFolha("Buscar") + '<div class="campo" style="margin-top:4px"><input id="f-busca" type="search" autocomplete="off" placeholder="Tópico, achado ou motivo" aria-label="Buscar"></div><div class="lista" id="f-res" style="margin-top:12px"></div>';
    } else if (f.tipo === "menu") {
      h = cabFolha("Opções") +
        '<button class="item-menu" data-a="exportar"><span class="cresce"><div>Salvar cópia de segurança</div><div class="sub">Um arquivo com todo o roteiro e os exames</div></span></button>' +
        '<button class="item-menu" data-a="importar"><span class="cresce"><div>Restaurar de uma cópia</div><div class="sub">Substitui o que está no aparelho</div></span></button>' +
        '<button class="item-menu" data-a="repor"><span class="cresce"><div>Repor o conteúdo inicial</div><div class="sub">Volta o roteiro ao que veio com o app</div></span></button>' +
        '<p class="dica" style="margin-top:16px">Exame físico' + (A && A.versao ? " " + esc(A.versao()) : "") + ". Funciona sem internet; nada sai do aparelho. O conteúdo inicial é um ponto de partida para estudo: confira com as suas referências e ajuste como quiser.</p>";
    } else if (f.tipo === "confirmar") {
      h = cabFolha(f.titulo) + '<p class="apoio">' + esc(f.msg) + '</p><div class="acoes" style="margin-top:18px"><button class="botao ' + (f.perigo ? "perigo" : "principal") + '" data-a="confirmar">' + esc(f.rotulo) + '</button><button class="botao" data-a="fechar-folha">Cancelar</button></div>';
    }
    folhaEl.innerHTML = '<div class="veu" data-a="veu"><div class="painel' + (f.tipo === "busca" ? " cheio" : "") + '" role="dialog" aria-modal="true">' + h + "</div></div>";
    var foco = document.getElementById(f.tipo === "busca" ? "f-busca" : "f-nome");
    if (foco && !f.semFoco && (f.tipo === "busca" || !f.id)) foco.focus();
  }
  function confirmar(titulo, msg, rotulo, fn, perigo) {
    abrirFolha({ tipo: "confirmar", titulo: titulo, msg: msg, rotulo: rotulo, fn: fn, perigo: perigo });
  }

  function sugerir() {
    var caixa = document.getElementById("f-sug"), campo = document.getElementById("f-nome");
    if (!caixa || !campo || !S.folha) return;
    var q = norm(campo.value), lista = motivos().lista, h = "", n = 0, i, ja = {}, pai = S.folha.id ? IDX[S.folha.id].pai : (IDX[S.folha.pai] || {}).o;
    if (pai) for (i = 0; i < pai.motivos.length; i++) ja[norm(pai.motivos[i].nome)] = 1;
    if (q.length >= 2) {
      for (i = 0; i < lista.length && n < 6; i++) {
        if (lista[i].chave === q || ja[lista[i].chave] || lista[i].chave.indexOf(q) < 0) continue;
        h += '<button class="chip" data-a="sugestao" data-nome="' + esc(lista[i].nome) + '">' + esc(lista[i].nome) + "</button>";
        n++;
      }
    }
    caixa.innerHTML = h;
  }
  function buscar() {
    var q = norm(document.getElementById("f-busca").value), res = document.getElementById("f-res"), h = "", n = 0, id, r, lista, i;
    if (q.length < 2) { res.innerHTML = '<div class="vazio">Digite ao menos duas letras.</div>'; return; }
    lista = motivos().lista;
    for (i = 0; i < lista.length && n < 12; i++) {
      if (lista[i].chave.indexOf(q) < 0) continue;
      h += '<button class="linha" data-a="abrir-motivo" data-chave="' + esc(lista[i].chave) + '"><span class="ponto m"></span><span class="cresce"><div class="nome">' + esc(lista[i].nome) + '</div><div class="sub">Motivo de ' + plural(lista[i].itens.length, "achado", "achados") + "</div></span></button>";
      n++;
    }
    for (id in IDX) {
      if (n >= 60) break;
      r = IDX[id];
      if (r.t === "motivo" || norm(r.o.nome).indexOf(q) < 0) continue;
      if (r.t === "achado") h += linhaAchado(r.o, caminho(r.trilha));
      else h += '<button class="linha" data-a="abrir-no" data-id="' + id + '"><span class="ponto t"></span><span class="cresce"><div class="nome">' + esc(r.o.nome) + '</div><div class="sub">' + (r.trilha.length ? esc(caminho(r.trilha)) : "Área") + "</div></span></button>";
      n++;
    }
    res.innerHTML = h || '<div class="vazio">Nada encontrado. Se falta no roteiro, você pode adicionar.</div>';
  }

  /* ── mudanças ──────────────────────────────────────────────────── */
  function salvarEdicao(outro) {
    var f = S.folha, nome = document.getElementById("f-nome").value.replace(/\s+/g, " ").trim(), nota = document.getElementById("f-nota").value.replace(/\s+$/, ""), o, pai;
    if (!nome) { aviso("Dê um nome antes de salvar."); document.getElementById("f-nome").focus(); return; }
    if (f.id) {
      o = IDX[f.id].o;
      o.nome = nome; o.nota = nota;
      if (f.alvo === "achado") o.classe = f.classe;
    } else if (f.alvo === "no") {
      o = { id: nid(), nome: nome, nota: nota, filhos: [], achados: [] };
      if (f.pai) IDX[f.pai].o.filhos.push(o); else base.areas.push(o);
    } else if (f.alvo === "achado") {
      pai = IDX[f.pai];
      if (!pai) { fecharFolha(); return; }
      pai.o.achados.push({ id: nid(), nome: nome, nota: nota, classe: f.classe, motivos: [] });
    } else {
      pai = IDX[f.pai];
      if (!pai) { fecharFolha(); return; }
      pai.o.motivos.push({ id: nid(), nome: nome, nota: nota });
    }
    salvarBase();
    if (outro) { aviso("Salvo: " + nome); desenharFolha(); }
    else fecharFolha();
    desenhar(true);
  }
  function apagarItem(id) {
    var r = IDX[id], antes = JSON.stringify(base);
    r.lista.splice(r.lista.indexOf(r.o), 1);
    salvarBase();
    fecharFolha();
    desenhar(true);
    aviso("Apagado: " + r.o.nome, "Desfazer", function () {
      base = JSON.parse(antes);
      salvarBase();
      desenhar(true);
    });
  }
  function marcar(e, id) {
    var r = IDX[id];
    if (e.marcas[id]) { delete e.marcas[id]; delete e.prov[id]; return; }
    if (!r) return;
    e.marcas[id] = { n: r.o.nome, c: r.o.classe, area: r.trilha[0].id, areaNome: r.trilha[0].nome };
  }
  function nomeArquivo(s) { return norm(s).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "exame"; }
  function salvarArquivo(nome, texto, tipo) {
    if (A) { A.salvarComo(nome, texto, tipo); return; }
    try {
      var a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([texto], { type: tipo }));
      a.download = nome;
      a.click();
    } catch (e) { aviso("Não deu para salvar aqui."); }
  }
  function restaurar(texto) {
    var d, b;
    try { d = JSON.parse(texto); } catch (e) { d = null; }
    b = d && d.tipo === "exame-fisico" ? consertar(d.base) : null;
    if (!b) { aviso("Esse arquivo não é uma cópia deste app."); return; }
    confirmar("Restaurar a cópia?", "O roteiro e os exames deste aparelho serão substituídos pelos do arquivo (" + plural(b.areas.length, "área", "áreas") + ").", "Substituir tudo", function () {
      base = b;
      exames = limparExames(d.exames);
      salvarBase();
      salvarExames(true);
      trocarAba("areas");
      aviso("Cópia restaurada.");
    }, true);
  }
  window.__chegou = function () {
    try {
      var l = JSON.parse(A.pendentes());
      if (l.length) restaurar(l[0].texto);
    } catch (e) { aviso("Não consegui ler o arquivo."); }
  };

  /* ── toques ────────────────────────────────────────────────────── */
  var ACOES = {
    voltar: function () { voltar(); },
    aba: function (d) { if (d.aba === S.aba && S.pilha.length === 1) window.scrollTo(0, 0); else trocarAba(d.aba); },
    busca: function () { abrirFolha({ tipo: "busca" }); },
    menu: function () { abrirFolha({ tipo: "menu" }); },
    "fechar-folha": function () { fecharFolha(); },
    veu: function (d, el, ev) { if (ev.target === el) fecharFolha(); },
    "acao-aviso": function () { var fn = acaoAviso; clearTimeout(relogioAviso); avisoEl.className = ""; acaoAviso = null; if (fn) fn(); },

    "abrir-no": function (d) { fecharFolha(); ir({ v: "no", id: d.id }); },
    "abrir-achado": function (d) { fecharFolha(); ir({ v: "achado", id: d.id }); },
    "abrir-motivo": function (d) { fecharFolha(); ir({ v: "motivo", chave: d.chave }); },

    "novo-no": function (d) { abrirFolha({ tipo: "editar", alvo: "no", pai: d.pai || null }); },
    "novo-achado": function (d) { abrirFolha({ tipo: "editar", alvo: "achado", pai: d.pai, classe: "a" }); },
    "novo-motivo": function (d) { abrirFolha({ tipo: "editar", alvo: "motivo", pai: d.pai }); },
    editar: function (d) {
      var r = IDX[d.id];
      if (r) abrirFolha({ tipo: "editar", alvo: r.t, id: d.id, classe: r.o.classe });
    },
    classe: function (d) {
      var f = S.folha, nome = document.getElementById("f-nome").value, nota = document.getElementById("f-nota").value;
      f.classe = d.c;
      f.semFoco = true;
      desenharFolha();
      document.getElementById("f-nome").value = nome;
      document.getElementById("f-nota").value = nota;
    },
    sugestao: function (d) { document.getElementById("f-nome").value = d.nome; document.getElementById("f-sug").innerHTML = ""; document.getElementById("f-nota").focus(); },
    salvar: function (d) { salvarEdicao(!!d.outro); },
    mover: function (d) {
      var r = IDX[S.folha.id], i = r.lista.indexOf(r.o), j = i + Number(d.d);
      if (j < 0 || j >= r.lista.length) return;
      r.lista[i] = r.lista[j]; r.lista[j] = r.o;
      var nome = document.getElementById("f-nome").value, nota = document.getElementById("f-nota").value;
      salvarBase();
      desenharFolha();
      document.getElementById("f-nome").value = nome;
      document.getElementById("f-nota").value = nota;
      desenhar(true);
    },
    apagar: function () {
      var id = S.folha.id, r = IDX[id], c, dentro = "";
      if (r.t === "no") { c = contar(r.o); if (c.topicos || c.achados) dentro = plural(c.topicos, "tópico", "tópicos") + " e " + plural(c.achados, "achado", "achados"); }
      else if (r.t === "achado" && r.o.motivos.length) dentro = plural(r.o.motivos.length, "motivo", "motivos");
      if (!dentro) { apagarItem(id); return; }
      confirmar("Apagar “" + r.o.nome + "”?", "Vai junto tudo o que está dentro: " + dentro + ". Dá para desfazer logo em seguida.", "Apagar", function () { apagarItem(id); }, true);
    },
    confirmar: function () { var fn = S.folha.fn; fecharFolha(); fn(); },

    "novo-exame": function () { abrirFolha({ tipo: "exame", sugestao: "Exame de " + dataCurta(Date.now()) }); },
    "editar-exame": function (d) { abrirFolha({ tipo: "exame", id: d.id }); },
    "salvar-exame-nome": function () {
      var nome = document.getElementById("f-nome").value.replace(/\s+/g, " ").trim() || "Exame", e = S.folha.id ? exameDe(S.folha.id) : null;
      if (e) { e.nome = nome; salvarExames(true); fecharFolha(); desenhar(true); return; }
      e = { id: nid(), nome: nome, criado: Date.now(), marcas: {}, prov: {}, obs: {} };
      exames.push(e);
      salvarExames(true);
      if (base.areas.length) S.abertas[e.id] = base.areas[0].id;
      fecharFolha();
      ir({ v: "exame", id: e.id });
    },
    "apagar-exame": function () {
      var id = S.folha.id, e = exameDe(id);
      confirmar("Apagar este exame?", "“" + e.nome + "” e tudo o que foi marcado nele serão apagados.", "Apagar", function () {
        exames.splice(exames.indexOf(e), 1);
        salvarExames(true);
        desenhar();
      }, true);
    },
    "abrir-exame": function (d) { ir({ v: "exame", id: d.id }); },
    "aba-exame": function (d) { atual().aba = d.aba; desenhar(); window.scrollTo(0, 0); },
    dobrar: function (d) {
      var e = atual().id;
      S.abertas[e] = S.abertas[e] === d.id ? null : d.id;
      desenhar(true);
      var el = document.querySelector('[data-a="dobrar"][data-id="' + d.id + '"]');
      if (el && S.abertas[e]) window.scrollTo(0, window.pageYOffset + el.getBoundingClientRect().top - 62);
    },
    marcar: function (d) { var e = exameDe(atual().id); marcar(e, d.id); salvarExames(); desenhar(true); },
    "tudo-esperado": function (d) {
      var e = exameDe(atual().id), gs = gruposDe(IDX[d.id].o), i, j, livre, n = 0;
      for (i = 0; i < gs.length; i++) {
        livre = true;
        for (j = 0; j < gs[i].no.achados.length; j++) if (e.marcas[gs[i].no.achados[j].id]) livre = false;
        if (!livre) continue;
        for (j = 0; j < gs[i].no.achados.length; j++) if (gs[i].no.achados[j].classe === "e") { marcar(e, gs[i].no.achados[j].id); n++; }
      }
      salvarExames();
      desenhar(true);
      aviso(n ? plural(n, "achado esperado marcado", "achados esperados marcados") + "." : "Não havia tópico em branco nesta área.");
    },
    provavel: function (d) {
      var e = exameDe(atual().id), l = e.prov[d.id] || (e.prov[d.id] = []), i = l.indexOf(d.nome);
      if (i >= 0) l.splice(i, 1); else l.push(d.nome);
      salvarExames();
      desenhar(true);
    },
    "copiar-exame": function () {
      var t = textoExame(exameDe(atual().id));
      if (A) { A.copiar(t); return; }
      if (navigator.clipboard) navigator.clipboard.writeText(t).then(function () { aviso("Texto copiado."); }, function () { aviso("Não deu para copiar."); });
    },
    "enviar-exame": function () {
      var e = exameDe(atual().id);
      if (A) A.compartilhar(e.nome, textoExame(e)); else aviso("Compartilhar só funciona no aparelho.");
    },
    "salvar-exame": function () { var e = exameDe(atual().id); salvarArquivo(nomeArquivo(e.nome) + ".txt", textoExame(e), "text/plain"); },

    "rev-area": function (d) { S.rev.area = d.id; sortear(); desenhar(true); },
    "rev-abrir": function () { S.rev.aberto = true; desenhar(true); },
    "rev-proximo": function () { sortear(); desenhar(); window.scrollTo(0, 0); },

    exportar: function () {
      fecharFolha();
      var d = new Date(), dia = d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
      salvarExames(true);
      salvarArquivo("exame-fisico-" + dia + ".json", JSON.stringify({ tipo: "exame-fisico", v: 1, feito: d.toISOString(), base: base, exames: exames }), "application/json");
    },
    importar: function () {
      fecharFolha();
      if (A) A.escolher(); else document.getElementById("seletor").click();
    },
    repor: function () {
      confirmar("Repor o conteúdo inicial?", "O roteiro volta ao que veio com o app e o que você adicionou ou mudou nele se perde. Os exames ficam. Se quiser guardar o roteiro atual, salve antes uma cópia de segurança.", "Repor", function () {
        base = daSemente();
        salvarBase();
        trocarAba("areas");
        aviso("Conteúdo inicial reposto.");
      }, true);
    }
  };

  document.addEventListener("click", function (ev) {
    var el = ev.target;
    while (el && el !== document.body && !(el.getAttribute && el.getAttribute("data-a"))) el = el.parentNode;
    if (!el || el === document.body || !el.getAttribute) return;
    var fn = ACOES[el.getAttribute("data-a")];
    if (fn) fn(el.dataset, el, ev);
  });
  document.addEventListener("input", function (ev) {
    var el = ev.target, e;
    if (el.id === "f-busca") buscar();
    else if (el.id === "f-nome" && S.folha && S.folha.alvo === "motivo") sugerir();
    else if (el.getAttribute("data-obs")) {
      e = exameDe(atual().id);
      if (e) { e.obs[el.getAttribute("data-obs")] = el.value; salvarExames(); }
    }
  });
  document.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape" && S.folha) fecharFolha();
    if (ev.key === "Enter" && ev.target.id === "f-nome" && S.folha) {
      ev.preventDefault();
      if (S.folha.tipo === "exame") ACOES["salvar-exame-nome"](); else document.getElementById("f-nota").focus();
    }
  });
  document.addEventListener("focusin", function (ev) {
    if (/^(INPUT|TEXTAREA)$/.test(ev.target.tagName)) document.body.className = "teclado";
  });
  document.addEventListener("focusout", function () { document.body.className = ""; });
  document.getElementById("seletor").addEventListener("change", function () {
    var arq = this.files && this.files[0], leitor;
    if (!arq) return;
    leitor = new FileReader();
    leitor.onload = function () { restaurar(String(leitor.result)); };
    leitor.readAsText(arq);
    this.value = "";
  });

  /* ── tema ──────────────────────────────────────────────────────── */
  var midia = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  function tema() {
    var escuro = A && A.escuro ? A.escuro() : !!(midia && midia.matches);
    document.documentElement.setAttribute("data-theme", escuro ? "dark" : "light");
    if (A && A.barras) A.barras(escuro ? "#151c1b" : "#ffffff", !escuro);
  }
  window.__tema = tema;
  if (midia && midia.addListener) midia.addListener(tema);
  tema();
  desenhar();
})();
