/**
 * Formatting helpers for the storefront presentation layer (dates, reading time). Money formatting
 * lives in the Price component. All locale-aware via Intl.
 */

export function formatDate(iso: string | undefined, locale?: string): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
}

export function formatReadingTime(minutes: number | undefined): string | null {
  if (typeof minutes !== 'number' || minutes <= 0) return null;
  return `${Math.round(minutes)} min read`;
}

export function formatMoney(amount: number, currency: string, locale?: string): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
}
