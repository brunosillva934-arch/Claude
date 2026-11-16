/**
 * Sumário automático da nota, montado com os títulos (H1 a H4).
 *
 * Atualiza com atraso enquanto se escreve (textoVivo.ts) e fica fora da área de
 * texto: abrir, fechar ou atualizar o sumário nunca mexe no texto. Tocar num
 * item leva até o título; o item da seção em que se está fica destacado.
 */
import { useEffect, useState, type RefObject } from 'react';
import type { Editor } from '@tiptap/react';
import { ListTree, X } from 'lucide-react';
import { titulosDe, useTextoVivo } from './textoVivo';

/** Distância do topo da área de texto em que um título conta como "a seção atual". */
const LINHA_DE_LEITURA = 96;

function elementoDoTitulo(editor: Editor, pos: number): HTMLElement | null {
  const dom = editor.view.nodeDOM(pos);
  return dom instanceof HTMLElement ? dom : null;
}

export function Sumario({
  editor,
  rolagem,
  tipo,
  aoFechar,
}: {
  editor: Editor;
  rolagem: RefObject<HTMLDivElement | null>;
  tipo: 'fixo' | 'deslizante';
  aoFechar?: () => void;
}) {
  const { titulos } = useTextoVivo();
  const [atual, setAtual] = useState(-1);

  useEffect(() => {
    const caixa = rolagem.current;
    if (!caixa) return;
    let quadro = 0;
    const medir = () => {
      quadro = 0;
      const linha = caixa.getBoundingClientRect().top + LINHA_DE_LEITURA;
      let indice = -1;
      titulos.forEach((t, i) => {
        const el = elementoDoTitulo(editor, t.pos);
        if (el && el.getBoundingClientRect().top <= linha) indice = i;
      });
      setAtual(indice);
    };
    const aoRolar = () => {
      if (!quadro) quadro = requestAnimationFrame(medir);
    };
    medir();
    caixa.addEventListener('scroll', aoRolar, { passive: true });
    return () => {
      caixa.removeEventListener('scroll', aoRolar);
      cancelAnimationFrame(quadro);
    };
  }, [titulos, editor, rolagem]);

  const irPara = (indice: number) => {
    const caixa = rolagem.current;
    // As posições são lidas de novo na hora: o texto pode ter mudado desde o último cálculo.
    const titulo = titulosDe(editor.state.doc)[indice];
    if (!caixa || !titulo) return;
    const el = elementoDoTitulo(editor, titulo.pos);
    if (!el) return;
    caixa.scrollTop += el.getBoundingClientRect().top - caixa.getBoundingClientRect().top - 20;
    // Com o teclado aberto, o cursor vai junto (sem rolar de novo).
    if (editor.isFocused) editor.commands.setTextSelection(titulo.pos + 1 + titulo.texto.length);
    setAtual(indice);
    aoFechar?.();
  };

  return (
    <aside className={'sumario ' + tipo} aria-label="Sumário">
      <header className="sumario-topo">
        <ListTree size={18} />
        <span>Sumário</span>
        <span className="espaco" />
        {aoFechar && (
          <button
            type="button"
            className="botao-icone"
            aria-label="Fechar o sumário"
            onPointerDown={(e) => e.preventDefault()}
            onClick={aoFechar}
          >
            <X size={20} />
          </button>
        )}
      </header>
      <nav className="sumario-lista">
        {titulos.length === 0 ? (
          <p className="sumario-vazio">Os títulos (H1 a H4) da nota aparecem aqui.</p>
        ) : (
          titulos.map((t, i) => (
            <button
              key={i + ':' + t.pos}
              type="button"
              className={'sumario-item nivel-' + t.nivel + (i === atual ? ' atual' : '')}
              data-sumario={t.texto}
              aria-current={i === atual ? 'location' : undefined}
              // Não tira o foco do texto: o teclado não fecha.
              onPointerDown={(e) => e.preventDefault()}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => irPara(i)}
            >
              {t.texto}
            </button>
          ))
        )}
      </nav>
    </aside>
  );
}
