/**
 * recently-viewed — the shopper's client-side history (excluding the product being viewed).
 * Self-hides with fewer than `min_items` products.
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../theme-engine/rendering';
import { useRecentlyViewed } from '../../state/recently-viewed';
import { defineSection, fields, spacingFields, tr } from '../schema';
import { num, spacingStyle, str, useSectionSettings } from '../use-section';
import { LibCarousel, LibProductCard, LibSection } from '../primitives';

export const recentlyViewedSchema = defineSection({
  type: 'recently-viewed',
  label: 'Recently viewed',
  description: 'Products the visitor looked at recently.',
  category: 'products',
  icon: 'HiOutlineClock',
  settings: [
    fields.text('title', 'Title', tr('شاهدت مؤخراً', 'Recently viewed')),
    fields.range('limit', 'Products to show', 8, 2, 16),
    fields.range('min_items', 'Hide below this many', 2, 1, 6),
    ...spacingFields(48),
  ],
});

export function RecentlyViewed(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(recentlyViewedSchema, props.settings);
  const { items } = useRecentlyViewed();
  const current = (props.context.data as { product?: { id?: string } }).product?.id;
  const products = items.filter((p) => p.id !== current).slice(0, num(s, 'limit', 8));
  if (products.length < num(s, 'min_items', 2)) return null;
  return (
    <LibSection title={str(s, 'title')} style={spacingStyle(s)}>
      <LibCarousel ariaLabel={str(s, 'title')} itemSize="card">
        {products.map((p) => <LibProductCard key={p.id} product={p} showQuickAdd={false} />)}
      </LibCarousel>
    </LibSection>
  );
}
