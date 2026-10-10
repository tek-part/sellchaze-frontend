import { describe, expect, it } from 'vitest';
import { cashCollectionRequest } from './cash-collection';

const order = { payment_method: 'cod', payment_status: 'pending', status: 'delivered', grand_total: '385.00', currency: 'EGP' };
describe('review of full cash collection', () => {
    it('captures the exact reviewed reference, amount and currency', () => {
        expect(cashCollectionRequest(order, ' LOCAL-CASH ', '0385', true, ' receipt checked ')).toEqual({ reference: 'LOCAL-CASH', amount: '385.00', currency: 'EGP', collected: true, note: 'receipt checked' });
        expect(cashCollectionRequest({ ...order, grand_total: '9999999999.99' }, 'REF', '9999999999.99', true)?.amount).toBe('9999999999.99');
    });
    it('requires full precise collection, explicit acknowledgement and a reference', () => {
        for (const amount of ['384.99', '385.01', '385.001', '3.85e2', '-385', '']) expect(cashCollectionRequest(order, 'REF', amount, true)).toBeNull();
        expect(cashCollectionRequest(order, 'REF', '385', false)).toBeNull();
        expect(cashCollectionRequest(order, '   ', '385', true)).toBeNull();
    });
    it('does not treat delivery, cancellation or another payment method as cash settlement', () => {
        for (const change of [{ payment_method: 'bank_transfer' }, { payment_status: 'paid' }, { status: 'cancelled' }, { currency: '' }]) {
            expect(cashCollectionRequest({ ...order, ...change }, 'REF', '385', true)).toBeNull();
        }
    });
});
