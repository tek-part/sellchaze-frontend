/**
 * Rouge hero-slider — a rotating set of hero slides (auto-advance, paused under reduced motion) with
 * dot controls. Settings: slides (newline "heading | subheading | cta_label | cta_url | image"),
 * interval, overlay. Falls back to a single slide; self-hides with none.
 */
import { useEffect, useState, type CSSProperties, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { cn } from '../../../../../shared/utils/cn';
import { Container } from '../components/Container';
import { ButtonLink } from '../components/ButtonLink';
import { StoreImage } from '../components/Image';
import { count, lines, range } from './section-settings';
import { slidesFrom } from '../../../content/home-data';

interface Slide { heading: string; subheading: string; ctaLabel: string; ctaUrl: string; image: string }

export function HeroSliderSection(props: SectionRenderProps): ReactElement | null {
  const { t } = useTranslation();
  const { settings, context } = props;
  const fromData = slidesFrom(context);
  const slides: Slide[] = fromData.length
    ? fromData.map((s) => ({ heading: s.heading ?? '', subheading: s.subheading ?? '', ctaLabel: s.ctaLabel ?? '', ctaUrl: s.ctaUrl || '#', image: s.image ?? '' }))
    : lines(settings, 'slides')
        .map((row) => {
          const [heading, subheading, ctaLabel, ctaUrl, image] = row.split('|').map((s) => s.trim());
          return heading || image ? { heading: heading ?? '', subheading: subheading ?? '', ctaLabel: ctaLabel ?? '', ctaUrl: ctaUrl || '#', image: image ?? '' } : null;
        })
        .filter((x): x is Slide => x !== null);
  const interval = count(settings, 'interval', 6000);
  const overlay = range(settings, 'overlay', 30, 0, 100) / 100;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % slides.length), Math.max(2500, interval));
    return () => window.clearInterval(id);
  }, [slides.length, interval]);

  if (slides.length === 0) return null;
  const active = slides[index] ?? slides[0]!;

  return (
    <section className="rge-hero rge-hero--media rge-hero--center rge-heroslider">
      {active.image ? (
        <>
          <StoreImage key={active.image} className="rge-hero__img rge-heroslider__img" src={active.image} alt="" eager />
          <div className="rge-hero__scrim" style={{ opacity: overlay } as CSSProperties} aria-hidden />
        </>
      ) : null}
      <div className="rge-hero__inner">
        <Container>
          <div className="rge-hero__content" key={index}>
            {active.heading ? <h1 className="rge-hero__title">{active.heading}</h1> : null}
            {active.subheading ? <p className="rge-hero__sub">{active.subheading}</p> : null}
            {active.ctaLabel ? <div className="rge-hero__actions"><ButtonLink href={active.ctaUrl} size="lg">{active.ctaLabel}</ButtonLink></div> : null}
          </div>
        </Container>
      </div>
      {slides.length > 1 ? (
        <div className="rge-heroslider__dots" role="tablist" aria-label={t('misc.slides')}>
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              className={cn('rge-heroslider__dot', i === index && 'rge-heroslider__dot--active')}
              aria-label={t('misc.goToSlide', { n: i + 1 })}
              aria-selected={i === index}
              role="tab"
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
