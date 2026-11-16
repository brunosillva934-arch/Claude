/**
 * Cada tipo de nota guarda uma única cor. Daqui saem as variações usadas na
 * árvore, nos chips e na busca, calculadas para ter contraste legível tanto
 * no tema claro quanto no escuro.
 */
export interface CoresTipo {
  /** Cor cheia: faixa lateral, ícone, borda de destaque. */
  base: string;
  /** Fundo suave atrás do ícone e dos chips. */
  fraca: string;
  /** Fundo um pouco mais forte (zoom reduzido, seleção). */
  media: string;
  /** Cor do texto sobre o fundo suave. */
  texto: string;
}

type Rgb = [number, number, number];

function paraRgb(hex: string): Rgb {
  let h = hex.trim().replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  if (!Number.isFinite(n) || h.length !== 6) return [107, 119, 133];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function misturar(a: Rgb, b: Rgb, quantoDeB: number): Rgb {
  return [0, 1, 2].map((i) => Math.round(a[i]! * (1 - quantoDeB) + b[i]! * quantoDeB)) as Rgb;
}

function css([r, g, b]: Rgb, alfa = 1): string {
  return alfa >= 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${alfa})`;
}

const cache = new Map<string, CoresTipo>();

export function coresDoTipo(hex: string, escuro: boolean): CoresTipo {
  const chave = `${hex}|${escuro ? 1 : 0}`;
  const pronto = cache.get(chave);
  if (pronto) return pronto;
  const rgb = paraRgb(hex);
  const cores: CoresTipo = escuro
    ? {
        base: css(misturar(rgb, [255, 255, 255], 0.18)),
        fraca: css(rgb, 0.22),
        media: css(rgb, 0.36),
        texto: css(misturar(rgb, [255, 255, 255], 0.62)),
      }
    : {
        base: css(rgb),
        fraca: css(rgb, 0.13),
        media: css(rgb, 0.24),
        texto: css(misturar(rgb, [0, 0, 0], 0.42)),
      };
  cache.set(chave, cores);
  return cores;
}

/** Variáveis CSS prontas para pôr no `style` de um elemento. */
export function estiloDoTipo(hex: string | undefined, escuro: boolean): Record<string, string> {
  const c = coresDoTipo(hex ?? '#6B7785', escuro);
  return {
    '--cor': c.base,
    '--cor-fraca': c.fraca,
    '--cor-media': c.media,
    '--cor-texto': c.texto,
  };
}

/** Paleta oferecida ao criar ou editar um tipo. */
export const PALETA: string[] = [
  '#D64545', '#E0662F', '#D98A1F', '#B59A14', '#5E9E2E', '#2E9E6B',
  '#1F9EA8', '#2F7ED8', '#4F62D9', '#8A5CD6', '#C04FB5', '#D64580',
  '#8C6D53', '#6B7785', '#3F4A5A',
];
