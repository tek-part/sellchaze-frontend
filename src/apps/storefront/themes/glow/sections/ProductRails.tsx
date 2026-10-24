/**
 * Glow overrides of the library product sections — same schemas (so the customizer form is
 * identical), rendered with the Glow card:
 *   featured-products · product-grid (with a count + sort toolbar) · related-products
 */
import { useState, type ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import type { ProductCardModel } from '../../../types/catalog';
import { cn } from '../../../../../shared/utils/cn';
import { featuredProductsSchema } from '../../../sections-lib/components/FeaturedProducts';
import { productGridSchema } from '../../../sections-lib/components/ProductGrid';
import { relatedProductsSchema } from '../../../sections-lib/components/RelatedProducts';
import {
  LibCarousel, LibEmpty, LibGrid, LibProductSkeleton, LibSection, gridStyle, num, spacingStyle, str, useLibId, useLibT,
  useLocaleCode, useSectionData, useSectionSettings, useVariant,
} from '../../../sections-lib';
import { GlProductCard, type GlProductCardProps } from '../components/ProductCard';
import { glText } from '../components/i18n';

type CardOptions = Pick<GlProductCardProps, 'showBadges' | 'showRatings' | 'showQuickAdd' | 'showWishlist'>;

function cardOptions(s: Readonly<Record<string, unknown>>): CardOptions {
  const read = (k: string): boolean => (typeof s[k] === 'boolean' ? (s[k] as boolean) : true);
  return { showBadges: read('show_badges'), showRatings: read('show_ratings'), showQuickAdd: read('show_quick_add'), showWishlist: read('show_wishlist') };
}

function sizesFor(columns: number): string {
  return `(min-width: 1280px) ${Math.round(100 / columns)}vw, (min-width: 1024px) 33vw, 50vw`;
}

export function GlProductSet(props: { layout: string; products: ReadonlyArray<ProductCardModel>; columns: number; card: CardOptions; ariaLabel: string; loading?: boolean; limit?: number }): ReactElement {
  const { layout, products, columns, card, ariaLabel, loading = false, limit = 8 } = props;
  const t = useLibT();
  if (loading && products.length === 0) {
    return <LibGrid style={gridStyle(columns)}>{Array.from({ length: Math.min(limit, columns * 2) }, (_, i) => <LibProductSkeleton key={i} />)}</LibGrid>;
  }
  if (products.length === 0) return <LibEmpty message={t('emptyProducts')} />;
  if (layout === 'carousel') {
    return (
      <LibCarousel ariaLabel={ariaLabel} itemSize="card" className="gl-rail">
        {products.map((p) => <GlProductCard key={p.id} product={p} {...card} sizes="(min-width: 1024px) 22vw, 60vw" />)}
      </LibCarousel>
    );
  }
  const featured = layout === 'featured-first';
  return (
    <LibGrid style={gridStyle(featured ? Math.max(columns, 3) : columns)} className={cn('gl-grid', featured && 'gl-grid--featured', layout === 'list' && 'gl-grid--list')}>
      {products.map((p, i) => (
        <GlProductCard key={p.id} product={p} {...card} sizes={featured && i === 0 ? '(min-width: 1024px) 50vw, 100vw' : sizesFor(columns)} className={featured && i === 0 ? 'gl-card--feature' : undefined} />
      ))}
    </LibGrid>
  );
}

/* ------------------------------------------------------------ featured-products */

export function GlFeaturedProducts(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(featuredProductsSchema, props.settings);
  const layout = useVariant(featuredProductsSchema, props.settings);
  const data = useSectionData(props.context);
  const t = useLibT();
  const limit = num(s, 'limit', 8);
  const products = data.products(str(s, 'collection', 'newest'), limit);
  const title = str(s, 'title');
  const loading = data.loading && products.length === 0;
  if (!loading && products.length === 0 && !title) return null;
  return (
    <LibSection title={title} subtitle={str(s, 'subtitle')} viewAllHref={str(s, 'view_all_url')} viewAllLabel={str(s, 'view_all_label')} style={spacingStyle(s)} className="gl-products">
      <GlProductSet layout={layout} products={products} columns={num(s, 'columns', 4)} card={cardOptions(s)} loading={loading} limit={limit} ariaLabel={title || t('products')} />
    </LibSection>
  );
}

/* ------------------------------------------------------------ product-grid (collection page) */

export type GlSort = 'featured' | 'price-asc' | 'price-desc' | 'rating' | 'name';
export const GL_SORTS: ReadonlyArray<GlSort> = ['featured', 'price-asc', 'price-desc', 'rating', 'name'];
const SORT_LABEL = { featured: 'sortFeatured', 'price-asc': 'sortPriceAsc', 'price-desc': 'sortPriceDesc', rating: 'sortRating', name: 'sortName' } as const;

/** Client-side ordering of the page's products (stable; the original order is "featured"). */
export function sortProducts(products: ReadonlyArray<ProductCardModel>, sort: GlSort, locale = 'en'): ReadonlyArray<ProductCardModel> {
  if (sort === 'featured') return products;
  const list = [...products];
  switch (sort) {
    case 'price-asc':
      return list.sort((a, b) => a.price - b.price);
    case 'price-desc':
      return list.sort((a, b) => b.price - a.price);
    case 'rating':
      return list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || (b.reviewCount ?? 0) - (a.reviewCount ?? 0));
    case 'name':
      return list.sort((a, b) => a.title.localeCompare(b.title, locale));
    default:
      return list;
  }
}

export function GlProductGrid(props: SectionRenderProps): ReactElement {
  const s = useSectionSettings(productGridSchema, props.settings);
  const data = useSectionData(props.context);
  const t = useLibT();
  const locale = useLocaleCode();
  const selectId = useLibId('gl-sort');
  const [sort, setSort] = useState<GlSort>('featured');
  const raw = data.products(str(s, 'source', 'all'), num(s, 'limit', 24));
  const products = sortProducts(raw, sort, locale);
  const columns = num(s, 'columns', 4);
  const loading = data.loading && raw.length === 0;
  const card = cardOptions(s);
  return (
    <LibSection title={str(s, 'title')} style={spacingStyle(s)} className="gl-listing">
      {!loading && raw.length > 0 ? (
        <div className="gl-toolbar">
          <p className="gl-toolbar__count" role="status">{glText(locale, 'productCount', { n: new Intl.NumberFormat(locale).format(raw.length) })}</p>
          <div className="gl-toolbar__sort">
            <label htmlFor={selectId}>{glText(locale, 'sortBy')}</label>
            <span className="gl-select">
              <select id={selectId} value={sort} onChange={(e) => setSort(e.target.value as GlSort)}>
                {GL_SORTS.map((key) => <option key={key} value={key}>{glText(locale, SORT_LABEL[key])}</option>)}
              </select>
            </span>
          </div>
        </div>
      ) : null}
      {loading ? (
        <LibGrid style={gridStyle(columns)}>{Array.from({ length: columns * 2 }, (_, i) => <LibProductSkeleton key={i} />)}</LibGrid>
      ) : products.length === 0 ? (
        <LibEmpty message={data.error ? t('loadFailed') : t('emptyProducts')} />
      ) : (
        <LibGrid style={gridStyle(columns)} className="gl-grid">
          {products.map((p, i) => <GlProductCard key={p.id} product={p} {...card} eager={i < Math.min(columns, 2)} sizes={sizesFor(columns)} />)}
        </LibGrid>
      )}
    </LibSection>
  );
}

/* ------------------------------------------------------------ related-products */

export function GlRelatedProducts(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(relatedProductsSchema, props.settings);
  const data = useSectionData(props.context);
  const products = data.products(str(s, 'collection', 'related'), num(s, 'limit', 8));
  if (products.length === 0) return null;
  const title = str(s, 'title');
  return (
    <LibSection title={title} style={spacingStyle(s)} className="gl-products">
      <GlProductSet layout={str(s, 'layout', 'carousel') === 'carousel' ? 'carousel' : 'grid'} products={products} columns={num(s, 'columns', 4)} card={cardOptions(s)} ariaLabel={title} />
    </LibSection>
  );
}

