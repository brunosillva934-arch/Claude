/* Service worker do Exame físico: guarda o app inteiro na primeira visita e passa a abrir
   sem internet. A lista de arquivos e a versão são preenchidas por montar-pwa.py; quando
   qualquer arquivo muda, a versão muda, o navegador baixa a nova e a página oferece atualizar. */
"use strict";
const VERSAO = "/*VERSAO*/";
const ARQUIVOS = /*ARQUIVOS*/[];
const CAIXA = "exame-fisico-" + VERSAO;

self.addEventListener("install", ev => {
  ev.waitUntil(caches.open(CAIXA).then(c => c.addAll(ARQUIVOS.map(a => new Request(a, { cache: "reload" })))));
});

self.addEventListener("activate", ev => {
  ev.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith("exame-fisico-") && k !== CAIXA) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener("message", ev => {
  if (ev.data && ev.data.tipo === "pular") self.skipWaiting();
});

self.addEventListener("fetch", ev => {
  const req = ev.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; /* links externos (busca de imagens) seguem direto */
  if (req.mode === "navigate") {
    /* qualquer endereço do site abre o app guardado */
    ev.respondWith(caches.match("./", { ignoreSearch: true }).then(r => r || fetch(req)));
    return;
  }
  ev.respondWith(caches.match(req, { ignoreSearch: true }).then(r => r || fetch(req).then(resp => {
    if (resp.ok && resp.type === "basic") {
      const copia = resp.clone();
      caches.open(CAIXA).then(c => c.put(req, copia));
    }
    return resp;
  })));
});
