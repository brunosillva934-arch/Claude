/* Teste de ponta a ponta no Chromium, contra os servidores reais da FDA e do RxNorm.
   uso: node testes/navegador.js [pasta-das-capturas]
   Precisa de internet com acesso a api.fda.gov e rxnav.nlm.nih.gov, e do Playwright.
   Se a rede passa por proxy, ele é lido de HTTPS_PROXY. */
"use strict";
const { chromium } = require("playwright");
const path = require("path");
const assert = require("assert/strict");

const HTML = "file://" + path.resolve(__dirname, "..", "Posologia.html");
const CAPTURAS = process.argv[2] || null;
const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;

let passou = 0;
async function passo(nome, fn) {
  const t = Date.now();
  await fn();
  passou++;
  console.log("ok  " + nome + " (" + ((Date.now() - t) / 1000).toFixed(1) + " s)");
}

(async () => {
  const navegador = await chromium.launch(proxy ? { proxy: { server: proxy } } : {});
  const ctx = await navegador.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  const erros = [];
  const violacoes = [];
  p.on("pageerror", (e) => erros.push(e.message));
  p.on("console", (m) => {
    if (m.type() === "error") {
      if (/Content Security Policy|Content-Security-Policy/.test(m.text())) violacoes.push(m.text());
      // a openFDA responde 404 quando não há bula (ex.: dipirona); o app trata como "nenhuma"
      else if (!/status of 404/.test(m.text())) erros.push(m.text());
    }
  });
  const foto = async (nome) => { if (CAPTURAS) await p.screenshot({ path: path.join(CAPTURAS, nome + ".png"), fullPage: false }); };
  const esperaCarga = () => p.waitForSelector(".carga", { state: "detached", timeout: 60000 });

  await passo("abre sem erro e sem violar a CSP", async () => {
    await p.goto(HTML);
    await p.waitForSelector("#busca");
    assert.equal(await p.locator(".abertura h1").textContent(), "Posologia direto da bula oficial");
    await foto("01-inicio");
  });

  await passo("amoxicilina: nome brasileiro → princípio ativo → formulação → bulas", async () => {
    await p.fill("#busca", "amoxicilina");
    await p.press("#busca", "Enter");
    await esperaCarga();
    // com um só princípio ativo confiável, o app pula direto para as formulações;
    // com mais de um, a escolha é de quem busca
    if (await p.locator(".titulo-sec", { hasText: /princípio ativo|Qual destes/ }).count()) {
      const opcoes = await p.locator(".item-t").allTextContents();
      assert.ok(opcoes.includes("amoxicillin"), "opções: " + opcoes.join(" | "));
      await foto("02-ingredientes");
      await p.locator(".item", { hasText: /^amoxicillin/ }).first().click();
      await esperaCarga();
    }
    assert.match(await p.locator(".trilha").textContent(), /“amoxicilina”.*→.*amoxicillin/);
    const grupos = await p.locator(".item-t").allTextContents();
    assert.ok(grupos.includes("Amoxicillin"), "grupos: " + grupos.join(" | "));
    assert.ok(grupos.some((g) => /Clavulanate/.test(g)), "a associação aparece separada");
    await p.locator(".item", { hasText: /^Amoxicillin\d/ }).first().click();
    await esperaCarga();
    const n = await p.locator(".lista .item").count();
    assert.ok(n >= 3, "bulas listadas: " + n);
    const trilha = await p.locator(".trilha").textContent();
    assert.match(trilha, /“amoxicilina”.*amoxicillin.*Amoxicillin/);
    await foto("03-bulas");
  });

  let setId;
  await passo("abre a bula: posologia aberta, doses destacadas, fonte e versão", async () => {
    await p.locator(".lista .item").first().click();
    await p.waitForSelector("#secoes");
    const titulos = await p.locator(".secao-t").allTextContents();
    assert.ok(titulos.includes("Posologia e administração"), titulos.join(" | "));
    assert.ok(await p.locator('details[data-campo="dosage_and_administration"]').evaluate((d) => d.open));
    assert.ok((await p.locator('details[data-campo="dosage_and_administration"] .dose').count()) > 3, "doses destacadas");
    const meta = await p.locator(".meta").textContent();
    assert.match(meta, /Versão\s*\d+, vigente desde \d\d\/\d\d\/\d{4}/);
    setId = (await p.locator(".meta dd.mono").textContent()).trim();
    assert.match(setId, /^[0-9a-f-]{36}$/);
    // o texto da tela é o mesmo da FDA, letra por letra
    const daTela = await p.locator('details[data-campo="dosage_and_administration"] .secao-corpo > p').allTextContents();
    const r = await (await ctx.request.get("https://api.fda.gov/drug/label.json?search=set_id:%22" + setId + "%22&limit=1")).json();
    const original = [].concat(r.results[0].dosage_and_administration).join("\n\n");
    assert.equal(daTela.join(" ").replace(/\s+/g, " ").trim(), original.replace(/\s+/g, " ").trim());
    await foto("04-bula");
  });

  await passo("procura dentro da bula", async () => {
    await p.fill(".procura-campo", "renal");
    await p.waitForFunction(() => /de \d+/.test(document.getElementById("achados").textContent));
    const cont = await p.locator("#achados").textContent();
    assert.match(cont, /^1 de \d+$/);
    assert.ok(await p.locator("mark.achado.atual").isVisible());
    await foto("05-procura");
    await p.fill(".procura-campo", "");
  });

  await passo("tabelas da bula chegam limpas", async () => {
    const perigosos = await p.evaluate(() => document.querySelectorAll("#secoes script, #secoes img, #secoes iframe, #secoes [style], #secoes [onerror], #secoes [onclick], #secoes a").length);
    assert.equal(perigosos, 0);
  });

  await passo("o limpador de tabelas descarta script, imagem, evento e estilo", async () => {
    const r = await p.evaluate(() => {
      window.__pwned = 0;
      const sujo = '<table><tr><td colspan="2" onclick="window.__pwned=1" style="color:red">A<script>window.__pwned=2<\/script><img src=x onerror="window.__pwned=3"></td><td rowspan="999">B</td></tr></table><iframe src="https://example.com"></iframe><svg onload="window.__pwned=4"></svg><content styleCode="bold">negrito</content><a href="javascript:alert(1)">link</a>';
      const caixa = document.createElement("div");
      caixa.appendChild(window.Bulas.tabelaSegura(sujo));
      document.body.appendChild(caixa);
      const html = caixa.innerHTML;
      caixa.remove();
      return { html, pwned: window.__pwned };
    });
    assert.equal(r.pwned, 0);
    assert.equal(r.html, '<table><tbody><tr><td colspan="2">A</td><td>B</td></tr></tbody></table><strong>negrito</strong>link');
  });

  await passo("salva, abre pela lista de salvas, confere integridade e versão", async () => {
    await p.locator(".acoes .bt", { hasText: "Salvar" }).click();
    await p.waitForSelector(".bt-marcado");
    await p.locator(".aba", { hasText: "Salvas" }).click();
    await p.locator(".salva-li .item").first().click();
    await p.waitForSelector(".meta-l");
    assert.match(await p.locator(".meta-l").textContent(), /Integridade conferida.*SHA-256 [0-9a-f]{16}/);
    await p.waitForSelector(".nota-ok", { timeout: 30000 });
    assert.match(await p.locator(".nota-ok").textContent(), /versão vigente/);
    await foto("06-salva");
  });

  await passo("cópia salva adulterada não é mostrada", async () => {
    await p.locator(".aba", { hasText: "Salvas" }).click();
    await p.evaluate((id) => {
      const k = "posologia:bula_" + id;
      const reg = JSON.parse(localStorage.getItem(k));
      reg.rotulo.secoes.dosage_and_administration = reg.rotulo.secoes.dosage_and_administration.replace(/\d+ mg/, "9999 mg");
      localStorage.setItem(k, JSON.stringify(reg));
    }, setId);
    await p.locator(".salva-li .item").first().click();
    await p.waitForFunction(() => /não confere/.test(document.getElementById("aviso").textContent));
    assert.equal(await p.locator("#secoes").count(), 0, "a bula adulterada não pode abrir");
    // remove (dois toques)
    await p.locator(".remover").first().click();
    await p.locator(".remover.confirmar").first().click();
    await p.waitForSelector(".vazio");
  });

  await passo("dipirona: sem bula na FDA, leva ao bulário da ANVISA", async () => {
    await p.locator(".aba", { hasText: "Buscar" }).click();
    await p.fill("#busca", "Dipirona sódica");
    await p.press("#busca", "Enter");
    await esperaCarga();
    await p.waitForSelector(".cartao h2");
    const t = await p.locator(".pagina").textContent();
    assert.match(t, /A FDA não tem bula de dipyrone/);
    const href = await p.locator('a.bt', { hasText: "Bulário da ANVISA" }).getAttribute("href");
    assert.equal(href, "https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=Dipirona%20s%C3%B3dica");
    await foto("07-dipirona");
  });

  await passo("nome desconhecido não inventa nada", async () => {
    await p.locator(".aba", { hasText: "Buscar" }).click();
    await p.fill("#busca", "xqzwvk");
    await p.press("#busca", "Enter");
    await esperaCarga();
    assert.match(await p.locator(".pagina").textContent(), /Não reconheci “xqzwvk”/);
  });

  await passo("varfarina e paracetamol chegam ao princípio ativo certo", async () => {
    for (const [pt, en] of [["varfarina", "warfarin"], ["paracetamol", "acetaminophen"], ["noradrenalina", "norepinephrine"]]) {
      await p.locator(".aba", { hasText: "Buscar" }).click();
      await p.fill("#busca", pt);
      await p.press("#busca", "Enter");
      await esperaCarga();
      const trilha = await p.locator(".trilha").textContent().catch(() => "");
      const opcoes = await p.locator(".item-t").allTextContents();
      assert.ok(trilha.includes(en) || opcoes.includes(en), pt + " → " + trilha + " / " + opcoes.join(" | "));
    }
  });

  await passo("amoxicilina + otite: abre a bula, mostra a dose da doença e confere a prescrição", async () => {
    await p.locator(".aba", { hasText: "Buscar" }).click();
    await p.fill("#busca", "amoxicilina");
    await p.fill("#busca-doenca", "otite");
    await p.press("#busca-doenca", "Enter");
    await esperaCarga();
    if ((await p.getAttribute("#app", "data-tela")) === "grupos") {
      await p.locator(".item", { hasText: /^Amoxicillin\d/ }).first().click();
    }
    await p.waitForSelector("#dose-card", { timeout: 60000 });
    assert.match(await p.locator(".procurado").textContent(), /Otite média, procurada na bula como: otitis media, otitis, ear/);
    assert.ok((await p.locator(".trecho").count()) >= 1, "trecho da dose");
    assert.match(await p.locator(".trechos").textContent(), /mg/);
    await foto("12-dose-otite");
    await p.fill("#p-dose", "875");
    await p.selectOption("#p-intervalo", "12");
    await p.waitForSelector("#conf-res .alerta");
    const resumo = await p.locator("#conf-res .alerta").first().textContent();
    assert.match(resumo, /^Coincide com a bula: 875/);
    await p.locator("#conferir .segmento button", { hasText: "Criança" }).click();
    await p.fill("#p-peso", "20");
    await p.fill("#p-dose", "400");
    await p.waitForFunction(() => /intervalo não/.test(document.querySelector("#conf-res .alerta").textContent));
    await p.locator("#conferir").scrollIntoViewIfNeeded();
    await foto("13-conferencia");
    await p.fill("#p-dose", "");
    await p.locator("#conferir .segmento button", { hasText: "Adulto" }).click();
  });

  await passo("calculadora: mg/kg/dia com máximo e apresentação", async () => {
    await p.locator(".aba", { hasText: "Calcular" }).click();
    await p.fill("#c-peso", "25");
    await p.fill("#c-dose", "90");
    await p.selectOption('select[data-campo="periodo"]', "dia");
    await p.fill("#c-tomadas", "2");
    await p.fill("#c-max", "2000");
    await p.selectOption('select[data-campo="maxPeriodo"]', "dia");
    await p.fill("#c-apQtd", "400");
    await p.fill("#c-apVolume", "5");
    await p.waitForSelector(".alerta-grave");
    const v = await p.locator(".grande-v").allTextContents();
    // 1125 ÷ 80 = 14,0625: arredondado só para exibir, por isso o ≈
    assert.deepEqual(v.map((x) => x.replace(/\s/g, " ")), ["1125 mg", "≈ 14,06 mL", "2250 mg"]);
    assert.match((await p.locator(".limitada-v").textContent()).replace(/\s/g, " "), /1000 mg por dose = 12,5 mL · 2000 mg por dia/);
    await foto("08-calculadora");
  });

  await passo("calculadora: número ambíguo é recusado no campo", async () => {
    await p.fill("#c-peso", "2.500");
    await p.waitForFunction(() => /ambíguo/.test(document.getElementById("e-peso").textContent));
    assert.equal(await p.locator("#c-peso").getAttribute("aria-invalid"), "true");
    await p.fill("#c-peso", "25");
  });

  await passo("calculadora: infusão contínua", async () => {
    await p.locator(".segmento button", { hasText: "Infusão contínua" }).click();
    await p.fill("#c-peso", "70");
    await p.fill("#c-iDose", "0,1");
    await p.fill("#c-qtd", "4");
    await p.fill("#c-volume", "250");
    await p.waitForFunction(() => document.querySelectorAll(".grande-v").length === 3);
    const v = await p.locator(".grande-v").allTextContents();
    assert.equal(v[0].replace(/\s/g, " "), "26,25 mL/h");
    await foto("09-infusao");
  });

  await passo("a página não fala com nenhum outro servidor (CSP)", async () => {
    const r = await p.evaluate(async () => {
      try {
        await fetch("https://example.com/");
        return "passou";
      } catch (e) {
        return "bloqueado";
      }
    });
    assert.equal(r, "bloqueado");
    const injetado = await p.evaluate(() => {
      window.__injetado = 0;
      const s = document.createElement("script");
      s.textContent = "window.__injetado = 1";
      document.body.appendChild(s);
      return window.__injetado;
    });
    assert.equal(injetado, 0, "script injetado não pode rodar");
    violacoes.length = 0; // as duas violações acima foram provocadas de propósito
  });

  await passo("tema escuro e computador", async () => {
    await p.locator(".aba", { hasText: "Sobre" }).click();
    await p.locator(".segmento button", { hasText: "Escuro" }).click();
    assert.equal(await p.evaluate(() => document.documentElement.dataset.theme), "dark");
    await foto("10-sobre-escuro");
    await p.setViewportSize({ width: 1280, height: 860 });
    await p.locator(".aba", { hasText: "Buscar" }).click();
    await foto("11-computador-escuro");
    const largura = await p.evaluate(() => document.documentElement.scrollWidth);
    assert.ok(largura <= 1280, "sem rolagem lateral");
  });

  assert.deepEqual(erros, [], "erros na página");
  assert.deepEqual(violacoes, [], "violações da CSP");
  console.log("\n" + passou + " passos, nenhum erro na página, nenhuma violação da CSP");
  await navegador.close();
})().catch((e) => {
  console.error("FALHOU:", e.message);
  process.exit(1);
});
