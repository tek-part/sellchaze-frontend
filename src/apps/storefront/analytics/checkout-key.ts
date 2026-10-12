import type { CheckoutItem } from '../api/storefront';

export function checkoutMetricsKey(items: ReadonlyArray<CheckoutItem>, source: 'storefront' | 'funnel'): string {
  // Deliberately excludes all personalization, contact, notes, proof, prices and URLs.
  return JSON.stringify([source, items.map((item) => [item.product_id, item.variant_id ?? null, item.quantity, item.quantity_offer_id ?? null, item.quantity_offer_version ?? null]).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))]);
}
