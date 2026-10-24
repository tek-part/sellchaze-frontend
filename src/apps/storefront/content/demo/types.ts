/**
 * Per-theme demo catalogues.
 *
 * All four themes previously shared ONE fashion catalogue of eight products on grey picsum seeds,
 * so Voltage previewed electronics using wool coats and every grid looked sparse and generic. Each
 * theme now gets its own vertical-appropriate catalogue with real photography.
 *
 * DEV-only. Callers sit behind `import.meta.env.DEV`, which Vite replaces with `false` in a
 * production build, so Rollup drops this whole subtree — no demo content or Unsplash URLs ship to a
 * live storefront.
 *
 * Every image URL here was loaded in a browser and confirmed to resolve before being committed.
 */
import type { CategoryCardModel, ProductCardModel } from '../../types/catalog';

export interface DemoTestimonial {
  quote: string;
  author: string;
  detail: string;
  rating: number;
}

export interface DemoFaq {
  question: string;
  answer: string;
}

export interface DemoBrand {
  name: string;
  note: string;
}

export interface DemoCatalog {
  /** Vertical label, used in copy that needs to name the category of goods. */
  vertical: string;
  currency: string;
  products: ReadonlyArray<ProductCardModel>;
  categories: ReadonlyArray<CategoryCardModel>;
  brands: ReadonlyArray<DemoBrand>;
  testimonials: ReadonlyArray<DemoTestimonial>;
  faqs: ReadonlyArray<DemoFaq>;
  announcements: ReadonlyArray<string>;
}

export const img = (id: string, w = 900, h = 1100): string =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;

/** Named colour swatches shared across the demo catalogues. */
export const SWATCH: Readonly<Record<string, string>> = {
  Black: '#1A1A1A', Charcoal: '#3A3A3C', Ivory: '#F3EEE6', Oatmeal: '#D9CDBA',
  Camel: '#B98A52', Terracotta: '#B4623C', Sage: '#8A9A7B', Navy: '#22334D',
  Silver: '#C9CDD2', Cyan: '#22D3EE', Lime: '#A3E635', White: '#FFFFFF',
  Rose: '#B23052', Nude: '#E0B49C', Gold: '#C79A6D', Plum: '#5C2A3E',
  Walnut: '#5B4636', Oak: '#C8A97E', Brass: '#B08D57', Clay: '#C07A5B',
  // Jewellery metals (Karat) and sportswear colourways (Stride).
  'Yellow Gold': '#D4AF37', 'White Gold': '#E3E1DC', 'Rose Gold': '#C9967F', 'Sterling Silver': '#C0C4C8',
  Grey: '#8A8A8A', Volt: '#D4FF1E', Orange: '#F97316', Purple: '#7C3AED', Pink: '#F2A7B8',
  Red: '#D0101A', Blue: '#1D4ED8', Green: '#3F6F55', Teal: '#2BA59B', Sand: '#D9C7A7',
  Sky: '#9CC3E6', Mustard: '#D4A53A', Fuchsia: '#E5266B',
};

/**
 * Build a product card, keeping the demo definitions terse and consistent.
 *
 * `colors`, `sizes`, `material` and `tags` feed the filter facets. They are optional throughout —
 * facets derive from what is present, so a catalogue that omits a dimension simply produces no
 * group for it rather than an empty one.
 */
export function product(input: {
  i: number;
  title: string;
  price: number;
  was?: number;
  vendor: string;
  photo: string;
  hover?: string;
  rating: number;
  reviews: number;
  badge?: string;
  soldOut?: boolean;
  /** Units left; set on a few products so low-stock badges have something real to show. */
  stock?: number;
  currency: string;
  colors?: ReadonlyArray<string>;
  sizes?: ReadonlyArray<string>;
  material?: string;
  tags?: ReadonlyArray<string>;
  categorySlug?: string;
  categoryName?: string;
}): ProductCardModel {
  const handle = input.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return {
    id: `p${input.i}`,
    handle,
    title: input.title,
    url: `/products/${handle}`,
    price: input.price,
    currency: input.currency,
    image: { src: img(input.photo, 900, 1100), alt: input.title },
    ...(input.hover ? { hoverImage: { src: img(input.hover, 900, 1100), alt: '' } } : {}),
    vendor: input.vendor,
    rating: input.rating,
    reviewCount: input.reviews,
    ...(input.was ? { compareAtPrice: input.was } : {}),
    ...(input.badge ? { badge: input.badge } : {}),
    ...(input.soldOut ? { soldOut: true } : {}),
    ...(typeof input.stock === 'number' ? { availableStock: input.stock } : {}),
    ...(input.colors
      ? {
          colors: input.colors.map((name) => ({
            value: name,
            label: name,
            color: SWATCH[name] ?? '#999999',
          })),
        }
      : {}),
    ...(input.sizes ? { sizes: input.sizes } : {}),
    ...(input.material ? { material: input.material } : {}),
    ...(input.tags ? { tags: input.tags } : {}),
    ...(input.categorySlug ? { categorySlug: input.categorySlug } : {}),
    ...(input.categoryName ? { categoryName: input.categoryName } : {}),
  };
}

export function category(id: string, title: string, slug: string, photo: string, meta: string): CategoryCardModel {
  return {
    id,
    title,
    url: `/collections/${slug}`,
    image: { src: img(photo, 900, 1100) },
    meta,
  };
}
