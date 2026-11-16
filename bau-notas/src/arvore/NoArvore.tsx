/**
 * Um nó da árvore: título, ícone e cor do tipo. Os gestos estão em gestos.ts.
 */
import {
  memo, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, type SyntheticEvent,
} from 'react';
import { Handle, NodeToolbar, Position, type NodeProps, type NodeToolbarProps } from '@xyflow/react';
import { FileText, Hash, Link2, Minus } from 'lucide-react';
import {
  alternarRecolhido, cancelarEdicao, confirmarTitulo, contarDescendentes, criarFilho, definirTopico, filhosDe,
  indiceDe, podeMover, tituloDaNota, usarNotaExistente, useLoja,
} from '../estado/loja';
import { useVoltar } from '../estado/navegacao';
import { iconeDoTipo } from '../ui/icones';
import { estiloDoTipo } from '../util/cores';
import { compararTexto, normalizar } from '../util/texto';
import { aoBaixarNoNo, aoClicarNoNo, aoMenuDeContexto } from './gestos';

/** Cor neutra dos tópicos, que não têm tipo. */
export const COR_DO_TOPICO = '#6B7785';

const parar = (e: SyntheticEvent) => e.stopPropagation();

/**
 * Barra flutuante ao lado do nó. Ela é desenhada fora do nó (num portal), mas
 * para o React continua "dentro" dele: os eventos são barrados aqui para que
 * um toque num botão não conte também como toque no nó.
 */
function BarraDoNo({ children, ...props }: NodeToolbarProps & { children: ReactNode }) {
  return (
    <NodeToolbar {...props}>
      <div className="barra-do-no" onClick={parar} onPointerDown={parar} onDoubleClick={parar} onContextMenu={parar}>
        {children}
      </div>
    </NodeToolbar>
  );
}

function EdicaoDoTitulo({ noId, notaId, novo, inicial }: { noId: string; notaId: string; novo: boolean; inicial: string }) {
  const [valor, setValor] = useState(inicial);
  const entrada = useRef<HTMLInputElement>(null);
  const concluido = useRef(false);
  const notas = useLoja((s) => s.notas);
  const tipos = useLoja((s) => s.tipos);
  const escuro = useLoja((s) => s.escuro);
  const topico = notas[notaId]?.topico === true;

  useVoltar(true, () => {
    concluido.current = true;
    cancelarEdicao();
  });

  useEffect(() => {
    const el = entrada.current;
    if (!el) return;
    el.focus({ preventScroll: true });
    el.select();
  }, []);

  // Notas que já existem com nome parecido: tocar numa delas faz este nó
  // apontar para ela, em vez de criar uma nota duplicada.
  const sugestoes = useMemo(() => {
    if (!novo || topico) return [];
    const termo = normalizar(valor);
    if (termo.length < 2) return [];
    return Object.values(notas)
      .filter(
        (n) => n.id !== notaId && !n.excluidaEm && !n.topico && n.titulo && normalizar(n.titulo).includes(termo),
      )
      .sort((a, b) => {
        const ia = normalizar(a.titulo).startsWith(termo) ? 0 : 1;
        const ib = normalizar(b.titulo).startsWith(termo) ? 0 : 1;
        return ia - ib || compararTexto(a.titulo, b.titulo);
      })
      .slice(0, 5);
  }, [novo, topico, valor, notas, notaId]);

  const confirmar = () => {
    if (concluido.current) return;
    concluido.current = true;
    confirmarTitulo(noId, valor);
  };

  return (
    <>
      <input
        ref={entrada}
        className="no-entrada nopan nodrag nowheel"
        value={valor}
        placeholder={topico ? 'Título do tópico' : 'Título da nota'}
        enterKeyHint="done"
        autoCapitalize="sentences"
        autoComplete="off"
        spellCheck={false}
        onChange={(e) => setValor(e.target.value)}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onBlur={(e) => {
          const para = e.relatedTarget;
          if (para instanceof HTMLElement && para.closest('.sugestoes')) return;
          confirmar();
        }}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Enter') {
            e.preventDefault();
            confirmar();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            concluido.current = true;
            cancelarEdicao();
          } else if (e.key === 'Tab') {
            // Teclado físico: Tab conclui este nó e já cria um filho.
            e.preventDefault();
            if (valor.trim()) {
              confirmar();
              criarFilho(noId);
            }
          }
        }}
      />
      <BarraDoNo isVisible={novo} position={Position.Bottom} align="start" offset={6}>
        <div className="sugestoes">
          {/* Um nó novo pode ser uma nota (com texto) ou só um tópico, que organiza o ramo. */}
          <div className="escolha-de-no" role="radiogroup" aria-label="O que criar">
            <button
              type="button"
              role="radio"
              aria-checked={!topico}
              className={'escolha' + (!topico ? ' ativa' : '')}
              data-escolha="nota"
              tabIndex={-1}
              onPointerDown={(e) => e.preventDefault()}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => definirTopico(notaId, false)}
            >
              <FileText size={18} />
              Nota
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={topico}
              className={'escolha' + (topico ? ' ativa' : '')}
              data-escolha="topico"
              tabIndex={-1}
              onPointerDown={(e) => e.preventDefault()}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => definirTopico(notaId, true)}
            >
              <Hash size={18} />
              Tópico
            </button>
          </div>
          <div className="escolha-dica">
            {topico ? 'Tópico: só o título, sem texto. Serve para organizar o ramo.' : 'Nota: tem texto próprio.'}
          </div>
          {sugestoes.length > 0 && <div className="sugestoes-titulo">Usar uma nota que já existe</div>}
          {sugestoes.map((n) => {
            const tipo = tipos[n.tipoId];
            const Icone = iconeDoTipo(tipo?.icone);
            return (
              <button
                key={n.id}
                type="button"
                className="sugestao"
                tabIndex={-1}
                style={estiloDoTipo(tipo?.cor, escuro) as CSSProperties}
                onPointerDown={(e) => e.preventDefault()}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  concluido.current = true;
                  usarNotaExistente(noId, n.id);
                }}
              >
                <span className="sugestao-icone">
                  <Icone size={16} />
                </span>
                <span className="sugestao-nome">{n.titulo}</span>
                <span className="sugestao-tipo">{tipo?.nome}</span>
              </button>
            );
          })}
        </div>
      </BarraDoNo>
    </>
  );
}

function NoArvoreBase({ id }: NodeProps) {
  const no = useLoja((s) => s.nos[id]);
  const nota = useLoja((s) => {
    const n = s.nos[id];
    return n ? s.notas[n.notaId] : undefined;
  });
  const tipo = useLoja((s) => {
    const n = s.nos[id];
    const nt = n ? s.notas[n.notaId] : undefined;
    return nt ? s.tipos[nt.tipoId] : undefined;
  });
  const escuro = useLoja((s) => s.escuro);
  const selecionado = useLoja((s) => s.selecionadoId === id);
  const noCaminho = useLoja((s) => s.caminho.has(id));
  const edicao = useLoja((s) => (s.edicao?.noId === id ? s.edicao : null));
  const alvo = useLoja((s) => (s.arrasto?.alvoId === id ? s.arrasto.posicao : null));
  const arrastado = useLoja((s) => s.arrasto?.noId === id);
  const emMovimento = useLoja((s) => s.movendoId === id);
  const destinoPossivel = useLoja((s) => s.movendoId !== null && s.movendoId !== id && podeMover(s.movendoId, id));
  const qtdFilhos = useLoja((s) => filhosDe(s.nos, id).length);
  const ocultos = useLoja((s) => (s.nos[id]?.recolhido ? contarDescendentes(s.nos, id) : 0));
  const repetida = useLoja((s) => {
    const n = s.nos[id];
    return n ? (indiceDe(s.nos).porNota.get(n.notaId)?.length ?? 0) > 1 : false;
  });
  const elemento = useRef<HTMLDivElement>(null);

  // Com mouse, arrastar sobre o nó move o nó, não o canvas: o mousedown não chega ao React Flow.
  useEffect(() => {
    const el = elemento.current;
    if (!el) return;
    const parar = (e: MouseEvent) => {
      if (e.button === 0) e.stopPropagation();
    };
    el.addEventListener('mousedown', parar);
    return () => el.removeEventListener('mousedown', parar);
  }, []);

  if (!no) return null;
  const raiz = !no.paiId;
  const titulo = tituloDaNota(nota);
  const topico = nota?.topico === true;
  const Icone = topico ? Hash : iconeDoTipo(tipo?.icone);
  // As barras flutuantes pertencem ao nó para o React, mas não fazem parte dele na tela.
  const noProprioNo = (alvo: EventTarget) => elemento.current?.contains(alvo as Node) === true;

  const classes =
    'no' +
    (selecionado ? ' selecionado' : '') +
    (noCaminho && !selecionado ? ' no-caminho' : '') +
    (edicao ? ' editando' : '') +
    (arrastado || emMovimento ? ' em-movimento' : '') +
    (alvo ? ` alvo alvo-${alvo}` : '') +
    (destinoPossivel ? ' destino-possivel' : '') +
    (topico ? ' topico' : '') +
    (raiz ? ' raiz' : '');

  return (
    <div
      ref={elemento}
      className={classes}
      style={estiloDoTipo(topico ? COR_DO_TOPICO : tipo?.cor, escuro) as CSSProperties}
      data-no={id}
      data-titulo={titulo}
      data-topico={topico ? '' : undefined}
      onPointerDown={(e) => {
        if (noProprioNo(e.target) && !(e.target as HTMLElement).closest('.no-dobra')) aoBaixarNoNo(id, e, true);
      }}
      onClick={(e) => {
        if (noProprioNo(e.target) && !(e.target as HTMLElement).closest('.no-dobra')) aoClicarNoNo(id, e);
      }}
      onContextMenu={(e) => {
        if (noProprioNo(e.target)) aoMenuDeContexto(id, e);
        else e.preventDefault();
      }}
    >
      <Handle type="target" position={Position.Left} className="alca" isConnectable={false} />
      <Handle type="source" position={Position.Right} className="alca" isConnectable={false} />

      <span className="no-icone">
        <Icone size={20} />
      </span>
      {edicao ? (
        <EdicaoDoTitulo noId={id} notaId={no.notaId} novo={edicao.novo} inicial={nota?.titulo ?? ''} />
      ) : (
        <span className="no-titulo">{titulo}</span>
      )}
      {repetida && !edicao && (
        <span className="no-repetida" title="Esta nota aparece em mais de um lugar">
          <Link2 size={14} />
        </span>
      )}
      {qtdFilhos > 0 && !edicao && (
        <button
          type="button"
          className={'no-dobra nopan' + (no.recolhido ? ' recolhido' : '')}
          aria-label={no.recolhido ? `Expandir ${ocultos} nós` : 'Recolher'}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            alternarRecolhido(id);
          }}
        >
          {no.recolhido ? <span className="no-dobra-qtd">+{ocultos}</span> : <Minus size={14} />}
        </button>
      )}
    </div>
  );
}

export const NoArvore = memo(NoArvoreBase);
