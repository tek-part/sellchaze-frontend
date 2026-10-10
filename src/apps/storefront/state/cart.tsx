/**
 * Offline basket scoped by store/currency. Public catalog refreshes update current price/limits;
 * these are observations, not reservations. Storage events share the last valid saved state
 * between same-origin tabs of the same store. Checkout independently validates live inventory.
 */
import {
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
import { toProductDetail } from '../api/mappers';
import { useToast } from '../foundation/components/toast/useToast';
import { useTranslation } from 'react-i18next';
import type { ProductDetailModel } from '../types/catalog';

export type AddCartInput = Omit<CartLine, 'quantity'> & { quantity?: number };

export interface CartApi {
  lines: ReadonlyArray<CartLine>;
  totals: CartTotals;
  add: (line: AddCartInput) => void;
  remove: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartApi | null>(null);

function loadInitial(store: StoreInfo): CartLine[] {
  try { return loadCart(typeof window === 'undefined' ? undefined : window.localStorage, store.id, store.currency); }
  catch { return []; }
}

export function CartProvider(props: { children: ReactNode }): ReactElement {
  const { store, apiOk } = useStore();
  return <ScopedCartProvider key={cartStorageKey(store.id, store.currency)} store={store} apiOk={apiOk}>{props.children}</ScopedCartProvider>;
}

function ScopedCartProvider({ children, store, apiOk }: { children: ReactNode; store: StoreInfo; apiOk: boolean }): ReactElement {
  const [{ lines, notification }, setState] = useState(() => ({ lines: loadInitial(store), notification: 0 }));
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
      try { if (event.storageArea !== window.localStorage) return; } catch { return; }
      const restored = decodeCart(event.newValue, store.id, store.currency);
      if (restored !== null) setState((previous) => ({ ...previous, lines: restored }));
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
          const response = await getCartCatalog(requested.slice(offset, offset + 100).map(Number));
          if (cancelled) return;
          if (String(response.store_id) !== store.id || !Array.isArray(response.data)) throw new Error('Catalog store mismatch');
          products.push(...response.data.map((product) => toProductDetail(product, store.currency, multiplier)));
        }
        if (cancelled) return;
        setState((previous) => {
          const next = reconcileCartCatalog(previous.lines, requested, products);
          const changed = cartPurchaseSummary(previous.lines) !== cartPurchaseSummary(next);
          return { lines: next, notification: previous.notification + (changed ? 1 : 0) };
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
    setState((previous) => ({ ...previous, lines: addCartLine(previous.lines, line) }));
  }, []);

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

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export function useCart(): CartApi {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a <CartProvider>.');
  return context;
}
