/**
 * Disposição da árvore: raiz à esquerda, ramos abrindo para a direita, como
 * numa árvore de probabilidade.
 *
 * Usei um algoritmo próprio em vez de dagre/ELK porque, para uma árvore, ele é
 * linear no número de nós, mantém a ordem dos irmãos exatamente como o usuário
 * definiu e reserva em cada coluna o espaço que os rótulos dos ramos precisam.
 */
import type { No } from '../dados/tipos';
import { filhosDe } from '../estado/loja';

export const LARGURA_NO = 232;
export const ALTURA_NO = 56;
export const ESPACO_V = 12;
const VAO_MINIMO = 96;
const VAO_MAXIMO = 330;
/** Limite de caracteres do rótulo mostrados sobre a linha. */
export const MAX_ROTULO = 26;

export interface PosicaoNo {
  x: number;
  y: number;
  nivel: number;
  /** Faixa vertical ocupada pelo nó com todos os seus descendentes visíveis. */
  topo: number;
  base: number;
}

export interface Disposicao {
  posicoes: Map<string, PosicaoNo>;
  /** Nós visíveis em ordem de leitura (profundidade primeiro). */
  ordem: string[];
  /** Espaço horizontal entre a coluna de cada nível e a seguinte. */
  vaos: number[];
  largura: number;
  altura: number;
}

export const DISPOSICAO_VAZIA: Disposicao = { posicoes: new Map(), ordem: [], vaos: [], largura: 0, altura: 0 };

/** Largura estimada, em px, do rótulo de um ramo. */
export function larguraDoRotulo(rotulo: string | null): number {
  if (!rotulo) return 0;
  return Math.min(rotulo.length, MAX_ROTULO) * 7.1 + 22;
}

export function filhosVisiveis(nos: Record<string, No>, id: string): string[] {
  const no = nos[id];
  return !no || no.recolhido ? [] : filhosDe(nos, id);
}

export function dispor(nos: Record<string, No>, raizId: string): Disposicao {
  if (!nos[raizId]) return DISPOSICAO_VAZIA;

  // 1ª passada: ordem de leitura, nível de cada nó e o vão que cada coluna precisa.
  const ordem: string[] = [];
  const nivel = new Map<string, number>();
  const vaos: number[] = [];
  const pilha: Array<[string, number]> = [[raizId, 0]];
  while (pilha.length) {
    const [id, n] = pilha.pop()!;
    ordem.push(id);
    nivel.set(id, n);
    if (n > 0) {
      // O vão tem cerca do dobro da largura do rótulo: sobra espaço para ele continuar
      // legível, em tamanho constante, quando a árvore inteira é enquadrada na tela.
      const rotulo = larguraDoRotulo(nos[id]!.rotuloDoRamo);
      const precisa = rotulo ? Math.min(VAO_MAXIMO, Math.max(VAO_MINIMO, rotulo * 2 + 34)) : VAO_MINIMO;
      if ((vaos[n - 1] ?? 0) < precisa) vaos[n - 1] = precisa;
    }
    const f = filhosVisiveis(nos, id);
    for (let i = f.length - 1; i >= 0; i--) pilha.push([f[i]!, n + 1]);
  }

  const xDoNivel: number[] = [0];
  for (let n = 1; n <= vaos.length; n++) {
    xDoNivel[n] = xDoNivel[n - 1]! + LARGURA_NO + (vaos[n - 1] ?? VAO_MINIMO);
  }

  // 2ª passada (de trás para a frente): as folhas empilham de cima para baixo e
  // cada pai fica centrado na altura dos filhos.
  const posicoes = new Map<string, PosicaoNo>();
  const passo = ALTURA_NO + ESPACO_V;
  // As folhas são numeradas na ordem de leitura.
  const linhaDaFolha = new Map<string, number>();
  let folhas = 0;
  for (const id of ordem) {
    if (filhosVisiveis(nos, id).length === 0) linhaDaFolha.set(id, folhas++);
  }
  for (let i = ordem.length - 1; i >= 0; i--) {
    const id = ordem[i]!;
    const n = nivel.get(id)!;
    const f = filhosVisiveis(nos, id);
    let y: number;
    let topo: number;
    let base: number;
    if (f.length === 0) {
      y = linhaDaFolha.get(id)! * passo;
      topo = y - ESPACO_V / 2;
      base = y + ALTURA_NO + ESPACO_V / 2;
    } else {
      const primeiro = posicoes.get(f[0]!)!;
      const ultimo = posicoes.get(f[f.length - 1]!)!;
      y = (primeiro.y + ultimo.y) / 2;
      topo = primeiro.topo;
      base = ultimo.base;
    }
    posicoes.set(id, { x: xDoNivel[n]!, y, nivel: n, topo, base });
  }

  return {
    posicoes,
    ordem,
    vaos,
    largura: xDoNivel[xDoNivel.length - 1]! + LARGURA_NO,
    altura: Math.max(folhas, 1) * passo - ESPACO_V,
  };
}
