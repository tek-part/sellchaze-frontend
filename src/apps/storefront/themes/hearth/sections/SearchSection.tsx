/**
 * search — results for a query (docs/themes/theme-03/10-search-experience). Reads `context.data`
 * ({ query, products, loading }) provided by the app's SearchPage. Skeleton while loading; a warm
 * empty state that routes back to browsing when there are no matches. Never fabricates results.
 */
import type { CSSProperties, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import type { ProductCardModel } from '../../../types/catalog';
import { ButtonLink } from '../components/ButtonLink';
import { Container } from '../components/Container';
import { EmptyState } from '../components/EmptyState';
import { ProductCard } from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/Skeleton';
import { Section } from '../components/Section';

function readData(context: SectionRenderProps['context']): {
  query: string;
  products: ReadonlyArray<ProductCardModel>;
  loading: boolean;
} {
  const bag = context.data as { query?: unknown; products?: unknown; loading?: unknown };
  return {
    query: typeof bag.query === 'string' ? bag.query : '',
    products: Array.isArray(bag.products) ? (bag.products as ReadonlyArray<ProductCardModel>) : [],
    loading: bag.loading === true,
  };
}

export function SearchSection(props: SectionRenderProps): ReactElement {
  const { t } = useTranslation();
  const { context } = props;
  const { query, products, loading } = readData(context);
  const gridStyle = { '--hh-cols': '4' } as CSSProperties;

  return (
    <Section>
      <Container>
        <header className="hh-search-head">
          <h1 className="hh-page-title">{query ? t('search.resultsFor', { query }) : t('search.title')}</h1>
          {!loading ? (
            <p className="hh-search-head__count">
              {t('search.resultsCount', { count: products.length })}
            </p>
          ) : null}
        </header>

        {loading ? (
          <div className="hh-grid hh-grid--products" style={gridStyle} aria-hidden>
            {Array.from({ length: 4 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : products.length > 0 ? (
          <ul className="hh-grid hh-grid--products" style={gridStyle}>
            {products.map((p) => (
              <li key={p.id} className="hh-grid__item">
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            variant="search"
            title={query ? t('search.noMatchesFor', { query }) : t('search.searchRooms')}
            description={t('search.hearthHint')}
            actions={<ButtonLink href="/rooms">{t('hearth.browseRooms')}</ButtonLink>}
          />
        )}
      </Container>
    </Section>
  );
}
