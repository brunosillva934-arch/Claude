/* Conteúdo inicial do app. Só entra na primeira abertura (ou em "Repor o conteúdo inicial");
   depois disso tudo é editável no aparelho.
   T(nome, como examinar, itens)      área ou tópico; os itens são outros T, E ou X
   E(nome, como reconhecer)           achado esperado
   X(nome, como reconhecer, motivos)  achado anormal; cada motivo é [nome, como leva ao achado] */
(function () {
  "use strict";
  function T(nome, nota, itens) { return { k: "t", nome: nome, nota: nota || "", itens: itens || [] }; }
  function E(nome, nota) { return { k: "e", nome: nome, nota: nota || "" }; }
  function X(nome, nota, motivos) { return { k: "x", nome: nome, nota: nota || "", motivos: motivos || [] }; }

  window.SEMENTE = [

    /* ───────────────────────── EXAME GERAL ───────────────────────── */
    T("Exame geral", "Começa quando o paciente entra na sala. Observe antes de tocar: aparência, postura, fala, marcha, higiene.", [
      T("Ectoscopia", "Inspeção global, com boa luz (de preferência natural) e o paciente o mais descoberto que o pudor permitir.", [
        T("Estado geral", "Impressão de conjunto sobre o quanto a doença repercute no organismo.", [
          E("Bom estado geral (BEG)", "Aparência saudável, sem sinais de sofrimento, ativo e colaborativo."),
          X("Regular estado geral (REG)", "Aparenta estar doente, mas mantém suas funções e interage bem.", [
            ["Doença aguda moderada", "Febre, dor e resposta inflamatória consomem energia e abatem o paciente sem chegar a comprometer as funções vitais."],
            ["Doença crônica descompensada", "A perda da reserva funcional (cardíaca, pulmonar, renal, hepática) limita atividade e disposição."]
          ]),
          X("Mau estado geral (MEG)", "Prostrado, abatido, pouco responsivo, com aparência de doença grave.", [
            ["Sepse", "A resposta inflamatória sistêmica e a má perfusão dos tecidos causam prostração, rebaixamento e fraqueza intensa."],
            ["Neoplasia avançada", "Citocinas tumorais levam à caquexia: perda de músculo e gordura, anorexia e fadiga."],
            ["Choque", "A oferta de oxigênio fica abaixo da demanda; cérebro e músculos hipoperfundidos deixam o paciente apático e fraco."]
          ])
        ]),
        T("Fácies", "Conjunto de traços e expressão do rosto. Olhe o paciente de frente, em repouso e enquanto fala.", [
          E("Fácies atípica (normal)", "Sem traços que sugiram doença específica; expressão compatível com o momento."),
          X("Fácies hipocrática", "Olhos fundos e parados, nariz afilado, têmporas escavadas, lábios finos e arroxeados, pele pálido-terrosa, às vezes suor frio.", [
            ["Desnutrição grave", "O consumo da gordura da face e da órbita e a atrofia dos músculos faciais deixam o esqueleto do rosto aparente e os olhos encovados."],
            ["Paciente terminal", "Somam-se caquexia, desidratação e má perfusão periférica na fase final de doenças graves: perde-se volume da face e a pele fica fria e acinzentada."],
            ["Desidratação grave", "A perda de água do tecido subcutâneo e da órbita afunda os olhos e afila os traços."],
            ["Peritonite e choque", "A hipoperfusão com vasoconstrição cutânea dá palidez, cianose de lábios e suor frio sobre um rosto já consumido pela doença."]
          ]),
          X("Fácies renal", "Edema ao redor dos olhos, pior pela manhã, com palidez.", [
            ["Síndrome nefrótica", "A perda de albumina na urina reduz a pressão oncótica; o líquido se acumula onde o tecido é mais frouxo, como as pálpebras."],
            ["Glomerulonefrite aguda", "A retenção de sódio e água aumenta o volume circulante e o líquido extravasa para o tecido periorbital."],
            ["Doença renal crônica", "Retenção hídrica dá o edema; a falta de eritropoetina dá a palidez."]
          ]),
          X("Fácies mixedematosa", "Rosto arredondado e infiltrado, pele seca e espessa, pálpebras inchadas, sobrancelhas ralas no terço externo, expressão de desânimo.", [
            ["Hipotireoidismo", "A falta de hormônio tireoidiano deixa acumular glicosaminoglicanos na derme, que retêm água e infiltram a pele (mixedema)."]
          ]),
          X("Fácies basedowiana", "Olhos salientes e brilhantes, expressão de espanto, rosto magro; pode haver bócio.", [
            ["Doença de Graves", "Autoanticorpos estimulam fibroblastos da órbita; gordura e músculos aumentam e empurram o globo para a frente. O excesso de hormônio retrai a pálpebra superior."]
          ]),
          X("Fácies cushingoide (lua cheia)", "Rosto arredondado, bochechas avermelhadas, acne, às vezes pelos em excesso.", [
            ["Uso prolongado de corticoide", "O excesso de glicocorticoide redistribui a gordura para face, pescoço e tronco e afina a pele, deixando os vasos aparentes."],
            ["Síndrome de Cushing endógena", "Tumor de hipófise ou de suprarrenal produz cortisol em excesso, com o mesmo efeito de redistribuição de gordura."]
          ]),
          X("Fácies parkinsoniana", "Rosto em máscara: pouca mímica, olhar fixo, piscar raro, cabeça um pouco inclinada para a frente.", [
            ["Doença de Parkinson", "A perda de neurônios dopaminérgicos da substância negra causa bradicinesia e rigidez, que atingem também os músculos da mímica."],
            ["Parkinsonismo por medicamento", "Antipsicóticos e antieméticos bloqueiam receptores de dopamina nos núcleos da base e reproduzem a hipomimia."]
          ]),
          X("Fácies acromegálica", "Mandíbula proeminente, arcos supraorbitais salientes, nariz, lábios e orelhas grandes.", [
            ["Adenoma hipofisário produtor de GH", "O excesso de GH e IGF-1 no adulto faz crescer ossos da face e partes moles, já que as epífises dos ossos longos estão fechadas."]
          ]),
          X("Fácies mitral", "Bochechas arroxeadas com o restante do rosto pálido.", [
            ["Estenose mitral", "O baixo débito provoca vasoconstrição periférica e a estase venosa dilata os capilares malares, que ficam com sangue pouco oxigenado."]
          ]),
          X("Fácies leonina", "Pele espessa com nódulos, perda das sobrancelhas, nariz alargado.", [
            ["Hanseníase virchowiana", "A infiltração difusa da derme por macrófagos cheios de bacilos espessa a pele, forma nódulos e destrói os folículos das sobrancelhas (madarose)."]
          ]),
          X("Fácies de paralisia facial periférica", "Um lado do rosto sem rugas na testa, olho que não fecha, sulco nasolabial apagado e boca desviada para o lado são.", [
            ["Paralisia de Bell", "A inflamação do nervo facial no canal ósseo paralisa todos os músculos da mímica daquele lado, inclusive os da testa."],
            ["Herpes-zóster ótico (Ramsay Hunt)", "A reativação do vírus no gânglio geniculado lesa o nervo facial; há vesículas no ouvido."]
          ])
        ]),
        T("Atitude e decúbito", "Posição que o paciente adota espontaneamente, em pé ou no leito.", [
          E("Atitude ativa, sem posição preferencial", "Muda de posição à vontade, sem que isso alivie ou piore sintomas."),
          X("Ortopneia (atitude ortopneica)", "Só respira bem sentado ou com vários travesseiros.", [
            ["Insuficiência cardíaca esquerda", "Deitado, o sangue das pernas volta ao tórax; o ventrículo esquerdo não dá conta, a pressão nos capilares pulmonares sobe e o pulmão congesto fica mais rígido."],
            ["Ascite volumosa", "Deitado, o líquido empurra o diafragma para cima e reduz o volume pulmonar."],
            ["DPOC ou asma grave", "Sentado e apoiado nos braços, o paciente fixa a cintura escapular e usa melhor a musculatura acessória."]
          ]),
          X("Posição genupeitoral (prece maometana)", "Ajoelhado, com o tronco inclinado para a frente.", [
            ["Pericardite e derrame pericárdico", "Inclinar-se para a frente afasta o pericárdio inflamado das estruturas vizinhas e facilita o enchimento do coração."]
          ]),
          X("Posição antálgica em flexão (gatilho)", "Deitado de lado, com coxas fletidas sobre o abdome.", [
            ["Irritação peritoneal", "Fletir as coxas relaxa a parede abdominal e reduz a tração sobre o peritônio inflamado."],
            ["Meningite", "A flexão das pernas alivia o estiramento das raízes e das meninges inflamadas; a hipertonia extensora da nuca completa a postura."]
          ]),
          X("Decúbito lateral preferencial", "Deita sempre sobre o mesmo lado.", [
            ["Derrame pleural volumoso", "Deitar sobre o lado do derrame deixa o pulmão sadio livre para expandir."],
            ["Dor pleurítica", "Deitar sobre o lado doente limita o movimento daquela parede e diminui a dor."]
          ])
        ]),
        T("Estado de hidratação", "Avalie mucosas, turgor e elasticidade da pele, olhos, estado geral, sede e diurese. No bebê, a fontanela.", [
          E("Hidratado", "Mucosas úmidas, turgor preservado, olhos brilhantes."),
          X("Desidratação", "Mucosas secas, turgor diminuído (a prega se desfaz devagar), olhos fundos, sede, pouca urina; grave: hipotensão e rebaixamento.", [
            ["Diarreia e vômitos", "Perda direta de água e eletrólitos pelo tubo digestivo, sem reposição suficiente."],
            ["Diurese osmótica (hiperglicemia)", "A glicose que sobra na urina arrasta água junto com ela."],
            ["Baixa ingestão", "Idosos com sede diminuída, pacientes acamados ou confusos não repõem as perdas diárias."],
            ["Febre e sudorese", "Aumentam as perdas insensíveis pela pele e pela respiração."]
          ])
        ]),
        T("Coloração de pele e mucosas", "Compare com a sua própria palma e conjuntiva. Em pele escura, olhe conjuntivas, lábios, língua, palmas e leito das unhas.", [
          E("Corado, anictérico, acianótico", "Mucosas róseas, escleras brancas, extremidades sem tom azulado."),
          X("Palidez (hipocorado)", "Mucosas e leito ungueal descorados; gradue em cruzes (+ a 4+).", [
            ["Anemia", "Menos hemoglobina circulando reduz o tom vermelho que se vê através das mucosas."],
            ["Vasoconstrição periférica", "No choque, no frio ou na dor intensa, o sangue é desviado da pele por ação simpática."]
          ]),
          X("Icterícia", "Amarelo em escleras, freio da língua e pele; aparece com bilirrubina acima de 2 a 3 mg/dL.", [
            ["Hemólise", "A destruição acelerada de hemácias produz bilirrubina indireta além do que o fígado consegue conjugar."],
            ["Hepatite e cirrose", "O hepatócito lesado capta, conjuga e excreta mal a bilirrubina, que reflui para o sangue."],
            ["Obstrução biliar (cálculo, tumor)", "A bile não chega ao intestino e a bilirrubina direta volta ao sangue; há colúria e fezes claras."]
          ]),
          X("Cianose central", "Azulado em lábios e língua, com extremidades quentes.", [
            ["Doença pulmonar com hipoxemia", "O sangue sai do pulmão mal oxigenado; mais de 5 g/dL de hemoglobina reduzida nos capilares dá a cor azulada."],
            ["Cardiopatia congênita com shunt direita-esquerda", "Sangue venoso passa para a circulação sistêmica sem passar pelo pulmão."]
          ]),
          X("Cianose periférica", "Azulado em mãos, pés e ponta do nariz, com extremidades frias; a língua fica rósea.", [
            ["Baixo débito cardíaco", "O fluxo lento pelos capilares dá tempo ao tecido de extrair mais oxigênio de cada hemácia."],
            ["Frio e fenômeno de Raynaud", "O vasoespasmo reduz o fluxo local e aumenta a extração de oxigênio."]
          ])
        ]),
        T("Edema", "Comprima por alguns segundos contra o osso (tíbia, maléolo, sacro no acamado). Descreva local, intensidade em cruzes, consistência, temperatura e dor.", [
          E("Sem edema", "A pressão do dedo não deixa depressão."),
          X("Edema generalizado (anasarca)", "Edema de membros, face e cavidades, mole e com cacifo.", [
            ["Insuficiência cardíaca", "A pressão venosa alta empurra líquido para fora dos capilares e o rim retém sódio e água por perfusão baixa."],
            ["Síndrome nefrótica", "A albumina perdida na urina baixa a pressão oncótica do plasma, que deixa de segurar o líquido dentro do vaso."],
            ["Cirrose hepática", "O fígado produz menos albumina e a hipertensão portal com vasodilatação esplâncnica faz o rim reter sódio."],
            ["Desnutrição proteica", "A falta de proteína na dieta reduz a albumina e a pressão oncótica."]
          ]),
          X("Edema de um só membro", "Assimetria entre os membros; meça a circunferência.", [
            ["Trombose venosa profunda", "O trombo bloqueia a drenagem venosa e a pressão capilar sobe abaixo da obstrução."],
            ["Linfedema", "A linfa rica em proteína se acumula; o edema é duro e quase sem cacifo."],
            ["Celulite e erisipela", "A inflamação aumenta a permeabilidade dos capilares; há calor, rubor e dor."]
          ])
        ]),
        T("Estado nutricional e biotipo", "Olhe panículo adiposo, massa muscular (têmporas, interósseos, quadríceps) e proporção entre tronco e membros.", [
          E("Eutrófico", "Panículo e musculatura proporcionais; IMC entre 18,5 e 24,9."),
          X("Emagrecimento e caquexia", "Ossos salientes, têmporas escavadas, musculatura consumida.", [
            ["Neoplasia", "Citocinas como TNF e IL-6 aumentam o catabolismo de músculo e gordura e tiram o apetite."],
            ["Tuberculose e HIV avançado", "A inflamação crônica eleva o gasto energético e reduz a ingestão."],
            ["Hipertireoidismo", "O excesso de hormônio tireoidiano acelera o metabolismo basal; perde-se peso mesmo comendo mais."],
            ["Diabetes descompensado", "Sem insulina, a glicose se perde na urina e o corpo consome gordura e músculo."]
          ]),
          X("Obesidade", "Excesso de panículo adiposo; IMC a partir de 30. Meça a circunferência abdominal.", [
            ["Balanço energético positivo", "Ingestão maior que o gasto por anos, com o excedente guardado como gordura."],
            ["Hipotireoidismo e Cushing", "Metabolismo basal reduzido ou excesso de cortisol favorecem o acúmulo, sobretudo central."]
          ])
        ])
      ]),
      T("Nível de consciência e orientação", "Observe abertura ocular, resposta verbal e motora (escala de Glasgow) e pergunte nome, lugar e data.", [
        E("Lúcido e orientado no tempo e no espaço (LOTE)", "Desperto, responde com coerência, sabe quem é, onde está e a data."),
        X("Confusão mental (delirium)", "Desatenção, desorientação e flutuação ao longo do dia, de início agudo.", [
          ["Infecção no idoso", "Citocinas inflamatórias alteram a neurotransmissão em um cérebro com pouca reserva; pode ser o único sinal de pneumonia ou infecção urinária."],
          ["Distúrbio metabólico", "Hiponatremia, hipoglicemia, uremia e hipóxia alteram o meio de que o neurônio depende."],
          ["Medicamentos e abstinência", "Sedativos, anticolinérgicos, opioides ou a retirada de álcool desorganizam os sistemas de atenção."]
        ]),
        X("Rebaixamento (sonolência, torpor, coma)", "Do que desperta ao chamado (sonolência) ao que não responde à dor (coma).", [
          ["AVC e trauma craniano", "A lesão ou a compressão do tronco e dos hemisférios desliga o sistema reticular ativador."],
          ["Intoxicação exógena", "Álcool, benzodiazepínicos e opioides deprimem o sistema nervoso central."],
          ["Hipoglicemia", "O neurônio depende de glicose contínua; sem ela, para de funcionar em minutos."],
          ["Encefalopatia hepática", "A amônia que o fígado não depura age no cérebro como falso neurotransmissor e causa edema dos astrócitos."]
        ])
      ])
    ]),

    /* ───────────────────────── SINAIS VITAIS ───────────────────────── */
    T("Sinais vitais", "Meça com o paciente em repouso por alguns minutos. Anote o valor, o membro e a posição.", [
      T("Temperatura", "Axilar por 3 a 5 minutos com termômetro bem posicionado.", [
        E("Afebril", "Axilar entre 35,5 e 37 °C."),
        X("Febre", "Axilar acima de 37,8 °C. Descreva início, intensidade e padrão.", [
          ["Infecção", "Produtos dos microrganismos fazem os leucócitos liberar IL-1, IL-6 e TNF; no hipotálamo, a prostaglandina E2 eleva o ponto de ajuste da temperatura."],
          ["Neoplasia", "O tumor ou a resposta a ele libera as mesmas citocinas pirogênicas (linfoma, câncer renal)."],
          ["Doença autoimune", "A inflamação mantida por imunocomplexos e linfócitos ativados produz pirógenos endógenos."],
          ["Medicamentos", "Reação de hipersensibilidade ao fármaco ou interferência direta na termorregulação."]
        ]),
        X("Hipotermia", "Abaixo de 35 °C.", [
          ["Exposição ao frio", "A perda de calor supera a capacidade de produzir e conservar."],
          ["Sepse no idoso", "A resposta termorreguladora falha e a vasodilatação aumenta a perda de calor."],
          ["Hipotireoidismo grave", "Sem hormônio tireoidiano, a produção de calor pelo metabolismo cai."]
        ])
      ]),
      T("Pulso e frequência cardíaca", "Palpe a radial por 1 minuto. Avalie frequência, ritmo, amplitude e compare os dois lados.", [
        E("Pulso rítmico, cheio, 60 a 100 bpm", "Batimentos regulares, de boa amplitude e iguais dos dois lados."),
        X("Taquicardia", "Acima de 100 bpm em repouso.", [
          ["Febre", "O calor acelera a despolarização do nó sinusal: cerca de 10 bpm a mais por grau."],
          ["Hipovolemia e anemia", "Com menos volume ou menos hemoglobina, o coração bate mais vezes para manter a oferta de oxigênio."],
          ["Dor e ansiedade", "A descarga simpática acelera o nó sinusal."],
          ["Hipertireoidismo", "O hormônio tireoidiano aumenta o número e a sensibilidade dos receptores beta no coração."]
        ]),
        X("Bradicardia", "Abaixo de 60 bpm (pode ser normal em atletas e no sono).", [
          ["Betabloqueador e outros fármacos", "Bloqueiam o estímulo simpático ou a condução no nó sinusal e no nó AV."],
          ["Bloqueio atrioventricular", "O impulso atrial não chega aos ventrículos, que passam a bater por um ritmo de escape lento."],
          ["Hipertensão intracraniana", "No reflexo de Cushing, a hipertensão arterial de resposta estimula os barorreceptores e o vago."]
        ]),
        X("Pulso irregular", "Sem padrão de repetição (irregularmente irregular) ou com falhas ocasionais.", [
          ["Fibrilação atrial", "Os átrios despolarizam de forma caótica e o nó AV deixa passar impulsos em intervalos imprevisíveis."],
          ["Extrassístoles", "Um batimento precoce é seguido de pausa; o paciente sente a falha."]
        ])
      ]),
      T("Frequência e ritmo respiratório", "Conte por 1 minuto sem avisar o paciente (finja ainda palpar o pulso).", [
        E("Eupneico, 12 a 20 irpm", "Respiração regular, sem esforço."),
        X("Taquipneia", "Acima de 20 irpm.", [
          ["Pneumonia e outras causas de hipoxemia", "Quimiorreceptores carotídeos percebem a queda de oxigênio e estimulam o centro respiratório."],
          ["Acidose metabólica", "O centro respiratório aumenta a ventilação para eliminar CO2 e compensar o pH."],
          ["Dor, febre e ansiedade", "Aumentam o estímulo central e o consumo de oxigênio."]
        ]),
        X("Respiração de Kussmaul", "Inspirações amplas e profundas, com pausas curtas.", [
          ["Cetoacidose diabética", "A acidose intensa estimula ao máximo o centro respiratório, que lava CO2 com grandes volumes."],
          ["Uremia", "O rim deixa de excretar ácidos e a compensação é respiratória."]
        ]),
        X("Respiração de Cheyne-Stokes", "Ciclos de respiração que cresce, decresce e para (apneia).", [
          ["Insuficiência cardíaca grave", "A circulação lenta atrasa a chegada do sangue ao centro respiratório, que corrige o CO2 sempre com atraso e oscila."],
          ["Lesão cerebral difusa", "O centro respiratório passa a responder de forma exagerada ao CO2."]
        ]),
        X("Bradipneia", "Abaixo de 12 irpm.", [
          ["Opioides e sedativos", "Deprimem a resposta do centro respiratório ao CO2."],
          ["Hipertensão intracraniana", "A compressão do tronco encefálico compromete o centro respiratório."]
        ])
      ]),
      T("Pressão arterial", "Paciente sentado, braço apoiado na altura do coração, manguito do tamanho certo. Na primeira consulta, meça nos dois braços.", [
        E("Normotenso", "Abaixo de 140 por 90 mmHg no consultório."),
        X("Pressão elevada", "140 por 90 mmHg ou mais, confirmada em mais de uma medida.", [
          ["Hipertensão arterial primária", "Rigidez arterial, retenção renal de sódio e ativação simpática e do sistema renina-angiotensina elevam a resistência periférica."],
          ["Doença renal", "O rim doente retém sódio e água e libera renina."],
          ["Dor, ansiedade e avental branco", "A descarga adrenérgica eleva a frequência e contrai os vasos por algum tempo."]
        ]),
        X("Hipotensão", "Sistólica abaixo de 90 mmHg ou queda importante em relação ao habitual.", [
          ["Hipovolemia", "Hemorragia ou desidratação reduzem o retorno venoso e o débito."],
          ["Sepse", "Vasodilatação difusa e extravasamento capilar derrubam a resistência vascular."],
          ["Falência de bomba", "No infarto extenso ou no tamponamento, o coração não gera débito."]
        ]),
        X("Hipotensão ortostática", "Queda de 20 mmHg na sistólica ou 10 na diastólica em até 3 minutos de pé.", [
          ["Hipovolemia", "Não há volume para compensar o sangue que desce para as pernas."],
          ["Anti-hipertensivos e outros fármacos", "Diuréticos, vasodilatadores e alfabloqueadores impedem a vasoconstrição de compensação."],
          ["Disautonomia (diabetes, Parkinson)", "O reflexo barorreceptor não contrai os vasos nem acelera o coração ao levantar."]
        ])
      ]),
      T("Saturação de oxigênio", "Oxímetro em dedo aquecido, sem esmalte escuro, com boa onda de pulso.", [
        E("SpO2 de 95% ou mais em ar ambiente", ""),
        X("Dessaturação", "SpO2 abaixo de 94% (ou abaixo de 88 a 92% em quem retém CO2).", [
          ["Pneumonia e edema pulmonar", "Alvéolos cheios de líquido recebem sangue mas não ar (efeito shunt)."],
          ["DPOC e asma", "Obstrução desigual das vias aéreas desajusta ventilação e perfusão."],
          ["Embolia pulmonar", "Áreas ventiladas ficam sem perfusão e o fluxo é desviado para áreas mal ventiladas."]
        ])
      ])
    ]),

    /* ───────────────────────── PELE E ANEXOS ───────────────────────── */
    T("Pele e anexos", "Examine toda a pele, incluindo couro cabeludo, unhas, palmas, plantas e dobras.", [
      T("Umidade, textura e temperatura", "Use o dorso da mão para temperatura e compare lados.", [
        E("Pele de umidade, textura e temperatura normais", ""),
        X("Pele quente e úmida", "", [
          ["Febre", "A vasodilatação cutânea e o suor são a forma de perder calor."],
          ["Hipertireoidismo", "O metabolismo acelerado produz calor e a pele se dilata e sua para dissipá-lo; fica fina e aveludada."]
        ]),
        X("Pele fria e pegajosa", "", [
          ["Choque", "A descarga simpática contrai os vasos da pele para poupar órgãos nobres e estimula as glândulas sudoríparas."],
          ["Hipoglicemia", "A adrenalina liberada em resposta provoca suor frio e vasoconstrição."]
        ]),
        X("Pele seca e áspera", "", [
          ["Hipotireoidismo", "Glândulas sebáceas e sudoríparas produzem menos e a camada córnea se acumula."],
          ["Desidratação e idade", "Menos água na epiderme e menos sebo."]
        ])
      ]),
      T("Lesões elementares", "Descreva tipo, cor, tamanho, bordas, distribuição e arranjo.", [
        E("Pele íntegra, sem lesões", ""),
        X("Petéquias e púrpura", "Manchas vermelho-arroxeadas que não somem à pressão (digitopressão ou vitropressão).", [
          ["Plaquetopenia", "Sem plaquetas suficientes, pequenas rupturas de capilares não são tamponadas e o sangue vaza para a derme."],
          ["Vasculite", "A inflamação da parede dos pequenos vasos deixa as hemácias extravasarem; a púrpura costuma ser palpável."],
          ["Meningococcemia", "A endotoxina lesa o endotélio e dispara coagulação intravascular; as lesões crescem depressa."]
        ]),
        X("Eritema que some à pressão", "", [
          ["Exantema viral ou por fármaco", "Vasodilatação dos capilares da derme por resposta imune; o sangue continua dentro do vaso, por isso clareia."]
        ]),
        X("Aranhas vasculares (telangiectasias)", "Ponto vermelho central com vasinhos irradiados, em tronco e face; some ao comprimir o centro.", [
          ["Cirrose hepática", "O fígado metaboliza menos estrogênio, que dilata as arteríolas da pele."],
          ["Gravidez", "O estrogênio alto tem o mesmo efeito, de forma passageira."]
        ]),
        X("Úlcera de pressão", "Em sacro, calcâneos e trocânteres de pacientes acamados.", [
          ["Imobilidade prolongada", "A pressão mantida sobre uma saliência óssea fecha os capilares; a isquemia necrosa pele e subcutâneo."]
        ])
      ]),
      T("Unhas", "Olhe forma, cor e leito. Para baqueteamento, junte o dorso de dois dedos iguais (sinal de Schamroth).", [
        E("Unhas de forma e cor normais", "Ângulo entre unha e dobra menor que 180°; enchimento capilar em até 2 a 3 segundos."),
        X("Baqueteamento digital", "Ponta do dedo alargada, unha em vidro de relógio, perda da janela de Schamroth.", [
          ["Câncer de pulmão", "Fatores de crescimento (PDGF, VEGF) liberados por megacariócitos que escapam do filtro pulmonar fazem proliferar o tecido da ponta do dedo."],
          ["Bronquiectasias e fibrose pulmonar", "Hipóxia crônica e inflamação estimulam os mesmos fatores de crescimento."],
          ["Cardiopatia congênita cianótica", "O shunt direita-esquerda deixa os megacariócitos chegarem inteiros à circulação dos dedos."]
        ]),
        X("Coiloníquia (unha em colher)", "", [
          ["Anemia ferropriva", "A falta de ferro afina e amolece a lâmina, que se deforma e fica côncava."]
        ]),
        X("Enchimento capilar lento", "Mais de 3 segundos para a cor voltar.", [
          ["Choque e desidratação", "A vasoconstrição periférica e o baixo débito atrasam a volta do sangue ao leito."]
        ])
      ])
    ]),

    /* ───────────────────────── CABEÇA E PESCOÇO ───────────────────────── */
    T("Cabeça e pescoço", "", [
      T("Olhos", "Inspecione pálpebras, conjuntivas e escleras; teste as pupilas com lanterna, em ambiente pouco iluminado.", [
        E("Pupilas isocóricas e fotorreagentes", "Mesmo tamanho; contraem no olho iluminado (direto) e no outro (consensual)."),
        E("Conjuntivas coradas, escleras anictéricas", ""),
        X("Anisocoria", "Pupilas de tamanhos diferentes.", [
          ["Herniação do úncus", "O lobo temporal deslocado comprime o nervo oculomotor; as fibras parassimpáticas, que ficam por fora, param primeiro e a pupila dilata."],
          ["Síndrome de Horner", "A lesão da via simpática (por exemplo, tumor do ápice pulmonar) deixa a pupila pequena, com ptose discreta."]
        ]),
        X("Miose bilateral", "Pupilas puntiformes.", [
          ["Opioides", "Estimulam o núcleo parassimpático do oculomotor."],
          ["Organofosforados", "Inibem a acetilcolinesterase e sobra acetilcolina no esfíncter da pupila."],
          ["Lesão de ponte", "Interrompe as vias simpáticas descendentes."]
        ]),
        X("Midríase bilateral fixa", "", [
          ["Anóxia cerebral grave", "A lesão do mesencéfalo abole o reflexo fotomotor."],
          ["Anticolinérgicos (atropina)", "Bloqueiam o receptor muscarínico do esfíncter da pupila."]
        ]),
        X("Exoftalmia", "Globo ocular projetado; aparece esclera acima da íris.", [
          ["Doença de Graves", "Anticorpos contra o receptor de TSH ativam fibroblastos da órbita, com acúmulo de glicosaminoglicanos e aumento de gordura e músculos."],
          ["Tumor de órbita", "Quando é de um lado só, pense em massa empurrando o globo."]
        ]),
        X("Xantelasma", "Placas amareladas nas pálpebras.", [
          ["Dislipidemia", "Macrófagos da derme acumulam colesterol."]
        ])
      ]),
      T("Boca e orofaringe", "Com abaixador e luz: lábios, língua, dentes, gengivas, palato, amígdalas.", [
        E("Mucosa oral úmida e corada, orofaringe sem alterações", ""),
        X("Placas brancas removíveis", "Saem com a espátula e deixam base avermelhada.", [
          ["Candidíase oral", "A queda da imunidade (HIV, corticoide inalatório, antibiótico, diabetes) deixa o fungo da flora proliferar."]
        ]),
        X("Amígdalas aumentadas com exsudato", "", [
          ["Faringoamigdalite estreptocócica", "A invasão bacteriana provoca infiltrado de neutrófilos e pus nas criptas."],
          ["Mononucleose infecciosa", "A proliferação de linfócitos em resposta ao vírus Epstein-Barr hipertrofia o tecido linfoide."]
        ]),
        X("Língua lisa (glossite atrófica)", "Vermelha, sem papilas, às vezes dolorosa.", [
          ["Deficiência de ferro, B12 ou folato", "As papilas têm renovação celular rápida e atrofiam quando faltam esses nutrientes."]
        ]),
        X("Hálito característico", "", [
          ["Cetoacidose diabética", "A acetona produzida pela queima de gordura é eliminada pelo pulmão: hálito cetônico, de fruta."],
          ["Insuficiência hepática", "Compostos sulfurados que o fígado não depura dão o hálito adocicado (fetor hepaticus)."],
          ["Uremia", "A ureia da saliva é quebrada em amônia."]
        ])
      ]),
      T("Tireoide", "Inspecione de frente com o pescoço estendido e peça para engolir. Palpe por trás (ou pela frente) lobos e istmo.", [
        E("Tireoide não palpável ou de tamanho normal, indolor, sem nódulos", "Móvel à deglutição."),
        X("Bócio difuso", "Aumento uniforme da glândula.", [
          ["Doença de Graves", "O anticorpo que imita o TSH estimula o crescimento de toda a glândula; pode haver sopro e frêmito."],
          ["Tireoidite de Hashimoto", "A infiltração de linfócitos e o TSH elevado aumentam a glândula, de consistência firme."],
          ["Deficiência de iodo", "Sem iodo cai a produção hormonal, o TSH sobe e estimula o crescimento."]
        ]),
        X("Nódulo tireoidiano", "Descreva tamanho, consistência, mobilidade e linfonodos.", [
          ["Nódulo coloide ou adenoma", "Proliferação benigna e localizada do tecido da glândula."],
          ["Carcinoma de tireoide", "Suspeite quando é duro, fixo, cresce rápido, com rouquidão ou linfonodo."]
        ]),
        X("Tireoide dolorosa", "", [
          ["Tireoidite subaguda (De Quervain)", "Inflamação pós-viral que distende a cápsula da glândula."]
        ])
      ]),
      T("Linfonodos", "Palpe com a polpa dos dedos, em movimentos circulares: cabeça, pescoço, supraclaviculares, axilares, epitrocleares, inguinais. Descreva local, tamanho, consistência, mobilidade, dor e pele.", [
        E("Linfonodos impalpáveis ou pequenos, móveis e indolores", "Menores que 1 cm, elásticos."),
        X("Linfonodos aumentados, dolorosos e móveis", "", [
          ["Infecção na área de drenagem", "O linfonodo reage com proliferação de linfócitos e edema; a cápsula distende rápido e dói."],
          ["Mononucleose e outras viroses", "Hiperplasia linfoide generalizada."]
        ]),
        X("Linfonodo duro, fixo e indolor", "", [
          ["Metástase", "Células tumorais ocupam o linfonodo, provocam fibrose e ultrapassam a cápsula, fixando-o aos planos vizinhos."],
          ["Linfoma", "Proliferação neoplásica dos próprios linfócitos; a consistência costuma ser de borracha."]
        ]),
        X("Linfonodo supraclavicular esquerdo (Virchow)", "", [
          ["Câncer gástrico e outros abdominais", "O ducto torácico traz a linfa do abdome e desemboca à esquerda; as células tumorais ficam retidas no último linfonodo."]
        ]),
        X("Linfonodo que fistuliza", "", [
          ["Tuberculose ganglionar (escrófula)", "A necrose caseosa amolece o linfonodo, que drena para a pele."]
        ])
      ])
    ]),

    /* ───────────────────────── APARELHO RESPIRATÓRIO ───────────────────────── */
    T("Aparelho respiratório", "Paciente sentado, tórax descoberto. Siga inspeção, palpação, percussão e ausculta, sempre comparando um lado com o outro.", [
      T("Inspeção estática", "Forma do tórax, simetria, cicatrizes, abaulamentos e retrações.", [
        E("Tórax atípico, simétrico", "Diâmetro lateral maior que o anteroposterior."),
        X("Tórax em tonel", "Diâmetro anteroposterior aumentado, costelas horizontais.", [
          ["Enfisema pulmonar (DPOC)", "A perda do recolhimento elástico e o ar aprisionado mantêm o pulmão hiperinsuflado e a caixa torácica em posição inspiratória."]
        ]),
        X("Cifoescoliose", "", [
          ["Deformidade da coluna", "A curvatura reduz o volume e a mobilidade da caixa torácica e pode causar restrição."]
        ]),
        X("Abaulamento ou retração de um hemitórax", "", [
          ["Derrame pleural volumoso ou pneumotórax", "O conteúdo extra no espaço pleural empurra a parede e alarga os espaços intercostais."],
          ["Atelectasia e fibrose", "A perda de volume do pulmão puxa a parede e o mediastino para o lado doente."]
        ])
      ]),
      T("Inspeção dinâmica", "Tipo e ritmo respiratório, expansão, uso de musculatura acessória.", [
        E("Expansibilidade simétrica, sem esforço respiratório", ""),
        X("Tiragem e uso de musculatura acessória", "Retração intercostal, supraclavicular ou subcostal; esternocleidomastóideos em ação; batimento de asa de nariz.", [
          ["Crise de asma e DPOC exacerbada", "Para vencer a via aérea estreitada, a pressão pleural fica muito negativa e suga as partes moles da parede."],
          ["Obstrução de via aérea alta", "O esforço contra a obstrução retrai fúrcula e espaços intercostais; pode haver estridor."]
        ]),
        X("Expansibilidade diminuída de um lado", "", [
          ["Derrame pleural e pneumotórax", "O pulmão colabado ou comprimido não acompanha a parede."],
          ["Pneumonia e dor pleurítica", "O paciente limita o movimento do lado que dói; o pulmão consolidado distende menos."]
        ]),
        X("Respiração paradoxal", "O abdome afunda na inspiração.", [
          ["Fadiga diafragmática", "O diafragma exausto é sugado para cima pela pressão negativa gerada pelos músculos acessórios: sinal de falência iminente."]
        ])
      ]),
      T("Palpação", "Expansibilidade com as mãos espalmadas em ápices e bases. Frêmito toracovocal: peça para dizer trinta e três e compare regiões simétricas.", [
        E("Frêmito toracovocal presente e simétrico", ""),
        X("Frêmito toracovocal aumentado", "", [
          ["Consolidação (pneumonia)", "O alvéolo cheio de exsudato vira meio sólido, que conduz a vibração da voz melhor que o ar, desde que o brônquio esteja aberto."]
        ]),
        X("Frêmito toracovocal diminuído ou abolido", "", [
          ["Derrame pleural", "O líquido entre o pulmão e a parede amortece a vibração."],
          ["Pneumotórax", "O ar na pleura afasta o pulmão da parede e bloqueia a transmissão."],
          ["Enfisema", "O excesso de ar e a destruição do parênquima conduzem mal o som."],
          ["Atelectasia por obstrução brônquica", "Com o brônquio fechado, a voz não chega à periferia."]
        ])
      ]),
      T("Percussão", "Dedo médio sobre o espaço intercostal, golpe seco com o outro dedo médio. De cima para baixo, comparando os lados.", [
        E("Som claro pulmonar", ""),
        X("Macicez ou submacicez", "", [
          ["Derrame pleural", "O líquido tem densidade alta e não ressoa; a macicez é em base e muda com a posição."],
          ["Consolidação", "O alvéolo sem ar se comporta como órgão sólido."],
          ["Atelectasia", "O pulmão colabado perde o ar que dava a ressonância."]
        ]),
        X("Hipersonoridade ou timpanismo", "", [
          ["Pneumotórax", "O ar livre sob pressão na pleura ressoa como um tambor."],
          ["Enfisema", "Há mais ar e menos tecido por unidade de volume."]
        ])
      ]),
      T("Ausculta", "Paciente respirando pela boca, um pouco mais fundo que o habitual. Ausculte ápices, regiões médias, bases e axilas, na inspiração e na expiração.", [
        E("Murmúrio vesicular presente e simétrico, sem ruídos adventícios", "Som suave, inspiração mais longa que a expiração."),
        X("Murmúrio vesicular diminuído ou abolido", "", [
          ["Derrame pleural", "O líquido afasta o pulmão do estetoscópio e reflete o som."],
          ["Pneumotórax", "O pulmão colabado ventila pouco e o ar na pleura isola o som."],
          ["Enfisema", "O fluxo de ar é baixo e o pulmão hiperinsuflado transmite mal."],
          ["Asma grave (tórax silencioso)", "O broncoespasmo é tão intenso que quase não passa ar: sinal de gravidade."]
        ]),
        X("Estertores finos (crepitações)", "Sons curtos e agudos no fim da inspiração, como velcro ou cabelo esfregado; não mudam com a tosse.", [
          ["Edema pulmonar cardiogênico", "As pequenas vias, fechadas pelo líquido no interstício, abrem de repente no fim da inspiração; começam nas bases."],
          ["Pneumonia", "Alvéolos e bronquíolos com exsudato se abrem durante a inspiração."],
          ["Fibrose pulmonar", "O interstício rígido fecha as vias na expiração; a reabertura dá o som de velcro nas bases."]
        ]),
        X("Estertores grossos (bolhosos)", "Sons mais graves e longos, no início da inspiração e na expiração; mudam com a tosse.", [
          ["Bronquite e bronquiectasias", "O ar borbulha através da secreção em brônquios maiores."],
          ["Edema agudo de pulmão avançado", "O líquido já alcança as vias de maior calibre."]
        ]),
        X("Sibilos", "Sons musicais e agudos, mais na expiração.", [
          ["Asma", "Broncoespasmo, edema e muco estreitam a via; a parede vibra com a passagem rápida do ar."],
          ["DPOC", "Estreitamento fixo e colapso das pequenas vias na expiração."],
          ["Insuficiência cardíaca (asma cardíaca)", "O edema da parede brônquica estreita a luz."],
          ["Corpo estranho ou tumor", "Suspeite quando o sibilo é localizado e fixo."]
        ]),
        X("Roncos", "Sons graves e contínuos, que mudam com a tosse.", [
          ["Secreção em brônquios grandes", "O ar faz vibrar o muco e a parede das vias de maior calibre (bronquite, DPOC)."]
        ]),
        X("Sopro tubário e pectorilóquia", "Som brônquico fora do lugar; a voz sussurrada é ouvida com nitidez.", [
          ["Consolidação com brônquio pérvio", "O parênquima sólido transmite o som da via aérea central sem filtrar as frequências altas."]
        ]),
        X("Atrito pleural", "Ruído áspero, como couro, na inspiração e na expiração; não muda com a tosse.", [
          ["Pleurite", "Os folhetos inflamados e cobertos de fibrina raspam um no outro; desaparece quando o derrame os separa."]
        ]),
        X("Estridor", "Som agudo, sobretudo inspiratório, audível sem estetoscópio.", [
          ["Obstrução de via aérea alta", "Edema de glote, corpo estranho, crupe ou epiglotite estreitam laringe e traqueia e o fluxo fica turbulento."]
        ])
      ])
    ]),

    /* ───────────────────────── APARELHO CARDIOVASCULAR ───────────────────────── */
    T("Aparelho cardiovascular", "Paciente deitado com a cabeceira a 30 ou 45°. Examine pescoço, precórdio e pulsos; ausculte também sentado e em decúbito lateral esquerdo.", [
      T("Pulso venoso jugular", "Cabeceira a 45°, cabeça levemente virada, luz tangencial. Meça a altura da coluna acima do ângulo esternal.", [
        E("Jugulares sem turgência a 45°", "Coluna venosa até 3 a 4 cm acima do ângulo esternal."),
        X("Turgência jugular", "Jugular visível acima da clavícula a 45°.", [
          ["Insuficiência cardíaca direita", "O ventrículo direito não esvazia e a pressão do átrio direito se transmite às veias do pescoço."],
          ["Tamponamento cardíaco", "O líquido no pericárdio impede o enchimento das câmaras direitas."],
          ["Embolia pulmonar maciça", "A obstrução da artéria pulmonar sobrecarrega de forma aguda o ventrículo direito."],
          ["Síndrome da veia cava superior", "A compressão da veia impede a drenagem; a turgência é fixa, sem pulsação."]
        ]),
        X("Refluxo hepatojugular", "A turgência aumenta e se mantém ao comprimir o hipocôndrio direito por 10 segundos.", [
          ["Insuficiência cardíaca direita", "O coração direito não acomoda o sangue extra empurrado do fígado e a pressão venosa sobe."]
        ])
      ]),
      T("Ictus cordis", "Inspecione e palpe o choque da ponta: localização, extensão em polpas digitais, mobilidade e intensidade.", [
        E("Ictus no 5º espaço intercostal esquerdo, na linha hemiclavicular", "Uma a duas polpas digitais; pode não ser palpável."),
        X("Ictus desviado para baixo e para a esquerda, difuso", "", [
          ["Dilatação do ventrículo esquerdo", "Na insuficiência aórtica ou mitral e na miocardiopatia dilatada, a cavidade aumenta e desloca a ponta."]
        ]),
        X("Ictus propulsivo e sustentado, sem desvio", "", [
          ["Hipertrofia do ventrículo esquerdo", "Na hipertensão e na estenose aórtica, a parede espessa contrai com força contra uma pressão alta."]
        ]),
        X("Frêmito", "Sensação de vibração à palpação do precórdio.", [
          ["Sopro intenso", "A turbulência do sangue é forte o bastante para ser sentida; corresponde a sopro de grau 4 ou mais."]
        ])
      ]),
      T("Bulhas", "Ausculte os focos aórtico, pulmonar, tricúspide e mitral com diafragma e campânula. Identifique B1 pelo pulso carotídeo.", [
        E("Bulhas rítmicas e normofonéticas em dois tempos (BRNF 2T)", "B1 mais forte na ponta, B2 mais forte na base."),
        X("Terceira bulha (B3)", "Som grave logo depois de B2, ouvido com a campânula na ponta: ritmo de galope.", [
          ["Insuficiência cardíaca com ventrículo dilatado", "No enchimento rápido, o sangue bate em um ventrículo já cheio e distendido, que vibra."],
          ["Insuficiência mitral importante", "O volume que regurgitou volta em grande quantidade na diástole."],
          ["Jovens e gestantes", "Pode ser normal: enchimento rápido e vigoroso de um ventrículo sadio."]
        ]),
        X("Quarta bulha (B4)", "Som grave logo antes de B1.", [
          ["Hipertrofia ventricular (hipertensão, estenose aórtica)", "A contração do átrio empurra sangue contra um ventrículo rígido e pouco complacente."],
          ["Isquemia miocárdica", "O músculo isquêmico relaxa mal e fica rígido."]
        ]),
        X("Bulhas hipofonéticas", "", [
          ["Derrame pericárdico", "O líquido afasta o coração da parede e abafa o som."],
          ["Enfisema e obesidade", "Ar ou gordura entre o coração e o estetoscópio."]
        ]),
        X("Ritmo irregular", "", [
          ["Fibrilação atrial", "Intervalos entre as bulhas sem padrão e B1 de intensidade variável, porque o enchimento muda a cada batimento."]
        ]),
        X("Desdobramento fixo de B2", "", [
          ["Comunicação interatrial", "O shunt mantém o ventrículo direito com volume aumentado na inspiração e na expiração; a valva pulmonar fecha sempre atrasada."]
        ])
      ]),
      T("Sopros", "Descreva fase (sistólico ou diastólico), foco de maior intensidade, irradiação, grau de 1 a 6, timbre e o que muda com manobras.", [
        E("Sem sopros", ""),
        X("Sopro sistólico em foco aórtico, irradiado para as carótidas", "Em diamante (crescendo e decrescendo), rude.", [
          ["Estenose aórtica", "O sangue é ejetado por um orifício estreito e calcificado e o jato fica turbulento."],
          ["Esclerose aórtica do idoso", "Folhetos espessados geram turbulência, sem obstrução importante."]
        ]),
        X("Sopro holossistólico em foco mitral, irradiado para a axila", "", [
          ["Insuficiência mitral", "A valva não fecha e o sangue volta ao átrio esquerdo durante toda a sístole."]
        ]),
        X("Sopro diastólico aspirativo em foco aórtico e aórtico acessório", "Decrescente, melhor ouvido sentado, inclinado para a frente, em expiração.", [
          ["Insuficiência aórtica", "O sangue volta da aorta para o ventrículo esquerdo logo depois de B2."]
        ]),
        X("Ruflar diastólico em foco mitral", "Grave, com a campânula, em decúbito lateral esquerdo.", [
          ["Estenose mitral", "O sangue passa do átrio para o ventrículo por um orifício estreito; a causa mais comum é a febre reumática."]
        ]),
        X("Sopro sistólico em foco tricúspide que aumenta na inspiração", "Sinal de Rivero-Carvallo.", [
          ["Insuficiência tricúspide", "A inspiração aumenta o retorno venoso ao coração direito e, com ele, o volume que regurgita."]
        ]),
        X("Sopro sistólico suave, sem outros achados", "", [
          ["Sopro inocente ou de fluxo", "Febre, anemia, gravidez e hipertireoidismo aumentam a velocidade do sangue por valvas normais."]
        ])
      ]),
      T("Atrito pericárdico", "Ausculte na borda esternal esquerda, com o paciente inclinado para a frente.", [
        E("Sem atrito", ""),
        X("Atrito pericárdico", "Ruído áspero, de raspar, com até três componentes; não some na apneia.", [
          ["Pericardite aguda", "Os folhetos do pericárdio, inflamados e cobertos de fibrina, raspam um no outro a cada movimento do coração."],
          ["Uremia", "As toxinas urêmicas inflamam as serosas."]
        ])
      ]),
      T("Pulsos arteriais", "Palpe carótidas (uma de cada vez), radiais, femorais, poplíteos, tibiais posteriores e pediosos. Compare os lados.", [
        E("Pulsos cheios e simétricos", ""),
        X("Pulso pequeno e tardio (parvus et tardus)", "", [
          ["Estenose aórtica", "A ejeção por um orifício estreito é lenta e de pouco volume."]
        ]),
        X("Pulso em martelo d'água", "Sobe e desce de forma abrupta, amplo.", [
          ["Insuficiência aórtica", "O ventrículo ejeta um volume grande e, na diástole, parte volta; a pressão sistólica sobe e a diastólica cai."]
        ]),
        X("Pulso paradoxal", "Queda de mais de 10 mmHg na sistólica durante a inspiração.", [
          ["Tamponamento cardíaco", "Com o pericárdio cheio, o ventrículo direito que se enche na inspiração empurra o septo e sobra pouco espaço para o esquerdo."],
          ["Asma grave", "A pressão pleural muito negativa aumenta a pós-carga do ventrículo esquerdo na inspiração."]
        ]),
        X("Pulso alternante", "Um batimento forte e um fraco, com ritmo regular.", [
          ["Disfunção grave do ventrículo esquerdo", "O músculo falido não consegue manter a mesma força em batimentos seguidos."]
        ]),
        X("Pulso filiforme", "Fino e rápido.", [
          ["Choque", "O volume sistólico baixo e a vasoconstrição reduzem a amplitude da onda de pulso."]
        ])
      ])
    ]),

    /* ───────────────────────── VASCULAR PERIFÉRICO ───────────────────────── */
    T("Vascular periférico", "Membros descobertos, paciente deitado e depois em pé. Compare sempre os dois lados.", [
      T("Circulação arterial dos membros", "Cor, temperatura, pelos, pulsos, enchimento capilar e lesões.", [
        E("Extremidades quentes, bem perfundidas, pulsos distais presentes", ""),
        X("Pulsos distais diminuídos ou ausentes", "Com pele fria, fina, sem pelos e palidez ao elevar o membro.", [
          ["Doença arterial periférica", "As placas de aterosclerose estreitam a artéria e reduzem o fluxo abaixo da lesão."],
          ["Oclusão arterial aguda", "Um êmbolo ou trombo interrompe o fluxo de repente: dor, palidez, ausência de pulso, frialdade, parestesia e paralisia."]
        ]),
        X("Úlcera arterial", "Em pontas dos dedos, calcanhar e maléolo lateral; muito dolorosa, fundo pálido, bordas regulares.", [
          ["Isquemia crônica", "O tecido mal perfundido não cicatriza pequenos traumas."]
        ])
      ]),
      T("Circulação venosa dos membros", "Em pé para ver varizes; deitado para edema, dor e empastamento da panturrilha.", [
        E("Sem varizes, edema ou sinais de trombose", "Panturrilhas livres e indolores."),
        X("Varizes", "Veias dilatadas e tortuosas.", [
          ["Insuficiência venosa crônica", "As válvulas incompetentes deixam o sangue refluir; a pressão mantida dilata as veias superficiais."]
        ]),
        X("Dermatite ocre e úlcera venosa", "Pele escurecida no terço distal da perna; úlcera rasa acima do maléolo medial, pouco dolorosa.", [
          ["Hipertensão venosa crônica", "Hemácias extravasam e deixam hemossiderina na pele; o edema e a inflamação crônica impedem a cicatrização."]
        ]),
        X("Panturrilha empastada, dolorosa, com edema de um lado", "Pode haver dor à dorsiflexão do pé (Homans, pouco sensível).", [
          ["Trombose venosa profunda", "O trombo obstrui a drenagem, o membro incha e a inflamação da parede da veia causa dor e calor."]
        ])
      ])
    ]),

    /* ───────────────────────── ABDOME ───────────────────────── */
    T("Abdome", "Paciente deitado, braços ao longo do corpo, abdome descoberto do apêndice xifoide ao púbis. Ordem: inspeção, ausculta, percussão e palpação. Deixe a área dolorosa por último.", [
      T("Inspeção", "Forma, simetria, cicatrizes, circulação colateral, hérnias, movimentos e pulsações.", [
        E("Abdome plano, simétrico, sem cicatrizes ou abaulamentos", ""),
        X("Abdome globoso", "", [
          ["Ascite", "O líquido livre distende a cavidade; deitado, escorre para os flancos (abdome de batráquio) e a cicatriz umbilical pode ficar protrusa."],
          ["Obesidade", "Gordura na parede e no omento; a cicatriz umbilical fica funda."],
          ["Obstrução intestinal", "Gás e líquido se acumulam nas alças acima da obstrução."],
          ["Gravidez ou grande massa", "O útero ou o tumor ocupa a cavidade; a macicez é central."]
        ]),
        X("Abdome escavado", "", [
          ["Caquexia", "Perda da gordura da parede e do interior do abdome."]
        ]),
        X("Circulação colateral tipo porta (cabeça de medusa)", "Veias que irradiam do umbigo.", [
          ["Hipertensão portal", "O sangue que não atravessa o fígado é desviado pelas veias paraumbilicais para a parede."]
        ]),
        X("Equimose periumbilical (Cullen) ou em flancos (Grey Turner)", "", [
          ["Pancreatite necro-hemorrágica", "O sangue do retroperitônio se infiltra pelos planos até o subcutâneo."],
          ["Gravidez ectópica rota", "O sangue na cavidade chega ao umbigo pelo ligamento redondo."]
        ]),
        X("Peristalse visível", "Ondas de contração vistas na parede.", [
          ["Obstrução intestinal", "As alças lutam para vencer o obstáculo com contrações vigorosas."]
        ])
      ]),
      T("Ausculta", "Antes de palpar, para não alterar os ruídos. Ouça os quatro quadrantes por até 2 minutos antes de dizer que estão ausentes; procure sopros em aorta, renais e ilíacas.", [
        E("Ruídos hidroaéreos presentes", "De 5 a 34 por minuto."),
        X("Ruídos hidroaéreos aumentados, de timbre metálico", "", [
          ["Obstrução intestinal em fase inicial", "O intestino aumenta a peristalse para vencer o obstáculo (peristalse de luta)."],
          ["Gastroenterite", "A inflamação da mucosa acelera o trânsito."]
        ]),
        X("Ruídos hidroaéreos diminuídos ou abolidos", "", [
          ["Íleo paralítico", "Depois de cirurgia, na hipocalemia ou com opioides, o músculo liso para."],
          ["Peritonite", "A inflamação do peritônio inibe por reflexo a motilidade das alças."]
        ]),
        X("Sopro abdominal", "", [
          ["Estenose de artéria renal", "Fluxo turbulento pelo estreitamento; sopro lateral ao umbigo em hipertenso."],
          ["Aneurisma de aorta abdominal", "Turbulência dentro do segmento dilatado."]
        ])
      ]),
      T("Percussão", "Percorra os quadrantes. Meça o fígado na linha hemiclavicular (6 a 12 cm) e percuta o espaço de Traube.", [
        E("Timpanismo predominante, hepatimetria normal, Traube livre", ""),
        X("Macicez móvel de decúbito", "A macicez do flanco vira timpanismo quando o paciente deita de lado.", [
          ["Ascite", "O líquido livre escorre para a parte mais baixa e as alças com gás flutuam para cima."]
        ]),
        X("Sinal do piparote", "A onda de líquido é sentida no flanco oposto ao percutido.", [
          ["Ascite volumosa", "O líquido sob tensão transmite a onda de um lado ao outro."]
        ]),
        X("Hipertimpanismo difuso", "", [
          ["Distensão gasosa e obstrução", "Há excesso de gás dentro das alças."]
        ]),
        X("Perda da macicez hepática (sinal de Jobert)", "", [
          ["Pneumoperitônio", "O ar que saiu de uma víscera perfurada se coloca entre o fígado e a parede."]
        ]),
        X("Traube maciço", "", [
          ["Esplenomegalia", "O baço aumentado ocupa o espaço onde se ouviria o timpanismo do estômago."],
          ["Derrame pleural esquerdo", "O líquido na base ocupa a projeção do espaço."]
        ]),
        X("Punho-percussão lombar dolorosa (Giordano)", "", [
          ["Pielonefrite", "O golpe faz vibrar o rim inflamado e distende a cápsula."],
          ["Cálculo com obstrução ureteral", "O rim dilatado e sob pressão dói ao ser sacudido."]
        ])
      ]),
      T("Palpação", "Primeiro superficial, com a mão espalmada, olhando o rosto do paciente; depois profunda. Fígado e baço: palpe na inspiração, vindo de baixo.", [
        E("Abdome flácido, indolor, sem massas ou visceromegalias", ""),
        X("Defesa e descompressão brusca dolorosa (Blumberg)", "Contratura involuntária da parede; dor pior ao soltar a mão do que ao comprimir.", [
          ["Apendicite aguda", "O apêndice inflamado irrita o peritônio parietal da fossa ilíaca direita; a retirada brusca da mão faz o peritônio vibrar."],
          ["Peritonite por víscera perfurada", "Conteúdo gástrico ou intestinal na cavidade irrita todo o peritônio e a parede fica dura (abdome em tábua)."],
          ["Diverticulite", "O mesmo mecanismo, à esquerda."]
        ]),
        X("Sinal de Murphy", "O paciente interrompe a inspiração profunda quando a vesícula toca os dedos sob o rebordo costal direito.", [
          ["Colecistite aguda", "A vesícula inflamada desce com o diafragma e encontra a mão do examinador."]
        ]),
        X("Sinal de Rovsing", "Dor na fossa ilíaca direita ao comprimir a esquerda.", [
          ["Apendicite aguda", "O gás empurrado de volta distende o ceco e mexe com o peritônio inflamado."]
        ]),
        X("Hepatomegalia", "Descreva quanto passa do rebordo, borda, superfície, consistência e dor.", [
          ["Insuficiência cardíaca direita", "O sangue represado nas veias hepáticas distende o fígado: borda romba, liso e doloroso."],
          ["Esteatose e hepatites", "O acúmulo de gordura ou o edema inflamatório aumentam o volume dos hepatócitos."],
          ["Metástases e hepatocarcinoma", "Os nódulos tumorais aumentam o órgão: duro e de superfície irregular."]
        ]),
        X("Fígado pequeno, duro e nodular", "", [
          ["Cirrose avançada", "A fibrose retrai o órgão e os nódulos de regeneração deixam a superfície irregular."]
        ]),
        X("Esplenomegalia", "Palpe em decúbito lateral direito (posição de Schuster).", [
          ["Hipertensão portal", "O sangue represado na veia esplênica congestiona o baço."],
          ["Infecções (mononucleose, malária, calazar, endocardite)", "Hiperplasia do tecido linfoide e dos macrófagos em resposta ao agente."],
          ["Leucemias e linfomas", "Infiltração do baço por células neoplásicas."],
          ["Anemias hemolíticas", "O baço trabalha mais para destruir as hemácias defeituosas."]
        ]),
        X("Vesícula palpável e indolor com icterícia (Courvoisier)", "", [
          ["Tumor de cabeça de pâncreas ou periampular", "A obstrução lenta do colédoco distende aos poucos uma vesícula de parede sadia, o que não ocorre na vesícula fibrosada por cálculos."]
        ]),
        X("Massa pulsátil no epigástrio ou mesogástrio", "A pulsação afasta os dedos para os lados.", [
          ["Aneurisma de aorta abdominal", "A parede enfraquecida dilata e a pulsação se expande em todas as direções."]
        ])
      ])
    ]),

    /* ───────────────────────── NEUROLÓGICO ───────────────────────── */
    T("Exame neurológico", "Siga uma ordem fixa: consciência, nervos cranianos, motricidade, reflexos, sensibilidade, coordenação, marcha e sinais meníngeos.", [
      T("Nervos cranianos", "Do I ao XII; na prática, campos visuais, pupilas, movimentos dos olhos, mímica, sensibilidade da face, audição, palato, língua e ombros.", [
        E("Nervos cranianos sem alterações", ""),
        X("Paralisia facial central", "Desvio da boca e sulco apagado, mas a testa enruga e o olho fecha.", [
          ["AVC", "A metade superior da face recebe comando dos dois hemisférios; a lesão de um lado só paralisa a metade inferior do lado oposto."]
        ]),
        X("Paralisia facial periférica", "Toda a metade do rosto parada: não enruga a testa nem fecha o olho.", [
          ["Paralisia de Bell", "A lesão do próprio nervo, depois do núcleo, corta o comando de todos os músculos daquele lado."]
        ]),
        X("Desvio da língua", "", [
          ["Lesão do nervo hipoglosso", "O genioglosso do lado são empurra a língua para o lado paralisado."]
        ]),
        X("Hemianopsia homônima", "Perda da mesma metade do campo nos dois olhos.", [
          ["AVC de artéria cerebral posterior ou lesão da via óptica após o quiasma", "As fibras da mesma metade do campo dos dois olhos seguem juntas depois do quiasma."]
        ])
      ]),
      T("Força muscular", "Manobras contra resistência, grau 0 a 5, comparando lados. Manobras deficitárias: braços estendidos e Mingazzini.", [
        E("Força grau 5 nos quatro membros", "Vence a resistência do examinador."),
        X("Hemiparesia", "Fraqueza de um lado do corpo.", [
          ["AVC", "A lesão do córtex motor ou da cápsula interna interrompe a via piramidal, que cruza no bulbo: o déficit é do lado oposto."],
          ["Tumor ou abscesso cerebral", "A massa comprime a mesma via, com evolução mais lenta."]
        ]),
        X("Paraparesia", "Fraqueza dos dois membros inferiores.", [
          ["Compressão medular", "Hérnia, tumor ou abscesso interrompem a via motora abaixo do nível da lesão; há nível sensitivo e alteração de esfíncteres."],
          ["Síndrome de Guillain-Barré", "A desmielinização das raízes e nervos causa fraqueza que sobe, com reflexos abolidos."]
        ]),
        X("Fraqueza proximal", "Dificuldade para levantar da cadeira e pentear o cabelo.", [
          ["Miopatias", "A doença do próprio músculo atinge mais as cinturas (miosites, corticoide, hipotireoidismo)."]
        ])
      ]),
      T("Tônus", "Movimente passivamente as articulações e palpe a massa muscular.", [
        E("Tônus normal", ""),
        X("Espasticidade", "Resistência que depende da velocidade e cede de repente (sinal do canivete).", [
          ["Lesão do neurônio motor superior", "Perde-se a inibição que vem do córtex sobre o reflexo de estiramento da medula."]
        ]),
        X("Rigidez plástica com roda denteada", "Resistência igual em todo o movimento, com pequenos trancos.", [
          ["Doença de Parkinson", "A falta de dopamina nos núcleos da base aumenta o tônus de agonistas e antagonistas; o tremor sobreposto dá os trancos."]
        ]),
        X("Hipotonia", "", [
          ["Lesão do neurônio motor inferior ou do cerebelo", "Interrompe-se o arco reflexo que mantém o tônus, ou perde-se a facilitação cerebelar."]
        ])
      ]),
      T("Reflexos", "Profundos (bicipital, tricipital, patelar, aquileu), de 0 a 4+, e cutâneo-plantar.", [
        E("Reflexos profundos normais e simétricos, cutâneo-plantar em flexão", ""),
        X("Hiperreflexia e clônus", "", [
          ["Lesão do neurônio motor superior", "Sem a inibição descendente, o arco reflexo responde de forma exagerada."]
        ]),
        X("Hiporreflexia ou arreflexia", "", [
          ["Neuropatia periférica e radiculopatia", "A lesão da via aferente ou eferente interrompe o arco reflexo."],
          ["Síndrome de Guillain-Barré", "A desmielinização bloqueia a condução nas raízes."]
        ]),
        X("Sinal de Babinski", "Extensão do hálux e abertura dos dedos ao estimular a borda lateral da planta.", [
          ["Lesão da via piramidal", "Volta o reflexo primitivo de retirada, que a via corticoespinal madura inibia."]
        ])
      ]),
      T("Sensibilidade", "Tátil, dolorosa, térmica, vibratória (diapasão) e posição segmentar, de distal para proximal, com os olhos do paciente fechados.", [
        E("Sensibilidade preservada", ""),
        X("Hipoestesia em bota e luva", "", [
          ["Polineuropatia diabética", "As fibras mais longas sofrem primeiro com a lesão metabólica e microvascular; começa nos pés."],
          ["Álcool e deficiência de B12", "Degeneração axonal que depende do comprimento da fibra."]
        ]),
        X("Nível sensitivo", "Perda da sensibilidade abaixo de um dermátomo.", [
          ["Lesão medular", "Interrompe todas as vias ascendentes abaixo do segmento atingido."]
        ]),
        X("Hipoestesia em dermátomo", "", [
          ["Radiculopatia (hérnia de disco)", "A compressão de uma raiz altera a sensibilidade só no território dela."]
        ])
      ]),
      T("Coordenação e equilíbrio", "Índex-nariz, calcanhar-joelho, movimentos alternados, Romberg.", [
        E("Coordenação preservada, Romberg negativo", ""),
        X("Dismetria e disdiadococinesia", "Erra o alvo; não consegue alternar movimentos rápidos.", [
          ["Lesão cerebelar", "O cerebelo deixa de corrigir amplitude e tempo do movimento, do mesmo lado da lesão."]
        ]),
        X("Romberg positivo", "Cai ao fechar os olhos com os pés juntos.", [
          ["Perda da propriocepção", "Na deficiência de B12, na neurossífilis e nas neuropatias, sem a visão não há informação de posição."],
          ["Lesão vestibular", "A queda é para o lado do labirinto lesado, depois de alguns segundos."]
        ])
      ]),
      T("Marcha", "Peça para andar, virar, andar na ponta dos pés, nos calcanhares e em linha.", [
        E("Marcha atípica", ""),
        X("Marcha ceifante (hemiplégica)", "Perna em extensão descreve um arco; braço fletido junto ao corpo.", [
          ["Sequela de AVC", "A espasticidade predomina nos extensores da perna e nos flexores do braço."]
        ]),
        X("Marcha parkinsoniana", "Passos curtos, tronco inclinado, sem balanço dos braços, viradas em bloco.", [
          ["Doença de Parkinson", "Bradicinesia, rigidez e perda dos reflexos posturais."]
        ]),
        X("Marcha atáxica (ebriosa)", "Base alargada, passos irregulares.", [
          ["Lesão cerebelar e intoxicação alcoólica", "Falta a coordenação entre os músculos do tronco e das pernas."]
        ]),
        X("Marcha escarvante", "Levanta muito o joelho; a ponta do pé bate primeiro no chão.", [
          ["Lesão do nervo fibular", "Paralisados os dorsiflexores, o pé cai."]
        ])
      ]),
      T("Sinais meníngeos", "Com o paciente deitado: rigidez de nuca, Kernig e Brudzinski.", [
        E("Sem sinais de irritação meníngea", "Nuca livre."),
        X("Rigidez de nuca, Kernig e Brudzinski", "Resistência à flexão do pescoço; dor ao estender o joelho com a coxa fletida; flexão dos joelhos ao fletir o pescoço.", [
          ["Meningite", "As meninges e as raízes inflamadas doem ao serem esticadas e os músculos se contraem em defesa."],
          ["Hemorragia subaracnóidea", "O sangue no liquor irrita as meninges da mesma forma."]
        ])
      ])
    ]),

    /* ───────────────────────── OSTEOARTICULAR ───────────────────────── */
    T("Sistema osteoarticular", "Inspeção, palpação, mobilidade ativa e passiva e manobras especiais. Compare os dois lados.", [
      T("Articulações", "Procure dor, calor, rubor, aumento de volume, deformidade, crepitação e limitação.", [
        E("Articulações sem sinais flogísticos, com amplitude preservada", ""),
        X("Artrite de uma articulação", "Aumento de volume, calor, rubor e dor.", [
          ["Gota", "Cristais de urato no líquido sinovial são fagocitados por neutrófilos e disparam inflamação intensa; é típica na base do hálux."],
          ["Artrite séptica", "Bactérias na articulação provocam pus e destruição rápida da cartilagem: é uma urgência."],
          ["Trauma", "Sangue ou derrame dentro da articulação."]
        ]),
        X("Poliartrite simétrica de pequenas articulações", "Punhos, metacarpofalângicas e interfalângicas proximais, com rigidez matinal longa.", [
          ["Artrite reumatoide", "A sinóvia inflamada por autoimunidade prolifera (pannus) e corrói cartilagem e osso."],
          ["Lúpus eritematoso sistêmico", "Depósito de imunocomplexos na sinóvia; não costuma causar erosões."]
        ]),
        X("Nódulos de Heberden e de Bouchard", "Nódulos duros nas interfalângicas distais e proximais.", [
          ["Osteoartrite", "O desgaste da cartilagem leva o osso da margem a crescer e formar osteófitos."]
        ]),
        X("Crepitação e dor ao movimento", "", [
          ["Osteoartrite", "As superfícies sem cartilagem lisa raspam uma na outra."]
        ]),
        X("Derrame articular no joelho", "Sinal da tecla (rechaço da patela).", [
          ["Sinovite, trauma ou infecção", "O líquido em excesso levanta a patela, que afunda e bate no fêmur quando comprimida."]
        ])
      ]),
      T("Coluna", "De costas e de lado: curvaturas, simetria dos ombros e do quadril, flexão para a frente. Palpe as apófises e a musculatura.", [
        E("Coluna com curvaturas fisiológicas, indolor e móvel", ""),
        X("Escoliose", "Desvio lateral; gibosidade ao fletir o tronco (teste de Adams).", [
          ["Escoliose idiopática", "A rotação das vértebras durante o crescimento levanta as costelas de um lado."]
        ]),
        X("Sinal de Lasègue", "Dor que irradia abaixo do joelho ao elevar a perna estendida entre 30 e 70°.", [
          ["Hérnia de disco lombar", "Elevar a perna estica o nervo ciático e traciona a raiz comprimida."]
        ]),
        X("Dor à percussão de uma vértebra", "", [
          ["Fratura, metástase ou infecção", "A lesão do corpo vertebral dói com a vibração direta."]
        ])
      ])
    ]),

    /* ───────────────────────── MAMAS E GENITURINÁRIO ───────────────────────── */
    T("Mamas, geniturinário e anorretal", "Explique cada passo, peça consentimento e tenha um acompanhante quando adequado.", [
      T("Mamas e axilas", "Inspeção sentada (braços ao longo do corpo, erguidos e mãos na cintura) e palpação deitada, todos os quadrantes, aréola e axila.", [
        E("Mamas simétricas, sem nódulos, retrações ou descarga", ""),
        X("Nódulo móvel, liso e elástico", "", [
          ["Fibroadenoma", "Proliferação benigna de estroma e glândula, bem delimitada, comum em jovens."],
          ["Cisto", "Ducto dilatado e cheio de líquido; varia com o ciclo."]
        ]),
        X("Nódulo duro, irregular e fixo", "Com ou sem retração da pele ou do mamilo e linfonodo axilar.", [
          ["Câncer de mama", "O tumor invade o tecido vizinho e provoca fibrose, que o fixa e encurta os ligamentos de Cooper, puxando a pele."]
        ]),
        X("Pele em casca de laranja", "", [
          ["Carcinoma inflamatório", "Células tumorais bloqueiam os linfáticos da derme; a pele incha, menos nos pontos presos pelos folículos."]
        ]),
        X("Descarga papilar sanguinolenta de um só ducto", "", [
          ["Papiloma intraductal ou carcinoma", "A lesão dentro do ducto sangra para a luz."]
        ])
      ]),
      T("Genitália masculina e hérnias", "Inspeção e palpação de pênis, bolsa escrotal e canal inguinal, em pé, com manobra de Valsalva.", [
        E("Genitália sem alterações, sem hérnias", ""),
        X("Abaulamento inguinal que aumenta com esforço", "", [
          ["Hérnia inguinal", "O conteúdo abdominal passa por um ponto fraco da parede quando a pressão sobe."]
        ]),
        X("Dor testicular súbita com testículo elevado e horizontal", "Reflexo cremastérico abolido.", [
          ["Torção testicular", "O cordão torce e corta o fluxo de sangue: é uma urgência cirúrgica."]
        ]),
        X("Aumento escrotal que deixa passar a luz", "", [
          ["Hidrocele", "Líquido claro entre as camadas da túnica vaginal transmite a luz da lanterna."]
        ])
      ]),
      T("Toque retal", "Inspeção anal, tônus do esfíncter, paredes do reto, próstata e aspecto das fezes na luva.", [
        E("Esfíncter normotônico, ampola livre, próstata elástica e de tamanho normal", "Sulco mediano presente."),
        X("Próstata aumentada, lisa e elástica", "", [
          ["Hiperplasia prostática benigna", "A zona de transição prolifera com a idade sob ação da di-hidrotestosterona."]
        ]),
        X("Próstata com nódulo duro", "", [
          ["Câncer de próstata", "Nasce em geral na zona periférica, que é a que o dedo alcança."]
        ]),
        X("Sangue na luva", "", [
          ["Hemorroidas, fissura ou tumor de reto", "Sangramento baixo; a massa pode ser tocada."]
        ]),
        X("Melena", "Fezes pretas, pastosas e de cheiro forte.", [
          ["Hemorragia digestiva alta", "O sangue é digerido pelo ácido e pelas bactérias ao longo do trajeto."]
        ])
      ])
    ])
  ];
})();
