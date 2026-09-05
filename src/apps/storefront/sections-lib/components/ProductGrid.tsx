/**
 * product-grid — the category/collection page listing (`source: all` = the page's own products) or
 * any named collection. Shows skeletons while loading and an empty state with no products.
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../theme-engine/rendering';
import { defineSection, fields, OPTIONS, spacingFields } from '../schema';
import { bool, gridStyle, num, spacingStyle, str, useSectionSettings } from '../use-section';
import { useSectionData } from '../data';
import { LibEmpty, LibGrid, LibProductCard, LibProductSkeleton, LibSection } from '../primitives';
import { useLibT } from '../i18n';
import { PRODUCT_CARD_FIELDS } from './FeaturedProducts';

export const productGridSchema = defineSection({
  type: 'product-grid',
  label: 'Product grid',
  description: 'The product listing of a category page.',
  category: 'products',
  icon: 'HiOutlineSquares2X2',
  settings: [
    fields.text('title', 'Title', ''),
    fields.collection('source', 'Source', 'all', '"all" = the products of this page; or a collection key/id.'),
    fields.select('columns', 'Columns', OPTIONS.columns(2, 6), '4'),
    fields.range('limit', 'Max products', 24, 1, 60),
    ...PRODUCT_CARD_FIELDS,
    ...spacingFields(32),
  ],
});

export function ProductGrid(props: SectionRenderProps): ReactElement {
  const s = useSectionSettings(productGridSchema, props.settings);
  const data = useSectionData(props.context);
  const t = useLibT();
  const products = data.products(str(s, 'source', 'all'), num(s, 'limit', 24));
  const columns = num(s, 'columns', 4);
  const loading = data.loading && products.length === 0;
  const card = { showBadges: bool(s, 'show_badges', true), showRatings: bool(s, 'show_ratings', true), showQuickAdd: bool(s, 'show_quick_add', true), showWishlist: bool(s, 'show_wishlist', true) };
  return (
    <LibSection title={str(s, 'title')} style={spacingStyle(s)}>
      {loading ? (
        <LibGrid style={gridStyle(columns)}>{Array.from({ length: columns * 2 }, (_, i) => <LibProductSkeleton key={i} />)}</LibGrid>
      ) : products.length === 0 ? (
        <LibEmpty message={data.error ? t('loadFailed') : t('emptyProducts')} />
      ) : (
        <LibGrid style={gridStyle(columns)}>
          {products.map((p, i) => <LibProductCard key={p.id} product={p} {...card} eager={i < columns} />)}
        </LibGrid>
      )}
    </LibSection>
  );
}
