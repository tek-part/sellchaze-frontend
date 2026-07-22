/**
 * large-gallery — an immersive inspiration lookbook (docs/themes/theme-03/06 §B8): a mosaic of
 * roomset/lifestyle tiles with optional captions + links. Indexed image fields (image1..image9).
 * Self-hides when empty; fixed aspect ratios keep CLS at zero.
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { cn } from '../../../../../shared/utils/cn';
import { Container } from '../components/Container';
import { Section } from '../components/Section';
import { SectionHead } from '../components/SectionHead';
import { StoreImage } from '../components/Image';
import { option, text } from './section-settings';

interface Tile {
  image: string;
  caption: string;
  url: string;
}

function readTiles(settings: SectionRenderProps['settings'], max: number): Tile[] {
  const tiles: Tile[] = [];
  for (let i = 1; i <= max; i += 1) {
    const image = text(settings, `image${i}`);
    if (!image) continue;
    tiles.push({ image, caption: text(settings, `caption${i}`), url: text(settings, `link${i}_url`) });
  }
  return tiles;
}

export function LargeGallerySection(props: SectionRenderProps): ReactElement | null {
  const { settings } = props;
  const heading = text(settings, 'heading', 'Inspiration');
  const label = text(settings, 'label');
  const layout = option(settings, 'layout', ['mosaic', 'grid'] as const, 'mosaic');
  const tiles = readTiles(settings, 9);

  if (tiles.length === 0) return null;

  return (
    <Section bg="oat">
      <Container>
        <SectionHead {...(label ? { label } : {})} title={heading} />
      </Container>
      <Container flush={false}>
        <ul className={cn('hh-gallery-grid', `hh-gallery-grid--${layout}`)}>
          {tiles.map((t, i) => {
            const inner = (
              <>
                <StoreImage className="hh-gallery-grid__img" src={t.image} alt={t.caption || 'Inspiration'} />
                {t.caption ? <span className="hh-gallery-grid__caption">{t.caption}</span> : null}
              </>
            );
            return (
              <li key={i} className={cn('hh-gallery-grid__tile', i % 5 === 0 && 'hh-gallery-grid__tile--wide')}>
                {t.url ? (
                  <a href={t.url} className="hh-gallery-grid__link">
                    {inner}
                  </a>
                ) : (
                  <span className="hh-gallery-grid__link">{inner}</span>
                )}
              </li>
            );
          })}
        </ul>
      </Container>
    </Section>
  );
}
