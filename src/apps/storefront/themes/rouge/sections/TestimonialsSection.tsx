/**
 * Rouge testimonials — editorial social proof: gilt-quote cards with a star rating, author, and an
 * optional "verified" note. Settings: eyebrow, title, and quotes as newline-separated
 * "body | author | rating" rows.
 *
 * Integrity: this section NEVER fabricates social proof. A quote attributed to a named person is a
 * factual claim about a real customer; inventing one would breach the certification entry floor's
 * "no fabricated data" rule. With no merchant-authored quotes the section self-hides.
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { Container } from '../components/Container';
import { Section } from '../components/Section';
import { SectionHead } from '../components/SectionHead';
import { Rating } from '../components/Rating';
import { lines, text } from './section-settings';
import { testimonialsFrom } from '../../../content/home-data';

interface Quote { body: string; author: string; rating: number }

function parse(rows: string[]): Quote[] {
  return rows
    .map((row) => {
      const [body, author, rating] = row.split('|').map((s) => s.trim());
      if (!body) return null;
      const r = Number.parseFloat(rating ?? '5');
      return { body, author: author || 'Verified buyer', rating: Number.isFinite(r) ? r : 5 };
    })
    .filter((q): q is Quote => q !== null);
}

export function TestimonialsSection(props: SectionRenderProps): ReactElement | null {
  const { settings, context } = props;
  const eyebrow = text(settings, 'eyebrow', 'Loved by many');
  const title = text(settings, 'title', 'The verdict');
  const fromData = testimonialsFrom(context);
  const quotes = fromData.length
    ? fromData.map((t) => ({ body: t.body, author: t.author, rating: t.rating }))
    : parse(lines(settings, 'quotes'));
  if (quotes.length === 0) return null;

  return (
    <Section>
      <Container>
        <SectionHead align="center" eyebrow={eyebrow} title={title} className="rge-section__head-wrap" />
        <div className="rge-quotes">
          {quotes.map((q) => (
            <figure key={q.author + q.body.slice(0, 12)} className="rge-quote">
              <Rating value={q.rating} showCount={false} className="rge-quote__stars" />
              <blockquote className="rge-quote__body">{q.body}</blockquote>
              <figcaption className="rge-quote__author">{q.author}</figcaption>
            </figure>
          ))}
        </div>
      </Container>
    </Section>
  );
}
