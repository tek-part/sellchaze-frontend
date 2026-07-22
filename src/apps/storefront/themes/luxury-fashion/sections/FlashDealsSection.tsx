/**
 * flash-deals + countdown — urgency / AOV; time-boxed offers. Countdown + ProductCard grid.
 * Settings: title, ends_at, limit, source. The whole section self-hides once expired or empty. §08.
 */
import { useState, type CSSProperties, type ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { Countdown } from '../components/Countdown';
import { ProductCard } from '../components/ProductCard';
import { SectionShell } from './SectionShell';
import { productsFor } from './section-data';
import { range, text } from './section-settings';

export function FlashDealsSection(props: SectionRenderProps): ReactElement | null {
  const { settings, context } = props;
  const title = text(settings, 'title', 'Flash edit');
  const endsAt = text(settings, 'ends_at');
  const source = text(settings, 'source', 'sale');
  const limit = range(settings, 'limit', 4, 1, 12);
  const columns = range(settings, 'columns', 4, 2, 6);
  const [expired, setExpired] = useState(false);

  const products = productsFor(context, source).slice(0, limit);
  if (products.length === 0 || expired || !endsAt) return null;

  const style = {
    '--sf-cols': columns,
    '--sf-cols-lg': Math.min(columns, 3),
    '--sf-cols-md': 2,
    '--sf-cols-sm': 2,
  } as CSSProperties;

  return (
    <SectionShell title={title} align="center">
      <div className="sf-flash__timer">
        <Countdown endsAt={endsAt} onExpire={() => setExpired(true)} />
      </div>
      <div className="sf-grid" style={style}>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </SectionShell>
  );
}
