// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import StoreMissedOrdersPage from '../pages/StoreMissedOrdersPage';
import api from '../api/client';

vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn() } }));
vi.mock('../hooks/useStoreScope', () => ({ default: () => ({ apiBase: '/my-store', uiBase: '/store' }) }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ i18n: { language: 'en' }, t: (key, fallback) => (typeof fallback === 'string' ? fallback : key) }) }));

let root, host;
const lead = { id: 1, customer_name: 'Ahmed', customer_phone: '1000000000', phone_dial: '+20', status: 'under_review', edit_version: 1, currency: 'EGP', subtotal: '250.00', source: 'store', last_activity_at: '2026-10-23T10:00:00Z', items: [] };
const response = { data: { data: [lead], counts: { under_review: 1, completed: 0 }, meta: { total: 1, last_page: 1 } } };

beforeEach(() => {
    vi.useFakeTimers(); vi.clearAllMocks(); globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    host = document.createElement('div'); document.body.append(host); root = createRoot(host);
    api.get.mockResolvedValue(response);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.useRealTimers(); });

describe('missed orders auto-refresh', () => {
    it('refreshes every 45 s in the background without showing the loading state', async () => {
        await act(async () => root.render(<MemoryRouter><StoreMissedOrdersPage /></MemoryRouter>));
        await act(async () => { await vi.advanceTimersByTimeAsync(400); });
        const panel = () => host.querySelector('[role="tabpanel"]');
        expect(panel().getAttribute('aria-busy')).toBe('false');
        expect(api.get).toHaveBeenCalledTimes(1);

        let resolveRefresh;
        api.get.mockImplementationOnce(() => new Promise((resolve) => { resolveRefresh = resolve; }));
        await act(async () => { await vi.advanceTimersByTimeAsync(45000); });
        expect(api.get).toHaveBeenCalledTimes(2);
        // While the background request is in flight the table stays as it was.
        expect(panel().getAttribute('aria-busy')).toBe('false');
        expect(host.querySelector('[role="status"]')).toBeNull();
        await act(async () => resolveRefresh(response));
        expect(panel().getAttribute('aria-busy')).toBe('false');
    });
});
