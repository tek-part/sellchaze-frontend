import { describe, expect, it } from 'vitest';
import { toProductCard } from '../api/mappers';
import { cardCartInput } from './card-purchase';

const product = toProductCard({ id: 7, name: 'Shirt', slug: 'shirt', price: '125', stock: 0,
  variants: [
    { id: 1, name: 'Blue S', price: '150', compare_price: '200', stock: 4, is_active: true },
    { id: 2, name: 'Red M', price: '0', stock: null, is_active: true },
    { id: 3, name: 'Green L', price: '120', stock: 0, is_active: true },
    { id: 4, name: 'Hidden', price: '100', stock: 3, is_active: false },
  ],
}, 'EGP', 2);

describe('product card purchase choices', () => {
  it('carries both shared code stock and the selected variant cap into quick-add', () => {
    const codes = toProductCard({ id: 8, name: 'Guide', slug: 'guide', price: '100', digital_type: 'codes', digital_pool_stock: 3, stock: 3, variants: [{ id: 1, name: 'Edition', stock: 1 }] }, 'EGP');
    expect(cardCartInput(codes, '1')).toMatchObject({ digitalType: 'codes', sharedMaxQuantity: 3, maxQuantity: 1 });
  });
  it('requires an explicit valid option and prevents sold-out/hidden choices', () => {
    expect(cardCartInput(product)).toBeNull();
    expect(cardCartInput(product, 'unknown')).toBeNull();
    expect(cardCartInput(product, '3')).toBeNull();
    expect(cardCartInput(product, '4')).toBeNull();
  });
  it('carries variant identity, converted price and available quantity into a distinct cart line', () => {
    expect(cardCartInput(product, '1')).toMatchObject({ id: '7:1', productId: '7', variantId: '1', attributes: 'Blue S', price: 300, maxQuantity: 4, quantity: 1 });
    expect(product.variants?.[0]?.compareAtPrice).toBe(400);
    expect(cardCartInput(product, '2')).toMatchObject({ id: '7:2', variantId: '2', price: 0 });
    expect(cardCartInput(product, '2')).not.toHaveProperty('maxQuantity');
  });
  it('keeps simple products directly buyable, with stock constraints when supplied', () => {
    const simple = toProductCard({ id: 9, name: 'Simple', slug: 'simple', price: '25', stock: 2, variants: [] }, 'EGP');
    expect(cardCartInput(simple)).toMatchObject({ id: '9:default', price: 25, maxQuantity: 2 });
    expect(cardCartInput(simple)).not.toHaveProperty('variantId');
    expect(cardCartInput({ ...simple, availableStock: 0 })).toBeNull();
    expect(cardCartInput({ ...simple, soldOut: true })).toBeNull();
  });
});
