import { ApiError, apiFetch } from '../api/client';
import { campaignFromSearch, campaignMediumFromSearch, cleanCampaign, cleanCampaignLabel, type CampaignAttribution } from '../../../shared/marketing/campaign';
import { cleanReferral, type ReferralAttribution } from '../../../shared/marketing/referral';
import { metricsAllowedInBrowser as allowed, metricsEventId } from './identity';
export { metricsAllowed, metricsEventId } from './identity';

const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const lifetime = 30 * 60 * 1000;
type EventKind = 'visit' | 'add_to_cart' | 'checkout_started' | 'product_view';
type EventSource = 'storefront' | 'funnel' | 'cross_sell';
interface Event { event_id: string; kind: EventKind; source: EventSource; product_id?: number; quantity?: number }
interface Session { id: string; expires: number; pending: Event[]; starts: string[]; viewed?: number[]; campaign?: CampaignAttribution; medium?: string; referral?: ReferralAttribution }
const sessions = new Map<string, Session>();
const busy = new Set<string>();
const prefix = 'sf:metrics:v1:';

export function restoredMetricsSession(value: unknown, now: number): Session | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const row = value as Partial<Session>;
  if (!row.id || !uuid.test(row.id) || typeof row.expires !== 'number' || !Number.isFinite(row.expires) || row.expires <= now || row.expires > now + lifetime || !Array.isArray(row.pending) || row.pending.length > 50 || !Array.isArray(row.starts) || row.starts.length > 50 || !row.starts.every((key) => typeof key === 'string' && key.length <= 20000)) return undefined;
  const pending: Event[] = [];
  for (const event of row.pending) {
    if (!event || typeof event !== 'object' || !uuid.test(event.event_id) || !['visit', 'add_to_cart', 'checkout_started', 'product_view'].includes(event.kind) || !['storefront', 'funnel', 'cross_sell'].includes(event.source)) return undefined;
    if (event.kind !== 'visit' && (!Number.isSafeInteger(event.product_id) || event.product_id! < 1)) return undefined;
    if (event.kind === 'add_to_cart' && (!Number.isSafeInteger(event.quantity) || event.quantity! < 1 || event.quantity! > 999)) return undefined;
    pending.push({ event_id: event.event_id, kind: event.kind, source: event.source,
      ...(event.kind !== 'visit' ? { product_id: event.product_id! } : {}), ...(event.kind === 'add_to_cart' ? { quantity: event.quantity! } : {}) });
  }
  const campaign = cleanCampaign(row.campaign);
  const medium = campaign ? cleanCampaignLabel(row.medium, 100) : undefined;
  const referral = cleanReferral(row.referral);
  const viewed = Array.isArray(row.viewed) ? row.viewed.filter((id) => Number.isSafeInteger(id) && id > 0).slice(-100) : [];
  return { id: row.id, expires: row.expires, pending, starts: row.starts, viewed, ...(campaign ? { campaign } : {}), ...(medium ? { medium } : {}), ...(referral ? { referral } : {}) };
}
export function saveMetricsSession(storeId: string, session: Session): void {
  sessions.set(storeId, session);
  try { sessionStorage.setItem(prefix + storeId, JSON.stringify(session)); } catch { /* In-memory counters remain usable. */ }
}
export function metricsSession(storeId: string): Session | undefined {
  if (!allowed() || !/^[1-9]\d*$/.test(storeId)) return undefined;
  let session = sessions.get(storeId);
  if (!session) {
    try { session = restoredMetricsSession(JSON.parse(sessionStorage.getItem(prefix + storeId) || 'null'), Date.now()); } catch { /* A malformed session never reaches the API. */ }
  }
  if (!session || session.expires <= Date.now()) {
    const id = metricsEventId(); const event = metricsEventId();
    if (!id || !event) return undefined;
    session = { id, expires: Date.now() + lifetime, pending: [{ event_id: event, kind: 'visit', source: 'storefront' }], starts: [] };
  }
  const campaign = campaignFromSearch(window.location.search);
  if (campaign) { session.campaign = campaign; session.medium = campaignMediumFromSearch(window.location.search); }
  session.expires = Date.now() + lifetime; saveMetricsSession(storeId, session); return session;
}
export async function flushMetricsSession(storeId: string): Promise<void> {
  if (!allowed() || busy.has(storeId)) return;
  const session = sessions.get(storeId); if (!session) return;
  busy.add(storeId);
  try {
    while (allowed() && sessions.get(storeId) === session && session.pending.length) {
      const event = session.pending[0]!;
      const controller = new AbortController(); const timer = window.setTimeout(() => controller.abort(), 5000);
      try {
        await apiFetch('/events', { method: 'POST', body: JSON.stringify({ ...event, session_id: session.id, ...campaignFields(session) }), keepalive: true, signal: controller.signal });
        session.pending.shift(); saveMetricsSession(storeId, session);
      } catch (error) {
        if (error instanceof ApiError && error.status === 422) { session.pending.shift(); saveMetricsSession(storeId, session); }
        else break;
      } finally { window.clearTimeout(timer); }
    }
  } finally { busy.delete(storeId); }
}
/** The landing campaign labels travel with each event so product analytics can be filtered by traffic source. */
export function campaignFields(session: Pick<Session, 'campaign' | 'medium'>): { utm_source?: string; utm_medium?: string; utm_campaign?: string } {
  if (!session.campaign) return {};
  return { utm_source: session.campaign.source, utm_campaign: session.campaign.campaign, ...(session.medium ? { utm_medium: session.medium } : {}) };
}
export function recordProductView(storeId: string, productId: string, source: 'storefront' | 'funnel'): void {
  if (!/^[1-9]\d*$/.test(productId)) return;
  const session = metricsSession(storeId); if (!session) return;
  const id = Number(productId); const viewed = session.viewed ?? [];
  if (!viewed.includes(id)) {
    const eventId = metricsEventId(); if (!eventId) return;
    session.viewed = [...viewed.slice(-99), id];
    if (session.pending.length >= 50) session.pending.splice(1, 1);
    session.pending.push({ event_id: eventId, kind: 'product_view', source, product_id: id });
    saveMetricsSession(storeId, session);
  }
  void flushMetricsSession(storeId);
}
export function recordVisit(storeId: string): void {
  if (metricsSession(storeId)) void flushMetricsSession(storeId);
}
export function recordReferral(storeId: string, value: unknown): void {
  const referral = cleanReferral(value); if (!referral) return;
  const session = metricsSession(storeId); if (!session) return;
  session.referral = referral; saveMetricsSession(storeId, session);
}
export function recordCartEvent(storeId: string, event: { id: string; productId: string; quantity: number; source?: 'cross_sell' }): void {
  const session = metricsSession(storeId); if (!session || !uuid.test(event.id) || !/^[1-9]\d*$/.test(event.productId) || !Number.isSafeInteger(event.quantity) || event.quantity < 1 || event.quantity > 999) return;
  if (!session.pending.some((row) => row.event_id === event.id)) {
    // Keep the visit ahead of its cart/checkout events when recovering from offline use.
    if (session.pending.length >= 50) session.pending.splice(1, 1);
    session.pending.push({ event_id: event.id, kind: 'add_to_cart', source: event.source ?? 'storefront', product_id: Number(event.productId), quantity: event.quantity });
    saveMetricsSession(storeId, session);
  }
  void flushMetricsSession(storeId);
}
