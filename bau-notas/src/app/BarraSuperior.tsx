import { ListTree, Menu, Network, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { abrirGaveta, alternarPainel, definirVisao, ramoDe, useLoja } from '../estado/loja';
import { plural } from '../util/texto';

export function BarraSuperior() {
  const arvore = useLoja((s) => (s.arvoreAtualId ? s.arvores[s.arvoreAtualId] : undefined));
  const total = useLoja((s) => {
    const a = s.arvoreAtualId ? s.arvores[s.arvoreAtualId] : undefined;
    return a ? ramoDe(s.nos, a.raizId).length : 0;
  });
  const visao = useLoja((s) => s.visao);
  const largo = useLoja((s) => s.largo);
  const painelLigado = useLoja((s) => s.painelLigado);

  return (
    <header className="barra-superior">
      <button type="button" className="botao-icone" data-acao="menu" aria-label="Minhas árvores" onClick={() => abrirGaveta(true)}>
        <Menu size={24} />
      </button>
      <button type="button" className="barra-titulo" data-acao="arvores" onClick={() => abrirGaveta(true)}>
        <span className="barra-nome">{arvore?.nome ?? 'Baú'}</span>
        {arvore && <span className="barra-contagem">{plural(total, 'nó', 'nós')}</span>}
      </button>
      <span className="espaco" />
      <div className="alternador" role="group" aria-label="Modo de visualização">
        <button
          type="button"
          className={'alternador-opcao' + (visao === 'arvore' ? ' ativa' : '')}
          aria-pressed={visao === 'arvore'}
          data-acao="visao-arvore"
          onClick={() => definirVisao('arvore')}
        >
          <Network size={20} />
          <span>Árvore</span>
        </button>
        <button
          type="button"
          className={'alternador-opcao' + (visao === 'lista' ? ' ativa' : '')}
          aria-pressed={visao === 'lista'}
          data-acao="visao-lista"
          onClick={() => definirVisao('lista')}
        >
          <ListTree size={20} />
          <span>Lista</span>
        </button>
      </div>
      {largo && (
        <button
          type="button"
          className={'botao-icone' + (painelLigado ? ' ligado' : '')}
          data-acao="painel"
          aria-pressed={painelLigado}
          aria-label={painelLigado ? 'Esconder a nota ao lado da árvore' : 'Mostrar a nota ao lado da árvore'}
          onClick={alternarPainel}
        >
          {painelLigado ? <PanelRightClose size={22} /> : <PanelRightOpen size={22} />}
        </button>
      )}
    </header>
  );
}
