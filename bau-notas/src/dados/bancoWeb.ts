/**
 * Substituto do banco para navegador (desenvolvimento e testes): sql.js, o
 * próprio SQLite compilado para WebAssembly, guardado no IndexedDB.
 * Este arquivo não entra no pacote do APK.
 *
 * Parâmetros de endereço úteis nos testes:
 *   ?memoria=1  não lê nem grava o IndexedDB (começa sempre do zero)
 */
import initSqlJs, { type Database } from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import type { Banco, Instrucao, Linha, Param } from './banco';

const NOME_IDB = 'bau-web';
const LOJA = 'arquivo';
const CHAVE = 'bau.db';

function abrirIdb(): Promise<IDBDatabase> {
  return new Promise((resolver, rejeitar) => {
    const pedido = indexedDB.open(NOME_IDB, 1);
    pedido.onupgradeneeded = () => pedido.result.createObjectStore(LOJA);
    pedido.onsuccess = () => resolver(pedido.result);
    pedido.onerror = () => rejeitar(pedido.error);
  });
}

async function lerArquivo(): Promise<Uint8Array | null> {
  const idb = await abrirIdb();
  return new Promise((resolver, rejeitar) => {
    const pedido = idb.transaction(LOJA, 'readonly').objectStore(LOJA).get(CHAVE);
    pedido.onsuccess = () => resolver((pedido.result as Uint8Array | undefined) ?? null);
    pedido.onerror = () => rejeitar(pedido.error);
  });
}

async function gravarArquivo(dados: Uint8Array): Promise<void> {
  const idb = await abrirIdb();
  return new Promise((resolver, rejeitar) => {
    const tx = idb.transaction(LOJA, 'readwrite');
    tx.objectStore(LOJA).put(dados, CHAVE);
    tx.oncomplete = () => resolver();
    tx.onerror = () => rejeitar(tx.error);
  });
}

export async function abrirBancoWeb(): Promise<Banco> {
  const SQL = await initSqlJs({ locateFile: () => wasmUrl });
  const emMemoria = new URLSearchParams(location.search).has('memoria');
  let inicial: Uint8Array | null = null;
  if (!emMemoria) {
    try {
      inicial = await lerArquivo();
    } catch {
      inicial = null;
    }
  }
  const db: Database = inicial ? new SQL.Database(inicial) : new SQL.Database();

  let agendado: number | null = null;
  const persistir = () => {
    agendado = null;
    if (emMemoria) return;
    void gravarArquivo(db.export()).catch(() => undefined);
  };
  const agendar = () => {
    if (agendado !== null) clearTimeout(agendado);
    agendado = window.setTimeout(persistir, 400);
  };
  window.addEventListener('pagehide', persistir);

  const executar = (instrucoes: Instrucao[]) => {
    db.run('BEGIN');
    try {
      for (const i of instrucoes) db.run(i.sql, i.params ?? []);
      db.run('COMMIT');
    } catch (e) {
      db.run('ROLLBACK');
      throw e;
    }
  };

  return {
    descricao: emMemoria ? 'sql.js em memória (teste)' : 'sql.js no IndexedDB do navegador (desenvolvimento)',
    async lote(instrucoes) {
      if (instrucoes.length === 0) return;
      executar(instrucoes);
      agendar();
    },
    loteSinc(instrucoes) {
      if (instrucoes.length === 0) return;
      executar(instrucoes);
      persistir();
    },
    async consultar<T = Linha>(sql: string, params: Param[] = []) {
      const comando = db.prepare(sql);
      try {
        comando.bind(params);
        const linhas: T[] = [];
        while (comando.step()) linhas.push(comando.getAsObject() as T);
        return linhas;
      } finally {
        comando.free();
      }
    },
  };
}
