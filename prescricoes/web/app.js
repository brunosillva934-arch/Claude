/* Prescrições: busca nas fichas do Drive de Prescrições.
   Os dados (window.DADOS) entram no HTML na montagem; nada vem da rede. */
(function () {
  'use strict';

  var D = window.DADOS;
  var ponte = window.Android || null;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };

  /* ── texto ──────────────────────────────────────────────────────────── */

  // Tira acento e põe em minúsculas, letra por letra: o texto normalizado tem o mesmo
  // comprimento do original, o que deixa marcar o trecho achado no texto de verdade.
  var cacheLetra = {};
  function letra(c) {
    var r = cacheLetra[c];
    if (r === undefined) {
      r = c.normalize('NFD').charAt(0).toLowerCase();
      if (r.length !== 1) r = c;
      cacheLetra[c] = r;
    }
    return r;
  }
  function norm(s) {
    var o = '';
    for (var i = 0; i < s.length; i++) o += letra(s[i]);
    return o;
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }
  function semTags(h) {
    return String(h).replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&amp;/g, '&');
  }
  function chave(s) { return norm(s).replace(/[^a-z0-9]+/g, ' ').trim(); }
  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  /** Termos da busca: cada um precisa aparecer no começo de alguma palavra. */
  function termos(q) {
    return norm(q).split(/[^a-z0-9]+/).filter(Boolean);
  }
  function regTermo(t) { return new RegExp('(^|[^a-z0-9])' + escRe(t), 'g'); }
  function temTodos(alvo, regs) {
    for (var i = 0; i < regs.length; i++) {
      regs[i].lastIndex = 0;
      if (!regs[i].test(alvo)) return false;
    }
    return true;
  }
  /** Marca os termos num texto puro e devolve HTML. */
  function marcar(texto, regs) {
    if (!regs || !regs.length) return esc(texto);
    var n = norm(texto);
    var faixas = [];
    regs.forEach(function (re) {
      re.lastIndex = 0;
      var m;
      while ((m = re.exec(n))) {
        var ini = m.index + m[1].length;
        var fim = ini + m[0].length - m[1].length;
        // vai até o fim da palavra: "amox" marca "Amoxicilina" inteira
        while (fim < n.length && /[a-z0-9]/.test(n[fim])) fim++;
        faixas.push([ini, fim]);
        if (m[0].length === 0) re.lastIndex++;
      }
    });
    if (!faixas.length) return esc(texto);
    faixas.sort(function (a, b) { return a[0] - b[0]; });
    var out = '', pos = 0;
    faixas.forEach(function (f) {
      if (f[0] < pos) return;
      out += esc(texto.slice(pos, f[0])) + '<mark>' + esc(texto.slice(f[0], f[1])) + '</mark>';
      pos = f[1];
    });
    return out + esc(texto.slice(pos));
  }

  /* ── estado guardado ─────────────────────────────────────────────────── */

  var CHAVE_LOCAL = 'prescricoes.estado';
  function lerEstado() {
    try {
      var t = ponte && ponte.ler ? ponte.ler('estado') : localStorage.getItem(CHAVE_LOCAL);
      var o = t ? JSON.parse(t) : {};
      return o && typeof o === 'object' ? o : {};
    } catch (e) { return {}; }
  }
  var E = lerEstado();
  E.edits = E.edits && typeof E.edits === 'object' ? E.edits : {};
  E.edits.fichas = E.edits.fichas && typeof E.edits.fichas === 'object' ? E.edits.fichas : {};
  E.edits.tabelas = E.edits.tabelas && typeof E.edits.tabelas === 'object' ? E.edits.tabelas : {};
  E.favs = Array.isArray(E.favs) ? E.favs : [];
  E.rec = Array.isArray(E.rec) ? E.rec : [];
  E.receita = E.receita && Array.isArray(E.receita.itens) ? E.receita : { itens: [], orient: [], alarme: [] };
  E.tema = E.tema || 'auto';
  E.fs = E.fs || 16;
  E.filtro = E.filtro || '';
  var timerGuardar = null;
  function guardar() {
    clearTimeout(timerGuardar);
    timerGuardar = setTimeout(function () {
      var t = JSON.stringify(E);
      try {
        if (ponte && ponte.guardar) ponte.guardar('estado', t);
        else localStorage.setItem(CHAVE_LOCAL, t);
      } catch (e) { /* sem onde guardar: segue só na memória */ }
    }, 150);
  }

  /* ── índices ────────────────────────────────────────────────────────── */
  // O conteúdo do PDF (D) nunca muda. As edições ficam em E.edits e entram por cima:
  // uma conduta editada substitui a original pelo mesmo id; as criadas se somam.

  var TAG_NOME = { 'PLANTÃO': 'Plantão', 'AMBULATÓRIO': 'Ambulatório', 'GESTANTE': 'Gestante', 'PEDIATRIA': 'Pediatria', 'IST': 'IST', 'MINHAS': 'Minhas e editadas' };
  var TAGS = ['PLANTÃO', 'AMBULATÓRIO', 'GESTANTE', 'PEDIATRIA', 'IST'];
  var TAG_CLASSE = function (t) { return 't-' + norm(t).toUpperCase(); };
  var SELO_NOME = { sus: 'SUS', fp: 'Farmácia Popular', ce: 'Controle especial' };
  var SELO_CURTO = { sus: 'SUS', fp: 'Farm. Popular', ce: 'Controlado' };
  var SECAO_CURTA = { antes: 'Antes', receita: 'Receita', opcoes: 'Opções', unidade: 'Na unidade', plantonista: 'Plantonista' };
  var ORDEM_SECOES = ['antes', 'receita', 'opcoes', 'unidade', 'plantonista'];
  var NOME_TOM = { orient: 'Orientações', alarme: 'Retornar imediatamente se', seguranca: 'Prescrever com segurança', encaminhar: 'Encaminhar / internar se', dica: 'Dica de plantão' };

  var BASE_POR_ID = {};
  D.fichas.forEach(function (f) { BASE_POR_ID[f.id] = f; });
  var FICHAS, POR_ID, REMEDIOS, LISTA_REMEDIOS, ORDEM, TABELAS, LINHAS_TAB;

  /** Cópia da ficha com o texto normalizado para a busca (a original fica intacta). */
  function preparar(f0) {
    var f = Object.assign({}, f0);
    f.apelidos = f.apelidos || [];
    var corpo = [];
    f.secoes.forEach(function (s) {
      if (s.caso) corpo.push(s.caso);
      s.blocos.forEach(function (b) {
        if (b.t === 'item') corpo.push(b.nome + ' ' + (b.qtd || '') + ' ' + semTags(b.uso || ''));
        else if (b.html) corpo.push(semTags(b.html));
        else if (b.texto) corpo.push(b.texto + ' ' + (b.nota || ''));
      });
    });
    f._corpo = corpo;
    f._n = {
      nome: norm(f.nome),
      apelidos: f.apelidos.map(norm),
      busque: f.busque ? f.busque.split(/\s*,\s*/).filter(Boolean) : [],
      cid: norm(f.cid || '').replace(/\s+/g, ''),
      corpo: norm(corpo.join(' \u2016 ') + ' \u2016 ' + (f.atestado || '') + ' \u2016 ' + (f.retorno || ''))
    };
    f._n.busqueN = f._n.busque.map(norm);
    return f;
  }

  function indexar() {
    var ed = E.edits.fichas;
    var lista = D.fichas.map(function (f) { return ed[f.id] || f; });
    Object.keys(ed).forEach(function (id) { if (!BASE_POR_ID[id]) lista.push(ed[id]); });
    FICHAS = lista.map(preparar);
    POR_ID = {};
    REMEDIOS = {};
    FICHAS.forEach(function (f) {
      POR_ID[f.id] = f;
      f.secoes.forEach(function (s, si) {
        s.blocos.forEach(function (b, bi) {
          if (b.t !== 'item') return;
          (b.remedios || []).forEach(function (r) {
            var k = chave(r);
            if (!k) return;
            var e = REMEDIOS[k] || (REMEDIOS[k] = { chave: k, nome: r, usos: [] });
            e.usos.push({ f: f, si: si, bi: bi });
          });
        });
      });
    });
    LISTA_REMEDIOS = Object.keys(REMEDIOS).map(function (k) { return REMEDIOS[k]; })
      .sort(function (a, b) { return a.chave.localeCompare(b.chave); });
    LISTA_REMEDIOS.forEach(function (r) {
      var ids = {};
      r.usos.forEach(function (u) { ids[u.f.id] = 1; });
      r.nFichas = Object.keys(ids).length;
    });
    ORDEM = FICHAS.slice().sort(function (a, b) { return a._n.nome.localeCompare(b._n.nome); });

    TABELAS = D.tabelas.map(function (t, ti) {
      var e = E.edits.tabelas[ti];
      return e && Array.isArray(e.linhas) ? Object.assign({}, t, { linhas: e.linhas, editada: e.em }) : t;
    });
    // linhas das tabelas, para a busca e para a página de cada remédio
    LINHAS_TAB = [];
    TABELAS.forEach(function (t, ti) {
      t.linhas.forEach(function (l, li) {
        LINHAS_TAB.push({ t: t, ti: ti, li: li, cab: semTags(l[0]), n: norm(semTags(l.join(' \u2016 '))), ncab: norm(semTags(l[0])) });
      });
    });
    E.favs = E.favs.filter(function (id) { return POR_ID[id]; });
    E.rec = E.rec.filter(function (id) { return POR_ID[id]; });
    if (E.filtro === 'MINHAS' && !temEdicoes()) E.filtro = '';
  }
  function temEdicoes() { return Object.keys(E.edits.fichas).length > 0; }

  indexar();

  /* ── tema e tamanho da letra ─────────────────────────────────────────── */

  function escuroDoSistema() {
    try { if (ponte && ponte.escuro) return !!ponte.escuro(); } catch (e) { /* segue */ }
    return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  }
  function aplicarTema() {
    var escuro = E.tema === 'escuro' || (E.tema === 'auto' && escuroDoSistema());
    document.documentElement.setAttribute('data-tema', escuro ? 'escuro' : 'claro');
    document.documentElement.style.setProperty('--fs', E.fs + 'px');
    var cor = getComputedStyle(document.documentElement).getPropertyValue('--sup').trim() || (escuro ? '#161e24' : '#ffffff');
    var meta = $('meta[name="theme-color"]');
    if (!meta) { meta = document.createElement('meta'); meta.name = 'theme-color'; document.head.appendChild(meta); }
    meta.content = cor;
    try { if (ponte && ponte.barras) ponte.barras(cor, !escuro); } catch (e) { /* segue */ }
  }
  window.__tema = aplicarTema;
  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    if (mq.addEventListener) mq.addEventListener('change', function () { if (E.tema === 'auto') aplicarTema(); });
  }
  aplicarTema();

  /* ── avisos, copiar, compartilhar ────────────────────────────────────── */

  var timerAviso = null;
  function avisar(msg, acao, fn) {
    var a = $('#aviso');
    a.innerHTML = '<span>' + esc(msg) + '</span>' + (acao ? '<button type="button">' + esc(acao) + '</button>' : '');
    a.hidden = false;
    if (acao) a.querySelector('button').onclick = function () { a.hidden = true; fn(); };
    clearTimeout(timerAviso);
    timerAviso = setTimeout(function () { a.hidden = true; }, acao ? 6000 : 2200);
  }
  function copiar(texto, msg) {
    var ok = false;
    try {
      if (ponte && ponte.copiar) { ponte.copiar(texto); ok = true; }
    } catch (e) { ok = false; }
    if (!ok && navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(texto).then(function () { avisar(msg || 'Copiado'); }, function () { copiarVelho(texto, msg); });
      return;
    }
    if (!ok) { copiarVelho(texto, msg); return; }
    avisar(msg || 'Copiado');
  }
  function copiarVelho(texto, msg) {
    var t = document.createElement('textarea');
    t.value = texto;
    t.setAttribute('readonly', '');
    t.style.position = 'fixed'; t.style.opacity = '0';
    document.body.appendChild(t);
    t.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(t);
    avisar(ok ? (msg || 'Copiado') : 'Não deu para copiar neste navegador');
  }
  function compartilhar(titulo, texto) {
    try {
      if (ponte && ponte.compartilhar) { ponte.compartilhar(titulo, texto); return; }
    } catch (e) { /* segue */ }
    if (navigator.share) { navigator.share({ title: titulo, text: texto }).catch(function () {}); return; }
    copiar(texto, 'Copiado (compartilhar não existe aqui)');
  }

  /* ── texto da receita ────────────────────────────────────────────────── */

  function linhaItem(it, n) {
    var l = (n ? n + '. ' : '') + it.nome + (it.qtd ? ' — ' + it.qtd : '');
    return it.uso ? l + '\n   ' + it.uso : l;
  }
  function textoReceita(itens, orient, alarme) {
    var partes = itens.map(function (it, i) { return linhaItem(it, i + 1); });
    var out = partes.join('\n\n');
    if (orient && orient.length) out += '\n\nOrientações:\n' + orient.map(function (o) { return '- ' + o; }).join('\n');
    if (alarme && alarme.length) out += '\n\nRetornar imediatamente se:\n' + alarme.map(function (o) { return '- ' + o; }).join('\n');
    return out.trim();
  }
  /** Itens, orientações e sinais de alarme da receita pronta de uma ficha. */
  function receitaDa(f) {
    var s = f.secoes.filter(function (x) { return x.tipo === 'receita'; })[0];
    var r = { itens: [], orient: [], alarme: [] };
    if (!s) return r;
    var onde = null;
    s.blocos.forEach(function (b) {
      if (b.t === 'item') r.itens.push(itemDe(b, f));
      else if (b.t === 'sub') onde = b.tom === 'alarme' ? 'alarme' : (b.tom === 'orient' ? 'orient' : null);
      else if ((b.t === 'li' || b.t === 'p') && onde) r[onde].push(semTags(b.html));
    });
    return r;
  }
  function itemDe(b, f) {
    return { nome: b.nome, qtd: b.qtd || '', uso: b.uso ? semTags(b.uso) : '', de: f.nome, id: f.id };
  }

  /* ── rotas ──────────────────────────────────────────────────────────── */

  var TOPO = { inicio: 1, remedios: 1, tabelas: 1, receita: 1 };
  var rolagem = {};
  var rotaAtual = null;

  function lerRota() {
    var h = location.hash.replace(/^#/, '') || '/';
    var q = {};
    var i = h.indexOf('?');
    if (i >= 0) {
      h.slice(i + 1).split('&').forEach(function (p) {
        var kv = p.split('=');
        if (kv[0]) q[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || '');
      });
      h = h.slice(0, i);
    }
    var partes = h.split('/').filter(Boolean).map(decodeURIComponent);
    return { partes: partes, q: q, chave: location.hash || '#/' };
  }
  function ir(hash, trocar) {
    if (trocar) location.replace(hash);
    else location.hash = hash;
  }

  function mostrar(rota) {
    var nome = rota.partes[0] || 'inicio';
    if (!TOPO[nome] && ['f', 'r', 'sobre', 'e', 'et'].indexOf(nome) < 0) nome = 'inicio';
    if (rotaAtual) rolagem[rotaAtual] = window.scrollY;
    var tela = TOPO[nome] ? nome : 'detalhe';
    document.body.classList.toggle('sem-abas', nome === 'e' || nome === 'et');
    $$('.tela').forEach(function (t) { t.hidden = t.getAttribute('data-rota') !== tela; });
    $$('#abas a').forEach(function (a) {
      if (a.getAttribute('data-aba') === nome) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    var y = rolagem[rota.chave] || 0;
    if (nome === 'inicio') desenharInicio();
    else if (nome === 'remedios') desenharRemedios();
    else if (nome === 'tabelas') { desenharTabelas(); }
    else if (nome === 'receita') desenharReceita();
    else if (nome === 'f') { y = desenharFicha(rota) ? y : 0; }
    else if (nome === 'r') desenharRemedio(rota.partes[1]);
    else if (nome === 'sobre') desenharSobre();
    else if (nome === 'e') abrirEditor(rota.partes[1]);
    else if (nome === 'et') abrirEditorTabela(+rota.partes[1]);
    rotaAtual = rota.chave;
    if (nome === 'f' && (rota.q.i || rota.q.q) && !(rota.chave in rolagem)) return; // a ficha rola sozinha até o alvo
    if (nome === 'tabelas' && rota.q.l && !(rota.chave in rolagem)) return;
    window.scrollTo(0, y);
  }

  window.addEventListener('hashchange', function () { mostrar(lerRota()); });
  window.__voltar = function () {
    if (dialogo) { var fn = dialogo.fn; fecharDialogo(); if (fn) fn(undefined); return true; }
    var r = lerRota();
    var nome = r.partes[0] || 'inicio';
    if (nome === 'e' || nome === 'et') { sairDoEditor(); return true; }
    if (nome === 'inicio' && $('#busca').value) { limparBusca(); return true; }
    if (nome === 'inicio') return false;
    voltarOu('#/');
    return true;
  };
  function voltarOu(hash) {
    if (history.length > 1 && navegou) history.back();
    else ir(hash, true);
  }
  var navegou = false;
  window.addEventListener('hashchange', function () { navegou = true; });

  document.addEventListener('click', function (ev) {
    var el = ev.target.closest('[data-ir]');
    if (el) { ev.preventDefault(); ir(el.getAttribute('data-ir')); return; }
    var tr = ev.target.closest('a[data-trocar]');
    if (tr) { ev.preventDefault(); ir(tr.getAttribute('href'), true); return; }
    var nova = ev.target.closest('[data-nova]');
    if (nova) { ev.preventDefault(); novaConduta(nova.getAttribute('data-nova')); return; }
    var aba = ev.target.closest('#abas a');
    if (aba) {
      ev.preventDefault();
      var destino = aba.getAttribute('href');
      if (location.hash === destino || (destino === '#/' && !location.hash)) { window.scrollTo(0, 0); return; }
      ir(destino, TOPO[(lerRota().partes[0] || 'inicio')] ? true : false);
    }
  });
  $('#voltar').addEventListener('click', function () { if (!window.__voltar()) ir('#/', true); });

  /* ── início: busca e lista ───────────────────────────────────────────── */

  var campo = $('#busca');
  var corpoInicio = $('#inicio-corpo');
  var ultimaBusca = null;

  function desenharFiltros() {
    var tags = [''].concat(temEdicoes() ? ['MINHAS'] : [], TAGS);
    $('#filtros').innerHTML = tags.map(function (t) {
      var cor = t === 'MINHAS' ? '<svg class="chip-ic"><use href="#i-lapis"/></svg>' : t ? '<i class="ponto ' + TAG_CLASSE(t) + '"></i>' : '';
      var nome = t === 'MINHAS' ? 'Minhas' : t ? TAG_NOME[t] : 'Todas';
      return '<button class="chip" type="button" data-filtro="' + esc(t) + '" aria-pressed="' + (E.filtro === t) + '">' + cor + nome + '</button>';
    }).join('');
  }
  $('#filtros').addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-filtro]');
    if (!b) return;
    E.filtro = b.getAttribute('data-filtro');
    guardar();
    desenharFiltros();
    ultimaBusca = null;
    desenharInicio();
  });

  function passaFiltro(f) {
    if (E.filtro === 'MINHAS') return !!(f.minha || f.editada);
    return !E.filtro || f.tags.indexOf(E.filtro) >= 0;
  }
  function selo_edicao(f) {
    return f.minha ? '<span class="marca-ed">minha</span>' : f.editada ? '<span class="marca-ed">editada</span>' : '';
  }

  function pontosTags(f) {
    return '<span class="pontos" aria-hidden="true">' + f.tags.map(function (t) { return '<i class="' + TAG_CLASSE(t) + '" title="' + esc(TAG_NOME[t]) + '"></i>'; }).join('') + '</span>';
  }
  function linhaFicha(f, sub, extra) {
    return '<li><a class="linha" href="#/f/' + f.id + (extra || '') + '"><span class="linha-texto"><span class="linha-titulo">' +
      (sub && sub.tituloHtml ? sub.tituloHtml : esc(f.nome)) + pontosTags(f) + selo_edicao(f) + '</span>' +
      (sub && sub.html ? '<span class="linha-sub">' + sub.html + '</span>' : '<span class="linha-sub">' + esc(f.cid ? 'CID ' + f.cid : '') + '</span>') +
      '</span></a></li>';
  }

  function desenharInicio() {
    var q = campo.value.trim();
    var assinatura = q + '|' + E.filtro + (q ? '' : '|' + E.favs.join(',') + '|' + E.rec.join(','));
    if (assinatura === ultimaBusca) return;
    ultimaBusca = assinatura;
    $('#busca-limpar').hidden = !q;
    corpoInicio.innerHTML = q ? resultados(q) : inicioVazio();
  }

  function inicioVazio() {
    var h = '';
    var atalhos = D.atalhos.map(function (id) { return POR_ID[id]; }).filter(passaFiltro);
    if (atalhos.length) {
      h += '<h2 class="rotulo">Atalhos do plantão</h2><div class="atalhos">' +
        atalhos.map(function (f) { return '<a href="#/f/' + f.id + '">' + esc(f.nome) + '</a>'; }).join('') + '</div>';
    }
    var favs = E.favs.map(function (id) { return POR_ID[id]; }).filter(passaFiltro);
    if (favs.length) h += '<h2 class="rotulo">Favoritas</h2><ul class="lista">' + favs.map(function (f) { return linhaFicha(f); }).join('') + '</ul>';
    var rec = E.rec.map(function (id) { return POR_ID[id]; }).filter(function (f) { return passaFiltro(f) && E.favs.indexOf(f.id) < 0; }).slice(0, 6);
    if (rec.length) h += '<h2 class="rotulo">Abertas por último</h2><ul class="lista">' + rec.map(function (f) { return linhaFicha(f); }).join('') + '</ul>';
    var todas = ORDEM.filter(passaFiltro);
    h += '<h2 class="rotulo">' + (E.filtro ? 'Condutas · ' + TAG_NOME[E.filtro] : 'Todas as condutas') + '<small>' + todas.length +
      '<button class="mini-btn" type="button" data-nova=""><svg><use href="#i-somar"/></svg>Nova conduta</button></small></h2><ul class="lista">';
    var letraAtual = '';
    todas.forEach(function (f) {
      var l = norm(f.nome.charAt(0)).toUpperCase();
      if (l !== letraAtual) { letraAtual = l; h += '<li class="letra">' + l + '</li>'; }
      h += linhaFicha(f);
    });
    return h + '</ul>';
  }

  /** Busca nas condutas (nome, apelidos, "busque também", CID), nos remédios, no texto e nas tabelas. */
  function buscar(q) {
    var ts = termos(q);
    var regs = ts.map(regTermo);
    var res = { condutas: [], remedios: [], texto: [], tabelas: [], regs: regs };
    if (!ts.length) return res;
    var qcid = norm(q).replace(/\s+/g, '');
    var pareceCid = /^[a-z]\d{1,2}(\.\d?)?$/.test(qcid);
    var vistas = {};
    FICHAS.forEach(function (f) {
      if (!passaFiltro(f)) return;
      var n = f._n, pontos = 0, motivo = null;
      if (temTodos(n.nome, regs)) {
        pontos = 100;
        if (n.nome.indexOf(ts[0]) === 0) pontos += 30;
        if (chave(f.nome) === ts.join(' ')) pontos += 50;
      }
      if (pareceCid && n.cid.indexOf(qcid) >= 0) { pontos = Math.max(pontos, 120); motivo = { tipo: 'CID', texto: f.cid }; }
      if (pontos < 100) {
        for (var i = 0; i < n.apelidos.length; i++) {
          if (temTodos(n.apelidos[i], regs)) { pontos = 90; motivo = { tipo: 'Também', texto: f.apelidos[i] }; break; }
        }
      }
      if (pontos < 90) {
        for (var j = 0; j < n.busqueN.length; j++) {
          if (temTodos(n.busqueN[j], regs)) { pontos = 70; motivo = { tipo: 'Também', texto: n.busque[j] }; break; }
        }
      }
      if (pontos) { res.condutas.push({ f: f, pontos: pontos, motivo: motivo }); vistas[f.id] = 1; }
    });
    res.condutas.sort(function (a, b) { return b.pontos - a.pontos || a.f._n.nome.localeCompare(b.f._n.nome); });

    LISTA_REMEDIOS.forEach(function (r) {
      if (temTodos(r.chave, regs)) res.remedios.push(r);
    });
    var exato = ts.join(' ');
    res.remedios.sort(function (a, b) {
      var pa = a.chave === exato ? -1 : a.chave.indexOf(ts[0]) === 0 ? 0 : 1, pb = b.chave === exato ? -1 : b.chave.indexOf(ts[0]) === 0 ? 0 : 1;
      return pa - pb || b.nFichas - a.nFichas || a.chave.localeCompare(b.chave);
    });

    FICHAS.forEach(function (f) {
      if (vistas[f.id] || !passaFiltro(f)) return;
      if (temTodos(f._n.corpo, regs)) res.texto.push({ f: f, trecho: trecho(f, regs) });
    });
    res.texto.sort(function (a, b) { return a.f._n.nome.localeCompare(b.f._n.nome); });

    LINHAS_TAB.forEach(function (l) { if (temTodos(l.n, regs)) res.tabelas.push(l); });
    return res;
  }

  /** Um pedaço do texto da ficha em volta do primeiro termo achado. */
  function trecho(f, regs) {
    var re = regs[0];
    for (var i = 0; i < f._corpo.length; i++) {
      var t = f._corpo[i];
      var n = norm(t);
      re.lastIndex = 0;
      var m = re.exec(n);
      if (!m) continue;
      var ini = Math.max(0, m.index - 50), fim = Math.min(t.length, m.index + 90);
      if (ini > 0) { var sp = t.indexOf(' ', ini); if (sp > 0 && sp < m.index) ini = sp + 1; }
      if (fim < t.length) { var sp2 = t.lastIndexOf(' ', fim); if (sp2 > m.index + 10) fim = sp2; }
      return (ini > 0 ? '…' : '') + marcar(t.slice(ini, fim), regs) + (fim < t.length ? '…' : '');
    }
    return '';
  }

  function resultados(q) {
    var r = buscar(q);
    var regs = r.regs;
    var qs = '?q=' + encodeURIComponent(q);
    var h = '';
    var total = r.condutas.length + r.remedios.length + r.texto.length + r.tabelas.length;
    if (!total) {
      return '<div class="vazio"><strong>Nada encontrado para “' + esc(q) + '”</strong>' +
        (E.filtro ? 'O filtro “' + esc(TAG_NOME[E.filtro]) + '” está ligado. ' : '') +
        'Tente outra palavra, o nome do remédio ou o CID.' +
        '<div class="botoes" style="justify-content:center;margin-top:14px"><button class="botao botao-claro" type="button" data-nova="' + esc(q) + '"><svg><use href="#i-somar"/></svg>Criar a conduta “' + esc(q) + '”</button></div></div>';
    }
    if (r.condutas.length) {
      h += '<h2 class="rotulo">Condutas<small>' + r.condutas.length + '</small></h2><ul class="lista">' +
        r.condutas.map(function (c) {
          var sub = c.motivo ? '<b>' + esc(c.motivo.tipo) + ':</b> ' + marcar(c.motivo.texto, regs) : esc(c.f.cid ? 'CID ' + c.f.cid : '');
          return linhaFicha(c.f, { tituloHtml: marcar(c.f.nome, regs), html: sub });
        }).join('') + '</ul>';
    }
    if (r.remedios.length) {
      h += '<h2 class="rotulo">Remédios<small>' + r.remedios.length + '</small></h2><ul class="lista">' +
        r.remedios.slice(0, 30).map(function (rm) {
          return '<li><a class="linha" href="#/r/' + encodeURIComponent(rm.chave) + '"><span class="linha-texto"><span class="linha-titulo">' + marcar(rm.nome, regs) +
            '</span><span class="linha-sub">Prescrito em ' + rm.nFichas + (rm.nFichas === 1 ? ' conduta' : ' condutas') + '</span></span></a></li>';
        }).join('') + '</ul>';
    }
    if (r.tabelas.length) {
      h += '<h2 class="rotulo">Nas tabelas<small>' + r.tabelas.length + '</small></h2><ul class="lista">' +
        r.tabelas.slice(0, 20).map(function (l) {
          return '<li><a class="linha" href="#/tabelas?l=' + l.ti + '-' + l.li + '"><span class="linha-texto"><span class="linha-titulo">' + marcar(l.cab, regs) +
            '</span><span class="linha-sub">' + esc(tituloTabela(l.t)) + '</span></span></a></li>';
        }).join('') + '</ul>';
    }
    if (r.texto.length) {
      h += '<h2 class="rotulo">Citado dentro das fichas<small>' + r.texto.length + '</small></h2><ul class="lista">' +
        r.texto.slice(0, 60).map(function (c) { return linhaFicha(c.f, { html: '<span class="trecho">' + c.trecho + '</span>' }, qs); }).join('') + '</ul>';
    }
    return h;
  }

  var timerBusca = null;
  campo.addEventListener('input', function () {
    clearTimeout(timerBusca);
    timerBusca = setTimeout(function () { desenharInicio(); window.scrollTo(0, 0); }, 90);
  });
  campo.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') campo.blur(); });
  function limparBusca() { campo.value = ''; desenharInicio(); window.scrollTo(0, 0); }
  $('#busca-limpar').addEventListener('click', function () { limparBusca(); campo.focus(); });

  /* ── ficha ──────────────────────────────────────────────────────────── */

  function selos(b) {
    return (b.selos || []).map(function (s) { return '<span class="selo selo-' + s + '" title="' + esc(SELO_NOME[s]) + '">' + (s === 'sus' ? 'SUS' : s === 'fp' ? 'Farm. Popular' : 'Controlado') + '</span>'; }).join('');
  }
  function itemHtml(b, id, comAcoes) {
    return '<div class="item" id="' + id + '"><div class="item-cab"><div class="item-nome"><span class="n">' + esc(b.n) + '.</span> ' + esc(b.nome) + ' ' + selos(b) +
      (b.qtd ? '<span class="item-qtd">' + esc(b.qtd) + '</span>' : '') + '</div>' +
      (comAcoes ? '<div class="item-acoes"><button class="icone-btn" type="button" data-acao="copiar-item" aria-label="Copiar este item"><svg><use href="#i-copiar"/></svg></button>' +
        '<button class="icone-btn" type="button" data-acao="somar-item" aria-label="Pôr na minha receita"><svg><use href="#i-somar"/></svg></button></div>' : '') +
      '</div>' + (b.uso ? '<p class="item-uso">' + b.uso + '</p>' : '') + '</div>';
  }

  function blocosHtml(s, si) {
    var h = '';
    var lista = null;
    var emAlarme = false;
    function fecha() { if (lista !== null) { h += '<ul class="marcas">' + lista + '</ul>'; lista = null; } }
    s.blocos.forEach(function (b, bi) {
      if (b.t === 'li') { if (lista === null) lista = ''; lista += '<li>' + b.html + '</li>'; return; }
      fecha();
      if (b.t === 'item') h += itemHtml(b, 'i-' + si + '-' + bi, true);
      else if (b.t === 'p') h += '<p class="para">' + b.html + '</p>';
      else if (b.t === 'ou') h += '<p class="ou"><b>OU</b> escolha 1</p>';
      else if (b.t === 'grupo') h += '<h4 class="grupo">' + esc(b.texto) + '</h4>';
      else if (b.t === 'sub') {
        if (emAlarme) { h += '</div>'; emAlarme = false; }
        var nome = NOME_TOM[b.tom] || b.texto;
        if (b.tom === 'alarme') { h += '<div class="alarme">'; emAlarme = true; }
        h += '<h4 class="sub sub-' + b.tom + '">' + esc(nome) + (b.nota ? '<small>' + esc(b.nota) + '</small>' : '') + '</h4>';
      }
    });
    fecha();
    if (emAlarme) h += '</div>';
    return h;
  }

  var fichaAtual = null;
  var fichaOriginal = false;
  function data(ms) {
    var d = new Date(ms);
    function z(n) { return (n < 10 ? '0' : '') + n; }
    return z(d.getDate()) + '/' + z(d.getMonth() + 1) + '/' + d.getFullYear();
  }

  function desenharFicha(rota) {
    var original = rota.q.original === '1' && BASE_POR_ID[rota.partes[1]];
    var f = original ? preparar(BASE_POR_ID[rota.partes[1]]) : POR_ID[rota.partes[1]];
    var corpo = $('#detalhe-corpo');
    if (!f) {
      $('#detalhe-titulo').textContent = 'Conduta';
      $('#detalhe-acoes').innerHTML = '';
      $('#detalhe-saltos').hidden = true;
      corpo.innerHTML = '<div class="vazio"><strong>Conduta não encontrada</strong></div>';
      return false;
    }
    fichaAtual = f;
    fichaOriginal = !!original;
    E.rec = [f.id].concat(E.rec.filter(function (x) { return x !== f.id; })).slice(0, 12);
    guardar();
    $('#detalhe-titulo').textContent = f.nome;
    desenharEstrela();

    var h = '<header class="ficha-topo"><div class="tags">' + f.tags.map(function (t) { return '<span class="tag ' + TAG_CLASSE(t) + '">' + esc(TAG_NOME[t]) + '</span>'; }).join('') + '</div>' +
      '<h2>' + esc(f.nome) + '</h2>' +
      '<div class="ficha-meta">' + (f.cid ? 'CID <b>' + esc(f.cid) + '</b>' : '') + '</div>';
    var vistos = {};
    var tambem = f.apelidos.concat(f._n.busque).filter(function (t) {
      var k = chave(t);
      if (!k || vistos[k] || k === chave(f.nome)) return false;
      vistos[k] = 1;
      return true;
    }).join(', ');
    if (tambem) h += '<p class="tambem"><b>Também:</b> ' + esc(tambem) + '</p>';
    if (f.atestado || f.retorno) {
      h += '<dl class="info">' + (f.atestado ? '<div><dt>Atestado sugerido</dt><dd>' + esc(f.atestado) + '</dd></div>' : '') +
        (f.retorno ? '<div><dt>Retorno</dt><dd>' + esc(f.retorno) + '</dd></div>' : '') + '</dl>';
    }
    if (original) {
      h += '<p class="ed-faixa">Você está vendo o original do PDF. <a href="#/f/' + f.id + '" data-trocar="1">Ver a sua versão</a></p>';
    } else if (f.minha) {
      var criada = f.criada || f.editada;
      h += '<p class="ed-faixa">Conduta criada por você em ' + data(criada) + (f.editada && data(f.editada) !== data(criada) ? ', alterada em ' + data(f.editada) : '') + '.</p>';
    } else if (f.editada) {
      h += '<p class="ed-faixa">Editada por você em ' + data(f.editada) + '. <a href="#/f/' + f.id + '?original=1" data-trocar="1">Ver o original do PDF</a></p>';
    }
    h += '</header>';

    var saltos = [];
    f.secoes.forEach(function (s, si) {
      var id = 's-' + si;
      var classe = 'bloco bloco-' + s.tipo;
      var acoes = '';
      if (s.tipo === 'receita') {
        acoes = '<button class="botao botao-cheio" type="button" data-acao="copiar-receita"><svg><use href="#i-copiar"/></svg>Copiar</button>';
      }
      h += '<section class="' + classe + '" id="' + id + '"><div class="bloco-cab"><h3>' + (s.sub ? esc(s.titulo) + '<small>' + esc(s.sub) + '</small>' : esc(s.titulo)) + '</h3>' + acoes + '</div><div class="bloco-corpo">';
      if (s.caso) h += '<p class="caso">Caso: <span>' + esc(s.caso) + '</span></p>';
      h += blocosHtml(s, si);
      if (s.tipo === 'receita') {
        h += '<div class="botoes" style="margin-top:12px"><button class="botao botao-claro" type="button" data-acao="montar"><svg><use href="#i-receita"/></svg>Montar a minha a partir desta</button></div>';
      }
      h += '</div></section>';
      if (s.tipo !== 'antes') saltos.push('<a class="chip" href="#' + id + '" data-salto="' + id + '">' + esc(SECAO_CURTA[s.tipo] || s.titulo) + '</a>');
    });
    if (f.referencias) h += '<p class="bloco bloco-ref"><b>Referências</b>' + esc(f.referencias) + '</p>';
    if (f.pagina) h += '<p class="pagina">' + (f.editada && !original ? 'Baseada na página ' : 'Página ') + f.pagina + ' do PDF.</p>';
    if (!original) h += '<div class="botoes" style="margin-top:12px"><a class="botao botao-claro" href="#/e/' + f.id + '"><svg><use href="#i-lapis"/></svg>Editar esta conduta</a></div>';
    corpo.innerHTML = h;
    var nav = $('#detalhe-saltos');
    nav.innerHTML = saltos.join('');
    nav.hidden = saltos.length < 2;

    var alvo = null;
    var regs = rota.q.q ? termos(rota.q.q).map(regTermo) : null;
    if (regs && regs.length) {
      marcarNoDom(corpo.querySelector('.ficha-topo'), regs, true);
      alvo = marcarNoDom(corpo, regs, false);
    }
    if (rota.q.i) {
      var el = document.getElementById(rota.q.i);
      if (el) { alvo = el; el.classList.add('realce'); }
    }
    if (alvo && !(rota.chave in rolagem)) {
      requestAnimationFrame(function () { rolarAte(alvo); });
    }
    return true;
  }

  function rolarAte(el) {
    var barra = el.closest('#tela-detalhe') ? $('#tela-detalhe .barra') : el.closest('.tela').querySelector('.barra');
    var topo = barra ? barra.getBoundingClientRect().height : 0;
    var y = el.getBoundingClientRect().top + window.scrollY - topo - 16;
    window.scrollTo(0, Math.max(0, y));
  }

  /** Marca os termos nos nós de texto; devolve o primeiro <mark> fora do cabeçalho. */
  function marcarNoDom(raiz, regs, soCabecalho) {
    if (!raiz) return null;
    var nos = [];
    var w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT, null, false);
    var n;
    while ((n = w.nextNode())) { if (n.nodeValue.trim() && !n.parentNode.closest('mark, button')) nos.push(n); }
    var primeiro = null;
    nos.forEach(function (no) {
      if (!soCabecalho && no.parentNode.closest('.ficha-topo')) return;
      var html = marcar(no.nodeValue, regs);
      if (html.indexOf('<mark>') < 0) return;
      var span = document.createElement('span');
      span.innerHTML = html;
      var m = span.querySelector('mark');
      no.parentNode.replaceChild(span, no);
      if (!primeiro && !soCabecalho) primeiro = m;
    });
    return primeiro;
  }

  function desenharEstrela() {
    var fav = fichaAtual && E.favs.indexOf(fichaAtual.id) >= 0;
    $('#detalhe-acoes').innerHTML = (fichaOriginal ? '' : '<a class="icone-btn" href="#/e/' + fichaAtual.id + '" aria-label="Editar esta conduta"><svg><use href="#i-lapis"/></svg></a>') + '<button class="icone-btn' + (fav ? ' ativo' : '') + '" type="button" data-acao="favorita" aria-pressed="' + fav + '" aria-label="' + (fav ? 'Tirar das favoritas' : 'Guardar nas favoritas') + '"><svg><use href="#' + (fav ? 'i-estrela-cheia' : 'i-estrela') + '"/></svg></button>';
  }

  function blocoDoItem(el) {
    var m = /^i-(\d+)-(\d+)$/.exec(el.id);
    if (!m || !fichaAtual) return null;
    return fichaAtual.secoes[+m[1]].blocos[+m[2]];
  }

  $('#tela-detalhe').addEventListener('click', function (ev) {
    var salto = ev.target.closest('[data-salto]');
    if (salto) {
      ev.preventDefault();
      var alvo = document.getElementById(salto.getAttribute('data-salto'));
      if (alvo) rolarAte(alvo);
      return;
    }
    var b = ev.target.closest('[data-acao]');
    if (!b) return;
    var acao = b.getAttribute('data-acao');
    if (acao === 'favorita' && fichaAtual) {
      var i = E.favs.indexOf(fichaAtual.id);
      if (i >= 0) E.favs.splice(i, 1); else E.favs.unshift(fichaAtual.id);
      guardar();
      desenharEstrela();
      avisar(i >= 0 ? 'Tirada das favoritas' : 'Guardada nas favoritas');
      ultimaBusca = null;
    } else if (acao === 'copiar-receita' && fichaAtual) {
      var r = receitaDa(fichaAtual);
      copiar(textoReceita(r.itens, r.orient, r.alarme), 'Receita copiada');
    } else if (acao === 'montar' && fichaAtual) {
      var antes = JSON.parse(JSON.stringify(E.receita));
      E.receita = receitaDa(fichaAtual);
      guardar();
      contador();
      if (antes.itens.length) {
        avisar('Receita montada (a anterior foi trocada)', 'Desfazer', function () { E.receita = antes; guardar(); contador(); });
      } else {
        avisar('Receita montada', 'Abrir', function () { ir('#/receita'); });
      }
    } else if (acao === 'copiar-item' || acao === 'somar-item') {
      var el = b.closest('.item');
      var blk = el && blocoDoItem(el);
      if (!blk) return;
      var it = itemDe(blk, fichaAtual);
      if (acao === 'copiar-item') copiar(linhaItem(it), 'Item copiado');
      else somarItem(it);
    }
  });

  function somarItem(it) {
    var ja = E.receita.itens.some(function (x) { return x.nome === it.nome && x.uso === it.uso; });
    if (ja) { avisar('Esse item já está na sua receita', 'Abrir', function () { ir('#/receita'); }); return; }
    E.receita.itens.push(it);
    guardar();
    contador();
    avisar('Na sua receita: ' + E.receita.itens.length + (E.receita.itens.length === 1 ? ' item' : ' itens'), 'Abrir', function () { ir('#/receita'); });
  }

  /* ── remédios ───────────────────────────────────────────────────────── */

  var campoRem = $('#busca-rem');
  function desenharRemedios() {
    var q = campoRem.value.trim();
    $('#busca-rem-limpar').hidden = !q;
    var regs = termos(q).map(regTermo);
    var lista = regs.length ? LISTA_REMEDIOS.filter(function (r) { return temTodos(r.chave, regs); }) : LISTA_REMEDIOS;
    var h = '<h2 class="rotulo">' + (q ? 'Remédios com “' + esc(q) + '”' : 'Todos os remédios das receitas') + '<small>' + lista.length + '</small></h2>';
    if (!lista.length) { $('#remedios-corpo').innerHTML = h + '<div class="vazio"><strong>Nenhum remédio com esse nome</strong>Na aba Condutas a busca também olha dentro do texto das fichas.</div>'; return; }
    h += '<ul class="lista">';
    var letraAtual = '';
    lista.forEach(function (r) {
      var l = r.chave.charAt(0).toUpperCase();
      if (!q && l !== letraAtual) { letraAtual = l; h += '<li class="letra">' + l + '</li>'; }
      h += '<li><a class="linha" href="#/r/' + encodeURIComponent(r.chave) + '"><span class="linha-texto"><span class="linha-titulo">' + marcar(r.nome, regs) + '</span></span><span class="linha-fim">' + r.nFichas + '</span></a></li>';
    });
    $('#remedios-corpo').innerHTML = h + '</ul>';
  }
  campoRem.addEventListener('input', function () { desenharRemedios(); window.scrollTo(0, 0); });
  campoRem.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') campoRem.blur(); });
  $('#busca-rem-limpar').addEventListener('click', function () { campoRem.value = ''; desenharRemedios(); campoRem.focus(); });

  function desenharRemedio(k) {
    var r = REMEDIOS[k];
    var corpo = $('#detalhe-corpo');
    $('#detalhe-saltos').hidden = true;
    $('#detalhe-acoes').innerHTML = '';
    fichaAtual = null;
    if (!r) { $('#detalhe-titulo').textContent = 'Remédio'; corpo.innerHTML = '<div class="vazio"><strong>Remédio não encontrado</strong></div>'; return; }
    $('#detalhe-titulo').textContent = r.nome;
    var porFicha = [];
    var idx = {};
    r.usos.forEach(function (u) {
      if (!(u.f.id in idx)) { idx[u.f.id] = porFicha.length; porFicha.push({ f: u.f, usos: [] }); }
      porFicha[idx[u.f.id]].usos.push(u);
    });
    porFicha.sort(function (a, b) { return a.f._n.nome.localeCompare(b.f._n.nome); });
    var h = '<header class="ficha-topo"><h2>' + esc(r.nome) + '</h2><div class="ficha-meta">Prescrito em ' + porFicha.length + (porFicha.length === 1 ? ' conduta' : ' condutas') + '</div></header>';

    // nas tabelas o nome vem curto ("Ibuprofeno, naproxeno"): basta a 1ª palavra, se não for genérica
    var palavras = termos(r.nome);
    var GENERICAS = { acido: 1, sulfato: 1, carbonato: 1, soro: 1, sais: 1, vacina: 1, sabonete: 1, creme: 1, gaze: 1, meia: 1, oleo: 1, lagrima: 1, protetor: 1 };
    var regsTab = (GENERICAS[palavras[0]] ? palavras : palavras.slice(0, 1)).map(regTermo);
    var regs = palavras.map(regTermo);
    var linhas = LINHAS_TAB.filter(function (l) { return temTodos(l.ncab, regsTab); });
    if (linhas.length) {
      h += '<h3 class="rotulo">Nas tabelas</h3><div class="ficha-grupo">' + linhas.map(function (l) { return linhaTabelaHtml(l.t, l.t.linhas[l.li], l.ti + '-' + l.li, true); }).join('') + '</div>';
    }
    h += '<h3 class="rotulo">Como aparece nas receitas</h3>';
    porFicha.forEach(function (g) {
      h += '<div class="ficha-grupo"><a class="ficha-grupo-cab" href="#/f/' + g.f.id + '"><span>' + esc(g.f.nome) + pontosTags(g.f) + '</span><svg><use href="#i-voltar"/></svg></a>';
      g.usos.forEach(function (u) {
        var s = u.f.secoes[u.si], b = s.blocos[u.bi];
        h += '<a class="uso-cartao" href="#/f/' + u.f.id + '?i=i-' + u.si + '-' + u.bi + '"><span class="uso-de"><span>' + esc(s.titulo) + '</span></span>' +
          '<span class="item-nome">' + esc(b.nome) + ' ' + selos(b) + (b.qtd ? '<span class="item-qtd">' + esc(b.qtd) + '</span>' : '') + '</span>' +
          (b.uso ? '<p class="item-uso">' + b.uso + '</p>' : '') + '</a>';
      });
      h += '</div>';
    });
    // fichas que só citam o remédio no texto (ex.: "Gestante: cefalexina ou clindamicina")
    var citam = FICHAS.filter(function (f) { return !(f.id in idx) && temTodos(f._n.corpo, regs); });
    if (citam.length) {
      h += '<h3 class="rotulo">Citado também em<small>' + citam.length + '</small></h3><ul class="lista">' +
        citam.map(function (f) { return linhaFicha(f, { html: '<span class="trecho">' + trecho(f, regs) + '</span>' }, '?q=' + encodeURIComponent(r.nome)); }).join('') + '</ul>';
    }
    corpo.innerHTML = h;
  }

  /* ── tabelas ────────────────────────────────────────────────────────── */

  function tituloTabela(t) {
    var s = t.titulo.charAt(0) + t.titulo.slice(1).toLowerCase();
    return s.replace(/\b(e|de|na|da|do)\b/g, function (x) { return x; });
  }
  function linhaTabelaHtml(t, l, id, comTitulo) {
    var h = '<div class="tab-linha" id="l-' + id + '"><h4>' + l[0] + '</h4><dl>';
    for (var i = 1; i < l.length; i++) {
      if (!l[i]) continue;
      h += '<dt>' + esc(t.colunas[i] || '') + '</dt><dd>' + l[i] + '</dd>';
    }
    h += '</dl>' + (comTitulo ? '<p class="tab-nota" style="margin:6px 0 0">' + esc(tituloTabela(t)) + '</p>' : '') + '</div>';
    return h;
  }
  var tabelasProntas = false;
  function desenharTabelas() {
    if (!tabelasProntas) {
      var h = '', saltos = [], tituloAnt = null;
      TABELAS.forEach(function (t, ti) {
        var novo = t.titulo !== tituloAnt;
        tituloAnt = t.titulo;
        h += '<section class="tabela" id="t-' + ti + '">';
        if (novo) {
          h += '<h2>' + esc(tituloTabela(t)) + '</h2>';
          saltos.push('<a class="chip" href="#t-' + ti + '" data-tab="t-' + ti + '">' + esc(curtoTabela(t)) + '</a>');
        } else {
          h += '<h2 style="font-size:.95rem;margin-top:14px">' + esc(t.colunas[0]) + '</h2>';
        }
        if (t.sub) h += '<p class="tab-sub">' + t.sub + '</p>';
        h += '<div class="tab-acoes">' + (t.editada ? '<span>Editada por você em ' + data(t.editada) + '</span>' : '<span></span>') +
          '<a class="mini-btn" href="#/et/' + ti + '"><svg><use href="#i-lapis"/></svg>Editar tabela</a></div>';
        h += '<div class="ficha-grupo">' + t.linhas.map(function (l, li) { return linhaTabelaHtml(t, l, ti + '-' + li); }).join('') + '</div>';
        t.notas.forEach(function (n) { h += '<p class="tab-nota">' + n + '</p>'; });
        h += '</section>';
      });
      $('#tabelas-corpo').innerHTML = h;
      $('#tabelas-saltos').innerHTML = saltos.join('');
      tabelasProntas = true;
    }
    var r = lerRota();
    if (r.q.l) {
      var el = document.getElementById('l-' + r.q.l);
      if (el) {
        el.classList.remove('realce'); void el.offsetWidth; el.classList.add('realce');
        if (!(r.chave in rolagem)) requestAnimationFrame(function () { rolarAte(el); });
      }
    }
  }
  function curtoTabela(t) {
    var k = norm(t.titulo);
    if (k.indexOf('antibioticos') === 0) return 'Antibióticos';
    if (k.indexOf('outros') === 0) return 'Gestação e amamentação';
    if (k.indexOf('analgesicos') === 0) return 'Doses máximas';
    if (k.indexOf('corticoides') === 0) return 'Corticoides';
    if (k.indexOf('tipos') === 0) return 'Tipos de receita';
    return t.titulo;
  }
  $('#tabelas-saltos').addEventListener('click', function (ev) {
    var a = ev.target.closest('[data-tab]');
    if (!a) return;
    ev.preventDefault();
    rolarAte(document.getElementById(a.getAttribute('data-tab')));
  });

  /* ── minha receita ──────────────────────────────────────────────────── */

  function contador() {
    var n = E.receita.itens.length;
    var c = $('#contador');
    c.hidden = !n;
    c.textContent = n;
  }

  function desenharReceita() {
    var R = E.receita;
    var corpo = $('#receita-corpo');
    if (!R.itens.length && !R.orient.length && !R.alarme.length) {
      corpo.innerHTML = '<div class="vazio"><strong>Sua receita está vazia</strong>' +
        'Numa conduta, toque em <b>Montar a minha a partir desta</b> para começar pela receita pronta, ou no <b>+</b> de qualquer item para juntá-lo aqui. ' +
        'Dá para misturar itens de condutas diferentes.</div>';
      return;
    }
    var h = '<h2 class="rotulo">Remédios<small>' + R.itens.length + '</small></h2>';
    if (R.itens.length) {
      h += '<div class="ficha-grupo">' + R.itens.map(function (it, i) {
        return '<div class="rec-item"><div class="rec-texto"><span class="item-nome"><span class="n">' + (i + 1) + '.</span> ' + esc(it.nome) +
          (it.qtd ? '<span class="item-qtd">' + esc(it.qtd) + '</span>' : '') + '</span>' + (it.uso ? '<p class="item-uso">' + esc(it.uso) + '</p>' : '') +
          '<span class="rec-de">De: ' + esc(it.de) + '</span></div>' +
          '<button class="icone-btn" type="button" data-tirar="' + i + '" aria-label="Tirar este item"><svg><use href="#i-x"/></svg></button></div>';
      }).join('') + '</div>';
    } else {
      h += '<div class="vazio" style="padding:12px">Nenhum remédio. Junte itens pelo <b>+</b> nas condutas.</div>';
    }
    var marcados = R.marcados || {};
    if (R.orient.length || R.alarme.length) {
      h += '<h2 class="rotulo">Orientações<small>desmarque o que não vai</small></h2><div class="ficha-grupo rec-orient">';
      if (R.orient.length) {
        h += R.orient.map(function (o, i) { return '<label><input type="checkbox" data-orient="o' + i + '"' + (marcados['o' + i] === false ? '' : ' checked') + '><span>' + esc(o) + '</span></label>'; }).join('');
      }
      if (R.alarme.length) {
        h += '<h4 class="alarme">Retornar imediatamente se</h4>' + R.alarme.map(function (o, i) { return '<label><input type="checkbox" data-orient="a' + i + '"' + (marcados['a' + i] === false ? '' : ' checked') + '><span>' + esc(o) + '</span></label>'; }).join('');
      }
      h += '</div>';
    }
    h += '<h2 class="rotulo">Como vai ficar</h2><pre class="previa" id="previa"></pre>';
    h += '<div class="rodape-acoes botoes"><button class="botao botao-cheio" type="button" data-rec="copiar"><svg><use href="#i-copiar"/></svg>Copiar</button>' +
      '<button class="botao botao-claro" type="button" data-rec="partilhar"><svg><use href="#i-partilhar"/></svg>Compartilhar</button>' +
      '<button class="icone-btn" type="button" data-rec="limpar" style="margin-left:auto;color:var(--vermelho)" aria-label="Limpar a receita"><svg><use href="#i-lixo"/></svg></button></div>';
    corpo.innerHTML = h;
    $('#previa').textContent = textoMontado();
  }
  function textoMontado() {
    var R = E.receita, m = R.marcados || {};
    return textoReceita(R.itens,
      R.orient.filter(function (_, i) { return m['o' + i] !== false; }),
      R.alarme.filter(function (_, i) { return m['a' + i] !== false; }));
  }
  $('#receita-corpo').addEventListener('change', function (ev) {
    var c = ev.target.closest('[data-orient]');
    if (!c) return;
    E.receita.marcados = E.receita.marcados || {};
    E.receita.marcados[c.getAttribute('data-orient')] = c.checked;
    guardar();
    $('#previa').textContent = textoMontado();
  });
  $('#receita-corpo').addEventListener('click', function (ev) {
    var t = ev.target.closest('[data-tirar]');
    if (t) {
      var i = +t.getAttribute('data-tirar');
      var tirado = E.receita.itens.splice(i, 1)[0];
      guardar(); contador(); desenharReceita();
      avisar('Item tirado', 'Desfazer', function () { E.receita.itens.splice(i, 0, tirado); guardar(); contador(); desenharReceita(); });
      return;
    }
    var b = ev.target.closest('[data-rec]');
    if (!b) return;
    var acao = b.getAttribute('data-rec');
    if (acao === 'copiar') copiar(textoMontado(), 'Receita copiada');
    else if (acao === 'partilhar') compartilhar('Receita', textoMontado());
    else if (acao === 'limpar') {
      var antes = E.receita;
      E.receita = { itens: [], orient: [], alarme: [] };
      guardar(); contador(); desenharReceita();
      avisar('Receita limpa', 'Desfazer', function () { E.receita = antes; guardar(); contador(); desenharReceita(); });
    }
  });

  /* ── sobre e ajustes ────────────────────────────────────────────────── */

  function desenharSobre() {
    fichaAtual = null;
    $('#detalhe-titulo').textContent = 'Sobre e ajustes';
    $('#detalhe-acoes').innerHTML = '';
    $('#detalhe-saltos').hidden = true;
    var versao = '';
    try { if (ponte && ponte.versao) versao = ponte.versao(); } catch (e) { versao = ''; }
    var nItens = D.fichas.reduce(function (a, f) { return a + f.secoes.reduce(function (b, s) { return b + s.blocos.filter(function (x) { return x.t === 'item'; }).length; }, 0); }, 0);
    var h = '<h2 class="rotulo">Ajustes</h2><div class="ficha-grupo">' +
      '<div class="ajuste"><span>Tema</span><span class="segmentos" data-ajuste="tema">' +
      [['auto', 'Sistema'], ['claro', 'Claro'], ['escuro', 'Escuro']].map(function (o) { return '<button type="button" data-v="' + o[0] + '" aria-pressed="' + (E.tema === o[0]) + '">' + o[1] + '</button>'; }).join('') + '</span></div>' +
      '<div class="ajuste"><span>Tamanho da letra</span><span class="segmentos" data-ajuste="fs">' +
      [[15, 'A−'], [16, 'A'], [18, 'A+'], [20, 'A++']].map(function (o) { return '<button type="button" data-v="' + o[0] + '" aria-pressed="' + (E.fs === o[0]) + '">' + o[1] + '</button>'; }).join('') + '</span></div></div>';
    h += blocoCopia();
    h += '<h2 class="rotulo">Legenda</h2><div class="ficha-grupo" style="padding:12px 14px"><div class="legenda">' +
      '<div><span class="selo selo-sus">SUS</span> costuma estar na rede pública (RENAME)</div>' +
      '<div><span class="selo selo-fp">Farm. Popular</span> gratuito no programa Farmácia Popular</div>' +
      '<div><span class="selo selo-ce">Controlado</span> exige receita de controle especial</div>' +
      ['PLANTÃO', 'AMBULATÓRIO', 'GESTANTE', 'PEDIATRIA', 'IST'].map(function (t) {
        var d = { 'PLANTÃO': 'conduta de PS/UPA', 'AMBULATÓRIO': 'conduta de UBS e consultório', 'GESTANTE': 'tem opção na gestação', 'PEDIATRIA': 'tem dose infantil', 'IST': 'notificar e tratar parceria' }[t];
        return '<div><span class="tag ' + TAG_CLASSE(t) + '">' + TAG_NOME[t] + '</span> ' + d + '</div>';
      }).join('') + '</div><p class="tab-nota">A disponibilidade no SUS muda de município para município: confira a lista da sua rede.</p></div>';
    h += '<h2 class="rotulo">Antes de copiar</h2><div class="ficha-grupo texto" style="padding:4px 14px"><ul>' +
      '<li>Adapte sempre à realidade do paciente: idade, alergias, comorbidades, peso, gestação, amamentação, função renal e remédios em uso.</li>' +
      '<li>Antibiótico: receita em 2 vias, validade de 10 dias. Controlados: veja a tabela de tipos de receita.</li>' +
      '<li>Reforce as orientações verbais: o paciente precisa saber quando voltar, o que observar e como tomar.</li>' +
      '<li>Este material apoia o raciocínio clínico; quem decide é você.</li></ul></div>';
    h += '<h2 class="rotulo">De onde vem</h2><div class="ficha-grupo texto" style="padding:4px 14px">' +
      '<p>Conteúdo do <b>Drive de Prescrições</b>, da Dra. Camilla Rocha (CRM-SP 265.940), versão completa de novembro de 2026: ' +
      D.fichas.length + ' condutas, ' + nItens + ' itens de receita e ' + D.tabelas.length + ' tabelas.</p>' +
      '<p>O app reorganiza o texto do PDF para achar rápido e deixa você atualizar o que quiser. Funciona sem internet e não manda nada para lugar nenhum. Favoritas, receita montada e suas alterações ficam só neste aparelho.</p>' +
      (versao ? '<p class="tab-nota">Versão do app: ' + esc(versao) + '</p>' : '') + '</div>';
    $('#detalhe-corpo').innerHTML = h;
  }
  $('#tela-detalhe').addEventListener('click', function (ev) {
    var c = ev.target.closest('[data-copia]');
    if (c) { if (c.getAttribute('data-copia') === 'salvar') exportarEdicoes(); else importarEdicoes(); return; }
    var b = ev.target.closest('[data-ajuste] button');
    if (!b) return;
    var qual = b.parentNode.getAttribute('data-ajuste');
    var v = b.getAttribute('data-v');
    if (qual === 'tema') E.tema = v; else E.fs = +v;
    guardar();
    aplicarTema();
    $$('button', b.parentNode).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
  });

  /* ── caixa de pergunta ──────────────────────────────────────────────── */

  var dialogo = null;
  /** botoes: [{t: 'texto', v: valor, cheio, perigo}]; fn(valor) — undefined se fechar sem escolher. */
  function perguntar(msg, botoes, fn, lista) {
    fecharDialogo();
    var fundo = document.createElement('div');
    fundo.className = 'dialogo-fundo';
    fundo.innerHTML = '<div class="dialogo" role="alertdialog" aria-modal="true"><p>' + esc(msg) + '</p><div class="botoes' + (lista ? ' botoes-lista' : '') + '">' +
      botoes.map(function (b, i) {
        return '<button type="button" class="botao ' + (b.perigo ? 'botao-perigo-cheio' : b.cheio ? 'botao-cheio' : 'botao-claro') + '" data-i="' + i + '">' + esc(b.t) + '</button>';
      }).join('') + '</div></div>';
    document.body.appendChild(fundo);
    dialogo = { el: fundo, fn: fn };
    fundo.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-i]');
      if (!b && ev.target !== fundo) return;
      var v = b ? botoes[+b.getAttribute('data-i')].v : undefined;
      fecharDialogo();
      if (fn) fn(v);
    });
  }
  function fecharDialogo() {
    if (!dialogo) return;
    dialogo.el.parentNode.removeChild(dialogo.el);
    dialogo = null;
  }

  /* ── edição: texto ↔ HTML ───────────────────────────────────────────── */

  // No editor o negrito é **assim**; na ficha vira o rótulo em destaque ("Gestante:").
  function htmlParaTexto(h) {
    return semTags(String(h || '').replace(/<br\s*\/?>/g, '\u0001').replace(/<b class="\w+">([\s\S]*?)<\/b>/g, '**$1**')).replace(/\u0001/g, '\n');
  }
  function textoParaHtml(t) {
    return esc(String(t).trim()).replace(/\*\*([^*\n]+?)\*\*/g, '<b class="rot">$1</b>').replace(/[ \t]*\n+[ \t]*/g, '<br>');
  }

  // nome do remédio sem dose nem forma (mesma regra do extrator)
  var FORMA = /\s(\d|\(|(?:cp|comp|creme|pomada|gel|xarope|solução|suspensão|colírio|spray|loção|shampoo|xampu|gotas|sachê|ampola|frasco|injetável|tópico|EV|IM|FPS)(?=[\s,;.)]|$)|em\s+gotas)/i;
  function remediosDoItem(nome) {
    var n = String(nome).trim().replace(/^(Nebulização|Inalação)\s*:\s*/i, '');
    var partes = n.split(/\s+\+\s+|\s+ou\s+(?=[A-ZÁÉÍÓÚ])/);
    if (partes.length > 1 && !partes.slice(0, -1).every(function (p) { return /\d/.test(p); })) partes = [n];
    var res = [];
    partes.forEach(function (p) {
      p = p.split(/\s+[-–]\s+/)[0];
      var m = FORMA.exec(p);
      if (m && m.index > 0) p = p.slice(0, m.index);
      p = p.replace(/^[\s,.;:]+|[\s,.;:]+$/g, '');
      if (p.toUpperCase() === 'SF') p = 'Soro fisiológico';
      if (p) {
        p = p.charAt(0).toUpperCase() + p.slice(1);
        if (res.indexOf(p) < 0) res.push(p);
      }
    });
    return res;
  }

  /* ── edição: rascunho ───────────────────────────────────────────────── */

  // ED: o que está aberto no editor. {tipo: 'ficha'|'tabela', id, ti, r: rascunho, orig: JSON do começo, nova}
  var ED = null;
  var timerRascunho = null;

  function rascunhoSujo() { return !!ED && JSON.stringify(ED.r) !== ED.orig; }
  function guardarRascunho() {
    clearTimeout(timerRascunho);
    timerRascunho = setTimeout(function () {
      if (!ED) return;
      E.rascunho = rascunhoSujo() || ED.nova ? ED : null;
      if (!E.rascunho) delete E.rascunho;
      guardar();
    }, 400);
  }
  function fecharEditor() {
    clearTimeout(timerRascunho);
    ED = null;
    delete E.rascunho;
    guardar();
  }
  function sairDoEditor() {
    if (!rascunhoSujo()) { fecharEditor(); voltarOu('#/'); return; }
    perguntar('Sair sem salvar? O que você mudou agora será perdido.', [
      { t: 'Continuar editando' }, { t: 'Sair sem salvar', v: 1, perigo: true }
    ], function (v) { if (v) { fecharEditor(); voltarOu('#/'); } });
  }
  function depoisDeMudar() {
    indexar();
    ultimaBusca = null;
    tabelasProntas = false;
    desenharFiltros();
    guardar();
  }

  function paraRascunho(f) {
    var vistos = {};
    var tambem = (f.apelidos || []).concat(f.busque ? f.busque.split(/\s*,\s*/) : []).filter(function (t) {
      var k = chave(t);
      if (!k || vistos[k] || k === chave(f.nome || '')) return false;
      vistos[k] = 1;
      return true;
    });
    return {
      nome: f.nome || '', cid: f.cid || '', tags: (f.tags || []).slice(), tambem: tambem.join(', '),
      atestado: f.atestado || '', retorno: f.retorno || '', referencias: f.referencias || '',
      secoes: (f.secoes || []).map(function (s) {
        return {
          tipo: s.tipo, titulo: s.titulo, sub: s.sub || '', caso: s.caso || '',
          blocos: s.blocos.map(function (b) {
            if (b.t === 'item') return { t: 'item', n: b.n || '', nome: b.nome || '', qtd: b.qtd || '', uso: htmlParaTexto(b.uso), selos: (b.selos || []).slice() };
            if (b.t === 'li' || b.t === 'p') return { t: b.t, txt: htmlParaTexto(b.html), nota: !!b.nota };
            if (b.t === 'sub') return { t: 'sub', tom: NOME_TOM[b.tom] ? b.tom : 'orient', nota: b.nota || '' };
            if (b.t === 'grupo') return { t: 'grupo', texto: b.texto || '' };
            return { t: 'ou' };
          })
        };
      })
    };
  }

  function deRascunho(r) {
    var secoes = [];
    r.secoes.forEach(function (s) {
      var blocos = [], nItem = 0;
      s.blocos.forEach(function (b) {
        if (b.t === 'item') {
          if (!b.nome.trim() && !b.uso.trim()) return;
          nItem++;
          var it = { t: 'item', n: b.n.trim().replace(/\.$/, '') || String(nItem), nome: b.nome.trim(), remedios: remediosDoItem(b.nome) };
          if (b.qtd.trim()) it.qtd = b.qtd.trim();
          if (b.uso.trim()) it.uso = textoParaHtml(b.uso);
          if (b.selos.length) it.selos = b.selos.slice();
          blocos.push(it);
        } else if (b.t === 'li' || b.t === 'p') {
          if (!b.txt.trim()) return;
          var o = { t: b.t, html: textoParaHtml(b.txt) };
          if (b.nota) o.nota = true;
          blocos.push(o);
        } else if (b.t === 'sub') {
          var sb = { t: 'sub', tom: b.tom, texto: NOME_TOM[b.tom].toUpperCase() };
          if (b.nota && b.nota.trim()) sb.nota = b.nota.trim();
          blocos.push(sb);
        } else if (b.t === 'grupo') {
          if (b.texto.trim()) blocos.push({ t: 'grupo', texto: b.texto.trim() });
        } else {
          blocos.push({ t: 'ou' });
        }
      });
      if (!blocos.length && !s.caso.trim()) return;
      var sec = { tipo: s.tipo, titulo: s.titulo, blocos: blocos };
      if (s.sub) sec.sub = s.sub;
      if (s.caso.trim()) sec.caso = s.caso.trim();
      secoes.push(sec);
    });
    var nome = r.nome.trim();
    return {
      titulo: nome.toUpperCase(), nome: nome, cid: r.cid.trim(),
      tags: TAGS.filter(function (t) { return r.tags.indexOf(t) >= 0; }),
      busque: r.tambem.split(/\s*[,;\n]\s*/).map(function (x) { return x.trim(); }).filter(Boolean).join(', '),
      apelidos: [], atestado: r.atestado.trim(), retorno: r.retorno.trim(),
      secoes: secoes, referencias: r.referencias.trim()
    };
  }

  function secaoNova(tipo) {
    var vazio = function () { return { t: 'item', n: '', nome: '', qtd: '', uso: '', selos: [] }; };
    var li = function () { return { t: 'li', txt: '', nota: false }; };
    var s = { tipo: tipo, titulo: { antes: 'Antes de prescrever', receita: 'Receita pronta', opcoes: 'Outras opções e ajustes', unidade: 'Na unidade', plantonista: 'Para o plantonista' }[tipo], sub: tipo === 'unidade' ? 'prescrição do PS' : '', caso: '', blocos: [] };
    if (tipo === 'antes') s.blocos = [{ t: 'p', txt: '', nota: false }];
    else if (tipo === 'receita') s.blocos = [vazio(), { t: 'sub', tom: 'orient', nota: '' }, li(), { t: 'sub', tom: 'alarme', nota: '' }, li()];
    else if (tipo === 'plantonista') s.blocos = [{ t: 'sub', tom: 'seguranca', nota: '' }, li(), { t: 'sub', tom: 'encaminhar', nota: '' }, li()];
    else s.blocos = [vazio()];
    return s;
  }

  function novaConduta(nome) {
    var id = 'minha-' + Date.now().toString(36);
    var r = { nome: nome || '', cid: '', tags: [], tambem: '', atestado: '', retorno: '', referencias: '', secoes: [secaoNova('receita')] };
    ED = { tipo: 'ficha', id: id, r: r, orig: JSON.stringify(r), nova: true };
    E.rascunho = ED;
    guardar();
    ir('#/e/' + id);
  }

  /* ── edição: tela da conduta ────────────────────────────────────────── */

  function abrirEditor(id) {
    fichaAtual = null;
    $('#detalhe-saltos').hidden = true;
    if (!ED || ED.tipo !== 'ficha' || ED.id !== id) {
      if (E.rascunho && E.rascunho.tipo === 'ficha' && E.rascunho.id === id) {
        ED = E.rascunho;
        ED.recuperado = true;
      } else if (POR_ID[id]) {
        var r = paraRascunho(POR_ID[id]);
        ED = { tipo: 'ficha', id: id, r: r, orig: JSON.stringify(r), nova: !BASE_POR_ID[id] };
      } else {
        ED = null;
        $('#detalhe-titulo').textContent = 'Editar';
        $('#detalhe-acoes').innerHTML = '';
        $('#detalhe-corpo').innerHTML = '<div class="vazio"><strong>Conduta não encontrada</strong></div>';
        return;
      }
    }
    desenharEditor();
  }

  function campoEd(rotulo, caminho, valor, tipo, dica) {
    var c = 'data-c="' + caminho + '" placeholder="' + esc(dica || '') + '"';
    return '<label class="campo"><span class="campo-rot">' + esc(rotulo) + '</span>' +
      (tipo === 'area' ? '<textarea rows="2" ' + c + '>' + esc(valor) + '</textarea>' : '<input type="text" ' + c + ' value="' + esc(valor) + '">') + '</label>';
  }
  function ferramentas(si, bi, total) {
    var d = ' data-s="' + si + '" data-b="' + bi + '"';
    return '<span class="ed-ferr">' +
      '<button type="button" class="icone-btn" data-ed="subir"' + d + (bi === 0 ? ' disabled' : '') + ' aria-label="Subir"><svg><use href="#i-cima"/></svg></button>' +
      '<button type="button" class="icone-btn" data-ed="descer"' + d + (bi === total - 1 ? ' disabled' : '') + ' aria-label="Descer"><svg><use href="#i-baixo"/></svg></button>' +
      '<button type="button" class="icone-btn" data-ed="tirar"' + d + ' aria-label="Apagar"><svg><use href="#i-lixo"/></svg></button></span>';
  }
  function blocoEd(b, si, bi, total) {
    var p = 'secoes.' + si + '.blocos.' + bi + '.';
    var cab = function (nome) { return '<div class="ed-bloco-cab"><span class="ed-tipo">' + nome + '</span>' + ferramentas(si, bi, total) + '</div>'; };
    var id = ' id="eb-' + si + '-' + bi + '"';
    if (b.t === 'item') {
      return '<div class="ed-bloco ed-item"' + id + '>' + cab('Remédio') +
        '<div class="ed-linha"><input type="text" class="ed-n" data-c="' + p + 'n" value="' + esc(b.n) + '" placeholder="nº" aria-label="Número">' +
        '<input type="text" data-c="' + p + 'nome" value="' + esc(b.nome) + '" placeholder="Remédio e apresentação (ex.: Cefalexina 500 mg)" aria-label="Remédio"></div>' +
        '<input type="text" data-c="' + p + 'qtd" value="' + esc(b.qtd) + '" placeholder="Quantidade (ex.: 28 cápsulas)" aria-label="Quantidade">' +
        '<textarea rows="2" data-c="' + p + 'uso" placeholder="Como usar (ex.: Tomar 1 cápsula, via oral, de 6/6h, por 7 dias.)" aria-label="Como usar">' + esc(b.uso) + '</textarea>' +
        '<div class="ed-chips">' + ['sus', 'fp', 'ce'].map(function (x) {
          return '<button type="button" class="chip" data-ed="selo" data-s="' + si + '" data-b="' + bi + '" data-v="' + x + '" aria-pressed="' + (b.selos.indexOf(x) >= 0) + '">' + SELO_CURTO[x] + '</button>';
        }).join('') + '</div></div>';
    }
    if (b.t === 'li' || b.t === 'p') {
      return '<div class="ed-bloco"' + id + '>' + cab(b.t === 'li' ? 'Tópico' : 'Parágrafo') +
        '<textarea rows="2" data-c="' + p + 'txt" aria-label="Texto">' + esc(b.txt) + '</textarea></div>';
    }
    if (b.t === 'sub') {
      return '<div class="ed-bloco ed-sub"' + id + '>' + cab('Título de lista') +
        '<select data-c="' + p + 'tom" aria-label="Título">' + Object.keys(NOME_TOM).map(function (k) {
          return '<option value="' + k + '"' + (b.tom === k ? ' selected' : '') + '>' + NOME_TOM[k] + '</option>';
        }).join('') + '</select></div>';
    }
    if (b.t === 'grupo') {
      return '<div class="ed-bloco"' + id + '>' + cab('Grupo de opções') +
        '<input type="text" data-c="' + p + 'texto" value="' + esc(b.texto) + '" placeholder="Ex.: ANTIBIÓTICO, QUANDO INDICADO (ESCOLHER 1)" aria-label="Grupo"></div>';
    }
    return '<div class="ed-bloco ed-ou"' + id + '>' + cab('<b>OU</b> escolha 1') + '</div>';
  }

  function desenharEditor() {
    var r = ED.r;
    $('#detalhe-titulo').textContent = ED.nova && !POR_ID[ED.id] ? 'Nova conduta' : 'Editar conduta';
    $('#detalhe-acoes').innerHTML = '<button class="botao botao-cheio" type="button" data-ed="salvar"><svg><use href="#i-feito"/></svg>Salvar</button>';
    var h = '';
    if (ED.recuperado) h += '<p class="ed-faixa">Continuando a edição que não tinha sido salva.</p>';
    h += '<p class="ed-dica">Escreva <b>**assim**</b> para destacar em negrito (ex.: <b>**Gestante:**</b> evitar…). Campo vazio some da ficha.</p>';
    h += '<section class="ed-card"><h3 class="ed-titulo">Identificação</h3>' +
      campoEd('Nome da conduta', 'nome', r.nome, 'input', 'Ex.: Cistite / ITU não complicada') +
      campoEd('CID', 'cid', r.cid, 'input', 'Ex.: N30.0 / N39.0') +
      '<div class="campo"><span class="campo-rot">Etiquetas</span><div class="ed-chips">' + TAGS.map(function (t) {
        return '<button type="button" class="chip" data-ed="tag" data-v="' + t + '" aria-pressed="' + (r.tags.indexOf(t) >= 0) + '"><i class="ponto ' + TAG_CLASSE(t) + '"></i>' + TAG_NOME[t] + '</button>';
      }).join('') + '</div></div>' +
      campoEd('Outros nomes, para achar na busca', 'tambem', r.tambem, 'area', 'Separados por vírgula: ITU, infecção de urina, ardência para urinar') +
      campoEd('Atestado sugerido', 'atestado', r.atestado, 'input', 'Ex.: 1 a 2 dias') +
      campoEd('Retorno', 'retorno', r.retorno, 'input', 'Ex.: 48 a 72h se não melhorar') + '</section>';
    r.secoes.forEach(function (s, si) {
      h += '<section class="ed-card ed-sec ed-sec-' + s.tipo + '" id="es-' + si + '"><div class="ed-sec-cab"><h3 class="ed-titulo">' + esc(s.titulo) + '</h3>' +
        '<button type="button" class="icone-btn" data-ed="tirar-secao" data-s="' + si + '" aria-label="Apagar a seção ' + esc(s.titulo) + '"><svg><use href="#i-lixo"/></svg></button></div>';
      if (s.tipo === 'receita') h += campoEd('Caso', 'secoes.' + si + '.caso', s.caso, 'input', 'Ex.: Mulher não gestante');
      h += s.blocos.map(function (b, bi) { return blocoEd(b, si, bi, s.blocos.length); }).join('');
      h += '<div class="ed-somar">' +
        (s.tipo !== 'antes' && s.tipo !== 'plantonista' ? '<button type="button" class="botao botao-claro" data-ed="somar" data-s="' + si + '" data-v="item"><svg><use href="#i-somar"/></svg>Remédio</button>' : '') +
        '<button type="button" class="botao botao-claro" data-ed="somar" data-s="' + si + '" data-v="li"><svg><use href="#i-somar"/></svg>Tópico</button>' +
        '<button type="button" class="botao botao-claro" data-ed="outro" data-s="' + si + '"><svg><use href="#i-somar"/></svg>Outro…</button></div></section>';
    });
    var faltam = ORDEM_SECOES.filter(function (t) { return !r.secoes.some(function (s) { return s.tipo === t; }); });
    if (faltam.length) {
      h += '<section class="ed-card"><h3 class="ed-titulo">Acrescentar seção</h3><div class="botoes">' + faltam.map(function (t) {
        return '<button type="button" class="botao botao-claro" data-ed="secao" data-v="' + t + '"><svg><use href="#i-somar"/></svg>' + esc(secaoNova(t).titulo) + '</button>';
      }).join('') + '</div></section>';
    }
    h += '<section class="ed-card">' + campoEd('Referências (diretriz que embasa)', 'referencias', r.referencias, 'area', 'Ex.: Ministério da Saúde, protocolo de 2026') + '</section>';
    h += '<div class="botoes ed-fim">';
    if (BASE_POR_ID[ED.id] && E.edits.fichas[ED.id]) h += '<button type="button" class="botao botao-claro" data-ed="restaurar">Voltar ao original do PDF</button>';
    if (POR_ID[ED.id]) h += '<button type="button" class="botao botao-claro" data-ed="copia">Salvar como conduta nova…</button>';
    if (!BASE_POR_ID[ED.id] && E.edits.fichas[ED.id]) h += '<button type="button" class="botao botao-perigo" data-ed="apagar-ficha"><svg><use href="#i-lixo"/></svg>Apagar esta conduta</button>';
    h += '</div>';
    $('#detalhe-corpo').innerHTML = '<div class="ed">' + h + '</div>';
    crescerTodos();
  }

  /* ── edição: tela da tabela ─────────────────────────────────────────── */

  function abrirEditorTabela(ti) {
    fichaAtual = null;
    $('#detalhe-saltos').hidden = true;
    var t = TABELAS[ti];
    if (!t) { $('#detalhe-corpo').innerHTML = '<div class="vazio"><strong>Tabela não encontrada</strong></div>'; return; }
    if (!ED || ED.tipo !== 'tabela' || ED.ti !== ti) {
      if (E.rascunho && E.rascunho.tipo === 'tabela' && E.rascunho.ti === ti) {
        ED = E.rascunho;
        ED.recuperado = true;
      } else {
        var r = { linhas: t.linhas.map(function (l) { return l.map(function (c) { return semTags(c); }); }) };
        ED = { tipo: 'tabela', ti: ti, id: 't' + ti, r: r, orig: JSON.stringify(r) };
      }
    }
    desenharEditorTabela();
  }

  function desenharEditorTabela() {
    var t = TABELAS[ED.ti];
    $('#detalhe-titulo').textContent = 'Editar tabela';
    $('#detalhe-acoes').innerHTML = '<button class="botao botao-cheio" type="button" data-ed="salvar"><svg><use href="#i-feito"/></svg>Salvar</button>';
    var h = '';
    if (ED.recuperado) h += '<p class="ed-faixa">Continuando a edição que não tinha sido salva.</p>';
    h += '<h2 class="ed-tab-titulo">' + esc(tituloTabela(t)) + (t.colunas[0] !== 'Antibiótico' && TABELAS.filter(function (x) { return x.titulo === t.titulo; }).length > 1 ? ' · ' + esc(t.colunas[0]) : '') + '</h2>';
    h += '<p class="ed-dica">Nas colunas de gestação, amamentação e doença renal, as palavras Seguro, Compatível, Cautela, Evitar e Contraindicado ganham a cor sozinhas.</p>';
    var n = ED.r.linhas.length;
    ED.r.linhas.forEach(function (l, li) {
      h += '<section class="ed-card" id="eb-0-' + li + '"><div class="ed-bloco-cab"><span class="ed-tipo">Linha ' + (li + 1) + '</span>' + ferramentas(0, li, n) + '</div>' +
        t.colunas.map(function (c, ci) { return campoEd(c, 'linhas.' + li + '.' + ci, l[ci] || '', ci === 0 ? 'input' : 'area', ''); }).join('') + '</section>';
    });
    h += '<div class="botoes"><button type="button" class="botao botao-claro" data-ed="somar-linha"><svg><use href="#i-somar"/></svg>Nova linha</button></div>';
    if (E.edits.tabelas[ED.ti]) h += '<div class="botoes ed-fim"><button type="button" class="botao botao-claro" data-ed="restaurar">Voltar à tabela original do PDF</button></div>';
    $('#detalhe-corpo').innerHTML = '<div class="ed">' + h + '</div>';
    crescerTodos();
  }

  var COLUNAS_COR = { 'Gestação': 1, 'Amamentação': 1, 'Doença renal': 1 };
  function celulaHtml(t, ci, texto, mapa) {
    texto = texto.trim();
    if (!texto) return '';
    if (mapa[ci] && mapa[ci][texto]) return mapa[ci][texto]; // não mexeu: mantém como estava no PDF
    var h = esc(texto);
    if (ci === 0) return '<b class="neg">' + h + '</b>';
    if (COLUNAS_COR[t.colunas[ci]]) {
      h = h.replace(/(^|[^A-Za-zÀ-ÿ])(seguro|compatível|cautela|evitar|contraindicado)(?![A-Za-zÀ-ÿ])/gi, function (m, a, w) {
        var k = norm(w);
        var cls = k === 'seguro' || k === 'compativel' ? 'vde' : k === 'cautela' ? 'amb' : 'ver';
        return a + '<b class="' + cls + '">' + w + '</b>';
      });
    }
    return h;
  }

  /* ── edição: ações ──────────────────────────────────────────────────── */

  function definir(obj, caminho, v) {
    var ps = caminho.split('.');
    for (var i = 0; i < ps.length - 1; i++) obj = obj[/^\d+$/.test(ps[i]) ? +ps[i] : ps[i]];
    obj[ps[ps.length - 1]] = v;
  }
  function crescer(t) { t.style.height = 'auto'; t.style.height = (t.scrollHeight + 3) + 'px'; }
  function crescerTodos() { $$('#detalhe-corpo .ed textarea').forEach(crescer); }
  function redesenharEd(foco) {
    var y = window.scrollY;
    if (ED.tipo === 'tabela') desenharEditorTabela(); else desenharEditor();
    window.scrollTo(0, y);
    guardarRascunho();
    if (foco) {
      var el = document.getElementById(foco);
      if (el) {
        rolarAte(el);
        var c = el.querySelector('input, textarea, select');
        if (c) c.focus();
      }
    }
  }

  $('#detalhe-corpo').addEventListener('input', function (ev) {
    if (!ED) return;
    var c = ev.target.getAttribute('data-c');
    if (!c) return;
    definir(ED.r, c, ev.target.value);
    if (ev.target.tagName === 'TEXTAREA') crescer(ev.target);
    guardarRascunho();
  });

  $('#tela-detalhe').addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-ed]');
    if (!b || !ED || b.disabled) return;
    var acao = b.getAttribute('data-ed');
    var si = +b.getAttribute('data-s'), bi = +b.getAttribute('data-b'), v = b.getAttribute('data-v');
    var lista = ED.tipo === 'tabela' ? ED.r.linhas : ED.r.secoes[si] && ED.r.secoes[si].blocos;
    if (acao === 'salvar') { salvarEdicao(); return; }
    if (acao === 'subir' || acao === 'descer') {
      var j = acao === 'subir' ? bi - 1 : bi + 1;
      var x = lista[bi]; lista[bi] = lista[j]; lista[j] = x;
      redesenharEd();
    } else if (acao === 'tirar') {
      var tirado = lista.splice(bi, 1)[0];
      redesenharEd();
      avisar('Apagado', 'Desfazer', function () { lista.splice(bi, 0, tirado); redesenharEd(); });
    } else if (acao === 'selo') {
      var sl = lista[bi].selos, k = sl.indexOf(v);
      if (k >= 0) sl.splice(k, 1); else sl.push(v);
      b.setAttribute('aria-pressed', String(k < 0));
      guardarRascunho();
    } else if (acao === 'tag') {
      var tg = ED.r.tags, kt = tg.indexOf(v);
      if (kt >= 0) tg.splice(kt, 1); else tg.push(v);
      b.setAttribute('aria-pressed', String(kt < 0));
      guardarRascunho();
    } else if (acao === 'somar') {
      somarBloco(si, v);
    } else if (acao === 'outro') {
      perguntar('O que acrescentar?', [
        { t: 'Título de lista (Orientações, Retornar se…)', v: 'sub' }, { t: 'Grupo de opções', v: 'grupo' },
        { t: '“OU” entre duas opções', v: 'ou' }, { t: 'Parágrafo', v: 'p' }, { t: 'Cancelar' }
      ], function (tipo) { if (tipo) somarBloco(si, tipo); }, true);
    } else if (acao === 'secao') {
      var pos = ED.r.secoes.filter(function (s) { return ORDEM_SECOES.indexOf(s.tipo) < ORDEM_SECOES.indexOf(v); }).length;
      ED.r.secoes.splice(pos, 0, secaoNova(v));
      redesenharEd('es-' + pos);
    } else if (acao === 'tirar-secao') {
      var sec = ED.r.secoes[si];
      perguntar('Apagar a seção “' + sec.titulo + '” inteira?', [{ t: 'Cancelar' }, { t: 'Apagar', v: 1, perigo: true }], function (ok) {
        if (!ok) return;
        ED.r.secoes.splice(si, 1);
        redesenharEd();
        avisar('Seção apagada', 'Desfazer', function () { ED.r.secoes.splice(si, 0, sec); redesenharEd(); });
      });
    } else if (acao === 'somar-linha') {
      ED.r.linhas.push(TABELAS[ED.ti].colunas.map(function () { return ''; }));
      redesenharEd('eb-0-' + (ED.r.linhas.length - 1));
    } else if (acao === 'restaurar') {
      restaurarOriginal();
    } else if (acao === 'copia') {
      salvarComoNova();
    } else if (acao === 'apagar-ficha') {
      apagarConduta();
    }
  });

  function somarBloco(si, tipo) {
    var s = ED.r.secoes[si];
    var b;
    if (tipo === 'item') {
      var n = s.blocos.filter(function (x) { return x.t === 'item'; }).length + 1;
      b = { t: 'item', n: String(n), nome: '', qtd: '', uso: '', selos: [] };
    } else if (tipo === 'li' || tipo === 'p') b = { t: tipo, txt: '', nota: false };
    else if (tipo === 'sub') b = { t: 'sub', tom: s.tipo === 'plantonista' ? 'seguranca' : 'orient', nota: '' };
    else if (tipo === 'grupo') b = { t: 'grupo', texto: '' };
    else b = { t: 'ou' };
    s.blocos.push(b);
    redesenharEd('eb-' + si + '-' + (s.blocos.length - 1));
  }

  function salvarEdicao() {
    if (ED.tipo === 'tabela') {
      var t = D.tabelas[ED.ti];
      var mapa = t.colunas.map(function () { return {}; });
      t.linhas.forEach(function (l) { l.forEach(function (c, ci) { mapa[ci][semTags(c).trim()] = c; }); });
      var linhas = ED.r.linhas.map(function (l) { return l.map(function (c, ci) { return celulaHtml(t, ci, c || '', mapa); }); })
        .filter(function (l) { return l.some(Boolean); });
      E.edits.tabelas[ED.ti] = { linhas: linhas, em: Date.now() };
      fecharEditor();
      depoisDeMudar();
      avisar('Tabela salva');
      voltarOu('#/tabelas');
      return;
    }
    var r = ED.r;
    if (!r.nome.trim()) {
      avisar('Dê um nome à conduta');
      var cn = $('[data-c="nome"]');
      if (cn) { rolarAte(cn); cn.focus(); }
      return;
    }
    var f = deRascunho(r);
    var id = ED.id;
    var antiga = E.edits.fichas[id];
    var base = BASE_POR_ID[id];
    f.id = id;
    f.editada = Date.now();
    if (base) f.pagina = base.pagina;
    else { f.minha = true; f.criada = antiga && antiga.criada || Date.now(); }
    var primeira = !POR_ID[id];
    E.edits.fichas[id] = f;
    fecharEditor();
    depoisDeMudar();
    avisar(primeira ? 'Conduta criada' : 'Alterações salvas');
    if (primeira) ir('#/f/' + id, true);
    else voltarOu('#/f/' + id);
  }

  function restaurarOriginal() {
    var tabela = ED.tipo === 'tabela';
    perguntar(tabela ? 'Voltar à tabela original do PDF? Suas alterações nela serão apagadas.' :
      'Voltar ao texto original do PDF? Suas alterações nesta conduta serão apagadas.', [
      { t: 'Cancelar' }, { t: 'Voltar ao original', v: 1, perigo: true }
    ], function (ok) {
      if (!ok) return;
      if (tabela) delete E.edits.tabelas[ED.ti]; else delete E.edits.fichas[ED.id];
      fecharEditor();
      depoisDeMudar();
      avisar('Original restaurado');
      voltarOu(tabela ? '#/tabelas' : '#/');
    });
  }

  function salvarComoNova() {
    var r = JSON.parse(JSON.stringify(ED.r));
    r.nome = (r.nome.trim() || 'Conduta') + ' (nova versão)';
    var id = 'minha-' + Date.now().toString(36);
    ED = { tipo: 'ficha', id: id, r: r, orig: '', nova: true };
    E.rascunho = ED;
    guardar();
    avisar('Cópia aberta: ajuste o nome e salve');
    ir('#/e/' + id, true);
  }

  function apagarConduta() {
    var id = ED.id, nome = ED.r.nome || 'esta conduta';
    perguntar('Apagar “' + nome + '”? Não dá para desfazer.', [{ t: 'Cancelar' }, { t: 'Apagar', v: 1, perigo: true }], function (ok) {
      if (!ok) return;
      delete E.edits.fichas[id];
      fecharEditor();
      depoisDeMudar();
      avisar('Conduta apagada');
      ir('#/', true);
    });
  }

  /* ── cópia de segurança das alterações ──────────────────────────────── */

  function blocoCopia() {
    var nf = 0, nn = 0;
    Object.keys(E.edits.fichas).forEach(function (id) { if (BASE_POR_ID[id]) nf++; else nn++; });
    var nt = Object.keys(E.edits.tabelas).length;
    var resumo = (nf || nn || nt) ?
      [nf ? nf + (nf === 1 ? ' conduta editada' : ' condutas editadas') : '', nn ? nn + (nn === 1 ? ' conduta criada' : ' condutas criadas') : '', nt ? nt + (nt === 1 ? ' tabela editada' : ' tabelas editadas') : '']
        .filter(Boolean).join(', ') + '.' : 'Nenhuma alteração ainda.';
    return '<h2 class="rotulo">Suas alterações</h2><div class="ficha-grupo texto" style="padding:4px 14px 14px">' +
      '<p><b>' + esc(resumo) + '</b> Edite qualquer conduta pelo lápis no alto da ficha, crie novas em “Nova conduta” na lista e edite as tabelas pelo botão de cada uma.</p>' +
      '<p class="tab-nota" style="margin:0 0 10px">As alterações ficam só neste aparelho e passam para as versões novas do app. Se desinstalar o app, elas se perdem: guarde uma cópia. A mesma cópia abre no Prescricoes.html do computador.</p>' +
      '<div class="botoes"><button type="button" class="botao botao-claro" data-copia="salvar"><svg><use href="#i-baixo"/></svg>Salvar cópia</button>' +
      '<button type="button" class="botao botao-claro" data-copia="abrir"><svg><use href="#i-cima"/></svg>Restaurar cópia</button></div></div>';
  }

  function exportarEdicoes() {
    var dados = { app: 'prescricoes', formato: 1, salvo: new Date().toISOString(), fichas: E.edits.fichas, tabelas: E.edits.tabelas };
    var texto = JSON.stringify(dados, null, 1);
    var d = new Date();
    var nome = 'prescricoes-alteracoes-' + d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2) + '.json';
    try { if (ponte && ponte.salvarArquivo) { ponte.salvarArquivo(nome, texto); return; } } catch (e) { /* segue */ }
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([texto], { type: 'application/json' }));
    a.download = nome;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.parentNode.removeChild(a); }, 1000);
    avisar('Cópia salva em ' + nome);
  }

  function importarEdicoes() {
    try { if (ponte && ponte.abrirArquivo) { ponte.abrirArquivo(); return; } } catch (e) { /* segue */ }
    var inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = '.json,application/json,text/plain';
    inp.onchange = function () {
      if (!inp.files || !inp.files[0]) return;
      var fr = new FileReader();
      fr.onload = function () { receberCopia(String(fr.result)); };
      fr.readAsText(inp.files[0]);
    };
    inp.click();
  }
  window.__arquivo = function () {
    try { var t = ponte && ponte.pendente ? ponte.pendente() : ''; if (t) receberCopia(t); } catch (e) { avisar('Não consegui ler o arquivo'); }
  };

  function receberCopia(texto) {
    var d;
    try { d = JSON.parse(texto); } catch (e) { d = null; }
    if (!d || d.app !== 'prescricoes' || typeof d.fichas !== 'object' || !d.fichas) { avisar('Esse arquivo não é uma cópia das alterações'); return; }
    var fichas = {}, tabelas = {};
    Object.keys(d.fichas).forEach(function (id) {
      var f = d.fichas[id];
      if (!f || typeof f.nome !== 'string' || !Array.isArray(f.secoes) || !/^[a-z0-9-]{1,80}$/.test(id)) return;
      if (!BASE_POR_ID[id] && !/^minha-/.test(id)) return;
      f.id = id;
      delete f._n; delete f._corpo;
      fichas[id] = f;
    });
    Object.keys(d.tabelas || {}).forEach(function (ti) {
      var t = d.tabelas[ti];
      if (D.tabelas[+ti] && t && Array.isArray(t.linhas)) tabelas[+ti] = t;
    });
    var nf = Object.keys(fichas).length, nt = Object.keys(tabelas).length;
    if (!nf && !nt) { avisar('A cópia está vazia'); return; }
    perguntar('Restaurar ' + nf + (nf === 1 ? ' conduta' : ' condutas') + ' e ' + nt + (nt === 1 ? ' tabela' : ' tabelas') +
      ' desta cópia? Onde houver a mesma conduta ou tabela, fica a da cópia; o resto continua como está.', [
      { t: 'Cancelar' }, { t: 'Restaurar', v: 1, cheio: true }
    ], function (ok) {
      if (!ok) return;
      Object.keys(fichas).forEach(function (id) { E.edits.fichas[id] = fichas[id]; });
      Object.keys(tabelas).forEach(function (ti) { E.edits.tabelas[ti] = tabelas[ti]; });
      depoisDeMudar();
      avisar('Cópia restaurada');
      if ((lerRota().partes[0] || '') === 'sobre') desenharSobre();
    });
  }

  /* ── começo ─────────────────────────────────────────────────────────── */

  window.__pausa = function () {
    clearTimeout(timerGuardar);
    var t = JSON.stringify(E);
    try {
      if (ponte && ponte.guardar) ponte.guardar('estado', t);
      else localStorage.setItem(CHAVE_LOCAL, t);
    } catch (e) { /* segue */ }
  };
  window.addEventListener('pagehide', window.__pausa);

  desenharFiltros();
  contador();
  mostrar(lerRota());
  if (E.rascunho && !/^#\/et?\//.test(location.hash)) {
    var rr = E.rascunho;
    avisar('Há uma edição não salva' + (rr.r && rr.r.nome ? ' de “' + rr.r.nome + '”' : ''), 'Continuar', function () {
      ir(rr.tipo === 'tabela' ? '#/et/' + rr.ti : '#/e/' + rr.id);
    });
  }
})();
