/**
 * ReviewSummary + ReviewList — the PDP reviews block. Summary shows the aggregate score, stars and
 * a per-rating distribution; the list renders ReviewCards with optional load-more. Both self-hide
 * when there is nothing to show (no fabricated ratings). Composes Rating + ReviewCard. See §32.4.
 */
import type { ReactElement } from 'react';
import { cn } from '../../../../../shared/utils/cn';
import type { ReviewModel } from '../../../types/catalog';
import { Button } from './Button';
import { Rating } from './Rating';
import { ReviewCard } from './ReviewCard';

export type RatingDistribution = Partial<Record<1 | 2 | 3 | 4 | 5, number>>;

export interface ReviewSummaryProps {
  average: number;
  total: number;
  distribution?: RatingDistribution;
  className?: string;
}

export function ReviewSummary(props: ReviewSummaryProps): ReactElement | null {
  const { average, total, distribution, className } = props;
  if (total <= 0) return null;

  return (
    <div className={cn('sf-review-summary', className)}>
      <div className="sf-review-summary__aside">
        <span className="sf-review-summary__score">{(Math.round(average * 10) / 10).toFixed(1)}</span>
        <Rating value={average} showCount={false} />
        <span className="sf-review-summary__count">{total} reviews</span>
      </div>
      {distribution ? (
        <div className="sf-review-summary__bars">
          {([5, 4, 3, 2, 1] as const).map((star) => {
            const count = distribution[star] ?? 0;
            const pct = total > 0 ? (count / total) * 100 : 0;
            return (
              <div key={star} className="sf-review-bar">
                <span>{star}★</span>
                <span className="sf-review-bar__track">
                  <span className="sf-review-bar__fill" style={{ width: `${pct}%` }} />
                </span>
                <span>{count}</span>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export interface ReviewListProps {
  reviews: ReadonlyArray<ReviewModel>;
  locale?: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
  className?: string;
}

export function ReviewList(props: ReviewListProps): ReactElement | null {
  const { reviews, locale, onLoadMore, hasMore = false, loadingMore = false, className } = props;
  if (reviews.length === 0) return null;

  return (
    <div className={cn('sf-review-list', className)}>
      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} locale={locale} />
      ))}
      {hasMore && onLoadMore ? (
        <Button variant="secondary" className="sf-review-list__more" loading={loadingMore} onClick={onLoadMore}>
          Load more reviews
        </Button>
      ) : null}
    </div>
  );
}
