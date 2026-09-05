/**
 * featured-products (Techno) — the library section with the theme card (spec chips + compare).
 * Reuses the library schema so the customizer form is identical.
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { featuredProductsSchema } from '../../../sections-lib/components/FeaturedProducts';
import { LibCarousel, LibEmpty, LibGrid, LibProductSkeleton, LibSection, bool, gridStyle, num, spacingStyle, str, useLibT, useSectionData, useSectionSettings } from '../../../sections-lib';
import { TkProductCard } from '../components/ProductCard';

export function TkFeaturedProducts(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(featuredProductsSchema, props.settings);
  const data = useSectionData(props.context);
  const t = useLibT();
  const limit = num(s, 'limit', 8);
  const products = data.products(str(s, 'collection', 'newest'), limit);
  const title = str(s, 'title');
  const loading = data.loading && products.length === 0;
  if (!loading && products.length === 0 && !title) return null;
  const columns = num(s, 'columns', 4);
  const card = {
    showBadges: bool(s, 'show_badges', true),
    showRatings: bool(s, 'show_ratings', true),
    showQuickAdd: bool(s, 'show_quick_add', true),
    showWishlist: bool(s, 'show_wishlist', true),
  };
  const body = loading
    ? Array.from({ length: Math.min(limit, columns * 2) }, (_, i) => <LibProductSkeleton key={i} />)
    : products.map((p, i) => <TkProductCard key={p.id} product={p} {...card} eager={i < columns} />);

  return (
    <LibSection title={title} subtitle={str(s, 'subtitle')} viewAllHref={str(s, 'view_all_url')} viewAllLabel={str(s, 'view_all_label')} style={spacingStyle(s)}>
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
