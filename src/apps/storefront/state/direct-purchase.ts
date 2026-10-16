import type { CheckoutItem } from '../api/storefront';

interface DirectPurchase { store: string; at: number; item: CheckoutItem }
const pending = new Map<string, DirectPurchase>();
const key = (store: string, product: number): string => `sf:direct-purchase:v1:${store}:${product}`;
function session(): Storage | undefined { try { return typeof window === 'undefined' ? undefined : window.sessionStorage; } catch { return undefined; } }
function valid(value: unknown, store: string, product: number, now: number): value is DirectPurchase {
  if (!value || typeof value !== 'object') return false;
  const data = value as DirectPurchase; const item = data.item;
  return data.store === store && Number.isFinite(data.at) && data.at <= now && now - data.at <= 30 * 60_000 && !!item && item.product_id === product && Number.isSafeInteger(product) && product > 0
    && Number.isSafeInteger(item.quantity) && item.quantity > 0 && item.quantity <= 999
    && (item.variant_id === undefined || Number.isSafeInteger(item.variant_id) && item.variant_id > 0)
    && (item.quantity_offer_id === undefined || typeof item.quantity_offer_id === 'string' && /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(item.quantity_offer_id) && Number.isSafeInteger(item.quantity_offer_version) && (item.quantity_offer_version ?? 0) > 0)
    && (item.personalization === undefined || !!item.personalization && typeof item.personalization === 'object' && !Array.isArray(item.personalization) && Object.entries(item.personalization).length <= 10 && Object.entries(item.personalization).every(([name, text]) => /^[a-z][a-z0-9_-]{0,79}$/.test(name) && typeof text === 'string' && text.length <= 1000));
}
export function saveDirectPurchase(store: string, item: CheckoutItem, storage: Pick<Storage, 'setItem'> | undefined = session(), now = Date.now()): boolean {
  const value = { store, item, at: now }; if (!/^[1-9]\d*$/.test(store) || !valid(value, store, item.product_id, now)) return false;
  const id = key(store, item.product_id); pending.set(id, JSON.parse(JSON.stringify(value)) as DirectPurchase);
  for (const [entry, saved] of pending) if (now - saved.at > 30 * 60_000) pending.delete(entry);
  try { storage?.setItem(id, JSON.stringify(value)); } catch { /* Same-document navigation still works without storage. */ }
  return true;
}
export function readDirectPurchase(store: string, product: number, storage: Pick<Storage, 'getItem'> | undefined = session(), now = Date.now()): CheckoutItem | undefined {
  const id = key(store, product);
  let raw: string | null | undefined;
  try { raw = storage?.getItem(id); } catch { /* Fall back only when storage is inaccessible. */ }
  if (raw != null) {
    try { const value: unknown = JSON.parse(raw); if (valid(value, store, product, now)) return value.item; } catch { /* Malformed persisted choices must fail closed. */ }
    pending.delete(id); return undefined;
  }
  const value = pending.get(id); return valid(value, store, product, now) ? value.item : undefined;
}
