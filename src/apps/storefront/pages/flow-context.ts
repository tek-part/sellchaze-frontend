/**
 * flowContext — builds a minimal StorefrontContext for template-driven flow pages (cart, wishlist,
 * search, 404…). Flow sections read their own live state via hooks (useCart/useWishlist/useAuth),
 * so the context only needs store identity + currency; page-specific payloads go under `data`.
 */
import type { StorefrontContext } from '../theme-engine';

export function flowContext(
  store: { name: string; currency: string },
  data: Readonly<Record<string, unknown>> = {},
): StorefrontContext {
  return {
    store: { name: store.name, currency: store.currency },
    seo: {},
    navigation: { header: [], footer: [] },
    data,
  };
}
