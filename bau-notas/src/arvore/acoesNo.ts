/**
 * Ações sobre um nó que envolvem perguntar algo ao usuário: o menu do toque
 * longo, o rótulo do ramo, a troca de tipo e a exclusão com desfazer.
 */
import {
  BetweenHorizontalStart as Between, ChevronsDownUp, ChevronsUpDown, CornerDownRight, FileText, GitBranchPlus, Hash,
  ListPlus, MessageSquareText, Move, Pencil, Shapes, Tag, Trash2,
} from 'lucide-react';
import {
  alternarRecolhido, criarFilho, criarIrmao, definirRotulo, definirTopico, desfazer, editarTitulo, excluirArvore,
  excluirNo, expandirNota, filhosDe, iniciarMover, inserirEntre, mudarTipoDaNota, resumoDaArvore, resumoDaExclusao,
  selecionar, separarComoArvore,
  tiposOrdenados, tituloDaNota, useLoja,
} from '../estado/loja';
import { gravarResumoAgora } from '../nota/salvamento';
import { abrirMenu, avisar, confirmar, perguntarTexto, type ItemMenu } from '../ui/servico';
import { coresDoTipo } from '../util/cores';
import { plural } from '../util/texto';

function avisarDesfazer(texto: string): void {
  avisar(texto, {
    acao: {
      rotulo: 'Desfazer',
      aoTocar: () => {
        desfazer();
      },
    },
  });
}

export async function pedirRotulo(noId: string): Promise<void> {
  const s = useLoja.getState();
  const no = s.nos[noId];
  if (!no) return;
  const resposta = await perguntarTexto({
    titulo: 'Rótulo do ramo',
    texto: 'Aparece sobre a linha que chega a este nó. Deixe em branco para remover.',
    valor: no.rotuloDoRamo ?? '',
    dica: 'ex.: se troponina +, 30%',
    permitirVazio: true,
  });
  if (resposta !== null) definirRotulo(noId, resposta);
}

/** Recomendação curta de um tópico, que aparece no cartão da árvore. */
export async function pedirResumo(notaId: string): Promise<void> {
  const nota = useLoja.getState().notas[notaId];
  if (!nota) return;
  const resposta = await perguntarTexto({
    titulo: `Recomendação: ${tituloDaNota(nota)}`,
    texto: 'Aparece no próprio tópico, na árvore. Deixe em branco para remover.',
    valor: nota.resumo,
    dica: 'ex.: tomar com alimento',
    permitirVazio: true,
  });
  if (resposta !== null) gravarResumoAgora(notaId, resposta.replace(/\s+/g, ' ').trim());
}

export function abrirMenuDeTipos(notaId: string, x: number, y: number): void {
  const s = useLoja.getState();
  const nota = s.notas[notaId];
  if (!nota) return;
  abrirMenu({
    titulo: 'Tipo da nota',
    x,
    y,
    itens: tiposOrdenados(s.tipos).map((t) => ({
      id: 'tipo-' + t.id,
      rotulo: t.nome,
      cor: coresDoTipo(t.cor, s.escuro).base,
      marcado: t.id === nota.tipoId,
      aoEscolher: () => mudarTipoDaNota(notaId, t.id),
    })),
  });
}

export async function pedirExclusao(noId: string): Promise<void> {
  const s = useLoja.getState();
  const no = s.nos[noId];
  if (!no) return;
  const titulo = tituloDaNota(s.notas[no.notaId]);

  if (!no.paiId && s.arvores[no.arvoreId]?.raizId === noId) {
    // A raiz principal só sai junto com a árvore (a tela inteira).
    const arvore = s.arvores[no.arvoreId];
    if (!arvore) return;
    const r = resumoDaArvore(arvore.id);
    const ok = await confirmar({
      titulo: `Excluir a árvore “${arvore.nome}”?`,
      texto:
        `A árvore tem ${plural(r.nos, 'nó', 'nós')}. ` +
        (r.notasParaLixeira > 0
          ? `${plural(r.notasParaLixeira, 'nota que não está', 'notas que não estão')} em outra árvore ${r.notasParaLixeira === 1 ? 'vai' : 'vão'} para a lixeira.`
          : 'As notas continuam nas outras árvores em que aparecem.'),
      rotuloOk: 'Excluir árvore',
      perigo: true,
    });
    if (ok && excluirArvore(arvore.id)) avisarDesfazer(`Árvore “${arvore.nome}” excluída`);
    return;
  }

  const r = resumoDaExclusao(noId);
  const partes: string[] = [];
  if (r.nos > 1) partes.push(`O ramo inteiro sai da árvore (${plural(r.nos, 'nó', 'nós')}).`);
  if (r.notasParaLixeira > 0) {
    partes.push(
      `${plural(r.notasParaLixeira, 'nota que não aparece', 'notas que não aparecem')} em outro lugar ${r.notasParaLixeira === 1 ? 'vai' : 'vão'} para a lixeira.`,
    );
  } else {
    partes.push('O conteúdo é mantido: a nota continua nos outros lugares em que aparece.');
  }
  const ok = await confirmar({
    titulo: `Excluir “${titulo}”?`,
    texto: partes.join(' '),
    rotuloOk: 'Excluir',
    perigo: true,
  });
  if (ok && excluirNo(noId)) avisarDesfazer(`“${titulo}” excluído`);
}

/** Menu do toque longo (ou do botão ⋯) de um nó. */
export function abrirMenuDoNo(noId: string, x: number, y: number, aposSoltar = false): void {
  const s = useLoja.getState();
  const no = s.nos[noId];
  if (!no) return;
  const nota = s.notas[no.notaId];
  const tipo = nota ? s.tipos[nota.tipoId] : undefined;
  const temFilhos = filhosDe(s.nos, noId).length > 0;
  const raiz = !no.paiId;
  const principal = raiz && s.arvores[no.arvoreId]?.raizId === noId;
  const topico = nota?.topico === true;

  const itens: ItemMenu[] = [
    {
      id: 'abrir',
      rotulo: topico ? 'Abrir o tópico' : 'Abrir nota',
      icone: FileText,
      aoEscolher: () => {
        selecionar(noId);
        expandirNota(true);
      },
    },
    { id: 'renomear', rotulo: 'Renomear', icone: Pencil, aoEscolher: () => editarTitulo(noId) },
    ...(topico
      ? [
          {
            id: 'resumo',
            rotulo: nota?.resumo.trim() ? 'Editar a recomendação' : 'Escrever uma recomendação',
            icone: MessageSquareText,
            detalhe: nota?.resumo.trim() || undefined,
            aoEscolher: () => void pedirResumo(no.notaId),
          },
        ]
      : []),
    {
      id: 'tipo',
      rotulo: 'Mudar o tipo',
      icone: Shapes,
      detalhe: tipo?.nome,
      aoEscolher: () => abrirMenuDeTipos(no.notaId, x, y),
    },
    {
      id: 'topico',
      rotulo: topico ? 'Transformar em nota completa' : 'Transformar em tópico',
      icone: topico ? FileText : Hash,
      detalhe: topico ? 'para texto longo' : 'item com recomendação curta',
      aoEscolher: () => definirTopico(no.notaId, !topico),
    },
    {
      id: 'rotulo',
      rotulo: no.rotuloDoRamo ? 'Editar o rótulo do ramo' : 'Escrever o rótulo do ramo',
      icone: Tag,
      detalhe: no.rotuloDoRamo ?? undefined,
      desativado: raiz,
      aoEscolher: () => void pedirRotulo(noId),
    },
    {
      id: 'recolher',
      rotulo: no.recolhido ? 'Expandir' : 'Recolher',
      icone: no.recolhido ? ChevronsUpDown : ChevronsDownUp,
      desativado: !temFilhos,
      aoEscolher: () => alternarRecolhido(noId),
    },
    {
      id: 'mover',
      rotulo: raiz ? 'Pôr dentro de outro nó' : 'Mover para outro pai',
      icone: Move,
      desativado: principal,
      aoEscolher: () => iniciarMover(noId),
    },
    ...(raiz
      ? []
      : [
          {
            id: 'separar',
            rotulo: 'Separar como árvore própria',
            icone: GitBranchPlus,
            detalhe: 'nesta tela',
            aoEscolher: () => {
              if (separarComoArvore(noId)) avisarDesfazer(`“${tituloDaNota(nota)}” virou uma árvore nesta tela`);
            },
          },
        ]),
    {
      id: 'filho',
      rotulo: 'Novo filho',
      icone: CornerDownRight,
      separadorAntes: true,
      aoEscolher: () => void criarFilho(noId),
    },
    {
      id: 'entre',
      rotulo: raiz ? 'Novo nó acima (novo pai)' : 'Novo nó entre este e o de cima',
      icone: Between,
      aoEscolher: () => void inserirEntre(noId),
    },
    {
      id: 'irmao',
      rotulo: 'Novo irmão',
      icone: ListPlus,
      desativado: raiz,
      aoEscolher: () => void criarIrmao(noId),
    },
    {
      id: 'topico-filho',
      rotulo: 'Novo tópico (filho)',
      icone: Hash,
      aoEscolher: () => void criarFilho(noId, true),
    },
    {
      id: 'excluir',
      rotulo: principal ? 'Excluir a árvore (tela inteira)' : raiz ? 'Excluir esta árvore' : 'Excluir',
      icone: Trash2,
      perigo: true,
      separadorAntes: true,
      aoEscolher: () => void pedirExclusao(noId),
    },
  ];
  abrirMenu({ titulo: (topico ? 'Tópico: ' : '') + tituloDaNota(nota), x, y, itens, aposSoltar });
}

export { avisarDesfazer };
