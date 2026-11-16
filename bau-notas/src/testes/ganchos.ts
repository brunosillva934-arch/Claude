/**
 * Leituras do estado para os testes automáticos no navegador.
 * Este arquivo não entra no pacote do APK.
 */
import { dispor } from '../arvore/layout';
import { filhosDe, nosDaArvore, raizesDe, tituloDaNota, useLoja } from '../estado/loja';

declare global {
  interface Window {
    __bauTeste: {
      filhosDe(titulo: string): string[];
      totalNos(): number;
      nosDaArvoreAtual(): number;
      nosVisiveis(): number;
      tipoDe(titulo: string): string | null;
      topicosDaArvoreAtual(): string[];
      raizes(): string[];
      rotulo(titulo: string): string;
      posicao(titulo: string): { x: number; y: number };
    };
  }
}

window.__bauTeste = {
  /** Títulos dos filhos do primeiro nó, da árvore atual, com esse título. */
  filhosDe(titulo) {
    const s = useLoja.getState();
    const no = Object.values(s.nos).find(
      (n) => n.arvoreId === s.arvoreAtualId && tituloDaNota(s.notas[n.notaId]) === titulo,
    );
    if (!no) return [];
    return filhosDe(s.nos, no.id).map((id) => tituloDaNota(s.notas[s.nos[id]!.notaId]));
  },
  totalNos() {
    return Object.keys(useLoja.getState().nos).length;
  },
  tipoDe(titulo) {
    const s = useLoja.getState();
    return Object.values(s.notas).find((n) => n.titulo === titulo)?.tipoId ?? null;
  },
  /** Títulos das árvores da tela atual, a principal primeiro. */
  raizes() {
    const s = useLoja.getState();
    const arvore = s.arvoreAtualId ? s.arvores[s.arvoreAtualId] : undefined;
    return raizesDe(s.nos, arvore).map((id) => tituloDaNota(s.notas[s.nos[id]!.notaId]));
  },
  rotulo(titulo) {
    const s = useLoja.getState();
    const no = Object.values(s.nos).find(
      (n) => n.arvoreId === s.arvoreAtualId && tituloDaNota(s.notas[n.notaId]) === titulo,
    );
    return no?.rotuloDoRamo ?? '';
  },
  /** Posição do nó na tela (coordenadas do canvas). */
  posicao(titulo) {
    const el = [...document.querySelectorAll<HTMLElement>('.react-flow__node')].find(
      (n) => n.querySelector<HTMLElement>('.no')?.dataset.titulo === titulo,
    );
    const m = el ? /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/.exec(el.style.transform) : null;
    return m ? { x: Number(m[1]), y: Number(m[2]) } : { x: NaN, y: NaN };
  },
  /** Títulos dos tópicos da árvore atual, em ordem alfabética. */
  topicosDaArvoreAtual() {
    const s = useLoja.getState();
    const arvore = s.arvoreAtualId ? s.arvores[s.arvoreAtualId] : undefined;
    if (!arvore) return [];
    return nosDaArvore(s.nos, arvore)
      .map((id) => s.notas[s.nos[id]!.notaId]!)
      .filter((n) => n.topico)
      .map((n) => n.titulo)
      .sort();
  },
  /** Nós da árvore atual que não estão dentro de um ramo recolhido. */
  nosVisiveis() {
    const s = useLoja.getState();
    const arvore = s.arvoreAtualId ? s.arvores[s.arvoreAtualId] : undefined;
    return arvore ? dispor(s.nos, raizesDe(s.nos, arvore)).ordem.length : 0;
  },
  nosDaArvoreAtual() {
    const s = useLoja.getState();
    const arvore = s.arvoreAtualId ? s.arvores[s.arvoreAtualId] : undefined;
    return arvore ? nosDaArvore(s.nos, arvore).length : 0;
  },
};
