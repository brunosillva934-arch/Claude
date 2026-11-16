/**
 * Acesso ao banco SQLite local.
 *
 * No tablet o banco é o SQLite do próprio Android, alcançado pela ponte
 * (android/src/app/bau/notas/Banco.java). No navegador, em desenvolvimento e
 * nos testes, o mesmo SQL roda em sql.js. O resto do app só conhece esta
 * interface.
 */
import { chamar, chamarSinc, temNativo } from '../nativo/ponte';

export type Param = string | number | null;

export interface Instrucao {
  sql: string;
  params?: Param[];
}

export type Linha = Record<string, string | number | null>;

export interface Banco {
  /** Executa as instruções numa única transação. */
  lote(instrucoes: Instrucao[]): Promise<void>;
  /**
   * Igual a `lote`, mas só volta depois de gravado em disco.
   * Usado quando o app vai para segundo plano.
   */
  loteSinc(instrucoes: Instrucao[]): void;
  consultar<T = Linha>(sql: string, params?: Param[]): Promise<T[]>;
  /** Onde os dados estão guardados, para mostrar nas configurações. */
  descricao: string;
}

interface RespostaConsulta {
  colunas: string[];
  linhas: Array<Array<string | number | null>>;
}

function emObjetos<T>(r: RespostaConsulta): T[] {
  const { colunas, linhas } = r;
  const n = colunas.length;
  const saida: T[] = new Array(linhas.length);
  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i]!;
    const obj: Record<string, unknown> = {};
    for (let c = 0; c < n; c++) obj[colunas[c]!] = linha[c];
    saida[i] = obj as T;
  }
  return saida;
}

function bancoAndroid(): Banco {
  return {
    descricao: 'SQLite do Android, na área privada do app',
    async lote(instrucoes) {
      if (instrucoes.length === 0) return;
      await chamar('sql.lote', { instrucoes });
    },
    loteSinc(instrucoes) {
      if (instrucoes.length === 0) return;
      chamarSinc('sql.lote', { instrucoes });
    },
    async consultar<T>(sql: string, params: Param[] = []) {
      const r = await chamar<RespostaConsulta>('sql.consultar', { sql, params });
      return emObjetos<T>(r);
    },
  };
}

let aberto: Promise<Banco> | null = null;

export function abrirBanco(): Promise<Banco> {
  if (!aberto) {
    aberto = (async () => {
      if (temNativo) return bancoAndroid();
      if (__ANDROID__) {
        throw new Error('A ponte com o Android não foi encontrada (window.BauNativo).');
      }
      const { abrirBancoWeb } = await import('./bancoWeb');
      return abrirBancoWeb();
    })();
  }
  return aberto;
}
