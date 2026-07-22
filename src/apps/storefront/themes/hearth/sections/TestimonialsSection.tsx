/**
 * testimonials — warm social proof (docs/themes/theme-03/06 §B10). Manual quotes encoded as indexed
 * fields (quote1_text / quote1_author / quote1_rating …). Reviews are a data gap, so this self-hides
 * when no quotes are configured — it never fabricates testimonials.
 */
import type { CSSProperties, ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { Container } from '../components/Container';
import { Section } from '../components/Section';
import { SectionHead } from '../components/SectionHead';
import { Rating } from '../components/Rating';
import { option, range, text } from './section-settings';

interface Quote {
  text: string;
  author: string;
  rating: number;
}

function readQuotes(settings: SectionRenderProps['settings'], max: number): Quote[] {
  const quotes: Quote[] = [];
  for (let i = 1; i <= max; i += 1) {
    const body = text(settings, `quote${i}_text`);
    if (!body) continue;
    quotes.push({
      text: body,
      author: text(settings, `quote${i}_author`, 'Verified buyer'),
      rating: range(settings, `quote${i}_rating`, 5, 0, 5),
    });
  }
  return quotes;
}

export function TestimonialsSection(props: SectionRenderProps): ReactElement | null {
  const { settings } = props;
  const heading = text(settings, 'heading', 'Loved at home');
  const label = text(settings, 'label');
  const bg = option(settings, 'bg', ['oat', 'sand', 'cream'] as const, 'sand');
  const quotes = readQuotes(settings, 6);

  if (quotes.length === 0) return null;
  const gridStyle = { '--hh-cols': String(Math.min(3, quotes.length)) } as CSSProperties;

  return (
    <Section bg={bg}>
      <Container>
        <SectionHead {...(label ? { label } : {})} title={heading} align="center" />
        <ul className="hh-testimonials" style={gridStyle}>
          {quotes.map((q, i) => (
            <li key={i} className="hh-testimonial">
              {q.rating > 0 ? <Rating value={q.rating} /> : null}
              <blockquote className="hh-testimonial__quote">“{q.text}”</blockquote>
              <cite className="hh-testimonial__author">{q.author}</cite>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
