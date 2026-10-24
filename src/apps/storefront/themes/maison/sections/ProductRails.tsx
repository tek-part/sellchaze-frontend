/**
 * Maison overrides of the library product rails — `featured-products`, `related-products` and the
 * collection `product-grid` — rendered with the Maison card (material/dimension line, wishlist
 * heart). Each reuses the library schema so the customizer form and stored data are unchanged.
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { featuredProductsSchema } from '../../../sections-lib/components/FeaturedProducts';
import { relatedProductsSchema } from '../../../sections-lib/components/RelatedProducts';
import { productGridSchema } from '../../../sections-lib/components/ProductGrid';
import { LibCarousel, LibEmpty, LibGrid, LibProductSkeleton, LibSection, bool, gridStyle, num, spacingStyle, str, useLibT, useSectionData, useSectionSettings } from '../../../sections-lib';
import type { ThemeSettings } from '../../../theme-engine/types';
import { MaisonCard } from '../components/ProductCard';

function cardOptions(s: ThemeSettings): { showBadges: boolean; showRatings: boolean; showQuickAdd: boolean; showWishlist: boolean } {
  return {
    showBadges: bool(s, 'show_badges', true),
    showRatings: bool(s, 'show_ratings', true),
    showQuickAdd: bool(s, 'show_quick_add', true),
    showWishlist: bool(s, 'show_wishlist', true),
  };
}

export function MaisonFeaturedProducts(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(featuredProductsSchema, props.settings);
  const data = useSectionData(props.context);
  const t = useLibT();
  const limit = num(s, 'limit', 8);
  const products = data.products(str(s, 'collection', 'newest'), limit);
  const title = str(s, 'title');
  const loading = data.loading && products.length === 0;
  if (!loading && products.length === 0 && !title) return null;
  const columns = num(s, 'columns', 4);
  const card = cardOptions(s);
  const body = loading
    ? Array.from({ length: Math.min(limit, columns * 2) }, (_, i) => <LibProductSkeleton key={i} />)
    : products.map((p) => <MaisonCard key={p.id} product={p} {...card} sizes={`(min-width: 1280px) ${Math.round(1320 / columns)}px, (min-width: 768px) ${Math.round(100 / Math.min(columns, 3))}vw, 46vw`} />);

  return (
    <LibSection className="mai-rail" title={title} subtitle={str(s, 'subtitle')} viewAllHref={str(s, 'view_all_url')} viewAllLabel={str(s, 'view_all_label')} style={spacingStyle(s)}>
      {!loading && products.length === 0 ? (
        <LibEmpty message={t('emptyProducts')} />
      ) : str(s, 'layout') === 'carousel' ? (
        <LibCarousel ariaLabel={title || t('products')} itemSize="card">{body}</LibCarousel>
      ) : (
        <LibGrid style={gridStyle(columns)}>{body}</LibGrid>
      )}
    </LibSection>
  );
}

export function MaisonRelatedProducts(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(relatedProductsSchema, props.settings);
  const data = useSectionData(props.context);
  const products = data.products(str(s, 'collection', 'related'), num(s, 'limit', 8));
  if (products.length === 0) return null;
  const card = cardOptions(s);
  const cards = products.map((p) => <MaisonCard key={p.id} product={p} {...card} />);
  return (
    <LibSection className="mai-rail" title={str(s, 'title')} style={spacingStyle(s)}>
      {str(s, 'layout', 'carousel') === 'carousel' ? (
        <LibCarousel ariaLabel={str(s, 'title')} itemSize="card">{cards}</LibCarousel>
      ) : (
        <LibGrid style={gridStyle(num(s, 'columns', 4))}>{cards}</LibGrid>
      )}
    </LibSection>
  );
}

export function MaisonProductGrid(props: SectionRenderProps): ReactElement {
  const s = useSectionSettings(productGridSchema, props.settings);
  const data = useSectionData(props.context);
  const t = useLibT();
  const products = data.products(str(s, 'source', 'all'), num(s, 'limit', 24));
  const columns = num(s, 'columns', 4);
  const loading = data.loading && products.length === 0;
  const card = cardOptions(s);
  return (
    <LibSection className="mai-rail mai-rail--grid" title={str(s, 'title')} style={spacingStyle(s)}>
      {loading ? (
        <LibGrid style={gridStyle(columns, 2)}>{Array.from({ length: columns * 2 }, (_, i) => <LibProductSkeleton key={i} />)}</LibGrid>
      ) : products.length === 0 ? (
        <LibEmpty message={data.error ? t('loadFailed') : t('emptyProducts')} />
      ) : (
        <LibGrid style={gridStyle(columns, 2)}>
          {products.map((p, i) => <MaisonCard key={p.id} product={p} {...card} eager={i < 2} />)}
        </LibGrid>
      )}
    </LibSection>
  );
}
