import { afterEach, expect, it, vi } from 'vitest';
import type { TrackingCommand } from './protocol';

afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });
it('queues only targeted provider IDs, shared event IDs and fixed SDK origins without automatic duplicate pageviews', async () => {
  const host: Record<string, unknown> = {}; const scripts: Array<{ src?: string }> = [];
  vi.stubGlobal('window', host); vi.stubGlobal('document', { createElement: () => ({ dataset: {}, addEventListener: vi.fn(), remove: vi.fn() }), head: { append: (script: { src?: string }) => scripts.push(script) } });
  const { sendTrackingCommand } = await import('./sdk');
  const command = (provider: TrackingCommand['provider'], id: string): TrackingCommand => ({ provider, id, event: 'Purchase', eventId: 'a'.repeat(64), data: { value: 525, currency: 'EGP', client_dedup_id: 'a'.repeat(64) } });
  sendTrackingCommand(command('facebook', '1234567890')); sendTrackingCommand(command('facebook', '2345678901'));
  const fb = host.fbq as { queue: unknown[][] }; expect(fb.queue.filter((row) => row[0] === 'trackSingle')).toEqual([
    ['trackSingle', '1234567890', 'Purchase', command('facebook', '').data, { eventID: 'a'.repeat(64) }], ['trackSingle', '2345678901', 'Purchase', command('facebook', '').data, { eventID: 'a'.repeat(64) }]]);
  sendTrackingCommand(command('snapchat', '12345678-1234-4234-8234-123456789abc'));
  expect((host.snaptr as { queue: unknown[][] }).queue[1]).toEqual(['track', '12345678-1234-4234-8234-123456789abc', 'Purchase', command('snapchat', '').data]);
  sendTrackingCommand(command('tiktok', 'C7TEST0123456789ABCDE0'));
  const tt = host.ttq as { _i: Record<string, unknown[][]>; methods: string[] };
  expect(tt._i.C7TEST0123456789ABCDE0?.[0]).toEqual(['track', 'Purchase', command('tiktok', '').data, { event_id: 'a'.repeat(64) }]); expect(tt.methods).toContain('grantConsent');
  sendTrackingCommand(command('google', 'G-Y1F28T2SY8'));
  const google = (host.dataLayer as Array<ArrayLike<unknown>>).map((row) => Array.from(row));
  expect(google[1]).toEqual(['config', 'G-Y1F28T2SY8', { send_page_view: false }]); expect(google[2]?.[0]).toBe('event');
  expect(scripts.map((row) => row.src)).toEqual(['https://connect.facebook.net/en_US/fbevents.js', 'https://sc-static.net/scevent.min.js', 'https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=C7TEST0123456789ABCDE0&lib=ttq', 'https://www.googletagmanager.com/gtag/js?id=G-Y1F28T2SY8']);
});
