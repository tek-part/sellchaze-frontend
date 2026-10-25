import { describe, expect, it } from 'vitest';
import type { CheckoutQuote } from '../api/storefront';
import { checkoutDiscountLines, quoteHasFreeShippingDiscount } from './checkout-discounts';

const totals = (discount: string): CheckoutQuote['totals'] => ({ subtotal: '200.00', discount_total: discount, shipping_total: '0.00', tax_total: '0.00', grand_total: '180.00' });

describe('checkout discount lines', () => {
  it('lists each applied discount by title, a code discount by its code, and free shipping without an amount', () => {
    const lines = checkoutDiscountLines({ totals: totals('20.00'), discounts: [
      { id: 3, title: 'Autumn sale', code: null, method: 'automatic', type: 'percentage', amount: '20.00' },
      { id: 4, title: '', code: 'SHIPFREE', method: 'code', type: 'free_shipping', amount: '0.00' },
    ] }, 'Discount');
    expect(lines).toEqual([
      { key: 'discount-3', label: 'Autumn sale', amount: 20, freeShipping: false },
      { key: 'discount-4', label: 'SHIPFREE', amount: null, freeShipping: true },
    ]);
  });

  it('keeps the single generic line when an older API sends no discounts', () => {
    expect(checkoutDiscountLines({ totals: totals('15.00') }, 'Discount')).toEqual([{ key: 'discount', label: 'Discount', amount: 15, freeShipping: false }]);
    expect(checkoutDiscountLines({ totals: totals('0.00') }, 'Discount')).toEqual([]);
  });

  it('never hides a discount total the list does not explain, and drops zero-amount order discounts', () => {
    const lines = checkoutDiscountLines({ totals: totals('5.00'), discounts: [
      { id: 9, title: 'Buy 2 get 1', code: null, method: 'automatic', type: 'buy_x_get_y', amount: '0.00' },
      { id: 10, title: 'Ship free', code: null, method: 'automatic', type: 'free_shipping', amount: '0.00' },
    ] }, 'Discount');
    expect(lines.map((line) => line.label)).toEqual(['Discount', 'Ship free']);
    expect(checkoutDiscountLines({ totals: totals('0.00'), discounts: [] }, 'Discount')).toEqual([]);
  });

  it('detects a free-shipping discount', () => {
    expect(quoteHasFreeShippingDiscount(null)).toBe(false);
    expect(quoteHasFreeShippingDiscount({})).toBe(false);
    expect(quoteHasFreeShippingDiscount({ discounts: [{ id: 1, title: 'Ship', code: null, method: 'automatic', type: 'free_shipping', amount: '0.00' }] })).toBe(true);
  });
});
