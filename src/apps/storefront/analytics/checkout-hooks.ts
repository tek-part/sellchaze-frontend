import { useEffect } from 'react';
import { useStore } from '../state/store-context';
import type { CheckoutItem } from '../api/storefront';
import { recordCheckoutStart } from './checkout-events';
import { checkoutMetricsKey } from './checkout-key';
import { advertisingItems } from '../advertising/protocol';
import { recordAdvertisingCheckout } from '../advertising/events';

// Checkout-only hooks load with the checkout route, keeping initial storefront work bounded.
export function useCheckoutMetrics(items: ReadonlyArray<CheckoutItem>, source: 'storefront' | 'funnel', surface?: 'product'): void {
  const { store, apiOk } = useStore(); const key = checkoutMetricsKey(items, source);
  const productId = items[0]?.product_id;
  const advertisingSelection = JSON.stringify(advertisingItems(items));
  useEffect(() => {
    if (apiOk && productId) recordCheckoutStart(store.id, productId, key, source);
  }, [store.id, apiOk, key, productId, source]);
  useEffect(() => {
    if (apiOk && productId && store.trackingEnabled) recordAdvertisingCheckout(store.id, key, JSON.parse(advertisingSelection) as CheckoutItem[], surface);
  }, [store.id, apiOk, key, productId, store.trackingEnabled, advertisingSelection, surface]);
}
