import { describe, expect, it } from 'vitest';
import { checkoutContact, type CheckoutField } from './checkout-contact';

const field = (key: CheckoutField['key'], enabled = true): CheckoutField => ({ key, enabled, required: false, position: 0, label: { ar: key, en: key }, hint: { ar: '', en: '' } });

describe('configured checkout contact', () => {
  it('does not send stale free-text city when a shipping region controls it', () => {
    const payload = checkoutContact([{ ...field('city'), shipping_region: true }, field('address')], { city: 'Old city', address: 'Street' });
    expect(payload.shipping_address).toEqual({ line1: 'Street' });
  });
  it('drops values retained in hidden fields after switching payment methods', () => {
    const payload = checkoutContact([field('phone'), field('email', false), field('notes', false)], { phone: ' 01000000000 ', email: 'private@example.test', notes: 'hidden private note' });
    expect(payload.customer_phone).toBe('01000000000');
    expect(payload.customer_email).toBeUndefined();
    expect(payload.notes).toBeUndefined();
    expect(payload.shipping_address).toBeUndefined();
  });

  it('keeps alternative contact and national address in the delivery snapshot without inventing email', () => {
    const payload = checkoutContact(['name', 'phone', 'phone_alt', 'address', 'national_address', 'country'].map((key) => field(key as CheckoutField['key'])), { name: 'Buyer', phone: '01000000000', phone_alt: '01111111111', address: 'Local address', national_address: 'ABCD1234', country: 'EG' });
    expect(payload.shipping_address).toEqual({ name: 'Buyer', line1: 'Local address', phone_alt: '01111111111', national_address: 'ABCD1234', country: 'EG' });
    expect(payload.customer_email).toBeUndefined();
  });

  it('sends email when the effective gateway configuration enables it and omits blank optional shipping', () => {
    const payload = checkoutContact([field('email'), field('city')], { email: ' buyer@example.test ', city: '   ' });
    expect(payload.customer_email).toBe('buyer@example.test');
    expect(payload.shipping_address).toBeUndefined();
  });
});
