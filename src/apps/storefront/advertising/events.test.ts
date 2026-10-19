import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { apiFetch } from '../api/client';
import { sendTrackingCommand } from './sdk';

vi.mock('../api/client', () => ({ apiFetch: vi.fn(), ApiError: class extends Error { status = 500 } }));
vi.mock('./sdk', () => ({ sendTrackingCommand: vi.fn() }));
beforeEach(() => {
  vi.stubGlobal('window', { location: { search: '', hash: '', pathname: '/products/bag' }, setTimeout, clearTimeout });
  vi.stubGlobal('navigator', {}); vi.stubGlobal('sessionStorage', { getItem: () => null, setItem: vi.fn() }); vi.clearAllMocks();
});
afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });
const envelope = { configuration: { version: 1, facebook: ['1234567890'], tiktok: [], snapchat: [], google: ['G-Y1F28T2SY8'] }, event: { event: 'purchase', event_id: 'a'.repeat(64), value: '500.00', gross_value: '525.00', currency: 'EGP', items: [{ item_id: '12', item_name: 'Bag', price: '250.00', quantity: 2 }], page_location: 'https://own.example/checkout', transaction_id: 'OWN-ORDER' } };

it('suppresses duplicate purchase envelopes across completion and receipt refresh while keeping store scopes separate', async () => {
  const { sendAdvertisingEnvelope } = await import('./events');
  sendAdvertisingEnvelope('1', envelope); sendAdvertisingEnvelope('1', envelope); await vi.waitFor(() => expect(sendTrackingCommand).toHaveBeenCalledTimes(2));
  sendAdvertisingEnvelope('2', envelope); await vi.waitFor(() => expect(sendTrackingCommand).toHaveBeenCalledTimes(4));
});
it('retains a full browser destination set across receipt replay and document reload', async () => {
  let stored = '';
  vi.stubGlobal('sessionStorage', { getItem: () => stored || null, setItem: (_key: string, value: string) => { stored = value; } });
  const large = { ...envelope, configuration: { ...envelope.configuration,
    facebook: Array.from({ length: 1020 }, (_, i) => String(1234567890 + i)),
    tiktok: Array.from({ length: 1020 }, (_, i) => `C7TEST${String(i).padStart(14, '0')}`),
    snapchat: Array.from({ length: 1020 }, (_, i) => `12345678-1234-4234-8234-${123456789000 + i}`),
    google: Array.from({ length: 10 }, (_, i) => `G-ABCDE${i}`) } };
  const { sendAdvertisingEnvelope } = await import('./events');
  sendAdvertisingEnvelope('1', large); await vi.waitFor(() => expect(sendTrackingCommand).toHaveBeenCalledTimes(3070));
  sendAdvertisingEnvelope('1', large); await vi.dynamicImportSettled(); expect(sendTrackingCommand).toHaveBeenCalledTimes(3070);
  expect(JSON.parse(stored)).toHaveLength(3070);
  vi.resetModules(); const reloaded = await import('./events'); const freshSdk = await import('./sdk');
  vi.mocked(freshSdk.sendTrackingCommand).mockClear();
  reloaded.sendAdvertisingEnvelope('1', large); await vi.dynamicImportSettled(); expect(freshSdk.sendTrackingCommand).not.toHaveBeenCalled();
});
it('does not initialize or call providers while a private receipt token remains in the URL', async () => {
  const { sendAdvertisingEnvelope, browserAdvertisingAllowed } = await import('./events');
  window.location.hash = '#receipt=PRIVATE'; expect(browserAdvertisingAllowed()).toBe(false); sendAdvertisingEnvelope('1', envelope);
  expect(sendTrackingCommand).not.toHaveBeenCalled(); window.location.hash = ''; sendAdvertisingEnvelope('1', envelope); await vi.waitFor(() => expect(sendTrackingCommand).toHaveBeenCalledTimes(2));
});
it('rechecks privacy before a delayed advertising adapter loads', async () => {
  const { sendAdvertisingEnvelope } = await import('./events');
  sendAdvertisingEnvelope('1', envelope); window.location.hash = '#receipt=PRIVATE';
  await vi.dynamicImportSettled(); expect(sendTrackingCommand).not.toHaveBeenCalled();
});
it('posts only catalog selections and uses the server response rather than client values before calling providers', async () => {
  const { recordAdvertising, flushAdvertising } = await import('./events');
  vi.mocked(apiFetch).mockResolvedValue({ data: { ...envelope, event: { ...envelope.event, event: 'add_to_cart' } } });
  recordAdvertising('1', 'add_to_cart', [{ product_id: 12, quantity: 2, personalization: { name: 'PRIVATE NAME' } }], '12345678-1234-4234-8234-123456789abc');
  await flushAdvertising('1'); await vi.waitFor(() => expect(sendTrackingCommand).toHaveBeenCalledTimes(2));
  const init = vi.mocked(apiFetch).mock.calls[0]?.[1]; expect(JSON.parse(init?.body as string)).toEqual({ event_id: '12345678-1234-4234-8234-123456789abc', event: 'add_to_cart', page_path: '/products/bag', advertising_allowed: true, items: [{ product_id: 12, quantity: 2 }] });
  expect(vi.mocked(sendTrackingCommand).mock.calls[0]?.[0]).toMatchObject({ data: { value: 525 } });
});

it('does not suppress the same product checkout when the visitor enters a different funnel', async () => {
  const { recordAdvertisingCheckout, flushAdvertising } = await import('./events');
  vi.mocked(apiFetch).mockResolvedValue({ data: null });
  const items = [{ product_id: 12, quantity: 1 }];
  window.location.pathname = '/funnels/first';
  recordAdvertisingCheckout('1', 'same-selection', items); await flushAdvertising('1');
  await vi.waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(1));
  recordAdvertisingCheckout('1', 'same-selection', items); await flushAdvertising('1');
  expect(apiFetch).toHaveBeenCalledTimes(1);
  window.location.pathname = '/funnels/second';
  recordAdvertisingCheckout('1', 'same-selection', items); await flushAdvertising('1');
  await vi.waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(2));
  expect(JSON.parse(vi.mocked(apiFetch).mock.calls[1]?.[1]?.body as string)).toMatchObject({ page_path: '/funnels/second', event: 'begin_checkout' });
});
