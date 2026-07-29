/**
 * Carousel — a scroll-snap horizontal rail (product/editorial/logos/testimonials). Snaps rather than
 * hard-pushes; arrows disable at the ends; hairline dots track position. Optional autoplay pauses on
 * hover/focus and is disabled under reduced motion; swipe works natively on touch. See §32.7.
 */
import {
  Children,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../../../shared/utils/cn';
import { prefersReducedMotion } from '../../../../../shared/env/media';
import { IconButton } from './IconButton';
import { IconChevronLeft, IconChevronRight } from './icons';

export interface CarouselProps {
  children: ReactNode;
  ariaLabel?: string;
  showArrows?: boolean;
  showDots?: boolean;
  autoplay?: boolean;
  /** Autoplay interval (ms). */
  interval?: number;
  itemClassName?: string;
  className?: string;
}

export function Carousel(props: CarouselProps): ReactElement {
  const {
    children,
    ariaLabel,
    showArrows = true,
    showDots = true,
    autoplay = false,
    interval = 5000,
    itemClassName,
    className,
  } = props;
  const { t } = useTranslation();

  const items = Children.toArray(children);
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [paused, setPaused] = useState(false);

  const updateState = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const nodes = Array.from(track.children) as HTMLElement[];
    const scrollLeft = Math.abs(track.scrollLeft);
    let nearest = 0;
    let min = Infinity;
    nodes.forEach((child, i) => {
      const distance = Math.abs(child.offsetLeft - track.offsetLeft - scrollLeft);
      if (distance < min) {
        min = distance;
        nearest = i;
      }
    });
    setActive(nearest);
    setAtStart(scrollLeft <= 2);
    setAtEnd(scrollLeft + track.clientWidth >= track.scrollWidth - 2);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    updateState();
    track.addEventListener('scroll', updateState, { passive: true });
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateState) : null;
    ro?.observe(track);
    return () => {
      track.removeEventListener('scroll', updateState);
      ro?.disconnect();
    };
  }, [updateState, items.length]);

  const scrollToIndex = useCallback((index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const child = track.children[index] as HTMLElement | undefined;
    if (child) track.scrollTo({ left: child.offsetLeft - track.offsetLeft, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (!autoplay || paused || items.length <= 1 || prefersReducedMotion()) return;
    const timer = setInterval(() => {
      const next = active >= items.length - 1 ? 0 : active + 1;
      scrollToIndex(next);
    }, interval);
    return () => clearInterval(timer);
  }, [autoplay, paused, active, items.length, interval, scrollToIndex]);

  return (
    <div
      className={cn('sf-carousel', className)}
      role="group"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {showArrows && items.length > 1 ? (
        <IconButton
          label={t('common.previous')}
          className="sf-carousel__arrow sf-carousel__arrow--prev"
          disabled={atStart}
          onClick={() => scrollToIndex(Math.max(0, active - 1))}
        >
          <IconChevronLeft />
        </IconButton>
      ) : null}

      <div ref={trackRef} className="sf-carousel__track">
        {items.map((child, i) => (
          <div key={i} className={cn('sf-carousel__item', itemClassName)}>
            {child}
          </div>
        ))}
      </div>

      {showArrows && items.length > 1 ? (
        <IconButton
          label={t('common.next')}
          className="sf-carousel__arrow sf-carousel__arrow--next"
          disabled={atEnd}
          onClick={() => scrollToIndex(Math.min(items.length - 1, active + 1))}
        >
          <IconChevronRight />
        </IconButton>
      ) : null}

      {showDots && items.length > 1 ? (
        <div className="sf-carousel__dots" role="tablist" aria-label={t('misc.slides')}>
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={t('misc.goToSlide', { n: i + 1 })}
              className={cn('sf-carousel__dot', i === active && 'sf-carousel__dot--active')}
              onClick={() => scrollToIndex(i)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
