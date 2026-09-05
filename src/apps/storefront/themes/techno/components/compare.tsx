/**
 * Compare tray state — up to four product snapshots persisted in localStorage (client only). The
 * header button and the compare drawer read it; the theme card toggles membership.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactElement, type ReactNode } from 'react';
import type { ProductCardModel } from '../../../types/catalog';

export const COMPARE_MAX = 4;
const STORAGE_KEY = 'tk-compare-v1';

export interface CompareItem {
  readonly id: string;
  readonly title: string;
  readonly url: string;
  readonly image?: string;
  readonly price: number;
  readonly compareAtPrice?: number;
  readonly currency: string;
  readonly vendor?: string;
  readonly specs: ReadonlyArray<string>;
}

export interface CompareApi {
  readonly items: ReadonlyArray<CompareItem>;
  readonly count: number;
  readonly max: number;
  has: (id: string) => boolean;
  toggle: (product: ProductCardModel) => void;
  remove: (id: string) => void;
  clear: () => void;
}

const CompareContext = createContext<CompareApi | null>(null);

/** Spec chips for a product: material, then sizes/capacities, then tags (max 3, deduped). */
export function productSpecs(product: ProductCardModel): ReadonlyArray<string> {
  const out: string[] = [];
  const push = (v: unknown): void => {
    if (typeof v !== 'string') return;
    const s = v.replace(/[-_]+/g, ' ').trim();
    if (s && !out.includes(s) && out.length < 3) out.push(s);
  };
  push(product.material);
  for (const size of product.sizes ?? []) push(size);
  for (const tag of product.tags ?? []) push(tag);
  return out;
}

function snapshot(product: ProductCardModel): CompareItem {
  return {
    id: product.id,
    title: product.title,
    url: product.url,
    ...(product.image?.src ? { image: product.image.src } : {}),
    price: product.price,
    ...(typeof product.compareAtPrice === 'number' ? { compareAtPrice: product.compareAtPrice } : {}),
    currency: product.currency,
    ...(product.vendor ? { vendor: product.vendor } : {}),
    specs: productSpecs(product),
  };
}

function load(): ReadonlyArray<CompareItem> {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is CompareItem => typeof x === 'object' && x !== null && typeof (x as CompareItem).id === 'string').slice(0, COMPARE_MAX);
  } catch {
    return [];
  }
}

export function CompareProvider(props: { children: ReactNode }): ReactElement {
  const [items, setItems] = useState<ReadonlyArray<CompareItem>>(load);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage unavailable — keep in memory */
    }
  }, [items]);

  const has = useCallback((id: string) => items.some((i) => i.id === id), [items]);
  const toggle = useCallback((product: ProductCardModel) => {
    setItems((prev) => {
      if (prev.some((i) => i.id === product.id)) return prev.filter((i) => i.id !== product.id);
      if (prev.length >= COMPARE_MAX) return prev;
      return [...prev, snapshot(product)];
    });
  }, []);
  const remove = useCallback((id: string) => setItems((prev) => prev.filter((i) => i.id !== id)), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CompareApi>(() => ({ items, count: items.length, max: COMPARE_MAX, has, toggle, remove, clear }), [items, has, toggle, remove, clear]);
  return <CompareContext.Provider value={value}>{props.children}</CompareContext.Provider>;
}

const NOOP_API: CompareApi = { items: [], count: 0, max: COMPARE_MAX, has: () => false, toggle: () => undefined, remove: () => undefined, clear: () => undefined };

/** Fail-safe: outside the provider (e.g. a section rendered in isolation) the tray is inert. */
export function useCompare(): CompareApi {
  return useContext(CompareContext) ?? NOOP_API;
}
