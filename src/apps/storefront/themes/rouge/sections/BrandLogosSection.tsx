/**
 * Rouge brand-logos — an "as seen in" / stockist strip. Settings: title, logos (newline "name | image").
 * Falls back to text names when a logo image is absent. Self-hides with no logos.
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { Container } from '../components/Container';
import { Section } from '../components/Section';
import { StoreImage } from '../components/Image';
import { lines, text } from './section-settings';
import { brandsFrom, sectionTitlesFrom } from '../../../content/home-data';

export function BrandLogosSection(props: SectionRenderProps): ReactElement | null {
  const { settings, context } = props;
  const fromData = brandsFrom(context);
  const title = sectionTitlesFrom(context).brands ?? text(settings, 'title', 'As seen in');
  const logos = fromData.length
    ? fromData.map((b) => ({ name: b.name, image: b.logo ?? '' }))
    : lines(settings, 'logos')
        .map((row) => {
          const [name, image] = row.split('|').map((s) => s.trim());
          return name ? { name, image: image ?? '' } : null;
        })
        .filter((x): x is { name: string; image: string } => x !== null);

  if (logos.length === 0) return null;

  return (
    <Section tight>
      <Container>
        {title ? <p className="rge-logos__title">{title}</p> : null}
        <ul className="rge-logos">
          {logos.map((logo) => (
            <li key={logo.name} className="rge-logos__item">
              {logo.image ? <StoreImage className="rge-logos__img" src={logo.image} alt={logo.name} /> : <span className="rge-logos__name">{logo.name}</span>}
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
