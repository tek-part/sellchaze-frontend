// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import StorePaymentsPage from '../pages/StorePaymentsPage';
import PaymentMethodLogo from '../shared/payments/PaymentMethodLogo';
import api from '../api/client';

const state = vi.hoisted(() => ({ access: { canStoreSettings: true }, language: 'en', apiBase: '/my-store' }));
vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn() } }));
vi.mock('../hooks/useStoreContext', () => ({ default: () => ({ apiBase: state.apiBase, uiBase: '/store', access: state.access }) }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ i18n: { language: state.language }, t: (key, fallback) => typeof fallback === 'string' ? fallback : key }) }));
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
    state.access = { canStoreSettings: true }; state.language = 'en'; state.apiBase = '/my-store';
    host = document.createElement('div'); document.body.append(host); root = createRoot(host);
    api.get.mockResolvedValue({ data: { data: fixture() } });
    api.post.mockResolvedValue({ data: { data: fixture() } });
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.unstubAllGlobals(); });
const button = (scope, name) => [...scope.querySelectorAll('button')].find(el => el.textContent.trim() === name);
const card = slug => [...host.querySelectorAll('.ws-payment-card')].find(el => el.querySelector('h2').textContent === slug);
async function mount() { await act(async () => root.render(<MemoryRouter><StorePaymentsPage /></MemoryRouter>)); }
async function click(el) { await act(async () => el.click()); }
async function input(el, value) {
    await act(async () => {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, value);
        el.dispatchEvent(new Event('input', { bubbles: true }));
    });
}
const deemaFixture = (configured = false, testMode = true) => [
    { slug: 'tap', name: 'Tap', enabled: false, configured: true, test_mode: testMode, credential_fields: ['secret_key'], credentials: { secret_key: '********' } },
    { slug: 'deema', name: 'Deema', enabled: false, configured, test_mode: testMode, credential_fields: [], credentials: [], connection_gateway: 'tap', inherits_environment: true, supported_currencies: ['KWD'], amount_limits: { currency: 'KWD', minimum: testMode ? '100.000' : '10.000', maximum: testMode ? '200.000' : null } },
];

describe('payment methods', () => {
    it('loads a saved percentage discount, preserves it on save, and can disable it explicitly', async () => {
        const rows = fixture();
        rows[1].price_adjustment = { enabled: true, type: 'percentage', direction: 'subtract', value: '12.50' };
        api.get.mockResolvedValue({ data: { data: rows } });
        api.post.mockResolvedValue({ data: { data: rows } });
        await mount(); await click(button(card('Stripe'), 'Edit'));
        const form = document.querySelector('[role="dialog"] form');
        expect(form.querySelector('#payment-adjustment-type').value).toBe('percentage');
        expect(form.querySelector('#payment-adjustment-direction').value).toBe('subtract');
        expect(form.querySelector('#payment-adjustment-value').value).toBe('12.50');
        expect(form.querySelector('#payment-adjustment-value').step).toBe('any');
        await act(async () => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
        expect(api.post.mock.calls[0][1].gateways[0].presentation.price_adjustment).toEqual(rows[1].price_adjustment);
        api.get.mockResolvedValue({ data: { data: rows } });
        api.post.mockResolvedValue({ data: { data: rows } });
        await click(button(card('Stripe'), 'Edit'));
        await click(document.querySelector('.ws-payment-price-adjustment input[type="checkbox"]'));
        const next = document.querySelector('[role="dialog"] form');
        expect(next.querySelector('#payment-adjustment-value').value).toBe('12.50');
        expect(next.querySelector('#payment-adjustment-value').required).toBe(false);
        await act(async () => next.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
        expect(api.post.mock.calls[1][1].gateways[0].presentation.price_adjustment.enabled).toBe(false);
    });
    it('renders provider marks and distinct edit/activation controls without writing on load', async () => {
        await mount(); expect(host.querySelectorAll('.ws-payment-card')).toHaveLength(3);
        expect(card('Stripe').querySelector('img').getAttribute('src')).toBe('/payments/stripe.png');
        expect(button(card('Taager'), 'Activate payment method').disabled).toBe(true);
        expect(api.post).not.toHaveBeenCalled();
    });
    it('opens an accessible editor, keeps saved secrets blank, and cancels without writes', async () => {
        await mount(); await click(button(card('Stripe'), 'Edit'));
        const dialog = document.querySelector('[role="dialog"]');
        expect(dialog).not.toBeNull(); expect(dialog.querySelector('#payment-secret_key').value).toBe('');
        expect(dialog.textContent).toContain('Saved — leave blank');
        await click(button(dialog, 'Cancel')); expect(document.querySelector('[role="dialog"]')).toBeNull(); expect(api.post).not.toHaveBeenCalled();
    });
    it('saves only the chosen method and never sends a masked secret back', async () => {
        await mount(); await click(button(card('Stripe'), 'Edit'));
        const form = document.querySelector('[role="dialog"] form');
        await act(async () => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
        expect(api.post).toHaveBeenCalledTimes(1);
        const [url, payload] = api.post.mock.calls[0]; expect(url).toBe('/my-store/payments');
        expect(payload.gateways).toHaveLength(1); expect(payload.gateways[0].slug).toBe('stripe'); expect(payload.gateways[0].credentials).toEqual({});
    });
    it('sends newly entered credentials through POST while retaining the merchant endpoint', async () => {
        state.apiBase = '/stores/14';
        await mount(); await click(button(card('Stripe'), 'Edit'));
        await input(document.querySelector('#payment-secret_key'), 'sk_test_fixture');
        await act(async () => document.querySelector('[role="dialog"] form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
        expect(api.post).toHaveBeenCalledWith('/stores/14/payments', expect.objectContaining({ gateways: [expect.objectContaining({ slug: 'stripe', credentials: { secret_key: 'sk_test_fixture' } })] }));
    });
    it.each(['en', 'ar'])('explains inherited Deema test settings and prevents unsupported activation in %s', async language => {
        state.language = language;
        api.get.mockResolvedValue({ data: { data: deemaFixture() } });
        await mount();
        const deema = card('Deema');
        expect(deema.textContent).toContain('KWD'); expect(deema.textContent).toContain('100.000'); expect(deema.textContent).toContain('200.000');
        expect(button(deema, language === 'ar' ? 'تفعيل طريقة الدفع' : 'Activate payment method').disabled).toBe(true);
        await click(button(deema, language === 'ar' ? 'تعديل' : 'Edit'));
        const dialog = document.querySelector('[role="dialog"]');
        expect(dialog.querySelectorAll('[role="switch"]')).toHaveLength(1);
        expect(dialog.querySelector('[role="switch"]').disabled).toBe(true);
        expect(dialog.querySelector('#payment-secret_key')).toBeNull();
        await click(button(dialog, language === 'ar' ? 'تعديل إعدادات Tap' : 'Edit Tap settings'));
        expect(document.querySelector('[role="dialog"] h2').textContent).toContain('Tap');
        expect(document.querySelector('#payment-secret_key').value).toBe('');
        expect(api.post).not.toHaveBeenCalled();
    });
    it('saves eligible live Deema presentation without an independent environment or credentials', async () => {
        const rows = deemaFixture(true, false);
        api.get.mockResolvedValue({ data: { data: rows } }); api.post.mockResolvedValue({ data: { data: rows } });
        await mount(); await click(button(card('Deema'), 'Edit'));
        expect(document.querySelector('[role="dialog"]').textContent).toContain('Live mode');
        expect(document.querySelector('[role="dialog"]').textContent).not.toContain('200.000');
        await input(document.querySelector('#payment-name'), 'Pay with Deema');
        await click(document.querySelector('[role="dialog"] [role="switch"]'));
        await act(async () => document.querySelector('[role="dialog"] form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
        const gateway = api.post.mock.calls[0][1].gateways[0];
        expect(gateway).toMatchObject({ slug: 'deema', enabled: true, credentials: {}, presentation: { name: 'Pay with Deema' } });
        expect(gateway).not.toHaveProperty('test_mode');
    });
    it('renders a plain Deema name when no verified logo exists or a custom image fails', async () => {
        await act(async () => root.render(<PaymentMethodLogo slug="deema" />));
        expect(host.textContent).toBe('Deema'); expect(host.querySelector('img')).toBeNull();
        await act(async () => root.render(<PaymentMethodLogo slug="deema" src="/missing.svg" />));
        await act(async () => host.querySelector('img').dispatchEvent(new Event('error')));
        expect(host.textContent).toBe('Deema');
    });
    it('uses a decorative safe fallback for a missing logo and recovers after provider changes', async () => {
        await act(async () => root.render(<PaymentMethodLogo slug="unknown" />)); expect(host.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
        await act(async () => root.render(<PaymentMethodLogo slug="fawaterk" />)); expect(host.querySelector('img').getAttribute('src')).toBe('/payments/fawaterak.webp');
        await act(async () => host.querySelector('img').dispatchEvent(new Event('error'))); expect(host.querySelector('img')).toBeNull();
        await act(async () => root.render(<PaymentMethodLogo slug="paypal" />)); expect(host.querySelector('img').getAttribute('src')).toBe('/payments/paypal.png');
    });
});
