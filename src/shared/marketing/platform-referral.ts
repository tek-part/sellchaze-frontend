import { metricsAllowedInBrowser } from '../../apps/storefront/analytics/identity';

const key = 'sellchaze:platform-referral:v1';
const ttl = 30 * 24 * 60 * 60 * 1000;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function platformReferralCode(search: string): string | undefined {
  const values = new URLSearchParams(search).getAll('view');
  const code = values[0];
  return values.length === 1 && typeof code === 'string' && uuid.test(code) ? code.toLowerCase() : undefined;
}
export function capturePlatformReferral(): void {
  if (typeof window === 'undefined') return;
  try {
    if (!metricsAllowedInBrowser()) { sessionStorage.removeItem(key); return; }
    const code = platformReferralCode(window.location.search);
    if (code) sessionStorage.setItem(key, JSON.stringify({ code, expires: Date.now() + ttl }));
  } catch { /* Storage-disabled browsers can still register normally. */ }
}
export function savedPlatformReferral(): string | undefined {
  if (typeof window === 'undefined' || !metricsAllowedInBrowser()) return undefined;
  try {
    const data = JSON.parse(sessionStorage.getItem(key) || 'null') as { code?: unknown; expires?: unknown } | null;
    if (!data || typeof data.code !== 'string' || !uuid.test(data.code) || typeof data.expires !== 'number' || data.expires <= Date.now() || data.expires > Date.now() + ttl) { sessionStorage.removeItem(key); return undefined; }
    return data.code.toLowerCase();
  } catch { return undefined; }
}
export function clearPlatformReferral(): void { try { sessionStorage.removeItem(key); } catch { /* Only this referral's storage is touched. */ } }
