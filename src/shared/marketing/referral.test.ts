import { describe, expect, it } from 'vitest';
import { buildReferralUrl, cleanReferral, referralFromSearch } from './referral';

describe('product referral links', () => {
  it('keeps Unicode marketer codes and excludes path escapes, controls and oversized labels', () => {
    expect(referralFromSearch('?ref=%D9%85%D8%B3%D9%88%D9%82_1&variant=12', 7)).toEqual({ code: 'مسوق_1', product_id: 7 });
    for (const code of ['a/b', '<script>', 'a\nprivate', 'a'.repeat(101), '']) expect(cleanReferral({ code, product_id: 7 })).toBeUndefined();
    expect(referralFromSearch('?ref=one&ref=two', 7)).toBeUndefined();
    expect(cleanReferral({ code: 'one', product_id: -1 })).toBeUndefined();
    expect(cleanReferral({ code: 'one', product_id: 1.5 })).toBeUndefined();
  });
  it('creates the observed product/ref/code path only on a usable public origin', () => {
    expect(buildReferralUrl('https://shop.example.com/?private=discard#details', 7, 'ref_1')).toBe('https://shop.example.com/products/7/ref/ref_1');
    expect(new URL(buildReferralUrl('https://shop.example.com/', 7, 'مسوق_1')!).pathname).toBe('/products/7/ref/%D9%85%D8%B3%D9%88%D9%82_1');
    for (const url of ['javascript:alert(1)', 'https://user:password@example.com', 'broken']) expect(buildReferralUrl(url, 7, 'ref_1')).toBeUndefined();
    expect(buildReferralUrl('https://shop.example.com/', 0, 'ref_1')).toBeUndefined();
  });
  it('projects only a bounded code and stable source product, never arbitrary contact or URL fields', () => {
    expect(cleanReferral({ code: 'one', product_id: 7, contact: 'PRIVATE', url: 'PRIVATE' })).toEqual({ code: 'one', product_id: 7 });
  });
});
