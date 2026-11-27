/* Dose por doença e conferência da prescrição, tudo a partir do texto da bula.

   Nada aqui é dose escrita à mão. O módulo faz três coisas com o texto oficial:
   1. acha, na posologia, os trechos (frases e linhas de tabela) que falam da doença pedida;
   2. lê os números de dose desses trechos ("25 mg/kg/day in divided doses every 12 hours",
      "500 mg once daily", "not to exceed 4 g/day") e o que eles significam: por dose ou por
      dia, por kg, intervalo, dose única, máximo;
   3. compara a prescrição digitada com esses números e diz se coincide, se está perto
      (com a diferença em %), se o intervalo é outro ou se passa de um máximo citado.

   A tabela DOENCAS só traduz nomes de doença do português para os termos que as bulas
   americanas usam. Ela não tem dose nenhuma. */
(function (raiz) {
  "use strict";

  var B = typeof module !== "undefined" && module.exports ? require("./bulas.js") : raiz.Bulas;

  /* ── doenças: nome em português → termos da bula em inglês ──────────
     termos: o nome da doença como aparece nas bulas; amplos: a categoria em que ela costuma
     estar (ex.: otite em "infections of the ear, nose, and throat"). O que for achado por um
     termo amplo aparece marcado como categoria ampla. */
  var DOENCAS = [
    { pt: "Otite média", chaves: ["otite", "otite media", "otite media aguda", "oma", "dor de ouvido"], termos: ["otitis media", "otitis"], amplos: ["ear"] },
    { pt: "Sinusite", chaves: ["sinusite", "rinossinusite", "sinusite aguda", "sinusite bacteriana"], termos: ["sinusitis", "rhinosinusitis"], amplos: ["nose", "upper respiratory"] },
    { pt: "Faringite / amigdalite", chaves: ["faringite", "amigdalite", "faringoamigdalite", "dor de garganta", "angina estreptococica"], termos: ["pharyngitis", "tonsillitis"], amplos: ["throat", "upper respiratory"] },
    { pt: "Pneumonia", chaves: ["pneumonia", "pac", "pneumonia comunitaria", "pneumonia hospitalar", "broncopneumonia"], termos: ["pneumonia"], amplos: ["lower respiratory"] },
    { pt: "Bronquite / exacerbação de DPOC", chaves: ["bronquite", "dpoc", "dpoc exacerbada", "exacerbacao de dpoc", "bronquite cronica"], termos: ["bronchitis", "chronic obstructive pulmonary disease", "COPD"], amplos: ["lower respiratory"] },
    { pt: "Infecção urinária", chaves: ["infeccao urinaria", "itu", "infeccao do trato urinario", "cistite", "pielonefrite", "infeccao urinaria baixa"], termos: ["urinary tract", "cystitis", "pyelonephritis"], amplos: ["genitourinary"] },
    { pt: "Prostatite", chaves: ["prostatite"], termos: ["prostatitis"], amplos: ["genitourinary"] },
    { pt: "Infecção de pele e partes moles", chaves: ["pele", "infeccao de pele", "celulite", "erisipela", "impetigo", "abscesso", "partes moles", "infeccao de partes moles", "furunculo"], termos: ["skin structure", "skin and soft tissue", "cellulitis", "erysipelas", "impetigo", "abscess"], amplos: ["skin"] },
    { pt: "H. pylori", chaves: ["h pylori", "helicobacter", "helicobacter pylori", "pylori"], termos: ["pylori"], amplos: ["duodenal ulcer"] },
    { pt: "Úlcera péptica", chaves: ["ulcera", "ulcera duodenal", "ulcera gastrica", "ulcera peptica"], termos: ["duodenal ulcer", "gastric ulcer", "peptic ulcer"], amplos: [] },
    { pt: "Refluxo / DRGE", chaves: ["refluxo", "drge", "doenca do refluxo", "esofagite", "azia", "pirose"], termos: ["gastroesophageal reflux", "GERD", "esophagitis", "heartburn"], amplos: [] },
    { pt: "Gonorreia", chaves: ["gonorreia", "gonococo", "uretrite gonococica"], termos: ["gonorrhea", "gonococcal"], amplos: ["urethritis", "cervicitis"] },
    { pt: "Uretrite / cervicite", chaves: ["uretrite", "cervicite", "uretrite nao gonococica"], termos: ["urethritis", "cervicitis"], amplos: [] },
    { pt: "Clamídia", chaves: ["clamidia", "chlamydia"], termos: ["chlamydia"], amplos: ["urethritis", "cervicitis"] },
    { pt: "Sífilis", chaves: ["sifilis", "lues"], termos: ["syphilis"], amplos: [] },
    { pt: "Cancro mole", chaves: ["cancro mole", "cancroide"], termos: ["chancroid"], amplos: ["genital ulcer"] },
    { pt: "Doença inflamatória pélvica", chaves: ["dip", "doenca inflamatoria pelvica"], termos: ["pelvic inflammatory"], amplos: [] },
    { pt: "Meningite", chaves: ["meningite"], termos: ["meningitis"], amplos: [] },
    { pt: "Endocardite", chaves: ["endocardite"], termos: ["endocarditis"], amplos: [] },
    { pt: "Osteomielite / infecção óssea", chaves: ["osteomielite", "infeccao ossea", "infeccao osteoarticular"], termos: ["osteomyelitis", "bone infection", "bone and joint"], amplos: ["bone"] },
    { pt: "Artrite séptica", chaves: ["artrite septica", "pioartrite"], termos: ["septic arthritis", "joint infection", "bone and joint"], amplos: [] },
    { pt: "Sepse / bacteremia", chaves: ["sepse", "septicemia", "bacteremia", "choque septico"], termos: ["septicemia", "sepsis", "bacteremia", "bloodstream"], amplos: [] },
    { pt: "Infecção intra-abdominal", chaves: ["infeccao intra abdominal", "intra abdominal", "peritonite", "apendicite", "abdome agudo infeccioso"], termos: ["intra-abdominal", "intraabdominal", "peritonitis", "appendicitis"], amplos: [] },
    { pt: "Neutropenia febril", chaves: ["neutropenia febril"], termos: ["febrile neutropenia", "neutropenic"], amplos: [] },
    { pt: "Colite por C. difficile", chaves: ["c difficile", "clostridium difficile", "clostridioides", "colite pseudomembranosa"], termos: ["difficile"], amplos: [] },
    { pt: "Profilaxia cirúrgica", chaves: ["profilaxia cirurgica", "profilaxia antibiotica", "antibioticoprofilaxia"], termos: ["perioperative prophylaxis", "surgical prophylaxis", "prophylaxis"], amplos: [] },
    { pt: "Febre reumática", chaves: ["febre reumatica", "profilaxia de febre reumatica"], termos: ["rheumatic fever"], amplos: [] },
    { pt: "Doença de Lyme", chaves: ["lyme", "doenca de lyme"], termos: ["lyme"], amplos: [] },
    { pt: "Tuberculose", chaves: ["tuberculose", "tb"], termos: ["tuberculosis"], amplos: [] },
    { pt: "Candidíase", chaves: ["candidiase", "candida", "monilíase", "monilase", "sapinho", "candidiase oral", "candidiase esofagica"], termos: ["candidiasis", "candida"], amplos: [] },
    { pt: "Candidíase vaginal", chaves: ["candidiase vaginal", "vulvovaginite", "candidiase vulvovaginal"], termos: ["vaginal candidiasis", "vulvovaginal"], amplos: ["candidiasis"] },
    { pt: "Vaginose bacteriana", chaves: ["vaginose", "vaginose bacteriana", "gardnerella"], termos: ["bacterial vaginosis"], amplos: [] },
    { pt: "Tricomoníase", chaves: ["tricomoniase", "trichomonas"], termos: ["trichomoniasis", "trichomonas"], amplos: [] },
    { pt: "Giardíase", chaves: ["giardiase", "giardia"], termos: ["giardiasis", "giardia"], amplos: [] },
    { pt: "Amebíase", chaves: ["amebiase", "ameba", "abscesso hepatico amebiano"], termos: ["amebiasis", "amebic"], amplos: [] },
    { pt: "Herpes simples", chaves: ["herpes", "herpes simples", "herpes genital", "herpes labial"], termos: ["herpes simplex", "genital herpes", "herpes labialis", "cold sores"], amplos: [] },
    { pt: "Herpes-zóster", chaves: ["herpes zoster", "zoster", "cobreiro"], termos: ["herpes zoster", "zoster", "shingles"], amplos: [] },
    { pt: "Varicela", chaves: ["varicela", "catapora"], termos: ["varicella", "chickenpox"], amplos: [] },
    { pt: "Influenza", chaves: ["influenza", "gripe", "h1n1"], termos: ["influenza"], amplos: [] },
    { pt: "HIV", chaves: ["hiv", "aids"], termos: ["HIV"], amplos: [] },
    { pt: "Trombose venosa profunda", chaves: ["tvp", "trombose", "trombose venosa", "trombose venosa profunda", "tromboembolismo venoso", "tev"], termos: ["deep vein thrombosis", "DVT", "venous thromboembolism"], amplos: [] },
    { pt: "Embolia pulmonar", chaves: ["tep", "embolia pulmonar", "tromboembolismo pulmonar"], termos: ["pulmonary embolism"], amplos: [] },
    { pt: "Profilaxia de TVP", chaves: ["profilaxia de tvp", "profilaxia de trombose", "profilaxia de tev", "tromboprofilaxia"], termos: ["prophylaxis of deep vein thrombosis", "prophylaxis of DVT", "DVT prophylaxis", "thromboprophylaxis", "hip or knee replacement", "hip replacement", "knee replacement", "abdominal surgery", "severely restricted mobility", "medical patients"], amplos: ["prophylaxis"] },
    { pt: "Fibrilação atrial", chaves: ["fibrilacao atrial", "fa", "flutter"], termos: ["atrial fibrillation", "atrial flutter"], amplos: [] },
    { pt: "Síndrome coronariana sem supra", chaves: ["angina instavel", "iam sem supra", "iamssst", "sca sem supra", "sindrome coronariana"], termos: ["unstable angina", "non-Q-wave", "NSTEMI", "non-ST"], amplos: ["myocardial infarction"] },
    { pt: "Infarto com supra", chaves: ["iam", "infarto", "iam com supra", "iamcsst", "infarto agudo do miocardio"], termos: ["STEMI", "ST-segment elevation", "myocardial infarction"], amplos: [] },
    { pt: "Angina", chaves: ["angina", "angina estavel"], termos: ["angina"], amplos: [] },
    { pt: "Hipertensão", chaves: ["hipertensao", "has", "pressao alta", "hipertensao arterial"], termos: ["hypertension"], amplos: [] },
    { pt: "Insuficiência cardíaca", chaves: ["insuficiencia cardiaca", "ic", "icc", "insuficiencia cardiaca congestiva"], termos: ["heart failure"], amplos: [] },
    { pt: "Edema", chaves: ["edema", "inchaco", "edema agudo de pulmao"], termos: ["edema"], amplos: [] },
    { pt: "Diabetes", chaves: ["diabetes", "dm", "dm2", "diabetes tipo 2", "diabetes mellitus"], termos: ["type 2 diabetes", "diabetes mellitus", "glycemic control"], amplos: ["diabetes"] },
    { pt: "Dislipidemia", chaves: ["dislipidemia", "colesterol", "hipercolesterolemia", "hipertrigliceridemia"], termos: ["hyperlipidemia", "hypercholesterolemia", "dyslipidemia", "LDL-C", "hypertriglyceridemia"], amplos: [] },
    { pt: "Hipotireoidismo", chaves: ["hipotireoidismo"], termos: ["hypothyroidism"], amplos: [] },
    { pt: "Dor", chaves: ["dor", "analgesia", "dor aguda", "dor cronica"], termos: ["pain"], amplos: [] },
    { pt: "Febre", chaves: ["febre", "antitermico"], termos: ["fever"], amplos: [] },
    { pt: "Artrite reumatoide", chaves: ["artrite reumatoide", "ar"], termos: ["rheumatoid arthritis"], amplos: [] },
    { pt: "Osteoartrite", chaves: ["osteoartrite", "artrose", "osteoartrose"], termos: ["osteoarthritis"], amplos: [] },
    { pt: "Gota", chaves: ["gota", "artrite gotosa"], termos: ["gout", "gouty"], amplos: [] },
    { pt: "Dismenorreia", chaves: ["dismenorreia", "colica menstrual"], termos: ["dysmenorrhea"], amplos: [] },
    { pt: "Enxaqueca", chaves: ["enxaqueca", "migranea"], termos: ["migraine"], amplos: [] },
    { pt: "Epilepsia / crise convulsiva", chaves: ["epilepsia", "convulsao", "crise convulsiva", "crise epileptica", "convulsoes"], termos: ["seizure", "epilepsy", "partial-onset", "myoclonic", "tonic-clonic"], amplos: [] },
    { pt: "Estado de mal epiléptico", chaves: ["estado de mal", "estado de mal epileptico", "status epilepticus"], termos: ["status epilepticus"], amplos: ["seizure"] },
    { pt: "Náusea e vômito", chaves: ["nausea", "vomito", "nauseas", "vomitos", "nausea e vomito", "emese"], termos: ["nausea", "vomiting"], amplos: [] },
    { pt: "Náusea por quimioterapia", chaves: ["nausea por quimioterapia", "vomito por quimioterapia", "quimioterapia"], termos: ["chemotherapy-induced nausea", "emetogenic"], amplos: ["nausea"] },
    { pt: "Náusea pós-operatória", chaves: ["nausea pos operatoria", "vomito pos operatorio", "pos operatorio"], termos: ["postoperative nausea"], amplos: ["nausea"] },
    { pt: "Gastroparesia", chaves: ["gastroparesia"], termos: ["gastroparesis"], amplos: [] },
    { pt: "Asma / broncoespasmo", chaves: ["asma", "broncoespasmo", "crise asmatica", "chiado"], termos: ["asthma", "bronchospasm"], amplos: [] },
    { pt: "Rinite alérgica", chaves: ["rinite", "rinite alergica"], termos: ["allergic rhinitis", "seasonal allergic"], amplos: [] },
    { pt: "Urticária", chaves: ["urticaria"], termos: ["urticaria"], amplos: [] },
    { pt: "Anafilaxia", chaves: ["anafilaxia", "choque anafilatico"], termos: ["anaphylaxis", "anaphylactic"], amplos: [] },
    { pt: "Doenças alérgicas", chaves: ["alergia", "alergico", "reacao alergica"], termos: ["allergic states", "allergic conditions", "allergic disorders"], amplos: [] },
    { pt: "Depressão", chaves: ["depressao", "transtorno depressivo"], termos: ["major depressive", "depression"], amplos: [] },
    { pt: "Ansiedade / pânico", chaves: ["ansiedade", "tag", "panico", "transtorno de panico", "transtorno de ansiedade"], termos: ["anxiety", "panic disorder"], amplos: [] },
    { pt: "TOC", chaves: ["toc", "transtorno obsessivo compulsivo"], termos: ["obsessive-compulsive", "obsessive compulsive"], amplos: [] },
    { pt: "Estresse pós-traumático", chaves: ["tept", "estresse pos traumatico"], termos: ["posttraumatic stress", "PTSD"], amplos: [] },
    { pt: "Esquizofrenia", chaves: ["esquizofrenia", "psicose"], termos: ["schizophrenia"], amplos: [] },
    { pt: "Transtorno bipolar", chaves: ["bipolar", "transtorno bipolar", "mania"], termos: ["bipolar"], amplos: [] },
    { pt: "Insônia", chaves: ["insonia"], termos: ["insomnia"], amplos: [] },
    { pt: "Choque / hipotensão", chaves: ["choque", "hipotensao", "choque distributivo"], termos: ["hypotension", "shock", "blood pressure control"], amplos: [] },
    { pt: "Parada cardíaca", chaves: ["parada", "parada cardiaca", "pcr"], termos: ["cardiac arrest"], amplos: [] },
    { pt: "Hipocalemia", chaves: ["hipocalemia", "hipopotassemia"], termos: ["hypokalemia", "potassium depletion"], amplos: [] },
    { pt: "Hipomagnesemia", chaves: ["hipomagnesemia"], termos: ["hypomagnesemia", "magnesium deficiency"], amplos: [] },
    { pt: "Pré-eclâmpsia / eclâmpsia", chaves: ["pre eclampsia", "eclampsia", "preeclampsia"], termos: ["preeclampsia", "pre-eclampsia", "eclampsia"], amplos: [] },
    { pt: "Anemia ferropriva", chaves: ["anemia ferropriva", "deficiencia de ferro", "anemia"], termos: ["iron deficiency"], amplos: [] },
    { pt: "Constipação", chaves: ["constipacao", "prisao de ventre", "obstipacao"], termos: ["constipation"], amplos: [] },
    { pt: "Diarreia", chaves: ["diarreia"], termos: ["diarrhea"], amplos: [] },
    { pt: "Acne", chaves: ["acne"], termos: ["acne"], amplos: [] },
    { pt: "Psoríase", chaves: ["psoriase"], termos: ["psoriasis"], amplos: [] },
    { pt: "Malária", chaves: ["malaria"], termos: ["malaria"], amplos: [] },
    { pt: "Toxoplasmose", chaves: ["toxoplasmose"], termos: ["toxoplasmosis"], amplos: [] },
    { pt: "Pneumocistose", chaves: ["pneumocistose", "pneumocystis", "pcp"], termos: ["pneumocystis"], amplos: [] },
    { pt: "Shigelose", chaves: ["shigelose", "shigella"], termos: ["shigellosis", "shigella"], amplos: [] },
    { pt: "Diarreia do viajante", chaves: ["diarreia do viajante"], termos: ["travelers' diarrhea", "traveler's diarrhea", "travelers diarrhea"], amplos: [] },
    { pt: "Febre tifoide", chaves: ["febre tifoide", "tifo", "salmonela"], termos: ["typhoid"], amplos: [] },
    { pt: "Doença inflamatória intestinal", chaves: ["retocolite", "colite ulcerativa", "crohn", "doenca de crohn", "dii"], termos: ["ulcerative colitis", "crohn"], amplos: [] },
    { pt: "Lúpus", chaves: ["lupus", "les"], termos: ["lupus"], amplos: [] },
    { pt: "Edema cerebral", chaves: ["edema cerebral"], termos: ["cerebral edema"], amplos: [] },
    { pt: "Insuficiência adrenal", chaves: ["insuficiencia adrenal", "insuficiencia suprarrenal", "addison"], termos: ["adrenocortical insufficiency", "adrenal insufficiency"], amplos: [] },
    { pt: "Verminose", chaves: ["verminose", "helmintiase", "ascaridiase", "ancilostomiase", "oxiuriase", "estrongiloidiase"], termos: ["ascariasis", "hookworm", "pinworm", "enterobiasis", "strongyloidiasis", "helminth"], amplos: [] },
    { pt: "Escabiose / pediculose", chaves: ["escabiose", "sarna", "piolho", "pediculose"], termos: ["scabies", "lice", "pediculosis"], amplos: [] },
    { pt: "Abstinência alcoólica", chaves: ["abstinencia alcoolica", "abstinencia"], termos: ["alcohol withdrawal"], amplos: [] },
    { pt: "Dor neuropática", chaves: ["dor neuropatica", "neuralgia", "neuropatia diabetica", "neuralgia pos herpetica"], termos: ["neuropathic pain", "postherpetic neuralgia", "diabetic peripheral neuropathy"], amplos: [] },
    { pt: "Arritmia ventricular", chaves: ["arritmia ventricular", "taquicardia ventricular", "fibrilacao ventricular", "tv", "fv"], termos: ["ventricular arrhythmia", "ventricular tachycardia", "ventricular fibrillation"], amplos: [] },
    { pt: "Ajuste renal", chaves: ["renal", "rim", "insuficiencia renal", "ajuste renal", "drc", "doenca renal", "dialise", "hemodialise", "clearance"], termos: ["renal impairment", "renal insufficiency", "creatinine clearance", "CrCl", "GFR", "hemodialysis", "dialysis", "renal"], amplos: [] },
    { pt: "Ajuste hepático", chaves: ["hepatico", "figado", "insuficiencia hepatica", "ajuste hepatico", "cirrose", "hepatopatia"], termos: ["hepatic impairment", "hepatic insufficiency", "cirrhosis", "Child-Pugh", "hepatic"], amplos: [] }
  ];

  // as chaves são comparadas já sem acento e em minúsculas, como o que for digitado
  DOENCAS.forEach(function (d) { d.chaves = d.chaves.map(B.chaveNome); });

  /* ── texto: frases e termos ─────────────────────────────────────── */

  var ABREVIACOES = /(?:^|\s)(?:e\.g|i\.e|approx|Fig|Figs|No|vs|spp|sp|Dr|St|Inc|Ltd|U\.S|mos|wks|hrs|max|min|ca|subsp|var|[A-Z])$/;

  /** Quebra em frases sem mudar o texto: corta depois de ". " quando vem maiúscula, número ou marcador. */
  function frases(texto) {
    var t = String(texto || "");
    var saida = [];
    var ini = 0;
    var re = /[.!?]\s+(?=[A-Z0-9(•"“[])/g;
    var m;
    while ((m = re.exec(t))) {
      var antes = t.slice(ini, m.index);
      if (ABREVIACOES.test(antes)) continue;
      var f = t.slice(ini, m.index + 1).trim();
      if (f) saida.push(f);
      ini = m.index + m[0].length;
    }
    var resto = t.slice(ini).trim();
    if (resto) saida.push(resto);
    return saida;
  }

  function escapar(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  /** Expressão que acha um termo como palavra inteira (com plural), ignorando maiúsculas. */
  function regexTermo(termo) {
    var partes = String(termo).trim().split(/[\s,/-]+/).filter(Boolean).map(escapar);
    return new RegExp("(?:^|[^A-Za-z0-9])(" + partes.join("[\\s,/-]+") + ")(?:e?s)?(?![A-Za-z0-9])", "i");
  }

  /**
   * O que foi digitado → doenças da tabela e termos para procurar na bula.
   * Sem correspondência na tabela, procura o texto digitado como está (para quem escreve em inglês).
   */
  function interpretar(consulta) {
    var q = B.chaveNome(consulta).replace(/[+/]/g, " ").replace(/\s+/g, " ").trim();
    if (q.length < 2) return { consulta: consulta, doencas: [], termos: [] };
    var achadas = DOENCAS.filter(function (d) {
      return d.chaves.some(function (c) { return (" " + q + " ").indexOf(" " + c + " ") >= 0; });
    });
    // a chave mais longa ganha ("profilaxia de tvp" antes de "tvp")
    var maior = 0;
    achadas.forEach(function (d) {
      d.chaves.forEach(function (c) { if ((" " + q + " ").indexOf(" " + c + " ") >= 0) maior = Math.max(maior, c.length); });
    });
    achadas = achadas.filter(function (d) {
      return d.chaves.some(function (c) { return c.length === maior && (" " + q + " ").indexOf(" " + c + " ") >= 0; });
    });
    var termos = [];
    var vistos = {};
    function por(t, amplo, doenca) {
      var k = t.toLowerCase();
      if (vistos[k]) return;
      vistos[k] = true;
      termos.push({ termo: t, amplo: amplo, doenca: doenca });
    }
    achadas.forEach(function (d) { d.termos.forEach(function (t) { por(t, false, d.pt); }); });
    achadas.forEach(function (d) { d.amplos.forEach(function (t) { por(t, true, d.pt); }); });
    if (!achadas.length && q.length >= 3) por(String(consulta).trim(), false, null);
    return { consulta: consulta, doencas: achadas, termos: termos };
  }

  /** Acha o termo no texto, menos quando vem negado ("non-gonococcal" não é "gonococcal"). */
  function acharTermo(texto, termo) {
    var re = new RegExp(regexTermo(termo).source, "gi");
    var m;
    while ((m = re.exec(texto))) {
      var ini = m.index + m[0].indexOf(m[1]);
      if (/\bnon[-\s]?$/i.test(texto.slice(Math.max(0, ini - 4), ini))) continue;
      if (/\b(?:other\s+than|except(?:\s+for)?|excluding|not\s+(?:indicated|recommended|approved)\s+(?:for|in))\s+(?:the\s+)?(?:[a-z-]+\s+){0,2}$/i.test(texto.slice(Math.max(0, ini - 45), ini))) continue;
      return { achado: m[1], ini: ini };
    }
    return null;
  }

  /** Primeiro termo (do mais específico ao mais amplo) que aparece no texto. */
  function termoNo(texto, termos) {
    for (var i = 0; i < termos.length; i++) {
      var m = acharTermo(texto, termos[i].termo);
      if (m) return { termo: termos[i], achado: m.achado };
    }
    return null;
  }

  /** Doenças da tabela que aparecem nas indicações da bula, na ordem em que aparecem. */
  function doencasDaBula(rotulo) {
    var s = (rotulo && rotulo.secoes) || {};
    var ind = s.indications_and_usage || s.purpose || "";
    if (!ind) return [];
    var lista = [];
    DOENCAS.forEach(function (d) {
      if (d.pt === "Ajuste renal" || d.pt === "Ajuste hepático") return;
      var pos = Infinity;
      d.termos.concat(d.amplos).forEach(function (t) {
        var m = acharTermo(ind, t);
        if (m && m.ini < pos) pos = m.ini;
      });
      if (pos < Infinity) lista.push({ doenca: d, pos: pos });
    });
    lista.sort(function (a, b) { return a.pos - b.pos; });
    return lista.map(function (x) { return x.doenca; });
  }

  /* ── leitura dos números de dose ────────────────────────────────── */

  var NUM = "(?:\\d{1,3}(?:,\\d{3})+|\\d+)(?:\\.\\d+)?";
  var UNI = "(?:million\\s+(?:international\\s+)?units?|million\\s+IU|international\\s+units?|USP\\s+units?|units?|IU|mEq|mmol|mcg|µg|μg|micrograms?|mg|milligrams?|grams?|gm|g)";
  var RE_VALOR = new RegExp(
    "(" + NUM + ")\\s*(" + UNI + ")?\\s*(?:to|-|–|—)\\s*(" + NUM + ")\\s*(" + UNI + ")(?![A-Za-z])" +
      "|(" + NUM + ")\\s*(" + UNI + ")(?![A-Za-z])",
    "gi"
  );

  function lerNum(s) {
    return parseFloat(String(s).replace(/,/g, ""));
  }

  /** Unidade da bula → {u, fator}: massa em mg, unidades em UI. */
  function unidade(s) {
    var u = String(s || "").toLowerCase().replace(/\s+/g, " ");
    if (/million/.test(u)) return { u: "UI", fator: 1e6 };
    if (/unit|^iu$/.test(u)) return { u: "UI", fator: 1 };
    if (u === "meq") return { u: "mEq", fator: 1 };
    if (u === "mmol") return { u: "mmol", fator: 1 };
    if (/^(mcg|µg|μg|microgram)/.test(u)) return { u: "mg", fator: 0.001 };
    if (/^(mg|milligram)/.test(u)) return { u: "mg", fator: 1 };
    if (/^(g|gm|gram)/.test(u)) return { u: "mg", fator: 1000 };
    return null;
  }

  /**
   * Intervalos em horas descritos num trecho: every 12 hours, twice daily, q8h...
   * Devolve o primeiro, com as alternativas ("once a day (or ... twice a day)") em .opcoes.
   */
  function frequencia(t) {
    var achados = [];
    function por(re, f) {
      var g = new RegExp(re.source, "gi");
      var m;
      while ((m = g.exec(t))) achados.push({ ini: m.index, fim: m.index + m[0].length, v: f(m) });
    }
    var mult = function (u) { return /^d/i.test(u) ? 24 : /^w/i.test(u) ? 168 : 1; };
    por(/\bevery\s+(\d+(?:\.\d+)?)\s*(?:(?:to|or|-|–)\s*(?:every\s+)?(\d+(?:\.\d+)?)\s*)?(hours?|hrs?|h|days?|weeks?)\b/i, function (m) {
      var k = mult(m[3]);
      return { lo: +m[1] * k, hi: +(m[2] || m[1]) * k };
    });
    por(/\bevery\s+other\s+day\b/i, function () { return { lo: 48, hi: 48 }; });
    por(/\bq\s?(\d+)\s?(?:h|hr|hrs|hours?)\b/i, function (m) { return { lo: +m[1], hi: +m[1] }; });
    por(/\b([1-9])\s+times\s+(?:a\s+|per\s+|each\s+)?(?:daily|day)\b/i, function (m) { return { lo: 24 / +m[1], hi: 24 / +m[1] }; });
    por(/\b(?:twice|two\s+times)\s+(?:a\s+|per\s+|each\s+)?(?:daily|day)\b|\bb\.?i\.?d\.?(?![a-z])/i, function () { return { lo: 12, hi: 12 }; });
    por(/\b(?:three\s+times|thrice)\s+(?:a\s+|per\s+|each\s+)?(?:daily|day)\b|\bt\.?i\.?d\.?(?![a-z])/i, function () { return { lo: 8, hi: 8 }; });
    por(/\bfour\s+times\s+(?:a\s+|per\s+|each\s+)?(?:daily|day)\b|\bq\.?i\.?d\.?(?![a-z])/i, function () { return { lo: 6, hi: 6 }; });
    por(/\b(?:once|one\s+time)\s+(?:a\s+|per\s+|each\s+)?week(?:ly)?\b|\bweekly\b/i, function () { return { lo: 168, hi: 168 }; });
    por(/\b(?:once|one\s+time)\s+(?:a\s+|per\s+|each\s+|every\s+)?(?:daily|day)\b|\bevery\s+day\b|\bonce\s+every\s+24/i, function () { return { lo: 24, hi: 24 }; });
    por(/\bdaily\b/i, function () { return { lo: 24, hi: 24, generico: true }; });
    if (!achados.length) return null;
    achados.sort(function (a, b) { return a.ini - b.ini || (a.v.generico ? 1 : 0) - (b.v.generico ? 1 : 0); });
    // "once daily" também casa com "daily": fica só o achado que começa antes
    var unicos = [];
    achados.forEach(function (a) {
      if (unicos.some(function (u) { return a.ini < u.fim && a.fim > u.ini; })) return;
      unicos.push(a);
    });
    var f = unicos[0];
    var opcoes = [];
    unicos.forEach(function (a, i) {
      if (i > 0 && !/\bor\b/i.test(t.slice(unicos[i - 1].fim, a.ini))) return; // só alternativas ligadas por "or"
      if (i > 0 && a.v.generico) return;
      if (!opcoes.some(function (o) { return o.lo === a.v.lo && o.hi === a.v.hi; })) opcoes.push({ lo: a.v.lo, hi: a.v.hi });
    });
    return { lo: f.v.lo, hi: f.v.hi, generico: !!f.v.generico, fim: f.fim, opcoes: opcoes };
  }

  var RE_MAX = /(?:not\s+(?:to\s+)?exceed(?:ing)?|(?:do|should|must|will)\s+not\s+exceed|exceed\s*$|maximum|\bmax\b\.?|up\s+to|no\s+more\s+than|not\s+more\s+than|upper\s+(?:dose|limit)|should\s+not\s+be\s+(?:greater|more)\s+than|limited\s+to|ceiling)/i;

  /**
   * Os números de dose de um trecho, com o que cada um significa.
   * Cada valor: {lo, hi, u, porKg, porM2, base ("dose"|"dia"|"h"|"min"|"?"), freq, unica, max, maxBase, texto}.
   */
  function valores(texto) {
    var t = String(texto || "");
    var re = new RegExp(RE_VALOR.source, "gi");
    var achados = [];
    var m;
    while ((m = re.exec(t))) achados.push({ m: m, ini: m.index, fim: m.index + m[0].length });
    var lista = [];
    achados.forEach(function (a, i) {
      var g = a.m;
      var lo, hi, nu;
      if (g[3] != null) {
        nu = unidade(g[4]);
        var nu1 = g[2] ? unidade(g[2]) : nu;
        if (!nu || !nu1 || nu1.u !== nu.u) return;
        lo = lerNum(g[1]) * nu1.fator;
        hi = lerNum(g[3]) * nu.fator;
      } else {
        nu = unidade(g[6]);
        if (!nu) return;
        lo = hi = lerNum(g[5]) * nu.fator;
      }
      if (!(lo > 0) || !(hi >= lo)) return;
      var resto = t.slice(a.fim);
      // concentração ou diluição ("250 mg/5 mL", "mg/mL", "500 mg in 100 mL"): não é dose
      if (/^\s*(?:\/|per|in|of)\s*(?:\d+(?:\.\d+)?\s*)?(?:mL|L)\b/i.test(resto)) return;
      var porKg = false;
      var porM2 = false;
      var base = null;
      var usado = 0;
      var s1 = /^\s*(?:\/|per)\s*(kg|kilogram|m2|m²|m\s?2|square\s+met(?:er|re))(?:\s+(?:of\s+)?body\s+weight)?/i.exec(resto);
      if (s1) {
        if (/kg|kilo/i.test(s1[1])) porKg = true;
        else porM2 = true;
        usado = s1[0].length;
      }
      var s2 = /^\s*(?:\/|per)\s*(day|d|24\s*h(?:ours?|rs?)?|dose|hour|hr|h|minute|min)\b/i.exec(resto.slice(usado));
      if (s2) {
        var per = s2[1].toLowerCase().replace(/\s+/g, "");
        base = per === "day" || per === "d" || /^24/.test(per) ? "dia" : per === "dose" ? "dose" : /^min/.test(per) ? "min" : "h";
        usado += s2[0].length;
      } else if (/^\s*a\s+day\b/i.test(resto.slice(usado))) {
        base = "dia";
      }
      var proximo = i + 1 < achados.length ? achados[i + 1].ini : t.length;
      var inicioDepois = a.fim + usado;
      var depois = t.slice(inicioDepois, Math.max(inicioDepois, Math.min(proximo, inicioDepois + 110))).split(/;|\.\s/)[0];
      var anterior = i > 0 ? achados[i - 1].fim : 0;
      var antes = t.slice(Math.max(anterior, a.ini - 80), a.ini).split(/;|\.\s/).pop();

      // força da apresentação ("each 5 mL contains 250 mg") e degraus de titulação não são dose
      if (/increments?\s+of\s*$/i.test(antes)) return;
      var forca = /contain(?:s|ing)?\s*$|strengths?\s*(?:of\s*)?$|equivalent\s+to\s*$|(?:capsules?|tablets?|vials?|bottles?|packets?)\s*\(\s*$/i.test(antes);
      var totalDepois = /^\s*(?:as\s+a\s+|of\s+)?(?:total\s+daily|daily\s+(?:dose|dosage|total)|(?:per|a)\s+day\b|in\s+24\s+hours)/i.test(depois);
      if (totalDepois) base = "dia";
      var dividido = /divided/i.test(depois.slice(0, 70)) || /(?:total\s+)?daily\s+(?:dose|dosage)|\bper\s+day\b|\bdaily\s+total|\btotal\s+of\s*$/i.test(antes);
      if (!base && dividido) base = "dia";
      var unica = /single\s+dose|single-dose|as\s+a\s+single|one\s+time\s+only|once\s+only|in\s+a\s+single/i.test(depois.slice(0, 40)) || /\bsingle\s*$|\bsingle\s+(?:[a-z]+\s+){0,2}dose\s+(?:of\s+)?$/i.test(antes);
      var f = unica || base === "h" || base === "min" ? null : frequencia(depois);
      if (f && f.generico && (dividido || totalDepois)) f = null; // "2 g daily in divided doses": daily é do total
      if (forca && !f && !unica && !base && !s1) return;
      if (!base) base = f || unica ? "dose" : "?";
      var max = RE_MAX.test(antes);
      var maxBase = null;
      if (max && f && f.generico) {
        base = "dia"; // "not to exceed 4 grams daily": o máximo é do dia
        f = null;
      }
      if (max) {
        var perto = antes + " " + depois.slice(0, 50);
        if (base === "dia" || base === "dose") maxBase = base === "dose" && !s2 && !f ? (/daily|per\s+day|a\s+day|in\s+24\s+hours|24-hour/i.test(perto) ? "dia" : "?") : base;
        else maxBase = "?";
        if (maxBase === "?" && /daily|per\s+day|a\s+day|in\s+24\s+hours|24-hour|divided/i.test(perto)) maxBase = "dia";
        if (maxBase === "?" && /single\s+dose|per\s+dose|each\s+dose|per\s+injection|per\s+infusion/i.test(perto)) maxBase = "dose";
      }
      var fimTexto = inicioDepois + (f ? f.fim : 0);
      if (!f && dividido && /divided\s+dose/i.test(depois)) fimTexto = inicioDepois + depois.search(/divided\s+doses?/i) + /divided\s+doses?/i.exec(depois)[0].length;
      if (unica) {
        var su = /as\s+a\s+single(?:\s+(?:[a-z]+\s+)?dose)?|single(?:\s+[a-z]+)?\s+dose|single-dose/i.exec(depois.slice(0, 40));
        if (su) fimTexto = inicioDepois + su.index + su[0].length;
      }
      lista.push({
        lo: lo,
        hi: hi,
        u: nu.u,
        porKg: porKg,
        porM2: porM2,
        base: base,
        freq: f ? { lo: f.lo, hi: f.hi, opcoes: f.opcoes } : null,
        unica: unica,
        max: max,
        maxBase: maxBase,
        texto: t.slice(a.ini, fimTexto).trim(),
        ini: a.ini
      });
    });
    // "40 mg/kg sulfamethoxazole and 8 mg/kg trimethoprim per 24 hours, given in two divided doses"
    for (var q = lista.length - 1; q > 0; q--) {
      var b2 = lista[q];
      var a2 = lista[q - 1];
      if (a2.base !== "?" || a2.max || b2.base === "?" || a2.porKg !== b2.porKg) continue;
      var entre = t.slice(a2.ini + a2.texto.length, b2.ini);
      if (/^\s*[A-Za-z-]+(?:\s+[A-Za-z-]+)?\s*,?\s*(?:and|plus|with)\s*$/i.test(entre)) {
        a2.base = b2.base;
        a2.freq = b2.freq;
      }
    }
    // "1 gram amoxicillin, 500 mg clarithromycin, and 30 mg lansoprazole, all given twice daily":
    // o intervalo do fim vale para a lista toda
    for (var k = lista.length - 1; k > 0; k--) {
      var dono = lista[k];
      if (!dono.freq || !/\b(?:all|each|both)\s+(?:given|administered|taken)\b/i.test(t.slice(dono.ini, dono.ini + dono.texto.length + 1))) continue;
      for (var j = k - 1; j >= 0 && (lista[j].base === "?" || lista[j].freq === dono.freq) && !lista[j].max; j--) {
        lista[j].base = "dose";
        lista[j].freq = dono.freq;
      }
    }
    return lista;
  }

  /* ── população de um trecho ─────────────────────────────────────── */

  /** O trecho é de ajuste para rim ou fígado? */
  function situacao(ctx) {
    var t = String(ctx || "");
    if (/renal\s+(?:impairment|insufficiency|function|failure|disease)|creatinine\s+clearance|\bCrCl\b|\bCLcr\b|\bGFR\b|e?GFR|dialysis|hemodialysis|\bCRRT\b|end-stage\s+renal/i.test(t)) return "renal";
    if (/hepatic\s+(?:impairment|insufficiency|disease|dysfunction)|cirrhosis|Child[-\s]?Pugh/i.test(t)) return "hepatica";
    return null;
  }

  function populacao(ctx) {
    var t = String(ctx || "");
    var ped = /pediatric|paediatric|\bchild(?:ren|hood)?\b(?![-\s]?pugh)|\binfant|neonat|newborn|adolescent|\bmonths?\s+(?:of\s+age|old)|weigh(?:ing|t)\s+(?:less\s+than|<|under)\s*\d+\s*kg|younger\s+than\s+\d+\s+years/i.test(t);
    var adu = /\badults?\b/i.test(t);
    return ped && adu ? "ambos" : ped ? "crianca" : adu ? "adulto" : "?";
  }

  /* ── tabelas: grade com rowspan e colspan desfeitos ─────────────── */

  /** linhas: [[{texto, rowspan, colspan, cab}]] → grade de textos, cada linha com todas as colunas. */
  function grade(linhas) {
    var g = [];
    linhas.forEach(function (linha, r) {
      g[r] = g[r] || [];
      var c = 0;
      linha.forEach(function (cel) {
        while (g[r][c]) c++;
        var rs = Math.max(1, Math.min(50, cel.rowspan || 1));
        var cs = Math.max(1, Math.min(50, cel.colspan || 1));
        for (var i = 0; i < rs; i++) {
          for (var j = 0; j < cs; j++) {
            g[r + i] = g[r + i] || [];
            g[r + i][c + j] = { texto: cel.texto, cab: !!cel.cab, repetida: i > 0 || j > 0 };
          }
        }
        c += cs;
      });
    });
    return g.filter(Boolean).map(function (l) {
      for (var k = 0; k < l.length; k++) if (!l[k]) l[k] = { texto: "", cab: false, repetida: false };
      return l;
    });
  }

  /** Texto de um elemento com espaço entre parágrafos e quebras ("for" + "Adults", não "forAdults"). */
  function textoDe(no) {
    var partes = [];
    (function andar(n) {
      for (var i = 0; i < n.childNodes.length; i++) {
        var c = n.childNodes[i];
        if (c.nodeType === 3) partes.push(c.nodeValue);
        else if (c.nodeType === 1) {
          var bloco = /^(P|BR|LI|DIV|UL|OL|TR|TD|TH)$/.test(c.tagName);
          if (bloco) partes.push(" ");
          andar(c);
          if (bloco) partes.push(" ");
        }
      }
    })(no);
    return partes.join("").replace(/\s+/g, " ").trim();
  }

  /** Lê as linhas de uma tabela já limpa (elemento <table>) para a grade. */
  function linhasDaTabela(tabela) {
    var linhas = [];
    var nCab = 0;
    var trs = tabela.querySelectorAll("tr");
    for (var i = 0; i < trs.length; i++) {
      var tr = trs[i];
      if (tr.parentNode && tr.parentNode.tagName === "THEAD") nCab = i + 1;
      var cels = [];
      for (var j = 0; j < tr.children.length; j++) {
        var td = tr.children[j];
        if (td.tagName !== "TD" && td.tagName !== "TH") continue;
        cels.push({
          texto: textoDe(td),
          rowspan: parseInt(td.getAttribute("rowspan"), 10) || 1,
          colspan: parseInt(td.getAttribute("colspan"), 10) || 1,
          cab: td.tagName === "TH"
        });
      }
      linhas.push(cels);
    }
    var cap = tabela.querySelector("caption");
    return { linhas: linhas, cabecalhos: Math.max(nCab, 1), titulo: cap ? textoDe(cap) : "" };
  }

  /* ── trechos da posologia ───────────────────────────────────────── */

  function tokens(s) {
    return String(s || "").toLowerCase().match(/[a-z0-9]+/g) || [];
  }

  /**
   * A posologia em unidades pequenas: frases do texto e linhas das tabelas.
   * tabelasLidas: [{linhas, cabecalhos, titulo}] (de linhasDaTabela), na ordem da bula.
   * Frases que só repetem uma tabela achatada no texto são descartadas (a tabela fica).
   */
  function trechosDaPosologia(rotulo, tabelasLidas) {
    var s = (rotulo && rotulo.secoes) || {};
    var campo = s.dosage_and_administration ? "dosage_and_administration" : s.directions ? "directions" : null;
    var unidades = [];
    // sequências de 5 palavras das tabelas, na ordem em que estão: a tabela achatada no texto
    // repete essas sequências; uma frase que só usa as mesmas palavras, não
    var sequencias = {};
    var N = 5;
    var textoTabelas = "";
    function compacto(t) {
      return String(t || "").toLowerCase().replace(/[^a-z0-9.]+/g, "");
    }
    /** Toda dose da frase está nas tabelas? Só então a frase pode sair como cópia da tabela. */
    function dosesNasTabelas(f) {
      return valores(f).every(function (v) {
        return textoTabelas.indexOf(compacto(v.texto.split(/\s+/).slice(0, 2).join(" "))) >= 0;
      });
    }
    function guardarSequencias(tk) {
      for (var i = 0; i + N <= tk.length; i++) sequencias[tk.slice(i, i + N).join(" ")] = true;
    }
    (tabelasLidas || []).forEach(function (tab, ti) {
      var g = grade(tab.linhas);
      var nCab = Math.min(tab.cabecalhos, g.length - 1);
      var cabs = [];
      for (var c = 0; g[0] && c < g[0].length; c++) {
        var partes = [];
        for (var r = 0; r < nCab; r++) if (g[r][c] && g[r][c].texto && partes.indexOf(g[r][c].texto) < 0) partes.push(g[r][c].texto);
        cabs.push(partes.join(" · "));
      }
      var emOrdem = [tab.titulo];
      tab.linhas.forEach(function (l) { l.forEach(function (cel) { emOrdem.push(cel.texto); }); });
      guardarSequencias(tokens(emOrdem.join(" ")));
      textoTabelas += " " + compacto(emOrdem.join(" "));
      var subtitulo = "";
      for (var r2 = nCab; r2 < g.length; r2++) {
        var linha = g[r2];
        if (!linha.some(function (c) { return c.texto; })) continue;
        var textos = linha.map(function (c) { return c.texto; }).filter(Boolean);
        if (linha.length > 1 && textos.every(function (x) { return x === textos[0]; })) {
          subtitulo = textos[0]; // "Patients 1 to 12 Years of Age Based on Body Weight"
          continue;
        }
        var celulas = linha.map(function (cel, ci) { return { cab: cabs[ci] || "", texto: cel.texto }; });
        // a linha toda, a primeira coluna (o rótulo da linha) e o título da tabela dão o contexto
        var rotuloLinha = celulas.filter(function (c) { return !valores(c.texto).length; }).map(function (c) { return c.texto; }).join(" ");
        unidades.push({
          tipo: "linha",
          tabela: ti + 1,
          titulo: tab.titulo,
          celulas: celulas,
          texto: celulas.map(function (c) { return c.texto; }).join(" "),
          subtitulo: subtitulo,
          contexto: [tab.titulo, subtitulo, rotuloLinha].join(" ")
        });
      }
    });
    var descartadas = [];
    if (campo) {
      var popAtual = "?";
      B.paragrafos(s[campo]).forEach(function (p) {
        var sub = /^(\d{1,2}\.\d{1,2})\s/.exec(p);
        if (sub) popAtual = "?";
        // a situação vale para a subseção inteira quando está no título dela (até a primeira frase)
        var sitSub = sub ? situacao(frases(p)[0] || "") : null;
        frases(p).forEach(function (f) {
          var tk = tokens(f);
          if (tk.length >= 12) {
            var total = tk.length - N + 1;
            var repetidas = 0;
            for (var i = 0; i < total; i++) if (sequencias[tk.slice(i, i + N).join(" ")]) repetidas++;
            if (repetidas / total >= 0.6 && dosesNasTabelas(f)) {
              descartadas.push(f); // é a tabela achatada no texto: a tabela fica
              return;
            }
          }
          var propria = populacao(f);
          var herdada = propria === "?" && popAtual !== "?";
          if (propria !== "?") popAtual = propria;
          unidades.push({ tipo: "frase", texto: f, subsecao: sub ? sub[1] : null, pop: propria === "?" ? popAtual : propria, popHerdada: herdada, situacao: situacao(f) || sitSub });
        });
      });
    }
    var vistos = {};
    unidades = unidades.filter(function (u) {
      var k = tokens(u.texto).join(" ");
      if (vistos[k]) return false;
      vistos[k] = true;
      return true;
    });
    unidades.descartadas = descartadas;
    unidades.forEach(function (u) {
      if (u.tipo === "linha") {
        u.situacao = situacao(u.contexto + " " + u.celulas.map(function (c) { return c.cab; }).join(" "));
        u.pop = populacao(u.contexto + " " + u.celulas.map(function (c) { return c.cab; }).join(" "));
        u.valores = [];
        u.celulas.forEach(function (c) {
          valores(c.texto).forEach(function (v) {
            if (v.base === "?" && !v.max) {
              var fc = frequencia(c.cab);
              if (/daily\s+dose|dose\s+per\s+day|total\s+daily|per\s+day|\/day/i.test(c.cab)) v.base = "dia";
              else if (fc && !fc.generico) {
                v.base = "dose";
                v.freq = { lo: fc.lo, hi: fc.hi, opcoes: fc.opcoes };
              }
            }
            v.pop = populacao(u.contexto + " " + c.cab);
            v.situacao = situacao(u.contexto + " " + c.cab);
            v.cab = c.cab;
            u.valores.push(v);
          });
        });
      } else {
        u.situacao = u.situacao || situacao(u.texto);
        u.valores = valores(u.texto).map(function (v) {
          v.pop = u.pop;
          v.popHerdada = u.popHerdada;
          v.situacao = u.situacao;
          return v;
        });
      }
    });
    return unidades;
  }

  /**
   * Trechos da posologia que falam da doença, mais as frases das indicações que a citam.
   * Sem doença (ou sem achar), devolve a posologia geral: os trechos com número de dose.
   */
  function paraDoenca(rotulo, tabelasLidas, consulta) {
    var alvo = interpretar(consulta || "");
    var unidades = trechosDaPosologia(rotulo, tabelasLidas);
    var s = rotulo.secoes || {};
    var indicacoes = [];
    var achou = [];
    if (alvo.termos.length) {
      frases(s.indications_and_usage || s.purpose || "").forEach(function (f) {
        var t = termoNo(f, alvo.termos);
        if (t) indicacoes.push({ texto: f, termo: t });
      });
      unidades.forEach(function (u, i) {
        var anterior = unidades[i - 1];
        if (!u.termo && u.tipo === "frase" && anterior && anterior.tipo === "frase" && anterior.termo && /^(?:Thereafter|Then|After\s+(?:that|the)|Subsequently|Following|The\s+(?:daily|usual|total)|Continue|Maintenance|Treatment\s+should|Duration)/i.test(u.texto)) {
          u.termo = anterior.termo;
          u.continuacao = true;
          achou.push(u);
          return;
        }
        var t = termoNo(u.tipo === "linha" ? u.celulas.filter(function (c) { return !valores(c.texto).length; }).map(function (c) { return c.texto; }).join(" ") + " " + u.titulo : u.texto, alvo.termos);
        if (!t && u.tipo === "linha") t = termoNo(u.texto, alvo.termos);
        if (t) {
          u.termo = t;
          achou.push(u);
        }
      });
      // o mais específico primeiro; dentro dele, na ordem da bula
      var ordem = function (u) { return alvo.termos.indexOf(u.termo.termo); };
      achou.sort(function (a, b) { return ordem(a) - ordem(b) || unidades.indexOf(a) - unidades.indexOf(b); });
      var melhor = achou.length ? ordem(achou[0]) : -1;
      var soAmplos = achou.length > 0 && achou.every(function (u) { return u.termo.termo.amplo; });
      // se achou por termo específico, os achados só por termo amplo ficam de fora
      if (melhor >= 0 && !alvo.termos[melhor].amplo) achou = achou.filter(function (u) { return !u.termo.termo.amplo; });
      if (!achou.some(function (u) { return u.valores.length; }) && indicacoes.length) {
        // a bula indica para a doença, mas a posologia não separa por doença: vale a posologia geral
        return {
          alvo: alvo,
          indicacoes: indicacoes.slice(0, 4),
          indicacoesTotal: indicacoes.length,
          trechos: unidades.filter(function (u) { return u.valores.length; }),
          geral: true,
          porIndicacao: true,
          soAmplos: false,
          todos: unidades
        };
      }
      return {
        alvo: alvo,
        indicacoes: indicacoes.slice(0, 4),
        indicacoesTotal: indicacoes.length,
        trechos: achou,
        geral: false,
        soAmplos: soAmplos,
        todos: unidades
      };
    }
    return { alvo: alvo, indicacoes: [], indicacoesTotal: 0, trechos: unidades.filter(function (u) { return u.valores.length; }), geral: true, soAmplos: false, todos: unidades };
  }

  /* ── conferência da prescrição ──────────────────────────────────── */

  /**
   * presc: {dose (número), u ("mg"|"UI"|"mEq"|"mmol", já convertida), intervalo (h) | null para dose única,
   *         peso (kg) | null, paciente ("adulto"|"crianca")}
   * Devolve, para um valor da bula: {estado, desvio, prescrito, max}.
   *   estado: "coincide" | "perto" | "intervalo" | "diferente" | "maximo-passa" | "maximo-talvez" | "maximo-ok"
   *           | "outra-populacao" | "sem-peso" | "nao-comparavel"
   */
  function comparar(presc, v) {
    var r = { v: v, estado: "diferente", desvio: 0, prescrito: null, motivo: "" };
    var pop = v.pop || "?";
    if ((presc.paciente === "adulto" && pop === "crianca") || (presc.paciente === "crianca" && pop === "adulto")) {
      r.estado = "outra-populacao";
      return r;
    }
    if (v.situacao === "renal" && !presc.renal) { r.estado = "outra-situacao"; r.motivo = "ajuste para função renal reduzida"; return r; }
    if (v.situacao === "hepatica" && !presc.hepatica) { r.estado = "outra-situacao"; r.motivo = "ajuste para insuficiência hepática"; return r; }
    if (v.porM2) { r.estado = "nao-comparavel"; r.motivo = "dose por m²"; return r; }
    if (v.base === "h" || v.base === "min") { r.estado = "nao-comparavel"; r.motivo = "taxa de infusão: use a calculadora"; return r; }
    if (v.u !== presc.u) { r.estado = "nao-comparavel"; r.motivo = "unidade diferente (" + v.u + ")"; return r; }
    if (v.porKg && !presc.peso) { r.estado = "sem-peso"; return r; }
    var porDose = presc.dose;
    var porDia = presc.intervalo ? (presc.dose * 24) / presc.intervalo : presc.dose;
    if (v.porKg) {
      porDose /= presc.peso;
      porDia /= presc.peso;
    }
    if (v.max) {
      var b = v.maxBase;
      r.prescrito = b === "dia" ? { valor: porDia, por: "dia" } : { valor: porDose, por: "dose" };
      if (b === "dia") r.estado = porDia > v.hi * 1.001 ? "maximo-passa" : "maximo-ok";
      else if (b === "dose") r.estado = porDose > v.hi * 1.001 ? "maximo-passa" : "maximo-ok";
      else if (porDose > v.hi * 1.001) r.estado = "maximo-passa";
      else if (porDia > v.hi * 1.001) { r.estado = "maximo-talvez"; r.prescrito = { valor: porDia, por: "dia" }; }
      else r.estado = "maximo-ok";
      return r;
    }
    var x = v.base === "dia" ? porDia : porDose;
    r.prescrito = { valor: x, por: v.base === "dia" ? "dia" : "dose" };
    if (x < v.lo) r.desvio = x / v.lo - 1;
    else if (x > v.hi) r.desvio = x / v.hi - 1;
    var dentro = Math.abs(r.desvio) <= 0.02;
    var perto = Math.abs(r.desvio) <= 0.1;
    var intervaloOk = true;
    if (v.unica) intervaloOk = presc.intervalo == null;
    else if (v.freq) {
      intervaloOk = presc.intervalo != null && (v.freq.opcoes && v.freq.opcoes.length ? v.freq.opcoes : [v.freq]).some(function (o) {
        return presc.intervalo >= o.lo - 0.01 && presc.intervalo <= o.hi + 0.01;
      });
    }
    if (dentro) r.estado = intervaloOk ? "coincide" : "intervalo";
    else if (perto) r.estado = "perto";
    else r.estado = "diferente";
    return r;
  }

  /** Confere a prescrição contra todos os valores dos trechos e resume. */
  function conferir(presc, trechos) {
    var itens = [];
    trechos.forEach(function (u) {
      u.valores.forEach(function (v) {
        itens.push({ trecho: u, r: comparar(presc, v) });
      });
    });
    var de = function (e) { return itens.filter(function (i) { return i.r.estado === e; }); };
    var resumo;
    if (de("maximo-passa").length) resumo = "passa";
    else if (de("coincide").length) resumo = "coincide";
    else if (de("intervalo").length) resumo = "intervalo";
    else if (de("perto").length) resumo = "perto";
    else if (itens.some(function (i) { return i.r.estado === "diferente"; })) resumo = "diferente";
    else resumo = "sem-comparacao";
    return {
      resumo: resumo,
      itens: itens,
      passa: de("maximo-passa"),
      talvez: de("maximo-talvez"),
      coincide: de("coincide"),
      intervalo: de("intervalo"),
      perto: de("perto").sort(function (a, b) { return Math.abs(a.r.desvio) - Math.abs(b.r.desvio); }),
      semPeso: de("sem-peso").length,
      outraPop: de("outra-populacao").length,
      outraSit: de("outra-situacao").length
    };
  }

  var Doses = {
    DOENCAS: DOENCAS,
    frases: frases,
    regexTermo: regexTermo,
    interpretar: interpretar,
    termoNo: termoNo,
    doencasDaBula: doencasDaBula,
    valores: valores,
    frequencia: frequencia,
    populacao: populacao,
    situacao: situacao,
    grade: grade,
    linhasDaTabela: linhasDaTabela,
    trechosDaPosologia: trechosDaPosologia,
    paraDoenca: paraDoenca,
    comparar: comparar,
    conferir: conferir
  };
  if (typeof module !== "undefined" && module.exports) module.exports = Doses;
  else raiz.Doses = Doses;
})(this);
