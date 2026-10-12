import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useStore } from '../state/store-context';
import type { CheckoutItem } from '../api/storefront';
import { checkoutMetricsKey, recordCheckoutStart, recordVisit } from './events';
import { advertisingItems } from '../advertising/protocol';
import { recordAdvertisingCheckout } from '../advertising/events';

export function StorefrontVisit(): null {
  const { store, apiOk } = useStore(); const { pathname } = useLocation();
  useEffect(() => {
    if (!apiOk) return;
    const visit = (): void => { if (document.visibilityState === 'visible') recordVisit(store.id); };
    visit(); window.addEventListener('online', visit);
    document.addEventListener('visibilitychange', visit);
    return () => { window.removeEventListener('online', visit); document.removeEventListener('visibilitychange', visit); };
  }, [store.id, apiOk, pathname]);
  return null;
}
export function useCheckoutMetrics(items: ReadonlyArray<CheckoutItem>, source: 'storefront' | 'funnel'): void {
  const { store, apiOk } = useStore(); const key = checkoutMetricsKey(items, source);
  const productId = items[0]?.product_id;
  const advertisingSelection = JSON.stringify(advertisingItems(items));
  useEffect(() => {
    if (apiOk && productId) recordCheckoutStart(store.id, productId, key, source);
  }, [store.id, apiOk, key, productId, source]);
  useEffect(() => {
    if (apiOk && productId && store.trackingEnabled) recordAdvertisingCheckout(store.id, key, JSON.parse(advertisingSelection) as CheckoutItem[]);
  }, [store.id, apiOk, key, productId, store.trackingEnabled, advertisingSelection]);
}
