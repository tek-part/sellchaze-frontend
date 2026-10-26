import { describe, expect, it } from 'vitest';
import { dismissSocialProof, socialProofAllowed, socialProofDismissed, socialProofPage, socialProofSentence, socialProofTime, socialProofWho } from './social-proof';

const event = { initial: 'M', city: 'Cairo', minutes_ago: 5, product: { id: 1, name: 'Leather bag', slug: 'bag', image_url: null } };

describe('social proof helpers', () => {
  it('maps storefront paths to pages and never to checkout or account pages', () => {
    expect(socialProofPage('/')).toBe('home');
    expect(socialProofPage('/products/bag')).toBe('product');
    expect(socialProofPage('/collections/new')).toBe('collection');
    expect(socialProofPage('/categories/bags')).toBe('collection');
    expect(socialProofPage('/cart')).toBe('cart');
    for (const path of ['/checkout', '/checkout/success', '/account', '/products/bag/reviews']) expect(socialProofPage(path)).toBeNull();
    expect(socialProofAllowed({ pages: { home: true, cart: false } }, '/')).toBe(true);
    expect(socialProofAllowed({ pages: { home: true, cart: false } }, '/cart')).toBe(false);
  });

  it('describes anonymised events in English and Arabic', () => {
    expect(socialProofSentence(event, 'en')).toBe('M. in Cairo bought Leather bag');
    expect(socialProofSentence(event, 'ar')).toBe('M. من Cairo اشترى Leather bag');
    expect(socialProofWho({ initial: null, city: 'Cairo' }, 'en')).toBe('Someone in Cairo');
    expect(socialProofWho({ initial: null, city: null }, 'ar')).toBe('شخص');
    expect(socialProofWho({ initial: 'س', city: null }, 'ar')).toBe('س.');
  });

  it('formats relative times and hides them when the merchant turned time off', () => {
    expect(socialProofTime(5, 'en')).toBe('5 minutes ago');
    expect(socialProofTime(120, 'en')).toBe('2 hours ago');
    expect(socialProofTime(2880, 'en')).toBe('2 days ago');
    expect(socialProofTime(null, 'en')).toBe('');
    expect(socialProofTime(5, 'ar')).not.toBe('');
  });

  it('remembers a dismissal per store for the browsing session', () => {
    const values = new Map<string, string>();
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
    expect(socialProofDismissed('store-a', storage)).toBe(false);
    dismissSocialProof('store-a', storage);
    expect(socialProofDismissed('store-a', storage)).toBe(true);
    expect(socialProofDismissed('store-b', storage)).toBe(false);
  });
});
