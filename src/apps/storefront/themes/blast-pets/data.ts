import type { StorefrontContext } from '../../theme-engine/rendering';
import type { ProductCardModel } from '../../types/catalog';
import { productsFromContext } from '../../sections-lib/data';

/** Authoritative empty merchant collections must never pick up preview products. */
export function petProducts(context: StorefrontContext, key: string, limit: number, category?: string): ReadonlyArray<ProductCardModel> {
  const authoritative = context.data['merchandisingCollections'] as Record<string, unknown> | undefined;
  const collections = context.data['collections'] as Record<string, unknown> | undefined;
  const select = (products: ReadonlyArray<ProductCardModel>) => (category ? products.filter(product => product.categorySlug === category) : products).slice(0, limit);
  if (Array.isArray(authoritative?.[key])) return select(authoritative[key] as ProductCardModel[]);
  if (Array.isArray(collections?.[key])) return select(collections[key] as ProductCardModel[]);
  if (!['all', 'featured', 'related', 'newest', 'new-arrivals', 'bestsellers', 'best-sellers', 'sale', 'on-sale', 'top-rated', 'trending', 'flash-deals'].includes(key)) return [];
  return select(productsFromContext(context, key));
}

export function slideIndex(index: number, count: number): number { return count > 0 ? ((index % count) + count) % count : 0; }
