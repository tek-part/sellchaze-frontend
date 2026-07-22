/**
 * product-grid — the core product listing (home rows, category body). Binds `context.data` products
 * (optionally a named `source` set). Skeleton grid while loading; a calm empty state when there are
 * no products (never fabricated). The whole grid is token-driven and responsive.
 */
import type { CSSProperties, ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { Container } from '../components/Container';
import { Section } from '../components/Section';
import { ErrorState } from '../components/EmptyState';
import { SectionHead } from '../components/SectionHead';
import { ProductCard } from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/Skeleton';
import { isLoading, productsFor, errorMessage, hasError, hasNoProductData } from './section-data';
import { option, range, text } from './section-settings';

export function ProductGridSection(props: SectionRenderProps): ReactElement | null {
  const { settings, context } = props;
  const heading = text(settings, 'heading');
  const label = text(settings, 'label');
  const source = text(settings, 'source');
  const columns = range(settings, 'columns', 4, 2, 4);
  const limit = range(settings, 'limit', 8, 1, 48);
  const viewAll = text(settings, 'view_all_url');
  const bg = option(settings, 'bg', ['oat', 'sand', 'cream'] as const, 'oat');

  const loading = isLoading(context);
  const products = productsFor(context, source || undefined).slice(0, limit);

  // A failure is not an empty shelf — say so, and announce it, rather than rendering nothing.
  if (hasError(context) && hasNoProductData(context)) {
    return (
      <Section bg={bg}>
        <Container>
          <ErrorState title="Couldn’t load products" description={errorMessage(context)} />
        </Container>
      </Section>
    );
  }

  if (!loading && products.length === 0 && !heading) return null;

  const gridStyle = { '--hh-cols': String(columns) } as CSSProperties;

  return (
    <Section bg={bg}>
      <Container>
        {heading ? (
          <SectionHead
            {...(label ? { label } : {})}
            title={heading}
            {...(viewAll ? { viewAllHref: viewAll } : {})}
          />
        ) : null}

        {loading ? (
          <div className="hh-grid hh-grid--products" style={gridStyle} aria-hidden>
            {Array.from({ length: columns }).map((_, i) => (
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
          <div className="hh-empty">
            <p className="hh-empty__title">Nothing here just yet</p>
            <p className="hh-empty__body">New pieces are on their way — browse another room in the meantime.</p>
          </div>
        )}
      </Container>
    </Section>
  );
}
