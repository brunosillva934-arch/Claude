/**
 * Leituras do estado para os testes automáticos no navegador.
 * Este arquivo não entra no pacote do APK.
 */
import { dispor } from '../arvore/layout';
import { filhosDe, ramoDe, tituloDaNota, useLoja } from '../estado/loja';

declare global {
  interface Window {
    __bauTeste: {
      filhosDe(titulo: string): string[];
      totalNos(): number;
      nosDaArvoreAtual(): number;
      nosVisiveis(): number;
      tipoDe(titulo: string): string | null;
      topicosDaArvoreAtual(): string[];
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
  /** Títulos dos tópicos da árvore atual, em ordem alfabética. */
  topicosDaArvoreAtual() {
    const s = useLoja.getState();
    const arvore = s.arvoreAtualId ? s.arvores[s.arvoreAtualId] : undefined;
    if (!arvore) return [];
    return ramoDe(s.nos, arvore.raizId)
      .map((id) => s.notas[s.nos[id]!.notaId]!)
      .filter((n) => n.topico)
      .map((n) => n.titulo)
      .sort();
  },
  /** Nós da árvore atual que não estão dentro de um ramo recolhido. */
  nosVisiveis() {
    const s = useLoja.getState();
    const arvore = s.arvoreAtualId ? s.arvores[s.arvoreAtualId] : undefined;
    return arvore ? dispor(s.nos, arvore.raizId).ordem.length : 0;
  },
  nosDaArvoreAtual() {
    const s = useLoja.getState();
    const arvore = s.arvoreAtualId ? s.arvores[s.arvoreAtualId] : undefined;
    return arvore ? ramoDe(s.nos, arvore.raizId).length : 0;
  },
};
