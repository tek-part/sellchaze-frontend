/**
 * featured-products — a product set (newest / featured / bestsellers / sale / trending or a
 * collection id) as a grid or a scroll-snap carousel. The workhorse merchandising section.
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../theme-engine/rendering';
import { defineSection, fields, OPTIONS, spacingFields, tr } from '../schema';
import { bool, gridStyle, num, str, spacingStyle, useSectionSettings } from '../use-section';
import { useSectionData } from '../data';
import { LibCarousel, LibEmpty, LibGrid, LibProductCard, LibProductSkeleton, LibSection } from '../primitives';
import { useLibT } from '../i18n';

export const PRODUCT_CARD_FIELDS = [
  fields.toggle('show_badges', 'Show badges (sale %, new)', true),
  fields.toggle('show_ratings', 'Show ratings', true),
  fields.toggle('show_quick_add', 'Show quick add', true),
  fields.toggle('show_wishlist', 'Show wishlist heart', true),
] as const;

export const featuredProductsSchema = defineSection({
  type: 'featured-products',
  label: 'Featured products',
  description: 'A product collection as a grid or carousel.',
  category: 'products',
  icon: 'HiOutlineShoppingBag',
  settings: [
    fields.text('title', 'Title', tr('وصل حديثاً', 'New arrivals')),
    fields.text('subtitle', 'Subtitle', ''),
    fields.collection('collection', 'Collection', 'newest'),
    fields.select('layout', 'Layout', OPTIONS.layout, 'grid'),
    fields.select('columns', 'Columns', OPTIONS.columns(2, 6), '4'),
    fields.range('limit', 'Products to show', 8, 1, 24),
    ...PRODUCT_CARD_FIELDS,
    fields.url('view_all_url', 'View-all link', '/shop'),
    fields.text('view_all_label', 'View-all label', ''),
    ...spacingFields(),
  ],
  presets: [
    { label: 'Best sellers', settings: { title: tr('الأكثر مبيعاً', 'Best sellers'), collection: 'bestsellers', view_all_url: '/collections/best-sellers' } },
    { label: 'On sale', settings: { title: tr('تخفيضات', 'On sale'), collection: 'sale' } },
    { label: 'Trending carousel', settings: { title: tr('الأكثر رواجاً', 'Trending now'), collection: 'trending', layout: 'carousel' } },
  ],
});

export function FeaturedProducts(props: SectionRenderProps): ReactElement | null {
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
    : products.map((p, i) => <LibProductCard key={p.id} product={p} {...card} eager={i < columns} />);

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
