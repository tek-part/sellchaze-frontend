/** Browser-only presentation limits. Checkout always validates the actual coupon again. */
export type OfferScope = { id: string; baseCurrency: string };
type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
const memory = new Map<string, string>();
function key(scope: OfferScope, kind: string): string { return `sf:downsell:${encodeURIComponent(scope.id)}:${scope.baseCurrency}:${kind}`; }
function storage(): StorageLike | undefined { try { return window.localStorage; } catch { return undefined; } }
function read(k: string, target = storage()): string | null { try { return target?.getItem(k) ?? memory.get(k) ?? null; } catch { return memory.get(k) ?? null; } }
function write(k: string, value: string | null, target = storage()): void {
  if (value === null) memory.delete(k); else memory.set(k, value);
  try { if (value === null) target?.removeItem(k); else target?.setItem(k, value); } catch { /* presentation still works in private mode */ }
}
export function offerPage(path: string): boolean { return path === '/' || path === '/cart' || path === '/search' || /^\/(products|collections|brands)\/[^/]+\/?$/.test(path); }
export function offerDue(trigger: 'timer' | 'exit' | 'both', event: 'timer' | 'exit', elapsed: number, delay: number, minimum: number): boolean {
  return (trigger === 'both' || trigger === event) && elapsed >= (event === 'timer' ? Math.max(delay, minimum) : minimum) * 1000;
}
export function canPresent(scope: OfferScope, version: number, hours: number, now = Date.now(), target?: StorageLike): boolean {
  const raw = read(key(scope, `seen:${version}`), target); if (raw === null) return true;
  const seen = Number(raw); return !Number.isFinite(seen) || (now >= seen && now - seen >= hours * 3600000);
}
export function markPresented(scope: OfferScope, version: number, now = Date.now(), target?: StorageLike): void { write(key(scope, `seen:${version}`), String(now), target); }
export function chooseOfferCoupon(scope: OfferScope, code: string, now = Date.now(), target?: StorageLike): void { write(key(scope, 'choice'), JSON.stringify({ code, expires: now + 86400000 }), target); }
export function chosenOfferCoupon(scope: OfferScope, now = Date.now(), target?: StorageLike): string {
  try { const item = JSON.parse(read(key(scope, 'choice'), target) ?? 'null') as { code?: unknown; expires?: unknown } | null;
    if (item && typeof item.code === 'string' && item.code.length <= 100 && typeof item.expires === 'number' && item.expires > now && item.expires <= now + 86400000) return item.code;
  } catch { /* corrupt storage must never prevent checkout */ }
  return '';
}
export function clearOfferCoupon(scope: OfferScope): void { write(key(scope, 'choice'), null); }
