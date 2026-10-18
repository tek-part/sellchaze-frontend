// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import StoreOrdersPage from '../pages/StoreOrdersPage';
import api from '../api/client';
const scope = vi.hoisted(() => ({ meId: 1, storeId: 1 }));

vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn() } }));
vi.mock('../hooks/useStoreScope', () => ({ default: () => ({ apiBase: '/my-store', uiBase: '/store' }) }));
vi.mock('../hooks/useDebounced', () => ({ useDebounced: value => value }));
vi.mock('react-router-dom', async () => ({ ...await vi.importActual('react-router-dom'), useOutletContext: () => ({ permissions: ['store.orders.manage'], me: { id: scope.meId }, store: { id: scope.storeId } }) }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ i18n: { language: 'en' } }) }));
vi.mock('../components/workspace/useWorkspaceAppearance', () => ({ default: () => ({ theme: 'light' }) }));
vi.mock('../components/store/orders/OrderExportDialog', () => ({ default: () => null }));
vi.mock('../components/store/orders/OrderProductFilter', () => ({ default: () => null }));

const fixture = { id: 7, status: 'processing', grand_total: '20.00', customer: { name: 'Synthetic customer' }, review: { classification: null, version: 3 } };
let host; let root;
const button = text => [...document.querySelectorAll('button')].find(e => e.textContent.trim() === text);
async function click(element) { await act(async () => element.click()); }
beforeEach(() => {
    vi.clearAllMocks(); scope.meId = 1; scope.storeId = 1; globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
    api.get.mockResolvedValue({ data: { data: [fixture], meta: { total: 1, last_page: 1 } } });
    api.post.mockResolvedValue({ data: { updated: 1, skipped: 0, unchanged: 0 } });
    host = document.createElement('div'); document.body.append(host); root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.unstubAllGlobals(); });
async function render() { await act(async () => root.render(createElement(MemoryRouter, null, createElement(StoreOrdersPage)))); }

describe('merchant order list lifecycle and review actions', () => {
    it('clears old account rows and selection immediately while the same my-store endpoint loads another account', async () => {
        await render(); await click(host.querySelector('tbody input[type="checkbox"]')); await click(button('Update order status'));
        let finish; api.get.mockReturnValue(new Promise(resolve => { finish = resolve; }));
        scope.meId = 2; scope.storeId = 2; await render();
        expect(host.textContent).not.toContain('Synthetic customer');
        expect(host.querySelector('.ws-orders-selection')).toBeNull(); expect(document.querySelector('[role="dialog"]')).toBeNull();
        await act(async () => finish({ data: { data: [{ ...fixture, id: 8, customer: { name: 'Current account customer' } }], meta: { total: 1, last_page: 1 } } }));
        expect(host.textContent).toContain('Current account customer'); expect(host.textContent).not.toContain('Synthetic customer');
    });
    it('offers all16 observed bulk options and loads a payment review for payment choices', async () => {
        api.post.mockImplementation(path => Promise.resolve(path.endsWith('/bulk-payment-review') ? { data: { data: [{ id: 7, version: 'a'.repeat(64), state: 'unchanged', payment_method: 'cod', amount: '20.00', currency: 'USD' }] } } : { data: { updated: 0, skipped: 0, unchanged: 1 } }));
        await render(); await click(host.querySelector('tbody input[type="checkbox"]')); await click(button('Update order status'));
        const select = document.querySelector('[role="dialog"] select');
        expect([...select.options].filter(option => option.value).map(option => option.value)).toEqual(['pending', 'confirmed', 'pending_payment', 'paid', 'paid_failed', 'processing', 'waiting_for_pickup', 'shipped', 'delivered', 'cancelled', 'returning_from_delivery', 'request_refund', 'refund_in_progress', 'refunded', 'high_risk', 'moderate_risk']);
        await act(async () => { select.value = 'pending_payment'; select.dispatchEvent(new Event('change', { bubbles: true })); });
        expect(api.post).toHaveBeenCalledWith('/my-store/orders/bulk-payment-review', { ids: [7], target: 'pending' });
        expect(document.querySelector('[role="dialog"]').textContent).toContain('Payment is already recorded in this state.');
        expect(api.post.mock.calls.some(call => call[0].endsWith('/bulk-status'))).toBe(false);
    });
    it('warns only from an explicit unchecked snapshot, keeping unknown and passed orders unflagged in the same8 columns', async () => {
        api.get.mockResolvedValue({ data: { data: [
            { ...fixture, id: 1, bot_verified: false }, { ...fixture, id: 2, bot_verified: true },
            { ...fixture, id: 3, bot_verified: null }, { ...fixture, id: 4 },
        ], meta: { total: 4, last_page: 1 } } });
        await render();
        expect(host.querySelectorAll('thead th')).toHaveLength(8);
        const rows = host.querySelectorAll('tbody tr');
        expect(rows[0].cells[1].textContent).toContain('Bot check not performed');
        expect(rows[0].cells[1].querySelector('a').getAttribute('href')).toBe('/store/orders/1');
        expect([...rows].slice(1).every(row => !row.querySelector('.ws-order-bot-warning'))).toBe(true);
    });
    it('renders all17 tabs and8 real columns, and sends risk filters independently of fulfillment', async () => {
        await render();
        expect(host.querySelectorAll('[role="tab"]')).toHaveLength(17);
        expect(host.querySelectorAll('thead th')).toHaveLength(8);
        expect(host.querySelector('.ws-orders-selection')).toBeNull();
        await click(button('High Risk'));
        expect(api.get).toHaveBeenLastCalledWith('/my-store/orders', { params: { classification: 'high_risk', page: 1, per_page: 25, sort: 'created_at', dir: 'desc' } });
        await click(button('Waiting for pickup'));
        expect(api.get).toHaveBeenLastCalledWith('/my-store/orders', { params: { status: 'waiting_for_pickup', page: 1, per_page: 25, sort: 'created_at', dir: 'desc' } });
    });
    it('sends expected review version and eligible-only mode and reports actual updated and skipped counts', async () => {
        api.post.mockResolvedValue({ data: { updated: 0, skipped: 1, unchanged: 0 } });
        await render(); await click(host.querySelector('tbody input[type="checkbox"]'));
        await click(button('Update order status'));
        const select = document.querySelector('[role="dialog"] select');
        expect([...select.options].some(e => e.value === 'returning_from_delivery')).toBe(true);
        await act(async () => { select.value = 'high_risk'; select.dispatchEvent(new Event('change', { bubbles: true })); });
        expect(document.querySelector('[role="dialog"]').textContent).toContain('manual review classification');
        await click(button('Update'));
        expect(api.post).toHaveBeenCalledWith('/my-store/orders/bulk-status', { status: 'high_risk', eligible_only: true, orders: [{ id: 7, status: 'processing', review_version: 3 }] });
        expect(host.textContent).toContain('0 orders updated. Ineligible: 1, unchanged: 0.');
        expect(host.querySelector('.ws-orders-selection')).toBeNull();
    });
    it('keeps a failed update reviewable without pretending the selected orders changed', async () => {
        api.post.mockRejectedValue({ response: { data: { message: 'Review changed. Reload before updating it.' } } });
        await render(); await click(host.querySelector('tbody input[type="checkbox"]')); await click(button('Update order status'));
        const select = document.querySelector('[role="dialog"] select');
        await act(async () => { select.value = 'refunded'; select.dispatchEvent(new Event('change', { bubbles: true })); });
        expect(document.querySelector('[role="dialog"]').textContent).toContain('does not issue a payment refund');
        await click(button('Update'));
        expect(document.querySelector('[role="dialog"]')).not.toBeNull();
        expect(host.querySelector('tbody input').checked).toBe(true);
        expect(host.textContent).not.toContain('orders updated');
    });
});
