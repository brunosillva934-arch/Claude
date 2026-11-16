/**
 * Edição dos tipos de nota: nome, cor e ícone de cada tipo, e criação de tipos
 * novos. A cor escolhida vale na árvore, nos chips e (etapa 4) na busca.
 */
import { useState, type CSSProperties } from 'react';
import { ArrowLeft, Check, ChevronRight, Plus, Trash2, X } from 'lucide-react';
import type { TipoNota } from '../dados/tipos';
import {
  abrirTipos, criarTipo, excluirTipo, notasDoTipo, salvarTipo, tiposOrdenados, useLoja,
} from '../estado/loja';
import { useVoltar } from '../estado/navegacao';
import { ICONES, iconeDoTipo } from '../ui/icones';
import { avisar, confirmar } from '../ui/servico';
import { PALETA, estiloDoTipo } from '../util/cores';
import { plural } from '../util/texto';

interface Rascunho {
  /** null = tipo novo. */
  id: string | null;
  nome: string;
  cor: string;
  icone: string;
}

function Formulario({ inicial, original, aoFechar }: { inicial: Rascunho; original: TipoNota | null; aoFechar: () => void }) {
  const escuro = useLoja((s) => s.escuro);
  const [r, setR] = useState(inicial);
  useVoltar(true, aoFechar);
  const Icone = iconeDoTipo(r.icone);
  const nome = r.nome.replace(/\s+/g, ' ').trim();

  const salvar = () => {
    if (!nome) return;
    if (original) salvarTipo({ ...original, nome, cor: r.cor, icone: r.icone });
    else criarTipo(nome, r.cor, r.icone);
    aoFechar();
  };

  const excluir = async () => {
    if (!original) return;
    const n = notasDoTipo(original.id);
    const ok = await confirmar({
      titulo: `Excluir o tipo “${original.nome}”?`,
      texto: n > 0 ? `${plural(n, 'nota passa', 'notas passam')} a ser do tipo Geral. O conteúdo não muda.` : undefined,
      rotuloOk: 'Excluir tipo',
      perigo: true,
    });
    if (ok && excluirTipo(original.id)) {
      avisar(`Tipo “${original.nome}” excluído`);
      aoFechar();
    }
  };

  return (
    <>
      <header className="folha-topo">
        <button type="button" className="botao-icone" aria-label="Voltar para a lista de tipos" onClick={aoFechar}>
          <ArrowLeft size={22} />
        </button>
        <h2>{original ? 'Editar tipo' : 'Novo tipo'}</h2>
      </header>
      <div className="folha-corpo">
        <div className="tipo-previa" style={estiloDoTipo(r.cor, escuro) as CSSProperties}>
          <span className="tipo-previa-icone">
            <Icone size={22} />
          </span>
          <span className="tipo-previa-nome">{nome || 'Nome do tipo'}</span>
        </div>

        <label className="rotulo-campo" htmlFor="tipo-nome">
          Nome
        </label>
        <input
          id="tipo-nome"
          className="campo"
          value={r.nome}
          placeholder="ex.: Síndrome, Escore, Vacina"
          autoCapitalize="sentences"
          enterKeyHint="done"
          onChange={(e) => setR({ ...r, nome: e.target.value })}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          }}
        />

        <div className="rotulo-campo">Cor</div>
        <div className="grade-cores" role="radiogroup" aria-label="Cor do tipo">
          {PALETA.map((cor) => (
            <button
              key={cor}
              type="button"
              role="radio"
              aria-checked={r.cor.toLowerCase() === cor.toLowerCase()}
              aria-label={`Cor ${cor}`}
              className={'amostra' + (r.cor.toLowerCase() === cor.toLowerCase() ? ' escolhida' : '')}
              style={{ background: cor }}
              onClick={() => setR({ ...r, cor })}
            >
              {r.cor.toLowerCase() === cor.toLowerCase() && <Check size={20} />}
            </button>
          ))}
        </div>

        <div className="rotulo-campo">Ícone</div>
        <div className="grade-icones" role="radiogroup" aria-label="Ícone do tipo" style={estiloDoTipo(r.cor, escuro) as CSSProperties}>
          {Object.entries(ICONES).map(([chave, item]) => {
            const I = item.icone;
            return (
              <button
                key={chave}
                type="button"
                role="radio"
                aria-checked={r.icone === chave}
                aria-label={item.nome}
                title={item.nome}
                className={'opcao-icone' + (r.icone === chave ? ' escolhida' : '')}
                onClick={() => setR({ ...r, icone: chave })}
              >
                <I size={22} />
              </button>
            );
          })}
        </div>
      </div>
      <footer className="folha-rodape">
        {original && !original.padrao && (
          <button type="button" className="botao texto-perigo" onClick={() => void excluir()}>
            <Trash2 size={18} />
            Excluir
          </button>
        )}
        <span className="espaco" />
        <button type="button" className="botao" onClick={aoFechar}>
          Cancelar
        </button>
        <button type="button" className="botao principal" data-acao="salvar-tipo" disabled={!nome} onClick={salvar}>
          Salvar
        </button>
      </footer>
    </>
  );
}

export function TiposDeNota() {
  const aberto = useLoja((s) => s.tiposAbertos);
  const tipos = useLoja((s) => s.tipos);
  const notas = useLoja((s) => s.notas);
  const escuro = useLoja((s) => s.escuro);
  const [rascunho, setRascunho] = useState<Rascunho | null>(null);
  const fechar = () => {
    setRascunho(null);
    abrirTipos(false);
  };
  useVoltar(aberto, fechar);

  if (!aberto) return null;
  const contagem = new Map<string, number>();
  for (const n of Object.values(notas)) {
    if (!n.excluidaEm) contagem.set(n.tipoId, (contagem.get(n.tipoId) ?? 0) + 1);
  }

  return (
    <div
      className="camada-folha"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) fechar();
      }}
    >
      <div className="folha" role="dialog" aria-modal="true" aria-label="Tipos de nota">
        {rascunho ? (
          <Formulario
            key={rascunho.id ?? 'novo'}
            inicial={rascunho}
            original={rascunho.id ? (tipos[rascunho.id] ?? null) : null}
            aoFechar={() => setRascunho(null)}
          />
        ) : (
          <>
            <header className="folha-topo">
              <h2>Tipos de nota</h2>
              <span className="espaco" />
              <button type="button" className="botao-icone" aria-label="Fechar" onClick={fechar}>
                <X size={22} />
              </button>
            </header>
            <div className="folha-corpo">
              {tiposOrdenados(tipos).map((t) => {
                const Icone = iconeDoTipo(t.icone);
                const n = contagem.get(t.id) ?? 0;
                return (
                  <button
                    key={t.id}
                    type="button"
                    className="linha-tipo"
                    data-tipo={t.nome}
                    style={estiloDoTipo(t.cor, escuro) as CSSProperties}
                    onClick={() => setRascunho({ id: t.id, nome: t.nome, cor: t.cor, icone: t.icone })}
                  >
                    <span className="linha-tipo-icone">
                      <Icone size={20} />
                    </span>
                    <span className="linha-tipo-nome">{t.nome}</span>
                    <span className="linha-tipo-qtd">{plural(n, 'nota', 'notas')}</span>
                    <ChevronRight size={20} />
                  </button>
                );
              })}
              <button
                type="button"
                className="gaveta-acao"
                data-acao="novo-tipo"
                onClick={() => setRascunho({ id: null, nome: '', cor: PALETA[8]!, icone: 'estrela' })}
              >
                <Plus size={20} />
                Novo tipo
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
