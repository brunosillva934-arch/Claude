/* Service worker do Exame físico: guarda o app inteiro na primeira visita e passa a abrir
   sem internet. A lista de arquivos e a versão são preenchidas por montar-pwa.py; quando
   qualquer arquivo muda, a versão muda, o navegador baixa a nova e a página oferece atualizar. */
"use strict";
const VERSAO = "1.2.1-c5d55ded74";
const ARQUIVOS = ["./", "manifest.webmanifest", "fotos/abd-cullen.svg", "fotos/abd-mcburney.svg", "fotos/abd-medusa.svg", "fotos/altura-uterina.svg", "fotos/babinski.svg", "fotos/campo-hemianopsia.svg", "fotos/dedos-ar.svg", "fotos/edema-cacifo.svg", "fotos/face-central.svg", "fotos/face-periferica.svg", "fotos/feto-cefalico.svg", "fotos/feto-pelvico.svg", "fotos/feto-transverso.svg", "fotos/focos-ausculta.svg", "fotos/fono-b3.svg", "fotos/fono-b4.svg", "fotos/fono-civ.svg", "fotos/fono-cmh.svg", "fotos/fono-ea.svg", "fotos/fono-em.svg", "fotos/fono-iao.svg", "fotos/fono-im.svg", "fotos/fono-normal.svg", "fotos/fono-pca.svg", "fotos/fono-prolapso.svg", "fotos/fono-pulmonar.svg", "fotos/fontanelas.svg", "fotos/ictus-desviado.svg", "fotos/ictus-normal.svg", "fotos/jugular-canhao.svg", "fotos/jugular-v.svg", "fotos/kramer.svg", "fotos/lasegue.svg", "fotos/mao-desvio-ulnar.svg", "fotos/mao-heberden.svg", "fotos/olhos-anisocoria.svg", "fotos/olhos-iii.svg", "fotos/olhos-midriase.svg", "fotos/olhos-miose.svg", "fotos/olhos-normais.svg", "fotos/olhos-ptose.svg", "fotos/olhos-vi.svg", "fotos/postura-decorticacao.svg", "fotos/postura-descerebracao.svg", "fotos/postura-opistotono.svg", "fotos/pulso-alternante.svg", "fotos/pulso-bisferiens.svg", "fotos/pulso-martelo.svg", "fotos/pulso-normal.svg", "fotos/pulso-paradoxal.svg", "fotos/pulso-parvus.svg", "fotos/resp-biot.svg", "fotos/resp-bradipneia.svg", "fotos/resp-cheyne.svg", "fotos/resp-eupneia.svg", "fotos/resp-kussmaul.svg", "fotos/resp-taquipneia.svg", "fotos/sens-bota-luva.svg", "fotos/sens-brown.svg", "fotos/sens-capa.svg", "fotos/sens-hemi.svg", "fotos/sens-nivel.svg", "fotos/torax-carinatum.svg", "fotos/torax-excavatum.svg", "fotos/torax-normal.svg", "fotos/torax-tonel.svg", "fotos/trendelenburg.svg", "fotos/unha-baqueteamento.svg", "fotos/unha-beau.svg", "fotos/unha-coiloniquia.svg", "fotos/unha-estilhaco.svg", "fotos/unha-psoriase.svg", "fotos/unha-schamroth.svg", "fotos/unha-terry.svg", "icones/apple-touch-icon.png", "icones/favicon-32.png", "icones/icone-192.png", "icones/icone-512.png", "icones/icone-mascara-512.png", "icones/icone.svg"];
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
