/**
 * Typed storefront endpoint functions — one per documented Laravel route. These return the raw API
 * DTOs; callers map them with the store currency (see ./mappers). Cart/auth mutations included.
 * No endpoint is invented — every path matches routes/api.php `/storefront/*`.
 */
import { apiFetch, apiGet, apiSend } from './client';
import type {
  ApiBrand,
  ApiCategory,
  ApiCollection,
  ApiCoupon,
  ApiPaginated,
  ApiProduct,
  ApiReview,
  ApiStorefrontLocale,
  ApiStorefrontNavigation,
  ApiStoreSummary,
} from './types';

/* ---- catalog (public) ---- */

export interface ApiStorefrontBootstrap {
  preview?: { valid: boolean };
  head_code?: import('../head-code/runtime').PublishedHeadCode | null;
  store: ApiStoreSummary;
  seo?: unknown;
  /** Resolved request language + the store's supported set. */
  locale?: ApiStorefrontLocale | null;
  /** Merchant-managed header/footer menus; empty arrays when the store has none yet. */
  navigation?: ApiStorefrontNavigation | null;
  theme?: {
    key: string;
    version: string;
    bundle_url?: string | null;
    bundle_integrity?: string | null;
    settings: Record<string, string | number | boolean>;
    custom_css?: string | null;
    /** Raw (un-flattened) settings: translatable fields keep their `{locale: string}` maps. */
    settings_i18n?: Record<string, unknown> | null;
  } | null;
}

export function getStore(): Promise<ApiStorefrontBootstrap> {
  return apiGet('/');
}

/** Saved presentation only; order receipts continue through their private capability endpoint. */
export function getThankYouPage(): Promise<{ data: import('../pages/thank-you').ThankYouPageData }> {
  return apiGet('/thank-you');
}

/** Merchandising filter driven by real product flags. */
export type ProductFilter = 'best_sellers' | 'new_arrivals' | 'trending' | 'on_sale';
export type ProductSort = 'rating' | 'newest' | 'oldest' | 'price_asc' | 'price_desc';

export function getProducts(
  params: { category?: string; perPage?: number; page?: number; filter?: ProductFilter; q?: string; sort?: ProductSort } = {},
): Promise<ApiPaginated<ApiProduct>> {
  const qs = new URLSearchParams();
  if (params.category) qs.set('category', params.category);
  if (params.perPage) qs.set('per_page', String(params.perPage));
  if (params.page) qs.set('page', String(params.page));
  if (params.filter) qs.set('filter', params.filter);
  if (params.q) qs.set('q', params.q);
  if (params.sort) qs.set('sort', params.sort);
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

/* ---- published layouts + custom pages (contract §4) ---- */

/** One placed section as the public layout API serves it (settings are raw editor values). */
export interface ApiLayoutSection {
  id: string;
  type: string;
  settings: Record<string, unknown>;
}

export interface ApiLayout {
  template: string;
  /** 'store' = the merchant's published composition; 'theme' = the theme manifest default. */
  source: 'store' | 'theme';
  page_id: number | null;
  sections: ReadonlyArray<ApiLayoutSection>;
}

/** GET /storefront/layout?template=home — the published section composition for a template. */
export function getLayout(template: string): Promise<{ data: ApiLayout }> {
  return apiGet(`/layout?template=${encodeURIComponent(template)}`);
}

export interface ApiBuilderPage {
  title: string | Record<string, string | null | undefined>;
  slug: string;
  template: string;
  public_path?: string;
  funnel_product_slug?: string | null;
  native_funnel_template?: 'glasses-ar' | 'glasses-en' | 'hair-revive-ar' | 'hair-revive-en' | null;
  locale?: string;
  /** Sanitized published rich content; present only for simple pages. */
  content_html?: string;
  seo?: { title?: string | null; description?: string | null; image?: string | null } | null;
  sections: ReadonlyArray<ApiLayoutSection>;
}

/** GET /storefront/pages/{slug} — a published custom (page|landing) page; 404 when unpublished. */
export function getPage(slug: string): Promise<{ data: ApiBuilderPage }> {
  return apiGet(`/pages/${encodeURIComponent(slug)}`);
}

/** A published product funnel; ordinary pages cannot be served through this endpoint. */
export function getFunnel(slug: string): Promise<{ data: ApiBuilderPage }> {
  return apiGet(`/funnels/${encodeURIComponent(slug)}`);
}

/* ---- merchandising surfaces ---- */

export function getCollections(): Promise<{ data: ReadonlyArray<ApiCollection> }> {
  return apiGet('/collections');
}

export function getCollection(
  slug: string,
  params: { perPage?: number; page?: number; sort?: string } = {},
): Promise<{ data: ApiCollection; products?: ApiPaginated<ApiProduct> }> {
  const qs = new URLSearchParams();
  if (params.perPage) qs.set('per_page', String(params.perPage));
  if (params.page) qs.set('page', String(params.page));
  if (params.sort) qs.set('sort', params.sort);
  const query = qs.toString();
  return apiGet(`/collections/${encodeURIComponent(slug)}${query ? `?${query}` : ''}`);
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

export const subscribePhoneNewsletter = (contact: { name: string; phone: string }): Promise<{ message: string }> =>
  apiSend('/newsletter', 'POST', contact);

export const submitContact = (body: { name: string; email: string; subject?: string; message: string }): Promise<{ message: string }> =>
  apiSend('/contact', 'POST', body);

export function getProduct(slug: string): Promise<{ data: ApiProduct; seo?: unknown }> {
  return apiGet(`/products/${encodeURIComponent(slug)}`);
}

/** Read-only, uncached catalog refresh; never creates a cart, reservation or order. */
export function getCartCatalog(productIds: ReadonlyArray<number>): Promise<{ store_id: number; data: ApiProduct[] }> {
  return apiSend('/cart/catalog', 'POST', { product_ids: productIds });
}

export function getCategories(): Promise<{ data: ReadonlyArray<ApiCategory> }> {
  return apiGet('/categories');
}

/** Editable system-page content (about/contact/faq/shipping/returns/blog). `data` is null when unset. */
export function getContent(key: string): Promise<{ data: Record<string, unknown> | null }> {
  return apiGet(`/content/${encodeURIComponent(key)}`);
}

export function getCategory(slug: string): Promise<{ data: ApiCategory; children?: ReadonlyArray<ApiCategory>; products?: ApiPaginated<ApiProduct> }> {
  return apiGet(`/categories/${encodeURIComponent(slug)}`);
}

export function getProductReviews(slug: string, page = 1): Promise<ApiPaginated<ApiReview> & { summary?: { count: number; average: number | null } }> {
  return apiGet(`/products/${encodeURIComponent(slug)}/reviews${page > 1 ? `?page=${page}` : ''}`);
}

export function submitProductReview(slug: string, review: { rating: number; title: string; body: string }): Promise<{ data: ApiReview }> {
  return apiSend(`/products/${encodeURIComponent(slug)}/reviews`, 'POST', review);
}

/* ---- checkout ----
 * The storefront uses a client-side cart (offline-first) and submits its line items directly to
 * checkout; the server-cart endpoints (/cart/*) are intentionally not wrapped here. */
/** One discount the server applied to a quote or cart: automatic discounts carry no code. */
export interface AppliedDiscount { id: number; title: string; code: string | null; method: 'code' | 'automatic'; type: 'fixed' | 'percentage' | 'free_shipping' | 'buy_x_get_y' | 'bundle'; amount: string; bundle_id?: string }
export const applyCoupon = (code: string): Promise<{ data: unknown; discounts?: ReadonlyArray<AppliedDiscount> }> => apiSend('/checkout/coupon/apply', 'POST', { code });
export const removeCoupon = (): Promise<{ data: unknown; discounts?: ReadonlyArray<AppliedDiscount> }> => apiSend('/checkout/coupon', 'DELETE');
export interface StorefrontPaymentMethod { slug: string; name: string; test_mode: boolean; logo_url?: string | null; description?: string }
export const getPaymentMethods = (productIds: ReadonlyArray<number> = []): Promise<{ data: ReadonlyArray<StorefrontPaymentMethod> }> => {
  const params = new URLSearchParams();
  [...new Set(productIds)].forEach((id) => params.append('product_ids[]', String(id)));
  return apiGet(`/payment-methods${params.size ? `?${params.toString()}` : ''}`);
};
export const submitCheckout = (body: unknown, key: string): Promise<{ data: unknown }> => apiFetch('/checkout', { method: 'POST', headers: { 'Idempotency-Key': key }, body: JSON.stringify(body) });
export const recoverCheckout = (key: string): Promise<{ data: unknown }> => apiFetch('/checkout/recover', { method: 'POST', headers: { 'Idempotency-Key': key }, body: '{}' });
export interface CheckoutItem { product_id: number; variant_id?: number; quantity: number; personalization?: import('../types/personalization').PersonalizationValues; quantity_offer_id?: string; quantity_offer_version?: number }
export interface CheckoutQuote {
  payment_adjustment_token?: string | null;
  order_minimum?: { amount: string; merchandise_total: string; remaining: string; eligible: boolean };
  requires_shipping: boolean;
  offer_free_shipping?: boolean;
  items: ReadonlyArray<{ product_id: number; variant_id: number | null; name: string; unit_price: string; quantity: number; line_total: string; quantity_offer?: import('./types').ApiQuantityOffer | null; personalization_key?: string; personalization?: ReadonlyArray<import('../types/personalization').PersonalizationEntry> }>;
  currency: string;
  /** Applied discounts, one per line on the summary (absent on older APIs: show `discount_total` alone). */
  discounts?: ReadonlyArray<AppliedDiscount>;
  /** Gift cards in the order submitted: what each pays after every other total. */
  gift_cards?: ReadonlyArray<QuoteGiftCard>;
  /** What is left to pay after gift cards (absent on older APIs: the grand total). */
  amount_due?: string;
  totals: { subtotal: string; discount_total: string; shipping_total: string; tax_total: string; grand_total: string; payment_adjustment_total?: string; gift_card_total?: string };
  /** Zone rates eligible for this cart and address, and the one applied (absent on older APIs). */
  shipping?: import('../types/shipping').QuoteShipping | null;
  tax?: import('../types/shipping').TaxRule | null;
}
/** A gift card on a quote: only the last four characters ever come back. */
export interface QuoteGiftCard { last4: string; applied: string; balance_after: string }
export interface GiftCardBalance { last4: string; balance: string; currency: string; expires_at: string | null }
/** Rate-limited server-side; every failure is the same generic message. */
export const checkGiftCard = (code: string): Promise<{ data: GiftCardBalance }> => apiSend('/checkout/gift-card/check', 'POST', { code });
export const quoteCheckout = (items: ReadonlyArray<CheckoutItem>, coupon_code: string, selection: import('../types/shipping').ShippingSelection = {}, payment_method?: string, gift_cards: ReadonlyArray<string> = [], contact: import('../pages/useQuoteContact').QuoteContact = {}): Promise<{ data: CheckoutQuote }> =>
  apiSend('/checkout/quote', 'POST', { items, coupon_code, ...selection, ...(payment_method ? { payment_method } : {}), ...(gift_cards.length ? { gift_cards } : {}), ...contact });
export const retryCheckoutPayment = (token: string): Promise<{ data: unknown; payment?: { redirect_url?: string | null } }> =>
  apiSend('/checkout/payment/retry', 'POST', { token });

/* ---- draft-order invoices (merchant-shared link; the token is the capability) ---- */
export interface InvoicePaymentMethod extends StorefrontPaymentMethod { grand_total: string }
export interface StorefrontInvoice {
  number: string;
  status: string;
  currency: string;
  expires_at: string | null;
  store: { name: string };
  customer: { name: string | null; email: string | null; phone: string | null };
  shipping_address: Partial<Record<'line1' | 'city' | 'country' | 'postal_code' | 'phone_alt' | 'national_address', string>>;
  line_items: ReadonlyArray<{ title: string; variant_name: string | null; sku: string | null; quantity: number; unit_price: string; line_total: string | null; image_url: string | null }>;
  totals: { subtotal: string; discount_total: string; discounts: ReadonlyArray<{ title: string; code: string | null; amount: string }>; shipping_total: string; shipping_title: string | null; tax_total: string; tax_included: boolean; grand_total: string };
  requires_shipping: boolean;
  has_digital: boolean;
  fields: ReadonlyArray<import('../pages/checkout-contact').CheckoutField>;
  payment_methods: ReadonlyArray<InvoicePaymentMethod>;
}
export interface InvoiceCheckoutResponse {
  data?: { id?: number; number?: string };
  receipt?: { token?: string };
  payment?: { redirect_url?: string | null };
  payment_retry?: { token?: string };
}
export const getInvoice = (token: string): Promise<{ data: StorefrontInvoice }> => apiGet(`/invoices/${encodeURIComponent(token)}`);
export const checkoutInvoice = (token: string, body: Record<string, unknown>): Promise<InvoiceCheckoutResponse> =>
  apiSend(`/invoices/${encodeURIComponent(token)}/checkout`, 'POST', body);

/* ---- auth / account ----
 * login/register return a bearer `token` the client must persist (see client.ts setAuthToken) —
 * the `store.customer` routes authenticate via that token, not a cookie. */
export const login = (body: { email: string; password: string }): Promise<{ data: unknown; token?: string }> => apiSend('/auth/login', 'POST', body);
export const register = (body: Record<string, unknown>): Promise<{ data: unknown; token?: string }> => apiSend('/auth/register', 'POST', body);
export const logout = (): Promise<unknown> => apiSend('/auth/logout', 'POST');
export const getAccount = (): Promise<{ data: unknown }> => apiGet('/account');
export const updateAccount = (body: Record<string, unknown>): Promise<{ data: unknown }> => apiSend('/account', 'PATCH', body);
export const changePassword = (body: { current_password?: string; password: string; password_confirmation: string }): Promise<unknown> =>
  apiSend('/account/password', 'PUT', body);
export const getOrders = (): Promise<ApiPaginated<ApiOrder>> => apiGet('/orders');
export const getOrder = (number: string): Promise<{ data: ApiOrder }> => apiGet(`/orders/${encodeURIComponent(number)}`);
/** Ask the store to take delivered items back (only inside the store's return window, one open request at a time). */
export const requestOrderReturn = (
  number: string,
  body: { items: ReadonlyArray<{ store_order_item_id: number; quantity: number }>; reason: ApiReturnReason; note?: string | null },
): Promise<{ data: ApiOrder }> => apiSend(`/orders/${encodeURIComponent(number)}/returns`, 'POST', body);
export const getAddresses = (): Promise<{ data: ReadonlyArray<ApiAddress> }> => apiGet('/account/addresses');
export const createAddress = (body: Record<string, unknown>): Promise<{ data: ApiAddress }> => apiSend('/account/addresses', 'POST', body);
export const updateAddress = (id: number, body: Record<string, unknown>): Promise<{ data: ApiAddress }> => apiSend(`/account/addresses/${id}`, 'PUT', body);
export const deleteAddress = (id: number): Promise<unknown> => apiSend(`/account/addresses/${id}`, 'DELETE');
export const getWishlist = (): Promise<{ data: ReadonlyArray<ApiProduct> }> => apiGet('/wishlist');
export const addWishlist = (productId: number): Promise<unknown> => apiSend('/wishlist', 'POST', { product_id: productId });
export const removeWishlist = (productId: number): Promise<unknown> => apiSend(`/wishlist/${productId}`, 'DELETE');

/* ---- password reset: store customers reset through their own store, never the platform broker ---- */
export const forgotPassword = (email: string): Promise<unknown> => apiSend('/auth/forgot-password', 'POST', { email });
export const resetPassword = (body: { token: string; email: string; password: string; password_confirmation: string }): Promise<unknown> =>
  apiSend('/auth/reset-password', 'POST', body);

/* ---- G2 customer login & tracking: WhatsApp code, Google sign-in, guest order tracking ---- */
export interface ApiLoginMethods { email: boolean; phone: boolean; google: boolean; phone_country: string; expires_in: number; resend_in: number }
export interface ApiPhoneCodeResult { state: string; phone: string; expires_at: string; resend_at: string }
export type ApiAuthResult = { data: unknown; token?: string };
export const getLoginMethods = (): Promise<{ data: ApiLoginMethods }> => apiGet('/auth/methods');
export const sendLoginCode = (body: { phone: string; token: string }): Promise<{ data: ApiPhoneCodeResult }> => apiSend('/auth/phone/send', 'POST', body);
/** Signs in (data + token), or answers `{ data: { status: 'name_required' } }` for a new phone. */
export const verifyLoginCode = (body: { token: string; code?: string; name?: string }): Promise<ApiAuthResult & { data: unknown }> => apiSend('/auth/phone/verify', 'POST', body);
/** Signed-in customer confirms their phone (it then signs them in by WhatsApp code). */
export const sendAccountPhoneCode = (body: { phone: string; token: string }): Promise<{ data: ApiPhoneCodeResult }> => apiSend('/account/phone/send', 'POST', body);
export const verifyAccountPhone = (body: { token: string; code: string }): Promise<{ data: unknown }> => apiSend('/account/phone/verify', 'POST', body);
export const startGoogleLogin = (challenge: string): Promise<{ data: { url: string } }> => apiGet(`/auth/google/start?challenge=${encodeURIComponent(challenge)}`);
export const exchangeGoogleLogin = (body: { code: string; verifier: string }): Promise<ApiAuthResult> => apiSend('/auth/google/exchange', 'POST', body);
export interface ApiOrderTimelineEntry { status: string; at: string | null }
export interface ApiTrackedOrder {
  number: string;
  status: string;
  payment_status?: string | null;
  fulfillment_status?: 'unfulfilled' | 'partial' | 'fulfilled';
  currency?: string | null;
  placed_at?: string | null;
  timeline: ReadonlyArray<ApiOrderTimelineEntry>;
  fulfillments: ReadonlyArray<ApiOrderFulfillment>;
  items: ReadonlyArray<{ id: number; name: string; variant_name?: string | null; quantity: number; unit_price: string; line_total: string }>;
  subtotal: string;
  shipping_total: string;
  discount_total: string;
  tax_total: string;
  grand_total: string;
  refunded_total?: string;
  amount_due?: string;
}
export const trackOrder = (body: { order_number: string; contact: string }): Promise<{ data: ApiTrackedOrder }> => apiSend('/orders/track', 'POST', body);

export interface ApiOrderItem {
  digital_delivery?: import('../types/digital').DigitalDelivery | null;
  personalization?: ReadonlyArray<import('../types/personalization').PersonalizationEntry>;
  id?: number;
  name: string;
  quantity: number;
  price: string | number;
  image_url?: string | null;
}
export type ApiReturnReason = 'damaged' | 'wrong_item' | 'not_as_described' | 'size_fit' | 'changed_mind' | 'other';
export type ApiReturnStatus = 'requested' | 'approved' | 'rejected' | 'received' | 'closed';
export interface ApiOrderReturn {
  id: number;
  status: ApiReturnStatus;
  reason: ApiReturnReason;
  customer_note?: string | null;
  resolution?: 'refund' | 'exchange' | 'store_credit' | null;
  items: ReadonlyArray<{ store_order_item_id: number; name?: string | null; quantity: number }>;
  created_at?: string;
}
export interface ApiReturnEligibility {
  eligible: boolean;
  reason: 'disabled' | 'not_delivered' | 'window_expired' | 'open_return' | 'nothing_returnable' | null;
  window_days: number;
  delivered_at?: string | null;
  deadline?: string | null;
  items: ReadonlyArray<{ store_order_item_id: number; name: string; variant_name?: string | null; quantity: number; returnable_quantity: number }>;
}
export type ApiShipmentStatus = 'pending' | 'in_transit' | 'delivered' | 'failed';
/** A parcel of the order handed to a carrier (cancelled ones are never sent to the customer). */
export interface ApiOrderFulfillment {
  id: number;
  status: ApiShipmentStatus;
  carrier: string;
  carrier_name: string;
  tracking_number?: string | null;
  tracking_url?: string | null;
  items: ReadonlyArray<{ store_order_item_id: number; name?: string | null; variant_name?: string | null; quantity: number }>;
  shipped_at?: string | null;
  delivered_at?: string | null;
}
export interface ApiOrder {
  payment_adjustment_total?: string;
  refunded_total?: string;
  fulfillment_status?: 'unfulfilled' | 'partial' | 'fulfilled';
  fulfillments?: ReadonlyArray<ApiOrderFulfillment>;
  timeline?: ReadonlyArray<ApiOrderTimelineEntry>;
  returns?: ReadonlyArray<ApiOrderReturn>;
  return_eligibility?: ApiReturnEligibility;
  /** Paid by gift cards; `total` stays the order total and `amount_due` is what is left. */
  gift_card_total?: string;
  amount_due?: string;
  id: number;
  number: string;
  status: string;
  total: string | number;
  subtotal?: string | number;
  shipping?: string | number;
  shipping_total?: string;
  discount_total?: string;
  tax_total?: string;
  grand_total?: string;
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
