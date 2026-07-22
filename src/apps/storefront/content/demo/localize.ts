/**
 * Locale overlays for the demo catalogues.
 *
 * ONE canonical dataset per theme. Prices, images, ratings, review counts, discounts, stock and
 * identifiers are language-independent facts and exist exactly once — duplicating a whole catalogue
 * per language would mean a price fixed in English silently staying wrong in Arabic, which is the
 * failure mode this design exists to prevent.
 *
 * Only the TEXT is per-locale, supplied as a sparse overlay keyed by the canonical id. An entry
 * with no overlay falls through to the canonical (English) text rather than rendering blank, so a
 * partially-translated catalogue degrades to readable rather than broken.
 */
import type { CategoryCardModel, ProductCardModel } from '../../types/catalog';
import type { DemoBrand, DemoCatalog, DemoFaq, DemoTestimonial } from './types';

/** Per-product text that differs by language. Everything omitted keeps the canonical value. */
export interface ProductTextOverlay {
  title?: string;
  vendor?: string;
  badge?: string;
  material?: string;
  categoryName?: string;
  colors?: ReadonlyArray<string>;
  sizes?: ReadonlyArray<string>;
  tags?: ReadonlyArray<string>;
}

export interface CatalogOverlay {
  vertical?: string;
  /** Keyed by product id (`p1`, `p2`, …). */
  products?: Readonly<Record<string, ProductTextOverlay>>;
  /** Keyed by category id (`c1`, `c2`, …); only the display title and meta differ. */
  categories?: Readonly<Record<string, { title?: string; meta?: string }>>;
  /** Brand names are proper nouns and usually stay; the descriptive note is translated. */
  brandNotes?: Readonly<Record<string, string>>;
  testimonials?: ReadonlyArray<DemoTestimonial>;
  faqs?: ReadonlyArray<DemoFaq>;
  announcements?: ReadonlyArray<string>;
}

function localizeProduct(product: ProductCardModel, overlay?: ProductTextOverlay): ProductCardModel {
  if (!overlay) return product;
  return {
    ...product,
    ...(overlay.title ? { title: overlay.title } : {}),
    ...(overlay.vendor ? { vendor: overlay.vendor } : {}),
    ...(overlay.badge ? { badge: overlay.badge } : {}),
    ...(overlay.material ? { material: overlay.material } : {}),
    ...(overlay.categoryName ? { categoryName: overlay.categoryName } : {}),
    ...(overlay.sizes ? { sizes: overlay.sizes } : {}),
    ...(overlay.tags ? { tags: overlay.tags } : {}),
    // Swatch VALUES are the filter's identity and must not change with language, or a shared link
    // would stop matching. Only the human-facing label is translated.
    ...(overlay.colors
      ? {
          colors: (product.colors ?? []).map((swatch, i) => ({
            ...swatch,
            label: overlay.colors?.[i] ?? swatch.label,
          })),
        }
      : {}),
  };
}

function localizeCategory(
  category: CategoryCardModel,
  overlay?: { title?: string; meta?: string },
): CategoryCardModel {
  if (!overlay) return category;
  return {
    ...category,
    ...(overlay.title ? { title: overlay.title } : {}),
    ...(overlay.meta ? { meta: overlay.meta } : {}),
    // `url` deliberately untouched: the slug is the route, and a translated slug would break every
    // shared link and split the catalogue across two URL spaces for no benefit.
  };
}

function localizeBrands(
  brands: ReadonlyArray<DemoBrand>,
  notes?: Readonly<Record<string, string>>,
): ReadonlyArray<DemoBrand> {
  if (!notes) return brands;
  return brands.map((brand) => (notes[brand.name] ? { ...brand, note: notes[brand.name]! } : brand));
}

/** Apply a locale overlay to a canonical catalogue. Returns the original when there is nothing to apply. */
export function applyOverlay(catalog: DemoCatalog, overlay?: CatalogOverlay): DemoCatalog {
  if (!overlay) return catalog;
  return {
    ...catalog,
    ...(overlay.vertical ? { vertical: overlay.vertical } : {}),
    products: catalog.products.map((p) => localizeProduct(p, overlay.products?.[p.id])),
    categories: catalog.categories.map((c) => localizeCategory(c, overlay.categories?.[c.id])),
    brands: localizeBrands(catalog.brands, overlay.brandNotes),
    ...(overlay.testimonials ? { testimonials: overlay.testimonials } : {}),
    ...(overlay.faqs ? { faqs: overlay.faqs } : {}),
    ...(overlay.announcements ? { announcements: overlay.announcements } : {}),
  };
}
