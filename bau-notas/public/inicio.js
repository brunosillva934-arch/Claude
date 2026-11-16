/*
 * Roda antes do app, como script clássico, para funcionar até em WebView antigo.
 * 1. Aplica o tema (claro/escuro) antes da primeira pintura, evitando clarão.
 * 2. Avisa se o Android System WebView for antigo demais para o app.
 * 3. Mostra na tela qualquer erro que impeça o app de abrir.
 */
(function () {
  var html = document.documentElement;
  var escuro = false;
  try {
    if (window.BauNativo && window.BauNativo.chamarSinc) {
      var info = JSON.parse(window.BauNativo.chamarSinc('sistema.info', '{}'));
      escuro = !!(info && info.valor && info.valor.noturno);
    } else if (window.matchMedia) {
      escuro = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
  } catch (e) {}
  html.setAttribute('data-tema', escuro ? 'escuro' : 'claro');

  var MINIMO = 100;
  var m = /Chrome\/(\d+)/.exec(navigator.userAgent || '');
  var versao = m ? parseInt(m[1], 10) : 0;
  window.__bauWebViewAntigo = versao > 0 && versao < MINIMO;

  function mostrar(titulo, detalhe) {
    var raiz = document.getElementById('raiz');
    if (!raiz) return;
    var caixa = document.getElementById('falha-inicial');
    if (!caixa) {
      caixa = document.createElement('div');
      caixa.id = 'falha-inicial';
      caixa.style.cssText =
        'position:fixed;left:0;top:0;right:0;bottom:0;z-index:99999;overflow:auto;padding:32px;' +
        'font:16px/1.5 sans-serif;background:#fff;color:#1b2330;';
      raiz.appendChild(caixa);
    }
    var h = document.createElement('h2');
    h.textContent = titulo;
    h.style.cssText = 'margin:0 0 12px;font-size:22px;';
    var p = document.createElement('pre');
    p.textContent = detalhe;
    p.style.cssText = 'white-space:pre-wrap;word-break:break-word;font:14px/1.5 monospace;margin:0 0 24px;';
    caixa.appendChild(h);
    caixa.appendChild(p);
  }
  window.__bauFalha = mostrar;

  document.addEventListener('DOMContentLoaded', function () {
    if (window.__bauWebViewAntigo) {
      mostrar(
        'Atualize o Android System WebView',
        'O Baú precisa do componente "Android System WebView" (ou Chrome) na versão ' + MINIMO +
          ' ou mais nova. Este tablet está com a versão ' + versao + '.\n\n' +
          'Atualize-o pela loja de aplicativos e abra o Baú de novo. Suas notas não são afetadas.'
      );
    }
  });

  var pronto = false;
  window.__bauPronto = function () { pronto = true; };
  window.addEventListener('error', function (ev) {
    if (pronto) return;
    var e = ev && ev.error;
    mostrar('O Baú não conseguiu abrir', (ev && ev.message ? ev.message : 'Erro desconhecido') +
      (e && e.stack ? '\n\n' + e.stack : '') + '\n\nWebView ' + versao);
  });
  window.addEventListener('unhandledrejection', function (ev) {
    if (pronto) return;
    var r = ev && ev.reason;
    mostrar('O Baú não conseguiu abrir', String(r && r.message ? r.message : r) +
      (r && r.stack ? '\n\n' + r.stack : '') + '\n\nWebView ' + versao);
  });
})();
