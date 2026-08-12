/**
 * Storefront catalog view-models — the canonical shapes the theme's cards/sections/pages render
 * from. Deliberately decoupled from any backend payload: Phase 6 maps the real API responses onto
 * these, so the presentation layer never depends on endpoint shapes. Keep these minimal and stable.
 */

export interface ProductImage {
  src: string;
  srcSet?: string;
  sizes?: string;
  alt?: string;
  width?: number;
  height?: number;
}

export interface ProductSwatch {
  value: string;
  label: string;
  /** CSS colour (hex or gradient). */
  color: string;
  available?: boolean;
}

/** Compact product shape a card needs — a projection of the full product. */
export interface ProductCardModel {
  id: string;
  /** URL-safe slug. */
  handle: string;
  title: string;
  /** Canonical product URL. */
  url: string;
  price: number;
  /** Original price when marked down (must be > price to render). */
  compareAtPrice?: number;
  currency: string;
  image?: ProductImage;
  /** Second frame revealed on hover (optional). */
  hoverImage?: ProductImage;
  /** Single merchandising label (New, Limited…). */
  badge?: string;
  soldOut?: boolean;
  rating?: number;
  reviewCount?: number;
  colors?: ReadonlyArray<ProductSwatch>;
  vendor?: string;
  /**
   * Optional facet fields. The storefront API does not expose these today, so they are populated
   * only where a mapper can supply them (and in demo catalogues). Facets derive themselves from the
   * products actually present — a field no product carries produces no filter group rather than an
   * empty one, so the panel never advertises a filter that cannot narrow anything.
   */
  sizes?: ReadonlyArray<string>;
  material?: string;
  tags?: ReadonlyArray<string>;
  /** Slug of the owning category, used by the category facet. */
  categorySlug?: string;
  /** Category display name, paired with `categorySlug`. */
  categoryName?: string;
}

export interface ProductVariantModel {
  id: string;
  label: string;
  price?: number;
  available: boolean;
}

/** A key/value spec row rendered in the PDP "Specs" tab. */
export interface ProductSpec {
  label: string;
  value: string;
}

/** The full product for a PDP — a superset of the card model. */
export interface ProductDetailModel extends ProductCardModel {
  sku?: string;
  descriptionHtml?: string;
  images: ReadonlyArray<ProductImage>;
  variants?: ReadonlyArray<ProductVariantModel>;
  inStock?: boolean;
  lowStock?: boolean;
  /** Key selling points shown as a bullet list in the overview. */
  highlights?: ReadonlyArray<string>;
  /** Normalised spec rows (from specifications/dimensions/material/weight/warranty…). */
  specs?: ReadonlyArray<ProductSpec>;
  /** Per-product "Shipping & returns" copy (falls back to store policy when absent). */
  shippingReturns?: string;
  /** Per-product care instructions. */
  careInstructions?: string;
  warranty?: string;
}

export interface CategoryCardModel {
  id: string;
  title: string;
  url: string;
  image?: ProductImage;
  /** Optional product count / eyebrow copy. */
  meta?: string;
}

export interface CollectionCardModel {
  id: string;
  title: string;
  url: string;
  image?: ProductImage;
  subtitle?: string;
}

export interface BrandModel {
  id: string;
  name: string;
  slug: string;
  url: string;
  logo?: string;
  website?: string;
  productCount?: number;
}

export interface CouponModel {
  code: string;
  /** 'fixed' | 'percentage' */
  type: string;
  value: number;
  minimumOrder?: number;
  expiresAt?: string;
}

export interface ArticleCardModel {
  id: string;
  title: string;
  url: string;
  excerpt?: string;
  image?: ProductImage;
  category?: string;
  publishedAt?: string;
  readingMinutes?: number;
}

export interface ReviewModel {
  id: string;
  author: string;
  rating: number;
  body: string;
  createdAt?: string;
  verified?: boolean;
  avatar?: string;
  photos?: ReadonlyArray<ProductImage>;
}
