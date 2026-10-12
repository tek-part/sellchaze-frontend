import type { CheckoutItem } from '../api/storefront';

export type AdvertisingEvent = 'page_view' | 'view_item' | 'add_to_cart' | 'begin_checkout' | 'purchase';
export interface TrackingConfiguration { version: number; enabled?: boolean; facebook: string[]; tiktok: string[]; snapchat: string[]; google: string[] }
export interface TrackingItem { item_id: string; item_name: string; price: string; quantity: number }
export interface TrackingEnvelope { configuration: TrackingConfiguration; event: { event: AdvertisingEvent; event_id: string; currency: string; value: string; gross_value?: string; shipping?: string; tax?: string; transaction_id?: string; items: TrackingItem[]; page_location: string } }
export interface TrackingCommand { provider: 'facebook' | 'tiktok' | 'snapchat' | 'google'; id: string; event: string; eventId: string; data: Record<string, unknown> }
const idPatterns = { facebook: /^[1-9][0-9]{4,24}$/, tiktok: /^[A-Z0-9]{8,32}$/, snapchat: /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i, google: /^(?:G|GT)-[A-Z0-9]{5,20}$/ };
const money = /^\d+(?:\.\d{1,2})?$/;
const names = { facebook: { page_view: 'PageView', view_item: 'ViewContent', add_to_cart: 'AddToCart', begin_checkout: 'InitiateCheckout', purchase: 'Purchase' }, tiktok: { page_view: 'Pageview', view_item: 'ViewContent', add_to_cart: 'AddToCart', begin_checkout: 'InitiateCheckout', purchase: 'Purchase' }, snapchat: { page_view: 'PAGE_VIEW', view_item: 'VIEW_CONTENT', add_to_cart: 'ADD_CART', begin_checkout: 'START_CHECKOUT', purchase: 'PURCHASE' } };

export function advertisingAllowed(options: { preview: boolean; doNotTrack?: string | null; globalPrivacyControl?: boolean }): boolean {
  return !options.preview && options.doNotTrack !== '1' && !options.globalPrivacyControl;
}
export function advertisingItems(items: ReadonlyArray<CheckoutItem>): CheckoutItem[] {
  return items.map((item) => ({ product_id: item.product_id, quantity: item.quantity, ...(item.variant_id ? { variant_id: item.variant_id } : {}),
    ...(item.quantity_offer_id ? { quantity_offer_id: item.quantity_offer_id, quantity_offer_version: item.quantity_offer_version } : {}) }));
}
/** Config/response hardening also prevents malformed offline storage from injecting scripts or sending contacts. */
export function trackingConfiguration(value: unknown): TrackingConfiguration | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const row = value as TrackingConfiguration;
  if (!Number.isSafeInteger(row.version) || row.version < 1) return undefined;
  const result = { version: row.version, enabled: row.enabled === true } as TrackingConfiguration;
  for (const provider of ['facebook', 'tiktok', 'snapchat', 'google'] as const) {
    const ids = row[provider]; if (!Array.isArray(ids) || ids.length > 10 || !ids.every((id) => typeof id === 'string' && idPatterns[provider].test(id))) return undefined;
    result[provider] = [...new Set(ids)];
  }
  return result;
}
export function trackingEnvelope(value: unknown): TrackingEnvelope | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const row = value as TrackingEnvelope; const config = trackingConfiguration(row.configuration); const event = row.event;
  if (!config || !event || !Object.hasOwn(names.facebook, event.event) || typeof event.event_id !== 'string' || !/^[a-f0-9]{64}$/.test(event.event_id) || !/^[A-Z]{3}$/.test(event.currency) || typeof event.value !== 'string' || !money.test(event.value) || !Number.isFinite(Number(event.value)) || !Array.isArray(event.items) || event.items.length > 100) return undefined;
  if ([event.gross_value, event.shipping, event.tax].some((v) => v !== undefined && (typeof v !== 'string' || !money.test(v) || !Number.isFinite(Number(v))))) return undefined;
  const items: TrackingItem[] = [];
  for (const item of event.items) {
    if (!item || typeof item.item_id !== 'string' || !/^[1-9]\d*$/.test(item.item_id) || typeof item.item_name !== 'string' || item.item_name.length > 500 || typeof item.price !== 'string' || !money.test(item.price) || !Number.isFinite(Number(item.price)) || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 999) return undefined;
    items.push({ item_id: item.item_id, item_name: item.item_name, price: item.price, quantity: item.quantity });
  }
  if (typeof event.page_location !== 'string') return undefined;
  let url: URL; try { url = new URL(event.page_location); } catch { return undefined; }
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) return undefined;
  if (event.transaction_id !== undefined && (typeof event.transaction_id !== 'string' || event.transaction_id.length > 100)) return undefined;
  return { configuration: config, event: { event: event.event, event_id: event.event_id, currency: event.currency, value: event.value, items, page_location: url.href,
    ...(event.gross_value !== undefined ? { gross_value: event.gross_value } : {}), ...(event.shipping !== undefined ? { shipping: event.shipping } : {}), ...(event.tax !== undefined ? { tax: event.tax } : {}), ...(event.transaction_id ? { transaction_id: event.transaction_id } : {}) } };
}
export function trackingCommands(envelope: TrackingEnvelope): TrackingCommand[] {
  const event = envelope.event; const config = envelope.configuration;
  const commerce = { currency: event.currency, value: Number(event.gross_value ?? event.value), content_type: 'product', content_ids: event.items.map((item) => item.item_id), contents: event.items.map((item) => ({ id: item.item_id, quantity: item.quantity, item_price: Number(item.price) })) };
  return ([...config.facebook.map((id) => ({ provider: 'facebook' as const, id, event: names.facebook[event.event], eventId: event.event_id, data: commerce })),
    ...config.tiktok.map((id) => ({ provider: 'tiktok' as const, id, event: names.tiktok[event.event], eventId: event.event_id, data: { currency: event.currency, value: Number(event.gross_value ?? event.value), content_type: 'product', contents: event.items.map((item) => ({ content_id: item.item_id, content_name: item.item_name, quantity: item.quantity, price: Number(item.price) })) } })),
    ...config.snapchat.map((id) => ({ provider: 'snapchat' as const, id, event: names.snapchat[event.event], eventId: event.event_id, data: { currency: event.currency, price: Number(event.gross_value ?? event.value), item_ids: event.items.map((item) => item.item_id), client_dedup_id: event.event_id, ...(event.event === 'purchase' ? { transaction_id: event.event_id } : {}) } })),
    ...config.google.map((id) => ({ provider: 'google' as const, id, event: event.event, eventId: event.event_id, data: { send_to: id, currency: event.currency, value: Number(event.value), items: event.items.map((item) => ({ ...item, price: Number(item.price) })), page_location: event.page_location,
      ...(event.transaction_id ? { transaction_id: event.transaction_id, shipping: Number(event.shipping || 0), tax: Number(event.tax || 0) } : {}) } }))]);
}
