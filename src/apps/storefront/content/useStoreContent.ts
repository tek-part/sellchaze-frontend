import { useAsync } from '../api/useAsync';
import { getContent } from '../api/storefront';
import { useLocale } from '../i18n/useLocale';

/**
 * Fetch a store's editable page content and return the slice for the active
 * locale. The stored payload is bilingual (`{ en, ar }`); this picks the current
 * locale and falls back to the other locale, then to null (so callers keep their
 * shipped static defaults). Switching locale re-picks without a refetch.
 */
export function useStoreContent<T = Record<string, unknown>>(key: string, enabled = true): T | null {
  const { locale } = useLocale();
  const { data } = useAsync(
    () => (enabled ? getContent(key) : Promise.resolve({ data: null })),
    [key, enabled],
  );
  const payload = (data?.data ?? null) as Record<string, unknown> | null;
  if (!payload) return null;
  const cur = payload[locale] as T | undefined;
  const other = payload[locale === 'ar' ? 'en' : 'ar'] as T | undefined;
  return (cur ?? other ?? null) as T | null;
}
