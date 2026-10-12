import { flushMetricsSession, metricsEventId, metricsSession, saveMetricsSession } from './events';

export function recordCheckoutStart(storeId: string, productId: number, key: string, source: 'storefront' | 'funnel'): void {
  if (!Number.isSafeInteger(productId) || productId < 1 || key.length > 20000) return;
  const session = metricsSession(storeId); if (!session) return;
  if (!session.starts.includes(key)) {
    const id = metricsEventId(); if (!id) return;
    session.starts = [...session.starts.slice(-49), key];
    if (session.pending.length >= 50) session.pending.splice(1, 1);
    session.pending.push({ event_id: id, kind: 'checkout_started', source, product_id: productId });
    saveMetricsSession(storeId, session);
  }
  void flushMetricsSession(storeId);
}
