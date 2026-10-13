import type { ProductSort } from '../../api/storefront';
import type { ProductCardModel } from '../../types/catalog';
export const KIDS_SORTS: ReadonlyArray<ProductSort> = ['rating', 'newest', 'oldest', 'price_asc', 'price_desc'];
export function kidsListingSearch(search: URLSearchParams): { sort: ProductSort; page: number } {
  const raw = search.get('sort'); const value = Number(search.get('page') ?? 1);
  return { sort: KIDS_SORTS.includes(raw as ProductSort) ? raw as ProductSort : 'rating', page: Number.isSafeInteger(value) && value > 0 && value <= 100000 ? value : 1 };
}
/** Isolated fixtures have no publication timestamps; their authored order is newest first. */
export function sortKidsPreview(products: ReadonlyArray<ProductCardModel>, sort: ProductSort): ProductCardModel[] {
  const result = [...products];
  if (sort === 'oldest') return result.reverse();
  if (sort === 'rating') return result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  if (sort === 'price_asc' || sort === 'price_desc') return result.sort((a, b) => (a.price - b.price) * (sort === 'price_asc' ? 1 : -1));
  return result;
}
