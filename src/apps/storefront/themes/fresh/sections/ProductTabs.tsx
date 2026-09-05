/**
 * Fresh `product-tabs` — aisle tabs (fruits / vegetables / bakery…): the library schema and
 * accessible tablist (arrow keys move between tabs) rendering Fresh's product card.
 */
import { useState, type KeyboardEvent, type ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { cn } from '../../../../../shared/utils/cn';
import { productTabsSchema } from '../../../sections-lib/components/ProductTabs';
import { bool, gridStyle, list, num, spacingStyle, str, useSectionSettings, useSectionData, useLibT, LibCarousel, LibEmpty, LibGrid, LibSection, useLibId } from '../../../sections-lib';
import { FreshProductCard } from './ProductCard';

export function FreshProductTabs(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(productTabsSchema, props.settings);
  const data = useSectionData(props.context);
  const t = useLibT();
  const tabs = list(s, 'tabs').filter((tab) => str(tab, 'label'));
  const [active, setActive] = useState(0);
  const baseId = useLibId('frtabs');
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
    <div className={cn('lib-tabs', 'fr-tabs', `lib-tabs--${str(s, 'align', 'center')}`)} role="tablist" aria-label={t('tabs')} onKeyDown={onKey}>
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

  const cards = products.map((p, i) => <FreshProductCard key={p.id} product={p} {...card} eager={i < columns} />);

  return (
    <LibSection title={str(s, 'title')} align="center" aside={tablist} style={spacingStyle(s)} className="fr-products">
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
