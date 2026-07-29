/**
 * Voltage search — a query console. A mono search field that drives ?q= plus a results grid / empty
 * state. Reads query + results (threaded from SearchPage under context.data); no invented endpoint.
 */
import { useEffect, useState, type CSSProperties, type FormEvent, type ReactElement } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { Container } from '../components/Container';
import { Section } from '../components/Section';
import { Button } from '../components/Button';
import { ProductCard } from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/ProductCardSkeleton';
import { IconSearch } from '../components/icons';
import { isLoading, productsFor } from './section-data';

const GRID: CSSProperties = { '--vlt-cols': 4, '--vlt-cols-lg': 3, '--vlt-cols-md': 2, '--vlt-cols-sm': 2 } as CSSProperties;

export function SearchSection(props: SectionRenderProps): ReactElement {
  const { t } = useTranslation();
  const { context } = props;
  const query = typeof context.data.query === 'string' ? context.data.query : '';
  const loading = isLoading(context);
  const results = productsFor(context);
  const [params, setParams] = useSearchParams();
  const [draft, setDraft] = useState(query);

  useEffect(() => { setDraft(query); }, [query]);

  const submit = (e: FormEvent): void => {
    e.preventDefault();
    const next = new URLSearchParams(params);
    const trimmed = draft.trim();
    if (trimmed) next.set('q', trimmed);
    else next.delete('q');
    setParams(next, { replace: true });
  };

  return (
    <Section>
      <Container>
        <div className="vlt-flow-head">
          <span className="vlt-eyebrow">{t('search.eyebrow')}</span>
          <h1 className="vlt-flow-head__title">{query ? t('search.resultsFor', { query }) : t('search.searchCatalog')}</h1>
        </div>
        <form className="vlt-search-bar" role="search" onSubmit={submit}>
          <span className="vlt-search-bar__icon" aria-hidden="true"><IconSearch /></span>
          <input
            type="search"
            className="vlt-search-bar__input"
            placeholder={t('search.placeholderProducts')}
            aria-label={t('search.searchProducts')}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <Button type="submit" className="vlt-search-bar__go">{t('search.submit')}</Button>
        </form>

        {loading ? (
          <div className="vlt-grid" style={GRID}>
            {Array.from({ length: 8 }, (_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : results.length === 0 ? (
          <div className="vlt-empty vlt-empty--pad">
            <span className="vlt-empty__title">{t('search.noMatches')}</span>
            <span className="vlt-empty__text">
              {query ? t('search.tryBroader', { query }) : t('search.typeQuery')}
            </span>
          </div>
        ) : (
          <>
            <p className="vlt-search-count vlt-num">{t('search.resultsCount', { count: results.length })}</p>
            <div className="vlt-grid" style={GRID}>
              {results.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          </>
        )}
      </Container>
    </Section>
  );
}
