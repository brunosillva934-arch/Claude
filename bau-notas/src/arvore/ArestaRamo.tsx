/**
 * Conector entre pai e filho. O rótulo do ramo ("se troponina +", "30%") fica
 * escrito sobre o trecho reto que chega ao filho.
 */
import { memo } from 'react';
import { BaseEdge, EdgeLabelRenderer, type EdgeProps } from '@xyflow/react';
import { useLoja } from '../estado/loja';
import { MAX_ROTULO, larguraDoRotulo } from './layout';

function ArestaRamoBase({ sourceX, sourceY, targetX, targetY, target, data }: EdgeProps) {
  const rotulo = useLoja((s) => s.nos[target]?.rotuloDoRamo ?? null);
  const noCaminho = useLoja((s) => s.caminho.has(target));
  const tracejada = Boolean((data as { tracejada?: boolean } | undefined)?.tracejada);

  const vao = targetX - sourceX;
  // Trecho reto final, onde o rótulo se apoia.
  const reto = rotulo ? Math.min(vao - 30, larguraDoRotulo(rotulo) + 14) : Math.min(18, vao / 3);
  const fimDaCurva = targetX - Math.max(reto, 0);
  const meio = (fimDaCurva - sourceX) / 2;
  const caminho =
    `M ${sourceX} ${sourceY} ` +
    `C ${sourceX + meio} ${sourceY}, ${fimDaCurva - meio} ${targetY}, ${fimDaCurva} ${targetY} ` +
    `L ${targetX} ${targetY}`;

  const texto = rotulo && rotulo.length > MAX_ROTULO ? rotulo.slice(0, MAX_ROTULO - 1) + '…' : rotulo;

  return (
    <>
      <BaseEdge
        path={caminho}
        interactionWidth={0}
        className={'ramo' + (noCaminho ? ' no-caminho' : '') + (tracejada ? ' tracejada' : '')}
      />
      {texto && (
        <EdgeLabelRenderer>
          <div
            className={'ramo-rotulo' + (noCaminho ? ' no-caminho' : '')}
            style={{ transform: `translate(-50%, -50%) translate(${targetX - reto / 2 - 3}px, ${targetY}px)` }}
          >
            {texto}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const ArestaRamo = memo(ArestaRamoBase);
