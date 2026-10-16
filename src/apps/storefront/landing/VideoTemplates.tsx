import type { CSSProperties } from 'react';
import { landingUrl, type LandingItem, type LandingSettings } from './document';
import { LandingVideo, landingVideoSource } from './LandingVideo';
import { StaticLandingFrame } from './StaticLandingFrame';
import { StoreFeatureIcon } from './StoreFeatureIcon';
import { videoDesign } from './video-designs';
import './video-templates.css';

export function VideoTemplates({ settings: s, preview = false, onPurchase }: { settings: LandingSettings; preview?: boolean; onPurchase?: () => void }) {
  const d = videoDesign(s.variant);
  const source = landingVideoSource(s.video);
  const hasContent = !!(source || s.title?.trim() || s.description?.trim() || s.items?.length);
  if (!preview && !hasContent) return null;
  const items = s.items ?? [];
  const examples = preview && !items.some(item => item.title || item.text || item.image || item.icon || item.html);
  const benefits: LandingItem[] = examples ? Array.from({ length: 3 }, (_, index) => ({ title: `عنوان الميزة ${index + 1}`, text: 'اكتب وصف الميزة هنا', icon: 'check' })) : items;
  const heading = <header className="lp-video-heading">{d.kind === 'benefits' && s.description ? <p>{s.description}</p> : null}{s.title || preview ? <h2>{s.title || 'عنوان الفيديو'}</h2> : null}{d.kind !== 'benefits' && s.description ? <p>{s.description}</p> : null}</header>;
  const media = source && !preview ? <div className="lp-video-media"><LandingVideo url={s.video} title={s.title || 'فيديو المنتج'} /></div> : preview ? <div className="lp-video-media lp-video-placeholder" role="img" aria-label="موضع الفيديو في المعاينة"><svg viewBox="0 0 64 64" fill="none" aria-hidden><circle cx="32" cy="32" r="27" stroke="currentColor" strokeWidth="2" /><path d="m26 20 18 12-18 12V20Z" fill="currentColor" /></svg><span>{source ? 'معاينة الفيديو — افتح صفحة المنتج لتشغيله' : 'أضف رابط الفيديو من الإعدادات'}</span></div> : null;
  const label = s.button_text ?? 'الشراء الآن';
  return <div className={`lp-video lp-video--${d.kind}`} data-design={d.id} data-motion={preview || s.motion === false ? 'paused' : 'playing'} style={{ '--video-accent': s.accent ?? 'var(--store-primary, #4bde1c)', '--video-card': s.card_background ?? '#ffffff', '--video-title-size': `${s.font_size ?? 36}px`, textAlign: s.align ?? (d.kind === 'offset' || d.kind === 'split' ? 'start' : 'center') } as CSSProperties}>
    {d.kind === 'split' ? <div className="lp-video-split"><div className="lp-video-copy">{heading}{label ? <button type="button" className="lp-video-buy" onClick={preview ? undefined : onPurchase}>{label}</button> : null}</div>{media}</div> : <>{heading}<div className="lp-video-group">{media}{d.kind === 'benefits' && benefits.length ? <div className="lp-video-benefits">{benefits.map((item, index) => <article key={index} style={{ background: item.background ?? s.card_background ?? '#ffffff', color: item.foreground ?? 'inherit', '--video-item-accent': item.accent ?? 'var(--video-accent)' } as CSSProperties}><div className="lp-video-icon">{item.image?.url && landingUrl(item.image.url) ? <img src={item.image.url} alt={item.image.alt || ''} loading="lazy" /> : <StoreFeatureIcon name={item.icon} />}</div>{item.title ? <h3>{item.title}</h3> : null}{item.text ? <p>{item.text}</p> : null}{item.html ? <StaticLandingFrame title={item.title || 'تفاصيل الميزة'} html={item.html} /> : null}{item.url && landingUrl(item.url) ? preview ? <span>{item.title || 'عرض التفاصيل'}</span> : <a href={item.url}>{item.title || 'عرض التفاصيل'}</a> : null}</article>)}</div> : null}</div></>}
    {examples && d.kind === 'benefits' ? <p className="lp-video-note">عناصر إرشادية للمعاينة — أضف مزايا منتجك من الإعدادات.</p> : null}
  </div>;
}
