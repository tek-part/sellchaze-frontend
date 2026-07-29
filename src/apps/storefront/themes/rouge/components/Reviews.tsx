/**
 * Rouge Reviews — a summary (average score + distribution bars) and a list of review cards with
 * rating, verified badge, author, body, and optional photos. Reads the shared ReviewModel.
 */
import { useMemo, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../../../shared/utils/cn';
import type { ReviewModel } from '../../../types/catalog';
import { Rating } from './Rating';
import { Avatar } from './Avatar';
import { Badge } from './Badge';
import { StoreImage } from './Image';

export interface ReviewSummaryProps {
  average: number;
  total: number;
  distribution?: ReadonlyArray<number>;
  className?: string;
}

export function ReviewSummary(props: ReviewSummaryProps): ReactElement {
  const { average, total, distribution, className } = props;
  const { t } = useTranslation();
  const bars = distribution ?? [];
  return (
    <div className={cn('rge-review-summary', className)}>
      <div className="rge-review-summary__aside">
        <div className="rge-review-summary__score rge-num">{average.toFixed(1)}</div>
        <Rating value={average} showCount={false} />
        <div className="rge-review-summary__count">{t('product.reviews', { count: total })}</div>
      </div>
      {bars.length === 5 ? (
        <div className="rge-review-summary__bars">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = bars[star - 1] ?? 0;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={star} className="rge-review-bar">
                <span className="rge-review-bar__label rge-num">{star}</span>
                <span className="rge-review-bar__track"><span className="rge-review-bar__fill" style={{ width: `${pct}%` }} /></span>
                <span className="rge-review-bar__pct rge-num">{pct}%</span>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function ReviewCard(props: { review: ReviewModel }): ReactElement {
  const { review } = props;
  const { t } = useTranslation();
  return (
    <article className="rge-review-card">
      <header className="rge-review-card__head">
        <Avatar name={review.author} {...(review.avatar ? { src: review.avatar } : {})} />
        <div>
          <div className="rge-review-card__name">
            {review.author}
            {review.verified ? <Badge variant="stock">{t('product.verified')}</Badge> : null}
          </div>
          <Rating value={review.rating} showCount={false} />
        </div>
      </header>
      <p className="rge-review-card__body">{review.body}</p>
      {review.photos && review.photos.length > 0 ? (
        <div className="rge-review-card__photos">
          {review.photos.map((photo, i) => (
            <span key={photo.src + i} className="rge-review-card__photo">
              <StoreImage src={photo.src} alt="" aria-hidden />
            </span>
          ))}
        </div>
      ) : null}
    </article>
  );
}

export interface ReviewListProps {
  reviews: ReadonlyArray<ReviewModel>;
  initial?: number;
  className?: string;
}

export function ReviewList(props: ReviewListProps): ReactElement {
  const { reviews, initial = 4, className } = props;
  const { t } = useTranslation();
  const [shown, setShown] = useState(initial);
  const visible = useMemo(() => reviews.slice(0, shown), [reviews, shown]);
  return (
    <div className={cn('rge-review-list', className)}>
      {visible.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}
      {shown < reviews.length ? (
        <button type="button" className="rge-linkbtn rge-review-list__more" onClick={() => setShown((n) => n + initial)}>
          {t('product.showMoreReviews')}
        </button>
      ) : null}
    </div>
  );
}
