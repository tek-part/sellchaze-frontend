/**
 * Offline basket scoped by store/currency. Public catalog refreshes update current price/limits;
 * these are observations, not reservations. Storage events share the last valid saved state
 * between same-origin tabs of the same store. Checkout independently validates live inventory.
 */
import {
  lazy,
  Suspense,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import type { CartLine, CartTotals } from '../types/cart';
import { useStore, type StoreInfo } from './store-context';
import { addCartLine, changeCartQuantity } from './cart-quantity';
import { cartStorageKey, decodeCart, encodeCart, loadCart } from './cart-storage';
import { cartPurchaseSummary, reconcileCartCatalog } from './cart-catalog';
import { getCartCatalog } from '../api/storefront';
import type { CheckoutItem } from '../api/storefront';
import { useToast } from '../foundation/components/toast/useToast';
import { useTranslation } from 'react-i18next';
import type { ProductDetailModel } from '../types/catalog';
import { metricsEventId } from '../analytics/identity';
import type { recordCartEvent } from '../analytics/events';
import { recordAdvertising } from '../advertising/events';

export type AddCartInput = Omit<CartLine, 'quantity'> & { quantity?: number; analyticsSource?: 'cross_sell' };
type CartMetricEvent = Parameters<typeof recordCartEvent>[1] & { selection: CheckoutItem };

export interface CartApi {
  lines: ReadonlyArray<CartLine>;
  totals: CartTotals;
  add: (line: AddCartInput) => void;
  remove: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartApi | null>(null);
const DownsellOffer = lazy(() => import('../downsell/DownsellOffer'));

function loadInitial(store: StoreInfo): CartLine[] {
  try { return loadCart(typeof window === 'undefined' ? undefined : window.localStorage, store.id, store.currency); }
  catch { return []; }
}

export function CartProvider(props: { children: ReactNode }): ReactElement {
  const { store, apiOk } = useStore();
  return <ScopedCartProvider key={cartStorageKey(store.id, store.currency)} store={store} apiOk={apiOk}>{props.children}</ScopedCartProvider>;
}

function ScopedCartProvider({ children, store, apiOk }: { children: ReactNode; store: StoreInfo; apiOk: boolean }): ReactElement {
  const [{ lines, notification, events }, setState] = useState(() => ({ lines: loadInitial(store), notification: 0, events: [] as CartMetricEvent[] }));
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const notified = useRef(0);
  const storage = cartStorageKey(store.id, store.currency);
  const ids = [...new Set(lines.map((line) => line.productId))].sort().join(',');
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const multiplier = store.currency === store.baseCurrency ? 1 : store.currencyMultipliers[store.currency];

  useEffect(() => {
    if (!store.id || typeof window === 'undefined') return;
    try {
      const serialized = encodeCart(lines, store.id, store.currency);
      if (window.localStorage.getItem(storage) !== serialized) window.localStorage.setItem(storage, serialized);
    } catch {
      /* storage full / disabled — cart still works in-memory */
    }
  }, [lines, storage, store.id, store.currency]);

  useEffect(() => {
    const receive = (event: StorageEvent): void => {
      if (event.key !== storage && event.key !== null) return;
      try {
        if (event.storageArea !== window.localStorage) return;
        // A queued event can describe a superseded write. Replaying that payload
        // could restore a line another tab has already removed.
        const restored = decodeCart(window.localStorage.getItem(storage), store.id, store.currency);
        if (restored !== null) setState((previous) => ({ ...previous, lines: restored }));
      } catch { return; }
    };
    window.addEventListener('storage', receive);
    return () => window.removeEventListener('storage', receive);
  }, [storage, store.id, store.currency]);

  useEffect(() => {
    if (!apiOk || !ids || multiplier === undefined || !Number.isFinite(multiplier) || multiplier <= 0) return;
    const requested = ids.split(',').filter((id) => /^[1-9]\d*$/.test(id) && Number.isSafeInteger(Number(id)));
    if (!requested.length) return;
    let cancelled = false;
    let busy = false;
    const refresh = async (): Promise<void> => {
      if (cancelled || busy || document.visibilityState === 'hidden') return;
      busy = true;
      try {
        const products: ProductDetailModel[] = [];
        // Apply only after every batch succeeds, including saved baskets with more than100 products.
        for (let offset = 0; offset < requested.length; offset += 100) {
          const [response, { toProductDetail }] = await Promise.all([getCartCatalog(requested.slice(offset, offset + 100).map(Number)), import('../api/mappers')]);
          if (cancelled) return;
          if (String(response.store_id) !== store.id || !Array.isArray(response.data)) throw new Error('Catalog store mismatch');
          products.push(...response.data.map((product) => toProductDetail(product, store.currency, multiplier)));
        }
        if (cancelled) return;
        setState((previous) => {
          const next = reconcileCartCatalog(previous.lines, requested, products);
          const changed = cartPurchaseSummary(previous.lines) !== cartPurchaseSummary(next);
          return { ...previous, lines: next, notification: previous.notification + (changed ? 1 : 0) };
        });
      } catch { /* offline/transient failure never erases selections; checkout validates again */ }
      finally { busy = false; }
    };
    const wake = (): void => { void refresh(); };
    wake();
    window.addEventListener('focus', wake);
    window.addEventListener('online', wake);
    document.addEventListener('visibilitychange', wake);
    const timer = window.setInterval(wake, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener('focus', wake);
      window.removeEventListener('online', wake);
      document.removeEventListener('visibilitychange', wake);
    };
  }, [apiOk, ids, store.id, store.currency, multiplier, locale]);

  useEffect(() => {
    if (notification <= notified.current) return;
    notified.current = notification;
    toast({ message: t('cart.updatedAvailability'), duration: 8000 });
  }, [notification, toast, t]);

  const add = useCallback((line: AddCartInput) => {
    const id = apiOk ? metricsEventId() : undefined;
    const { analyticsSource, ...input } = line;
    setState((previous) => {
      const next = addCartLine(previous.lines, input);
      const quantity = (next.find((row) => row.id === line.id)?.quantity ?? 0) - (previous.lines.find((row) => row.id === line.id)?.quantity ?? 0);
      const selection: CheckoutItem = { product_id: Number(line.productId), quantity, ...(line.variantId ? { variant_id: Number(line.variantId) } : {}), ...(line.quantityOffer ? { quantity_offer_id: line.quantityOffer.id, quantity_offer_version: line.quantityOffer.version } : {}) };
      return { ...previous, lines: next, events: id && quantity > 0 ? [...previous.events, { id, productId: line.productId, quantity, selection, ...(analyticsSource ? { source: analyticsSource } : {}) }] : previous.events };
    });
  }, [apiOk]);

  useEffect(() => {
    if (!apiOk || !events.length) return;
    let active = true; let busy = false;
    const deliver = (): void => {
      if (busy) return; busy = true;
      void import('../analytics/events').then(({ recordCartEvent }) => {
        if (!active) return;
        events.forEach((event) => recordCartEvent(store.id, event));
        if (store.trackingEnabled) events.forEach((event) => recordAdvertising(store.id, 'add_to_cart', [event.selection], event.id));
        const recorded = new Set(events.map((event) => event.id));
        setState((previous) => ({ ...previous, events: previous.events.filter((event) => !recorded.has(event.id)) }));
      }).catch(() => { /* Retain cart events for an online retry if this chunk cannot load. */ }).finally(() => { busy = false; });
    };
    deliver(); window.addEventListener('online', deliver);
    return () => { active = false; window.removeEventListener('online', deliver); };
  }, [events, apiOk, store.id, store.trackingEnabled]);

  const remove = useCallback((id: string) => {
    setState((previous) => ({ ...previous, lines: previous.lines.filter((line) => line.id !== id) }));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    setState((previous) => ({ ...previous, lines: changeCartQuantity(previous.lines, id, quantity) }));
  }, []);

  const clear = useCallback(() => setState((previous) => ({ ...previous, lines: [] })), []);

  const totals = useMemo<CartTotals>(
    () => ({
      count: lines.reduce((sum, l) => sum + l.quantity, 0),
      subtotal: lines.reduce((sum, l) => sum + l.price * l.quantity, 0),
      currency: store.currency,
    }),
    [lines, store.currency],
  );

  const api = useMemo<CartApi>(
    () => ({ lines, totals, add, remove, updateQuantity, clear }),
    [lines, totals, add, remove, updateQuantity, clear],
  );

  return <CartContext.Provider value={api}>{children}{store.downsellEnabled ? <Suspense fallback={null}><DownsellOffer store={store} apiOk={apiOk} locale={locale} productIds={ids} hasCart={lines.length > 0} /></Suspense> : null}</CartContext.Provider>;
}

export function useCart(): CartApi {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a <CartProvider>.');
  return context;
}
