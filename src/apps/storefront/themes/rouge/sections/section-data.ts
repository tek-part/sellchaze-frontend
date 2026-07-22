/**
 * Rouge — fail-safe readers over StorefrontContext.data (the shared storefront data contract the
 * pages provide). Rouge's own copy; reads shared catalog view-models. Empty on absent/malformed data
 * so sections show empty/skeleton states rather than crashing.
 */
import type { StorefrontContext } from '../../../theme-engine/rendering';
import type { CategoryCardModel, ProductCardModel, ProductDetailModel, ReviewModel } from '../../../types/catalog';

interface Data {
  products?: ReadonlyArray<ProductCardModel>;
  collections?: Readonly<Record<string, ReadonlyArray<ProductCardModel>>>;
  categories?: ReadonlyArray<CategoryCardModel>;
  loading?: boolean;
  /** Fetch failure surfaced by the page. Sections render an error state instead of nothing. */
  error?: unknown;
  product?: ProductDetailModel;
  reviews?: ReadonlyArray<ReviewModel>;
  pageHeader?: { title?: string; description?: string; image?: string; breadcrumbs?: ReadonlyArray<{ label: string; url: string }> };
}
function bag(context: StorefrontContext): Data {
  return context.data as Data;
}
function asArray<T>(v: unknown): ReadonlyArray<T> {
  return Array.isArray(v) ? (v as ReadonlyArray<T>) : [];
}
export function productsFor(context: StorefrontContext, source?: string): ReadonlyArray<ProductCardModel> {
  const d = bag(context);
  if (source && d.collections && Array.isArray(d.collections[source])) return d.collections[source] as ReadonlyArray<ProductCardModel>;
  return asArray(d.products);
}
export function categoriesFor(context: StorefrontContext): ReadonlyArray<CategoryCardModel> {
  return asArray(bag(context).categories);
}
export function isLoading(context: StorefrontContext): boolean {
  return bag(context).loading === true;
}
export function currencyOf(context: StorefrontContext): string {
  return context.store.currency || 'USD';
}
export function pageHeaderOf(context: StorefrontContext): NonNullable<Data['pageHeader']> {
  return bag(context).pageHeader ?? {};
}
export function productDetailOf(context: StorefrontContext): ProductDetailModel | null {
  const v = bag(context).product;
  return v && typeof v === 'object' ? v : null;
}
export function reviewsFor(context: StorefrontContext): ReadonlyArray<ReviewModel> {
  return asArray(bag(context).reviews);
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
