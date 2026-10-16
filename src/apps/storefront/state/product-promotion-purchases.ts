import { useSyncExternalStore } from 'react';

interface Purchases { orders: string[]; quantities: Record<string, number> }
const memory = new Map<string, Purchases>(); const listeners = new Set<() => void>();
const key = (store: string): string => `sf:promotion-purchases:v1:${store}`;
function state(store: string): Purchases {
  const cached = memory.get(store); if (cached) return cached;
  let value: Purchases = { orders: [], quantities: {} };
  try {
    const saved = JSON.parse(sessionStorage.getItem(key(store)) || 'null') as Purchases | null;
    if (saved && Array.isArray(saved.orders) && saved.orders.length <= 100 && saved.orders.every((id) => typeof id === 'string' && id.length <= 120)
      && saved.quantities && typeof saved.quantities === 'object' && !Array.isArray(saved.quantities) && Object.keys(saved.quantities).length <= 200
      && Object.entries(saved.quantities).every(([id, quantity]) => /^[1-9]\d*$/.test(id) && Number.isSafeInteger(quantity) && quantity >= 0 && quantity <= 1_000_000)) value = saved;
  } catch { /* A cosmetic display can use this document's bounded memory. */ }
  memory.set(store, value); return value;
}
/** Call only after a server-accepted order. Replays/payment recovery must retain its order number. */
export function recordPromotionPurchase(store: string, order: string, items: unknown): void {
  if (!/^[1-9]\d*$/.test(store) || !order || order.length > 120 || !Array.isArray(items) || items.length > 50) return;
  const value = state(store); if (value.orders.includes(order)) return;
  const valid = items.every((item: unknown) => !!item && typeof item === 'object' && 'product_id' in item && Number.isSafeInteger(item.product_id) && Number(item.product_id) > 0
    && 'quantity' in item && Number.isSafeInteger(item.quantity) && Number(item.quantity) > 0 && Number(item.quantity) <= 999);
  if (!valid || !items.length) return;
  value.orders = [...value.orders, order].slice(-100);
  for (const item of items as { product_id: number; quantity: number }[]) value.quantities[String(item.product_id)] = Math.min(1_000_000, (value.quantities[String(item.product_id)] ?? 0) + item.quantity);
  for (const id of Object.keys(value.quantities).slice(0, -200)) delete value.quantities[id];
  try { sessionStorage.setItem(key(store), JSON.stringify(value)); } catch { /* Inventory and checkout never depend on this optional display. */ }
  for (const listener of listeners) { try { listener(); } catch { /* A display subscriber cannot reject an accepted order. */ } }
}
const subscribe = (listener: () => void): (() => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
export function usePromotionPurchasedQuantity(store: string, product: string): number {
  return useSyncExternalStore(subscribe, () => /^[1-9]\d*$/.test(store) ? state(store).quantities[product] ?? 0 : 0, () => 0);
}
