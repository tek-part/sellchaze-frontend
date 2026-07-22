/**
 * Sorting is now shared across all four themes (shared-ui/sort). This suite stays here because
 * Voltage's PLP is the primary consumer, and it guards the contract the grid depends on.
 */
import { describe, expect, it } from 'vitest';
import { sortProducts, toSortKey } from '../../../shared-ui';
import type { ProductCardModel } from '../../../types/catalog';

const p = (id: string, title: string, price: number, rating?: number): ProductCardModel =>
  ({ id, handle: id, title, url: `/products/${id}`, price, currency: 'USD', rating }) as ProductCardModel;

const list: ReadonlyArray<ProductCardModel> = [p('a', 'Alpha', 10, 5), p('b', 'Beta', 30, 3), p('c', 'Gamma', 20, 4)];

describe('sortProducts', () => {
  it('returns the same reference for featured (API order preserved)', () => {
    expect(sortProducts(list, 'featured')).toBe(list);
  });

  it('sorts by price both ways', () => {
    expect(sortProducts(list, 'price-asc').map((x) => x.id)).toEqual(['a', 'c', 'b']);
    expect(sortProducts(list, 'price-desc').map((x) => x.id)).toEqual(['b', 'c', 'a']);
  });

  it('sorts by name both ways', () => {
    expect(sortProducts(list, 'name-asc').map((x) => x.id)).toEqual(['a', 'b', 'c']);
    expect(sortProducts(list, 'name-desc').map((x) => x.id)).toEqual(['c', 'b', 'a']);
  });

  it('sorts by rating, treating a missing rating as zero', () => {
    expect(sortProducts(list, 'rating-desc').map((x) => x.id)).toEqual(['a', 'c', 'b']);
    expect(sortProducts([p('x', 'X', 1)], 'rating-desc').map((x) => x.id)).toEqual(['x']);
  });

  it('never mutates the source array', () => {
    const before = list.map((x) => x.id);
    sortProducts(list, 'price-asc');
    expect(list.map((x) => x.id)).toEqual(before);
  });
});

describe('toSortKey', () => {
  it('accepts known keys and rejects anything else', () => {
    expect(toSortKey('price-asc')).toBe('price-asc');
    expect(toSortKey('nonsense')).toBe('featured');
    expect(toSortKey(undefined)).toBe('featured');
    expect(toSortKey(null, 'rating-desc')).toBe('rating-desc');
  });
});
