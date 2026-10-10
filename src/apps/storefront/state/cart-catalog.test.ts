import { describe, expect, it } from 'vitest';
import type { CartLine } from '../types/cart';
import type { ProductDetailModel } from '../types/catalog';
import { cartPurchaseSummary, reconcileCartCatalog } from './cart-catalog';

const line: CartLine = { id: '1:default', productId: '1', title: 'Old bag', url: '/products/old-bag', quantity: 3, price: 100, currency: 'EGP', maxQuantity: 8 };
const product: ProductDetailModel = { id: '1', handle: 'bag', title: 'New bag', url: '/products/bag', currency: 'EGP', price: 125, images: [], availableStock: 2, digitalType: 'physical' };
describe('current catalog reconciliation', () => {
  it('refreshes prices, slugs, stock and digital routing on stale saved lines', () => {
    const next = reconcileCartCatalog([line], ['1'], [product]);
    expect(next[0]).toMatchObject({ title: 'New bag', url: '/products/bag', price: 125, quantity: 2, maxQuantity: 2, digitalType: 'physical' });
    expect(cartPurchaseSummary(next)).not.toBe(cartPurchaseSummary([line]));
    const replenished = reconcileCartCatalog(next, ['1'], [{ ...product, availableStock: undefined }]);
    expect(replenished[0]?.maxQuantity).toBeUndefined();
    expect(replenished[0]?.quantity).toBe(2);
  });
  it('removes missing/unpublished variants without silently selecting a different option', () => {
    const selected = { ...line, id: '1:7', variantId: '7' };
    const variants = [{ id: '8', label: 'New edition', available: true }];
    expect(reconcileCartCatalog([selected], ['1'], [{ ...product, variants }])).toEqual([]);
    expect(reconcileCartCatalog([line], ['1'], [{ ...product, variants }])).toEqual([]);
    expect(reconcileCartCatalog([line], ['1'], [])).toEqual([]);
    expect(reconcileCartCatalog([line], ['1'], [{ ...product, soldOut: true }])).toEqual([]);
  });
  it('adds shared pool limits to legacy metadata across variants and personalization', () => {
    const variants = [{ id: '7', label: 'A', available: true, availableStock: 2, price: 110 }, { id: '8', label: 'B', available: true, availableStock: 3 }];
    const fields = [{ key: 'message', type: 'text' as const, label: 'Dedication', required: false, max_length: 30 }];
    const lines = [
      { ...line, id: '1:7', variantId: '7', quantity: 1 },
      { ...line, id: '1:8', variantId: '8', quantity: 1 },
      { ...line, id: 'old-personalized', variantId: '8', quantity: 2, personalization: { message: 'Hello' }, personalizationEntries: [{ key: 'message', type: 'text' as const, label: 'Old label', value: 'Hello' }] },
    ];
    const next = reconcileCartCatalog(lines, ['1'], [{ ...product, variants, personalizationFields: fields, digitalType: 'codes', sharedMaxQuantity: 3 }]);
    expect(next.map((item) => item.quantity)).toEqual([1, 1, 1]);
    expect(next.every((item) => item.sharedMaxQuantity === 3)).toBe(true);
    expect(next[2]?.personalizationEntries?.[0]).toMatchObject({ label: 'Dedication', value: 'Hello' });
    expect(next[0]?.price).toBe(110);
    expect(reconcileCartCatalog(next, ['1'], [{ ...product, variants, personalizationFields: fields, digitalType: 'codes', sharedMaxQuantity: 0 }])).toEqual([]);
  });
  it('preserves concurrently added unrelated products and never restores removed lines', () => {
    const other = { ...line, id: '2:default', productId: '2' };
    expect(reconcileCartCatalog([other], ['1'], [product])).toEqual([other]);
    expect(reconcileCartCatalog([], ['1'], [product])).toEqual([]);
    expect(reconcileCartCatalog([line, other], ['1'], [product, { ...product, id: '2' }])[1]).toEqual(other);
  });
  it('does not fabricate new required personalization or retain removed fields', () => {
    const fields = [{ key: 'required', type: 'text' as const, label: 'Required', required: true, max_length: 30 }];
    expect(reconcileCartCatalog([line], ['1'], [{ ...product, personalizationFields: fields }])).toEqual([]);
    const next = reconcileCartCatalog([{ ...line, personalization: { old: 'obsolete' } }], ['1'], [product]);
    expect(next[0]?.personalization).toBeUndefined();
    expect(next[0]?.id).toBe('1:default');
  });
  it('preserves quantities when removed optional fields collapse two prior selections', () => {
    const selections = ['A', 'B'].map((value) => ({ ...line, id: value, quantity: 1, personalization: { removed: value } }));
    const next = reconcileCartCatalog(selections, ['1'], [product]);
    expect(next).toHaveLength(1);
    expect(next[0]?.quantity).toBe(2);
    expect(next[0]?.personalization).toBeUndefined();
  });
});
