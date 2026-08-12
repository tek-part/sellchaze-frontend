/**
 * StoreProvider — fetches the current store summary once (currency, name, logo) from
 * /api/storefront and exposes it via useStore(). `apiOk` reports whether the storefront API is
 * reachable/resolved, so pages can fall back to DEV preview data when developing without a seeded
 * backend. In production there is no fallback — an unresolved store surfaces normally.
 */
import { previewOrDev } from '../preview';
import { createContext, useContext, useEffect, useState, type ReactElement, type ReactNode } from 'react';
import { getStore } from '../api/storefront';
import type { ApiStorefrontBootstrap } from '../api/storefront';
import { useAsync } from '../api/useAsync';

export interface StoreInfo {
  id: string;
  name: string;
  slug: string;
  currency: string;
  baseCurrency: string;
  supportedCurrencies: ReadonlyArray<string>;
  currencyMultipliers: Readonly<Record<string, number>>;
  logoUrl?: string;
  description?: string;
}

const DEV_STORE: StoreInfo = {
  id: 'dev',
  name: 'Sellchaze Demo Store',
  slug: 'demo',
  currency: 'USD',
  baseCurrency: 'USD',
  supportedCurrencies: ['USD'],
  currencyMultipliers: { USD: 1 },
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
  setCurrency: (currency: string) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider(props: { children: ReactNode; initialData?: ApiStorefrontBootstrap }): ReactElement {
  const { data, loading, error } = useAsync(() => getStore(), [], props.initialData);

  const apiOk = Boolean(data && !error);
  const [selectedCurrency, setSelectedCurrency] = useState<string>(() => typeof window === 'undefined' ? '' : window.localStorage.getItem('sf:currency') || '');
  let store: StoreInfo;
  if (data) {
    const s = data.store;
    const baseCurrency = s.currency || 'USD';
    const supportedCurrencies = s.supported_currencies?.length ? s.supported_currencies : [baseCurrency];
    const currency = supportedCurrencies.includes(selectedCurrency) ? selectedCurrency : baseCurrency;
    store = {
      id: String(s.id),
      name: s.name,
      slug: s.slug,
      currency,
      baseCurrency,
      supportedCurrencies,
      currencyMultipliers: s.currency_multipliers || { [baseCurrency]: 1 },
      ...(s.logo_url ? { logoUrl: s.logo_url } : {}),
      ...(s.description ? { description: s.description } : {}),
    };
  } else if (previewOrDev()) {
    store = DEV_STORE;
  } else {
    store = { id: '', name: 'Store', slug: '', currency: 'USD', baseCurrency: 'USD', supportedCurrencies: ['USD'], currencyMultipliers: { USD: 1 } };
  }

  useEffect(() => {
    if (typeof window !== 'undefined' && store.currency) window.localStorage.setItem('sf:currency', store.currency);
  }, [store.currency]);

  return <StoreContext.Provider value={{ store, loading, apiOk, setCurrency: setSelectedCurrency }}>{props.children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within a <StoreProvider>.');
  return context;
}
