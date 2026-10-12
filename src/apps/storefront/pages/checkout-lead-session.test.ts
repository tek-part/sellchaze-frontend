import { describe, expect, it } from 'vitest';
import { ensureLeadSession, leadSessionKey, nextLeadSequence, retireLeadToken, type LeadStorage } from './checkout-lead-session';
import { leadContact } from './useCheckoutLead';

function storage(): LeadStorage & { values: Map<string, string> } {
  const values = new Map<string, string>();
  return { values, get length() { return values.size; }, key: (i) => [...values.keys()][i] ?? null, getItem: (key) => values.get(key) ?? null, setItem: (key, value) => { values.set(key, value); }, removeItem: (key) => { values.delete(key); } };
}
const first = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const second = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
describe('private checkout lead session', () => {
  it('stores only the opaque token and sequence, with separate store and checkout scopes', () => {
    const saved = storage(); const cart = leadSessionKey('1', 'cart');
    const session = ensureLeadSession(saved, cart, () => first);
    nextLeadSequence(saved, cart, session);
    expect(JSON.parse(saved.getItem(cart)!)).toEqual({ token: first, sequence: 1 });
    expect(ensureLeadSession(saved, cart, () => second).token).toBe(first);
    expect(leadSessionKey('2', 'cart')).not.toBe(cart);
    expect(leadSessionKey('1', 'funnel:bag')).not.toBe(cart);
  });
  it('continues monotonic sequences after refresh and tolerates blocked or corrupt storage', () => {
    const saved = storage(); const key = leadSessionKey('1', 'cart');
    const old = ensureLeadSession(saved, key, () => first);
    expect(nextLeadSequence(saved, key, old)).toBe(1);
    const resumed = ensureLeadSession(saved, key, () => second);
    expect(nextLeadSequence(saved, key, resumed)).toBe(2);
    expect(nextLeadSequence(saved, key, old)).toBe(3);
    saved.setItem(key, 'broken'); expect(ensureLeadSession(saved, key, () => second).token).toBe(second);
    saved.setItem(key, JSON.stringify({ token: first, sequence: Number.MAX_SAFE_INTEGER }));
    expect(ensureLeadSession(saved, key, () => second)).toEqual({ token: second, sequence: 0 });
    expect(ensureLeadSession(undefined, key, () => first)).toEqual({ token: first, sequence: 0 });
  });
  it('retires the completed order token without clearing a newer checkout or other application data', () => {
    const saved = storage(); const cart = leadSessionKey('1', 'cart'); const funnel = leadSessionKey('1', 'funnel:bag');
    ensureLeadSession(saved, cart, () => first); ensureLeadSession(saved, funnel, () => second); saved.setItem('unrelated', first);
    retireLeadToken(saved, first);
    expect(saved.getItem(cart)).toBeNull(); expect(saved.getItem(funnel)).not.toBeNull(); expect(saved.getItem('unrelated')).toBe(first);
  });
  it('does not capture checkout verification proofs or partial invalid email addresses', () => {
    const contact = leadContact({ customer_name: ' Reader ', customer_phone: '01001234567', customer_email: 'incomplete@', bot_proof: 'secret', phone_verification: 'proof', lead_token: first });
    expect(contact).toEqual({ customer_name: 'Reader', customer_phone: '01001234567' });
    expect(leadContact({ customer_email: ' reader@example.test ' })).toEqual({ customer_email: 'reader@example.test' });
  });
});
