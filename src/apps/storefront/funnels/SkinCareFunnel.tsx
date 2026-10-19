import { useEffect, useId, useRef, useState, type ReactElement, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import ShoppingCart01Icon from '@hugeicons/core-free-icons/ShoppingCart01Icon';
import type { SectionInstance } from '../theme-engine/rendering';
import type { ApiReview } from '../api/types';
import { getProduct, getProductReviews } from '../api/storefront';
import { useAsync } from '../api/useAsync';
import { useLocale } from '../i18n/useLocale';
import { useStore } from '../state/store-context';
import { useCustomizerState } from '../customize/customizer-state';
import { FunnelCheckout, type FunnelPresentation } from '../pages/FunnelCheckout';
import { StorePaymentMarks } from '../shared-ui/PaymentMarks';
import { formatMoney } from '../utils/format';
import { campaignUrl, offerRemaining, productPictures } from './glasses-model';
import { IconMenu, IconClose } from '../foundation/components/icons';
import { skinCarePreview } from './skin-care-preview';
import { isPreview } from '../preview';
import { NotFoundPage } from '../pages/NotFoundPage';
import { Seo } from '../seo/Seo';
import './skin-care.css';

interface Props { sections: ReadonlyArray<SectionInstance>; productSlug: string | null; locale?: string }
type Values = Readonly<Record<string, unknown>>;
const text = (value: unknown): string => typeof value === 'string' ? value : '';
const rows = (value: unknown): Values[] => Array.isArray(value) ? value.filter((row): row is Values => !!row && typeof row === 'object' && !Array.isArray(row)).slice(0, 12) : [];

function Announcement({ settings, ar }: { settings: Values; ar: boolean }): ReactElement | null {
  const [now, setNow] = useState(Date.now); const expiry = settings['expires_at']; const remaining = offerRemaining(expiry, now);
  useEffect(() => { if (!offerRemaining(expiry, Date.now())) return; const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, [expiry]);
  if (!text(settings['announcement']) && !remaining) return null;
  const parts = remaining ? [[remaining % 60, ar ? 'ثانية' : 'Seconds'], [Math.floor(remaining / 60) % 60, ar ? 'دقيقة' : 'Minutes'], [Math.floor(remaining / 3600) % 24, ar ? 'ساعة' : 'Hours'], [Math.floor(remaining / 86400), ar ? 'يوم' : 'Days']] : [];
  return <div className="skc-announcement"><span>{text(settings['announcement'])}</span>{remaining !== null && remaining > 0 ? <span className="skc-countdown" role="timer" aria-label={ar ? 'الوقت المتبقي للعرض' : 'Offer ends in'}>{parts.map(([value, label]) => <span key={label}><bdi>{String(value).padStart(2, '0')}</bdi> {label}</span>)}</span> : null}</div>;
}

function Gallery({ presentation, ar }: { presentation: FunnelPresentation; ar: boolean }): ReactElement {
  const pictures = productPictures(presentation.product, presentation.image);
  const [choice, setChoice] = useState<{ variant: string | null; image: string }>();
  const current = choice?.variant === presentation.image && pictures.includes(choice.image) ? choice.image : pictures[0];
  return <div className="skc-gallery">{current ? <img className="skc-gallery-main" src={current} alt={presentation.product?.name || ''} /> : <div className="skc-placeholder">{ar ? 'صور المنتج' : 'Product photographs'}</div>}<div className="skc-gallery-rail" role="group" aria-label={ar ? 'صور المنتج' : 'Product photographs'}>{pictures.map((src, index) => <button key={src} type="button" aria-label={`${ar ? 'صورة' : 'Image'} ${index + 1}`} aria-pressed={src === current} onClick={() => setChoice({ variant: presentation.image, image: src })}><img src={src} alt="" loading="lazy" /></button>)}</div></div>;
}

function Questions({ items, heading, ar, policies = false }: { items: unknown; heading?: string; ar: boolean; policies?: boolean }): ReactElement | null {
  const questions = rows(items).slice(0, policies ? 3 : 12); const [open, setOpen] = useState<number | null>(null); const id = useId();
  if (!questions.length) return null;
  return <div className={policies ? 'skc-questions skc-policies' : 'skc-questions'}>{policies ? null : <h2 className={heading ? undefined : 'skc-sr-only'}>{heading || (ar ? 'الأسئلة الشائعة' : 'Frequently asked questions')}</h2>}{questions.map((item, i) => <article key={i}><h3><button type="button" aria-expanded={open === i} aria-controls={`${id}-${i}`} onClick={() => setOpen(open === i ? null : i)}>{text(item['question'])}<span aria-hidden="true">{open === i ? '−' : '+'}</span></button></h3><div id={`${id}-${i}`} hidden={open !== i}><p>{text(item['answer'])}</p></div></article>)}</div>;
}

function Reviews({ slug, settings, ar, displayOnly }: { slug: string | null; settings: Values; ar: boolean; displayOnly: boolean }): ReactElement {
  const { locale } = useLocale(); const query = useAsync(() => slug ? getProductReviews(slug) : Promise.resolve(null), [slug, locale]);
  const sample: ApiReview[] = [1, 2, 3, 4].map(id => ({ id: -id, author_name: ar ? `عميل توضيحي ${id}` : `Sample customer ${id}`, rating: 5, title: ar ? 'مثال لتنسيق التقييم' : 'Sample review layout', body: ar ? 'هذا نص توضيحي لشكل التقييم، وليس تقييمًا لمنتج حقيقي. تعرض الصفحة المنشورة تقييمات المنتج الفعلية.' : 'Sample content showing the review layout, not a review of a real product. The published page displays actual product reviews.' }));
  const reviews = displayOnly ? sample : query.data?.data ?? []; const summary = displayOnly ? { average: 5, count: sample.length } : query.data?.summary;
  return <div className="skc-wrap skc-reviews"><header><div><h2>{text(settings['heading']) || (ar ? 'آراء العملاء' : 'What customers say')}</h2>{text(settings['subheading']) ? <p>{text(settings['subheading'])}</p> : null}</div><div className="skc-review-summary">{summary && summary.count > 0 && summary.average != null ? <><strong>{Number(summary.average).toFixed(1)}</strong><span className="skc-stars" aria-label={`${Number(summary.average).toFixed(1)} / 5`}>{'★'.repeat(Math.max(0, Math.min(5, Math.round(summary.average))))}</span><span>({summary.count} {ar ? 'تقييم' : 'reviews'})</span></> : null}{displayOnly ? <small>{ar ? 'تقييمات توضيحية فقط' : 'Sample reviews only'}</small> : null}</div></header>{!reviews.length ? <p role="status">{query.loading ? (ar ? 'جارٍ تحميل التقييمات…' : 'Loading reviews…') : query.error ? (ar ? 'تعذّر تحميل التقييمات.' : 'Reviews are temporarily unavailable.') : (ar ? 'لا توجد تقييمات لهذا المنتج بعد.' : 'There are no reviews for this product yet.')}{query.error ? <button type="button" className="skc-button" onClick={query.reload}>{ar ? 'إعادة المحاولة' : 'Retry'}</button> : null}</p> : <div className="skc-review-list">{reviews.slice(0, 6).map(review => <article key={review.id} data-skc-reveal={ar ? 'review' : undefined}><div className="skc-review-author"><strong>{review.author_name || review.customer?.name || (ar ? 'عميل المتجر' : 'Store customer')}</strong>{review.is_verified ? <small>{ar ? 'مشتري موثّق' : 'Verified purchase'}</small> : null}</div><div><div className="skc-stars" aria-label={`${review.rating} / 5`}>{'★'.repeat(Math.max(0, Math.min(5, Math.round(review.rating))))}</div>{review.title ? <h3>{review.title}</h3> : null}<p>{review.body}</p>{review.photos?.length ? <div className="skc-review-photos">{review.photos.slice(0, 2).map((photo, i) => { const src = campaignUrl(typeof photo === 'string' ? photo : photo.src); return src ? <img src={src} alt={ar ? 'صورة أرفقها العميل' : 'Customer photograph'} key={i} loading="lazy" /> : null; })}</div> : null}</div></article>)}</div>}</div>;
}

function DisabledCheckout({ ar, editor = false }: { ar: boolean; editor?: boolean }): ReactElement {
  return <section id="funnel-checkout" className="sf-funnel-checkout"><h3>{ar ? 'نموذج الطلب' : 'Order form'}</h3><p>{editor ? (ar ? 'معاينة النموذج — اختر تفاصيل المنتج في المحرر قبل النشر.' : 'Form preview — choose product details in the editor before publishing.') : (ar ? 'نموذج توضيحي — الشراء معطّل' : 'Sample form — checkout disabled')}</p><fieldset disabled><label>{ar ? 'الاسم الكامل' : 'Full name'}<input placeholder={ar ? 'الاسم الكامل' : 'Full name'} /></label><label>{ar ? 'رقم الهاتف' : 'Phone number'}<input placeholder={ar ? 'رقم الهاتف' : 'Phone number'} /></label><label>{ar ? 'العنوان' : 'Address'}<textarea placeholder={ar ? 'عنوان التوصيل' : 'Delivery address'} /></label><button type="button">{ar ? 'اطلب الآن' : 'Order now'}</button></fieldset></section>;
}

function EditorPreview(props: Props): ReactElement {
  const { locale } = useLocale(); const customizer = useCustomizerState(); const ar = (customizer.locale ?? props.locale ?? locale) === 'ar';
  const query = useAsync(() => props.productSlug ? getProduct(props.productSlug) : Promise.resolve(null), [props.productSlug, locale]); const product = query.data?.data ?? null;
  return <SkinCareComposition {...props} presentation={{ product, unitPrice: Number(product?.price ?? 0), comparePrice: product?.compare_price ? Number(product.compare_price) : undefined, quantity: 1, ready: false, image: product?.image_url ?? null }} checkout={<DisabledCheckout ar={ar} editor />} />;
}

export default function SkinCareFunnel(props: Props): ReactElement {
  const customizer = useCustomizerState();
  return customizer.active ? <EditorPreview {...props} /> : <FunnelCheckout compactHeader productSlug={props.productSlug} renderLayout={(presentation, checkout) => <SkinCareComposition {...props} presentation={presentation} checkout={checkout} />} />;
}

export function SkinCareTemplatePreview(): ReactElement {
  const { key } = useParams();
  if (!isPreview() || (key !== 'skin-care-ar' && key !== 'skin-care-en')) return <NotFoundPage />;
  const locale = key === 'skin-care-ar' ? 'ar' : 'en'; const ar = locale === 'ar'; const { product, sections } = skinCarePreview(locale);
  return <div className="skc-template-preview"><Seo title={ar ? 'معاينة قالب Skin Care' : 'Skin Care template preview'} noindex /><aside className="skc-demo-note" role="status">{ar ? 'بيانات توضيحية — الشراء معطّل' : 'Sample data — checkout disabled'} · <a href="/store/funnels" data-preview-exit>{ar ? 'العودة للقوالب' : 'Back to templates'}</a></aside><SkinCareComposition sections={sections} productSlug={null} locale={locale} displayOnly presentation={{ product, unitPrice: Number(product.price), comparePrice: Number(product.compare_price), quantity: 1, ready: false, image: product.image_url ?? null }} checkout={<DisabledCheckout ar={ar} />} /></div>;
}

export function SkinCareComposition({ sections, productSlug, locale: pageLocale, presentation, checkout, displayOnly = false }: Props & { presentation: FunnelPresentation; checkout: ReactElement; displayOnly?: boolean }): ReactElement {
  const { store, navigation } = useStore(); const { locale } = useLocale(); const customizer = useCustomizerState();
  const ar = ((customizer.active ? customizer.locale : null) ?? pageLocale ?? locale) === 'ar'; const language = ar ? 'ar' : 'en'; const product = presentation.product;
  const root = useRef<HTMLDivElement>(null); const dialog = useRef<HTMLDialogElement>(null); const [menu, setMenu] = useState(false); const menuId = useId();
  const first = (type: string): number => sections.findIndex(section => section.type === `skincare-${type}`);
  const closeMenu = (): void => { dialog.current?.close(); setMenu(false); };
  useEffect(() => { if (menu && !dialog.current?.open) dialog.current?.showModal(); if (!menu && dialog.current?.open) dialog.current.close(); }, [menu]);
  useEffect(() => {
    const element = root.current;
    if (!element || !('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches || customizer.active) return;
    element.classList.add('skc-motion'); const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('skc-visible'); observer.unobserve(entry.target); } }), { threshold: 0.06 });
    const seen = new WeakSet<Element>();
    const observe = (): void => { element.querySelectorAll('[data-skc-reveal]').forEach(node => { if (!seen.has(node)) { seen.add(node); observer.observe(node); } }); };
    observe();
    // Reviews arrive asynchronously after the initial section tree has rendered.
    const updates = new MutationObserver(observe); updates.observe(element, { childList: true, subtree: true });
    return () => { observer.disconnect(); updates.disconnect(); element.classList.remove('skc-motion'); };
  }, [sections, customizer.active, ar]);
  const order = (label?: unknown, close = false): ReactElement => <a className="skc-button" href="#funnel-checkout" onClick={close ? closeMenu : undefined}>{text(label) || (ar ? 'اطلب الآن' : 'Order now')}<HugeiconsIcon icon={ShoppingCart01Icon} size={20} aria-hidden="true" /></a>;
  const links = (close = false): ReactNode => <>{[['features', ar ? 'مميزات' : 'Features'], ['faq', ar ? 'أسئلة وأجوبة' : 'Questions & answers'], ['reviews', ar ? 'مراجعات' : 'Reviews']].filter(([type]) => first(type!) >= 0).map(([type, label]) => <a href={`#skc-section-${first(type!)}`} key={type} onClick={close ? closeMenu : undefined}>{label}</a>)}{order(undefined, close)}</>;
  const photo = (s: Values, cls = '', reveal?: string): ReactElement | null => campaignUrl(s['image']) ? <img className={cls} data-skc-reveal={ar ? reveal : undefined} src={campaignUrl(s['image'])} alt={text(s['image_alt'])} loading="lazy" /> : null;
  const frame = (s: Values, reveal: string): ReactElement => <div className="skc-photo-frame">{campaignUrl(s['backdrop']) ? <img className="skc-backdrop" src={campaignUrl(s['backdrop'])} alt="" loading="lazy" /> : null}{photo(s, 'skc-portrait', reveal)}</div>;
  const prices = (): ReactElement => <div className="skc-prices"><strong>{formatMoney(presentation.unitPrice, store.baseCurrency, language)}</strong>{presentation.comparePrice && presentation.comparePrice > presentation.unitPrice ? <><del>{formatMoney(presentation.comparePrice, store.baseCurrency, language)}</del><small className="skc-discount">{ar ? 'خصم ' : ''}{Math.round((presentation.comparePrice - presentation.unitPrice) / presentation.comparePrice * 100)}%{ar ? '' : ' off'}</small></> : null}</div>;
  const render = (section: SectionInstance, index: number): ReactNode => {
    const s = section.settings ?? {};
    switch (section.type) {
      case 'skincare-hero': return <><Announcement settings={s} ar={ar} /><div className="skc-campaign">{campaignUrl(s['image']) ? <img className="skc-cover" src={campaignUrl(s['image'])} alt={text(s['image_alt'])} fetchPriority="high" /> : null}<header className="skc-header"><a className="skc-brand" href="#skc-top">{store.logoUrl ? <img src={store.logoUrl} alt={store.name} /> : store.name}</a><nav aria-label={ar ? 'أقسام الصفحة' : 'Page sections'}>{links()}</nav><button type="button" className="skc-menu-toggle" aria-expanded={menu} aria-controls={menuId} aria-label={ar ? 'قائمة الصفحة' : 'Page menu'} onClick={() => setMenu(true)}><IconMenu /></button></header><div className="skc-hero"><div data-skc-reveal="hero">{index === first('hero') ? <h1>{text(s['heading'])}</h1> : <h2>{text(s['heading'])}</h2>}{text(s['text']) ? <p>{text(s['text'])}</p> : null}{order(s['cta_label'])}</div></div></div></>;
      case 'skincare-intro': return text(s['text']) ? <div className="skc-wrap skc-intro"><p>{text(s['text'])}</p></div> : null;
      case 'skincare-purchase': return index === first('purchase') ? <div className="skc-wrap skc-purchase"><Gallery presentation={presentation} ar={ar} /><div className="skc-purchase-panel">{product?.reviews_count && product.rating != null ? <p className="skc-product-rating"><span className="skc-stars" aria-hidden="true">★★★★★</span> {Number(product.rating).toFixed(1)} · {product.reviews_count} {ar ? 'تقييم' : 'reviews'}</p> : null}<h2>{text(s['heading']) || product?.name}</h2>{product ? prices() : null}{text(s['text']) || product?.short_description ? <p>{text(s['text']) || product?.short_description}</p> : null}{checkout}</div></div> : null;
      case 'skincare-specs': return <div className="skc-specs">{frame(s, 'zoom')}<div className="skc-specs-panel" data-skc-reveal={ar ? 'panel' : undefined}><h2>{text(s['heading'])}</h2>{rows(s['items']).length ? <ul>{rows(s['items']).map((item, i) => <li key={i}>{text(item['label'])}</li>)}</ul> : null}<Questions items={s['policies']} ar={ar} policies /></div></div>;
      case 'skincare-story': return <div className="skc-story"><div className="skc-story-copy"><h2 data-skc-reveal={ar ? 'down' : undefined}>{text(s['heading'])}</h2><p data-skc-reveal={ar ? 'up' : undefined}>{text(s['text'])}</p><div data-skc-reveal={ar ? 'cta' : undefined}>{order(s['cta_label'])}</div></div>{frame(s, 'portrait')}</div>;
      case 'skincare-marquee': return rows(s['items']).length ? <div className="skc-marquee"><div>{[false, true].map(repeat => <p key={String(repeat)} aria-hidden={repeat || undefined}>{rows(s['items']).slice(0, 8).map((item, i) => <span key={i}>{text(item['label'])}</span>)}</p>)}</div></div> : null;
      case 'skincare-features': return rows(s['items']).length ? <div className="skc-feature-cover">{photo(s, 'skc-feature-background')}<div className="skc-feature-lines">{rows(s['items']).slice(0, 5).map((item, i) => <h2 key={i} data-skc-reveal={ar ? ['down', 'up', 'zoom', 'review', 'review'][i] : undefined}>{text(item['label'])}</h2>)}</div></div> : null;
      case 'skincare-quote': return text(s['text']) ? <div className="skc-wrap skc-quote"><div className="skc-quote-logos">{rows(s['logos']).slice(0, 4).map((item, i) => photo(item, 'skc-quote-logo') ? <figure key={i}>{photo(item, 'skc-quote-logo')}</figure> : null)}{displayOnly && !rows(s['logos']).length ? ['DEMO', 'SAMPLE', 'STUDIO', 'CATALOG'].map(label => <span key={label}>{label}</span>) : null}</div><blockquote>{text(s['text'])}{text(s['attribution']) ? <cite>{text(s['attribution'])}</cite> : null}</blockquote></div> : null;
      case 'skincare-experiences': return campaignUrl(s['image']) ? <div className="skc-experiences">{text(s['heading']) ? <h2>{text(s['heading'])}</h2> : null}{photo(s, 'skc-mosaic')}</div> : null;
      case 'skincare-reviews': return <Reviews slug={productSlug} settings={s} ar={ar} displayOnly={displayOnly} />;
      case 'skincare-faq': return rows(s['items']).length ? <div className="skc-wrap skc-faq" data-skc-reveal="faq"><div className="skc-faq-copy"><Questions items={s['items']} heading={text(s['heading'])} ar={ar} /></div>{frame(s, 'portrait')}</div> : null;
      default: return null;
    }
  };
  const dock = (): ReactElement | null => product ? <aside className="skc-dock" aria-label={ar ? 'طلب المنتج' : 'Order this product'}><div className="skc-dock-content"><div className="skc-dock-product">{campaignUrl(presentation.image) ? <img src={presentation.image!} alt="" /> : null}<div><strong title={product.name}>{product.name}</strong>{prices()}</div></div>{order(sections[first('purchase')]?.settings?.['cta_label'])}</div></aside> : null;
  return <div ref={root} className="skc-root" id="skc-top" dir={ar ? 'rtl' : 'ltr'} lang={language}>
    {sections.map((section, i) => <section id={`skc-section-${i}`} key={section.id ?? i} data-section-id={section.id} data-skincare-section={section.type} className={customizer.selectedId === section.id ? 'skc-section skc-section-selected' : 'skc-section'}>{render(section, i)}</section>)}
    {first('purchase') < 0 ? <div className="skc-wrap skc-purchase-panel">{checkout}</div> : null}
    <footer className="skc-footer"><div className="skc-wrap"><a className="skc-brand" href="#skc-top">{store.logoUrl ? <img src={store.logoUrl} alt={store.name} /> : store.name}</a><nav aria-label={ar ? 'روابط المتجر' : 'Store links'}>{navigation.footer.flatMap(group => group.children?.length ? group.children : [group]).filter(link => !!link.url).map((link, i) => <a href={link.url ?? undefined} key={`${link.url}-${i}`}>{link.label}</a>)}</nav><address>{store.merchantInformation?.address ? <span>{store.merchantInformation.address}</span> : null}{store.email ? <a href={`mailto:${store.email}`}>{store.email}</a> : null}{store.phone ? <a href={`tel:${store.phone.replace(/[^+\d]/g, '')}`} dir="ltr">{store.phone}</a> : null}</address>{store.identity?.social?.length ? <nav aria-label={ar ? 'روابط التواصل الاجتماعي' : 'Social links'}>{store.identity.social.map(link => <a href={link.url} key={link.url} target="_blank" rel="noopener noreferrer">{link.label}</a>)}</nav> : null}<StorePaymentMarks label={ar ? 'وسائل الدفع' : 'Payment methods'} /><p>© {new Date().getFullYear()} {store.name}</p></div></footer>
    {dock()}
    <dialog ref={dialog} id={menuId} className="skc-menu-dialog" aria-label={ar ? 'أقسام الصفحة' : 'Page sections'} onClose={() => setMenu(false)} onClick={event => { if (event.target === event.currentTarget) closeMenu(); }}><div className="skc-menu-panel"><button type="button" aria-label={ar ? 'إغلاق القائمة' : 'Close page menu'} onClick={closeMenu}><IconClose /></button><nav>{links(true)}</nav></div></dialog>
  </div>;
}
