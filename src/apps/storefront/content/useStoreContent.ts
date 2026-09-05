import { useAsync } from '../api/useAsync';
import { getContent } from '../api/storefront';
import { useLocale } from '../i18n/useLocale';
import { pickLocaleContent } from '../i18n/localized';
import { useStore } from '../state/store-context';

/**
 * Fetch a store's editable page content and return the slice for the active
 * locale. The stored payload is one full copy per language (`{ en, ar, … }`);
 * this picks the current locale, then the store's default language, then any
 * non-empty copy, then null (so callers keep their shipped static defaults).
 * Switching locale re-picks without a refetch.
 */
export function useStoreContent<T = Record<string, unknown>>(key: string, enabled = true): T | null {
  const { locale } = useLocale();
  const { store } = useStore();
  const { data } = useAsync(
    () => (enabled ? getContent(key) : Promise.resolve({ data: null })),
    [key, enabled],
  );
  return pickLocaleContent<T>(data?.data ?? null, locale, store.defaultLocale);
}
