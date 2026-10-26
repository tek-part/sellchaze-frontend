import { describe, expect, it } from 'vitest';
import { giftCardRefundSplit, refundValueAvailable } from './gift-card-refunds';

// 130.00 order: 78.00 (60%) by gift card + 52.00 cash on delivery — the server test's numbers.
const fresh = { grand_total: '130.00', gift_card_total: '78.00', payment_collected: true, refunded_money: '0.00', refunded_to_gift_cards: '0.00', refundable_money: '52.00', refundable_to_gift_cards: '78.00' };

describe('gift card refund split', () => {
    it('returns the gift card share proportionally and settles rounding on the last refund', () => {
        expect(giftCardRefundSplit(fresh, 10000)).toEqual({ giftCard: 6000, money: 4000 });
        const after = { ...fresh, refunded_money: '40.00', refunded_to_gift_cards: '60.00', refundable_money: '12.00', refundable_to_gift_cards: '18.00' };
        expect(giftCardRefundSplit(after, 3000)).toEqual({ giftCard: 1800, money: 1200 });
        expect(giftCardRefundSplit(fresh, 1)).toEqual({ giftCard: 0, money: 1 });
    });

    it('never refunds money that was not collected, and never more money than is left', () => {
        const uncollected = { ...fresh, payment_collected: false, refundable_money: '0.00' };
        expect(refundValueAvailable(uncollected)).toBe(true);
        expect(giftCardRefundSplit(uncollected, 13000)).toEqual({ giftCard: 7800, money: 0 });
        expect(giftCardRefundSplit(uncollected, 7800)).toEqual({ giftCard: 7800, money: 0 });
        const cardsBackAfterCancel = { ...fresh, refunded_to_gift_cards: '78.00', refundable_to_gift_cards: '0.00' };
        expect(giftCardRefundSplit(cardsBackAfterCancel, 5200)).toEqual({ giftCard: 0, money: 5200 });
        expect(refundValueAvailable({ ...cardsBackAfterCancel, payment_collected: false })).toBe(false);
    });

    it('keeps orders without gift cards all money', () => {
        const plain = { grand_total: '250.00', gift_card_total: '0.00', payment_collected: true, refunded_money: '0.00', refunded_to_gift_cards: '0.00', refundable_money: '250.00', refundable_to_gift_cards: '0.00' };
        expect(giftCardRefundSplit(plain, 5000)).toEqual({ giftCard: 0, money: 5000 });
    });
});
