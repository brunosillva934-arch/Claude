/**
 * Ponte com a casca Android (android/src/app/bau/notas/*.java).
 *
 * A casca injeta `window.BauNativo` no WebView. Chamadas assíncronas saem por
 * `BauNativo.chamar(id, metodo, args)` e a resposta volta por `window.__bau.r`.
 * Fora do Android (navegador, testes) a ponte não existe e o app usa os
 * substitutos web de cada recurso.
 */
interface BauNativo {
  chamar(id: number, metodo: string, argsJson: string): void;
  chamarSinc(metodo: string, argsJson: string): string;
}

type Evento = 'voltar' | 'pausa' | 'retomada' | 'tema';

interface BauGlobal {
  /** Resposta de uma chamada assíncrona. */
  r(id: number, ok: boolean, valor: unknown): void;
  /** Botão voltar do Android. Devolve true se o app tratou. */
  voltar(): boolean;
  /** O app vai para segundo plano: gravar tudo agora. */
  pausa(): void;
  retomada(): void;
  /** O sistema trocou entre tema claro e escuro. */
  tema(noturno: boolean): void;
}

declare global {
  interface Window {
    BauNativo?: BauNativo;
    __bau: BauGlobal;
    __bauPronto?: () => void;
    __bauFalha?: (titulo: string, detalhe: string) => void;
    __bauWebViewAntigo?: boolean;
  }
}

export const temNativo: boolean = typeof window !== 'undefined' && !!window.BauNativo;

interface Pendente {
  resolver: (valor: unknown) => void;
  rejeitar: (erro: Error) => void;
  metodo: string;
}

let sequencia = 1;
const pendentes = new Map<number, Pendente>();
const ouvintes: { [E in Evento]: Array<(arg?: unknown) => unknown> } = {
  voltar: [],
  pausa: [],
  retomada: [],
  tema: [],
};

window.__bau = {
  r(id, ok, valor) {
    const p = pendentes.get(id);
    if (!p) return;
    pendentes.delete(id);
    if (ok) p.resolver(valor);
    else p.rejeitar(new Error(`${p.metodo}: ${String(valor)}`));
  },
  voltar() {
    for (const f of ouvintes.voltar) {
      if (f() === true) return true;
    }
    return false;
  },
  pausa() {
    for (const f of ouvintes.pausa) f();
  },
  retomada() {
    for (const f of ouvintes.retomada) f();
  },
  tema(noturno) {
    for (const f of ouvintes.tema) f(noturno);
  },
};

/** Registra um ouvinte de evento vindo da casca. Devolve a função que o remove. */
export function aoEvento(evento: Evento, f: (arg?: unknown) => unknown): () => void {
  ouvintes[evento].push(f);
  return () => {
    const i = ouvintes[evento].indexOf(f);
    if (i >= 0) ouvintes[evento].splice(i, 1);
  };
}

/** Chamada assíncrona: não bloqueia a digitação nem a interface. */
export function chamar<T = unknown>(metodo: string, args: unknown = {}): Promise<T> {
  const nativo = window.BauNativo;
  if (!nativo) return Promise.reject(new Error(`${metodo}: recurso disponível só no app Android`));
  return new Promise<T>((resolver, rejeitar) => {
    const id = sequencia++;
    pendentes.set(id, { resolver: resolver as (v: unknown) => void, rejeitar, metodo });
    try {
      nativo.chamar(id, metodo, JSON.stringify(args));
    } catch (e) {
      pendentes.delete(id);
      rejeitar(e instanceof Error ? e : new Error(String(e)));
    }
  });
}

/**
 * Chamada síncrona: só volta quando a casca terminou. Usada ao ir para segundo
 * plano, quando é preciso garantir a gravação antes de o Android suspender o app.
 */
export function chamarSinc<T = unknown>(metodo: string, args: unknown = {}): T {
  const nativo = window.BauNativo;
  if (!nativo) throw new Error(`${metodo}: recurso disponível só no app Android`);
  const bruto = nativo.chamarSinc(metodo, JSON.stringify(args));
  const resposta = JSON.parse(bruto) as { ok: boolean; valor: unknown };
  if (!resposta.ok) throw new Error(`${metodo}: ${String(resposta.valor)}`);
  return resposta.valor as T;
}

export interface InfoSistema {
  versaoApp: string;
  codigoVersao: number;
  android: string;
  sdk: number;
  webview: string;
  modelo: string;
  noturno: boolean;
}

export function infoSistema(): InfoSistema | null {
  if (!temNativo) return null;
  try {
    return chamarSinc<InfoSistema>('sistema.info');
  } catch {
    return null;
  }
}

/** Vibração curta de confirmação (toque longo). Não precisa de permissão. */
export function toqueHaptico(): void {
  if (temNativo) void chamar('sistema.toque').catch(() => undefined);
}

/** Pinta as barras do sistema nas cores do app e ajusta os ícones (escuros sobre fundo claro). */
export function pintarBarras(status: string, navegacao: string, fundoClaro: boolean): void {
  if (temNativo) void chamar('sistema.barras', { status, navegacao, fundoClaro }).catch(() => undefined);
}

/**
 * Modo imersivo do Android: esconde a barra de status e a de navegação (que
 * voltam por um instante ao deslizar o dedo da borda). Usado no modo foco.
 */
export function modoImersivo(ligado: boolean): void {
  if (temNativo) void chamar('sistema.imersivo', { ligado }).catch(() => undefined);
}

/** Manda o app para segundo plano (sem encerrá-lo). */
export function minimizarApp(): void {
  if (temNativo) void chamar('sistema.minimizar').catch(() => undefined);
}
