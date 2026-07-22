/**
 * StoreProvider — fetches the current store summary once (currency, name, logo) from
 * /api/storefront and exposes it via useStore(). `apiOk` reports whether the storefront API is
 * reachable/resolved, so pages can fall back to DEV preview data when developing without a seeded
 * backend. In production there is no fallback — an unresolved store surfaces normally.
 */
import { createContext, useContext, type ReactElement, type ReactNode } from 'react';
import { getStore } from '../api/storefront';
import { useAsync } from '../api/useAsync';

export interface StoreInfo {
  id: string;
  name: string;
  slug: string;
  currency: string;
  logoUrl?: string;
  description?: string;
}

const DEV_STORE: StoreInfo = {
  id: 'dev',
  name: 'Maison Selchase',
  slug: 'demo',
  currency: 'USD',
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
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider(props: { children: ReactNode }): ReactElement {
  const { data, loading, error } = useAsync(() => getStore(), []);

  const apiOk = Boolean(data && !error);
  let store: StoreInfo;
  if (data) {
    const s = data.store;
    store = {
      id: String(s.id),
      name: s.name,
      slug: s.slug,
      currency: s.currency || 'USD',
      ...(s.logo_url ? { logoUrl: s.logo_url } : {}),
      ...(s.description ? { description: s.description } : {}),
    };
  } else if (import.meta.env.DEV) {
    store = DEV_STORE;
  } else {
    store = { id: '', name: 'Store', slug: '', currency: 'USD' };
  }

  return <StoreContext.Provider value={{ store, loading, apiOk }}>{props.children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within a <StoreProvider>.');
  return context;
}
