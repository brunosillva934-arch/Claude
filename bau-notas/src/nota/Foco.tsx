/**
 * Controles do modo foco: discretos, num canto, e só três: esmaecer os outros
 * parágrafos, máquina de escrever e sair. Também se sai pelo voltar do Android,
 * por Esc e por Ctrl+Shift+F.
 */
import { useEffect } from 'react';
import { AlignVerticalSpaceAround, Eclipse, Minimize2 } from 'lucide-react';
import { definirOpcaoDoFoco, sairFoco, useLoja } from '../estado/loja';
import { useVoltar } from '../estado/navegacao';
import { useUi } from '../ui/servico';

export function ControlesDoFoco() {
  const esmaecer = useLoja((s) => s.focoEsmaecer);
  const maquina = useLoja((s) => s.focoMaquina);
  useVoltar(true, sairFoco);

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !useUi.getState().menu && !useUi.getState().dialogo) {
        e.preventDefault();
        sairFoco();
      }
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, []);

  const segurar = (e: React.SyntheticEvent) => e.preventDefault();
  return (
    <div className="controles-foco" role="toolbar" aria-label="Modo foco">
      <button
        type="button"
        className={'controle-foco' + (esmaecer ? ' ligado' : '')}
        aria-pressed={esmaecer}
        aria-label="Esmaecer os parágrafos fora de edição"
        title="Esmaecer os outros parágrafos"
        data-acao="foco-esmaecer"
        onPointerDown={segurar}
        onMouseDown={segurar}
        onClick={() => definirOpcaoDoFoco('focoEsmaecer', !esmaecer)}
      >
        <Eclipse size={20} />
      </button>
      <button
        type="button"
        className={'controle-foco' + (maquina ? ' ligado' : '')}
        aria-pressed={maquina}
        aria-label="Máquina de escrever: a linha atual fica no meio da tela"
        title="Máquina de escrever"
        data-acao="foco-maquina"
        onPointerDown={segurar}
        onMouseDown={segurar}
        onClick={() => definirOpcaoDoFoco('focoMaquina', !maquina)}
      >
        <AlignVerticalSpaceAround size={20} />
      </button>
      <button
        type="button"
        className="controle-foco"
        aria-label="Sair do modo foco"
        title="Sair do modo foco (Esc)"
        data-acao="sair-foco"
        onPointerDown={segurar}
        onMouseDown={segurar}
        onClick={sairFoco}
      >
        <Minimize2 size={20} />
      </button>
    </div>
  );
}
