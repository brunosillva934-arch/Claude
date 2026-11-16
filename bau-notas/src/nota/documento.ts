/**
 * Utilidades sobre o documento do editor (JSON do TipTap/ProseMirror) que não
 * dependem do editor estar aberto: extrair o texto para a busca e listar as
 * notas citadas.
 */

export interface NoDoc {
  type: string;
  attrs?: Record<string, unknown>;
  content?: NoDoc[];
  text?: string;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
}

/** Nome do nó de menção a outra nota. O link é guardado pelo id da nota. */
export const NO_MENCAO = 'mencao';

const BLOCOS = new Set([
  'paragraph', 'heading', 'blockquote', 'listItem', 'taskItem', 'codeBlock',
  'tableRow', 'tableCell', 'tableHeader', 'horizontalRule', 'bulletList', 'orderedList', 'taskList', 'table',
]);

export function lerDocumento(json: string): NoDoc | null {
  if (!json) return null;
  try {
    const d = JSON.parse(json) as NoDoc;
    return d && d.type === 'doc' ? d : null;
  } catch {
    return null;
  }
}

/** Texto puro do documento. As menções entram com o título atual da nota citada. */
export function textoDoDocumento(doc: NoDoc | null, tituloDe: (notaId: string) => string): string {
  if (!doc) return '';
  const partes: string[] = [];
  const andar = (n: NoDoc) => {
    if (n.type === 'text') {
      partes.push(n.text ?? '');
      return;
    }
    if (n.type === NO_MENCAO) {
      partes.push(tituloDe(String(n.attrs?.notaId ?? '')));
      return;
    }
    if (n.type === 'hardBreak') {
      partes.push('\n');
      return;
    }
    if (n.content) for (const f of n.content) andar(f);
    if (BLOCOS.has(n.type)) partes.push('\n');
  };
  andar(doc);
  return partes.join('').replace(/\n{2,}/g, '\n').trim();
}

/** Ids das notas citadas no documento, sem repetição. */
export function mencoesDoDocumento(doc: NoDoc | null): string[] {
  if (!doc) return [];
  const ids = new Set<string>();
  const andar = (n: NoDoc) => {
    if (n.type === NO_MENCAO) {
      const id = n.attrs?.notaId;
      if (typeof id === 'string' && id) ids.add(id);
    }
    if (n.content) for (const f of n.content) andar(f);
  };
  andar(doc);
  return [...ids];
}

export function contarPalavras(texto: string): number {
  const m = texto.trim().match(/\S+/g);
  return m ? m.length : 0;
}
