// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import StoreOrderEditModal from '../components/store/orders/StoreOrderEditModal';
import api from '../api/client';

vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn() } }));
vi.mock('../components/workspace/WorkspaceIcons', () => ({ HiOutlinePencil: () => null, HiOutlineTrash: () => null, HiOutlineXMark: () => null, HiOutlineChevronDown: () => null, HiOutlineChevronRight: () => null }));
vi.mock('../apps/storefront/foundation/components/PersonalizationSummary', () => ({ PersonalizationSummary: () => null }));
const data = name => ({ data: { id: 31, order_number: 'LOCAL-EDIT-TEST', customer: { name, phone: '+201000000007', email: 'fixture@example.test' }, shipping_address: { line1: 'Fixture address' }, currency: 'EGP', subtotal: '500.00', shipping_total: '25.00', discount_total: '0.00', tax_total: '0.00', grand_total: '525.00', manual_adjustment_total: '0.00', items: [{ id: 7, store_product_id: 2, name: 'Fixture product', unit_price: '250.00', quantity: 2, personalization: [] }] }, edit: { contact: true, financial: true, token: 'a'.repeat(64) }, pricing: { tax_enabled: false, tax_rate: '0', tax_prices_include: false } });
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
let root; let host; let onSaved;
const render = (base = '/my-store') => root.render(createElement(StoreOrderEditModal, { apiBase: base, orderId: 31, ar: false, theme: 'light', onClose: vi.fn(), onSaved }));
const submit = async () => { await act(async () => document.querySelector('.ws-order-edit-panel form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))); };
beforeEach(() => { vi.clearAllMocks(); globalThis.IS_REACT_ACT_ENVIRONMENT = true; vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} }); host = document.createElement('div'); document.body.append(host); root = createRoot(host); onSaved = vi.fn(); });
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.unstubAllGlobals(); });

describe('merchant edit modal request boundaries', () => {
    it('freezes an uncertain attempt and retries its exact payload and key after reconciliation finds no result', async () => {
        api.get.mockImplementation(url => url.endsWith('/edit') ? Promise.resolve({ data: data('Fixture customer') }) : Promise.reject({ response: { status: 404 } }));
        api.post.mockRejectedValueOnce(new Error('Lost response')).mockResolvedValueOnce({ data: data('Confirmed fixture') });
        await act(async () => render()); await submit();
        expect(document.querySelector('input[aria-label="Customer name"]').disabled).toBe(true);
        expect(document.body.textContent).toContain('Save confirmation was not received');
        await submit();
        expect(api.post.mock.calls[1][1]).toEqual(api.post.mock.calls[0][1]);
        expect(api.post.mock.calls[1][1].request_key).toBe(api.post.mock.calls[0][1].request_key);
        expect(onSaved).toHaveBeenCalledOnce(); expect(onSaved.mock.calls[0][0].customer.name).toBe('Confirmed fixture');
    });
    it('cannot replace the next store form with an older pending response', async () => {
        const old = deferred(); const current = deferred(); api.get.mockReturnValueOnce(old.promise).mockReturnValueOnce(current.promise);
        await act(async () => render()); await act(async () => render('/stores/2'));
        await act(async () => current.resolve({ data: data('Current store fixture') }));
        await act(async () => old.resolve({ data: data('Previous store fixture') }));
        expect(document.querySelector('input[aria-label="Customer name"]').value).toBe('Current store fixture');
    });
    it('disables financial controls while allowing a permitted contact correction', async () => {
        const state = data('Paid fixture'); state.edit.financial = false; state.edit.reason = 'payment_or_inventory_locked';
        api.get.mockResolvedValue({ data: state }); await act(async () => render());
        expect(document.querySelector('input[aria-label="Customer name"]').disabled).toBe(false);
        expect(document.querySelector('.ws-order-edit-shipping').disabled).toBe(true);
        expect([...document.querySelectorAll('.ws-order-edit-line input')].every(el => el.disabled)).toBe(true);
        expect([...document.querySelectorAll('button')].find(el => el.textContent === 'Save').disabled).toBe(false);
    });
});
