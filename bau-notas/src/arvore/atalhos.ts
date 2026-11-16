/**
 * Atalhos com teclado físico, válidos na árvore e na lista:
 *   Tab       cria um filho do nó selecionado
 *   Enter     cria um irmão
 *   F2        renomeia
 *   Espaço    recolhe / expande
 *   Delete    exclui (com confirmação)
 *   Setas     andam pela árvore
 *   Ctrl+Z    desfaz a última movimentação ou exclusão
 */
import { useEffect } from 'react';
import {
  alternarRecolhido, criarFilho, criarIrmao, desfazer, editarTitulo, expandirNota, filhosDe, pedirRevelar,
  selecionar, useLoja,
} from '../estado/loja';
import { avisar, useUi } from '../ui/servico';
import { pedirExclusao } from './acoesNo';
import { dispor } from './layout';

function campoEmFoco(): boolean {
  const el = document.activeElement as HTMLElement | null;
  if (!el) return false;
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable;
}

function irPara(id: string | undefined): void {
  if (!id) return;
  selecionar(id);
  pedirRevelar(id);
}

function andar(tecla: string): void {
  const s = useLoja.getState();
  const arvore = s.arvoreAtualId ? s.arvores[s.arvoreAtualId] : undefined;
  if (!arvore) return;
  const atual = s.selecionadoId ? s.nos[s.selecionadoId] : undefined;
  if (!atual) {
    irPara(arvore.raizId);
    return;
  }
  if (s.visao === 'lista') {
    const ordem = dispor(s.nos, arvore.raizId).ordem;
    const i = ordem.indexOf(atual.id);
    if (tecla === 'ArrowUp') irPara(ordem[i - 1]);
    else if (tecla === 'ArrowDown') irPara(ordem[i + 1]);
    else if (tecla === 'ArrowLeft') {
      if (!atual.recolhido && filhosDe(s.nos, atual.id).length > 0) alternarRecolhido(atual.id);
      else irPara(atual.paiId ?? undefined);
    } else if (tecla === 'ArrowRight') {
      if (atual.recolhido) alternarRecolhido(atual.id);
      else irPara(filhosDe(s.nos, atual.id)[0]);
    }
    return;
  }
  if (tecla === 'ArrowLeft') {
    irPara(atual.paiId ?? undefined);
  } else if (tecla === 'ArrowRight') {
    if (atual.recolhido) alternarRecolhido(atual.id);
    const filhos = filhosDe(useLoja.getState().nos, atual.id);
    irPara(filhos[Math.floor((filhos.length - 1) / 2)]);
  } else {
    // Para cima e para baixo: o vizinho mais próximo na mesma coluna.
    const d = dispor(s.nos, arvore.raizId);
    const aqui = d.posicoes.get(atual.id);
    if (!aqui) return;
    const coluna = d.ordem.filter((id) => d.posicoes.get(id)!.nivel === aqui.nivel);
    const i = coluna.indexOf(atual.id);
    irPara(coluna[tecla === 'ArrowUp' ? i - 1 : i + 1]);
  }
}

export function useAtalhosDaArvore(ativo: boolean): void {
  useEffect(() => {
    if (!ativo) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (campoEmFoco()) return;
      const ui = useUi.getState();
      if (ui.menu || ui.dialogo) return;
      const s = useLoja.getState();
      if (s.gavetaAberta || s.tiposAbertos || s.notaExpandida) return;
      const sel = s.selecionadoId;

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        const feito = desfazer();
        avisar(feito ? `Desfeito: ${feito.toLowerCase()}` : 'Nada para desfazer');
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key.startsWith('Arrow')) {
        e.preventDefault();
        andar(e.key);
        return;
      }
      if (!sel || !s.nos[sel]) return;
      switch (e.key) {
        case 'Tab':
          e.preventDefault();
          criarFilho(sel);
          break;
        case 'Enter':
          e.preventDefault();
          if (e.shiftKey) expandirNota(true);
          else if (s.nos[sel]!.paiId) criarIrmao(sel);
          else criarFilho(sel);
          break;
        case 'F2':
          e.preventDefault();
          editarTitulo(sel);
          break;
        case ' ':
          e.preventDefault();
          alternarRecolhido(sel);
          break;
        case 'Delete':
          e.preventDefault();
          void pedirExclusao(sel);
          break;
        default:
      }
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [ativo]);
}
