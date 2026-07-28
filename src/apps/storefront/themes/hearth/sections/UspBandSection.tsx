/**
 * usp-band — a calm reassurance strip (free delivery, easy returns, warranty, swatches by mail).
 * Items are encoded one per line as "title | description". Self-hides when empty.
 */
import type { CSSProperties, ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { Container } from '../components/Container';
import { Section } from '../components/Section';
import { option, range, lines, text } from './section-settings';
import { sectionTitlesFrom, whyChooseUsFrom } from '../../../content/home-data';

export function UspBandSection(props: SectionRenderProps): ReactElement | null {
  const { settings, context } = props;
  const fromData = whyChooseUsFrom(context);
  const heading = sectionTitlesFrom(context).why ?? text(settings, 'heading');
  const bg = option(settings, 'bg', ['oat', 'sand', 'cream'] as const, 'sand');
  const items = fromData.length
    ? fromData.map((w) => ({ title: w.title, body: w.text }))
    : lines(settings, 'items').map((line) => {
        const [title, ...rest] = line.split('|');
        return { title: (title ?? '').trim(), body: rest.join('|').trim() };
      });
  const columns = range(settings, 'columns', Math.min(items.length || 1, 4), 2, 5);

  if (items.length === 0) return null;

  const gridStyle = { '--hh-cols': String(columns) } as CSSProperties;

  return (
    <Section bg={bg} tight>
      <Container>
        {heading ? <h2 className="hh-usp__heading">{heading}</h2> : null}
        <ul className="hh-usp" style={gridStyle}>
          {items.map((item, i) => (
            <li key={i} className="hh-usp__item">
              <span className="hh-usp__dot" aria-hidden />
              <div className="hh-usp__text">
                <p className="hh-usp__title">{item.title}</p>
                {item.body ? <p className="hh-usp__body">{item.body}</p> : null}
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
