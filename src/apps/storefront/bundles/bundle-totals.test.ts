import { describe, expect, it } from 'vitest';
import { bundleAvailable, bundleTotals } from './bundle-totals';

const product = (id: number, price: string, available = true) => ({ id, name: `P${id}`, slug: `p${id}`, price, compare_price: null, image_url: null, available });

describe('bundle totals', () => {
  it('discounts the sum of one unit of each product, in the display currency', () => {
    expect(bundleTotals({ discount_percent: 20, products: [product(1, '100.00'), product(2, '50.00')] })).toEqual({ original: 150, discounted: 120, saving: 30 });
    expect(bundleTotals({ discount_percent: 15, products: [product(1, '19.99'), product(2, '5.01')] }, 2)).toEqual({ original: 50, discounted: 42.5, saving: 7.5 });
  });

  it('needs two available products', () => {
    expect(bundleAvailable({ products: [product(1, '1'), product(2, '1')] })).toBe(true);
    expect(bundleAvailable({ products: [product(1, '1'), product(2, '1', false)] })).toBe(false);
    expect(bundleAvailable({ products: [product(1, '1')] })).toBe(false);
  });
});
