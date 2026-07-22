/**
 * Rating — aggregate stars + count. Data-gap aware: rating is often absent (docs/themes/theme-03
 * §data-gaps), so with no value it renders nothing (callers may show "No reviews yet"). Never
 * fabricates a score.
 */
import type { ReactElement } from 'react';
import { cn } from '../../../../../shared/utils/cn';

export interface RatingProps {
  value?: number;
  count?: number;
  /** Compact mode: single star + numeric value. */
  compact?: boolean;
  className?: string;
}

const STARS = [1, 2, 3, 4, 5] as const;

export function Rating(props: RatingProps): ReactElement | null {
  const { value, count, compact = false, className } = props;
  if (typeof value !== 'number' || value <= 0) return null;
  const rounded = Math.round(value * 10) / 10;

  if (compact) {
    return (
      <span className={cn('hh-rating hh-rating--compact', className)}>
        <span className="hh-rating__star hh-rating__star--on" aria-hidden>
          ★
        </span>
        <span className="hh-rating__value">{rounded.toFixed(1)}</span>
        {typeof count === 'number' ? <span className="hh-rating__count">({count})</span> : null}
        <span className="hh-visually-hidden">
          Rated {rounded} out of 5{typeof count === 'number' ? `, ${count} reviews` : ''}
        </span>
      </span>
    );
  }

  return (
    <span
      className={cn('hh-rating', className)}
      role="img"
      aria-label={`Rated ${rounded} out of 5${typeof count === 'number' ? `, ${count} reviews` : ''}`}
    >
      <span className="hh-rating__stars" aria-hidden>
        {STARS.map((s) => (
          <span key={s} className={cn('hh-rating__star', s <= Math.round(value) && 'hh-rating__star--on')}>
            ★
          </span>
        ))}
      </span>
      {typeof count === 'number' ? (
        <span className="hh-rating__count" aria-hidden>
          ({count})
        </span>
      ) : null}
    </span>
  );
}
