export const LEAD_PREFIX = 'sf-checkout-lead-v1:';
interface LeadSession { token: string; sequence: number }
export type LeadStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'key' | 'length'>;
const validToken = (value: unknown): value is string => typeof value === 'string' && /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(value);

export function leadSessionKey(storeId: string, kind: string): string {
  return `${LEAD_PREFIX}${encodeURIComponent(storeId)}:${encodeURIComponent(kind)}`;
}
function read(storage: LeadStorage | undefined, key: string): LeadSession | undefined {
  try {
    const value: unknown = JSON.parse(storage?.getItem(key) ?? 'null');
    if (!value || typeof value !== 'object') return undefined;
    const candidate = value as Partial<LeadSession>;
    return validToken(candidate.token) && Number.isSafeInteger(candidate.sequence) && (candidate.sequence ?? -1) >= 0 && (candidate.sequence ?? 0) < 2147483647
      ? { token: candidate.token, sequence: candidate.sequence! } : undefined;
  } catch { return undefined; }
}
export function ensureLeadSession(storage: LeadStorage | undefined, key: string, generate: () => string): LeadSession {
  const session = read(storage, key) ?? { token: generate(), sequence: 0 };
  try { storage?.setItem(key, JSON.stringify(session)); } catch { /* in-memory capture still works */ }
  return session;
}
export function nextLeadSequence(storage: LeadStorage | undefined, key: string, session: LeadSession): number {
  const persisted = read(storage, key);
  session.sequence = Math.max(session.sequence, persisted?.token === session.token ? persisted.sequence : 0) + 1;
  try { storage?.setItem(key, JSON.stringify(session)); } catch { /* optional session persistence */ }
  return session.sequence;
}
/** Remove only this order's token; a different checkout already started in the tab is retained. */
export function retireLeadToken(storage: LeadStorage | undefined, token: unknown): void {
  if (!storage || !validToken(token)) return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < storage.length; i++) { const key = storage.key(i); if (key?.startsWith(LEAD_PREFIX)) keys.push(key); }
    for (const key of keys) if (read(storage, key)?.token === token) storage.removeItem(key);
  } catch { /* server conversion independently fences delayed captures */ }
}
