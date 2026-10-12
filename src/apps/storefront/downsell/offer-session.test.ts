import { describe, expect, it } from 'vitest';
import { canPresent, chosenOfferCoupon, chooseOfferCoupon, markPresented, offerDue, offerPage } from './offer-session';
function storage() { const map = new Map<string, string>(); return { getItem: (key: string) => map.get(key) ?? null, setItem: (key: string, value: string) => { map.set(key, value); }, removeItem: (key: string) => { map.delete(key); } }; }
describe('optional discount presentation', () => {
  it('protects checkout and account routes while allowing shopping routes', () => {
    for (const path of ['/', '/products/bag', '/collections/bags', '/cart', '/search']) expect(offerPage(path)).toBe(true);
    for (const path of ['/checkout', '/checkout/thank-you', '/account', '/auth/login', '/orders/123', '/payment/return', '/funnels/offer']) expect(offerPage(path)).toBe(false);
  });
  it('enforces minimum engagement and separates timed and desktop exit triggers', () => {
    expect(offerDue('both', 'exit', 4999, 30, 5)).toBe(false);expect(offerDue('both', 'exit', 5000, 30, 5)).toBe(true);
    expect(offerDue('both', 'timer', 29999, 30, 5)).toBe(false);expect(offerDue('timer', 'timer', 30000, 30, 5)).toBe(true);
    expect(offerDue('exit', 'timer', 60000, 30, 5)).toBe(false);expect(offerDue('timer', 'exit', 60000, 30, 5)).toBe(false);
    expect(offerDue('both', 'timer', 2000, 1, 5)).toBe(false);
  });
  it('shares frequency within a store and preserves scope and clock regression safety', () => {
    const target = storage();const scope = { id: 'frequency-store', baseCurrency: 'EGP' };
    expect(canPresent(scope, 2, 24, 1000, target)).toBe(true);markPresented(scope, 2, 1000, target);
    expect(canPresent(scope, 2, 24, 999, target)).toBe(false);expect(canPresent(scope, 2, 24, 3601000, target)).toBe(false);
    expect(canPresent(scope, 2, 24, 86401000, target)).toBe(true);
    expect(canPresent({ ...scope, id: 'other' }, 2, 24, 1000, target)).toBe(true);
  });
  it('carries only a chosen code to the same store checkout and expires it', () => {
    const target = storage();const scope = { id: 'choice-store', baseCurrency: 'EGP' };chooseOfferCoupon(scope, 'RETURN10', 1000, target);
    expect(chosenOfferCoupon(scope, 1001, target)).toBe('RETURN10');expect(chosenOfferCoupon(scope, 86401000, target)).toBe('');
    expect(chosenOfferCoupon({ ...scope, id: 'another' }, 1001, target)).toBe('');expect(chosenOfferCoupon({ ...scope, baseCurrency: 'USD' }, 1001, target)).toBe('');
  });
  it('survives unavailable browser storage without allowing repeated presentations', () => {
    const denied = { getItem: () => { throw Error('blocked'); }, setItem: () => { throw Error('blocked'); }, removeItem: () => { throw Error('blocked'); } };const scope = { id: 'private-mode', baseCurrency: 'EGP' };
    markPresented(scope, 1, 1000, denied);expect(canPresent(scope, 1, 24, 1001, denied)).toBe(false);
    chooseOfferCoupon(scope, 'SAFE', 1000, denied);expect(chosenOfferCoupon(scope, 1001, denied)).toBe('SAFE');
  });
});
