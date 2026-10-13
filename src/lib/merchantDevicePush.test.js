import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { deviceSubscription, enableDevicePush, endpointHash, publicKeyBytes } from './merchantDevicePush';
import { loginSessionsCsv } from './loginSessionsCsv';

afterEach(() => vi.unstubAllGlobals());
describe('merchant device notification boundaries', () => {
    it('never reads a storefront worker subscription or prompts while reading', async () => {
        const permission = vi.fn(); const subscription = vi.fn();
        vi.stubGlobal('window', { isSecureContext: true, PushManager: {}, Notification: {} });
        vi.stubGlobal('Notification', { requestPermission: permission });
        vi.stubGlobal('navigator', { serviceWorker: { getRegistration: async () => ({ active: { scriptURL: 'https://example.test/storefront-sw.js' }, pushManager: { getSubscription: subscription } }) } });
        expect(await deviceSubscription()).toBe(null); expect(subscription).not.toHaveBeenCalled(); expect(permission).not.toHaveBeenCalled();
    });
    it('permission denial creates no registration and no subscription', async () => {
        const register = vi.fn();
        vi.stubGlobal('Notification', { requestPermission: async () => 'denied' });
        vi.stubGlobal('navigator', { serviceWorker: { register } });
        await expect(enableDevicePush('BA')).rejects.toThrow('PUSH_PERMISSION'); expect(register).not.toHaveBeenCalled();
    });
    it('renews a subscription whose application server key changed', async () => {
        const unsubscribe = vi.fn(async () => true); const subscribe = vi.fn(async () => ({ endpoint: 'new' }));
        const key = publicKeyBytes('BAE');
        vi.stubGlobal('Notification', { requestPermission: async () => 'granted' });
        vi.stubGlobal('navigator', { serviceWorker: { ready: Promise.resolve(), register: async () => ({ pushManager: { getSubscription: async () => ({ options: { applicationServerKey: new Uint8Array([4, 2]).buffer }, unsubscribe }), subscribe } }) } });
        expect(await enableDevicePush('BAE')).toEqual({ endpoint: 'new' });
        expect(unsubscribe).toHaveBeenCalledOnce(); expect(subscribe).toHaveBeenCalledWith({ userVisibleOnly: true, applicationServerKey: key });
    });
    it('identifies endpoints with a SHA-256 hash without returning keys', async () => {
        expect(await endpointHash({ endpoint: 'abc' })).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    });
    it('worker always shows generic text and opens only the same-origin orders route', async () => {
        const handlers = {}; const showNotification = vi.fn(async () => {}); const openWindow = vi.fn(async () => {});
        runInNewContext(readFileSync(new URL('../../public/merchant-order-push-sw.js', import.meta.url), 'utf8'), { URL, self: { addEventListener: (name, handler) => { handlers[name] = handler; }, location: { origin: 'https://sellchaze.com' }, registration: { showNotification }, clients: { matchAll: async () => [], openWindow } } });
        let pending;
        handlers.push({ data: { json: () => ({ tag: 'sellchaze-order-12345678-1234-1234-1234-123456789abc', body: 'private@example.test', url: 'https://evil.test' }) }, waitUntil: (promise) => { pending = promise; } });
        await pending; expect(showNotification).toHaveBeenCalledWith('طلب جديد', expect.objectContaining({ body: 'لديك طلب جديد في متجرك.', renotify: false }));
        handlers.notificationclick({ notification: { close: vi.fn(), data: { url: 'https://evil.test' } }, waitUntil: (promise) => { pending = promise; } });
        await pending; expect(openWindow).toHaveBeenCalledWith('https://sellchaze.com/store/orders');
    });
    it('session export prevents spreadsheet formulas and preserves quoted values', () => {
        const csv = loginSessionsCsv([{ ip_address: '=1+1', device_name: '  @formula', email: 'a"b@example.test', created_at: '2026-10-13' }]);
        expect(csv).toContain('"\'=1+1"'); expect(csv).toContain('"\'  @formula"'); expect(csv).toContain('"a""b@example.test"');
    });
});
