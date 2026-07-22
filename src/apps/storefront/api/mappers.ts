/**
 * Mappers — API DTO → storefront view-model. The single bridge between backend field names and the
 * theme's presentation contracts. Defensive: tolerates string/number prices, missing images, etc.
 */
import type {
  ArticleCardModel,
  CategoryCardModel,
  ProductCardModel,
  ProductDetailModel,
  ProductImage,
  ProductVariantModel,
  ReviewModel,
} from '../types/catalog';
import type { ApiCategory, ApiProduct, ApiReview, ApiVariant } from './types';
import { sanitizeHtml } from '../../../shared/utils/sanitizeHtml';

function toNumber(value: string | number | null | undefined): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function toProductCard(product: ApiProduct, currency: string): ProductCardModel {
  const price = toNumber(product.price);
  const compare = product.compare_price != null ? toNumber(product.compare_price) : undefined;
  const image = product.image_url ?? product.image ?? undefined;
  const hover = product.images && product.images.length > 1 ? product.images[1] : undefined;

  return {
    id: String(product.id),
    handle: product.slug,
    title: product.name,
    url: `/products/${product.slug}`,
    price,
    currency,
    ...(compare && compare > price ? { compareAtPrice: compare } : {}),
    ...(image ? { image: { src: image, alt: product.name } } : {}),
    ...(hover ? { hoverImage: { src: hover, alt: '' } } : {}),
    ...(product.is_featured ? { badge: 'Featured' } : {}),
    ...(typeof product.rating === 'number' ? { rating: product.rating } : {}),
    ...(typeof product.reviews_count === 'number' ? { reviewCount: product.reviews_count } : {}),
  };
}

export function productImages(product: ApiProduct): ProductImage[] {
  const list = new Set<string>();
  if (product.images) for (const src of product.images) list.add(src);
  const primary = product.image_url ?? product.image;
  if (primary) list.add(primary);
  return Array.from(list).map((src) => ({ src, alt: product.name }));
}

function toVariant(variant: ApiVariant): ProductVariantModel {
  const fromOptions = variant.options ? Object.values(variant.options).join(' / ') : '';
  const label = variant.name ?? (fromOptions || `Variant ${variant.id}`);
  const available = variant.is_active !== false && (variant.stock == null || variant.stock > 0);
  const price = variant.price != null ? toNumber(variant.price) : undefined;
  return { id: String(variant.id), label, available, ...(price !== undefined ? { price } : {}) };
}

export function toProductDetail(product: ApiProduct, currency: string): ProductDetailModel {
  const base = toProductCard(product, currency);
  const images = productImages(product);
  const variants = product.variants?.map(toVariant);
  const anyAvailable = variants ? variants.some((v) => v.available) : true;
  // Security: product descriptions are merchant-authored HTML rendered into shoppers' browsers via
  // `dangerouslySetInnerHTML` by the themes. Sanitise centrally here (defence-in-depth) so every
  // theme receives already-safe markup — no theme change required. See docs/security.
  const descriptionHtml = sanitizeHtml(product.description);
  return {
    ...base,
    images: images.length > 0 ? images : base.image ? [base.image] : [],
    ...(product.sku ? { sku: product.sku } : {}),
    ...(descriptionHtml ? { descriptionHtml } : {}),
    ...(variants && variants.length > 0 ? { variants } : {}),
    inStock: anyAvailable,
  };
}

export function toCategoryCard(category: ApiCategory): CategoryCardModel {
  const image = category.image_url ?? category.image ?? undefined;
  return {
    id: String(category.id),
    title: category.name,
    url: `/collections/${category.slug}`,
    ...(image ? { image: { src: image } } : {}),
    ...(typeof category.products_count === 'number' ? { meta: `${category.products_count} pieces` } : {}),
  };
}

export function toReview(review: ApiReview): ReviewModel {
  return {
    id: String(review.id),
    author: review.author_name ?? review.customer?.name ?? 'Verified client',
    rating: review.rating,
    body: review.body ?? review.title ?? '',
    ...(review.created_at ? { createdAt: review.created_at } : {}),
    ...(review.is_verified ? { verified: true } : {}),
  };
}

/** Blog/article DTO is loose (endpoint TBD); keep the mapper ready for Phase 6 wiring. */
export function toArticleCard(input: {
  id: number | string;
  title: string;
  slug: string;
  excerpt?: string | null;
  image_url?: string | null;
  category?: string | null;
  published_at?: string | null;
  reading_minutes?: number | null;
}): ArticleCardModel {
  return {
    id: String(input.id),
    title: input.title,
    url: `/blog/${input.slug}`,
    ...(input.excerpt ? { excerpt: input.excerpt } : {}),
    ...(input.image_url ? { image: { src: input.image_url } } : {}),
    ...(input.category ? { category: input.category } : {}),
    ...(input.published_at ? { publishedAt: input.published_at } : {}),
    ...(typeof input.reading_minutes === 'number' ? { readingMinutes: input.reading_minutes } : {}),
  };
}
