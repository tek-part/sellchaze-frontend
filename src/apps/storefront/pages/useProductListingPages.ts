import { useEffect, useState } from 'react';
export interface ListingPages<T> { scope: string; pages: Readonly<Record<number, ReadonlyArray<T>>> }
export function recordListingPage<T>(cache: ListingPages<T>, scope: string, page: number, products: ReadonlyArray<T>): ListingPages<T> {
  if (cache.scope === scope && cache.pages[page] === products) return cache;
  return { scope, pages: page === 1 || cache.scope !== scope ? { [page]: products } : { ...cache.pages, [page]: products } };
}
export function visibleListingPages<T extends { id: number | string }>(cache: ListingPages<T>, scope: string, page: number): ReadonlyArray<T> {
  if (cache.scope !== scope) return [];
  const unique = new Map<T['id'], T>();
  for (const number of Object.keys(cache.pages).map(Number).filter(number => number <= page).sort((a, b) => a - b)) {
    for (const product of cache.pages[number] ?? []) unique.set(product.id, product);
  }
  return [...unique.values()];
}
/** Keep raw records, so a display-currency change remaps every loaded page consistently. */
export function useProductListingPages<T extends { id: number | string }>(enabled: boolean, scope: string, page: number, products: ReadonlyArray<T> | undefined): ReadonlyArray<T> {
  const [cache, setCache] = useState<ListingPages<T>>({ scope: '', pages: {} });
  useEffect(() => { if (enabled && products) setCache(previous => recordListingPage(previous, scope, page, products)); }, [enabled, scope, page, products]);
  if (!enabled) return products ?? [];
  return visibleListingPages(products ? recordListingPage(cache, scope, page, products) : cache, scope, page);
}
