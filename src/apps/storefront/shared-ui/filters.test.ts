/**
 * Filter engine. The failure modes here are silent — a wrong predicate hides products rather than
 * throwing — so the semantics are pinned explicitly, especially "empty selection means no
 * constraint" and the URL round-trip that back/forward navigation depends on.
 */
import { describe, expect, it } from 'vitest';
import type { ProductCardModel } from '../types/catalog';
import {
  EMPTY_FILTERS,
  activeFilterCount,
  applyFilters,
  deriveFacets,
  discountPercent,
  filterChips,
  filtersFromParams,
  filtersToParams,
  removeChip,
  toggleFacetValue,
} from './filters';

const p = (over: Partial<ProductCardModel> & { id: string; price: number }): ProductCardModel => ({
  handle: over.id,
  title: over.id,
  url: `/products/${over.id}`,
  currency: 'USD',
  ...over,
});

const CATALOG: ReadonlyArray<ProductCardModel> = [
  p({ id: 'a', price: 100, vendor: 'Acme', rating: 4.8, categorySlug: 'coats', categoryName: 'Coats', material: 'Wool', sizes: ['S', 'M'], tags: ['new'], colors: [{ value: 'Black', label: 'Black', color: '#000' }] }),
  p({ id: 'b', price: 200, compareAtPrice: 400, vendor: 'Beta', rating: 4.2, categorySlug: 'coats', categoryName: 'Coats', material: 'Linen', sizes: ['M'], tags: ['sale'] }),
  p({ id: 'c', price: 300, vendor: 'Acme', rating: 3.1, categorySlug: 'bags', categoryName: 'Bags', soldOut: true, sizes: ['L'] }),
  p({ id: 'd', price: 50, compareAtPrice: 55, vendor: 'Gamma', rating: 5, categorySlug: 'bags', categoryName: 'Bags' }),
];

describe('discountPercent', () => {
  it('computes the saving and ignores absent or invalid compare-at prices', () => {
    expect(discountPercent(CATALOG[1]!)).toBe(50);
    expect(discountPercent(CATALOG[0]!)).toBe(0);
    expect(discountPercent(p({ id: 'x', price: 100, compareAtPrice: 80 }))).toBe(0);
  });
});

describe('deriveFacets', () => {
  const f = deriveFacets(CATALOG);

  it('derives only facets the data actually supports', () => {
    expect(f.brands.map((o) => o.value).sort()).toEqual(['Acme', 'Beta', 'Gamma']);
    expect(f.categories.map((o) => o.value).sort()).toEqual(['bags', 'coats']);
    // Only one product carries a colour, so the facet exists but is short.
    expect(f.colors).toHaveLength(1);
  });

  it('produces no group for a dimension no product carries', () => {
    const bare = deriveFacets([p({ id: 'z', price: 10 })]);
    expect(bare.colors).toEqual([]);
    expect(bare.materials).toEqual([]);
    expect(bare.tags).toEqual([]);
    expect(bare.categories).toEqual([]);
  });

  it('counts occurrences and orders by frequency', () => {
    expect(f.brands[0]).toMatchObject({ value: 'Acme', count: 2 });
  });

  it('bounds price to the real span', () => {
    expect(f.priceBounds).toEqual({ min: 50, max: 300 });
  });

  it('only offers rating and discount thresholds that match something', () => {
    expect(f.ratings.every((o) => o.count > 0)).toBe(true);
    expect(f.discounts.map((o) => o.value)).toContain('50');
  });

  it('counts stock and sale', () => {
    expect(f.inStockCount).toBe(3);
    expect(f.onSaleCount).toBe(2);
  });

  it('survives an empty catalogue', () => {
    const empty = deriveFacets([]);
    expect(empty.priceBounds).toEqual({ min: 0, max: 0 });
    expect(empty.inStockCount).toBe(0);
  });
});

describe('applyFilters', () => {
  it('treats an empty selection as no constraint, not as match-nothing', () => {
    expect(applyFilters(CATALOG, EMPTY_FILTERS)).toHaveLength(4);
  });

  it('ORs within a facet and ANDs across facets', () => {
    const within = applyFilters(CATALOG, { ...EMPTY_FILTERS, brands: ['Acme', 'Beta'] });
    expect(within.map((x) => x.id)).toEqual(['a', 'b', 'c']);

    const across = applyFilters(CATALOG, { ...EMPTY_FILTERS, brands: ['Acme'], categories: ['bags'] });
    expect(across.map((x) => x.id)).toEqual(['c']);
  });

  it('filters by price range inclusively', () => {
    const r = applyFilters(CATALOG, { ...EMPTY_FILTERS, price: { min: 100, max: 200 } });
    expect(r.map((x) => x.id)).toEqual(['a', 'b']);
  });

  it('filters by minimum rating and minimum discount', () => {
    expect(applyFilters(CATALOG, { ...EMPTY_FILTERS, minRating: 4.5 }).map((x) => x.id)).toEqual(['a', 'd']);
    expect(applyFilters(CATALOG, { ...EMPTY_FILTERS, minDiscount: 20 }).map((x) => x.id)).toEqual(['b']);
  });

  it('filters by availability and sale', () => {
    expect(applyFilters(CATALOG, { ...EMPTY_FILTERS, inStockOnly: true }).map((x) => x.id)).toEqual(['a', 'b', 'd']);
    expect(applyFilters(CATALOG, { ...EMPTY_FILTERS, onSaleOnly: true }).map((x) => x.id)).toEqual(['b', 'd']);
  });

  it('excludes products missing the filtered dimension entirely', () => {
    // 'd' has no sizes; filtering by size must not include it.
    expect(applyFilters(CATALOG, { ...EMPTY_FILTERS, sizes: ['M'] }).map((x) => x.id)).toEqual(['a', 'b']);
  });

  it('can legitimately return nothing', () => {
    expect(applyFilters(CATALOG, { ...EMPTY_FILTERS, brands: ['Acme'], minRating: 5 })).toEqual([]);
  });
});

describe('chips and counts', () => {
  const filters = {
    ...EMPTY_FILTERS,
    brands: ['Acme', 'Beta'],
    minRating: 4,
    price: { min: 10, max: 90 },
    inStockOnly: true,
  };

  it('counts every distinct constraint', () => {
    expect(activeFilterCount(EMPTY_FILTERS)).toBe(0);
    expect(activeFilterCount(filters)).toBe(5);
  });

  it('produces one removable chip per constraint', () => {
    const chips = filterChips(filters, 'USD');
    expect(chips).toHaveLength(5);
    expect(chips.map((c) => c.id)).toContain('brands:Acme');
  });

  it('removes exactly one value without disturbing the rest', () => {
    const chips = filterChips(filters, 'USD');
    const next = removeChip(filters, chips.find((c) => c.id === 'brands:Acme')!);
    expect(next.brands).toEqual(['Beta']);
    expect(next.minRating).toBe(4);
  });

  it('removing a scalar constraint clears it entirely', () => {
    const chips = filterChips(filters, 'USD');
    expect(removeChip(filters, chips.find((c) => c.id === 'minRating')!).minRating).toBeUndefined();
    expect(removeChip(filters, chips.find((c) => c.id === 'price')!).price).toBeUndefined();
    expect(removeChip(filters, chips.find((c) => c.id === 'inStockOnly')!).inStockOnly).toBe(false);
  });

  it('toggles a facet value on and off', () => {
    const on = toggleFacetValue(EMPTY_FILTERS, 'tags', 'new');
    expect(on.tags).toEqual(['new']);
    expect(toggleFacetValue(on, 'tags', 'new').tags).toEqual([]);
  });
});

describe('URL round-trip', () => {
  it('writes nothing for the unfiltered state, keeping URLs clean', () => {
    expect(filtersToParams(EMPTY_FILTERS).toString()).toBe('');
  });

  it('round-trips a full state', () => {
    const filters = {
      ...EMPTY_FILTERS,
      categories: ['coats'],
      brands: ['Acme', 'Beta'],
      colors: ['Black'],
      sizes: ['M'],
      materials: ['Wool'],
      tags: ['new'],
      minRating: 4,
      minDiscount: 20,
      price: { min: 10, max: 90 },
      inStockOnly: true,
      onSaleOnly: true,
    };
    expect(filtersFromParams(filtersToParams(filters))).toEqual(filters);
  });

  it('preserves unrelated params such as sort and page', () => {
    const base = new URLSearchParams('sort=price-asc&page=3');
    const out = filtersToParams({ ...EMPTY_FILTERS, brands: ['Acme'] }, base);
    expect(out.get('sort')).toBe('price-asc');
    expect(out.get('page')).toBe('3');
  });

  it('drops params for constraints that were removed', () => {
    const base = filtersToParams({ ...EMPTY_FILTERS, brands: ['Acme'], inStockOnly: true });
    const cleared = filtersToParams(EMPTY_FILTERS, base);
    expect(cleared.get('brand')).toBeNull();
    expect(cleared.get('stock')).toBeNull();
  });

  it('ignores malformed values rather than throwing', () => {
    const bad = filtersFromParams(new URLSearchParams('rating=abc&discount=-5&price=900-100&brand=,,'));
    expect(bad.minRating).toBeUndefined();
    expect(bad.minDiscount).toBeUndefined();
    expect(bad.price).toBeUndefined();
    expect(bad.brands).toEqual([]);
  });
});
