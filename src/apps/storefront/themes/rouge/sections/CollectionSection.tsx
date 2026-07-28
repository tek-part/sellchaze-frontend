/**
 * Rouge collection / lookbook — a grid of large editorial collection tiles. Settings: eyebrow, title,
 * columns, items (newline "Label | Subtitle | image | url"). Self-hides with no items.
 */
import type { CSSProperties, ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { Container } from '../components/Container';
import { Section } from '../components/Section';
import { SectionHead } from '../components/SectionHead';
import { StoreImage } from '../components/Image';
import { lines, range, text } from './section-settings';
import { featuredCollectionsFrom, sectionTitlesFrom } from '../../../content/home-data';

interface Tile { label: string; subtitle: string; image: string; url: string }

export function CollectionSection(props: SectionRenderProps): ReactElement | null {
  const { settings, context } = props;
  const fromData = featuredCollectionsFrom(context);
  const eyebrow = text(settings, 'eyebrow');
  const title = sectionTitlesFrom(context).collections ?? text(settings, 'title');
  const columns = range(settings, 'columns', 3, 2, 4);
  const tiles: Tile[] = fromData.length
    ? fromData.map((c) => ({ label: c.title, subtitle: c.subtitle ?? '', image: c.image?.src ?? '', url: c.url }))
    : lines(settings, 'items')
        .map((row) => {
          const [label, subtitle, image, url] = row.split('|').map((s) => s.trim());
          return label ? { label, subtitle: subtitle ?? '', image: image ?? '', url: url ?? '#' } : null;
        })
        .filter((x): x is Tile => x !== null);

  if (tiles.length === 0) return null;
  const style = { '--rge-cols': columns, '--rge-cols-lg': Math.min(columns, 3), '--rge-cols-md': 2, '--rge-cols-sm': 1 } as CSSProperties;

  return (
    <Section>
      <Container>
        {title || eyebrow ? <SectionHead align="center" {...(eyebrow ? { eyebrow } : {})} title={title || eyebrow} className="rge-section__head-wrap" /> : null}
        <div className="rge-grid" style={style}>
          {tiles.map((tile) => (
            <a key={tile.label} href={tile.url} className="rge-collection" aria-label={tile.label}>
              <StoreImage className="rge-collection__img" src={tile.image} alt="" aria-hidden />
              <span className="rge-collection__overlay">
                {tile.subtitle ? <span className="rge-collection__subtitle">{tile.subtitle}</span> : null}
                <span className="rge-collection__title">{tile.label}</span>
              </span>
            </a>
          ))}
        </div>
      </Container>
    </Section>
  );
}
