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
