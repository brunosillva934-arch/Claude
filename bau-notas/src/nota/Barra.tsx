/**
 * Barra de ferramentas do editor, no estilo do Word.
 *
 * Fica fora do contêiner de rolagem, com altura fixa: não se mexe quando o
 * teclado abre ou fecha. Os botões têm 48 dp e, se não couberem, a barra rola
 * na horizontal. Nenhum botão tira o foco do texto (o teclado não fecha).
 */
import { type ReactNode, type PointerEvent as EventoPonteiro } from 'react';
import { useEditorState, type Editor } from '@tiptap/react';
import {
  AlignCenter, AlignJustify, AlignLeft, AlignRight, Baseline, Bold, Camera, Focus, Heading1, Heading2, Heading3,
  Heading4, Highlighter, ImagePlus, Images, IndentDecrease, IndentIncrease, Italic, List, ListOrdered, ListTodo, Quote,
  Redo2, RemoveFormatting, SeparatorHorizontal, Strikethrough, Subscript, Superscript, Table, Trash2, Type, Underline,
  Undo2, type LucideIcon,
} from 'lucide-react';
import { entrarFoco } from '../estado/loja';
import { abrirMenu, avisar, type ItemMenu } from '../ui/servico';
import { escolherImagem } from './imagens';

export const FONTES = [
  { id: 'padrao', nome: 'Padrão (sem serifa)', valor: '' },
  { id: 'serifa', nome: 'Com serifa', valor: "'Source Serif 4', Georgia, serif" },
  { id: 'mono', nome: 'Monoespaçada', valor: "'JetBrains Mono', monospace" },
];

export const TAMANHOS = ['12px', '14px', '15px', '17px', '19px', '22px', '26px', '32px'];
const TAMANHO_PADRAO = '17px';

/** Cores de texto legíveis tanto no tema claro quanto no escuro. */
export const CORES = [
  { nome: 'Vermelho', valor: '#D64545' },
  { nome: 'Laranja', valor: '#E0662F' },
  { nome: 'Verde', valor: '#2E9E6B' },
  { nome: 'Azul', valor: '#2F7ED8' },
  { nome: 'Roxo', valor: '#8A5CD6' },
  { nome: 'Rosa', valor: '#C04FB5' },
  { nome: 'Marrom', valor: '#8C6D53' },
  { nome: 'Cinza', valor: '#6B7785' },
];

/** Marca-texto translúcido: funciona sobre fundo claro e escuro. */
export const MARCAS = [
  { nome: 'Amarelo', valor: 'rgba(255, 210, 0, 0.45)' },
  { nome: 'Verde', valor: 'rgba(60, 200, 110, 0.35)' },
  { nome: 'Azul', valor: 'rgba(70, 150, 255, 0.35)' },
  { nome: 'Rosa', valor: 'rgba(255, 90, 170, 0.32)' },
  { nome: 'Laranja', valor: 'rgba(255, 140, 40, 0.38)' },
];

const segurar = (e: EventoPonteiro | React.MouseEvent) => e.preventDefault();

function Botao(props: {
  id: string;
  rotulo: string;
  icone?: LucideIcon;
  ativo?: boolean;
  desativado?: boolean;
  separadorAntes?: boolean;
  aoTocar: (alvo: HTMLElement) => void;
  children?: ReactNode;
}) {
  const Icone = props.icone;
  return (
    <button
      type="button"
      tabIndex={-1}
      className={
        'botao-editor' +
        (props.ativo ? ' ativo' : '') +
        (props.separadorAntes ? ' com-separador' : '') +
        (props.children ? ' com-texto' : '')
      }
      disabled={props.desativado}
      aria-label={props.rotulo}
      title={props.rotulo}
      aria-pressed={props.ativo}
      data-comando={props.id}
      onPointerDown={segurar}
      onMouseDown={segurar}
      onClick={(e) => props.aoTocar(e.currentTarget)}
    >
      {Icone && <Icone size={22} />}
      {props.children}
    </button>
  );
}

function menuEm(alvo: HTMLElement, titulo: string, itens: ItemMenu[]): void {
  const r = alvo.getBoundingClientRect();
  abrirMenu({ titulo, x: Math.round(r.left), y: Math.round(r.bottom + 4), itens, manterFoco: true });
}

async function inserirImagem(editor: Editor, camera: boolean): Promise<void> {
  try {
    const src = await escolherImagem(camera);
    if (src) editor.chain().focus().setImage({ src }).run();
  } catch (e) {
    avisar(e instanceof Error ? e.message : 'Não foi possível abrir a imagem');
  }
}

/** Estado dos botões, numa única leitura: a barra só redesenha quando algo muda. */
function lerEstado(e: Editor) {
  const estilo = e.getAttributes('textStyle') as { fontSize?: string; fontFamily?: string; color?: string };
  return {
    desfazer: e.can().undo(),
    refazer: e.can().redo(),
    negrito: e.isActive('bold'),
    italico: e.isActive('italic'),
    sublinhado: e.isActive('underline'),
    tachado: e.isActive('strike'),
    h1: e.isActive('heading', { level: 1 }),
    h2: e.isActive('heading', { level: 2 }),
    h3: e.isActive('heading', { level: 3 }),
    h4: e.isActive('heading', { level: 4 }),
    marcadores: e.isActive('bulletList'),
    numerada: e.isActive('orderedList'),
    tarefas: e.isActive('taskList'),
    citacao: e.isActive('blockquote'),
    tabela: e.isActive('table'),
    sobrescrito: e.isActive('superscript'),
    subscrito: e.isActive('subscript'),
    marca: e.isActive('highlight'),
    alinhamento: (['center', 'right', 'justify'].find((a) => e.isActive({ textAlign: a })) ?? 'left') as string,
    tamanho: estilo.fontSize ?? '',
    fonte: estilo.fontFamily ?? '',
    cor: estilo.color ?? '',
  };
}

export function BarraDoEditor({ editor }: { editor: Editor }) {
  const st = useEditorState({ editor, selector: ({ editor: e }) => lerEstado(e), equalityFn: (a, b) => JSON.stringify(a) === JSON.stringify(b) });
  const c = () => editor.chain().focus();
  const IconeAlinhamento =
    st.alinhamento === 'center' ? AlignCenter : st.alinhamento === 'right' ? AlignRight : st.alinhamento === 'justify' ? AlignJustify : AlignLeft;

  return (
    <div className="barra-editor" role="toolbar" aria-label="Formatação">
      <Botao id="desfazer" rotulo="Desfazer (Ctrl+Z)" icone={Undo2} desativado={!st.desfazer} aoTocar={() => c().undo().run()} />
      <Botao id="refazer" rotulo="Refazer (Ctrl+Y)" icone={Redo2} desativado={!st.refazer} aoTocar={() => c().redo().run()} />

      <Botao
        id="fonte"
        rotulo="Fonte"
        icone={Type}
        separadorAntes
        ativo={Boolean(st.fonte)}
        aoTocar={(alvo) =>
          menuEm(
            alvo,
            'Fonte',
            FONTES.map((f) => ({
              id: 'fonte-' + f.id,
              rotulo: f.nome,
              marcado: (st.fonte || '') === f.valor,
              aoEscolher: () => (f.valor ? c().setFontFamily(f.valor).run() : c().unsetFontFamily().run()),
            })),
          )
        }
      />
      <Botao
        id="tamanho"
        rotulo="Tamanho da letra"
        aoTocar={(alvo) =>
          menuEm(
            alvo,
            'Tamanho da letra',
            TAMANHOS.map((t) => ({
              id: 'tamanho-' + t,
              rotulo: t.replace('px', '') + (t === TAMANHO_PADRAO ? ' (padrão)' : ''),
              marcado: (st.tamanho || TAMANHO_PADRAO) === t,
              aoEscolher: () => (t === TAMANHO_PADRAO ? c().unsetFontSize().run() : c().setFontSize(t).run()),
            })),
          )
        }
      >
        <span className="botao-editor-texto">{(st.tamanho || TAMANHO_PADRAO).replace('px', '')}</span>
      </Botao>

      <Botao id="negrito" rotulo="Negrito (Ctrl+B)" icone={Bold} separadorAntes ativo={st.negrito} aoTocar={() => c().toggleBold().run()} />
      <Botao id="italico" rotulo="Itálico (Ctrl+I)" icone={Italic} ativo={st.italico} aoTocar={() => c().toggleItalic().run()} />
      <Botao id="sublinhado" rotulo="Sublinhado (Ctrl+U)" icone={Underline} ativo={st.sublinhado} aoTocar={() => c().toggleUnderline().run()} />
      <Botao id="tachado" rotulo="Tachado" icone={Strikethrough} ativo={st.tachado} aoTocar={() => c().toggleStrike().run()} />
      <Botao
        id="cor"
        rotulo="Cor do texto"
        icone={Baseline}
        ativo={Boolean(st.cor)}
        aoTocar={(alvo) =>
          menuEm(alvo, 'Cor do texto', [
            { id: 'cor-padrao', rotulo: 'Automática', marcado: !st.cor, aoEscolher: () => c().unsetColor().run() },
            ...CORES.map((cor) => ({
              id: 'cor-' + cor.nome,
              rotulo: cor.nome,
              cor: cor.valor,
              marcado: st.cor.toLowerCase() === cor.valor.toLowerCase(),
              aoEscolher: () => c().setColor(cor.valor).run(),
            })),
          ])
        }
      />
      <Botao
        id="marca-texto"
        rotulo="Marca-texto"
        icone={Highlighter}
        ativo={st.marca}
        aoTocar={(alvo) =>
          menuEm(alvo, 'Marca-texto', [
            { id: 'marca-nenhuma', rotulo: 'Sem marca-texto', aoEscolher: () => c().unsetHighlight().run() },
            ...MARCAS.map((m) => ({
              id: 'marca-' + m.nome,
              rotulo: m.nome,
              cor: m.valor,
              aoEscolher: () => c().setHighlight({ color: m.valor }).run(),
            })),
          ])
        }
      />

      <Botao id="h1" rotulo="Título 1 (Ctrl+Alt+1)" icone={Heading1} separadorAntes ativo={st.h1} aoTocar={() => c().toggleHeading({ level: 1 }).run()} />
      <Botao id="h2" rotulo="Título 2 (Ctrl+Alt+2)" icone={Heading2} ativo={st.h2} aoTocar={() => c().toggleHeading({ level: 2 }).run()} />
      <Botao id="h3" rotulo="Título 3 (Ctrl+Alt+3)" icone={Heading3} ativo={st.h3} aoTocar={() => c().toggleHeading({ level: 3 }).run()} />
      <Botao id="h4" rotulo="Título 4" icone={Heading4} ativo={st.h4} aoTocar={() => c().toggleHeading({ level: 4 }).run()} />

      <Botao id="marcadores" rotulo="Lista com marcadores" icone={List} separadorAntes ativo={st.marcadores} aoTocar={() => c().toggleBulletList().run()} />
      <Botao id="numerada" rotulo="Lista numerada" icone={ListOrdered} ativo={st.numerada} aoTocar={() => c().toggleOrderedList().run()} />
      <Botao id="tarefas" rotulo="Lista de verificação" icone={ListTodo} ativo={st.tarefas} aoTocar={() => c().toggleTaskList().run()} />
      <Botao id="recuar" rotulo="Aumentar recuo (Tab)" icone={IndentIncrease} aoTocar={() => c().recuar().run()} />
      <Botao id="desrecuar" rotulo="Diminuir recuo (Shift+Tab)" icone={IndentDecrease} aoTocar={() => c().desrecuar().run()} />
      <Botao
        id="alinhamento"
        rotulo="Alinhamento"
        icone={IconeAlinhamento}
        aoTocar={(alvo) =>
          menuEm(
            alvo,
            'Alinhamento',
            (
              [
                ['left', 'À esquerda', AlignLeft],
                ['center', 'Centralizado', AlignCenter],
                ['right', 'À direita', AlignRight],
                ['justify', 'Justificado', AlignJustify],
              ] as const
            ).map(([valor, rotulo, icone]) => ({
              id: 'alinhar-' + valor,
              rotulo,
              icone,
              marcado: st.alinhamento === valor,
              aoEscolher: () => c().setTextAlign(valor).run(),
            })),
          )
        }
      />

      <Botao id="citacao" rotulo="Citação" icone={Quote} separadorAntes ativo={st.citacao} aoTocar={() => c().toggleBlockquote().run()} />
      <Botao
        id="tabela"
        rotulo="Tabela"
        icone={Table}
        ativo={st.tabela}
        aoTocar={(alvo) =>
          st.tabela
            ? menuEm(alvo, 'Tabela', [
                { id: 'linha-acima', rotulo: 'Linha acima', aoEscolher: () => c().addRowBefore().run() },
                { id: 'linha-abaixo', rotulo: 'Linha abaixo', aoEscolher: () => c().addRowAfter().run() },
                { id: 'coluna-antes', rotulo: 'Coluna à esquerda', aoEscolher: () => c().addColumnBefore().run() },
                { id: 'coluna-depois', rotulo: 'Coluna à direita', aoEscolher: () => c().addColumnAfter().run() },
                { id: 'apagar-linha', rotulo: 'Apagar a linha', separadorAntes: true, aoEscolher: () => c().deleteRow().run() },
                { id: 'apagar-coluna', rotulo: 'Apagar a coluna', aoEscolher: () => c().deleteColumn().run() },
                { id: 'apagar-tabela', rotulo: 'Apagar a tabela', icone: Trash2, perigo: true, aoEscolher: () => c().deleteTable().run() },
              ])
            : c().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        }
      />
      <Botao id="linha" rotulo="Linha horizontal" icone={SeparatorHorizontal} aoTocar={() => c().setHorizontalRule().run()} />
      <Botao
        id="imagem"
        rotulo="Imagem"
        icone={ImagePlus}
        aoTocar={(alvo) =>
          menuEm(alvo, 'Imagem', [
            { id: 'imagem-galeria', rotulo: 'Da galeria', icone: Images, aoEscolher: () => void inserirImagem(editor, false) },
            { id: 'imagem-camera', rotulo: 'Tirar foto', icone: Camera, aoEscolher: () => void inserirImagem(editor, true) },
          ])
        }
      />

      <Botao id="sobrescrito" rotulo="Sobrescrito" icone={Superscript} separadorAntes ativo={st.sobrescrito} aoTocar={() => c().toggleSuperscript().run()} />
      <Botao id="subscrito" rotulo="Subscrito" icone={Subscript} ativo={st.subscrito} aoTocar={() => c().toggleSubscript().run()} />
      <Botao id="limpar" rotulo="Limpar formatação" icone={RemoveFormatting} aoTocar={() => c().unsetAllMarks().clearNodes().run()} />

      <Botao id="foco" rotulo="Modo foco (Ctrl+Shift+F)" icone={Focus} separadorAntes aoTocar={() => entrarFoco()} />
    </div>
  );
}
