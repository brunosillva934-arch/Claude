/**
 * Visão alternativa: a mesma árvore como lista recuada (outline).
 * Usa o mesmo estado da árvore visual: seleção, ramos recolhidos, modo mover
 * e menu de ações são compartilhados, então as duas visões andam juntas.
 */
import { memo, useEffect, useMemo, useRef, type CSSProperties } from 'react';
import { ChevronDown, ChevronRight, CornerDownRight, Ellipsis, FileText, Link2, Plus } from 'lucide-react';
import {
  alternarRecolhido, cancelarEdicao, confirmarTitulo, criarFilho, criarIrmao, expandirNota, filhosDe, indiceDe,
  moverNo, podeMover, selecionar, tituloDaNota, useLoja,
} from '../estado/loja';
import { useVoltar } from '../estado/navegacao';
import { toqueHaptico } from '../nativo/ponte';
import { iconeDoTipo } from '../ui/icones';
import { avisar } from '../ui/servico';
import { estiloDoTipo } from '../util/cores';
import { abrirMenuDoNo, avisarDesfazer } from './acoesNo';
import { dispor } from './layout';

function EdicaoNaLista({ noId, inicial }: { noId: string; inicial: string }) {
  const entrada = useRef<HTMLInputElement>(null);
  const concluido = useRef(false);
  useVoltar(true, () => {
    concluido.current = true;
    cancelarEdicao();
  });
  useEffect(() => {
    entrada.current?.focus({ preventScroll: true });
    entrada.current?.select();
  }, []);
  const confirmar = () => {
    if (concluido.current) return;
    concluido.current = true;
    confirmarTitulo(noId, entrada.current?.value ?? '');
  };
  return (
    <input
      ref={entrada}
      className="linha-entrada"
      defaultValue={inicial}
      placeholder="Título da nota"
      enterKeyHint="done"
      autoCapitalize="sentences"
      autoComplete="off"
      onClick={(e) => e.stopPropagation()}
      onBlur={confirmar}
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
          e.preventDefault();
          if (entrada.current?.value.trim()) {
            confirmar();
            criarFilho(noId);
          }
        }
      }}
    />
  );
}

const Linha = memo(function Linha({ id, nivel }: { id: string; nivel: number }) {
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
  const editando = useLoja((s) => s.edicao?.noId === id);
  const temFilhos = useLoja((s) => filhosDe(s.nos, id).length > 0);
  const repetida = useLoja((s) => {
    const n = s.nos[id];
    return n ? (indiceDe(s.nos).porNota.get(n.notaId)?.length ?? 0) > 1 : false;
  });
  const emMovimento = useLoja((s) => s.movendoId === id);
  const destinoPossivel = useLoja((s) => s.movendoId !== null && s.movendoId !== id && podeMover(s.movendoId, id));
  const acoes = useLoja((s) => s.selecionadoId === id && !s.edicao && !s.movendoId);
  const notaAoLado = useLoja((s) => s.largo && s.painelLigado);

  const linha = useRef<HTMLDivElement>(null);
  const temporizador = useRef(0);
  const inicio = useRef({ x: 0, y: 0 });
  const longo = useRef(false);
  const ultimoToque = useRef(0);

  useEffect(() => {
    if (selecionado) linha.current?.scrollIntoView({ block: 'nearest' });
  }, [selecionado]);

  if (!no) return null;
  const titulo = tituloDaNota(nota);
  const topico = nota?.topico === true;
  const Icone = iconeDoTipo(tipo?.icone);
  const recomendacao = topico ? nota!.resumo.trim() : '';
  const raiz = !no.paiId;

  const menu = () => {
    const r = linha.current?.getBoundingClientRect();
    if (!r) return;
    selecionar(id);
    abrirMenuDoNo(id, Math.round(Math.min(r.left + 220, r.right - 40)), Math.round(r.bottom - 6));
  };

  return (
    <div
      ref={linha}
      className={
        'linha' +
        (selecionado ? ' selecionada' : '') +
        (noCaminho && !selecionado ? ' no-caminho' : '') +
        (emMovimento ? ' em-movimento' : '') +
        (destinoPossivel ? ' destino-possivel' : '') +
        (topico ? ' topico' : '')
      }
      style={{ ...(estiloDoTipo(tipo?.cor, escuro) as CSSProperties), paddingLeft: 8 + nivel * 26 }}
      data-no={id}
      data-titulo={titulo}
      onPointerDown={(e) => {
        if (editando || e.pointerType === 'mouse') return;
        longo.current = false;
        inicio.current = { x: e.clientX, y: e.clientY };
        window.clearTimeout(temporizador.current);
        temporizador.current = window.setTimeout(() => {
          longo.current = true;
          toqueHaptico();
          menu();
        }, 480);
      }}
      onPointerMove={(e) => {
        if (Math.hypot(e.clientX - inicio.current.x, e.clientY - inicio.current.y) > 10) {
          window.clearTimeout(temporizador.current);
        }
      }}
      onPointerUp={() => window.clearTimeout(temporizador.current)}
      onPointerCancel={() => window.clearTimeout(temporizador.current)}
      onContextMenu={(e) => {
        e.preventDefault();
        if (!editando && (e.nativeEvent as PointerEvent).pointerType !== 'touch' && !longo.current) menu();
      }}
      onClick={(e) => {
        if (editando) return;
        if (longo.current) {
          longo.current = false;
          return;
        }
        const s = useLoja.getState();
        if (s.movendoId) {
          if (s.movendoId === id) return;
          if (!podeMover(s.movendoId, id)) {
            avisar('Não dá para mover um nó para dentro do próprio ramo');
            return;
          }
          const movido = tituloDaNota(s.notas[s.nos[s.movendoId]!.notaId]);
          if (moverNo(s.movendoId, id)) avisarDesfazer(`“${movido}” movido para “${titulo}”`);
          return;
        }
        const duplo = e.timeStamp - ultimoToque.current < 350;
        ultimoToque.current = duplo ? 0 : e.timeStamp;
        selecionar(id);
        if (duplo) expandirNota(true);
      }}
    >
      {temFilhos ? (
        <button
          type="button"
          className="linha-dobra"
          aria-label={no.recolhido ? 'Expandir' : 'Recolher'}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            alternarRecolhido(id);
          }}
        >
          {no.recolhido ? <ChevronRight size={20} /> : <ChevronDown size={20} />}
        </button>
      ) : (
        <span className="linha-dobra vazia" />
      )}
      <span className="linha-icone">
        <Icone size={18} />
      </span>
      {editando ? (
        <EdicaoNaLista noId={id} inicial={nota?.titulo ?? ''} />
      ) : (
        <span className="linha-titulo">{titulo}</span>
      )}
      {repetida && !editando && (
        <span className="linha-repetida" title="Esta nota aparece em mais de um lugar">
          <Link2 size={14} />
        </span>
      )}
      {recomendacao && !editando && (
        <span className="linha-resumo">
          <CornerDownRight size={14} />
          {recomendacao}
        </span>
      )}
      {no.rotuloDoRamo && !editando && <span className="linha-rotulo">{no.rotuloDoRamo}</span>}
      {acoes && (
        <span className="linha-acoes">
          <button type="button" className="acao-linha" data-acao="filho" onClick={(e) => { e.stopPropagation(); criarFilho(id); }}>
            <Plus size={16} />
            Filho
          </button>
          {!raiz && (
            <button type="button" className="acao-linha" data-acao="irmao" onClick={(e) => { e.stopPropagation(); criarIrmao(id); }}>
              <Plus size={16} />
              Irmão
            </button>
          )}
          {!notaAoLado && (
            <button type="button" className="acao-linha" data-acao="abrir" onClick={(e) => { e.stopPropagation(); expandirNota(true); }}>
              <FileText size={16} />
              Abrir
            </button>
          )}
          <button type="button" className="acao-linha so-icone" data-acao="mais" aria-label="Mais ações" onClick={(e) => { e.stopPropagation(); menu(); }}>
            <Ellipsis size={18} />
          </button>
        </span>
      )}
    </div>
  );
});

export function Lista() {
  const raizId = useLoja((s) => (s.arvoreAtualId ? s.arvores[s.arvoreAtualId]?.raizId : undefined));
  const nos = useLoja((s) => s.nos);
  const disposicao = useMemo(() => (raizId ? dispor(nos, raizId) : null), [nos, raizId]);

  return (
    <div
      className="lista"
      onClick={(e) => {
        if (e.target === e.currentTarget && !useLoja.getState().movendoId) selecionar(null);
      }}
    >
      {disposicao?.ordem.map((id) => (
        <Linha key={id} id={id} nivel={disposicao.posicoes.get(id)!.nivel} />
      ))}
    </div>
  );
}
