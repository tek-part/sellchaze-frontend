// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import StoreNotificationsPage from '../pages/store/settings/StoreNotificationsPage';
import StoreOrderNotifications from '../components/store/StoreOrderNotifications';
import api from '../api/client';

const state = vi.hoisted(() => ({ access: { canStoreSettings: true, canStoreOrders: true }, language: 'en' }));
vi.mock('../api/client', () => ({ default: { get: vi.fn(), put: vi.fn(), post: vi.fn() } }));
vi.mock('../hooks/useStoreContext', () => ({ default: () => ({ apiBase: '/my-store', uiBase: '/store', access: state.access }) }));
vi.mock('react-router-dom', async () => ({ ...await vi.importActual('react-router-dom'), useOutletContext: () => ({ access: state.access }) }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ i18n: { language: state.language }, t: (key, fallback) => typeof fallback === 'string' ? fallback : key }) }));

const customerEvent = (subject) => ({ email_enabled: true, email_subject: subject, email_body: 'Hi {customer_name}', whatsapp_enabled: false, whatsapp_body: 'Hi {customer_name}' });
const fixture = (overrides = {}) => ({
    data: {
        sender_name: 'Shop', reply_to: null, staff_recipients: ['ops@example.com'],
        events: { order_confirmation: customerEvent('Order {order_number}'), shipping_confirmation: customerEvent('Shipped {order_number}'), staff_new_order: { email_enabled: true, email_subject: 'New order {order_number}', email_body: '{items}' } },
    },
    catalog: [
        { key: 'order_confirmation', audience: 'customer', group: 'orders', channels: ['email', 'whatsapp'], label: { ar: 'تأكيد الطلب', en: 'Order confirmation' }, description: { ar: 'عند إنشاء الطلب', en: 'Sent when an order is placed' } },
        { key: 'shipping_confirmation', audience: 'customer', group: 'shipping', channels: ['email', 'whatsapp'], label: { ar: 'تأكيد الشحن', en: 'Shipping confirmation' }, description: { ar: '', en: '' } },
        { key: 'staff_new_order', audience: 'staff', group: 'orders', channels: ['email'], label: { ar: 'طلب جديد', en: 'New order' }, description: { ar: '', en: '' } },
    ],
    variables: ['customer_name', 'order_number', 'items'],
    connection: { whatsapp_connected: true, whatsapp_verified: false },
    owner_email: 'owner@example.com',
    ...overrides,
});
let root; let host;
const button = (name) => [...host.querySelectorAll('button')].find((el) => el.textContent.trim() === name || el.getAttribute('aria-label') === name);
const checkbox = (name) => host.querySelector(`input[aria-label="${name}"]`);
async function click(el) { await act(async () => el.click()); }
async function type(el, value) {
    const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value').set;
    await act(async () => { setter.call(el, value); el.dispatchEvent(new Event('input', { bubbles: true })); });
}
async function mount(element) { await act(async () => root.render(<MemoryRouter>{element}</MemoryRouter>)); }

beforeEach(() => {
    vi.clearAllMocks(); globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    state.access = { canStoreSettings: true, canStoreOrders: true }; state.language = 'en';
    host = document.createElement('div'); document.body.append(host); root = createRoot(host);
    api.get.mockResolvedValue({ data: fixture() });
    api.put.mockImplementation(async (_url, body) => ({ data: { ...fixture(), data: body.settings } }));
    api.post.mockImplementation(async (url, body) => url.endsWith('/preview')
        ? { data: body.channel === 'email' ? { subject: `Rendered ${body.template.subject}`, html: '<!doctype html><p>Hello</p>', text: 'Hello' } : { subject: '', html: '', text: `WA: ${body.template.body}` } }
        : { data: { status: 'sent' } });
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.useRealTimers(); });

describe('store notifications settings page', () => {
    it('renders catalog rows grouped as Orders, Shipping and Staff with WhatsApp locked until verified', async () => {
        await mount(<StoreNotificationsPage />);
        expect(api.get).toHaveBeenCalledWith('/my-store/notifications');
        expect([...host.querySelectorAll('section h2')].map((el) => el.textContent)).toEqual(['Sender', 'WhatsApp', 'Orders', 'Shipping', 'Staff']);
        expect(host.textContent).toContain('Sent when an order is placed');
        expect(host.textContent).toContain('connected but not verified');
        expect(host.querySelector('a[href="/store/settings/digital-delivery"]')).not.toBeNull();
        expect(checkbox('Order confirmation — WhatsApp').disabled).toBe(true);
        expect(checkbox('New order — WhatsApp')).toBeNull();
        expect(host.textContent).toContain('owner@example.com');
        expect(host.textContent).toContain('ops@example.com');
    });

    it('tracks dirty state and saves the whole settings object', async () => {
        await mount(<StoreNotificationsPage />);
        expect(button('Save').disabled).toBe(true);
        await click(checkbox('Shipping confirmation — Email'));
        expect(host.textContent).toContain('You have unsaved changes.');
        await click(button('Save'));
        expect(api.put).toHaveBeenCalledTimes(1);
        const [url, body] = api.put.mock.calls[0];
        expect(url).toBe('/my-store/notifications');
        expect(body.settings.events.shipping_confirmation.email_enabled).toBe(false);
        expect(body.settings.staff_recipients).toEqual(['ops@example.com']);
        expect(host.querySelector('[role="status"]').textContent).toBe('Notification settings saved.');
    });

    it('blocks saving a template with an unknown variable and names the token', async () => {
        await mount(<StoreNotificationsPage />);
        await click(button('Edit Order confirmation'));
        await type(host.querySelector('input[maxlength="200"]'), 'Order {coupon_code}');
        expect(host.textContent).toContain('Unknown variable: {coupon_code}');
        await click(button('Save'));
        expect(api.put).not.toHaveBeenCalled();
        expect(host.querySelector('[role="alert"]').textContent).toContain('Order confirmation — Email subject: Unknown variable: {coupon_code}');
    });

    it('shows server 422 errors next to the field', async () => {
        api.put.mockRejectedValueOnce({ response: { status: 422, data: { message: 'The given data was invalid.', errors: { 'settings.sender_name': ['Sender name is reserved.'] } } } });
        await mount(<StoreNotificationsPage />);
        await type(host.querySelector('input[maxlength="100"]'), 'Admin');
        await click(button('Save'));
        expect(host.querySelector('[role="alert"]').textContent).toContain('Sender name: Sender name is reserved.');
        expect(host.querySelector('#sender-name-errors').textContent).toBe('Sender name is reserved.');
    });

    it('debounces previews, inserts variables at the cursor and restores the saved template', async () => {
        vi.useFakeTimers();
        await mount(<StoreNotificationsPage />);
        await click(button('Edit Order confirmation'));
        const body = host.querySelector('textarea[maxlength="6000"]');
        await type(body, 'Hi ');
        await type(body, 'Hi !');
        expect(api.post).not.toHaveBeenCalled();
        await act(async () => { vi.advanceTimersByTime(450); });
        const previews = api.post.mock.calls.filter(([url]) => url === '/my-store/notifications/preview');
        expect(previews.map(([, payload]) => payload.channel).sort()).toEqual(['email', 'whatsapp']);
        expect(previews.find(([, payload]) => payload.channel === 'email')[1]).toEqual({ event: 'order_confirmation', channel: 'email', template: { subject: 'Order {order_number}', body: 'Hi !' } });
        const iframe = host.querySelector('iframe');
        expect(iframe.getAttribute('sandbox')).toBe('');
        expect(iframe.getAttribute('srcdoc')).toContain('<p>Hello</p>');
        expect(host.querySelector('[data-testid="whatsapp-bubble"]').textContent).toBe('WA: Hi {customer_name}');

        await act(async () => { body.focus(); body.setSelectionRange(3, 3); });
        await click(button('{customer_name}'));
        expect(host.querySelector('textarea[maxlength="6000"]').value).toBe('Hi {customer_name}!');
        await click(button('Restore last saved'));
        expect(host.querySelector('textarea[maxlength="6000"]').value).toBe('Hi {customer_name}');
    });

    it('sends a test to the owner email by default and explains throttling', async () => {
        await mount(<StoreNotificationsPage />);
        await click(button('Edit New order'));
        expect(host.querySelector('input[type="email"]').value).toBe('owner@example.com');
        await click(button('Send test'));
        expect(api.post).toHaveBeenCalledWith('/my-store/notifications/test', { event: 'staff_new_order', channel: 'email', recipient: 'owner@example.com' });
        expect(host.textContent).toContain('Test message sent to owner@example.com.');
        api.post.mockRejectedValueOnce({ response: { status: 429, headers: { 'retry-after': '42' }, data: { message: 'Too Many Attempts.' } } });
        await click(button('Send test'));
        expect(host.textContent).toContain('Too many test messages. Try again in 42 seconds.');
    });

    it('validates staff recipients before adding them', async () => {
        await mount(<StoreNotificationsPage />);
        const field = host.querySelector('form input[type="email"]');
        await type(field, 'not-an-email');
        await act(async () => host.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
        expect(host.textContent).toContain('Invalid email: not-an-email');
        await type(field, 'Owner@Example.com');
        await act(async () => host.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
        expect(host.textContent).toContain('Already listed: owner@example.com');
        await type(field, 'help@example.com');
        await act(async () => host.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
        await click(button('Save'));
        expect(api.put.mock.calls[0][1].settings.staff_recipients).toEqual(['ops@example.com', 'help@example.com']);
    });

    it('renders Arabic labels from the catalog', async () => {
        state.language = 'ar';
        await mount(<StoreNotificationsPage />);
        expect(host.querySelector('h1').textContent).toBe('الإشعارات');
        expect(host.textContent).toContain('تأكيد الطلب');
        expect(host.textContent).toContain('الشحن');
    });
});

describe('order notifications card', () => {
    const deliveries = [
        { id: 'a', event: 'order_confirmation', channel: 'email', recipient: 'a***@x.com', state: 'sent', created_at: '2026-10-20T10:00:00Z', sent_at: '2026-10-20T10:00:05Z' },
        { id: 'b', event: 'order_confirmation', channel: 'whatsapp', recipient: '+201001234567', state: 'failed', created_at: '2026-10-20T10:00:00Z', sent_at: null },
        { id: 'c', event: 'staff_new_order', channel: 'email', recipient: 'o***@x.com', state: 'queued', created_at: '2026-10-20T10:00:00Z', sent_at: null },
    ];
    it('lists deliveries with masked recipients and resends a customer event after confirmation', async () => {
        api.get.mockResolvedValue({ data: { data: deliveries } });
        api.post.mockResolvedValue({ data: { status: 'queued' } });
        await mount(<StoreOrderNotifications order={{ id: 7, status: 'pending' }} apiBase="/my-store" />);
        expect(api.get).toHaveBeenCalledWith('/my-store/orders/7/notifications');
        expect(host.textContent).toContain('a***@x.com');
        expect(host.textContent).toContain('+***567');
        expect(host.textContent).not.toContain('+201001234567');
        expect(host.textContent).toContain('Failed');
        expect(button('Resend: New order (staff) • Email')).toBeUndefined();
        await click(button('Resend: Order confirmation • WhatsApp'));
        expect(api.post).not.toHaveBeenCalled();
        await click(button('Confirm resend'));
        expect(api.post).toHaveBeenCalledWith('/my-store/orders/7/notifications/resend', { event: 'order_confirmation', channel: 'whatsapp' });
        expect(host.textContent).toContain('was queued again by WhatsApp');
    });
    it('stays hidden and silent without order permission', async () => {
        state.access = { canStoreSettings: true, canStoreOrders: false };
        await mount(<StoreOrderNotifications order={{ id: 7, status: 'pending' }} apiBase="/my-store" />);
        expect(host.textContent).toBe('');
        expect(api.get).not.toHaveBeenCalled();
    });
});
