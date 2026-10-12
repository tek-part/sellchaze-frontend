import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { capturePlatformReferral, clearPlatformReferral, platformReferralCode, savedPlatformReferral } from './platform-referral';

const code = '12345678-1234-4567-8123-123456789abc';
const other = '87654321-4321-4567-8123-123456789abc';
let search: string;
let privacy: { doNotTrack: string; globalPrivacyControl: boolean };
let values: Map<string, string>;
beforeEach(() => {
  vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-12T00:00:00Z'));
  search = `?view=${code}`; privacy = { doNotTrack: '0', globalPrivacyControl: false }; values = new Map([['existing-auth', 'keep']]);
  vi.stubGlobal('window', { location: { get search() { return search; } } });
  vi.stubGlobal('navigator', privacy);
  vi.stubGlobal('sessionStorage', { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) });
});
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('Platform acquisition referral', () => {
  it('accepts only a single valid opaque code and rejects markup, repeated parameters and arbitrary ids', () => {
    expect(platformReferralCode(`?view=${code.toUpperCase()}`)).toBe(code);
    for (const query of ['?view=<script>', '?view=42', `?view=${code}&view=${code}`, '?ref=someone', `?view=${code}x`]) expect(platformReferralCode(query)).toBeUndefined();
  });
  it('retains the last valid code through untagged navigation and does not replace it with malformed tracking', () => {
    capturePlatformReferral(); search = '/register'; capturePlatformReferral(); expect(savedPlatformReferral()).toBe(code);
    search = '?view=invalid'; capturePlatformReferral(); expect(savedPlatformReferral()).toBe(code);
    search = `?view=${other}`; capturePlatformReferral(); expect(savedPlatformReferral()).toBe(other);
  });
  it('does not capture or submit when DNT, GPC or preview are enabled', () => {
    capturePlatformReferral(); privacy.doNotTrack = '1'; capturePlatformReferral(); expect(savedPlatformReferral()).toBeUndefined();
    privacy.doNotTrack = '0'; privacy.globalPrivacyControl = true; capturePlatformReferral(); expect(savedPlatformReferral()).toBeUndefined();
    privacy.globalPrivacyControl = false; search += '&preview=1'; capturePlatformReferral(); expect(savedPlatformReferral()).toBeUndefined();
    expect(values.get('existing-auth')).toBe('keep');
  });
  it('expires data and only clears its own namespace after a successful registration', () => {
    capturePlatformReferral(); vi.advanceTimersByTime(30 * 24 * 60 * 60 * 1000); expect(savedPlatformReferral()).toBeUndefined();
    capturePlatformReferral(); clearPlatformReferral(); expect(savedPlatformReferral()).toBeUndefined(); expect(values.get('existing-auth')).toBe('keep');
  });
  it('does not forward arbitrary saved properties or accept a manipulated expiration', () => {
    values.set('sellchaze:platform-referral:v1', JSON.stringify({ code, expires: Date.now() + 1000, contact: 'must-not-forward' })); expect(savedPlatformReferral()).toBe(code);
    values.set('sellchaze:platform-referral:v1', JSON.stringify({ code, expires: Number.MAX_SAFE_INTEGER })); expect(savedPlatformReferral()).toBeUndefined();
  });
});
