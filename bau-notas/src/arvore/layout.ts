/**
 * Disposição da árvore: raiz à esquerda, ramos abrindo para a direita, como
 * numa árvore de probabilidade.
 *
 * Usei um algoritmo próprio em vez de dagre/ELK porque, para uma árvore, ele é
 * linear no número de nós, mantém a ordem dos irmãos exatamente como o usuário
 * definiu e reserva em cada coluna o espaço que os rótulos dos ramos precisam.
 */
import type { No, NotaMeta } from '../dados/tipos';
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
  /** Altura do cartão: maior nos tópicos com recomendação. */
  altura: number;
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

/** Altura de cada linha da recomendação de um tópico, no cartão. */
export const ALTURA_LINHA_RESUMO = 17;
/** Letras que cabem, em média, numa linha da recomendação dentro do cartão. */
const LETRAS_POR_LINHA = 20;

/** Quantas linhas a recomendação ocupa no cartão (de 0 a 3; o resto vira "…"). */
export function linhasDoResumo(nota: NotaMeta | undefined): number {
  const texto = nota?.topico ? nota.resumo.trim() : '';
  return texto ? Math.min(3, Math.ceil(texto.length / LETRAS_POR_LINHA)) : 0;
}

/** Altura do cartão de uma nota na árvore. */
export function alturaDoCartao(nota: NotaMeta | undefined): number {
  return ALTURA_NO + linhasDoResumo(nota) * ALTURA_LINHA_RESUMO;
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

/** Espaço vertical entre duas árvores da mesma tela. */
export const ESPACO_ENTRE_ARVORES = 72;

/**
 * Dispõe uma ou mais árvores na mesma tela, uma embaixo da outra, com as
 * colunas alinhadas. `alturaDe` dá a altura de cada cartão; sem ela, todos têm
 * a altura padrão.
 */
export function dispor(
  nos: Record<string, No>,
  raiz: string | readonly string[],
  alturaDe: (id: string) => number = () => ALTURA_NO,
): Disposicao {
  const raizes = (typeof raiz === 'string' ? [raiz] : raiz).filter((id) => nos[id]);
  if (raizes.length === 0) return DISPOSICAO_VAZIA;

  // 1ª passada: ordem de leitura, nível de cada nó e o vão que cada coluna precisa.
  const ordem: string[] = [];
  const nivel = new Map<string, number>();
  const vaos: number[] = [];
  const pilha: Array<[string, number]> = raizes.map((id) => [id, 0] as [string, number]).reverse();
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

  // 2ª passada (de trás para a frente, filhos antes dos pais): a faixa vertical
  // que cada ramo precisa, isto é, o maior entre o próprio cartão e a pilha dos filhos.
  const altura = new Map<string, number>();
  const faixa = new Map<string, number>();
  for (let i = ordem.length - 1; i >= 0; i--) {
    const id = ordem[i]!;
    const h = alturaDe(id);
    altura.set(id, h);
    const f = filhosVisiveis(nos, id);
    let pilhaDosFilhos = 0;
    for (const filho of f) pilhaDosFilhos += faixa.get(filho)!;
    if (f.length > 1) pilhaDosFilhos += ESPACO_V * (f.length - 1);
    faixa.set(id, Math.max(h, pilhaDosFilhos));
  }

  // 3ª passada (de cima para baixo): cada árvore e cada ramo recebem o topo da
  // sua faixa; os filhos se empilham dentro dela, centrados.
  const topoDaFaixa = new Map<string, number>();
  let topoDaArvore = 0;
  for (const id of raizes) {
    topoDaFaixa.set(id, topoDaArvore);
    topoDaArvore += faixa.get(id)! + ESPACO_ENTRE_ARVORES;
  }
  for (const id of ordem) {
    const f = filhosVisiveis(nos, id);
    if (f.length === 0) continue;
    let pilhaDosFilhos = ESPACO_V * (f.length - 1);
    for (const filho of f) pilhaDosFilhos += faixa.get(filho)!;
    let cursor = topoDaFaixa.get(id)! + (faixa.get(id)! - pilhaDosFilhos) / 2;
    for (const filho of f) {
      topoDaFaixa.set(filho, cursor);
      cursor += faixa.get(filho)! + ESPACO_V;
    }
  }

  // 4ª passada (de baixo para cima): cada pai fica centrado entre o primeiro e o
  // último filho, como numa árvore de probabilidade.
  const posicoes = new Map<string, PosicaoNo>();
  for (let i = ordem.length - 1; i >= 0; i--) {
    const id = ordem[i]!;
    const h = altura.get(id)!;
    const topo = topoDaFaixa.get(id)!;
    const base = topo + faixa.get(id)!;
    const f = filhosVisiveis(nos, id);
    let y: number;
    if (f.length === 0) {
      y = topo + (base - topo - h) / 2;
    } else {
      const primeiro = posicoes.get(f[0]!)!;
      const ultimo = posicoes.get(f[f.length - 1]!)!;
      const centro = (primeiro.y + primeiro.altura / 2 + ultimo.y + ultimo.altura / 2) / 2;
      y = Math.min(Math.max(centro - h / 2, topo), base - h);
    }
    posicoes.set(id, { x: xDoNivel[nivel.get(id)!]!, y, altura: h, nivel: nivel.get(id)!, topo, base });
  }

  return {
    posicoes,
    ordem,
    vaos,
    largura: xDoNivel[xDoNivel.length - 1]! + LARGURA_NO,
    altura: topoDaArvore - ESPACO_ENTRE_ARVORES,
  };
}
