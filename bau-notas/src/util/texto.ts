/** Identificador único. Notas, árvores e nós são sempre referenciados por ele, nunca pelo texto. */
export function uid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  b[6] = (b[6]! & 0x0f) | 0x40;
  b[8] = (b[8]! & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** Minúsculas e sem acentos: "Hipertensão" vira "hipertensao". */
export function normalizar(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

export function agora(): number {
  return Date.now();
}

/** Comparação alfabética em português, ignorando acentos e maiúsculas. */
const colador = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true });
export function compararTexto(a: string, b: string): number {
  return colador.compare(a, b);
}

export function plural(n: number, um: string, varios: string): string {
  return `${n} ${n === 1 ? um : varios}`;
}
