/**
 * related-products — "you may also like" rail on the product page (reads `collections.related`).
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../theme-engine/rendering';
import { defineSection, fields, OPTIONS, spacingFields, tr } from '../schema';
import { bool, gridStyle, num, spacingStyle, str, useSectionSettings } from '../use-section';
import { useSectionData } from '../data';
import { LibCarousel, LibGrid, LibProductCard, LibSection } from '../primitives';
import { PRODUCT_CARD_FIELDS } from './FeaturedProducts';

export const relatedProductsSchema = defineSection({
  type: 'related-products',
  label: 'Related products',
  description: 'Products similar to the one being viewed.',
  category: 'products',
  icon: 'HiOutlineArrowsRightLeft',
  settings: [
    fields.text('title', 'Title', tr('قد يعجبك أيضاً', 'You may also like')),
    fields.collection('collection', 'Collection', 'related'),
    fields.select('layout', 'Layout', OPTIONS.layout, 'carousel'),
    fields.select('columns', 'Columns', OPTIONS.columns(2, 6), '4'),
    fields.range('limit', 'Products to show', 8, 1, 16),
    ...PRODUCT_CARD_FIELDS,
    ...spacingFields(48),
  ],
});

export function RelatedProducts(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(relatedProductsSchema, props.settings);
  const data = useSectionData(props.context);
  const products = data.products(str(s, 'collection', 'related'), num(s, 'limit', 8));
  if (products.length === 0) return null;
  const card = { showBadges: bool(s, 'show_badges', true), showRatings: bool(s, 'show_ratings', true), showQuickAdd: bool(s, 'show_quick_add', true), showWishlist: bool(s, 'show_wishlist', true) };
  const cards = products.map((p) => <LibProductCard key={p.id} product={p} {...card} />);
  return (
    <LibSection title={str(s, 'title')} style={spacingStyle(s)}>
      {str(s, 'layout', 'carousel') === 'carousel' ? (
        <LibCarousel ariaLabel={str(s, 'title')} itemSize="card">{cards}</LibCarousel>
      ) : (
        <LibGrid style={gridStyle(num(s, 'columns', 4))}>{cards}</LibGrid>
      )}
    </LibSection>
  );
}
