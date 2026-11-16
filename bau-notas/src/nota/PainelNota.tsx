/**
 * Painel da nota: cabeçalho fixo (tipo, estado do salvamento, tela cheia) e a
 * página, com o título e o texto num único contêiner de rolagem.
 */
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react';
import { ArrowLeft, Check, ChevronDown, LoaderCircle, Maximize2, Minimize2, PanelRightClose, TriangleAlert } from 'lucide-react';
import { aguardarEscritas, carregarNota } from '../dados/repositorio';
import type { Nota } from '../dados/tipos';
import { alternarPainel, expandirNota, indiceDe, renomearNota, useLoja } from '../estado/loja';
import { useVoltar } from '../estado/navegacao';
import { abrirMenuDeTipos } from '../arvore/acoesNo';
import { iconeDoTipo } from '../ui/icones';
import { estiloDoTipo } from '../util/cores';
import { plural } from '../util/texto';
import { CorpoDaNota } from './Editor';
import { aoMudarPendencias, haPendencias } from './salvamento';

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

export function PainelNota({ notaId }: { notaId: string }) {
  const meta = useLoja((s) => s.notas[notaId]);
  const tipo = useLoja((s) => (s.notas[notaId] ? s.tipos[s.notas[notaId]!.tipoId] : undefined));
  const escuro = useLoja((s) => s.escuro);
  const expandida = useLoja((s) => s.notaExpandida);
  const largo = useLoja((s) => s.largo);
  const usos = useLoja((s) => indiceDe(s.nos).porNota.get(notaId)?.length ?? 0);
  const [nota, setNota] = useState<Nota | null>(null);
  const [falha, setFalha] = useState<string | null>(null);
  useVoltar(expandida, () => expandirNota(false));

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
  const Icone = iconeDoTipo(tipo?.icone);

  return (
    <div className="painel-nota" style={estiloDoTipo(tipo?.cor, escuro) as CSSProperties} data-nota={notaId}>
      <header className="nota-cabecalho">
        {expandida && (
          <button type="button" className="botao-icone" aria-label="Voltar para a árvore" data-acao="voltar" onClick={() => expandirNota(false)}>
            <ArrowLeft size={22} />
          </button>
        )}
        <button
          type="button"
          className="seletor-tipo"
          data-acao="tipo"
          aria-label={`Tipo da nota: ${tipo?.nome ?? ''}. Tocar para mudar`}
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
        {usos > 1 && <span className="nota-usos">em {plural(usos, 'lugar', 'lugares')}</span>}
        <span className="espaco" />
        <EstadoDoSalvamento />
        {largo && (
          <button
            type="button"
            className="botao-icone"
            data-acao="tela-cheia"
            aria-label={expandida ? 'Voltar à tela dividida' : 'Nota em tela cheia'}
            onClick={() => expandirNota(!expandida)}
          >
            {expandida ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
        )}
        {largo && !expandida && (
          <button type="button" className="botao-icone" data-acao="fechar-painel" aria-label="Esconder a nota ao lado" onClick={alternarPainel}>
            <PanelRightClose size={20} />
          </button>
        )}
      </header>
      {nota ? (
        <CorpoDaNota key={nota.id} notaId={nota.id} conteudo={nota.conteudo} titulo={<Titulo notaId={notaId} />} />
      ) : (
        <>
          <div className="nota-barra" />
          <div className="nota-rolagem">
            <div className="nota-pagina">
              <Titulo notaId={notaId} />
              {falha && <p className="nota-falha">{falha}</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
