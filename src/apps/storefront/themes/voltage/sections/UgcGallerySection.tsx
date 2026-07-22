/** Voltage ugc-gallery — an image wall. `images` = one URL per line. Self-hides when none configured. */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { Container } from '../components/Container';
import { Section } from '../components/Section';
import { SectionHead } from '../components/SectionHead';
import { StoreImage } from '../components/Image';
import { lines, text } from './section-settings';

export function UgcGallerySection(props: SectionRenderProps): ReactElement | null {
  const images = lines(props.settings, 'images').filter(Boolean);
  if (images.length === 0) return null;
  const title = text(props.settings, 'title');

  return (
    <Section reveal>
      <Container>
        {title ? <SectionHead title={title} className="vlt-section__head-wrap" /> : null}
        <div className="vlt-ugc">
          {images.map((src, i) => (
            <div key={i} className="vlt-ugc__cell">
              <StoreImage className="vlt-ugc__img" src={src} alt="" />
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
