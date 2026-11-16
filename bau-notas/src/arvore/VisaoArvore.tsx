/**
 * Tela principal: a árvore desenhada da esquerda para a direita.
 *
 * - Ao abrir (e ao trocar de árvore) a árvore inteira é enquadrada na tela.
 * - Pinça dá zoom, um dedo arrasta o canvas, toque duplo no fundo enquadra tudo.
 * - Só os nós e conectores que estão na tela são desenhados
 *   (`onlyRenderVisibleElements`), o que mantém a navegação fluida com
 *   centenas de nós.
 */
import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Background, BackgroundVariant, MiniMap, Position, ReactFlow, ReactFlowProvider, useReactFlow, useStore,
  useStoreApi, type Edge, type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Maximize, Minus, Plus, X } from 'lucide-react';
import { iniciarMover, selecionar, tituloDaNota, useLoja } from '../estado/loja';
import { useVoltar } from '../estado/navegacao';
import { coresDoTipo } from '../util/cores';
import { ArestaRamo } from './ArestaRamo';
import { contexto } from './contexto';
import { ALTURA_NO, DISPOSICAO_VAZIA, LARGURA_NO, dispor, type Disposicao } from './layout';
import { NoArvore } from './NoArvore';
import { RotulosDeLonge, ZOOM_DE_LONGE } from './RotulosDeLonge';

const ZOOM_MINIMO = 0.02;
const ZOOM_MAXIMO = 2;
const TIPOS_DE_NO = { no: NoArvore };
const TIPOS_DE_ARESTA = { ramo: ArestaRamo };
const SEM_DADOS = {};
const TAMANHO_MINIMAPA = { width: 172, height: 116 };
const OPCOES_PRO = { hideAttribution: true };
/** Margens do "Ver tudo". Embaixo sobra a faixa dos botões fixos, para nada ficar escondido atrás deles. */
const MARGEM_VER_TUDO = { top: '18px', right: '24px', bottom: '74px', left: '24px' } as const;

function criarNo(id: string, x: number, y: number): Node {
  return {
    id,
    type: 'no',
    position: { x, y },
    data: SEM_DADOS,
    // Tamanho fixo e declarado: o React Flow não precisa medir cada nó, e
    // consegue saber o que está fora da tela sem desenhar.
    width: LARGURA_NO,
    height: ALTURA_NO,
    measured: { width: LARGURA_NO, height: ALTURA_NO },
    handles: [
      { type: 'target', position: Position.Left, x: 0, y: ALTURA_NO / 2 - 0.5, width: 1, height: 1 },
      { type: 'source', position: Position.Right, x: LARGURA_NO - 1, y: ALTURA_NO / 2 - 0.5, width: 1, height: 1 },
    ],
    draggable: false,
    selectable: false,
    connectable: false,
    focusable: false,
  };
}

function Canvas() {
  const rf = useReactFlow();
  const lojaRf = useStoreApi();
  const envoltorio = useRef<HTMLDivElement>(null);
  const fantasma = useRef<HTMLDivElement>(null);
  const intocado = useRef(true);
  const cacheNos = useRef(new Map<string, Node>());
  const cacheArestas = useRef(new Map<string, Edge>());
  const disposicaoRef = useRef<Disposicao>(DISPOSICAO_VAZIA);
  const ultimoToqueNoFundo = useRef({ quando: 0, x: 0, y: 0 });

  const raizId = useLoja((s) => (s.arvoreAtualId ? s.arvores[s.arvoreAtualId]?.raizId : undefined));
  const arvoreId = useLoja((s) => s.arvoreAtualId);
  const nos = useLoja((s) => s.nos);
  const escuro = useLoja((s) => s.escuro);
  const pedidoVerTudo = useLoja((s) => s.pedidoVerTudo);
  const pedidoRevelar = useLoja((s) => s.pedidoRevelar);
  const movendoTitulo = useLoja((s) => {
    const no = s.movendoId ? s.nos[s.movendoId] : undefined;
    return no ? tituloDaNota(s.notas[no.notaId]) : null;
  });
  const deLonge = useStore((s) => s.transform[2] < ZOOM_DE_LONGE);

  const { nodes, edges, disposicao } = useMemo(() => {
    const d = raizId ? dispor(nos, raizId) : DISPOSICAO_VAZIA;
    const novosNos = new Map<string, Node>();
    const novasArestas = new Map<string, Edge>();
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    for (const id of d.ordem) {
      const p = d.posicoes.get(id)!;
      const antigo = cacheNos.current.get(id);
      const node = antigo && antigo.position.x === p.x && antigo.position.y === p.y ? antigo : criarNo(id, p.x, p.y);
      novosNos.set(id, node);
      nodes.push(node);
      const paiId = nos[id]!.paiId;
      if (paiId && d.posicoes.has(paiId)) {
        const chave = 'r-' + id;
        const antiga = cacheArestas.current.get(chave);
        const edge: Edge =
          antiga && antiga.source === paiId
            ? antiga
            : { id: chave, source: paiId, target: id, type: 'ramo', focusable: false, selectable: false };
        novasArestas.set(chave, edge);
        edges.push(edge);
      }
    }
    cacheNos.current = novosNos;
    cacheArestas.current = novasArestas;
    return { nodes, edges, disposicao: d };
  }, [nos, raizId]);
  disposicaoRef.current = disposicao;

  // O minimapa só aparece quando parte da árvore está fora da tela.
  const { largura: larguraArvore, altura: alturaArvore } = disposicao;
  const tudoNaTela = useStore((s) => {
    const [x, y, zoom] = s.transform;
    return x >= -2 && y >= -2 && x + larguraArvore * zoom <= s.width + 2 && y + alturaArvore * zoom <= s.height + 2;
  });

  const moverFantasma = useCallback((x: number, y: number, texto: string | null) => {
    const el = fantasma.current;
    const base = envoltorio.current;
    if (!el || !base) return;
    if (texto === null) {
      el.style.display = 'none';
      return;
    }
    const r = base.getBoundingClientRect();
    if (el.textContent !== texto) el.textContent = texto;
    el.style.display = 'block';
    el.style.transform = `translate(${Math.round(x - r.left + 14)}px, ${Math.round(y - r.top - 54)}px)`;
  }, []);

  useEffect(() => {
    if (!envoltorio.current) return;
    contexto.atual = { rf, disposicao, envoltorio: envoltorio.current, moverFantasma };
  }, [rf, disposicao, moverFantasma]);
  useEffect(
    () => () => {
      contexto.atual = null;
    },
    [],
  );

  const verTudo = useCallback(
    (duracao: number) => {
      intocado.current = true;
      const opcoes = { padding: MARGEM_VER_TUDO, duration: duracao, minZoom: ZOOM_MINIMO, maxZoom: 1.15 };
      void rf.fitView(opcoes).then((ok) => {
        // Na primeira abertura os nós podem ainda não estar registrados: tenta de novo no quadro seguinte.
        if (!ok) requestAnimationFrame(() => void rf.fitView(opcoes));
      });
    },
    [rf],
  );

  /** Traz um nó para dentro da área visível, movendo o canvas o mínimo necessário. */
  const revelar = useCallback(
    (noId: string, animar: boolean) => {
      const pos = disposicaoRef.current.posicoes.get(noId);
      const el = envoltorio.current;
      if (!pos || !el) return;
      const largura = el.clientWidth;
      const altura = el.clientHeight;
      if (largura === 0 || altura === 0) return;
      const v = rf.getViewport();
      const editando = useLoja.getState().edicao?.noId === noId;
      let { x, y, zoom } = v;
      if (editando && zoom < 0.8) {
        // Para escrever o título o nó precisa estar em tamanho legível.
        zoom = 1;
        x = largura / 2 - (pos.x + LARGURA_NO / 2) * zoom;
        y = altura * 0.4 - (pos.y + ALTURA_NO / 2) * zoom;
      } else {
        const margemEsq = Math.min(24, largura / 8);
        const margemDir = Math.min(130, largura / 4); // espaço para o botão "+ Filho"
        const margemV = Math.min(72, altura / 5); // espaço para "Abrir" e "+ Irmão"
        const esq = pos.x * zoom + x;
        const dir = esq + LARGURA_NO * zoom;
        const topo = pos.y * zoom + y;
        const base = topo + ALTURA_NO * zoom;
        if (dir - esq > largura - margemEsq - margemDir) x += margemEsq - esq;
        else if (esq < margemEsq) x += margemEsq - esq;
        else if (dir > largura - margemDir) x -= dir - (largura - margemDir);
        if (topo < margemV) y += margemV - topo;
        else if (base > altura - margemV) y -= base - (altura - margemV);
      }
      if (Math.abs(x - v.x) < 1 && Math.abs(y - v.y) < 1 && zoom === v.zoom) return;
      intocado.current = false;
      void rf.setViewport({ x, y, zoom }, { duration: animar ? 180 : 0 });
    },
    [rf],
  );

  // Ao abrir, ao trocar de árvore e ao tocar em "Ver tudo": a árvore inteira na tela.
  useEffect(() => {
    if (!raizId) return;
    const q = requestAnimationFrame(() => verTudo(0));
    return () => cancelAnimationFrame(q);
  }, [arvoreId, raizId, pedidoVerTudo, verTudo]);

  useEffect(() => {
    if (!pedidoRevelar) return;
    const q = requestAnimationFrame(() => revelar(pedidoRevelar.noId, true));
    return () => cancelAnimationFrame(q);
  }, [pedidoRevelar, revelar]);

  // A área da árvore mudou de tamanho (girou a tela, abriu a nota ao lado, abriu
  // o teclado). Se o usuário ainda não mexeu no enquadramento, enquadra de novo;
  // senão, só garante que o nó em uso continue à vista.
  useEffect(() => {
    const el = envoltorio.current;
    if (!el) return;
    let q = 0;
    let largura = el.clientWidth;
    let altura = el.clientHeight;
    const observador = new ResizeObserver(() => {
      // Escondida (nota em tela cheia) a área mede zero: não conta como mudança.
      if (el.clientWidth === 0 || el.clientHeight === 0) return;
      if (el.clientWidth === largura && el.clientHeight === altura) return;
      largura = el.clientWidth;
      altura = el.clientHeight;
      cancelAnimationFrame(q);
      q = requestAnimationFrame(() => {
        const s = useLoja.getState();
        if (s.edicao) revelar(s.edicao.noId, false);
        else if (intocado.current) verTudo(0);
        else if (s.selecionadoId) revelar(s.selecionadoId, false);
      });
    });
    observador.observe(el);
    return () => {
      cancelAnimationFrame(q);
      observador.disconnect();
    };
  }, [revelar, verTudo]);

  // O zoom atual vira uma variável CSS, sem redesenhar nada pelo React.
  useEffect(() => {
    const el = envoltorio.current;
    if (!el) return;
    el.style.setProperty('--zoom', String(lojaRf.getState().transform[2]));
    return lojaRf.subscribe((s, anterior) => {
      if (s.transform[2] !== anterior.transform[2]) el.style.setProperty('--zoom', String(s.transform[2]));
    });
  }, [lojaRf]);

  // O navegador às vezes rola o contêiner para mostrar um campo em foco. O canvas não rola: volta ao zero.
  useEffect(() => {
    const el = envoltorio.current;
    if (!el) return;
    const zerar = (e: Event) => {
      const alvo = e.target as HTMLElement;
      if (alvo.scrollTop !== 0) alvo.scrollTop = 0;
      if (alvo.scrollLeft !== 0) alvo.scrollLeft = 0;
    };
    el.addEventListener('scroll', zerar, true);
    return () => el.removeEventListener('scroll', zerar, true);
  }, []);

  useVoltar(movendoTitulo !== null, () => iniciarMover(null));

  const corNoMinimapa = useCallback(
    (node: Node) => {
      const s = useLoja.getState();
      const no = s.nos[node.id];
      const nota = no ? s.notas[no.notaId] : undefined;
      const tipo = nota ? s.tipos[nota.tipoId] : undefined;
      return coresDoTipo(tipo?.cor ?? '#6B7785', escuro).base;
    },
    [escuro],
  );

  return (
    <div
      ref={envoltorio}
      className="arvore"
      data-longe={deLonge ? '' : undefined}
      data-movendo={movendoTitulo !== null ? '' : undefined}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={TIPOS_DE_NO}
        edgeTypes={TIPOS_DE_ARESTA}
        colorMode={escuro ? 'dark' : 'light'}
        minZoom={ZOOM_MINIMO}
        maxZoom={ZOOM_MAXIMO}
        onlyRenderVisibleElements
        nodesDraggable={false}
        nodesConnectable={false}
        nodesFocusable={false}
        edgesFocusable={false}
        elementsSelectable={false}
        elevateNodesOnSelect={false}
        panOnDrag
        zoomOnPinch
        zoomOnScroll
        zoomOnDoubleClick={false}
        deleteKeyCode={null}
        selectionKeyCode={null}
        multiSelectionKeyCode={null}
        panActivationKeyCode={null}
        zoomActivationKeyCode={null}
        disableKeyboardA11y
        proOptions={OPCOES_PRO}
        onMove={(evento) => {
          // Só conta quando o enquadramento mudou de fato por um gesto (um toque simples não move nada).
          if (evento) intocado.current = false;
        }}
        onPaneClick={(e) => {
          const u = ultimoToqueNoFundo.current;
          const duplo = e.timeStamp - u.quando < 350 && Math.hypot(e.clientX - u.x, e.clientY - u.y) < 40;
          ultimoToqueNoFundo.current = { quando: duplo ? 0 : e.timeStamp, x: e.clientX, y: e.clientY };
          if (duplo) verTudo(260);
          else if (!useLoja.getState().movendoId) selecionar(null);
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={28} size={1.4} />
        {!tudoNaTela && (
          <MiniMap
            className="minimapa"
            pannable
            zoomable
            nodeColor={corNoMinimapa}
            nodeStrokeWidth={0}
            nodeBorderRadius={10}
            style={TAMANHO_MINIMAPA}
            ariaLabel="Minimapa da árvore"
          />
        )}
        <RotulosDeLonge disposicao={disposicao} />
      </ReactFlow>

      <div className="controles-arvore">
        <button type="button" className="controle com-texto" data-acao="ver-tudo" onClick={() => verTudo(260)}>
          <Maximize size={20} />
          Ver tudo
        </button>
        <button
          type="button"
          className="controle"
          data-acao="zoom-mais"
          aria-label="Aumentar o zoom"
          onClick={() => {
            intocado.current = false;
            void rf.zoomIn({ duration: 160 });
          }}
        >
          <Plus size={22} />
        </button>
        <button
          type="button"
          className="controle"
          data-acao="zoom-menos"
          aria-label="Reduzir o zoom"
          onClick={() => {
            intocado.current = false;
            void rf.zoomOut({ duration: 160 });
          }}
        >
          <Minus size={22} />
        </button>
      </div>

      {movendoTitulo !== null && (
        <div className="faixa-mover" role="status">
          <span>
            Movendo <strong>“{movendoTitulo}”</strong>: toque no novo pai
          </span>
          <button type="button" className="faixa-mover-cancelar" onClick={() => iniciarMover(null)}>
            <X size={18} />
            Cancelar
          </button>
        </div>
      )}

      <div ref={fantasma} className="fantasma" style={{ display: 'none' }} />
    </div>
  );
}

export function VisaoArvore() {
  return (
    <ReactFlowProvider>
      <Canvas />
    </ReactFlowProvider>
  );
}
