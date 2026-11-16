/**
 * Pilha do botão "voltar".
 *
 * Tudo o que abre por cima de outra coisa (menu, diálogo, gaveta, nota em tela
 * cheia, edição de título…) empilha aqui a função que o fecha. O voltar do
 * Android fecha sempre o item do topo, um nível por vez. Com a pilha vazia, o
 * app pede um segundo toque antes de ir para segundo plano: nunca fecha de
 * repente.
 */
import { useEffect, useRef } from 'react';
import { aoEvento, minimizarApp, temNativo } from '../nativo/ponte';
import { avisar } from '../ui/servico';

interface Camada {
  id: number;
  fechar: () => void;
}

const pilha: Camada[] = [];
let proximoId = 1;
let ultimoVoltarNaBase = 0;

/** Empilha uma camada. Devolve a função que a retira (sem chamá-la). */
export function empilhar(fechar: () => void): () => void {
  const camada: Camada = { id: proximoId++, fechar };
  pilha.push(camada);
  return () => {
    const i = pilha.indexOf(camada);
    if (i >= 0) pilha.splice(i, 1);
  };
}

/** Fecha a camada do topo. Devolve false se não havia nada para fechar. */
export function voltar(): boolean {
  const topo = pilha.pop();
  if (!topo) return false;
  topo.fechar();
  return true;
}

export function haCamadas(): boolean {
  return pilha.length > 0;
}

/** Enquanto `ativo` for verdadeiro, o voltar chama `fechar`. */
export function useVoltar(ativo: boolean, fechar: () => void): void {
  const ref = useRef(fechar);
  ref.current = fechar;
  useEffect(() => {
    if (!ativo) return;
    return empilhar(() => ref.current());
  }, [ativo]);
}

/** Liga o botão voltar do Android (e a tecla Esc, no navegador) à pilha. */
export function ligarVoltar(): void {
  aoEvento('voltar', () => {
    if (voltar()) return true;
    const agora = Date.now();
    if (agora - ultimoVoltarNaBase < 2500) {
      ultimoVoltarNaBase = 0;
      minimizarApp();
      return true;
    }
    ultimoVoltarNaBase = agora;
    avisar('Toque em voltar de novo para sair');
    return true;
  });
  if (!temNativo) {
    // No navegador não há botão voltar: Alt+seta para a esquerda faz o mesmo papel nos testes.
    window.addEventListener('keydown', (e) => {
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        window.__bau.voltar();
      }
    });
  }
}
