/**
 * Typed storefront endpoint functions — one per documented Laravel route. These return the raw API
 * DTOs; callers map them with the store currency (see ./mappers). Cart/auth mutations included.
 * No endpoint is invented — every path matches routes/api.php `/storefront/*`.
 */
import { apiGet, apiRootFetch, apiSend } from './client';
import type {
  ApiBrand,
  ApiCategory,
  ApiCollection,
  ApiCoupon,
  ApiPaginated,
  ApiProduct,
  ApiReview,
  ApiStoreSummary,
} from './types';

/* ---- catalog (public) ---- */

export function getStore(): Promise<{ store: ApiStoreSummary; seo?: unknown }> {
  return apiGet('/');
}

/** Merchandising filter driven by real product flags. */
export type ProductFilter = 'best_sellers' | 'new_arrivals' | 'trending' | 'on_sale';

export function getProducts(
  params: { category?: string; perPage?: number; page?: number; filter?: ProductFilter; q?: string } = {},
): Promise<ApiPaginated<ApiProduct>> {
  const qs = new URLSearchParams();
  if (params.category) qs.set('category', params.category);
  if (params.perPage) qs.set('per_page', String(params.perPage));
  if (params.page) qs.set('page', String(params.page));
  if (params.filter) qs.set('filter', params.filter);
  if (params.q) qs.set('q', params.q);
  const query = qs.toString();
  return apiGet(`/products${query ? `?${query}` : ''}`);
}

/** Locale-keyed content payload ({ en: {...}, ar: {...} }) for a system page. */
export type ApiLocaleContent = Record<string, Record<string, unknown>> | null;

/** Everything the themed home page needs, in ONE request (see StorefrontController@home). */
export interface ApiHomeBundle {
  products: ReadonlyArray<ApiProduct>;
  best_sellers: ReadonlyArray<ApiProduct>;
  new_arrivals: ReadonlyArray<ApiProduct>;
  on_sale: ReadonlyArray<ApiProduct>;
  trending: ReadonlyArray<ApiProduct>;
  categories: ReadonlyArray<ApiCategory>;
  collections: ReadonlyArray<ApiCollection>;
  brands: ReadonlyArray<ApiBrand>;
  coupons: ReadonlyArray<ApiCoupon>;
  content: { home: ApiLocaleContent; about: ApiLocaleContent; faq: ApiLocaleContent };
}

export function getHome(): Promise<{ data: ApiHomeBundle }> {
  return apiGet('/home');
}

/* ---- merchandising surfaces ---- */

export function getCollections(): Promise<{ data: ReadonlyArray<ApiCollection> }> {
  return apiGet('/collections');
}

export function getCollection(slug: string): Promise<{ data: ApiCollection; products?: ApiPaginated<ApiProduct> }> {
  return apiGet(`/collections/${encodeURIComponent(slug)}`);
}

export function getBrands(): Promise<{ data: ReadonlyArray<ApiBrand> }> {
  return apiGet('/brands');
}

export function getCoupons(): Promise<{ data: ReadonlyArray<ApiCoupon> }> {
  return apiGet('/coupons');
}

/* ---- engagement capture ---- */

export const subscribeNewsletter = (email: string): Promise<{ message: string }> =>
  apiSend('/newsletter', 'POST', { email });

export const submitContact = (body: { name: string; email: string; subject?: string; message: string }): Promise<{ message: string }> =>
  apiSend('/contact', 'POST', body);

export function getProduct(slug: string): Promise<{ data: ApiProduct; seo?: unknown }> {
  return apiGet(`/products/${encodeURIComponent(slug)}`);
}

export function getCategories(): Promise<{ data: ReadonlyArray<ApiCategory> }> {
  return apiGet('/categories');
}

/** Editable system-page content (about/contact/faq/shipping/returns/blog). `data` is null when unset. */
export function getContent(key: string): Promise<{ data: Record<string, unknown> | null }> {
  return apiGet(`/content/${encodeURIComponent(key)}`);
}

export function getCategory(slug: string): Promise<{ data: ApiCategory; products?: ApiPaginated<ApiProduct> }> {
  return apiGet(`/categories/${encodeURIComponent(slug)}`);
}

export function getProductReviews(slug: string): Promise<ApiPaginated<ApiReview>> {
  return apiGet(`/products/${encodeURIComponent(slug)}/reviews`);
}

/* ---- checkout ----
 * The storefront uses a client-side cart (offline-first) and submits its line items directly to
 * checkout; the server-cart endpoints (/cart/*) are intentionally not wrapped here. */
export const applyCoupon = (code: string): Promise<{ data: unknown }> => apiSend('/checkout/coupon/apply', 'POST', { code });
export const removeCoupon = (): Promise<{ data: unknown }> => apiSend('/checkout/coupon', 'DELETE');
export const submitCheckout = (body: unknown): Promise<{ data: unknown }> => apiSend('/checkout', 'POST', body);

/* ---- auth / account ----
 * login/register return a bearer `token` the client must persist (see client.ts setAuthToken) —
 * the `store.customer` routes authenticate via that token, not a cookie. */
export const login = (body: { email: string; password: string }): Promise<{ data: unknown; token?: string }> => apiSend('/auth/login', 'POST', body);
export const register = (body: Record<string, unknown>): Promise<{ data: unknown; token?: string }> => apiSend('/auth/register', 'POST', body);
export const logout = (): Promise<unknown> => apiSend('/auth/logout', 'POST');
export const getAccount = (): Promise<{ data: unknown }> => apiGet('/account');
export const updateAccount = (body: Record<string, unknown>): Promise<{ data: unknown }> => apiSend('/account', 'PATCH', body);
export const changePassword = (body: { current_password: string; password: string; password_confirmation: string }): Promise<unknown> =>
  apiSend('/account/password', 'PUT', body);
export const getOrders = (): Promise<ApiPaginated<ApiOrder>> => apiGet('/orders');
export const getOrder = (number: string): Promise<{ data: ApiOrder }> => apiGet(`/orders/${encodeURIComponent(number)}`);
export const getAddresses = (): Promise<{ data: ReadonlyArray<ApiAddress> }> => apiGet('/account/addresses');
export const createAddress = (body: Record<string, unknown>): Promise<{ data: ApiAddress }> => apiSend('/account/addresses', 'POST', body);
export const updateAddress = (id: number, body: Record<string, unknown>): Promise<{ data: ApiAddress }> => apiSend(`/account/addresses/${id}`, 'PUT', body);
export const deleteAddress = (id: number): Promise<unknown> => apiSend(`/account/addresses/${id}`, 'DELETE');
export const getWishlist = (): Promise<{ data: ReadonlyArray<ApiProduct> }> => apiGet('/wishlist');
export const addWishlist = (productId: number): Promise<unknown> => apiSend('/wishlist', 'POST', { product_id: productId });
export const removeWishlist = (productId: number): Promise<unknown> => apiSend(`/wishlist/${productId}`, 'DELETE');

/* ---- password reset (shared /auth routes, outside the storefront prefix) ---- */
export const forgotPassword = (email: string): Promise<unknown> => apiRootFetch('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
export const resetPassword = (body: { token: string; email: string; password: string; password_confirmation: string }): Promise<unknown> =>
  apiRootFetch('/auth/reset-password', { method: 'POST', body: JSON.stringify(body) });

export interface ApiOrderItem {
  id?: number;
  name: string;
  quantity: number;
  price: string | number;
  image_url?: string | null;
}
export interface ApiOrder {
  id: number;
  number: string;
  status: string;
  total: string | number;
  subtotal?: string | number;
  shipping?: string | number;
  currency?: string;
  created_at?: string;
  items_count?: number;
  items?: ReadonlyArray<ApiOrderItem>;
}
export interface ApiAddress {
  id: number;
  name?: string;
  line1?: string;
  line2?: string | null;
  city?: string;
  state?: string | null;
  postal_code?: string;
  country?: string;
  phone?: string | null;
  is_default?: boolean;
}
