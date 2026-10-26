import { describe, expect, it } from 'vitest';
import type { CheckoutQuote } from '../api/storefront';
import { giftCardLines, giftCardsCoverTotal, maskGiftCard, normalizeGiftCardCode, quoteAmountDue } from './checkout-gift-cards';

const quote = (amountDue: string | undefined, cards: CheckoutQuote['gift_cards']): Pick<CheckoutQuote, 'amount_due' | 'totals' | 'gift_cards'> => ({
  amount_due: amountDue, gift_cards: cards, totals: { subtotal: '100.00', discount_total: '0.00', shipping_total: '30.00', tax_total: '0.00', grand_total: '130.00' },
});

describe('checkout gift cards', () => {
  it('normalizes codes regardless of case, spaces and dashes, and masks chips', () => {
    expect(normalizeGiftCardCode(' abcd-efgh ijkl-mn23 ')).toBe('ABCDEFGHIJKLMN23');
    expect(maskGiftCard('MN23')).toBe('•••• MN23');
  });

  it('lists one line per card that pays something and reads the amount due', () => {
    const partial = quote('80.00', [{ last4: 'AAAA', applied: '50.00', balance_after: '0.00' }]);
    expect(giftCardLines(partial)).toEqual([{ key: 'gift-card-0-AAAA', last4: 'AAAA', amount: 50 }]);
    expect(quoteAmountDue(partial)).toBe(80);
    expect(giftCardsCoverTotal(partial, ['X'])).toBe(false);
    const covered = quote('0.00', [{ last4: 'AAAA', applied: '50.00', balance_after: '0.00' }, { last4: 'BBBB', applied: '80.00', balance_after: '20.00' }, { last4: 'CCCC', applied: '0.00', balance_after: '5.00' }]);
    expect(giftCardLines(covered).map((line) => line.last4)).toEqual(['AAAA', 'BBBB']);
    expect(giftCardsCoverTotal(covered, ['X', 'Y', 'Z'])).toBe(true);
  });

  it('never treats an older API or an order without cards as paid', () => {
    expect(quoteAmountDue(quote(undefined, undefined))).toBe(130);
    expect(giftCardsCoverTotal(quote(undefined, undefined), ['X'])).toBe(false);
    expect(giftCardsCoverTotal(quote('0.00', []), [])).toBe(false);
    expect(giftCardsCoverTotal(null, ['X'])).toBe(false);
  });
});
