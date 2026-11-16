/**
 * Menu lateral com todas as árvores.
 */
import {
  BookOpenCheck, Ellipsis, FlaskConical, Moon, Network, Pencil, Plus, Search, Shapes, SunMedium, SunMoon, Trash2, X,
} from 'lucide-react';
import {
  abrirBusca, abrirGaveta, abrirTipos, adicionarExemplo, arvoresOrdenadas, criarArvore, criarArvoreDeTeste, excluirArvore, nosDaArvore, renomearArvore,
  resumoDaArvore, selecionarArvore, useLoja,
} from '../estado/loja';
import { useVoltar } from '../estado/navegacao';
import { infoSistema } from '../nativo/ponte';
import { escolherTema } from './tema';
import { avisarDesfazer } from '../arvore/acoesNo';
import { abrirMenu, avisar, confirmar, perguntarTexto } from '../ui/servico';
import { plural } from '../util/texto';

async function novaArvore(): Promise<void> {
  const nome = await perguntarTexto({
    titulo: 'Nova árvore',
    texto: 'O nome também vira a nota raiz, de onde saem os ramos.',
    dica: 'ex.: Dispneia',
    rotuloOk: 'Criar',
  });
  if (nome) criarArvore(nome);
}

async function adicionarArvoresDeExemplo(): Promise<void> {
  const ok = await confirmar({
    titulo: 'Adicionar as árvores de exemplo?',
    texto:
      'Cria cópias novas de “Dor torácica” e “Anticoagulação”, com notas próprias, para ver os tópicos em uso. ' +
      'Suas árvores não mudam, e as cópias podem ser excluídas depois.',
    rotuloOk: 'Adicionar',
  });
  if (!ok) return;
  try {
    await adicionarExemplo();
    avisar('Árvores de exemplo adicionadas');
  } catch {
    avisar('Não foi possível adicionar os exemplos');
  }
}

async function renomear(arvoreId: string, atual: string): Promise<void> {
  const nome = await perguntarTexto({ titulo: 'Renomear a árvore', valor: atual });
  if (nome) renomearArvore(arvoreId, nome);
}

async function excluir(arvoreId: string, nome: string): Promise<void> {
  const r = resumoDaArvore(arvoreId);
  const ok = await confirmar({
    titulo: `Excluir a árvore “${nome}”?`,
    texto:
      `A árvore tem ${plural(r.nos, 'nó', 'nós')}. ` +
      (r.notasParaLixeira > 0
        ? `${plural(r.notasParaLixeira, 'nota que não está', 'notas que não estão')} em outra árvore ${r.notasParaLixeira === 1 ? 'vai' : 'vão'} para a lixeira.`
        : 'As notas continuam nas outras árvores em que aparecem.'),
    rotuloOk: 'Excluir árvore',
    perigo: true,
  });
  if (ok && excluirArvore(arvoreId)) avisarDesfazer(`Árvore “${nome}” excluída`);
}

export function Gaveta() {
  const aberta = useLoja((s) => s.gavetaAberta);
  const arvores = useLoja((s) => s.arvores);
  const nos = useLoja((s) => s.nos);
  const atual = useLoja((s) => s.arvoreAtualId);
  const armazenamento = useLoja((s) => s.armazenamento);
  const tema = useLoja((s) => s.temaPreferido);
  useVoltar(aberta, () => abrirGaveta(false));

  if (!aberta) return null;
  const lista = arvoresOrdenadas(arvores);
  const info = infoSistema();

  return (
    <div
      className="camada-gaveta"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) abrirGaveta(false);
      }}
    >
      <nav className="gaveta" aria-label="Minhas árvores">
        <div className="gaveta-topo">
          <div>
            <div className="gaveta-marca">Baú</div>
            <div className="gaveta-lema">Suas notas ficam só neste aparelho</div>
          </div>
          <button type="button" className="botao-icone" aria-label="Fechar o menu" onClick={() => abrirGaveta(false)}>
            <X size={22} />
          </button>
        </div>

        <div className="gaveta-secao">Minhas árvores</div>
        <div className="gaveta-lista">
          {lista.map((a) => (
            <div key={a.id} className={'gaveta-item' + (a.id === atual ? ' atual' : '')}>
              <button type="button" className="gaveta-arvore" data-arvore={a.nome} onClick={() => selecionarArvore(a.id)}>
                <Network size={20} />
                <span className="gaveta-nome">{a.nome}</span>
                <span className="gaveta-contagem">{nosDaArvore(nos, a).length}</span>
              </button>
              <button
                type="button"
                className="botao-icone"
                aria-label={`Opções da árvore ${a.nome}`}
                onClick={(e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  abrirMenu({
                    titulo: a.nome,
                    x: Math.round(r.left),
                    y: Math.round(r.bottom),
                    itens: [
                      { id: 'renomear', rotulo: 'Renomear', icone: Pencil, aoEscolher: () => void renomear(a.id, a.nome) },
                      { id: 'excluir', rotulo: 'Excluir a árvore', icone: Trash2, perigo: true, aoEscolher: () => void excluir(a.id, a.nome) },
                    ],
                  });
                }}
              >
                <Ellipsis size={20} />
              </button>
            </div>
          ))}
          {lista.length === 0 && <div className="gaveta-vazia">Nenhuma árvore ainda.</div>}
        </div>
        <button type="button" className="gaveta-acao" data-acao="nova-arvore" onClick={() => void novaArvore()}>
          <Plus size={20} />
          Nova árvore
        </button>

        <div className="gaveta-secao">Organização</div>
        <button type="button" className="gaveta-acao discreta" data-acao="buscar" onClick={() => abrirBusca(true)}>
          <Search size={20} />
          Buscar notas (nome, tipo, A–Z)
        </button>
        <button type="button" className="gaveta-acao discreta" data-acao="tipos" onClick={() => abrirTipos(true)}>
          <Shapes size={20} />
          Tipos de nota
        </button>

        <div className="gaveta-secao">Aparência</div>
        <div className="gaveta-tema" role="radiogroup" aria-label="Tema">
          {(
            [
              ['sistema', 'Sistema', SunMoon],
              ['claro', 'Claro', SunMedium],
              ['escuro', 'Escuro', Moon],
            ] as const
          ).map(([valor, rotulo, Icone]) => (
            <button
              key={valor}
              type="button"
              role="radio"
              aria-checked={tema === valor}
              className={'gaveta-tema-opcao' + (tema === valor ? ' ativa' : '')}
              data-tema-opcao={valor}
              onClick={() => escolherTema(valor)}
            >
              <Icone size={20} />
              {rotulo}
            </button>
          ))}
        </div>

        <div className="gaveta-secao">Ferramentas</div>
        <button
          type="button"
          className="gaveta-acao discreta"
          data-acao="adicionar-exemplo"
          onClick={() => void adicionarArvoresDeExemplo()}
        >
          <BookOpenCheck size={20} />
          Adicionar as árvores de exemplo
        </button>
        <button
          type="button"
          className="gaveta-acao discreta"
          data-acao="arvore-teste"
          onClick={() => {
            criarArvoreDeTeste(600);
          }}
        >
          <FlaskConical size={20} />
          Criar árvore de teste com 600 nós
        </button>

        <div className="gaveta-rodape">
          <div>100% offline: o app não tem permissão de internet.</div>
          <div>Dados: {armazenamento}.</div>
          {info && (
            <div>
              Versão {info.versaoApp} · Android {info.android} · WebView {info.webview}
            </div>
          )}
        </div>
      </nav>
    </div>
  );
}
