(function () {
"use strict";
if (!window.htmPreact) {
  document.getElementById("app").innerHTML = '<p class="abrindo">Não consegui carregar o fichário. Verifique a conexão e abra de novo.</p>';
  return;
}
const { html, render, useState, useEffect, useMemo, useRef } = window.htmPreact;

/* ================= domínio ================= */
/* Três tipos de ficha, cada um com as suas seções de anotação e um resumo de campos para marcar. */
const SECOES_DOENCA = [
  { id: "def", nome: "Definição", abbr: "Def" },
  { id: "fisio", nome: "Fisiopatologia", abbr: "Fisiopato" },
  { id: "clinica", nome: "Quadro clínico", abbr: "Clínica" },
  { id: "dx", nome: "Diagnóstico", abbr: "Dx" },
  { id: "tto", nome: "Tratamento", abbr: "Tto" },
  { id: "perolas", nome: "Pérolas e pegadinhas", abbr: "Pérolas" },
];
const SECOES_MED = [
  { id: "mec", nome: "Mecanismo de ação", abbr: "Mecanismo" },
  { id: "indic", nome: "Indicações", abbr: "Indicação" },
  { id: "dose", nome: "Posologia", abbr: "Dose" },
  { id: "ea", nome: "Efeitos adversos", abbr: "EA" },
  { id: "ci", nome: "Contraindicações", abbr: "CI" },
  { id: "inter", nome: "Interações", abbr: "Interações" },
  { id: "perolas", nome: "Pérolas e pegadinhas", abbr: "Pérolas" },
];
const SECOES_EXAME = [
  { id: "indic", nome: "Quando pedir", abbr: "Indicação" },
  { id: "preparo", nome: "Preparo e coleta", abbr: "Preparo" },
  { id: "ref", nome: "Valores de referência", abbr: "Ref" },
  { id: "interp", nome: "Como interpretar", abbr: "Leitura" },
  { id: "causas", nome: "Aumenta ou diminui em", abbr: "Causas" },
  { id: "limites", nome: "Limitações e interferentes", abbr: "Limites" },
  { id: "perolas", nome: "Pérolas e pegadinhas", abbr: "Pérolas" },
];
const AJUSTE = ["Não precisa", "Ajustar dose", "Evitar"];
const TONS_AJUSTE = { "Ajustar dose": "alerta", Evitar: "perigo" };
const CAMPOS_DOENCA = [
  { id: "curso", nome: "Curso", tipo: "um", opcoes: ["Agudo", "Subagudo", "Crônico"] },
  { id: "notificacao", nome: "Notificação compulsória", tipo: "um", opcoes: ["Não", "Semanal", "Imediata (24 h)"], tons: { "Imediata (24 h)": "alerta" } },
];
const CAMPOS_MED = [
  { id: "classe", nome: "Classe", tipo: "texto", ex: "Ex.: Diurético de alça", lista: "lista-classe" },
  { id: "vias", nome: "Vias", tipo: "varios", opcoes: ["VO", "SL", "IV", "IM", "SC", "Inalatória", "Tópica", "Retal", "Transdérmica"] },
  { id: "gestacao", nome: "Gestação", tipo: "um", opcoes: ["A", "B", "C", "D", "X"], tons: { D: "alerta", X: "perigo" },
    dica: "Categoria de risco da ANVISA. A e B: sem risco demonstrado. C: sem estudos adequados em gestantes. D: risco fetal comprovado, só se o benefício justificar. X: contraindicado." },
  { id: "lactacao", nome: "Amamentação", tipo: "um", opcoes: ["Compatível", "Usar com cautela", "Contraindicado"], tons: { "Usar com cautela": "alerta", Contraindicado: "perigo" } },
  { id: "renal", nome: "Ajuste renal", tipo: "um", opcoes: AJUSTE, tons: TONS_AJUSTE },
  { id: "hepatico", nome: "Ajuste hepático", tipo: "um", opcoes: AJUSTE, tons: TONS_AJUSTE },
  { id: "receita", nome: "Receita", tipo: "um", opcoes: ["Simples", "Antimicrobiano (2 vias)", "Controle especial (C1)", "Notificação B (azul)", "Notificação A (amarela)"],
    tons: { "Controle especial (C1)": "alerta", "Notificação B (azul)": "alerta", "Notificação A (amarela)": "alerta" } },
  { id: "monitorar", nome: "Monitorar", tipo: "varios", opcoes: ["Função renal", "Potássio", "Sódio", "Glicemia", "Função hepática", "Hemograma", "INR", "Nível sérico", "ECG / QT", "PA e FC"] },
];
const CAMPOS_EXAME = [
  { id: "categoria", nome: "Tipo de exame", tipo: "um", opcoes: ["Laboratório", "Imagem", "Método gráfico", "Prova funcional", "Endoscopia", "Anatomopatológico", "Microbiologia"] },
  { id: "amostra", nome: "Amostra", tipo: "um", opcoes: ["Sangue venoso", "Sangue arterial", "Urina", "Fezes", "Líquor", "Líquido cavitário", "Escarro", "Swab", "Tecido"],
    se: (c) => ["Laboratório", "Microbiologia", "Anatomopatológico"].includes(c.categoria) },
  { id: "contraste", nome: "Contraste", tipo: "um", opcoes: ["Sem contraste", "Iodado", "Gadolínio", "Bário"], se: (c) => c.categoria === "Imagem" },
  { id: "radiacao", nome: "Radiação ionizante", tipo: "um", opcoes: ["Não", "Sim"], se: (c) => c.categoria === "Imagem", tons: { Sim: "alerta" } },
  { id: "jejum", nome: "Jejum", tipo: "um", opcoes: ["Não precisa", "4 h", "8 h", "12 h"] },
  { id: "invasivo", nome: "Invasivo", tipo: "um", opcoes: ["Não", "Pouco", "Sim"] },
  { id: "referencia", nome: "Referência", tipo: "texto", ex: "Ex.: 3,5–5,0 mEq/L" },
  { id: "sens", nome: "Sensibilidade", tipo: "texto", ex: "Ex.: 90%", curto: true },
  { id: "espec", nome: "Especificidade", tipo: "texto", ex: "Ex.: 75%", curto: true },
];
const TIPOS = {
  doenca: { id: "doenca", nome: "Doença", plural: "Doenças", secoes: SECOES_DOENCA, campos: CAMPOS_DOENCA, exNome: "Ex.: Insuficiência cardíaca",
    prefixoSin: "Também", rotuloSin: "Sinônimos e siglas", exSin: "Ex.: IC, ICC", rotuloLig: "Diferenciais", abbrLig: "Ddx",
    exLig: "Ex.: DPOC exacerbada, Tromboembolismo pulmonar", vazioLig: "Nenhum diferencial ainda." },
  medicamento: { id: "medicamento", nome: "Medicamento", plural: "Medicamentos", secoes: SECOES_MED, campos: CAMPOS_MED, exNome: "Ex.: Furosemida",
    prefixoSin: "Nomes comerciais", rotuloSin: "Nomes comerciais e siglas", exSin: "Ex.: Lasix", rotuloLig: "Usado em", abbrLig: "Uso",
    exLig: "Ex.: Insuficiência cardíaca, Síndrome nefrótica", vazioLig: "Nenhuma doença ligada ainda." },
  exame: { id: "exame", nome: "Exame", plural: "Exames", secoes: SECOES_EXAME, campos: CAMPOS_EXAME, exNome: "Ex.: BNP",
    prefixoSin: "Também", rotuloSin: "Siglas e outros nomes", exSin: "Ex.: NT-proBNP", rotuloLig: "Pedido em", abbrLig: "Pedido",
    exLig: "Ex.: Insuficiência cardíaca", vazioLig: "Nenhuma doença ligada ainda." },
};
const ORDEM_TIPOS = ["doenca", "medicamento", "exame"];
const CLASSES = ["Betabloqueador", "IECA", "BRA", "Bloqueador de canal de cálcio", "Diurético de alça", "Diurético tiazídico", "Antagonista mineralocorticoide",
  "iSGLT2", "Agonista GLP-1", "Biguanida", "Sulfonilureia", "Insulina", "Estatina", "Antiagregante plaquetário", "Anticoagulante", "Nitrato", "Antiarrítmico",
  "Digitálico", "Vasopressor", "Inotrópico", "Betalactâmico", "Macrolídeo", "Quinolona", "Aminoglicosídeo", "Glicopeptídeo", "Antifúngico", "Antiviral",
  "Corticoide", "AINE", "Opioide", "Analgésico simples", "IBP", "Antiemético", "Broncodilatador β2-agonista", "Anticolinérgico inalatório", "Anti-histamínico",
  "ISRS", "Antipsicótico", "Benzodiazepínico", "Anticonvulsivante", "Hormônio tireoidiano", "Imunossupressor"];
const tipoDe = (f) => (f && TIPOS[f.tipo] ? f.tipo : "doenca");
const secoesDe = (f) => TIPOS[tipoDe(f)].secoes;
const secaoDe = (f, id) => secoesDe(f).find((s) => s.id === id) || null;
const abbrSecao = (f, id) => { const s = secaoDe(f, id); return s ? s.abbr : "sem seção"; };
const temValor = (v) => (Array.isArray(v) ? v.length > 0 : typeof v === "string" ? v.trim() !== "" : v != null);
const textoCampo = (v) => (Array.isArray(v) ? v.join(", ") : String(v));
const camposVisiveis = (tipo, c) => TIPOS[tipo].campos.filter((cp) => !cp.se || cp.se(c || {}));
function limparCampos(tipo, c) {
  const o = {};
  for (const cp of camposVisiveis(tipo, c)) {
    let v = c[cp.id];
    if (typeof v === "string") v = v.trim();
    if (temValor(v)) o[cp.id] = v;
  }
  return o;
}
function resumoCurto(f) {
  const c = f.campos || {}, t = tipoDe(f);
  const partes = t === "medicamento" ? [c.classe, (c.vias || []).join(", ")] : t === "exame" ? [c.categoria, c.amostra] : [c.curso];
  return partes.filter(temValor).join(" · ");
}
const FONTES = ["Aula", "Enfermaria", "Livro", "Plantão", "Outra"];
const ESPECIALIDADES = [
  ["Cardiologia", "Cardio"], ["Pneumologia", "Pneumo"], ["Gastroenterologia", "Gastro"], ["Nefrologia", "Nefro"],
  ["Endocrinologia", "Endócrino"], ["Infectologia", "Infecto"], ["Hematologia", "Hemato"], ["Reumatologia", "Reumato"],
  ["Neurologia", "Neuro"], ["Psiquiatria", "Psiq"], ["Pediatria", "Pediatria"], ["Ginecologia e Obstetrícia", "GO"],
  ["Cirurgia", "Cirurgia"], ["Dermatologia", "Dermato"], ["Emergência", "Emergência"], ["Farmacologia", "Farmaco"],
  ["Semiologia", "Semio"], ["Medicina preventiva", "Preventiva"],
];
const ESCADA = [1, 3, 7, 14, 30, 60, 120];

const fold = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const uid = (p) => p + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const hojeISO = () => iso(new Date());
function addDias(n) { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + n); return iso(d); }
function diasAte(s) {
  if (!s) return 0;
  const [y, m, dd] = String(s).split("-").map(Number);
  const a = new Date(y, m - 1, dd, 12); const b = new Date(); b.setHours(12, 0, 0, 0);
  return Math.round((a - b) / 864e5);
}
function rotuloDias(n) { return n <= 0 ? "hoje" : n === 1 ? "amanhã" : `em ${n} dias`; }
function atraso(prox) {
  const n = diasAte(prox);
  if (n >= 0) return "para hoje";
  return `atrasada ${-n} ${-n === 1 ? "dia" : "dias"}`;
}
function quando(ms) {
  if (!ms) return "";
  const d = new Date(ms), h = new Date(), ontem = new Date();
  ontem.setDate(ontem.getDate() - 1);
  if (iso(d) === iso(h)) return "hoje, " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  if (iso(d) === iso(ontem)) return "ontem";
  const op = d.getFullYear() === h.getFullYear() ? { day: "numeric", month: "short" } : { day: "numeric", month: "short", year: "numeric" };
  return d.toLocaleDateString("pt-BR", op).replace(/ de /g, " ").replace(/\./g, "");
}
const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;

const ESP = new Map(ESPECIALIDADES.map(([n, c], i) => [fold(n), { nome: n, curto: c, tom: (i % 8) + 1 }]));
function espInfo(e) {
  const k = fold(e).trim();
  if (!k) return { nome: "Sem especialidade", curto: "Sem área", tom: 0 };
  const x = ESP.get(k);
  if (x) return x;
  let h = 0; for (const c of k) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return { nome: e, curto: e, tom: (h % 8) + 1 };
}

/* Pistas de seção: palavras que costumam aparecer em cada parte da ficha, por tipo. */
const PEROLAS = ["pegadinha", "cai na prova", "prova", "nao confundir", "cuidado", "atencao", "macete", "mnemonic", "perola", "classico", "classica", "excecao", "dica", "lembrar", "nunca", "sempre"];
const PISTAS = {
  doenca: {
  tto: ["tratamento", "tratar", "trata-se com", "conduta", "manejo", "dose", "posologia", "mg", "prescrev", "iniciar", "suspender", "primeira linha", "1a linha", "droga de escolha", "antibiot", "antimicrobian", "profilaxia", "vacina", "cirurgia indicada", "contraindic", "betabloq", "diuretic", "ieca", "corticoide", "insulina", "analges", "terapia", "reposicao"],
  dx: ["diagnostic", "exame complementar", "laborat", "hemograma", "ecg", "eletrocardiograma", "radiografia", "raio-x", "rx", "tomografia", "ressonancia", "ultrass", "usg", "ecocardiograma", "biopsia", "criterio", "padrao-ouro", "padrao ouro", "sensibilidade", "especificidade", "sorologia", "cultura", "gasometria", "bnp", "troponina", "d-dimero", "escore", "curb", "dosagem", "marcador", "achado"],
  clinica: ["sintoma", "sinal", "sinais", "quadro", "apresenta", "cursa com", "queixa", "ausculta", "sopro", "dor", "febre", "dispneia", "tosse", "edema", "palpa", "inspec", "percuss", "exame fisico", "estertor", "crepita", "turgencia", "manifesta", "paciente com", "leito", "semiolog", "triade", "irradia"],
  fisio: ["fisiopato", "mecanismo", "etiolog", "patogen", "ocorre por", "devido a", "leva a", "ativacao", "receptor", "inflamac", "mediador", "deposito", "obstrucao", "resulta em", "por causa", "remodelamento"],
  def: ["definic", "define-se", "definida", "definido", "conceito", "caracteriza-se", "consiste em", "classificac", "e uma sindrome", "e uma doenca", "e um tipo", "sindrome clinica"],
  perolas: ["pegadinha", "cai na prova", "prova", "nao confundir", "cuidado", "atencao", "macete", "mnemonic", "perola", "classico", "classica", "excecao", "dica", "lembrar", "nunca", "sempre"],
},
  medicamento: {
    mec: ["mecanismo", "inibe", "inibidor", "bloqueia", "bloqueador", "antagonista", "agonista", "receptor", "enzima", "canal", "cotransportador", "bomba", "age no", "age na", "atua"],
    indic: ["indicad", "indicacao", "usado em", "usada em", "usar em", "uso em", "tratamento de", "primeira linha", "droga de escolha", "profilaxia"],
    dose: ["dose", "posologia", "mg", "mcg", "ui", "mg/kg", "ataque", "manutencao", "vezes ao dia", "12/12", "8/8", "6/6", "24/24", "infusao", "diluir", "bolus", "titular"],
    ea: ["efeito adverso", "efeitos adversos", "colateral", "toxicidade", "hipotensao", "bradicardia", "hipercalemia", "hipocalemia", "hiponatremia", "tosse", "angioedema", "sangramento", "nefrotox", "hepatotox", "ototox", "rash", "nausea"],
    ci: ["contraindic", "nao usar", "evitar", "gestante", "gravidez", "alergia", "hipersensibilidade"],
    inter: ["interacao", "interage", "associado a", "associar", "potencializa", "cyp", "indutor", "inibidor enzimatico", "aumenta o nivel", "reduz o nivel", "junto com"],
    perolas: PEROLAS,
  },
  exame: {
    indic: ["indicad", "indicacao", "pedir", "solicitar", "rastreio", "rastreamento", "suspeita", "serve para", "avalia"],
    preparo: ["jejum", "preparo", "coleta", "coletar", "tubo", "suspender", "horas antes", "repouso", "bexiga cheia", "garrote"],
    ref: ["referencia", "normal", "valor de", "valores", "faixa", "mg/dl", "meq/l", "g/dl", "mmol", "pg/ml", "ng/ml", "ui/l", "/mm3"],
    interp: ["interpret", "indica", "sugere", "sugestivo", "padrao", "achado", "laudo", "compativel", "sinal de", "preditivo"],
    causas: ["aumenta em", "aumentado em", "elevado em", "eleva", "diminui em", "reduzido em", "baixo em", "causas"],
    limites: ["falso positivo", "falso negativo", "falso-positivo", "falso-negativo", "limitac", "interfer", "nao exclui", "nao afasta"],
    perolas: PEROLAS,
  },
};
const PISTAS_RE = {};
for (const [tipo, mapa] of Object.entries(PISTAS)) {
  PISTAS_RE[tipo] = Object.entries(mapa).map(([sec, lista]) => [sec, lista.map((p) => new RegExp("(^|[^a-z0-9])" + esc(p) + (p.length <= 3 ? "($|[^a-z0-9])" : "")))]);
}
function sugerirSecao(texto, tipo) {
  const t = fold(texto);
  if (t.trim().length < 3) return null;
  let melhor = null, pontos = 0;
  for (const [sec, res] of PISTAS_RE[tipo] || PISTAS_RE.doenca) {
    let s = 0; for (const re of res) if (re.test(t)) s++;
    if (s > pontos) { pontos = s; melhor = sec; }
  }
  return melhor;
}
function termosDaFicha(f) { return [f.nome, ...(f.sinonimos || [])].map((x) => fold(x).trim()).filter((x) => x.length >= 2); }
function sugerirFichas(texto, lista) {
  const t = fold(texto);
  if (t.trim().length < 2) return [];
  const achados = [];
  for (const f of lista) {
    let pos = Infinity;
    for (const k of termosDaFicha(f)) {
      const m = new RegExp("(^|[^a-z0-9])" + esc(k) + "($|[^a-z0-9])").exec(t);
      if (m && m.index < pos) pos = m.index;
    }
    if (pos < Infinity) achados.push([pos, f]);
  }
  return achados.sort((a, b) => a[0] - b[0]).map((x) => x[1]).slice(0, 3);
}
function nomeProvavel(texto) {
  const linha = String(texto || "").trim().split("\n")[0];
  const m = /^([^:–—\n]{3,48})\s*[:–—]/.exec(linha);
  return m ? m[1].trim() : "";
}
function acharFicha(lista, nome) {
  const k = fold(nome).trim();
  return lista.find((f) => termosDaFicha(f).includes(k)) || null;
}
function proximaRev(rev, nota) {
  const p = rev && Number.isFinite(rev.passo) ? rev.passo : 0;
  const np = nota === "esqueci" ? 0 : nota === "parcial" ? p : Math.min(ESCADA.length - 1, p + 1);
  return { passo: np, proxima: addDias(ESCADA[np]), vezes: ((rev && rev.vezes) || 0) + 1, ultima: Date.now() };
}

/* ================= conveniências locais ================= */
const LS = {
  get(k, def) { try { const v = localStorage.getItem(k); return v == null ? def : JSON.parse(v); } catch (e) { return def; } },
  set(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
};

/* ================= dados ================= */
/* Tudo fica num arquivo só, na pasta privada do app. Cada mudança regrava o arquivo inteiro de forma
   atômica (arquivo novo + troca de nome): ou vale a versão nova, ou continua a anterior.
   Apagar deixa um registro com a data ("apagados"), para que a importação no outro aparelho apague também. */
const CHAVE = "fichario";
const Disco = {
  ler() {
    try { return window.Android ? window.Android.ler(CHAVE) || "" : localStorage.getItem("fichario.dados") || ""; }
    catch (e) { return ""; }
  },
  guardar(nome, s) {
    try {
      if (window.Android) return !!window.Android.guardar(nome, s);
      localStorage.setItem(nome === CHAVE ? "fichario.dados" : "fichario." + nome, s);
      return true;
    } catch (e) { return false; }
  },
};
const store = {
  fichas: new Map(), notas: new Map(), apagados: {}, meta: {},
  ver: 0, toast: null, falhaDisco: false, falhaLeitura: false, abrirNota: null, importacao: null,
};
const ouvintes = new Set();
function mudou() { store.ver++; ouvintes.forEach((f) => f()); }
function useStore() {
  const [, f] = useState(0);
  useEffect(() => { const l = () => f((x) => x + 1); ouvintes.add(l); return () => ouvintes.delete(l); }, []);
  return store;
}
let toastTimer = 0;
function aviso(msg) {
  store.toast = { msg, id: Date.now() }; mudou();
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { store.toast = null; mudou(); }, 3200);
}

const semMeta = (x) => { const r = Object.assign({}, x); delete r.id; delete r._pend; return r; };
const paraMapa = (o) => new Map(Object.entries(o && typeof o === "object" ? o : {})
  .filter(([id, d]) => d && typeof d === "object" && /^[A-Za-z0-9_.~:@+-]{1,120}$/.test(id))
  .map(([id, d]) => [id, Object.assign({}, d, { id })]));
const paraObjeto = (m) => { const o = {}; for (const [id, d] of m) o[id] = semMeta(d); return o; };
const carimbo = (d) => (d && (d.atualizadaEm || d.criadaEm)) || 0;
function serializar() {
  return { app: "fichario-medico", formato: 1, salvoEm: Date.now(), fichas: paraObjeto(store.fichas), notas: paraObjeto(store.notas), apagados: store.apagados, meta: store.meta };
}
function salvarAgora() {
  const falhou = !Disco.guardar(CHAVE, JSON.stringify(serializar()));
  if (falhou !== store.falhaDisco) { store.falhaDisco = falhou; mudou(); }
}
let salvarMarcado = false;
function agendarSalvar() {
  if (salvarMarcado) return;
  salvarMarcado = true;
  Promise.resolve().then(() => { if (salvarMarcado) { salvarMarcado = false; salvarAgora(); } });
}
function gravar(path, data) {
  const [col, id] = path.split("/");
  const m = col === "fichas" ? store.fichas : store.notas;
  if (data) {
    const d = JSON.parse(JSON.stringify(semMeta(data)));
    d.atualizadaEm = Date.now();
    m.set(id, Object.assign(d, { id }));
    delete store.apagados[path];
  } else {
    m.delete(id);
    store.apagados[path] = Date.now();
  }
  agendarSalvar(); mudou();
}
function carregar() {
  const txt = Disco.ler();
  if (!txt) { semearExemplos(); salvarAgora(); return; }
  try {
    const o = JSON.parse(txt);
    store.fichas = paraMapa(o.fichas);
    store.notas = paraMapa(o.notas);
    store.apagados = o.apagados && typeof o.apagados === "object" ? o.apagados : {};
    store.meta = o.meta && typeof o.meta === "object" ? o.meta : {};
    const limite = Date.now() - 400 * 864e5;
    for (const k of Object.keys(store.apagados)) if (!(store.apagados[k] > limite)) delete store.apagados[k];
  } catch (e) {
    Disco.guardar("fichario-ilegivel-" + Date.now(), txt);
    store.falhaLeitura = true;
  }
}

/* ---------- importar e exportar ---------- */
const valido = { fichas: (d) => typeof d.nome === "string" && d.nome.trim(), notas: (d) => typeof d.texto === "string" };
function mesclar(o) {
  const r = { fichasNovas: 0, novas: 0, atualizadas: 0, apagadas: 0 };
  const ap = Object.assign({}, store.apagados);
  for (const [k, ts] of Object.entries(o.apagados && typeof o.apagados === "object" ? o.apagados : {})) {
    if (typeof ts === "number" && /^(fichas|notas)\//.test(k) && !(ap[k] >= ts)) ap[k] = ts;
  }
  for (const col of ["fichas", "notas"]) {
    const m = store[col];
    for (const [id, doc] of paraMapa(o[col])) {
      if (!valido[col](doc)) continue;
      const k = col + "/" + id;
      if (ap[k] && ap[k] >= carimbo(doc)) continue;
      const atual = m.get(id);
      if (!atual) { m.set(id, doc); if (col === "notas") r.novas++; else r.fichasNovas++; }
      else if (carimbo(atual) < carimbo(doc)) { m.set(id, doc); r.atualizadas++; }
    }
    for (const [k, ts] of Object.entries(ap)) {
      const [c, id] = k.split("/");
      if (c !== col) continue;
      const atual = m.get(id);
      if (atual && carimbo(atual) <= ts) { m.delete(id); r.apagadas++; }
    }
  }
  store.apagados = ap;
  store.meta = Object.assign({}, store.meta, { importadoEm: Date.now() });
  salvarAgora(); mudou();
  return r;
}
function resumoImportacao(r) {
  const p = [];
  if (r.fichasNovas) p.push(plural(r.fichasNovas, "ficha nova", "fichas novas"));
  if (r.novas) p.push(plural(r.novas, "nota nova", "notas novas"));
  if (r.atualizadas) p.push(plural(r.atualizadas, "item atualizado", "itens atualizados"));
  if (r.apagadas) p.push(plural(r.apagadas, "item apagado", "itens apagados"));
  return p.length ? "Importado: " + p.join(", ") + "." : "Importado. Os dois fichários já estavam iguais.";
}
function exportar(modo) {
  store.meta = Object.assign({}, store.meta, { enviadoEm: Date.now() });
  const txt = JSON.stringify(serializar());
  salvarAgora(); mudou();
  const nome = "fichario-" + hojeISO() + ".json";
  if (!window.Android) { aviso("Enviar e salvar arquivo funcionam no app instalado."); return; }
  if (modo === "enviar") window.Android.compartilharArquivo(nome, txt);
  else window.Android.salvarComo(nome, txt);
}
/* O app Android chama isto quando chega algo de fora: um arquivo aberto ou compartilhado, ou um texto. */
window.__chegou = function () {
  let itens = [];
  try { itens = JSON.parse(window.Android.pendentes()); } catch (e) { return; }
  for (const it of itens) {
    if (it.tipo === "texto") { store.abrirNota = { texto: String(it.texto || "").trim() }; mudou(); continue; }
    let o = null;
    try { o = JSON.parse(it.texto); } catch (e) { o = null; }
    if (!o || o.app !== "fichario-medico") { aviso(`“${it.nome}” não é um arquivo do Fichário.`); continue; }
    const r = mesclar(o);
    store.importacao = Object.assign({ nome: it.nome, em: Date.now() }, r);
    aviso(resumoImportacao(r));
  }
};
window.__pausa = function () { if (salvarMarcado) { salvarMarcado = false; salvarAgora(); } };
function aplicarTema() {
  if (!window.Android) return;
  let escuro = false;
  try { escuro = !!window.Android.escuro(); } catch (e) {}
  document.documentElement.setAttribute("data-theme", escuro ? "dark" : "light");
  const cs = getComputedStyle(document.documentElement);
  try { window.Android.barras(cs.getPropertyValue("--bg").trim(), cs.getPropertyValue("--surface").trim(), !escuro); } catch (e) {}
}
window.__tema = aplicarTema;

function semearExemplos() {
  const agora = Date.now(), dia = 864e5;
  const t = (dias, min) => agora - dias * dia + (min || 0) * 6e4;
  const ficha = (id, d) => store.fichas.set(id, Object.assign(d, { id, v: 1, exemplo: true }));
  const nota = (id, fichaId, secao, fonte, quando, texto) => store.notas.set(id, { id, texto, fonte, fichaId, secao, criadaEm: quando, atualizadaEm: quando, v: 1, exemplo: true });
  ficha("ex-ic", { nome: "Insuficiência cardíaca", especialidade: "Cardiologia", sinonimos: ["IC", "ICC"], diferenciais: ["DPOC exacerbada", "Tromboembolismo pulmonar", "Síndrome nefrótica"], criadaEm: t(3), atualizadaEm: t(3), rev: { passo: 1, proxima: hojeISO(), vezes: 1, ultima: t(3) } });
  ficha("ex-pac", { nome: "Pneumonia adquirida na comunidade", especialidade: "Pneumologia", sinonimos: ["PAC"], diferenciais: ["Insuficiência cardíaca", "Tromboembolismo pulmonar", "Tuberculose pulmonar"], criadaEm: t(2), atualizadaEm: t(2), rev: { passo: 0, proxima: addDias(1), vezes: 0, ultima: null } });
  nota("ex-ic-def", "ex-ic", "def", "Aula", t(3), "Síndrome em que o coração não consegue manter o débito adequado às necessidades do corpo, ou só consegue à custa de pressões de enchimento elevadas.");
  nota("ex-ic-fisio", "ex-ic", "fisio", "Livro", t(3, 20), "A queda do débito ativa o sistema renina-angiotensina-aldosterona e o simpático. No começo isso compensa; com o tempo, causa remodelamento ventricular e piora a função. Por isso os remédios que reduzem mortalidade bloqueiam esses sistemas.");
  nota("ex-ic-dx", "ex-ic", "dx", "Aula", t(3, 21), "O ecocardiograma classifica pela fração de ejeção (FE): reduzida ≤ 40%, levemente reduzida 41–49%, preservada ≥ 50%.\nBNP ou NT-proBNP normais tornam IC improvável.");
  nota("ex-ic-tto", "ex-ic", "tto", "Aula", t(3, 22), "IC com FE reduzida, os 4 pilares que reduzem mortalidade:\n- IECA/BRA ou sacubitril-valsartana\n- betabloqueador (carvedilol, bisoprolol ou succinato de metoprolol)\n- espironolactona\n- iSGLT2 (dapagliflozina ou empagliflozina)");
  nota("ex-ic-perola", "ex-ic", "perolas", "Aula", t(3, 23), "Diurético de alça alivia a congestão, mas não reduz mortalidade. Pegadinha clássica de prova.");
  nota("ex-ic-clin", "ex-ic", "clinica", "Enfermaria", t(1, -300), "Paciente da enfermaria: dispneia aos esforços, ortopneia e dispneia paroxística noturna. Ao exame, turgência jugular a 45°, B3, estertores em bases e edema de membros inferiores.");
  nota("ex-pac-clin", "ex-pac", "clinica", "Enfermaria", t(2), "Febre, tosse produtiva e dor pleurítica. Na ausculta, estertores crepitantes localizados e, às vezes, sopro tubário.");
  nota("ex-pac-dx", "ex-pac", "dx", "Aula", t(2, 25), "CURB-65: Confusão, Ureia > 50 mg/dL, FR ≥ 30 irpm, PAS < 90 ou PAD ≤ 60 mmHg, idade ≥ 65 anos.\n0–1 ponto: tratar em casa. 2: considerar internação. 3 ou mais: internar; com 4–5, avaliar UTI.");
  nota("ex-cx-1", null, null, "Enfermaria", t(1), "Estenose aórtica: tríade clássica de angina, síncope e dispneia. Sopro sistólico ejetivo em foco aórtico, irradiando para as carótidas.");
  nota("ex-cx-2", null, null, "Aula", t(0, -60), "Tratamento da PAC em paciente com comorbidade (DPOC, diabetes, IC): betalactâmico + macrolídeo, ou quinolona respiratória sozinha.");
  ficha("ex-furo", { tipo: "medicamento", nome: "Furosemida", especialidade: "Cardiologia", sinonimos: ["Lasix"], diferenciais: ["Insuficiência cardíaca", "Síndrome nefrótica"],
    campos: { classe: "Diurético de alça", vias: ["VO", "IV"], gestacao: "C", receita: "Simples", monitorar: ["Função renal", "Potássio", "Sódio"] },
    criadaEm: t(2, 40), atualizadaEm: t(2, 40), rev: { passo: 0, proxima: addDias(2), vezes: 0, ultima: null } });
  nota("ex-furo-mec", "ex-furo", "mec", "Aula", t(2, 40), "Inibe o cotransportador Na-K-2Cl no ramo ascendente espesso da alça de Henle.");
  nota("ex-furo-ea", "ex-furo", "ea", "Livro", t(2, 41), "Hipocalemia, hiponatremia, alcalose metabólica, hiperuricemia e ototoxicidade (mais com dose alta IV feita rápido).");
  ficha("ex-bnp", { tipo: "exame", nome: "BNP", especialidade: "Cardiologia", sinonimos: ["NT-proBNP", "Peptídeo natriurético tipo B"], diferenciais: ["Insuficiência cardíaca"],
    campos: { categoria: "Laboratório", amostra: "Sangue venoso", jejum: "Não precisa", referencia: "IC improvável no quadro agudo: BNP < 100 pg/mL ou NT-proBNP < 300 pg/mL" },
    criadaEm: t(1, 30), atualizadaEm: t(1, 30), rev: { passo: 0, proxima: addDias(1), vezes: 0, ultima: null } });
  nota("ex-bnp-interp", "ex-bnp", "interp", "Aula", t(1, 30), "Valor preditivo negativo alto: BNP normal praticamente afasta IC como causa da dispneia.");
  nota("ex-bnp-lim", "ex-bnp", "limites", "Livro", t(1, 31), "Obesidade baixa o BNP (falso negativo). Idade avançada, insuficiência renal e fibrilação atrial elevam (falso positivo).");
  nota("ex-bnp-perola", "ex-bnp", "perolas", "Aula", t(1, 32), "Em uso de sacubitril-valsartana, prefira o NT-proBNP: o BNP sobe porque a neprilisina, que o degrada, está inibida.");
}

let memo = { ver: -1 };
function dados() {
  if (memo.ver === store.ver) return memo;
  const fichas = store.fichas, notas = store.notas;
  const porFicha = new Map(), caixa = [];
  for (const n of notas.values()) {
    if (n.fichaId && fichas.has(n.fichaId)) {
      if (!porFicha.has(n.fichaId)) porFicha.set(n.fichaId, []);
      porFicha.get(n.fichaId).push(n);
    } else caixa.push(n);
  }
  const porData = (a, b) => (a.criadaEm || 0) - (b.criadaEm || 0);
  for (const arr of porFicha.values()) arr.sort(porData);
  caixa.sort(porData);
  const lista = [...fichas.values()].sort((a, b) => String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR"));
  const hoje = hojeISO();
  const comNotas = (f) => (porFicha.get(f.id) || []).length > 0;
  const devidas = lista.filter((f) => f.rev && f.rev.proxima && f.rev.proxima <= hoje && comNotas(f))
    .sort((a, b) => a.rev.proxima.localeCompare(b.rev.proxima));
  const futuras = lista.filter((f) => f.rev && f.rev.proxima && f.rev.proxima > hoje && comNotas(f))
    .sort((a, b) => a.rev.proxima.localeCompare(b.rev.proxima));
  const recentes = [...notas.values()].sort((a, b) => (b.atualizadaEm || b.criadaEm || 0) - (a.atualizadaEm || a.criadaEm || 0)).slice(0, 6);
  const atividade = new Map();
  for (const [fid, arr] of porFicha) atividade.set(fid, Math.max(...arr.map((n) => n.atualizadaEm || n.criadaEm || 0)));
  const temExemplos = [...fichas.values(), ...notas.values()].some((x) => x.exemplo);
  memo = { ver: store.ver, fichas, notas, porFicha, caixa, lista, devidas, proxima: futuras[0] || null, recentes, atividade, temExemplos };
  return memo;
}

/* ---------- operações ---------- */
function novidade(fichaId) {
  const f = dados().fichas.get(fichaId);
  if (!f) return;
  let rev = f.rev;
  if (!rev) rev = { passo: 0, proxima: addDias(1), vezes: 0, ultima: null };
  else if (diasAte(rev.proxima) > 3) rev = Object.assign({}, rev, { proxima: addDias(3) });
  /* grava sempre: a ficha que recebeu nota conta como mexida agora, e vence um "apagar" mais antigo vindo do outro aparelho */
  gravar("fichas/" + fichaId, Object.assign(semMeta(f), { rev }));
}
function novaNota({ texto, fonte, fichaId, secao }) {
  const id = uid("n"), agora = Date.now();
  gravar("notas/" + id, { texto, fonte, fichaId: fichaId || null, secao: fichaId ? secao : null, criadaEm: agora, atualizadaEm: agora, v: 1 });
  if (fichaId) novidade(fichaId);
  return id;
}
function editarNota(nota, patch) {
  const antes = nota.fichaId;
  const n = Object.assign(semMeta(nota), patch, { atualizadaEm: Date.now() });
  if (!n.fichaId) { n.fichaId = null; n.secao = null; }
  gravar("notas/" + nota.id, n);
  if (n.fichaId && n.fichaId !== antes) novidade(n.fichaId);
}
function apagarNota(nota) { gravar("notas/" + nota.id, null); }
function novaFicha({ nome, especialidade, sinonimos, diferenciais, tipo, campos }) {
  const id = uid("f");
  gravar("fichas/" + id, { tipo: TIPOS[tipo] ? tipo : "doenca", nome, especialidade: especialidade || "", sinonimos: sinonimos || [], diferenciais: diferenciais || [], campos: campos || {}, criadaEm: Date.now(), rev: null, v: 1 });
  return id;
}
function revisarFicha(f, nota) { gravar("fichas/" + f.id, Object.assign(semMeta(f), { rev: proximaRev(f.rev, nota) })); }
function apagarFicha(f) {
  const d = dados();
  for (const n of d.porFicha.get(f.id) || []) gravar("notas/" + n.id, Object.assign(semMeta(n), { fichaId: null, secao: null, atualizadaEm: Date.now() }));
  gravar("fichas/" + f.id, null);
}
function apagarExemplos() {
  const d = dados();
  for (const n of d.notas.values()) {
    if (n.exemplo) gravar("notas/" + n.id, null);
    else if (n.fichaId && d.fichas.get(n.fichaId) && d.fichas.get(n.fichaId).exemplo) gravar("notas/" + n.id, Object.assign(semMeta(n), { fichaId: null, secao: null }));
  }
  for (const f of d.fichas.values()) if (f.exemplo) gravar("fichas/" + f.id, null);
}
function fichaComoTexto(f, notas) {
  const tipo = tipoDe(f), T = TIPOS[tipo], c = f.campos || {};
  let s = `${f.nome}\n${T.nome}${f.especialidade ? " · " + f.especialidade : ""}\n`;
  if ((f.sinonimos || []).length) s += `${T.prefixoSin}: ${f.sinonimos.join(", ")}\n`;
  for (const cp of camposVisiveis(tipo, c)) if (temValor(c[cp.id])) s += `${cp.nome}: ${textoCampo(c[cp.id])}\n`;
  for (const sec of T.secoes) {
    const ns = notas.filter((n) => n.secao === sec.id);
    if (!ns.length) continue;
    s += `\n${sec.nome.toUpperCase()}\n`;
    for (const n of ns) s += `- ${String(n.texto).replace(/\n/g, "\n  ")}\n`;
  }
  if ((f.diferenciais || []).length) s += `\n${T.rotuloLig.toUpperCase()}\n${f.diferenciais.join(", ")}\n`;
  return s.trim();
}
const listaDeTexto = (s) => [...new Set(String(s || "").split(/[,;\n]/).map((x) => x.trim()).filter(Boolean))];

/* ================= interface ================= */
function ico(n) {
  switch (n) {
    case "mais": return html`<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>`;
    case "hoje": return html`<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>`;
    case "fichas": return html`<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5A1.5 1.5 0 0 1 5.5 8H10l1.5 2h7A1.5 1.5 0 0 1 20 11.5v7a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5z"/><path d="M6.5 5h11"/></svg>`;
    case "busca": return html`<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/></svg>`;
    case "backup": return html`<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4v13M3.5 13.5 7 17l3.5-3.5M17 20V7M13.5 10.5 17 7l3.5 3.5"/></svg>`;
    case "voltar": return html`<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>`;
    case "x": return html`<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>`;
    default: return null;
  }
}
function Marca() {
  return html`<svg viewBox="0 0 32 32" aria-hidden="true"><path class="m-card" d="M4 10a2.5 2.5 0 0 1 2.5-2.5h6.2l2.3 3h10.5A2.5 2.5 0 0 1 28 13v11.5a2.5 2.5 0 0 1-2.5 2.5h-19A2.5 2.5 0 0 1 4 24.5z"/><path class="m-risco" d="M9.5 17h13M9.5 21.5h8"/></svg>`;
}
function Aba({ esp }) {
  const i = espInfo(esp);
  return html`<span class="aba" style=${`--tom: var(--t${i.tom})`}>${i.curto}</span>`;
}
function useMedia(q) {
  const [m, setM] = useState(() => window.matchMedia(q).matches);
  useEffect(() => {
    const mq = window.matchMedia(q), f = () => setM(mq.matches);
    if (mq.addEventListener) mq.addEventListener("change", f); else mq.addListener(f);
    return () => { if (mq.removeEventListener) mq.removeEventListener("change", f); else mq.removeListener(f); };
  }, [q]);
  return m;
}
const reduzMovimento = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const topo = () => window.scrollTo({ top: 0 });

const ABAS = [
  { id: "hoje", nome: "Hoje", ico: "hoje" },
  { id: "fichas", nome: "Fichas", ico: "fichas" },
  { id: "buscar", nome: "Buscar", ico: "busca" },
  { id: "backup", nome: "Backup", ico: "backup" },
];

function App() {
  useStore();
  const d = dados();
  const [aba, setAbaBruta] = useState(() => { const a = LS.get("fichario.aba", "hoje"); return ABAS.some((x) => x.id === a) ? a : "hoje"; });
  const [fichaId, setFichaId] = useState(null);
  const [foco, setFoco] = useState(null);
  const [rev, setRev] = useState(null);
  const [folha, setFolha] = useState(null);
  const largo = useMedia("(min-width: 1080px)");

  const nav = {
    setAba(a) {
      if (a === "fichas" && aba === "fichas" && !rev) setFichaId(null);
      setAbaBruta(a); LS.set("fichario.aba", a); setRev(null); topo();
    },
    abrirFicha(id, secao) {
      setRev(null); setAbaBruta("fichas"); LS.set("fichario.aba", "fichas");
      setFichaId(id); setFoco(secao || null); if (!secao) topo();
    },
    fecharFicha() { setFichaId(null); topo(); },
    anotar(preset) { setFolha({ tipo: "nota", preset: preset || null, k: Date.now() }); },
    editarNota(nota) { setFolha({ tipo: "nota", nota, k: Date.now() }); },
    encaixar() { setFolha({ tipo: "encaixar" }); },
    novaFicha(preset) { setFolha({ tipo: "ficha", preset: preset || null }); },
    editarFicha(ficha) { setFolha({ tipo: "ficha", ficha }); },
    copiar(texto) { setFolha({ tipo: "copiar", texto }); },
    revisar(ids) { setRev({ fila: ids, i: 0 }); topo(); },
    fecharFolha() { setFolha(null); },
  };

  const ficha = fichaId ? d.fichas.get(fichaId) : null;
  useEffect(() => { if (fichaId && !ficha) setFichaId(null); }, [fichaId, ficha]);
  useEffect(() => {
    if (!store.abrirNota) return;
    const p = store.abrirNota; store.abrirNota = null;
    setRev(null); setFolha({ tipo: "nota", preset: p, k: Date.now() });
  });
  /* botão voltar do Android: fecha o painel, sai da revisão, volta da ficha para a lista, depois para Hoje */
  window.__voltar = () => {
    if (pilhaFolhas.length) { pilhaFolhas[pilhaFolhas.length - 1](); return true; }
    if (rev) { setRev(null); return true; }
    if (aba === "fichas" && fichaId && !largo) { setFichaId(null); topo(); return true; }
    if (aba !== "hoje") { nav.setAba("hoje"); return true; }
    return false;
  };

  let conteudo;
  if (rev) conteudo = html`<${Revisao} d=${d} rev=${rev} setRev=${setRev} nav=${nav}/>`;
  else if (aba === "hoje") conteudo = html`<${Hoje} d=${d} nav=${nav}/>`;
  else if (aba === "buscar") conteudo = html`<${Buscar} d=${d} nav=${nav}/>`;
  else if (aba === "backup") conteudo = html`<${Backup} d=${d}/>`;
  else if (largo) conteudo = html`<div class="split">
      <${ListaFichas} d=${d} nav=${nav} sel=${fichaId}/>
      ${ficha ? html`<${FichaView} key=${ficha.id} f=${ficha} d=${d} nav=${nav} foco=${foco} setFoco=${setFoco} largo=${true}/>`
              : html`<div class="split-vazio"><p>Escolha uma ficha na lista para ver as anotações dela.</p></div>`}
    </div>`;
  else conteudo = ficha
    ? html`<${FichaView} key=${ficha.id} f=${ficha} d=${d} nav=${nav} foco=${foco} setFoco=${setFoco} largo=${false}/>`
    : html`<${ListaFichas} d=${d} nav=${nav} sel=${null}/>`;

  const contagemHoje = d.caixa.length + d.devidas.length;
  const atual = rev ? null : aba;

  let painel = null;
  if (folha) {
    if (folha.tipo === "nota") painel = html`<${EditorNota} key=${folha.k} d=${d} nota=${folha.nota} preset=${folha.preset} nav=${nav}/>`;
    else if (folha.tipo === "encaixar") painel = html`<${Encaixar} d=${d} nav=${nav}/>`;
    else if (folha.tipo === "ficha") painel = html`<${FormFicha} d=${d} ficha=${folha.ficha} preset=${folha.preset} nav=${nav}/>`;
    else if (folha.tipo === "copiar") painel = html`<${Copiar} texto=${folha.texto} nav=${nav}/>`;
  }

  return html`<div class="app">
    <aside class="trilho">
      <div class="marca"><${Marca}/><span>Fichário</span></div>
      <button class="btn primario largo" onClick=${() => nav.anotar()}>${ico("mais")} Anotar</button>
      <nav class="trilho-nav" aria-label="Seções do app">
        ${ABAS.map((a) => html`<button key=${a.id} class="trilho-item" aria-current=${atual === a.id ? "page" : undefined} onClick=${() => nav.setAba(a.id)}>
          ${ico(a.ico)}<span>${a.nome}</span>${a.id === "hoje" && contagemHoje ? html`<span class="badge">${contagemHoje}</span>` : null}
        </button>`)}
      </nav>
      <p class="trilho-dica">Ctrl + Enter salva a nota quando há teclado.</p>
    </aside>
    <main class="main">
      <${Avisos}/>
      ${conteudo}
    </main>
    <nav class="barra" aria-label="Seções do app">
      ${ABAS.map((a) => html`<button key=${a.id} class="barra-item" aria-current=${atual === a.id ? "page" : undefined} onClick=${() => nav.setAba(a.id)}>
        ${ico(a.ico)}<span>${a.nome}</span>${a.id === "hoje" && contagemHoje ? html`<span class="badge">${contagemHoje}</span>` : null}
      </button>`)}
    </nav>
    ${!rev && !folha ? html`<button class="fab" onClick=${() => nav.anotar(aba === "fichas" && ficha ? { fichaId: ficha.id } : null)}>${ico("mais")} Anotar</button>` : null}
    ${painel}
    ${store.toast ? html`<div class="toast" role="status" key=${store.toast.id}>${store.toast.msg}</div>` : null}
  </div>`;
}

function Avisos() {
  if (store.falhaDisco) return html`<div class="aviso erro"><p>Não consegui salvar no aparelho. Verifique se há espaço livre. O que está na tela continua aqui enquanto o app estiver aberto.</p><button class="btn" onClick=${() => salvarAgora()}>Tentar de novo</button></div>`;
  if (store.falhaLeitura) return html`<div class="aviso erro"><p>O arquivo do fichário estava danificado e não pôde ser lido. Uma cópia dele ficou guardada no aparelho. Se você tem um arquivo enviado antes, importe-o em Backup.</p><button class="btn" onClick=${() => { store.falhaLeitura = false; mudou(); }}>Entendi</button></div>`;
  return null;
}

/* ---------- Hoje ---------- */
function Hoje({ d, nav }) {
  const carregando = false;
  const vazio = !carregando && d.fichas.size === 0 && d.notas.size === 0;
  const data = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
  const [confirmar, setConfirmar] = useState(false);
  return html`<div class="view">
    <header class="vhead"><div><p class="eyebrow">${data}</p><h1 class="vtitle">Hoje</h1></div></header>
    ${carregando ? html`<p class="muted">Carregando suas fichas…</p>`
    : vazio ? html`<section class="bloco boas-vindas">
        <div class="bloco-cabeca"><h2>Seu fichário está vazio</h2></div>
        <ol class="passos">
          <li><b>Anote</b><span>Toque em Anotar e escreva como numa nota. Não precisa decidir onde guardar.</span></li>
          <li><b>Encaixe</b><span>Depois, mande cada nota para uma ficha (a doença, o sinal, a droga) e para uma seção: Def, Fisiopato, Clínica, Dx, Tto ou Pérolas.</span></li>
          <li><b>Revise</b><span>A ficha volta aqui no dia de revisar: amanhã, em 3 dias, em 7, em 14…</span></li>
        </ol>
        <button class="btn primario" onClick=${() => nav.anotar()}>${ico("mais")} Escrever a primeira nota</button>
      </section>`
    : html`<div class="hoje-grade">
        <section class="bloco">
          <div class="bloco-cabeca"><h2>Caixa de entrada</h2><span class=${"contador" + (d.caixa.length ? " quente" : "")}>${d.caixa.length}</span></div>
          ${d.caixa.length ? html`
            <ul class="previas">${d.caixa.slice(0, 3).map((n) => html`<li key=${n.id}>
              <button class="previa" onClick=${() => nav.editarNota(n)}><span class="previa-texto">${n.texto}</span><span class="meta">${n.fonte ? n.fonte + " · " : ""}${quando(n.criadaEm)}</span></button>
            </li>`)}</ul>
            ${d.caixa.length > 3 ? html`<p class="meta">e mais ${d.caixa.length - 3}</p>` : null}
            <button class="btn primario largo" onClick=${nav.encaixar}>${d.caixa.length === 1 ? "Encaixar a nota" : `Encaixar as ${d.caixa.length} notas`}</button>`
          : html`<p class="muted">Vazia. Tudo o que você anotou já está nas fichas.</p>`}
        </section>
        <section class="bloco">
          <div class="bloco-cabeca"><h2>Revisar hoje</h2><span class=${"contador" + (d.devidas.length ? " quente" : "")}>${d.devidas.length}</span></div>
          ${d.devidas.length ? html`
            <ul class="linhas">${d.devidas.map((f) => html`<li key=${f.id}>
              <button class="linha" onClick=${() => nav.revisar([f.id])}>
                <span class="linha-nome">${f.nome}</span><span class="meta">${atraso(f.rev.proxima)}</span>
                <span class="linha-sub"><${Aba} esp=${f.especialidade}/><span class="meta">${plural((d.porFicha.get(f.id) || []).length, "nota", "notas")}</span></span>
              </button>
            </li>`)}</ul>
            <button class="btn primario largo" onClick=${() => nav.revisar(d.devidas.map((f) => f.id))}>${d.devidas.length === 1 ? "Revisar a ficha" : `Revisar as ${d.devidas.length} fichas`}</button>`
          : html`<p class="muted">Nada para revisar hoje.${d.proxima ? ` Próxima: ${d.proxima.nome}, ${rotuloDias(diasAte(d.proxima.rev.proxima))}.` : ""}</p>`}
        </section>
      </div>
      ${d.recentes.length ? html`<section class="bloco">
        <div class="bloco-cabeca"><h2>Anotado por último</h2></div>
        <ul class="linhas">${d.recentes.map((n) => {
          const f = n.fichaId ? d.fichas.get(n.fichaId) : null;
          return html`<li key=${n.id}><button class="linha" onClick=${() => (f ? nav.abrirFicha(f.id, n.secao) : nav.editarNota(n))}>
            <span class="clamp2">${n.texto}</span><span class="meta">${quando(n.atualizadaEm || n.criadaEm)}</span>
            <span class="linha-sub">${f ? html`<${Aba} esp=${f.especialidade}/><span class="meta">${f.nome} › ${abbrSecao(f, n.secao)}</span>` : html`<span class="meta">Caixa de entrada</span>`}</span>
          </button></li>`;
        })}</ul>
      </section>` : null}
      ${d.temExemplos ? html`<div class="exemplos">
        ${confirmar
          ? html`<p>Apagar as fichas e notas de exemplo? Notas suas que estiverem nelas voltam para a caixa de entrada.</p>
                 <button class="btn perigo armado" onClick=${() => { apagarExemplos(); setConfirmar(false); aviso("Exemplos apagados."); }}>Apagar exemplos</button>
                 <button class="btn" onClick=${() => setConfirmar(false)}>Manter</button>`
          : html`<p>Os itens marcados com <span class="selo">exemplo</span> mostram como o fichário funciona.</p>
                 <button class="btn" onClick=${() => setConfirmar(true)}>Apagar exemplos</button>`}
      </div>` : null}`}
  </div>`;
}

/* ---------- Lista de fichas ---------- */
function TipoTag({ f }) {
  const t = tipoDe(f);
  return t === "doenca" ? null : html`<span class=${"tipo-tag tipo-" + t}>${TIPOS[t].nome}</span>`;
}
function LinhaFicha({ f, notas, ativo, onClick }) {
  const secoes = secoesDe(f);
  const tem = new Set(notas.map((n) => n.secao));
  const faltam = secoes.filter((s) => !tem.has(s.id));
  const cheias = secoes.filter((s) => tem.has(s.id));
  const sub = resumoCurto(f);
  return html`<button class=${"ficha-linha" + (ativo ? " ativo" : "")} aria-current=${ativo ? "true" : undefined} onClick=${onClick}>
    <span class="ficha-linha-topo"><span class="ficha-linha-nome">${f.nome}</span>${f.exemplo ? html`<span class="selo">exemplo</span>` : null}</span>
    ${sub ? html`<span class="ficha-linha-sub">${sub}</span>` : null}
    <span class="ficha-linha-meta">
      <${TipoTag} f=${f}/>
      <${Aba} esp=${f.especialidade}/>
      <span>${plural(notas.length, "nota", "notas")}</span>
      <span class="pontos" role="img" aria-label=${`Seções preenchidas: ${cheias.map((s) => s.abbr).join(", ") || "nenhuma"}`}>${secoes.map((s) => html`<i key=${s.id} class=${tem.has(s.id) ? "cheio" : ""}></i>`)}</span>
    </span>
    ${faltam.length === 0 ? html`<span class="falta ok">Todas as seções preenchidas</span>`
      : faltam.length === secoes.length ? html`<span class="falta">Sem anotações</span>`
      : html`<span class="falta">Falta: ${faltam.map((s) => s.abbr).join(", ")}</span>`}
  </button>`;
}

function ListaFichas({ d, nav, sel }) {
  const [esp, setEspBruto] = useState(() => LS.get("fichario.filtro", ""));
  const [tipoF, setTipoBruto] = useState(() => { const t = LS.get("fichario.tipoFiltro", ""); return TIPOS[t] ? t : ""; });
  const [ordem, setOrdemBruta] = useState(() => LS.get("fichario.ordem", "az"));
  const [q, setQ] = useState("");
  const setEsp = (e) => { setEspBruto(e); LS.set("fichario.filtro", e); };
  const setTipoF = (t) => { setTipoBruto(t); LS.set("fichario.tipoFiltro", t); };
  const setOrdem = (o) => { setOrdemBruta(o); LS.set("fichario.ordem", o); };
  const porTipo = useMemo(() => { const m = { doenca: 0, medicamento: 0, exame: 0 }; for (const f of d.lista) m[tipoDe(f)]++; return m; }, [d.ver]);
  const contagem = useMemo(() => {
    const m = new Map();
    for (const f of d.lista) { if (tipoF && tipoDe(f) !== tipoF) continue; const k = espInfo(f.especialidade).nome; m.set(k, (m.get(k) || 0) + 1); }
    return [...m].sort((a, b) => a[0].localeCompare(b[0], "pt-BR"));
  }, [d.ver, tipoF]);
  const espAtivo = esp && contagem.some(([e]) => e === esp) ? esp : "";
  const termo = fold(q).trim();
  let lista = d.lista.filter((f) => (!tipoF || tipoDe(f) === tipoF) && (!espAtivo || espInfo(f.especialidade).nome === espAtivo)
    && (!termo || fold([f.nome, ...(f.sinonimos || []), resumoCurto(f)].join(" ")).includes(termo)));
  if (ordem === "recentes") lista = [...lista].sort((a, b) => (d.atividade.get(b.id) || b.criadaEm || 0) - (d.atividade.get(a.id) || a.criadaEm || 0));
  const totalTipo = tipoF ? porTipo[tipoF] : d.lista.length;
  return html`<div class="view lista-fichas">
    <header class="vhead"><h1 class="vtitle">Fichas</h1><button class="btn" onClick=${() => nav.novaFicha(tipoF ? { tipo: tipoF } : null)}>${ico("mais")} Nova ficha</button></header>
    <div class="lista-ctrl">
      <div class="chips rolagem" role="group" aria-label="Tipo de ficha">
        <button class="chip" aria-pressed=${!tipoF} onClick=${() => setTipoF("")}>Todas <span class="n">${d.lista.length}</span></button>
        ${ORDEM_TIPOS.map((t) => html`<button key=${t} class="chip" aria-pressed=${tipoF === t} onClick=${() => setTipoF(tipoF === t ? "" : t)}>${TIPOS[t].plural} <span class="n">${porTipo[t]}</span></button>`)}
      </div>
      <input id="filtro-fichas" class="campo" type="search" placeholder="Filtrar por nome, sigla ou classe" value=${q} onInput=${(e) => setQ(e.target.value)} aria-label="Filtrar fichas"/>
      ${contagem.length > 1 ? html`<div class="chips rolagem" role="group" aria-label="Especialidade">
        <button class="chip" aria-pressed=${!espAtivo} onClick=${() => setEsp("")}>Todas as áreas <span class="n">${totalTipo}</span></button>
        ${contagem.map(([e, n]) => { const i = espInfo(e); return html`<button key=${e} class="chip" aria-pressed=${espAtivo === e} onClick=${() => setEsp(espAtivo === e ? "" : e)}><i class="tom" style=${`--tom: var(--t${i.tom})`}></i>${i.curto} <span class="n">${n}</span></button>`; })}
      </div>` : null}
      <div class="seg" role="group" aria-label="Ordem">
        <button aria-pressed=${ordem === "az"} onClick=${() => setOrdem("az")}>A–Z</button>
        <button aria-pressed=${ordem === "recentes"} onClick=${() => setOrdem("recentes")}>Mexidas por último</button>
      </div>
    </div>
    ${lista.length ? html`<ul class="fichas">${lista.map((f) => html`<li key=${f.id}>
        <${LinhaFicha} f=${f} notas=${d.porFicha.get(f.id) || []} ativo=${sel === f.id} onClick=${() => nav.abrirFicha(f.id)}/>
      </li>`)}</ul>`
    : html`<p class="muted">${d.lista.length ? "Nenhuma ficha com esse filtro." : "Nenhuma ficha ainda. Crie uma aqui ou encaixe uma nota da caixa de entrada."}</p>`}
  </div>`;
}

/* ---------- Ficha ---------- */
function NotaItem({ n, nav }) {
  const abrir = () => nav.editarNota(n);
  return html`<li><div class="nota" role="button" tabindex="0" onClick=${abrir} onKeyDown=${(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); abrir(); } }}>
    <span class="nota-texto">${n.texto}</span>
    <span class="meta">${n.fonte ? n.fonte + " · " : ""}${quando(n.criadaEm)}</span>
  </div></li>`;
}

function ValorCampo({ cp, v }) {
  if (Array.isArray(v)) return v.map((x) => html`<span key=${x} class="tag">${x}</span>`);
  const tom = (cp.tons && cp.tons[v]) || "";
  return html`<span class=${"valor" + (tom ? " " + tom : "")}>${cp.id === "gestacao" ? "Categoria " + v : v}</span>`;
}
function Resumo({ f, nav }) {
  const tipo = tipoDe(f), c = f.campos || {};
  const cheios = camposVisiveis(tipo, c).filter((cp) => temValor(c[cp.id]));
  const editar = () => nav.editarFicha(f);
  if (!cheios.length) {
    if (tipo === "doenca") return null;
    return html`<div class="resumo resumo-vazio">
      <p class="muted small">${tipo === "medicamento" ? "Marque classe, vias, categoria na gestação, ajuste renal, tipo de receita e o que monitorar." : "Marque o tipo de exame, a amostra, o jejum, a referência e a sensibilidade."}</p>
      <button class="btn" onClick=${editar}>Preencher o resumo</button>
    </div>`;
  }
  return html`<div class="resumo" role="button" tabindex="0" aria-label="Editar o resumo" onClick=${editar} onKeyDown=${(e) => { if (e.key === "Enter") editar(); }}>
    <div class="resumo-topo"><span class="resumo-titulo">Resumo</span><span class="resumo-editar">editar</span></div>
    <dl class="resumo-grade">${cheios.map((cp) => html`<div key=${cp.id} class=${"resumo-item" + (cp.tipo === "texto" && !cp.curto ? " largo" : "")}>
      <dt>${cp.nome}</dt><dd><${ValorCampo} cp=${cp} v=${c[cp.id]}/></dd>
    </div>`)}</dl>
  </div>`;
}

function FichaView({ f, d, nav, foco, setFoco, largo }) {
  const tipo = tipoDe(f), T = TIPOS[tipo], secoes = T.secoes;
  const notas = d.porFicha.get(f.id) || [];
  const porSecao = useMemo(() => {
    const m = Object.fromEntries(secoes.map((s) => [s.id, []])); const sem = [];
    for (const n of notas) (m[n.secao] || sem).push(n);
    return { m, sem };
  }, [notas, tipo]);
  const ir = (id) => { const el = document.getElementById("sec-" + id); if (el) el.scrollIntoView({ block: "start", behavior: reduzMovimento() ? "auto" : "smooth" }); };
  useEffect(() => { if (foco) { requestAnimationFrame(() => ir(foco)); setFoco(null); } }, [foco]);
  const ligadas = (f.diferenciais || []).map((nome) => ({ nome, ficha: acharFicha(d.lista, nome) }));
  const citam = d.lista.filter((x) => x.id !== f.id && (x.diferenciais || []).some((nome) => termosDaFicha(f).includes(fold(nome).trim())));
  const citamTipo = (t) => citam.filter((x) => tipoDe(x) === t);
  const tom = espInfo(f.especialidade).tom;
  const compartilhar = () => {
    const t = fichaComoTexto(f, notas);
    if (window.Android) { window.Android.compartilhar(f.nome, t); return; }
    try {
      navigator.clipboard.writeText(t).then(() => aviso("Ficha copiada como texto."), () => nav.copiar(t));
    } catch (e) { nav.copiar(t); }
  };
  const link = (x) => html`<button key=${x.id} class="chip link" onClick=${() => nav.abrirFicha(x.id)}>${x.nome} ›</button>`;
  const r = f.rev;
  return html`<div class="view">
    ${!largo ? html`<button class="voltar" onClick=${nav.fecharFicha}>${ico("voltar")} Fichas</button>` : null}
    <article class="cartao" style=${`--tom: var(--t${tom})`}>
      <span class="cartao-aba">${T.nome} · ${espInfo(f.especialidade).nome}</span>
      <header class="cartao-cabeca">
        <h1 class="ficha-nome">${f.nome}${f.exemplo ? html` <span class="selo">exemplo</span>` : null}</h1>
        ${(f.sinonimos || []).length ? html`<p class="sinonimos">${T.prefixoSin}: ${f.sinonimos.join(" · ")}</p>` : null}
        <div class="acoes">
          <button class="btn primario" onClick=${() => nav.anotar({ fichaId: f.id })}>${ico("mais")} Anotar nesta ficha</button>
          <button class="btn" disabled=${!notas.length} onClick=${() => nav.revisar([f.id])}>Revisar</button>
          <button class="btn" onClick=${() => nav.editarFicha(f)}>Editar</button>
          <button class="btn" disabled=${!notas.length} onClick=${compartilhar}>Compartilhar</button>
        </div>
      </header>
      <${Resumo} f=${f} nav=${nav}/>
      <nav class="secnav" aria-label="Ir para a seção">
        ${secoes.map((s) => { const c = porSecao.m[s.id].length; return html`<button key=${s.id} class=${"secnav-item" + (c ? "" : " vazio")} onClick=${() => ir(s.id)}>${s.abbr}${c ? html`<span class="n">${c}</span>` : null}</button>`; })}
      </nav>
      ${secoes.map((s) => html`<section key=${s.id} class=${"secao secao-" + s.id} id=${"sec-" + s.id}>
        <div class="secao-margem">
          <span class="sec-abbr">${s.abbr}</span>
          ${s.abbr !== s.nome ? html`<span class="sec-nome">${s.nome}</span>` : null}
          <button class="icone-btn" aria-label=${`Anotar em ${s.nome}`} onClick=${() => nav.anotar({ fichaId: f.id, secao: s.id })}>${ico("mais")}</button>
        </div>
        <div class="secao-conteudo">
          ${porSecao.m[s.id].length
            ? html`<ul class="notas">${porSecao.m[s.id].map((n) => html`<${NotaItem} key=${n.id} n=${n} nav=${nav}/>`)}</ul>`
            : html`<button class="vazio-btn" onClick=${() => nav.anotar({ fichaId: f.id, secao: s.id })}>Nada anotado ainda</button>`}
        </div>
      </section>`)}
      ${porSecao.sem.length ? html`<section class="secao"><div class="secao-margem"><span class="sec-abbr">Sem seção</span><span class="sec-nome">Toque na nota para escolher</span></div>
        <div class="secao-conteudo"><ul class="notas">${porSecao.sem.map((n) => html`<${NotaItem} key=${n.id} n=${n} nav=${nav}/>`)}</ul></div></section>` : null}
      <footer class="cartao-rodape">
        <div class="ligacao">
          <h2>${T.rotuloLig}</h2>
          ${ligadas.length ? html`<div class="chips">${ligadas.map((x) => x.ficha
              ? link(x.ficha)
              : html`<button key=${x.nome} class="chip pontilhado" title="Criar esta ficha" onClick=${() => nav.novaFicha({ nome: x.nome, especialidade: f.especialidade, tipo: "doenca" })}>+ ${x.nome}</button>`)}</div>`
            : html`<p class="muted small">${T.vazioLig} <button class="link-btn" onClick=${() => nav.editarFicha(f)}>Adicionar</button></p>`}
        </div>
        ${tipo === "doenca" ? html`
          ${citamTipo("doenca").length ? html`<div class="ligacao"><h2>É diferencial de</h2><div class="chips">${citamTipo("doenca").map(link)}</div></div>` : null}
          <div class="ligacao"><h2>Medicamentos</h2><div class="chips">${citamTipo("medicamento").map(link)}
            <button class="chip pontilhado" onClick=${() => nav.novaFicha({ tipo: "medicamento", especialidade: f.especialidade, diferenciais: [f.nome] })}>+ Medicamento</button></div></div>
          <div class="ligacao"><h2>Exames</h2><div class="chips">${citamTipo("exame").map(link)}
            <button class="chip pontilhado" onClick=${() => nav.novaFicha({ tipo: "exame", especialidade: f.especialidade, diferenciais: [f.nome] })}>+ Exame</button></div></div>`
        : citam.length ? html`<div class="ligacao"><h2>Aparece em</h2><div class="chips">${citam.map(link)}</div></div>` : null}
        <p class="rev-info">${r ? `Próxima revisão ${rotuloDias(diasAte(r.proxima))}${r.vezes ? ` · revisada ${plural(r.vezes, "vez", "vezes")}` : ""}.` : "Entra na revisão quando receber a primeira nota."}</p>
      </footer>
    </article>
  </div>`;
}

/* ---------- Revisão ---------- */
function Revisao({ d, rev, setRev, nav }) {
  const id = rev.fila[rev.i];
  const f = d.fichas.get(id);
  const [abertas, setAbertas] = useState({});
  useEffect(() => { setAbertas({}); topo(); }, [id]);
  useEffect(() => { if (!f) avancar(); }, [f]);
  function avancar() {
    if (rev.i + 1 < rev.fila.length) setRev({ fila: rev.fila, i: rev.i + 1 });
    else setRev(null);
  }
  if (!f) return null;
  const tipo = tipoDe(f), T = TIPOS[tipo], c = f.campos || {};
  const notas = d.porFicha.get(id) || [];
  const blocos = [];
  const cheios = camposVisiveis(tipo, c).filter((cp) => temValor(c[cp.id]));
  if (cheios.length) blocos.push({ id: "resumo", abbr: "Resumo", nome: cheios.map((cp) => cp.nome).join(", "), campos: cheios });
  for (const s of T.secoes) {
    const ns = notas.filter((n) => n.secao === s.id);
    if (ns.length) blocos.push({ id: s.id, abbr: s.abbr, nome: s.nome, notas: ns });
  }
  if ((f.diferenciais || []).length) blocos.push({ id: "ligadas", abbr: T.abbrLig, nome: T.rotuloLig, lista: f.diferenciais });
  const todas = blocos.every((b) => abertas[b.id]);
  const p = f.rev && Number.isFinite(f.rev.passo) ? f.rev.passo : 0;
  const opcoes = [["esqueci", "Esqueci", 1], ["parcial", "Lembrei em parte", ESCADA[p]], ["bem", "Lembrei bem", ESCADA[Math.min(ESCADA.length - 1, p + 1)]]];
  const avaliar = (k) => {
    const prox = proximaRev(f.rev, k);
    revisarFicha(f, k);
    if (rev.i + 1 < rev.fila.length) setRev({ fila: rev.fila, i: rev.i + 1 });
    else { setRev(null); aviso(rev.fila.length > 1 ? "Revisão do dia concluída." : `${f.nome} volta ${rotuloDias(ESCADA[prox.passo])}.`); }
  };
  const corpo = (b) => {
    if (b.notas) return html`<ul class="notas">${b.notas.map((n) => html`<li key=${n.id}><div class="nota estatica"><span class="nota-texto">${n.texto}</span></div></li>`)}</ul>`;
    if (b.campos) return html`<dl class="resumo-grade">${b.campos.map((cp) => html`<div key=${cp.id} class=${"resumo-item" + (cp.tipo === "texto" && !cp.curto ? " largo" : "")}><dt>${cp.nome}</dt><dd><${ValorCampo} cp=${cp} v=${c[cp.id]}/></dd></div>`)}</dl>`;
    return html`<p class="nota-texto">${b.lista.join(" · ")}</p>`;
  };
  return html`<div class="view">
    <div class="rev-topo">
      <button class="voltar" onClick=${() => setRev(null)}>${ico("x")} Sair da revisão</button>
      ${rev.fila.length > 1 ? html`<span class="meta">${rev.i + 1} de ${rev.fila.length}</span>` : null}
    </div>
    <article class="cartao" style=${`--tom: var(--t${espInfo(f.especialidade).tom})`}>
      <span class="cartao-aba">${T.nome} · ${espInfo(f.especialidade).nome}</span>
      <header class="cartao-cabeca">
        <h1 class="ficha-nome">${f.nome}</h1>
        <p class="instrucao">Antes de abrir cada parte, tente lembrar o que você anotou. Depois diga como foi.</p>
      </header>
      ${blocos.length ? blocos.map((b) => {
        const aberta = !!abertas[b.id];
        return html`<section key=${b.id} class=${"rev-secao secao-" + b.id}>
          <button class="rev-revelar" aria-expanded=${aberta ? "true" : "false"} onClick=${() => setAbertas(Object.assign({}, abertas, { [b.id]: !aberta }))}>
            <span class="sec-abbr">${b.abbr}</span><span class="sec-titulo">${b.nome}</span>
            <span class="meta">${aberta ? "esconder" : b.notas ? `${plural(b.notas.length, "nota", "notas")} · mostrar` : "mostrar"}</span>
          </button>
          ${aberta ? html`<div class="rev-corpo">${corpo(b)}</div>` : null}
        </section>`;
      }) : html`<p class="cartao-cabeca muted">Esta ficha ainda não tem notas.</p>`}
    </article>
    ${blocos.length && !todas ? html`<button class="btn largo" onClick=${() => setAbertas(Object.fromEntries(blocos.map((b) => [b.id, true])))}>Mostrar tudo</button>` : null}
    <div class="avaliar">
      <p class="avaliar-titulo">Como foi lembrar ${f.nome}?</p>
      <div class="avaliar-botoes">${opcoes.map(([k, rot, dias]) => html`<button key=${k} class=${"btn avaliar-" + k} onClick=${() => avaliar(k)}><b>${rot}</b><span>volta ${rotuloDias(dias)}</span></button>`)}</div>
    </div>
  </div>`;
}

/* ---------- Busca ---------- */
function foldIdx(s) {
  let out = "";
  for (const ch of s) {
    let c = ch.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
    if (c.length !== ch.length) c = c.length > ch.length ? c.slice(0, ch.length) : c.padEnd(ch.length, " ");
    out += c;
  }
  return out;
}
function Trecho({ texto, termos }) {
  const f = foldIdx(texto);
  const primeiro = Math.min(...termos.map((t) => { const i = f.indexOf(t); return i < 0 ? Infinity : i; }));
  let ini = 0;
  if (primeiro !== Infinity && primeiro > 70) { ini = texto.lastIndexOf(" ", primeiro - 40); if (ini < 0) ini = primeiro - 40; }
  const fim = Math.min(texto.length, ini + 220);
  const pedaco = texto.slice(ini, fim), fp = f.slice(ini, fim);
  const marcas = [];
  for (const t of termos) { let i = 0; while (t && (i = fp.indexOf(t, i)) >= 0) { marcas.push([i, i + t.length]); i += t.length; } }
  marcas.sort((a, b) => a[0] - b[0]);
  const unidas = [];
  for (const m of marcas) { const u = unidas[unidas.length - 1]; if (u && m[0] <= u[1]) u[1] = Math.max(u[1], m[1]); else unidas.push(m.slice()); }
  const partes = []; let pos = 0;
  unidas.forEach(([a, b], i) => { if (a > pos) partes.push(pedaco.slice(pos, a)); partes.push(html`<mark key=${i}>${pedaco.slice(a, b)}</mark>`); pos = b; });
  partes.push(pedaco.slice(pos));
  return html`<span class="nota-texto">${ini > 0 ? "…" : ""}${partes}${fim < texto.length ? "…" : ""}</span>`;
}
function Buscar({ d, nav }) {
  const [q, setQ] = useState("");
  const ref = useRef(null);
  useEffect(() => { if (ref.current && window.matchMedia("(min-width: 760px)").matches) ref.current.focus(); }, []);
  const termos = fold(q).split(/\s+/).filter(Boolean);
  const res = useMemo(() => {
    if (!termos.length) return null;
    const fichas = d.lista.filter((f) => { const h = fold([f.nome, ...(f.sinonimos || []), f.especialidade || "", ...(f.diferenciais || []), TIPOS[tipoDe(f)].nome, ...Object.values(f.campos || {}).map(textoCampo)].join(" ")); return termos.every((t) => h.includes(t)); });
    const notas = [...d.notas.values()].filter((n) => {
      const f = n.fichaId ? d.fichas.get(n.fichaId) : null;
      const s = f ? secaoDe(f, n.secao) : null;
      const h = fold([n.texto, f ? f.nome : "", f ? (f.sinonimos || []).join(" ") : "", s ? s.nome + " " + s.abbr : "", n.fonte || ""].join(" "));
      return termos.every((t) => h.includes(t));
    }).sort((a, b) => (b.atualizadaEm || 0) - (a.atualizadaEm || 0)).slice(0, 80);
    return { fichas, notas };
  }, [q, d.ver]);
  return html`<div class="view">
    <header class="vhead"><h1 class="vtitle">Buscar</h1></header>
    <input id="busca" ref=${ref} class="campo" type="search" placeholder="Doença, sinal, droga, exame…" value=${q} onInput=${(e) => setQ(e.target.value)} aria-label="Buscar nas fichas e notas"/>
    ${!res ? html`<p class="muted">Procura em ${plural(d.fichas.size, "ficha", "fichas")} e ${plural(d.notas.size, "nota", "notas")}, sem ligar para acentos. Junte palavras para estreitar: “pac tto”, “ic dx”.</p>`
    : html`<div class="view" style="gap: 24px">
      ${res.fichas.length ? html`<section class="resultados"><h2>${plural(res.fichas.length, "ficha", "fichas")}</h2>
        <ul class="fichas">${res.fichas.map((f) => html`<li key=${f.id}><${LinhaFicha} f=${f} notas=${d.porFicha.get(f.id) || []} onClick=${() => nav.abrirFicha(f.id)}/></li>`)}</ul></section>` : null}
      ${res.notas.length ? html`<section class="resultados"><h2>${plural(res.notas.length, "nota", "notas")}</h2>
        <ul class="fichas">${res.notas.map((n) => { const f = n.fichaId ? d.fichas.get(n.fichaId) : null; return html`<li key=${n.id}>
          <button class="achado" onClick=${() => (f ? nav.abrirFicha(f.id, n.secao) : nav.editarNota(n))}>
            <${Trecho} texto=${n.texto} termos=${termos}/>
            <span class="onde">${f ? html`<${Aba} esp=${f.especialidade}/><span>${f.nome} › ${abbrSecao(f, n.secao)}</span>` : html`<span>Caixa de entrada</span>`}<span>· ${quando(n.criadaEm)}</span></span>
          </button></li>`; })}</ul></section>` : null}
      ${!res.fichas.length && !res.notas.length ? html`<p class="muted">Nada encontrado para “${q.trim()}”.</p>` : null}
    </div>`}
  </div>`;
}

/* ---------- Painéis ---------- */
const pilhaFolhas = [];
function Folha({ titulo, onFechar, rotuloFechar, acao, children }) {
  const ref = useRef(onFechar); ref.current = onFechar;
  useEffect(() => {
    const k = (e) => { if (e.key === "Escape") ref.current(); };
    const fechar = () => ref.current();
    pilhaFolhas.push(fechar);
    document.addEventListener("keydown", k);
    document.documentElement.classList.add("travado");
    return () => {
      const i = pilhaFolhas.indexOf(fechar); if (i >= 0) pilhaFolhas.splice(i, 1);
      document.removeEventListener("keydown", k); document.documentElement.classList.remove("travado");
    };
  }, []);
  return html`<div class="folha-fundo" onClick=${(e) => { if (e.target === e.currentTarget) ref.current(); }}>
    <div class="folha" role="dialog" aria-modal="true" aria-label=${titulo}>
      <div class="folha-cabeca">
        <button class="btn-texto" onClick=${() => ref.current()}>${rotuloFechar || "Cancelar"}</button>
        <h2 class="folha-titulo">${titulo}</h2>
        <div class="folha-acao">${acao}</div>
      </div>
      <div class="folha-corpo">${children}</div>
    </div>
  </div>`;
}

function SeletorTipo({ valor, onMudar }) {
  return html`<div class="seg seg-tipos" style="--n: 3" role="radiogroup" aria-label="Tipo de ficha">
    ${ORDEM_TIPOS.map((t) => html`<button key=${t} role="radio" aria-checked=${valor === t ? "true" : "false"} onClick=${() => onMudar(t)}>${TIPOS[t].nome}</button>`)}
  </div>`;
}

function NovaFichaMini({ inicial, onCriar, onCancelar }) {
  const [nome, setNome] = useState(inicial.nome || "");
  const [esp, setEsp] = useState(inicial.especialidade || "");
  const [tipo, setTipo] = useState(TIPOS[inicial.tipo] ? inicial.tipo : "doenca");
  const criar = () => { if (nome.trim()) onCriar({ nome: nome.trim(), especialidade: esp.trim(), tipo }); };
  const enter = (e) => { if (e.key === "Enter") { e.preventDefault(); criar(); } };
  return html`<div class="mini-form">
    <div class="grupo"><span class="rotulo">Tipo de ficha</span><${SeletorTipo} valor=${tipo} onMudar=${setTipo}/></div>
    <div class="grupo"><label class="rotulo" for="mini-nome">Nome da ficha</label>
      <input id="mini-nome" class="campo" value=${nome} onInput=${(e) => setNome(e.target.value)} onKeyDown=${enter} placeholder=${TIPOS[tipo].exNome}/></div>
    <div class="grupo"><label class="rotulo" for="mini-esp">Especialidade</label>
      <input id="mini-esp" class="campo" list="lista-esp" value=${esp} onInput=${(e) => setEsp(e.target.value)} onKeyDown=${enter} placeholder="Ex.: Cardiologia"/></div>
    <div class="linha-botoes"><button class="btn" onClick=${onCancelar}>Voltar</button><button class="btn primario" disabled=${!nome.trim()} onClick=${criar}>Criar ficha</button></div>
  </div>`;
}

function EscolherFicha({ d, valor, onEscolher, texto }) {
  const [q, setQ] = useState("");
  const [criando, setCriando] = useState(null);
  const sugestoes = useMemo(() => (valor ? [] : sugerirFichas(texto || "", d.lista)), [texto, d.ver, valor]);
  if (valor) {
    const f = d.fichas.get(valor);
    return html`<div class="ficha-escolhida"><${Aba} esp=${f && f.especialidade}/><span class="nome">${f ? f.nome : "Ficha apagada"}</span>${f ? html`<${TipoTag} f=${f}/>` : null}<button class="btn-texto" onClick=${() => onEscolher(null)}>Trocar</button></div>`;
  }
  if (criando) return html`<${NovaFichaMini} inicial=${criando} onCancelar=${() => setCriando(null)} onCriar=${(dd) => {
    LS.set("fichario.esp", dd.especialidade); LS.set("fichario.tipo", dd.tipo);
    const id = novaFicha(dd); onEscolher(id); setCriando(null); setQ("");
  }}/>`;
  const termo = fold(q).trim();
  const achadas = termo ? d.lista.filter((f) => fold([f.nome, ...(f.sinonimos || [])].join(" ")).includes(termo)).slice(0, 6) : [];
  const exata = achadas.some((f) => fold(f.nome).trim() === termo);
  const palpite = !termo && !sugestoes.length ? nomeProvavel(texto) : "";
  const palpiteExiste = palpite && acharFicha(d.lista, palpite);
  const novo = (nome) => setCriando({ nome, especialidade: LS.get("fichario.esp", ""), tipo: LS.get("fichario.tipo", "doenca") });
  return html`<div class="escolher-ficha">
    ${sugestoes.length ? html`<div class="sugestoes"><span class="dica">Parece ser:</span>${sugestoes.map((f) => html`<button key=${f.id} class="chip sugestao" onClick=${() => onEscolher(f.id)}>${f.nome}</button>`)}</div>` : null}
    ${palpite && !palpiteExiste ? html`<div class="sugestoes"><button class="chip pontilhado" onClick=${() => novo(palpite)}>+ Criar ficha “${palpite}”</button></div>` : null}
    <input id="busca-ficha" class="campo" type="search" placeholder="Buscar ficha ou criar nova" value=${q} onInput=${(e) => setQ(e.target.value)} aria-label="Buscar ficha"
      onKeyDown=${(e) => { if (e.key === "Enter") { e.preventDefault(); if (achadas[0]) onEscolher(achadas[0].id); else if (q.trim()) novo(q.trim()); } }}/>
    ${termo ? html`<ul class="opcoes">
      ${achadas.map((f) => html`<li key=${f.id}><button class="opcao" onClick=${() => onEscolher(f.id)}><${Aba} esp=${f.especialidade}/><span>${f.nome}</span><${TipoTag} f=${f}/></button></li>`)}
      ${!exata ? html`<li><button class="opcao criar" onClick=${() => novo(q.trim())}>${ico("mais")} Criar ficha “${q.trim()}”</button></li>` : null}
    </ul>` : null}
  </div>`;
}

function EscolherSecao({ valor, sugerida, onEscolher, secoes }) {
  return html`<div class="secoes-grade" role="radiogroup" aria-label="Seção">
    ${(secoes || SECOES_DOENCA).map((s) => html`<button key=${s.id} class=${"secao-opcao secao-" + s.id} role="radio" aria-checked=${valor === s.id ? "true" : "false"} onClick=${() => onEscolher(s.id)}>
      <b>${s.abbr}</b><span>${s.nome}</span>${sugerida === s.id && valor !== s.id ? html`<i class="sugerida">sugerida</i>` : null}
    </button>`)}
  </div>`;
}

function EditorNota({ d, nota, preset, nav }) {
  const nova = !nota;
  const rasc = nova ? LS.get("fichario.rascunho", null) : null;
  const [texto, setTexto] = useState(nota ? nota.texto : (preset && preset.texto) || (rasc && rasc.texto) || "");
  const [fonte, setFonte] = useState(nota ? nota.fonte || "" : (rasc && rasc.fonte) || LS.get("fichario.fonte", "Aula"));
  const [fichaId, setFichaId] = useState(nota ? nota.fichaId || null : (preset && preset.fichaId) || null);
  const [secao, setSecao] = useState(nota ? nota.secao || null : (preset && preset.secao) || null);
  const [manual, setManual] = useState(!!(nota ? nota.secao : preset && preset.secao));
  const [continuar, setContinuar] = useState(() => nova && LS.get("fichario.continuar", false));
  const [confirmar, setConfirmar] = useState(null);
  const ta = useRef(null);
  const tipoAlvo = tipoDe(fichaId ? d.fichas.get(fichaId) : null);
  const secoesAlvo = TIPOS[tipoAlvo].secoes;
  const sug = useMemo(() => sugerirSecao(texto, tipoAlvo), [texto, tipoAlvo]);
  const secaoEf = fichaId ? (manual && secoesAlvo.some((s) => s.id === secao) ? secao : sug) : null;
  const mudouAlgo = nova ? !!texto.trim() : texto !== nota.texto || (fonte || "") !== (nota.fonte || "") || fichaId !== (nota.fichaId || null) || secaoEf !== (nota.secao || null);
  const pode = !!texto.trim() && (!fichaId || !!secaoEf);

  useEffect(() => {
    if (!nova) return;
    const t = setTimeout(() => LS.set("fichario.rascunho", texto.trim() ? { texto, fonte } : null), 350);
    return () => clearTimeout(t);
  }, [texto, fonte]);
  useEffect(() => { if (ta.current) { ta.current.focus(); const n = ta.current.value.length; try { ta.current.setSelectionRange(n, n); } catch (e) {} } }, []);

  const salvar = () => {
    if (!pode) return;
    if (fonte) LS.set("fichario.fonte", fonte);
    const f = fichaId ? d.fichas.get(fichaId) : null;
    if (nova) {
      novaNota({ texto: texto.trim(), fonte, fichaId, secao: secaoEf });
      LS.set("fichario.rascunho", null);
      aviso(f ? `Nota salva em ${f.nome} › ${abbrSecao(f, secaoEf)}.` : "Nota salva na caixa de entrada.");
      if (continuar) {
        setTexto(""); setManual(!!(preset && preset.secao)); setSecao((preset && preset.secao) || null); setConfirmar(null);
        if (ta.current) ta.current.focus();
      } else nav.fecharFolha();
    } else {
      editarNota(nota, { texto: texto.trim(), fonte, fichaId, secao: secaoEf });
      aviso(nota.fichaId && !fichaId ? "Nota devolvida à caixa de entrada." : "Nota atualizada.");
      nav.fecharFolha();
    }
  };
  const fechar = () => {
    if (mudouAlgo && confirmar !== "descartar") { setConfirmar("descartar"); return; }
    if (nova) LS.set("fichario.rascunho", null);
    nav.fecharFolha();
  };
  const fEsc = fichaId ? d.fichas.get(fichaId) : null;

  return html`<${Folha} titulo=${nova ? (fEsc ? `Nota em ${fEsc.nome}` : "Nova nota") : "Editar nota"} onFechar=${fechar}
      acao=${html`<button class="btn primario" disabled=${!pode} onClick=${salvar}>Salvar</button>`}>
    ${confirmar === "descartar" ? html`<div class="confirma"><p>${nova ? "Descartar o que você escreveu?" : "Sair sem salvar as mudanças?"}</p>
      <button class="btn perigo armado" onClick=${fechar}>Descartar</button><button class="btn" onClick=${() => setConfirmar(null)}>Continuar</button></div>` : null}
    <textarea id="nota-texto" ref=${ta} class="nota-campo" rows="7" value=${texto} aria-label="Texto da nota"
      placeholder="Escreva como numa nota. Ex.: Sopro sistólico ejetivo em foco aórtico, irradia para carótidas. Professor: pensar em estenose aórtica."
      onInput=${(e) => setTexto(e.target.value)}
      onKeyDown=${(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); salvar(); } }}></textarea>
    <div class="grupo">
      <span class="rotulo" id="rot-fonte">Onde você viu</span>
      <div class="chips" role="radiogroup" aria-labelledby="rot-fonte">
        ${FONTES.map((x) => html`<button key=${x} class="chip" role="radio" aria-checked=${fonte === x ? "true" : "false"} onClick=${() => setFonte(fonte === x ? "" : x)}>${x}</button>`)}
      </div>
    </div>
    <div class="grupo">
      <div class="rotulo-linha"><span class="rotulo">Ficha</span>${!fichaId ? html`<span class="dica">opcional: sem ficha, a nota vai para a caixa de entrada</span>` : null}</div>
      <${EscolherFicha} d=${d} valor=${fichaId} texto=${texto} onEscolher=${(id) => { setFichaId(id); if (!id) { setManual(false); setSecao(null); } }}/>
    </div>
    ${fichaId ? html`<div class="grupo">
      <div class="rotulo-linha"><span class="rotulo">Seção</span>${!secaoEf ? html`<span class="dica alerta">escolha a seção para salvar</span>` : null}</div>
      <${EscolherSecao} valor=${secaoEf} sugerida=${sug} secoes=${secoesAlvo} onEscolher=${(s) => { setSecao(s); setManual(true); }}/>
    </div>` : null}
    ${nova ? html`<label class="check" for="continuar"><input id="continuar" type="checkbox" checked=${continuar} onChange=${(e) => { setContinuar(e.target.checked); LS.set("fichario.continuar", e.target.checked); }}/>Depois de salvar, já abrir outra nota</label>`
      : html`<div class="zona">
        ${confirmar === "apagar"
          ? html`<button class="btn perigo armado" onClick=${() => { apagarNota(nota); aviso("Nota apagada."); nav.fecharFolha(); }}>Apagar de vez</button><button class="btn" onClick=${() => setConfirmar(null)}>Manter</button>`
          : html`<button class="btn perigo" onClick=${() => setConfirmar("apagar")}>Apagar nota</button>`}
        ${nota.fichaId ? html`<button class="btn" onClick=${() => { editarNota(nota, { texto: texto.trim() || nota.texto, fichaId: null, secao: null }); aviso("Nota devolvida à caixa de entrada."); nav.fecharFolha(); }}>Devolver à caixa</button>` : null}
        <span class="meta" style="align-self: center">Criada ${quando(nota.criadaEm)}</span>
      </div>`}
  <//>`;
}

function Encaixar({ d, nav }) {
  const [fila] = useState(() => d.caixa.map((n) => n.id));
  const [i, setI] = useState(0);
  const [feitas, setFeitas] = useState(0);
  const naCaixa = (id) => { const n = d.notas.get(id); return n && !(n.fichaId && d.fichas.has(n.fichaId)); };
  let idx = i; while (idx < fila.length && !naCaixa(fila[idx])) idx++;
  const atual = idx < fila.length ? d.notas.get(fila[idx]) : null;
  const restam = fila.slice(idx).filter(naCaixa).length;

  const [fichaId, setFichaId] = useState(null);
  const [secao, setSecao] = useState(null);
  const [manual, setManual] = useState(false);
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState("");
  const [apagar, setApagar] = useState(false);
  useEffect(() => {
    if (!atual) return;
    const s = sugerirFichas(atual.texto, d.lista);
    setFichaId(s[0] ? s[0].id : null); setSecao(null); setManual(false); setEditando(false); setTexto(atual.texto); setApagar(false);
  }, [atual && atual.id]);
  const tipoAlvo = tipoDe(fichaId ? d.fichas.get(fichaId) : null);
  const secoesAlvo = TIPOS[tipoAlvo].secoes;
  const sug = useMemo(() => sugerirSecao(texto, tipoAlvo), [texto, tipoAlvo]);
  const secaoEf = fichaId ? (manual && secoesAlvo.some((s) => s.id === secao) ? secao : sug) : null;
  const encaixar = () => {
    if (!atual || !fichaId || !secaoEf) return;
    const f = d.fichas.get(fichaId);
    editarNota(atual, { texto: texto.trim() || atual.texto, fichaId, secao: secaoEf });
    setFeitas((x) => x + 1);
    aviso(`Encaixada em ${f ? f.nome : "ficha"} › ${abbrSecao(f, secaoEf)}.`);
  };
  return html`<${Folha} titulo=${atual ? `Encaixar · ${plural(restam, "nota", "notas")}` : "Encaixar"} rotuloFechar="Fechar" onFechar=${nav.fecharFolha}>
    ${atual ? html`
      <div class="encaixar-nota">
        ${editando
          ? html`<textarea id="encaixar-texto" class="nota-campo" rows="5" value=${texto} onInput=${(e) => setTexto(e.target.value)} aria-label="Texto da nota"></textarea>`
          : html`<p class="nota-texto">${texto}</p>`}
        <p class="meta">${atual.fonte ? atual.fonte + " · " : ""}${quando(atual.criadaEm)} · <button class="link-btn" onClick=${() => setEditando(!editando)}>${editando ? "pronto" : "editar texto"}</button></p>
      </div>
      <div class="grupo"><span class="rotulo">Ficha</span>
        <${EscolherFicha} key=${atual.id} d=${d} valor=${fichaId} texto=${texto} onEscolher=${(id) => { setFichaId(id); if (!id) { setManual(false); setSecao(null); } }}/></div>
      ${fichaId ? html`<div class="grupo"><div class="rotulo-linha"><span class="rotulo">Seção</span>${!secaoEf ? html`<span class="dica alerta">escolha a seção</span>` : null}</div>
        <${EscolherSecao} valor=${secaoEf} sugerida=${sug} secoes=${secoesAlvo} onEscolher=${(s) => { setSecao(s); setManual(true); }}/></div>` : null}
      <div class="encaixar-rodape">
        ${apagar
          ? html`<button class="btn perigo armado" onClick=${() => { apagarNota(atual); aviso("Nota apagada."); }}>Apagar de vez</button>`
          : html`<button class="btn perigo" onClick=${() => setApagar(true)}>Apagar</button>`}
        <button class="btn" onClick=${() => setI(idx + 1)}>Pular</button>
        <button class="btn primario" disabled=${!(fichaId && secaoEf)} onClick=${encaixar}>Encaixar</button>
      </div>`
    : html`<div class="concluido">
        <p class="concluido-titulo">${restam === 0 && d.caixa.length === 0 ? "Caixa de entrada vazia." : "Fim da fila."}</p>
        <p class="muted">${feitas ? `${plural(feitas, "nota encaixada", "notas encaixadas")} agora.` : ""}${d.caixa.length ? ` ${plural(d.caixa.length, "nota continua", "notas continuam")} na caixa.` : ""}</p>
        <button class="btn primario" onClick=${nav.fecharFolha}>Fechar</button>
      </div>`}
  <//>`;
}

function CampoSelecao({ campo, valor, onMudar }) {
  if (campo.tipo === "texto") {
    return html`<input id=${"cp-" + campo.id} class="campo" list=${campo.lista || undefined} value=${valor || ""} placeholder=${campo.ex || ""} aria-label=${campo.nome} onInput=${(e) => onMudar(e.target.value)}/>`;
  }
  const varios = campo.tipo === "varios";
  const marcados = varios ? new Set(valor || []) : null;
  return html`<div class="chips" role=${varios ? "group" : "radiogroup"} aria-label=${campo.nome}>
    ${campo.opcoes.map((o) => {
      const ativo = varios ? marcados.has(o) : valor === o;
      const clicar = () => {
        if (!varios) { onMudar(ativo ? "" : o); return; }
        const s = new Set(marcados); if (ativo) s.delete(o); else s.add(o);
        onMudar(campo.opcoes.filter((x) => s.has(x)));
      };
      const tom = (campo.tons && campo.tons[o]) || "";
      return varios
        ? html`<button key=${o} class="chip" aria-pressed=${ativo} onClick=${clicar}>${o}</button>`
        : html`<button key=${o} class=${"chip" + (tom ? " tom-" + tom : "")} role="radio" aria-checked=${ativo ? "true" : "false"} onClick=${clicar}>${o}</button>`;
    })}
  </div>`;
}

function FormFicha({ d, ficha, preset, nav }) {
  const [tipo, setTipoBruto] = useState(() => {
    const t = ficha ? tipoDe(ficha) : (preset && preset.tipo) || LS.get("fichario.tipo", "doenca");
    return TIPOS[t] ? t : "doenca";
  });
  const [nome, setNome] = useState(ficha ? ficha.nome : (preset && preset.nome) || "");
  const [esp, setEsp] = useState(ficha ? ficha.especialidade || "" : (preset && preset.especialidade) || LS.get("fichario.esp", ""));
  const [sin, setSin] = useState(ficha ? (ficha.sinonimos || []).join(", ") : "");
  const [dif, setDif] = useState(ficha ? (ficha.diferenciais || []).join(", ") : ((preset && preset.diferenciais) || []).join(", "));
  const [campos, setCampos] = useState(() => Object.assign({}, (ficha && ficha.campos) || {}));
  const [confirmar, setConfirmar] = useState(false);
  const T = TIPOS[tipo];
  const repetida = nome.trim() && d.lista.find((f) => (!ficha || f.id !== ficha.id) && fold(f.nome).trim() === fold(nome).trim());
  const notasFicha = ficha ? d.porFicha.get(ficha.id) || [] : [];
  const orfas = ficha && tipo !== tipoDe(ficha) ? notasFicha.filter((n) => !T.secoes.some((s) => s.id === n.secao)).length : 0;
  const mudarCampo = (id, v) => setCampos(Object.assign({}, campos, { [id]: v }));
  const visiveis = camposVisiveis(tipo, campos);
  const salvar = () => {
    if (!nome.trim()) return;
    const dd = { tipo, nome: nome.trim(), especialidade: esp.trim(), sinonimos: listaDeTexto(sin), diferenciais: listaDeTexto(dif), campos: limparCampos(tipo, campos) };
    LS.set("fichario.esp", dd.especialidade);
    if (ficha) { gravar("fichas/" + ficha.id, Object.assign(semMeta(ficha), dd)); aviso("Ficha atualizada."); nav.fecharFolha(); }
    else { LS.set("fichario.tipo", tipo); const id = novaFicha(dd); nav.fecharFolha(); nav.abrirFicha(id); aviso(`${T.nome} criada.`.replace("Medicamento criada", "Medicamento criado").replace("Exame criada", "Exame criado")); }
  };
  return html`<${Folha} titulo=${ficha ? "Editar ficha" : "Nova ficha"} onFechar=${nav.fecharFolha}
      acao=${html`<button class="btn primario" disabled=${!nome.trim()} onClick=${salvar}>Salvar</button>`}>
    <div class="grupo"><span class="rotulo">Tipo de ficha</span><${SeletorTipo} valor=${tipo} onMudar=${setTipoBruto}/>
      ${orfas ? html`<span class="dica alerta">${plural(orfas, "nota vai", "notas vão")} para “Sem seção”, porque ${T.nome.toLowerCase()} tem outras seções. Toque em cada uma depois para escolher a nova seção.</span>` : null}</div>
    <div class="grupo"><label class="rotulo" for="ff-nome">Nome</label>
      <input id="ff-nome" class="campo" value=${nome} onInput=${(e) => setNome(e.target.value)} placeholder=${T.exNome}/>
      ${repetida ? html`<span class="dica alerta">Já existe uma ficha com esse nome.</span>` : null}</div>
    <div class="grupo"><label class="rotulo" for="ff-esp">Especialidade</label>
      <input id="ff-esp" class="campo" list="lista-esp" value=${esp} onInput=${(e) => setEsp(e.target.value)} placeholder="Ex.: Cardiologia"/></div>
    ${visiveis.length ? html`<fieldset class="resumo-form">
      <legend>Resumo · toque para marcar</legend>
      ${visiveis.map((cp) => html`<div key=${cp.id} class=${"grupo" + (cp.curto ? " curto" : "")}>
        ${cp.tipo === "texto" ? html`<label class="rotulo" for=${"cp-" + cp.id}>${cp.nome}</label>` : html`<span class="rotulo">${cp.nome}${cp.tipo === "varios" ? html` <span class="dica">· marque quantas quiser</span>` : null}</span>`}
        <${CampoSelecao} campo=${cp} valor=${campos[cp.id]} onMudar=${(v) => mudarCampo(cp.id, v)}/>
        ${cp.dica ? html`<span class="dica">${cp.dica}</span>` : null}
      </div>`)}
    </fieldset>` : null}
    <div class="grupo"><label class="rotulo" for="ff-sin">${T.rotuloSin}</label>
      <input id="ff-sin" class="campo" value=${sin} onInput=${(e) => setSin(e.target.value)} placeholder=${T.exSin}/>
      <span class="dica">Separe por vírgula. Servem para a busca e para o fichário reconhecer a ficha quando você escreve o nome numa nota.</span></div>
    <div class="grupo"><label class="rotulo" for="ff-dif">${T.rotuloLig}</label>
      <input id="ff-dif" class="campo" value=${dif} onInput=${(e) => setDif(e.target.value)} placeholder=${T.exLig}/>
      <span class="dica">Separe por vírgula. Quando existir uma ficha com o mesmo nome, vira atalho para ela${tipo !== "doenca" ? ", e esta ficha aparece lá" : ""}.</span></div>
    ${ficha ? html`<div class="zona">
      ${confirmar
        ? html`<div class="confirma" style="width: 100%"><p>Apagar a ficha ${ficha.nome}?${notasFicha.length ? ` ${plural(notasFicha.length, "nota volta", "notas voltam")} para a caixa de entrada.` : ""}</p>
            <button class="btn perigo armado" onClick=${() => { apagarFicha(ficha); nav.fecharFolha(); aviso("Ficha apagada."); }}>Apagar ficha</button>
            <button class="btn" onClick=${() => setConfirmar(false)}>Manter</button></div>`
        : html`<button class="btn perigo" onClick=${() => setConfirmar(true)}>Apagar ficha</button>`}
    </div>` : null}
  <//>`;
}

function Copiar({ texto, nav }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) { ref.current.focus(); ref.current.select(); } }, []);
  return html`<${Folha} titulo="Copiar ficha" rotuloFechar="Fechar" onFechar=${nav.fecharFolha}>
    <p class="dica">O texto já está selecionado. Use o copiar do seu aparelho.</p>
    <textarea id="copia" ref=${ref} class="nota-campo copia" readonly value=${texto}></textarea>
  <//>`;
}

/* ---------- Backup ---------- */
function Backup({ d }) {
  const meta = store.meta || {};
  const depois = meta.enviadoEm ? [...d.notas.values(), ...d.fichas.values()].filter((x) => carimbo(x) > meta.enviadoEm).length : 0;
  const imp = store.importacao;
  let versao = "";
  try { versao = window.Android ? window.Android.versao() : ""; } catch (e) {}
  return html`<div class="view">
    <header class="vhead"><h1 class="vtitle">Backup</h1></header>
    <section class="bloco">
      <div class="bloco-cabeca"><h2>Celular e tablet iguais</h2></div>
      <ol class="passos">
        <li><b>Envie</b><span>Toque em “Enviar o fichário” e mande o arquivo pelo Quick Share, WhatsApp, Drive ou e-mail.</span></li>
        <li><b>Importe</b><span>No outro aparelho, abra o arquivo com o Fichário. Ou salve o arquivo e toque em “Importar arquivo”.</span></li>
      </ol>
      <p class="dica">A importação junta os dois fichários: o que é novo entra, o que foi mexido fica com a versão mais recente e o que foi apagado sai. Nada se duplica. Para os dois aparelhos ficarem iguais, faça nos dois sentidos.</p>
      <div class="acoes">
        <button class="btn primario" onClick=${() => exportar("enviar")}>Enviar o fichário</button>
        <button class="btn" onClick=${() => { if (window.Android) window.Android.escolher(); else aviso("Importar funciona no app instalado."); }}>Importar arquivo</button>
      </div>
      <p class="meta">${meta.enviadoEm ? `Último arquivo gerado ${quando(meta.enviadoEm)}${depois ? `; ${plural(depois, "item mudou", "itens mudaram")} depois dele` : "; nada mudou depois dele"}.` : "Nenhum arquivo gerado ainda."}${meta.importadoEm ? ` Última importação ${quando(meta.importadoEm)}.` : ""}</p>
      ${imp ? html`<p class="resumo-import">${imp.nome}: ${resumoImportacao(imp)}</p>` : null}
    </section>
    <section class="bloco">
      <div class="bloco-cabeca"><h2>Cópia de segurança</h2></div>
      <p class="muted">Tudo fica guardado só neste aparelho, sem internet. Se trocar de celular ou desinstalar o app, você perde o que não tiver copiado. Guarde uma cópia de vez em quando, por exemplo no Drive.</p>
      <div class="acoes"><button class="btn" onClick=${() => exportar("salvar")}>Salvar cópia em…</button></div>
    </section>
    <section class="bloco">
      <div class="numeros">
        <div class="numero"><b>${d.fichas.size}</b><span>${d.fichas.size === 1 ? "ficha" : "fichas"}</span></div>
        <div class="numero"><b>${d.notas.size}</b><span>${d.notas.size === 1 ? "nota" : "notas"}</span></div>
      </div>
      ${versao ? html`<p class="meta">Fichário ${versao}</p>` : null}
    </section>
  </div>`;
}

/* listas de sugestão para os campos de texto */
const dlc = document.createElement("datalist");
dlc.id = "lista-classe";
for (const n of CLASSES) { const o = document.createElement("option"); o.value = n; dlc.appendChild(o); }
document.body.appendChild(dlc);

const dl = document.createElement("datalist");
dl.id = "lista-esp";
for (const [n] of ESPECIALIDADES) { const o = document.createElement("option"); o.value = n; dl.appendChild(o); }
document.body.appendChild(dl);

carregar();
aplicarTema();
const raiz = document.getElementById("app");
raiz.textContent = "";
render(html`<${App}/>`, raiz);
})();
