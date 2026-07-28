/**
 * Voltage hero — spec-confident brand moment: neon field backdrop (+ optional media), mono eyebrow,
 * big grotesque headline, cyan CTA. Settings: heading, subheading, eyebrow, cta_label, cta_url, image,
 * align, overlay.
 */
import type { CSSProperties, ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { cn } from '../../../../../shared/utils/cn';
import { ButtonLink } from '../components/ButtonLink';
import { Container } from '../components/Container';
import { Eyebrow } from '../components/Typography';
import { StoreImage } from '../components/Image';
import { flag, option, range, text } from './section-settings';
import { heroFrom } from '../../../content/home-data';

export function HeroSection(props: SectionRenderProps): ReactElement | null {
  const { settings, context } = props;
  const hero = heroFrom(context);
  const heading = hero.heading ?? text(settings, 'heading');
  const subheading = hero.subheading ?? text(settings, 'subheading');
  const eyebrow = hero.eyebrow ?? text(settings, 'eyebrow');
  const ctaLabel = hero.ctaLabel ?? text(settings, 'cta_label');
  const ctaUrl = hero.ctaUrl ?? text(settings, 'cta_url', '#');
  const image = hero.image ?? text(settings, 'image');
  const align = option(settings, 'align', ['start', 'center'] as const, 'start');
  const overlay = range(settings, 'overlay', 42, 0, 100) / 100;
  const showField = flag(settings, 'field', true);
  if (!heading && !image) return null;

  return (
    <section className={cn('vlt-hero', image && 'vlt-hero--media', align === 'center' && 'vlt-hero--center')}>
      {image ? <StoreImage className="vlt-hero__img" src={image} alt="" eager style={{ opacity: overlay ? 1 - overlay : 0.42 } as CSSProperties} /> : null}
      {showField ? <div className="vlt-hero__field" aria-hidden /> : null}
      <div className="vlt-hero__inner">
        <Container>
          <div className="vlt-hero__content">
            {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
            {heading ? <h1 className="vlt-hero__title">{heading}</h1> : null}
            {subheading ? <p className="vlt-hero__sub">{subheading}</p> : null}
            {ctaLabel ? (
              <div className="vlt-hero__actions">
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
