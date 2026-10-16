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
import { LandingVideo } from './LandingVideo';
import { VideoTemplates } from './VideoTemplates';
import { HowToSteps, hasHowToContent } from './HowToSteps';
import { howToDesign } from './howto-designs';
import { ContentLayouts, hasContentLayout } from './ContentLayouts';
import { contentDesign } from './content-designs';
import { BuyButton } from './BuyButton';
import './landing.css';

export function scrollLandingPurchase(): void {
  document.querySelector('[data-landing-checkout], [data-landing-fallback]')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
}

export function LandingPhoto({ image, preview = false }: { image?: LandingImage; preview?: boolean }) {
  const photo = image?.url && landingUrl(image.url) ? <img src={image.url} alt={image.alt ?? ''} loading="lazy" /> : null;
  return photo && !preview && image?.link_url && landingUrl(image.link_url) ? <a href={image.link_url} aria-label={image.alt || 'عرض الوجهة'}>{photo}</a> : photo;
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

export function LandingBlock({ section, context, preview = false, firstCheckout = true, checkout, onPromoImageSelect, onFeatureItemSelect, onFaqItemSelect, onHowToItemSelect, onContentItemSelect, onContentImageSelect, onBuySelect }: { section: LandingSection; context: StorefrontContext; preview?: boolean; firstCheckout?: boolean; checkout?: ReactNode; onPromoImageSelect?: (index: number) => void; onFeatureItemSelect?: (index: number) => void; onFaqItemSelect?: (index: number) => void; onHowToItemSelect?: (index: number) => void; onContentItemSelect?: (index: number) => void; onContentImageSelect?: (index: number | 'hero' | 'secondary') => void; onBuySelect?: () => void }) {
  const product = productDetailOf(context); const s = section.settings; const reviews = reviewsFor(context);
  const title = s.title ?? ''; const buy = <button type="button" className="sf-landing-buy" onClick={preview ? undefined : scrollLandingPurchase}>{s.button_text || 'اضغط هنا للشراء'}</button>;
  let body: ReactNode = null;
  switch (section.type) {
    case 'checkout': body = preview ? <div className="sf-landing-checkout-preview"><h3>{product?.title}</h3><p>نموذج الشراء</p><div>الاسم الكامل</div><div>رقم الهاتف</div><div>العنوان</div><button type="button" disabled>تأكيد الطلب — معاينة</button></div> : firstCheckout ? <div data-landing-checkout>{checkout}</div> : buy; break;
    case 'heading': body = <><h2>{title}</h2>{s.description ? <p>{s.description}</p> : null}</>; break;
    case 'rich_text': case 'html': case 'advanced': body = <><StaticLandingFrame title={title || 'محتوى صفحة المنتج'} html={s.html ?? ''} css={s.css} onPurchase={preview ? undefined : scrollLandingPurchase} />{!s.html ? <><h2>{title}</h2><p>{s.description}</p><LandingPhoto image={s.image} /></> : null}</>; break;
    case 'video': body = s.variant ? <VideoTemplates settings={s} preview={preview} onPurchase={scrollLandingPurchase} /> : <><h2>{title}</h2><LandingVideo url={s.video} title={title || 'فيديو المنتج'} /></>; break;
    case 'youtube': body = <><h2>{title}</h2><LandingVideo url={s.video} title={title || 'فيديو المنتج'} /></>; break;
    case 'image': body = <LandingPhoto image={s.image} />; break;
    case 'slider': case 'gallery': body = <><h2>{title}</h2><div className={`sf-landing-images${section.type === 'slider' ? ' sf-landing-slider' : ''}`}>{s.images?.map((image, index) => <LandingPhoto key={index} image={image} />)}</div></>; break;
    case 'banner': case 'simple': case 'content': body = section.type === 'content' && s.variant ? <ContentLayouts settings={s} preview={preview} onItemSelect={onContentItemSelect} onImageSelect={onContentImageSelect} onPurchase={scrollLandingPurchase} /> : <div className={`sf-landing-content sf-landing-content--${s.layout ?? 'stack'}`}><LandingPhoto image={s.image} preview={preview} /><div><h2>{title}</h2><p>{s.description}</p>{s.html ? <StaticLandingFrame title={title || 'محتوى'} html={s.html} onPurchase={preview ? undefined : scrollLandingPurchase} /> : null}{s.button_text ? buy : null}</div>{section.type === 'content' ? <LandingPhoto image={s.secondary_image} preview={preview} /> : null}</div>; break;
    case 'faq': body = <Faq key={section.id} settings={s} preview={preview} onItemSelect={onFaqItemSelect} onPurchase={scrollLandingPurchase} />; break;
    case 'buy_button': body = s.variant ? <BuyButton settings={s} preview={preview} onSelect={onBuySelect} onPurchase={scrollLandingPurchase} /> : buy; break;
    case 'countdown': body = <><h2>{title}</h2><p>{s.description}</p><LandingCountdown section={section} productId={product?.id ?? ''} />{s.button_text ? buy : null}</>; break;
    case 'reviews': body = product?.productPreferences?.is_reviews_enabled === false ? null : <><h2>{title}</h2><ReviewList reviews={reviews} /></>; break;
    case 'product_description': body = <><h2>{title}</h2><ProductDescription html={product?.descriptionHtml ?? ''} /></>; break;
    case 'billboard': body = <div className="sf-landing-billboard"><strong>{title}</strong><span>{s.description}</span>{s.items?.map((item, index) => <span key={index}>{item.title}</span>)}</div>; break;
    default: body = section.type === 'how_to' && s.variant ? <HowToSteps key={section.id} settings={s} preview={preview} onItemSelect={onHowToItemSelect} onPurchase={scrollLandingPurchase} /> : section.type === 'store_features' && s.variant ? <StoreFeatures settings={s} preview={preview} onItemSelect={onFeatureItemSelect} /> : section.type === 'promo_banners' && s.variant ? <PromoBanners settings={s} preview={preview} onImageSelect={onPromoImageSelect} /> : section.type === 'custom_reviews' && s.variant ? <Testimonials settings={s} preview={preview} /> : <><h2>{title}</h2>{s.description ? <p>{s.description}</p> : null}<div className={`sf-landing-items sf-landing-items--${section.type}`}>{s.items?.map((item, index) => <article key={index}><LandingPhoto image={item.image} />{section.type === 'how_to' ? <span className="sf-landing-step">{index + 1}</span> : null}{section.type === 'custom_reviews' ? <span className="sf-landing-stars" aria-label={`${item.rating ?? 5} / 5`}>{'★'.repeat(Math.max(0, Math.min(5, Math.round(item.rating ?? 5))))}</span> : null}<h3>{item.title}</h3><p>{item.text}</p>{item.html ? <StaticLandingFrame title={item.title || 'محتوى'} html={item.html} /> : null}{item.url && landingUrl(item.url) ? <a href={item.url} target="_blank" rel="noopener noreferrer">{item.title || 'عرض التفاصيل'}</a> : null}</article>)}</div></>;
  }
  if (!preview && section.type === 'promo_banners' && s.variant && !s.items?.some(item => item.image?.url || item.title?.trim() || item.text?.trim() || item.html?.trim())) return null;
  if (!preview && section.type === 'custom_reviews' && s.variant && !s.items?.length) return null;
  if (!preview && section.type === 'store_features' && s.variant && !hasStoreFeatureContent(s)) return null;
  if (!preview && section.type === 'how_to' && s.variant && !hasHowToContent(s)) return null;
  if (!preview && section.type === 'faq' && !hasFaqContent(s)) return null;
  if (!preview && section.type === 'content' && s.variant && !hasContentLayout(s)) return null;
  if (!preview && section.type === 'buy_button' && s.variant && s.button_text !== undefined && !s.button_text.trim()) return null;
  const content = section.type === 'content' && s.variant ? contentDesign(s.variant) : null;
  const howTo = section.type === 'how_to' && s.variant ? howToDesign(s.variant) : null;
  const style: CSSProperties = { ...(content ? { '--content-padding': s.padding !== undefined ? `${s.padding}px` : `${content.padding}px ${content.sidePadding}px` } : {}), ...(howTo ? { '--howto-padding': s.padding !== undefined ? `${s.padding}px` : `${howTo.padding}px ${howTo.sidePadding}px` } : {}), ...(section.type === 'video' && s.variant ? { '--landing-video-padding': `${s.padding ?? 40}px` } : {}), backgroundColor: s.background ?? (section.type === 'faq' ? faqDesign(s.variant).background : content?.background ?? howTo?.background ?? (section.type === 'buy_button' && s.variant ? '#ffffff' : undefined)), ...(s.background_image?.url && landingUrl(s.background_image.url) && !s.background_image.url.startsWith('#') ? { backgroundImage: `url(${JSON.stringify(s.background_image.url)})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}), color: s.foreground, textAlign: s.align, padding: `${Math.max(0, Math.min(160, s.padding ?? 32))}px`, borderRadius: `${Math.max(0, Math.min(48, s.radius ?? 0))}px`, ...(s.font_size ? { fontSize: Math.max(12, Math.min(96, s.font_size)) } : {}) };
  return <section className={`sf-landing-block sf-landing-block--${section.type}${section.type === 'buy_button' && s.variant ? ' sf-landing-block--native-buy' : ''}`} style={style}>{body}</section>;
}

export function LandingSections({ document, context, checkout: form }: { document: LandingDocument; context: StorefrontContext; checkout?: ReactNode }) {
  const checkout = document.sections.find(section => section.type === 'checkout')?.id;
  return <div className="sf-product-landing">{document.sections.map(section => <LandingBlock key={section.id} section={section} context={context} firstCheckout={section.id === checkout} checkout={form} />)}</div>;
}
