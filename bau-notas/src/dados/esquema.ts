/**
 * Esquema do banco e migrações.
 *
 * A versão fica em `PRAGMA user_version`. Para mudar o esquema, acrescente um
 * item ao fim de MIGRACOES; nunca edite um item já publicado.
 *
 * O SQL é mantido simples de propósito: o SQLite do Android 10 é o 3.28, sem
 * RETURNING, sem colunas geradas e sem JSON1 garantido.
 */
import type { Banco, Instrucao } from './banco';
import { TIPO_CLASSE, TIPO_MECANISMO, TIPOS_PADRAO } from './tipos';

const MIGRACOES: Array<() => Instrucao[]> = [
  // 1: modelo inicial
  () => [
    {
      sql: `CREATE TABLE tipos (
        id TEXT PRIMARY KEY NOT NULL,
        nome TEXT NOT NULL,
        cor TEXT NOT NULL,
        icone TEXT NOT NULL,
        ordem INTEGER NOT NULL DEFAULT 0,
        padrao INTEGER NOT NULL DEFAULT 0
      )`,
    },
    {
      sql: `CREATE TABLE notas (
        id TEXT PRIMARY KEY NOT NULL,
        titulo TEXT NOT NULL DEFAULT '',
        tipoId TEXT NOT NULL,
        conteudo TEXT NOT NULL DEFAULT '',
        texto TEXT NOT NULL DEFAULT '',
        criadaEm INTEGER NOT NULL,
        atualizadaEm INTEGER NOT NULL,
        excluidaEm INTEGER
      )`,
    },
    {
      sql: `CREATE TABLE arvores (
        id TEXT PRIMARY KEY NOT NULL,
        nome TEXT NOT NULL,
        raizId TEXT NOT NULL,
        ordem INTEGER NOT NULL DEFAULT 0,
        criadaEm INTEGER NOT NULL,
        excluidaEm INTEGER
      )`,
    },
    {
      // excluidoEm + loteExclusao: exclusão reversível de um ramo inteiro (desfazer e lixeira).
      sql: `CREATE TABLE nos (
        id TEXT PRIMARY KEY NOT NULL,
        arvoreId TEXT NOT NULL,
        notaId TEXT NOT NULL,
        paiId TEXT,
        ordem INTEGER NOT NULL DEFAULT 0,
        rotuloDoRamo TEXT,
        recolhido INTEGER NOT NULL DEFAULT 0,
        excluidoEm INTEGER,
        loteExclusao TEXT
      )`,
    },
    { sql: 'CREATE INDEX nos_por_arvore ON nos (arvoreId)' },
    { sql: 'CREATE INDEX nos_por_nota ON nos (notaId)' },
    {
      // Links entre notas, sempre por id. Derivada do conteúdo ao salvar (painel "Citado em").
      sql: `CREATE TABLE links (
        origemId TEXT NOT NULL,
        destinoId TEXT NOT NULL,
        PRIMARY KEY (origemId, destinoId)
      )`,
    },
    { sql: 'CREATE INDEX links_por_destino ON links (destinoId)' },
    {
      sql: `CREATE TABLE versoes (
        id TEXT PRIMARY KEY NOT NULL,
        notaId TEXT NOT NULL,
        titulo TEXT NOT NULL,
        conteudo TEXT NOT NULL,
        criadaEm INTEGER NOT NULL
      )`,
    },
    { sql: 'CREATE INDEX versoes_por_nota ON versoes (notaId, criadaEm)' },
    {
      sql: `CREATE TABLE config (
        chave TEXT PRIMARY KEY NOT NULL,
        valor TEXT NOT NULL
      )`,
    },
    ...TIPOS_PADRAO.map((t) => ({
      sql: 'INSERT INTO tipos (id, nome, cor, icone, ordem, padrao) VALUES (?, ?, ?, ?, ?, 1)',
      params: [t.id, t.nome, t.cor, t.icone, t.ordem],
    })),
  ],
  // 2: tópicos (itens de lista dentro de um ramo)
  () => [{ sql: 'ALTER TABLE notas ADD COLUMN topico INTEGER NOT NULL DEFAULT 0' }],
  // 3: recomendação curta dos tópicos, mostrada na árvore
  () => [{ sql: "ALTER TABLE notas ADD COLUMN resumo TEXT NOT NULL DEFAULT ''" }],
  // 4: tipo "Classe farmacológica", logo depois de Medicamento
  () => {
    const t = TIPOS_PADRAO.find((x) => x.id === TIPO_CLASSE)!;
    return [
      { sql: 'UPDATE tipos SET ordem = ordem + 1 WHERE ordem >= ? AND id <> ?', params: [t.ordem, t.id] },
      {
        sql: 'INSERT OR IGNORE INTO tipos (id, nome, cor, icone, ordem, padrao) VALUES (?, ?, ?, ?, ?, 1)',
        params: [t.id, t.nome, t.cor, t.icone, t.ordem],
      },
    ];
  },
  // 5: tipo "Mecanismo de ação", logo depois de Classe farmacológica
  () => {
    const t = TIPOS_PADRAO.find((x) => x.id === TIPO_MECANISMO)!;
    return [
      { sql: 'UPDATE tipos SET ordem = ordem + 1 WHERE ordem >= ? AND id <> ?', params: [t.ordem, t.id] },
      {
        sql: 'INSERT OR IGNORE INTO tipos (id, nome, cor, icone, ordem, padrao) VALUES (?, ?, ?, ?, ?, 1)',
        params: [t.id, t.nome, t.cor, t.icone, t.ordem],
      },
    ];
  },
  // 6: seções (nós que são só um título em destaque, sem texto e sem tipo)
  () => [{ sql: 'ALTER TABLE notas ADD COLUMN secao INTEGER NOT NULL DEFAULT 0' }],
];

export const VERSAO_ESQUEMA = MIGRACOES.length;

/** Cria ou atualiza o esquema. Devolve true se o banco acabou de ser criado. */
export async function migrar(banco: Banco): Promise<boolean> {
  const linhas = await banco.consultar<{ user_version: number }>('PRAGMA user_version');
  const atual = Number(linhas[0]?.user_version ?? 0);
  if (atual > VERSAO_ESQUEMA) {
    throw new Error(
      `Este banco foi criado por uma versão mais nova do Baú (esquema ${atual}; este app conhece até o ${VERSAO_ESQUEMA}).`,
    );
  }
  for (let v = atual; v < VERSAO_ESQUEMA; v++) {
    // PRAGMA não aceita parâmetro; o número vem do próprio código.
    await banco.lote([...MIGRACOES[v]!(), { sql: `PRAGMA user_version = ${v + 1}` }]);
  }
  return atual === 0;
}
