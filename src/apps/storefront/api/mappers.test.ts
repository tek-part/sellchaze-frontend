import { describe, expect, it } from 'vitest';
import { toCategoryCard, toProductCard, toProductDetail } from './mappers';
import type { ApiProduct } from './types';

const base: ApiProduct = {
  id: 7,
  name: 'Wool Coat',
  slug: 'wool-coat',
  price: '180.00',
  compare_price: '240.00',
  image_url: 'https://img/x.jpg',
  is_featured: true,
  variants: [
    { id: 1, name: 'S', stock: 3, is_active: true },
    { id: 2, name: 'L', stock: 0, is_active: true },
  ],
};

describe('toProductCard', () => {
  it('carries the store selection preference into both cards and product details', () => {
    expect(toProductCard(base, 'EGP').autoSelectVariants).toBe(true);
    expect(toProductCard({ ...base, auto_select_variant: false }, 'EGP').autoSelectVariants).toBe(false);
    expect(toProductDetail({ ...base, auto_select_variant: false }, 'EGP').autoSelectVariants).toBe(false);
    expect(toProductDetail({ ...base, auto_select_variant: true }, 'EGP').autoSelectVariants).toBe(true);
  });
  it('keeps the merchant order cap separate from stock and sold-out state', () => {
    const card = toProductCard({ ...base, order_quantity_limit: 2 }, 'EGP');
    expect(card.orderMaxQuantity).toBe(2);
    expect(card.soldOut).toBe(false);
    expect(toProductCard({ ...base, order_quantity_limit: 0 }, 'EGP').orderMaxQuantity).toBeUndefined();
    expect(toProductDetail({ ...base, order_quantity_limit: 2 }, 'EGP').orderMaxQuantity).toBe(2);
  });
  it('maps ids, slug→handle/url and parses string prices', () => {
    const card = toProductCard(base, 'USD');
    expect(card.id).toBe('7');
    expect(card.handle).toBe('wool-coat');
    expect(card.url).toBe('/products/wool-coat');
    expect(card.price).toBe(180);
    expect(card.compareAtPrice).toBe(240);
    expect(card.currency).toBe('USD');
    expect(card.badge).toBe('Featured');
  });

  it('omits compareAtPrice when not greater than price', () => {
    const card = toProductCard({ ...base, compare_price: '150' }, 'USD');
    expect(card.compareAtPrice).toBeUndefined();
  });
});

describe('toProductDetail', () => {
  it('uses available stock for base products and treats null as untracked', () => {
    const sold = { ...base, variants: [], stock: 0 };
    expect(toProductCard(sold, 'EGP').soldOut).toBe(true);
    expect(toProductDetail(sold, 'EGP').inStock).toBe(false);
    expect(toProductDetail({ ...sold, stock: null }, 'EGP').inStock).toBe(true);
    expect(toProductDetail({ ...sold, stock: 2 }, 'EGP').inStock).toBe(true);
    expect(toProductDetail({ ...sold, stock: 2, is_active: false }, 'EGP').inStock).toBe(false);
  });
  it('does not use base stock to hide a stocked product option', () => {
    expect(toProductCard({ ...base, stock: 0 }, 'EGP').soldOut).toBe(false);
    expect(toProductDetail({ ...base, stock: 0 }, 'EGP').inStock).toBe(true);
    expect(toProductCard({ ...base, variants: [{ id: 1, stock: 0 }] }, 'EGP').soldOut).toBe(true);
    expect(toProductCard({ ...base, variants: [{ id: 1, stock: null }] }, 'EGP').soldOut).toBe(false);
  });
  it('builds variants with availability from stock/active', () => {
    const detail = toProductDetail(base, 'EUR');
    expect(detail.variants).toHaveLength(2);
    expect(detail.variants?.[0]).toMatchObject({ id: '1', label: 'S', available: true });
    expect(detail.variants?.[1]).toMatchObject({ id: '2', label: 'L', available: false });
    expect(detail.inStock).toBe(true);
    expect(detail.images.length).toBeGreaterThan(0);
  });
});

describe('toCategoryCard', () => {
  it('maps slug to a collection url and product count to meta', () => {
    const card = toCategoryCard({ id: 3, name: 'Knitwear', slug: 'knitwear', products_count: 12 });
    expect(card.url).toBe('/collections/knitwear');
    expect(card.meta).toBe('12 pieces');
  });
});
