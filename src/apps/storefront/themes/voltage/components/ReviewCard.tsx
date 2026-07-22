/** Voltage ReviewCard — a single customer review: author + verified chip, star rating, body, date. */
import type { ReactElement } from 'react';
import type { ReviewModel } from '../../../types/catalog';
import { Rating } from './Rating';
import { formatDate } from '../../../utils/format';

export interface ReviewCardProps {
  review: ReviewModel;
}

export function ReviewCard(props: ReviewCardProps): ReactElement {
  const { review } = props;
  const date = review.createdAt ? formatDate(review.createdAt) : null;
  return (
    <article className="vlt-review">
      <header className="vlt-review__head">
        <span className="vlt-review__author">{review.author}</span>
        {review.verified ? <span className="vlt-review__verified">✓ Verified</span> : null}
      </header>
      <Rating value={review.rating} />
      <p className="vlt-review__body">{review.body}</p>
      {date ? <time className="vlt-review__date vlt-num" dateTime={review.createdAt}>{date}</time> : null}
    </article>
  );
}
