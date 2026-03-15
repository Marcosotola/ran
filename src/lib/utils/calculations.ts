// ============================================================
// RAN — Utility calculations for floor/tile coverage
// ============================================================

/** Calculate boxes needed given area in m², m² per box, and waste % (default 10%) */
export function calcBoxes(m2: number, m2PerBox: number, wastePct = 0.1): number {
  if (m2 <= 0 || m2PerBox <= 0) return 0;
  return Math.ceil((m2 * (1 + wastePct)) / m2PerBox);
}

/** Calculate total price for an item */
export function calcSubtotal(boxes: number, pricePerBox: number): number {
  return boxes * pricePerBox;
}

/** Format ARS currency */
export function formatARS(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Format a date nicely in Spanish */
export function formatDate(date: Date | undefined): string {
  if (!date) return '—';
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
}

/** Truncate string to N chars */
export function truncate(str: string, n: number): string {
  return str.length > n ? str.slice(0, n - 1) + '…' : str;
}

/** Generate a human-readable quote number */
export function formatQuoteNumber(id: string): string {
  return `#${id.slice(0, 8).toUpperCase()}`;
}
