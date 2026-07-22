/** Voltage rich-text — a centered prose block. `heading` + body (one paragraph per line). Self-hides. */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { Container } from '../components/Container';
import { Section } from '../components/Section';
import { lines, text } from './section-settings';

export function RichTextSection(props: SectionRenderProps): ReactElement | null {
  const heading = text(props.settings, 'heading');
  const body = lines(props.settings, 'body').filter(Boolean);
  if (!heading && body.length === 0) return null;
  const eyebrow = text(props.settings, 'eyebrow');

  return (
    <Section reveal>
      <Container>
        <div className="vlt-richtext">
          {eyebrow ? <span className="vlt-eyebrow">{eyebrow}</span> : null}
          {heading ? <h2 className="vlt-richtext__title">{heading}</h2> : null}
          {body.map((p, i) => (
            <p key={i} className="vlt-richtext__p">{p}</p>
          ))}
        </div>
      </Container>
    </Section>
  );
}
