import { describe, expect, it } from 'vitest';
import { fromCents, lineRefundCents, paymentStatusLabel, refundTotals, toCents } from '../components/store/orders/order-refunds';

// Shapes mirror GET /orders/{order}/refunds; the dialog total must match what the server records.
const summary = {
    payment_collected: true, refundable_total: '210.00', shipping: { refundable: '30.00' },
    items: [
        { store_order_item_id: 1, quantity: 3, refundable_quantity: 3, allocated_amount: '100.00', refundable_amount: '100.00' },
        { store_order_item_id: 2, quantity: 1, refundable_quantity: 1, allocated_amount: '80.00', refundable_amount: '80.00' },
    ],
};

describe('refund amounts', () => {
    it('floors partial units and gives the exact remainder to the last units', () => {
        expect(lineRefundCents(summary.items[0], 1)).toBe(3333);
        expect(lineRefundCents(summary.items[0], 2)).toBe(6666);
        expect(lineRefundCents(summary.items[0], 3)).toBe(10000);
        expect(lineRefundCents(summary.items[0], 9)).toBe(10000);
        expect(lineRefundCents({ ...summary.items[0], refundable_quantity: 1, refundable_amount: '33.34' }, 1)).toBe(3334);
    });
    it('adds shipping, caps at what is refundable and is zero when nothing was collected', () => {
        expect(refundTotals(summary, { 1: 1, 2: 1 }, '30')).toEqual({ items: 11333, shipping: 3000, computed: 14333, max: 14333 });
        expect(refundTotals(summary, { 1: 3, 2: 1 }, '99').shipping).toBe(3000);
        expect(refundTotals({ ...summary, refundable_total: '50.00' }, { 2: 1 }, '').max).toBe(5000);
        expect(refundTotals({ ...summary, payment_collected: false }, { 1: 3 }, '10').max).toBe(0);
    });
    it('round-trips money and labels the refund payment states', () => {
        expect(toCents('19.99')).toBe(1999); expect(fromCents(1234)).toBe('12.34'); expect(fromCents(-5)).toBe('0.00');
        expect(paymentStatusLabel('partially_refunded', false)).toBe('Partially refunded');
        expect(paymentStatusLabel('refunded', true)).toBe('مسترد');
    });
    it('values a refund when only gift card value is left on an order whose money was never collected', () => {
        const giftOnly = { ...summary, payment_collected: false, refundable_total: '78.00', refundable_to_gift_cards: '78.00', refundable_money: '0.00' };
        expect(refundTotals(giftOnly, { 1: 3 }, '10')).toMatchObject({ items: 10000, shipping: 1000, computed: 11000, max: 7800 });
        expect(refundTotals({ ...giftOnly, refundable_total: '1.00' }, { 1: 3 }, '10').max).toBe(100);
    });
});
