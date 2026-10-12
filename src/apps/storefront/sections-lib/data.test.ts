import { describe, expect, it } from 'vitest';
import { productsFromContext } from './data';
import type { StorefrontContext } from '../theme-engine/rendering';
import type { ProductCardModel } from '../types/catalog';

const product: ProductCardModel = { id: '1', handle: 'bag', title: 'Bag', url: '/products/bag', price: 100, currency: 'EGP' };
const context = (collections: StorefrontContext['data']['collections']): StorefrontContext => ({ store: { name: 'Shop', currency: 'EGP' }, seo: {}, navigation: { header: [], footer: [] }, data: { collections, products: [product] } });
describe('authoritative collection contents', () => {
  it('never puts full-price products in an explicitly empty sale collection', () => {
    expect(productsFromContext(context({ sale: [], newest: [product] }), 'sale')).toEqual([]);
  });
  it('preserves a populated explicit collection and an absent-collection fallback', () => {
    expect(productsFromContext(context({ sale: [product] }), 'sale')).toEqual([product]);
    expect(productsFromContext(context({ newest: [product] }), 'featured')).toEqual([product]);
  });
});
