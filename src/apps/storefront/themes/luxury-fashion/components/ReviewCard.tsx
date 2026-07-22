/**
 * ReviewCard — a customer review: rating + serif pull-quote, muted meta, optional photos. "Verified"
 * is a quiet hairline tag, not a loud badge. See §32.4.
 */
import type { ReactElement } from 'react';
import { cn } from '../../../../../shared/utils/cn';
import type { ReviewModel } from '../../../types/catalog';
import { formatDate } from '../../../utils/format';
import { Avatar } from './Avatar';
import { Rating } from './Rating';
import { Tag } from './Chip';
import { StoreImage } from './Image';

export interface ReviewCardProps {
  review: ReviewModel;
  locale?: string;
  className?: string;
}

export function ReviewCard(props: ReviewCardProps): ReactElement {
  const { review, locale, className } = props;
  const date = formatDate(review.createdAt, locale);

  return (
    <article className={cn('sf-review-card', className)}>
      <div className="sf-review-card__head">
        <div className="sf-review-card__author">
          <Avatar name={review.author} src={review.avatar} size="md" />
          <div>
            <div className="sf-review-card__name">{review.author}</div>
            {date ? <div className="sf-review-card__meta">{date}</div> : null}
          </div>
        </div>
        <Rating value={review.rating} showCount={false} />
      </div>

      <p className="sf-review-card__body">{review.body}</p>

      {review.verified ? <Tag variant="subtle">Verified purchase</Tag> : null}

      {review.photos && review.photos.length > 0 ? (
        <div className="sf-review-card__photos">
          {review.photos.map((photo, i) => (
            <StoreImage key={i} className="sf-review-card__photo" src={photo.src} alt={photo.alt ?? ''} />
          ))}
        </div>
      ) : null}
    </article>
  );
}
