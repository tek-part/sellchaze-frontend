import { expect, it } from 'vitest';
import { kidsListingSearch, sortKidsPreview } from './listing';
import type { ProductCardModel } from '../../types/catalog';
it('validates query state and resets malformed sort/page input', () => {
  expect(kidsListingSearch(new URLSearchParams('sort=price_desc&page=2'))).toEqual({ sort: 'price_desc', page: 2 });
  for (const page of ['-2', 'NaN', '1.5', '100001']) expect(kidsListingSearch(new URLSearchParams(`sort=bad&page=${page}`))).toEqual({ sort: 'rating', page: 1 });
});
it('sorts isolated fixtures without mutating merchant data', () => {
  const products = [{ id: 'a', price: 10, rating: 3 }, { id: 'b', price: 8, rating: 5 }] as ProductCardModel[];
  expect(sortKidsPreview(products, 'rating').map(p => p.id)).toEqual(['b', 'a']);
  expect(sortKidsPreview(products, 'price_asc').map(p => p.id)).toEqual(['b', 'a']);
  expect(sortKidsPreview(products, 'price_desc').map(p => p.id)).toEqual(['a', 'b']);
  expect(products.map(p => p.id)).toEqual(['a', 'b']);
});
