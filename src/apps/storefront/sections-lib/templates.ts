/**
 * Base templates for library-built themes.
 *
 * `baseTemplates({ home })` returns the `TemplateMap` a theme registers: `home` (the theme's own
 * composition, or a sensible general-store default), `product` and `category` built from library
 * sections. The remaining routes (cart, checkout, search, wishlist, account, auth, static pages,
 * 404) are NOT templates: the shared route pages render their `.sf-*` markup when the active theme
 * registers no template for them, and each theme re-skins that surface with a `shared.css`
 * (contract §6). A theme that wants a bespoke cart/search may still add `cart`/`search` keys.
 */
import type { PageDefinition, SectionInstance, TemplateMap } from '../theme-engine/rendering';
import { tr } from './schema';

export interface BaseTemplateOptions {
  /** Home composition; defaults to a general-store layout when omitted. */
  home?: ReadonlyArray<SectionInstance>;
  product?: ReadonlyArray<SectionInstance>;
  category?: ReadonlyArray<SectionInstance>;
  /** Additional templates (e.g. `{ cart: {...} }`) merged as-is. */
  extra?: TemplateMap;
}

/** A general-store home every library theme can start from (all copy is bilingual). */
export const DEFAULT_HOME_SECTIONS: ReadonlyArray<SectionInstance> = [
  { type: 'hero-slider', id: 'hero' },
  { type: 'category-circles', id: 'categories' },
  { type: 'featured-products', id: 'new', settings: { title: tr('وصل حديثاً', 'New arrivals'), collection: 'newest', view_all_url: '/collections/new-arrivals' } },
  { type: 'banner-grid', id: 'banners' },
  { type: 'featured-products', id: 'best', settings: { title: tr('الأكثر مبيعاً', 'Best sellers'), collection: 'bestsellers', view_all_url: '/collections/best-sellers' } },
  { type: 'flash-deals', id: 'deals' },
  { type: 'image-with-text', id: 'story' },
  { type: 'features', id: 'features' },
  { type: 'testimonials', id: 'testimonials' },
  { type: 'brand-logos', id: 'brands' },
  { type: 'newsletter', id: 'newsletter' },
  { type: 'faq', id: 'faq' },
];

export const DEFAULT_PRODUCT_SECTIONS: ReadonlyArray<SectionInstance> = [
  { type: 'product-details', id: 'pdp', settings: { show_share: true, show_sku: false } },
  { type: 'related-products', id: 'related' },
  { type: 'recently-viewed', id: 'recent' },
];

export const DEFAULT_CATEGORY_SECTIONS: ReadonlyArray<SectionInstance> = [
  { type: 'category-header', id: 'head' },
  { type: 'product-grid', id: 'grid', settings: { source: 'all', columns: 4, limit: 24 } },
];

export function baseTemplates(options: BaseTemplateOptions = {}): TemplateMap {
  const home: PageDefinition = { template: 'home', sections: options.home ?? DEFAULT_HOME_SECTIONS };
  const product: PageDefinition = { template: 'product', sections: options.product ?? DEFAULT_PRODUCT_SECTIONS };
  const category: PageDefinition = { template: 'category', sections: options.category ?? DEFAULT_CATEGORY_SECTIONS };
  return Object.freeze({ home, product, category, ...(options.extra ?? {}) });
}
