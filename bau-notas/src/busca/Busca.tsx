/**
 * Busca de notas.
 *
 * - Com o campo vazio: todas as notas em ordem alfabética, com o índice de A a Z
 *   na lateral (como na agenda de contatos: dá para deslizar o dedo pelas letras).
 * - Digitando: busca por nome e no conteúdo, ignorando acentos e tolerando erros
 *   de digitação, com o trecho encontrado em destaque.
 * - Em qualquer caso, os tipos (Doença, Medicamento, Exame…) filtram a lista e
 *   podem ser combinados.
 */
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { ArrowLeft, Hash, Heading, Search, X } from 'lucide-react';
import { carregarTextos, aguardarEscritas } from '../dados/repositorio';
import type { NotaMeta } from '../dados/tipos';
import { abrirBusca, abrirNota, indiceDe, tiposOrdenados, tituloDaNota, useLoja } from '../estado/loja';
import { useVoltar } from '../estado/navegacao';
import { gravarTudo } from '../nota/salvamento';
import { iconeDoTipo } from '../ui/icones';
import { estiloDoTipo } from '../util/cores';
import { compararTexto, normalizar, plural } from '../util/texto';
import { IndiceDeBusca, type Achado, type Trecho } from './indice';

const LETRAS = ['#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];

function letraDe(titulo: string): string {
  const c = normalizar(titulo).charAt(0).toUpperCase();
  return c >= 'A' && c <= 'Z' ? c : '#';
}

function Destaque({ trecho }: { trecho: Trecho }) {
  return (
    <>
      {trecho.antes}
      <mark>{trecho.achado}</mark>
      {trecho.depois}
    </>
  );
}

interface Item {
  nota: NotaMeta;
  achado: Achado | null;
}

function Linha({ item, aoAbrir }: { item: Item; aoAbrir: (nota: NotaMeta) => void }) {
  const { nota, achado } = item;
  const tipo = useLoja((s) => s.tipos[nota.tipoId]);
  const escuro = useLoja((s) => s.escuro);
  // Em quais árvores a nota aparece.
  const onde = useLoja((s) => {
    const usos = indiceDe(s.nos).porNota.get(nota.id) ?? [];
    const nomes: string[] = [];
    for (const id of usos) {
      const no = s.nos[id]!;
      let nome = s.arvores[no.arvoreId]?.nome;
      if (!nome) continue;
      // Para um tópico, ajuda saber de qual nota ele é item.
      if (nota.topico && no.paiId) nome += ' › ' + tituloDaNota(s.notas[s.nos[no.paiId]!.notaId]);
      if (!nomes.includes(nome)) nomes.push(nome);
    }
    return nomes.join(' · ');
  });
  const Icone = nota.secao ? Heading : iconeDoTipo(tipo?.icone);

  return (
    <button
      type="button"
      className="busca-linha"
      data-resultado={tituloDaNota(nota)}
      style={estiloDoTipo(nota.secao ? '#243042' : tipo?.cor, escuro) as CSSProperties}
      onClick={() => aoAbrir(nota)}
    >
      <span className="busca-icone">
        <Icone size={20} />
      </span>
      <span className="busca-texto">
        <span className="busca-titulo">{achado?.titulo ? <Destaque trecho={achado.titulo} /> : tituloDaNota(nota)}</span>
        <span className="busca-detalhe">
          <span className="busca-tipo">
            {nota.secao ? 'Seção' : (tipo?.nome ?? 'Nota')}
            {nota.topico && <span className="busca-marca-topico">tópico</span>}
          </span>
          <span className="busca-onde">{onde ? `em ${onde}` : 'fora das árvores'}</span>
        </span>
        {achado?.trecho ? (
          <span className="busca-trecho">
            <Destaque trecho={achado.trecho} />
          </span>
        ) : (
          nota.topico &&
          nota.resumo.trim() && <span className="busca-trecho recomendacao">{nota.resumo}</span>
        )}
      </span>
    </button>
  );
}

function Painel() {
  const notas = useLoja((s) => s.notas);
  const tipos = useLoja((s) => s.tipos);
  const escuro = useLoja((s) => s.escuro);
  const [consulta, setConsulta] = useState('');
  const [tiposEscolhidos, setTiposEscolhidos] = useState<string[]>([]);
  const [soTopicos, setSoTopicos] = useState(false);
  const [textos, setTextos] = useState<Map<string, string> | null>(null);
  const [letraNaBolha, setLetraNaBolha] = useState<string | null>(null);
  const campo = useRef<HTMLInputElement>(null);
  const lista = useRef<HTMLDivElement>(null);
  const fechar = () => abrirBusca(false);
  useVoltar(true, fechar);

  useEffect(() => {
    campo.current?.focus({ preventScroll: true });
  }, []);

  // O conteúdo das notas é lido uma vez, ao abrir a busca. Antes, grava o que estiver pendente.
  useEffect(() => {
    let vivo = true;
    gravarTudo();
    aguardarEscritas()
      .then(carregarTextos)
      .then((t) => {
        if (vivo) setTextos(t);
      })
      .catch(() => {
        if (vivo) setTextos(new Map());
      });
    return () => {
      vivo = false;
    };
  }, []);

  const ativas = useMemo(() => Object.values(notas).filter((n) => !n.excluidaEm), [notas]);
  const indice = useMemo(() => new IndiceDeBusca(ativas, textos), [ativas, textos]);

  // Tópicos entram junto com as notas do mesmo tipo (um medicamento é medicamento, seja nota ou tópico).
  // Seções não têm tipo: aparecem só sem filtro.
  const passa = (n: NotaMeta) =>
    (!soTopicos || n.topico) && (tiposEscolhidos.length === 0 || (!n.secao && tiposEscolhidos.includes(n.tipoId)));

  const buscando = normalizar(consulta).length > 0;
  const itens: Item[] = useMemo(() => {
    if (buscando) {
      const saida: Item[] = [];
      for (const achado of indice.buscar(consulta)) {
        const nota = notas[achado.notaId];
        if (nota && !nota.excluidaEm && passa(nota)) saida.push({ nota, achado });
      }
      return saida;
    }
    return ativas
      .filter(passa)
      .sort((a, b) => compararTexto(tituloDaNota(a), tituloDaNota(b)))
      .map((nota) => ({ nota, achado: null }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buscando, consulta, indice, ativas, notas, tiposEscolhidos, soTopicos]);

  // Em ordem alfabética, as notas são agrupadas pela primeira letra.
  const grupos = useMemo(() => {
    if (buscando) return [];
    const mapa = new Map<string, Item[]>();
    for (const item of itens) {
      const letra = letraDe(tituloDaNota(item.nota));
      const grupo = mapa.get(letra);
      if (grupo) grupo.push(item);
      else mapa.set(letra, [item]);
    }
    return LETRAS.filter((l) => mapa.has(l)).map((l) => ({ letra: l, itens: mapa.get(l)! }));
  }, [buscando, itens]);
  const letrasComNotas = useMemo(() => new Set(grupos.map((g) => g.letra)), [grupos]);

  const abrir = (nota: NotaMeta) => {
    abrirBusca(false);
    abrirNota(nota.id);
  };

  const irParaLetra = (letra: string) => {
    const caixa = lista.current;
    if (!caixa) return;
    // Letra sem notas: vai para a próxima que tiver.
    const inicio = LETRAS.indexOf(letra);
    const destino = LETRAS.slice(inicio).find((l) => letrasComNotas.has(l)) ?? [...letrasComNotas].pop();
    if (!destino) return;
    const secao = caixa.querySelector<HTMLElement>(`[data-letra="${destino}"]`);
    if (secao) caixa.scrollTop = secao.offsetTop;
    setLetraNaBolha(destino);
  };

  const aoDeslizar = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const i = Math.floor(((e.clientY - r.top) / r.height) * LETRAS.length);
    irParaLetra(LETRAS[Math.max(0, Math.min(LETRAS.length - 1, i))]!);
  };

  const alternarTipo = (id: string) => {
    setTiposEscolhidos((atual) => (atual.includes(id) ? atual.filter((t) => t !== id) : [...atual, id]));
  };

  const quantos = buscando
    ? plural(itens.length, 'resultado', 'resultados')
    : soTopicos
      ? plural(itens.length, 'tópico', 'tópicos')
      : plural(itens.length, 'item', 'itens');

  return (
    <div className="busca" role="dialog" aria-modal="true" aria-label="Buscar notas">
      <header className="busca-topo">
        <button type="button" className="botao-icone" aria-label="Fechar a busca" data-acao="fechar-busca" onClick={fechar}>
          <ArrowLeft size={24} />
        </button>
        <div className="busca-campo">
          <Search size={20} />
          <input
            ref={campo}
            value={consulta}
            placeholder="Buscar por nome ou conteúdo"
            aria-label="Buscar por nome ou conteúdo"
            enterKeyHint="search"
            autoCapitalize="none"
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => {
              setConsulta(e.target.value);
              if (lista.current) lista.current.scrollTop = 0;
            }}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === 'Escape') {
                e.preventDefault();
                if (consulta) setConsulta('');
                else fechar();
              } else if (e.key === 'Enter') {
                e.preventDefault();
                if (buscando && itens[0]) abrir(itens[0].nota);
                else (e.target as HTMLInputElement).blur();
              }
            }}
          />
          {consulta && (
            <button type="button" className="busca-limpar" aria-label="Limpar a busca" onClick={() => { setConsulta(''); campo.current?.focus(); }}>
              <X size={18} />
            </button>
          )}
        </div>
      </header>

      <div className="busca-tipos" role="group" aria-label="Filtrar por tipo">
        <button
          type="button"
          className={'chip' + (tiposEscolhidos.length === 0 ? ' ativo' : '')}
          aria-pressed={tiposEscolhidos.length === 0}
          data-tipo="todos"
          onClick={() => setTiposEscolhidos([])}
        >
          Todos
        </button>
        {tiposOrdenados(tipos).map((t) => {
          const Icone = iconeDoTipo(t.icone);
          const ativo = tiposEscolhidos.includes(t.id);
          return (
            <button
              key={t.id}
              type="button"
              className={'chip de-tipo' + (ativo ? ' ativo' : '')}
              aria-pressed={ativo}
              data-tipo={t.nome}
              style={estiloDoTipo(t.cor, escuro) as CSSProperties}
              onClick={() => alternarTipo(t.id)}
            >
              <Icone size={16} />
              {t.nome}
            </button>
          );
        })}
        <button
          type="button"
          className={'chip' + (soTopicos ? ' ativo' : '')}
          aria-pressed={soTopicos}
          data-tipo="topicos"
          onClick={() => setSoTopicos(!soTopicos)}
        >
          <Hash size={16} />
          Só tópicos
        </button>
      </div>

      <div className="busca-corpo">
        <div className="busca-lista" ref={lista}>
          <div className="busca-contagem">
            {quantos}
            {buscando && !indice.comConteudo && ' (carregando o conteúdo das notas…)'}
          </div>
          {buscando
            ? itens.map((item) => <Linha key={item.nota.id} item={item} aoAbrir={abrir} />)
            : grupos.map((g) => (
                <section key={g.letra} className="busca-grupo" data-letra={g.letra}>
                  <h3 className="busca-letra">{g.letra}</h3>
                  {g.itens.map((item) => (
                    <Linha key={item.nota.id} item={item} aoAbrir={abrir} />
                  ))}
                </section>
              ))}
          {itens.length === 0 && (
            <div className="busca-vazia">
              {buscando ? 'Nada encontrado. Confira os tipos selecionados acima.' : 'Nenhuma nota com este filtro.'}
            </div>
          )}
        </div>

        {!buscando && grupos.length > 0 && (
          <div
            className="indice-az"
            role="navigation"
            aria-label="Índice alfabético"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              campo.current?.blur();
              aoDeslizar(e);
            }}
            onPointerMove={(e) => {
              if (e.currentTarget.hasPointerCapture(e.pointerId)) aoDeslizar(e);
            }}
            onPointerUp={() => setLetraNaBolha(null)}
            onPointerCancel={() => setLetraNaBolha(null)}
          >
            {LETRAS.map((l) => (
              <span key={l} className={'indice-letra' + (letrasComNotas.has(l) ? '' : ' vazia')} data-indice={l}>
                {l}
              </span>
            ))}
          </div>
        )}
        {letraNaBolha && <div className="indice-bolha">{letraNaBolha}</div>}
      </div>
    </div>
  );
}

export function Busca() {
  const aberta = useLoja((s) => s.buscaAberta);
  return aberta ? <Painel /> : null;
}
