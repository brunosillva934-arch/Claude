/* Dose por doença e conferência: leitura dos números da bula, nomes de doença, comparação.
   As frases vêm de bulas reais da FDA. uso: node --test testes/doses.test.js */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const D = require("../web/doses.js");
const B = require("../web/bulas.js");

/** Resumo de um valor lido, fácil de comparar. */
function ler(frase) {
  return D.valores(frase).map((v) => {
    const o = { t: v.texto, lo: v.lo, hi: v.hi, u: v.u, base: v.base };
    if (v.porKg) o.kg = true;
    if (v.freq) o.q = (v.freq.opcoes && v.freq.opcoes.length ? v.freq.opcoes : [v.freq]).map((f) => (f.lo === f.hi ? f.lo : f.lo + "-" + f.hi)).join("|");
    if (v.unica) o.unica = true;
    if (v.max) o.max = v.maxBase;
    return o;
  });
}

/* ── leitura dos números ─────────────────────────────────────────── */

test("dose por dia em doses divididas, com faixa e intervalo", () => {
  assert.deepEqual(ler("In Adults, 750-1750 mg/day in divided doses every 8 to 12 hours."), [
    { t: "750-1750 mg/day in divided doses every 8 to 12 hours", lo: 750, hi: 1750, u: "mg", base: "dia", q: "8-12" }
  ]);
  assert.deepEqual(ler("20 to 45 mg/kg/day in divided doses every 8 to 12 hours"), [
    { t: "20 to 45 mg/kg/day in divided doses every 8 to 12 hours", lo: 20, hi: 45, u: "mg", base: "dia", kg: true, q: "8-12" }
  ]);
});

test("alternativas com 'or' viram valores separados, cada um com seu intervalo", () => {
  assert.deepEqual(ler("500 mg every 12 hour or 250 mg every 8 hours"), [
    { t: "500 mg every 12 hour", lo: 500, hi: 500, u: "mg", base: "dose", q: "12" },
    { t: "250 mg every 8 hours", lo: 250, hi: 250, u: "mg", base: "dose", q: "8" }
  ]);
});

test("dose única, antes ou depois do número", () => {
  assert.equal(ler("30 mg/kg as a single dose or 10 mg/kg once daily for 3 days")[0].unica, true);
  assert.equal(ler("30 mg/kg as a single dose or 10 mg/kg once daily for 3 days")[1].q, "24");
  assert.deepEqual(ler("One single 2 gram dose."), [{ t: "2 gram", lo: 2000, hi: 2000, u: "mg", base: "dose", unica: true }]);
  assert.equal(ler("Ceftriaxone is given as a single intramuscular dose of 250 mg.")[0].unica, true);
  assert.equal(ler("Administer 2,400,000 units intramuscularly in a single dose.")[0].lo, 2400000);
});

test("frequências escritas de vários jeitos", () => {
  assert.equal(ler("125 mg administered orally 4 times daily for 10 days")[0].q, "6");
  assert.equal(ler("375 mg two times daily for seven days")[0].q, "12");
  assert.equal(ler("500 mg three times a day")[0].q, "8");
  assert.equal(ler("40 mg by subcutaneous injection once a day (with the initial dose)")[0].q, "24");
  assert.equal(ler("375 mg q24h for 7 days")[0].q, "24");
  assert.equal(ler("400 mg every 4 to 6 hours as necessary")[0].q, "4-6");
  assert.equal(ler("1 to 2 grams given once a day (or in equally divided doses twice a day)")[0].q, "24|12");
});

test("'per dose' não é 'per day'", () => {
  assert.deepEqual(ler("10 mg/kg per dose given every 6 hours"), [
    { t: "10 mg/kg per dose given every 6 hours", lo: 10, hi: 10, u: "mg", base: "dose", kg: true, q: "6" }
  ]);
});

test("máximos: por dia, por dose ou sem dizer", () => {
  assert.equal(ler("up to 4 grams in two to four equally divided doses")[0].max, "dia");
  assert.equal(ler("No dose adjustment; maximum daily dose should not exceed 1 g")[0].max, "dia");
  assert.equal(ler("Do not exceed 3200 mg total daily dose.")[0].max, "dia");
  assert.equal(ler("Thereafter, a total daily dose of 100 mg/kg/day (not to exceed 4 grams daily) is recommended.")[1].max, "dia");
  assert.equal(ler("the initial therapeutic dose be 100 mg/kg (not to exceed 4 grams).")[1].max, "?");
  assert.equal(ler("The upper dose for neonates and infants age 3 months or younger is 30 mg/kg/day divided every 12 hours.")[0].max, "dia");
  assert.equal(ler("500 mg every 12 hours")[0].max, undefined);
});

test("lista de remédios com o intervalo no fim", () => {
  const v = ler("Triple therapy: 1 gram amoxicillin, 500 mg clarithromycin, and 30 mg lansoprazole, all given twice daily (every 12 hours) for 14 days.");
  assert.deepEqual(v.map((x) => [x.lo, x.q]), [[1000, "12"], [500, "12"], [30, "12"]]);
  const w = ler("the recommended dose is 40 mg/kg sulfamethoxazole and 8 mg/kg trimethoprim per 24 hours, given in two divided doses every 12 hours");
  assert.deepEqual(w.map((x) => [x.lo, x.base, x.q]), [[40, "dia", "12"], [8, "dia", "12"]]);
});

test("não são dose: concentração, força, diluição, incremento, taxa de clearance", () => {
  assert.deepEqual(ler("Amoxicillin for oral suspension 250 mg/5 mL: each 5 mL contains 250 mg amoxicillin."), []);
  assert.deepEqual(ler("Reconstitute to 100 mg/mL."), []);
  assert.deepEqual(ler("dilute 500 mg in 100 mL of saline"), []);
  assert.deepEqual(ler("Increase the dose in increments of 500 mg weekly"), []);
  assert.deepEqual(ler("Creatinine clearance 30 to 59 mL/min"), []);
  assert.deepEqual(ler("10 capsules (30 mg)"), []);
});

test("taxa de infusão é lida, mas como taxa", () => {
  assert.deepEqual(ler("Initial infusion rate 8 to 12 mcg/min").map((x) => [x.lo, x.hi, x.base]), [[0.008, 0.012, "min"]]);
});

/* ── frases e termos ─────────────────────────────────────────────── */

test("frases: corta no ponto, mas não em abreviação nem número", () => {
  const f = D.frases("Dosing for H. pylori Infection: 1 gram twice daily. Take 2.5 mL with food. S. pneumoniae e.g. Strains. Days 2 through 5. Acute otitis media.");
  assert.deepEqual(f, ["Dosing for H. pylori Infection: 1 gram twice daily.", "Take 2.5 mL with food.", "S. pneumoniae e.g. Strains.", "Days 2 through 5.", "Acute otitis media."]);
});

test("termo como palavra inteira, sem pegar negação", () => {
  assert.equal(D.termoNo("Ear/Nose/Throat", [{ termo: "ear" }]).achado, "Ear");
  assert.equal(D.termoNo("in early pregnancy, every year", [{ termo: "ear" }]), null);
  assert.equal(D.termoNo("Non-gonococcal urethritis and cervicitis", [{ termo: "gonococcal" }]), null);
  assert.equal(D.termoNo("Gonococcal urethritis", [{ termo: "gonococcal" }]).achado, "Gonococcal");
  assert.equal(D.termoNo("serious infections other than meningitis, the dose", [{ termo: "meningitis" }]), null);
  assert.equal(D.termoNo("In the treatment of meningitis", [{ termo: "meningitis" }]).achado, "meningitis");
  assert.equal(D.termoNo("acute otitis media", [{ termo: "otitis media" }]).achado, "otitis media");
});

test("nome da doença em português vira os termos da bula", () => {
  const otite = D.interpretar("Otite média aguda");
  assert.deepEqual(otite.doencas.map((d) => d.pt), ["Otite média"]);
  assert.deepEqual(otite.termos.map((t) => t.termo + (t.amplo ? "*" : "")), ["otitis media", "otitis", "ear*"]);
  assert.deepEqual(D.interpretar("ITU").termos.slice(0, 3).map((t) => t.termo), ["urinary tract", "cystitis", "pyelonephritis"]);
  assert.deepEqual(D.interpretar("profilaxia de TVP").doencas.map((d) => d.pt), ["Profilaxia de TVP"]); // a chave mais longa ganha de "tvp"
  assert.deepEqual(D.interpretar("pré-eclâmpsia").doencas.map((d) => d.pt), ["Pré-eclâmpsia / eclâmpsia"]);
  assert.deepEqual(D.interpretar("H. pylori").doencas.map((d) => d.pt), ["H. pylori"]);
  // sem correspondência: procura como foi escrito (quem digita em inglês)
  assert.deepEqual(D.interpretar("lyme carditis").termos.map((t) => t.termo), ["lyme"]);
  assert.deepEqual(D.interpretar("osteomyelitis of the jaw").termos.map((t) => t.termo), ["osteomyelitis of the jaw"]);
});

test("tabela de doenças: chaves normalizadas, sem repetição, sem números", () => {
  const vistas = {};
  for (const d of D.DOENCAS) {
    assert.ok(d.pt && d.chaves.length && d.termos.length, d.pt);
    for (const c of d.chaves) {
      assert.equal(c, B.chaveNome(c), "chave não normalizada: " + c);
      assert.ok(!vistas[c], "chave repetida: " + c + " em " + d.pt + " e " + vistas[c]);
      vistas[c] = d.pt;
    }
    for (const t of d.termos.concat(d.amplos)) assert.ok(!/\d\s*(mg|g|mcg|units?)\b/i.test(t), "termo com dose: " + t);
  }
});

test("população e situação do trecho", () => {
  assert.equal(D.populacao("Pediatric Patients (over 1 year of age)"), "crianca");
  assert.equal(D.populacao("Adults and Pediatric Patients at Least 15 Years of Age"), "ambos");
  assert.equal(D.populacao("In Adults"), "adulto");
  assert.equal(D.populacao("severe (Child-Pugh C) hepatic impairment"), "?");
  assert.equal(D.populacao("women of childbearing potential"), "?");
  assert.equal(D.situacao("Child Pugh C patients"), "hepatica");
  assert.equal(D.situacao("Dosage Regimens for Patients with Severe Renal Impairment (creatinine clearance <30 mL/minute)"), "renal");
  assert.equal(D.situacao("GFR 10 to 30 mL/min"), "renal");
  assert.equal(D.situacao("Ear/Nose/Throat"), null);
});

test("grade da tabela desfaz rowspan e colspan", () => {
  const c = (texto, rowspan, colspan) => ({ texto, rowspan, colspan });
  const g = D.grade([
    [c("Infection"), c("Severity"), c("Adults"), c("Children")],
    [c("Ear/Nose/Throat", 2), c("Mild"), c("500 mg every 12 hours"), c("25 mg/kg/day")],
    [c("Severe"), c("875 mg every 12 hours"), c("45 mg/kg/day")],
    [c("Nota", 1, 4)]
  ]);
  assert.deepEqual(g.map((l) => l.map((x) => x.texto)), [
    ["Infection", "Severity", "Adults", "Children"],
    ["Ear/Nose/Throat", "Mild", "500 mg every 12 hours", "25 mg/kg/day"],
    ["Ear/Nose/Throat", "Severe", "875 mg every 12 hours", "45 mg/kg/day"],
    ["Nota", "Nota", "Nota", "Nota"]
  ]);
});

/* ── trechos e conferência ───────────────────────────────────────── */

const ROTULO = {
  secoes: {
    indications_and_usage: "INDICATIONS Infections of the Ear, Nose, and Throat. Infections of the Lower Respiratory Tract. Helicobacter pylori infection.",
    dosage_and_administration:
      "2 DOSAGE AND ADMINISTRATION 2.1 Dosage In Adults, 750-1750 mg/day in divided doses every 8 to 12 hours. 2.2 Renal Impairment Patients with GFR less than 30 mL/min should not receive the 875 mg tablet. 2.3 H. pylori Triple therapy: 1 gram amoxicillin, 500 mg clarithromycin, and 30 mg lansoprazole, all given twice daily (every 12 hours) for 14 days."
  }
};
const TABELAS = [
  {
    titulo: "",
    cabecalhos: 1,
    linhas: [
      [{ texto: "Infection" }, { texto: "Severity" }, { texto: "Adults and Pediatric Patients Weight Greater than 40 kg" }, { texto: "Pediatric Patients Weight Less than 40 kg" }],
      [{ texto: "Ear/Nose/Throat", rowspan: 2 }, { texto: "Mild/Moderate" }, { texto: "500 mg every 12 hours or 250 mg every 8 hours" }, { texto: "25 mg/kg/day in divided doses every 12 hours" }],
      [{ texto: "Severe" }, { texto: "875 mg every 12 hours or 500 mg every 8 hours" }, { texto: "45 mg/kg/day in divided doses every 12 hours" }],
      [{ texto: "Lower Respiratory Tract" }, { texto: "Mild/Moderate or Severe" }, { texto: "875 mg every 12 hours" }, { texto: "45 mg/kg/day in divided doses every 12 hours" }]
    ]
  },
  {
    titulo: "Patients with Renal Impairment",
    cabecalhos: 1,
    linhas: [[{ texto: "Renal function" }, { texto: "Dosage Regimen" }], [{ texto: "GFR 10 to 30 mL/min" }, { texto: "500 mg or 250 mg every 12 hours" }]]
  }
];

test("otite: acha as linhas da tabela pela categoria, com a indicação", () => {
  const r = D.paraDoenca(ROTULO, TABELAS, "otite");
  assert.equal(r.geral, false);
  assert.equal(r.trechos.length, 2);
  assert.ok(r.trechos.every((u) => u.tipo === "linha" && u.termo.achado === "Ear"));
  assert.equal(r.soAmplos, true);
  assert.match(r.indicacoes[0].texto, /Ear, Nose, and Throat/);
  // a coluna de criança é de criança; a de adulto vale para os dois
  const v = r.trechos[0].valores;
  assert.deepEqual(v.map((x) => x.pop), ["ambos", "ambos", "crianca"]);
});

test("conferência: coincide, intervalo diferente, perto, peso, outra população", () => {
  const ot = D.paraDoenca(ROTULO, TABELAS, "otite").trechos;
  const conf = (p) => D.conferir(Object.assign({ u: "mg", peso: null, paciente: "adulto" }, p), ot);
  assert.equal(conf({ dose: 875, intervalo: 12 }).resumo, "coincide");
  assert.equal(conf({ dose: 500, intervalo: 8 }).resumo, "coincide");
  assert.equal(conf({ dose: 875, intervalo: 8 }).resumo, "intervalo");
  const perto = conf({ dose: 900, intervalo: 12 });
  assert.equal(perto.resumo, "perto");
  assert.ok(Math.abs(perto.perto[0].r.desvio - (900 / 875 - 1)) < 1e-9);
  assert.equal(conf({ dose: 2000, intervalo: 12 }).resumo, "diferente");
  // criança de 20 kg: 450 mg a cada 12 h = 45 mg/kg/dia
  assert.equal(conf({ dose: 450, intervalo: 12, peso: 20, paciente: "crianca" }).resumo, "coincide");
  // sem peso, os valores por kg não entram
  const semPeso = conf({ dose: 450, intervalo: 12, paciente: "crianca" });
  assert.ok(semPeso.semPeso > 0);
  // adulto de 70 kg com 875 a cada 12 h dá 25 mg/kg/dia, que é dose de criança: não pode contar
  const adulto = conf({ dose: 875, intervalo: 12, peso: 70 });
  assert.ok(adulto.outraPop > 0);
  assert.ok(adulto.coincide.every((i) => i.r.v.pop !== "crianca"));
});

test("tabela de ajuste renal não vale para quem tem rim normal", () => {
  const todos = D.paraDoenca(ROTULO, TABELAS, "").trechos;
  const renal = todos.filter((u) => u.situacao === "renal");
  assert.ok(renal.length >= 1);
  const normal = D.conferir({ dose: 250, u: "mg", intervalo: 12, peso: null, paciente: "adulto" }, renal);
  assert.equal(normal.coincide.length, 0);
  assert.ok(normal.outraSit > 0);
  const comIRC = D.conferir({ dose: 250, u: "mg", intervalo: 12, peso: null, paciente: "adulto", renal: true }, renal);
  assert.equal(comIRC.resumo, "coincide");
});

test("passar do máximo é o resumo mais forte", () => {
  const trechos = [{ tipo: "frase", texto: "x", valores: D.valores("For more severe infections, up to 4 grams in two to four equally divided doses.").map((v) => Object.assign(v, { pop: "ambos" })) }];
  const c = D.conferir({ dose: 2000, u: "mg", intervalo: 6, peso: null, paciente: "adulto" }, trechos);
  assert.equal(c.resumo, "passa");
  const ok = D.conferir({ dose: 500, u: "mg", intervalo: 6, peso: null, paciente: "adulto" }, trechos);
  assert.equal(ok.itens[0].r.estado, "maximo-ok");
});

test("máximo sem dizer se é por dose ou por dia: avisa as duas leituras", () => {
  const trechos = [{ tipo: "frase", texto: "x", valores: D.valores("the initial therapeutic dose be 100 mg/kg (not to exceed 4 grams).").map((v) => Object.assign(v, { pop: "?" })) }];
  const c = D.conferir({ dose: 3000, u: "mg", intervalo: 12, peso: 30, paciente: "crianca" }, trechos);
  assert.equal(c.talvez.length, 1); // 3 g por dose cabe; 6 g por dia passaria
  assert.equal(D.conferir({ dose: 4500, u: "mg", intervalo: 12, peso: 45, paciente: "crianca" }, trechos).resumo, "passa");
});

test("H. pylori: a dose da amoxicilina na terapia tripla", () => {
  const r = D.paraDoenca(ROTULO, TABELAS, "h pylori");
  assert.equal(r.trechos.length, 1);
  const c = D.conferir({ dose: 1000, u: "mg", intervalo: 12, peso: null, paciente: "adulto" }, r.trechos);
  assert.equal(c.resumo, "coincide");
  assert.equal(c.coincide[0].r.v.lo, 1000);
});

test("doença fora das indicações e fora da posologia: devolve vazio, a tela mostra a geral", () => {
  const r = D.paraDoenca(ROTULO, TABELAS, "meningite");
  assert.equal(r.indicacoes.length, 0);
  assert.equal(r.trechos.length, 0);
  assert.ok(r.todos.some((u) => u.valores.length));
});

test("bula de uma indicação só: posologia geral, marcada como tal", () => {
  const rot = {
    secoes: {
      indications_and_usage: "Nitrofurantoin is indicated only for the treatment of urinary tract infections.",
      dosage_and_administration: "DOSAGE AND ADMINISTRATION Adults and Pediatric Patients Over 12 Years: One 100 mg capsule every 12 hours for seven days."
    }
  };
  const r = D.paraDoenca(rot, [], "cistite");
  assert.equal(r.geral, true);
  assert.equal(r.porIndicacao, true);
  assert.equal(D.conferir({ dose: 100, u: "mg", intervalo: 12, peso: null, paciente: "adulto" }, r.trechos).resumo, "coincide");
});
