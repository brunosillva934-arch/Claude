/**
 * O que a interface mostra sobre o texto que está sendo escrito: o número de
 * palavras e os títulos (para o sumário). É recalculado com atraso, fora do
 * caminho da digitação, e quem mostra só redesenha quando algo muda.
 */
import { useSyncExternalStore } from 'react';
import type { Node as NoPm } from '@tiptap/pm/model';

export interface TituloDoSumario {
  nivel: number;
  texto: string;
  /** Posição do título no documento. */
  pos: number;
}

export interface TextoVivo {
  notaId: string | null;
  palavras: number;
  titulos: TituloDoSumario[];
}

let estado: TextoVivo = { notaId: null, palavras: 0, titulos: [] };
const ouvintes = new Set<() => void>();

function iguais(a: TextoVivo, b: TextoVivo): boolean {
  if (a.notaId !== b.notaId || a.palavras !== b.palavras || a.titulos.length !== b.titulos.length) return false;
  return a.titulos.every((t, i) => {
    const u = b.titulos[i]!;
    return t.nivel === u.nivel && t.texto === u.texto && t.pos === u.pos;
  });
}

/** Títulos do documento, de H1 a H4, na ordem em que aparecem. */
export function titulosDe(doc: NoPm): TituloDoSumario[] {
  const titulos: TituloDoSumario[] = [];
  doc.descendants((node, pos) => {
    if (node.type.name === 'heading') {
      const texto = node.textContent.trim();
      if (texto) titulos.push({ nivel: Number(node.attrs.level) || 1, texto, pos });
      return false;
    }
    // Títulos só existem em blocos; não vale descer em parágrafos.
    return !node.isTextblock;
  });
  return titulos;
}

export function palavrasDe(doc: NoPm): number {
  const texto = doc.textBetween(0, doc.content.size, ' ', ' ');
  const m = texto.match(/[\p{L}\p{N}]+(?:[-'’][\p{L}\p{N}]+)*/gu);
  return m ? m.length : 0;
}

export function publicarTexto(notaId: string, doc: NoPm): void {
  const novo: TextoVivo = { notaId, palavras: palavrasDe(doc), titulos: titulosDe(doc) };
  if (iguais(estado, novo)) return;
  estado = novo;
  for (const f of ouvintes) f();
}

export function limparTexto(notaId: string): void {
  if (estado.notaId !== notaId) return;
  estado = { notaId: null, palavras: 0, titulos: [] };
  for (const f of ouvintes) f();
}

function assinar(f: () => void): () => void {
  ouvintes.add(f);
  return () => ouvintes.delete(f);
}

export function useTextoVivo(): TextoVivo {
  return useSyncExternalStore(assinar, () => estado);
}
