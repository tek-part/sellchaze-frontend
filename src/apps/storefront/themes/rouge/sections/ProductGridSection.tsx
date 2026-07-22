/**
 * Rouge product-grid — cosmetic-first merchandising. ProductCard grid + centered SectionHead.
 * Settings: title, eyebrow, intro, source, limit, columns, view_all_url. Skeletons while loading;
 * a graceful empty state / self-hides with no data.
 */
import type { CSSProperties, ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { Container } from '../components/Container';
import { Section } from '../components/Section';
import { EmptyState, ErrorState } from '../components/StateMessage';
import { SectionHead } from '../components/SectionHead';
import { ProductCard } from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/ProductCardSkeleton';
import { Reveal } from '../components/Reveal';
import { isLoading, productsFor, errorMessage, hasError, hasNoProductData } from './section-data';
import { flag, option, range, text } from './section-settings';

const SOURCES = ['featured', 'newest', 'bestsellers', 'sale', 'category', 'all'] as const;

function gridStyle(columns: number): CSSProperties {
  return { '--rge-cols': columns, '--rge-cols-lg': Math.min(columns, 3), '--rge-cols-md': 2, '--rge-cols-sm': columns >= 4 ? 2 : 1 } as CSSProperties;
}

export function ProductGridSection(props: SectionRenderProps): ReactElement | null {
  const { settings, context } = props;
  const title = text(settings, 'title');
  const eyebrow = text(settings, 'eyebrow');
  const intro = text(settings, 'intro');
  const source = option(settings, 'source', SOURCES, 'featured');
  const limit = range(settings, 'limit', 8, 1, 24);
  const columns = range(settings, 'columns', 4, 2, 6);
  const viewAll = text(settings, 'view_all_url');
  const showShades = flag(settings, 'shades', true);
  const loading = isLoading(context);
  const products = productsFor(context, source).slice(0, limit);

  const head =
    title || eyebrow ? (
      <SectionHead
        align="center"
        {...(eyebrow ? { eyebrow } : {})}
        title={title || eyebrow}
        {...(intro ? { intro } : {})}
        {...(viewAll ? { viewAllHref: viewAll } : {})}
        className="rge-section__head-wrap"
      />
    ) : null;

  // A failure is not an empty shelf — say so, and announce it, rather than rendering nothing.
  if (hasError(context) && hasNoProductData(context)) {
    return (
      <Section>
        <Container>
          {head}
          <ErrorState title="Couldn’t load this edit" description={errorMessage(context)} />
        </Container>
      </Section>
    );
  }

  if (!loading && products.length === 0) {
    if (!head) return null;
    return (
      <Section>
        <Container>
          {head}
          <EmptyState
            title="Coming soon"
            description="This edit is being curated — check back shortly."
          />
        </Container>
      </Section>
    );
  }
  return (
    <Section>
      <Container>
        {head}
        <Reveal>
          <div className="rge-grid" style={gridStyle(columns)}>
            {loading
              ? Array.from({ length: limit }, (_, i) => <ProductCardSkeleton key={i} />)
              : products.map((product) => <ProductCard key={product.id} product={product} showShades={showShades} />)}
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
