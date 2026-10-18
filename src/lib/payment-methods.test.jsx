// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import StorePaymentsPage from '../pages/StorePaymentsPage';
import PaymentMethodLogo from '../shared/payments/PaymentMethodLogo';
import api from '../api/client';

const state = vi.hoisted(() => ({ access: { canStoreSettings: true } }));
vi.mock('../api/client', () => ({ default: { get: vi.fn(), put: vi.fn() } }));
vi.mock('../hooks/useStoreContext', () => ({ default: () => ({ apiBase: '/my-store', uiBase: '/store', access: state.access }) }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ i18n: { language: 'en' }, t: (key, fallback) => typeof fallback === 'string' ? fallback : key }) }));
vi.mock('../components/ui/notify', () => ({ notify: { success: vi.fn(), error: vi.fn() } }));
vi.mock('../components/store/StoreMediaPicker', () => ({ default: () => <div>Media picker</div> }));
let root, host;
const fixture = () => [
    { slug: 'cod', name: 'Cash on delivery', enabled: true, configured: true, credential_fields: [], credentials: {} },
    { slug: 'stripe', name: 'Stripe', enabled: false, configured: true, test_mode: true, credential_fields: ['secret_key'], credentials: { secret_key: '********' } },
    { slug: 'taager', name: 'Taager', enabled: false, available: false, credential_fields: ['api_key'], credentials: {} },
];
beforeEach(() => {
    vi.clearAllMocks(); globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
    state.access = { canStoreSettings: true };
    host = document.createElement('div'); document.body.append(host); root = createRoot(host);
    api.get.mockResolvedValue({ data: { data: fixture() } });
    api.put.mockResolvedValue({ data: { data: fixture() } });
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.unstubAllGlobals(); });
const button = (scope, name) => [...scope.querySelectorAll('button')].find(el => el.textContent.trim() === name);
const card = slug => [...host.querySelectorAll('.ws-payment-card')].find(el => el.querySelector('h2').textContent === slug);
async function mount() { await act(async () => root.render(<MemoryRouter><StorePaymentsPage /></MemoryRouter>)); }
async function click(el) { await act(async () => el.click()); }

describe('payment methods', () => {
    it('loads a saved percentage discount, preserves it on save, and can disable it explicitly', async () => {
        const rows = fixture();
        rows[1].price_adjustment = { enabled: true, type: 'percentage', direction: 'subtract', value: '12.50' };
        api.get.mockResolvedValue({ data: { data: rows } });
        api.put.mockResolvedValue({ data: { data: rows } });
        await mount(); await click(button(card('Stripe'), 'Edit'));
        const form = document.querySelector('[role="dialog"] form');
        expect(form.querySelector('#payment-adjustment-type').value).toBe('percentage');
        expect(form.querySelector('#payment-adjustment-direction').value).toBe('subtract');
        expect(form.querySelector('#payment-adjustment-value').value).toBe('12.50');
        expect(form.querySelector('#payment-adjustment-value').step).toBe('any');
        await act(async () => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
        expect(api.put.mock.calls[0][1].gateways[0].presentation.price_adjustment).toEqual(rows[1].price_adjustment);
        api.get.mockResolvedValue({ data: { data: rows } });
        api.put.mockResolvedValue({ data: { data: rows } });
        await click(button(card('Stripe'), 'Edit'));
        await click(document.querySelector('.ws-payment-price-adjustment [role="switch"]'));
        const next = document.querySelector('[role="dialog"] form');
        expect(next.querySelector('#payment-adjustment-value').value).toBe('12.50');
        expect(next.querySelector('#payment-adjustment-value').required).toBe(false);
        await act(async () => next.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
        expect(api.put.mock.calls[1][1].gateways[0].presentation.price_adjustment.enabled).toBe(false);
    });
    it('renders provider marks and distinct edit/activation controls without writing on load', async () => {
        await mount(); expect(host.querySelectorAll('.ws-payment-card')).toHaveLength(3);
        expect(card('Stripe').querySelector('img').getAttribute('src')).toBe('/payments/stripe.png');
        expect(button(card('Taager'), 'Activate payment method').disabled).toBe(true);
        expect(api.put).not.toHaveBeenCalled();
    });
    it('opens an accessible editor, keeps saved secrets blank, and cancels without writes', async () => {
        await mount(); await click(button(card('Stripe'), 'Edit'));
        const dialog = document.querySelector('[role="dialog"]');
        expect(dialog).not.toBeNull(); expect(dialog.querySelector('#payment-secret_key').value).toBe('');
        expect(dialog.textContent).toContain('Saved — leave blank');
        await click(button(dialog, 'Cancel')); expect(document.querySelector('[role="dialog"]')).toBeNull(); expect(api.put).not.toHaveBeenCalled();
    });
    it('saves only the chosen method and never sends a masked secret back', async () => {
        await mount(); await click(button(card('Stripe'), 'Edit'));
        const form = document.querySelector('[role="dialog"] form');
        await act(async () => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
        expect(api.put).toHaveBeenCalledTimes(1);
        const [url, payload] = api.put.mock.calls[0]; expect(url).toBe('/my-store/payments');
        expect(payload.gateways).toHaveLength(1); expect(payload.gateways[0].slug).toBe('stripe'); expect(payload.gateways[0].credentials).toEqual({});
    });
    it('uses a decorative safe fallback for a missing logo and recovers after provider changes', async () => {
        await act(async () => root.render(<PaymentMethodLogo slug="unknown" />)); expect(host.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
        await act(async () => root.render(<PaymentMethodLogo slug="fawaterk" />)); expect(host.querySelector('img').getAttribute('src')).toBe('/payments/fawaterak.webp');
        await act(async () => host.querySelector('img').dispatchEvent(new Event('error'))); expect(host.querySelector('img')).toBeNull();
        await act(async () => root.render(<PaymentMethodLogo slug="paypal" />)); expect(host.querySelector('img').getAttribute('src')).toBe('/payments/paypal.png');
    });
});
