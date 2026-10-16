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
