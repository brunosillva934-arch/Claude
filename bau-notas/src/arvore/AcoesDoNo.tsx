/**
 * Botões grandes ao lado do nó selecionado: "+ Filho" à direita (para onde os
 * ramos crescem), "+ Irmão" embaixo, e "Abrir" / "⋯" em cima.
 *
 * Há uma única instância para a árvore inteira, e os botões têm tamanho
 * constante na tela, qualquer que seja o zoom.
 */
import { NodeToolbar, Position, useStore } from '@xyflow/react';
import { Ellipsis, FileText, Plus } from 'lucide-react';
import { criarFilho, criarIrmao, expandirNota, filhosDe, tituloDaNota, useLoja } from '../estado/loja';
import { menuDoNo } from './gestos';
import { LARGURA_NO } from './layout';
import { ZOOM_DE_LONGE } from './RotulosDeLonge';

export function AcoesDoNo() {
  const id = useLoja((s) => (s.selecionadoId && !s.edicao && !s.arrasto && !s.movendoId ? s.selecionadoId : null));
  const raiz = useLoja((s) => (id ? !s.nos[id]?.paiId : false));
  const temFilhos = useLoja((s) => (id ? filhosDe(s.nos, id).length > 0 : false));
  const letras = useLoja((s) => (id && s.nos[id] ? tituloDaNota(s.notas[s.nos[id]!.notaId]).length : 0));
  const notaAoLado = useLoja((s) => s.largo && s.painelLigado);
  const topico = useLoja((s) => (id && s.nos[id] ? s.notas[s.nos[id]!.notaId]?.topico === true : false));
  // Em degraus, para não redesenhar a cada quadro da pinça.
  const zoom = useStore((s) => Math.round(s.transform[2] * 25) / 25);

  if (!id) return null;
  // Com o zoom reduzido o título é desenhado maior que o bloco do nó: o botão vai para depois dele.
  const sobraDoTitulo =
    zoom < ZOOM_DE_LONGE ? Math.max(0, Math.min(letras * 9 + 34, 300) - LARGURA_NO * zoom) : temFilhos ? 14 : 0;

  return (
    <>
      <NodeToolbar nodeId={id} isVisible position={Position.Right} offset={10 + sobraDoTitulo}>
        <button type="button" className="acao-no" data-acao="filho" onClick={() => criarFilho(id)}>
          <Plus size={18} />
          Filho
        </button>
      </NodeToolbar>
      {!raiz && (
        <NodeToolbar nodeId={id} isVisible position={Position.Bottom} offset={10}>
          <button type="button" className="acao-no" data-acao="irmao" onClick={() => criarIrmao(id)}>
            <Plus size={18} />
            Irmão
          </button>
        </NodeToolbar>
      )}
      <NodeToolbar nodeId={id} isVisible position={Position.Top} offset={10}>
        <div className="acoes-no-topo">
          {!notaAoLado && !topico && (
            <button type="button" className="acao-no suave" data-acao="abrir" onClick={() => expandirNota(true)}>
              <FileText size={18} />
              Abrir
            </button>
          )}
          <button
            type="button"
            className="acao-no suave so-icone"
            data-acao="mais"
            aria-label="Mais ações"
            onClick={(e) => menuDoNo(id, e.currentTarget)}
          >
            <Ellipsis size={20} />
          </button>
        </div>
      </NodeToolbar>
    </>
  );
}
