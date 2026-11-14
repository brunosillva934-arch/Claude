/* Versão 3 do conteúdo · ilustrações esquemáticas (desenhadas por desenhos.py, em web/fotos/).
   Fotos de pacientes ficam por conta de quem usa o app (câmera, galeria ou busca na internet). */
(function (S) {
  "use strict";
  var F = S.F, foto = S.fotos(3);
  var CREDITO = "Ilustração esquemática do app · domínio público (CC0)";
  function I(arq, legenda) { return F("fotos/" + arq + ".svg", legenda, CREDITO); }
  function em(caminho, lista) { for (var i = 0; i < lista.length; i++) foto(caminho, lista[i][0], lista[i].slice(1)); }

  em("Sinais vitais › Frequência e ritmo respiratório", [
    ["Eupneico, 12 a 20 irpm", I("resp-eupneia", "Ritmo e amplitude regulares; referência para os outros padrões.")],
    ["Taquipneia", I("resp-taquipneia", "Mais incursões no mesmo intervalo, em geral mais rasas.")],
    ["Bradipneia", I("resp-bradipneia", "Menos incursões no mesmo intervalo.")],
    ["Respiração de Kussmaul", I("resp-kussmaul", "Inspirações amplas e profundas, sem pausas: compensação de acidose.")],
    ["Respiração de Cheyne-Stokes", I("resp-cheyne", "A amplitude cresce, decresce e para; o ciclo se repete.")],
    ["Respiração de Biot", I("resp-biot", "Surtos irregulares separados por pausas imprevisíveis.")]
  ]);

  em("Aparelho cardiovascular › Pulsos arteriais", [
    ["Pulsos cheios e simétricos", I("pulso-normal", "Subida rápida, pico e incisura dicrótica.")],
    ["Pulso pequeno e tardio (parvus et tardus)", I("pulso-parvus", "Pequeno e de subida lenta, comparado ao normal.")],
    ["Pulso em martelo d'água", I("pulso-martelo", "Amplo, sobe e cai de forma abrupta.")],
    ["Pulso bisferiens", I("pulso-bisferiens", "Dois picos em cada sístole.")],
    ["Pulso alternante", I("pulso-alternante", "Um batimento forte e um fraco, com ritmo regular.")],
    ["Pulso paradoxal", I("pulso-paradoxal", "A amplitude cai na inspiração mais do que o normal (mais de 10 mmHg).")]
  ]);

  em("Aparelho cardiovascular › Pulso venoso jugular", [
    ["Ondas a em canhão", I("jugular-canhao", "Onda a gigante quando o átrio contrai com a tricúspide fechada.")],
    ["Onda v gigante", I("jugular-v", "Onda v grande e descida y íngreme: refluxo tricúspide.")]
  ]);

  em("Aparelho cardiovascular › Ictus cordis", [
    ["Ictus no 5º espaço intercostal esquerdo, na linha hemiclavicular", I("ictus-normal", "Onde procurar o ictus normal.")],
    ["Ictus desviado para baixo e para a esquerda, difuso", I("ictus-desviado", "Em cinza, a posição normal; em vermelho, o ictus desviado e mais extenso.")]
  ]);

  em("Aparelho cardiovascular › Bulhas", [
    ["Bulhas rítmicas e normofonéticas em dois tempos (BRNF 2T)", I("focos-ausculta", "Focos de ausculta no precórdio."), I("fono-normal", "B1 e B2 delimitam sístole e diástole.")],
    ["Terceira bulha (B3)", I("fono-b3", "B3 logo depois de B2.")],
    ["Quarta bulha (B4)", I("fono-b4", "B4 logo antes de B1.")],
    ["Estalido de abertura", I("fono-em", "O estalido (EA) vem pouco depois de B2, seguido do ruflar.")],
    ["Clique mesossistólico", I("fono-prolapso", "Clique no meio da sístole e sopro que vai até B2.")]
  ]);

  em("Aparelho cardiovascular › Sopros", [
    ["Sem sopros", I("fono-normal", "Só B1 e B2, sem ruído entre elas.")],
    ["Sopro sistólico em foco aórtico, irradiado para as carótidas", I("fono-ea", "Em diamante, começa depois de B1 e termina antes de B2.")],
    ["Sopro holossistólico em foco mitral, irradiado para a axila", I("fono-im", "Ocupa toda a sístole, com intensidade constante.")],
    ["Sopro diastólico aspirativo em foco aórtico e aórtico acessório", I("fono-iao", "Começa em B2 e diminui ao longo da diástole.")],
    ["Ruflar diastólico em foco mitral", I("fono-em", "B1 forte, estalido, ruflar e reforço antes de B1.")],
    ["Sopro sistólico na borda esternal esquerda que aumenta com Valsalva e de pé", I("fono-cmh", "Ejetivo, como o da estenose aórtica, mas muda com as manobras.")],
    ["Sopro holossistólico rude na borda esternal esquerda baixa", I("fono-civ", "Ocupa toda a sístole.")],
    ["Sopro contínuo em maquinaria", I("fono-pca", "Cresce até B2, atravessa B2 e segue na diástole.")],
    ["Sopro sistólico ejetivo em foco pulmonar", I("fono-pulmonar", "Na comunicação interatrial, vem com B2 desdobrada de forma fixa.")]
  ]);

  em("Pele e anexos › Unhas", [
    ["Baqueteamento digital", I("unha-baqueteamento", "O ângulo entre o dorso e a unha passa de 180°."), I("unha-schamroth", "Sinal de Schamroth: some a janela entre as unhas.")],
    ["Coiloníquia (unha em colher)", I("unha-coiloniquia", "Unha côncava, capaz de segurar uma gota.")],
    ["Hemorragias em estilhaço", I("unha-estilhaco", "Linhas finas no sentido do crescimento, no terço distal.")],
    ["Linhas de Beau", I("unha-beau", "Sulcos transversais em várias unhas.")],
    ["Unhas de Terry", I("unha-terry", "Unha quase toda branca, com faixa rosada na ponta.")],
    ["Depressões puntiformes e descolamento da unha", I("unha-psoriase", "Pitting e onicólise, típicos da psoríase.")]
  ]);

  em("Cabeça e pescoço › Olhos", [
    ["Pupilas isocóricas e fotorreagentes", I("olhos-normais", "Pupilas do mesmo tamanho.")],
    ["Anisocoria", I("olhos-anisocoria", "Pupila direita maior que a esquerda.")],
    ["Miose bilateral", I("olhos-miose", "Pupilas puntiformes.")],
    ["Midríase bilateral fixa", I("olhos-midriase", "Pupilas dilatadas.")],
    ["Ptose palpebral", I("olhos-ptose", "A pálpebra direita cobre parte da íris.")]
  ]);

  em("Exame neurológico › Nervos cranianos", [
    ["Paralisia facial central", I("face-central", "Testa e fechamento dos olhos preservados; só a metade de baixo do rosto cai.")],
    ["Paralisia facial periférica", I("face-periferica", "Todo o lado afetado parado: testa lisa, olho que não fecha, boca desviada.")],
    ["Paralisia do III nervo com pupila dilatada", I("olhos-iii", "Olho para baixo e para fora, ptose e midríase.")],
    ["Paralisia do VI nervo", I("olhos-vi", "Ao olhar para o lado afetado, o olho não abduz.")],
    ["Hemianopsia homônima", I("campo-hemianopsia", "A mesma metade do campo some nos dois olhos.")]
  ]);
  em("Exame geral › Ectoscopia › Fácies", [
    ["Fácies de paralisia facial periférica", I("face-periferica", "Ao franzir a testa, fechar os olhos e sorrir, um lado inteiro não se mexe.")]
  ]);

  em("Exame neurológico › Sensibilidade", [
    ["Hipoestesia em bota e luva", I("sens-bota-luva", "Começa nas pontas e sobe; mais intensa distalmente.")],
    ["Nível sensitivo", I("sens-nivel", "Perda abaixo de um dermátomo; aqui, T10.")],
    ["Perda de dor e temperatura em capa sobre ombros e braços", I("sens-capa", "Distribuição em capa da siringomielia.")],
    ["Hemi-hipoestesia", I("sens-hemi", "Perda em todo um lado, incluindo a face.")],
    ["Fraqueza e perda de posição de um lado, perda de dor do outro", I("sens-brown", "Síndrome de Brown-Séquard: o que se perde de cada lado.")]
  ]);
  em("Exame neurológico › Reflexos", [
    ["Sinal de Babinski", I("babinski", "Onde estimular e qual é a resposta anormal.")]
  ]);

  em("Exame geral › Nível de consciência e orientação", [
    ["Postura de decorticação", I("postura-decorticacao", "Braços fletidos, pernas estendidas.")],
    ["Postura de descerebração", I("postura-descerebracao", "Braços e pernas estendidos.")]
  ]);
  em("Exame geral › Ectoscopia › Atitude e decúbito", [
    ["Opistótono", I("postura-opistotono", "Corpo arqueado, apoiado na nuca e nos calcanhares.")]
  ]);
  em("Exame geral › Ectoscopia › Edema", [
    ["Edema generalizado (anasarca)", I("edema-cacifo", "Como pesquisar o cacifo (sinal de Godet).")]
  ]);

  em("Aparelho respiratório › Inspeção estática", [
    ["Tórax atípico, simétrico", I("torax-normal", "Corte do tórax visto de cima.")],
    ["Tórax em tonel", I("torax-tonel", "Diâmetro anteroposterior quase igual ao lateral.")],
    ["Pectus excavatum", I("torax-excavatum", "Esterno afundado, em corte.")],
    ["Pectus carinatum", I("torax-carinatum", "Esterno projetado, em corte.")]
  ]);

  em("Abdome › Inspeção", [
    ["Circulação colateral tipo porta (cabeça de medusa)", I("abd-medusa", "Veias que irradiam do umbigo.")],
    ["Equimose periumbilical (Cullen) ou em flancos (Grey Turner)", I("abd-cullen", "Onde aparecem as equimoses.")]
  ]);
  em("Abdome › Palpação", [
    ["Dor no ponto de McBurney", I("abd-mcburney", "Como localizar o ponto.")]
  ]);

  em("Sistema osteoarticular › Articulações", [
    ["Nódulos de Heberden e de Bouchard", I("mao-heberden", "Heberden nas interfalângicas distais, Bouchard nas proximais.")]
  ]);
  em("Sistema osteoarticular › Cotovelo, punho e mão", [
    ["Desvio ulnar dos dedos, dedos em pescoço de cisne e em botoeira", I("mao-desvio-ulnar", "Desvio ulnar."), I("dedos-ar", "Pescoço de cisne e botoeira, de perfil.")]
  ]);
  em("Sistema osteoarticular › Quadril", [
    ["Sinal de Trendelenburg", I("trendelenburg", "A pelve cai do lado levantado: fraqueza do glúteo médio do lado de apoio.")]
  ]);
  em("Sistema osteoarticular › Coluna", [
    ["Sinal de Lasègue", I("lasegue", "Dor abaixo do joelho entre 30° e 70° de elevação.")]
  ]);

  em("Exame obstétrico › Altura uterina", [
    ["Altura uterina compatível com a idade gestacional", I("altura-uterina", "Fundo do útero: umbigo por volta de 20 semanas, perto do xifoide com 36.")]
  ]);
  em("Exame obstétrico › Manobras de Leopold", [
    ["Situação longitudinal e apresentação cefálica", I("feto-cefalico", "Cabeça para baixo, junto à pelve.")],
    ["Apresentação pélvica", I("feto-pelvico", "Cabeça no fundo do útero.")],
    ["Situação transversa", I("feto-transverso", "Feto atravessado.")]
  ]);

  em("Exame pediátrico e do recém-nascido › Fontanelas e crânio", [
    ["Fontanela anterior normotensa, suturas móveis", I("fontanelas", "Onde ficam as fontanelas e as suturas.")]
  ]);
  em("Exame pediátrico e do recém-nascido › Pele do recém-nascido", [
    ["Icterícia que avança da cabeça para os pés", I("kramer", "Zonas de Kramer e valores aproximados.")]
  ]);
})(window.SEM);
