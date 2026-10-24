/**
 * stride-new-drops — the "new drops" rail: a native horizontal scroller with mandatory snap points,
 * numbered cards, prev / next buttons and a scroll-progress bar. Positions are read with
 * `Math.abs(scrollLeft)` and steps are signed by the computed direction, so it works in RTL.
 */
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { prefersReducedMotion } from '../../../../../shared/env/media';
import {
  LibEmpty, LibProductSkeleton, bool, defineSection, fields, num, spacingFields, spacingStyle, str, tr, useLibId, useLibT, useLocaleCode,
  useSectionData, useSectionSettings,
} from '../../../sections-lib';
import { StProductCard } from '../components/ProductCard';
import { stText } from '../components/i18n';

export const strideNewDropsSchema = defineSection({
  type: 'stride-new-drops',
  label: 'New drops rail',
  description: 'A snap-scrolling rail of numbered product cards with a progress bar.',
  category: 'products',
  icon: 'HiOutlineArrowsRightLeft',
  settings: [
    fields.text('eyebrow', 'Eyebrow', tr('نازل حالاً', 'Just landed')),
    fields.text('title', 'Title', tr('أحدث الإصدارات', 'New drops')),
    fields.collection('collection', 'Collection', 'newest'),
    fields.range('limit', 'Products to show', 10, 3, 20),
    fields.toggle('show_index', 'Show big numbers', true),
    fields.toggle('show_quick_add', 'Show quick add', true),
    fields.url('view_all_url', 'View-all link', '/collections/new-arrivals'),
    fields.text('view_all_label', 'View-all label', ''),
    ...spacingFields(),
  ],
});

export function StrideNewDrops(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(strideNewDropsSchema, props.settings);
  const data = useSectionData(props.context);
  const t = useLibT();
  const locale = useLocaleCode();
  const headingId = useLibId('st-drops');
  const trackRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [edges, setEdges] = useState({ start: true, end: false });
  const products = data.products(str(s, 'collection', 'newest'), num(s, 'limit', 10));
  const loading = data.loading && products.length === 0;

  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const max = track.scrollWidth - track.clientWidth;
    const x = Math.abs(track.scrollLeft);
    setProgress(max > 0 ? Math.min(1, x / max) : 1);
    setEdges({ start: x <= 2, end: x >= max - 2 });
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
  }, [measure, products.length]);

  const step = (dir: 1 | -1): void => {
    const track = trackRef.current;
    const first = track?.firstElementChild as HTMLElement | null;
    if (!track || !first) return;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    const rtl = getComputedStyle(track).direction === 'rtl';
    const amount = (first.getBoundingClientRect().width + gap) * dir * (rtl ? -1 : 1);
    track.scrollBy({ left: amount, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };

  if (!loading && products.length === 0) return str(s, 'title') ? (
    <section className="lib-section st-drops" style={spacingStyle(s)}><div className="lib-container"><LibEmpty message={t('emptyProducts')} /></div></section>
  ) : null;

  const showIndex = bool(s, 'show_index', true);
  // Decorative display numerals stay Western in both languages (as on kit and jersey numbers).
  const fmt = new Intl.NumberFormat('en', { minimumIntegerDigits: 2 });
  const viewAll = str(s, 'view_all_url');

  return (
    <section className="lib-section st-drops" aria-labelledby={headingId} style={spacingStyle(s)}>
      <div className="lib-container">
        <header className="st-drops__head">
          <div>
            {str(s, 'eyebrow') ? <p className="st-eyebrow"><span className="st-eyebrow__mark" aria-hidden />{str(s, 'eyebrow')}</p> : null}
            <h2 id={headingId} className="st-display st-drops__title">{str(s, 'title') || t('products')}</h2>
          </div>
          <div className="st-drops__controls">
            {viewAll ? <a href={viewAll} className="st-link">{str(s, 'view_all_label') || t('viewAll')}<span className="st-link__arrow" aria-hidden>→</span></a> : null}
            <button type="button" className="st-arrow st-arrow--prev" aria-label={stText(locale, 'scrollPrev')} disabled={edges.start} onClick={() => step(-1)}><Chevron /></button>
            <button type="button" className="st-arrow st-arrow--next" aria-label={stText(locale, 'scrollNext')} disabled={edges.end} onClick={() => step(1)}><Chevron /></button>
          </div>
        </header>
      </div>
      <div className="st-drops__viewport">
        <div ref={trackRef} className="st-drops__track" tabIndex={0} role="group" aria-roledescription="carousel" aria-labelledby={headingId}>
          {loading
            ? Array.from({ length: 4 }, (_, i) => <div key={i} className="st-drops__item"><LibProductSkeleton /></div>)
            : products.map((p, i) => (
              <div key={p.id} className="st-drops__item" aria-roledescription="slide" aria-label={`${i + 1} / ${products.length}`}>
                {showIndex ? <span className="st-drops__index" aria-hidden>{fmt.format(i + 1)}</span> : null}
                <StProductCard product={p} showQuickAdd={bool(s, 'show_quick_add', true)} sizes="(min-width: 1024px) 320px, 72vw" />
              </div>
            ))}
        </div>
      </div>
      <div className="lib-container">
        <div className="st-drops__progress" role="progressbar" aria-label={stText(locale, 'progress')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
          <span className="st-drops__progress-fill" style={{ '--st-progress': progress } as CSSProperties} />
        </div>
      </div>
    </section>
  );
}

function Chevron(): ReactElement {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}
