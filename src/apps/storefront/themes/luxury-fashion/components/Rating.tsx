/**
 * Rating — aggregate score as thin line stars filled with `--primary` (never gold/yellow), plus an
 * optional `--muted` count. Fractional scores fill partially. Renders NOTHING when there are no
 * reviews — never "0 stars". See §32.3.
 */
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../../../shared/utils/cn';
import { IconStar } from './icons';

export interface RatingProps {
  /** Average score, 0–`max`. */
  value: number;
  /** Number of reviews; shown when `showCount` and drives the self-hide rule. */
  count?: number;
  max?: number;
  showCount?: boolean;
  className?: string;
}

function stars(max: number): ReactElement[] {
  return Array.from({ length: max }, (_, i) => <IconStar key={i} className="sf-rating__star" />);
}

export function Rating(props: RatingProps): ReactElement | null {
  const { value, count, max = 5, showCount = true, className } = props;
  const { t } = useTranslation();

  // Self-hide when there is genuinely nothing to show.
  if (!(value > 0) && !(typeof count === 'number' && count > 0)) return null;

  const pct = Math.max(0, Math.min(1, value / max)) * 100;
  const rounded = Math.round(value * 10) / 10;

  return (
    <span
      className={cn('sf-rating', className)}
      role="img"
      aria-label={typeof count === 'number'
        ? t('product.ratedOutOfMaxCount', { rating: rounded, max, count })
        : t('product.ratedOutOfMax', { rating: rounded, max })}
    >
      <span className="sf-rating__stars" aria-hidden>
        {stars(max)}
        <span className="sf-rating__fill" style={{ width: `${pct}%` }}>
          {stars(max)}
        </span>
      </span>
      {showCount && typeof count === 'number' ? <span className="sf-rating__count">({count})</span> : null}
    </span>
  );
}
