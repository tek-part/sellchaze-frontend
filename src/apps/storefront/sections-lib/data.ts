/**
 * Fail-safe readers over `context.data` for library sections, with DEV/preview demo fallbacks.
 *
 * Pages pack real API data into `context.data` (HomePage → `collections`, `categories`, `brands`,
 * `testimonials`, `faq`, `articles`; CategoryPage → `products` + `pageHeader`; ProductPage →
 * `product`, `reviews`, `collections.related`). Sections never touch `context.data` directly — they
 * go through `useSectionData(context)`, which also fills empty slices from the demo catalogue in
 * development / `?preview=1` so every section is demoable before a store has content.
 */
import { useMemo } from 'react';
import type { StorefrontContext } from '../theme-engine/rendering';
import { useThemeManifest } from '../theme-engine/context';
import { previewOrDev } from '../preview';
import { catalogFor } from '../content/demo';
import type {
  ArticleCardModel,
  BrandModel,
  CategoryCardModel,
  CollectionCardModel,
  ProductCardModel,
  ReviewModel,
} from '../types/catalog';
import type { FaqItem } from '../content/home-data';
import { useLocaleCode } from './i18n';

/** Collection keys every page can serve; aliases map the editor's vocabulary to the data bag. */
const COLLECTION_ALIASES: Readonly<Record<string, ReadonlyArray<string>>> = {
  newest: ['newest', 'new-arrivals', 'new_arrivals', 'all'],
  featured: ['featured', 'newest'],
  bestsellers: ['bestsellers', 'best-sellers', 'best_sellers'],
  sale: ['sale', 'on-sale', 'on_sale', 'flash-deals'],
  trending: ['trending', 'top-rated'],
  related: ['related', 'featured', 'newest'],
};

interface DataBag {
  products?: unknown;
  collections?: Record<string, unknown>;
  categories?: unknown;
  brands?: unknown;
  testimonials?: unknown;
  reviews?: unknown;
  faq?: unknown;
  faqHeading?: unknown;
  articles?: unknown;
  featuredCollections?: unknown;
  loading?: unknown;
  error?: unknown;
  pageHeader?: unknown;
  product?: unknown;
}

function arr<T>(value: unknown): ReadonlyArray<T> {
  return Array.isArray(value) ? (value as ReadonlyArray<T>) : [];
}

function bag(context: StorefrontContext): DataBag {
  return context.data as DataBag;
}

/* ------------------------------------------------------------ pure readers (no hooks) */

export function productsFromContext(context: StorefrontContext, key: string): ReadonlyArray<ProductCardModel> {
  const d = bag(context);
  const collections = d.collections ?? {};
  const wanted = COLLECTION_ALIASES[key] ?? [key];
  for (const k of wanted) {
    const hit = collections[k];
    if (Array.isArray(hit) && hit.length > 0) return hit as ReadonlyArray<ProductCardModel>;
  }
  const flat = arr<ProductCardModel>(d.products);
  if (flat.length > 0) return flat;
  // Any non-empty named collection as a last resort for well-known keys (never for an explicit id).
  if (key in COLLECTION_ALIASES) {
    for (const k of Object.keys(collections)) {
      const hit = collections[k];
      if (Array.isArray(hit) && hit.length > 0) return hit as ReadonlyArray<ProductCardModel>;
    }
  }
  return [];
}

export function categoriesFromContext(context: StorefrontContext): ReadonlyArray<CategoryCardModel> {
  return arr<CategoryCardModel>(bag(context).categories);
}
export function brandsFromContext(context: StorefrontContext): ReadonlyArray<BrandModel> {
  return arr<BrandModel>(bag(context).brands);
}
export function testimonialsFromContext(context: StorefrontContext): ReadonlyArray<ReviewModel> {
  const d = bag(context);
  const t = arr<ReviewModel>(d.testimonials);
  return t.length > 0 ? t : arr<ReviewModel>(d.reviews);
}
export function faqFromContext(context: StorefrontContext): ReadonlyArray<FaqItem> {
  return arr<FaqItem>(bag(context).faq);
}
export function articlesFromContext(context: StorefrontContext): ReadonlyArray<ArticleCardModel> {
  return arr<ArticleCardModel>(bag(context).articles);
}
export function featuredCollectionsFromContext(context: StorefrontContext): ReadonlyArray<CollectionCardModel> {
  return arr<CollectionCardModel>(bag(context).featuredCollections);
}
export function isLoading(context: StorefrontContext): boolean {
  return bag(context).loading === true;
}
export function hasError(context: StorefrontContext): boolean {
  return bag(context).error != null;
}

export interface PageHeaderData {
  title?: string;
  description?: string;
  image?: string;
  breadcrumbs?: ReadonlyArray<{ label: string; url: string }>;
}
export function pageHeaderFromContext(context: StorefrontContext): PageHeaderData {
  const v = bag(context).pageHeader;
  return (v && typeof v === 'object' ? v : {}) as PageHeaderData;
}

/* ------------------------------------------------------------ demo fallbacks */

function demoProducts(themeId: string, locale: string, key: string): ReadonlyArray<ProductCardModel> {
  const all = catalogFor(themeId, locale).products;
  switch (key) {
    case 'bestsellers':
      return [...all].sort((a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0));
    case 'sale': {
      const sale = all.filter((p) => p.compareAtPrice && p.compareAtPrice > p.price);
      return sale.length > 0 ? sale : all;
    }
    case 'trending':
      return [...all].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    case 'featured':
      return all.slice(0, 8);
    default:
      return all;
  }
}

const DEMO_ARTICLES = (locale: string): ReadonlyArray<ArticleCardModel> => {
  const ar = locale.startsWith('ar');
  const mk = (i: number, title: string, excerpt: string, category: string, seed: string): ArticleCardModel => ({
    id: `demo-a${i}`,
    title,
    url: '/blog',
    excerpt,
    category,
    image: { src: `https://images.unsplash.com/${seed}?auto=format&fit=crop&w=900&h=600&q=80`, alt: '' },
    publishedAt: '2026-08-01',
    readingMinutes: 4 + i,
  });
  return ar
    ? [
        mk(1, 'كيف تختار المنتج المناسب لك', 'دليل عملي قصير قبل الشراء.', 'نصائح', 'photo-1523275335684-37898b6baf30'),
        mk(2, 'وصل حديثاً هذا الموسم', 'نظرة على أبرز الإضافات الجديدة.', 'جديدنا', 'photo-1441986300917-64674bd600d8'),
        mk(3, 'أسئلة شائعة عن الشحن والإرجاع', 'كل ما تحتاج معرفته في مكان واحد.', 'خدمة العملاء', 'photo-1556740749-887f6717d7e4'),
      ]
    : [
        mk(1, 'How to choose the right product', 'A short practical guide before you buy.', 'Tips', 'photo-1523275335684-37898b6baf30'),
        mk(2, 'New this season', 'A look at the latest additions.', 'New in', 'photo-1441986300917-64674bd600d8'),
        mk(3, 'Shipping & returns, explained', 'Everything you need to know in one place.', 'Support', 'photo-1556740749-887f6717d7e4'),
      ];
};

/* ------------------------------------------------------------ hook */

export interface SectionData {
  /** Products for an editor collection key ('newest' | 'featured' | 'bestsellers' | 'sale' | 'trending' | id). */
  products: (key: string, limit?: number) => ReadonlyArray<ProductCardModel>;
  categories: (limit?: number) => ReadonlyArray<CategoryCardModel>;
  brands: () => ReadonlyArray<BrandModel>;
  testimonials: () => ReadonlyArray<ReviewModel>;
  faq: () => ReadonlyArray<FaqItem>;
  articles: (limit?: number) => ReadonlyArray<ArticleCardModel>;
  collections: () => ReadonlyArray<CollectionCardModel>;
  /** One product by id or handle across every collection the page serves (demo catalogue in preview). */
  product: (idOrHandle: string) => ProductCardModel | undefined;
  /** One category by id or url slug (demo catalogue in preview). */
  category: (idOrSlug: string) => CategoryCardModel | undefined;
  pageHeader: () => PageHeaderData;
  loading: boolean;
  error: boolean;
  /** True when the reader is filling from demo data (dev / preview only). */
  demo: boolean;
}

/**
 * Readers bound to the active theme + locale so the DEV/preview fallback can pick the matching demo
 * catalogue. Production stores (no `?preview=1`) never see demo data.
 */
export function useSectionData(context: StorefrontContext): SectionData {
  const manifest = useThemeManifest();
  const locale = useLocaleCode();
  const themeId = manifest.id;
  return useMemo<SectionData>(() => {
    const demo = previewOrDev();
    const catalog = demo ? catalogFor(themeId, locale) : null;
    const products = (key: string, limit?: number): ReadonlyArray<ProductCardModel> => {
      let out = productsFromContext(context, key);
      if (out.length === 0 && catalog) out = demoProducts(themeId, locale, key);
      return limit !== undefined ? out.slice(0, limit) : out;
    };
    const categories = (limit?: number): ReadonlyArray<CategoryCardModel> => {
      let out = categoriesFromContext(context);
      if (out.length === 0 && catalog) out = catalog.categories;
      return limit !== undefined ? out.slice(0, limit) : out;
    };
    const brands = (): ReadonlyArray<BrandModel> => {
      const out = brandsFromContext(context);
      if (out.length > 0 || !catalog) return out;
      return catalog.brands.map((b, i) => ({ id: `demo-b${i}`, name: b.name, slug: b.name.toLowerCase().replace(/\s+/g, '-'), url: '/brands' }));
    };
    const testimonials = (): ReadonlyArray<ReviewModel> => {
      const out = testimonialsFromContext(context);
      if (out.length > 0 || !catalog) return out;
      return catalog.testimonials.map((t, i) => ({ id: `demo-t${i}`, author: t.author, rating: t.rating, body: t.quote, verified: true }));
    };
    const faq = (): ReadonlyArray<FaqItem> => {
      const out = faqFromContext(context);
      if (out.length > 0 || !catalog) return out;
      return catalog.faqs;
    };
    const articles = (limit?: number): ReadonlyArray<ArticleCardModel> => {
      let out = articlesFromContext(context);
      if (out.length === 0 && catalog) out = DEMO_ARTICLES(locale);
      return limit !== undefined ? out.slice(0, limit) : out;
    };
    const product = (idOrHandle: string): ProductCardModel | undefined => {
      const key = idOrHandle.trim();
      if (!key) return undefined;
      const match = (p: ProductCardModel): boolean => p.id === key || p.handle === key || p.url.endsWith(`/${key}`);
      const d = bag(context);
      for (const hit of Object.values(d.collections ?? {})) {
        if (Array.isArray(hit)) {
          const found = (hit as ReadonlyArray<ProductCardModel>).find(match);
          if (found) return found;
        }
      }
      const flat = arr<ProductCardModel>(d.products).find(match);
      if (flat) return flat;
      return catalog?.products.find(match);
    };
    const category = (idOrSlug: string): CategoryCardModel | undefined => {
      const key = idOrSlug.trim();
      if (!key) return undefined;
      const match = (c: CategoryCardModel): boolean => c.id === key || c.url.endsWith(`/${key}`);
      return categoriesFromContext(context).find(match) ?? catalog?.categories.find(match);
    };
    return {
      products,
      categories,
      brands,
      testimonials,
      faq,
      articles,
      collections: () => featuredCollectionsFromContext(context),
      product,
      category,
      pageHeader: () => pageHeaderFromContext(context),
      loading: isLoading(context),
      error: hasError(context),
      demo,
    };
  }, [context, themeId, locale]);
}
