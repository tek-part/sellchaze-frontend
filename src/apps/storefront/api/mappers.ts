/**
 * Mappers — API DTO → storefront view-model. The single bridge between backend field names and the
 * theme's presentation contracts. Defensive: tolerates string/number prices, missing images, etc.
 */
import type {
  ArticleCardModel,
  BrandModel,
  CategoryCardModel,
  CollectionCardModel,
  CouponModel,
  ProductCardModel,
  ProductDetailModel,
  ProductImage,
  ProductMediaModel,
  ProductSpec,
  ProductVariantModel,
  ReviewModel,
} from '../types/catalog';
import type { ApiBrand, ApiCategory, ApiCollection, ApiCoupon, ApiProduct, ApiReview, ApiVariant } from './types';
import { sanitizeHtml } from '../../../shared/utils/sanitizeHtml';

function toNumber(value: string | number | null | undefined): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function toProductCard(product: ApiProduct, currency: string, multiplier = 1): ProductCardModel {
  const price = toNumber(product.price) * multiplier;
  const compare = product.compare_price != null ? toNumber(product.compare_price) * multiplier : undefined;
  const image = product.image_url ?? product.image ?? undefined;
  const responsive = product.image_responsive ?? undefined;
  const hover = product.images && product.images.length > 1 ? product.images[1] : undefined;
  const tags = product.tags?.filter((t): t is string => typeof t === 'string' && t.trim().length > 0);

  return {
    id: String(product.id),
    digitalType: product.digital_type ?? 'physical',
    ...(product.order_quantity_limit != null && product.order_quantity_limit > 0 ? { orderMaxQuantity: product.order_quantity_limit } : {}),
    ...(product.digital_type === 'codes' && product.digital_pool_stock != null ? { sharedMaxQuantity: product.digital_pool_stock } : {}),
    hasPersonalization: product.has_personalization === true || !!product.personalization_fields?.length,
    handle: product.slug,
    title: product.name,
    url: `/products/${product.slug}`,
    price,
    currency,
    ...(product.stock != null ? { availableStock: product.stock } : {}),
    ...(product.variants?.length ? { variants: product.variants.map((variant) => toVariant(variant, multiplier)) } : {}),
    soldOut: product.is_active === false || (product.variants?.length ? product.variants.every((variant) => !toVariant(variant).available) : product.stock != null && product.stock <= 0),
    ...(compare && compare > price ? { compareAtPrice: compare } : {}),
    ...(image ? { image: {
      src: responsive?.src ?? image,
      alt: product.name,
      ...(responsive?.srcset ? { srcSet: responsive.srcset } : {}),
      ...(responsive?.sizes ? { sizes: responsive.sizes } : {}),
    } } : {}),
    ...(hover ? { hoverImage: { src: hover, alt: '' } } : {}),
    ...(product.is_featured ? { badge: 'Featured' } : {}),
    ...(typeof product.rating === 'number' ? { rating: product.rating } : {}),
    ...(typeof product.reviews_count === 'number' ? { reviewCount: product.reviews_count } : {}),
    ...(product.brand ? { vendor: product.brand } : {}),
    ...(product.material ? { material: product.material } : {}),
    ...(tags && tags.length > 0 ? { tags } : {}),
    ...(product.category?.slug ? { categorySlug: product.category.slug } : {}),
    ...(product.category?.name ? { categoryName: product.category.name } : {}),
  };
}

/** Flatten specifications/dimensions + scalar attributes into ordered PDP spec rows. */
function toSpecs(product: ApiProduct): ProductSpec[] {
  const rows: ProductSpec[] = [];
  const push = (label: string, value: unknown): void => {
    if (value == null) return;
    const text = typeof value === 'string' ? value.trim() : String(value);
    if (text) rows.push({ label, value: text });
  };
  const spread = (source: Record<string, unknown> | ReadonlyArray<unknown> | null | undefined): void => {
    if (!source) return;
    if (Array.isArray(source)) {
      for (const entry of source) {
        if (entry && typeof entry === 'object') {
          const o = entry as Record<string, unknown>;
          if ('label' in o || 'name' in o || 'key' in o) push(String(o.label ?? o.name ?? o.key), o.value ?? o.val);
        }
      }
    } else if (typeof source === 'object') {
      for (const [k, v] of Object.entries(source)) {
        if (v != null && typeof v !== 'object') push(k, v);
      }
    }
  };
  spread(product.specifications);
  spread(product.dimensions);
  push('Material', product.material);
  push('Weight', product.weight);
  push('Warranty', product.warranty);
  push('Origin', product.origin_country);
  push('Manufacturer', product.manufacturer);
  return rows;
}

export function productImages(product: ApiProduct): ProductImage[] {
  const list = new Set<string>();
  const primary = product.image_url ?? product.image;
  if (primary) list.add(primary);
  if (product.images) for (const src of product.images) list.add(src);
  return Array.from(list).map((src) => {
    const responsive = src === primary ? product.image_responsive : undefined;
    return {
      src: responsive?.src ?? src,
      alt: product.name,
      ...(responsive?.srcset ? { srcSet: responsive.srcset } : {}),
      ...(responsive?.sizes ? { sizes: responsive.sizes } : {}),
    };
  });
}

export function productMedia(product: ApiProduct): ProductMediaModel[] {
  const primary = product.image_url ?? product.image;
  const media: ProductMediaModel[] = [];
  const add = (src: string, type: 'image' | 'video', alt?: string | null): void => {
    if (!/^(https?:\/\/|\/(?!\/))/i.test(src) || media.some((item) => item.src === src)) return;
    media.push({ src, type, alt: alt || product.name });
  };
  if (primary) add(primary, 'image');
  for (const item of product.media ?? []) add(item.url, item.type === 'video' ? 'video' : 'image', item.alt);
  for (const item of productImages(product)) add(item.src, 'image', item.alt);
  return media;
}

function toVariant(variant: ApiVariant, multiplier = 1): ProductVariantModel {
  const fromOptions = variant.options ? Object.values(variant.options).join(' / ') : '';
  const label = variant.name ?? (fromOptions || `Variant ${variant.id}`);
  const available = variant.is_active !== false && (variant.stock == null || variant.stock > 0);
  const price = variant.price != null ? toNumber(variant.price) * multiplier : undefined;
  return { id: String(variant.id), label, available, ...(price !== undefined ? { price } : {}),
    ...(variant.image_url && /^(https?:\/\/|\/(?!\/))/i.test(variant.image_url) ? { image: { src: variant.image_url, alt: label } } : {}),
    ...(variant.options ? { options: variant.options } : {}),
    ...(variant.compare_price != null ? { compareAtPrice: toNumber(variant.compare_price) * multiplier } : {}),
    ...(variant.stock != null ? { availableStock: variant.stock } : {}),
  };
}

export function toProductDetail(product: ApiProduct, currency: string, multiplier = 1): ProductDetailModel {
  const base = toProductCard(product, currency, multiplier);
  const images = productImages(product);
  // An empty variants array means the product simply has no variants — NOT "every variant is
  // unavailable". Treat only a non-empty list as variant-gated; otherwise the product is buyable.
  const variants = product.variants && product.variants.length > 0
    ? product.variants.map((variant) => toVariant(variant, multiplier))
    : undefined;
  const anyAvailable = product.is_active !== false && (variants ? variants.some((v) => v.available) : product.stock == null || product.stock > 0);
  // Security: product descriptions are merchant-authored HTML rendered into shoppers' browsers via
  // `dangerouslySetInnerHTML` by the themes. Sanitise centrally here (defence-in-depth) so every
  // theme receives already-safe markup — no theme change required. See docs/security.
  const descriptionHtml = sanitizeHtml(product.long_description ?? product.description);
  const highlights = product.highlights?.filter((h): h is string => typeof h === 'string' && h.trim().length > 0);
  const specs = toSpecs(product);
  return {
    ...base,
    images: images.length > 0 ? images : base.image ? [base.image] : [],
    media: productMedia(product),
    optionDisplay: product.option_display ?? [],
    personalizationFields: product.personalization_fields ?? [],
    ...(product.sku ? { sku: product.sku } : {}),
    ...(descriptionHtml ? { descriptionHtml } : {}),
    ...(variants && variants.length > 0 ? { variants } : {}),
    ...(highlights && highlights.length > 0 ? { highlights } : {}),
    ...(specs.length > 0 ? { specs } : {}),
    ...(product.shipping_returns ? { shippingReturns: product.shipping_returns } : {}),
    ...(product.care_instructions ? { careInstructions: product.care_instructions } : {}),
    ...(product.warranty ? { warranty: product.warranty } : {}),
    inStock: anyAvailable,
  };
}

export function toCollectionCard(collection: ApiCollection): CollectionCardModel {
  const image = collection.image_url ?? undefined;
  return {
    id: String(collection.id),
    title: collection.name,
    url: `/collections/${collection.slug}`,
    ...(image ? { image: { src: image } } : {}),
    ...(typeof collection.products_count === 'number' ? { subtitle: `${collection.products_count} items` } : {}),
  };
}

export function toBrand(brand: ApiBrand): BrandModel {
  return {
    id: String(brand.id),
    name: brand.name,
    slug: brand.slug,
    url: `/search?q=${encodeURIComponent(brand.name)}`,
    ...(brand.logo_url ? { logo: brand.logo_url } : {}),
    ...(brand.website ? { website: brand.website } : {}),
    ...(typeof brand.products_count === 'number' ? { productCount: brand.products_count } : {}),
  };
}

export function toCoupon(coupon: ApiCoupon): CouponModel {
  return {
    code: coupon.code,
    type: coupon.type,
    value: toNumber(coupon.value),
    ...(coupon.minimum_order_amount != null ? { minimumOrder: toNumber(coupon.minimum_order_amount) } : {}),
    ...(coupon.expires_at ? { expiresAt: coupon.expires_at } : {}),
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
