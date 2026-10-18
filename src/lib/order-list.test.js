// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import StoreOrdersPage from '../pages/StoreOrdersPage';
import api from '../api/client';

vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn() } }));
vi.mock('../hooks/useStoreScope', () => ({ default: () => ({ apiBase: '/my-store', uiBase: '/store' }) }));
vi.mock('../hooks/useDebounced', () => ({ useDebounced: value => value }));
vi.mock('react-router-dom', async () => ({ ...await vi.importActual('react-router-dom'), useOutletContext: () => ({ permissions: ['store.orders.manage'] }) }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ i18n: { language: 'en' } }) }));
vi.mock('../components/workspace/useWorkspaceAppearance', () => ({ default: () => ({ theme: 'light' }) }));
vi.mock('../components/store/orders/OrderExportDialog', () => ({ default: () => null }));
vi.mock('../components/store/orders/OrderProductFilter', () => ({ default: () => null }));

const fixture = { id: 7, status: 'processing', grand_total: '20.00', customer: { name: 'Synthetic customer' }, review: { classification: null, version: 3 } };
let host; let root;
const button = text => [...document.querySelectorAll('button')].find(e => e.textContent.trim() === text);
async function click(element) { await act(async () => element.click()); }
beforeEach(() => {
    vi.clearAllMocks(); globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
    api.get.mockResolvedValue({ data: { data: [fixture], meta: { total: 1, last_page: 1 } } });
    api.post.mockResolvedValue({ data: { updated: 1, skipped: 0, unchanged: 0 } });
    host = document.createElement('div'); document.body.append(host); root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.unstubAllGlobals(); });
async function render() { await act(async () => root.render(createElement(MemoryRouter, null, createElement(StoreOrdersPage)))); }

describe('merchant order list lifecycle and review actions', () => {
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
