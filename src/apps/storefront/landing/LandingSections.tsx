import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import type { StorefrontContext } from '../theme-engine/rendering';
import { productDetailOf, reviewsFor } from '../foundation/sections/section-data';
import { ReviewList } from '../foundation/components/Reviews';
import { ProductDescription } from '../foundation/components/ProductDescription';
import { StaticLandingFrame } from './StaticLandingFrame';
import { landingUrl, type LandingDocument, type LandingImage, type LandingSection } from './document';
import { Faq, hasFaqContent } from './Faq';
import { faqDesign } from './faq-designs';
import { Testimonials } from './Testimonials';
import { PromoBanners } from './PromoBanners';
import { hasStoreFeatureContent, StoreFeatures } from './StoreFeatures';
import './landing.css';

export function scrollLandingPurchase(): void {
  document.querySelector('[data-landing-checkout], [data-landing-fallback]')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
}

export function LandingPhoto({ image }: { image?: LandingImage }) {
  return image?.url && landingUrl(image.url) ? <img src={image.url} alt={image.alt ?? ''} loading="lazy" /> : null;
}

function LandingVideo({ url, title }: { url?: string; title: string }) {
  if (!url || !landingUrl(url)) return null;
  if (/\.mp4(?:[?#]|$)/i.test(url)) return <video src={url} controls playsInline preload="metadata" />;
  let parsed: URL; try { parsed = new URL(url); } catch { return null; }
  const host = parsed.hostname.toLowerCase(); let src = '';
  if (['youtu.be', 'www.youtu.be', 'youtube.com', 'www.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com'].includes(host)) {
    const id = host.endsWith('youtu.be') ? parsed.pathname.slice(1) : parsed.searchParams.get('v') ?? parsed.pathname.match(/\/(?:embed|shorts)\/([^/]+)/)?.[1];
    if (id && /^[\w-]{11}$/.test(id)) src = `https://www.youtube-nocookie.com/embed/${id}`;
  } else if (['vimeo.com', 'www.vimeo.com', 'player.vimeo.com'].includes(host)) {
    const id = parsed.pathname.match(/(?:\/video)?\/(\d+)$/)?.[1]; if (id) src = `https://player.vimeo.com/video/${id}`;
  }
  return src ? <iframe className="sf-landing-video" title={title} src={src} loading="lazy" sandbox="allow-scripts allow-same-origin allow-presentation" allow="fullscreen; picture-in-picture" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /> : null;
}

function LandingCountdown({ section, productId }: { section: LandingSection; productId: string }) {
  const { hours = 1, ends_at } = section.settings;
  const end = useMemo(() => {
    if (ends_at) return Date.parse(ends_at);
    const key = `sellchaze:landing-timer:${productId}:${section.id}:${hours}`;
    try { const previous = Number(sessionStorage.getItem(key)); if (previous > 0) return previous; } catch { /* optional tab persistence */ }
    const next = Date.now() + Math.max(1, Math.min(720, hours)) * 3600000;
    try { sessionStorage.setItem(key, String(next)); } catch { /* a blocked store never stops rendering */ }
    return next;
  }, [ends_at, hours, section.id, productId]);
  const [now, setNow] = useState(Date.now);
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const seconds = Math.max(0, Math.floor((end - now) / 1000)) || 0;
  return <div className="sf-landing-countdown" role="timer" aria-label="الوقت المتبقي">{[Math.floor(seconds / 86400), Math.floor(seconds / 3600) % 24, Math.floor(seconds / 60) % 60, seconds % 60].map((value, index) => <div key={index}><strong>{String(value).padStart(2, '0')}</strong><span>{['يوم', 'ساعة', 'دقيقة', 'ثانية'][index]}</span></div>)}</div>;
}

export function LandingBlock({ section, context, preview = false, firstCheckout = true, checkout, onPromoImageSelect, onFeatureItemSelect, onFaqItemSelect }: { section: LandingSection; context: StorefrontContext; preview?: boolean; firstCheckout?: boolean; checkout?: ReactNode; onPromoImageSelect?: (index: number) => void; onFeatureItemSelect?: (index: number) => void; onFaqItemSelect?: (index: number) => void }) {
  const product = productDetailOf(context); const s = section.settings; const reviews = reviewsFor(context);
  const title = s.title ?? ''; const buy = <button type="button" className="sf-landing-buy" onClick={preview ? undefined : scrollLandingPurchase}>{s.button_text || 'اضغط هنا للشراء'}</button>;
  let body: ReactNode = null;
  switch (section.type) {
    case 'checkout': body = preview ? <div className="sf-landing-checkout-preview"><h3>{product?.title}</h3><p>نموذج الشراء</p><div>الاسم الكامل</div><div>رقم الهاتف</div><div>العنوان</div><button type="button" disabled>تأكيد الطلب — معاينة</button></div> : firstCheckout ? <div data-landing-checkout>{checkout}</div> : buy; break;
    case 'heading': body = <><h2>{title}</h2>{s.description ? <p>{s.description}</p> : null}</>; break;
    case 'rich_text': case 'html': case 'advanced': body = <><StaticLandingFrame title={title || 'محتوى صفحة المنتج'} html={s.html ?? ''} css={s.css} onPurchase={preview ? undefined : scrollLandingPurchase} />{!s.html ? <><h2>{title}</h2><p>{s.description}</p><LandingPhoto image={s.image} /></> : null}</>; break;
    case 'youtube': case 'video': body = <><h2>{title}</h2><LandingVideo url={s.video} title={title || 'فيديو المنتج'} /></>; break;
    case 'image': body = <LandingPhoto image={s.image} />; break;
    case 'slider': case 'gallery': body = <><h2>{title}</h2><div className={`sf-landing-images${section.type === 'slider' ? ' sf-landing-slider' : ''}`}>{s.images?.map((image, index) => <LandingPhoto key={index} image={image} />)}</div></>; break;
    case 'banner': case 'simple': case 'content': body = <div className={`sf-landing-content sf-landing-content--${s.layout ?? 'stack'}`}><LandingPhoto image={s.image} /><div><h2>{title}</h2><p>{s.description}</p>{s.html ? <StaticLandingFrame title={title || 'محتوى'} html={s.html} onPurchase={preview ? undefined : scrollLandingPurchase} /> : null}{s.button_text ? buy : null}</div></div>; break;
    case 'faq': body = <Faq key={section.id} settings={s} preview={preview} onItemSelect={onFaqItemSelect} onPurchase={scrollLandingPurchase} />; break;
    case 'buy_button': body = buy; break;
    case 'countdown': body = <><h2>{title}</h2><p>{s.description}</p><LandingCountdown section={section} productId={product?.id ?? ''} />{s.button_text ? buy : null}</>; break;
    case 'reviews': body = product?.productPreferences?.is_reviews_enabled === false ? null : <><h2>{title}</h2><ReviewList reviews={reviews} /></>; break;
    case 'product_description': body = <><h2>{title}</h2><ProductDescription html={product?.descriptionHtml ?? ''} /></>; break;
    case 'billboard': body = <div className="sf-landing-billboard"><strong>{title}</strong><span>{s.description}</span>{s.items?.map((item, index) => <span key={index}>{item.title}</span>)}</div>; break;
    default: body = section.type === 'store_features' && s.variant ? <StoreFeatures settings={s} preview={preview} onItemSelect={onFeatureItemSelect} /> : section.type === 'promo_banners' && s.variant ? <PromoBanners settings={s} preview={preview} onImageSelect={onPromoImageSelect} /> : section.type === 'custom_reviews' && s.variant ? <Testimonials settings={s} preview={preview} /> : <><h2>{title}</h2>{s.description ? <p>{s.description}</p> : null}<div className={`sf-landing-items sf-landing-items--${section.type}`}>{s.items?.map((item, index) => <article key={index}><LandingPhoto image={item.image} />{section.type === 'how_to' ? <span className="sf-landing-step">{index + 1}</span> : null}{section.type === 'custom_reviews' ? <span className="sf-landing-stars" aria-label={`${item.rating ?? 5} / 5`}>{'★'.repeat(Math.max(0, Math.min(5, Math.round(item.rating ?? 5))))}</span> : null}<h3>{item.title}</h3><p>{item.text}</p>{item.html ? <StaticLandingFrame title={item.title || 'محتوى'} html={item.html} /> : null}{item.url && landingUrl(item.url) ? <a href={item.url} target="_blank" rel="noopener noreferrer">{item.title || 'عرض التفاصيل'}</a> : null}</article>)}</div></>;
  }
  if (!preview && section.type === 'promo_banners' && s.variant && !s.items?.some(item => item.image?.url || item.title?.trim() || item.text?.trim() || item.html?.trim())) return null;
  if (!preview && section.type === 'custom_reviews' && s.variant && !s.items?.length) return null;
  if (!preview && section.type === 'store_features' && s.variant && !hasStoreFeatureContent(s)) return null;
  if (!preview && section.type === 'faq' && !hasFaqContent(s)) return null;
  const style: CSSProperties = { backgroundColor: s.background ?? (section.type === 'faq' ? faqDesign(s.variant).background : undefined), ...(s.background_image?.url && landingUrl(s.background_image.url) && !s.background_image.url.startsWith('#') ? { backgroundImage: `url(${JSON.stringify(s.background_image.url)})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}), color: s.foreground, textAlign: s.align, padding: `${Math.max(0, Math.min(160, s.padding ?? 32))}px`, borderRadius: `${Math.max(0, Math.min(48, s.radius ?? 0))}px`, ...(s.font_size ? { fontSize: Math.max(12, Math.min(96, s.font_size)) } : {}) };
  return <section className={`sf-landing-block sf-landing-block--${section.type}`} style={style}>{body}</section>;
}

export function LandingSections({ document, context, checkout: form }: { document: LandingDocument; context: StorefrontContext; checkout?: ReactNode }) {
  const checkout = document.sections.find(section => section.type === 'checkout')?.id;
  return <div className="sf-product-landing">{document.sections.map(section => <LandingBlock key={section.id} section={section} context={context} firstCheckout={section.id === checkout} checkout={form} />)}</div>;
}
