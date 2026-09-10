/**
 * featured-products — a product set (newest / featured / bestsellers / sale / trending or a
 * collection id) in one of the shared product layouts (grid · carousel · list · featured-first).
 * The workhorse merchandising section.
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../theme-engine/rendering';
import { defineSection, fields, OPTIONS, spacingFields, tr, variantSelect } from '../schema';
import { bool, num, str, spacingStyle, useSectionSettings, useVariant } from '../use-section';
import { useSectionData } from '../data';
import { LibSection } from '../primitives';
import { useLibT } from '../i18n';
import { PRODUCT_CARD_FIELDS, PRODUCT_LAYOUTS, ProductSet } from './product-set';

export { PRODUCT_CARD_FIELDS } from './product-set';

export const featuredProductsSchema = defineSection({
  type: 'featured-products',
  label: 'Featured products',
  description: 'A product collection as a grid, carousel or list.',
  category: 'products',
  icon: 'HiOutlineShoppingBag',
  variants: PRODUCT_LAYOUTS,
  settings: [
    fields.text('title', 'Title', tr('وصل حديثاً', 'New arrivals')),
    fields.text('subtitle', 'Subtitle', ''),
    fields.collection('collection', 'Collection', 'newest'),
    variantSelect(PRODUCT_LAYOUTS, 'grid'),
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
    { label: 'Editor’s pick', settings: { title: tr('اختيارات المحرر', 'Editor’s picks'), collection: 'featured', layout: 'featured-first', limit: 5 } },
  ],
});

export function FeaturedProducts(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(featuredProductsSchema, props.settings);
  const layout = useVariant(featuredProductsSchema, props.settings);
  const data = useSectionData(props.context);
  const t = useLibT();
  const limit = num(s, 'limit', 8);
  const products = data.products(str(s, 'collection', 'newest'), limit);
  const title = str(s, 'title');
  const loading = data.loading && products.length === 0;
  if (!loading && products.length === 0 && !title) return null;
  const card = {
    showBadges: bool(s, 'show_badges', true),
    showRatings: bool(s, 'show_ratings', true),
    showQuickAdd: bool(s, 'show_quick_add', true),
    showWishlist: bool(s, 'show_wishlist', true),
  };
  return (
    <LibSection title={title} subtitle={str(s, 'subtitle')} viewAllHref={str(s, 'view_all_url')} viewAllLabel={str(s, 'view_all_label')} style={spacingStyle(s)}>
      <ProductSet
        layout={layout}
        products={products}
        columns={num(s, 'columns', 4)}
        card={card}
        loading={loading}
        limit={limit}
        ariaLabel={title || t('products')}
        emptyMessage={t('emptyProducts')}
      />
    </LibSection>
  );
}
