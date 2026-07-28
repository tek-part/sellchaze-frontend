/**
 * roomset-hero — Hearth's warm, styled-room opener (docs/themes/theme-03/06 §B1). Big room-context
 * media with a soft scrim, small serif label → serif headline → subheading → CTA. Falls back to a
 * warm oat gradient panel when there's no image, so it still looks composed (data-gap safe).
 */
import type { CSSProperties, ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { cn } from '../../../../../shared/utils/cn';
import { ButtonLink } from '../components/ButtonLink';
import { Container } from '../components/Container';
import { SectionLabel } from '../components/Typography';
import { StoreImage } from '../components/Image';
import { option, range, text } from './section-settings';
import { heroFrom } from '../../../content/home-data';

export function HeroSection(props: SectionRenderProps): ReactElement | null {
  const { settings, context } = props;
  const hero = heroFrom(context);
  const heading = hero.heading ?? text(settings, 'heading');
  const subheading = hero.subheading ?? text(settings, 'subheading');
  const label = hero.eyebrow ?? text(settings, 'label');
  const ctaLabel = hero.ctaLabel ?? text(settings, 'cta_label');
  const ctaUrl = hero.ctaUrl ?? text(settings, 'cta_url', '#');
  const cta2Label = hero.cta2Label ?? text(settings, 'cta2_label');
  const cta2Url = hero.cta2Url ?? text(settings, 'cta2_url', '#');
  const image = hero.image ?? text(settings, 'image');
  const align = option(settings, 'align', ['start', 'center'] as const, 'start');
  const overlay = range(settings, 'overlay_opacity', 30, 0, 60) / 100;
  const hasMedia = Boolean(image);

  if (!heading && !hasMedia) return null;

  const scrimStyle = { '--hh-hero-overlay': String(overlay) } as CSSProperties;

  return (
    <section className={cn('hh-hero', `hh-hero--${align}`, !hasMedia && 'hh-hero--plain')}>
      {hasMedia ? (
        <div className="hh-hero__media">
          <StoreImage className="hh-hero__img" src={image} alt="" eager />
          <div className="hh-hero__scrim" style={scrimStyle} aria-hidden />
        </div>
      ) : null}
      <div className="hh-hero__inner">
        <Container>
          <div className="hh-hero__content">
            {label ? <SectionLabel>{label}</SectionLabel> : null}
            {heading ? <h1 className="hh-hero__title">{heading}</h1> : null}
            {subheading ? <p className="hh-hero__sub">{subheading}</p> : null}
            {ctaLabel || cta2Label ? (
              <div className="hh-hero__actions">
                {ctaLabel ? (
                  <ButtonLink href={ctaUrl} size="lg">
                    {ctaLabel}
                  </ButtonLink>
                ) : null}
                {cta2Label ? (
                  <ButtonLink href={cta2Url} size="lg" variant="outline">
                    {cta2Label}
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
