/**
 * Rouge flash-deals / limited-drop — an urgency block: gilt eyebrow + countdown to a deadline over an
 * aura glow, then a product grid. Settings: eyebrow, title, ends_at (ISO), source, limit, columns.
 * Self-hides with no products.
 */
import type { CSSProperties, ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { Container } from '../components/Container';
import { Section } from '../components/Section';
import { Eyebrow } from '../components/Typography';
import { Countdown } from '../components/Countdown';
import { ProductCard } from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/ProductCardSkeleton';
import { isLoading, productsFor } from './section-data';
import { option, range, text } from './section-settings';

const SOURCES = ['featured', 'newest', 'bestsellers', 'sale', 'all'] as const;

export function FlashDealsSection(props: SectionRenderProps): ReactElement | null {
  const { settings, context } = props;
  const eyebrow = text(settings, 'eyebrow', 'Limited edit');
  const title = text(settings, 'title', 'The drop');
  const endsAt = text(settings, 'ends_at');
  const source = option(settings, 'source', SOURCES, 'sale');
  const limit = range(settings, 'limit', 4, 1, 12);
  const columns = range(settings, 'columns', 4, 2, 6);
  const loading = isLoading(context);
  const products = productsFor(context, source).slice(0, limit);

  if (!loading && products.length === 0) return null;
  const style = { '--rge-cols': columns, '--rge-cols-lg': Math.min(columns, 3), '--rge-cols-md': 2, '--rge-cols-sm': 2 } as CSSProperties;

  return (
    <Section>
      <Container>
        <div className="rge-flash">
          <div className="rge-aura rge-flash__aura" aria-hidden />
          <div className="rge-flash__head">
            <Eyebrow>{eyebrow}</Eyebrow>
            <h2 className="rge-flash__title">{title}</h2>
            {endsAt ? <Countdown to={endsAt} /> : null}
          </div>
        </div>
        <div className="rge-grid" style={style}>
          {loading
            ? Array.from({ length: limit }, (_, i) => <ProductCardSkeleton key={i} />)
            : products.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </Container>
    </Section>
  );
}
