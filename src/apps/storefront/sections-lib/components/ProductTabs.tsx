/**
 * product-tabs — a tab bar where each `tab` block shows a product collection (accessible tablist;
 * arrow keys move between tabs). Panels use the shared product layouts.
 */
import { useState, type KeyboardEvent, type ReactElement } from 'react';
import type { SectionRenderProps } from '../../theme-engine/rendering';
import { cn } from '../../../../shared/utils/cn';
import { defineBlock, defineSection, fields, OPTIONS, spacingFields, tr, variantSelect } from '../schema';
import { bool, num, spacingStyle, str, useSectionBlocks, useSectionSettings, useVariant } from '../use-section';
import { useSectionData } from '../data';
import { LibSection, useLibId } from '../primitives';
import { useLibT } from '../i18n';
import { PRODUCT_CARD_FIELDS, PRODUCT_LAYOUTS, ProductSet } from './product-set';

const TAB_FIELDS = [fields.text('label', 'Tab label', ''), fields.collection('collection', 'Collection', 'newest')] as const;

export const tabBlock = defineBlock({ type: 'tab', label: 'Tab', icon: 'HiOutlineTag', settings: TAB_FIELDS, limit: 6 });

export const productTabsSchema = defineSection({
  type: 'product-tabs',
  label: 'Product tabs',
  description: 'Tabs that switch between product collections.',
  category: 'products',
  icon: 'HiOutlineTableCells',
  variants: PRODUCT_LAYOUTS,
  blocks: { types: [tabBlock], max: 6, legacy: 'tabs' },
  settings: [
    fields.text('title', 'Title', tr('اكتشف منتجاتنا', 'Discover our products')),
    fields.list(
      'tabs',
      'Tabs',
      TAB_FIELDS,
      [
        { label: tr('الجديد', 'New'), collection: 'newest' },
        { label: tr('الأكثر مبيعاً', 'Best sellers'), collection: 'bestsellers' },
        { label: tr('تخفيضات', 'Sale'), collection: 'sale' },
      ],
      6,
    ),
    variantSelect(PRODUCT_LAYOUTS, 'grid'),
    fields.select('columns', 'Columns', OPTIONS.columns(2, 6), '4'),
    fields.range('limit', 'Products per tab', 8, 1, 24),
    fields.select('align', 'Tabs alignment', OPTIONS.align, 'center'),
    ...PRODUCT_CARD_FIELDS,
    ...spacingFields(),
  ],
});

export function ProductTabs(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(productTabsSchema, props.settings);
  const layout = useVariant(productTabsSchema, props.settings);
  const data = useSectionData(props.context);
  const t = useLibT();
  const tabs = useSectionBlocks(productTabsSchema, s).filter((b) => str(b.settings, 'label'));
  const [active, setActive] = useState(0);
  const baseId = useLibId('libtabs');
  if (tabs.length === 0) return null;
  const index = Math.min(active, tabs.length - 1);
  const current = tabs[index]!;
  const columns = num(s, 'columns', 4);
  const products = data.products(str(current.settings, 'collection', 'newest'), num(s, 'limit', 8));
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
          key={tab.id}
          type="button"
          role="tab"
          id={`${baseId}-tab-${i}`}
          aria-selected={i === index}
          aria-controls={`${baseId}-panel`}
          tabIndex={i === index ? 0 : -1}
          className={cn('lib-tabs__tab', i === index && 'is-active')}
          onClick={() => setActive(i)}
        >
          {str(tab.settings, 'label')}
        </button>
      ))}
    </div>
  );

  return (
    <LibSection title={str(s, 'title')} align="center" aside={tablist} style={spacingStyle(s)}>
      <div id={`${baseId}-panel`} role="tabpanel" aria-labelledby={`${baseId}-tab-${index}`}>
        <ProductSet
          layout={layout}
          products={products}
          columns={columns}
          card={card}
          limit={num(s, 'limit', 8)}
          ariaLabel={str(current.settings, 'label')}
          emptyMessage={t('emptyProducts')}
        />
      </div>
    </LibSection>
  );
}
