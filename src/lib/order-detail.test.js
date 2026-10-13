// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import StoreOrderDetailPage from '../pages/StoreOrderDetailPage';
import api from '../api/client';

const state = vi.hoisted(() => ({ orderId: '1', apiBase: '/my-store', permissions: ['store.orders.manage'], meId: 1, storeId: 1 }));
vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn() } }));
vi.mock('../hooks/useStoreScope', () => ({ default: () => ({ apiBase: state.apiBase, uiBase: '/store' }) }));
vi.mock('react-router-dom', async () => ({ ...await vi.importActual('react-router-dom'), useParams: () => ({ orderId: state.orderId }), useOutletContext: () => ({ permissions: state.permissions, me: { id: state.meId }, store: { id: state.storeId } }), useLocation: () => ({ state: null }) }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ i18n: { language: 'en' } }) }));
vi.mock('../components/workspace/useWorkspaceAppearance', () => ({ default: () => ({ theme: 'light' }) }));
vi.mock('../components/workspace/WorkspaceIcons', () => ({ HiOutlineArchiveBox: () => null, HiOutlineArrowPath: () => null, HiOutlinePrinter: () => null, HiOutlineXMark: () => null }));
vi.mock('../components/StatusBadge', () => ({ default: ({ label }) => createElement('span', null, label) }));
vi.mock('../components/store/StoreOrderShipment', () => ({ default: () => null }));
vi.mock('../components/store/StoreOrderCashPayment', () => ({ default: () => null }));
vi.mock('../components/store/StoreOrderDigitalEmail', () => ({ default: () => null }));
vi.mock('../components/store/StoreOrderDigitalDelivery', () => ({ default: () => null }));
vi.mock('../apps/storefront/foundation/components/PersonalizationSummary', () => ({ PersonalizationSummary: () => null }));
vi.mock('../apps/storefront/foundation/components/DigitalDeliverySummary', () => ({ DigitalDeliverySummary: () => null }));

const row = (id, name) => ({ id, order_number: `TEST-${id}`, status: 'pending', next_statuses: ['confirmed', 'cancelled'], currency: 'USD', subtotal: '25.00', grand_total: '25.00', payment_method: 'cod', payment_status: 'pending', customer: { name, phone: '+201000000009' }, items: [], timeline: [], review: { classification: null, version: 0 }, updated_at: '2026-10-13T12:00:00Z' });
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
let host; let root;
const render = () => root.render(createElement(MemoryRouter, null, createElement(StoreOrderDetailPage)));
const button = name => [...document.querySelectorAll('button')].find(el => el.textContent.trim() === name);
async function click(el) { await act(async () => el.click()); }

beforeEach(() => {
    vi.clearAllMocks(); state.orderId = '1'; state.apiBase = '/my-store'; state.permissions = ['store.orders.manage']; state.meId = 1; state.storeId = 1;
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
    host = document.createElement('div'); document.body.append(host); root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.unstubAllGlobals(); });

describe('merchant order detail asynchronous actions', () => {
    it('does not expose a previous store response when the selected order and store change', async () => {
        const old = deferred(); const current = deferred(); api.get.mockReturnValueOnce(old.promise).mockReturnValueOnce(current.promise);
        await act(async () => render());
        state.orderId = '2'; state.apiBase = '/stores/2'; await act(async () => render());
        await act(async () => current.resolve({ data: { data: row(2, 'Current fixture') } }));
        await act(async () => old.resolve({ data: { data: row(1, 'Previous fixture') } }));
        expect(host.textContent).toContain('Current fixture'); expect(host.textContent).not.toContain('Previous fixture');
        expect(api.get.mock.calls.map(call => call[0])).toEqual(['/my-store/orders/1/detail', '/stores/2/orders/2/detail']);
    });
    it('reuses one webhook request key after a lost response and does not pretend the request was delivered', async () => {
        api.get.mockResolvedValue({ data: { data: row(1, 'Fixture') } });
        api.post.mockRejectedValueOnce(new Error('Connection lost')).mockResolvedValueOnce({ data: { deliveries: 1 } });
        await act(async () => render()); await click(button('Resend webhook'));
        await act(async () => document.querySelector('[role="dialog"] form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
        expect(document.querySelector('[role="alert"]').textContent).toContain('Connection lost');
        await act(async () => document.querySelector('[role="dialog"] form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
        expect(api.post.mock.calls[0][1].request_key).toBe(api.post.mock.calls[1][1].request_key);
        expect(host.textContent).toContain('delivery request is queued'); expect(host.textContent).not.toContain('Connection lost');
    });
    it('keeps mutation and print controls unavailable to users without order management permission', async () => {
        state.permissions = []; api.get.mockResolvedValue({ data: { data: row(1, 'Read-only fixture') } });
        await act(async () => render()); expect(button('Resend webhook')).toBeUndefined(); expect(button('Classify order')).toBeUndefined();
        expect(api.get).toHaveBeenCalledWith('/my-store/orders/1'); expect(api.post).not.toHaveBeenCalled();
    });
    it('invalidates owner data when the account and resolved store change under the same my-store URL', async () => {
        const old = deferred(); const current = deferred(); api.get.mockReturnValueOnce(old.promise).mockReturnValueOnce(current.promise);
        await act(async () => render()); state.meId = 2; state.storeId = 2; await act(async () => render());
        await act(async () => current.resolve({ data: { data: row(1, 'Current account fixture') } }));
        await act(async () => old.resolve({ data: { data: row(1, 'Previous account fixture') } }));
        expect(host.textContent).toContain('Current account fixture'); expect(host.textContent).not.toContain('Previous account fixture');
        expect(api.get.mock.calls.map(call => call[0])).toEqual(['/my-store/orders/1/detail', '/my-store/orders/1/detail']);
    });

});
