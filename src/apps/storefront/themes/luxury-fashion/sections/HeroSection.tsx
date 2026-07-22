/**
 * hero — top-of-funnel statement; brand tone in one frame. Full-bleed media with a scrim, eyebrow →
 * serif headline → subheading → CTA. Settings: heading, subheading, eyebrow, cta_label, cta_url,
 * image, align, overlay, ken_burns. Falls back to a quiet Bone panel when there's no image. §08 hero.
 */
import type { CSSProperties, ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { cn } from '../../../../../shared/utils/cn';
import { ButtonLink } from '../components/ButtonLink';
import { Container } from '../components/Container';
import { Eyebrow } from '../components/Typography';
import { StoreImage } from '../components/Image';
import { flag, option, range, text } from './section-settings';

export function HeroSection(props: SectionRenderProps): ReactElement | null {
  const { settings } = props;
  const heading = text(settings, 'heading');
  const subheading = text(settings, 'subheading');
  const eyebrow = text(settings, 'eyebrow');
  const ctaLabel = text(settings, 'cta_label');
  const ctaUrl = text(settings, 'cta_url', '#');
  const image = text(settings, 'image');
  const align = option(settings, 'align', ['start', 'center', 'end'] as const, 'start');
  const overlay = range(settings, 'overlay', 50, 0, 100) / 100;
  const kenBurns = flag(settings, 'ken_burns', false);
  const hasMedia = Boolean(image);

  if (!heading && !hasMedia) return null;

  const scrimStyle = { '--sf-hero-overlay': String(overlay) } as CSSProperties;

  return (
    <section
      className={cn(
        'sf-hero',
        `sf-hero--${align}`,
        !hasMedia && 'sf-hero--plain',
        kenBurns && hasMedia && 'sf-hero--ken',
      )}
    >
      {hasMedia ? (
        <div className="sf-hero__media">
          <StoreImage className="sf-hero__img" src={image} alt="" eager />
          <div className="sf-hero__scrim" style={scrimStyle} aria-hidden />
        </div>
      ) : null}
      <div className="sf-hero__inner">
        <Container>
          <div className="sf-hero__content">
            {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
            {heading ? <h1 className="sf-hero__title">{heading}</h1> : null}
            {subheading ? <p className="sf-hero__sub">{subheading}</p> : null}
            {ctaLabel ? (
              <div className="sf-hero__actions">
                <ButtonLink href={ctaUrl} size="lg">
                  {ctaLabel}
                </ButtonLink>
              </div>
            ) : null}
          </div>
        </Container>
      </div>
    </section>
  );
}
