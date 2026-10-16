import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { identityForeground } from '../store-identity';
import { landingUrl, type LandingItem, type LandingSettings, type TestimonialVariant } from './document';
import { testimonialDesign, testimonialExamples } from './testimonial-designs';
import { StaticLandingFrame } from './StaticLandingFrame';
import './testimonials.css';

function Avatar({ item }: { item: LandingItem }) {
  return item.image?.url && landingUrl(item.image.url) ? <img className="lp-review-avatar" src={item.image.url} alt={item.image.alt ?? ''} loading="lazy" /> : item.author ? <span className="lp-review-avatar lp-review-initial" aria-hidden>{Array.from(item.author.trim())[0]}</span> : null;
}
function Author({ item, hideImage = false }: { item: LandingItem; hideImage?: boolean }) {
  return <footer className="lp-review-author">{!hideImage ? <Avatar item={item} /> : null}<div>{item.author ? <strong>{item.author}</strong> : null}{item.caption ? <small>{item.caption}</small> : null}{item.date ? <time dateTime={item.date}>{item.date.split('-').reverse().join('/')}</time> : null}</div></footer>;
}
function ReviewCard({ item, variant, index, clone = false }: { item: LandingItem; variant: TestimonialVariant; index: number; clone?: boolean }) {
  const n = Number(variant.split('-')[1]);
  const featured = [3, 10, 11].includes(n) ? index === 1 : n === 7 && index % 2 === 1;
  const author = <Author item={item} hideImage={n === 2 || n === 9} />;
  return <article className={`lp-review${featured ? ' lp-review--featured' : ''}`} aria-hidden={clone || undefined} inert={clone || undefined}>
    {n === 9 ? <div className="lp-review-overlap"><Avatar item={item} /></div> : null}
    <div className="lp-review-box">
      {n === 1 ? author : null}
      {n === 4 && item.platform ? <span className="lp-review-platform">{item.platform}</span> : null}
      {![1, 7].includes(n) ? <span className="lp-review-quote" aria-hidden>❞</span> : null}
      {item.title ? <h3 className="lp-review-headline">{item.title}</h3> : null}
      {item.text ? <p className="lp-review-text">{item.text}</p> : null}
      {item.html ? <StaticLandingFrame title={item.title || 'نص التقييم'} html={item.html} /> : null}
      {typeof item.rating === 'number' ? <span className="lp-review-rating" aria-label={`${item.rating} / 5`}>{'★'.repeat(Math.max(0, Math.min(5, Math.round(item.rating))))}</span> : null}
      {item.url && landingUrl(item.url) ? <a href={item.url} target="_blank" rel="noopener noreferrer" tabIndex={clone ? -1 : undefined}>{item.platform || 'عرض التقييم'}</a> : null}
      {![1, 10, 11].includes(n) ? author : null}
    </div>
    {[10, 11].includes(n) ? author : null}
  </article>;
}

function featuredInk(accent: string): string {
  const hex = /^#[\da-f]{3}$/i.test(accent) ? '#' + accent.slice(1).split('').map(char => char + char).join('') : accent;
  return /^#[\da-f]{6}$/i.test(hex) ? identityForeground(hex) : '#111827';
}

export function Testimonials({ settings, preview = false, interactive = true }: { settings: LandingSettings; preview?: boolean; interactive?: boolean }) {
  const variant = settings.variant ?? 'testimonials-1'; const design = testimonialDesign(variant);
  const supplied = (settings.items ?? []).filter(item => item.author?.trim() || item.title?.trim() || item.text?.trim() || item.html?.trim() || item.image?.url || typeof item.rating === 'number');
  const examples = preview && !supplied.length;
  const items = examples ? testimonialExamples(variant) : supplied;
  const track = useRef<HTMLDivElement>(null); const id = useId();
  const [active, setActive] = useState(0); const [paused, setPaused] = useState(false);
  const n = Number(variant.split('-')[1]); const marquee = n === 6 && items.length > 2;
  const dataKey = JSON.stringify(items);
  useEffect(() => { setActive(0); track.current?.scrollTo?.({ left: 0, behavior: 'instant' }); }, [variant, dataKey]);
  if (!items.length) return null;
  const accent = settings.accent || design.accent;
  const style = { '--lp-review-accent': accent, '--lp-review-card': settings.card_background || (n === 5 || n === 10 || n === 11 ? '#f4f3f8' : '#ffffff'), '--lp-review-featured-ink': featuredInk(accent), '--lp-review-columns': design.columns } as CSSProperties;
  const updateActive = () => {
    if (!track.current) return;
    const bounds = track.current.getBoundingClientRect(); const rtl = getComputedStyle(track.current).direction === 'rtl';
    const cards = Array.from(track.current.children);
    const distances = cards.map(child => { const rect = child.getBoundingClientRect(); return Math.abs(rtl ? rect.right - bounds.right : rect.left - bounds.left); });
    const closest = distances.indexOf(Math.min(...distances)); if (closest >= 0) setActive(closest);
  };
  const go = (index: number) => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    track.current?.children[index]?.scrollIntoView({ block: 'nearest', inline: 'start', behavior: reduced ? 'auto' : 'smooth' }); setActive(index);
  };
  const cards = (rows: LandingItem[], offset = 0, clone = false) => rows.map((item, index) => <ReviewCard key={`${clone ? 'clone' : 'original'}-${offset + index}`} item={item} variant={variant} index={offset + index} clone={clone} />);
  return <div className={`lp-testimonials lp-testimonials--${n}${marquee ? ' lp-testimonials--marquee' : ''}${paused ? ' lp-testimonials--paused' : ''}`} style={style}>
    <header className="lp-testimonials-heading">{settings.description ? <p className="lp-testimonials-eyebrow">{settings.description}</p> : null}{settings.title ? <h2 className="lp-testimonials-title">{settings.title}</h2> : null}</header>
    {examples ? <p className="lp-testimonials-demo" role="note">بيانات تجريبية للمعاينة — أضف تقييمات عملائك من الإعدادات.</p> : null}
    {marquee ? <div className="lp-review-lanes" id={id}>{[0, 1].map(lane => { const rows = items.filter((_, index) => index % 2 === lane); return <div className="lp-review-lane-window" key={lane}><div className={`lp-review-lane lp-review-lane--${lane}`}>{cards(rows)}{cards(rows, 0, true)}</div></div>; })}</div> : <div className={`lp-review-track${design.carousel ? ' lp-review-track--carousel' : ''}`} id={id} ref={track} onScroll={design.carousel ? updateActive : undefined}>{cards(items)}</div>}
    {design.carousel && items.length > 1 ? <div className="lp-review-pages" role={interactive ? 'group' : undefined} aria-label={interactive ? 'عرض التقييمات' : undefined}>{items.map((_, index) => interactive ? <button key={index} type="button" aria-label={`التقييم ${index + 1}`} aria-controls={id} aria-current={active === index ? 'true' : undefined} onClick={() => go(index)} /> : <span className={`lp-review-dot${index === 0 ? ' lp-review-dot--active' : ''}`} key={index} />)}</div> : null}
    {marquee && interactive ? <button type="button" className="lp-review-motion" onClick={() => setPaused(value => !value)} aria-pressed={paused} aria-controls={id}>{paused ? 'تشغيل الحركة' : 'إيقاف الحركة'}</button> : null}
  </div>;
}
