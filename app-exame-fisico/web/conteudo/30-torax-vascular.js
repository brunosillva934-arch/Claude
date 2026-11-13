/* Versão 2 do conteúdo · respiratório, cardiovascular e vascular periférico */
(function (S) {
  "use strict";
  var T = S.T, E = S.E, X = S.X, mais = S.mais(2);

  mais("Aparelho respiratório › Inspeção estática", [
    X("Pectus excavatum", "Esterno afundado.", [
      ["Crescimento anormal das cartilagens costais", "As cartilagens empurram o esterno para dentro durante o crescimento; associa-se a Marfan e Ehlers-Danlos. Quando grave, comprime o coração."]
    ]),
    X("Pectus carinatum", "Esterno projetado para a frente (peito de pombo).", [
      ["Crescimento excessivo das cartilagens costais", "O esterno é empurrado para fora durante o estirão da adolescência."],
      ["Doença respiratória ou cardíaca na infância", "Esforço respiratório crônico enquanto o tórax ainda é maleável."]
    ]),
    X("Rosário raquítico", "Saliências nas junções entre costelas e cartilagens.", [
      ["Raquitismo", "Sem vitamina D e cálcio suficientes, a cartilagem de crescimento não se mineraliza e se acumula, alargando as junções."]
    ])
  ]);

  mais("Aparelho respiratório › Inspeção dinâmica", [
    X("Expiração com lábios semicerrados", "", [
      ["DPOC", "Expirar contra a resistência dos lábios mantém pressão positiva nas vias aéreas e adia o colapso dos bronquíolos, esvaziando melhor o pulmão."]
    ]),
    X("Sinal de Hoover", "Os rebordos costais se aproximam na inspiração em vez de se afastar.", [
      ["DPOC com hiperinsuflação", "O diafragma rebaixado e plano, ao contrair, puxa as costelas inferiores para dentro em vez de levantá-las."]
    ]),
    X("Segmento da parede que afunda na inspiração", "Movimento paradoxal de parte do tórax após trauma.", [
      ["Tórax instável (fraturas de costelas em dois pontos)", "O segmento solto não acompanha a caixa: é sugado na inspiração e empurrado na expiração; quase sempre há contusão pulmonar embaixo."]
    ])
  ]);

  mais("Aparelho respiratório › Palpação", [
    X("Crepitação à palpação da pele (enfisema subcutâneo)", "Sensação de neve sendo pisada.", [
      ["Pneumotórax e trauma torácico", "O ar escapa do pulmão ou da via aérea e se espalha pelo tecido subcutâneo."],
      ["Ruptura do esôfago", "Depois de vômitos intensos ou endoscopia; ar no mediastino e no pescoço, com dor torácica."]
    ]),
    X("Frêmito brônquico", "Vibração grosseira que muda com a tosse.", [
      ["Secreção em brônquios grandes", "Os roncos são fortes o bastante para serem sentidos pela mão."]
    ])
  ]);

  mais("Aparelho respiratório › Ausculta", [
    X("Estertores finos (crepitações)", "", [
      ["Atelectasia de bases", "Alvéolos fechados no idoso ou acamado se abrem nas primeiras respirações profundas; somem depois de algumas inspirações ou de tossir."]
    ]),
    X("Egofonia", "Ao dizer 'i', ouve-se 'e' anasalado, como um balido.", [
      ["Borda superior de derrame pleural", "O pulmão comprimido e o líquido filtram as frequências e deixam passar só algumas, mudando o timbre da voz."],
      ["Consolidação", "O parênquima sólido transmite a voz com esse mesmo filtro."]
    ]),
    X("Broncofonia", "A voz falada é ouvida alta e nítida no estetoscópio.", [
      ["Consolidação com brônquio pérvio", "O tecido sem ar conduz a voz melhor que o pulmão aerado."]
    ])
  ]);

  mais("Aparelho respiratório", [
    T("Tosse e escarro", "Observe a tosse durante o exame e, se houver escarro, peça para ver: cor, quantidade, cheiro, sangue.", [
      E("Sem tosse ou com tosse seca ocasional", ""),
      X("Escarro purulento", "Amarelo ou esverdeado.", [
        ["Infecção bacteriana (pneumonia, bronquite)", "A cor vem das enzimas dos neutrófilos (mieloperoxidase); escarro verde não prova bactéria, mas o volume e a febre ajudam."],
        ["Bronquiectasias", "Grande volume diário, às vezes em camadas, com piora pela manhã."]
      ]),
      X("Escarro cor de ferrugem", "", [
        ["Pneumonia pneumocócica", "Hemácias que extravasam nos alvéolos consolidados se degradam e dão cor de ferrugem."]
      ]),
      X("Escarro róseo e espumoso", "", [
        ["Edema agudo de pulmão", "O líquido com hemácias que inunda os alvéolos se mistura ao ar e forma espuma."]
      ]),
      X("Hemoptise", "Sangue vindo da via aérea, vermelho vivo, com tosse e espuma.", [
        ["Tuberculose", "A cavitação erode vasos da parede; também sangram as sequelas e os aneurismas de Rasmussen."],
        ["Câncer de pulmão", "O tumor brônquico é friável e sangra; desconfie em tabagista acima de 40 anos."],
        ["Bronquiectasias", "As artérias brônquicas dilatadas e inflamadas sangram."],
        ["Embolia pulmonar com infarto", "O pulmão sem fluxo necrosa e sangra; vem com dor pleurítica e dispneia."]
      ])
    ])
  ]);

  /* ── cardiovascular ── */
  mais("Aparelho cardiovascular › Pulso venoso jugular", [
    X("Sinal de Kussmaul (jugular que enche na inspiração)", "", [
      ["Pericardite constritiva", "O pericárdio rígido não deixa o coração direito receber o retorno venoso que aumenta na inspiração; a pressão sobe em vez de cair."],
      ["Infarto do ventrículo direito e cardiomiopatia restritiva", "O ventrículo direito rígido ou sem força também não acomoda o volume extra."]
    ]),
    X("Ondas a em canhão", "Pulsações grandes e irregulares no pescoço.", [
      ["Bloqueio atrioventricular total e outras dissociações", "Às vezes o átrio contrai com a tricúspide fechada, e o sangue volta com força para as jugulares."]
    ]),
    X("Onda v gigante", "Pulsação sistólica grande na jugular, às vezes com o lóbulo da orelha balançando.", [
      ["Insuficiência tricúspide", "O sangue volta ao átrio direito durante a sístole e a pressão se transmite às veias; pode haver fígado pulsátil."]
    ])
  ]);

  mais("Aparelho cardiovascular › Ictus cordis", [
    X("Ictus impalpável", "", [
      ["Obesidade, mamas volumosas e enfisema", "Tecido ou ar entre o coração e a parede abafam o choque da ponta; nem sempre é doença."],
      ["Derrame pericárdico", "O líquido afasta o coração da parede."]
    ]),
    X("Impulsão paraesternal esquerda", "Levantamento sistólico na borda esternal esquerda, sentido com a região tenar da mão.", [
      ["Sobrecarga do ventrículo direito", "O ventrículo direito aumentado fica junto ao esterno: hipertensão pulmonar, estenose mitral, comunicação interatrial."]
    ])
  ]);

  mais("Aparelho cardiovascular › Bulhas", [
    X("B1 hiperfonética", "", [
      ["Estenose mitral", "Pelo gradiente, os folhetos ficam bem abertos até o fim da diástole e fecham de longe e com força."],
      ["Taquicardia e estados hiperdinâmicos", "Com PR curto, a valva ainda está aberta quando o ventrículo contrai."]
    ]),
    X("B1 hipofonética", "", [
      ["Insuficiência mitral", "Folhetos que não coaptam fecham sem o estalo normal."],
      ["Intervalo PR longo", "A valva já está quase fechada quando o ventrículo contrai."],
      ["Disfunção grave do ventrículo esquerdo", "A contração fraca fecha a valva com pouca força."]
    ]),
    X("B2 hiperfonética em foco pulmonar", "Componente pulmonar mais forte que o aórtico.", [
      ["Hipertensão pulmonar", "A pressão alta na artéria pulmonar fecha a valva com força."]
    ]),
    X("Desdobramento paradoxal de B2", "O desdobramento aparece na expiração e some na inspiração.", [
      ["Bloqueio de ramo esquerdo", "O ventrículo esquerdo ativa tarde e a valva aórtica fecha depois da pulmonar."],
      ["Estenose aórtica grave", "A ejeção prolongada atrasa o fechamento aórtico."]
    ]),
    X("Estalido de abertura", "Som seco e agudo logo depois de B2, entre o foco mitral e a borda esternal.", [
      ["Estenose mitral", "A valva espessada, mas ainda móvel, abre de forma brusca e para de repente; quanto mais perto de B2, mais grave."]
    ]),
    X("Clique mesossistólico", "Estalo no meio da sístole, muitas vezes seguido de sopro.", [
      ["Prolapso da valva mitral", "O folheto redundante se projeta para o átrio e a cordoalha se tensiona de repente; de pé o clique adianta, agachado atrasa."]
    ])
  ]);

  mais("Aparelho cardiovascular › Sopros", [
    X("Sopro sistólico em foco aórtico, irradiado para as carótidas", "", [
      ["Valva aórtica bicúspide", "Turbulência desde cedo e calcificação precoce; estenose importante por volta dos 50 a 60 anos."],
      ["Febre reumática", "Fusão das comissuras, quase sempre com a valva mitral também acometida."]
    ]),
    X("Sopro holossistólico em foco mitral, irradiado para a axila", "", [
      ["Prolapso da valva mitral", "O folheto que prolapsa deixa de coaptar; o sopro pode ser só telessistólico, depois de um clique."],
      ["Insuficiência mitral funcional", "O ventrículo e o anel mitral dilatados afastam os folhetos, que estão normais."],
      ["Isquemia ou ruptura de músculo papilar", "Depois de infarto, o músculo que segura a cordoalha não traciona o folheto; a ruptura dá edema pulmonar súbito."],
      ["Endocardite infecciosa", "A vegetação destrói ou perfura o folheto."]
    ]),
    X("Sopro diastólico aspirativo em foco aórtico e aórtico acessório", "", [
      ["Dilatação da raiz da aorta", "Hipertensão, Marfan e aneurismas alargam o anel e afastam os folhetos."],
      ["Endocardite infecciosa", "Destruição dos folhetos; insuficiência aguda é grave e mal tolerada."],
      ["Dissecção aguda de aorta", "O descolamento chega ao anel e deixa a valva sem apoio."]
    ]),
    X("Ruflar diastólico em foco mitral", "", [
      ["Febre reumática", "É a causa quase única de estenose mitral no Brasil: inflamação e fibrose fundem as comissuras ao longo de anos."],
      ["Mixoma atrial esquerdo", "O tumor desce até a valva na diástole e obstrui; os sinais podem mudar com a posição."],
      ["Insuficiência aórtica importante (sopro de Austin Flint)", "O jato que volta da aorta bate no folheto anterior da mitral e estreita a entrada do ventrículo."]
    ]),
    X("Sopro sistólico na borda esternal esquerda que aumenta com Valsalva e de pé", "Diminui ao agachar.", [
      ["Cardiomiopatia hipertrófica obstrutiva", "Com menos retorno venoso o ventrículo fica menor e o septo hipertrofiado se aproxima da valva mitral, piorando a obstrução da saída."]
    ]),
    X("Sopro holossistólico rude na borda esternal esquerda baixa", "Muitas vezes com frêmito.", [
      ["Comunicação interventricular", "O sangue passa do ventrículo esquerdo para o direito durante toda a sístole; defeitos pequenos fazem sopros mais altos."],
      ["Ruptura do septo após infarto", "Sopro novo com choque nos dias seguintes a um infarto."]
    ]),
    X("Sopro contínuo em maquinaria", "Infraclavicular esquerdo, atravessa B2.", [
      ["Persistência do canal arterial", "A pressão da aorta é maior que a da artéria pulmonar na sístole e na diástole, e o fluxo pelo canal não para."]
    ]),
    X("Sopro sistólico ejetivo em foco pulmonar", "", [
      ["Comunicação interatrial", "O volume extra do shunt passa por uma valva pulmonar normal e gera turbulência; vem com desdobramento fixo de B2."],
      ["Estenose pulmonar", "Obstrução na saída do ventrículo direito; pode haver clique de ejeção."],
      ["Sopro inocente da criança", "Fluxo normal pela via de saída direita, suave e sem outros achados."]
    ])
  ]);

  mais("Aparelho cardiovascular › Pulsos arteriais", [
    X("Pulso bisferiens", "Dois picos em cada sístole.", [
      ["Insuficiência aórtica importante, isolada ou com estenose", "O grande volume ejetado produz uma onda de percussão e uma segunda onda."],
      ["Cardiomiopatia hipertrófica obstrutiva", "A obstrução no meio da sístole interrompe a ejeção, que retoma depois."]
    ]),
    X("Pulso femoral fraco e atrasado em relação ao radial", "Palpe radial e femoral ao mesmo tempo.", [
      ["Coarctação da aorta", "O estreitamento depois da subclávia esquerda reduz e atrasa o fluxo para a metade inferior do corpo; a pressão nos braços fica alta. Pense nela no jovem hipertenso."]
    ]),
    X("Sinais periféricos de insuficiência aórtica", "Cabeça que balança com o pulso (Musset), pulsação no leito ungueal (Quincke), duplo sopro na femoral comprimida (Duroziez).", [
      ["Insuficiência aórtica crônica importante", "O grande volume ejetado e o refluxo na diástole criam uma variação ampla de pressão a cada batimento, que se vê e se ouve na periferia."]
    ])
  ]);

  /* ── vascular periférico ── */
  mais("Vascular periférico › Circulação arterial dos membros", [
    X("Palidez à elevação e rubor demorado ao baixar a perna", "Teste de Buerger.", [
      ["Isquemia crônica avançada", "Elevar a perna tira a pressão que ainda empurra sangue pela artéria estreitada; ao baixar, a rede capilar, dilatada pela isquemia, enche devagar e fica vermelha (rubor de declive)."]
    ]),
    X("Índice tornozelo-braço baixo", "Menor que 0,9: pressão sistólica do tornozelo dividida pela do braço.", [
      ["Doença arterial periférica", "A placa reduz a pressão abaixo dela; quanto menor o índice, mais grave a isquemia."]
    ]),
    X("Índice tornozelo-braço muito alto", "Acima de 1,3 a 1,4.", [
      ["Calcificação da parede arterial (diabetes, doença renal crônica)", "A artéria calcificada não é comprimida pelo manguito e a pressão medida sai falsamente alta; não exclui obstrução."]
    ]),
    X("Teste de Allen alterado", "A mão não volta a corar em até 5 a 10 segundos ao soltar a artéria ulnar.", [
      ["Oclusão da artéria ulnar ou do arco palmar", "A mão depende só da radial; puncionar ou canular a radial pode deixá-la sem sangue."]
    ]),
    X("Fenômeno de Raynaud", "Dedos que ficam brancos, depois roxos e então vermelhos com o frio ou o estresse.", [
      ["Raynaud primário", "Vasoespasmo exagerado das arteríolas dos dedos ao frio, sem doença de base; em mulheres jovens, simétrico e sem úlceras."],
      ["Esclerose sistêmica e outras doenças do colágeno", "Além do espasmo há lesão da parede dos vasos; aparecem úlceras e cicatrizes nas pontas dos dedos."]
    ]),
    X("Gangrena", "Tecido escuro, frio e sem sensibilidade (seca) ou úmido e com odor (úmida).", [
      ["Isquemia crítica", "Sem fluxo, o tecido necrosa a partir das pontas."],
      ["Pé diabético infectado", "Infecção e isquemia somadas; a gangrena úmida espalha rápido."]
    ]),
    X("Massa pulsátil na fossa poplítea", "", [
      ["Aneurisma da artéria poplítea", "É o aneurisma periférico mais comum e muitas vezes bilateral; o risco é trombose e embolia para a perna."]
    ])
  ]);

  mais("Vascular periférico › Circulação venosa dos membros", [
    X("Cordão endurecido, quente e doloroso no trajeto de uma veia superficial", "", [
      ["Tromboflebite superficial", "Trombo em veia superficial com inflamação da parede; perto da junção safeno-femoral pode avançar para o sistema profundo."]
    ]),
    X("Membro inteiro inchado, arroxeado e muito doloroso", "", [
      ["Trombose venosa profunda maciça (phlegmasia cerulea dolens)", "A obstrução quase total do retorno venoso eleva tanto a pressão que o sangue arterial deixa de entrar; há risco de gangrena."]
    ])
  ]);

  mais("Vascular periférico", [
    T("Pé diabético", "Tire meias e sapatos: inspecione pele, unhas, entre os dedos e o calçado. Teste o monofilamento de 10 g, a vibração com diapasão, o reflexo aquileu e os pulsos.", [
      E("Pés íntegros, com sensibilidade protetora e pulsos presentes", ""),
      X("Perda da sensibilidade ao monofilamento", "Não sente o fio em pelo menos um ponto da planta.", [
        ["Neuropatia diabética", "As fibras mais longas são lesadas primeiro pela hiperglicemia e pela doença dos pequenos vasos; sem sensibilidade protetora, os traumas passam despercebidos."]
      ]),
      X("Úlcera plantar indolor sob calo", "Em pontos de apoio, como a cabeça dos metatarsos.", [
        ["Neuropatia sensitiva com pressão repetida", "Sem dor, o paciente continua apoiando no ponto de pressão; o calo se rompe por dentro e vira úlcera."]
      ]),
      X("Pé quente, inchado e deformado", "Mediopé que desaba (pé em mata-borrão).", [
        ["Neuroartropatia de Charcot", "Sem dor e com alteração do fluxo de sangue nos ossos, microfraturas se repetem e os ossos do mediopé colapsam; imita infecção."]
      ]),
      X("Dedos em garra e pele seca com fissuras", "", [
        ["Neuropatia motora e autonômica", "A fraqueza dos músculos pequenos do pé desequilibra flexores e extensores; sem suor, a pele resseca e racha."]
      ])
    ])
  ]);
})(window.SEM);
