/** Voltage about — editorial prose page. `heading` + body (one paragraph per line). Voltage's own. */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { Container } from '../components/Container';
import { Section } from '../components/Section';
import { lines, text } from './section-settings';

export function AboutSection(props: SectionRenderProps): ReactElement {
  const heading = text(props.settings, 'heading') || 'Built to a spec, not a season';
  const eyebrow = text(props.settings, 'eyebrow') || '// The company';
  const storeName = props.context.store.name;
  const body = lines(props.settings, 'body');
  const paragraphs = body.length > 0 ? body : [
    `${storeName} started with one conviction: publish every number that matters and let people buy on the facts. Weight, draw, tolerance, runtime — up front, on every product.`,
    'We build in small runs with suppliers we know by name, spec each unit against a written standard, and back it for two years. No hype, no mystery — just gear that measures up.',
  ];

  return (
    <Section reveal>
      <Container narrow>
        <div className="vlt-flow-head">
          <span className="vlt-eyebrow">{eyebrow}</span>
          <h1 className="vlt-flow-head__title">{heading}</h1>
        </div>
        <div className="vlt-prose">
          {paragraphs.map((p, i) => <p key={i} className="vlt-prose__p">{p}</p>)}
        </div>
      </Container>
    </Section>
  );
}
