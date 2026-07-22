/**
 * Voltage flash-deals — a countdown-headed product rail. Ticks down to `ends_in_hours` from mount and
 * shows a spec grid from the chosen source. Self-hides / empty-states when there are no products.
 */
import { useEffect, useState, type CSSProperties, type ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { Container } from '../components/Container';
import { Section } from '../components/Section';
import { ProductCard } from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/ProductCardSkeleton';
import { isLoading, productsFor } from './section-data';
import { option, range, text } from './section-settings';

const SOURCES = ['featured', 'newest', 'bestsellers', 'sale', 'all'] as const;

function pad(n: number): string {
  return String(Math.max(0, Math.floor(n))).padStart(2, '0');
}

function gridStyle(columns: number): CSSProperties {
  return { '--vlt-cols': columns, '--vlt-cols-lg': Math.min(columns, 3), '--vlt-cols-md': 2, '--vlt-cols-sm': columns >= 4 ? 2 : 1 } as CSSProperties;
}

export function FlashDealsSection(props: SectionRenderProps): ReactElement | null {
  const { settings, context } = props;
  const title = text(settings, 'title') || 'Flash deals';
  const source = option(settings, 'source', SOURCES, 'newest');
  const hours = range(settings, 'ends_in_hours', 24, 1, 240);
  const limit = range(settings, 'limit', 4, 1, 12);
  const columns = range(settings, 'columns', 4, 2, 6);

  const [deadline] = useState(() => Date.now() + hours * 3600_000);
  const [remaining, setRemaining] = useState(() => deadline - Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setRemaining(deadline - Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [deadline]);

  const loading = isLoading(context);
  const products = productsFor(context, source).slice(0, limit);
  if (!loading && products.length === 0) return null;

  const secs = Math.max(0, remaining / 1000);
  const dd = Math.floor(secs / 86400);
  const hh = Math.floor((secs % 86400) / 3600);
  const mm = Math.floor((secs % 3600) / 60);
  const ss = Math.floor(secs % 60);

  return (
    <Section reveal>
      <Container>
        <div className="vlt-flash__head">
          <div>
            <span className="vlt-eyebrow">// Limited time</span>
            <h2 className="vlt-flash__title">{title}</h2>
          </div>
          <div className="vlt-flash__timer vlt-num" role="timer" aria-label="Time remaining">
            {dd > 0 ? <span className="vlt-flash__unit"><b>{pad(dd)}</b>d</span> : null}
            <span className="vlt-flash__unit"><b>{pad(hh)}</b>h</span>
            <span className="vlt-flash__unit"><b>{pad(mm)}</b>m</span>
            <span className="vlt-flash__unit"><b>{pad(ss)}</b>s</span>
          </div>
        </div>
        <div className="vlt-grid" style={gridStyle(columns)}>
          {loading
            ? Array.from({ length: limit }, (_, i) => <ProductCardSkeleton key={i} />)
            : products.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </Container>
    </Section>
  );
}
