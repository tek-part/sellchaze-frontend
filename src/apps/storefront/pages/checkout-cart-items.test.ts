import { describe, expect, it } from 'vitest';
import { checkoutCartItems } from './checkout-cart-items';
import type { CartLine } from '../types/cart';

describe('checkout cart submission', () => {
  it('preserves discounted offer identity in the actual order body alongside a regular line', () => {
    const regular: CartLine = { id: '1:default', productId: '1', title: 'Bag', url: '/products/bag', price: 250, currency: 'EGP', quantity: 1 };
    const offered: CartLine = { ...regular, id: '2:blue:offer', productId: '2', variantId: '7', price: 700, quantity: 2, personalization: { engraving: 'Review' },
      quantityOffer: { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', quantity: 2, unitPrice: 700, version: 3, freeShipping: true, title: '', subtitle: '' } };
    expect(checkoutCartItems([regular, offered])).toEqual([{ product_id: 1, quantity: 1 },
      { product_id: 2, variant_id: 7, quantity: 2, personalization: { engraving: 'Review' }, quantity_offer_id: offered.quantityOffer?.id, quantity_offer_version: 3 }]);
    expect(checkoutCartItems([offered])[0]).not.toHaveProperty('price');
    expect(checkoutCartItems([offered])[0]).not.toHaveProperty('free_shipping');
  });
});
