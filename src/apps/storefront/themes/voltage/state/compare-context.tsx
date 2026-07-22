/**
 * Voltage compare state — a theme-local compare set (max 4 products) with sessionStorage persistence.
 * Voltage owns this; it is not shared infrastructure. Stores ProductCardModels so the tray + compare
 * modal can render without re-fetching. Exposes toggle/remove/clear + capacity helpers.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactElement, type ReactNode } from 'react';
import type { ProductCardModel } from '../../../types/catalog';

const MAX = 4;
const STORAGE_KEY = 'vlt.compare';

/**
 * Pure compare-set transition: remove the product if present, else append it unless the set is at
 * `max`. Never exceeds `max`; returns a new array (or the same reference when a full-set add is a
 * no-op). Extracted so it can be unit-tested without a DOM.
 */
export function toggleCompare(
  list: ReadonlyArray<ProductCardModel>,
  product: ProductCardModel,
  max: number = MAX,
): ProductCardModel[] {
  if (list.some((p) => p.id === product.id)) return list.filter((p) => p.id !== product.id);
  if (list.length >= max) return [...list];
  return [...list, product];
}

export interface CompareApi {
  items: ReadonlyArray<ProductCardModel>;
  has: (id: string) => boolean;
  toggle: (product: ProductCardModel) => void;
  remove: (id: string) => void;
  clear: () => void;
  isFull: boolean;
  max: number;
}

const CompareContext = createContext<CompareApi | null>(null);

function load(): ProductCardModel[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(parsed) ? (parsed as ProductCardModel[]) : [];
  } catch {
    return [];
  }
}

export function CompareProvider(props: { children: ReactNode }): ReactElement {
  const [items, setItems] = useState<ProductCardModel[]>(load);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage unavailable — non-fatal */
    }
  }, [items]);

  const toggle = useCallback((product: ProductCardModel): void => {
    setItems((prev) => toggleCompare(prev, product, MAX));
  }, []);

  const remove = useCallback((id: string): void => setItems((prev) => prev.filter((p) => p.id !== id)), []);
  const clear = useCallback((): void => setItems([]), []);

  const api = useMemo<CompareApi>(
    () => ({
      items,
      has: (id) => items.some((p) => p.id === id),
      toggle,
      remove,
      clear,
      isFull: items.length >= MAX,
      max: MAX,
    }),
    [items, toggle, remove, clear],
  );

  return <CompareContext.Provider value={api}>{props.children}</CompareContext.Provider>;
}

export function useCompare(): CompareApi {
  const ctx = useContext(CompareContext);
  return ctx ?? { items: [], has: () => false, toggle: () => {}, remove: () => {}, clear: () => {}, isFull: false, max: MAX };
}
