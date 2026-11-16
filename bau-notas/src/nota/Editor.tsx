/**
 * Editor de texto da nota (TipTap/ProseMirror).
 *
 * Etapa 1: formatação essencial. A barra completa, o sumário e o modo foco
 * entram na etapa 2; a base de estabilidade já está aqui:
 *  - o editor não é controlado pelo React: digitar não redesenha o app
 *    (`shouldRerenderOnTransaction: false`);
 *  - há um único contêiner de rolagem, o da nota (ver PainelNota);
 *  - o salvamento é adiado e fica fora do caminho da digitação.
 */
import { useEffect, type ReactNode } from 'react';
import { EditorContent, useEditor, useEditorState, type Editor as EditorTipTap } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Placeholder } from '@tiptap/extensions';
import {
  Bold, Heading1, Heading2, Heading3, Italic, List, ListOrdered, Quote, Redo2, Strikethrough, Underline, Undo2,
  type LucideIcon,
} from 'lucide-react';
import { lerDocumento } from './documento';
import { Mencao } from './mencao';
import { gravarNota, marcarAlterada } from './salvamento';

interface Botao {
  id: string;
  rotulo: string;
  icone: LucideIcon;
  ativo?: (e: EditorTipTap) => boolean;
  disponivel?: (e: EditorTipTap) => boolean;
  executar: (e: EditorTipTap) => void;
  separadorAntes?: boolean;
}

const BOTOES: Botao[] = [
  { id: 'desfazer', rotulo: 'Desfazer', icone: Undo2, disponivel: (e) => e.can().undo(), executar: (e) => e.chain().focus().undo().run() },
  { id: 'refazer', rotulo: 'Refazer', icone: Redo2, disponivel: (e) => e.can().redo(), executar: (e) => e.chain().focus().redo().run() },
  { id: 'negrito', rotulo: 'Negrito', icone: Bold, ativo: (e) => e.isActive('bold'), executar: (e) => e.chain().focus().toggleBold().run(), separadorAntes: true },
  { id: 'italico', rotulo: 'Itálico', icone: Italic, ativo: (e) => e.isActive('italic'), executar: (e) => e.chain().focus().toggleItalic().run() },
  { id: 'sublinhado', rotulo: 'Sublinhado', icone: Underline, ativo: (e) => e.isActive('underline'), executar: (e) => e.chain().focus().toggleUnderline().run() },
  { id: 'tachado', rotulo: 'Tachado', icone: Strikethrough, ativo: (e) => e.isActive('strike'), executar: (e) => e.chain().focus().toggleStrike().run() },
  { id: 'h1', rotulo: 'Título 1', icone: Heading1, ativo: (e) => e.isActive('heading', { level: 1 }), executar: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(), separadorAntes: true },
  { id: 'h2', rotulo: 'Título 2', icone: Heading2, ativo: (e) => e.isActive('heading', { level: 2 }), executar: (e) => e.chain().focus().toggleHeading({ level: 2 }).run() },
  { id: 'h3', rotulo: 'Título 3', icone: Heading3, ativo: (e) => e.isActive('heading', { level: 3 }), executar: (e) => e.chain().focus().toggleHeading({ level: 3 }).run() },
  { id: 'marcadores', rotulo: 'Lista com marcadores', icone: List, ativo: (e) => e.isActive('bulletList'), executar: (e) => e.chain().focus().toggleBulletList().run(), separadorAntes: true },
  { id: 'numerada', rotulo: 'Lista numerada', icone: ListOrdered, ativo: (e) => e.isActive('orderedList'), executar: (e) => e.chain().focus().toggleOrderedList().run() },
  { id: 'citacao', rotulo: 'Citação', icone: Quote, ativo: (e) => e.isActive('blockquote'), executar: (e) => e.chain().focus().toggleBlockquote().run() },
];

function BarraDoEditor({ editor }: { editor: EditorTipTap }) {
  // Só a barra acompanha o estado do editor, e só redesenha quando algum botão muda.
  const estado = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      BOTOES.map((b) => (b.ativo?.(e) ? 'a' : '') + (b.disponivel && !b.disponivel(e) ? 'd' : '')).join('|'),
  });
  const marcas = estado.split('|');
  return (
    <div className="barra-editor" role="toolbar" aria-label="Formatação">
      {BOTOES.map((b, i) => {
        const Icone = b.icone;
        return (
          <button
            key={b.id}
            type="button"
            tabIndex={-1}
            className={'botao-editor' + (marcas[i]?.includes('a') ? ' ativo' : '') + (b.separadorAntes ? ' com-separador' : '')}
            disabled={marcas[i]?.includes('d')}
            aria-label={b.rotulo}
            aria-pressed={marcas[i]?.includes('a')}
            data-comando={b.id}
            // O botão não pode roubar o foco do texto: o teclado fecharia e a tela mudaria de tamanho.
            onPointerDown={(e) => e.preventDefault()}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => b.executar(editor)}
          >
            <Icone size={22} />
          </button>
        );
      })}
    </div>
  );
}

/**
 * Corpo da nota: a barra de formatação, fixa, e logo abaixo o único contêiner
 * de rolagem, com o título e o texto.
 */
export function CorpoDaNota({ notaId, conteudo, titulo }: { notaId: string; conteudo: string; titulo: ReactNode }) {
  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3, 4] },
          link: false,
        }),
        Placeholder.configure({ placeholder: 'Escreva aqui…' }),
        Mencao,
      ],
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
        // O cursor é mantido afastado das bordas da área visível, e a rolagem
        // só acontece quando ele chega perto delas (sem animação).
        scrollThreshold: { top: 56, bottom: 96, left: 0, right: 0 },
        scrollMargin: { top: 56, bottom: 96, left: 0, right: 0 },
      },
      onUpdate: ({ editor: e }) => marcarAlterada(notaId, e.state.doc),
    },
    [notaId],
  );

  // Ao trocar de nota ou fechar o painel, grava o que estiver pendente.
  useEffect(() => () => gravarNota(notaId), [notaId]);

  return (
    <>
      {/* Fora da rolagem: a barra não muda de lugar nem de altura quando o teclado abre. */}
      <div className="nota-barra">{editor && <BarraDoEditor editor={editor} />}</div>
      <div className="nota-rolagem">
        <div
          className="nota-pagina"
          onClick={(e) => {
            // Tocar no espaço livre abaixo do texto põe o cursor no fim.
            if (e.target === e.currentTarget && editor) editor.chain().focus('end').run();
          }}
        >
          {titulo}
          {editor && <EditorContent editor={editor} className="editor-conteudo" />}
        </div>
      </div>
    </>
  );
}
