// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import StorePerformancePanel from '../components/dashboard/StorePerformancePanel';
import api from '../api/client';

vi.mock('../api/client', () => ({ default: { get: vi.fn() } }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ i18n: { language: 'en' } }) }));
vi.mock('../components/workspace/useWorkspaceAppearance', () => ({ default: () => ({ theme: 'light' }) }));
vi.mock('../components/dashboard/MetricDateRange', () => ({ default: ({ onApply }) => <button onClick={() => onApply({ from: '2026-10-01', to: '2026-10-02' })}>Change period</button> }));
vi.mock('react-chartjs-2', () => ({ Line: ({ data, ...props }) => <canvas role={props.role} aria-label={props['aria-label']} data-series={JSON.stringify(data.datasets[0].data)} /> }));

const fixture = () => ({
    currency: 'USD', summary: { total_sales: 1250.5, orders: 4, visits: 25, conversion_rate: 16, net_profit: null, average_order_value: 312.625, add_to_cart: 0, checkout_started: 10, cross_sell: 2, new_orders: 1, missed_orders: 3, conversion_with_missed_rate: 57.14 },
    daily: [{ date: '2026-10-01', visits: 5, orders: 1, sales: 250.5, average: 250.5, checkout_started: 2 }, { date: '2026-10-02', visits: 20, orders: 3, sales: 1000, average: 333.33, checkout_started: 8 }],
    funnel: { visits: 25, started: 10, purchased: 4, start_rate: 40, purchase_rate: 16, cross_sell_rate: 8 },
    low_stock: [{ product_id: 5, name: 'Almost sold out', available: 2 }], top_products: [{ product_id: 5, name: 'Best seller', quantity: 4, revenue: 1250.5 }],
    profit_complete: false, tracking_started_at: '2026-10-01', period: { timezone: 'Africa/Cairo' },
});
let root, host;
beforeEach(() => { vi.clearAllMocks(); globalThis.IS_REACT_ACT_ENVIRONMENT = true; host = document.createElement('div'); document.body.append(host); root = createRoot(host); api.get.mockResolvedValue({ data: { data: fixture() } }); });
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });
const card = key => host.querySelector(`[data-metric="${key}"]`);
async function mount(props = {}) { await act(async () => root.render(<MemoryRouter><StorePerformancePanel {...props} /></MemoryRouter>)); }

describe('merchant dashboard performance', () => {
    it('places actual sales, orders, visits and conversion before the eight secondary indicators', async () => {
        await mount();
        expect([...host.querySelectorAll('.ws-metrics-primary article')].map(el => el.dataset.metric)).toEqual(['total_sales', 'orders', 'visits', 'conversion_rate']);
        expect(host.querySelectorAll('.ws-metrics-additional article')).toHaveLength(8);
        expect(card('total_sales').textContent).toContain('1,250.5USD');
        expect(card('visits').textContent).toContain('25visit');
        expect(card('conversion_rate').textContent).toContain('16%');
        expect(card('visits').querySelector('.ws-metric-sparkline polyline')).not.toBeNull();
        expect(card('missed_orders').querySelector('a').getAttribute('href')).toBe('/store/missed-orders');
    });
    it('shows an em dash without a currency or quantity for zero and unavailable values', async () => {
        await mount();
        expect(card('net_profit').querySelector('.ws-metric-value').textContent).toBe('—');
        expect(card('add_to_cart').querySelector('.ws-metric-value').textContent).toBe('—');
        expect(host.textContent).toContain('Profit is unavailable');
    });
    it('uses real daily series and retains chart tables and product inventory data', async () => {
        await mount();
        expect([...host.querySelectorAll('.ws-metrics-charts h2')].map(el => el.textContent)).toEqual(['Total sales', 'Conversion rates', 'Total orders', 'Average order value', 'Total visits', 'Total checkout starts', 'Best selling products', 'Almost out of stock']);
        expect(host.querySelector('canvas[aria-label="Total sales"]').dataset.series).toBe('[250.5,1000]');
        expect(host.querySelector('canvas[aria-label="Total orders"]').dataset.series).toBe('[1,3]');
        expect(host.querySelector('.ws-metrics-data').textContent).toContain('2026-10-01');
        expect(host.querySelector('.ws-metrics-products').textContent).toContain('Best seller41,250.5 USD');
        expect(host.querySelector('.ws-metrics-products').textContent).toContain('Almost sold out2');
    });
    it('keeps restricted roles from linking to orders or inventory', async () => {
        await mount({ canOrders: false, canInventory: false });
        expect(host.querySelectorAll('a')).toHaveLength(0);
        expect(card('orders').textContent).toContain('4order');
    });
    it('retries a failed request and applies a new period using the same endpoint', async () => {
        api.get.mockRejectedValueOnce(new Error('Unavailable'));
        await mount(); expect(host.querySelector('[role="alert"]').textContent).toContain('could not be loaded');
        await act(async () => [...host.querySelectorAll('button')].find(el => el.textContent === 'Retry').click());
        expect(card('total_sales')).not.toBeNull();
        await act(async () => [...host.querySelectorAll('button')].find(el => el.textContent === 'Change period').click());
        expect(api.get).toHaveBeenLastCalledWith('/my-store/analytics/dashboard', { params: { from: '2026-10-01', to: '2026-10-02' } });
    });
    it('does not fabricate a trend or product rows when the period has no recorded data', async () => {
        const data = fixture(); data.daily = []; data.top_products = []; data.low_stock = []; data.summary.visits = null;
        api.get.mockResolvedValueOnce({ data: { data } }); await mount();
        expect(host.querySelectorAll('canvas')).toHaveLength(0);
        expect(card('visits').querySelector('polyline')).toBeNull();
        expect(host.querySelectorAll('.ws-metrics-products tbody tr')).toHaveLength(0);
        expect(host.querySelectorAll('.ws-metrics-products .ws-metrics-empty')).toHaveLength(2);
    });
});
