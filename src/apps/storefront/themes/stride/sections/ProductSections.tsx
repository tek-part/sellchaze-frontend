/**
 * Stride overrides of the library's product sections — same schemas (so the customizer form and
 * stored data are identical), rendered with the Stride card and product set.
 */
import { useState, type KeyboardEvent, type ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { cn } from '../../../../../shared/utils/cn';
import { featuredProductsSchema } from '../../../sections-lib/components/FeaturedProducts';
import { productTabsSchema } from '../../../sections-lib/components/ProductTabs';
import { flashDealsSchema } from '../../../sections-lib/components/FlashDeals';
import { productGridSchema } from '../../../sections-lib/components/ProductGrid';
import { relatedProductsSchema } from '../../../sections-lib/components/RelatedProducts';
import {
  Countdown, LibCarousel, LibEmpty, LibGrid, LibProductSkeleton, LibSection, bandClass, bool, gridStyle, num, spacingStyle, str,
  useCountdown, useLibId, useLibT, useLocaleCode, useSectionBlocks, useSectionData, useSectionSettings, useVariant,
} from '../../../sections-lib';
import type { ThemeSettings } from '../../../theme-engine/types';
import { StProductCard } from '../components/ProductCard';
import { StProductSet, type StCardOptions } from '../components/ProductSet';

function cardOptions(s: ThemeSettings): StCardOptions {
  return {
    showBadges: bool(s, 'show_badges', true),
    showRatings: bool(s, 'show_ratings', true),
    showQuickAdd: bool(s, 'show_quick_add', true),
    showWishlist: bool(s, 'show_wishlist', true),
  };
}

export function StFeaturedProducts(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(featuredProductsSchema, props.settings);
  const layout = useVariant(featuredProductsSchema, props.settings);
  const data = useSectionData(props.context);
  const t = useLibT();
  const limit = num(s, 'limit', 8);
  const products = data.products(str(s, 'collection', 'newest'), limit);
  const title = str(s, 'title');
  const loading = data.loading && products.length === 0;
  if (!loading && products.length === 0 && !title) return null;
  return (
    <LibSection title={title} subtitle={str(s, 'subtitle')} viewAllHref={str(s, 'view_all_url')} viewAllLabel={str(s, 'view_all_label')} className="st-products" style={spacingStyle(s)}>
      <StProductSet layout={layout} products={products} columns={num(s, 'columns', 4)} card={cardOptions(s)} loading={loading} limit={limit} ariaLabel={title || t('products')} emptyMessage={t('emptyProducts')} />
    </LibSection>
  );
}

export function StProductTabs(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(productTabsSchema, props.settings);
  const layout = useVariant(productTabsSchema, props.settings);
  const data = useSectionData(props.context);
  const t = useLibT();
  const locale = useLocaleCode();
  const tabs = useSectionBlocks(productTabsSchema, s).filter((b) => str(b.settings, 'label'));
  const [active, setActive] = useState(0);
  const baseId = useLibId('sttabs');
  if (tabs.length === 0) return null;
  const index = Math.min(active, tabs.length - 1);
  const current = tabs[index]!;
  const products = data.products(str(current.settings, 'collection', 'newest'), num(s, 'limit', 8));

  const onKey = (e: KeyboardEvent<HTMLDivElement>): void => {
    const forward = locale.startsWith('ar') ? 'ArrowLeft' : 'ArrowRight';
    const back = locale.startsWith('ar') ? 'ArrowRight' : 'ArrowLeft';
    const dir = e.key === forward ? 1 : e.key === back ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = (index + dir + tabs.length) % tabs.length;
    setActive(next);
    document.getElementById(`${baseId}-tab-${next}`)?.focus();
  };

  const tablist = (
    <div className="st-tabs" role="tablist" aria-label={str(s, 'title') || t('tabs')} onKeyDown={onKey}>
      {tabs.map((tab, i) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          id={`${baseId}-tab-${i}`}
          aria-selected={i === index}
          aria-controls={`${baseId}-panel`}
          tabIndex={i === index ? 0 : -1}
          className={cn('st-tabs__tab', i === index && 'is-active')}
          onClick={() => setActive(i)}
        >
          {str(tab.settings, 'label')}
        </button>
      ))}
    </div>
  );

  return (
    <LibSection title={str(s, 'title')} aside={tablist} className="st-products st-products--tabs" style={spacingStyle(s)}>
      <div id={`${baseId}-panel`} role="tabpanel" aria-labelledby={`${baseId}-tab-${index}`}>
        <StProductSet layout={layout} products={products} columns={num(s, 'columns', 4)} card={cardOptions(s)} limit={num(s, 'limit', 8)} ariaLabel={str(current.settings, 'label')} emptyMessage={t('emptyProducts')} />
      </div>
    </LibSection>
  );
}

export function StFlashDeals(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(flashDealsSchema, props.settings);
  const layout = useVariant(flashDealsSchema, props.settings);
  const data = useSectionData(props.context);
  const t = useLibT();
  const timer = useCountdown(str(s, 'ends_at'));
  const products = data.products(str(s, 'collection', 'sale'), num(s, 'limit', 8));
  if (timer.expired && bool(s, 'hide_when_expired', true)) return null;
  return (
    <LibSection title={str(s, 'title')} subtitle={str(s, 'subtitle')} className={cn('st-products', 'st-deals', bandClass(str(s, 'background', 'surface')))} aside={<Countdown timer={timer} className="st-countdown" />} style={spacingStyle(s)}>
      <StProductSet layout={layout} products={products} columns={num(s, 'columns', 4)} card={cardOptions(s)} limit={num(s, 'limit', 8)} ariaLabel={str(s, 'title') || t('products')} emptyMessage={t('emptyProducts')} />
    </LibSection>
  );
}

export function StProductGrid(props: SectionRenderProps): ReactElement {
  const s = useSectionSettings(productGridSchema, props.settings);
  const data = useSectionData(props.context);
  const t = useLibT();
  const products = data.products(str(s, 'source', 'all'), num(s, 'limit', 24));
  const columns = num(s, 'columns', 4);
  const loading = data.loading && products.length === 0;
  return (
    <LibSection title={str(s, 'title')} className="st-products st-products--grid" style={spacingStyle(s)}>
      {loading ? (
        <LibGrid style={gridStyle(columns)}>{Array.from({ length: columns * 2 }, (_, i) => <LibProductSkeleton key={i} />)}</LibGrid>
      ) : products.length === 0 ? (
        <LibEmpty message={data.error ? t('loadFailed') : t('emptyProducts')} />
      ) : (
        <LibGrid style={gridStyle(columns)} className="st-grid">
          {products.map((p, i) => <StProductCard key={p.id} product={p} {...cardOptions(s)} eager={i < 2} />)}
        </LibGrid>
      )}
    </LibSection>
  );
}

export function StRelatedProducts(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(relatedProductsSchema, props.settings);
  const data = useSectionData(props.context);
  const products = data.products(str(s, 'collection', 'related'), num(s, 'limit', 8));
  if (products.length === 0) return null;
  const cards = products.map((p) => <StProductCard key={p.id} product={p} {...cardOptions(s)} sizes="(min-width: 1024px) 280px, 46vw" />);
  return (
    <LibSection title={str(s, 'title')} className="st-products" style={spacingStyle(s)}>
      {str(s, 'layout', 'carousel') === 'carousel' ? (
        <LibCarousel ariaLabel={str(s, 'title')} itemSize="card">{cards}</LibCarousel>
      ) : (
        <LibGrid style={gridStyle(num(s, 'columns', 4))} className="st-grid">{cards}</LibGrid>
      )}
    </LibSection>
  );
}
