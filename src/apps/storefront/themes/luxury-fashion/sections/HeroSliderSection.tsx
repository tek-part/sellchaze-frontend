/**
 * hero-slider — 1–5 rotating promos; seasonal storytelling. A Carousel of hero frames. Slides are
 * modelled as indexed settings (slide{1..5}_image / _heading / _cta / _cta_url) since the page-builder
 * has no repeater field. Settings: autoplay, interval, overlay, dots, ken_burns. §08 hero-slider.
 */
import type { CSSProperties, ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { cn } from '../../../../../shared/utils/cn';
import { ButtonLink } from '../components/ButtonLink';
import { Carousel } from '../components/Carousel';
import { Container } from '../components/Container';
import { StoreImage } from '../components/Image';
import { flag, range, text } from './section-settings';
import { slidesFrom } from '../../../content/home-data';

interface Slide {
  image: string;
  heading: string;
  cta: string;
  ctaUrl: string;
}

export function HeroSliderSection(props: SectionRenderProps): ReactElement | null {
  const { settings, context } = props;
  const overlay = range(settings, 'overlay', 50, 0, 100) / 100;
  const ken = flag(settings, 'ken_burns', false);
  const autoplay = flag(settings, 'autoplay', true);
  const interval = range(settings, 'interval', 6, 3, 12) * 1000;
  const dots = flag(settings, 'dots', true);

  const fromData = slidesFrom(context);
  const slides: Slide[] = [];
  if (fromData.length) {
    for (const s of fromData) {
      slides.push({ heading: s.heading ?? '', image: s.image ?? '', cta: s.ctaLabel ?? '', ctaUrl: s.ctaUrl || '#' });
    }
  } else {
    for (let i = 1; i <= 5; i++) {
      const heading = text(settings, `slide${i}_heading`);
      const image = text(settings, `slide${i}_image`);
      if (!heading && !image) continue;
      slides.push({
        heading,
        image,
        cta: text(settings, `slide${i}_cta`),
        ctaUrl: text(settings, `slide${i}_cta_url`, '#'),
      });
    }
  }

  if (slides.length === 0) return null;
  const scrimStyle = { '--sf-hero-overlay': String(overlay) } as CSSProperties;

  return (
    <Carousel
      className="sf-hero-carousel"
      ariaLabel="Featured"
      itemClassName="sf-hero-slide"
      showDots={dots}
      autoplay={autoplay && slides.length > 1}
      interval={interval}
    >
      {slides.map((slide, i) => (
        <section key={i} className={cn('sf-hero', 'sf-hero--start', !slide.image && 'sf-hero--plain', ken && slide.image && 'sf-hero--ken')}>
          {slide.image ? (
            <div className="sf-hero__media">
              <StoreImage className="sf-hero__img" src={slide.image} alt="" eager={i === 0} />
              <div className="sf-hero__scrim" style={scrimStyle} aria-hidden />
            </div>
          ) : null}
          <div className="sf-hero__inner">
            <Container>
              <div className="sf-hero__content">
                {slide.heading ? <h2 className="sf-hero__title">{slide.heading}</h2> : null}
                {slide.cta ? (
                  <div className="sf-hero__actions">
                    <ButtonLink href={slide.ctaUrl} size="lg">
                      {slide.cta}
                    </ButtonLink>
                  </div>
                ) : null}
              </div>
            </Container>
          </div>
        </section>
      ))}
    </Carousel>
  );
}
