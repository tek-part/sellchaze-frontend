/**
 * Catalog filtering — one engine for every theme.
 *
 * Client-side by necessity: `GET /storefront/products` accepts only `category` and `per_page`
 * (StorefrontProductController), so there is no server-side facet API to delegate to. This narrows
 * the page the client already holds. When the API gains facet parameters, `applyFilters` becomes
 * the fallback and `FilterState` maps straight onto the query string — the shapes below were chosen
 * so that swap needs no UI change.
 *
 * Facets are DERIVED from the products present, never hardcoded. A field no product carries yields
 * no facet group, so the panel can never advertise a filter that would return nothing. That also
 * means the same code produces a rich panel for a demo catalogue and a minimal one for a sparse
 * live store, without either being wrong.
 */
import type { ProductCardModel } from '../types/catalog';

/* ------------------------------------------------------------------ state */

export interface PriceRange {
  min: number;
  max: number;
}

export interface FilterState {
  categories: ReadonlyArray<string>;
  brands: ReadonlyArray<string>;
  colors: ReadonlyArray<string>;
  sizes: ReadonlyArray<string>;
  materials: ReadonlyArray<string>;
  tags: ReadonlyArray<string>;
  /** Minimum average rating, e.g. 4 means "4 stars and up". */
  minRating?: number;
  /** Minimum discount percentage, e.g. 20 means "20% off or more". */
  minDiscount?: number;
  price?: PriceRange;
  inStockOnly: boolean;
  onSaleOnly: boolean;
}

export const EMPTY_FILTERS: FilterState = {
  categories: [],
  brands: [],
  colors: [],
  sizes: [],
  materials: [],
  tags: [],
  inStockOnly: false,
  onSaleOnly: false,
};

/** Multi-select facet keys — the ones that behave identically, so callers can loop rather than branch. */
export const LIST_FACETS = ['categories', 'brands', 'colors', 'sizes', 'materials', 'tags'] as const;
export type ListFacetKey = (typeof LIST_FACETS)[number];

/* ------------------------------------------------------------------ derivation */

export interface FacetOption {
  value: string;
  label: string;
  count: number;
  /** Swatch colour, present only on the colour facet. */
  swatch?: string;
}

export interface Facets {
  categories: ReadonlyArray<FacetOption>;
  brands: ReadonlyArray<FacetOption>;
  colors: ReadonlyArray<FacetOption>;
  sizes: ReadonlyArray<FacetOption>;
  materials: ReadonlyArray<FacetOption>;
  tags: ReadonlyArray<FacetOption>;
  /** Full price span of the unfiltered set, used to bound the slider. */
  priceBounds: PriceRange;
  ratings: ReadonlyArray<FacetOption>;
  discounts: ReadonlyArray<FacetOption>;
  inStockCount: number;
  onSaleCount: number;
}

function tally(
  products: ReadonlyArray<ProductCardModel>,
  pick: (p: ProductCardModel) => ReadonlyArray<{ value: string; label: string; swatch?: string }>,
): ReadonlyArray<FacetOption> {
  const map = new Map<string, FacetOption>();
  for (const product of products) {
    for (const item of pick(product)) {
      const existing = map.get(item.value);
      if (existing) {
        map.set(item.value, { ...existing, count: existing.count + 1 });
      } else {
        map.set(item.value, {
          value: item.value,
          label: item.label,
          count: 1,
          ...(item.swatch ? { swatch: item.swatch } : {}),
        });
      }
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

/** Percentage saved against the compare-at price, or 0 when not discounted. */
export function discountPercent(product: ProductCardModel): number {
  const was = product.compareAtPrice;
  if (!was || was <= product.price) return 0;
  return Math.round(((was - product.price) / was) * 100);
}

export function deriveFacets(products: ReadonlyArray<ProductCardModel>): Facets {
  const prices = products.map((p) => p.price).filter((n) => Number.isFinite(n));
  const priceBounds: PriceRange = {
    min: prices.length > 0 ? Math.floor(Math.min(...prices)) : 0,
    max: prices.length > 0 ? Math.ceil(Math.max(...prices)) : 0,
  };

  const ratingThresholds = [4.5, 4, 3.5, 3];
  const ratings = ratingThresholds
    .map((threshold) => ({
      value: String(threshold),
      label: `${threshold} stars & up`,
      count: products.filter((p) => (p.rating ?? 0) >= threshold).length,
    }))
    .filter((o) => o.count > 0);

  const discountThresholds = [10, 20, 30, 50];
  const discounts = discountThresholds
    .map((threshold) => ({
      value: String(threshold),
      label: `${threshold}% or more`,
      count: products.filter((p) => discountPercent(p) >= threshold).length,
    }))
    .filter((o) => o.count > 0);

  return {
    categories: tally(products, (p) =>
      p.categorySlug ? [{ value: p.categorySlug, label: p.categoryName ?? p.categorySlug }] : [],
    ),
    brands: tally(products, (p) => (p.vendor ? [{ value: p.vendor, label: p.vendor }] : [])),
    colors: tally(products, (p) =>
      (p.colors ?? []).map((c) => ({ value: c.value, label: c.label, swatch: c.color })),
    ),
    sizes: tally(products, (p) => (p.sizes ?? []).map((s) => ({ value: s, label: s }))),
    materials: tally(products, (p) => (p.material ? [{ value: p.material, label: p.material }] : [])),
    tags: tally(products, (p) => (p.tags ?? []).map((t) => ({ value: t, label: t }))),
    priceBounds,
    ratings,
    discounts,
    inStockCount: products.filter((p) => !p.soldOut).length,
    onSaleCount: products.filter((p) => discountPercent(p) > 0).length,
  };
}

/* ------------------------------------------------------------------ application */

function matchesList(selected: ReadonlyArray<string>, values: ReadonlyArray<string>): boolean {
  // An empty selection is "no constraint", not "match nothing".
  if (selected.length === 0) return true;
  return selected.some((s) => values.includes(s));
}

export function applyFilters(
  products: ReadonlyArray<ProductCardModel>,
  filters: FilterState,
): ReadonlyArray<ProductCardModel> {
  return products.filter((p) => {
    if (!matchesList(filters.categories, p.categorySlug ? [p.categorySlug] : [])) return false;
    if (!matchesList(filters.brands, p.vendor ? [p.vendor] : [])) return false;
    if (!matchesList(filters.colors, (p.colors ?? []).map((c) => c.value))) return false;
    if (!matchesList(filters.sizes, p.sizes ?? [])) return false;
    if (!matchesList(filters.materials, p.material ? [p.material] : [])) return false;
    if (!matchesList(filters.tags, p.tags ?? [])) return false;
    if (filters.minRating !== undefined && (p.rating ?? 0) < filters.minRating) return false;
    if (filters.minDiscount !== undefined && discountPercent(p) < filters.minDiscount) return false;
    if (filters.inStockOnly && p.soldOut) return false;
    if (filters.onSaleOnly && discountPercent(p) === 0) return false;
    if (filters.price && (p.price < filters.price.min || p.price > filters.price.max)) return false;
    return true;
  });
}

/** Number of distinct constraints applied — drives the "Filters (3)" badge. */
export function activeFilterCount(filters: FilterState): number {
  let n = 0;
  for (const key of LIST_FACETS) n += filters[key].length;
  if (filters.minRating !== undefined) n += 1;
  if (filters.minDiscount !== undefined) n += 1;
  if (filters.price) n += 1;
  if (filters.inStockOnly) n += 1;
  if (filters.onSaleOnly) n += 1;
  return n;
}

export interface FilterChip {
  /** Stable id for the remove handler. */
  id: string;
  label: string;
  facet: ListFacetKey | 'minRating' | 'minDiscount' | 'price' | 'inStockOnly' | 'onSaleOnly';
  value?: string;
}

/** Flatten the state into individually-removable chips. */
export function filterChips(filters: FilterState, currency: string): ReadonlyArray<FilterChip> {
  const chips: FilterChip[] = [];
  const labels: Record<ListFacetKey, string> = {
    categories: 'Category',
    brands: 'Brand',
    colors: 'Colour',
    sizes: 'Size',
    materials: 'Material',
    tags: 'Tag',
  };
  for (const facet of LIST_FACETS) {
    for (const value of filters[facet]) {
      chips.push({ id: `${facet}:${value}`, label: `${labels[facet]}: ${value}`, facet, value });
    }
  }
  if (filters.minRating !== undefined) {
    chips.push({ id: 'minRating', label: `${filters.minRating} stars & up`, facet: 'minRating' });
  }
  if (filters.minDiscount !== undefined) {
    chips.push({ id: 'minDiscount', label: `${filters.minDiscount}% off or more`, facet: 'minDiscount' });
  }
  if (filters.price) {
    const fmt = (n: number): string => `${currency === 'USD' ? '$' : ''}${Math.round(n)}`;
    chips.push({ id: 'price', label: `${fmt(filters.price.min)} – ${fmt(filters.price.max)}`, facet: 'price' });
  }
  if (filters.inStockOnly) chips.push({ id: 'inStockOnly', label: 'In stock', facet: 'inStockOnly' });
  if (filters.onSaleOnly) chips.push({ id: 'onSaleOnly', label: 'On sale', facet: 'onSaleOnly' });
  return chips;
}

/** Remove one chip, returning fresh state. */
export function removeChip(filters: FilterState, chip: FilterChip): FilterState {
  switch (chip.facet) {
    case 'minRating': {
      const { minRating: _drop, ...rest } = filters;
      return { ...rest };
    }
    case 'minDiscount': {
      const { minDiscount: _drop, ...rest } = filters;
      return { ...rest };
    }
    case 'price': {
      const { price: _drop, ...rest } = filters;
      return { ...rest };
    }
    case 'inStockOnly':
      return { ...filters, inStockOnly: false };
    case 'onSaleOnly':
      return { ...filters, onSaleOnly: false };
    default:
      return { ...filters, [chip.facet]: filters[chip.facet].filter((v) => v !== chip.value) };
  }
}

/** Toggle one value in a multi-select facet. */
export function toggleFacetValue(filters: FilterState, facet: ListFacetKey, value: string): FilterState {
  const current = filters[facet];
  return {
    ...filters,
    [facet]: current.includes(value) ? current.filter((v) => v !== value) : [...current, value],
  };
}

/* ------------------------------------------------------------------ URL sync */

const PARAM: Record<ListFacetKey, string> = {
  categories: 'cat',
  brands: 'brand',
  colors: 'color',
  sizes: 'size',
  materials: 'material',
  tags: 'tag',
};

/**
 * Serialise to URL params so a filtered view is shareable, survives refresh and works with browser
 * back/forward. Only non-default values are written, keeping clean URLs for the unfiltered case.
 */
export function filtersToParams(filters: FilterState, base?: URLSearchParams): URLSearchParams {
  const params = new URLSearchParams(base ? base.toString() : undefined);
  for (const facet of LIST_FACETS) {
    params.delete(PARAM[facet]);
    if (filters[facet].length > 0) params.set(PARAM[facet], filters[facet].join(','));
  }
  params.delete('rating');
  params.delete('discount');
  params.delete('price');
  params.delete('stock');
  params.delete('sale');
  if (filters.minRating !== undefined) params.set('rating', String(filters.minRating));
  if (filters.minDiscount !== undefined) params.set('discount', String(filters.minDiscount));
  if (filters.price) params.set('price', `${Math.round(filters.price.min)}-${Math.round(filters.price.max)}`);
  if (filters.inStockOnly) params.set('stock', '1');
  if (filters.onSaleOnly) params.set('sale', '1');
  return params;
}

function parseList(raw: string | null): ReadonlyArray<string> {
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Parse URL params back into state. Malformed values are ignored, never thrown on. */
export function filtersFromParams(params: URLSearchParams): FilterState {
  const state: FilterState = {
    categories: parseList(params.get(PARAM.categories)),
    brands: parseList(params.get(PARAM.brands)),
    colors: parseList(params.get(PARAM.colors)),
    sizes: parseList(params.get(PARAM.sizes)),
    materials: parseList(params.get(PARAM.materials)),
    tags: parseList(params.get(PARAM.tags)),
    inStockOnly: params.get('stock') === '1',
    onSaleOnly: params.get('sale') === '1',
  };

  const rating = Number(params.get('rating'));
  const discount = Number(params.get('discount'));
  const priceRaw = params.get('price');
  const priceMatch = priceRaw ? /^(\d+)-(\d+)$/.exec(priceRaw) : null;

  return {
    ...state,
    ...(Number.isFinite(rating) && rating > 0 ? { minRating: rating } : {}),
    ...(Number.isFinite(discount) && discount > 0 ? { minDiscount: discount } : {}),
    ...(priceMatch && Number(priceMatch[1]) <= Number(priceMatch[2])
      ? { price: { min: Number(priceMatch[1]), max: Number(priceMatch[2]) } }
      : {}),
  };
}
