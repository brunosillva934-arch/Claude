/* Dose por doença e conferência contra bulas reais da FDA, salvas em testes/bulas/ (só os
   campos que o app usa). Roda no Chromium, sem internet: as tabelas da bula passam pelo mesmo
   limpador e pela mesma leitura que a tela usa.
   uso: node testes/dose-bulas.js        (depois de montar o Posologia.html) */
"use strict";
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const assert = require("assert/strict");

const HTML = "file://" + path.resolve(__dirname, "..", "Posologia.html");
const PASTA = path.join(__dirname, "bulas");

/* [bula, doença digitada, prescrição, resumo esperado, o que o primeiro valor do resumo deve ser]
   Cada esperado foi conferido no texto da bula correspondente. */
const CASOS = [
  // amoxicilina: tabela por infecção, adulto e criança
  ["amoxicillin", "otite", { dose: 875, intervalo: 12 }, "coincide", "875 mg every 12 hours"],
  ["amoxicillin", "otite", { dose: 450, intervalo: 12, peso: 20, paciente: "crianca" }, "coincide", "45 mg/kg/day in divided doses every 12 hours"],
  ["amoxicillin", "otite", { dose: 400, intervalo: 12, peso: 20, paciente: "crianca" }, "intervalo", "40 mg/kg/day in divided doses every 8 hours"],
  ["amoxicillin", "pneumonia", { dose: 500, intervalo: 12 }, "intervalo", "500 mg every 8 hours"],
  ["amoxicillin", "h. pylori", { dose: 1000, intervalo: 12 }, "coincide", "1 gram"],
  // azitromicina: uma linha por doença
  ["azithromycin", "otite média aguda", { dose: 450, intervalo: null, peso: 15, paciente: "crianca" }, "coincide", "30 mg/kg as a single dose"],
  ["azithromycin", "otite média aguda", { dose: 150, intervalo: 24, peso: 15, paciente: "crianca" }, "coincide", "10 mg/kg once daily"],
  ["azithromycin", "gonorreia", { dose: 2000, intervalo: null }, "coincide", "2 gram"],
  ["azithromycin", "gonorreia", { dose: 1000, intervalo: null }, "diferente", null], // 1 g é da uretrite NÃO gonocócica
  ["azithromycin", "sinusite", { dose: 500, intervalo: 24 }, "coincide", "500 mg once daily"],
  // cefalexina: texto corrido, otite só em criança
  ["cephalexin", "otite", { dose: 1000, intervalo: 12, peso: 20, paciente: "crianca" }, "coincide", "75 to 100 mg/kg/day in equally divided doses"],
  ["cephalexin", "otite", { dose: 500, intervalo: 12, peso: 20, paciente: "crianca" }, "diferente", null],
  ["cephalexin", "pele", { dose: 2000, intervalo: 6 }, "passa", "4 grams in two to four equally divided doses"],
  ["cephalexin", "pele", { dose: 500, intervalo: 12 }, "coincide", "500 mg every 12 hours"],
  // enoxaparina: profilaxia e tratamento; a tabela de ajuste renal só vale com rim reduzido
  ["enoxaparin-sodium", "profilaxia de tvp", { dose: 40, intervalo: 24 }, "coincide", "40 mg"], // cirurgia abdominal ou paciente clínico: os dois dizem 40 mg 1x/dia
  ["enoxaparin-sodium", "profilaxia de tvp", { dose: 30, intervalo: 24 }, "intervalo", "30 mg every 12 hours"],
  ["enoxaparin-sodium", "profilaxia de tvp", { dose: 30, intervalo: 24, renal: true }, "coincide", "30 mg administered subcutaneously once daily"],
  ["enoxaparin-sodium", "tvp", { dose: 70, intervalo: 12, peso: 70 }, "coincide", "1 mg/kg every 12 hours"],
  ["enoxaparin-sodium", "tvp", { dose: 105, intervalo: 24, peso: 70 }, "coincide", "1.5 mg/kg once a day"],
  // levofloxacino: intervalo no cabeçalho da coluna
  ["levofloxacin", "pneumonia", { dose: 750, intervalo: 24 }, "coincide", "750 mg"],
  ["levofloxacin", "itu", { dose: 250, intervalo: 24 }, "coincide", "250 mg"],
  // ceftriaxona: meningite, com máximo
  ["ceftriaxone-sodium", "meningite", { dose: 2000, intervalo: 24, peso: 20, paciente: "crianca" }, "coincide", "100 mg/kg"], // dose inicial e dose diária são 100 mg/kg
  ["ceftriaxone-sodium", "meningite", { dose: 5000, intervalo: 24, peso: 50, paciente: "crianca" }, "passa", "4 grams"],
  // vancomicina oral para C. difficile
  ["vancomycin-hydrochloride", "c. difficile", { dose: 125, intervalo: 6 }, "coincide", "125 mg administered orally 4 times daily"],
  // metronidazol, fluconazol, nitrofurantoína, oseltamivir
  ["metronidazole", "tricomoníase", { dose: 375, intervalo: 12 }, "coincide", "375 mg two times daily"],
  ["fluconazole", "candidíase vaginal", { dose: 150, intervalo: null }, "coincide", "150 mg as a single oral dose"],
  ["nitrofurantoin-monohydrate-macrocrystals", "cistite", { dose: 100, intervalo: 12 }, "coincide", "100 mg capsule every 12 hours"],
  ["oseltamivir-phosphate", "gripe", { dose: 75, intervalo: 12 }, "coincide", "75 mg twice daily"],
  ["oseltamivir-phosphate", "gripe", { dose: 45, intervalo: 12, peso: 20, paciente: "crianca" }, "coincide", "45 mg twice daily"]
];

(async () => {
  const navegador = await chromium.launch();
  const p = await (await navegador.newContext()).newPage();
  const erros = [];
  p.on("pageerror", (e) => erros.push(e.message));
  await p.goto(HTML);
  let falhas = 0;
  for (const [arq, doenca, presc, esperado, valor] of CASOS) {
    const bruto = JSON.parse(fs.readFileSync(path.join(PASTA, arq + ".json"), "utf8"));
    const r = await p.evaluate(([bruto, doenca, presc]) => {
      const rot = Bulas.enxugar(bruto);
      const tabs = [].concat(rot.secoes.dosage_and_administration_table || []).map((h) => {
        const d = document.createElement("div");
        d.appendChild(Bulas.tabelaSegura(h));
        const t = d.querySelector("table");
        return t ? Doses.linhasDaTabela(t) : null;
      }).filter(Boolean);
      const res = Doses.paraDoenca(rot, tabs, doenca);
      const lista = res.alvo.termos.length && !res.trechos.length ? res.todos.filter((u) => u.valores.length) : res.trechos;
      const c = Doses.conferir(Object.assign({ u: "mg", peso: null, paciente: "adulto", renal: false }, presc), lista);
      const primeiro = { passa: c.passa, coincide: c.coincide, intervalo: c.intervalo, perto: c.perto }[c.resumo];
      return { resumo: c.resumo, valor: primeiro && primeiro[0] ? primeiro[0].r.v.texto : null, trechos: res.trechos.length, geral: res.geral };
    }, [bruto, doenca, presc]);
    const ok = r.resumo === esperado && (valor == null || (r.valor && r.valor.indexOf(valor) === 0));
    if (!ok) falhas++;
    console.log((ok ? "ok    " : "FALHA ") + arq + " · " + doenca + " · " + JSON.stringify(presc) + " → " + r.resumo + (r.valor ? " (“" + r.valor + "”)" : "") + (ok ? "" : "   esperado: " + esperado + (valor ? " (“" + valor + "”)" : "")));
  }
  // Nenhuma dose pode sumir: frase que sai da tela como "tabela achatada no texto" só sai
  // se cada dose dela estiver numa tabela (a piperacilina tem uma tabela que só existe no texto)
  for (const arq of fs.readdirSync(PASTA).filter((f) => f.endsWith(".json"))) {
    const bruto = JSON.parse(fs.readFileSync(path.join(PASTA, arq), "utf8"));
    const r = await p.evaluate((bruto) => {
      const rot = Bulas.enxugar(bruto);
      const tabs = [].concat(rot.secoes.dosage_and_administration_table || []).map((h) => {
        const d = document.createElement("div");
        d.appendChild(Bulas.tabelaSegura(h));
        const t = d.querySelector("table");
        return t ? Doses.linhasDaTabela(t) : null;
      }).filter(Boolean);
      const unidades = Doses.trechosDaPosologia(rot, tabs);
      const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9.]+/g, "");
      const tab = norm(tabs.map((t) => t.titulo + " " + t.linhas.map((l) => l.map((c) => c.texto).join(" ")).join(" ")).join(" "));
      const perdidas = [];
      unidades.descartadas.forEach((f) => Doses.valores(f).forEach((v) => {
        if (tab.indexOf(norm(v.texto.split(/\s+/).slice(0, 2).join(" "))) < 0) perdidas.push(v.texto);
      }));
      const textoTela = unidades.map((u) => u.texto).join(" ");
      return { perdidas, temTabela1: /Table 1: Recommended Dosage of Piperacillin/.test(textoTela) };
    }, bruto);
    if (r.perdidas.length) falhas++;
    console.log((r.perdidas.length ? "FALHA " : "ok    ") + arq + ": nenhuma dose perdida" + (r.perdidas.length ? " — perdeu " + r.perdidas.join(", ") : ""));
    if (arq.startsWith("piperacillin")) {
      if (!r.temTabela1) falhas++;
      console.log((r.temTabela1 ? "ok    " : "FALHA ") + "piperacilina: a tabela de adultos que só existe no texto continua na tela");
    }
  }

  assert.deepEqual(erros, [], "erros na página");
  await navegador.close();
  console.log("\n" + CASOS.length + " casos de dose e " + fs.readdirSync(PASTA).length + " bulas sem dose perdida; falhas: " + falhas);
  if (falhas) process.exit(1);
})().catch((e) => {
  console.error("FALHOU:", e.message);
  process.exit(1);
});
