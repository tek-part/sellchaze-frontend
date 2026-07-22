/**
 * Rouge hero — a luminous brand moment: an aura-glow backdrop (+ optional macro-texture media), a
 * gilt eyebrow, a large didone headline with an optional script flourish, and a rouge CTA. Settings:
 * eyebrow, flourish, heading, subheading, cta_label, cta_url, secondary_label, secondary_url, image,
 * align, overlay, glow.
 */
import type { CSSProperties, ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { cn } from '../../../../../shared/utils/cn';
import { ButtonLink } from '../components/ButtonLink';
import { Container } from '../components/Container';
import { Eyebrow, Script } from '../components/Typography';
import { StoreImage } from '../components/Image';
import { flag, option, range, text } from './section-settings';

export function HeroSection(props: SectionRenderProps): ReactElement | null {
  const { settings } = props;
  const heading = text(settings, 'heading');
  const subheading = text(settings, 'subheading');
  const eyebrow = text(settings, 'eyebrow');
  const flourish = text(settings, 'flourish');
  const ctaLabel = text(settings, 'cta_label');
  const ctaUrl = text(settings, 'cta_url', '#');
  const secondaryLabel = text(settings, 'secondary_label');
  const secondaryUrl = text(settings, 'secondary_url', '#');
  const image = text(settings, 'image');
  const align = option(settings, 'align', ['start', 'center'] as const, 'center');
  const overlay = range(settings, 'overlay', 24, 0, 100) / 100;
  const showGlow = flag(settings, 'glow', true);
  if (!heading && !image) return null;

  return (
    <section className={cn('rge-hero', image && 'rge-hero--media', align === 'center' && 'rge-hero--center')}>
      {showGlow ? <div className="rge-aura rge-hero__aura" aria-hidden /> : null}
      {image ? (
        <>
          <StoreImage className="rge-hero__img" src={image} alt="" eager />
          <div className="rge-hero__scrim" style={{ opacity: overlay } as CSSProperties} aria-hidden />
        </>
      ) : null}
      <div className="rge-hero__inner">
        <Container>
          <div className="rge-hero__content">
            {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
            {heading ? (
              <h1 className="rge-hero__title">
                {heading}
                {flourish ? (
                  <>
                    {' '}
                    <Script gilt className="rge-hero__flourish">{flourish}</Script>
                  </>
                ) : null}
              </h1>
            ) : null}
            {subheading ? <p className="rge-hero__sub">{subheading}</p> : null}
            {ctaLabel || secondaryLabel ? (
              <div className="rge-hero__actions">
                {ctaLabel ? (
                  <ButtonLink href={ctaUrl} size="lg">
                    {ctaLabel}
                  </ButtonLink>
                ) : null}
                {secondaryLabel ? (
                  <ButtonLink href={secondaryUrl} size="lg" variant="secondary">
                    {secondaryLabel}
                  </ButtonLink>
                ) : null}
              </div>
            ) : null}
          </div>
        </Container>
      </div>
    </section>
  );
}
