/**
 * Dados de exemplo criados na primeira abertura: a árvore "Dor torácica", com
 * três níveis e doenças, exames e medicamentos interligados, e uma segunda
 * árvore que reaproveita as mesmas notas e mostra os tópicos: cada classe de
 * anticoagulante é uma nota com o mecanismo, e os medicamentos da classe ficam
 * embaixo dela como tópicos, cada um com uma recomendação curta.
 *
 * O conteúdo é só ilustrativo, para testar o app.
 */
import type { Instrucao } from './banco';
import { sqlInserirArvore, sqlInserirNo, sqlInserirNota } from './repositorio';
import type { Arvore, No, Nota } from './tipos';
import { NO_MENCAO, mencoesDoDocumento, textoDoDocumento, type NoDoc } from '../nota/documento';
import { agora, uid } from '../util/texto';

type Linha = string | NoDoc;

const t = (texto: string): NoDoc => ({ type: 'text', text: texto });
const n = (texto: string): NoDoc => ({ type: 'text', text: texto, marks: [{ type: 'bold' }] });
const m = (notaId: string): NoDoc => ({ type: NO_MENCAO, attrs: { notaId } });
const emLinha = (partes: Linha[]): NoDoc[] => partes.map((p) => (typeof p === 'string' ? t(p) : p));
const p = (...partes: Linha[]): NoDoc => ({ type: 'paragraph', content: emLinha(partes) });
const h = (nivel: number, texto: string): NoDoc => ({ type: 'heading', attrs: { level: nivel }, content: [t(texto)] });
const ul = (...itens: Linha[][]): NoDoc => ({
  type: 'bulletList',
  content: itens.map((i) => ({ type: 'listItem', content: [p(...i)] })),
});
const ol = (...itens: Linha[][]): NoDoc => ({
  type: 'orderedList',
  attrs: { start: 1 },
  content: itens.map((i) => ({ type: 'listItem', content: [p(...i)] })),
});
const aviso = (): NoDoc => ({
  type: 'blockquote',
  content: [p('Conteúdo de exemplo para testar o app. Confira sempre as diretrizes atuais antes de usar na prática.')],
});

interface Rascunho {
  chave: string;
  titulo: string;
  tipoId: string;
  /** Tópico: item de lista (ex.: um medicamento sob a nota da classe), com recomendação curta. */
  topico?: boolean;
  resumo?: string;
  doc: (id: Record<string, string>) => NoDoc[];
}

const NOTAS: Rascunho[] = [
  {
    chave: 'dor', titulo: 'Dor torácica', tipoId: 'sintoma',
    doc: (id) => [
      aviso(),
      h(2, 'Primeiros 10 minutos'),
      ol(
        [m(id.ecg!), ' de 12 derivações, lido por médico.'],
        ['Sinais vitais, saturação e acesso venoso.'],
        ['História dirigida: início, caráter, irradiação, fatores de piora e melhora.'],
      ),
      h(2, 'Causas que ameaçam a vida'),
      ul(
        [m(id.iam!), ': dor em aperto, irradiada, com sudorese.'],
        [m(id.tep!), ': dispneia súbita, dor pleurítica, taquicardia.'],
        [m(id.disseccao!), ': dor lancinante, de início abrupto, para o dorso.'],
        [m(id.pneumotorax!), ': dispneia, hipotensão e murmúrio abolido.'],
      ),
      h(2, 'Outras causas'),
      ul([m(id.pericardite!), ': dor que piora ao deitar e melhora sentado.']),
    ],
  },
  {
    chave: 'iam', titulo: 'IAM com supra de ST', tipoId: 'doenca',
    doc: (id) => [
      h(2, 'Diagnóstico'),
      p('Dor típica com supradesnivelamento de ST em duas derivações contíguas no ', m(id.ecg!), '. A ',
        m(id.troponina!), ' confirma a lesão, mas ', n('não deve atrasar a reperfusão'), '.'),
      h(2, 'Tratamento inicial'),
      ul(
        [m(id.aas!), ' mastigado, o quanto antes.'],
        ['Segundo antiagregante: ', m(id.clopidogrel!), '.'],
        ['Anticoagulação: ', m(id.enoxaparina!), ' ou ', m(id.hnf!), '.'],
      ),
      h(2, 'Reperfusão'),
      p(m(id.angioplastia!), ' é a estratégia de escolha quando disponível em tempo hábil. Sem ela, fibrinólise.'),
    ],
  },
  {
    chave: 'tep', titulo: 'Tromboembolismo pulmonar', tipoId: 'doenca',
    doc: (id) => [
      h(2, 'Suspeita'),
      p('Dispneia súbita, dor pleurítica, taquicardia, hemoptise. Estimar a probabilidade pré-teste com o ',
        m(id.wells!), '.'),
      h(2, 'Investigação'),
      ul(
        ['Probabilidade baixa ou intermediária: ', m(id.ddimero!), '.'],
        ['Probabilidade alta ou D-dímero positivo: ', m(id.angiotc!), '.'],
      ),
      h(2, 'Tratamento'),
      p('Anticoagulação com ', m(id.enoxaparina!), ' ou ', m(id.hnf!),
        '. Trombólise se houver instabilidade hemodinâmica. No risco intermediário, ver ', m(id.peitho!), '.'),
    ],
  },
  {
    chave: 'disseccao', titulo: 'Dissecção de aorta', tipoId: 'doenca',
    doc: (id) => [
      h(2, 'Quadro'),
      p('Dor súbita, lancinante, máxima no início, irradiada para o dorso. Assimetria de pulsos ou de pressão entre os membros.'),
      h(2, 'Exames'),
      ul(
        ['Paciente estável: ', m(id.angiotc!), '.'],
        ['Paciente instável: ', m(id.ete!), ' à beira do leito.'],
      ),
      h(2, 'Conduta'),
      ul(
        ['Controle de frequência e pressão com betabloqueador venoso (', m(id.esmolol!), ').'],
        ['Stanford A: ', m(id.cirurgia!), '.'],
        ['Stanford B não complicada: tratamento clínico.'],
      ),
      p(n('Atenção: '), 'não anticoagular nem fazer fibrinólise.'),
    ],
  },
  {
    chave: 'pericardite', titulo: 'Pericardite aguda', tipoId: 'doenca',
    doc: (id) => [
      h(2, 'Quadro'),
      p('Dor pleurítica que piora ao deitar e melhora sentado e inclinado para a frente. Atrito pericárdico.'),
      h(2, 'Exames'),
      p(m(id.ecg!), ' com supra de ST difuso, côncavo, e infra de PR.'),
      h(2, 'Tratamento'),
      p('Anti-inflamatório (', m(id.ibuprofeno!), ') associado a ', m(id.colchicina!), '.'),
    ],
  },
  {
    chave: 'pneumotorax', titulo: 'Pneumotórax hipertensivo', tipoId: 'doenca',
    doc: (id) => [
      h(2, 'Diagnóstico'),
      p('É clínico: dispneia intensa, hipotensão, turgência jugular, murmúrio vesicular abolido e desvio de traqueia. ',
        n('Não esperar'), ' a ', m(id.rx!), '.'),
      h(2, 'Conduta'),
      p(m(id.descompressao!), ' imediata, seguida de drenagem torácica.'),
    ],
  },
  {
    chave: 'ecg', titulo: 'Eletrocardiograma', tipoId: 'exame',
    doc: (id) => [
      p('Fazer e interpretar em até 10 minutos da chegada em toda dor torácica.'),
      h(2, 'O que procurar'),
      ul(
        ['Supra de ST em derivações contíguas: ', m(id.iam!), '.'],
        ['Supra difuso com infra de PR: ', m(id.pericardite!), '.'],
        ['Taquicardia sinusal, S1Q3T3, sobrecarga direita: ', m(id.tep!), '.'],
      ),
    ],
  },
  {
    chave: 'troponina', titulo: 'Troponina', tipoId: 'exame',
    doc: (id) => [
      p('Marcador de lesão miocárdica. Dosar na chegada e repetir de forma seriada.'),
      p('Também se eleva em ', m(id.tep!), ', miocardite, sepse e doença renal crônica.'),
    ],
  },
  {
    chave: 'ddimero', titulo: 'D-dímero', tipoId: 'exame',
    doc: (id) => [
      p('Alto valor preditivo negativo. Só ajuda quando a probabilidade pré-teste (', m(id.wells!),
        ') é baixa ou intermediária.'),
      p('Acima de 50 anos, usar o ponto de corte ajustado pela idade.'),
    ],
  },
  {
    chave: 'angiotc', titulo: 'Angiotomografia de tórax', tipoId: 'exame',
    doc: (id) => [
      p('Exame de escolha no paciente estável com suspeita de ', m(id.tep!), ' ou de ', m(id.disseccao!), '.'),
      p('Usa contraste iodado: checar função renal e história de alergia.'),
    ],
  },
  {
    chave: 'ete', titulo: 'Ecocardiograma transesofágico', tipoId: 'exame',
    doc: (id) => [p('Alternativa à tomografia na suspeita de ', m(id.disseccao!), ' em paciente instável, à beira do leito.')],
  },
  {
    chave: 'rx', titulo: 'Radiografia de tórax', tipoId: 'exame',
    doc: (id) => [
      p('Avalia pneumotórax, alargamento de mediastino, congestão e consolidações.'),
      p('No ', m(id.pneumotorax!), ' o diagnóstico é clínico e o exame não deve atrasar a conduta.'),
    ],
  },
  {
    chave: 'wells', titulo: 'Escore de Wells', tipoId: 'geral',
    doc: (id) => [
      p('Estima a probabilidade pré-teste de ', m(id.tep!), ' e orienta o próximo exame: ', m(id.ddimero!), ' ou ',
        m(id.angiotc!), '.'),
    ],
  },
  {
    chave: 'aas', titulo: 'AAS', tipoId: 'medicamento',
    doc: (id) => [
      p('Antiagregante plaquetário. No ', m(id.iam!), ', dose de ataque mastigada e depois manutenção diária.'),
      h(2, 'Contraindicações'),
      ul(['Alergia ao fármaco.'], ['Sangramento ativo.']),
    ],
  },
  {
    chave: 'clopidogrel', titulo: 'Clopidogrel', tipoId: 'medicamento',
    doc: (id) => [p('Inibidor de P2Y12. Segundo antiagregante no ', m(id.iam!), ', associado ao ', m(id.aas!), '.')],
  },
  {
    chave: 'enoxaparina', titulo: 'Enoxaparina', tipoId: 'medicamento',
    doc: (id) => [
      p('Heparina de baixo peso molecular, por via subcutânea.'),
      h(2, 'Usos'),
      ul([m(id.iam!)], [m(id.tep!)]),
      h(2, 'Cuidados'),
      ul(['Ajustar a dose na insuficiência renal.'], ['Atenção em idosos e extremos de peso.']),
      p('Esta mesma nota aparece em vários ramos e em duas árvores: edite aqui e muda em todos os lugares.'),
    ],
  },
  {
    chave: 'hnf', titulo: 'Heparina não fracionada', tipoId: 'medicamento',
    doc: (id) => [
      p('Anticoagulante venoso de meia-vida curta, ajustado pelo TTPa. Preferida quando há risco de sangramento ou insuficiência renal grave.'),
      p('Usos: ', m(id.iam!), ' e ', m(id.tep!), '.'),
    ],
  },
  // Tópicos: a nota de cima (Dissecção, Pericardite) já explica o porquê; aqui fica só a recomendação.
  {
    chave: 'esmolol', titulo: 'Esmolol', tipoId: 'medicamento', topico: true,
    resumo: 'Alvo: FC ≤ 60 bpm e PAS entre 100 e 120 mmHg.', doc: () => [],
  },
  {
    chave: 'ibuprofeno', titulo: 'Ibuprofeno', tipoId: 'medicamento', topico: true,
    resumo: 'Com proteção gástrica, por 1 a 2 semanas.', doc: () => [],
  },
  {
    chave: 'colchicina', titulo: 'Colchicina', tipoId: 'medicamento', topico: true,
    resumo: 'Manter por 3 meses: reduz a recorrência.', doc: () => [],
  },
  {
    chave: 'angioplastia', titulo: 'Angioplastia primária', tipoId: 'conduta',
    doc: (id) => [p('Reperfusão de escolha no ', m(id.iam!), ' quando feita em tempo hábil por equipe experiente.')],
  },
  {
    chave: 'cirurgia', titulo: 'Cirurgia de urgência', tipoId: 'conduta',
    doc: (id) => [p('Indicada na ', m(id.disseccao!), ' do tipo A de Stanford (aorta ascendente).')],
  },
  {
    chave: 'descompressao', titulo: 'Descompressão torácica', tipoId: 'conduta',
    doc: (id) => [p('Punção de alívio no ', m(id.pneumotorax!), ', seguida de drenagem torácica em selo d’água.')],
  },
  {
    chave: 'peitho', titulo: 'Estudo PEITHO', tipoId: 'estudo',
    doc: (id) => [
      p('Trombólise no ', m(id.tep!), ' de risco intermediário (N Engl J Med, 2014).'),
      p('Reduziu a descompensação hemodinâmica, mas aumentou sangramento maior e AVC hemorrágico.'),
    ],
  },
  {
    chave: 'anticoagulantes', titulo: 'Anticoagulantes', tipoId: 'geral',
    doc: (id) => [
      p('Visão geral. Cada classe tem uma nota com o mecanismo; os medicamentos da classe aparecem embaixo dela ',
        'como tópicos, com uma recomendação curta.'),
      ul([m(id.heparinas!)], [m(id.avk!)], [m(id.xa!)], [m(id.trombina!)]),
      p('Esta árvore reaproveita notas da árvore “Dor torácica” (Enoxaparina e Heparina não fracionada).'),
    ],
  },
  {
    chave: 'heparinas', titulo: 'Heparinas', tipoId: 'medicamento',
    doc: () => [
      h(2, 'Mecanismo'),
      p('Potencializam a antitrombina, que inativa a trombina e o fator Xa. As de baixo peso molecular agem ',
        'sobretudo sobre o fator Xa.'),
    ],
  },
  {
    chave: 'avk', titulo: 'Antagonistas da vitamina K', tipoId: 'medicamento',
    doc: () => [
      h(2, 'Mecanismo'),
      p('Reduzem a síntese dos fatores II, VII, IX e X. O efeito demora dias: no início, associar heparina.'),
    ],
  },
  {
    chave: 'varfarina', titulo: 'Varfarina', tipoId: 'medicamento', topico: true,
    resumo: 'Ajustar pelo INR; alvo de 2 a 3 na maioria das indicações.', doc: () => [],
  },
  {
    chave: 'xa', titulo: 'Inibidores diretos do fator Xa', tipoId: 'medicamento',
    doc: () => [
      h(2, 'Mecanismo'),
      p('Inibem o fator Xa diretamente, sem depender da antitrombina. Dose fixa, sem controle laboratorial ',
        'de rotina. Ajustar pela função renal.'),
    ],
  },
  {
    chave: 'rivaroxabana', titulo: 'Rivaroxabana', tipoId: 'medicamento', topico: true,
    resumo: 'Doses de 15 e 20 mg: tomar com alimento.', doc: () => [],
  },
  {
    chave: 'apixabana', titulo: 'Apixabana', tipoId: 'medicamento', topico: true,
    resumo: 'Duas vezes ao dia; a que menos depende do rim.', doc: () => [],
  },
  {
    chave: 'edoxabana', titulo: 'Edoxabana', tipoId: 'medicamento', topico: true,
    resumo: 'Na fibrilação atrial, evitar se o clearance de creatinina passar de 95 mL/min.', doc: () => [],
  },
  {
    chave: 'trombina', titulo: 'Inibidor direto da trombina', tipoId: 'medicamento',
    doc: () => [h(2, 'Mecanismo'), p('Liga-se diretamente à trombina, livre ou presa ao coágulo.')],
  },
  {
    chave: 'dabigatrana', titulo: 'Dabigatrana', tipoId: 'medicamento', topico: true,
    resumo: 'Antídoto: idarucizumabe. Não abrir a cápsula.', doc: () => [],
  },
  {
    chave: 'inr', titulo: 'INR', tipoId: 'exame',
    doc: (id) => [p('Padroniza o tempo de protrombina. Usado para ajustar a ', m(id.varfarina!), '.')],
  },
];

/** [chave da nota, rótulo do ramo, filhos] */
type Ramo = [string, string | null, Ramo[]?];

const ARVORES: Array<{ nome: string; raiz: Ramo }> = [
  {
    nome: 'Dor torácica',
    raiz: ['dor', null, [
      ['iam', 'supra de ST', [
        ['ecg', 'em 10 min'],
        ['troponina', null],
        ['aas', 'todos'],
        ['clopidogrel', null],
        ['enoxaparina', null],
        ['angioplastia', 'em tempo hábil'],
      ]],
      ['tep', 'dispneia súbita', [
        ['wells', null],
        ['ddimero', 'Wells baixo'],
        ['angiotc', 'Wells alto'],
        ['enoxaparina', null],
        ['peitho', null],
      ]],
      ['disseccao', 'dor lancinante', [
        ['angiotc', 'estável'],
        ['ete', 'instável'],
        ['esmolol', null],
        ['cirurgia', 'Stanford A'],
      ]],
      ['pericardite', 'piora ao deitar', [
        ['ecg', null],
        ['ibuprofeno', null],
        ['colchicina', null],
      ]],
      ['pneumotorax', 'murmúrio abolido', [
        ['rx', 'não esperar'],
        ['descompressao', 'imediata'],
      ]],
    ]],
  },
  {
    nome: 'Anticoagulação',
    // Cada classe é uma nota com o mecanismo; os medicamentos ficam embaixo, como tópicos.
    raiz: ['anticoagulantes', null, [
      ['heparinas', 'parenterais', [
        ['enoxaparina', 'subcutânea'],
        ['hnf', 'venosa'],
      ]],
      ['avk', 'oral', [
        ['varfarina', null, [['inr', 'controle']]],
      ]],
      ['xa', 'oral', [
        ['rivaroxabana', null],
        ['apixabana', null],
        ['edoxabana', null],
      ]],
      ['trombina', 'oral', [
        ['dabigatrana', null],
      ]],
    ]],
  },
];

export interface Exemplo {
  instrucoes: Instrucao[];
  primeiraArvoreId: string;
}

/** `sufixo` vai no nome das árvores (para adicionar uma cópia sem confundir com as atuais). */
export function montarExemplo(sufixo = '', ordemInicial = 0): Exemplo {
  const quando = agora();
  const id: Record<string, string> = {};
  for (const r of NOTAS) id[r.chave] = uid();
  const tituloPorId = new Map(NOTAS.map((r) => [id[r.chave]!, r.titulo]));

  const instrucoes: Instrucao[] = [];
  for (const r of NOTAS) {
    const doc: NoDoc = { type: 'doc', content: r.doc(id) };
    const nota: Nota = {
      id: id[r.chave]!,
      titulo: r.titulo,
      tipoId: r.tipoId,
      topico: r.topico === true,
      resumo: r.resumo ?? '',
      conteudo: r.topico ? '' : JSON.stringify(doc),
      texto: textoDoDocumento(doc, (notaId) => tituloPorId.get(notaId) ?? ''),
      criadaEm: quando,
      atualizadaEm: quando,
      excluidaEm: null,
    };
    instrucoes.push(sqlInserirNota(nota));
    for (const destino of mencoesDoDocumento(doc)) {
      instrucoes.push({
        sql: 'INSERT OR IGNORE INTO links (origemId, destinoId) VALUES (?, ?)',
        params: [nota.id, destino],
      });
    }
  }

  let primeiraArvoreId = '';
  ARVORES.forEach((a, ordem) => {
    const arvoreId = uid();
    if (!primeiraArvoreId) primeiraArvoreId = arvoreId;
    const criar = (ramo: Ramo, paiId: string | null, posicao: number): string => {
      const [chave, rotulo, filhos] = ramo;
      const no: No = {
        id: uid(),
        arvoreId,
        notaId: id[chave]!,
        paiId,
        ordem: posicao,
        rotuloDoRamo: rotulo,
        recolhido: false,
      };
      instrucoes.push(sqlInserirNo(no));
      (filhos ?? []).forEach((f, i) => criar(f, no.id, i));
      return no.id;
    };
    const raizId = criar(a.raiz, null, 0);
    const arvore: Arvore = {
      id: arvoreId, nome: a.nome + sufixo, raizId, ordem: ordemInicial + ordem, criadaEm: quando, excluidaEm: null,
    };
    instrucoes.push(sqlInserirArvore(arvore));
  });

  return { instrucoes, primeiraArvoreId };
}
