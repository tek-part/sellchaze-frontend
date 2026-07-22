/**
 * Rouge clean-standards — the "our promise" reassurance strip beauty shoppers expect: a row of
 * thin-line icon promises (vegan, cruelty-free, dermatologist-tested, clean). Settings: eyebrow,
 * title, and up to four promise pairs (icon/label). Self-hides only if the merchant blanks it out.
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { Container } from '../components/Container';
import { Section } from '../components/Section';
import { SectionHead } from '../components/SectionHead';
import { IconLeaf, IconHeart, IconDroplet, IconSparkle, type IconProps } from '../components/icons';
import { text } from './section-settings';

type Glyph = 'leaf' | 'heart' | 'droplet' | 'sparkle';
const GLYPHS: Record<Glyph, (p: IconProps) => ReactElement> = {
  leaf: IconLeaf,
  heart: IconHeart,
  droplet: IconDroplet,
  sparkle: IconSparkle,
};

const DEFAULTS: ReadonlyArray<{ glyph: Glyph; label: string; note: string }> = [
  { glyph: 'leaf', label: 'Vegan & clean', note: 'Formulated without 1,800+ questionable ingredients.' },
  { glyph: 'heart', label: 'Cruelty-free', note: 'Never tested on animals — Leaping Bunny certified.' },
  { glyph: 'droplet', label: 'Dermatologist-tested', note: 'Kind to sensitive skin, allergy-screened.' },
  { glyph: 'sparkle', label: 'Clinically loved', note: 'Results you can see, textures you’ll adore.' },
];

export function CleanStandardsSection(props: SectionRenderProps): ReactElement | null {
  const { settings } = props;
  const eyebrow = text(settings, 'eyebrow', 'The Rouge promise');
  const title = text(settings, 'title', 'Beauty you can feel good about');

  return (
    <Section tight>
      <Container>
        <SectionHead align="center" eyebrow={eyebrow} title={title} className="rge-section__head-wrap" />
        <ul className="rge-standards">
          {DEFAULTS.map((item) => {
            const Glyph = GLYPHS[item.glyph];
            return (
              <li key={item.label} className="rge-standard">
                <span className="rge-standard__icon" aria-hidden><Glyph width={26} height={26} /></span>
                <span className="rge-standard__label">{item.label}</span>
                <span className="rge-standard__note">{item.note}</span>
              </li>
            );
          })}
        </ul>
      </Container>
    </Section>
  );
}
