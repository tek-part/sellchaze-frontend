/**
 * Rouge ugc-gallery / instagram — a grid of shoppable community shots. Settings: eyebrow, title,
 * handle, columns, images (newline "image | url"). Self-hides with no images.
 */
import type { CSSProperties, ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { Container } from '../components/Container';
import { Section } from '../components/Section';
import { SectionHead } from '../components/SectionHead';
import { StoreImage } from '../components/Image';
import { lines, range, text } from './section-settings';

export function InstagramSection(props: SectionRenderProps): ReactElement | null {
  const { settings } = props;
  const eyebrow = text(settings, 'eyebrow', 'Community');
  const handle = text(settings, 'handle', '@rouge');
  const title = text(settings, 'title', `Share your ritual — ${handle}`);
  const columns = range(settings, 'columns', 5, 3, 6);
  const shots = lines(settings, 'images')
    .map((row) => {
      const [image, url] = row.split('|').map((s) => s.trim());
      return image ? { image, url: url || handle } : null;
    })
    .filter((x): x is { image: string; url: string } => x !== null);

  if (shots.length === 0) return null;
  const style = { '--rge-cols': columns, '--rge-cols-lg': Math.min(columns, 4), '--rge-cols-md': 3, '--rge-cols-sm': 2 } as CSSProperties;

  return (
    <Section tight>
      <Container>
        <SectionHead align="center" eyebrow={eyebrow} title={title} className="rge-section__head-wrap" />
        <div className="rge-grid rge-ugc" style={style}>
          {shots.map((shot, i) => (
            <a key={shot.image + i} href={shot.url} className="rge-ugc__item" aria-label="View post" target="_blank" rel="noreferrer">
              <StoreImage className="rge-ugc__img" src={shot.image} alt="" aria-hidden />
            </a>
          ))}
        </div>
      </Container>
    </Section>
  );
}
