/**
 * testimonials — trust; reduce purchase anxiety. Serif pull-quotes with rating + avatar, in a
 * Carousel. Reads reviews from the page data; self-hides when there are none (no fabricated quotes).
 * §08 testimonials.
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { Avatar } from '../components/Avatar';
import { Carousel } from '../components/Carousel';
import { Rating } from '../components/Rating';
import { SectionShell } from './SectionShell';
import { testimonialsFor } from './section-data';
import { text } from './section-settings';

export function TestimonialsSection(props: SectionRenderProps): ReactElement | null {
  const { settings, context } = props;
  const title = text(settings, 'title', 'What clients say');
  const reviews = testimonialsFor(context);
  if (reviews.length === 0) return null;

  return (
    <SectionShell title={title} align="center">
      <Carousel ariaLabel={title} itemClassName="sf-rail-item" showDots>
        {reviews.map((review) => (
          <figure key={review.id} className="sf-testimonial">
            <Rating value={review.rating} showCount={false} />
            <blockquote className="sf-testimonial__quote">“{review.body}”</blockquote>
            <figcaption className="sf-testimonial__who">
              <Avatar name={review.author} {...(review.avatar ? { src: review.avatar } : {})} size="md" />
              <span className="sf-testimonial__name">{review.author}</span>
            </figcaption>
          </figure>
        ))}
      </Carousel>
    </SectionShell>
  );
}
