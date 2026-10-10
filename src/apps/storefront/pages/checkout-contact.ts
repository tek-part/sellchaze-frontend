import type { CheckoutContactPayload } from './useCheckoutPaymentFlow';

export interface CheckoutField {
  key: 'name' | 'email' | 'phone' | 'country' | 'city' | 'address' | 'phone_alt' | 'notes' | 'national_address' | 'postal_code';
  label: { ar: string; en: string };
  hint: { ar: string; en: string };
  enabled: boolean;
  required: boolean;
  position: number;
  payment_required?: boolean;
  shipping_region?: boolean;
  digital_required?: boolean;
}

export type Values = Partial<Record<CheckoutField['key'], string>>;
const addressKeys = { address: 'line1', city: 'city', country: 'country', postal_code: 'postal_code', phone_alt: 'phone_alt', national_address: 'national_address' } as const;

/** Submit only the fields enabled by the current payment configuration. */
export function checkoutContact(fields: ReadonlyArray<CheckoutField>, values: Values): CheckoutContactPayload {
  const visible = Object.fromEntries(fields.filter((field) => field.enabled && !field.shipping_region).map((field) => [field.key, values[field.key]?.trim() || undefined])) as Values;
  const shipping = Object.fromEntries(Object.entries(addressKeys).filter(([key]) => visible[key as keyof Values]).map(([key, path]) => [path, visible[key as keyof Values]]));
  return { customer_name: visible.name, customer_email: visible.email, customer_phone: visible.phone, notes: visible.notes,
    ...(Object.keys(shipping).length ? { shipping_address: { ...shipping, ...(visible.name ? { name: visible.name } : {}) } } : {}) };
}
