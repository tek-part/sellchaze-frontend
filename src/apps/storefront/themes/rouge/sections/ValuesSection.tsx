/**
 * Rouge values / why-choose-us — a promise grid with thin-line icons. Settings: eyebrow, title,
 * columns, items (newline "Title | Text"). A rotating set of beauty glyphs decorates each cell.
 */
import type { CSSProperties, ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { Container } from '../components/Container';
import { Section } from '../components/Section';
import { SectionHead } from '../components/SectionHead';
import { IconLeaf, IconHeart, IconDroplet, IconSparkle, IconTruck, IconReturn, type IconProps } from '../components/icons';
import { lines, range, text } from './section-settings';
import { sectionTitlesFrom, whyChooseUsFrom } from '../../../content/home-data';

const GLYPHS: ReadonlyArray<(p: IconProps) => ReactElement> = [IconTruck, IconReturn, IconLeaf, IconHeart, IconDroplet, IconSparkle];

export function ValuesSection(props: SectionRenderProps): ReactElement | null {
  const { settings, context } = props;
  const eyebrow = text(settings, 'eyebrow');
  const title = sectionTitlesFrom(context).why ?? text(settings, 'title', 'The Rouge promise');
  const columns = range(settings, 'columns', 3, 2, 4);
  const fromData = whyChooseUsFrom(context);
  const items = fromData.length
    ? fromData.map((w) => ({ title: w.title, body: w.text }))
    : lines(settings, 'items')
        .map((row) => {
          const [t, body] = row.split('|').map((s) => s.trim());
          return t ? { title: t, body: body ?? '' } : null;
        })
        .filter((x): x is { title: string; body: string } => x !== null);

  if (items.length === 0) return null;
  const style = { '--rge-cols': columns, '--rge-cols-lg': Math.min(columns, 3), '--rge-cols-md': 2, '--rge-cols-sm': 1 } as CSSProperties;

  return (
    <Section tight>
      <Container>
        {title ? <SectionHead align="center" {...(eyebrow ? { eyebrow } : {})} title={title} className="rge-section__head-wrap" /> : null}
        <ul className="rge-values rge-grid" style={style}>
          {items.map((item, i) => {
            const Glyph = GLYPHS[i % GLYPHS.length]!;
            return (
              <li key={item.title} className="rge-value">
                <span className="rge-value__icon" aria-hidden><Glyph width={24} height={24} /></span>
                <span className="rge-value__title">{item.title}</span>
                {item.body ? <span className="rge-value__text">{item.body}</span> : null}
              </li>
            );
          })}
        </ul>
      </Container>
    </Section>
  );
}
