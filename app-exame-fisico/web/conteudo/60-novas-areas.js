/* Versão 2 do conteúdo · áreas novas: exame psíquico, obstétrico e pediátrico */
(function (S) {
  "use strict";
  var T = S.T, E = S.E, X = S.X, mais = S.mais(2);

  mais("", [
    T("Exame psíquico", "Observado durante toda a entrevista, sem perguntas especiais na maior parte: aparência e atitude, consciência, atenção, orientação, memória, humor e afeto, pensamento, sensopercepção, psicomotricidade, juízo crítico.", [
      T("Aparência e atitude", "Vestes, higiene, cuidado pessoal, contato visual, como se relaciona com o examinador.", [
        E("Vestes e higiene adequadas, atitude cooperativa", ""),
        X("Descuido com higiene e vestes", "", [
          ["Depressão grave", "A perda de energia e de interesse alcança o autocuidado."],
          ["Esquizofrenia", "Sintomas negativos e desorganização tiram a iniciativa e o cuidado consigo."],
          ["Demência", "O paciente perde a capacidade de planejar e executar as tarefas do dia a dia."]
        ]),
        X("Atitude hostil ou desconfiada", "", [
          ["Delírio persecutório", "O paciente interpreta o examinador como parte da ameaça."],
          ["Intoxicação e abstinência", "Estimulantes e abstinência alcoólica deixam o paciente irritável e alerta demais."]
        ])
      ]),
      T("Humor e afeto", "Humor é o estado que o paciente relata; afeto é o que você observa na expressão. Veja se combinam com o que ele conta e se variam ao longo da conversa.", [
        E("Humor eutímico, afeto congruente e modulado", ""),
        X("Humor deprimido", "Tristeza, desânimo, perda de prazer, choro.", [
          ["Episódio depressivo", "Alteração dos circuitos de recompensa e de regulação emocional; dura pelo menos 2 semanas e afeta sono, apetite e energia."],
          ["Hipotireoidismo e outras causas clínicas", "Afaste causas orgânicas: hormônio tireoidiano, B12, fármacos como corticoide e betabloqueador."],
          ["Luto", "Tristeza esperada após perda; costuma vir em ondas e preserva a autoestima."]
        ]),
        X("Humor expansivo ou irritável", "Euforia, grandiosidade, fala acelerada, pouca necessidade de sono.", [
          ["Episódio maníaco ou hipomaníaco (transtorno bipolar)", "Hiperatividade dos sistemas de recompensa e de energia, que dura dias."],
          ["Estimulantes e corticoide", "Substâncias que aumentam dopamina e noradrenalina reproduzem o quadro."]
        ]),
        X("Afeto embotado", "Pouca variação na expressão, voz monótona.", [
          ["Esquizofrenia (sintomas negativos)", "Redução da expressão emocional, não necessariamente da emoção sentida."],
          ["Parkinsonismo e antipsicóticos", "A pouca mímica (hipomimia) imita afeto embotado."]
        ])
      ]),
      T("Pensamento", "Curso (velocidade), forma (como as ideias se ligam) e conteúdo (o que o paciente pensa).", [
        E("Pensamento de curso normal, lógico e coerente, sem delírios", ""),
        X("Fuga de ideias", "Pula de um assunto a outro por associações superficiais, rápido demais para acompanhar.", [
          ["Mania", "A aceleração do pensamento faz as ideias se atropelarem."]
        ]),
        X("Pensamento desorganizado", "Ideias sem ligação lógica entre si, respostas que não chegam ao ponto.", [
          ["Esquizofrenia", "Desorganização do pensamento, um dos sintomas centrais."],
          ["Delirium", "A desatenção e a flutuação do nível de consciência desorganizam o discurso; procure causa clínica."]
        ]),
        X("Delírio", "Crença falsa, mantida com convicção, que não muda com argumentos e não é compartilhada pela cultura.", [
          ["Esquizofrenia e transtorno delirante", "Delírios persecutórios, de referência ou de controle."],
          ["Depressão psicótica", "Delírios de culpa, ruína ou doença incurável."],
          ["Demência", "Delírios de roubo ou de traição ligados ao esquecimento."]
        ]),
        X("Ideação suicida", "Pergunte de forma direta: perguntar não aumenta o risco. Avalie plano, meios, tentativas anteriores e fatores de proteção.", [
          ["Depressão", "Desesperança e sofrimento intenso; o risco aumenta com plano, acesso a meios, tentativa anterior e uso de álcool."],
          ["Transtorno bipolar, esquizofrenia e uso de substâncias", "Também elevam o risco; em situação de risco, não deixe o paciente sozinho e acione a rede de cuidado (CAPS, emergência, CVV 188)."]
        ])
      ]),
      T("Sensopercepção", "Pergunte se vê, ouve ou sente coisas que os outros não percebem; observe se o paciente parece responder a estímulos ausentes.", [
        E("Sem alterações da sensopercepção", ""),
        X("Alucinações auditivas", "Vozes que comentam ou dão ordens.", [
          ["Esquizofrenia", "Atividade alterada nas áreas de linguagem faz o paciente perceber a própria fala interna como vinda de fora."],
          ["Depressão grave com sintomas psicóticos", "Vozes que acusam ou desvalorizam, de acordo com o humor."]
        ]),
        X("Alucinações visuais", "", [
          ["Delirium e abstinência alcoólica", "Comuns nas causas orgânicas; no delirium tremens, pequenos animais e insetos."],
          ["Demência com corpos de Lewy e doença de Parkinson", "Pessoas ou animais vistos com nitidez, muitas vezes sem medo; pioram com fármacos dopaminérgicos."]
        ])
      ]),
      T("Psicomotricidade", "Observe gestos, velocidade dos movimentos e da fala, inquietação.", [
        E("Psicomotricidade normal", ""),
        X("Lentificação psicomotora", "Movimentos e respostas lentos, fala baixa e pausada.", [
          ["Depressão", "A lentificação é um dos sinais mais objetivos de depressão."],
          ["Hipotireoidismo e parkinsonismo", "Causas orgânicas da mesma lentidão."]
        ]),
        X("Agitação psicomotora", "", [
          ["Mania", "Aumento de energia e de atividade dirigida a metas."],
          ["Delirium hiperativo", "Desorientação e agitação de início agudo; procure infecção, distúrbio metabólico, abstinência."],
          ["Intoxicação por estimulantes", "Cocaína e anfetaminas aumentam dopamina e noradrenalina; há taquicardia, midríase e hipertermia."]
        ]),
        X("Catatonia", "Imobilidade, mutismo, posturas mantidas, resistência a ser movido.", [
          ["Transtornos do humor e esquizofrenia", "A catatonia é mais comum nos transtornos do humor do que se imagina."],
          ["Causas clínicas (encefalite, distúrbios metabólicos)", "Encefalite autoimune e outras doenças orgânicas devem ser lembradas."]
        ])
      ]),
      T("Juízo crítico", "O paciente reconhece que está doente e entende as consequências do que faz?", [
        E("Crítica preservada", ""),
        X("Crítica prejudicada", "Não reconhece a doença nem a necessidade de tratamento.", [
          ["Psicoses e mania", "O próprio quadro altera a avaliação da realidade."],
          ["Demência frontotemporal e lesões frontais", "Perda do julgamento e do comportamento social, às vezes antes da memória."]
        ])
      ])
    ])
  ], "Sistema osteoarticular");

  mais("", [
    T("Exame obstétrico", "Gestante deitada com a cabeceira elevada ou levemente virada para a esquerda, para o útero não comprimir a veia cava. Inclui pressão arterial, peso, edema, altura uterina, manobras de Leopold e batimentos cardíacos fetais.", [
      T("Altura uterina", "Fita métrica da borda superior da sínfise púbica ao fundo do útero. Entre cerca de 20 e 34 semanas, o valor em centímetros fica próximo da idade gestacional.", [
        E("Altura uterina compatível com a idade gestacional", ""),
        X("Altura uterina maior que o esperado", "", [
          ["Erro de datação", "A gestação é mais avançada do que se calculou; confira a data da menstruação e o primeiro ultrassom."],
          ["Gestação gemelar", "Dois fetos e mais líquido aumentam o útero."],
          ["Polidrâmnio", "Excesso de líquido amniótico: diabetes materno (o feto urina mais) ou malformações que impedem o feto de engolir."],
          ["Feto grande para a idade (macrossomia)", "No diabetes, a glicose passa a placenta e o feto produz mais insulina, que é hormônio de crescimento para ele."],
          ["Mola hidatiforme", "Útero maior que o esperado no início da gestação, com sangramento e hCG muito alto."]
        ]),
        X("Altura uterina menor que o esperado", "", [
          ["Restrição de crescimento fetal", "A placenta insuficiente (hipertensão, tabagismo, doenças vasculares) manda menos nutrientes e o feto cresce menos."],
          ["Oligoâmnio", "Pouco líquido: rotura de membranas, insuficiência placentária ou malformação dos rins do feto."],
          ["Erro de datação", "A gestação é mais recente do que se calculou."]
        ])
      ]),
      T("Manobras de Leopold", "Quatro manobras de palpação do abdome para saber situação, posição, apresentação e insinuação do feto.", [
        E("Situação longitudinal e apresentação cefálica", ""),
        X("Apresentação pélvica", "Polo duro e redondo no fundo do útero.", [
          ["Prematuridade", "Até perto de 34 semanas a pélvica é comum, porque o feto ainda tem espaço para girar."],
          ["Malformações uterinas, miomas e placenta prévia", "Obstáculos no segmento inferior impedem a cabeça de se encaixar."]
        ]),
        X("Situação transversa", "Útero mais largo do que alto, sem polo na pelve.", [
          ["Multiparidade", "O útero e a parede abdominal mais flácidos deixam o feto se deitar atravessado."],
          ["Placenta prévia", "A placenta ocupa a parte baixa do útero."]
        ])
      ]),
      T("Batimentos cardíacos fetais", "Sonar Doppler a partir de 10 a 12 semanas ou estetoscópio de Pinard a partir de 20; conte por 1 minuto e compare com o pulso materno.", [
        E("Batimentos fetais entre 110 e 160 bpm", ""),
        X("Taquicardia fetal", "Acima de 160 bpm de forma mantida.", [
          ["Febre materna e corioamnionite", "A febre e a infecção aceleram o coração do feto."],
          ["Hipóxia fetal no início", "A descarga de catecolaminas do feto acelera o coração."],
          ["Fármacos maternos (beta-agonistas)", "Atravessam a placenta."]
        ]),
        X("Bradicardia fetal", "Abaixo de 110 bpm de forma mantida.", [
          ["Hipóxia fetal grave", "O feto reduz o consumo de oxigênio por reflexo vagal; com desacelerações, é urgência obstétrica."],
          ["Bloqueio cardíaco congênito", "Anticorpos anti-Ro da mãe (lúpus, Sjögren) lesam o sistema de condução do feto."]
        ])
      ]),
      T("Pressão arterial e sinais de pré-eclâmpsia", "Meça com a gestante sentada. Pesquise edema de face e mãos, reflexos e sintomas como cefaleia, escotomas e dor no epigástrio.", [
        E("Pressão abaixo de 140 por 90 mmHg, sem sintomas", ""),
        X("Hipertensão depois de 20 semanas", "", [
          ["Pré-eclâmpsia", "A placenta mal implantada fica isquêmica e libera fatores que lesam o endotélio da mãe; com proteinúria ou lesão de órgãos."],
          ["Hipertensão gestacional", "Hipertensão sem proteinúria nem lesão de órgãos; pode evoluir para pré-eclâmpsia."]
        ]),
        X("Cefaleia, escotomas, dor no epigástrio e reflexos vivos", "Em gestante hipertensa.", [
          ["Pré-eclâmpsia grave e iminência de eclâmpsia", "Edema e vasoespasmo no cérebro e distensão da cápsula do fígado; é emergência e pede sulfato de magnésio."]
        ]),
        X("Edema súbito de face e mãos", "", [
          ["Pré-eclâmpsia", "A lesão do endotélio aumenta a permeabilidade dos capilares; edema só de pernas é comum e não tem esse significado."]
        ])
      ]),
      T("Exame especular e toque vaginal", "Com sangramento no terceiro trimestre, não faça toque até o ultrassom afastar placenta prévia.", [
        E("Colo fechado e longo, sem perda de líquido ou sangue", ""),
        X("Colo dilatado ou apagado antes de 37 semanas", "", [
          ["Trabalho de parto prematuro", "Contrações regulares que modificam o colo."],
          ["Insuficiência istmocervical", "Dilatação sem dor no segundo trimestre; o colo não segura a gestação."]
        ]),
        X("Líquido claro saindo pelo colo", "Ao exame especular, às vezes ao pedir para tossir.", [
          ["Rotura das membranas", "A bolsa rompeu; o risco de infecção aumenta com o tempo, ainda mais antes do termo."]
        ]),
        X("Sangramento vaginal no terceiro trimestre", "", [
          ["Placenta prévia", "Sangramento vermelho vivo e sem dor; a placenta cobre ou fica perto do colo e se descola quando o segmento inferior se forma."],
          ["Descolamento prematuro da placenta", "Dor, útero endurecido e sangue escuro; ligado a hipertensão, cocaína e trauma. Ameaça mãe e feto."]
        ])
      ])
    ]),

    T("Exame pediátrico e do recém-nascido", "Aproveite a criança calma: observe, conte as frequências e ausculte antes de tudo. Deixe orofaringe e otoscopia para o fim. Compare sempre com o esperado para a idade.", [
      T("Crescimento e desenvolvimento", "Peso, comprimento ou altura e perímetro cefálico nas curvas de crescimento; marcos do desenvolvimento para a idade.", [
        E("Crescimento no mesmo canal da curva e marcos adequados para a idade", ""),
        X("Queda de canal de peso", "", [
          ["Ingestão insuficiente", "Problemas de amamentação, oferta inadequada, pobreza."],
          ["Doença crônica (doença celíaca, cardiopatia, infecção urinária de repetição)", "Mais gasto, perdas ou má absorção."],
          ["Negligência", "Considere quando o ganho de peso volta com cuidados adequados."]
        ]),
        X("Baixa estatura", "Abaixo do 3º percentil ou fora do alvo familiar.", [
          ["Baixa estatura familiar", "Variação normal: velocidade de crescimento normal, idade óssea compatível, pais baixos."],
          ["Atraso constitucional do crescimento", "Cresce devagar, idade óssea atrasada e puberdade tardia; a altura final é normal."],
          ["Deficiência de GH e hipotireoidismo", "Velocidade de crescimento baixa e idade óssea atrasada; criança com bom peso para a altura."]
        ]),
        X("Atraso dos marcos do desenvolvimento", "", [
          ["Prematuridade", "Use a idade corrigida até os 2 anos."],
          ["Lesão do sistema nervoso (paralisia cerebral, síndromes genéticas)", "Atraso em várias áreas, às vezes com alteração do tônus e reflexos primitivos que persistem."],
          ["Transtorno do espectro autista", "Atraso de linguagem e da interação social, pouco contato visual, interesses restritos."],
          ["Perda auditiva", "Sempre avalie a audição na criança que não fala."]
        ])
      ]),
      T("Fontanelas e crânio", "Palpe com o bebê calmo e sentado. A fontanela anterior fecha entre 12 e 18 meses; a posterior, até os 2 meses.", [
        E("Fontanela anterior normotensa, suturas móveis", ""),
        X("Fontanela abaulada e tensa", "Com o bebê calmo e sentado.", [
          ["Meningite", "A inflamação aumenta a pressão dentro do crânio; no lactente, a rigidez de nuca pode faltar."],
          ["Hidrocefalia", "O liquor acumulado aumenta a pressão; o perímetro cefálico cresce rápido."]
        ]),
        X("Fontanela deprimida", "", [
          ["Desidratação", "Menos volume no corpo e no liquor; vem com mucosas secas e pouca urina."]
        ]),
        X("Inchaço no couro cabeludo após o parto", "", [
          ["Bossa serossanguínea", "Edema do couro cabeludo pela pressão no parto; cruza as suturas e some em dias."],
          ["Cefalematoma", "Sangue sob o periósteo; respeita as suturas, demora semanas e pode aumentar a icterícia."]
        ]),
        X("Crânio de forma alterada com sutura endurecida", "", [
          ["Craniossinostose", "Uma sutura fecha antes do tempo e o crânio cresce na direção das outras."],
          ["Plagiocefalia posicional", "Achatamento por dormir sempre na mesma posição; as suturas são normais."]
        ])
      ]),
      T("Pele do recém-nascido", "Examine sem roupa, com boa luz natural.", [
        E("Pele rosada, com achados benignos do recém-nascido", "Milium, eritema tóxico, mancha mongólica (azul-acinzentada na região sacral, desaparece na infância)."),
        X("Icterícia nas primeiras 24 horas", "Sempre anormal.", [
          ["Doença hemolítica (incompatibilidade Rh ou ABO)", "Anticorpos da mãe destroem as hemácias do bebê e a bilirrubina sobe rápido."],
          ["Infecção congênita ou sepse", "A hemólise e a disfunção do fígado elevam a bilirrubina."]
        ]),
        X("Icterícia que avança da cabeça para os pés", "Zonas de Kramer: quanto mais distal, maior a bilirrubina; confirme com dosagem.", [
          ["Icterícia fisiológica", "O recém-nascido destrói muitas hemácias e o fígado ainda conjuga pouco; começa depois de 24 horas e cai em 1 a 2 semanas."],
          ["Icterícia do aleitamento", "Pouca ingestão nos primeiros dias aumenta a reabsorção da bilirrubina pelo intestino."]
        ]),
        X("Icterícia que dura mais de 2 semanas com fezes claras", "", [
          ["Atresia de vias biliares", "As vias biliares se fecham e a bile não chega ao intestino; precisa de cirurgia antes dos 2 meses."]
        ]),
        X("Cianose central no recém-nascido", "Lábios e língua azulados.", [
          ["Cardiopatia congênita cianótica", "Sangue venoso passa para a circulação sistêmica; não melhora com oxigênio (teste do coraçãozinho)."],
          ["Doença respiratória", "Vem com esforço respiratório e costuma melhorar com oxigênio."]
        ])
      ]),
      T("Reflexos primitivos", "Moro, preensão palmar e plantar, sucção, busca, marcha reflexa. Somem entre 3 e 6 meses, a preensão plantar por volta de 1 ano.", [
        E("Reflexos primitivos presentes e simétricos no recém-nascido", ""),
        X("Moro assimétrico", "Um braço não abre.", [
          ["Fratura de clavícula", "Dor ao mover o braço; crepitação na clavícula, comum em bebês grandes."],
          ["Lesão do plexo braquial (paralisia de Erb)", "Estiramento das raízes C5 e C6 no parto; braço em rotação interna e punho fletido."]
        ]),
        X("Reflexos primitivos que persistem depois da idade esperada", "", [
          ["Paralisia cerebral e outras lesões do sistema nervoso", "Sem a maturação do córtex, os reflexos primitivos não são inibidos."]
        ])
      ]),
      T("Quadril do lactente", "Manobras de Ortolani e Barlow até cerca de 3 meses; depois, limitação da abdução e assimetria de pregas e de comprimento das coxas.", [
        E("Ortolani e Barlow negativos, abdução simétrica", ""),
        X("Ortolani ou Barlow positivo", "Estalo da cabeça do fêmur entrando ou saindo do acetábulo.", [
          ["Displasia do desenvolvimento do quadril", "O acetábulo raso deixa a cabeça femoral entrar e sair; mais em meninas, primogênitos, apresentação pélvica e história familiar."]
        ])
      ]),
      T("Desconforto respiratório na criança", "Conte a frequência com a criança calma; observe tiragens, batimento de asa de nariz, gemência e cor. No recém-nascido, o boletim de Silverman-Andersen.", [
        E("Respiração sem esforço, frequência adequada para a idade", "Taquipneia: acima de 60 irpm até 2 meses, 50 de 2 a 12 meses, 40 de 1 a 5 anos."),
        X("Gemência expiratória", "Som no fim da expiração.", [
          ["Síndrome do desconforto respiratório do recém-nascido", "Sem surfactante, os alvéolos colabam; expirar contra a glote fechada mantém pressão e evita o colapso."],
          ["Pneumonia e sepse", "Mesmo mecanismo de defesa diante de alvéolos instáveis."]
        ]),
        X("Taquipneia com tiragem subcostal", "", [
          ["Pneumonia", "Na criança, a taquipneia é o sinal mais sensível de pneumonia; tiragem indica gravidade."],
          ["Bronquiolite", "Vírus (sobretudo o sincicial respiratório) inflama os bronquíolos do lactente, com sibilos e crepitações."]
        ]),
        X("Estridor com tosse ladrante", "", [
          ["Laringotraqueíte viral (crupe)", "O edema abaixo das cordas vocais estreita a via mais estreita da criança; piora à noite e com choro."],
          ["Epiglotite", "Criança toxemiada, babando, sentada inclinada para a frente; não examine a garganta e chame ajuda."]
        ])
      ]),
      T("Abdome e genitália do recém-nascido", "", [
        E("Abdome sem massas, coto umbilical limpo, genitália compatível com o sexo", ""),
        X("Massa abdominal no recém-nascido", "", [
          ["Hidronefrose", "Obstrução da junção entre pelve e ureter; é a massa abdominal mais comum no recém-nascido."],
          ["Rim multicístico displásico", "Rim que não se formou direito, cheio de cistos."]
        ]),
        X("Vermelhidão ao redor do coto umbilical", "", [
          ["Onfalite", "Infecção do coto que pode se espalhar pela parede; é grave no recém-nascido."]
        ]),
        X("Abertura da uretra fora da ponta do pênis", "", [
          ["Hipospádia", "O fechamento da uretra para no caminho; não circuncide, o prepúcio pode ser usado na correção."]
        ])
      ])
    ])
  ]);
})(window.SEM);
