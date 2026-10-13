import { pickLocalized } from './i18n/localized';

export function readPreviewSettings(encoded: string, locale: string): Record<string, string | number | boolean> | undefined {
  try {
    const decoded: unknown = JSON.parse(decodeURIComponent(atob(encoded)));
    if (!decoded || typeof decoded !== 'object' || Array.isArray(decoded)) return undefined;
    const entries: Array<[string, string | number | boolean]> = [];
    for (const [key, value] of Object.entries(decoded as Record<string, unknown>)) {
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') entries.push([key, value]);
      else if (value && typeof value === 'object' && !Array.isArray(value)) entries.push([key, pickLocalized(value, locale)]);
    }
    return Object.fromEntries(entries);
  } catch { return undefined; }
}
