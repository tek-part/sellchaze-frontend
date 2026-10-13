import { describe, expect, it } from 'vitest';
import { customerAuthLink, customerAuthReturn } from './auth-return';
describe('customer auth return', () => {
  it('keeps the product return when switching auth pages and discards unsafe destinations', () => {
    expect(customerAuthLink('/register', '?next=%2Fproducts%2Fa%23reviews')).toBe('/register?next=%2Fproducts%2Fa%23reviews');
    expect(customerAuthLink('/login', '?next=https://other.test/')).toBe('/login');
  });
  it('returns to the product or checkout after signing in', () => {
    expect(customerAuthReturn('?next=%2Fproducts%2Fcotton-shirt%23reviews')).toBe('/products/cotton-shirt#reviews');
    expect(customerAuthReturn('?next=%2Fcheckout%3Fpreview%3D1')).toBe('/checkout?preview=1');
  });
  it.each(['https://other.test/products/a', '//other.test/products/a', '/\\other.test/products/a', '/api/v1/account', '/store/orders', 'javascript:alert(1)', '/products/a\n'])('rejects non-product or external destination %s', next => {
    expect(customerAuthReturn(`?next=${encodeURIComponent(next)}`)).toBe('/account');
  });
});
