/**
 * product-rail — a horizontally scrollable rail (new / related / complete-the-look / recently
 * viewed). Snap-scrolls on touch, shows a peek of the next card, and self-hides when its source is
 * empty. Reused across home/PDP/cart via the `source` setting.
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { Container } from '../components/Container';
import { Section } from '../components/Section';
import { SectionHead } from '../components/SectionHead';
import { ProductCard } from '../components/ProductCard';
import { productsFor } from './section-data';
import { option, range, text } from './section-settings';

export function ProductRailSection(props: SectionRenderProps): ReactElement | null {
  const { settings, context } = props;
  const heading = text(settings, 'heading', 'You may also like');
  const label = text(settings, 'label');
  const source = text(settings, 'source', 'related');
  const limit = range(settings, 'limit', 10, 1, 20);
  const viewAll = text(settings, 'view_all_url');
  const bg = option(settings, 'bg', ['oat', 'sand', 'cream'] as const, 'oat');

  const products = productsFor(context, source).slice(0, limit);
  if (products.length === 0) return null;

  return (
    <Section bg={bg} tight>
      <Container>
        <SectionHead
          {...(label ? { label } : {})}
          title={heading}
          {...(viewAll ? { viewAllHref: viewAll } : {})}
        />
      </Container>
      <div className="hh-rail" role="list">
        <div className="hh-rail__track">
          {products.map((p) => (
            <div key={p.id} className="hh-rail__item" role="listitem">
              <ProductCard product={p} compact />
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
