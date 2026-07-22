/**
 * Rouge shade-finder — a beauty-signature invitation to find a match by undertone. Renders a row of
 * undertone swatches over an aura glow, plus a CTA.
 *
 * Graceful degradation: the storefront API exposes no shade metadata and no quiz endpoint, so rather
 * than link to a page that does not exist, each swatch is a real query into the existing search
 * route (`/search?q=…`). That works today with zero backend change and stays correct when structured
 * shade data lands. Swatches are real links, so they are keyboard-reachable and announced — the
 * previous `aria-hidden` wrapper hid the undertone labels from assistive tech entirely.
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { Container } from '../components/Container';
import { Section } from '../components/Section';
import { ButtonLink } from '../components/ButtonLink';
import { Eyebrow } from '../components/Typography';
import { IconSwatch } from '../components/icons';
import { text } from './section-settings';

const UNDERTONES: ReadonlyArray<{ label: string; color: string }> = [
  { label: 'Fair', color: '#F3D9C6' },
  { label: 'Light', color: '#E8BE9E' },
  { label: 'Medium', color: '#C89373' },
  { label: 'Tan', color: '#A96F4F' },
  { label: 'Deep', color: '#7B4A31' },
  { label: 'Rich', color: '#4E2C1E' },
];

export function ShadeFinderSection(props: SectionRenderProps): ReactElement | null {
  const { settings } = props;
  const eyebrow = text(settings, 'eyebrow', 'Shade finder');
  const title = text(settings, 'title', 'Find your perfect match');
  const subtitle = text(settings, 'subtitle', 'Answer three questions and we’ll match you to your undertone across the range.');
  const ctaLabel = text(settings, 'cta_label', 'Show my shades');
  const ctaUrl = text(settings, 'cta_url', '/search?q=foundation');

  return (
    <Section>
      <Container>
        <div className="rge-finder">
          <div className="rge-aura rge-finder__aura" aria-hidden />
          <div className="rge-finder__inner">
            <Eyebrow>
              <IconSwatch width={16} height={16} aria-hidden /> {eyebrow}
            </Eyebrow>
            <h2 className="rge-finder__title">{title}</h2>
            <p className="rge-finder__sub">{subtitle}</p>
            <ul className="rge-finder__swatches">
              {UNDERTONES.map((u) => (
                <li key={u.label} className="rge-finder__swatch">
                  <a
                    className="rge-finder__swatch-link"
                    href={`/search?q=${encodeURIComponent(u.label)}`}
                    aria-label={`Shop ${u.label} shades`}
                  >
                    <span className="rge-shade rge-shade--lg" style={{ background: u.color }} aria-hidden />
                    <span className="rge-finder__swatch-label">{u.label}</span>
                  </a>
                </li>
              ))}
            </ul>
            <ButtonLink href={ctaUrl} size="lg">{ctaLabel}</ButtonLink>
          </div>
        </div>
      </Container>
    </Section>
  );
}
