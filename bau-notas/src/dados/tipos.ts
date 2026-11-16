/**
 * Modelo de dados do Baú.
 *
 * Nota e nó são coisas diferentes: a nota guarda o conteúdo; o nó é a posição
 * dela dentro de uma árvore. A mesma nota pode estar em vários nós (de uma ou
 * de várias árvores) sem duplicar o conteúdo.
 */

/** Tipo de nota (Doença, Medicamento, Exame…). Nome, cor e ícone são editáveis. */
export interface TipoNota {
  id: string;
  nome: string;
  /** Cor em hexadecimal, ex.: "#D64545". */
  cor: string;
  /** Chave do ícone em src/ui/icones.ts. */
  icone: string;
  ordem: number;
  /** Tipos que já vêm com o app. O tipo "geral" não pode ser excluído. */
  padrao: boolean;
}

/** Dados leves da nota, mantidos em memória para todas as notas. */
export interface NotaMeta {
  id: string;
  titulo: string;
  tipoId: string;
  /**
   * Tópico: só organiza o ramo ("Exames", "Tratamento"). Tem título, mas não
   * tem texto, não abre o editor e não entra na busca de notas.
   */
  topico: boolean;
  criadaEm: number;
  atualizadaEm: number;
  /** Preenchido quando a nota está na lixeira. */
  excluidaEm: number | null;
}

/** Nota completa, com o conteúdo do editor. Carregada só quando a nota é aberta. */
export interface Nota extends NotaMeta {
  /** JSON do editor (documento ProseMirror/TipTap). Vazio = nota em branco. */
  conteudo: string;
  /** Texto puro extraído do conteúdo, usado na busca. */
  texto: string;
}

export interface Arvore {
  id: string;
  nome: string;
  /** Nó raiz da árvore. */
  raizId: string;
  ordem: number;
  criadaEm: number;
  excluidaEm: number | null;
}

export interface No {
  id: string;
  arvoreId: string;
  notaId: string;
  /** null apenas na raiz. */
  paiId: string | null;
  /** Posição entre os irmãos (0, 1, 2…). */
  ordem: number;
  /** Texto escrito sobre a linha que chega ao nó, ex.: "se troponina +", "30%". */
  rotuloDoRamo: string | null;
  /** Filhos escondidos. */
  recolhido: boolean;
}

export const TIPO_GERAL = 'geral';

/** Tipos que vêm com o app. Os ids são fixos; nome, cor e ícone podem ser editados. */
export const TIPOS_PADRAO: TipoNota[] = [
  { id: 'doenca', nome: 'Doença', cor: '#D64545', icone: 'coracao', ordem: 0, padrao: true },
  { id: 'medicamento', nome: 'Medicamento', cor: '#2F7ED8', icone: 'comprimido', ordem: 1, padrao: true },
  { id: 'exame', nome: 'Exame', cor: '#2E9E6B', icone: 'frasco', ordem: 2, padrao: true },
  { id: 'estudo', nome: 'Estudo/Artigo', cor: '#8A5CD6', icone: 'livro', ordem: 3, padrao: true },
  { id: 'sintoma', nome: 'Sintoma', cor: '#D98A1F', icone: 'termometro', ordem: 4, padrao: true },
  { id: 'conduta', nome: 'Conduta/Procedimento', cor: '#1F9EA8', icone: 'prancheta', ordem: 5, padrao: true },
  { id: TIPO_GERAL, nome: 'Geral', cor: '#6B7785', icone: 'documento', ordem: 6, padrao: true },
];
