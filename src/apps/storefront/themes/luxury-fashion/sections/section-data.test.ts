import { describe, expect, it } from 'vitest';
import {
  categoriesFor,
  currencyOf,
  isLoading,
  pageHeaderOf,
  productDetailOf,
  productsFor,
} from './section-data';
import type { StorefrontContext } from '../../../theme-engine/rendering';

function ctx(data: Record<string, unknown>): StorefrontContext {
  return {
    store: { name: 'S', currency: 'GBP' },
    seo: {},
    navigation: { header: [], footer: [] },
    data,
  };
}

describe('section-data readers', () => {
  it('productsFor reads a named collection by source, else the default list', () => {
    const context = ctx({
      products: [{ id: '1' }],
      collections: { newest: [{ id: 'n1' }, { id: 'n2' }] },
    });
    expect(productsFor(context, 'newest')).toHaveLength(2);
    expect(productsFor(context, 'missing')).toEqual([{ id: '1' }]);
    expect(productsFor(context)).toEqual([{ id: '1' }]);
  });

  it('returns empty arrays for absent/malformed data (never throws)', () => {
    const context = ctx({});
    expect(productsFor(context, 'x')).toEqual([]);
    expect(categoriesFor(context)).toEqual([]);
    expect(productDetailOf(context)).toBeNull();
    expect(pageHeaderOf(context)).toEqual({});
  });

  it('isLoading + currencyOf reflect context', () => {
    expect(isLoading(ctx({ loading: true }))).toBe(true);
    expect(isLoading(ctx({}))).toBe(false);
    expect(currencyOf(ctx({}))).toBe('GBP');
  });
});
