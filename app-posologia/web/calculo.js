/* Calculadora de dose: só aritmética, com as unidades à vista em cada passo.
   Nenhuma dose vem embutida aqui. Todo número é digitado por quem prescreve, conferido
   na bula; o app multiplica, divide, converte unidade de massa e avisa quando algo não fecha.
   Funciona no navegador (window.Calculo) e no Node (require), para os testes. */
(function (raiz) {
  "use strict";

  /* massa em mcg; as outras unidades só se comparam com elas mesmas */
  var MASSA = { g: 1e6, mg: 1e3, mcg: 1 };
  var OUTRAS = { UI: 1, mEq: 1, mmol: 1 };
  var FINO = " "; // espaço fino inquebrável, separador de milhar sem ambiguidade

  function dimensao(u) {
    if (MASSA[u]) return "massa";
    if (OUTRAS[u]) return u;
    return null;
  }

  /** Converte entre unidades da mesma dimensão; null quando não há conversão possível. */
  function converter(valor, de, para) {
    if (de === para) return valor;
    if (MASSA[de] && MASSA[para]) return (valor * MASSA[de]) / MASSA[para];
    return null;
  }

  /**
   * Lê um número digitado. Vírgula ou ponto como decimal; nada de separador de milhar,
   * porque "1.000" e "2,500" são justamente os números que viram erro de dez ou mil vezes.
   * Devolve {vazio:true}, {erro:"..."} ou {valor:n}.
   */
  function lerNumero(texto, opcoes) {
    opcoes = opcoes || {};
    var t = String(texto == null ? "" : texto).replace(/\s+/g, "");
    if (!t) return { vazio: true };
    if (/^[1-9]\d{0,2}[.,]\d{3}$/.test(t)) {
      var sep = t.indexOf(".") >= 0 ? "." : ",";
      var antes = t.split(sep)[0];
      var depois = t.split(sep)[1];
      return {
        erro:
          "“" + t + "” é ambíguo: pode ser " + antes + depois + " ou " + antes + "," + depois.replace(/0+$/, "").replace(/^$/, "0") +
          ". Escreva sem separador de milhar (" + antes + depois + ") ou com outra quantidade de casas decimais."
      };
    }
    if (!/^(\d+([.,]\d+)?|[.,]\d+)$/.test(t)) return { erro: "Número inválido. Use só algarismos e uma vírgula decimal." };
    var n = parseFloat(t.replace(",", "."));
    if (!isFinite(n)) return { erro: "Número inválido." };
    if (opcoes.inteiro && n !== Math.floor(n)) return { erro: "Use um número inteiro." };
    if (!(n > 0)) return { erro: "Precisa ser maior que zero." };
    if (opcoes.max != null && n > opcoes.max) return { erro: "No máximo " + opcoes.max + "." };
    return { valor: n };
  }

  function agrupar(inteiro) {
    if (inteiro.length < 5) return inteiro; // 1200 fica 1200; 12 000 ganha o espaço fino
    return inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, FINO);
  }

  /**
   * Formata para leitura em pt-BR: vírgula decimal, zero sempre à esquerda, nenhum zero
   * sobrando à direita (5 mg, nunca 5,0 mg). Casas conforme o tamanho do número:
   * 1 casa a partir de 100, 2 casas de 1 a 100, 3 algarismos significativos abaixo de 1.
   * Devolve {texto, aproximado}: aproximado diz se houve arredondamento para exibir.
   */
  function formatar(n) {
    if (n == null || !isFinite(n)) return { texto: "—", aproximado: false };
    var a = Math.abs(n);
    var s;
    if (a === 0) s = "0";
    else if (a >= 100) s = n.toFixed(1);
    else if (a >= 1) s = n.toFixed(2);
    else if (a >= 1e-6) s = n.toPrecision(3);
    else s = n.toFixed(12);
    if (s.indexOf("e") >= 0) s = n.toFixed(12);
    if (s.indexOf(".") >= 0) s = s.replace(/0+$/, "").replace(/\.$/, "");
    var exibido = parseFloat(s);
    var aproximado = Math.abs(exibido - n) > 1e-9 * Math.max(1, a);
    var partes = s.replace("-", "").split(".");
    var texto = (n < 0 ? "−" : "") + agrupar(partes[0]) + (partes[1] ? "," + partes[1] : "");
    return { texto: texto, aproximado: aproximado };
  }

  /** "≈ 0,333" quando arredondou, "0,5" quando é exato. */
  function num(n) {
    var f = formatar(n);
    return (f.aproximado ? "≈ " : "") + f.texto;
  }

  function com(n, unidade) {
    return num(n) + " " + unidade;
  }

  /* ── checagens comuns ───────────────────────────────────────────── */

  function checarPeso(peso, alertas) {
    if (peso == null) return;
    if (peso < 0.3 || peso > 300) {
      alertas.push({ nivel: "atencao", texto: "Peso de " + com(peso, "kg") + " está fora do habitual. Confira se foi digitado em quilos." });
    }
  }

  function campos(entrada, regras, erros) {
    var v = {};
    Object.keys(regras).forEach(function (nome) {
      var r = regras[nome];
      var lido = lerNumero(entrada[nome], r);
      if (lido.erro) erros[nome] = lido.erro;
      else if (lido.vazio) {
        if (r.obrigatorio) erros[nome] = r.obrigatorio;
        v[nome] = null;
      } else v[nome] = lido.valor;
    });
    return v;
  }

  /* ── dose por peso, por superfície ou fixa ──────────────────────── */

  var NOME_BASE = { kg: "kg", m2: "m²", fixa: "" };

  /**
   * entrada (texto como digitado, mais as escolhas):
   *   base: "kg" | "m2" | "fixa"
   *   peso (kg), altura (cm, só para m²), dose, unidade ("mg","mcg","g","UI","mEq","mmol"),
   *   periodo: "dose" | "dia", tomadas (por dia),
   *   max, maxUnidade, maxPeriodo ("dose" | "dia")       → opcional
   *   apQtd, apUnidade, apVolume (mL)                      → opcional
   * Devolve {erros:{campo:msg}} quando falta ou sobra algo, ou o resultado com passos e alertas.
   */
  function porPeso(entrada) {
    var e = entrada || {};
    var base = NOME_BASE.hasOwnProperty(e.base) ? e.base : "kg";
    var periodo = e.periodo === "dia" ? "dia" : "dose";
    var unidade = dimensao(e.unidade) ? e.unidade : "mg";
    var erros = {};
    var v = campos(
      e,
      {
        peso: { obrigatorio: base === "fixa" ? null : "Informe o peso.", max: 1000 },
        altura: { obrigatorio: base === "m2" ? "Informe a altura." : null, max: 300 },
        dose: { obrigatorio: "Informe a dose prescrita." },
        tomadas: { obrigatorio: periodo === "dia" ? "Informe em quantas tomadas por dia." : null, inteiro: true, max: 48 },
        max: {},
        apQtd: {},
        apVolume: { max: 100000 }
      },
      erros
    );
    if (v.apQtd != null && v.apVolume == null && !erros.apVolume) erros.apVolume = "Informe o volume da apresentação.";
    if (v.apVolume != null && v.apQtd == null && !erros.apQtd) erros.apQtd = "Informe a quantidade na apresentação.";
    if (v.max != null && dimensao(e.maxUnidade) !== dimensao(unidade)) {
      erros.max = "A dose máxima está em " + (e.maxUnidade || "?") + " e a dose em " + unidade + ": não há como comparar.";
    }
    if (v.apQtd != null && dimensao(e.apUnidade) !== dimensao(unidade)) {
      erros.apQtd = "A apresentação está em " + (e.apUnidade || "?") + " e a dose em " + unidade + ": não há como converter.";
    }
    if (Object.keys(erros).length) return { erros: erros };

    var passos = [];
    var alertas = [];
    if (base !== "fixa") checarPeso(v.peso, alertas);

    var multiplicador = 1;
    var sc = null;
    if (base === "kg") multiplicador = v.peso;
    if (base === "m2") {
      if (v.altura < 30 || v.altura > 250) alertas.push({ nivel: "atencao", texto: "Altura de " + com(v.altura, "cm") + " está fora do habitual. Confira se foi digitada em centímetros." });
      sc = Math.sqrt((v.altura * v.peso) / 3600);
      multiplicador = sc;
      passos.push("Superfície corporal (Mosteller): √(" + com(v.altura, "cm") + " × " + com(v.peso, "kg") + " ÷ 3600) = " + com(sc, "m²"));
    }

    var rotuloDose = unidade + (base === "fixa" ? "" : "/" + NOME_BASE[base]) + "/" + periodo;
    var total = v.dose * multiplicador;
    var porTomada;
    var porDia = null;
    var intervalo = v.tomadas ? 24 / v.tomadas : null;
    var cada = intervalo ? " (a cada " + com(intervalo, "h") + ")" : "";

    if (base !== "fixa") {
      passos.push(com(v.dose, rotuloDose) + " × " + (base === "kg" ? com(v.peso, "kg") : com(sc, "m²")) + " = " + com(total, unidade) + " por " + periodo);
    }
    if (periodo === "dose") {
      porTomada = total;
      if (v.tomadas) {
        porDia = total * v.tomadas;
        passos.push(com(porTomada, unidade) + " × " + v.tomadas + (v.tomadas === 1 ? " tomada" : " tomadas") + " = " + com(porDia, unidade) + " por dia" + cada);
      }
    } else {
      porDia = total;
      porTomada = total / v.tomadas;
      passos.push(com(porDia, unidade) + " ÷ " + v.tomadas + (v.tomadas === 1 ? " tomada" : " tomadas") + " = " + com(porTomada, unidade) + " por dose" + cada);
    }

    /* dose máxima informada: compara, avisa e mostra o valor limitado, sem trocar nada sozinho */
    var limitada = null;
    if (v.max != null) {
      var maxPeriodo = e.maxPeriodo === "dia" ? "dia" : "dose";
      var maxNaUnidade = converter(v.max, e.maxUnidade, unidade);
      var conv = e.maxUnidade !== unidade ? " (= " + com(maxNaUnidade, unidade) + ")" : "";
      if (maxPeriodo === "dose") {
        if (porTomada > maxNaUnidade * (1 + 1e-9)) {
          limitada = { porTomada: maxNaUnidade, porDia: v.tomadas ? maxNaUnidade * v.tomadas : null };
          alertas.push({ nivel: "grave", texto: "A dose calculada, " + com(porTomada, unidade) + " por dose, passa da dose máxima informada: " + com(v.max, e.maxUnidade) + " por dose" + conv + "." });
        } else {
          passos.push("Dentro da dose máxima informada: " + com(v.max, e.maxUnidade) + " por dose" + conv + ".");
        }
      } else if (porDia == null) {
        alertas.push({ nivel: "atencao", texto: "A dose máxima informada é por dia. Informe quantas tomadas por dia para comparar." });
      } else if (porDia > maxNaUnidade * (1 + 1e-9)) {
        limitada = { porDia: maxNaUnidade, porTomada: maxNaUnidade / (v.tomadas || 1) };
        alertas.push({ nivel: "grave", texto: "A dose calculada, " + com(porDia, unidade) + " por dia, passa da dose máxima informada: " + com(v.max, e.maxUnidade) + " por dia" + conv + "." });
      } else {
        passos.push("Dentro da dose máxima informada: " + com(v.max, e.maxUnidade) + " por dia" + conv + ".");
      }
    }

    /* volume a partir da apresentação */
    var conc = null;
    var volume = null;
    var volumeLimitado = null;
    if (v.apQtd != null) {
      var qtdNaUnidade = converter(v.apQtd, e.apUnidade, unidade);
      conc = qtdNaUnidade / v.apVolume;
      var desc = com(v.apQtd, e.apUnidade) + (e.apUnidade !== unidade ? " (= " + com(qtdNaUnidade, unidade) + ")" : "");
      passos.push("Concentração: " + desc + " ÷ " + com(v.apVolume, "mL") + " = " + com(conc, unidade + "/mL"));
      volume = porTomada / conc;
      passos.push(com(porTomada, unidade) + " ÷ " + com(conc, unidade + "/mL") + " = " + com(volume, "mL") + " por dose");
      if (limitada) {
        volumeLimitado = limitada.porTomada / conc;
        passos.push("Se limitada à dose máxima: " + com(limitada.porTomada, unidade) + " ÷ " + com(conc, unidade + "/mL") + " = " + com(volumeLimitado, "mL") + " por dose");
      }
      if (volume < 0.1) alertas.push({ nivel: "atencao", texto: "Volume de " + com(volume, "mL") + " é pequeno demais para medir com precisão. Considere diluir." });
    }

    return {
      unidade: unidade,
      porTomada: porTomada,
      porDia: porDia,
      intervalo: intervalo,
      superficie: sc,
      concentracao: conc,
      volume: volume,
      limitada: limitada,
      volumeLimitado: volumeLimitado,
      passos: passos,
      alertas: alertas
    };
  }

  /* ── infusão contínua ───────────────────────────────────────────── */

  /**
   * entrada:
   *   sentido: "dose" (calcula mL/h a partir da dose) | "vazao" (calcula a dose a partir de mL/h)
   *   peso (kg, quando a dose é por kg), dose, doseUnidade ("mcg","mg","UI","mEq"),
   *   porKg: true | false, tempo: "min" | "h", vazao (mL/h, no sentido "vazao"),
   *   qtd, qtdUnidade ("mg","mcg","g","UI","mEq"), volume (mL): a solução preparada.
   */
  function infusao(entrada) {
    var e = entrada || {};
    var sentido = e.sentido === "vazao" ? "vazao" : "dose";
    var porKg = e.porKg !== false && e.porKg !== "false";
    var tempo = e.tempo === "h" ? "h" : "min";
    var unidade = dimensao(e.doseUnidade) ? e.doseUnidade : "mcg";
    var erros = {};
    var v = campos(
      e,
      {
        peso: { obrigatorio: porKg ? "Informe o peso." : null, max: 1000 },
        dose: { obrigatorio: sentido === "dose" ? "Informe a dose." : null },
        vazao: { obrigatorio: sentido === "vazao" ? "Informe a vazão em mL/h." : null, max: 10000 },
        qtd: { obrigatorio: "Informe quanto do medicamento vai na solução." },
        volume: { obrigatorio: "Informe o volume final da solução.", max: 100000 }
      },
      erros
    );
    if (v.qtd != null && dimensao(e.qtdUnidade) !== dimensao(unidade)) {
      erros.qtd = "A solução está em " + (e.qtdUnidade || "?") + " e a dose em " + unidade + ": não há como converter.";
    }
    if (Object.keys(erros).length) return { erros: erros };

    var passos = [];
    var alertas = [];
    if (porKg) checarPeso(v.peso, alertas);

    var qtdNaUnidade = converter(v.qtd, e.qtdUnidade, unidade);
    var conc = qtdNaUnidade / v.volume;
    var desc = com(v.qtd, e.qtdUnidade) + (e.qtdUnidade !== unidade ? " (= " + com(qtdNaUnidade, unidade) + ")" : "");
    passos.push("Concentração: " + desc + " ÷ " + com(v.volume, "mL") + " = " + com(conc, unidade + "/mL"));

    var rotulo = unidade + (porKg ? "/kg" : "") + "/" + tempo;
    var fator = (porKg ? v.peso : 1) * (tempo === "min" ? 60 : 1);
    var fatorTexto = (porKg ? " × " + com(v.peso, "kg") : "") + (tempo === "min" ? " × 60 min/h" : "");
    var porHora;
    var dose;
    var vazao;
    if (sentido === "dose") {
      dose = v.dose;
      porHora = dose * fator;
      if (fatorTexto) passos.push(com(dose, rotulo) + fatorTexto + " = " + com(porHora, unidade + "/h"));
      vazao = porHora / conc;
      passos.push(com(porHora, unidade + "/h") + " ÷ " + com(conc, unidade + "/mL") + " = " + com(vazao, "mL/h"));
    } else {
      vazao = v.vazao;
      porHora = vazao * conc;
      passos.push(com(vazao, "mL/h") + " × " + com(conc, unidade + "/mL") + " = " + com(porHora, unidade + "/h"));
      dose = porHora / fator;
      if (fatorTexto) passos.push(com(porHora, unidade + "/h") + " ÷ (" + fatorTexto.replace(/^ × /, "") + ") = " + com(dose, rotulo));
    }
    if (vazao < 0.1) alertas.push({ nivel: "atencao", texto: "Vazão de " + com(vazao, "mL/h") + " está abaixo da precisão de muitas bombas. Considere outra diluição." });
    if (vazao > 999) alertas.push({ nivel: "atencao", texto: "Vazão de " + com(vazao, "mL/h") + " passa do limite de muitas bombas. Confira a diluição." });

    return {
      unidade: unidade,
      rotulo: rotulo,
      concentracao: conc,
      porHora: porHora,
      dose: dose,
      vazao: vazao,
      passos: passos,
      alertas: alertas
    };
  }

  var Calculo = {
    lerNumero: lerNumero,
    formatar: formatar,
    num: num,
    com: com,
    converter: converter,
    dimensao: dimensao,
    porPeso: porPeso,
    infusao: infusao
  };
  if (typeof module !== "undefined" && module.exports) module.exports = Calculo;
  else raiz.Calculo = Calculo;
})(this);
