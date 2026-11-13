/* Versão 2 do conteúdo · exame geral e sinais vitais */
(function (S) {
  "use strict";
  var T = S.T, U = S.U, E = S.E, X = S.X, mais = S.mais(2);

  mais("Exame geral › Ectoscopia › Fácies", [
    X("Fácies adenoidiana", "Boca entreaberta, nariz pequeno e afilado, lábio superior curto, face alongada, palato ogival.", [
      ["Hipertrofia de adenoides", "A obstrução da rinofaringe obriga a criança a respirar pela boca; durante o crescimento, isso muda a posição da língua e da mandíbula e altera o desenvolvimento da maxila e da face."],
      ["Rinite alérgica crônica", "A congestão nasal mantida leva à respiração oral, com o mesmo efeito sobre o crescimento facial."]
    ]),
    X("Fácies esclerodérmica (de múmia)", "Pele lisa, brilhante e repuxada, pouca mímica, nariz afilado, boca pequena com pregas radiais ao redor dos lábios.", [
      ["Esclerose sistêmica", "O depósito excessivo de colágeno na derme endurece a pele e a prende aos planos profundos; a expressão fica limitada e a boca abre pouco (microstomia)."]
    ]),
    X("Eritema malar em asa de borboleta", "Eritema nas bochechas e no dorso do nariz que poupa os sulcos nasolabiais.", [
      ["Lúpus eritematoso sistêmico", "A luz ultravioleta induz apoptose dos queratinócitos e expõe autoantígenos; imunocomplexos e inflamação se concentram nas áreas mais expostas ao sol."],
      ["Dermatomiosite", "Também fotossensível, mas costuma atingir os sulcos nasolabiais e vem com edema violáceo das pálpebras (heliotropo)."]
    ]),
    X("Fácies miastênica", "Ptose bilateral, muitas vezes assimétrica, testa enrugada pelo esforço de abrir os olhos, sorriso horizontal; piora no fim do dia.", [
      ["Miastenia gravis", "Anticorpos contra o receptor de acetilcolina reduzem a transmissão neuromuscular; os músculos usados repetidamente, como os das pálpebras e da mímica, cansam primeiro."]
    ]),
    X("Fácies da síndrome de Down", "Fendas palpebrais oblíquas para cima, epicanto, perfil achatado, língua protrusa, orelhas pequenas e de implantação baixa.", [
      ["Trissomia do 21", "A cópia extra do cromossomo 21 altera o desenvolvimento craniofacial desde a vida embrionária."]
    ]),
    X("Fácies etílica", "Olhos avermelhados, rubor e telangiectasias na face, às vezes nariz aumentado e irregular (rinofima).", [
      ["Etilismo crônico", "O álcool dilata os vasos da pele do rosto e, com o tempo, as telangiectasias se fixam; a hepatopatia associada soma aranhas vasculares."]
    ]),
    X("Riso sardônico", "Contração mantida dos músculos da face: sobrancelhas elevadas, testa enrugada, lábios repuxados num sorriso forçado, boca que não abre (trismo).", [
      ["Tétano", "A toxina tetânica bloqueia a liberação de glicina e GABA na medula e no tronco; sem inibição, os músculos ficam em contração contínua."]
    ])
  ]);

  mais("Exame geral › Ectoscopia › Atitude e decúbito", [
    X("Opistótono", "Corpo arqueado em hiperextensão, apoiado na nuca e nos calcanhares.", [
      ["Tétano", "A contração tônica atinge todos os músculos, mas os extensores do dorso são mais fortes e arqueiam o corpo."],
      ["Meningite grave", "A irritação das meninges e das raízes provoca contratura de defesa da musculatura extensora da nuca e do dorso."]
    ]),
    X("Posição de cócoras após esforço", "Criança que se agacha para descansar quando cansa ou fica mais roxa.", [
      ["Tetralogia de Fallot", "Agachar dobra as artérias das pernas e aumenta a resistência vascular sistêmica; menos sangue passa do ventrículo direito para a aorta pela comunicação e mais sangue vai ao pulmão, melhorando a oxigenação."]
    ]),
    X("Atitude passiva", "Fica na posição em que é colocado, sem se mover por conta própria.", [
      ["Rebaixamento de consciência", "Sem o despertar e a iniciativa motora, o paciente não muda de posição."],
      ["Fraqueza extrema (caquexia, choque)", "Não há força nem energia para mudar de posição."]
    ]),
    X("Inquietação, muda de posição o tempo todo", "Não encontra posição de alívio.", [
      ["Cólica renal", "A dor vem da distensão do ureter e da pelve renal e não depende da posição: o paciente não para quieto, ao contrário de quem tem peritonite."],
      ["Isquemia mesentérica e cólica biliar", "Dor visceral intensa sem irritação do peritônio, que não melhora com a imobilidade."]
    ])
  ]);

  mais("Exame geral › Ectoscopia › Estado de hidratação", [
    X("Desidratação", "", [
      ["Queimaduras extensas", "A pele lesada perde a barreira e o líquido extravasa dos capilares e evapora."],
      ["Diabetes insipidus", "Sem ação do ADH, o rim não concentra a urina e elimina grandes volumes de água; se a sede não é atendida, a desidratação é rápida."]
    ])
  ]);

  mais("Exame geral › Ectoscopia › Coloração de pele e mucosas", [
    X("Hiperpigmentação difusa", "Escurecimento da pele, mais em dobras, cicatrizes, palmas e mucosa oral.", [
      ["Doença de Addison", "Sem cortisol, a hipófise produz mais POMC, que origina ACTH e hormônio estimulante dos melanócitos; os melanócitos produzem mais melanina."],
      ["Hemocromatose", "O depósito de ferro na pele e o estímulo à melanina dão um tom bronze-acinzentado."]
    ]),
    X("Pletora (rubor de face e mucosas)", "Face e mucosas avermelhadas e congestas.", [
      ["Policitemia", "O excesso de hemácias aumenta a quantidade de sangue nos capilares da pele."],
      ["Intoxicação por monóxido de carbono", "A carboxi-hemoglobina tem cor vermelho-cereja; é um sinal tardio e pouco confiável, a ausência não afasta."]
    ]),
    X("Carotenodermia", "Amarelado em palmas, plantas e sulco nasolabial, com escleras brancas.", [
      ["Ingestão excessiva de caroteno", "O pigmento se deposita na camada córnea, mais espessa nas palmas e plantas; a esclera não tem camada córnea e fica branca, ao contrário da icterícia."],
      ["Hipotireoidismo", "A conversão de caroteno em vitamina A fica mais lenta e o pigmento se acumula."]
    ])
  ]);

  mais("Exame geral › Ectoscopia › Edema", [
    X("Edema de um só membro", "", [
      ["Insuficiência venosa crônica", "Válvulas incompetentes deixam a pressão venosa alta na perna; o edema piora no fim do dia e vem com varizes e pele escurecida."],
      ["Cisto de Baker roto", "O líquido da articulação escorre para a panturrilha e imita trombose."]
    ]),
    X("Angioedema", "Inchaço súbito, assimétrico e sem cacifo de lábios, pálpebras, língua ou glote.", [
      ["Alergia (histamina)", "Mastócitos liberam histamina, que aumenta a permeabilidade dos vasos da derme profunda; costuma vir com urticária."],
      ["Inibidor da ECA (bradicinina)", "A ECA também degrada bradicinina; bloqueada, a bradicinina se acumula e aumenta a permeabilidade vascular. Pode surgir anos depois do início do remédio e não tem urticária."],
      ["Angioedema hereditário", "A falta ou o defeito do inibidor de C1 libera bradicinina em excesso; crises repetidas, sem urticária, às vezes com dor abdominal."]
    ]),
    X("Edema duro sem cacifo na face anterior das pernas", "Placas espessas, cor de casca de laranja.", [
      ["Mixedema pré-tibial da doença de Graves", "Anticorpos estimulam fibroblastos da derme, que acumulam glicosaminoglicanos; não é retenção de água livre, por isso o dedo não deixa marca."]
    ])
  ]);

  mais("Exame geral › Ectoscopia", [
    T("Medidas antropométricas", "Peso e altura sem calçados; IMC = peso ÷ altura². Circunferência abdominal em pé, no ponto médio entre o rebordo costal e a crista ilíaca, no fim da expiração.", [
      E("IMC e circunferência abdominal dentro do alvo", "IMC entre 18,5 e 24,9. Os cortes da circunferência variam com o critério (por exemplo, 94 e 80 cm ou 102 e 88 cm para homens e mulheres)."),
      X("Obesidade central", "Circunferência abdominal acima do corte, mesmo com IMC normal.", [
        ["Resistência à insulina e síndrome metabólica", "A gordura visceral libera ácidos graxos e citocinas direto na veia porta e piora a ação da insulina; o hiperinsulinismo, por sua vez, favorece o acúmulo no abdome."],
        ["Excesso de cortisol", "O cortisol redistribui a gordura para o tronco e o abdome, poupando os membros."]
      ]),
      X("Baixo peso", "IMC abaixo de 18,5 ou perda de mais de 5% do peso em 6 a 12 meses.", [
        ["Ingestão insuficiente", "Pobreza, depressão, isolamento, problemas dentários ou de deglutição no idoso."],
        ["Má absorção (doença celíaca, insuficiência pancreática)", "Os nutrientes chegam ao intestino, mas a mucosa lesada ou a falta de enzimas impedem a absorção; costuma haver diarreia e fezes gordurosas."],
        ["Transtornos alimentares", "A restrição voluntária e os comportamentos compensatórios reduzem a energia disponível; pode haver lanugem, bradicardia e hipotermia."]
      ])
    ]),
    U("Biotipo", "Compare tronco e membros e o ângulo de Charpy, formado pelos rebordos costais.", [
      E("Normolíneo", "Equilíbrio entre tronco e membros; ângulo de Charpy perto de 90°."),
      E("Longilíneo", "Pescoço e membros longos, tórax estreito e chato, ângulo de Charpy agudo."),
      E("Brevilíneo", "Pescoço curto, membros curtos, tórax largo, ângulo de Charpy obtuso."),
      X("Hábito eunucoide", "Envergadura maior que a altura, membros longos em relação ao tronco.", [
        ["Hipogonadismo antes da puberdade (síndrome de Klinefelter)", "Sem esteroides sexuais, as epífises dos ossos longos demoram a fechar e os membros continuam crescendo."]
      ]),
      X("Hábito marfanoide", "Alto e magro, membros e dedos muito longos (aracnodactilia), envergadura maior que a altura.", [
        ["Síndrome de Marfan", "A fibrilina-1 defeituosa deixa o TGF-beta mais ativo e o tecido conjuntivo frouxo; os ossos longos crescem em excesso. Procure luxação do cristalino e dilatação da aorta."],
        ["Homocistinúria", "Aspecto parecido, mas com luxação do cristalino para baixo, déficit intelectual e tromboses."]
      ])
    ]),
    T("Pelos e distribuição", "Observe couro cabeludo, face, axilas, púbis, tórax e membros.", [
      E("Distribuição de pelos compatível com sexo e idade", ""),
      X("Hirsutismo", "Pelos grossos em padrão masculino em mulheres: buço, queixo, tórax, linha alba, face interna das coxas.", [
        ["Síndrome dos ovários policísticos", "Insulina alta e LH elevado estimulam a teca ovariana a produzir androgênios, que transformam pelos finos em pelos terminais."],
        ["Hiperplasia adrenal congênita não clássica", "O bloqueio parcial da 21-hidroxilase desvia precursores do cortisol para a produção de androgênios."],
        ["Tumor produtor de androgênio", "Suspeite quando o quadro é rápido e vem com virilização: voz grave, aumento do clitóris, calvície."]
      ]),
      X("Rarefação de pelos axilares e pubianos", "", [
        ["Hipogonadismo e hipopituitarismo", "Sem androgênios gonadais e suprarrenais, os pelos sexuais rareiam."],
        ["Cirrose hepática", "O excesso relativo de estrogênio e a queda da testosterona livre reduzem os pelos de padrão masculino."]
      ])
    ])
  ]);

  mais("Exame geral › Nível de consciência e orientação", [
    X("Rebaixamento (sonolência, torpor, coma)", "", [
      ["Hipercapnia", "O CO2 alto acidifica o liquor e dilata os vasos cerebrais, deprimindo o córtex (carbonarcose); acontece na DPOC descompensada ou com oxigênio em excesso."],
      ["Uremia", "Toxinas que o rim não elimina alteram a neurotransmissão; pode haver asterixe e mioclonias."],
      ["Hiponatremia grave", "Com o plasma diluído, a água entra nos neurônios por osmose e o cérebro incha."]
    ]),
    X("Postura de decorticação", "Ao estímulo doloroso, braços fletidos junto ao tórax e pernas estendidas.", [
      ["Lesão acima do mesencéfalo (hemisférios, cápsula interna)", "Sem o controle do córtex, predomina a via rubroespinal, que facilita os flexores dos membros superiores."]
    ]),
    X("Postura de descerebração", "Ao estímulo doloroso, braços e pernas estendidos, punhos em pronação.", [
      ["Lesão do tronco abaixo do núcleo rubro", "Perde-se a via rubroespinal e predomina a vestibuloespinal, que facilita os extensores; indica lesão mais baixa e de pior prognóstico que a decorticação."]
    ])
  ]);

  /* ── sinais vitais ── */
  mais("Sinais vitais › Temperatura", [
    X("Febre com bradicardia relativa (sinal de Faget)", "O pulso não acelera como esperado para a febre (cerca de 10 bpm por grau).", [
      ["Febre tifoide", "Clássica dissociação pulso-temperatura; o mecanismo não é bem conhecido (atribui-se a efeito sobre o miocárdio e o tônus vagal)."],
      ["Febre amarela, legionelose e leptospirose", "Mesma dissociação, de mecanismo incerto."],
      ["Uso de betabloqueador e febre por fármaco", "O betabloqueador impede a taquicardia; na febre por fármaco o paciente costuma parecer bem para a temperatura que tem."]
    ]),
    X("Hipertermia", "Temperatura muito alta sem resposta a antitérmico; pele quente, seca ou com suor intenso.", [
      ["Golpe de calor (insolação)", "O ganho de calor do ambiente ou do exercício supera a capacidade de perder calor; o centro térmico está ajustado no normal, por isso o antitérmico não age."],
      ["Síndrome neuroléptica maligna", "O bloqueio de dopamina causa rigidez muscular intensa, que produz calor, e desregula o hipotálamo."],
      ["Hipertermia maligna", "Anestésicos inalatórios ou succinilcolina liberam cálcio sem controle no músculo de pessoas predispostas (mutação do RYR1); a contração contínua gera calor."],
      ["Síndrome serotoninérgica", "O excesso de serotonina causa hiperatividade muscular (clônus, tremor) e autonômica."]
    ])
  ]);

  mais("Sinais vitais › Pulso e frequência cardíaca", [
    X("Taquicardia", "", [
      ["Embolia pulmonar", "A obstrução da circulação pulmonar reduz o enchimento do lado esquerdo e o coração compensa acelerando; muitas vezes é o único sinal."],
      ["Sepse", "Vasodilatação e febre: o coração bate mais para manter a pressão e a oferta de oxigênio."]
    ]),
    X("Déficit de pulso", "Frequência contada no coração maior que a do pulso radial.", [
      ["Fibrilação atrial", "Batimentos que chegam com pouco tempo de enchimento ejetam tão pouco sangue que a onda não alcança o punho."],
      ["Extrassístoles frequentes", "O batimento precoce encontra o ventrículo pouco cheio e não gera pulso palpável."]
    ]),
    X("Aumento da frequência ao ficar de pé, sem queda da pressão", "Aumento de 30 bpm ou mais em até 10 minutos de pé, com sintomas.", [
      ["Síndrome de taquicardia postural ortostática (POTS)", "Falha da vasoconstrição venosa ao levantar; o sangue fica nas pernas e o coração compensa acelerando."],
      ["Hipovolemia leve", "Antes de a pressão cair, a frequência sobe para manter o débito."]
    ])
  ]);

  mais("Sinais vitais › Frequência e ritmo respiratório", [
    X("Respiração de Biot", "Respirações irregulares em ritmo e amplitude, com pausas imprevisíveis.", [
      ["Lesão do bulbo", "O centro respiratório lesado perde o ritmo próprio; é sinal de gravidade."],
      ["Hipertensão intracraniana", "A compressão do tronco desorganiza o centro respiratório."]
    ]),
    X("Respiração suspirosa", "Respiração normal interrompida por suspiros profundos, sem esforço.", [
      ["Ansiedade", "Sensação de não conseguir encher o pulmão, sem doença respiratória; a saturação é normal."]
    ])
  ]);

  mais("Sinais vitais › Pressão arterial", [
    X("Diferença de pressão entre os braços", "Mais de 10 a 15 mmHg na sistólica.", [
      ["Dissecção de aorta", "O falso lúmen comprime a origem de um dos ramos do arco; com dor torácica súbita, é urgência."],
      ["Estenose de artéria subclávia", "A placa reduz a pressão no braço do lado afetado; pode haver roubo da vertebral."],
      ["Coarctação da aorta antes da subclávia esquerda", "O estreitamento reduz a pressão do braço esquerdo em relação ao direito."]
    ]),
    X("Pressão de pulso alargada", "Diferença entre sistólica e diastólica acima de 60 mmHg.", [
      ["Rigidez arterial do idoso", "A aorta endurecida não amortece a ejeção: a sistólica sobe e a diastólica cai."],
      ["Insuficiência aórtica", "O ventrículo ejeta um grande volume e parte dele volta na diástole."],
      ["Estados hiperdinâmicos (anemia, hipertireoidismo, fístula arteriovenosa)", "O débito alto e a resistência periférica baixa afastam as duas pressões."]
    ]),
    X("Pressão de pulso convergente", "Diferença menor que 25% da sistólica.", [
      ["Choque hipovolêmico", "O volume sistólico cai e a vasoconstrição mantém a diastólica."],
      ["Tamponamento cardíaco", "O coração comprimido enche e ejeta pouco."],
      ["Estenose aórtica grave", "A ejeção é pequena e lenta."]
    ])
  ]);

  mais("Sinais vitais › Saturação de oxigênio", [
    X("Saturação normal com hipóxia dos tecidos", "O oxímetro mostra valor normal ou falsamente alto.", [
      ["Intoxicação por monóxido de carbono", "O oxímetro comum não distingue carboxi-hemoglobina de oxi-hemoglobina; peça gasometria com co-oximetria."],
      ["Anemia grave", "A saturação mede a porcentagem de hemoglobina com oxigênio, não a quantidade de hemoglobina: pouca hemoglobina saturada leva pouco oxigênio."]
    ]),
    X("Leitura baixa ou instável sem hipóxia real", "Onda de pulso ruim no aparelho.", [
      ["Má perfusão periférica (frio, choque, Raynaud)", "Sem pulsação suficiente no dedo, o aparelho não separa o sinal arterial do ruído."],
      ["Esmalte escuro e movimento", "Interferem na passagem da luz pelo dedo."]
    ])
  ]);

  mais("Sinais vitais", [
    T("Dor", "Pergunte intensidade de 0 a 10, local, irradiação e caráter. Em quem não fala, observe expressão, gemido, postura e reação ao toque.", [
      E("Sem dor", ""),
      X("Dor desproporcional ao exame", "Dor intensa com abdome ou membro de aspecto quase normal.", [
        ["Isquemia mesentérica", "O intestino isquêmico dói muito antes de haver irritação do peritônio, que é o que o exame detecta; costuma haver fibrilação atrial ou aterosclerose."],
        ["Síndrome compartimental", "A pressão no compartimento fechado comprime vasos e nervos; dói muito ao estirar passivamente os músculos daquele compartimento."]
      ]),
      X("Dor referida a distância", "Dor sentida em local diferente do órgão doente.", [
        ["Infarto do miocárdio (braço, mandíbula, epigástrio)", "Fibras viscerais do coração e fibras somáticas dessas regiões entram nos mesmos segmentos da medula (C8 a T4), e o cérebro atribui a dor à pele."],
        ["Irritação do diafragma (ombro)", "O nervo frênico vem de C3 a C5, os mesmos segmentos do ombro; sangue ou pus sob o diafragma dói no ombro (sinal de Kehr)."]
      ])
    ])
  ]);
})(window.SEM);
