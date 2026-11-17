/**
 * Painel da nota: cabeçalho fixo (tipo, estado do salvamento, tela cheia) e a
 * página, com o título e o texto num único contêiner de rolagem.
 */
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
  ArrowLeft, Check, ChevronDown, CornerDownRight, CornerLeftUp, FileText, Hash, Heading, LoaderCircle, Maximize2, Minimize2,
  PanelRightClose, Plus, Search, TableOfContents, TriangleAlert,
} from 'lucide-react';
import { aguardarEscritas, carregarNota } from '../dados/repositorio';
import type { Nota } from '../dados/tipos';
import {
  abrirBusca, alternarPainel, alternarSumario, criarFilho, definirForma, definirTopico, expandirNota, filhosDe, indiceDe, irParaNo, renomearNota,
  tituloDaNota, useLoja,
} from '../estado/loja';
import { useVoltar } from '../estado/navegacao';
import { abrirMenuDeFormato, abrirMenuDeTipos } from '../arvore/acoesNo';
import { formaDe, type Forma } from '../dados/tipos';
import { iconeDoTipo } from '../ui/icones';
import { estiloDoTipo } from '../util/cores';
import { plural } from '../util/texto';
import { CorpoDaNota } from './Editor';
import { aoMudarPendencias, gravarResumo, haPendencias, marcarResumo } from './salvamento';
import { useTextoVivo } from './textoVivo';

function EstadoDoSalvamento() {
  const pendente = useSyncExternalStore(aoMudarPendencias, () => haPendencias());
  const salvamento = useLoja((s) => s.salvamento);
  if (salvamento === 'erro') {
    return (
      <span className="estado-salvar erro" role="status">
        <TriangleAlert size={16} />
        Erro ao salvar
      </span>
    );
  }
  if (pendente || salvamento === 'salvando') {
    return (
      <span className="estado-salvar" role="status">
        <LoaderCircle size={16} className="girando" />
        Salvando…
      </span>
    );
  }
  return (
    <span className="estado-salvar salvo" role="status">
      <Check size={16} />
      Salvo
    </span>
  );
}

function Titulo({ notaId }: { notaId: string }) {
  const tituloSalvo = useLoja((s) => s.notas[notaId]?.titulo ?? '');
  const [valor, setValor] = useState(tituloSalvo);
  const emFoco = useRef(false);
  const temporizador = useRef(0);
  const campo = useRef<HTMLTextAreaElement>(null);

  // Se o título mudar por fora (renomeado na árvore), o campo acompanha.
  useEffect(() => {
    if (!emFoco.current) setValor(tituloSalvo);
  }, [tituloSalvo]);

  // O campo cresce com o texto. Só é recalculado quando o título muda, nunca ao digitar na nota.
  useEffect(() => {
    const el = campo.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [valor]);

  const gravar = (texto: string) => {
    window.clearTimeout(temporizador.current);
    const limpo = texto.replace(/\s+/g, ' ').trim();
    if (limpo && limpo !== useLoja.getState().notas[notaId]?.titulo) renomearNota(notaId, limpo);
  };

  return (
    <textarea
      ref={campo}
      className="nota-titulo"
      rows={1}
      value={valor}
      placeholder="Título"
      aria-label="Título da nota"
      enterKeyHint="done"
      autoCapitalize="sentences"
      onFocus={() => {
        emFoco.current = true;
      }}
      onBlur={() => {
        emFoco.current = false;
        gravar(valor);
        if (!valor.trim()) setValor(useLoja.getState().notas[notaId]?.titulo ?? '');
      }}
      onChange={(e) => {
        const texto = e.target.value.replace(/\n/g, ' ');
        setValor(texto);
        window.clearTimeout(temporizador.current);
        temporizador.current = window.setTimeout(() => gravar(texto), 350);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          (e.target as HTMLTextAreaElement).blur();
        }
      }}
    />
  );
}

/** Nó desta nota que está em foco: o selecionado, se for dela, ou o primeiro lugar em que ela aparece. */
function useNoDaNota(notaId: string): string | undefined {
  return useLoja((s) => {
    const usos = indiceDe(s.nos).porNota.get(notaId) ?? [];
    return s.selecionadoId && usos.includes(s.selecionadoId) ? s.selecionadoId : usos[0];
  });
}

/** Contador de palavras, discreto, atualizado com atraso. */
function ContadorDePalavras({ notaId }: { notaId: string }) {
  const texto = useTextoVivo();
  if (texto.notaId !== notaId) return null;
  return <span className="contador-palavras">{plural(texto.palavras, 'palavra', 'palavras')}</span>;
}

/** Abre o sumário: painel fixo em tela cheia, painel deslizante nos outros casos. */
function BotaoDoSumario() {
  const aberto = useLoja((s) => (s.notaExpandida && s.largo ? s.sumarioFixo : s.sumarioAberto));
  return (
    <button
      type="button"
      className={'botao-icone' + (aberto ? ' ligado' : '')}
      data-acao="sumario"
      aria-pressed={aberto}
      aria-label="Sumário"
      title="Sumário"
      onPointerDown={(e) => e.preventDefault()}
      onClick={alternarSumario}
    >
      <TableOfContents size={20} />
    </button>
  );
}

/** Cabeçalho comum: tipo, estado do salvamento, tela cheia e fechar. */
function Cabecalho({ notaId, forma }: { notaId: string; forma: Forma }) {
  const topico = forma === 'topico';
  const tipo = useLoja((s) => (s.notas[notaId] ? s.tipos[s.notas[notaId]!.tipoId] : undefined));
  const expandida = useLoja((s) => s.notaExpandida);
  const largo = useLoja((s) => s.largo);
  const usos = useLoja((s) => indiceDe(s.nos).porNota.get(notaId)?.length ?? 0);
  const Icone = iconeDoTipo(tipo?.icone);
  return (
    <header className="nota-cabecalho">
      {expandida && (
        <button type="button" className="botao-icone" aria-label="Voltar para a árvore" data-acao="voltar" onClick={() => expandirNota(false)}>
          <ArrowLeft size={22} />
        </button>
      )}
      {forma === 'secao' ? (
        // Seção não tem tipo: o selo leva ao menu de formato.
        <button
          type="button"
          className="selo-secao"
          data-acao="formato"
          aria-label="Seção. Tocar para mudar o formato"
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            abrirMenuDeFormato(notaId, Math.round(r.left), Math.round(r.bottom + 6));
          }}
        >
          <Heading size={16} />
          Seção
          <ChevronDown size={16} />
        </button>
      ) : (
        <button
          type="button"
          className="seletor-tipo"
          data-acao="tipo"
          aria-label={`Tipo: ${tipo?.nome ?? ''}. Tocar para mudar`}
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            abrirMenuDeTipos(notaId, Math.round(r.left), Math.round(r.bottom + 6));
          }}
        >
          <span className="seletor-tipo-icone">
            <Icone size={18} />
          </span>
          <span className="seletor-tipo-nome">{tipo?.nome ?? 'Tipo'}</span>
          <ChevronDown size={16} />
        </button>
      )}
      {topico && (
        <span className="selo-topico">
          <Hash size={14} />
          Tópico
        </span>
      )}
      {usos > 1 && <span className="nota-usos">em {plural(usos, 'lugar', 'lugares')}</span>}
      <span className="espaco" />
      {forma === 'nota' && <ContadorDePalavras notaId={notaId} />}
      <EstadoDoSalvamento />
      {forma === 'nota' && <BotaoDoSumario />}
      {expandida && (
        <button type="button" className="botao-icone" data-acao="buscar" aria-label="Buscar notas" onClick={() => abrirBusca(true)}>
          <Search size={20} />
        </button>
      )}
      {largo && (
        <button
          type="button"
          className="botao-icone"
          data-acao="tela-cheia"
          aria-label={expandida ? 'Voltar à tela dividida' : 'Tela cheia'}
          onClick={() => expandirNota(!expandida)}
        >
          {expandida ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
        </button>
      )}
      {largo && !expandida && (
        <button type="button" className="botao-icone" data-acao="fechar-painel" aria-label="Esconder o painel ao lado" onClick={alternarPainel}>
          <PanelRightClose size={20} />
        </button>
      )}
    </header>
  );
}

const LIMITE_RESUMO = 240;

/** Campo da recomendação de um tópico. O cartão na árvore acompanha enquanto se digita. */
function CampoResumo({ notaId }: { notaId: string }) {
  const salvo = useLoja((s) => s.notas[notaId]?.resumo ?? '');
  const [valor, setValor] = useState(salvo);
  const emFoco = useRef(false);
  const campo = useRef<HTMLTextAreaElement>(null);

  // Mudou por fora (pelo menu do nó): o campo acompanha.
  useEffect(() => {
    if (!emFoco.current) setValor(salvo);
  }, [salvo]);

  useEffect(() => {
    const el = campo.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [valor]);

  useEffect(() => () => gravarResumo(notaId), [notaId]);

  return (
    <div className="campo-resumo">
      <textarea
        ref={campo}
        id={`resumo-${notaId}`}
        className="campo resumo"
        rows={2}
        value={valor}
        maxLength={LIMITE_RESUMO}
        placeholder="Ex.: tomar com alimento; ajustar pela função renal."
        aria-label="Recomendação"
        autoCapitalize="sentences"
        onFocus={() => {
          emFoco.current = true;
        }}
        onBlur={() => {
          emFoco.current = false;
          gravarResumo(notaId);
        }}
        onChange={(e) => {
          // Sem quebras de linha: é uma recomendação curta, mostrada no cartão.
          const texto = e.target.value.replace(/\n+/g, ' ');
          setValor(texto);
          marcarResumo(notaId, texto);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            (e.target as HTMLTextAreaElement).blur();
          }
        }}
      />
      <span className="campo-resumo-contagem">
        {valor.length}/{LIMITE_RESUMO}
      </span>
    </div>
  );
}

/** Uma linha de item (tópico ou nota), com a recomendação, que leva ao nó na árvore. */
function LinhaDeItem({ noId }: { noId: string }) {
  const nota = useLoja((s) => (s.nos[noId] ? s.notas[s.nos[noId]!.notaId] : undefined));
  const tipo = useLoja((s) => {
    const n = s.nos[noId] ? s.notas[s.nos[noId]!.notaId] : undefined;
    return n ? s.tipos[n.tipoId] : undefined;
  });
  const rotulo = useLoja((s) => s.nos[noId]?.rotuloDoRamo ?? null);
  const escuro = useLoja((s) => s.escuro);
  const Icone = nota?.secao ? Heading : iconeDoTipo(tipo?.icone);
  const recomendacao = nota?.topico ? nota.resumo.trim() : '';
  return (
    <button
      type="button"
      className={'item-do-ramo' + (nota?.topico ? ' topico' : '') + (nota?.secao ? ' secao' : '')}
      data-item={tituloDaNota(nota)}
      style={estiloDoTipo(tipo?.cor, escuro) as CSSProperties}
      onClick={() => irParaNo(noId)}
    >
      <span className="item-icone">
        <Icone size={18} />
      </span>
      <span className="item-textos">
        <span className="item-titulo">
          {tituloDaNota(nota)}
          {rotulo && <span className="linha-rotulo">{rotulo}</span>}
        </span>
        {recomendacao && (
          <span className="item-resumo">
            <CornerDownRight size={14} />
            {recomendacao}
          </span>
        )}
      </span>
    </button>
  );
}

/**
 * Na nota de cima (a que explica o mecanismo), a lista dos tópicos que estão
 * embaixo dela na árvore, com as recomendações. Fica logo abaixo do título.
 */
function ItensDoRamo({ notaId }: { notaId: string }) {
  const noId = useNoDaNota(notaId);
  const itens = useLoja(
    useShallow((s) => (noId ? filhosDe(s.nos, noId).filter((id) => s.notas[s.nos[id]!.notaId]?.topico) : [])),
  );
  const expandida = useLoja((s) => s.notaExpandida);
  if (!noId || itens.length === 0) return null;
  return (
    <section className="itens-do-ramo" aria-label="Tópicos deste ramo">
      <h3 className="itens-titulo">
        <Hash size={15} />
        {plural(itens.length, 'tópico', 'tópicos')} neste ramo
      </h3>
      {itens.map((id) => (
        <LinhaDeItem key={id} noId={id} />
      ))}
      {!expandida && (
        <button type="button" className="item-novo" data-acao="novo-item" onClick={() => criarFilho(noId, 'topico')}>
          <Plus size={18} />
          Adicionar tópico
        </button>
      )}
    </section>
  );
}

/**
 * Painel de um tópico: o nome, a nota de que ele é item e a recomendação curta,
 * que aparece no cartão da árvore.
 */
function PainelTopico({ notaId }: { notaId: string }) {
  const tipo = useLoja((s) => (s.notas[notaId] ? s.tipos[s.notas[notaId]!.tipoId] : undefined));
  const escuro = useLoja((s) => s.escuro);
  const expandida = useLoja((s) => s.notaExpandida);
  const noId = useNoDaNota(notaId);
  const paiId = useLoja((s) => (noId ? (s.nos[noId]?.paiId ?? null) : null));
  const tituloDoPai = useLoja((s) => (paiId && s.nos[paiId] ? tituloDaNota(s.notas[s.nos[paiId]!.notaId]) : null));
  const filhos = useLoja(useShallow((s) => (noId ? filhosDe(s.nos, noId) : [])));
  useVoltar(expandida, () => expandirNota(false));

  return (
    <div className="painel-nota" style={estiloDoTipo(tipo?.cor, escuro) as CSSProperties} data-nota={notaId} data-topico="">
      <Cabecalho notaId={notaId} forma="topico" />
      <div className="nota-rolagem">
        <div className="nota-pagina sem-espaco">
          <Titulo notaId={notaId} />
          {paiId && tituloDoPai && (
            <button type="button" className="topico-pai" data-acao="ir-para-pai" onClick={() => irParaNo(paiId)}>
              <CornerLeftUp size={16} />
              Tópico de <strong>{tituloDoPai}</strong>
            </button>
          )}
          <label className="rotulo-campo" htmlFor={`resumo-${notaId}`}>
            Recomendação
          </label>
          <CampoResumo notaId={notaId} />
          <p className="topico-explica">
            Aparece no próprio tópico, na árvore. Para escrever mais, transforme em nota completa.
          </p>
          <button type="button" className="botao" data-acao="virar-nota" onClick={() => definirTopico(notaId, false)}>
            <FileText size={18} />
            Transformar em nota completa
          </button>
          {filhos.length > 0 && (
            <>
              <h3 className="topico-secao">Dentro deste tópico</h3>
              <div className="topico-filhos">
                {filhos.map((id) => (
                  <LinhaDeItem key={id} noId={id} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Painel de uma seção: só o título e o que há dentro dela, com um atalho para
 * acrescentar mais um nó.
 */
function PainelSecao({ notaId }: { notaId: string }) {
  const escuro = useLoja((s) => s.escuro);
  const expandida = useLoja((s) => s.notaExpandida);
  const noId = useNoDaNota(notaId);
  const filhos = useLoja(useShallow((s) => (noId ? filhosDe(s.nos, noId) : [])));
  useVoltar(expandida, () => expandirNota(false));

  return (
    <div className="painel-nota" style={estiloDoTipo('#243042', escuro) as CSSProperties} data-nota={notaId} data-secao="">
      <Cabecalho notaId={notaId} forma="secao" />
      <div className="nota-rolagem">
        <div className="nota-pagina sem-espaco">
          <Titulo notaId={notaId} />
          <p className="topico-explica">
            Seção: só um título, em destaque na árvore, para agrupar os ramos. Não tem texto nem tipo.
          </p>
          <h3 className="topico-secao">
            {filhos.length ? plural(filhos.length, 'item nesta seção', 'itens nesta seção') : 'Nada nesta seção ainda'}
          </h3>
          <div className="topico-filhos">
            {filhos.map((id) => (
              <LinhaDeItem key={id} noId={id} />
            ))}
          </div>
          {noId && !expandida && (
            <button type="button" className="item-novo" data-acao="novo-na-secao" onClick={() => criarFilho(noId)}>
              <Plus size={18} />
              Adicionar nesta seção
            </button>
          )}
          <button type="button" className="botao" data-acao="virar-nota" onClick={() => definirForma(notaId, 'nota')}>
            <FileText size={18} />
            Transformar em nota completa
          </button>
        </div>
      </div>
    </div>
  );
}

export function PainelNota({ notaId }: { notaId: string }) {
  const forma = useLoja((s) => formaDe(s.notas[notaId]));
  if (forma === 'secao') return <PainelSecao notaId={notaId} />;
  if (forma === 'topico') return <PainelTopico notaId={notaId} />;
  return <PainelDaNota notaId={notaId} />;
}

function PainelDaNota({ notaId }: { notaId: string }) {
  const meta = useLoja((s) => s.notas[notaId]);
  const tipo = useLoja((s) => (s.notas[notaId] ? s.tipos[s.notas[notaId]!.tipoId] : undefined));
  const escuro = useLoja((s) => s.escuro);
  const expandida = useLoja((s) => s.notaExpandida);
  const foco = useLoja((s) => s.foco);
  const [nota, setNota] = useState<Nota | null>(null);
  const [falha, setFalha] = useState<string | null>(null);
  // No modo foco, quem responde ao voltar são os controles do foco.
  useVoltar(expandida && !foco, () => expandirNota(false));

  useEffect(() => {
    let vivo = true;
    setNota(null);
    setFalha(null);
    // Antes de ler, espera gravar o que ainda estiver a caminho do disco.
    aguardarEscritas()
      .then(() => carregarNota(notaId))
      .then((n) => {
        if (!vivo) return;
        if (n) setNota(n);
        else setFalha('Esta nota não foi encontrada.');
      })
      .catch((e: unknown) => {
        if (vivo) setFalha(e instanceof Error ? e.message : String(e));
      });
    return () => {
      vivo = false;
    };
  }, [notaId]);

  if (!meta) return null;
  const cabecaDaPagina = (
    <>
      <Titulo notaId={notaId} />
      <ItensDoRamo notaId={notaId} />
    </>
  );

  return (
    <div className="painel-nota" style={estiloDoTipo(tipo?.cor, escuro) as CSSProperties} data-nota={notaId}>
      {!foco && <Cabecalho notaId={notaId} forma="nota" />}
      {nota ? (
        <CorpoDaNota key={nota.id} notaId={nota.id} conteudo={nota.conteudo} titulo={cabecaDaPagina} />
      ) : (
        <>
          <div className="nota-barra" />
          <div className="nota-rolagem">
            <div className="nota-pagina">
              {cabecaDaPagina}
              {falha && <p className="nota-falha">{falha}</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
