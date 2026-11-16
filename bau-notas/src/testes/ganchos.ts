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
