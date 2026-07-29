/**
 * Voltage product-grid — spec-led merchandising and the full shop experience.
 *
 * Two modes, chosen by settings:
 *  - merchandising block (`shop: false`) — a fixed slice on the homepage, no controls.
 *  - full listing (`shop: true`) — sidebar filters, chips, sort, grid/list toggle, result count and
 *    pagination, with all state held in the URL so a filtered view is shareable and survives
 *    back/forward and refresh.
 *
 * All behaviour is `shared-ui`; everything below is Voltage's own carbon-and-cyan markup.
 */
import { useState, type CSSProperties, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { Container } from '../components/Container';
import { Section } from '../components/Section';
import { SectionHead } from '../components/SectionHead';
import { ProductCard } from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/ProductCardSkeleton';
import {
  EmptyState,
  ErrorState,
  FilterChips,
  FilterPanel,
  Pagination,
  SortSelect,
  activeFilterCount,
  sortProducts,
  useShopControls,
  type SortKey,
} from '../../../shared-ui';
import { currencyOf, errorMessage, hasError, isLoading, productsFor, hasNoProductData } from './section-data';
import { flag, option, range, text } from './section-settings';

const SOURCES = ['featured', 'newest', 'bestsellers', 'sale', 'category', 'all', 'related', 'recently-viewed'] as const;

function gridStyle(columns: number): CSSProperties {
  return { '--vlt-cols': columns, '--vlt-cols-lg': Math.min(columns, 3), '--vlt-cols-md': 2, '--vlt-cols-sm': columns >= 4 ? 2 : 1 } as CSSProperties;
}

export function ProductGridSection(props: SectionRenderProps): ReactElement | null {
  const { t } = useTranslation();
  const { settings, context } = props;
  const title = text(settings, 'title');
  const source = option(settings, 'source', SOURCES, 'featured');
  const limit = range(settings, 'limit', 8, 1, 48);
  const columns = range(settings, 'columns', 4, 2, 6);
  const sortable = flag(settings, 'sortable', false);
  const shop = flag(settings, 'shop', false);

  const loading = isLoading(context);
  const failed = hasError(context);
  const currency = currencyOf(context);
  const all = productsFor(context, source);

  const controls = useShopControls(all, limit);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Merchandising blocks keep their own light-weight sort; only a full listing reads the URL.
  const [blockSort, setBlockSort] = useState<SortKey>('featured');
  const blockProducts = sortProducts(all, blockSort).slice(0, limit);

  const products = shop ? controls.visible : blockProducts;
  const totalMatched = shop ? controls.matchedCount : blockProducts.length;
  const filterCount = activeFilterCount(controls.filters);

  // A failure is not an empty shelf — say so, and announce it, rather than rendering nothing.
  if (failed && hasNoProductData(context)) {
    return (
      <Section>
        <Container>
          {title ? <SectionHead title={title} className="vlt-section__head-wrap" /> : null}
          <ErrorState ns="vlt" title={t('states.loadFailed')} description={errorMessage(context)} />
        </Container>
      </Section>
    );
  }

  if (!loading && all.length === 0) {
    if (!title) return null;
    return (
      <Section>
        <Container>
          <SectionHead title={title} className="vlt-section__head-wrap" />
          <EmptyState ns="vlt" title={t('shop.nothingYet')} description={t('shop.nothingYetHint')} />
        </Container>
      </Section>
    );
  }

  const grid = (
    <div
      className={controls.view === 'list' && shop ? 'vlt-grid vlt-grid--list' : 'vlt-grid'}
      style={gridStyle(columns)}
    >
      {loading
        ? Array.from({ length: limit }, (_, i) => <ProductCardSkeleton key={i} />)
        : products.map((product) => <ProductCard key={product.id} product={product} />)}
    </div>
  );

  /* ---------------------------------------------------------------- merchandising block */
  if (!shop) {
    return (
      <Section reveal>
        <Container>
          {title ? <SectionHead title={title} className="vlt-section__head-wrap" /> : null}
          {sortable ? (
            <div className="vlt-grid-toolbar">
              <span className="vlt-grid-toolbar__count vlt-num">
                {t('shop.productCount', { count: all.length })}
              </span>
              <SortSelect ns="vlt" id="vlt-block-sort" value={blockSort} onChange={setBlockSort} />
            </div>
          ) : null}
          {grid}
        </Container>
      </Section>
    );
  }

  /* ---------------------------------------------------------------- full shop listing */
  return (
    <Section>
      <Container>
        {title ? <SectionHead title={title} className="vlt-section__head-wrap" /> : null}

        <div className="vlt-shop">
          {/* Desktop sidebar. On small screens the same panel is reused inside a drawer. */}
          <aside className="vlt-shop__aside" aria-label={t('shop.productFilters')}>
            <FilterPanel
              ns="vlt"
              facets={controls.facets}
              filters={controls.filters}
              onChange={controls.setFilters}
              currency={currency}
            />
          </aside>

          <div className="vlt-shop__main">
            <div className="vlt-shop__bar">
              <button
                type="button"
                className="vlt-shop__filterbtn"
                aria-expanded={drawerOpen}
                onClick={() => setDrawerOpen(true)}
              >
                {filterCount > 0 ? t('shop.filtersWithCount', { count: filterCount }) : t('shop.filters')}
              </button>

              <p className="vlt-shop__count vlt-num" aria-live="polite">
                {loading
                  ? t('common.loading')
                  : t('shop.resultCount', { shown: totalMatched, total: controls.totalCount })}
              </p>

              <div className="vlt-shop__controls">
                <div className="vlt-viewswitch" role="group" aria-label={t('shop.viewMode')}>
                  <button
                    type="button"
                    className="vlt-viewswitch__btn"
                    aria-pressed={controls.view === 'grid'}
                    onClick={() => controls.setView('grid')}
                  >
                    {t('shop.grid')}
                  </button>
                  <button
                    type="button"
                    className="vlt-viewswitch__btn"
                    aria-pressed={controls.view === 'list'}
                    onClick={() => controls.setView('list')}
                  >
                    {t('shop.list')}
                  </button>
                </div>
                <SortSelect ns="vlt" id="vlt-plp-sort" value={controls.sort} onChange={controls.setSort} />
              </div>
            </div>

            <FilterChips
              ns="vlt"
              filters={controls.filters}
              onChange={controls.setFilters}
              onClear={controls.clearFilters}
              currency={currency}
              className="vlt-shop__chips"
            />

            {!loading && totalMatched === 0 ? (
              <EmptyState
                ns="vlt"
                title={t('shop.noMatches')}
                description={t('shop.noMatchesHint')}
                actions={
                  <button type="button" className="vlt-btn vlt-btn--primary vlt-btn--md" onClick={controls.clearFilters}>
                    {t('shop.clearAllFilters')}
                  </button>
                }
              />
            ) : (
              grid
            )}

            {!loading && totalMatched > 0 ? (
              <Pagination
                ns="vlt"
                page={controls.page}
                pageCount={controls.pageCount}
                onPageChange={controls.setPage}
                className="vlt-plp-pagination"
              />
            ) : null}
          </div>
        </div>
      </Container>

      {/* Mobile filter drawer — the same panel, so the two can never drift apart. */}
      {drawerOpen ? (
        <div className="vlt-filterdrawer" role="dialog" aria-modal="true" aria-label={t('shop.filters')}>
          <div className="vlt-filterdrawer__scrim" onClick={() => setDrawerOpen(false)} aria-hidden />
          <div className="vlt-filterdrawer__panel">
            <div className="vlt-filterdrawer__head">
              <h2 className="vlt-filterdrawer__title">{t('shop.filters')}</h2>
              <button
                type="button"
                className="vlt-filterdrawer__close"
                onClick={() => setDrawerOpen(false)}
                autoFocus
              >
                {t('common.close')}
              </button>
            </div>
            <div className="vlt-filterdrawer__body">
              <FilterPanel
                ns="vlt"
                facets={controls.facets}
                filters={controls.filters}
                onChange={controls.setFilters}
                currency={currency}
              />
            </div>
            <div className="vlt-filterdrawer__foot">
              <button type="button" className="vlt-btn vlt-btn--ghost vlt-btn--md" onClick={controls.clearFilters}>
                {t('shop.clearAll')}
              </button>
              <button
                type="button"
                className="vlt-btn vlt-btn--primary vlt-btn--md"
                onClick={() => setDrawerOpen(false)}
              >
                {t('shop.showResults', { count: totalMatched })}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </Section>
  );
}
