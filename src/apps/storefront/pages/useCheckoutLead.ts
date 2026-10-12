import { useCallback, useEffect, useRef } from 'react';
import { apiFetch } from '../api/client';
import { useStore } from '../state/store-context';
import type { CheckoutItem } from '../api/storefront';
import type { CheckoutContactPayload } from './useCheckoutPaymentFlow';
import { ensureLeadSession, leadSessionKey, nextLeadSequence, type LeadStorage } from './checkout-lead-session';

interface LeadInput { contact: CheckoutContactPayload; items: ReadonlyArray<CheckoutItem>; enabled: boolean; source: 'storefront' | 'funnel'; kind: string; paymentMethod: string }
interface LeadBody {
  source: LeadInput['source']; source_path?: string; customer_name?: string; customer_email?: string; customer_phone?: string;
  shipping_address?: Record<string, unknown>; notes?: string; items?: ReadonlyArray<{ product_id: number; variant_id?: number; quantity: number }>; clear?: boolean;
  shipping_region_id?: string; shipping_option_id?: string; coupon_code?: string;
  payment_method?: string;
}
function storage(): LeadStorage | undefined { try { return window.sessionStorage; } catch { return undefined; } }
export function leadContact(contact: CheckoutContactPayload): Pick<LeadBody, 'customer_name' | 'customer_email' | 'customer_phone' | 'shipping_address' | 'notes'> {
  const email = contact.customer_email?.trim();
  return { ...(contact.customer_name?.trim() ? { customer_name: contact.customer_name.trim() } : {}),
    ...(contact.customer_phone?.trim() ? { customer_phone: contact.customer_phone.trim() } : {}),
    ...(email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? { customer_email: email } : {}),
    ...(contact.shipping_address ? { shipping_address: contact.shipping_address } : {}), ...(contact.notes ? { notes: contact.notes } : {}) };
}
const usableContact = (body: LeadBody): boolean => !!body.customer_email || (body.customer_phone?.replace(/[^\d\u0660-\u0669\u06f0-\u06f9]/g, '').length ?? 0) >= 8;

/** Records contactable unfinished checkouts without blocking purchase or reserving inventory. */
export function useCheckoutLead(input: LeadInput) {
  const { store, apiOk } = useStore();
  const key = leadSessionKey(store.id, input.kind);
  const path = window.location.pathname;
  const body: LeadBody = { ...leadContact(input.contact), source: input.source,
    ...(input.paymentMethod ? { payment_method: input.paymentMethod } : {}),
    ...(input.contact.shipping_region_id ? { shipping_region_id: input.contact.shipping_region_id } : {}),
    ...(input.contact.shipping_option_id ? { shipping_option_id: input.contact.shipping_option_id } : {}),
    ...(input.contact.coupon_code ? { coupon_code: input.contact.coupon_code } : {}),
    ...(/^\/(?:checkout|(?:funnels|pages|products|p)\/[a-z0-9-]+)?$/i.test(path) ? { source_path: path } : {}),
    items: input.items.map((item) => ({ product_id: item.product_id, quantity: item.quantity, ...(item.variant_id ? { variant_id: item.variant_id } : {}) })) };
  const serialized = JSON.stringify(body);
  const allowed = input.enabled && apiOk && !!store.id && input.items.length > 0;
  const current = useRef({ key, session: undefined as ReturnType<typeof ensureLeadSession> | undefined, saved: '', acknowledged: 0, sentContact: false });
  const latest = useRef({ allowed, key, body }); latest.current = { allowed, key, body };
  const send = useCallback((immediate = false): string | undefined => {
    const data = latest.current;
    if (!data.allowed) return undefined;
    if (current.current.key !== data.key) current.current = { key: data.key, session: undefined, saved: '', acknowledged: 0, sentContact: false };
    const state = current.current;
    const usable = usableContact(data.body);
    if (!usable && !state.sentContact) return undefined;
    const payload: LeadBody = usable ? data.body : { source: data.body.source, clear: true };
    const payloadKey = JSON.stringify(payload);
    state.session ??= ensureLeadSession(storage(), data.key, () => crypto.randomUUID());
    const token = state.session.token;
    if (state.saved === payloadKey && !immediate) return token;
    if (usable) state.sentContact = true;
    const sequence = nextLeadSequence(storage(), data.key, state.session);
    void apiFetch('/checkout-leads', { method: 'POST', body: JSON.stringify({ ...payload, lead_token: token, sequence }), keepalive: true })
      .then(() => { if (current.current === state && sequence > state.acknowledged) { state.saved = payloadKey; state.acknowledged = sequence; } })
      .catch(() => { /* tracking failure never prevents an order; next edit/online/pagehide retries */ });
    return token;
  }, []);
  useEffect(() => {
    if (!allowed) return;
    const timer = window.setTimeout(() => send(), 1200);
    return () => window.clearTimeout(timer);
  }, [allowed, serialized, key, send]);
  useEffect(() => {
    const flush = (): void => { send(); };
    window.addEventListener('pagehide', flush); window.addEventListener('online', flush);
    return () => { window.removeEventListener('pagehide', flush); window.removeEventListener('online', flush); send(); };
  }, [send]);
  return { submitToken: (): string | undefined => send(true) };
}
