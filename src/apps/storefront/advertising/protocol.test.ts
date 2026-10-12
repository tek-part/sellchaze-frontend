import { describe, expect, it } from 'vitest';
import { advertisingAllowed, advertisingItems, trackingCommands, trackingConfiguration, trackingEnvelope, type TrackingEnvelope } from './protocol';

const example: TrackingEnvelope = { configuration: { version: 2, facebook: ['1234567890', '2345678901'], tiktok: ['C7TEST0123456789ABCDE0'], snapchat: ['12345678-1234-4234-8234-123456789abc'], google: ['G-Y1F28T2SY8'] },
  event: { event: 'purchase', event_id: 'a'.repeat(64), currency: 'EGP', value: '500.00', gross_value: '525.00', shipping: '25.00', tax: '0.00', transaction_id: 'OWN-ORDER', items: [{ item_id: '12', item_name: 'Bag', quantity: 2, price: '250.00' }], page_location: 'https://own-store.example/checkout' } };

describe('advertising provider contract', () => {
  it('matches variant catalog IDs and uses group matching only for a parent product view', () => {
    const parsed = trackingEnvelope({ ...example, event: { ...example.event, items: [{ ...example.event.items[0], item_id: 'p12-v5' }] } });
    expect(parsed).toBeDefined(); expect(trackingCommands(parsed!)[0]?.data.content_ids).toEqual(['p12-v5']);
    for (const item_id of ['p0-v5', 'p12-v0', 'p12-v5-private', '<script>']) expect(trackingEnvelope({ ...example, event: { ...example.event, items: [{ ...example.event.items[0], item_id }] } })).toBeUndefined();
    const group = trackingEnvelope({ ...example, event: { ...example.event, event: 'view_item', content_type: 'product_group' } });
    expect(trackingCommands(group!)[0]?.data.content_type).toBe('product_group');
    expect(trackingCommands(group!)[3]?.data.item_category).toBe('12');
    const purchase = trackingEnvelope({ ...example, event: { ...example.event, content_type: 'product_group' } });
    expect(purchase?.event.content_type).toBeUndefined();
  });
  it('maps all configured pixels with shared dedup IDs and separates GA merchandise value from gross order value', () => {
    const commands = trackingCommands(example);
    expect(commands).toHaveLength(5); expect(commands.map((row) => row.eventId)).toEqual(Array(5).fill('a'.repeat(64)));
    expect(commands[0]).toMatchObject({ provider: 'facebook', id: '1234567890', event: 'Purchase', data: { value: 525 } });
    expect(commands[1]?.id).toBe('2345678901'); expect(commands[2]).toMatchObject({ provider: 'tiktok', event: 'Purchase', data: { value: 525 } });
    expect(commands[3]).toMatchObject({ provider: 'snapchat', event: 'PURCHASE', data: { price: 525, transaction_id: 'a'.repeat(64), client_dedup_id: 'a'.repeat(64) } });
    expect(commands[4]).toMatchObject({ provider: 'google', event: 'purchase', data: { value: 500, transaction_id: 'OWN-ORDER', shipping: 25, tax: 0, send_to: 'G-Y1F28T2SY8' } });
  });
  it('uses current platform page/product/cart/checkout event names', () => {
    const mapped = trackingCommands({ ...example, event: { ...example.event, event: 'page_view' } });
    expect(mapped.map((row) => row.event)).toEqual(['PageView', 'PageView', 'Pageview', 'PAGE_VIEW', 'page_view']);
    expect(trackingCommands({ ...example, event: { ...example.event, event: 'begin_checkout' } })[3]?.event).toBe('START_CHECKOUT');
  });
  it('never passes contacts, personalization, receipt proofs or client prices into public advertising selections', () => {
    expect(advertisingItems([{ product_id: 12, quantity: 2, variant_id: 5, quantity_offer_id: 'offer', quantity_offer_version: 3, personalization: { name: 'PRIVATE NAME' } }]))
      .toEqual([{ product_id: 12, quantity: 2, variant_id: 5, quantity_offer_id: 'offer', quantity_offer_version: 3 }]);
    const raw = { ...example, event: { ...example.event, user_data: { em: 'PRIVATE EMAIL', ph: 'PRIVATE PHONE' }, receipt: 'PRIVATE CAPABILITY', items: [{ ...example.event.items[0], personalization: { name: 'PRIVATE NAME' } }] } };
    const parsed = trackingEnvelope(raw); expect(parsed).toBeDefined(); expect(JSON.stringify(parsed)).not.toContain('PRIVATE');
  });
  it('rejects raw scripts, URLs, unknown event types and malformed money before SDK initialization', () => {
    expect(trackingConfiguration({ ...example.configuration, facebook: ['<script>'] })).toBeUndefined();
    expect(trackingConfiguration({ ...example.configuration, google: ['https://attacker.example/code.js'] })).toBeUndefined();
    for (const event of [{ ...example.event, event: 'arbitrary' }, { ...example.event, value: 'Infinity' }, { ...example.event, value: -10 }, { ...example.event, page_location: 'https://own-store.example/?receipt=PRIVATE' }, { ...example.event, event_id: 'PRIVATE' }]) expect(trackingEnvelope({ ...example, event })).toBeUndefined();
  });
  it('disables trackers for previews and browser privacy choices', () => {
    expect(advertisingAllowed({ preview: true })).toBe(false); expect(advertisingAllowed({ preview: false, doNotTrack: '1' })).toBe(false);
    expect(advertisingAllowed({ preview: false, globalPrivacyControl: true })).toBe(false); expect(advertisingAllowed({ preview: false })).toBe(true);
  });
});
