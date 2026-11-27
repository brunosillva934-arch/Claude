/* Testes sem rede e sem navegador: calculadora, leitura de números, SHA-256 e o tratamento
   do texto da bula. uso: node --test testes/ */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const C = require("../web/calculo.js");
const I = require("../web/integridade.js");
const B = require("../web/bulas.js");
const crypto = require("node:crypto");

const sp = (s) => s.replace(/[\u00a0\u202f]/g, " "); // espaços inquebráveis viram espaço comum para comparar
const temPasso = (r, trecho) => r.passos.some((p) => sp(p).includes(trecho));
const perto = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(b)), `${msg || ""} ${a} ≠ ${b}`);

/* ── números ─────────────────────────────────────────────────────── */

test("lê vírgula e ponto como decimal", () => {
  assert.equal(C.lerNumero("2,5").valor, 2.5);
  assert.equal(C.lerNumero("2.5").valor, 2.5);
  assert.equal(C.lerNumero(" 15 ").valor, 15);
  assert.equal(C.lerNumero("0,125").valor, 0.125);
  assert.equal(C.lerNumero("0.125").valor, 0.125);
  assert.equal(C.lerNumero(",5").valor, 0.5);
  assert.equal(C.lerNumero("1000").valor, 1000);
  assert.equal(C.lerNumero("1,5000").valor, 1.5);
});

test("recusa número ambíguo com separador de milhar", () => {
  for (const t of ["1.000", "2,500", "12.500", "125,000", "1.250"]) {
    const r = C.lerNumero(t);
    assert.ok(r.erro && /ambíguo/.test(r.erro), t + " deveria ser ambíguo");
  }
  assert.match(C.lerNumero("2,500").erro, /2500 ou 2,5/);
  assert.match(C.lerNumero("1.000").erro, /1000 ou 1,0/);
});

test("recusa lixo, zero e negativo", () => {
  for (const t of ["abc", "1,2,3", "1.2.3", "-5", "0", "0,0", "5mg", "1e3", "∞"]) {
    assert.ok(C.lerNumero(t).erro, t + " deveria dar erro");
  }
  assert.ok(C.lerNumero("").vazio);
  assert.ok(C.lerNumero("   ").vazio);
  assert.ok(C.lerNumero("2,5", { inteiro: true }).erro);
  assert.ok(C.lerNumero("30", { max: 24 }).erro);
});

test("formata sem zero sobrando e com zero à esquerda", () => {
  assert.equal(C.formatar(5).texto, "5");
  assert.equal(C.formatar(5.0).texto, "5");
  assert.equal(C.formatar(0.5).texto, "0,5");
  assert.equal(C.formatar(0.125).texto, "0,125");
  assert.equal(C.formatar(2.25).texto, "2,25");
  assert.equal(C.formatar(1200).texto, "1200");
  assert.equal(C.formatar(12500).texto, "12 500");
  assert.equal(C.formatar(1200000).texto, "1 200 000");
  assert.equal(C.formatar(0.0375).texto, "0,0375");
  assert.equal(C.formatar(0.0000005).texto, "0,0000005");
  assert.equal(C.formatar(NaN).texto, "—");
});

test("marca o que foi arredondado para exibir", () => {
  assert.equal(C.formatar(1 / 3).aproximado, true);
  assert.equal(C.num(1 / 3), "≈ 0,333");
  assert.equal(C.formatar(26.25).aproximado, false);
  assert.equal(C.formatar(0.1 + 0.2).aproximado, false); // ruído de ponto flutuante não conta
  assert.equal(C.formatar(1234.56).texto, "1234,6");
  assert.equal(C.formatar(1234.56).aproximado, true);
});

test("converte só entre unidades de massa", () => {
  assert.equal(C.converter(1, "g", "mg"), 1000);
  assert.equal(C.converter(1, "mg", "mcg"), 1000);
  assert.equal(C.converter(500, "mcg", "mg"), 0.5);
  assert.equal(C.converter(1, "UI", "mg"), null);
  assert.equal(C.converter(1, "mEq", "mmol"), null);
  assert.equal(C.converter(7, "UI", "UI"), 7);
});

/* ── dose por peso ───────────────────────────────────────────────── */

test("mg/kg/dose com tomadas e apresentação", () => {
  const r = C.porPeso({ base: "kg", peso: "20", dose: "15", unidade: "mg", periodo: "dose", tomadas: "4", apQtd: "200", apUnidade: "mg", apVolume: "5" });
  assert.equal(r.erros, undefined);
  perto(r.porTomada, 300);
  perto(r.porDia, 1200);
  perto(r.intervalo, 6);
  perto(r.concentracao, 40);
  perto(r.volume, 7.5);
  assert.equal(r.alertas.length, 0);
  assert.ok(temPasso(r, "15 mg/kg/dose × 20 kg = 300 mg por dose"));
  assert.ok(temPasso(r, "300 mg ÷ 40 mg/mL = 7,5 mL por dose"));
});

test("mg/kg/dia dividido em tomadas", () => {
  const r = C.porPeso({ base: "kg", peso: "18", dose: "50", unidade: "mg", periodo: "dia", tomadas: "3", apQtd: "250", apUnidade: "mg", apVolume: "5" });
  perto(r.porDia, 900);
  perto(r.porTomada, 300);
  perto(r.volume, 6);
  perto(r.intervalo, 8);
  assert.ok(temPasso(r, "900 mg ÷ 3 tomadas = 300 mg por dose (a cada 8 h)"));
});

test("dose máxima por dose: avisa, mostra o limitado e não troca sozinho", () => {
  const r = C.porPeso({ base: "kg", peso: "80", dose: "15", unidade: "mg", periodo: "dose", tomadas: "4", max: "1", maxUnidade: "g", maxPeriodo: "dose", apQtd: "10", apUnidade: "mg", apVolume: "1" });
  perto(r.porTomada, 1200); // o calculado continua sendo o calculado
  assert.equal(r.alertas[0].nivel, "grave");
  assert.match(r.alertas[0].texto, /passa da dose máxima/);
  perto(r.limitada.porTomada, 1000);
  perto(r.limitada.porDia, 4000);
  perto(r.volume, 120);
  perto(r.volumeLimitado, 100);
});

test("dose máxima por dia", () => {
  const r = C.porPeso({ base: "kg", peso: "70", dose: "20", unidade: "mg", periodo: "dose", tomadas: "4", max: "4000", maxUnidade: "mg", maxPeriodo: "dia" });
  perto(r.porDia, 5600);
  assert.equal(r.alertas[0].nivel, "grave");
  perto(r.limitada.porDia, 4000);
  perto(r.limitada.porTomada, 1000);
  const dentro = C.porPeso({ base: "kg", peso: "10", dose: "20", unidade: "mg", periodo: "dose", tomadas: "4", max: "4000", maxUnidade: "mg", maxPeriodo: "dia" });
  assert.equal(dentro.alertas.length, 0);
  assert.equal(dentro.limitada, null);
  assert.ok(dentro.passos.some((p) => /Dentro da dose máxima/.test(p)));
});

test("máximo diário sem tomadas: pede as tomadas em vez de comparar errado", () => {
  const r = C.porPeso({ base: "kg", peso: "70", dose: "20", unidade: "mg", periodo: "dose", max: "4000", maxUnidade: "mg", maxPeriodo: "dia" });
  assert.equal(r.limitada, null);
  assert.match(r.alertas[0].texto, /tomadas por dia/);
});

test("exatamente no máximo não dispara alerta", () => {
  const r = C.porPeso({ base: "kg", peso: "10", dose: "0,1", unidade: "mg", periodo: "dose", max: "1", maxUnidade: "mg", maxPeriodo: "dose" });
  perto(r.porTomada, 1);
  assert.equal(r.limitada, null);
});

test("mcg/kg com apresentação em mg converte a unidade", () => {
  const r = C.porPeso({ base: "kg", peso: "3,5", dose: "10", unidade: "mcg", periodo: "dose", apQtd: "1", apUnidade: "mg", apVolume: "10" });
  perto(r.porTomada, 35);
  perto(r.concentracao, 100); // 1 mg/10 mL = 100 mcg/mL
  perto(r.volume, 0.35);
  assert.ok(temPasso(r, "1 mg (= 1000 mcg)"));
});

test("superfície corporal por Mosteller", () => {
  const r = C.porPeso({ base: "m2", peso: "70", altura: "170", dose: "100", unidade: "mg", periodo: "dose" });
  perto(r.superficie, Math.sqrt((170 * 70) / 3600));
  perto(r.porTomada, 100 * Math.sqrt((170 * 70) / 3600));
  assert.ok(r.passos[0].startsWith("Superfície corporal (Mosteller)"));
});

test("dose fixa só converte para volume", () => {
  const r = C.porPeso({ base: "fixa", dose: "500", unidade: "mg", periodo: "dose", apQtd: "250", apUnidade: "mg", apVolume: "5" });
  perto(r.porTomada, 500);
  perto(r.volume, 10);
});

test("unidades incompatíveis viram erro, não conta", () => {
  const a = C.porPeso({ base: "kg", peso: "10", dose: "100", unidade: "UI", periodo: "dose", apQtd: "5", apUnidade: "mg", apVolume: "1" });
  assert.ok(a.erros.apQtd);
  const b = C.porPeso({ base: "kg", peso: "10", dose: "1", unidade: "mEq", periodo: "dose", max: "40", maxUnidade: "mmol", maxPeriodo: "dose" });
  assert.ok(b.erros.max);
});

test("campos faltando ou inválidos", () => {
  const a = C.porPeso({ base: "kg", dose: "10", unidade: "mg", periodo: "dia" });
  assert.ok(a.erros.peso);
  assert.ok(a.erros.tomadas);
  const b = C.porPeso({ base: "kg", peso: "20", dose: "10", unidade: "mg", periodo: "dia", tomadas: "2,5" });
  assert.ok(b.erros.tomadas);
  const c = C.porPeso({ base: "kg", peso: "1.000", dose: "10", unidade: "mg", periodo: "dose" });
  assert.match(c.erros.peso, /ambíguo/);
  const d = C.porPeso({ base: "kg", peso: "20", dose: "10", unidade: "mg", periodo: "dose", apQtd: "250", apUnidade: "mg" });
  assert.ok(d.erros.apVolume);
  const e = C.porPeso({ base: "m2", peso: "20", dose: "10", unidade: "mg", periodo: "dose" });
  assert.ok(e.erros.altura);
});

test("avisos de peso, altura e volume", () => {
  const a = C.porPeso({ base: "kg", peso: "700", dose: "1", unidade: "mg", periodo: "dose" });
  assert.match(a.alertas[0].texto, /fora do habitual/);
  const b = C.porPeso({ base: "kg", peso: "3", dose: "0,01", unidade: "mg", periodo: "dose", apQtd: "1", apUnidade: "mg", apVolume: "1" });
  assert.ok(b.alertas.some((x) => /pequeno demais/.test(x.texto)));
});

/* ── infusão ─────────────────────────────────────────────────────── */

test("mcg/kg/min para mL/h", () => {
  // 0,1 mcg/kg/min, 70 kg, 4 mg em 250 mL (16 mcg/mL) → 26,25 mL/h
  const r = C.infusao({ sentido: "dose", peso: "70", dose: "0,1", doseUnidade: "mcg", porKg: true, tempo: "min", qtd: "4", qtdUnidade: "mg", volume: "250" });
  assert.equal(r.erros, undefined);
  perto(r.concentracao, 16);
  perto(r.porHora, 420);
  perto(r.vazao, 26.25);
  assert.ok(temPasso(r, "0,1 mcg/kg/min × 70 kg × 60 min/h = 420 mcg/h"));
  assert.ok(temPasso(r, "420 mcg/h ÷ 16 mcg/mL = 26,25 mL/h"));
});

test("mL/h para mcg/kg/min é o inverso exato", () => {
  const r = C.infusao({ sentido: "vazao", peso: "70", vazao: "26,25", doseUnidade: "mcg", porKg: true, tempo: "min", qtd: "4", qtdUnidade: "mg", volume: "250" });
  perto(r.dose, 0.1);
  perto(r.porHora, 420);
});

test("UI/h sem peso", () => {
  // 25 000 UI em 250 mL = 100 UI/mL; 1000 UI/h → 10 mL/h
  const r = C.infusao({ sentido: "dose", dose: "1000", doseUnidade: "UI", porKg: false, tempo: "h", qtd: "25000", qtdUnidade: "UI", volume: "250" });
  perto(r.vazao, 10);
  assert.equal(r.erros, undefined);
});

test("infusão com unidades incompatíveis e vazões extremas", () => {
  const a = C.infusao({ sentido: "dose", peso: "70", dose: "1", doseUnidade: "UI", porKg: true, tempo: "h", qtd: "5", qtdUnidade: "mg", volume: "50" });
  assert.ok(a.erros.qtd);
  const b = C.infusao({ sentido: "dose", peso: "1", dose: "0,01", doseUnidade: "mcg", porKg: true, tempo: "min", qtd: "1", qtdUnidade: "g", volume: "50" });
  assert.ok(b.alertas.some((x) => /abaixo da precisão/.test(x.texto)));
  const c = C.infusao({ sentido: "dose", peso: "100", dose: "1", doseUnidade: "mg", porKg: true, tempo: "min", qtd: "1", qtdUnidade: "mg", volume: "100" });
  assert.ok(c.alertas.some((x) => /limite de muitas bombas/.test(x.texto)));
});

test("conta conferida contra a fórmula em muitos casos aleatórios", () => {
  let semente = 42;
  const rnd = () => ((semente = (semente * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 2000; i++) {
    const peso = +(0.5 + rnd() * 150).toFixed(2);
    const dose = +(0.01 + rnd() * 100).toFixed(2); // 3 casas dariam "12.345", que o app recusa por ambíguo
    const tom = 1 + Math.floor(rnd() * 6);
    const apQ = +(1 + rnd() * 1000).toFixed(1);
    const apV = +(1 + rnd() * 100).toFixed(1);
    const periodo = rnd() < 0.5 ? "dose" : "dia";
    const virgula = (n) => String(n).replace(".", ",");
    const r = C.porPeso({ base: "kg", peso: virgula(peso), dose: virgula(dose), unidade: "mg", periodo, tomadas: String(tom), apQtd: virgula(apQ), apUnidade: "mg", apVolume: virgula(apV) });
    assert.equal(r.erros, undefined, JSON.stringify(r.erros));
    const total = dose * peso;
    const porTomada = periodo === "dose" ? total : total / tom;
    perto(r.porTomada, porTomada, "porTomada");
    perto(r.porDia, porTomada * tom, "porDia");
    perto(r.volume, porTomada / (apQ / apV), "volume");
  }
});

/* ── integridade ─────────────────────────────────────────────────── */

test("SHA-256 bate com os vetores oficiais e com o node:crypto", () => {
  assert.equal(I.sha256(""), "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
  assert.equal(I.sha256("abc"), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  assert.equal(I.sha256("abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq"), "248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1");
  const textos = ["ação", "µg/kg — ≥ 2 mg", "x".repeat(55), "x".repeat(56), "x".repeat(64), "y".repeat(100000), JSON.stringify({ a: "Ü", b: [1, 2] })];
  for (const t of textos) assert.equal(I.sha256(t), crypto.createHash("sha256").update(t, "utf8").digest("hex"), t.slice(0, 20));
});

/* ── texto da bula ───────────────────────────────────────────────── */

const DA = "2 DOSAGE AND ADMINISTRATION 2.1 Recommended Dosage Pediatric patients weighing less than 40 kg: 25 mg/kg/day in divided doses every 12 hours or 20 mg/kg/day every 8 hours. Take 2.5 mL twice daily. ( 2.1 ) 2.2 Renal Impairment Patients with GFR less than 30 mL/min should not receive the 875 mg tablet. • Do not exceed 4 g per day. • Give with food. 2.10 Preparation Shake well.";

test("parágrafos não mudam nenhum caractere do texto", () => {
  const p = B.paragrafos(DA);
  assert.equal(p.join(" ").replace(/\s+/g, " "), DA.replace(/\s+/g, " "));
  assert.ok(p[1].startsWith("2.1 Recommended"));
  assert.ok(p.some((x) => x.startsWith("2.2 Renal")));
  assert.ok(p.some((x) => x.startsWith("2.10 Preparation")));
  assert.ok(p.some((x) => x.startsWith("• Do not exceed")));
  assert.ok(!p.some((x) => x.startsWith("2.5 mL")), "2.5 mL não é subseção");
  assert.ok(!p.some((x) => x.startsWith("2.1 )")), "referência (2.1) não é subseção");
});

test("trechos remontam o texto exato e acham as doses", () => {
  const t = B.trechos(DA, "");
  assert.equal(t.map((x) => x.t).join(""), DA);
  const doses = t.filter((x) => x.dose).map((x) => x.t);
  for (const d of ["25 mg/kg/day", "20 mg/kg/day", "every 12 hours", "every 8 hours", "2.5 mL", "twice daily", "875 mg", "4 g"]) {
    assert.ok(doses.includes(d), "faltou destacar " + d + " em " + JSON.stringify(doses));
  }
  assert.ok(!doses.includes("40 kg"), "peso não é dose");
});

test("busca dentro da bula: sem diferenciar maiúsculas e sem perder texto", () => {
  const t = B.trechos(DA, "renal");
  assert.equal(t.map((x) => x.t).join(""), DA);
  assert.deepEqual(t.filter((x) => x.achado).map((x) => x.t), ["Renal"]);
  const t2 = B.trechos(DA, "mg/kg");
  assert.equal(t2.filter((x) => x.achado).length, 2);
  assert.equal(t2.map((x) => x.t).join(""), DA);
  const t3 = B.trechos("a (b) [c] a.b*c", "(b)");
  assert.equal(t3.filter((x) => x.achado)[0].t, "(b)");
});

test("tipo de registro e data", () => {
  assert.equal(B.registro("NDA050542").sigla, "NDA");
  assert.equal(B.registro("ANDA065271").sigla, "ANDA");
  assert.equal(B.registro("BLA125057").sigla, "BLA");
  assert.equal(B.registro("part341").sigla, "OTC");
  assert.equal(B.registro("M012").sigla, "OTC");
  assert.equal(B.data("20261113"), "13/11/2026");
  assert.equal(B.data(""), "data não informada");
});

test("versão mais nova", () => {
  assert.equal(B.maisNova({ id: "b", version: "27", effective_time: "20261201" }, { id: "a", version: "26", effective_time: "20261113" }), true);
  assert.equal(B.maisNova({ id: "a", version: "26", effective_time: "20261113" }, { id: "a", version: "26", effective_time: "20261113" }), false);
  assert.equal(B.maisNova({ id: "b", version: "", effective_time: "20261201" }, { id: "a", version: "", effective_time: "20261113" }), true);
  assert.equal(B.maisNova(null, { id: "a" }), false);
});

test("busca de associação exige os dois princípios ativos", () => {
  const q = B.buscaIngrediente("amoxicillin / clavulanate");
  assert.match(q, /substance_name:"amoxicillin".*\+AND\+.*substance_name:"clavulanate"/);
  assert.equal(B.buscaIngrediente('a"b'), '(openfda.substance_name:"ab"+OR+openfda.generic_name:"ab")'); // aspas do nome não quebram a busca
});

test("enxugar guarda só os campos da tela, sempre na mesma ordem", () => {
  const bruto = {
    set_id: "s", id: "i", version: 3, effective_time: "20260101",
    dosage_and_administration: ["2 DOSAGE"], boxed_warning: ["WARNING"], dosage_and_administration_table: ["<table></table>"],
    spl_product_data_elements: ["não usado"],
    openfda: { brand_name: ["X"], generic_name: ["Y"], unii: ["não usado"] }
  };
  const r = B.enxugar(bruto);
  assert.deepEqual(Object.keys(r.secoes), ["boxed_warning", "dosage_and_administration", "dosage_and_administration_table"]);
  assert.equal(r.version, "3");
  assert.equal(r.openfda.unii, undefined);
  assert.equal(JSON.stringify(B.enxugar(JSON.parse(JSON.stringify(bruto)))), JSON.stringify(r));
});

test("apelidos são chaves normalizadas", () => {
  for (const k of Object.keys(B.APELIDOS)) assert.equal(B.chaveNome(k), k, k);
  assert.equal(B.APELIDOS[B.chaveNome("Dipirona Sódica")], "dipyrone");
  assert.equal(B.APELIDOS[B.chaveNome("  ÁCIDO   acetilsalicílico ")], "aspirin");
});
