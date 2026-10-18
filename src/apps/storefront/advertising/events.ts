import { ApiError, apiFetch } from '../api/client';
import type { CheckoutItem } from '../api/storefront';
import { advertisingAllowed, advertisingItems, trackingCommands, trackingEnvelope, type AdvertisingEvent } from './protocol';

interface Pending { event_id: string; event: Exclude<AdvertisingEvent, 'purchase'>; page_path: string; items?: CheckoutItem[]; surface?: 'product' }
const queue = new Map<string, Pending[]>(); const busy = new Set<string>(); const sent = new Map<string, Set<string>>(); const starts = new Map<string, number>();
export function browserAdvertisingAllowed(): boolean {
  if (typeof window === 'undefined') return false;
  const search = new URLSearchParams(window.location.search);
  const privateCapability = search.has('receipt') || search.has('token') || new URLSearchParams(window.location.hash.slice(1)).has('receipt');
  return advertisingAllowed({ preview: search.get('preview') === '1' || search.has('__preview') || privateCapability, doNotTrack: navigator.doNotTrack,
    globalPrivacyControl: (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl });
}
function sentIds(storeId: string): Set<string> {
  let result = sent.get(storeId);
  if (!result) {
    result = new Set();
    try { const data: unknown = JSON.parse(sessionStorage.getItem(`sf:ad-sent:v1:${storeId}`) || 'null');
      if (Array.isArray(data) && data.length <= 200 && data.every((id) => typeof id === 'string' && /^(facebook|tiktok|snapchat|google):[A-Za-z0-9-]{1,64}:[a-f0-9]{64}$/.test(id))) result = new Set(data);
    } catch { /* A bounded in-memory set still suppresses duplicates in this document. */ }
    sent.set(storeId, result);
  }
  return result;
}
export function sendAdvertisingEnvelope(storeId: string, value: unknown): void {
  if (!browserAdvertisingAllowed()) return;
  const envelope = trackingEnvelope(value); if (!envelope) return;
  // Provider SDK adapters are needed only for an enabled, consented advertising event.
  void import('./sdk').then(({ sendTrackingCommand }) => {
    if (!browserAdvertisingAllowed()) return;
    const ids = sentIds(storeId);
    for (const command of trackingCommands(envelope)) {
      const id = `${command.provider}:${command.id}:${command.eventId}`;
      if (ids.has(id)) continue;
      try { sendTrackingCommand(command); ids.add(id); } catch { /* Optional SDK errors never affect the cart or receipt. */ }
    }
    while (ids.size > 200) ids.delete(ids.values().next().value!);
    try { sessionStorage.setItem(`sf:ad-sent:v1:${storeId}`, JSON.stringify([...ids])); } catch { /* Memory fallback. */ }
  }).catch(() => { /* Optional advertising must not block checkout when its adapter cannot load. */ });
}
export async function flushAdvertising(storeId: string): Promise<void> {
  if (!browserAdvertisingAllowed() || busy.has(storeId)) return;
  const pending = queue.get(storeId); if (!pending) return;
  busy.add(storeId);
  try {
    while (pending.length && browserAdvertisingAllowed()) {
      const event = pending[0]!; const controller = new AbortController(); const timer = window.setTimeout(() => controller.abort(), 5000);
      try {
        const result = await apiFetch<{ data: unknown }>('/tracking/events', { method: 'POST', body: JSON.stringify({ ...event, advertising_allowed: true }), keepalive: true, signal: controller.signal });
        sendAdvertisingEnvelope(storeId, result.data); pending.shift();
      } catch (error) { if (error instanceof ApiError && [404, 422].includes(error.status)) pending.shift(); else break; }
      finally { window.clearTimeout(timer); }
    }
  } finally { busy.delete(storeId); }
}
export function recordAdvertising(storeId: string, event: Exclude<AdvertisingEvent, 'purchase'>, items?: ReadonlyArray<CheckoutItem>, eventId?: string, surface?: 'product'): void {
  if (!browserAdvertisingAllowed() || !/^[1-9]\d*$/.test(storeId)) return;
  const pending = queue.get(storeId) ?? []; let id: string;
  try { id = eventId ?? crypto.randomUUID(); } catch { return; }
  if (!pending.some((row) => row.event_id === id)) {
    if (pending.length >= 50) pending.shift();
    const path = window.location.pathname; const page_path = /^\/(?!\/)[A-Za-z0-9_/%.-]*$/.test(path) && path.length <= 512 ? path : '/';
    pending.push({ event_id: id, event, page_path, ...(items ? { items: advertisingItems(items) } : {}), ...(surface ? { surface } : {}) }); queue.set(storeId, pending);
  }
  void flushAdvertising(storeId);
}
export function recordAdvertisingCheckout(storeId: string, key: string, items: ReadonlyArray<CheckoutItem>, surface?: 'product'): void {
  const id = `${storeId}:${window.location.pathname}:${surface ?? ''}:${key}`; const until = starts.get(id) ?? 0;
  if (until > Date.now() || !browserAdvertisingAllowed()) return;
  starts.set(id, Date.now() + 30 * 60 * 1000);
  if (starts.size > 100) starts.delete(starts.keys().next().value!);
  recordAdvertising(storeId, 'begin_checkout', items, undefined, surface);
}
