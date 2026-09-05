/**
 * Localized-value helpers for the storefront (workstream E).
 *
 * A backend field can be a plain string (legacy) or a locale-keyed object `{ ar: '…', en: '…' }`.
 * Resolution is requested locale → fallback (the store's default locale) → first non-empty → ''.
 * The same rules live in `src/lib/localized.js` for the dashboard and in
 * `app/Support/Localization/LocalizedValue.php` on the server.
 */

export type LocalizedString = string | Readonly<Record<string, string | null | undefined>> | null | undefined;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function nonEmpty(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

/** Read a localized string. Never throws; nullish and unknown shapes yield ''. */
export function pickLocalized(value: LocalizedString | unknown, locale: string, fallback?: string): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (!isRecord(value)) return '';
  const direct = value[locale];
  if (nonEmpty(direct)) return direct;
  if (fallback) {
    const fb = value[fallback];
    if (nonEmpty(fb)) return fb;
  }
  for (const key of Object.keys(value)) {
    const candidate = value[key];
    if (nonEmpty(candidate)) return candidate;
  }
  return '';
}

/**
 * Pick one locale's slice of a full-copy content payload — `{ en: {...}, ar: {...} }` — as stored
 * by the content-pages editor. Order: locale → fallback → first non-empty copy → null, so a page
 * translated in only one language still renders instead of disappearing.
 */
export function pickLocaleContent<T = Record<string, unknown>>(
  payload: unknown,
  locale: string,
  fallback?: string,
): T | null {
  if (!isRecord(payload)) return null;
  const hasContent = (copy: unknown): copy is T => isRecord(copy) && Object.keys(copy).length > 0;
  const direct = payload[locale];
  if (hasContent(direct)) return direct;
  if (fallback) {
    const fb = payload[fallback];
    if (hasContent(fb)) return fb;
  }
  for (const key of Object.keys(payload)) {
    const copy = payload[key];
    if (hasContent(copy)) return copy;
  }
  return null;
}
