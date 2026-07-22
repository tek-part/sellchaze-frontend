/**
 * The storefront's internal data contract carried on `StorefrontContext.data`, plus fail-safe
 * readers. Sections read ONLY through these, so a page that hasn't loaded a given slice yet (or an
 * endpoint that returns nothing) yields an empty array and the section shows its empty/skeleton
 * state rather than crashing. Phase 6 populates `context.data` from the real API.
 */
import type { StorefrontContext } from '../../../theme-engine/rendering';
import type {
  ArticleCardModel,
  CategoryCardModel,
  CollectionCardModel,
  ProductCardModel,
  ProductDetailModel,
  ReviewModel,
} from '../../../types/catalog';

export interface StorefrontData {
  /** Default product list for the current page (e.g. a category's products). */
  products?: ReadonlyArray<ProductCardModel>;
  /** Named product sets keyed by a `source` setting ("featured", "newest", "bestsellers"…). */
  collections?: Readonly<Record<string, ReadonlyArray<ProductCardModel>>>;
  categories?: ReadonlyArray<CategoryCardModel>;
  featuredCollections?: ReadonlyArray<CollectionCardModel>;
  articles?: ReadonlyArray<ArticleCardModel>;
  testimonials?: ReadonlyArray<ReviewModel>;
  /** True while the page's primary data is loading (drives section skeletons). */
  loading?: boolean;
  /** Fetch failure surfaced by the page. Sections render an error state instead of nothing. */
  error?: unknown;
}

function bag(context: StorefrontContext): StorefrontData {
  return context.data as StorefrontData;
}

function asArray<T>(value: unknown): ReadonlyArray<T> {
  return Array.isArray(value) ? (value as ReadonlyArray<T>) : [];
}

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

export function featuredCollectionsFor(context: StorefrontContext): ReadonlyArray<CollectionCardModel> {
  return asArray(bag(context).featuredCollections);
}

export function articlesFor(context: StorefrontContext): ReadonlyArray<ArticleCardModel> {
  return asArray(bag(context).articles);
}

export function testimonialsFor(context: StorefrontContext): ReadonlyArray<ReviewModel> {
  return asArray(bag(context).testimonials);
}

export function reviewsFor(context: StorefrontContext): ReadonlyArray<ReviewModel> {
  return asArray((bag(context) as { reviews?: unknown }).reviews);
}

export function productDetailOf(context: StorefrontContext): ProductDetailModel | null {
  const value = (bag(context) as { product?: unknown }).product;
  return value && typeof value === 'object' ? (value as ProductDetailModel) : null;
}

export function isLoading(context: StorefrontContext): boolean {
  return bag(context).loading === true;
}

export interface PageHeaderData {
  title?: string;
  description?: string;
  image?: string;
  breadcrumbs?: ReadonlyArray<{ label: string; url: string }>;
}

/** Page-level header info (category/collection title, description, banner, trail). */
export function pageHeaderOf(context: StorefrontContext): PageHeaderData {
  const value = (bag(context) as { pageHeader?: unknown }).pageHeader;
  return (value && typeof value === 'object' ? value : {}) as PageHeaderData;
}

/** Currency for the current store (for Price). */
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
