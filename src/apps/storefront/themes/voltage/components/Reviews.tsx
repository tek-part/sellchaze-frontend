/**
 * Voltage Reviews — the PDP reviews block. ReviewSummary shows the aggregate score, stars and a
 * per-star distribution; ReviewList renders ReviewCards with optional load-more. Both self-hide when
 * there's nothing to show (never fabricates ratings). Voltage's own .vlt-* markup.
 */
import { useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import type { ReviewModel } from '../../../types/catalog';
import { Rating } from './Rating';
import { ReviewCard } from './ReviewCard';
import { Button } from './Button';

type Distribution = Partial<Record<1 | 2 | 3 | 4 | 5, number>>;

function distributionOf(reviews: ReadonlyArray<ReviewModel>): Distribution {
  const dist: Distribution = {};
  for (const r of reviews) {
    const star = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
    dist[star] = (dist[star] ?? 0) + 1;
  }
  return dist;
}

export interface ReviewsProps {
  reviews: ReadonlyArray<ReviewModel>;
  /** How many to show before "load more". */
  pageSize?: number;
}

export function Reviews(props: ReviewsProps): ReactElement | null {
  const { reviews, pageSize = 4 } = props;
  const { t } = useTranslation();
  const [shown, setShown] = useState(pageSize);
  if (reviews.length === 0) return null;

  const total = reviews.length;
  const average = reviews.reduce((s, r) => s + r.rating, 0) / total;
  const dist = distributionOf(reviews);
  const visible = reviews.slice(0, shown);

  return (
    <section className="vlt-reviews" aria-label={t('product.customerReviews')}>
      <div className="vlt-review-summary">
        <div className="vlt-review-summary__aside">
          <span className="vlt-review-summary__score vlt-num">{(Math.round(average * 10) / 10).toFixed(1)}</span>
          <Rating value={average} />
          <span className="vlt-review-summary__count vlt-num">{t('product.reviews', { count: total })}</span>
        </div>
        <div className="vlt-review-summary__bars">
          {([5, 4, 3, 2, 1] as const).map((star) => {
            const count = dist[star] ?? 0;
            const pct = total > 0 ? (count / total) * 100 : 0;
            return (
              <div key={star} className="vlt-review-bar">
                <span className="vlt-review-bar__label vlt-num">{star}★</span>
                <span className="vlt-review-bar__track"><span className="vlt-review-bar__fill" style={{ width: `${pct}%` }} /></span>
                <span className="vlt-review-bar__count vlt-num">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="vlt-review-list">
        {visible.map((review) => <ReviewCard key={review.id} review={review} />)}
      </div>

      {shown < total ? (
        <div className="vlt-review-more">
          <Button variant="secondary" onClick={() => setShown((n) => n + pageSize)}>
            {t('product.loadMoreReviewsCount', { count: total - shown })}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
