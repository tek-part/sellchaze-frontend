// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import OrderBulkPaymentReview from '../components/store/orders/OrderBulkPaymentReview';
import api from '../api/client';

vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn() } }));
vi.mock('../shared/payments/PaymentMethodLogo', () => ({ default: ({ slug }) => createElement('span', null, slug) }));
const rows = [
    { id: 1, order_number: 'DEMO-CASH', state: 'eligible', payment_method: 'cod', amount: '20.00', currency: 'USD', version: 'a'.repeat(64) },
    { id: 2, order_number: 'DEMO-TRANSFER', state: 'eligible', payment_method: 'transfer_receipt', amount: '40.00', currency: 'EGP', version: 'b'.repeat(64), receipt: { id: 'proof-id', mime: 'application/pdf', reference: 'SYNTHETIC-RECEIPT' } },
    { id: 3, order_number: 'DEMO-ONLINE', state: 'skipped', reason: 'provider_controls', payment_method: 'stripe', amount: '20.00', currency: 'USD', version: 'c'.repeat(64) },
];
let host; let root; let props;
const button = label => [...host.querySelectorAll('button')].find(e => e.textContent.trim() === label);
async function click(element) { await act(async () => element.click()); }
async function type(element, value) {
    await act(async () => { Object.getOwnPropertyDescriptor(element.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, 'value').set.call(element, value); element.dispatchEvent(new Event('input', { bubbles: true })); });
}
async function render() { await act(async () => root.render(createElement(OrderBulkPaymentReview, props))); }
beforeEach(() => {
    vi.clearAllMocks(); globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    props = { ids: [1, 2, 3], target: 'paid', apiBase: '/my-store', uiBase: '/store', ar: false, onCancel: vi.fn(), onComplete: vi.fn(), onBusy: vi.fn() };
    api.post.mockImplementation(path => Promise.resolve(path.endsWith('/bulk-payment-review') ? { data: { data: rows } } : { data: { updated: 2, skipped: 1, unchanged: 0 } }));
    host = document.createElement('div'); document.body.append(host); root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('bulk manual payment review', () => {
    it('keeps an old order with no payment method reviewable as ineligible without inventing a provider', async () => {
        api.post.mockResolvedValue({ data: { data: [{ ...rows[2], payment_method: null }] } });
        await render(); expect(host.textContent).toContain('Unspecified method');
        expect(host.textContent).toContain('The payment method is not recorded. Review the order details.');
        expect(host.textContent).not.toContain('online payment provider'); expect(host.querySelector('fieldset input')).toBeNull();
    });
    it('requires per-order full collection acknowledgements and preserves the same request after an ambiguous response', async () => {
        let attempts = 0;
        api.post.mockImplementation(path => path.endsWith('/bulk-payment-review') ? Promise.resolve({ data: { data: rows } }) : ++attempts === 1 ? Promise.reject(new Error('Simulated response loss')) : Promise.resolve({ data: { updated: 2, skipped: 1, unchanged: 0 } }));
        await render();
        expect(button('Confirm payment update').disabled).toBe(true);
        expect(host.textContent).toContain('The online payment provider controls this transaction.');
        const groups = host.querySelectorAll('fieldset');
        for (const [index, group] of [...groups].slice(0, 2).entries()) {
            expect(group.querySelector('input[type=number]').value).toBe(rows[index].amount);
            await type(group.querySelector('input:not([type])'), `COLLECT-${index}`);
            await click(group.querySelector('input[type=checkbox]'));
        }
        await click(host.querySelector('form > .ws-bulk-payment-check input'));
        await click(button('Confirm payment update'));
        expect(host.textContent).toContain('Simulated response loss'); expect(props.onComplete).not.toHaveBeenCalled();
        await click(button('Confirm payment update'));
        const writes = api.post.mock.calls.filter(call => call[0].endsWith('/bulk-payment-status'));
        expect(writes).toHaveLength(2); expect(writes[0][1]).toEqual(writes[1][1]);
        expect(writes[0][1]).toMatchObject({ target: 'paid', confirmed: true, orders: [
            { id: 1, reference: 'COLLECT-0', amount: '20.00', currency: 'USD', acknowledged: true },
            { id: 2, reference: 'COLLECT-1', amount: '40.00', currency: 'EGP', acknowledged: true }, { id: 3 },
        ] });
        expect(writes[0][1].orders[2]).not.toHaveProperty('reference');
        expect(props.onComplete).toHaveBeenCalledWith({ updated: 2, skipped: 1, unchanged: 0 });
        expect(props.onBusy.mock.calls.flat()).toEqual([true, false, true, false]);
    });
    it('reloads stale evidence with a fresh review and resets confirmation before any new submission', async () => {
        api.post.mockImplementation(path => path.endsWith('/bulk-payment-review') ? Promise.resolve({ data: { data: [rows[0]] } }) : Promise.reject({ response: { status: 409, data: { message: 'Payment details changed. Reload the review before submitting it.' } } }));
        props.ids = [1]; await render(); await type(host.querySelector('input:not([type])'), 'CASH-1');
        await click(host.querySelector('fieldset input[type=checkbox]')); await click(host.querySelector('form > .ws-bulk-payment-check input')); await click(button('Confirm payment update'));
        expect(host.querySelector('[role=alert]').textContent).toContain('Payment details changed');
        api.post.mockResolvedValue({ data: { data: [{ ...rows[0], state: 'unchanged', version: 'd'.repeat(64) }] } });
        await click(button('Reload review'));
        expect(host.querySelector('fieldset input')).toBeNull(); expect(button('Confirm payment update').disabled).toBe(true);
        expect(api.post.mock.calls.filter(call => call[0].endsWith('/bulk-payment-status'))).toHaveLength(1);
    });
    it('records failed-payment reasons through the payment endpoint without collection inputs or a fulfillment update', async () => {
        props.target = 'failed'; props.ids = [1]; api.post.mockImplementation(path => Promise.resolve(path.endsWith('/bulk-payment-review') ? { data: { data: [rows[0]] } } : { data: { updated: 1, skipped: 0, unchanged: 0 } }));
        await render(); expect(host.querySelector('input[type=number]')).toBeNull();
        await type(host.querySelector('textarea'), 'Cash collection was unsuccessful'); await click(host.querySelector('form > .ws-bulk-payment-check input')); await click(button('Confirm payment update'));
        expect(api.post).toHaveBeenLastCalledWith('/my-store/orders/bulk-payment-status', expect.objectContaining({ target: 'failed', orders: [expect.objectContaining({ id: 1, note: 'Cash collection was unsuccessful', acknowledged: false })] }));
        expect(api.post.mock.calls.some(call => call[0].endsWith('/bulk-status'))).toBe(false);
    });
    it('downloads the reviewed receipt through its authenticated order route and never marks it accepted while viewing', async () => {
        await render(); const create = vi.fn(() => 'blob:synthetic'); const revoke = vi.fn();
        Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: create }); Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revoke });
        vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {}); api.get.mockResolvedValue({ data: new Blob(['synthetic'], { type: 'application/pdf' }) });
        await click(button('Download receipt for review'));
        expect(api.get).toHaveBeenCalledWith('/my-store/orders/2/payment/proofs/proof-id', { responseType: 'blob' });
        expect(api.post.mock.calls.every(call => call[0].endsWith('/bulk-payment-review'))).toBe(true); expect(create).toHaveBeenCalledOnce();
    });
    it('does not report an old account confirmation into a newly mounted account review', async () => {
        let finish; props.ids = [1];
        api.post.mockImplementation(path => path.endsWith('/bulk-payment-review') ? Promise.resolve({ data: { data: [rows[0]] } }) : new Promise(resolve => { finish = resolve; }));
        await render(); await type(host.querySelector('input:not([type])'), 'OLD-ACCOUNT');
        await click(host.querySelector('fieldset input[type=checkbox]')); await click(host.querySelector('form > .ws-bulk-payment-check input')); await click(button('Confirm payment update'));
        const oldComplete = props.onComplete; const oldBusy = props.onBusy;
        props = { ...props, onComplete: vi.fn(), onBusy: vi.fn() };
        await act(async () => root.render(createElement(OrderBulkPaymentReview, { ...props, key: 'different-account' })));
        await act(async () => finish({ data: { updated: 1, skipped: 0, unchanged: 0 } }));
        expect(oldComplete).not.toHaveBeenCalled(); expect(props.onComplete).not.toHaveBeenCalled();
        expect(oldBusy.mock.calls.flat()).toEqual([true]);
        expect(host.querySelector('input:not([type])').value).toBe(''); expect(button('Confirm payment update').disabled).toBe(true);
    });
});
