/* De onde vêm as bulas e como o texto delas chega à tela.

   Fontes, todas oficiais e públicas, consultadas na hora:
   - RxNorm (Biblioteca Nacional de Medicina dos EUA): transforma o nome digitado, em português
     ou inglês, no princípio ativo padronizado.
   - openFDA (FDA): a bula aprovada pela FDA, no formato oficial (SPL), a mesma do DailyMed.

   O texto da bula aparece como veio: sem tradução, sem resumo, sem reescrita. O app só
   quebra parágrafos nos números de subseção e destaca as doses, sem mudar uma letra.
   Nada do HTML que vem de fora é inserido direto na página: as tabelas são reconstruídas
   elemento por elemento, só com o que é tabela e texto. */
(function (raiz) {
  "use strict";

  var RXNAV = "https://rxnav.nlm.nih.gov/REST/";
  var FDA = "https://api.fda.gov/drug/label.json";

  /* Nomes brasileiros que o RxNorm não acha sozinho (ou só acha como marca). O nome em inglês
     é enviado ao RxNorm, que confirma o princípio ativo; a tela mostra a troca feita. */
  var APELIDOS = {
    "dipirona": "dipyrone",
    "dipirona sodica": "dipyrone",
    "dipirona monoidratada": "dipyrone",
    "metamizol": "dipyrone",
    "metamizol sodico": "dipyrone",
    "noradrenalina": "norepinephrine",
    "norepinefrina": "norepinephrine",
    "adrenalina": "epinephrine",
    "epinefrina": "epinephrine",
    "varfarina": "warfarin",
    "varfarina sodica": "warfarin",
    "aas": "aspirin",
    "acido acetilsalicilico": "aspirin",
    "paracetamol": "acetaminophen",
    "salbutamol": "albuterol",
    "sulfato de salbutamol": "albuterol",
    "glibenclamida": "glyburide",
    "petidina": "meperidine",
    "meperidina": "meperidine",
    "hioscina": "scopolamine",
    "rifampicina": "rifampin",
    "ciclosporina": "cyclosporine",
    "suxametonio": "succinylcholine",
    "succinilcolina": "succinylcholine",
    "isoprenalina": "isoproterenol",
    "lidocaina": "lidocaine",
    "sulfato ferroso": "ferrous sulfate",
    "cloreto de potassio": "potassium chloride",
    "bicarbonato de sodio": "sodium bicarbonate",
    "gluconato de calcio": "calcium gluconate",
    "sulfato de magnesio": "magnesium sulfate",
    "penicilina benzatina": "penicillin G benzathine",
    "penicilina g benzatina": "penicillin G benzathine",
    "benzilpenicilina benzatina": "penicillin G benzathine",
    "penicilina cristalina": "penicillin G potassium",
    "benzilpenicilina potassica": "penicillin G potassium",
    "fenoximetilpenicilina": "penicillin V",
    "sulfametoxazol trimetoprima": "sulfamethoxazole / trimethoprim",
    "sulfametoxazol + trimetoprima": "sulfamethoxazole / trimethoprim",
    "amoxicilina clavulanato": "amoxicillin / clavulanate",
    "amoxicilina + clavulanato": "amoxicillin / clavulanate",
    "amoxicilina e clavulanato de potassio": "amoxicillin / clavulanate",
    "piperacilina tazobactam": "piperacillin / tazobactam",
    "piperacilina + tazobactam": "piperacillin / tazobactam"
  };

  /* Ordem das seções: o que pesa na prescrição vem primeiro e já aberto. */
  var SECOES = [
    { campo: "boxed_warning", titulo: "Advertência em destaque", original: "Boxed warning", aberta: true, alerta: true },
    { campo: "dosage_and_administration", titulo: "Posologia e administração", original: "Dosage and administration", aberta: true },
    { campo: "directions", titulo: "Modo de usar", original: "Directions", aberta: true },
    { campo: "dosage_forms_and_strengths", titulo: "Apresentações e concentrações", original: "Dosage forms and strengths", aberta: true },
    { campo: "active_ingredient", titulo: "Princípio ativo", original: "Active ingredient", aberta: true },
    { campo: "contraindications", titulo: "Contraindicações", original: "Contraindications" },
    { campo: "do_not_use", titulo: "Não use", original: "Do not use" },
    { campo: "use_in_specific_populations", titulo: "Populações específicas (gestação, lactação, pediatria, idosos, rim, fígado)", original: "Use in specific populations" },
    { campo: "pregnancy", titulo: "Gestação", original: "Pregnancy", dentroDe: "use_in_specific_populations" },
    { campo: "lactation", titulo: "Lactação", original: "Lactation", dentroDe: "use_in_specific_populations" },
    { campo: "nursing_mothers", titulo: "Lactação", original: "Nursing mothers", dentroDe: "use_in_specific_populations" },
    { campo: "pediatric_use", titulo: "Uso pediátrico", original: "Pediatric use", dentroDe: "use_in_specific_populations" },
    { campo: "geriatric_use", titulo: "Uso em idosos", original: "Geriatric use", dentroDe: "use_in_specific_populations" },
    { campo: "pregnancy_or_breast_feeding", titulo: "Gestação ou amamentação", original: "Pregnancy or breast feeding" },
    { campo: "warnings_and_cautions", titulo: "Advertências e precauções", original: "Warnings and precautions" },
    { campo: "warnings", titulo: "Advertências", original: "Warnings" },
    { campo: "precautions", titulo: "Precauções", original: "Precautions" },
    { campo: "ask_doctor", titulo: "Antes de usar, consulte o médico se", original: "Ask a doctor" },
    { campo: "ask_doctor_or_pharmacist", titulo: "Consulte o médico ou farmacêutico se", original: "Ask a doctor or pharmacist" },
    { campo: "when_using", titulo: "Durante o uso", original: "When using" },
    { campo: "stop_use", titulo: "Pare de usar se", original: "Stop use" },
    { campo: "drug_interactions", titulo: "Interações medicamentosas", original: "Drug interactions" },
    { campo: "overdosage", titulo: "Superdosagem", original: "Overdosage" },
    { campo: "indications_and_usage", titulo: "Indicações", original: "Indications and usage" },
    { campo: "purpose", titulo: "Finalidade", original: "Purpose" },
    { campo: "adverse_reactions", titulo: "Reações adversas", original: "Adverse reactions" },
    { campo: "recent_major_changes", titulo: "Mudanças recentes na bula", original: "Recent major changes" },
    { campo: "clinical_pharmacology", titulo: "Farmacologia clínica (inclui farmacocinética)", original: "Clinical pharmacology" },
    { campo: "pharmacokinetics", titulo: "Farmacocinética", original: "Pharmacokinetics", dentroDe: "clinical_pharmacology" },
    { campo: "how_supplied", titulo: "Como é fornecido", original: "How supplied" },
    { campo: "storage_and_handling", titulo: "Armazenamento", original: "Storage and handling" },
    { campo: "keep_out_of_reach_of_children", titulo: "Fora do alcance de crianças", original: "Keep out of reach of children" }
  ];

  var CAMPOS_OPENFDA = ["brand_name", "generic_name", "manufacturer_name", "route", "application_number", "product_type", "substance_name", "rxcui", "is_original_packager"];

  /* ── utilidades de texto ────────────────────────────────────────── */

  function semAcento(s) {
    return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "");
  }

  function chaveNome(s) {
    return semAcento(s).toLowerCase().replace(/[^a-z0-9+/ ]+/g, " ").replace(/\s+/g, " ").trim();
  }

  function juntar(v) {
    if (v == null) return "";
    if (Array.isArray(v)) return v.join("\n\n");
    return String(v);
  }

  /** Data da bula (AAAAMMDD) em DD/MM/AAAA. */
  function data(aaaammdd) {
    var s = String(aaaammdd || "");
    if (!/^\d{8}$/.test(s)) return s || "data não informada";
    return s.slice(6, 8) + "/" + s.slice(4, 6) + "/" + s.slice(0, 4);
  }

  /** Tipo de registro na FDA, a partir do número da aplicação. */
  function registro(numero) {
    var n = String(numero || "").toUpperCase();
    if (/^NDA/.test(n)) return { sigla: "NDA", texto: "Marca ou referência", ordem: 0 };
    if (/^BLA/.test(n)) return { sigla: "BLA", texto: "Biológico", ordem: 0 };
    if (/^ANDA/.test(n)) return { sigla: "ANDA", texto: "Genérico", ordem: 1 };
    if (/^(PART|M\d)/.test(n)) return { sigla: "OTC", texto: "Venda livre (monografia)", ordem: 2 };
    return { sigla: n.replace(/\d+$/, "") || "?", texto: "Outro registro", ordem: 3 };
  }

  /**
   * Quebra o texto corrido da bula em parágrafos, sem mudar nenhum caractere:
   * antes de cada número de subseção da própria seção ("2.1 Recommended…", "2.3 Renal…")
   * e antes de cada marcador "•".
   */
  function paragrafos(texto) {
    var t = String(texto || "");
    var cortes = [];
    var m = /^\s*(\d{1,2})\s+[A-Z]/.exec(t);
    if (m) {
      var re = new RegExp("\\s(?=" + m[1] + "\\.\\d{1,2}(?:\\.\\d{1,2})?\\s+[A-Z])", "g");
      var x;
      while ((x = re.exec(t))) cortes.push(x.index);
    }
    var rb = /\s(?=•\s)/g;
    var y;
    while ((y = rb.exec(t))) cortes.push(y.index);
    cortes.sort(function (a, b) { return a - b; });
    var partes = [];
    var ini = 0;
    cortes.forEach(function (c) {
      if (c <= ini) return;
      partes.push(t.slice(ini, c).trim());
      ini = c;
    });
    partes.push(t.slice(ini).trim());
    return partes.filter(function (p) { return p.length > 0; });
  }

  /* doses e frequências, só para destacar na leitura */
  var RE_DOSE = new RegExp(
    [
      "\\b\\d+(?:[.,]\\d+)?(?:\\s?(?:to|-|–|or)\\s?\\d+(?:[.,]\\d+)?)?\\s?" +
        "(?:million units|units?|mg|mcg|µg|μg|g|mL|L|IU|mEq|mmol)" +
        "(?:\\s?\\/\\s?(?:kg|m2|m²|day|dose|d|h|hr|hour|min|minute|mL|L|kg\\/day|kg\\/dose|kg\\/h|kg\\/min))*(?![A-Za-z])",
      "\\bevery\\s\\d+(?:\\s?(?:to|-|–)\\s?\\d+)?\\s(?:hours?|days?|weeks?)\\b",
      "\\b(?:once|twice|three times|four times)\\s(?:a\\s|per\\s)?(?:day|daily|week|weekly)\\b",
      "\\b(?:once|twice)\\s(?:daily|weekly)\\b"
    ].join("|"),
    "g"
  );

  function escaparRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  /**
   * Divide um texto em trechos para pintar: {t, achado} para o que bate com a busca
   * e {t, dose} para doses e frequências. Concatenar os trechos devolve o texto exato.
   */
  function trechos(texto, consulta) {
    var t = String(texto || "");
    var saida = [];
    var q = String(consulta || "").trim();
    var pedacos = [];
    if (q.length >= 2) {
      var rq = new RegExp(escaparRegex(q), "gi");
      var ini = 0;
      var m;
      while ((m = rq.exec(t))) {
        if (m.index > ini) pedacos.push({ t: t.slice(ini, m.index) });
        pedacos.push({ t: m[0], achado: true });
        ini = m.index + m[0].length;
        if (m[0].length === 0) rq.lastIndex++;
      }
      if (ini < t.length) pedacos.push({ t: t.slice(ini) });
    } else {
      pedacos.push({ t: t });
    }
    pedacos.forEach(function (p) {
      if (p.achado) {
        saida.push(p);
        return;
      }
      var rd = new RegExp(RE_DOSE.source, "g");
      var i = 0;
      var d;
      while ((d = rd.exec(p.t))) {
        if (d.index > i) saida.push({ t: p.t.slice(i, d.index) });
        saida.push({ t: d[0], dose: true });
        i = d.index + d[0].length;
        if (d[0].length === 0) rd.lastIndex++;
      }
      if (i < p.t.length) saida.push({ t: p.t.slice(i) });
    });
    return saida.filter(function (s) { return s.t.length > 0; });
  }

  /* ── tabelas: HTML de fora reconstruído só com elementos seguros ── */

  var PERMITIDAS = {
    TABLE: "table", CAPTION: "caption", THEAD: "thead", TBODY: "tbody", TFOOT: "tfoot",
    TR: "tr", TD: "td", TH: "th", SUP: "sup", SUB: "sub", BR: "br",
    P: "p", PARAGRAPH: "p", UL: "ul", OL: "ol", LI: "li", LIST: "ul", ITEM: "li"
  };
  var DESCARTAR = /^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE|IFRAME|FRAME|FRAMESET|OBJECT|EMBED|APPLET|SVG|MATH|IMG|PICTURE|SOURCE|VIDEO|AUDIO|TRACK|CANVAS|LINK|META|BASE|TITLE|HEAD|FORM|INPUT|BUTTON|TEXTAREA|SELECT|OPTION|COL|COLGROUP|RENDERMULTIMEDIA)$/;

  function copiarSeguro(origem, destino, doc) {
    var filhos = origem.childNodes;
    for (var i = 0; i < filhos.length; i++) {
      var f = filhos[i];
      if (f.nodeType === 3) {
        destino.appendChild(doc.createTextNode(f.nodeValue));
        continue;
      }
      if (f.nodeType !== 1) continue;
      var tag = String(f.tagName || "").toUpperCase();
      if (DESCARTAR.test(tag)) continue;
      var novo = null;
      if (PERMITIDAS[tag]) {
        novo = doc.createElement(PERMITIDAS[tag]);
        if (tag === "TD" || tag === "TH") {
          ["colspan", "rowspan"].forEach(function (a) {
            var v = f.getAttribute(a);
            if (v && /^\d{1,2}$/.test(v) && +v >= 1 && +v <= 50) novo.setAttribute(a, v);
          });
        }
      } else {
        var estilo = String(f.getAttribute("stylecode") || f.getAttribute("styleCode") || "").toLowerCase();
        if (/bold/.test(estilo)) novo = doc.createElement("strong");
        else if (/italic/.test(estilo)) novo = doc.createElement("em");
      }
      if (novo) {
        copiarSeguro(f, novo, doc);
        destino.appendChild(novo);
      } else {
        copiarSeguro(f, destino, doc); // elemento desconhecido: fica só o conteúdo
      }
    }
  }

  /** Recebe o HTML de uma tabela da bula e devolve um fragmento só com elementos permitidos. */
  function tabelaSegura(html, doc) {
    doc = doc || document;
    var lido = new DOMParser().parseFromString(String(html || ""), "text/html");
    var frag = doc.createDocumentFragment();
    if (lido && lido.body) copiarSeguro(lido.body, frag, doc);
    return frag;
  }

  /* ── rede ───────────────────────────────────────────────────────── */

  function ErroFonte(tipo, mensagem) {
    this.tipo = tipo;
    this.message = mensagem;
  }
  ErroFonte.prototype = Object.create(Error.prototype);

  var memoria = {};

  /** GET em JSON, só para os dois servidores oficiais, sem cookies nem referência de origem. */
  function obter(url) {
    if (url.indexOf(RXNAV) !== 0 && url.indexOf(FDA) !== 0) {
      return Promise.reject(new ErroFonte("bloqueado", "Endereço fora das fontes oficiais: bloqueado."));
    }
    if (memoria[url]) return memoria[url];
    var p = new Promise(function (ok, falha) {
      var ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
      var acabou = false;
      var relogio = setTimeout(function () {
        if (acabou) return;
        acabou = true;
        if (ctrl) ctrl.abort();
        falha(new ErroFonte("tempo", "O servidor demorou demais para responder. Tente de novo."));
      }, 25000);
      fetch(url, { method: "GET", credentials: "omit", referrerPolicy: "no-referrer", redirect: "error", signal: ctrl ? ctrl.signal : undefined })
        .then(function (r) {
          if (r.status === 404) return { __vazio: true };
          if (r.status === 429) throw new ErroFonte("limite", "A FDA limita as consultas sem cadastro (cerca de mil por dia). Tente de novo mais tarde.");
          if (!r.ok) throw new ErroFonte("servidor", "O servidor respondeu com erro " + r.status + ". Tente de novo em instantes.");
          return r.json();
        })
        .then(function (j) {
          if (acabou) return;
          acabou = true;
          clearTimeout(relogio);
          ok(j);
        })
        .catch(function (e) {
          if (acabou) return;
          acabou = true;
          clearTimeout(relogio);
          falha(e instanceof ErroFonte ? e : new ErroFonte("rede", "Sem conexão com a fonte oficial. Confira a internet e tente de novo."));
        });
    });
    memoria[url] = p;
    p.catch(function () { delete memoria[url]; }); // erro não fica guardado
    return p;
  }

  /* ── RxNorm: do nome digitado ao princípio ativo ────────────────── */

  function aproximado(termo) {
    return obter(RXNAV + "approximateTerm.json?maxEntries=8&option=1&term=" + encodeURIComponent(termo)).then(function (j) {
      var c = (j && j.approximateGroup && j.approximateGroup.candidate) || [];
      return c.map(function (x) {
        return { rxcui: String(x.rxcui), score: parseFloat(x.score) || 0, visto: x.name || "", fonte: x.source || "" };
      });
    });
  }

  function propriedades(rxcui) {
    return obter(RXNAV + "rxcui/" + encodeURIComponent(rxcui) + "/properties.json").then(function (j) {
      return (j && j.properties) || null;
    });
  }

  function ingredientesDe(rxcui) {
    return obter(RXNAV + "rxcui/" + encodeURIComponent(rxcui) + "/related.json?tty=IN+MIN").then(function (j) {
      var grupos = (j && j.relatedGroup && j.relatedGroup.conceptGroup) || [];
      var porTipo = {};
      grupos.forEach(function (g) {
        porTipo[g.tty] = (g.conceptProperties || []).map(function (p) { return { rxcui: p.rxcui, nome: p.name, tty: p.tty }; });
      });
      if (porTipo.MIN && porTipo.MIN.length) return porTipo.MIN;
      return porTipo.IN || [];
    });
  }

  /**
   * Nome digitado → lista de princípios ativos possíveis, do mais provável ao menos,
   * cada um com a origem da correspondência para a tela mostrar.
   */
  function resolver(termo) {
    var digitado = String(termo || "").trim();
    if (!digitado) return Promise.resolve({ digitado: digitado, ingredientes: [] });
    var apelido = APELIDOS[chaveNome(digitado)] || null;
    var buscas = apelido ? [apelido, digitado] : [digitado];
    return Promise.all(buscas.map(function (b) { return aproximado(b).catch(function (e) { if (b === digitado) throw e; return []; }); }))
      .then(function (listas) {
        var vistos = {};
        var ordem = [];
        listas.forEach(function (lista, i) {
          lista.forEach(function (c) {
            var bonus = apelido && i === 0 ? 100 : 0; // o apelido conferido vem primeiro
            var atual = vistos[c.rxcui];
            if (!atual) {
              vistos[c.rxcui] = { rxcui: c.rxcui, score: c.score + bonus, scoreReal: c.score, visto: c.visto, fonte: c.fonte, viaApelido: i === 0 && !!apelido };
              ordem.push(vistos[c.rxcui]);
            } else if (c.score + bonus > atual.score) {
              atual.score = c.score + bonus;
              atual.scoreReal = Math.max(atual.scoreReal, c.score);
              if (!atual.visto && c.visto) atual.visto = c.visto;
            }
          });
        });
        ordem.sort(function (a, b) { return b.score - a.score; });
        return Promise.all(
          ordem.slice(0, 6).map(function (c) {
            return propriedades(c.rxcui).then(function (p) {
              if (!p) return [];
              // PIN (sal) fica como está: penicilina G benzatina não pode virar só "penicilina G"
              if (p.tty === "IN" || p.tty === "MIN" || p.tty === "PIN") return [{ rxcui: p.rxcui, nome: p.name, tty: p.tty, de: c }];
              return ingredientesDe(c.rxcui).then(function (lista) {
                return lista.map(function (x) { return { rxcui: x.rxcui, nome: x.nome, tty: x.tty, de: c }; });
              });
            }).catch(function () { return []; });
          })
        );
      })
      .then(function (porCandidato) {
        var unicos = {};
        var lista = [];
        porCandidato.forEach(function (l) {
          l.forEach(function (ing) {
            if (unicos[ing.rxcui]) return;
            unicos[ing.rxcui] = true;
            lista.push({
              rxcui: ing.rxcui,
              nome: ing.nome,
              tty: ing.tty,
              comoAchou: ing.de.visto || "",
              fonteNome: ing.de.fonte || "",
              viaApelido: ing.de.viaApelido,
              apelido: ing.de.viaApelido ? apelido : null,
              fraco: !ing.de.viaApelido && ing.de.scoreReal < 6
            });
          });
        });
        return { digitado: digitado, apelido: apelido, ingredientes: lista };
      });
  }

  /* ── openFDA: do princípio ativo à bula ─────────────────────────── */

  function aspas(v) {
    return '"' + encodeURIComponent(String(v).replace(/"/g, "")) + '"';
  }

  function urlFDA(busca, extra) {
    return FDA + "?search=" + busca + (extra ? "&" + extra : "");
  }

  /** Busca por princípio ativo; "amoxicillin / clavulanate" exige os dois. */
  function buscaIngrediente(nome) {
    return String(nome)
      .split(/\s*\/\s*/)
      .filter(Boolean)
      .map(function (p) { return "(openfda.substance_name:" + aspas(p) + "+OR+openfda.generic_name:" + aspas(p) + ")"; })
      .join("+AND+");
  }

  /** Nomes genéricos (formulações, associações) que existem na FDA para o princípio ativo. */
  function grupos(nomeIngrediente) {
    return obter(urlFDA(buscaIngrediente(nomeIngrediente), "count=openfda.generic_name.exact&limit=60")).then(function (j) {
      var lista = (j && j.results) || [];
      var alvo = String(nomeIngrediente).toUpperCase();
      return lista
        .map(function (r) { return { nome: r.term, total: r.count, exato: String(r.term).toUpperCase() === alvo }; })
        .sort(function (a, b) { return (b.exato ? 1 : 0) - (a.exato ? 1 : 0) || b.total - a.total; });
    });
  }

  /** Só os campos que o app mostra, sempre na mesma ordem: é isso que o resumo de integridade cobre. */
  function enxugar(r) {
    var o = r.openfda || {};
    var rotulo = {
      set_id: r.set_id || "",
      id: r.id || "",
      version: String(r.version || ""),
      effective_time: String(r.effective_time || ""),
      openfda: {},
      secoes: {}
    };
    CAMPOS_OPENFDA.forEach(function (c) {
      if (o[c] != null) rotulo.openfda[c] = o[c];
    });
    SECOES.forEach(function (s) {
      if (r[s.campo] != null) rotulo.secoes[s.campo] = juntar(r[s.campo]);
      if (r[s.campo + "_table"] != null) rotulo.secoes[s.campo + "_table"] = [].concat(r[s.campo + "_table"]).map(String);
    });
    return rotulo;
  }

  /**
   * Bulas de um nome genérico. Primeiro as de referência (NDA/BLA), depois as demais,
   * sempre do fabricante original (sem reembaladoras) e da mais recente para a mais antiga.
   */
  function rotulos(generico, pagina) {
    pagina = pagina || 0;
    var por = 8;
    var base = "openfda.generic_name.exact:" + aspas(generico);
    var original = base + "+AND+openfda.is_original_packager:true";
    var ordem = "sort=effective_time:desc";
    var pedidos = [obter(urlFDA(original, ordem + "&limit=" + por + "&skip=" + pagina * por))];
    if (pagina === 0) {
      pedidos.push(obter(urlFDA(original + "+AND+(openfda.application_number:NDA*+OR+openfda.application_number:BLA*)", ordem + "&limit=3")).catch(function () { return {}; }));
    }
    return Promise.all(pedidos).then(function (rs) {
      var geral = rs[0] || {};
      if (geral.__vazio && pagina === 0) {
        // nenhuma marcada como do fabricante original: aceita todas
        return obter(urlFDA(base, ordem + "&limit=" + por)).then(function (j) {
          return montarLista([], j, por, pagina, true);
        });
      }
      return montarLista(rs[1] ? rs[1].results || [] : [], geral, por, pagina, false);
    });
  }

  function montarLista(referencias, geral, por, pagina, semFiltro) {
    var vistos = {};
    var itens = [];
    referencias.concat((geral && geral.results) || []).forEach(function (r) {
      if (!r || !r.set_id || vistos[r.set_id]) return;
      vistos[r.set_id] = true;
      itens.push(enxugar(r));
    });
    var total = (geral && geral.meta && geral.meta.results && geral.meta.results.total) || itens.length;
    return { itens: itens, total: total, temMais: (pagina + 1) * por < total, semFiltro: semFiltro };
  }

  /** A versão que está valendo hoje para um set_id (para conferir as bulas salvas). */
  function atual(setId) {
    return obter(urlFDA("set_id:" + aspas(setId), "limit=1")).then(function (j) {
      var r = j && j.results && j.results[0];
      return r ? enxugar(r) : null;
    });
  }

  /** Se a bula guardada está atrás da que vale hoje. */
  function maisNova(nova, guardada) {
    if (!nova || !guardada) return false;
    var vn = parseInt(nova.version, 10);
    var vg = parseInt(guardada.version, 10);
    if (nova.id && guardada.id && nova.id === guardada.id) return false;
    if (isFinite(vn) && isFinite(vg) && vn !== vg) return vn > vg;
    return String(nova.effective_time) > String(guardada.effective_time);
  }

  /* ── descrição da bula para a tela ──────────────────────────────── */

  function titulo(rotulo) {
    var o = rotulo.openfda || {};
    var marca = (o.brand_name && o.brand_name[0]) || "";
    var gen = (o.generic_name && o.generic_name[0]) || "";
    return { marca: marca, generico: gen, principal: marca || gen || "Bula sem nome" };
  }

  function linkDailyMed(rotulo) {
    return "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=" + encodeURIComponent(rotulo.set_id);
  }

  function linkAnvisa(nome) {
    return "https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=" + encodeURIComponent(String(nome || "").trim());
  }

  /** Seções presentes, na ordem do app, sem repetir subseções já contidas na seção-mãe. */
  function secoesDe(rotulo) {
    var s = rotulo.secoes || {};
    return SECOES.filter(function (d) {
      if (!s[d.campo] && !s[d.campo + "_table"]) return false;
      if (d.dentroDe && s[d.dentroDe]) return false;
      return true;
    }).map(function (d) {
      return { def: d, texto: s[d.campo] || "", tabelas: s[d.campo + "_table"] || [] };
    });
  }

  var Bulas = {
    RXNAV: RXNAV,
    FDA: FDA,
    APELIDOS: APELIDOS,
    SECOES: SECOES,
    chaveNome: chaveNome,
    data: data,
    registro: registro,
    paragrafos: paragrafos,
    trechos: trechos,
    tabelaSegura: tabelaSegura,
    resolver: resolver,
    grupos: grupos,
    rotulos: rotulos,
    atual: atual,
    maisNova: maisNova,
    enxugar: enxugar,
    titulo: titulo,
    secoesDe: secoesDe,
    linkDailyMed: linkDailyMed,
    linkAnvisa: linkAnvisa,
    buscaIngrediente: buscaIngrediente,
    ErroFonte: ErroFonte
  };
  if (typeof module !== "undefined" && module.exports) module.exports = Bulas;
  else raiz.Bulas = Bulas;
})(this);
