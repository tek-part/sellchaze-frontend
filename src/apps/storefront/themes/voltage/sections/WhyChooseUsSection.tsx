/**
 * Voltage why-choose-us — a benefits triad. Each item is a `title | text` line; rendered as spec
 * cards with a technical index marker. Self-hides when no items are configured.
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { Container } from '../components/Container';
import { Section } from '../components/Section';
import { SectionHead } from '../components/SectionHead';
import { lines, text } from './section-settings';

export function WhyChooseUsSection(props: SectionRenderProps): ReactElement | null {
  const items = lines(props.settings, 'items')
    .map((raw) => raw.split('|').map((p) => p.trim()))
    .filter((parts) => parts[0]);
  if (items.length === 0) return null;
  const title = text(props.settings, 'title');

  return (
    <Section reveal>
      <Container>
        {title ? <SectionHead title={title} className="vlt-section__head-wrap" /> : null}
        <ul className="vlt-why">
          {items.map((parts, i) => (
            <li key={i} className="vlt-why__item">
              <span className="vlt-why__index vlt-num">{String(i + 1).padStart(2, '0')}</span>
              <span className="vlt-why__title">{parts[0]}</span>
              {parts[1] ? <span className="vlt-why__text">{parts[1]}</span> : null}
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
