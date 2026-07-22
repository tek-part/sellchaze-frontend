/** Voltage section-data readers — fail-safe access to the shared StorefrontContext data contract. */
import { describe, expect, it } from 'vitest';
import type { StorefrontContext } from '../../../theme-engine/rendering';
import type { ProductCardModel, ProductDetailModel } from '../../../types/catalog';
import {
  breadcrumbsOf,
  categoriesFor,
  currencyOf,
  isLoading,
  pageHeaderOf,
  productDetailOf,
  productsFor,
  reviewsFor,
} from './section-data';

const ctx = (data: Record<string, unknown>, currency = 'USD'): StorefrontContext => ({
  store: { name: 'T', currency },
  seo: {},
  navigation: { header: [], footer: [] },
  data,
});

const product = (id: string): ProductCardModel => ({ id, handle: id, title: id, url: `/p/${id}`, price: 1, currency: 'USD' });

describe('voltage section-data', () => {
  it('productsFor() reads a named collection, else the products list, else empty', () => {
    const p = [product('a')];
    const rel = [product('r')];
    expect(productsFor(ctx({ products: p }))).toEqual(p);
    expect(productsFor(ctx({ collections: { related: rel } }), 'related')).toEqual(rel);
    expect(productsFor(ctx({ products: p }), 'missing')).toEqual(p);
    expect(productsFor(ctx({}))).toEqual([]);
  });

  it('categoriesFor() returns an array or empty', () => {
    expect(categoriesFor(ctx({}))).toEqual([]);
    expect(categoriesFor(ctx({ categories: 'nope' as unknown }))).toEqual([]);
  });

  it('isLoading() is strictly boolean-true', () => {
    expect(isLoading(ctx({ loading: true }))).toBe(true);
    expect(isLoading(ctx({ loading: 1 as unknown }))).toBe(false);
    expect(isLoading(ctx({}))).toBe(false);
  });

  it('currencyOf() falls back to USD', () => {
    expect(currencyOf(ctx({}, 'EUR'))).toBe('EUR');
    expect(currencyOf(ctx({}, ''))).toBe('USD');
  });

  it('pageHeaderOf() returns the header or an empty object', () => {
    expect(pageHeaderOf(ctx({ pageHeader: { title: 'X' } }))).toEqual({ title: 'X' });
    expect(pageHeaderOf(ctx({}))).toEqual({});
  });

  it('productDetailOf() returns the product object or null', () => {
    const d = { id: '1', title: 'x' } as unknown as ProductDetailModel;
    expect(productDetailOf(ctx({ product: d }))).toBe(d);
    expect(productDetailOf(ctx({}))).toBeNull();
  });

  it('reviewsFor() returns the reviews array or empty', () => {
    const reviews = [{ id: 'r1', author: 'A', rating: 5, body: 'ok' }];
    expect(reviewsFor(ctx({ reviews }))).toEqual(reviews);
    expect(reviewsFor(ctx({}))).toEqual([]);
    expect(reviewsFor(ctx({ reviews: 'nope' as unknown }))).toEqual([]);
  });

  it('breadcrumbsOf() reads pageHeader.breadcrumbs or empty', () => {
    const crumbs = [{ label: 'Home', url: '/' }, { label: 'Shirts', url: '/c/shirts' }];
    expect(breadcrumbsOf(ctx({ pageHeader: { breadcrumbs: crumbs } }))).toEqual(crumbs);
    expect(breadcrumbsOf(ctx({ pageHeader: {} }))).toEqual([]);
    expect(breadcrumbsOf(ctx({}))).toEqual([]);
  });
});
