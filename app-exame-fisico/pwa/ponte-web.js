/* Ponte da versão web (PWA): faz no navegador o que o MainActivity.java faz no Android.
   A página (app.js) é a mesma; ela usa window.Ponte no lugar de window.Android.
   - roteiro e exames: localStorage (síncrono, como a página espera)
   - fotos: IndexedDB (cabe muito mais), carregadas para a memória na abertura
   - câmera e galeria: <input type="file">, reduzidas num canvas
   - botão voltar do celular, instalação, aviso de versão nova */
(function () {
  "use strict";
  var VERSAO = "/*VERSAO*/";
  var PREFIXO = "ef_", LADO = 1280, LADO_MINI = 360, UMA_HORA = 3600000;
  var fotos = {};      /* nome -> { cheia: Blob, mini: Blob, quando: ms } */
  var urls = {};       /* nome + "_m" ou nome -> object URL */
  var prontas = [];    /* fotos processadas que a página ainda não buscou */
  var bd = null, carregou = false, pedidoInstalar = null;

  function avisar(msg, rotulo, fn) { if (window.__aviso) window.__aviso(msg, rotulo, fn); }

  /* ── IndexedDB ─────────────────────────────────────────────────── */
  function abrirBd() {
    return new Promise(function (ok, falha) {
      if (!window.indexedDB) { falha(new Error("sem IndexedDB")); return; }
      var r = indexedDB.open("exame-fisico", 1);
      r.onupgradeneeded = function () { r.result.createObjectStore("fotos", { keyPath: "nome" }); };
      r.onsuccess = function () { ok(r.result); };
      r.onerror = function () { falha(r.error); };
    });
  }
  function loja(modo) { return bd.transaction("fotos", modo).objectStore("fotos"); }
  function gravar(reg) {
    fotos[reg.nome] = reg;
    if (!bd) return Promise.resolve(false);
    return new Promise(function (ok) {
      var t = bd.transaction("fotos", "readwrite");
      t.objectStore("fotos").put(reg);
      t.oncomplete = function () { ok(true); };
      t.onerror = t.onabort = function () { ok(false); };
    });
  }
  function soltar(nome) {
    [nome, nome + "_m"].forEach(function (k) { if (urls[k]) { URL.revokeObjectURL(urls[k]); delete urls[k]; } });
  }
  abrirBd().then(function (b) {
    bd = b;
    var r = loja("readonly").getAll();
    r.onsuccess = function () {
      (r.result || []).forEach(function (reg) { fotos[reg.nome] = reg; });
      carregou = true;
      if (window.__fotosCarregadas) window.__fotosCarregadas();
    };
  }, function () {
    carregou = true;
    avisar("Este navegador não guarda fotos (modo anônimo?). O resto funciona.");
  });

  /* ── reduzir uma imagem escolhida ──────────────────────────────── */
  function carregarImagem(arquivo) {
    if (window.createImageBitmap) {
      return createImageBitmap(arquivo, { imageOrientation: "from-image" }).catch(function () { return createImageBitmap(arquivo); }).catch(function () { return porImg(arquivo); });
    }
    return porImg(arquivo);
  }
  function porImg(arquivo) {
    return new Promise(function (ok, falha) {
      var u = URL.createObjectURL(arquivo), img = new Image();
      img.onload = function () { ok(img); setTimeout(function () { URL.revokeObjectURL(u); }, 1000); };
      img.onerror = function () { URL.revokeObjectURL(u); falha(new Error("imagem ilegível")); };
      img.src = u;
    });
  }
  function reduzir(img, lado, q) {
    var w = img.naturalWidth || img.width, h = img.naturalHeight || img.height, k = Math.min(1, lado / Math.max(w, h));
    var c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(w * k));
    c.height = Math.max(1, Math.round(h * k));
    var g = c.getContext("2d");
    g.fillStyle = "#fff";
    g.fillRect(0, 0, c.width, c.height);
    g.drawImage(img, 0, 0, c.width, c.height);
    return new Promise(function (ok, falha) {
      if (c.toBlob) c.toBlob(function (b) { b ? ok(b) : falha(new Error("sem blob")); }, "image/jpeg", q);
      else falha(new Error("sem toBlob"));
    });
  }
  function nomeNovo() { return "u" + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36); }
  function processar(arquivo) {
    return carregarImagem(arquivo).then(function (img) {
      return Promise.all([reduzir(img, LADO, 0.82), reduzir(img, LADO_MINI, 0.78)]);
    }).then(function (b) {
      var reg = { nome: nomeNovo(), cheia: b[0], mini: b[1], quando: Date.now() };
      return gravar(reg).then(function (ok) {
        if (!ok && bd) avisar("Sem espaço para guardar a foto.");
        return reg.nome;
      });
    });
  }
  var entrada = document.createElement("input");
  entrada.type = "file";
  entrada.accept = "image/*";
  entrada.id = "ponte-foto";
  entrada.hidden = true;
  entrada.addEventListener("change", function () {
    var arq = entrada.files && entrada.files[0];
    entrada.value = "";
    if (!arq) return;
    processar(arq).then(function (nome) {
      prontas.push(nome);
      if (window.__fotoPronta) window.__fotoPronta();
    }, function () { avisar("Não consegui usar essa imagem."); });
  });
  document.addEventListener("DOMContentLoaded", function () { document.body.appendChild(entrada); });

  function deBase64(b64) {
    var bin = atob(b64), n = bin.length, u = new Uint8Array(n);
    for (var i = 0; i < n; i++) u[i] = bin.charCodeAt(i);
    return new Blob([u], { type: "image/jpeg" });
  }
  function paraBase64(blob) {
    return new Promise(function (ok) {
      var r = new FileReader();
      r.onload = function () { ok(String(r.result).replace(/^data:[^,]*,/, "")); };
      r.onerror = function () { ok(""); };
      r.readAsDataURL(blob);
    });
  }
  function baixar(nome, texto, tipo) {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([texto], { type: (tipo || "text/plain") + ";charset=utf-8" }));
    a.download = nome;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
  }
  function copiarTexto(texto) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(texto);
    return new Promise(function (ok, falha) {
      var t = document.createElement("textarea");
      t.value = texto;
      t.style.position = "fixed";
      t.style.opacity = "0";
      document.body.appendChild(t);
      t.select();
      try { document.execCommand("copy") ? ok() : falha(); } catch (e) { falha(e); }
      t.remove();
    });
  }

  /* ── a ponte, com os mesmos nomes da do Android ────────────────── */
  window.Ponte = {
    ler: function (chave) { try { return localStorage.getItem(PREFIXO + chave) || ""; } catch (e) { return ""; } },
    guardar: function (chave, valor) {
      try { localStorage.setItem(PREFIXO + chave, valor); return true; } catch (e) { return false; }
    },
    apagar: function (chave) { try { localStorage.removeItem(PREFIXO + chave); } catch (e) { /* nada */ } },
    pendentes: function () { return "[]"; },
    escolher: function () { var s = document.getElementById("seletor"); if (s) s.click(); },

    escolherFoto: function (camera) {
      if (camera) entrada.setAttribute("capture", "environment"); else entrada.removeAttribute("capture");
      entrada.click();
    },
    fotosProntas: function () { var l = prontas.slice(); prontas = []; return JSON.stringify(l); },
    foto: function (nome, mini) {
      var reg = fotos[nome], k = nome + (mini ? "_m" : "");
      if (!reg) return "";
      if (!urls[k]) urls[k] = URL.createObjectURL(mini && reg.mini ? reg.mini : reg.cheia);
      return urls[k];
    },
    apagarFoto: function (nome) {
      soltar(nome);
      delete fotos[nome];
      if (bd) try { loja("readwrite").delete(nome); } catch (e) { /* nada */ }
    },
    /* só fotos com mais de uma hora, para a limpeza não pegar uma que acabou de chegar */
    listarFotos: function () {
      if (!carregou) return "[]";
      var agora = Date.now();
      return JSON.stringify(Object.keys(fotos).filter(function (n) { return agora - (fotos[n].quando || 0) > UMA_HORA; }));
    },
    fotoBase64Async: function (nome) { return fotos[nome] ? paraBase64(fotos[nome].cheia) : Promise.resolve(""); },
    gravarFoto: function (nome, b64) {
      var cheia;
      try { cheia = deBase64(b64); } catch (e) { return false; }
      soltar(nome);
      fotos[nome] = { nome: nome, cheia: cheia, mini: null, quando: Date.now() };
      carregarImagem(cheia).then(function (img) { return reduzir(img, LADO_MINI, 0.78); }, function () { return null; }).then(function (mini) {
        return gravar({ nome: nome, cheia: cheia, mini: mini, quando: Date.now() });
      }).then(function () { if (window.__fotosCarregadas) window.__fotosCarregadas(); });
      return true;
    },

    compartilhar: function (titulo, texto) {
      if (navigator.share) {
        navigator.share({ title: titulo, text: texto }).catch(function (e) {
          if (e && e.name === "AbortError") return;
          copiarTexto(texto).then(function () { avisar("Texto copiado."); });
        });
        return;
      }
      copiarTexto(texto).then(function () { avisar("Este navegador não compartilha; o texto foi copiado."); }, function () { avisar("Não deu para compartilhar."); });
    },
    copiar: function (texto) { copiarTexto(texto).then(function () { avisar("Texto copiado."); }, function () { avisar("Não deu para copiar."); }); },
    salvarComo: function (nome, texto, tipo) { baixar(nome, texto, tipo); avisar("Arquivo salvo em Downloads."); },
    abrir: function (url) { if (/^https:\/\//.test(url)) window.open(url, "_blank", "noopener"); },

    barras: function (cor) {
      var m = document.querySelector('meta[name="theme-color"]:not([media])');
      if (m) m.setAttribute("content", cor);
    },
    escuro: function () { return !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches); },
    versao: function () { return VERSAO; },

    podeInstalar: function () { return !!pedidoInstalar; },
    instalar: function () {
      if (!pedidoInstalar) return;
      pedidoInstalar.prompt();
      pedidoInstalar.userChoice.then(function () { pedidoInstalar = null; });
    },
    dicaInstalar: function () {
      var instalado = (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || navigator.standalone;
      if (instalado || pedidoInstalar) return "";
      if (/iPhone|iPad|iPod/.test(navigator.userAgent)) return "Para instalar no iPhone: no Safari, toque em Compartilhar e depois em “Adicionar à Tela de Início”.";
      return "Para instalar: no menu do navegador, toque em “Instalar app” ou “Adicionar à tela inicial”.";
    }
  };

  window.addEventListener("beforeinstallprompt", function (ev) { ev.preventDefault(); pedidoInstalar = ev; });
  window.addEventListener("appinstalled", function () { pedidoInstalar = null; avisar("App instalado."); });

  /* guarda o exame em andamento quando o app vai para segundo plano */
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden" && window.__pausa) window.__pausa(); });
  window.addEventListener("pagehide", function () { if (window.__pausa) window.__pausa(); });

  /* botão voltar do celular: volta dentro do app; na tela inicial, o próximo voltar sai */
  function armar() { if (!history.state || !history.state.exameFisico) history.pushState({ exameFisico: 1 }, ""); }
  window.addEventListener("load", function () { armar(); });
  document.addEventListener("click", armar, true);
  window.addEventListener("popstate", function () {
    if (window.__voltar && window.__voltar()) armar();
  });

  /* pede ao navegador que não apague os dados por falta de espaço */
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function () { /* sem problema */ });

  /* service worker: funciona sem internet e avisa quando há versão nova */
  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").then(function (reg) {
        function oferecer(sw) {
          avisar("Há uma versão nova do app.", "Atualizar", function () {
            if (window.__pausa) window.__pausa();
            sw.postMessage({ tipo: "pular" });
          });
        }
        if (reg.waiting && navigator.serviceWorker.controller) oferecer(reg.waiting);
        reg.addEventListener("updatefound", function () {
          var novo = reg.installing;
          if (!novo) return;
          novo.addEventListener("statechange", function () {
            if (novo.state === "installed" && navigator.serviceWorker.controller) oferecer(novo);
          });
        });
      }, function () { /* sem service worker o app ainda funciona online */ });
      /* só recarrega quando uma versão substitui outra; na primeira visita não há o que trocar */
      var tinha = !!navigator.serviceWorker.controller, recarregou = false;
      navigator.serviceWorker.addEventListener("controllerchange", function () {
        if (!tinha) { tinha = true; return; }
        if (recarregou) return;
        recarregou = true;
        location.reload();
      });
    });
  }
})();
