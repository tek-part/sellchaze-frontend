import { describe, expect, it } from 'vitest';
import {
  DEFAULT_VARIABLES, eventChanged, groupCatalog, insertVariable, isEmail, isInternationalPhone, issuesFor, maskRecipient,
  normalizeRecipients, pickLocalized, resendTargets, templateTokens, unknownVariables, validateEvent, validateSettings,
  type CatalogEntry, type NotificationSettings,
} from './notifications';

const catalog: CatalogEntry[] = [
  { key: 'staff_new_order', audience: 'staff', group: 'orders', channels: ['email'] },
  { key: 'shipping_confirmation', audience: 'customer', group: 'shipping', channels: ['email', 'whatsapp'] },
  { key: 'order_confirmation', audience: 'customer', group: 'orders', channels: ['email', 'whatsapp'] },
  { key: 'custom', audience: 'customer', group: 'marketing', channels: ['email'] },
];
const event = (overrides = {}) => ({ email_enabled: true, email_subject: 'Order {order_number}', email_body: 'Hi {customer_name}', whatsapp_enabled: false, whatsapp_body: 'Hi {customer_name}', ...overrides });
const settings = (overrides: Partial<NotificationSettings> = {}): NotificationSettings => ({
  sender_name: 'Shop', reply_to: null, staff_recipients: [],
  events: { order_confirmation: event(), shipping_confirmation: event(), staff_new_order: { email_enabled: true, email_subject: 'New {order_number}', email_body: '{items}' }, custom: event() },
  ...overrides,
});

describe('notification template variables', () => {
  it('lists unique tokens, tolerating inner spaces, and flags only unknown ones', () => {
    expect(templateTokens('{order_number} { customer_name } {order_number} {not a token} {{x}}')).toEqual(['order_number', 'customer_name', 'x']);
    expect(unknownVariables('Hi {customer_name}, {coupon} and {Order_Number}', DEFAULT_VARIABLES)).toEqual(['coupon', 'Order_Number']);
    expect(unknownVariables(null, DEFAULT_VARIABLES)).toEqual([]);
  });
  it('inserts at the caret, replaces a selection, clamps bad ranges and refuses overflow', () => {
    expect(insertVariable('Hello !', 'customer_name', 6, 6)).toEqual({ value: 'Hello {customer_name}!', caret: 21 });
    expect(insertVariable('Hello NAME!', 'customer_name', 6, 10)).toEqual({ value: 'Hello {customer_name}!', caret: 21 });
    expect(insertVariable('abc', 'items')).toEqual({ value: 'abc{items}', caret: 10 });
    expect(insertVariable('abc', 'items', -5, 99)).toEqual({ value: '{items}', caret: 7 });
    expect(insertVariable('abc', 'items', 3, 1)).toEqual({ value: 'abc{items}', caret: 10 });
    expect(insertVariable('abcd', 'items', 4, 4, 8)).toBeNull();
  });
});

describe('notification validation', () => {
  it('requires enabled email templates, enforces limits and names the unknown token', () => {
    const issues = validateEvent('order_confirmation', event({ email_subject: '', email_body: 'x'.repeat(6001), whatsapp_body: '{coupon}' }), ['email', 'whatsapp'], DEFAULT_VARIABLES);
    expect(issues).toEqual([
      { field: 'events.order_confirmation.email_subject', code: 'required' },
      { field: 'events.order_confirmation.email_body', code: 'too_long', max: 6000 },
      { field: 'events.order_confirmation.whatsapp_body', code: 'unknown_variable', tokens: ['coupon'] },
    ]);
    expect(validateEvent('order_confirmation', event({ email_enabled: false, email_subject: '' }), ['email', 'whatsapp'], DEFAULT_VARIABLES)).toEqual([]);
  });
  it('validates the whatsapp body only for whatsapp-capable events that carry one', () => {
    expect(validateEvent('staff_new_order', { email_enabled: true, email_subject: 'S', email_body: 'B', whatsapp_body: '{bad}' }, ['email'], DEFAULT_VARIABLES)).toEqual([]);
    expect(validateEvent('order_confirmation', event({ whatsapp_enabled: true, whatsapp_body: ' ' }), ['email', 'whatsapp'], DEFAULT_VARIABLES)).toEqual([{ field: 'events.order_confirmation.whatsapp_body', code: 'required' }]);
  });
  it('checks sender, reply-to and staff recipients (max 5, format, duplicates incl. owner)', () => {
    const issues = validateSettings(settings({ sender_name: 'x'.repeat(101), reply_to: 'nope', staff_recipients: ['ops@example.com', 'bad', 'OPS@example.com', 'owner@example.com', 'a@b.co', 'c@d.co'] }), catalog, DEFAULT_VARIABLES, 'Owner@Example.com');
    expect(issues).toEqual([
      { field: 'sender_name', code: 'too_long', max: 100 },
      { field: 'reply_to', code: 'invalid_email', value: 'nope' },
      { field: 'staff_recipients', code: 'too_many', max: 5 },
      { field: 'staff_recipients.1', code: 'invalid_email', value: 'bad' },
      { field: 'staff_recipients.2', code: 'duplicate', value: 'OPS@example.com' },
      { field: 'staff_recipients.3', code: 'duplicate', value: 'owner@example.com' },
    ]);
    expect(validateSettings(settings(), catalog, DEFAULT_VARIABLES, 'owner@example.com')).toEqual([]);
    expect(issuesFor(issues, 'staff_recipients').length).toBe(4);
  });
  it('recognises emails and international phones', () => {
    expect(isEmail('a.b+c@shop.example')).toBe(true);
    expect(['a@b', 'a b@c.com', '@c.com', 'a@b.c', 42].map(isEmail)).toEqual([false, false, false, false, false]);
    expect(isInternationalPhone('+20 100 123-4567')).toBe(true);
    expect(['01001234567', '+0123456789', '+12', 'abc'].map(isInternationalPhone)).toEqual([false, false, false, false]);
  });
});

describe('notification display helpers', () => {
  it('groups catalog rows as orders, shipping, staff, then unknown groups', () => {
    expect(groupCatalog(catalog).map(({ group, entries }) => [group, entries.map((entry) => entry.key)])).toEqual([
      ['orders', ['order_confirmation']], ['shipping', ['shipping_confirmation']], ['staff', ['staff_new_order']], ['marketing', ['custom']],
    ]);
  });
  it('keeps server masking and masks anything that arrives raw', () => {
    expect(maskRecipient('a***@x.com')).toBe('a***@x.com');
    expect(maskRecipient('alice@x.com')).toBe('a***@x.com');
    expect(maskRecipient('+20 100 123 4567')).toBe('+***567');
    expect(maskRecipient('')).toBe('—');
    expect(maskRecipient('abcdef')).toBe('ab***');
  });
  it('offers one resend per customer (event, channel), skipping staff events', () => {
    const row = (id: string, event: string, channel: 'email' | 'whatsapp') => ({ id, event, channel, recipient: null, state: 'sent', created_at: null, sent_at: null });
    const rows = [row('1', 'order_confirmation', 'email'), row('2', 'order_confirmation', 'email'), row('3', 'order_confirmation', 'whatsapp'), row('4', 'staff_new_order', 'email')];
    expect(resendTargets(rows, new Set(['order_confirmation']))).toEqual([{ event: 'order_confirmation', channel: 'email' }, { event: 'order_confirmation', channel: 'whatsapp' }]);
  });
  it('normalises recipients, picks localized labels and detects template edits', () => {
    expect(normalizeRecipients([' A@b.co ', 'a@b.co', '', 'c@d.co'])).toEqual(['a@b.co', 'c@d.co']);
    expect(pickLocalized({ ar: 'تأكيد', en: 'Confirmation' }, true)).toBe('تأكيد');
    expect(pickLocalized({ ar: 'تأكيد' }, false)).toBe('تأكيد');
    expect(pickLocalized(null, false, 'key')).toBe('key');
    expect(eventChanged(event(), event({ email_enabled: false }))).toBe(false);
    expect(eventChanged(event(), event({ email_body: 'changed' }))).toBe(true);
  });
});
