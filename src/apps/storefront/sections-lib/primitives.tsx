/**
 * Library primitives — the small, token-driven building blocks every section composes: the section
 * frame + head, responsive grid, scroll-snap carousel, image with fallback, button, product and
 * category cards, skeleton and empty states. Class prefix `lib-`; every value in `styles.css` reads
 * a `var(--token)` so each theme's tokens do the visual differentiation.
 */
import {
  Children,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from 'react';
import { cn } from '../../../shared/utils/cn';
import { prefersReducedMotion } from '../../../shared/env/media';
import type { CategoryCardModel, ProductCardModel } from '../types/catalog';
import { useCart } from '../state/cart';
import { useWishlist } from '../state/wishlist';
import { useLibT, useLocaleCode } from './i18n';

/* ------------------------------------------------------------------ frame + head */

export interface LibSectionProps {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  align?: 'start' | 'center' | 'end';
  viewAllHref?: string;
  viewAllLabel?: string;
  /** Extra classes on the outer section (band colours, modifiers). */
  className?: string;
  /** `narrow` reading measure, `flush` removes the inline gutter (full-bleed children). */
  narrow?: boolean;
  flush?: boolean;
  style?: CSSProperties;
  headingLevel?: 'h1' | 'h2' | 'h3';
  /** Renders after the head (filters, tabs). */
  aside?: ReactNode;
  children: ReactNode;
}

export function LibSection(props: LibSectionProps): ReactElement {
  const {
    eyebrow, title, subtitle, align = 'start', viewAllHref, viewAllLabel, className, narrow, flush, style,
    headingLevel: Tag = 'h2', aside, children,
  } = props;
  const t = useLibT();
  const hasHead = Boolean(title || eyebrow || subtitle);
  return (
    <section className={cn('lib-section', className)} style={style}>
      <div className={cn('lib-container', narrow && 'lib-container--narrow', flush && 'lib-container--flush')}>
        {hasHead ? (
          <header className={cn('lib-head', `lib-head--${align}`, viewAllHref && align === 'start' && 'lib-head--split')}>
            <div className="lib-head__text">
              {eyebrow ? <span className="lib-eyebrow">{eyebrow}</span> : null}
              {title ? <Tag className="lib-title">{title}</Tag> : null}
              {subtitle ? <p className="lib-subtitle">{subtitle}</p> : null}
            </div>
            {viewAllHref ? (
              <a href={viewAllHref} className="lib-link lib-head__more">
                {viewAllLabel || t('viewAll')}
                <span aria-hidden className="lib-link__arrow">→</span>
              </a>
            ) : null}
          </header>
        ) : null}
        {aside}
        {children}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ grid */

export function LibGrid(props: { style?: CSSProperties; className?: string; children: ReactNode }): ReactElement {
  return (
    <div className={cn('lib-grid', props.className)} style={props.style}>
      {props.children}
    </div>
  );
}

/* ------------------------------------------------------------------ carousel */

export interface LibCarouselProps {
  children: ReactNode;
  ariaLabel: string;
  /** Item width preset — `card` (product rail), `wide` (banners), `full` (one per view, hero). */
  itemSize?: 'card' | 'wide' | 'full' | 'circle' | 'logo';
  showArrows?: boolean;
  showDots?: boolean;
  autoplay?: boolean;
  intervalMs?: number;
  className?: string;
  /** Optional per-item className. */
  itemClassName?: string;
  /** Controlled active index (hero sliders drive their own dots). */
  onActiveChange?: (index: number) => void;
}

/**
 * CSS scroll-snap carousel — no dependencies. The track is a native horizontal scroller (touch,
 * trackpad, keyboard all work); arrows and dots call `scrollTo`. RTL-safe: positions are computed
 * from element offsets, never from signed `scrollLeft` assumptions.
 */
export function LibCarousel(props: LibCarouselProps): ReactElement {
  const {
    children, ariaLabel, itemSize = 'card', showArrows = true, showDots = false, autoplay = false,
    intervalMs = 6000, className, itemClassName, onActiveChange,
  } = props;
  const t = useLibT();
  const items = Children.toArray(children);
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const nodes = Array.from(track.children) as HTMLElement[];
    const x = Math.abs(track.scrollLeft);
    let nearest = 0;
    let min = Infinity;
    nodes.forEach((n, i) => {
      const d = Math.abs(Math.abs(n.offsetLeft - track.offsetLeft) - x);
      if (d < min) {
        min = d;
        nearest = i;
      }
    });
    setActive(nearest);
    setAtStart(x <= 2);
    setAtEnd(x + track.clientWidth >= track.scrollWidth - 2);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    measure();
    track.addEventListener('scroll', measure, { passive: true });
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    ro?.observe(track);
    return () => {
      track.removeEventListener('scroll', measure);
      ro?.disconnect();
    };
  }, [measure, items.length]);

  useEffect(() => {
    onActiveChange?.(active);
  }, [active, onActiveChange]);

  const scrollTo = useCallback((index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const child = track.children[index] as HTMLElement | undefined;
    if (!child) return;
    const dir = getComputedStyle(track).direction;
    const offset = child.offsetLeft - track.offsetLeft;
    track.scrollTo({ left: dir === 'rtl' ? offset - (track.clientWidth - child.clientWidth) : offset, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (!autoplay || paused || items.length <= 1 || prefersReducedMotion()) return;
    const timer = setInterval(() => scrollTo(active >= items.length - 1 ? 0 : active + 1), Math.max(2500, intervalMs));
    return () => clearInterval(timer);
  }, [autoplay, paused, active, items.length, intervalMs, scrollTo]);

  const multiple = items.length > 1;

  return (
    <div
      className={cn('lib-carousel', `lib-carousel--${itemSize}`, className)}
      role="group"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div ref={trackRef} className="lib-carousel__track">
        {items.map((child, i) => (
          <div key={i} className={cn('lib-carousel__item', itemClassName)} aria-roledescription="slide" aria-label={`${i + 1} / ${items.length}`}>
            {child}
          </div>
        ))}
      </div>
      {showArrows && multiple ? (
        <>
          <button type="button" className="lib-carousel__arrow lib-carousel__arrow--prev" aria-label={t('previous')} disabled={atStart} onClick={() => scrollTo(Math.max(0, active - 1))}>
            <ArrowIcon />
          </button>
          <button type="button" className="lib-carousel__arrow lib-carousel__arrow--next" aria-label={t('next')} disabled={atEnd} onClick={() => scrollTo(Math.min(items.length - 1, active + 1))}>
            <ArrowIcon />
          </button>
        </>
      ) : null}
      {showDots && multiple ? (
        <div className="lib-carousel__dots" role="tablist">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={t('goToSlide', { n: i + 1 })}
              className={cn('lib-carousel__dot', i === active && 'is-active')}
              onClick={() => scrollTo(i)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ArrowIcon(): ReactElement {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

/* ------------------------------------------------------------------ image */

export interface LibImageProps {
  src?: string;
  alt: string;
  className?: string;
  eager?: boolean;
  sizes?: string;
  srcSet?: string;
  /** Placeholder letter when there is no image. */
  monogram?: string;
}

export function LibImage(props: LibImageProps): ReactElement {
  const { src, alt, className, eager = false, sizes, srcSet, monogram } = props;
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    const letter = (monogram ?? alt.trim().charAt(0) ?? '').toUpperCase();
    return (
      <span className={cn('lib-img lib-img--fallback', className)} role={alt ? 'img' : undefined} aria-label={alt || undefined} aria-hidden={alt ? undefined : true}>
        <span aria-hidden>{letter || '·'}</span>
      </span>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className={cn('lib-img', className)}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={eager ? 'high' : 'auto'}
      sizes={sizes}
      srcSet={srcSet}
      onError={() => setFailed(true)}
    />
  );
}

/* ------------------------------------------------------------------ button */

export interface LibButtonProps {
  href?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'inverse';
  size?: 'sm' | 'md' | 'lg';
  block?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit';
  className?: string;
  children: ReactNode;
}

export function LibButton(props: LibButtonProps): ReactElement {
  const { href, onClick, variant = 'primary', size = 'md', block, disabled, type = 'button', className, children } = props;
  const cls = cn('lib-btn', `lib-btn--${variant}`, `lib-btn--${size}`, block && 'lib-btn--block', className);
  if (href !== undefined) {
    return (
      <a href={href || '#'} className={cls} onClick={onClick} aria-disabled={disabled || undefined}>
        {children}
      </a>
    );
  }
  return (
    <button type={type} className={cls} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ price */

export function LibPrice(props: { amount: number; compareAt?: number; currency: string; className?: string }): ReactElement {
  const locale = useLocaleCode();
  const { amount, compareAt, currency, className } = props;
  const fmt = (n: number): string => {
    try {
      return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 2 }).format(n);
    } catch {
      return `${n.toFixed(2)} ${currency}`;
    }
  };
  const onSale = typeof compareAt === 'number' && compareAt > amount;
  return (
    <span className={cn('lib-price', onSale && 'lib-price--sale', className)}>
      <span className="lib-price__now">{fmt(amount)}</span>
      {onSale ? <s className="lib-price__was">{fmt(compareAt)}</s> : null}
    </span>
  );
}

/* ------------------------------------------------------------------ rating */

export function LibRating(props: { value: number; count?: number; showCount?: boolean }): ReactElement | null {
  const { value, count, showCount = false } = props;
  if (!(value > 0)) return null;
  const pct = Math.max(0, Math.min(5, value)) * 20;
  return (
    <span className="lib-rating" aria-label={`${value.toFixed(1)} / 5`}>
      <span className="lib-rating__stars" aria-hidden>
        <span className="lib-rating__base">★★★★★</span>
        <span className="lib-rating__fill" style={{ width: `${pct}%` }}>★★★★★</span>
      </span>
      {showCount && typeof count === 'number' && count > 0 ? <span className="lib-rating__count">({count})</span> : null}
    </span>
  );
}

/* ------------------------------------------------------------------ product card */

export interface LibProductCardProps {
  product: ProductCardModel;
  showBadges?: boolean;
  showRatings?: boolean;
  showQuickAdd?: boolean;
  showWishlist?: boolean;
  /** `card` (bordered surface) or `plain` (image + text only). */
  style?: 'card' | 'plain' | 'minimal';
  eager?: boolean;
}

export function LibProductCard(props: LibProductCardProps): ReactElement {
  const { product, showBadges = true, showRatings = true, showQuickAdd = true, showWishlist = true, style = 'card', eager } = props;
  const t = useLibT();
  const cart = useCart();
  const wishlist = useWishlist();
  const [added, setAdded] = useState(false);
  const onSale = typeof product.compareAtPrice === 'number' && product.compareAtPrice > product.price;
  const discount = onSale && product.compareAtPrice ? Math.round((1 - product.price / product.compareAtPrice) * 100) : 0;
  const wished = wishlist.has(product.id);

  const quickAdd = (): void => {
    cart.add({
      id: `${product.id}:default`,
      productId: product.id,
      title: product.title,
      url: product.url,
      ...(product.image ? { image: product.image.src } : {}),
      price: product.price,
      currency: product.currency,
      quantity: 1,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  };

  return (
    <article className={cn('lib-card', `lib-card--${style}`, product.soldOut && 'lib-card--soldout')}>
      <a href={product.url} className="lib-card__media" tabIndex={-1} aria-hidden>
        <LibImage src={product.image?.src} srcSet={product.image?.srcSet} sizes={product.image?.sizes ?? '(min-width: 1024px) 25vw, 50vw'} alt="" eager={eager} className="lib-card__img" />
        {product.hoverImage ? <LibImage src={product.hoverImage.src} alt="" className="lib-card__img lib-card__img--hover" /> : null}
      </a>
      {showBadges ? (
        <div className="lib-card__badges">
          {product.soldOut ? <span className="lib-badge lib-badge--muted">{t('soldOut')}</span> : null}
          {!product.soldOut && discount > 0 ? <span className="lib-badge lib-badge--sale">-{discount}%</span> : null}
          {product.badge ? <span className="lib-badge">{product.badge}</span> : null}
        </div>
      ) : null}
      {showWishlist ? (
        <button
          type="button"
          className={cn('lib-card__wish', wished && 'is-active')}
          aria-pressed={wished}
          aria-label={wished ? t('removeFromWishlist') : t('addToWishlist')}
          onClick={() => wishlist.toggle(product.id)}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill={wished ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <path d="M12 21s-7-4.6-9.3-9.2C1.2 8.6 3 5 6.6 5c2 0 3.4 1.1 4.2 2.4C11.6 6.1 13 5 15 5c3.6 0 5.4 3.6 3.9 6.8C19 16.4 12 21 12 21z" />
          </svg>
        </button>
      ) : null}
      <div className="lib-card__body">
        {product.vendor ? <span className="lib-card__vendor">{product.vendor}</span> : null}
        <h3 className="lib-card__name">
          <a href={product.url} className="lib-card__link">{product.title}</a>
        </h3>
        {showRatings && typeof product.rating === 'number' ? <LibRating value={product.rating} count={product.reviewCount} showCount /> : null}
        <div className="lib-card__row">
          <LibPrice amount={product.price} compareAt={product.compareAtPrice} currency={product.currency} />
        </div>
        {showQuickAdd && !product.soldOut ? (
          <button type="button" className={cn('lib-card__add', added && 'is-added')} onClick={quickAdd} aria-live="polite">
            {added ? t('added') : t('addToCart')}
          </button>
        ) : null}
      </div>
    </article>
  );
}

export function LibProductSkeleton(): ReactElement {
  return (
    <div className="lib-card lib-card--skeleton" aria-hidden>
      <div className="lib-skeleton lib-card__media" />
      <div className="lib-card__body">
        <div className="lib-skeleton lib-skeleton--line" style={{ width: '70%' }} />
        <div className="lib-skeleton lib-skeleton--line" style={{ width: '40%' }} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ category card */

export function LibCategoryCard(props: { category: CategoryCardModel; variant?: 'overlay' | 'below' | 'circle'; showCount?: boolean; eager?: boolean }): ReactElement {
  const { category, variant = 'overlay', showCount = true, eager } = props;
  return (
    <a href={category.url} className={cn('lib-cat', `lib-cat--${variant}`)}>
      <span className="lib-cat__media">
        <LibImage src={category.image?.src} alt="" className="lib-cat__img" eager={eager} monogram={category.title.charAt(0)} />
      </span>
      <span className="lib-cat__text">
        <span className="lib-cat__name">{category.title}</span>
        {showCount && category.meta ? <span className="lib-cat__meta">{category.meta}</span> : null}
      </span>
    </a>
  );
}

/* ------------------------------------------------------------------ states */

export function LibEmpty(props: { message: string }): ReactElement {
  return (
    <p className="lib-empty" role="status">
      {props.message}
    </p>
  );
}

/** Stable id helper for aria wiring inside sections. */
export function useLibId(prefix: string): string {
  const id = useId();
  return `${prefix}${id.replace(/[^a-zA-Z0-9_-]/g, '')}`;
}
