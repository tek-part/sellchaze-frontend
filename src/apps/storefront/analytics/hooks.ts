import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useStore } from '../state/store-context';
import { metricsAllowedInBrowser } from './identity';

export function StorefrontVisit(): null {
  const { store, apiOk } = useStore(); const { pathname, search } = useLocation();
  useEffect(() => {
    if (!apiOk) return;
    const visit = (): void => {
      if (document.visibilityState === 'visible' && metricsAllowedInBrowser()) void import('./events').then(({ recordVisit }) => recordVisit(store.id)).catch(() => { /* Online/visibility events retry loading; no visit is fabricated. */ });
    };
    visit(); window.addEventListener('online', visit);
    document.addEventListener('visibilitychange', visit);
    return () => { window.removeEventListener('online', visit); document.removeEventListener('visibilitychange', visit); };
  }, [store.id, apiOk, pathname, search]);
  return null;
}
/** First-party product view for the per-product funnel; the server keeps one view per visitor session and product. */
export function useProductViewMetrics(productId: string | undefined, source: 'storefront' | 'funnel'): void {
  const { store, apiOk } = useStore();
  useEffect(() => {
    if (!apiOk || !productId || !/^[1-9]\d*$/.test(productId) || !metricsAllowedInBrowser()) return;
    void import('./events').then(({ recordProductView }) => recordProductView(store.id, productId, source)).catch(() => { /* Analytics never blocks the product page. */ });
  }, [store.id, apiOk, productId, source]);
}
