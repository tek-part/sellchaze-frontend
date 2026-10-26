import { mobileSrcSet } from '../../foundation/media/responsive';
import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react';
import type { ThemeSettingListItem } from '../../theme-engine/types';
import { useReducedMotion } from '../../theme-engine/context';
import { useLocaleCode } from '../../sections-lib/i18n';
import { LibImage } from '../../sections-lib/primitives';
import { bool, str } from '../../sections-lib/use-section';
import { themeCampaignAsset } from '../../theme-campaign-asset';
import { useOptionalStore } from '../../state/store-context';

export function slideshowPosition(position: number, count: number): number { return count > 0 ? ((position % count) + count) % count : 0; }
/** The slides are image links without a headline, so the store name is the page's (visually hidden) h1. */
export function PeekSlideshow({ slides, autoplay }: { slides: ReadonlyArray<ThemeSettingListItem>; autoplay: boolean }): ReactElement {
  const track = useRef<HTMLDivElement>(null); const activeRef = useRef(0); const [active, setActive] = useState(0); const [paused, setPaused] = useState(false); const reduced = useReducedMotion(); const ar = useLocaleCode() === 'ar'; const storeName = useOptionalStore()?.store.name;
  const count = slides.length; const multiple = count > 1; const items = multiple ? [slides[count - 1]!, ...slides, slides[0]!] : slides;
  const center = useCallback((position: number, smooth: boolean): void => {
    const node = track.current; const item = node?.children[position]; if (!node || !item) return;
    const frame = node.getBoundingClientRect(); const bounds = item.getBoundingClientRect();
    node.scrollBy({ left: bounds.left + bounds.width / 2 - frame.left - frame.width / 2, behavior: smooth && !reduced ? 'smooth' : 'instant' });
  }, [reduced]);
  const move = useCallback((next: number): void => { const index = slideshowPosition(next, count); setActive(index); center(multiple ? index + 1 : index, true); }, [center, count, multiple]);
  useEffect(() => { activeRef.current = active; }, [active]);
  useEffect(() => {
    center(multiple ? 1 : 0, false); const resize = (): void => center(multiple ? activeRef.current + 1 : activeRef.current, false); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize);
  }, [center, multiple, count]);
  useEffect(() => { if (!autoplay || !multiple || reduced || paused) return; const timer = window.setInterval(() => move(active + 1), 5500); return () => window.clearInterval(timer); }, [autoplay, multiple, reduced, paused, active, move]);
  function scrolled(): void {
    const node = track.current; if (!node || !multiple) return; const bounds = node.getBoundingClientRect(); const middle = bounds.left + bounds.width / 2;
    let index = 0; let closest = Infinity;
    Array.from(node.children).forEach((item, position) => { const r = item.getBoundingClientRect(); const distance = Math.abs(r.left + r.width / 2 - middle); if (distance < closest) { closest = distance; index = position; } });
    if (closest < 3 && (index === 0 || index === count + 1)) center(index === 0 ? count : 1, false);
    setActive(slideshowPosition(index - 1, count));
  }
  return <section className="nkd-hero" aria-label={ar ? 'عروض المتجر' : 'Store highlights'} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={() => setPaused(false)}><h1 className="lib-sr-only">{storeName || (ar ? 'عروض المتجر' : 'Store highlights')}</h1><div className="nkd-hero-track" ref={track} tabIndex={0} onScroll={scrolled} onKeyDown={event => { if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); move(active + (event.key === 'ArrowRight' ? ar ? -1 : 1 : ar ? 1 : -1)); } }} aria-roledescription="carousel">{items.map((item, index) => { const clone = multiple && (index === 0 || index === count + 1); return <article className="nkd-hero-slide" key={index} aria-hidden={clone || undefined}><a href={str(item, 'url', '/shop')} tabIndex={clone ? -1 : 0} aria-label={str(item, 'label', ar ? 'تسوق المجموعة' : 'Shop collection')}><picture>{str(item, 'mobile_image') ? <source media="(max-width:767px)" srcSet={mobileSrcSet(themeCampaignAsset(str(item, 'mobile_image')))} sizes="100vw" /> : null}<LibImage src={str(item, 'image')} alt={bool(item, 'show_copy') ? '' : str(item, 'label')} eager={index <= 2} /></picture>{bool(item, 'show_copy') ? <span className="nkd-hero-copy"><strong>{str(item, 'label')}</strong><span>{ar ? 'تسوق المجموعة' : 'Shop collection'}</span></span> : null}</a></article>; })}</div>{multiple ? <div className="nkd-hero-dots" role="group" aria-label={ar ? 'الشرائح' : 'Slides'}>{slides.map((_slide, index) => <button key={index} type="button" aria-label={ar ? `انتقل للشريحة ${index + 1}` : `Go to slide ${index + 1}`} aria-pressed={active === index} onClick={() => move(index)}><span className="lib-sr-only">{index + 1} / {count}</span></button>)}</div> : null}</section>;
}
