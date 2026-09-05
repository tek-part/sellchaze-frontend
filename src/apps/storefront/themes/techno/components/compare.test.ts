import { describe, expect, it } from 'vitest';
import type { ProductCardModel } from '../../../types/catalog';
import { productSpecs } from './compare';

const base: ProductCardModel = { id: '1', handle: 'p', title: 'Product', url: '/products/p', price: 100, currency: 'SAR' };

describe('techno productSpecs', () => {
  it('prefers material, then sizes, then tags — max three, deduped, hyphens humanised', () => {
    expect(productSpecs({ ...base, material: 'Aluminium', sizes: ['13"', '14"', '16"'], tags: ['warranty-2yr'] })).toEqual(['Aluminium', '13"', '14"']);
    expect(productSpecs({ ...base, tags: ['warranty-2yr', 'pro_grade', 'warranty-2yr'] })).toEqual(['warranty 2yr', 'pro grade']);
  });
  it('renders nothing for a bare product', () => {
    expect(productSpecs(base)).toEqual([]);
  });
});
