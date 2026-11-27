/* Telas do app. Tudo é montado com createElement e textContent: nenhum texto que vem
   das fontes vira HTML. As tabelas da bula passam antes por Bulas.tabelaSegura. */
(function () {
  "use strict";

  var A = window.Android || null; // ponte do app Android; no computador não existe
  var B = window.Bulas;
  var C = window.Calculo;
  var I = window.Integridade;
  var raiz = document.getElementById("app");

  /* ── armazenamento: arquivos privados no Android, localStorage no navegador ── */

  var semArmazem = false;
  var Armazem = {
    ler: function (k) {
      try {
        if (A) return A.ler(k) || null;
        return window.localStorage.getItem("posologia:" + k);
      } catch (e) {
        semArmazem = true;
        return null;
      }
    },
    guardar: function (k, v) {
      try {
        if (A) return !!A.guardar(k, v);
        window.localStorage.setItem("posologia:" + k, v);
        return true;
      } catch (e) {
        semArmazem = true;
        return false;
      }
    },
    apagar: function (k) {
      try {
        if (A) A.apagar(k);
        else window.localStorage.removeItem("posologia:" + k);
      } catch (e) {
        semArmazem = true;
      }
    }
  };
  try {
    if (!A) {
      window.localStorage.setItem("posologia:teste", "1");
      window.localStorage.removeItem("posologia:teste");
    }
  } catch (e) {
    semArmazem = true;
  }

  function lerJSON(k, padrao) {
    try {
      var t = Armazem.ler(k);
      return t ? JSON.parse(t) : padrao;
    } catch (e) {
      return padrao;
    }
  }

  /* ── estado ─────────────────────────────────────────────────────── */

  var ajustes = lerJSON("ajustes", { tema: "sistema", tam: "m" });
  var E = {
    tela: "inicio",
    pilha: [],
    rolagem: {},
    pedido: 0,
    estado: null,
    busca: "",
    resolucao: null,
    ingrediente: null,
    grupos: null,
    grupo: null,
    lista: null,
    pagina: 0,
    rotulo: null,
    salva: null,      // registro da cópia guardada da bula aberta, se houver
    deSalvas: false,  // a bula foi aberta pela lista de salvas (e não pela busca)
    conferencia: null, // resultado da conferência de versão
    consulta: "",
    achado: 0,
    calcDe: null,      // bula de onde a calculadora foi aberta (só para consulta)
    calc: {
      modo: "peso", nome: "",
      base: "kg", peso: "", altura: "", dose: "", unidade: "mg", periodo: "dose", tomadas: "",
      max: "", maxUnidade: "mg", maxPeriodo: "dose", apQtd: "", apUnidade: "mg", apVolume: "",
      sentido: "dose", iDose: "", iUnidade: "mcg", porKg: "kg", tempo: "min", vazao: "", qtd: "", qtdUnidade: "mg", volume: ""
    },
    removendo: null,
    doenca: "",        // doença digitada para achar a dose na bula
    autoAberta: false, // a bula foi aberta sozinha (busca com doença)
    doseMais: false,
    cacheTab: {},
    cacheDose: null,
    // a prescrição a conferir fica só na memória: nada disso é gravado
    prescr: { dose: "", unidade: "mg", concQtd: "", concUnidade: "mg", concVol: "", intervalo: "12", outroIntervalo: "", paciente: "adulto", peso: "", renal: false, hepatica: false },
    conferindoTodas: false
  };

  /* ── elementos ──────────────────────────────────────────────────── */

  function h(tag, props) {
    var el = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach(function (k) {
        var v = props[k];
        if (v == null || v === false) return;
        if (k === "classe") el.className = v;
        else if (k === "texto") el.textContent = v;
        else if (k.slice(0, 2) === "on") el.addEventListener(k.slice(2), v);
        else if (k === "valor") el.value = v;
        else el.setAttribute(k, v === true ? "" : v);
      });
    }
    for (var i = 2; i < arguments.length; i++) anexar(el, arguments[i]);
    return el;
  }

  function anexar(el, filho) {
    if (filho == null || filho === false) return;
    if (Array.isArray(filho)) {
      filho.forEach(function (f) { anexar(el, f); });
      return;
    }
    el.appendChild(typeof filho === "string" ? document.createTextNode(filho) : filho);
  }

  var ICONES = {
    busca: "M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14z M16.2 16.2 21 21",
    estrela: "M12 3.6l2.6 5.3 5.8.85-4.2 4.1 1 5.8L12 16.9l-5.2 2.75 1-5.8-4.2-4.1 5.8-.85z",
    calc: "M6.5 3h11a1.5 1.5 0 0 1 1.5 1.5v15a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19.5v-15A1.5 1.5 0 0 1 6.5 3z M8.5 6.5h7v3h-7z M8.6 13.2h.01 M12 13.2h.01 M15.4 13.2h.01 M8.6 16.8h.01 M12 16.8h.01 M15.4 16.8h.01",
    info: "M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z M12 11v5.2 M12 7.8h.01",
    voltar: "M15 5l-7 7 7 7",
    externo: "M14 4h6v6 M20 4l-8.5 8.5 M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5",
    seta: "M9 5l7 7-7 7",
    alerta: "M12 3.8 2.8 19.8h18.4z M12 10v4.4 M12 17.1h.01",
    ok: "M5 12.5l4.5 4.5L19 7.5",
    fechar: "M6 6l12 12 M18 6 6 18",
    atualizar: "M19.5 10.5A7.5 7.5 0 0 0 6 6.6L4.5 8 M4.5 4v4h4 M4.5 13.5A7.5 7.5 0 0 0 18 17.4l1.5-1.4 M19.5 20v-4h-4",
    copiar: "M9 9h10.5v11H9z M5 15V4h10.5",
    escudo: "M12 3l7.5 3v5.6c0 4.5-3.2 8.2-7.5 9.4-4.3-1.2-7.5-4.9-7.5-9.4V6z M8.8 12.2l2.2 2.2 4.3-4.5",
    lixo: "M4 7h16 M9.5 7V4.5h5V7 M6.2 7l1 13h9.6l1-13",
    bula: "M6 3.5h9.5L19 7v13.5H6z M15 3.5V7.5h4 M9 11.5h7 M9 14.5h7 M9 17.5h4.5",
    cima: "M6 15l6-6 6 6",
    baixo: "M6 9l6 6 6-6"
  };

  function icone(nome, tam) {
    var ns = "http://www.w3.org/2000/svg";
    var s = document.createElementNS(ns, "svg");
    s.setAttribute("viewBox", "0 0 24 24");
    s.setAttribute("width", tam || 20);
    s.setAttribute("height", tam || 20);
    s.setAttribute("aria-hidden", "true");
    s.setAttribute("class", "ic");
    var p = document.createElementNS(ns, "path");
    p.setAttribute("d", ICONES[nome]);
    s.appendChild(p);
    return s;
  }

  function botao(texto, aoClicar, opcoes) {
    opcoes = opcoes || {};
    return h(
      "button",
      { type: "button", classe: "bt " + (opcoes.classe || ""), onclick: aoClicar, disabled: opcoes.desligado ? true : null, "aria-label": opcoes.rotulo || null },
      opcoes.icone ? icone(opcoes.icone, 18) : null,
      texto ? h("span", { texto: texto }) : null
    );
  }

  function linkFora(texto, url, classe) {
    return h(
      "a",
      {
        classe: "bt " + (classe || ""),
        href: url,
        target: "_blank",
        rel: "noopener noreferrer",
        onclick: function (ev) {
          ev.preventDefault();
          abrirFora(url);
        }
      },
      h("span", { texto: texto }),
      icone("externo", 16)
    );
  }

  function abrirFora(url) {
    if (A) A.abrir(url);
    else window.open(url, "_blank", "noopener,noreferrer");
  }

  var relogioAviso = null;
  function aviso(texto) {
    var n = document.getElementById("aviso");
    n.textContent = texto;
    n.classList.add("visivel");
    clearTimeout(relogioAviso);
    relogioAviso = setTimeout(function () { n.classList.remove("visivel"); }, 3600);
  }

  function copiar(texto, confirmacao) {
    if (A) {
      A.copiar(texto);
      return;
    }
    var feito = function () { aviso(confirmacao || "Copiado."); };
    var reserva = function () {
      var t = h("textarea", { classe: "fora-da-tela" });
      t.value = texto;
      document.body.appendChild(t);
      t.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      document.body.removeChild(t);
      if (ok) feito();
      else aviso("Não deu para copiar neste navegador.");
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(texto).then(feito, reserva);
    else reserva();
  }

  function hoje(iso) {
    var d = iso ? new Date(iso) : new Date();
    if (isNaN(d.getTime())) return "?";
    function z(n) { return (n < 10 ? "0" : "") + n; }
    return z(d.getDate()) + "/" + z(d.getMonth() + 1) + "/" + d.getFullYear();
  }

  function dias(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return Infinity;
    return Math.floor((Date.now() - d.getTime()) / 86400000);
  }

  function nomeBonito(s) {
    s = String(s || "");
    if (s !== s.toUpperCase()) return s;
    return s.toLowerCase().replace(/(^|[\s(/-])([a-z])/g, function (m, a, b) { return a + b.toUpperCase(); });
  }

  /* ── navegação ──────────────────────────────────────────────────── */

  function guardarRolagem() {
    E.rolagem[E.tela] = window.scrollY || 0;
  }

  function ir(tela) {
    guardarRolagem();
    E.pilha.push(E.tela);
    E.tela = tela;
    E.estado = null;
    render();
    window.scrollTo(0, 0);
  }

  function trocar(tela) {
    E.tela = tela;
    render();
    window.scrollTo(0, 0);
  }

  function aba(tela) {
    E.pedido++;
    E.pilha = [];
    E.estado = null;
    if (tela === "calc") E.calcDe = null; // pela aba, a calculadora abre limpa, sem bula ao lado
    E.tela = tela;
    render();
    window.scrollTo(0, 0);
  }

  function voltar() {
    if (E.pilha.length) {
      E.pedido++;
      E.estado = null;
      E.tela = E.pilha.pop();
      render();
      window.scrollTo(0, E.rolagem[E.tela] || 0);
      return true;
    }
    if (E.tela !== "inicio") {
      aba("inicio");
      return true;
    }
    return false;
  }

  /* ── fluxo de busca ─────────────────────────────────────────────── */

  function lembrarRecente(termo) {
    var l = lerJSON("recentes", []).filter(function (t) { return B.chaveNome(t) !== B.chaveNome(termo); });
    l.unshift(termo);
    Armazem.guardar("recentes", JSON.stringify(l.slice(0, 8)));
  }

  function falha(n, e, repetir) {
    if (n !== E.pedido) return;
    E.estado = { erro: (e && e.message) || "Algo deu errado na consulta.", repetir: repetir };
    render();
  }

  function buscar(termo, doenca) {
    termo = String(termo || "").trim().replace(/\s+/g, " ");
    if (termo.length < 2) {
      aviso("Digite pelo menos duas letras do princípio ativo.");
      return;
    }
    if (doenca != null) trocarDoencaSemDesenhar(doenca);
    E.busca = termo;
    E.resolucao = E.ingrediente = E.grupos = E.grupo = E.lista = null;
    var n = ++E.pedido;
    guardarRolagem();
    E.pilha = ["inicio"];
    E.tela = "ingredientes";
    E.estado = { carregando: "Procurando o princípio ativo no RxNorm…" };
    render();
    B.resolver(termo).then(function (r) {
      if (n !== E.pedido) return;
      E.resolucao = r;
      E.estado = null;
      var l = r.ingredientes;
      if (l.length) lembrarRecente(termo); // nome não reconhecido não vira atalho
      if (l.length === 1 && !l[0].fraco) escolherIngrediente(l[0], true);
      else render();
    }, function (e) { falha(n, e, function () { buscar(termo); }); });
  }

  function escolherIngrediente(ing, substituir) {
    E.ingrediente = ing;
    E.grupos = E.grupo = E.lista = null;
    var n = ++E.pedido;
    if (substituir) E.tela = "grupos";
    else {
      guardarRolagem();
      E.pilha.push(E.tela);
      E.tela = "grupos";
    }
    E.estado = { carregando: "Procurando bulas da FDA com " + ing.nome + "…" };
    render();
    window.scrollTo(0, 0);
    B.grupos(ing.nome).then(function (g) {
      if (n !== E.pedido) return;
      E.grupos = g;
      E.estado = null;
      if (g.length === 1) escolherGrupo(g[0], true);
      else render();
    }, function (e) { falha(n, e, function () { escolherIngrediente(ing, true); }); });
  }

  function escolherGrupo(g, substituir) {
    E.grupo = g;
    E.lista = null;
    E.pagina = 0;
    var n = ++E.pedido;
    if (substituir) E.tela = "rotulos";
    else {
      guardarRolagem();
      E.pilha.push(E.tela);
      E.tela = "rotulos";
    }
    E.estado = { carregando: "Baixando as bulas de " + nomeBonito(g.nome) + "…" };
    render();
    window.scrollTo(0, 0);
    B.rotulos(g.nome, 0).then(function (l) {
      if (n !== E.pedido) return;
      E.lista = l;
      E.estado = null;
      // com a doença já escolhida, abre direto a primeira bula (a de referência, se houver)
      if (E.doenca && l.itens.length) {
        abrirRotulo(l.itens[0], null, true);
        return;
      }
      render();
    }, function (e) { falha(n, e, function () { escolherGrupo(g, true); }); });
  }

  function maisRotulos() {
    var n = ++E.pedido;
    var pagina = E.pagina + 1;
    E.estado = { maisCarregando: true };
    render();
    B.rotulos(E.grupo.nome, pagina).then(function (l) {
      if (n !== E.pedido) return;
      var vistos = {};
      E.lista.itens.forEach(function (r) { vistos[r.set_id] = true; });
      l.itens.forEach(function (r) { if (!vistos[r.set_id]) E.lista.itens.push(r); });
      E.lista.temMais = l.temMais;
      E.pagina = pagina;
      E.estado = null;
      render();
    }, function (e) {
      if (n !== E.pedido) return;
      E.estado = null;
      render();
      aviso(e.message);
    });
  }

  function abrirRotulo(rotulo, salva, automatica) {
    E.autoAberta = !!automatica;
    E.doseMais = false;
    E.rotulo = rotulo;
    E.salva = salva || null;
    E.deSalvas = !!salva;
    E.conferencia = null;
    E.consulta = "";
    E.achado = 0;
    ir("bula");
    if (salva) conferirVersao(rotulo);
  }

  /* ── bulas salvas ───────────────────────────────────────────────── */

  function chave(setId) {
    return "bula_" + String(setId).replace(/[^A-Za-z0-9-]/g, "").slice(0, 70);
  }

  function indice() {
    var l = lerJSON("indice", []);
    return Array.isArray(l) ? l : [];
  }

  function gravarIndice(l) {
    return Armazem.guardar("indice", JSON.stringify(l));
  }

  function estaSalva(setId) {
    return indice().some(function (x) { return x.set_id === setId; });
  }

  /** Lê a cópia guardada e confere o resumo SHA-256. */
  function lerSalva(setId) {
    var bruto = Armazem.ler(chave(setId));
    if (!bruto) return { erro: "sumiu" };
    var reg;
    try {
      reg = JSON.parse(bruto);
    } catch (e) {
      return { erro: "corrompida" };
    }
    if (!reg || !reg.rotulo || typeof reg.hash !== "string") return { erro: "corrompida" };
    if (I.sha256(JSON.stringify(reg.rotulo)) !== reg.hash) return { erro: "alterada" };
    if (reg.rotulo.set_id !== setId) return { erro: "alterada" };
    return reg;
  }

  function salvar(rotulo, silencioso) {
    if (semArmazem && !A) {
      aviso("Este navegador não deixa guardar nada nesta página. Abra o arquivo direto no Chrome ou no Edge.");
      return false;
    }
    var texto = JSON.stringify(rotulo);
    var reg = { formato: 1, hash: I.sha256(texto), salvoEm: new Date().toISOString(), rotulo: rotulo };
    if (!Armazem.guardar(chave(rotulo.set_id), JSON.stringify(reg))) {
      aviso("Não deu para salvar: o espaço do navegador acabou ou está bloqueado.");
      return false;
    }
    var volta = lerSalva(rotulo.set_id);
    if (volta.erro) {
      Armazem.apagar(chave(rotulo.set_id));
      aviso("A cópia gravada não conferiu. Nada foi salvo.");
      return false;
    }
    var t = B.titulo(rotulo);
    var o = rotulo.openfda || {};
    var antes = indice();
    var anterior = antes.filter(function (x) { return x.set_id === rotulo.set_id; })[0];
    var l = antes.filter(function (x) { return x.set_id !== rotulo.set_id; });
    l.unshift({
      busca: (!E.deSalvas && E.busca) || (anterior && anterior.busca) || "", // nome digitado, para o bulário da ANVISA
      set_id: rotulo.set_id,
      principal: t.principal,
      generico: t.generico,
      fabricante: (o.manufacturer_name && o.manufacturer_name[0]) || "",
      version: rotulo.version,
      effective_time: rotulo.effective_time,
      salvoEm: reg.salvoEm,
      conferidoEm: reg.salvoEm,
      hash: reg.hash
    });
    gravarIndice(l);
    if (!silencioso) aviso("Bula salva no aparelho. Abre mesmo sem internet.");
    return true;
  }

  function remover(setId) {
    Armazem.apagar(chave(setId));
    gravarIndice(indice().filter(function (x) { return x.set_id !== setId; }));
  }

  function marcarConferida(setId, nova) {
    var l = indice();
    l.forEach(function (x) {
      if (x.set_id !== setId) return;
      x.conferidoEm = new Date().toISOString();
      x.temNova = nova ? { version: nova.version, effective_time: nova.effective_time } : null;
      x.retirada = nova === false;
    });
    gravarIndice(l);
  }

  function conferirVersao(guardada) {
    var n = E.pedido;
    E.conferencia = { estado: "conferindo" };
    render();
    B.atual(guardada.set_id).then(function (nova) {
      if (E.tela !== "bula" || !E.rotulo || E.rotulo.set_id !== guardada.set_id) return;
      if (!nova) {
        marcarConferida(guardada.set_id, false);
        E.conferencia = { estado: "retirada" };
      } else if (B.maisNova(nova, guardada)) {
        marcarConferida(guardada.set_id, nova);
        E.conferencia = { estado: "nova", nova: nova };
      } else {
        marcarConferida(guardada.set_id, null);
        E.conferencia = { estado: "vigente" };
      }
      render();
    }, function (e) {
      if (E.tela !== "bula" || n !== E.pedido) return;
      E.conferencia = { estado: "sem-rede", erro: e.message };
      render();
    });
  }

  function conferirTodas() {
    var l = indice();
    if (!l.length) return;
    E.conferindoTodas = true;
    render();
    var i = 0;
    var problemas = 0;
    var proximo = function () {
      if (i >= l.length) {
        E.conferindoTodas = false;
        render();
        aviso(problemas ? "Conferência terminada. Veja as marcadas." : "Todas as salvas são a versão vigente.");
        return;
      }
      var item = l[i++];
      B.atual(item.set_id).then(function (nova) {
        var guardada = { set_id: item.set_id, id: "", version: item.version, effective_time: item.effective_time };
        var reg = lerSalva(item.set_id);
        if (!reg.erro) guardada = reg.rotulo;
        if (!nova) { marcarConferida(item.set_id, false); problemas++; }
        else if (B.maisNova(nova, guardada)) { marcarConferida(item.set_id, nova); problemas++; }
        else marcarConferida(item.set_id, null);
        render();
        proximo();
      }, function (e) {
        E.conferindoTodas = false;
        render();
        aviso(e.message);
      });
    };
    proximo();
  }

  /* ── pedaços de tela ────────────────────────────────────────────── */

  function topo() {
    var podeVoltar = E.pilha.length > 0;
    var titulos = { inicio: "", ingredientes: "Princípio ativo", grupos: "Formulação", rotulos: "Bulas", bula: "Bula", salvas: "Salvas", calc: "Calculadora", sobre: "Sobre e ajustes" };
    return h(
      "header",
      { classe: "topo" },
      h(
        "div",
        { classe: "topo-in" },
        podeVoltar
          ? h("button", { type: "button", classe: "icone-b", "aria-label": "Voltar", onclick: voltar }, icone("voltar", 22))
          : null,
        E.tela === "inicio" || !titulos[E.tela]
          ? h("div", { classe: "marca" }, h("span", { classe: "marca-sinal", texto: "mg" }), h("span", { texto: "Posologia" }), h("em", { texto: "bulas oficiais" }))
          : h("div", { classe: "topo-titulo", texto: titulos[E.tela] }),
        h("nav", { classe: "abas", "aria-label": "Seções" }, [
          itemAba("inicio", "Buscar", "busca"),
          itemAba("salvas", "Salvas", "estrela"),
          itemAba("calc", "Calcular", "calc"),
          itemAba("sobre", "Sobre", "info")
        ])
      )
    );
  }

  function itemAba(tela, texto, ic) {
    var grupoBusca = { inicio: 1, ingredientes: 1, grupos: 1, rotulos: 1, bula: 1 };
    var raizDe = function (t) { return grupoBusca[t] ? "inicio" : t; };
    var ativa = raizDe(E.tela) === tela || (E.tela === "bula" && E.deSalvas && tela === "salvas");
    if (E.tela === "bula" && E.deSalvas && tela === "inicio") ativa = false;
    return h(
      "button",
      { type: "button", classe: "aba" + (ativa ? " ativa" : ""), "aria-current": ativa ? "page" : null, onclick: function () { aba(tela); } },
      icone(ic, 21),
      h("span", { texto: texto })
    );
  }

  function trilha() {
    var passos = [];
    if (E.busca) passos.push({ texto: "“" + E.busca + "”", tela: "ingredientes" });
    if (E.ingrediente && E.tela !== "ingredientes") passos.push({ texto: E.ingrediente.nome, tela: "grupos" });
    if (E.grupo && (E.tela === "rotulos" || E.tela === "bula")) passos.push({ texto: nomeBonito(E.grupo.nome), tela: "rotulos" });
    if (!passos.length) return null;
    return h(
      "ol",
      { classe: "trilha", "aria-label": "Caminho da busca" },
      passos.map(function (p, i) {
        var ultimo = i === passos.length - 1 && E.tela === p.tela;
        var naPilha = E.pilha.indexOf(p.tela) >= 0;
        return h(
          "li",
          null,
          i ? h("span", { classe: "trilha-sep", "aria-hidden": "true", texto: "→" }) : null,
          !ultimo && naPilha
            ? h("button", { type: "button", classe: "trilha-b", texto: p.texto, onclick: function () { voltarAte(p.tela); } })
            : h("span", { classe: "trilha-t", texto: p.texto })
        );
      })
    );
  }

  function voltarAte(tela) {
    while (E.pilha.length && E.tela !== tela) {
      E.tela = E.pilha.pop();
    }
    E.pedido++;
    E.estado = null;
    render();
    window.scrollTo(0, E.rolagem[E.tela] || 0);
  }

  function estadoCarga() {
    if (!E.estado) return null;
    if (E.estado.carregando) {
      return h("div", { classe: "carga", role: "status" }, h("span", { classe: "giro", "aria-hidden": "true" }), h("span", { texto: E.estado.carregando }));
    }
    if (E.estado.erro) {
      return h(
        "div",
        { classe: "cartao erro-c", role: "alert" },
        h("div", { classe: "linha-ic" }, icone("alerta", 20), h("p", { texto: E.estado.erro })),
        E.estado.repetir ? botao("Tentar de novo", E.estado.repetir, { classe: "bt-sec", icone: "atualizar" }) : null
      );
    }
    return null;
  }

  function nota(texto, tipo) {
    return h("div", { classe: "nota" + (tipo ? " nota-" + tipo : "") }, icone(tipo === "alerta" ? "alerta" : tipo === "ok" ? "escudo" : "info", 18), h("p", { texto: texto }));
  }

  function cartaoAnvisa(nome, texto) {
    return h(
      "div",
      { classe: "cartao" },
      h("h3", { texto: "Bula brasileira" }),
      h("p", { classe: "sub", texto: texto || "Abra o Bulário Eletrônico da ANVISA, já buscando por “" + nome + "”, para ver a bula para o profissional aprovada no Brasil." }),
      h("div", { classe: "acoes" }, linkFora("Bulário da ANVISA", B.linkAnvisa(nome), "bt-sec"))
    );
  }

  /* ── telas ──────────────────────────────────────────────────────── */

  function telaInicio() {
    var campo = h("input", {
      id: "busca",
      type: "search",
      classe: "busca-campo",
      placeholder: "Ex.: amoxicilina, dipirona, enoxaparina",
      autocomplete: "off",
      autocapitalize: "off",
      spellcheck: "false",
      enterkeyhint: "search",
      "aria-label": "Princípio ativo",
      valor: E.busca
    });
    var campoDoenca = h("input", {
      id: "busca-doenca",
      type: "search",
      classe: "busca-campo",
      placeholder: "Doença (opcional): otite, pneumonia, ITU",
      autocomplete: "off",
      autocapitalize: "off",
      spellcheck: "false",
      enterkeyhint: "search",
      "aria-label": "Doença, para ir direto à dose",
      valor: E.doenca
    });
    var form = h(
      "form",
      {
        classe: "busca-dupla",
        role: "search",
        onsubmit: function (ev) {
          ev.preventDefault();
          campo.blur();
          campoDoenca.blur();
          buscar(campo.value, campoDoenca.value);
        }
      },
      h("label", { classe: "busca" }, icone("bula", 20), campo),
      h("label", { classe: "busca" }, icone("info", 20), campoDoenca),
      h("button", { type: "submit", classe: "bt bt-pri", texto: "Buscar" })
    );
    var recentes = lerJSON("recentes", []);
    var salvas = indice();
    return h(
      "main",
      { classe: "pagina" },
      h(
        "section",
        { classe: "abertura" },
        h("h1", { texto: "Posologia direto da bula oficial" }),
        h("p", { classe: "sub", texto: "Digite o princípio ativo e, se quiser, a doença. O app encontra a bula aprovada pela FDA, mostra a dose para aquela doença exatamente como está escrita e confere a sua prescrição contra ela." }),
        form,
        recentes.length
          ? h(
              "div",
              { classe: "fichas", "aria-label": "Buscas recentes" },
              recentes.map(function (t) { return h("button", { type: "button", classe: "ficha", texto: t, onclick: function () { buscar(t, campoDoenca.value); } }); })
            )
          : null
      ),
      salvas.length
        ? h(
            "section",
            { classe: "cartao" },
            h("div", { classe: "cab" }, h("h2", { texto: "Salvas no aparelho" }), h("button", { type: "button", classe: "bt bt-ter", texto: "Ver todas", onclick: function () { aba("salvas"); } })),
            h("ul", { classe: "lista" }, salvas.slice(0, 4).map(itemSalva))
          )
        : null,
      h(
        "section",
        { classe: "cartao fontes" },
        h("h2", { texto: "De onde vem cada informação" }),
        h(
          "dl",
          { classe: "def" },
          h("dt", { texto: "Bula" }),
          h("dd", { texto: "FDA, agência dos EUA: a bula aprovada (formato oficial SPL, a mesma do DailyMed), via openFDA. Em inglês, sem tradução e sem resumo." }),
          h("dt", { texto: "Nome" }),
          h("dd", { texto: "RxNorm, da Biblioteca Nacional de Medicina dos EUA: converte o nome digitado no princípio ativo padronizado. A conversão aparece na tela para você conferir." }),
          h("dt", { texto: "Brasil" }),
          h("dd", { texto: "Bulário Eletrônico da ANVISA, aberto no navegador a partir de cada bula." })
        ),
        nota("O app não inventa dose: toda dose que aparece é um trecho da bula oficial, e a conferência mostra como leu cada número. Não usa inteligência artificial. A decisão continua sendo sua.")
      )
    );
  }

  function telaIngredientes() {
    var conteudo = [trilha(), estadoCarga()];
    var r = E.resolucao;
    if (r) {
      if (!r.ingredientes.length) {
        conteudo.push(
          h(
            "div",
            { classe: "cartao" },
            h("h2", { texto: "Não reconheci “" + r.digitado + "”" }),
            h("p", { classe: "sub", texto: "O RxNorm não encontrou esse princípio ativo. Confira a grafia, use o nome do princípio ativo em vez da marca brasileira, ou tente o nome em inglês." })
          ),
          cartaoAnvisa(r.digitado)
        );
      } else {
        conteudo.push(
          h("h2", { classe: "titulo-sec", texto: r.ingredientes.length === 1 ? "Confira o princípio ativo" : "Qual destes?" }),
          h("p", { classe: "sub", texto: "Cada opção é um conceito do RxNorm. Escolha o que corresponde ao que você procura." }),
          h(
            "ul",
            { classe: "lista" },
            r.ingredientes.map(function (ing) {
              var tipos = { IN: "Princípio ativo", MIN: "Associação", PIN: "Sal ou forma específica" };
              var como = ing.viaApelido
                ? "Nome brasileiro “" + r.digitado + "” → “" + ing.apelido + "”, confirmado no RxNorm"
                : ing.comoAchou
                  ? "Achado como “" + ing.comoAchou + "”" + (ing.fonteNome ? " (" + ing.fonteNome + ")" : "")
                  : "";
              return h(
                "li",
                null,
                h(
                  "button",
                  { type: "button", classe: "item", onclick: function () { escolherIngrediente(ing, false); } },
                  h(
                    "div",
                    { classe: "cresce" },
                    h("div", { classe: "item-t", texto: ing.nome }),
                    h("div", { classe: "item-m" }, h("span", { classe: "selo", texto: tipos[ing.tty] || ing.tty }), h("span", { texto: "RxCUI " + ing.rxcui })),
                    como ? h("div", { classe: "item-d", texto: como }) : null,
                    ing.fraco ? h("div", { classe: "item-aviso" }, icone("alerta", 15), h("span", { texto: "Correspondência fraca com o que foi digitado. Confira." })) : null
                  ),
                  icone("seta", 18)
                )
              );
            })
          )
        );
      }
    }
    return h("main", { classe: "pagina" }, conteudo);
  }

  function telaGrupos() {
    var conteudo = [trilha(), estadoCarga()];
    var ing = E.ingrediente;
    if (E.grupos) {
      if (!E.grupos.length) {
        conteudo.push(
          h(
            "div",
            { classe: "cartao" },
            h("h2", { texto: "A FDA não tem bula de " + ing.nome }),
            h("p", { classe: "sub", texto: "O princípio ativo existe no RxNorm, mas não há bula dele na base da FDA. Em geral é medicamento não aprovado nos EUA, ou só existe lá em outra forma de sal." })
          ),
          cartaoAnvisa(E.busca, "Para medicamentos sem registro nos EUA, a fonte oficial é a bula brasileira. Abra o Bulário Eletrônico da ANVISA já buscando por “" + E.busca + "”.")
        );
      } else {
        conteudo.push(
          h("h2", { classe: "titulo-sec", texto: "Formulações e associações na FDA" }),
          h("p", { classe: "sub", texto: "Nomes genéricos registrados que contêm " + ing.nome + ". Associações aparecem separadas." }),
          h(
            "ul",
            { classe: "lista" },
            E.grupos.map(function (g) {
              return h(
                "li",
                null,
                h(
                  "button",
                  { type: "button", classe: "item", onclick: function () { escolherGrupo(g, false); } },
                  h("div", { classe: "cresce" }, h("div", { classe: "item-t", texto: nomeBonito(g.nome) }), h("div", { classe: "item-m" }, h("span", { texto: g.total + (g.total === 1 ? " bula" : " bulas") }))),
                  icone("seta", 18)
                )
              );
            })
          )
        );
      }
    }
    return h("main", { classe: "pagina" }, conteudo);
  }

  function resumoFormas(r) {
    var s = r.secoes || {};
    var t = s.dosage_forms_and_strengths || s.active_ingredient || s.how_supplied || "";
    t = t.replace(/^\s*\d{0,2}\s*[A-Z][A-Z ,/&()-]{5,}\s+/, "").replace(/\s+/g, " ").trim();
    return t.length > 150 ? t.slice(0, 147).replace(/\s+\S*$/, "") + "…" : t;
  }

  function itemRotulo(r) {
    var t = B.titulo(r);
    var o = r.openfda || {};
    var reg = B.registro(o.application_number && o.application_number[0]);
    var formas = resumoFormas(r);
    var salva = estaSalva(r.set_id);
    return h(
      "li",
      null,
      h(
        "button",
        { type: "button", classe: "item", onclick: function () { abrirRotulo(r, null); } },
        h(
          "div",
          { classe: "cresce" },
          h("div", { classe: "item-t" }, h("span", { texto: nomeBonito(t.principal) }), salva ? h("span", { classe: "salva-ic", "aria-label": "salva" }, icone("estrela", 14)) : null),
          t.marca && t.generico && t.marca.toUpperCase() !== t.generico.toUpperCase() ? h("div", { classe: "item-d", texto: nomeBonito(t.generico) }) : null,
          h(
            "div",
            { classe: "item-m" },
            h("span", { classe: "selo selo-" + reg.sigla.toLowerCase(), texto: reg.sigla + " · " + reg.texto }),
            o.route && o.route.length ? h("span", { texto: o.route.map(nomeBonito).join(", ") }) : null,
            h("span", { texto: "vigente desde " + B.data(r.effective_time) })
          ),
          h("div", { classe: "item-d", texto: (o.manufacturer_name && o.manufacturer_name[0]) || "Fabricante não informado" }),
          formas ? h("div", { classe: "item-f", texto: formas }) : null
        ),
        icone("seta", 18)
      )
    );
  }

  function telaRotulos() {
    var conteudo = [trilha(), estadoCarga()];
    var l = E.lista;
    if (l) {
      var refs = l.itens.filter(function (r) { return B.registro(r.openfda.application_number && r.openfda.application_number[0]).ordem === 0; });
      var outras = l.itens.filter(function (r) { return refs.indexOf(r) < 0; });
      conteudo.push(
        h("h2", { classe: "titulo-sec", texto: nomeBonito(E.grupo.nome) }),
        h(
          "p",
          { classe: "sub", texto: l.semFiltro
            ? "Não há bula do fabricante original com este nome genérico. Estas são de reembaladoras, que repetem o texto do fabricante; as mais recentes primeiro."
            : "Só bulas do fabricante original (sem reembaladoras), das mais recentes. As de referência (NDA ou BLA) vêm primeiro: os genéricos seguem o texto delas." }
        )
      );
      if (refs.length) conteudo.push(h("h3", { classe: "rotulo-lista", texto: "Referência" }), h("ul", { classe: "lista" }, refs.map(itemRotulo)));
      if (outras.length) conteudo.push(h("h3", { classe: "rotulo-lista", texto: refs.length ? "Outras bulas" : "Bulas" }), h("ul", { classe: "lista" }, outras.map(itemRotulo)));
      if (!l.itens.length) conteudo.push(nota("Nenhuma bula encontrada para este nome genérico."));
      if (l.temMais) {
        conteudo.push(
          h("div", { classe: "acoes centro" }, botao(E.estado && E.estado.maisCarregando ? "Carregando…" : "Mostrar mais bulas", maisRotulos, { classe: "bt-sec", desligado: E.estado && E.estado.maisCarregando }))
        );
      }
    }
    return h("main", { classe: "pagina" }, conteudo);
  }

  /* ── a bula ─────────────────────────────────────────────────────── */

  function pintarTexto(texto, consulta) {
    var frag = document.createDocumentFragment();
    B.trechos(texto, consulta).forEach(function (t) {
      if (t.achado) frag.appendChild(h("mark", { classe: "achado", texto: t.t }));
      else if (t.dose) frag.appendChild(h("span", { classe: "dose", texto: t.t }));
      else frag.appendChild(document.createTextNode(t.t));
    });
    return frag;
  }

  /** Pinta os nós de texto de um fragmento já seguro (as tabelas). */
  function pintarNos(no, consulta) {
    var textos = [];
    var andar = document.createTreeWalker(no, 4, null, false);
    var n;
    while ((n = andar.nextNode())) textos.push(n);
    textos.forEach(function (t) {
      if (!t.nodeValue || !t.nodeValue.trim()) return;
      t.parentNode.replaceChild(pintarTexto(t.nodeValue, consulta), t);
    });
  }

  function corpoSecao(s, consulta) {
    var corpo = h("div", { classe: "secao-corpo" });
    if (s.texto) {
      B.paragrafos(s.texto).forEach(function (p) {
        var m = /^(\d{1,2}(?:\.\d{1,2}){1,2})\s/.exec(p);
        var el = h("p", { classe: m ? "subsecao" : null });
        el.appendChild(pintarTexto(p, consulta));
        corpo.appendChild(el);
      });
    }
    s.tabelas.forEach(function (html, i) {
      var frag = B.tabelaSegura(html);
      pintarNos(frag, consulta);
      corpo.appendChild(h("div", { classe: "tabela", role: "region", "aria-label": "Tabela " + (i + 1) + " da seção", tabindex: "0" }, frag));
    });
    return corpo;
  }

  function secoesBula(consulta) {
    var caixa = h("div", { id: "secoes" });
    B.secoesDe(E.rotulo).forEach(function (s) {
      var corpo = corpoSecao(s, consulta);
      var achados = corpo.querySelectorAll("mark.achado").length;
      var det = h(
        "details",
        { classe: "secao" + (s.def.alerta ? " secao-alerta" : ""), open: s.def.aberta || achados > 0 ? true : null, "data-campo": s.def.campo },
        h(
          "summary",
          null,
          h("span", { classe: "cresce" }, h("span", { classe: "secao-t", texto: s.def.titulo }), h("span", { classe: "secao-o", texto: s.def.original })),
          achados ? h("span", { classe: "contagem", texto: String(achados) }) : null,
          icone("baixo", 18)
        ),
        corpo
      );
      caixa.appendChild(det);
    });
    return caixa;
  }

  function atualizarAchados(rolar) {
    var marcas = document.querySelectorAll("#secoes mark.achado");
    var cont = document.getElementById("achados");
    if (!cont) return;
    if (!E.consulta || E.consulta.trim().length < 2) {
      cont.textContent = "";
      return;
    }
    if (!marcas.length) {
      cont.textContent = "nada";
      return;
    }
    if (E.achado >= marcas.length) E.achado = 0;
    if (E.achado < 0) E.achado = marcas.length - 1;
    for (var i = 0; i < marcas.length; i++) marcas[i].classList.toggle("atual", i === E.achado);
    cont.textContent = E.achado + 1 + " de " + marcas.length;
    if (rolar) {
      var alvo = marcas[E.achado];
      var det = alvo.closest("details");
      if (det && !det.open) det.open = true;
      var y = alvo.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.35;
      window.scrollTo(0, Math.max(0, y));
    }
  }

  var relogioBusca = null;
  function procurarNaBula(valor) {
    E.consulta = valor;
    E.achado = 0;
    clearTimeout(relogioBusca);
    relogioBusca = setTimeout(function () {
      var velho = document.getElementById("secoes");
      if (!velho) return;
      velho.parentNode.replaceChild(secoesBula(E.consulta), velho);
      atualizarAchados(true);
    }, 180);
  }

  function referencia(r) {
    var t = B.titulo(r);
    var o = r.openfda || {};
    return (
      nomeBonito(t.principal) +
      (t.marca && t.generico ? " (" + nomeBonito(t.generico) + ")" : "") +
      ". Bula aprovada pela FDA. " +
      ((o.manufacturer_name && o.manufacturer_name[0]) || "") +
      (o.application_number ? ", " + o.application_number[0] : "") +
      ". Versão " + r.version + ", vigente desde " + B.data(r.effective_time) +
      ". DailyMed, set ID " + r.set_id + ": " + B.linkDailyMed(r) +
      " (consultado em " + hoje() + ")."
    );
  }

  function avisoConferencia() {
    var c = E.conferencia;
    if (!E.salva) return null;
    var salvaEm = "Cópia salva em " + hoje(E.salva.salvoEm) + ". ";
    if (!c || c.estado === "conferindo") return h("div", { classe: "nota" }, h("span", { classe: "giro", "aria-hidden": "true" }), h("p", { texto: salvaEm + "Conferindo na FDA se há versão mais nova…" }));
    if (c.estado === "vigente") return nota(salvaEm + "Conferido agora: é a versão vigente na FDA.", "ok");
    if (c.estado === "sem-rede") return nota(salvaEm + "Sem conexão: não deu para conferir se há versão mais nova. Confira antes de prescrever.", "alerta");
    if (c.estado === "retirada") return h("div", { classe: "nota nota-alerta" }, icone("alerta", 18), h("div", null, h("p", { texto: salvaEm + "Esta bula não está mais na base da FDA. Pode ter sido retirada ou substituída. Confira no DailyMed antes de usar." }), h("div", { classe: "acoes" }, linkFora("DailyMed", B.linkDailyMed(E.rotulo), "bt-sec"))));
    if (c.estado === "nova") {
      return h(
        "div",
        { classe: "nota nota-alerta" },
        icone("alerta", 18),
        h(
          "div",
          null,
          h("p", { texto: salvaEm + "Há versão mais nova na FDA: versão " + c.nova.version + ", vigente desde " + B.data(c.nova.effective_time) + ". O texto abaixo é o antigo." }),
          h(
            "div",
            { classe: "acoes" },
            botao("Atualizar a cópia salva", function () {
              if (salvar(c.nova, true)) {
                E.rotulo = c.nova;
                E.salva = lerSalva(c.nova.set_id);
                E.conferencia = { estado: "vigente" };
                render();
                aviso("Cópia atualizada para a versão " + c.nova.version + ".");
              }
            }, { classe: "bt-pri", icone: "atualizar" })
          )
        )
      );
    }
    return null;
  }

  function telaBula() {
    var r = E.rotulo;
    var t = B.titulo(r);
    var o = r.openfda || {};
    var reg = B.registro(o.application_number && o.application_number[0]);
    var salva = estaSalva(r.set_id);

    var campo = h("input", {
      type: "search",
      classe: "procura-campo",
      placeholder: "Procurar nesta bula: renal, pediatric, mg/kg…",
      autocomplete: "off",
      autocapitalize: "off",
      spellcheck: "false",
      enterkeyhint: "search",
      "aria-label": "Procurar nesta bula",
      valor: E.consulta,
      oninput: function (ev) { procurarNaBula(ev.target.value); },
      onkeydown: function (ev) {
        if (ev.key === "Enter") {
          ev.preventDefault();
          E.achado += ev.shiftKey ? -1 : 1;
          atualizarAchados(true);
        }
      }
    });

    var integridade = E.salva
      ? h("p", { classe: "meta-l" }, icone("escudo", 15), h("span", { texto: "Integridade conferida ao abrir · SHA-256 " + E.salva.hash.slice(0, 16) + "…" }))
      : null;

    return h(
      "main",
      { classe: "pagina pagina-bula" },
      E.deSalvas ? null : trilha(),
      h(
        "section",
        { classe: "cabeca-bula" },
        h("h1", { texto: nomeBonito(t.principal) }),
        t.marca && t.generico && t.marca.toUpperCase() !== t.generico.toUpperCase() ? h("p", { classe: "generico", texto: nomeBonito(t.generico) }) : null,
        h(
          "div",
          { classe: "item-m" },
          h("span", { classe: "selo selo-" + reg.sigla.toLowerCase(), texto: reg.sigla + " · " + reg.texto }),
          o.route && o.route.length ? h("span", { texto: o.route.map(nomeBonito).join(", ") }) : null,
          o.product_type && o.product_type.length ? h("span", { texto: /OTC/.test(o.product_type[0]) ? "Venda livre (EUA)" : "Venda sob prescrição (EUA)" }) : null
        ),
        h(
          "dl",
          { classe: "meta" },
          h("dt", { texto: "Fabricante" }),
          h("dd", { texto: (o.manufacturer_name && o.manufacturer_name.join("; ")) || "não informado" }),
          h("dt", { texto: "Versão" }),
          h("dd", { texto: r.version + ", vigente desde " + B.data(r.effective_time) }),
          o.application_number ? h("dt", { texto: "Registro FDA" }) : null,
          o.application_number ? h("dd", { texto: o.application_number.join(", ") }) : null,
          h("dt", { texto: "Set ID" }),
          h("dd", { classe: "mono", texto: r.set_id })
        ),
        integridade,
        avisoConferencia(),
        h(
          "div",
          { classe: "acoes" },
          botao(salva ? "Salva" : "Salvar", function () {
            if (salva) {
              remover(r.set_id);
              if (E.salva) {
                E.salva = null;
                E.conferencia = null;
              }
              aviso("Removida das salvas.");
            } else if (salvar(r)) {
              E.salva = lerSalva(r.set_id);
              E.conferencia = { estado: "vigente" };
            }
            render();
          }, { classe: salva ? "bt-sec bt-marcado" : "bt-sec", icone: "estrela" }),
          botao("Calcular dose", function () {
            E.calcDe = r;
            E.calc.nome = nomeBonito(t.generico || t.principal);
            ir("calc");
          }, { classe: "bt-sec", icone: "calc" }),
          linkFora("DailyMed", B.linkDailyMed(r), "bt-sec"),
          linkFora("ANVISA", B.linkAnvisa((E.deSalvas ? E.nomeBR : E.busca) || t.generico || t.principal), "bt-sec"),
          botao("", function () { copiar(referencia(r), "Referência da bula copiada."); }, { classe: "bt-sec", icone: "copiar", rotulo: "Copiar a referência da bula" })
        ),
        nota("Texto oficial da bula americana, em inglês, exatamente como aprovado pela FDA: sem tradução e sem resumo. Apresentações e doses aprovadas no Brasil podem ser diferentes; confira também a bula da ANVISA."),
        E.autoAberta ? nota("Aberta automaticamente a primeira da lista (a de referência mais recente, quando há). Para escolher outra bula, volte.") : null
      ),
      painelDose(),
      painelConferir(),
      h("h2", { classe: "titulo-sec", texto: "Bula completa" }),
      h(
        "div",
        { classe: "procura" },
        icone("busca", 18),
        campo,
        h("span", { id: "achados", classe: "achados", "aria-live": "polite" }),
        h("button", { type: "button", classe: "icone-b pequeno", "aria-label": "Anterior", onclick: function () { E.achado--; atualizarAchados(true); } }, icone("cima", 18)),
        h("button", { type: "button", classe: "icone-b pequeno", "aria-label": "Próximo", onclick: function () { E.achado++; atualizarAchados(true); } }, icone("baixo", 18))
      ),
      secoesBula(E.consulta),
      h(
        "footer",
        { classe: "rodape-bula" },
        h("p", { texto: "Fonte: FDA, bula em formato SPL, obtida pela openFDA (api.fda.gov). A própria openFDA avisa que os dados dela não devem ser usados sozinhos para decisões de cuidado médico e devem ser tratados como não validados: em caso de dúvida, confira o mesmo set ID no DailyMed, que é o repositório oficial." }),
        h("p", { texto: "Destaques em amarelo marcam doses e frequências para facilitar a leitura. São só marcações visuais: o texto não foi alterado." })
      )
    );
  }

  /* ── dose para a doença e conferência da prescrição ─────────────── */

  var D = window.Doses;
  var NOME_POP = { adulto: "Adulto", crianca: "Criança", ambos: "Adulto e criança" };

  function trocarDoencaSemDesenhar(v) {
    E.doenca = String(v || "").trim().replace(/\s+/g, " ");
    E.cacheDose = null;
    E.doseMais = false;
  }

  function trocarDoenca(v) {
    trocarDoencaSemDesenhar(v);
    var y = window.scrollY;
    render();
    window.scrollTo(0, y);
  }

  /** As tabelas da posologia, já limpas e lidas, guardadas para a bula aberta. */
  function tabelasDe(r) {
    var k = r.id || r.set_id;
    if (E.cacheTab[k]) return E.cacheTab[k];
    var lidas = [];
    [].concat(r.secoes.dosage_and_administration_table || []).forEach(function (html) {
      var caixa = document.createElement("div");
      caixa.appendChild(B.tabelaSegura(html));
      var t = caixa.querySelector("table");
      if (t) lidas.push(D.linhasDaTabela(t));
    });
    E.cacheTab = {};
    E.cacheTab[k] = lidas;
    return lidas;
  }

  function doseParaDoenca() {
    var r = E.rotulo;
    var chave = (r.id || r.set_id) + "|" + E.doenca;
    if (E.cacheDose && E.cacheDose.chave === chave) return E.cacheDose.res;
    var res = D.paraDoenca(r, tabelasDe(r), E.doenca);
    E.cacheDose = { chave: chave, res: res };
    return res;
  }

  /** Os trechos que a tela mostra e a conferência usa. */
  function trechosEmUso(res) {
    if (res.alvo.termos.length && !res.trechos.length) {
      return { lista: res.todos.filter(function (u) { return u.valores.length; }), naoAchou: true };
    }
    return { lista: res.trechos, naoAchou: false };
  }

  function cortar(t, n) {
    t = String(t || "");
    return t.length > n ? t.slice(0, n - 1).replace(/\s+\S*$/, "") + "…" : t;
  }

  /** Como o app entendeu um valor da bula, em português: "20 a 45 mg/kg/dia, a cada 8 a 12 h". */
  function descrever(v) {
    var faixa = v.lo === v.hi ? C.num(v.lo) : C.num(v.lo) + " a " + C.num(v.hi);
    var u = v.u + (v.porKg ? "/kg" : v.porM2 ? "/m²" : "");
    var por = v.base === "dia" ? "/dia" : v.base === "h" ? "/h" : v.base === "min" ? "/min" : v.base === "dose" && (v.porKg || v.porM2) ? "/dose" : "";
    var t = (v.max ? "máximo " : "") + faixa + " " + u + por;
    if (v.max && v.maxBase === "dia" && v.base !== "dia") t += " por dia";
    if (v.max && v.maxBase === "?") t += " (a bula não diz se por dose ou por dia)";
    if (v.unica) t += ", dose única";
    else if (v.freq) {
      var ops = v.freq.opcoes && v.freq.opcoes.length ? v.freq.opcoes : [v.freq];
      t += ", a cada " + ops.map(function (o) { return o.lo === o.hi ? C.num(o.lo) : C.num(o.lo) + " a " + C.num(o.hi); }).join(" ou ") + " h";
    }
    return t;
  }

  function selosTrecho(u) {
    var s = [];
    if (NOME_POP[u.pop]) s.push(h("span", { classe: "selo", texto: NOME_POP[u.pop] + (u.popHerdada ? " (pelo parágrafo)" : "") }));
    if (u.situacao === "renal") s.push(h("span", { classe: "selo selo-atencao", texto: "Ajuste renal" }));
    if (u.situacao === "hepatica") s.push(h("span", { classe: "selo selo-atencao", texto: "Ajuste hepático" }));
    if (u.termo && u.termo.termo.amplo) s.push(h("span", { classe: "selo selo-atencao", texto: "categoria ampla: " + u.termo.achado }));
    if (u.tipo === "linha") s.push(h("span", { texto: "Tabela " + u.tabela + (u.titulo ? " · " + cortar(u.titulo, 70) : "") }));
    else if (u.subsecao) s.push(h("span", { texto: "Subseção " + u.subsecao }));
    if (u.continuacao) s.push(h("span", { texto: "continuação do trecho anterior" }));
    return s;
  }

  function trechoDose(u) {
    var destaque = u.termo ? u.termo.achado : "";
    var corpo;
    if (u.tipo === "linha") {
      corpo = h("dl", { classe: "linha-tab" });
      u.celulas.forEach(function (c) {
        if (!c.texto) return;
        var dd = h("dd");
        dd.appendChild(pintarTexto(c.texto, destaque));
        corpo.appendChild(h("dt", { texto: c.cab || "—" }));
        corpo.appendChild(dd);
      });
    } else {
      corpo = h("p", { classe: "trecho-t" });
      corpo.appendChild(pintarTexto(u.texto, destaque));
    }
    return h(
      "li",
      { classe: "trecho" + (u.situacao ? " trecho-sit" : "") },
      h("div", { classe: "item-m" }, selosTrecho(u)),
      u.subtitulo ? h("p", { classe: "trecho-sub", texto: u.subtitulo }) : null,
      corpo
    );
  }

  function listaTrechos(lista) {
    var mostrar = E.doseMais ? lista : lista.slice(0, 6);
    return h(
      "div",
      null,
      h("ul", { classe: "trechos" }, mostrar.map(trechoDose)),
      lista.length > mostrar.length
        ? h("div", { classe: "acoes" }, botao("Mostrar mais " + (lista.length - mostrar.length) + " trechos", function () {
            E.doseMais = true;
            var y = window.scrollY;
            render();
            window.scrollTo(0, y);
          }, { classe: "bt-ter" }))
        : null
    );
  }

  function resultadoDose(res) {
    var partes = [];
    var alvo = res.alvo;
    var nomeDoenca = alvo.doencas.length ? alvo.doencas.map(function (d) { return d.pt; }).join(" / ") : "“" + E.doenca + "”";
    if (alvo.termos.length) {
      partes.push(h("p", {
        classe: "procurado",
        texto: (alvo.doencas.length ? nomeDoenca + ", procurada na bula como: " : "Procurado na bula como está escrito: ") +
          alvo.termos.map(function (t) { return t.termo + (t.amplo ? " (categoria ampla)" : ""); }).join(", ") + "."
      }));
      if (res.indicacoes.length) {
        var caixa = h("div", { classe: "indicacao" }, h("p", { classe: "rotulo-c", texto: "Consta nas indicações da bula" }));
        res.indicacoes.slice(0, 2).forEach(function (i) {
          var p = h("p", { classe: "trecho-t" });
          p.appendChild(pintarTexto(cortar(i.texto, 360), i.termo.achado));
          caixa.appendChild(p);
        });
        partes.push(caixa);
      } else {
        partes.push(nota(nomeDoenca + " não aparece nas indicações desta bula da FDA. Pode ser uso fora da bula nos EUA, ou a bula chamar a doença por outro nome.", "alerta"));
      }
    }
    var uso = trechosEmUso(res);
    if (uso.naoAchou) {
      partes.push(nota("Não achei " + nomeDoenca + " na posologia desta bula. Abaixo, a posologia geral.", "alerta"));
      partes.push(h("h3", { classe: "form-t", texto: "Posologia geral (texto oficial)" }));
    } else if (!alvo.termos.length) {
      partes.push(h("h3", { classe: "form-t", texto: "Posologia geral (texto oficial)" }));
      partes.push(h("p", { classe: "dica", texto: "Digite a doença acima para ver só o trecho dela." }));
    } else {
      partes.push(h("h3", { classe: "form-t", texto: "Dose na bula (texto oficial)" }));
      if (res.porIndicacao) partes.push(nota("A posologia desta bula não separa por doença: vale a dose geral abaixo."));
      if (res.soAmplos) partes.push(nota("Achado só pela categoria ampla em que a doença costuma estar na bula americana. Confira se " + nomeDoenca.toLowerCase() + " está mesmo dentro dela.", "alerta"));
    }
    if (!uso.lista.length) partes.push(nota("A posologia desta bula não tem número de dose em mg, mcg, g ou unidades (pode estar em comprimidos). Leia a seção completa abaixo."));
    else partes.push(listaTrechos(uso.lista));
    return partes;
  }

  function painelDose() {
    var r = E.rotulo;
    var campo = h("input", {
      id: "doenca",
      type: "search",
      classe: "busca-campo",
      placeholder: "Doença: otite, pneumonia, ITU, TVP…",
      autocomplete: "off",
      autocapitalize: "off",
      spellcheck: "false",
      enterkeyhint: "search",
      "aria-label": "Doença ou situação",
      valor: E.doenca
    });
    var ativas = D.interpretar(E.doenca).doencas;
    var chips = D.doencasDaBula(r);
    return h(
      "section",
      { classe: "cartao dose-card", id: "dose-card" },
      h("h2", { texto: "Dose para a doença" }),
      h(
        "form",
        { classe: "busca", onsubmit: function (ev) { ev.preventDefault(); campo.blur(); trocarDoenca(campo.value); } },
        icone("busca", 18),
        campo,
        h("button", { type: "submit", classe: "bt bt-pri", texto: "Ver dose" })
      ),
      chips.length
        ? h(
            "div",
            { classe: "fichas", "aria-label": "Doenças citadas nas indicações desta bula" },
            chips.slice(0, 16).map(function (d) {
              var ativa = ativas.indexOf(d) >= 0;
              return h("button", { type: "button", classe: "ficha" + (ativa ? " ficha-ativa" : ""), "aria-pressed": ativa ? "true" : "false", texto: d.pt, onclick: function () { trocarDoenca(ativa ? "" : d.chaves[0]); } });
            }).concat(
              /renal|creatinine|dialysis|GFR/i.test((r.secoes.dosage_and_administration || "") + (r.secoes.dosage_and_administration_table || []).join(" "))
                ? [h("button", { type: "button", classe: "ficha ficha-sit", texto: "Ajuste renal", onclick: function () { trocarDoenca("ajuste renal"); } })]
                : []
            )
          )
        : null,
      h("div", { id: "dose-res" }, resultadoDose(doseParaDoenca()))
    );
  }

  /* campos da prescrição */

  function campoP(campo, rotulo, sufixo, dica) {
    var input = h("input", {
      type: "text",
      inputmode: "decimal",
      autocomplete: "off",
      classe: "num",
      id: "p-" + campo,
      valor: E.prescr[campo],
      "aria-describedby": "pe-" + campo,
      oninput: function (ev) {
        E.prescr[campo] = ev.target.value;
        atualizarConferencia();
      }
    });
    return h(
      "div",
      { classe: "campo" },
      h("label", { for: "p-" + campo, texto: rotulo }),
      h("div", { classe: "campo-l" }, input, sufixo ? (typeof sufixo === "string" ? h("span", { classe: "suf", texto: sufixo }) : sufixo) : null),
      dica ? h("p", { classe: "dica", texto: dica }) : null,
      h("p", { classe: "campo-erro", id: "pe-" + campo, "aria-live": "polite" })
    );
  }

  function seletorP(campo, lista, rotulo, id, redesenha) {
    return h(
      "select",
      {
        classe: "sel",
        id: id || null,
        "aria-label": rotulo,
        onchange: function (ev) {
          E.prescr[campo] = ev.target.value;
          if (redesenha) {
            var y = window.scrollY;
            render();
            window.scrollTo(0, y);
          } else atualizarConferencia();
        }
      },
      opcoes(lista, E.prescr[campo])
    );
  }

  function painelConferir() {
    var p = E.prescr;
    return h(
      "section",
      { classe: "cartao", id: "conferir" },
      h("h2", { texto: "Conferir a prescrição" }),
      h("p", { classe: "sub", texto: "Digite o que foi prescrito. O app compara com os números do trecho acima e mostra o que coincide, o que fica perto e o que passa de um máximo citado." }),
      h(
        "div",
        { classe: "form" },
        campoP("dose", "Dose por tomada", seletorP("unidade", ["mg", "mcg", "g", "UI", "mEq", "mL"], "Unidade da dose", null, true)),
        p.unidade === "mL"
          ? h("div", { classe: "grade" }, campoP("concQtd", "Concentração", seletorP("concUnidade", ["mg", "mcg", "g", "UI", "mEq"], "Unidade da concentração")), campoP("concVol", "em", "mL", "Ex.: 250 mg em 5 mL."))
          : null,
        h(
          "div",
          { classe: "campo" },
          h("label", { for: "p-intervalo", texto: "Intervalo" }),
          seletorP("intervalo", [["24", "a cada 24 h (1×/dia)"], ["12", "a cada 12 h (2×/dia)"], ["8", "a cada 8 h (3×/dia)"], ["6", "a cada 6 h (4×/dia)"], ["4", "a cada 4 h (6×/dia)"], ["48", "a cada 48 h"], ["168", "1×/semana"], ["unica", "dose única"], ["outro", "outro intervalo…"]], "Intervalo", "p-intervalo", true)
        ),
        h(
          "div",
          { classe: "grade" },
          p.intervalo === "outro" ? campoP("outroIntervalo", "A cada", "h") : null,
          campoP("peso", "Peso", "kg", "Para comparar doses por kg.")
        ),
        h(
          "div",
          { classe: "segmento", role: "radiogroup", "aria-label": "Paciente" },
          [["adulto", "Adulto"], ["crianca", "Criança"]].map(function (o) {
            var ativo = p.paciente === o[0];
            return h("button", {
              type: "button", role: "radio", "aria-checked": ativo ? "true" : "false", classe: ativo ? "ativo" : null, texto: o[1],
              onclick: function () { p.paciente = o[0]; var y = window.scrollY; render(); window.scrollTo(0, y); }
            });
          })
        ),
        h(
          "div",
          { classe: "checks" },
          [["renal", "Função renal reduzida"], ["hepatica", "Insuficiência hepática"]].map(function (o) {
            return h(
              "label",
              { classe: "check" },
              h("input", { type: "checkbox", checked: p[o[0]] ? true : null, onchange: function (ev) { p[o[0]] = ev.target.checked; atualizarConferencia(); } }),
              h("span", { texto: o[1] })
            );
          })
        )
      ),
      h("div", { id: "conf-res", classe: "conf-res", "aria-live": "polite" })
    );
  }

  var MAPA_UNIDADE = { mg: ["mg", 1], mcg: ["mg", 0.001], g: ["mg", 1000], UI: ["UI", 1], mEq: ["mEq", 1] };

  /** A prescrição digitada, em unidades da comparação, com os erros por campo. */
  function lerPrescricao() {
    var p = E.prescr;
    var erros = {};
    var faltam = [];
    var dose = C.lerNumero(p.dose);
    if (dose.erro) erros.dose = dose.erro;
    else if (dose.vazio) faltam.push("dose");
    var peso = C.lerNumero(p.peso, { max: 1000 });
    if (peso.erro) erros.peso = peso.erro;
    var intervalo = null;
    if (p.intervalo === "outro") {
      var oi = C.lerNumero(p.outroIntervalo, { max: 720 });
      if (oi.erro) erros.outroIntervalo = oi.erro;
      else if (oi.vazio) faltam.push("intervalo");
      else intervalo = oi.valor;
    } else if (p.intervalo !== "unica") intervalo = +p.intervalo;
    var valor = dose.valor;
    var unidade = p.unidade;
    var conversao = null;
    if (p.unidade === "mL") {
      var cq = C.lerNumero(p.concQtd);
      var cv = C.lerNumero(p.concVol);
      if (cq.erro) erros.concQtd = cq.erro;
      else if (cq.vazio) faltam.push("concentração");
      if (cv.erro) erros.concVol = cv.erro;
      else if (cv.vazio) faltam.push("volume da concentração");
      if (dose.valor && cq.valor && cv.valor) {
        valor = (dose.valor * cq.valor) / cv.valor;
        unidade = p.concUnidade;
        conversao = C.com(dose.valor, "mL") + " × " + C.com(cq.valor, p.concUnidade) + " ÷ " + C.com(cv.valor, "mL") + " = " + C.com(valor, unidade);
      }
    }
    if (Object.keys(erros).length || faltam.length || !valor) return { erros: erros, faltam: faltam };
    var m = MAPA_UNIDADE[unidade];
    var presc = { dose: valor * m[1], u: m[0], intervalo: intervalo, peso: peso.valor || null, paciente: p.paciente, renal: p.renal, hepatica: p.hepatica };
    return { erros: erros, faltam: faltam, presc: presc, conversao: conversao, digitada: { valor: valor, unidade: unidade } };
  }

  function descreverPrescricao(lp) {
    var pr = lp.presc;
    var partes = [];
    var u = pr.u;
    var porDia = pr.intervalo ? (pr.dose * 24) / pr.intervalo : pr.dose;
    var dig = lp.digitada.unidade !== u ? " (" + C.com(lp.digitada.valor, lp.digitada.unidade) + ")" : "";
    partes.push(C.com(pr.dose, u) + dig + " por dose");
    partes.push(pr.intervalo ? "a cada " + C.com(pr.intervalo, "h") : "dose única");
    if (pr.intervalo) partes.push(C.com(porDia, u) + " por dia");
    if (pr.peso) {
      partes.push(C.com(pr.dose / pr.peso, u + "/kg") + " por dose");
      if (pr.intervalo) partes.push(C.com(porDia / pr.peso, u + "/kg") + " por dia");
    }
    return partes.join(" · ");
  }

  var ESTADOS = {
    coincide: ["ok", "Coincide"],
    intervalo: ["atencao", "Dose igual, intervalo diferente"],
    perto: ["atencao", ""],
    diferente: ["neutro", "Diferente"],
    "maximo-passa": ["grave", "Passa do máximo"],
    "maximo-talvez": ["atencao", "Pode passar do máximo"],
    "maximo-ok": ["ok", "Dentro do máximo"],
    "outra-populacao": ["neutro", "Outra população"],
    "outra-situacao": ["neutro", ""],
    "sem-peso": ["neutro", "Precisa do peso"],
    "nao-comparavel": ["neutro", ""]
  };

  function contextoDe(item) {
    var u = item.trecho;
    var v = item.r.v;
    if (u.tipo === "linha") {
      var rotuloLinha = u.celulas.filter(function (c) { return c.texto && !D.valores(c.texto).length; }).map(function (c) { return c.texto; }).join(" · ");
      return cortar([u.subtitulo, rotuloLinha, v.cab].filter(Boolean).join(" · "), 170);
    }
    return cortar(u.texto, 200);
  }

  function itemConferencia(item) {
    var r = item.r;
    var e = ESTADOS[r.estado] || ["neutro", r.estado];
    var rotulo = e[1];
    if (r.estado === "perto") rotulo = "Perto: " + C.num(Math.abs(r.desvio) * 100) + "% " + (r.desvio > 0 ? "acima" : "abaixo");
    if (r.estado === "outra-situacao" || r.estado === "nao-comparavel") rotulo = "Não comparado: " + r.motivo;
    var unidadePresc = r.prescrito ? r.v.u + (r.v.porKg ? "/kg" : "") + (r.prescrito.por === "dia" ? "/dia" : "/dose") : "";
    var valor = h("p", { classe: "conf-valor" });
    valor.appendChild(pintarTexto("“" + r.v.texto + "”", ""));
    return h(
      "li",
      { classe: "conf-item conf-" + e[0] },
      h("span", { classe: "conf-estado", texto: rotulo }),
      valor,
      h("p", { classe: "conf-lido", texto: "Lido como: " + descrever(r.v) + (r.prescrito ? " · prescrito: " + C.com(r.prescrito.valor, unidadePresc) : "") }),
      h("p", { classe: "conf-ctx", texto: (NOME_POP[r.v.pop] ? NOME_POP[r.v.pop] + " · " : "") + contextoDe(item) })
    );
  }

  function resultadoConferencia() {
    var caixa = document.createDocumentFragment();
    var lp = lerPrescricao();
    ["dose", "peso", "outroIntervalo", "concQtd", "concVol"].forEach(function (k) {
      var el = document.getElementById("pe-" + k);
      var input = document.getElementById("p-" + k);
      var msg = lp.erros[k] || "";
      if (el) el.textContent = msg;
      if (input) input.setAttribute("aria-invalid", msg ? "true" : "false");
    });
    if (!lp.presc) {
      caixa.appendChild(h("p", { classe: "resultado-vazio", texto: Object.keys(lp.erros).length ? "Corrija o campo marcado para conferir." : "Para conferir, falta: " + lp.faltam.join(", ") + "." }));
      return caixa;
    }
    var res = doseParaDoenca();
    var uso = trechosEmUso(res);
    var c = D.conferir(lp.presc, uso.lista);
    caixa.appendChild(h("p", { classe: "presc-linha" }, h("strong", { texto: "Prescrito: " }), descreverPrescricao(lp)));
    if (lp.conversao) caixa.appendChild(h("p", { classe: "dica", texto: lp.conversao }));
    if (!c.itens.length) {
      caixa.appendChild(nota("O trecho não tem número de dose para comparar. Compare lendo o texto acima."));
      return caixa;
    }
    var primeiro;
    if (c.resumo === "passa") {
      primeiro = c.passa[0];
      caixa.appendChild(h("div", { classe: "alerta alerta-grave", role: "alert" }, icone("alerta", 18), h("p", { texto: "Passa de um máximo citado na bula: " + descrever(primeiro.r.v) + ". Prescrito: " + C.com(primeiro.r.prescrito.valor, primeiro.r.v.u + (primeiro.r.v.porKg ? "/kg" : "") + "/" + primeiro.r.prescrito.por) + "." })));
    } else if (c.resumo === "coincide") {
      primeiro = c.coincide[0];
      caixa.appendChild(h("div", { classe: "alerta alerta-ok" }, icone("ok", 18), h("p", { texto: "Coincide com a bula: " + descrever(primeiro.r.v) + (c.coincide.length > 1 ? " (e mais " + (c.coincide.length - 1) + ")" : "") + ". Confira se o trecho é da mesma população, gravidade e situação do paciente." })));
    } else if (c.resumo === "intervalo") {
      primeiro = c.intervalo[0];
      caixa.appendChild(h("div", { classe: "alerta alerta-atencao" }, icone("alerta", 18), h("p", { texto: "A dose bate com a bula, mas o intervalo não: a bula diz " + descrever(primeiro.r.v) + "." })));
    } else if (c.resumo === "perto") {
      primeiro = c.perto[0];
      caixa.appendChild(h("div", { classe: "alerta alerta-atencao" }, icone("alerta", 18), h("p", { texto: "Não coincide; o mais perto é " + descrever(primeiro.r.v) + ", " + C.num(Math.abs(primeiro.r.desvio) * 100) + "% " + (primeiro.r.desvio > 0 ? "acima" : "abaixo") + "." })));
    } else if (c.resumo === "diferente") {
      caixa.appendChild(h("div", { classe: "alerta alerta-atencao" }, icone("alerta", 18), h("p", { texto: "Nenhum número deste trecho da bula coincide com a prescrição. Leia o trecho acima antes de seguir." })));
    } else {
      caixa.appendChild(nota("Nenhum número do trecho pôde ser comparado com esta prescrição (veja os motivos abaixo)."));
    }
    if (c.talvez.length) caixa.appendChild(h("div", { classe: "alerta alerta-atencao" }, icone("alerta", 18), h("p", { texto: "A dose do dia passa de " + descrever(c.talvez[0].r.v) + ". Se esse máximo for diário, a prescrição passa dele." })));
    var avisos = [];
    if (c.semPeso && !lp.presc.peso) avisos.push(c.semPeso + (c.semPeso === 1 ? " valor é" : " valores são") + " por kg: informe o peso para comparar.");
    if (c.outraPop) avisos.push(c.outraPop + (c.outraPop === 1 ? " valor é" : " valores são") + " de " + (lp.presc.paciente === "adulto" ? "criança" : "adulto") + " e ficaram de fora.");
    if (c.outraSit) avisos.push(c.outraSit + (c.outraSit === 1 ? " valor é" : " valores são") + " de ajuste renal ou hepático e ficaram de fora. Marque a situação, se for o caso.");
    avisos.forEach(function (a) { caixa.appendChild(h("p", { classe: "dica", texto: a })); });

    var principais = c.passa.concat(c.coincide, c.intervalo, c.talvez, c.perto.slice(0, 3), c.itens.filter(function (i) { return i.r.estado === "maximo-ok"; }));
    var resto = c.itens.filter(function (i) { return principais.indexOf(i) < 0; });
    if (principais.length) caixa.appendChild(h("ul", { classe: "conf-lista" }, principais.map(itemConferencia)));
    if (resto.length) {
      caixa.appendChild(h("details", { classe: "conf-resto" }, h("summary", { texto: "Outros números do trecho (" + resto.length + ")" }), h("ul", { classe: "conf-lista" }, resto.map(itemConferencia))));
    }
    caixa.appendChild(h("p", { classe: "dica", texto: "A conferência compara números e mostra como leu cada um. Ela não sabe a gravidade, o resto do caso nem a apresentação disponível no Brasil." }));
    return caixa;
  }

  function atualizarConferencia() {
    var alvo = document.getElementById("conf-res");
    if (!alvo) return;
    alvo.textContent = "";
    alvo.appendChild(resultadoConferencia());
  }

  /* ── salvas ─────────────────────────────────────────────────────── */

  function itemSalva(x) {
    var removendo = E.removendo === x.set_id;
    var status = [];
    if (x.temNova) status.push(h("span", { classe: "selo selo-alerta", texto: "versão nova: " + x.temNova.version }));
    else if (x.retirada) status.push(h("span", { classe: "selo selo-alerta", texto: "não está mais na FDA" }));
    else if (dias(x.conferidoEm) > 30) status.push(h("span", { classe: "selo selo-atencao", texto: "conferida há " + dias(x.conferidoEm) + " dias" }));
    return h(
      "li",
      { classe: "salva-li" },
      h(
        "button",
        {
          type: "button",
          classe: "item",
          onclick: function () {
            var reg = lerSalva(x.set_id);
            if (reg.erro) {
              aviso(reg.erro === "alterada" ? "A cópia salva não confere com o resumo de integridade. Não será mostrada: remova e salve de novo." : "A cópia salva está ilegível. Remova e salve de novo.");
              return;
            }
            E.pilha = [];
            E.nomeBR = x.busca || "";
            abrirRotulo(reg.rotulo, reg);
          }
        },
        h(
          "div",
          { classe: "cresce" },
          h("div", { classe: "item-t", texto: nomeBonito(x.principal) }),
          x.generico && x.generico.toUpperCase() !== String(x.principal).toUpperCase() ? h("div", { classe: "item-d", texto: nomeBonito(x.generico) }) : null,
          h("div", { classe: "item-m" }, h("span", { texto: "versão " + x.version + " · " + B.data(x.effective_time) }), h("span", { texto: "salva em " + hoje(x.salvoEm) }), status),
          x.fabricante ? h("div", { classe: "item-d", texto: x.fabricante }) : null
        ),
        icone("seta", 18)
      ),
      E.tela === "salvas"
        ? h(
            "button",
            {
              type: "button",
              classe: "icone-b remover" + (removendo ? " confirmar" : ""),
              "aria-label": removendo ? "Toque de novo para remover" : "Remover",
              onclick: function () {
                if (removendo) {
                  remover(x.set_id);
                  E.removendo = null;
                  aviso("Removida.");
                } else E.removendo = x.set_id;
                render();
              }
            },
            removendo ? h("span", { classe: "confirmar-t", texto: "Remover?" }) : icone("lixo", 18)
          )
        : null
    );
  }

  function telaSalvas() {
    var l = indice();
    return h(
      "main",
      { classe: "pagina" },
      h("h1", { classe: "titulo-pag", texto: "Bulas salvas" }),
      h("p", { classe: "sub", texto: "Ficam só neste aparelho e abrem sem internet. Cada cópia leva um resumo SHA-256 conferido sempre que ela é aberta. Com internet, o app confere também se a FDA publicou versão mais nova." }),
      semArmazem && !A ? nota("Este navegador não está deixando guardar nada nesta página. As bulas não serão salvas.", "alerta") : null,
      l.length
        ? h(
            "div",
            null,
            h("div", { classe: "acoes" }, botao(E.conferindoTodas ? "Conferindo…" : "Conferir versões agora", conferirTodas, { classe: "bt-sec", icone: "atualizar", desligado: E.conferindoTodas })),
            h("ul", { classe: "lista" }, l.map(itemSalva))
          )
        : h("div", { classe: "vazio" }, icone("estrela", 28), h("p", { texto: "Nenhuma bula salva. Abra uma bula e toque em Salvar para tê-la sem internet." }))
    );
  }

  /* ── calculadora ────────────────────────────────────────────────── */

  function opcoes(lista, atual) {
    return lista.map(function (o) {
      var v = Array.isArray(o) ? o[0] : o;
      var t = Array.isArray(o) ? o[1] : o;
      return h("option", { value: v, selected: v === atual ? true : null, texto: t });
    });
  }

  function seletor(campo, lista, rotulo) {
    return h(
      "select",
      {
        classe: "sel",
        "aria-label": rotulo,
        "data-campo": campo,
        onchange: function (ev) {
          E.calc[campo] = ev.target.value;
          if (campo === "base" || campo === "periodo" || campo === "sentido" || campo === "porKg" || campo === "modo") render();
          else recalcular();
        }
      },
      opcoes(lista, E.calc[campo])
    );
  }

  function campoNum(campo, rotulo, sufixo, dica) {
    var input = h("input", {
      type: "text",
      inputmode: "decimal",
      autocomplete: "off",
      classe: "num",
      id: "c-" + campo,
      "data-campo": campo,
      valor: E.calc[campo],
      "aria-describedby": "e-" + campo,
      oninput: function (ev) {
        E.calc[campo] = ev.target.value;
        recalcular();
      }
    });
    return h(
      "div",
      { classe: "campo" },
      h("label", { for: "c-" + campo, texto: rotulo }),
      h("div", { classe: "campo-l" }, input, sufixo ? (typeof sufixo === "string" ? h("span", { classe: "suf", texto: sufixo }) : sufixo) : null),
      dica ? h("p", { classe: "dica", texto: dica }) : null,
      h("p", { classe: "campo-erro", id: "e-" + campo, "aria-live": "polite" })
    );
  }

  function segmento(campo, lista) {
    return h(
      "div",
      { classe: "segmento", role: "radiogroup" },
      lista.map(function (o) {
        var ativo = E.calc[campo] === o[0];
        return h("button", {
          type: "button",
          role: "radio",
          "aria-checked": ativo ? "true" : "false",
          classe: ativo ? "ativo" : null,
          texto: o[1],
          onclick: function () {
            E.calc[campo] = o[0];
            render();
          }
        });
      })
    );
  }

  var MASSAS = ["mg", "mcg", "g"];
  var TODAS = ["mg", "mcg", "g", "UI", "mEq", "mmol"];

  function formPeso() {
    var c = E.calc;
    var porQue = c.base === "kg" ? "/kg" : c.base === "m2" ? "/m²" : "";
    return h(
      "div",
      { classe: "form" },
      segmento("base", [["kg", "Por kg"], ["m2", "Por m²"], ["fixa", "Dose fixa"]]),
      h(
        "div",
        { classe: "grade" },
        c.base !== "fixa" ? campoNum("peso", "Peso", "kg") : null,
        c.base === "m2" ? campoNum("altura", "Altura", "cm", "Superfície corporal por Mosteller.") : null
      ),
      campoNum(
        "dose",
        "Dose prescrita",
        h("span", { classe: "suf-grupo" }, seletor("unidade", TODAS, "Unidade da dose"), porQue ? h("span", { classe: "suf", texto: porQue }) : null, seletor("periodo", [["dose", "por dose"], ["dia", "por dia"]], "Por dose ou por dia")),
        "Digite a dose que você leu na bula ou decidiu prescrever."
      ),
      campoNum("tomadas", "Tomadas por dia", "vezes", c.periodo === "dia" ? "Divide a dose diária. Ex.: 3 = a cada 8 h." : "Opcional: calcula o total do dia."),
      h("h3", { classe: "form-t", texto: "Dose máxima (opcional)" }),
      campoNum(
        "max",
        "Máximo da bula",
        h("span", { classe: "suf-grupo" }, seletor("maxUnidade", TODAS, "Unidade da dose máxima"), seletor("maxPeriodo", [["dose", "por dose"], ["dia", "por dia"]], "Máximo por dose ou por dia")),
        "Se a dose calculada passar daqui, o app avisa. Nada é trocado sozinho."
      ),
      h("h3", { classe: "form-t", texto: "Apresentação (opcional)" }),
      h(
        "div",
        { classe: "grade" },
        campoNum("apQtd", "Quantidade", seletor("apUnidade", TODAS, "Unidade da apresentação")),
        campoNum("apVolume", "em volume de", "mL", "Ex.: 250 mg em 5 mL.")
      )
    );
  }

  function formInfusao() {
    var c = E.calc;
    return h(
      "div",
      { classe: "form" },
      segmento("sentido", [["dose", "Dose → mL/h"], ["vazao", "mL/h → dose"]]),
      h(
        "div",
        { classe: "grade" },
        campoNum("peso", "Peso", "kg", c.porKg === "kg" ? null : "Só é usado em dose por kg."),
        c.sentido === "vazao" ? campoNum("vazao", "Vazão da bomba", "mL/h") : null
      ),
      c.sentido === "dose"
        ? campoNum(
            "iDose",
            "Dose",
            h("span", { classe: "suf-grupo" }, seletor("iUnidade", ["mcg", "mg", "UI", "mEq"], "Unidade"), seletor("porKg", [["kg", "/kg"], ["total", "total"]], "Por kg ou total"), seletor("tempo", [["min", "/min"], ["h", "/h"]], "Por minuto ou por hora"))
          )
        : h(
            "div",
            { classe: "campo" },
            h("span", { classe: "campo-r", texto: "Resultado em" }),
            h("div", { classe: "campo-l" }, h("span", { classe: "suf-grupo" }, seletor("iUnidade", ["mcg", "mg", "UI", "mEq"], "Unidade"), seletor("porKg", [["kg", "/kg"], ["total", "total"]], "Por kg ou total"), seletor("tempo", [["min", "/min"], ["h", "/h"]], "Por minuto ou por hora")))
          ),
      h("h3", { classe: "form-t", texto: "Solução preparada" }),
      h(
        "div",
        { classe: "grade" },
        campoNum("qtd", "Quantidade do medicamento", seletor("qtdUnidade", ["mg", "mcg", "g", "UI", "mEq"], "Unidade")),
        campoNum("volume", "Volume final", "mL", "Medicamento + diluente.")
      )
    );
  }

  function entradaCalculo() {
    var c = E.calc;
    if (c.modo === "peso") {
      return {
        tipo: "peso",
        campos: ["peso", "altura", "dose", "tomadas", "max", "apQtd", "apVolume"],
        r: C.porPeso({
          base: c.base, peso: c.peso, altura: c.altura, dose: c.dose, unidade: c.unidade, periodo: c.periodo, tomadas: c.tomadas,
          max: c.max, maxUnidade: c.maxUnidade, maxPeriodo: c.maxPeriodo, apQtd: c.apQtd, apUnidade: c.apUnidade, apVolume: c.apVolume
        })
      };
    }
    var r = C.infusao({
      sentido: c.sentido, peso: c.peso, dose: c.iDose, doseUnidade: c.iUnidade, porKg: c.porKg === "kg", tempo: c.tempo,
      vazao: c.vazao, qtd: c.qtd, qtdUnidade: c.qtdUnidade, volume: c.volume
    });
    if (r.erros && r.erros.dose) {
      r.erros.iDose = r.erros.dose;
      delete r.erros.dose;
    }
    return { tipo: "infusao", campos: ["peso", "iDose", "vazao", "qtd", "volume"], r: r };
  }

  var NOMES_CAMPO = { peso: "peso", altura: "altura", dose: "dose", iDose: "dose", tomadas: "tomadas por dia", vazao: "vazão", qtd: "quantidade na solução", volume: "volume final", apQtd: "quantidade da apresentação", apVolume: "volume da apresentação", max: "dose máxima" };

  function grande(rotulo, valor, sub, classe) {
    return h("div", { classe: "grande " + (classe || "") }, h("div", { classe: "grande-r", texto: rotulo }), h("div", { classe: "grande-v", texto: valor }), sub ? h("div", { classe: "grande-s", texto: sub }) : null);
  }

  function resultado(ent) {
    var r = ent.r;
    var caixa = h("section", { classe: "resultado", "aria-live": "polite", id: "resultado" });
    if (r.erros) {
      var faltam = [];
      var invalidos = 0;
      Object.keys(r.erros).forEach(function (k) {
        var vazio = !String(E.calc[k] || "").trim();
        if (vazio) faltam.push(NOMES_CAMPO[k] || k);
        else invalidos++;
      });
      caixa.appendChild(
        h(
          "div",
          { classe: "resultado-vazio" },
          h("p", {
            texto: invalidos
              ? "Corrija o campo marcado para calcular."
              : "Para calcular, falta: " + faltam.join(", ") + "."
          })
        )
      );
      return caixa;
    }
    var u = r.unidade;
    r.alertas.forEach(function (a) {
      caixa.appendChild(h("div", { classe: "alerta alerta-" + a.nivel, role: a.nivel === "grave" ? "alert" : null }, icone("alerta", 18), h("p", { texto: a.texto })));
    });
    var nums = h("div", { classe: "grandes" });
    if (ent.tipo === "peso") {
      var acima = r.limitada ? "acima do máximo informado" : null;
      var cada = r.intervalo ? "a cada " + C.com(r.intervalo, "h") : null;
      nums.appendChild(grande("Por dose", C.com(r.porTomada, u), [cada, acima].filter(Boolean).join(" · ") || null, r.limitada ? "passou" : ""));
      if (r.volume != null) nums.appendChild(grande("Volume por dose", C.com(r.volume, "mL"), acima, r.limitada ? "passou" : ""));
      if (r.porDia != null) nums.appendChild(grande("Por dia", C.com(r.porDia, u), acima, r.limitada ? "passou" : ""));
      if (r.superficie != null) nums.appendChild(grande("Superfície corporal", C.com(r.superficie, "m²")));
    } else {
      if (E.calc.sentido === "dose") nums.appendChild(grande("Vazão", C.com(r.vazao, "mL/h")));
      else nums.appendChild(grande("Dose", C.com(r.dose, r.rotulo)));
      nums.appendChild(grande("Concentração", C.com(r.concentracao, u + "/mL")));
      nums.appendChild(grande("Por hora", C.com(r.porHora, u + "/h")));
    }
    caixa.appendChild(nums);
    if (ent.tipo === "peso" && r.limitada) {
      caixa.appendChild(
        h(
          "div",
          { classe: "limitada" },
          h("div", { classe: "grande-r", texto: "Se limitar à dose máxima informada" }),
          h("div", { classe: "limitada-v", texto: C.com(r.limitada.porTomada, u) + " por dose" + (r.volumeLimitado != null ? " = " + C.com(r.volumeLimitado, "mL") : "") + (r.limitada.porDia != null ? " · " + C.com(r.limitada.porDia, u) + " por dia" : "") })
        )
      );
    }
    caixa.appendChild(h("h3", { classe: "form-t", texto: "Conta, passo a passo" }));
    caixa.appendChild(h("ol", { classe: "passos" }, r.passos.map(function (p) { return h("li", { texto: p }); })));
    caixa.appendChild(h("p", { classe: "dica", texto: "“≈” marca valor arredondado só para exibir; a conta usa o número inteiro. Confira com a bula, a apresentação disponível e o paciente." }));
    return caixa;
  }

  function recalcular() {
    var ent = entradaCalculo();
    ent.campos.forEach(function (k) {
      var el = document.getElementById("e-" + k);
      var input = document.getElementById("c-" + k);
      var msg = ent.r.erros && ent.r.erros[k] && String(E.calc[k] || "").trim() ? ent.r.erros[k] : "";
      if (el) el.textContent = msg;
      if (input) input.setAttribute("aria-invalid", msg ? "true" : "false");
    });
    var velho = document.getElementById("resultado");
    if (velho) velho.parentNode.replaceChild(resultado(ent), velho);
  }

  function telaCalc() {
    var c = E.calc;
    var deBula = E.calcDe;
    var corpo = h(
      "main",
      { classe: "pagina" },
      h("h1", { classe: "titulo-pag", texto: "Calculadora de dose" }),
      h("p", { classe: "sub", texto: "Só faz a conta com os números que você digita, mostrando cada passo e as unidades. Não traz dose de nenhum medicamento e não guarda nada do que for digitado." }),
      h(
        "div",
        { classe: "campo" },
        h("label", { for: "c-nome", texto: "Medicamento (só para identificar a conta)" }),
        h("input", { id: "c-nome", type: "text", classe: "texto", autocomplete: "off", valor: c.nome, oninput: function (ev) { c.nome = ev.target.value; } })
      ),
      deBula
        ? h(
            "details",
            { classe: "secao consulta" },
            h("summary", null, h("span", { classe: "cresce" }, h("span", { classe: "secao-t", texto: "Posologia na bula" }), h("span", { classe: "secao-o", texto: nomeBonito(B.titulo(deBula).principal) + " · versão " + deBula.version })), icone("baixo", 18)),
            (function () {
              var s = B.secoesDe(deBula).filter(function (x) { return x.def.campo === "dosage_and_administration" || x.def.campo === "directions"; })[0];
              return s ? corpoSecao(s, "") : h("div", { classe: "secao-corpo" }, h("p", { texto: "Esta bula não tem seção de posologia." }));
            })()
          )
        : null,
      segmento("modo", [["peso", "Dose por peso ou superfície"], ["infusao", "Infusão contínua"]]),
      c.modo === "peso" ? formPeso() : formInfusao(),
      h("section", { id: "resultado" }),
      h(
        "div",
        { classe: "acoes" },
        botao("Limpar", function () {
          ["peso", "altura", "dose", "tomadas", "max", "apQtd", "apVolume", "iDose", "vazao", "qtd", "volume"].forEach(function (k) { c[k] = ""; });
          render();
        }, { classe: "bt-ter", icone: "fechar" })
      )
    );
    return corpo;
  }

  /* ── sobre e ajustes ────────────────────────────────────────────── */

  function telaSobre() {
    var versao = "";
    try { versao = A ? A.versao() : ""; } catch (e) { versao = ""; }
    function escolha(campo, lista) {
      return h(
        "div",
        { classe: "segmento", role: "radiogroup" },
        lista.map(function (o) {
          var ativo = ajustes[campo] === o[0];
          return h("button", {
            type: "button", role: "radio", "aria-checked": ativo ? "true" : "false", classe: ativo ? "ativo" : null, texto: o[1],
            onclick: function () {
              ajustes[campo] = o[0];
              Armazem.guardar("ajustes", JSON.stringify(ajustes));
              aplicarTema();
              render();
            }
          });
        })
      );
    }
    return h(
      "main",
      { classe: "pagina texto-longo" },
      h("h1", { classe: "titulo-pag", texto: "Sobre o app" }),
      h(
        "section",
        { classe: "cartao" },
        h("h2", { texto: "Aparência" }),
        h("p", { classe: "rotulo-c", texto: "Tema" }),
        escolha("tema", [["sistema", "Do sistema"], ["claro", "Claro"], ["escuro", "Escuro"]]),
        h("p", { classe: "rotulo-c", texto: "Tamanho do texto" }),
        escolha("tam", [["p", "Menor"], ["m", "Normal"], ["g", "Maior"]])
      ),
      h(
        "section",
        { classe: "cartao" },
        h("h2", { texto: "As fontes" }),
        h("h3", { texto: "Bula: FDA, pela openFDA" }),
        h("p", { texto: "A bula aprovada pela FDA, no formato oficial SPL que os fabricantes enviam à agência. É o mesmo documento publicado no DailyMed, da Biblioteca Nacional de Medicina dos EUA. O app lista primeiro as bulas de referência (NDA e BLA) e esconde as das reembaladoras, que repetem o texto do fabricante." }),
        h("h3", { texto: "Nome: RxNorm" }),
        h("p", { texto: "Vocabulário padrão de medicamentos da Biblioteca Nacional de Medicina dos EUA. Entende boa parte dos nomes em português (pelo DrugBank) e erros de digitação. Para os poucos nomes brasileiros que ele não entende (dipirona, noradrenalina, paracetamol, varfarina…), o app tem uma pequena tabela de equivalência que é sempre confirmada no RxNorm e mostrada na tela." }),
        h("h3", { texto: "Doença: tabela de nomes" }),
        h("p", { texto: "As bulas americanas chamam as doenças pelo nome em inglês, às vezes por categoria (otite está em “infections of the ear, nose, and throat”). O app tem uma tabela que traduz o nome em português para esses termos. Ela não tem dose nenhuma, e a tela sempre mostra por qual termo achou o trecho; o que vem de categoria ampla aparece marcado." }),
        h("h3", { texto: "Brasil: ANVISA" }),
        h("p", { texto: "A ANVISA não oferece um serviço aberto para outros programas consultarem o Bulário Eletrônico. Por isso o app abre o bulário no navegador, já com a busca feita, em vez de copiar o texto de lá." })
      ),
      h(
        "section",
        { classe: "cartao" },
        h("h2", { texto: "O que o app não faz" }),
        h(
          "ul",
          { classe: "marcadores" },
          h("li", { texto: "Não traduz, não resume e não reescreve a bula." }),
          h("li", { texto: "Não cria dose. A dose para a doença é o trecho da bula, sem tradução; a conferência só compara os números desse trecho com a prescrição e mostra como leu cada um." }),
          h("li", { texto: "A conferência não sabe a gravidade, o resto do caso nem a apresentação disponível no Brasil. “Coincide” quer dizer que o número bate com um trecho da bula, não que a prescrição está certa para o paciente." }),
          h("li", { texto: "Não usa inteligência artificial." }),
          h("li", { texto: "Não substitui bases clínicas pagas (Micromedex, Lexicomp, UpToDate), que trazem ajuste renal, pediatria e interações revisados por farmacêuticos." }),
          h("li", { texto: "Não tem a bula brasileira: as doses e apresentações aprovadas aqui podem ser diferentes das americanas." })
        )
      ),
      h(
        "section",
        { classe: "cartao" },
        h("h2", { texto: "Segurança e privacidade" }),
        h(
          "ul",
          { classe: "marcadores" },
          h("li", { texto: "Só conversa com dois servidores, ambos oficiais: api.fda.gov e rxnav.nlm.nih.gov, sempre por HTTPS. Qualquer outro endereço é bloqueado pela própria página e, no Android, também pelo app." }),
          h("li", { texto: "O que sai do aparelho: o nome do medicamento digitado e o identificador da bula. Nenhum dado de paciente, nenhum cadastro, nenhuma estatística de uso." }),
          h("li", { texto: "A calculadora roda inteira no aparelho e não guarda o que é digitado." }),
          h("li", { texto: "O texto das fontes nunca é inserido como código na página. As tabelas da bula são reconstruídas só com elementos de tabela e texto." }),
          h("li", { texto: "Cada bula salva leva um resumo SHA-256. Se a cópia for corrompida ou modificada fora do app, ela não é mostrada." }),
          h("li", { texto: "Bulas salvas são conferidas com a FDA ao abrir: o app avisa quando há versão nova ou quando a bula saiu da base." })
        )
      ),
      h("p", { classe: "versao", texto: "Posologia" + (versao ? " " + versao : "") + " · dados da FDA (openFDA) e da NLM (RxNorm), de domínio público." })
    );
  }

  /* ── montagem ───────────────────────────────────────────────────── */

  var TELAS = { inicio: telaInicio, ingredientes: telaIngredientes, grupos: telaGrupos, rotulos: telaRotulos, bula: telaBula, salvas: telaSalvas, calc: telaCalc, sobre: telaSobre };

  function render() {
    if (E.tela === "bula" && !E.rotulo) E.tela = "inicio";
    if (E.tela !== "salvas") E.removendo = null;
    var foco = document.activeElement && document.activeElement.id;
    raiz.textContent = "";
    raiz.appendChild(topo());
    raiz.appendChild((TELAS[E.tela] || telaInicio)());
    raiz.setAttribute("data-tela", E.tela);
    if (E.tela === "calc") recalcular();
    if (foco && /^c-/.test(foco)) {
      var el = document.getElementById(foco);
      if (el) el.focus();
    }
    if (E.tela === "bula" && E.consulta) atualizarAchados(false);
    if (E.tela === "bula") atualizarConferencia();
  }

  function aplicarTema() {
    var escuro = ajustes.tema === "escuro";
    if (ajustes.tema === "sistema") {
      try {
        escuro = A ? !!A.escuro() : window.matchMedia("(prefers-color-scheme: dark)").matches;
      } catch (e) {
        escuro = false;
      }
    }
    document.documentElement.setAttribute("data-theme", escuro ? "dark" : "light");
    document.documentElement.setAttribute("data-tam", ajustes.tam || "m");
    if (A) {
      var cor = getComputedStyle(document.documentElement).getPropertyValue("--paper").trim() || (escuro ? "#101413" : "#f4f5f2");
      try { A.barras(cor, !escuro); } catch (e) { /* versão antiga da ponte */ }
    }
  }

  window.__voltar = voltar;
  window.__tema = aplicarTema;
  try {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () { if (ajustes.tema === "sistema") aplicarTema(); });
  } catch (e) { /* navegador antigo */ }
  document.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape") {
      var ativo = document.activeElement;
      if (ativo && /INPUT|SELECT/.test(ativo.tagName)) ativo.blur();
      else voltar();
    }
    if (ev.key === "/" && E.tela === "inicio" && !(document.activeElement && /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName))) {
      ev.preventDefault();
      var b = document.getElementById("busca");
      if (b) b.focus();
    }
  });

  aplicarTema();
  render();
})();
