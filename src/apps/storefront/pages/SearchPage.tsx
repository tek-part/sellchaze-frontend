/**
 * SearchPage — /search?q=…. The storefront API has no dedicated search route, so this fetches the
 * product set and filters client-side by title/vendor (no invented endpoint). Renders a product grid
 * or an empty state. DEV falls back to preview products.
 */
import { previewOrDev } from '../preview';
import { useMemo, type CSSProperties, type ReactElement } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Container, EmptyState, ProductCard, Section } from '../themes/luxury-fashion/components';
import { useLocale } from '../i18n/useLocale';
import { Seo } from '../seo/Seo';
import { useStore } from '../state/store-context';
import { useAsync } from '../api/useAsync';
import { getProducts } from '../api/storefront';
import { toProductCard } from '../api/mappers';
import type { ProductCardModel } from '../types/catalog';
import { sampleNewest } from '../dev/sampleData';
import { ThemeRenderer, useTemplate, useThemeManifest } from '../theme-engine';
import { flowContext } from './flow-context';

const GRID: CSSProperties = { '--sf-cols': 4, '--sf-cols-lg': 3, '--sf-cols-md': 2, '--sf-cols-sm': 2 } as CSSProperties;

export function SearchPage(): ReactElement {
  const { t } = useTranslation();
  const manifest = useThemeManifest();
  const { locale } = useLocale();
  const [params] = useSearchParams();
  const query = (params.get('q') ?? '').trim();
  const { store } = useStore();
  const currency = store.currency;
  const productsQ = useAsync(() => getProducts({ perPage: 60 }), []);

  const results = useMemo<ProductCardModel[]>(() => {
    let products: ProductCardModel[] = productsQ.data ? productsQ.data.data.map((p) => toProductCard(p, currency)) : [];
    if (previewOrDev() && !productsQ.data) products = sampleNewest(manifest.id, locale);
    if (!query) return products;
    const q = query.toLowerCase();
    return products.filter((p) => p.title.toLowerCase().includes(q) || (p.vendor ?? '').toLowerCase().includes(q));
  }, [productsQ.data, currency, query, manifest.id, locale]);

  const tpl = useTemplate('search');
  if (tpl) {
    return (
      <>
        <Seo title={query ? `Search: ${query}` : 'Search'} path="/search" noindex />
        <ThemeRenderer page={tpl} context={flowContext(store, { query, products: results, loading: productsQ.loading })} />
      </>
    );
  }

  return (
    <Section>
      <Seo title={query ? `Search: ${query}` : 'Search'} path="/search" noindex />
      <Container>
        <div className="sf-page-head">
          <h1 className="sf-page-head__title">{query ? t('search.resultsFor', { query }) : t('search.title')}</h1>
          <p className="sf-page-head__sub">{t('search.piecesCount', { count: results.length })}</p>
        </div>
        {results.length === 0 ? (
          <EmptyState
            variant="search"
            title={t('search.noResults')}
            description={query ? t('search.noResultsHint', { query }) : t('search.tryDifferent')}
          />
        ) : (
          <div className="sf-grid" style={GRID}>
            {results.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </Container>
    </Section>
  );
}
