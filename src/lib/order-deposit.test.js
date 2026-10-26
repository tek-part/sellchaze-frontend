import { describe, expect, it } from 'vitest';
import { depositSettingsPayload, orderDeposit, paymentMethodChangeable, paymentSplit, remainderCollectionRequest, safeHttpUrl, transferTargetsPayload } from './order-deposit';

const deposit = { amount: '24.00', remaining: '96.00', paid: true, remainder_collected: false };
const order = { status: 'shipped', payment_status: 'deposit_paid', payment_method: 'paymob', currency: 'egp', grand_total: '120.00', amount_due: '96.00', deposit };

describe('deposit orders', () => {
    it('reads only a real deposit', () => {
        expect(orderDeposit(order)).toBe(deposit);
        expect(orderDeposit({ deposit: null })).toBeNull();
        expect(orderDeposit({})).toBeNull();
        expect(orderDeposit({ deposit: { amount: 'x' } })).toBeNull();
    });
    it('splits what was paid and what is due on delivery', () => {
        expect(paymentSplit(order)).toEqual({ kind: 'deposit_paid', paid: '24.00', remaining: '96.00' });
        expect(paymentSplit({ ...order, payment_status: 'pending', deposit: { ...deposit, paid: false } })).toEqual({ kind: 'deposit_due', paid: '0.00', due: '24.00', remaining: '96.00' });
        expect(paymentSplit({ ...order, deposit: null, payment_method: 'cod', payment_status: 'pending', amount_due: '120.00' })).toEqual({ kind: 'cod', paid: '0.00', remaining: '120.00' });
        expect(paymentSplit({ ...order, deposit: { ...deposit, remainder_collected: true }, payment_status: 'paid' })).toEqual({ kind: 'paid', paid: '120.00', remaining: '0.00' });
        expect(paymentSplit({ ...order, deposit: null, payment_status: 'paid' }).kind).toBe('paid');
        // A refund recorded from the deposit does not make the order paid: the remainder is still due on delivery.
        for (const payment_status of ['partially_refunded', 'refunded']) expect(paymentSplit({ ...order, payment_status })).toEqual({ kind: 'deposit_paid', paid: '24.00', remaining: '96.00' });
    });
    it('records the exact remaining amount once, with a reference and acknowledgement', () => {
        expect(remainderCollectionRequest(order, ' CASH-1 ', '96', true, ' ok ')).toEqual({ reference: 'CASH-1', amount: '96.00', currency: 'EGP', collected: true, note: 'ok' });
        for (const amount of ['95.99', '120', '96.001', '']) expect(remainderCollectionRequest(order, 'REF', amount, true)).toBeNull();
        expect(remainderCollectionRequest(order, 'REF', '96', false)).toBeNull();
        expect(remainderCollectionRequest(order, ' ', '96', true)).toBeNull();
        expect(remainderCollectionRequest({ ...order, payment_status: 'refunded' }, 'REF', '96', true)?.amount).toBe('96.00');
        for (const change of [{ status: 'cancelled' }, { payment_status: 'paid' }, { deposit: { ...deposit, paid: false } }, { deposit: { ...deposit, remainder_collected: true } }, { deposit: null }]) {
            expect(remainderCollectionRequest({ ...order, ...change }, 'REF', '96', true)).toBeNull();
        }
    });
    it('offers a method change only while nothing was paid', () => {
        expect(paymentMethodChangeable({ status: 'pending', payment_status: 'failed' })).toBe(true);
        expect(paymentMethodChangeable({ status: 'confirmed', payment_status: 'pending', deposit: { ...deposit, paid: false } })).toBe(true);
        for (const change of [{ status: 'shipped' }, { payment_status: 'paid' }, { payment_status: 'deposit_paid' }, { archived_at: '2026-10-26' }]) {
            expect(paymentMethodChangeable({ status: 'pending', payment_status: 'pending', ...change })).toBe(false);
        }
    });
});

describe('deposit settings', () => {
    const draft = { enabled: true, percentage: '20', minimum: '0', scope: 'all', confirm_after_payment: true, version: 3 };
    it('normalizes a valid configuration', () => {
        expect(depositSettingsPayload(draft)).toEqual({ payload: { enabled: true, percentage: '20.00', minimum: '0.00', scope: 'all', confirm_after_payment: true, version: 3 } });
        expect(depositSettingsPayload({ ...draft, enabled: false, percentage: '0' }).payload.enabled).toBe(false);
    });
    it('rejects an empty or out-of-range deposit', () => {
        expect(depositSettingsPayload({ ...draft, percentage: '0', minimum: '0' }).error).toBe('empty');
        expect(depositSettingsPayload({ ...draft, percentage: '101' }).error).toBe('percentage');
        expect(depositSettingsPayload({ ...draft, percentage: '-1' }).error).toBe('percentage');
        expect(depositSettingsPayload({ ...draft, minimum: '1e3' }).error).toBe('minimum');
        expect(depositSettingsPayload({ ...draft, scope: 'some' }).error).toBe('scope');
    });
});

describe('transfer targets', () => {
    it('links only to http(s) URLs', () => {
        expect(safeHttpUrl('https://ipn.eg/S/shop')).toBe('https://ipn.eg/S/shop');
        for (const value of ['javascript:alert(1)', 'data:text/html,x', '/relative', 'ftp://x.test', '', null, 'http://']) expect(safeHttpUrl(value)).toBeNull();
    });
    it('keeps complete rows, at most two', () => {
        expect(transferTargetsPayload([{ label: ' InstaPay ', number: ' shop@instapay ', link: 'https://ipn.eg/x' }, { label: '', number: '', link: '' }]))
            .toEqual({ targets: [{ label: 'InstaPay', number: 'shop@instapay', link: 'https://ipn.eg/x' }] });
        expect(transferTargetsPayload([{ label: 'Wallet', number: '' }]).error).toBe('incomplete');
        expect(transferTargetsPayload([{ label: 'Wallet', number: '010', link: 'javascript:alert(1)' }]).error).toBe('link');
        expect(transferTargetsPayload([1, 2, 3].map((n) => ({ label: `L${n}`, number: `${n}` }))).error).toBe('limit');
    });
});
