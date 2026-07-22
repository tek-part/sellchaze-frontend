/** Rouge — fail-safe section-data readers over StorefrontContext. Pure logic (node env). */
import { describe, expect, it } from 'vitest';
import type { StorefrontContext } from '../../../theme-engine/rendering';
import {
  categoriesFor,
  currencyOf,
  isLoading,
  pageHeaderOf,
  productDetailOf,
  productsFor,
  reviewsFor,
} from './section-data';

function ctx(data: Record<string, unknown>, currency = 'USD'): StorefrontContext {
  return {
    store: { name: 'Rouge', currency },
    seo: {},
    navigation: { header: [], footer: [] },
    data,
  };
}

const product = { id: 'p1', handle: 'p1', title: 'Lip Oil', url: '/products/p1', price: 20, currency: 'USD' };

describe('rouge section-data', () => {
  it('productsFor reads products, or a named collection', () => {
    expect(productsFor(ctx({ products: [product] }))).toHaveLength(1);
    expect(productsFor(ctx({ collections: { related: [product, product] } }), 'related')).toHaveLength(2);
    expect(productsFor(ctx({}))).toEqual([]);
    expect(productsFor(ctx({ products: 'bad' }))).toEqual([]);
  });
  it('categoriesFor is fail-safe', () => {
    expect(categoriesFor(ctx({ categories: [{ id: 'c', title: 'C', url: '/c' }] }))).toHaveLength(1);
    expect(categoriesFor(ctx({}))).toEqual([]);
  });
  it('isLoading reads the flag strictly', () => {
    expect(isLoading(ctx({ loading: true }))).toBe(true);
    expect(isLoading(ctx({ loading: 'yes' }))).toBe(false);
    expect(isLoading(ctx({}))).toBe(false);
  });
  it('currencyOf falls back to USD', () => {
    expect(currencyOf(ctx({}, 'GBP'))).toBe('GBP');
    expect(currencyOf(ctx({}, ''))).toBe('USD');
  });
  it('pageHeaderOf + productDetailOf tolerate absence', () => {
    expect(pageHeaderOf(ctx({}))).toEqual({});
    expect(pageHeaderOf(ctx({ pageHeader: { title: 'Shop' } })).title).toBe('Shop');
    expect(productDetailOf(ctx({}))).toBeNull();
    expect(productDetailOf(ctx({ product: { ...product, images: [] } }))?.id).toBe('p1');
  });
  it('reviewsFor is fail-safe', () => {
    expect(reviewsFor(ctx({ reviews: [{ id: 'r', author: 'A', rating: 5, body: 'x' }] }))).toHaveLength(1);
    expect(reviewsFor(ctx({}))).toEqual([]);
  });
});
