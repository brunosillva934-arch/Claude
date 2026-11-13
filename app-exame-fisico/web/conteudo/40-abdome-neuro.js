/* Versão 2 do conteúdo · abdome e exame neurológico */
(function (S) {
  "use strict";
  var T = S.T, E = S.E, X = S.X, mais = S.mais(2);

  mais("Abdome › Inspeção", [
    X("Hérnia umbilical", "Abaulamento no umbigo que aumenta ao tossir.", [
      ["Aumento da pressão abdominal (ascite, obesidade, gravidez)", "A pressão força o conteúdo pelo anel umbilical, ponto fraco da parede."],
      ["Fechamento incompleto do anel na criança", "Comum no lactente; a maioria fecha sozinha até os 4 a 5 anos."]
    ]),
    X("Diástase dos retos", "Saliência na linha média ao levantar a cabeça, entre os músculos retos.", [
      ["Gravidez e obesidade", "A distensão afasta os retos e afina a linha alba; não é hérnia e não estrangula."]
    ]),
    X("Estrias violáceas largas", "Mais de 1 cm, no abdome, coxas e axilas.", [
      ["Síndrome de Cushing", "O excesso de cortisol inibe os fibroblastos e afina a derme; ela se rompe ao distender e deixa ver os vasos por baixo."]
    ])
  ]);

  mais("Abdome › Palpação", [
    X("Dor no ponto de McBurney", "A um terço da distância entre a espinha ilíaca anterossuperior direita e o umbigo.", [
      ["Apendicite aguda", "O ponto fica sobre a base habitual do apêndice; a dor começa no meio do abdome e migra para cá quando o peritônio parietal é atingido."]
    ]),
    X("Sinal do psoas", "Dor ao estender a coxa direita com o paciente deitado sobre o lado esquerdo.", [
      ["Apendicite retrocecal", "O apêndice inflamado está sobre o músculo psoas; estender a coxa estira o músculo contra ele."],
      ["Abscesso do psoas", "A coleção dentro do músculo dói ao estirá-lo; o paciente mantém o quadril fletido."]
    ]),
    X("Sinal do obturador", "Dor no hipogástrio ao rodar internamente a coxa fletida.", [
      ["Apendicite pélvica", "O apêndice inflamado toca o músculo obturador interno, que é estirado pela rotação."]
    ]),
    X("Rim palpável", "Manobras de Guyon e de Israel.", [
      ["Hidronefrose", "A obstrução da via urinária dilata a pelve e o rim."],
      ["Rins policísticos", "Os dois rins aumentados e irregulares, às vezes com fígado também cheio de cistos."],
      ["Tumor renal", "Massa no flanco, às vezes com hematúria e dor."]
    ]),
    X("Bexiga palpável (bexigoma)", "Massa no hipogástrio, maciça à percussão, que dá vontade de urinar ao comprimir.", [
      ["Retenção urinária por hiperplasia da próstata", "A uretra prostática estreitada impede o esvaziamento."],
      ["Fármacos (anticolinérgicos, opioides) e bexiga neurogênica", "O detrusor não contrai ou o esfíncter não relaxa."]
    ]),
    X("Dor que piora ao contrair a parede (sinal de Carnett)", "O paciente levanta a cabeça com a mão do examinador sobre o ponto doloroso.", [
      ["Dor da parede abdominal", "Se a dor vem da parede, contrair o músculo a aumenta; se vem de uma víscera, a parede contraída a protege e a dor diminui."]
    ]),
    X("Dor intensa à percussão localizada no fígado (sinal de Torres-Homem)", "", [
      ["Abscesso hepático", "A coleção sob a cápsula dói com a vibração; febre, hepatomegalia dolorosa e às vezes história de diarreia (amebíase)."]
    ]),
    X("Massa na fossa ilíaca direita", "", [
      ["Plastrão apendicular", "Alças e omento bloqueiam um apêndice perfurado e formam massa dolorosa."],
      ["Doença de Crohn", "Alças do íleo terminal espessadas e aderidas."],
      ["Câncer de ceco", "Massa no idoso com anemia ferropriva, às vezes sem sangue visível nas fezes."]
    ]),
    X("Fígado pulsátil", "Expansão sistólica do fígado sentida com uma mão de cada lado.", [
      ["Insuficiência tricúspide importante", "O sangue que volta ao átrio direito na sístole chega às veias hepáticas e expande o fígado a cada batimento."]
    ]),
    X("Esplenomegalia", "", [
      ["Esquistossomose mansônica", "Os ovos presos nos ramos da veia porta causam fibrose ao redor deles (de Symmers); a hipertensão portal congestiona o baço, com função do fígado preservada."]
    ]),
    X("Hepatomegalia", "", [
      ["Esquistossomose mansônica", "Na forma hepatoesplênica, o lobo esquerdo aumenta e endurece pela fibrose periportal."]
    ])
  ]);

  /* ── neurológico ── */
  mais("Exame neurológico", [
    T("Estado mental e linguagem", "Avalie atenção, memória, linguagem (fluência, compreensão, repetição, nomeação, leitura e escrita) e praxias. O miniexame do estado mental organiza o rastreio.", [
      E("Cognição e linguagem preservadas", ""),
      X("Afasia de expressão (Broca)", "Fala pouca, esforçada, telegráfica; compreende bem e percebe o próprio erro.", [
        ["AVC frontal no hemisfério dominante", "Lesão do giro frontal inferior esquerdo (artéria cerebral média, divisão superior); costuma vir com fraqueza do braço e da face à direita."]
      ]),
      X("Afasia de compreensão (Wernicke)", "Fala fluente, mas sem sentido, com palavras trocadas; não compreende e não percebe o erro.", [
        ["AVC temporal posterior no hemisfério dominante", "Lesão do giro temporal superior esquerdo (divisão inferior da cerebral média); pode não haver fraqueza, e o quadro é confundido com confusão mental."]
      ]),
      X("Disartria", "Articulação defeituosa com linguagem normal: o conteúdo está certo, a pronúncia não.", [
        ["Lesão cerebelar", "Fala escandida, com sílabas separadas e volume irregular."],
        ["Lesão dos nervos cranianos baixos ou do tronco", "Fala anasalada e arrastada por fraqueza de língua, lábios e palato."],
        ["Doença de Parkinson", "Fala baixa, rápida e monótona (hipofonia)."],
        ["Miastenia gravis", "A fala piora e fica anasalada à medida que o paciente fala."]
      ]),
      X("Heminegligência", "Ignora um lado do espaço e do corpo: come só metade do prato, não percebe o braço.", [
        ["Lesão parietal direita", "O hemisfério direito cuida da atenção aos dois lados; lesado, o lado esquerdo deixa de existir para o paciente."]
      ]),
      X("Déficit de memória recente", "Repete perguntas, não guarda palavras após alguns minutos.", [
        ["Doença de Alzheimer", "A degeneração começa no hipocampo e no córtex entorrinal, que consolidam memórias novas."],
        ["Deficiência de tiamina (Wernicke-Korsakoff)", "Lesão dos corpos mamilares e do tálamo medial no etilista; inventa respostas para preencher lacunas."]
      ])
    ])
  ], "Nervos cranianos");

  mais("Exame neurológico › Nervos cranianos", [
    X("Paralisia do III nervo com pupila dilatada", "Olho para baixo e para fora, ptose, midríase.", [
      ["Aneurisma da artéria comunicante posterior", "A compressão externa atinge primeiro as fibras pupilares, que ficam na superfície do nervo; com cefaleia, é emergência."],
      ["Herniação do úncus", "O lobo temporal deslocado comprime o nervo; vem com rebaixamento."]
    ]),
    X("Paralisia do III nervo com pupila normal", "", [
      ["Mononeuropatia diabética ou hipertensiva", "A isquemia atinge o centro do nervo e poupa as fibras pupilares da periferia, melhor irrigadas; melhora em semanas."]
    ]),
    X("Paralisia do VI nervo", "O olho não vai para fora; visão dupla horizontal, pior olhando para o lado afetado.", [
      ["Hipertensão intracraniana", "O VI tem um trajeto longo na base do crânio e é estirado quando a pressão sobe; é um falso sinal de localização."],
      ["Isquemia microvascular (diabetes, hipertensão)", "Infarto do nervo; recupera em semanas a meses."]
    ]),
    X("Nistagmo", "Movimento rítmico dos olhos, com fase lenta e rápida.", [
      ["Lesão vestibular periférica (neurite, VPPB)", "Nistagmo horizontal-rotatório que bate para o lado oposto ao lesado, diminui ao fixar o olhar e vem com vertigem intensa."],
      ["Lesão central (cerebelo, tronco)", "Nistagmo vertical, que muda de direção com o olhar ou não diminui com a fixação; procure outros sinais neurológicos."],
      ["Álcool e anticonvulsivantes", "Deprimem o cerebelo e o sistema vestibular; nistagmo ao olhar para os lados."]
    ]),
    X("Úvula desviada e voz anasalada", "O palato de um lado não sobe ao dizer 'á'.", [
      ["Lesão dos nervos IX e X", "O palato do lado paralisado não eleva e a úvula é puxada para o lado são; há risco de engasgo."]
    ]),
    X("Hipoestesia na face", "", [
      ["Lesão do nervo trigêmeo", "Perda de sensibilidade no território de um ou mais ramos; reflexo corneano diminuído e, no ramo mandibular, fraqueza da mastigação."],
      ["Lesão do tronco ou do tálamo", "Perda que vem com sinais em outras partes do corpo."]
    ]),
    X("Fraqueza para elevar o ombro e virar a cabeça", "", [
      ["Lesão do nervo acessório (XI)", "Paralisa trapézio e esternocleidomastóideo; comum após cirurgia de linfonodos do pescoço."]
    ])
  ]);

  mais("Exame neurológico", [
    T("Trofismo e movimentos involuntários", "Observe as massas musculares em repouso e procure fasciculações; peça para estender os braços, segurar uma posição e fazer o índex-nariz.", [
      E("Trofismo preservado, sem movimentos involuntários", ""),
      X("Atrofia com fasciculações", "Contrações finas e visíveis sob a pele.", [
        ["Esclerose lateral amiotrófica", "A perda do neurônio motor inferior desnerva as fibras, que disparam sozinhas e atrofiam; ao mesmo tempo há sinais do neurônio superior (reflexos vivos)."],
        ["Radiculopatia crônica", "Fasciculações e atrofia restritas ao território de uma raiz."]
      ]),
      X("Tremor de repouso", "Aparece com o membro parado e diminui ao movimentar; lembra contar moedas.", [
        ["Doença de Parkinson", "A falta de dopamina nos núcleos da base gera oscilação rítmica de 4 a 6 por segundo; começa de um lado."]
      ]),
      X("Tremor postural e de ação", "Aparece ao manter os braços estendidos e ao segurar objetos.", [
        ["Tremor essencial", "Disfunção do circuito cerebelo-tálamo-córtex; costuma haver história familiar e melhora com álcool."],
        ["Hipertireoidismo", "O excesso de hormônio aumenta a sensibilidade adrenérgica e torna visível o tremor fisiológico."],
        ["Abstinência alcoólica e fármacos (salbutamol, lítio, valproato)", "Excesso de atividade adrenérgica ou efeito direto sobre o músculo e o sistema nervoso."]
      ]),
      X("Tremor de intenção", "Aumenta à medida que o dedo se aproxima do alvo.", [
        ["Lesão cerebelar", "O cerebelo deixa de frear e corrigir o movimento no fim do trajeto."]
      ]),
      X("Asterixe (flapping)", "Com braços estendidos e punhos dorsifletidos, as mãos caem e voltam em abalos irregulares.", [
        ["Encefalopatia hepática", "Perdas breves do tônus postural (mioclonia negativa) por disfunção cerebral metabólica."],
        ["Uremia e hipercapnia", "Mesmo mecanismo metabólico."]
      ]),
      X("Coreia", "Movimentos rápidos, irregulares, que passam de uma parte do corpo para outra.", [
        ["Doença de Huntington", "A perda de neurônios do estriado libera o movimento; herança dominante, com alteração psiquiátrica e demência."],
        ["Coreia de Sydenham", "Anticorpos da febre reumática reagem com os núcleos da base; em crianças, semanas a meses depois da faringite."]
      ]),
      X("Mioclonias", "Abalos súbitos e breves de um músculo ou grupo.", [
        ["Distúrbios metabólicos e uremia", "A irritabilidade do córtex e do tronco aumenta."],
        ["Após parada cardíaca", "A lesão anóxica do cérebro causa mioclonias generalizadas."]
      ])
    ])
  ], "Força muscular");

  mais("Exame neurológico › Reflexos", [
    X("Sinal de Hoffmann", "Flexão do polegar e do indicador ao pinçar a falange distal do dedo médio.", [
      ["Lesão do neurônio motor superior acima de C5", "Sem a inibição descendente, o reflexo dos flexores dos dedos fica exagerado; na compressão cervical, pode aparecer antes do Babinski."]
    ]),
    X("Reflexos primitivos no adulto", "Palmomentual, preensão, sucção ou protrusão dos lábios ao tocar a boca.", [
      ["Lesão frontal e demência", "Reaparecem reflexos que o lobo frontal inibia depois do primeiro ano de vida; o palmomentual isolado é comum no idoso normal."]
    ])
  ]);

  mais("Exame neurológico › Sensibilidade", [
    X("Perda de dor e temperatura em capa sobre ombros e braços", "Tato e posição preservados.", [
      ["Siringomielia", "A cavidade no centro da medula cervical interrompe as fibras de dor e temperatura que cruzam na comissura anterior; as vias de tato e posição, por fora, são poupadas."]
    ]),
    X("Hemi-hipoestesia", "Perda sensitiva de um lado do corpo, incluindo a face.", [
      ["AVC talâmico ou da cápsula interna", "Todas as vias sensitivas do lado oposto convergem ali; no tálamo pode ficar dor neuropática depois."]
    ]),
    X("Fraqueza e perda de posição de um lado, perda de dor do outro", "Abaixo de um nível na medula.", [
      ["Hemissecção da medula (síndrome de Brown-Séquard)", "As vias motoras e de posição descem e sobem do mesmo lado; as de dor e temperatura cruzam logo ao entrar. Trauma penetrante, tumor, esclerose múltipla."]
    ])
  ]);

  mais("Exame neurológico › Coordenação e equilíbrio", [
    X("Ataxia de tronco", "Não consegue sentar ou ficar de pé sem apoio, com membros relativamente bem coordenados.", [
      ["Lesão do verme do cerebelo", "O verme controla a musculatura axial; no etilista, a degeneração começa por ele."]
    ])
  ]);

  mais("Exame neurológico › Marcha", [
    X("Marcha anserina", "Pelve que oscila de um lado a outro, tronco que balança.", [
      ["Fraqueza dos glúteos (miopatias, distrofias)", "Sem o glúteo médio, a pelve cai do lado que não apoia a cada passo."]
    ]),
    X("Marcha de pequenos passos com dificuldade de iniciar", "Pés colados ao chão (marcha magnética), sem tremor.", [
      ["Hidrocefalia de pressão normal", "O ventrículo dilatado estira as fibras que descem para as pernas; vem com incontinência urinária e declínio cognitivo."],
      ["Doença vascular de substância branca", "Múltiplos pequenos infartos interrompem as vias frontais da marcha."]
    ])
  ]);
})(window.SEM);
