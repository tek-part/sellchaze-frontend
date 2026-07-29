/**
 * Rouge Carousel — a scroll-snap rail of items with soft round prev/next controls that scroll by a
 * viewport width. Touch/trackpad friendly (native scroll); arrows are progressive enhancement and
 * hide when there's nothing to scroll. Children are the items.
 */
import { useCallback, useEffect, useRef, useState, type ReactElement, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../../../shared/utils/cn';
import { IconChevronLeft, IconChevronRight } from './icons';

export interface CarouselProps {
  children: ReactNode;
  ariaLabel: string;
  itemClassName?: string;
  className?: string;
}

export function Carousel(props: CarouselProps): ReactElement {
  const { children, ariaLabel, itemClassName, className } = props;
  const { t } = useTranslation();
  const trackRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const update = useCallback((): void => {
    const el = trackRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 2);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    update();
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [update]);

  const scrollBy = (dir: 1 | -1): void => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.8), behavior: 'smooth' });
  };

  const items = Array.isArray(children) ? children : [children];
  const scrollable = !atStart || !atEnd;

  return (
    <div className={cn('rge-carousel', className)}>
      {scrollable ? (
        <button type="button" className="rge-carousel__arrow rge-carousel__arrow--prev" aria-label={t('common.previous')} disabled={atStart} onClick={() => scrollBy(-1)}>
          <IconChevronLeft width={20} height={20} />
        </button>
      ) : null}
      <div className="rge-carousel__track" ref={trackRef} role="group" aria-label={ariaLabel}>
        {items.map((child, i) => (
          <div key={i} className={cn('rge-carousel__item', itemClassName)}>{child}</div>
        ))}
      </div>
      {scrollable ? (
        <button type="button" className="rge-carousel__arrow rge-carousel__arrow--next" aria-label={t('common.next')} disabled={atEnd} onClick={() => scrollBy(1)}>
          <IconChevronRight width={20} height={20} />
        </button>
      ) : null}
    </div>
  );
}
