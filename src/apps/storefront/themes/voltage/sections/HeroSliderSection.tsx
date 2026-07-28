/**
 * Voltage hero-slider — a rotating hero. Each slide is an `eyebrow | heading | subheading | cta_label
 * | cta_url` line. Auto-advances (paused for prefers-reduced-motion or a single slide); dots + arrows
 * for manual control. Falls back to nothing when no slides are configured.
 */
import { useEffect, useState, type ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { Container } from '../components/Container';
import { ButtonLink } from '../components/ButtonLink';
import { IconButton } from '../components/IconButton';
import { IconChevronLeft, IconChevronRight } from '../components/icons';
import { lines } from './section-settings';
import { slidesFrom } from '../../../content/home-data';

interface Slide {
  eyebrow: string;
  heading: string;
  subheading: string;
  ctaLabel: string;
  ctaUrl: string;
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

export function HeroSliderSection(props: SectionRenderProps): ReactElement | null {
  const fromData = slidesFrom(props.context);
  const slides: Slide[] = fromData.length
    ? fromData.map((s) => ({
        eyebrow: s.eyebrow ?? '',
        heading: s.heading ?? '',
        subheading: s.subheading ?? '',
        ctaLabel: s.ctaLabel ?? '',
        ctaUrl: s.ctaUrl ?? '',
      }))
    : lines(props.settings, 'slides')
        .map((raw) => raw.split('|').map((p) => p.trim()))
        .filter((parts) => parts[0] || parts[1])
        .map((parts) => ({
          eyebrow: parts[0] ?? '',
          heading: parts[1] ?? '',
          subheading: parts[2] ?? '',
          ctaLabel: parts[3] ?? '',
          ctaUrl: parts[4] ?? '',
        }));

  const [active, setActive] = useState(0);
  const count = slides.length;

  useEffect(() => {
    if (count <= 1 || prefersReducedMotion()) return;
    const id = window.setInterval(() => setActive((i) => (i + 1) % count), 6000);
    return () => window.clearInterval(id);
  }, [count]);

  if (count === 0) return null;
  const slide = slides[Math.min(active, count - 1)] ?? slides[0];
  if (!slide) return null;
  const go = (dir: number): void => setActive((i) => (i + dir + count) % count);

  return (
    <section className="vlt-heroslider" aria-roledescription="carousel" aria-label="Highlights">
      <div className="vlt-heroslider__field" aria-hidden="true" />
      <Container>
        <div className="vlt-heroslider__inner">
          {slide.eyebrow ? <span className="vlt-eyebrow">{slide.eyebrow}</span> : null}
          {slide.heading ? <h1 className="vlt-heroslider__title">{slide.heading}</h1> : null}
          {slide.subheading ? <p className="vlt-heroslider__sub">{slide.subheading}</p> : null}
          {slide.ctaLabel && slide.ctaUrl ? (
            <ButtonLink href={slide.ctaUrl} variant="primary" className="vlt-heroslider__cta">{slide.ctaLabel}</ButtonLink>
          ) : null}
        </div>

        {count > 1 ? (
          <div className="vlt-heroslider__controls">
            <IconButton label="Previous slide" onClick={() => go(-1)}><IconChevronLeft /></IconButton>
            <div className="vlt-heroslider__dots" role="tablist" aria-label="Slides">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === active}
                  aria-label={`Slide ${i + 1}`}
                  className={i === active ? 'vlt-heroslider__dot vlt-heroslider__dot--on' : 'vlt-heroslider__dot'}
                  onClick={() => setActive(i)}
                />
              ))}
            </div>
            <IconButton label="Next slide" onClick={() => go(1)}><IconChevronRight /></IconButton>
          </div>
        ) : null}
      </Container>
    </section>
  );
}
