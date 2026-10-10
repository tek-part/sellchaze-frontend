import { describe, expect, it } from 'vitest';
import { addDeliveryOverride, renderDeliveryTemplate } from './digital-delivery';
describe('digital delivery editor', () => {
  it('replaces exactly the supported variables once, without executing markup or replacement syntax', () => {
    expect(renderDeliveryTemplate('{customer_name} {code_or_link} {store_name} {product_name}', { customer_name: '<script>x</script>', code_or_link: '{store_name} $&', store_name: 'Shop', product_name: 'Guide' })).toBe('<script>x</script> {store_name} $& Shop Guide');
    expect(renderDeliveryTemplate('{unknown}', {})).toBe('{unknown}');
  });
  it('creates a complete independent product override, keeping the master switch global and preventing duplicates', () => {
    const settings = { enabled: true, email_enabled: true, sender_name: 'Shop', email_subject: 'Subject', email_body: '{code_or_link}', whatsapp_enabled: false, whatsapp_body: '{code_or_link}', overrides: [] };
    const next = addDeliveryOverride(settings, 7);
    expect(next.overrides[0]).toEqual({ product_id: 7, email_enabled: true, sender_name: 'Shop', email_subject: 'Subject', email_body: '{code_or_link}', whatsapp_enabled: false, whatsapp_body: '{code_or_link}' });
    expect(settings.overrides).toEqual([]);
    expect(addDeliveryOverride(next, 7)).toBe(next);
    expect(addDeliveryOverride(next, 0)).toBe(next);
  });
});
