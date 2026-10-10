import { describe, expect, it } from 'vitest';
import type { CheckoutQuote } from '../api/storefront';
import { minimumOrderAllows, minimumOrderMessage } from './minimum-order';

const quote: CheckoutQuote = { currency: 'EGP', requires_shipping: true, items: [],
  totals: { subtotal: '300.00', discount_total: '25.00', shipping_total: '85.00', tax_total: '27.50', grand_total: '387.50' },
  order_minimum: { amount: '300.00', merchandise_total: '275.00', remaining: '25.00', eligible: false } };

describe('authoritative minimum order at checkout', () => {
  it('blocks missing and ineligible quotes despite shipping/tax pushing the total over the minimum', () => {
    expect(minimumOrderAllows(null)).toBe(false);
    expect(minimumOrderAllows(quote)).toBe(false);
  });
  it('allows an eligible live quote and preserves compatibility with an older unconfigured API', () => {
    expect(minimumOrderAllows({ ...quote, order_minimum: { ...quote.order_minimum!, eligible: true, remaining: '0.00' } })).toBe(true);
    const { order_minimum: _minimum, ...legacy } = quote;
    expect(minimumOrderAllows(legacy)).toBe(true);
    expect(minimumOrderMessage(legacy, 'en')).toBeUndefined();
  });
  it('shows the server-calculated gap and explains the basis in both languages', () => {
    expect(minimumOrderMessage(quote, 'en')).toContain('Add EGP');
    expect(minimumOrderMessage(quote, 'en')).toContain('25.00');
    expect(minimumOrderMessage(quote, 'ar')).toContain('بعد الخصم، بدون الشحن والضريبة');
    expect(minimumOrderMessage({ ...quote, order_minimum: { ...quote.order_minimum!, eligible: true } }, 'ar')).toBeUndefined();
  });
});
