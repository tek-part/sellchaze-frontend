/**
 * materials-story — celebrates materials & craft (docs/themes/theme-03/06 §B9): a row of close-ups
 * with a title + note each. Items are indexed fields (item1_image / item1_title / item1_text …).
 * Self-hides when nothing is configured.
 */
import type { CSSProperties, ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { Container } from '../components/Container';
import { Section } from '../components/Section';
import { SectionHead } from '../components/SectionHead';
import { StoreImage } from '../components/Image';
import { option, range, text } from './section-settings';

interface Material {
  image: string;
  title: string;
  body: string;
}

function readItems(settings: SectionRenderProps['settings'], max: number): Material[] {
  const items: Material[] = [];
  for (let i = 1; i <= max; i += 1) {
    const title = text(settings, `item${i}_title`);
    if (!title) continue;
    items.push({ title, image: text(settings, `item${i}_image`), body: text(settings, `item${i}_text`) });
  }
  return items;
}

export function MaterialsStorySection(props: SectionRenderProps): ReactElement | null {
  const { settings } = props;
  const heading = text(settings, 'heading', 'Made from good materials');
  const label = text(settings, 'label');
  const bg = option(settings, 'bg', ['oat', 'sand', 'cream'] as const, 'cream');
  const columns = range(settings, 'columns', 4, 2, 4);
  const items = readItems(settings, 4);

  if (items.length === 0) return null;
  const gridStyle = { '--hh-cols': String(Math.min(columns, items.length)) } as CSSProperties;

  return (
    <Section bg={bg}>
      <Container>
        <SectionHead {...(label ? { label } : {})} title={heading} align="center" />
        <ul className="hh-materials" style={gridStyle}>
          {items.map((m, i) => (
            <li key={i} className="hh-materials__item">
              <span className="hh-materials__media">
                <StoreImage className="hh-materials__img" src={m.image} alt={m.title} />
              </span>
              <h3 className="hh-materials__title">{m.title}</h3>
              {m.body ? <p className="hh-materials__body">{m.body}</p> : null}
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
