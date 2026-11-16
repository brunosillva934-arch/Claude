/**
 * Corpo da nota: barra de formatação, texto e sumário.
 *
 * Estabilidade da escrita (seção 11 da especificação):
 *  - um único contêiner de rolagem por nota (.nota-rolagem), sem textarea, sem
 *    rolagem aninhada e sem medir ou redimensionar nada a cada tecla;
 *  - espaço livre embaixo do texto (~45% da tela sem teclado), para o cursor
 *    nunca encostar na borda de baixo;
 *  - o editor não é controlado pelo React (`shouldRerenderOnTransaction: false`):
 *    digitar não redesenha o app; salvamento, contador e sumário vêm com atraso;
 *  - a rolagem que acompanha o cursor é a do próprio ProseMirror, e só acontece
 *    quando ele chega perto da borda (scrollThreshold), sem animação;
 *  - quando o teclado abre ou fecha, a janela muda de tamanho uma vez
 *    (adjustResize, ver AndroidManifest.xml); esperamos ela assentar e, se o
 *    cursor ficou escondido, rolamos uma única vez para mostrá-lo.
 */
import { useEffect, useRef, type ReactNode } from 'react';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import type { EditorView } from '@tiptap/pm/view';
import { fecharSumario, useLoja } from '../estado/loja';
import { useVoltar } from '../estado/navegacao';
import { BarraDoEditor } from './Barra';
import { limparHtmlColado } from './colar';
import { lerDocumento } from './documento';
import { extensoesDaNota } from './extensoes';
import { ControlesDoFoco } from './Foco';
import { gravarNota, marcarAlterada } from './salvamento';
import { Sumario } from './Sumario';
import { limparTexto, publicarTexto } from './textoVivo';

/** Margens, em px, em que o cursor é mantido longe das bordas da área de texto. */
const MARGEM_TOPO = 56;
const MARGEM_BASE = 96;
/** Espera, depois da última mudança de tamanho da janela, para ela assentar. */
const ESPERA_REDIMENSIONAR = 140;
const ESPERA_SUMARIO = 400;

/** Máquina de escrever: põe a linha do cursor no meio da área de texto. */
function centralizarCursor(view: EditorView, caixa: HTMLElement | null): void {
  if (!caixa) return;
  const cursor = view.coordsAtPos(view.state.selection.head);
  const area = caixa.getBoundingClientRect();
  const desvio = cursor.top - (area.top + area.height * 0.45);
  if (Math.abs(desvio) > 2) caixa.scrollTop += desvio;
}

/**
 * Depois de o teclado abrir ou fechar: se o cursor ficou fora da parte visível,
 * rola uma única vez, sem animação, só o necessário.
 */
function mostrarCursor(editor: Editor, caixa: HTMLElement | null, maquina: boolean): void {
  if (!caixa || !editor.isFocused) return;
  if (maquina) {
    centralizarCursor(editor.view, caixa);
    return;
  }
  const cursor = editor.view.coordsAtPos(editor.state.selection.head);
  const area = caixa.getBoundingClientRect();
  const vv = window.visualViewport;
  const fundoVisivel = Math.min(area.bottom, vv ? vv.offsetTop + vv.height : window.innerHeight);
  const limiteBaixo = fundoVisivel - MARGEM_BASE;
  const limiteAlto = area.top + MARGEM_TOPO;
  if (cursor.bottom > limiteBaixo) caixa.scrollTop += cursor.bottom - limiteBaixo;
  else if (cursor.top < limiteAlto) caixa.scrollTop -= limiteAlto - cursor.top;
}

export function CorpoDaNota({ notaId, conteudo, titulo }: { notaId: string; conteudo: string; titulo: ReactNode }) {
  const rolagem = useRef<HTMLDivElement>(null);
  const foco = useLoja((s) => s.foco);
  const esmaecer = useLoja((s) => s.foco && s.focoEsmaecer);
  const maquina = useLoja((s) => s.foco && s.focoMaquina);
  const telaCheia = useLoja((s) => s.notaExpandida && s.largo && !s.foco);
  const sumarioFixo = useLoja((s) => s.sumarioFixo);
  const sumarioAberto = useLoja((s) => s.sumarioAberto && !s.foco);
  const maquinaRef = useRef(maquina);
  maquinaRef.current = maquina;
  const temporizadorTexto = useRef(0);

  const editor = useEditor(
    {
      extensions: extensoesDaNota(),
      content: lerDocumento(conteudo) ?? '',
      immediatelyRender: true,
      shouldRerenderOnTransaction: false,
      editorProps: {
        attributes: {
          class: 'texto-nota',
          spellcheck: 'true',
          autocapitalize: 'sentences',
          'aria-label': 'Texto da nota',
        },
        scrollThreshold: { top: MARGEM_TOPO, bottom: MARGEM_BASE, left: 0, right: 0 },
        scrollMargin: { top: MARGEM_TOPO, bottom: MARGEM_BASE, left: 0, right: 0 },
        transformPastedHTML: limparHtmlColado,
        // No modo máquina de escrever, a linha atual fica no meio: essa rolagem
        // substitui a do ProseMirror (uma só por tecla, nunca as duas).
        handleScrollToSelection: (view) => {
          if (!maquinaRef.current) return false;
          centralizarCursor(view, rolagem.current);
          return true;
        },
      },
      onCreate: ({ editor: e }) => publicarTexto(notaId, e.state.doc),
      onUpdate: ({ editor: e }) => {
        marcarAlterada(notaId, e.state.doc);
        window.clearTimeout(temporizadorTexto.current);
        temporizadorTexto.current = window.setTimeout(() => publicarTexto(notaId, e.state.doc), ESPERA_SUMARIO);
      },
    },
    [notaId],
  );

  // Ao trocar de nota ou fechar o painel, grava o que estiver pendente.
  useEffect(
    () => () => {
      window.clearTimeout(temporizadorTexto.current);
      gravarNota(notaId);
      limparTexto(notaId);
    },
    [notaId],
  );

  // Teclado abrindo ou fechando (a janela muda de tamanho): uma correção, no fim.
  useEffect(() => {
    if (!editor) return;
    let t = 0;
    const aoMudar = () => {
      window.clearTimeout(t);
      t = window.setTimeout(() => mostrarCursor(editor, rolagem.current, maquinaRef.current), ESPERA_REDIMENSIONAR);
    };
    window.addEventListener('resize', aoMudar);
    window.visualViewport?.addEventListener('resize', aoMudar);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('resize', aoMudar);
      window.visualViewport?.removeEventListener('resize', aoMudar);
    };
  }, [editor]);

  // Testes automáticos no navegador (não entra no APK): acesso ao editor aberto.
  useEffect(() => {
    if (__ANDROID__ || !editor) return;
    (window as unknown as { __bauEditor?: Editor }).__bauEditor = editor;
  }, [editor]);

  // Ao ligar a máquina de escrever, a linha atual já vai para o meio.
  useEffect(() => {
    if (maquina && editor?.isFocused) centralizarCursor(editor.view, rolagem.current);
  }, [maquina, editor]);

  const sumarioDeslizante = !telaCheia && sumarioAberto;
  useVoltar(sumarioDeslizante, fecharSumario);

  return (
    <>
      {/* Fora da rolagem: a barra não muda de lugar nem de altura quando o teclado abre. */}
      {!foco && <div className="nota-barra">{editor && <BarraDoEditor editor={editor} />}</div>}
      <div
        className={
          'nota-corpo' + (foco ? ' em-foco' : '') + (esmaecer ? ' foco-esmaecer' : '') + (maquina ? ' foco-maquina' : '')
        }
      >
        <div className="nota-rolagem" ref={rolagem}>
          <div
            className="nota-pagina"
            onClick={(e) => {
              // Tocar no espaço livre abaixo do texto põe o cursor no fim.
              if (e.target === e.currentTarget && editor) editor.chain().focus('end').run();
            }}
          >
            {!foco && titulo}
            {editor && <EditorContent editor={editor} className="editor-conteudo" />}
          </div>
        </div>
        {editor && telaCheia && sumarioFixo && <Sumario editor={editor} rolagem={rolagem} tipo="fixo" />}
        {editor && sumarioDeslizante && (
          <>
            <div className="sumario-veu" onPointerDown={fecharSumario} />
            <Sumario editor={editor} rolagem={rolagem} tipo="deslizante" aoFechar={fecharSumario} />
          </>
        )}
        {foco && <ControlesDoFoco />}
      </div>
    </>
  );
}
