/**
 * Curated storefront views — the merchandising slugs the primary navigation points at.
 *
 * The storefront API has no `sort` parameter and no sales data (`GET /storefront/products` accepts
 * only `category` and `per_page`), so these views are derived client-side from the page the API
 * already returns. Each one states honestly what it is ranked by rather than implying data we do
 * not have:
 *
 * - `all`          — everything, in the catalogue's own order.
 * - `new-arrivals` — the API orders by `position` then `id DESC`, so its natural order is already
 *                    newest-first. No re-sort is applied; claiming a true recency sort would need a
 *                    `created_at` field the product resource does not expose.
 * - `best-sellers` — ranked by review count then rating. There is no sales endpoint, so this is
 *                    described to shoppers as "most reviewed", never as literal sales rank.
 */
import type { ProductCardModel } from '../types/catalog';

export type CuratedSlug = 'all' | 'new-arrivals' | 'best-sellers';

export interface CuratedView {
  /** Translation keys, so the copy lives in the i18n layer rather than in a data module. */
  titleKey: string;
  descriptionKey: string;
  /** Ranking applied on top of the API order, if any. */
  rank?: (products: ReadonlyArray<ProductCardModel>) => ReadonlyArray<ProductCardModel>;
}

const CURATED: Readonly<Record<CuratedSlug, CuratedView>> = {
  all: {
    titleKey: 'curated.allTitle',
    descriptionKey: 'curated.allDescription',
  },
  'new-arrivals': {
    titleKey: 'curated.newTitle',
    descriptionKey: 'curated.newDescription',
  },
  'best-sellers': {
    titleKey: 'curated.bestTitle',
    descriptionKey: 'curated.bestDescription',
    rank: (products) =>
      [...products].sort((a, b) => {
        const byReviews = (b.reviewCount ?? 0) - (a.reviewCount ?? 0);
        return byReviews !== 0 ? byReviews : (b.rating ?? 0) - (a.rating ?? 0);
      }),
  },
};

export function isCuratedSlug(slug: string): slug is CuratedSlug {
  return slug === 'all' || slug === 'new-arrivals' || slug === 'best-sellers';
}

export function curatedView(slug: CuratedSlug): CuratedView {
  return CURATED[slug];
}
