import { describe, expect, it } from 'vitest';
import { metricsAllowed, restoredMetricsSession } from './events';
import { checkoutMetricsKey } from './checkout-key';

describe('first-party metrics contracts', () => {
  it('excludes design previews and respects browser privacy choices', () => {
    expect(metricsAllowed({ preview: false })).toBe(true);
    expect(metricsAllowed({ preview: true })).toBe(false);
    expect(metricsAllowed({ preview: false, doNotTrack: '1' })).toBe(false);
    expect(metricsAllowed({ preview: false, globalPrivacyControl: true })).toBe(false);
  });
  it('deduplicates checkout by catalog selection without storing customer customization or proofs', () => {
    const a = { product_id: 2, quantity: 2, personalization: { name: 'PRIVATE-NAME', upload: 'PRIVATE-PROOF' } };
    const b = { product_id: 1, variant_id: 3, quantity: 1 };
    expect(checkoutMetricsKey([a, b], 'storefront')).toBe(checkoutMetricsKey([b, { ...a, personalization: { name: 'OTHER' } }], 'storefront'));
    expect(checkoutMetricsKey([a], 'storefront')).not.toContain('PRIVATE');
    expect(checkoutMetricsKey([a], 'storefront')).not.toBe(checkoutMetricsKey([a], 'funnel'));
    expect(checkoutMetricsKey([a], 'storefront')).not.toBe(checkoutMetricsKey([{ ...a, quantity_offer_id: 'offer', quantity_offer_version: 2 }], 'storefront'));
  });
  it('restores only bounded current sessions and strips arbitrary event fields', () => {
    const event = { event_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', kind: 'add_to_cart', source: 'cross_sell', product_id: 7, quantity: 2, privateContact: 'NEVER-SEND' };
    const session = { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', expires: 60000, pending: [event], starts: [] };
    expect(restoredMetricsSession(session, 0)?.pending[0]).not.toHaveProperty('privateContact');
    expect(restoredMetricsSession(session, 60001)).toBeUndefined();
    expect(restoredMetricsSession({ ...session, expires: Infinity }, 0)).toBeUndefined();
    expect(restoredMetricsSession({ ...session, pending: [{ ...event, quantity: 1000 }] }, 0)).toBeUndefined();
    expect(restoredMetricsSession({ ...session, pending: Array(51).fill(event) }, 0)).toBeUndefined();
    expect(restoredMetricsSession({ ...session, campaign: { source: 'meta', campaign: 'test', privateContact: 'NEVER-SEND' } }, 0)?.campaign).toEqual({ source: 'meta', campaign: 'test' });
    expect(restoredMetricsSession({ ...session, campaign: { source: '<script>', campaign: 'test' } }, 0)?.campaign).toBeUndefined();
  });
});
