/**
 * FeatureCard — a value prop (free shipping, returns, authenticity): thin line icon (or serif
 * numeral) + serif micro-headline + one line. Used in rows of 3–4, never a wall of icons. See §32.4.
 */
import type { ReactElement, ReactNode } from 'react';
import { cn } from '../../../../../shared/utils/cn';

export interface FeatureCardProps {
  title: ReactNode;
  text?: ReactNode;
  icon?: ReactNode;
  /** Ordinal for the `numbered` layout. */
  number?: number;
  layout?: 'icon-top' | 'icon-inline' | 'numbered';
  className?: string;
}

export function FeatureCard(props: FeatureCardProps): ReactElement {
  const { title, text, icon, number, layout = 'icon-top', className } = props;

  return (
    <article className={cn('sf-feature', layout === 'icon-top' && 'sf-feature--icon-top', className)}>
      {layout === 'numbered' && typeof number === 'number' ? (
        <span className="sf-feature__num" aria-hidden>
          {String(number).padStart(2, '0')}
        </span>
      ) : icon ? (
        <span className="sf-feature__icon" aria-hidden>
          {icon}
        </span>
      ) : null}
      <div className="sf-feature__body">
        <h3 className="sf-feature__title">{title}</h3>
        {text ? <p className="sf-feature__text">{text}</p> : null}
      </div>
    </article>
  );
}
