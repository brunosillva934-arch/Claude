/**
 * Menção a outra nota dentro do texto.
 *
 * O documento guarda só o id da nota citada. O "chip" mostra sempre o título
 * e a cor atuais dela: renomear ou mudar o tipo da nota atualiza todos os
 * links, e nenhum link quebra.
 */
import { Node, mergeAttributes } from '@tiptap/core';
import { abrirNota, tituloDaNota, useLoja } from '../estado/loja';
import { coresDoTipo } from '../util/cores';
import { NO_MENCAO } from './documento';

interface Chip {
  dom: HTMLElement;
  notaId: string;
}

const vivos = new Set<Chip>();
let observando = false;

function pintar(chip: Chip): void {
  const s = useLoja.getState();
  const nota = s.notas[chip.notaId];
  const tipo = nota ? s.tipos[nota.tipoId] : undefined;
  const cores = coresDoTipo(tipo?.cor ?? '#6B7785', s.escuro);
  const texto = nota ? tituloDaNota(nota) : 'Nota removida';
  if (chip.dom.textContent !== texto) chip.dom.textContent = texto;
  chip.dom.style.setProperty('--cor', cores.base);
  chip.dom.style.setProperty('--cor-fraca', cores.fraca);
  chip.dom.style.setProperty('--cor-texto', cores.texto);
  chip.dom.classList.toggle('ausente', !nota || nota.excluidaEm !== null);
}

function observar(): void {
  if (observando) return;
  observando = true;
  let anterior = useLoja.getState();
  useLoja.subscribe((s) => {
    if (s.notas !== anterior.notas || s.tipos !== anterior.tipos || s.escuro !== anterior.escuro) {
      for (const chip of vivos) pintar(chip);
    }
    anterior = s;
  });
}

export const Mencao = Node.create({
  name: NO_MENCAO,
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      notaId: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-nota-id'),
        renderHTML: (attrs) => ({ 'data-nota-id': attrs.notaId as string }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-nota-id]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const nota = useLoja.getState().notas[node.attrs.notaId as string];
    return ['span', mergeAttributes({ class: 'mencao' }, HTMLAttributes), tituloDaNota(nota)];
  },

  renderText({ node }) {
    return tituloDaNota(useLoja.getState().notas[node.attrs.notaId as string]);
  },

  addNodeView() {
    return ({ node }) => {
      observar();
      const dom = document.createElement('span');
      dom.className = 'mencao';
      dom.contentEditable = 'false';
      const chip: Chip = { dom, notaId: String(node.attrs.notaId ?? '') };
      dom.setAttribute('data-nota-id', chip.notaId);
      vivos.add(chip);
      pintar(chip);
      dom.addEventListener('click', (e) => {
        e.preventDefault();
        if (useLoja.getState().notas[chip.notaId]) abrirNota(chip.notaId);
      });
      return {
        dom,
        update(novo) {
          if (novo.type.name !== NO_MENCAO) return false;
          chip.notaId = String(novo.attrs.notaId ?? '');
          dom.setAttribute('data-nota-id', chip.notaId);
          pintar(chip);
          return true;
        },
        ignoreMutation: () => true,
        destroy() {
          vivos.delete(chip);
        },
      };
    };
  },
});
