/**
 * Shop controls — filters, sort, view mode and pagination, held in the URL.
 *
 * The URL is the single source of truth rather than component state. That is what makes a filtered
 * view shareable, survive a refresh, and respond correctly to browser back/forward — three things
 * that quietly break when a PLP keeps this in `useState`.
 *
 * Shared across all four themes; the calling section owns presentation entirely.
 */
import { useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ProductCardModel } from '../types/catalog';
import { applyFilters, deriveFacets, filtersFromParams, filtersToParams, type FilterState, type Facets } from './filters';
import { sortProducts, toSortKey, type SortKey } from './sort';

export type ViewMode = 'grid' | 'list';

export interface ShopControls {
  filters: FilterState;
  setFilters: (next: FilterState) => void;
  clearFilters: () => void;
  sort: SortKey;
  setSort: (next: SortKey) => void;
  view: ViewMode;
  setView: (next: ViewMode) => void;
  page: number;
  setPage: (next: number) => void;
  pageCount: number;
  /** Facets derived from the pre-filter set, so counts stay stable as selections change. */
  facets: Facets;
  /** Everything matching the filters, before pagination. */
  matched: ReadonlyArray<ProductCardModel>;
  /** The current page of results. */
  visible: ReadonlyArray<ProductCardModel>;
  totalCount: number;
  matchedCount: number;
}

export function useShopControls(
  products: ReadonlyArray<ProductCardModel>,
  perPage: number,
): ShopControls {
  const [params, setParams] = useSearchParams();

  const filters = useMemo(() => filtersFromParams(params), [params]);
  const sort = toSortKey(params.get('sort'));
  const view: ViewMode = params.get('view') === 'list' ? 'list' : 'grid';
  const page = Math.max(1, Number(params.get('page') ?? '1') || 1);

  // Facets come from the unfiltered set. Deriving them from filtered results instead would make
  // options vanish as soon as they were selected, which reads as the UI breaking.
  const facets = useMemo(() => deriveFacets(products), [products]);

  const matched = useMemo(() => {
    const filtered = applyFilters(products, filters);
    return sortProducts(filtered, sort);
  }, [products, filters, sort]);

  const pageCount = Math.max(1, Math.ceil(matched.length / perPage));
  const safePage = Math.min(page, pageCount);
  const visible = useMemo(
    () => matched.slice((safePage - 1) * perPage, safePage * perPage),
    [matched, safePage, perPage],
  );

  // Narrowing the results can strand the viewer on a page that no longer exists. Replace rather
  // than push, so it does not add a dead entry to browser history.
  useEffect(() => {
    if (page > pageCount) {
      const next = new URLSearchParams(params);
      next.delete('page');
      setParams(next, { replace: true });
    }
  }, [page, pageCount, params, setParams]);

  const setFilters = useCallback(
    (next: FilterState): void => {
      const merged = filtersToParams(next, params);
      // Any change to the result set invalidates the current page number.
      merged.delete('page');
      setParams(merged);
    },
    [params, setParams],
  );

  const clearFilters = useCallback((): void => {
    const next = new URLSearchParams(params);
    for (const key of ['cat', 'brand', 'color', 'size', 'material', 'tag', 'rating', 'discount', 'price', 'stock', 'sale', 'page']) {
      next.delete(key);
    }
    setParams(next);
  }, [params, setParams]);

  const setParam = useCallback(
    (key: string, value: string | null, resetPage: boolean): void => {
      const next = new URLSearchParams(params);
      if (value === null) next.delete(key);
      else next.set(key, value);
      if (resetPage) next.delete('page');
      setParams(next);
    },
    [params, setParams],
  );

  return {
    filters,
    setFilters,
    clearFilters,
    sort,
    setSort: (next) => setParam('sort', next === 'featured' ? null : next, true),
    view,
    setView: (next) => setParam('view', next === 'grid' ? null : next, false),
    page: safePage,
    setPage: (next) => setParam('page', next <= 1 ? null : String(next), false),
    pageCount,
    facets,
    matched,
    visible,
    totalCount: products.length,
    matchedCount: matched.length,
  };
}
