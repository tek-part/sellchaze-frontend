import { describe, expect, it } from 'vitest';
import type { CartLine } from '../types/cart';
import type { QuantityOffer } from '../types/quantity-offers';
import { toProductDetail } from '../api/mappers';
import { personalizedLineId } from '../utils/personalization';
import { addCartLine, cartLineLimit, changeCartQuantity, normalizeCartLines } from './cart-quantity';
import { decodeCart, encodeCart } from './cart-storage';
import { cartPurchaseSummary, reconcileCartCatalog } from './cart-catalog';
import { cartHasFreeShippingOffer } from '../utils/shipping';

const offer: QuantityOffer = { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', quantity: 2, unitPrice: 700, version: 2, freeShipping: true, title: '', subtitle: '' };
const regular: CartLine = { id: '1:default', productId: '1', title: 'Organizer', url: '/products/organizer', price: 750, currency: 'EGP', quantity: 1, maxQuantity: 5, digitalType: 'physical' };
const offered: CartLine = { ...regular, id: personalizedLineId('1', undefined, {}, offer.id), quantity: 2, price: 700, quantityOffer: offer };
const product = (price = '700.00', version = 2, free = true) => toProductDetail({ id: 1, name: 'Organizer', slug: 'organizer', price: '750.00', stock: 5,
  quantity_offers: [{ id: offer.id, quantity: 2, unit_price: price, version, free_shipping: free, title: '', subtitle: '' }] }, 'EGP');

describe('configured quantity offer baskets', () => {
  it('keeps regular and package prices separate while repeated packages share actual stock', () => {
    let lines = addCartLine([regular], offered);
    lines = addCartLine(lines, offered);
    expect(lines).toHaveLength(2); expect(lines[0]?.price).toBe(750); expect(lines[1]?.price).toBe(700);
    expect(lines[1]?.quantity).toBe(4); expect(cartLineLimit(lines, offered)).toBe(4);
    expect(lines.reduce((sum, line) => sum + line.quantity * line.price, 0)).toBe(3550);
    expect(addCartLine(lines, offered)).toEqual(lines);
    expect(changeCartQuantity(lines, offered.id, 3)[1]?.quantity).toBe(2);
    expect(changeCartQuantity(lines, offered.id, 5)[1]?.quantity).toBe(4);
  });
  it('restores only complete packages and honors the server 999-unit SKU bound', () => {
    expect(normalizeCartLines([{ ...offered, quantity: 5 }])[0]?.quantity).toBe(4);
    expect(normalizeCartLines([{ ...offered, quantity: 2, maxQuantity: 1 }])).toEqual([]);
    const untracked = { ...offered, maxQuantity: undefined, quantity: 1000 };
    expect(normalizeCartLines([untracked])[0]?.quantity).toBe(998);
    expect(normalizeCartLines([{ ...regular, maxQuantity: undefined, quantity: 1000 }])[0]?.quantity).toBe(999);
  });
  it('preserves package identity/version in scoped storage and rejects malformed saved contracts', () => {
    const encoded = encodeCart([offered], '1', 'EGP');
    expect(decodeCart(encoded, '1', 'EGP')).toEqual([offered]); expect(decodeCart(encoded, '2', 'EGP')).toBeNull();
    for (const bad of [{ ...offer, quantity: 0 }, { ...offer, version: 0 }, { ...offer, unitPrice: -1 }]) {
      expect(decodeCart(encodeCart([{ ...offered, quantityOffer: bad }], '1', 'EGP'), '1', 'EGP')).toEqual([]);
    }
    expect(personalizedLineId('1', undefined, { engraving: 'A' }, offer.id)).not.toBe(personalizedLineId('1', undefined, { engraving: 'A' }));
  });
  it('refreshes price/version/shipping together and removes unavailable offers without converting them to regular price', () => {
    const next = reconcileCartCatalog([regular, offered], ['1'], [product('650.00', 3, false)]);
    expect(next).toHaveLength(2); expect(next[1]?.price).toBe(650); expect(next[1]?.quantityOffer?.version).toBe(3);
    expect(cartPurchaseSummary(next)).not.toBe(cartPurchaseSummary([regular, offered]));
    expect(cartHasFreeShippingOffer(next)).toBe(false); expect(cartHasFreeShippingOffer([offered])).toBe(true);
    expect(cartHasFreeShippingOffer([{ ...offered, digitalType: 'codes' }])).toBe(false);
    expect(reconcileCartCatalog([regular, offered], ['1'], [{ ...product(), quantityOffers: [] }])).toEqual([regular]);
    expect(reconcileCartCatalog([offered], ['1'], [{ ...product(), price: 600 }])).toEqual([]);
  });
  it('converts the offer price with the same display currency multiplier as the product', () => {
    const detail = toProductDetail({ id: 1, name: 'Organizer', slug: 'organizer', price: 750,
      quantity_offers: [{ id: offer.id, quantity: 2, unit_price: '700.00', version: 2, free_shipping: true, title: 'Two', subtitle: '' }] }, 'USD', .5);
    expect(detail.price).toBe(375); expect(detail.quantityOffers?.[0]?.unitPrice).toBe(350);
  });
});
