/** Voltage brand-logos — a wordmark wall. Brand names (one per line) as mono chips. Self-hides empty. */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { Container } from '../components/Container';
import { Section } from '../components/Section';
import { lines, text } from './section-settings';
import { brandsFrom, sectionTitlesFrom } from '../../../content/home-data';

export function BrandLogosSection(props: SectionRenderProps): ReactElement | null {
  const fromData = brandsFrom(props.context);
  const brands = fromData.length ? fromData.map((b) => b.name) : lines(props.settings, 'brands').filter(Boolean);
  if (brands.length === 0) return null;
  const title = sectionTitlesFrom(props.context).brands ?? text(props.settings, 'title');

  return (
    <Section reveal className="vlt-section--tight">
      <Container>
        {title ? <p className="vlt-brands__label vlt-eyebrow">{title}</p> : null}
        <ul className="vlt-brands">
          {brands.map((brand, i) => (
            <li key={i} className="vlt-brands__item">{brand}</li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
