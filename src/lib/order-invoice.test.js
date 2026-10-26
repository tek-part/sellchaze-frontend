import { describe, expect, it } from 'vitest';
import { invoiceAddress, invoiceCollect, invoicePaymentLine } from './order-invoice';

const order = { currency: 'EGP', grand_total: '120.00', amount_due: '120.00', payment_method: 'cod', payment_status: 'pending', customer: { phone: '01000000000' },
    shipping_address: { line1: '12 Nile St', line2: 'Floor 3', city: 'Nasr City', region: 'Cairo', country: 'EG', phone_alt: '01200000000' } };

describe('printable invoice', () => {
    it('separates governorate, area, street and both phones', () => {
        expect(invoiceAddress(order)).toEqual({ governorate: 'Cairo', area: 'Nasr City', street: '12 Nile St، Floor 3', phones: ['01000000000', '01200000000'], country: 'EG' });
        expect(invoiceAddress({ ...order, shipping_address: { governorate_name: 'Giza', area_name: 'Dokki', city: 'Giza' } }).area).toBe('Dokki');
        expect(invoiceAddress({ customer: { phone: '010' }, shipping_address: { phone_alt: '010' } }).phones).toEqual(['010']);
        expect(invoiceAddress({}).phones).toEqual([]);
    });
    it('prints cash on delivery or what was paid and what is left', () => {
        expect(invoicePaymentLine(order, false)).toBe('Cash on delivery · Collect EGP 120.00');
        expect(invoiceCollect(order)).toBe('120.00');
        const deposit = { ...order, payment_method: 'paymob', payment_status: 'deposit_paid', amount_due: '96.00', deposit: { amount: '24.00', remaining: '96.00', paid: true, remainder_collected: false } };
        expect(invoicePaymentLine(deposit, false)).toBe('Paid EGP 24.00 · Remaining on delivery EGP 96.00');
        expect(invoicePaymentLine(deposit, true)).toBe('مدفوع EGP 24.00 · المتبقي عند الاستلام EGP 96.00');
        expect(invoiceCollect(deposit)).toBe('96.00');
        // After part of the deposit was refunded the courier still collects the remainder.
        expect(invoicePaymentLine({ ...deposit, payment_status: 'partially_refunded' }, false)).toBe('Paid EGP 24.00 · Remaining on delivery EGP 96.00');
        expect(invoiceCollect({ ...deposit, payment_status: 'partially_refunded' })).toBe('96.00');
        expect(invoiceCollect({ ...deposit, payment_status: 'paid', deposit: { ...deposit.deposit, remainder_collected: true } })).toBe('0.00');
        expect(invoicePaymentLine({ ...deposit, payment_status: 'pending', deposit: { ...deposit.deposit, paid: false } }, false)).toBe('Deposit due EGP 24.00 · Remaining on delivery EGP 96.00');
        expect(invoicePaymentLine({ ...order, payment_status: 'paid' }, false)).toBe('Paid in full');
        expect(invoiceCollect({ ...order, payment_status: 'paid' })).toBe('0.00');
    });
});
