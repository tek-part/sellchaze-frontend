import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('store-scoped referral attribution sessions', () => {
  const values = new Map<string, string>();
  let now = 10000; let search = ''; let privacy: { doNotTrack: string; globalPrivacyControl?: boolean };
  beforeEach(() => {
    vi.resetModules(); values.clear(); now = 10000; search = ''; privacy = { doNotTrack: '0' };
    vi.spyOn(Date, 'now').mockImplementation(() => now);
    vi.stubGlobal('window', { location: { get search() { return search; } } });
    vi.stubGlobal('sessionStorage', { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) });
    vi.stubGlobal('navigator', privacy);
  });
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
  it('retains the last valid referral through untagged checkout navigation and keeps campaign attribution independent', async () => {
    const { recordReferral, metricsSession } = await import('./events');
    search = '?utm_source=meta&utm_campaign=summer'; recordReferral('71', { code: 'one', product_id: 7 });
    search = ''; expect(metricsSession('71')?.referral).toEqual({ code: 'one', product_id: 7 });
    expect(metricsSession('71')?.campaign).toEqual({ source: 'meta', campaign: 'summer' });
    recordReferral('71', { code: '<script>', product_id: 8 }); expect(metricsSession('71')?.referral?.code).toBe('one');
    recordReferral('71', { code: 'two', product_id: 8 }); expect(metricsSession('71')?.referral).toEqual({ code: 'two', product_id: 8 });
    expect(metricsSession('72')?.referral).toBeUndefined();
  });
  it('expires a referral with the existing inactivity session and strips arbitrary restored fields', async () => {
    const { recordReferral, metricsSession, restoredMetricsSession } = await import('./events');
    recordReferral('71', { code: 'one', product_id: 7 }); const saved = metricsSession('71')!;
    expect(restoredMetricsSession({ ...saved, referral: { ...saved.referral, contact: 'PRIVATE' } }, now)?.referral).toEqual({ code: 'one', product_id: 7 });
    now += 31 * 60 * 1000; expect(metricsSession('71')?.referral).toBeUndefined();
  });
  it('does not capture or submit referral sessions in preview or when DNT/GPC is active', async () => {
    const { recordReferral, metricsSession } = await import('./events');
    for (const choice of ['preview', 'dnt', 'gpc']) {
      search = choice === 'preview' ? '?preview=1' : ''; privacy.doNotTrack = choice === 'dnt' ? '1' : '0'; privacy.globalPrivacyControl = choice === 'gpc';
      recordReferral('71', { code: 'one', product_id: 7 }); expect(metricsSession('71')).toBeUndefined(); expect(values.size).toBe(0);
    }
  });
});
