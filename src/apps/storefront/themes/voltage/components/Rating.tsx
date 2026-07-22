/** Voltage Rating — lime line stars + mono tabular count; self-hides with no data. */
import type { ReactElement } from 'react';
import { cn } from '../../../../../shared/utils/cn';
import { IconStar } from './icons';

export interface RatingProps { value: number; count?: number; max?: number; showCount?: boolean; className?: string; }
export function Rating(props: RatingProps): ReactElement | null {
  const { value, count, max = 5, showCount = true, className } = props;
  if (!(value > 0) && !(typeof count === 'number' && count > 0)) return null;
  const rounded = Math.round(value);
  return (
    <span className={cn('vlt-rating', className)} role="img" aria-label={`Rated ${value.toFixed(1)} of ${max}`}>
      <span className="vlt-rating__stars" aria-hidden>
        {Array.from({ length: max }, (_, i) => (
          <IconStar key={i} width={15} height={15} style={{ opacity: i < rounded ? 1 : 0.25 }} />
        ))}
      </span>
      {showCount && typeof count === 'number' ? <span className="vlt-rating__count vlt-num">({count})</span> : null}
    </span>
  );
}
