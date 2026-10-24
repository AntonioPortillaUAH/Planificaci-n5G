const cache = new Map<number, Intl.NumberFormat>();

/** Formato numérico en español con un número fijo de decimales. */
export function fmt(x: number, decimals = 2): string {
  if (!Number.isFinite(x)) return '—';
  let f = cache.get(decimals);
  if (!f) {
    f = new Intl.NumberFormat('es-ES', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    cache.set(decimals, f);
  }
  return f.format(x);
}

export const fmtInt = (x: number) => fmt(x, 0);
export const pct = (x: number, decimals = 0) => `${fmt(x * 100, decimals)} %`;
