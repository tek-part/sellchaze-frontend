/**
 * API DTOs — the exact shapes the Laravel storefront resources return (StoreProductResource,
 * StoreCategoryResource, store summary, paginators). Kept separate from the view-models so the
 * presentation layer never depends on backend field names; ./mappers.ts is the only bridge.
 */

export interface ApiVariant {
  id: number;
  name?: string;
  sku?: string | null;
  price?: string | number | null;
  compare_price?: string | number | null;
  stock?: number | null;
  is_active?: boolean;
  options?: Record<string, string> | null;
}

export interface ApiProduct {
  id: number;
  name: string;
  slug: string;
  sku?: string | null;
  barcode?: string | null;
  description?: string | null;
  short_description?: string | null;
  price: string | number;
  compare_price?: string | number | null;
  image?: string | null;
  image_url?: string | null;
  images?: ReadonlyArray<string> | null;
  is_active?: boolean;
  is_featured?: boolean;
  position?: number;
  category?: { id: number; name: string; slug: string } | null;
  variants?: ReadonlyArray<ApiVariant> | null;
  rating?: number | null;
  reviews_count?: number | null;
  brand?: string | null;
  // Rich PDP surface (StorefrontProductResource)
  long_description?: string | null;
  specifications?: Record<string, unknown> | ReadonlyArray<unknown> | null;
  dimensions?: Record<string, unknown> | null;
  highlights?: ReadonlyArray<string> | null;
  weight?: string | number | null;
  material?: string | null;
  warranty?: string | null;
  shipping_returns?: string | null;
  care_instructions?: string | null;
  origin_country?: string | null;
  manufacturer?: string | null;
  unit?: string | null;
  tags?: ReadonlyArray<string> | null;
}

export interface ApiCategory {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  image_url?: string | null;
  products_count?: number | null;
}

export interface ApiCollection {
  id: number;
  name: string;
  slug: string;
  type?: string | null;
  description?: string | null;
  image_url?: string | null;
  products_count?: number | null;
  products?: ReadonlyArray<ApiProduct> | null;
}

export interface ApiBrand {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  logo_url?: string | null;
  website?: string | null;
  origin_country?: string | null;
  is_featured?: boolean;
  products_count?: number | null;
}

export interface ApiCoupon {
  code: string;
  type: 'fixed' | 'percentage';
  value: string | number;
  minimum_order_amount?: string | number | null;
  expires_at?: string | null;
}

export interface ApiStoreSummary {
  id: number;
  name: string;
  slug: string;
  currency: string;
  status?: string;
  logo_url?: string | null;
  banner_url?: string | null;
  description?: string | null;
}

export interface ApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface ApiPaginated<T> {
  data: ReadonlyArray<T>;
  meta: ApiPaginationMeta;
  seo?: unknown;
}

export interface ApiReview {
  id: number;
  author_name?: string;
  customer?: { name?: string } | null;
  rating: number;
  title?: string | null;
  body?: string | null;
  is_verified?: boolean;
  created_at?: string;
}
