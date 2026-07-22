/**
 * Recently-viewed state — a client-side, localStorage-backed history of products the shopper has
 * opened (most-recent first, de-duplicated, capped). Purely client-side by design; the PDP records
 * a view and the recently-viewed section reads the list.
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
import type { ProductCardModel } from '../types/catalog';

const STORAGE_KEY = 'sf-recently-viewed-v1';
const CAP = 12;

interface RecentlyViewedApi {
  items: ReadonlyArray<ProductCardModel>;
  record: (product: ProductCardModel) => void;
}

const RecentlyViewedContext = createContext<RecentlyViewedApi | null>(null);

function loadInitial(): ProductCardModel[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? (parsed as ProductCardModel[]) : [];
  } catch {
    return [];
  }
}

export function RecentlyViewedProvider(props: { children: ReactNode }): ReactElement {
  const [items, setItems] = useState<ProductCardModel[]>(loadInitial);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage unavailable */
    }
  }, [items]);

  const record = useCallback((product: ProductCardModel) => {
    setItems((prev) => [product, ...prev.filter((p) => p.id !== product.id)].slice(0, CAP));
  }, []);

  const value = useMemo<RecentlyViewedApi>(() => ({ items, record }), [items, record]);
  return <RecentlyViewedContext.Provider value={value}>{props.children}</RecentlyViewedContext.Provider>;
}

export function useRecentlyViewed(): RecentlyViewedApi {
  const context = useContext(RecentlyViewedContext);
  if (!context) throw new Error('useRecentlyViewed must be used within a <RecentlyViewedProvider>.');
  return context;
}
