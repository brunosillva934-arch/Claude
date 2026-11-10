// Manobras acrescentadas às regiões do corpo do Paciente Virtual (por id da região).
// Ficam disponíveis nos casos fixos e nos casos gerados pela IA.
const m = (id, tipo, nome, normal) => ({ id, tipo, nome, normal });

export default {
  geral: [
    m("fala-linguagem", "inspecao", "Fala e linguagem", "Fala fluente e bem articulada; compreende comandos, repete frases e nomeia objetos."),
    m("orientacao-atencao", "especial", "Orientação e atenção", "Orientado no tempo e no espaço; diz os meses do ano de trás para a frente sem erros."),
    m("equilibrio-romberg", "especial", "Romberg e marcha em tandem", "Romberg negativo; anda em tandem sem desequilíbrio."),
  ],
  cabeca: [
    m("mimica-facial", "inspecao", "Mímica facial (VII nervo)", "Face simétrica em repouso e à mímica: enruga a testa, fecha os olhos com força e mostra os dentes sem assimetria."),
    m("motilidade-ocular", "especial", "Pálpebras e movimentos oculares", "Sem ptose; movimentos oculares completos nas seis posições, sem diplopia ou nistagmo."),
    m("campo-visual", "especial", "Campo visual por confrontação", "Campos visuais preservados nos quatro quadrantes de cada olho."),
    m("fundo-olho", "especial", "Fundo de olho", "Discos ópticos de bordas nítidas, relação arteríola/vênula preservada, sem hemorragias ou exsudatos."),
    m("palato-lingua", "inspecao", "Palato, úvula e língua (IX, X e XII)", "Palato eleva-se de forma simétrica, úvula centrada; língua centrada, sem atrofia ou fasciculações."),
    m("arterias-temporais", "palpacao", "Artérias temporais", "Artérias temporais pulsáteis, de calibre normal e indolores."),
  ],
  pescoco: [
    m("rigidez-nuca", "especial", "Rigidez de nuca, Kernig e Brudzinski", "Pescoço flexível, o queixo toca o tórax; Kernig e Brudzinski negativos."),
    m("ausculta-tireoide", "ausculta", "Ausculta da tireoide", "Sem sopros sobre a tireoide."),
  ],
  torax_post: [
    m("coluna", "palpacao", "Coluna: palpação, percussão e mobilidade", "Apófises espinhosas indolores à palpação e à percussão; mobilidade preservada; sem contratura paravertebral."),
  ],
  abdome: [
    m("ab-circulacao", "inspecao", "Pele do abdome e circulação colateral", "Sem circulação colateral, estrias, equimoses ou cicatrizes; cicatriz umbilical intrusa."),
    m("piparote", "especial", "Sinal do piparote", "Piparote negativo."),
    m("rovsing", "especial", "Sinal de Rovsing", "Rovsing negativo: a compressão da fossa ilíaca esquerda não provoca dor à direita."),
    m("psoas-obturador", "especial", "Sinais do psoas e do obturador", "Psoas e obturador negativos."),
    m("traube", "percussao", "Espaço de Traube", "Espaço de Traube livre (timpânico)."),
    m("toque-retal", "especial", "Toque retal", "Esfíncter normotônico, ampola sem massas, fezes de aspecto normal na luva."),
  ],
  msup: [
    m("forca-mmss", "especial", "Força dos membros superiores e braços estendidos", "Força grau 5 proximal e distal, simétrica; braços estendidos sem queda ou pronação."),
    m("tonus-mmss", "palpacao", "Tônus dos membros superiores", "Tônus normal, sem espasticidade, rigidez ou roda denteada."),
    m("reflexos-mmss", "especial", "Reflexos bicipital, estilorradial e tricipital", "Reflexos 2+/4+ e simétricos."),
    m("sensibilidade-mmss", "especial", "Sensibilidade dos membros superiores", "Sensibilidade tátil e dolorosa preservadas e simétricas."),
    m("coordenacao-mmss", "especial", "Índex-nariz e movimentos alternados", "Sem dismetria, tremor de intenção ou disdiadococinesia."),
    m("tremor-maos", "inspecao", "Tremor e movimentos involuntários das mãos", "Sem tremor de repouso, postural ou de ação."),
    m("articulacoes-maos", "palpacao", "Articulações das mãos e dos punhos", "Sem sinovite, deformidades ou dor à compressão das metacarpofalângicas; fecha o punho por completo."),
    m("tinel-phalen", "especial", "Tinel e Phalen no punho", "Tinel e Phalen negativos."),
  ],
  minf: [
    m("forca-mmii", "especial", "Força dos membros inferiores e Mingazzini", "Força grau 5 proximal e distal, simétrica; mantém a posição de Mingazzini sem queda."),
    m("tonus-mmii", "palpacao", "Tônus dos membros inferiores", "Tônus normal, sem espasticidade ou clônus."),
    m("reflexos-mmii", "especial", "Reflexos patelar e aquileu", "Reflexos 2+/4+ e simétricos."),
    m("cutaneo-plantar", "especial", "Reflexo cutâneo-plantar", "Cutâneo-plantar em flexão bilateral."),
    m("sensibilidade-mmii", "especial", "Sensibilidade dos membros inferiores (tátil, dolorosa, vibratória e de posição)", "Sensibilidade superficial e profunda preservadas e simétricas."),
    m("lasegue", "especial", "Elevação da perna estendida (Lasègue)", "Lasègue negativo bilateralmente até 80°."),
    m("joelhos", "palpacao", "Joelhos: derrame, interlinhas e estabilidade", "Sem derrame, calor ou dor nas interlinhas; ligamentos estáveis."),
    m("pes-articulacoes", "palpacao", "Tornozelos e articulações dos pés", "Sem sinovite ou dor à compressão das metatarsofalângicas."),
  ],
};
