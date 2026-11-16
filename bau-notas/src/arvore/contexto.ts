/**
 * O que os controladores de gesto precisam saber sobre a árvore que está na
 * tela: a instância do React Flow, a disposição atual e o elemento do canvas.
 * Preenchido por VisaoArvore.
 */
import type { ReactFlowInstance } from '@xyflow/react';
import type { Disposicao } from './layout';

export interface ContextoArvore {
  rf: ReactFlowInstance;
  disposicao: Disposicao;
  envoltorio: HTMLElement;
  /** Posiciona (ou esconde, com texto null) a etiqueta que segue o dedo ao arrastar. */
  moverFantasma: (x: number, y: number, texto: string | null) => void;
}

export const contexto: { atual: ContextoArvore | null } = { atual: null };
