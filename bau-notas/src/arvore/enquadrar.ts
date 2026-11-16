/**
 * "Ver tudo": calcula o zoom e a posição em que a árvore inteira cabe na área
 * visível.
 *
 * A conta é própria (em vez do fitView do React Flow) porque, com o zoom
 * reduzido, os títulos são desenhados em tamanho constante e passam da largura
 * do nó: o enquadramento precisa contar com eles, senão as folhas da última
 * coluna ficam cortadas na borda.
 */
import type { No, NotaMeta } from '../dados/tipos';
import { tituloDaNota } from '../estado/loja';
import { LARGURA_NO, filhosVisiveis, type Disposicao } from './layout';
import { ZOOM_DE_LONGE, larguraDoResumoDeLonge, larguraDoTituloDeLonge } from './RotulosDeLonge';

export interface Enquadramento {
  x: number;
  y: number;
  zoom: number;
}

/** Embaixo sobra a faixa dos botões fixos ("Ver tudo", zoom), para nada ficar atrás deles. */
const MARGEM = { topo: 22, direita: 28, base: 76, esquerda: 24 };

export function enquadrarTudo(
  d: Disposicao,
  nos: Record<string, No>,
  notas: Record<string, NotaMeta>,
  largura: number,
  altura: number,
  zoomMinimo: number,
  zoomMaximo: number,
): Enquadramento | null {
  if (d.ordem.length === 0 || largura <= 0 || altura <= 0) return null;
  const livreH = Math.max(largura - MARGEM.esquerda - MARGEM.direita, 40);
  const livreV = Math.max(altura - MARGEM.topo - MARGEM.base, 40);

  // Só as folhas têm o título solto para a direita; os demais ficam dentro da própria coluna.
  const folhas: Array<[number, number]> = [];
  let ultimaColuna = 0;
  for (const id of d.ordem) {
    const p = d.posicoes.get(id)!;
    if (p.x > ultimaColuna) ultimaColuna = p.x;
    if (filhosVisiveis(nos, id).length === 0) {
      const no = nos[id];
      const nota = no ? notas[no.notaId] : undefined;
      // Um tópico pode ter, embaixo do nome, a recomendação, às vezes mais larga que ele.
      const resumo = nota?.topico ? nota.resumo.trim() : '';
      folhas.push([
        p.x,
        Math.max(larguraDoTituloDeLonge(tituloDaNota(nota), p.nivel), larguraDoResumoDeLonge(resumo)),
      ]);
    }
  }
  /** Largura, em pixels de tela, que a árvore ocupa com o zoom dado. */
  const extensao = (zoom: number): number => {
    let fim = (ultimaColuna + LARGURA_NO) * zoom;
    if (zoom < ZOOM_DE_LONGE) {
      for (const [x, titulo] of folhas) {
        if (x * zoom + titulo > fim) fim = x * zoom + titulo;
      }
    }
    return fim;
  };
  const maiorQueCabe = (de: number, ate: number): number | null => {
    if (ate < de) return null;
    if (extensao(ate) <= livreH) return ate;
    if (extensao(de) > livreH) return null;
    let a = de;
    let b = ate;
    for (let i = 0; i < 24; i++) {
      const meio = (a + b) / 2;
      if (extensao(meio) <= livreH) a = meio;
      else b = meio;
    }
    return a;
  };

  const porAltura = Math.min(zoomMaximo, livreV / d.altura);
  // Primeiro tenta sem entrar no modo "de longe"; se não der, procura abaixo dele.
  let zoom = maiorQueCabe(ZOOM_DE_LONGE, porAltura);
  if (zoom === null) zoom = maiorQueCabe(zoomMinimo, Math.min(porAltura, ZOOM_DE_LONGE - 0.0005));
  if (zoom === null) zoom = zoomMinimo;

  return {
    zoom,
    x: MARGEM.esquerda + Math.max(0, (livreH - extensao(zoom)) / 2),
    y: MARGEM.topo + Math.max(0, (livreV - d.altura * zoom) / 2),
  };
}
