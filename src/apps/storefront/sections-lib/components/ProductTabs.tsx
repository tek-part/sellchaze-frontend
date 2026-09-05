/**
 * product-tabs — a tab bar where each tab shows a product collection (accessible tablist; arrow keys
 * move between tabs). Panels render a grid or a carousel.
 */
import { useState, type KeyboardEvent, type ReactElement } from 'react';
import type { SectionRenderProps } from '../../theme-engine/rendering';
import { cn } from '../../../../shared/utils/cn';
import { defineSection, fields, OPTIONS, spacingFields, tr } from '../schema';
import { bool, gridStyle, list, num, spacingStyle, str, useSectionSettings } from '../use-section';
import { useSectionData } from '../data';
import { LibCarousel, LibEmpty, LibGrid, LibProductCard, LibSection, useLibId } from '../primitives';
import { useLibT } from '../i18n';
import { PRODUCT_CARD_FIELDS } from './FeaturedProducts';

export const productTabsSchema = defineSection({
  type: 'product-tabs',
  label: 'Product tabs',
  description: 'Tabs that switch between product collections.',
  category: 'products',
  icon: 'HiOutlineTableCells',
  settings: [
    fields.text('title', 'Title', tr('اكتشف منتجاتنا', 'Discover our products')),
    fields.list(
      'tabs',
      'Tabs',
      [fields.text('label', 'Tab label', ''), fields.collection('collection', 'Collection', 'newest')],
      [
        { label: tr('الجديد', 'New'), collection: 'newest' },
        { label: tr('الأكثر مبيعاً', 'Best sellers'), collection: 'bestsellers' },
        { label: tr('تخفيضات', 'Sale'), collection: 'sale' },
      ],
      6,
    ),
    fields.select('layout', 'Layout', OPTIONS.layout, 'grid'),
    fields.select('columns', 'Columns', OPTIONS.columns(2, 6), '4'),
    fields.range('limit', 'Products per tab', 8, 1, 24),
    fields.select('align', 'Tabs alignment', OPTIONS.align, 'center'),
    ...PRODUCT_CARD_FIELDS,
    ...spacingFields(),
  ],
});

export function ProductTabs(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(productTabsSchema, props.settings);
  const data = useSectionData(props.context);
  const t = useLibT();
  const tabs = list(s, 'tabs').filter((tab) => str(tab, 'label'));
  const [active, setActive] = useState(0);
  const baseId = useLibId('libtabs');
  if (tabs.length === 0) return null;
  const index = Math.min(active, tabs.length - 1);
  const current = tabs[index]!;
  const columns = num(s, 'columns', 4);
  const products = data.products(str(current, 'collection', 'newest'), num(s, 'limit', 8));
  const card = {
    showBadges: bool(s, 'show_badges', true),
    showRatings: bool(s, 'show_ratings', true),
    showQuickAdd: bool(s, 'show_quick_add', true),
    showWishlist: bool(s, 'show_wishlist', true),
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>): void => {
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = (index + dir + tabs.length) % tabs.length;
    setActive(next);
    document.getElementById(`${baseId}-tab-${next}`)?.focus();
  };

  const tablist = (
    <div className={cn('lib-tabs', `lib-tabs--${str(s, 'align', 'center')}`)} role="tablist" aria-label={t('tabs')} onKeyDown={onKey}>
      {tabs.map((tab, i) => (
        <button
          key={i}
          type="button"
          role="tab"
          id={`${baseId}-tab-${i}`}
          aria-selected={i === index}
          aria-controls={`${baseId}-panel`}
          tabIndex={i === index ? 0 : -1}
          className={cn('lib-tabs__tab', i === index && 'is-active')}
          onClick={() => setActive(i)}
        >
          {str(tab, 'label')}
        </button>
      ))}
    </div>
  );

  const cards = products.map((p, i) => <LibProductCard key={p.id} product={p} {...card} eager={i < columns} />);

  return (
    <LibSection title={str(s, 'title')} align="center" aside={tablist} style={spacingStyle(s)}>
      <div id={`${baseId}-panel`} role="tabpanel" aria-labelledby={`${baseId}-tab-${index}`}>
        {products.length === 0 ? (
          <LibEmpty message={t('emptyProducts')} />
        ) : str(s, 'layout') === 'carousel' ? (
          <LibCarousel ariaLabel={str(current, 'label')} itemSize="card">{cards}</LibCarousel>
        ) : (
          <LibGrid style={gridStyle(columns)}>{cards}</LibGrid>
        )}
      </div>
    </LibSection>
  );
}
