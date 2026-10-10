import { describe, expect, it } from 'vitest';
import type { CartLine } from '../types/cart';
import { cartStorageKey, decodeCart, encodeCart, loadCart } from './cart-storage';

const line: CartLine = { id: '1:default', productId: '1', title: 'Bag', url: '/products/bag', quantity: 1, price: 100, currency: 'EGP' };
describe('store-scoped cart persistence', () => {
  it('keeps same-currency stores and different currencies isolated, rejecting mismatched envelopes', () => {
    const values = new Map([[cartStorageKey('1', 'EGP'), encodeCart([line], '1', 'EGP')]]);
    const storage = { getItem: (key: string) => values.get(key) ?? null };
    expect(loadCart(storage, '1', 'EGP')).toEqual([line]);
    expect(loadCart(storage, '2', 'EGP')).toEqual([]);
    expect(loadCart(storage, '1', 'USD')).toEqual([]);
    expect(decodeCart(encodeCart([line], '1', 'EGP'), '2', 'EGP')).toBeNull();
    expect(cartStorageKey('a:b', 'EGP')).not.toBe(cartStorageKey('a', 'b:EGP'));
  });
  it('never imports ambiguous v1 arrays and preserves the legacy key untouched', () => {
    const old = JSON.stringify([line]);
    const values = new Map([['sf-cart-v1:EGP', old]]);
    expect(loadCart({ getItem: (key: string) => values.get(key) ?? null }, '1', 'EGP')).toEqual([]);
    expect(values.get('sf-cart-v1:EGP')).toBe(old);
    expect(decodeCart(old, '1', 'EGP')).toBeNull();
  });
  it('tolerates unavailable/corrupt storage and rejects unsafe persisted fields', () => {
    expect(loadCart({ getItem: () => { throw new Error('disabled'); } }, '1', 'EGP')).toEqual([]);
    expect(decodeCart('{broken', '1', 'EGP')).toBeNull();
    const invalid = [null, { ...line, url: 'javascript:alert(1)' }, { ...line, personalization: { text: 7 } }, { ...line, personalizationEntries: [null] }];
    expect(decodeCart(JSON.stringify({ version: 2, storeId: '1', currency: 'EGP', lines: [line, ...invalid] }), '1', 'EGP')).toEqual([line]);
  });
  it('restores aggregate shared pool and SKU limits without requiring recent metadata', () => {
    const lines = [{ ...line, digitalType: 'codes' as const, sharedMaxQuantity: 2, quantity: 2 }, { ...line, id: '1:2', variantId: '2', quantity: 2 }];
    expect(decodeCart(encodeCart(lines, '1', 'EGP'), '1', 'EGP')).toHaveLength(1);
    expect(decodeCart(null, '1', 'EGP')).toEqual([]);
  });
});
