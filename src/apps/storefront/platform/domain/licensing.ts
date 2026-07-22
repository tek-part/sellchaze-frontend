/**
 * Theme licensing — entitlement model for the marketplace. A licence grant is the platform's record
 * of a merchant's entitlement to a theme: free themes are entitled on install; premium themes install
 * for preview but need an activation key before they may go live; trial themes are entitled for a
 * bounded window. Pure + clock-injected (timestamps passed in), so entitlement is deterministic.
 *
 * Install is always allowed (browse/preview); ACTIVATION (going live) is what entitlement gates.
 */
import type { LicenseType, ThemeLicense } from '../catalog/types';

export type LicenseStatus = 'active' | 'trial' | 'expired' | 'none';

export interface LicenseGrant {
  readonly type: LicenseType;
  readonly status: LicenseStatus;
  readonly grantedAt?: string;
  /** Trial: ISO instant the trial lapses. */
  readonly trialEndsAt?: string;
  /** Premium: the activation key that entitled this grant. */
  readonly key?: string;
}

function addDaysIso(at: string, days: number): string {
  const ms = Date.parse(at);
  const base = Number.isNaN(ms) ? 0 : ms;
  return new Date(base + days * 24 * 60 * 60 * 1000).toISOString();
}

/** The grant a fresh install produces for a listing's licence. */
export function grantForInstall(license: ThemeLicense, at: string): LicenseGrant {
  switch (license.type) {
    case 'free':
      return { type: 'free', status: 'active', grantedAt: at };
    case 'trial': {
      const days = license.trialDays && license.trialDays > 0 ? license.trialDays : 14;
      return { type: 'trial', status: 'trial', grantedAt: at, trialEndsAt: addDaysIso(at, days) };
    }
    case 'premium':
      // Installed for preview, but not yet entitled to go live until a key is applied.
      return { type: 'premium', status: 'none', grantedAt: at };
    default:
      return { type: 'free', status: 'active', grantedAt: at };
  }
}

/** Apply an activation key to a grant (non-empty key entitles a premium/trial theme). */
export function activateLicense(grant: LicenseGrant, key: string, at: string): LicenseGrant {
  if (key.trim() === '') return grant;
  return { ...grant, status: 'active', key: key.trim(), grantedAt: grant.grantedAt ?? at };
}

/** Recompute a trial grant's status against the clock (expires when past `trialEndsAt`). */
export function refreshStatus(grant: LicenseGrant, at: string): LicenseGrant {
  if (grant.status === 'trial' && grant.trialEndsAt) {
    const ends = Date.parse(grant.trialEndsAt);
    const now = Date.parse(at);
    if (!Number.isNaN(ends) && !Number.isNaN(now) && now > ends) {
      return { ...grant, status: 'expired' };
    }
  }
  return grant;
}

/** True when the theme may be ACTIVATED (go live) at instant `at`. */
export function isEntitled(grant: LicenseGrant, at: string): boolean {
  const g = refreshStatus(grant, at);
  return g.status === 'active' || g.status === 'trial';
}

/** Whole trial days remaining (0 for non-trial / expired). */
export function trialRemainingDays(grant: LicenseGrant, at: string): number {
  if (grant.status !== 'trial' || !grant.trialEndsAt) return 0;
  const ends = Date.parse(grant.trialEndsAt);
  const now = Date.parse(at);
  if (Number.isNaN(ends) || Number.isNaN(now) || now > ends) return 0;
  return Math.ceil((ends - now) / (24 * 60 * 60 * 1000));
}
