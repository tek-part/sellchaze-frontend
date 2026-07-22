import { describe, expect, it } from 'vitest';
import { categoriesFor, currencyOf, isLoading, productDetailOf, productsFor } from './section-data';
import type { StorefrontContext } from '../../../theme-engine/rendering';
import type { ProductCardModel } from '../../../types/catalog';

function ctx(data: Record<string, unknown>, currency = 'USD'): StorefrontContext {
  return { store: { name: 'Test', currency }, seo: {}, navigation: { header: [], footer: [] }, data };
}

const product = (id: string): ProductCardModel => ({
  id,
  handle: id,
  title: `Product ${id}`,
  url: `/products/${id}`,
  price: 100,
  currency: 'USD',
});

describe('hearth section-data readers', () => {
  it('productsFor reads the default list and named collections', () => {
    const c = ctx({ products: [product('a')], collections: { featured: [product('b'), product('c')] } });
    expect(productsFor(c).map((p) => p.id)).toEqual(['a']);
    expect(productsFor(c, 'featured').map((p) => p.id)).toEqual(['b', 'c']);
    // A missing named collection gracefully falls back to the default product list.
    expect(productsFor(c, 'missing').map((p) => p.id)).toEqual(['a']);
  });

  it('categoriesFor / productDetailOf tolerate missing data (no throw)', () => {
    expect(categoriesFor(ctx({}))).toEqual([]);
    expect(productDetailOf(ctx({}))).toBeNull();
    expect(productDetailOf(ctx({ product: { id: 'x', title: 'X' } }))).not.toBeNull();
  });

  it('isLoading and currencyOf are fail-safe', () => {
    expect(isLoading(ctx({ loading: true }))).toBe(true);
    expect(isLoading(ctx({}))).toBe(false);
    expect(currencyOf(ctx({}, 'GBP'))).toBe('GBP');
    expect(currencyOf(ctx({}, ''))).toBe('USD');
  });
});
