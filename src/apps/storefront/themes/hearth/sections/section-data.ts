/**
 * Fail-safe readers over `StorefrontContext.data` (the frozen internal data contract). Sections read
 * ONLY through these, so a page whose data hasn't loaded (or an endpoint that returns nothing) yields
 * an empty array and the section shows its skeleton/empty state rather than crashing (engine I2). The
 * app populates `context.data` with the shared catalog view-models in the API phase.
 */
import type { StorefrontContext } from '../../../theme-engine/rendering';
import type { CategoryCardModel, ProductCardModel, ProductDetailModel } from '../../../types/catalog';

interface DataBag {
  products?: ReadonlyArray<ProductCardModel>;
  collections?: Readonly<Record<string, ReadonlyArray<ProductCardModel>>>;
  categories?: ReadonlyArray<CategoryCardModel>;
  product?: ProductDetailModel;
  loading?: boolean;
  /** Fetch failure surfaced by the page. Sections render an error state instead of nothing. */
  error?: unknown;
  pageHeader?: PageHeaderData;
}

export interface PageHeaderData {
  title?: string;
  description?: string;
  image?: string;
  breadcrumbs?: ReadonlyArray<{ label: string; url: string }>;
}

function bag(context: StorefrontContext): DataBag {
  return context.data as DataBag;
}

function asArray<T>(value: unknown): ReadonlyArray<T> {
  return Array.isArray(value) ? (value as ReadonlyArray<T>) : [];
}

/** Products for a section, optionally from a named set (`source`: "featured"/"newest"/…). */
export function productsFor(context: StorefrontContext, source?: string): ReadonlyArray<ProductCardModel> {
  const data = bag(context);
  if (source && data.collections && Array.isArray(data.collections[source])) {
    return data.collections[source] as ReadonlyArray<ProductCardModel>;
  }
  return asArray(data.products);
}

export function categoriesFor(context: StorefrontContext): ReadonlyArray<CategoryCardModel> {
  return asArray(bag(context).categories);
}

export function productDetailOf(context: StorefrontContext): ProductDetailModel | null {
  const value = bag(context).product;
  return value && typeof value === 'object' ? value : null;
}

export function pageHeaderOf(context: StorefrontContext): PageHeaderData {
  const value = bag(context).pageHeader;
  return value && typeof value === 'object' ? value : {};
}

export function isLoading(context: StorefrontContext): boolean {
  return bag(context).loading === true;
}

export function currencyOf(context: StorefrontContext): string {
  return context.store.currency || 'USD';
}

/**
 * True when the page reported a fetch failure. Before this existed, error was not representable in
 * the data contract at all: sections could only distinguish "loading" from "empty", so a failed
 * request rendered a silently blank region with nothing to announce.
 */
export function hasError(context: StorefrontContext): boolean {
  return bag(context).error != null;
}

/** Human-readable failure text, falling back to a calm generic line. */
export function errorMessage(context: StorefrontContext): string {
  const e = bag(context).error;
  if (typeof e === 'string' && e.trim()) return e;
  if (e instanceof Error && e.message) return e.message;
  return 'We couldn’t load this right now. Please try again.';
}

/**
 * True when the page has NO product data at all — as opposed to this section's named collection
 * simply being absent. Only the former is an error worth showing: a section that asks for
 * `bestsellers` on a page that never supplies it is an empty rail, not a failed request, and
 * rendering "Couldn't load this" there is both wrong and alarming.
 *
 * Checks `collections` as well as `products`. Pages supply one or the other — the home page builds
 * named collections and never sets `products` — so testing only the flat list reported "no data"
 * on a page full of products, which is the bug this helper was added to fix.
 */
export function hasNoProductData(context: StorefrontContext): boolean {
  const d = bag(context);
  if (asArray(d.products).length > 0) return false;
  const collections = d.collections;
  if (collections) {
    for (const key of Object.keys(collections)) {
      if (asArray(collections[key]).length > 0) return false;
    }
  }
  return true;
}
