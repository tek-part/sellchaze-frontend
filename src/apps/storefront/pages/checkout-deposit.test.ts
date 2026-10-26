import { describe, expect, it } from 'vitest';
import type { CheckoutQuote } from '../api/storefront';
import { canPayDeposit, depositPaymentMethods, linkParts, quoteConfirmation, safeLink } from './checkout-deposit';

const methods = [{ slug: 'cod', deposit_capable: false }, { slug: 'paymob', deposit_capable: true }, { slug: 'transfer_receipt' }];
const totals = { subtotal: '100.00', discount_total: '0.00', shipping_total: '20.00', tax_total: '0.00', grand_total: '120.00' };
const deposit: NonNullable<CheckoutQuote['deposit']> = { amount: '24.00', remaining: '96.00', percentage: '20.00', minimum: '0.00', confirm_after_payment: false, remainder_method: 'cod' };

describe('checkout deposits', () => {
  it('offers only methods that collect a deposit when one is needed', () => {
    expect(depositPaymentMethods(methods, { deposit: null }, null)).toEqual(methods);
    expect(depositPaymentMethods(methods, { deposit }, null).map((method) => method.slug)).toEqual(['paymob', 'transfer_receipt']);
    expect(depositPaymentMethods(methods, null, { percentage: '20.00', minimum: '0.00', confirm_after_payment: false, remainder_method: 'cod' }).map((method) => method.slug)).toEqual(['paymob', 'transfer_receipt']);
    expect(canPayDeposit({ slug: 'cod' })).toBe(false);
  });
  it('confirms the deposit only on APIs that quote one', () => {
    expect(quoteConfirmation(null)).toEqual({});
    expect(quoteConfirmation({ totals })).toEqual({ expected_total: '120.00' });
    expect(quoteConfirmation({ totals, deposit: null })).toEqual({ expected_total: '120.00', expected_deposit: '0.00' });
    expect(quoteConfirmation({ totals, deposit })).toEqual({ expected_total: '120.00', expected_deposit: '24.00' });
  });
  it('links only http(s) URLs in descriptions', () => {
    expect(linkParts('Pay via https://ipn.eg/S/shop. Thanks')).toEqual([{ text: 'Pay via ' }, { text: 'https://ipn.eg/S/shop', href: 'https://ipn.eg/S/shop' }, { text: '. Thanks' }]);
    expect(linkParts('javascript:alert(1) and data:text/html,x')).toEqual([{ text: 'javascript:alert(1) and data:text/html,x' }]);
    expect(safeLink('javascript:alert(1)')).toBeNull();
    expect(safeLink('https://ipn.eg/x')).toBe('https://ipn.eg/x');
    expect(safeLink(null)).toBeNull();
  });
});
