/**
 * Leitura e gravação no banco.
 *
 * As funções `sql*` só montam as instruções; quem as executa é `enfileirar`,
 * que preserva a ordem e nunca bloqueia a tela.
 */
import type { Banco, Instrucao, Param } from './banco';
import type { Arvore, No, Nota, NotaMeta, TipoNota } from './tipos';

let banco: Banco | null = null;
let pendentes = 0;
const emAndamento = new Set<Promise<void>>();
const ouvintesFila = new Set<(pendentes: number, erro: Error | null) => void>();

export function usarBanco(b: Banco): void {
  banco = b;
}

export function bancoAtual(): Banco {
  if (!banco) throw new Error('Banco ainda não aberto');
  return banco;
}

function avisarFila(erro: Error | null): void {
  for (const f of ouvintesFila) f(pendentes, erro);
}

/** Acompanha as gravações em andamento (para o indicador "Salvo"). */
export function aoMudarFila(f: (pendentes: number, erro: Error | null) => void): () => void {
  ouvintesFila.add(f);
  return () => ouvintesFila.delete(f);
}

/**
 * Manda gravar, sem esperar. Cada lote é enviado na hora e executado numa
 * transação; a casca Android processa os lotes um a um, na ordem de chegada,
 * de modo que uma gravação nunca passa na frente de outra mais antiga.
 */
export function enfileirar(instrucoes: Instrucao[]): Promise<void> {
  if (instrucoes.length === 0) return Promise.resolve();
  pendentes++;
  avisarFila(null);
  const gravacao = bancoAtual().lote(instrucoes);
  const fim: Promise<void> = gravacao.then(
    () => {
      pendentes--;
      emAndamento.delete(fim);
      avisarFila(null);
    },
    (e: unknown) => {
      pendentes--;
      emAndamento.delete(fim);
      avisarFila(e instanceof Error ? e : new Error(String(e)));
    },
  );
  emAndamento.add(fim);
  return gravacao;
}

/**
 * Grava e só volta depois de confirmado em disco. Entra na mesma ordem das
 * gravações já enviadas. Usada quando o app vai para segundo plano.
 */
export function gravarSinc(instrucoes: Instrucao[]): void {
  if (instrucoes.length === 0) return;
  bancoAtual().loteSinc(instrucoes);
}

/** Resolve quando tudo o que foi enviado até agora tiver sido gravado. */
export async function aguardarEscritas(): Promise<void> {
  while (emAndamento.size > 0) await Promise.all([...emAndamento]);
}

// ---------------------------------------------------------------- leitura

interface LinhaTipo { id: string; nome: string; cor: string; icone: string; ordem: number; padrao: number }
interface LinhaNo {
  id: string; arvoreId: string; notaId: string; paiId: string | null; ordem: number;
  rotuloDoRamo: string | null; recolhido: number;
}

export interface DadosIniciais {
  tipos: TipoNota[];
  notas: NotaMeta[];
  arvores: Arvore[];
  nos: No[];
  config: Record<string, string>;
}

export async function carregarTudo(): Promise<DadosIniciais> {
  const b = bancoAtual();
  const [tipos, notas, arvores, nos, config] = await Promise.all([
    b.consultar<LinhaTipo>('SELECT id, nome, cor, icone, ordem, padrao FROM tipos ORDER BY ordem, nome'),
    b.consultar<NotaMeta>('SELECT id, titulo, tipoId, criadaEm, atualizadaEm, excluidaEm FROM notas'),
    b.consultar<Arvore>(
      'SELECT id, nome, raizId, ordem, criadaEm, excluidaEm FROM arvores WHERE excluidaEm IS NULL ORDER BY ordem, criadaEm',
    ),
    b.consultar<LinhaNo>(
      'SELECT id, arvoreId, notaId, paiId, ordem, rotuloDoRamo, recolhido FROM nos WHERE excluidoEm IS NULL',
    ),
    b.consultar<{ chave: string; valor: string }>('SELECT chave, valor FROM config'),
  ]);
  return {
    tipos: tipos.map((t) => ({ ...t, padrao: t.padrao === 1 })),
    notas,
    arvores,
    nos: nos.map((n) => ({ ...n, recolhido: n.recolhido === 1 })),
    config: Object.fromEntries(config.map((c) => [c.chave, c.valor])),
  };
}

export async function carregarNota(id: string): Promise<Nota | null> {
  const linhas = await bancoAtual().consultar<Nota>(
    'SELECT id, titulo, tipoId, conteudo, texto, criadaEm, atualizadaEm, excluidaEm FROM notas WHERE id = ?',
    [id],
  );
  return linhas[0] ?? null;
}

// ---------------------------------------------------------------- gravação

export function sqlInserirNota(n: Nota): Instrucao {
  return {
    sql: `INSERT INTO notas (id, titulo, tipoId, conteudo, texto, criadaEm, atualizadaEm, excluidaEm)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    params: [n.id, n.titulo, n.tipoId, n.conteudo, n.texto, n.criadaEm, n.atualizadaEm, n.excluidaEm],
  };
}

export function sqlAtualizarNota(id: string, campos: Partial<Omit<Nota, 'id'>>): Instrucao {
  const nomes = Object.keys(campos) as Array<keyof typeof campos>;
  return {
    sql: `UPDATE notas SET ${nomes.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`,
    params: [...nomes.map((c) => campos[c] as Param), id],
  };
}

export function sqlApagarNota(id: string): Instrucao[] {
  return [
    { sql: 'DELETE FROM notas WHERE id = ?', params: [id] },
    { sql: 'DELETE FROM links WHERE origemId = ? OR destinoId = ?', params: [id, id] },
    { sql: 'DELETE FROM versoes WHERE notaId = ?', params: [id] },
  ];
}

export function sqlInserirNo(n: No): Instrucao {
  return {
    sql: `INSERT INTO nos (id, arvoreId, notaId, paiId, ordem, rotuloDoRamo, recolhido)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    params: [n.id, n.arvoreId, n.notaId, n.paiId, n.ordem, n.rotuloDoRamo, n.recolhido ? 1 : 0],
  };
}

export function sqlAtualizarNo(id: string, campos: Partial<Omit<No, 'id'>>): Instrucao {
  const nomes = Object.keys(campos) as Array<keyof typeof campos>;
  return {
    sql: `UPDATE nos SET ${nomes.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`,
    params: [
      ...nomes.map((c) => {
        const v = campos[c];
        return (typeof v === 'boolean' ? (v ? 1 : 0) : v) as Param;
      }),
      id,
    ],
  };
}

export function sqlApagarNo(id: string): Instrucao {
  return { sql: 'DELETE FROM nos WHERE id = ?', params: [id] };
}

/** Marca nós como excluídos (reversível). */
export function sqlExcluirNos(ids: string[], quando: number, lote: string): Instrucao[] {
  return ids.map((id) => ({
    sql: 'UPDATE nos SET excluidoEm = ?, loteExclusao = ? WHERE id = ?',
    params: [quando, lote, id],
  }));
}

export function sqlRestaurarNos(nos: No[]): Instrucao[] {
  return nos.map((n) => ({
    sql: `UPDATE nos SET excluidoEm = NULL, loteExclusao = NULL, paiId = ?, ordem = ?, arvoreId = ? WHERE id = ?`,
    params: [n.paiId, n.ordem, n.arvoreId, n.id],
  }));
}

export function sqlInserirArvore(a: Arvore): Instrucao {
  return {
    sql: 'INSERT INTO arvores (id, nome, raizId, ordem, criadaEm, excluidaEm) VALUES (?, ?, ?, ?, ?, ?)',
    params: [a.id, a.nome, a.raizId, a.ordem, a.criadaEm, a.excluidaEm],
  };
}

export function sqlAtualizarArvore(id: string, campos: Partial<Omit<Arvore, 'id'>>): Instrucao {
  const nomes = Object.keys(campos) as Array<keyof typeof campos>;
  return {
    sql: `UPDATE arvores SET ${nomes.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`,
    params: [...nomes.map((c) => campos[c] as Param), id],
  };
}

export function sqlSalvarTipo(t: TipoNota): Instrucao {
  return {
    sql: `INSERT OR REPLACE INTO tipos (id, nome, cor, icone, ordem, padrao) VALUES (?, ?, ?, ?, ?, ?)`,
    params: [t.id, t.nome, t.cor, t.icone, t.ordem, t.padrao ? 1 : 0],
  };
}

export function sqlConfig(chave: string, valor: string): Instrucao {
  return { sql: 'INSERT OR REPLACE INTO config (chave, valor) VALUES (?, ?)', params: [chave, valor] };
}
