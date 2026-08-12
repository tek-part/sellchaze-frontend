/**
 * Cart state — a real client-side cart, persisted to localStorage so it survives reloads and works
 * offline. Phase 6 mirrors mutations to the backend. Lines merge by id (product+variant); quantities
 * clamp to the line's max. Provided high in the tree (the layout) so chrome + sections share it.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import type { CartLine, CartTotals } from '../types/cart';
import { useStore } from './store-context';

const storageKey = (currency: string): string => `sf-cart-v1:${currency}`;

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

function loadInitial(currency: string): CartLine[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(storageKey(currency));
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? (parsed as CartLine[]) : [];
  } catch {
    return [];
  }
}

export function CartProvider(props: { children: ReactNode }): ReactElement {
  const { store } = useStore();
  const [lines, setLines] = useState<CartLine[]>(() => loadInitial(store.currency));
  const [loadedCurrency, setLoadedCurrency] = useState(store.currency);

  if (loadedCurrency !== store.currency) {
    setLoadedCurrency(store.currency);
    setLines(loadInitial(store.currency));
  }

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(storageKey(store.currency), JSON.stringify(lines));
    } catch {
      /* storage full / disabled — cart still works in-memory */
    }
  }, [lines, store.currency]);

  const add = useCallback((line: AddCartInput) => {
    const quantity = line.quantity ?? 1;
    setLines((prev) => {
      const index = prev.findIndex((l) => l.id === line.id);
      if (index >= 0) {
        const existing = prev[index];
        if (!existing) return prev;
        const cap = line.maxQuantity ?? existing.maxQuantity ?? Number.POSITIVE_INFINITY;
        const next = [...prev];
        next[index] = { ...existing, quantity: Math.min(existing.quantity + quantity, cap) };
        return next;
      }
      return [...prev, { ...line, quantity }];
    });
  }, []);

  const remove = useCallback((id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    setLines((prev) =>
      quantity <= 0 ? prev.filter((l) => l.id !== id) : prev.map((l) => (l.id === id ? { ...l, quantity } : l)),
    );
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const totals = useMemo<CartTotals>(
    () => ({
      count: lines.reduce((sum, l) => sum + l.quantity, 0),
      subtotal: lines.reduce((sum, l) => sum + l.price * l.quantity, 0),
      currency: lines[0]?.currency ?? 'USD',
    }),
    [lines],
  );

  const api = useMemo<CartApi>(
    () => ({ lines, totals, add, remove, updateQuantity, clear }),
    [lines, totals, add, remove, updateQuantity, clear],
  );

  return <CartContext.Provider value={api}>{props.children}</CartContext.Provider>;
}

export function useCart(): CartApi {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a <CartProvider>.');
  return context;
}
