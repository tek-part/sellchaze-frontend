/**
 * Catalog sorting — one implementation for every theme.
 *
 * Client-side by necessity: `GET /storefront/products` accepts only `category` and `per_page`
 * (StorefrontProductController), so there is no `sort` parameter to delegate to. This orders the
 * page the client already holds. When the API gains a `sort` param, callers switch to it and this
 * becomes the fallback — the key names below are chosen to map cleanly onto one.
 *
 * Non-mutating: callers pass arrays straight out of memoised selectors, and sorting them in place
 * would corrupt the cached source.
 */
import type { ProductCardModel } from '../types/catalog';

export type SortKey =
  | 'featured'
  | 'price-asc'
  | 'price-desc'
  | 'name-asc'
  | 'name-desc'
  | 'rating-desc';

export const SORT_OPTIONS: ReadonlyArray<{ value: SortKey; label: string }> = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'name-asc', label: 'Name: A–Z' },
  { value: 'name-desc', label: 'Name: Z–A' },
  { value: 'rating-desc', label: 'Top rated' },
];

const SORT_KEYS: ReadonlyArray<SortKey> = SORT_OPTIONS.map((o) => o.value);

/** Narrow an untrusted string (URL param, merchant setting) to a SortKey. */
export function toSortKey(value: unknown, fallback: SortKey = 'featured'): SortKey {
  return typeof value === 'string' && (SORT_KEYS as ReadonlyArray<string>).includes(value)
    ? (value as SortKey)
    : fallback;
}

export function sortProducts(
  products: ReadonlyArray<ProductCardModel>,
  sort: SortKey,
): ReadonlyArray<ProductCardModel> {
  // `featured` is the API's own ordering (position, then id) — preserve it exactly, and return the
  // same reference so memoised callers do not re-render.
  if (sort === 'featured') return products;
  const copy = [...products];
  switch (sort) {
    case 'price-asc':
      return copy.sort((a, b) => a.price - b.price);
    case 'price-desc':
      return copy.sort((a, b) => b.price - a.price);
    case 'name-asc':
      return copy.sort((a, b) => a.title.localeCompare(b.title));
    case 'name-desc':
      return copy.sort((a, b) => b.title.localeCompare(a.title));
    case 'rating-desc':
      return copy.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    default:
      return products;
  }
}
