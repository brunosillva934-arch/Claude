/**
 * Extensões do editor: o conjunto completo da nota e duas extensões próprias,
 * o recuo de parágrafos e a marcação do bloco em que o cursor está (para o
 * modo foco esmaecer os outros).
 */
import { Extension, type AnyExtension } from '@tiptap/core';
import type { EditorState, Transaction } from '@tiptap/pm/state';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import StarterKit from '@tiptap/starter-kit';
import { Placeholder } from '@tiptap/extensions';
import { TextStyleKit } from '@tiptap/extension-text-style';
import { Highlight } from '@tiptap/extension-highlight';
import { TextAlign } from '@tiptap/extension-text-align';
import { TableKit } from '@tiptap/extension-table';
import { Image } from '@tiptap/extension-image';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { TaskItem, TaskList } from '@tiptap/extension-list';
import { Mencao } from './mencao';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    recuo: {
      /** Recua o parágrafo (ou desce um nível na lista). */
      recuar: () => ReturnType;
      /** Desfaz o recuo (ou sobe um nível na lista). */
      desrecuar: () => ReturnType;
    };
  }
}

const MAX_RECUO = 8;
const BLOCOS_COM_RECUO = ['paragraph', 'heading'];

function mudarRecuo(state: EditorState, tr: Transaction, aplicar: boolean, delta: number): boolean {
  const { from, to } = state.selection;
  let mudou = false;
  state.doc.nodesBetween(from, to, (node, pos) => {
    if (BLOCOS_COM_RECUO.includes(node.type.name)) {
      const atual = Number(node.attrs.recuo) || 0;
      const novo = Math.max(0, Math.min(MAX_RECUO, atual + delta));
      if (novo !== atual) {
        if (aplicar) tr.setNodeMarkup(pos, undefined, { ...node.attrs, recuo: novo });
        mudou = true;
      }
      return false;
    }
    return true;
  });
  return mudou;
}

/** Recuo de parágrafos e títulos, como no Word (em listas, muda o nível do item). */
export const Recuo = Extension.create({
  name: 'recuo',
  addGlobalAttributes() {
    return [
      {
        types: BLOCOS_COM_RECUO,
        attributes: {
          recuo: {
            default: 0,
            parseHTML: (el) => Math.min(MAX_RECUO, Number(el.getAttribute('data-recuo')) || 0),
            renderHTML: (attrs) =>
              attrs.recuo ? { 'data-recuo': attrs.recuo, style: `margin-left: ${Number(attrs.recuo) * 2}em` } : {},
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      recuar:
        () =>
        ({ editor, commands, state, tr, dispatch }) => {
          if (editor.isActive('taskItem')) return commands.sinkListItem('taskItem');
          if (editor.isActive('listItem')) return commands.sinkListItem('listItem');
          return mudarRecuo(state, tr, Boolean(dispatch), 1);
        },
      desrecuar:
        () =>
        ({ editor, commands, state, tr, dispatch }) => {
          if (editor.isActive('taskItem')) return commands.liftListItem('taskItem');
          if (editor.isActive('listItem')) return commands.liftListItem('listItem');
          return mudarRecuo(state, tr, Boolean(dispatch), -1);
        },
    };
  },
  addKeyboardShortcuts() {
    return {
      Tab: () => this.editor.commands.recuar() || true,
      'Shift-Tab': () => this.editor.commands.desrecuar() || true,
    };
  },
});

/** Marca o bloco de primeiro nível em que o cursor está (classe "bloco-atual"). */
export const BlocoAtual = Extension.create({
  name: 'blocoAtual',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('blocoAtual'),
        props: {
          decorations(state) {
            const { $head } = state.selection;
            if ($head.depth < 1) return null;
            const pos = $head.before(1);
            const node = state.doc.nodeAt(pos);
            if (!node) return null;
            return DecorationSet.create(state.doc, [Decoration.node(pos, pos + node.nodeSize, { class: 'bloco-atual' })]);
          },
        },
      }),
    ];
  },
});

/** Todas as extensões do editor da nota. */
export function extensoesDaNota(): AnyExtension[] {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3, 4] },
      link: false,
    }),
    Placeholder.configure({ placeholder: 'Escreva aqui…' }),
    TextStyleKit.configure({ backgroundColor: false, lineHeight: false }),
    Highlight.configure({ multicolor: true }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    TableKit.configure({ table: { resizable: false } }),
    Image.configure({ inline: false, allowBase64: true }),
    Subscript,
    Superscript,
    TaskList,
    TaskItem.configure({ nested: true }),
    Recuo,
    BlocoAtual,
    Mencao,
  ];
}
