import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useStore } from '../state/store-context';
import { flushAdvertising, recordAdvertising } from './events';

export function StorefrontAdvertising(): null {
  const { store, apiOk } = useStore(); const { pathname } = useLocation(); const previous = useRef('');
  useEffect(() => {
    if (!apiOk || !store.trackingEnabled) return;
    const key = `${store.id}:${pathname}`;
    const visit = (): void => { if (document.visibilityState === 'visible' && previous.current !== key && !/^\/(account|login|register|forgot-password|reset-password)(\/|$)/.test(pathname)) { previous.current = key; recordAdvertising(store.id, 'page_view'); } };
    visit(); document.addEventListener('visibilitychange', visit);
    const online = (): void => { void flushAdvertising(store.id); };
    window.addEventListener('online', online); return () => { window.removeEventListener('online', online); document.removeEventListener('visibilitychange', visit); };
  }, [apiOk, store.id, store.trackingEnabled, pathname]);
  return null;
}
export function useProductAdvertising(productId?: string, variantId?: string): void {
  const { pathname } = useLocation();
  const { store, apiOk } = useStore(); const previous = useRef('');
  useEffect(() => {
    if (!apiOk || !store.trackingEnabled || !productId || !/^[1-9]\d*$/.test(productId)) return;
    const key = `${store.id}:${pathname}:${productId}:${variantId ?? ''}`; if (previous.current === key) return;
    previous.current = key; recordAdvertising(store.id, 'view_item', [{ product_id: Number(productId), quantity: 1, ...(variantId && /^[1-9]\d*$/.test(variantId) ? { variant_id: Number(variantId) } : {}) }]);
  }, [apiOk, store.id, store.trackingEnabled, productId, variantId, pathname]);
}
