/**
 * StoreProvider — exposes the store summary (currency, name, logo, navigation) from the shared
 * /api/storefront bootstrap via useStore(). `apiOk` reports whether the storefront API is
 * reachable/resolved, so pages can fall back to DEV preview data when developing without a seeded
 * backend. In production there is no fallback — an unresolved store surfaces normally.
 */
import { previewOrDev } from '../preview';
import { createContext, useContext, useEffect, useState, type ReactElement, type ReactNode } from 'react';
import { loadStorefrontBootstrap } from '../api/bootstrap';
import type { ApiStorefrontBootstrap } from '../api/storefront';
import type { ApiStorefrontNavigation } from '../api/types';
import { useAsync } from '../api/useAsync';

export interface StoreInfo {
  id: string;
  name: string;
  slug: string;
  currency: string;
  baseCurrency: string;
  supportedCurrencies: ReadonlyArray<string>;
  currencyMultipliers: Readonly<Record<string, number>>;
  /** The store's default content language — the fallback when a translation is missing. */
  defaultLocale: string;
  /** Languages the merchant maintains content in. */
  supportedLocales: ReadonlyArray<string>;
  logoUrl?: string;
  description?: string;
}

const EMPTY_NAVIGATION: ApiStorefrontNavigation = Object.freeze({ header: [], footer: [] });

const DEV_STORE: StoreInfo = {
  id: 'dev',
  name: 'Sellchaze Demo Store',
  slug: 'demo',
  currency: 'USD',
  baseCurrency: 'USD',
  supportedCurrencies: ['USD'],
  currencyMultipliers: { USD: 1 },
  defaultLocale: 'en',
  supportedLocales: ['en', 'ar'],
  // Real stores get this from the API (StoreResource.logo_url); the demo store
  // ships a wordmark so the header renders a logo rather than plain text.
  logoUrl: '/brand-logo.svg',
  description: 'Considered luxury, made to last.',
};

interface StoreContextValue {
  store: StoreInfo;
  loading: boolean;
  /** True when the API returned a resolved store. */
  apiOk: boolean;
  /** Merchant-managed menus from the bootstrap payload (empty arrays when none are configured). */
  navigation: ApiStorefrontNavigation;
  setCurrency: (currency: string) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider(props: { children: ReactNode; initialData?: ApiStorefrontBootstrap }): ReactElement {
  // Shares the entry's cached bootstrap request (api/bootstrap.ts): with `initialData` supplied no
  // fetch happens at all; without it (the entry's request failed) this retries once and falls back.
  const { data, loading, error } = useAsync(() => loadStorefrontBootstrap(), [], props.initialData);

  const apiOk = Boolean(data && !error);
  const [selectedCurrency, setSelectedCurrency] = useState<string>(() => typeof window === 'undefined' ? '' : window.localStorage.getItem('sf:currency') || '');
  let store: StoreInfo;
  if (data) {
    const s = data.store;
    const baseCurrency = s.currency || 'USD';
    const supportedCurrencies = s.supported_currencies?.length ? s.supported_currencies : [baseCurrency];
    const currency = supportedCurrencies.includes(selectedCurrency) ? selectedCurrency : baseCurrency;
    // `locale.fallback` is the server's view of the store default; the StoreResource field is the
    // same value and wins when present so an older API without `locale` still resolves correctly.
    const defaultLocale = s.default_locale || data.locale?.fallback || 'en';
    const supportedFromApi = data.locale?.supported?.length ? data.locale.supported : s.supported_locales ?? [];
    const supportedLocales = supportedFromApi.length ? supportedFromApi : [defaultLocale];
    store = {
      id: String(s.id),
      name: s.name,
      slug: s.slug,
      currency,
      baseCurrency,
      supportedCurrencies,
      currencyMultipliers: s.currency_multipliers || { [baseCurrency]: 1 },
      defaultLocale,
      supportedLocales,
      ...(s.logo_url ? { logoUrl: s.logo_url } : {}),
      ...(s.description ? { description: s.description } : {}),
    };
  } else if (previewOrDev()) {
    store = DEV_STORE;
  } else {
    store = { id: '', name: 'Store', slug: '', currency: 'USD', baseCurrency: 'USD', supportedCurrencies: ['USD'], currencyMultipliers: { USD: 1 }, defaultLocale: 'en', supportedLocales: ['en'] };
  }

  const navigation: ApiStorefrontNavigation = data?.navigation
    ? { header: data.navigation.header ?? [], footer: data.navigation.footer ?? [] }
    : EMPTY_NAVIGATION;

  useEffect(() => {
    if (typeof window !== 'undefined' && store.currency) window.localStorage.setItem('sf:currency', store.currency);
  }, [store.currency]);

  return <StoreContext.Provider value={{ store, loading, apiOk, navigation, setCurrency: setSelectedCurrency }}>{props.children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within a <StoreProvider>.');
  return context;
}
