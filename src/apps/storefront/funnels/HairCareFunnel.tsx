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
import { hairCarePreview } from './hair-care-preview';
import { isPreview } from '../preview';
import { NotFoundPage } from '../pages/NotFoundPage';
import { Seo } from '../seo/Seo';
import './hair-care.css';

interface Props { sections: ReadonlyArray<SectionInstance>; productSlug: string | null; locale?: string }
type Values = Readonly<Record<string, unknown>>;
const text = (value: unknown): string => typeof value === 'string' ? value : '';
const rows = (value: unknown): Values[] => Array.isArray(value) ? value.filter((row): row is Values => !!row && typeof row === 'object' && !Array.isArray(row)).slice(0, 12) : [];

function Announcement({ settings, ar }: { settings: Values; ar: boolean }): ReactElement | null {
  const [now, setNow] = useState(Date.now); const expiry = settings['expires_at']; const remaining = offerRemaining(expiry, now);
  useEffect(() => { if (!offerRemaining(expiry, Date.now())) return; const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, [expiry]);
  if (!text(settings['announcement']) && !remaining) return null;
  return <div className="hc-announcement"><span>{text(settings['announcement'])}</span>{remaining !== null && remaining > 0 ? <span role="timer" aria-label={ar ? 'الوقت المتبقي للعرض' : 'Offer ends in'} dir="ltr">{[Math.floor(remaining / 86400), Math.floor(remaining / 3600) % 24, Math.floor(remaining / 60) % 60, remaining % 60].map(n => String(n).padStart(2, '0')).join(' : ')}</span> : null}</div>;
}

function Gallery({ presentation, ar }: { presentation: FunnelPresentation; ar: boolean }): ReactElement {
  const pictures = productPictures(presentation.product, presentation.image);
  const [choice, setChoice] = useState<{ variant: string | null; image: string }>();
  const current = choice?.variant === presentation.image && pictures.includes(choice.image) ? choice.image : pictures[0];
  return <div className="hc-gallery" data-hc-reveal="zoom">{current ? <img className="hc-gallery-main" src={current} alt={presentation.product?.name || ''} /> : <div className="hc-placeholder">{ar ? 'صور المنتج' : 'Product photographs'}</div>}<div className="hc-gallery-rail" role="group" aria-label={ar ? 'صور المنتج' : 'Product photographs'}>{pictures.map((src, index) => <button key={src} type="button" aria-label={`${ar ? 'صورة' : 'Image'} ${index + 1}`} aria-pressed={src === current} onClick={() => setChoice({ variant: presentation.image, image: src })}><img src={src} alt="" loading="lazy" /></button>)}</div></div>;
}

function Questions({ items, heading }: { items: unknown; heading?: string }): ReactElement | null {
  const questions = rows(items); const [open, setOpen] = useState<number | null>(null); const id = useId();
  if (!questions.length) return null;
  return <div className="hc-questions">{heading ? <h2>{heading}</h2> : null}{questions.map((item, i) => <article key={i}><h3><button type="button" aria-expanded={open === i} aria-controls={`${id}-${i}`} onClick={() => setOpen(open === i ? null : i)}>{text(item['question'])}<span aria-hidden="true">{open === i ? '−' : '+'}</span></button></h3><div id={`${id}-${i}`} hidden={open !== i}><p>{text(item['answer'])}</p></div></article>)}</div>;
}

function Reviews({ slug, heading, ar, displayOnly }: { slug: string | null; heading: string; ar: boolean; displayOnly: boolean }): ReactElement | null {
  const { locale } = useLocale(); const query = useAsync(() => slug ? getProductReviews(slug) : Promise.resolve(null), [slug, locale]);
  const sample: ApiReview[] = [1, 2, 3, 4].map(id => ({ id: -id, author_name: ar ? `عميل توضيحي ${id}` : `Sample customer ${id}`, rating: 5, title: ar ? 'مثال لتنسيق التقييم' : 'Sample review layout', body: ar ? 'هذا نص توضيحي لشكل التقييم، وليس تقييمًا لمنتج حقيقي.' : 'Sample content showing the review layout, not a review of a real product.' }));
  const reviews = displayOnly ? sample : query.data?.data ?? [];
  if (!reviews.length) return <div className="hc-wrap hc-reviews"><header><h2>{heading}</h2><p role="status">{query.loading ? (ar ? 'جارٍ تحميل التقييمات…' : 'Loading reviews…') : query.error ? (ar ? 'تعذّر تحميل التقييمات.' : 'Reviews are temporarily unavailable.') : (ar ? 'لا توجد تقييمات لهذا المنتج بعد.' : 'There are no reviews for this product yet.')}</p>{query.error ? <button type="button" className="hc-button" onClick={query.reload}>{ar ? 'إعادة المحاولة' : 'Retry'}</button> : null}</header></div>;
  return <div className="hc-wrap hc-reviews"><header><h2>{heading}</h2><p>{displayOnly ? (ar ? 'تقييمات توضيحية فقط' : 'Sample reviews only') : (ar ? `${query.data?.meta?.total ?? reviews.length} تقييم` : `${query.data?.meta?.total ?? reviews.length} reviews`)}</p></header><div className="hc-review-list" data-hc-reveal="fade" role="region" aria-label={ar ? 'تقييمات العملاء' : 'Customer reviews'} tabIndex={0}>{reviews.slice(0, 6).map(review => <article key={review.id}><strong>{review.author_name || review.customer?.name || (ar ? 'عميل المتجر' : 'Store customer')}</strong><div className="hc-stars" aria-label={`${review.rating} / 5`}>{'★'.repeat(Math.max(0, Math.min(5, Math.round(review.rating))))}</div>{review.is_verified ? <small>{ar ? 'مشتري موثّق' : 'Verified purchase'}</small> : null}{review.title ? <h3>{review.title}</h3> : null}<p>{review.body}</p>{review.photos?.length ? <div className="hc-review-photos">{review.photos.slice(0, 2).map((photo, i) => { const src = campaignUrl(typeof photo === 'string' ? photo : photo.src); return src ? <img src={src} alt={ar ? 'صورة أرفقها العميل' : 'Customer photograph'} key={i} loading="lazy" /> : null; })}</div> : null}</article>)}</div></div>;
}

function DisabledCheckout({ ar, editor = false }: { ar: boolean; editor?: boolean }): ReactElement {
  return <section id="funnel-checkout" className="sf-funnel-checkout"><h3>{ar ? 'نموذج الطلب' : 'Order form'}</h3><p>{editor ? (ar ? 'معاينة النموذج — اختر تفاصيل المنتج في المعاينة المنفصلة.' : 'Form preview — choose product options in the standalone preview.') : (ar ? 'معاينة توضيحية فقط — الشراء معطّل.' : 'Display-only preview — checkout is disabled.')}</p><fieldset disabled>{[ar ? 'الاسم' : 'Name', ar ? 'رقم الهاتف' : 'Phone', ar ? 'العنوان' : 'Address'].map(label => <label key={label}>{label}<input placeholder={label} /></label>)}<button type="button" className="hc-button">{ar ? 'تأكيد الطلب (معطّل)' : 'Place order (disabled)'}</button></fieldset></section>;
}

function EditorPreview(props: Props): ReactElement {
  const { locale } = useLocale(); const customizer = useCustomizerState();
  const query = useAsync(() => props.productSlug ? getProduct(props.productSlug) : Promise.resolve(null), [props.productSlug, locale]);
  const product = query.data?.data ?? null; const ar = (customizer.locale ?? props.locale ?? locale) === 'ar';
  return <HairCareComposition {...props} presentation={{ product, unitPrice: Number(product?.price ?? 0), quantity: 1, ready: false, image: product?.image_url ?? product?.image ?? null }} checkout={<DisabledCheckout ar={ar} editor />} />;
}

export default function HairCareFunnel(props: Props): ReactElement {
  const customizer = useCustomizerState();
  return customizer.active ? <EditorPreview {...props} /> : <FunnelCheckout compactHeader productSlug={props.productSlug} renderLayout={(presentation, checkout) => <HairCareComposition {...props} presentation={presentation} checkout={checkout} />} />;
}

export function HairCareTemplatePreview(): ReactElement {
  const { key } = useParams();
  if (!isPreview() || (key !== 'hair-care-ar' && key !== 'hair-care-en')) return <NotFoundPage />;
  const locale = key === 'hair-care-ar' ? 'ar' : 'en'; const ar = locale === 'ar'; const { product, sections } = hairCarePreview(locale);
  return <div className="hc-template-preview"><Seo title={ar ? 'معاينة قالب Hair Care' : 'Hair Care template preview'} noindex /><aside className="hc-demo-note" role="status">{ar ? 'بيانات توضيحية — الشراء معطّل' : 'Sample data — checkout disabled'} · <a href="/store/funnels" data-preview-exit>{ar ? 'العودة للقوالب' : 'Back to templates'}</a></aside><HairCareComposition sections={sections} productSlug={null} locale={locale} displayOnly presentation={{ product, unitPrice: Number(product.price), quantity: 1, ready: false, image: product.image_url ?? null }} checkout={<DisabledCheckout ar={ar} />} /></div>;
}

function DetailIcon({ index, service = false }: { index: number; service?: boolean }): ReactElement {
  const paths = service ? [
    'M2 6h12v11H2z M14 10h4l4 4v3h-8 M5 17a2 2 0 1 0 4 0 M16 17a2 2 0 1 0 4 0',
    'M4 13v-2a8 8 0 0 1 16 0v2 M4 12H2v7h4v-7z M18 12h4v7h-4z M20 19c0 3-4 3-8 3',
    'M5 7a8 8 0 1 1-1 9 M5 3v5H1 M8 12h8 M8 16h5',
    'M5 10V7a7 7 0 0 1 14 0v3 M3 10h18v12H3z M12 14v4',
  ] : [
    'M5 13h14l-2 8H7z M8 11c-4-4 0-5 0-9 M13 11c-3-3 2-5 1-8 M18 11c-2-3 2-4 2-6',
    'M12 2c5 0 7 4 7 9 0 6-3 10-7 10s-7-4-7-10c0-5 2-9 7-9z M8 10h1 M15 10h1 M9 15c2 2 4 2 6 0 M3 6l1-2 M21 6l-1-2',
    'M4 4l5-2 5 14-5 2z M7 3l1 3 M10 18v4h10v-4 M17 17l4-13 M16 3l2 1 M15 12l-1 5',
  ];
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[index % paths.length]} /></svg>;
}

export function HairCareComposition({ sections, productSlug, locale: pageLocale, presentation, checkout, displayOnly = false }: Props & { presentation: FunnelPresentation; checkout: ReactElement; displayOnly?: boolean }): ReactElement {
  const { store, navigation } = useStore(); const { locale } = useLocale(); const customizer = useCustomizerState();
  const ar = ((customizer.active ? customizer.locale : null) ?? pageLocale ?? locale) === 'ar'; const product = presentation.product;
  const language = ar ? 'ar' : 'en'; const root = useRef<HTMLDivElement>(null); const dialog = useRef<HTMLDialogElement>(null); const [menu, setMenu] = useState(false); const menuId = useId();
  const first = (type: string): number => sections.findIndex(section => section.type === `haircare-${type}`);
  const closeMenu = (): void => { dialog.current?.close(); setMenu(false); };
  useEffect(() => { if (menu && !dialog.current?.open) dialog.current?.showModal(); if (!menu && dialog.current?.open) dialog.current.close(); }, [menu]);
  useEffect(() => {
    const element = root.current;
    if (!element || !('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches || customizer.active) return;
    element.classList.add('hc-motion'); const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('hc-visible'); observer.unobserve(entry.target); } }), { threshold: 0.06 });
    element.querySelectorAll('[data-hc-reveal]').forEach(node => observer.observe(node));
    return () => { observer.disconnect(); element.classList.remove('hc-motion'); };
  }, [sections, customizer.active]);
  const order = (label?: unknown, close = false, reveal = false): ReactElement => <a data-hc-reveal={reveal ? 'cta' : undefined} className="hc-button" href="#funnel-checkout" onClick={close ? closeMenu : undefined}>{text(label) || (ar ? 'اطلب الآن' : 'Order now')}<HugeiconsIcon icon={ShoppingCart01Icon} size={20} aria-hidden="true" /></a>;
  const links = (close = false): ReactNode => <>{[['features', ar ? 'مميزات' : 'Features'], ['faq', ar ? 'أسئلة وأجوبة' : 'Questions & answers'], ['reviews', ar ? 'مراجعات' : 'Reviews']].filter(([type]) => first(type!) >= 0).map(([type, label]) => <a href={`#hc-section-${first(type!)}`} key={type} onClick={close ? closeMenu : undefined}>{label}</a>)}{order(undefined, close)}</>;
  const photo = (s: Values, cls = ''): ReactElement | null => campaignUrl(s['image']) ? <img className={cls} data-hc-reveal="zoom" src={campaignUrl(s['image'])} alt={text(s['image_alt'])} loading="lazy" /> : null;
  const prices = (): ReactElement => <div className="hc-prices"><strong>{formatMoney(presentation.unitPrice, store.baseCurrency, language)}</strong>{presentation.comparePrice && presentation.comparePrice > presentation.unitPrice ? <><del>{formatMoney(presentation.comparePrice, store.baseCurrency, language)}</del><small className="hc-discount">{ar ? 'خصم ' : ''}{Math.round((presentation.comparePrice - presentation.unitPrice) / presentation.comparePrice * 100)}%{ar ? '' : ' off'}</small></> : null}</div>;
  const rating = product?.rating; const count = product?.reviews_count ?? 0;
  const render = (section: SectionInstance, index: number): ReactNode => {
    const s = section.settings ?? {};
    switch (section.type) {
      case 'haircare-hero': return <><Announcement settings={s} ar={ar} /><div className="hc-campaign-wrap"><div className="hc-campaign">{campaignUrl(s['image']) ? <img className="hc-cover" src={campaignUrl(s['image'])} alt={text(s['image_alt'])} fetchPriority="high" /> : null}<header className="hc-header"><a className="hc-brand" href="#hc-top">{store.logoUrl ? <img src={store.logoUrl} alt={store.name} /> : store.name}</a><nav aria-label={ar ? 'أقسام الصفحة' : 'Page sections'}>{links()}</nav><button type="button" className="hc-menu-toggle" aria-expanded={menu} aria-controls={menuId} aria-label={ar ? 'قائمة الصفحة' : 'Page menu'} onClick={() => setMenu(true)}><IconMenu /></button></header><div className="hc-hero"><div data-hc-reveal="down">{index === first('hero') ? <h1>{text(s['heading'])}</h1> : <h2>{text(s['heading'])}</h2>}</div>{text(s['text']) ? <p data-hc-reveal="up">{text(s['text'])}</p> : null}{count > 0 && rating != null ? <div className="hc-rating"><span className="hc-stars" aria-hidden="true">★★★★★</span><strong>{Number(rating).toFixed(1)}</strong><span>{ar ? `(${count} تقييم)` : `(${count} reviews)`}</span></div> : null}{order(s['cta_label'], false, true)}</div></div></div></>;
      case 'haircare-intro': return <div className="hc-wrap"><div className="hc-intro"><div className="hc-intro-copy"><h2 data-hc-reveal="down">{text(s['heading'])}</h2><p data-hc-reveal="up">{text(s['text'])}</p>{order(s['cta_label'], false, true)}</div><div className="hc-intro-photos" aria-hidden="true">{rows(s['photos']).slice(0, 3).map((item, i) => <figure key={i}>{photo(item)}</figure>)}</div>{rows(s['badges']).length ? <div className="hc-badges">{rows(s['badges']).slice(0, 4).map((item, i) => <span key={i}>{text(item['label'])}</span>)}</div> : null}</div></div>;
      case 'haircare-purchase': return index === first('purchase') ? <div className="hc-wrap hc-purchase"><Gallery presentation={presentation} ar={ar} /><div className="hc-purchase-panel"><h2>{text(s['heading']) || product?.name}</h2>{product ? prices() : null}{text(s['text']) || product?.short_description ? <p>{text(s['text']) || product?.short_description}</p> : null}{checkout}</div></div> : null;
      case 'haircare-details': return <div className="hc-wrap hc-details">{photo(s, 'hc-details-photo')}<div className="hc-details-panel" data-hc-reveal="panel">{rows(s['items']).slice(0, 3).map((item, i) => <article key={i}><span className="hc-detail-icon" data-hc-reveal="icon"><DetailIcon index={i} /></span><div><h3>{text(item['heading'])}</h3><p>{text(item['text'])}</p></div></article>)}</div></div>;
      case 'haircare-marquee': return rows(s['items']).length ? <div className="hc-marquee"><div>{[false, true].map(repeat => <p key={String(repeat)} aria-hidden={repeat || undefined}>{rows(s['items']).map((item, i) => <span key={i}>{text(item['label'])}</span>)}</p>)}</div></div> : null;
      case 'haircare-features': return <div className="hc-wrap hc-features">{rows(s['items']).slice(0, 3).map((item, i) => <article className={`hc-feature hc-feature-${i}`} key={i}>{photo(item)}<div><h2 data-hc-reveal="down">{text(item['heading'])}</h2><p data-hc-reveal="up">{text(item['text'])}</p>{text(item['cta_label']) ? order(item['cta_label']) : null}</div></article>)}</div>;
      case 'haircare-assurances': return rows(s['items']).length ? <div className="hc-wrap hc-assurances">{rows(s['items']).slice(0, 4).map((item, i) => <article key={i} data-hc-reveal="up"><DetailIcon index={i} service /><h3>{text(item['heading'])}</h3>{text(item['text']) ? <p>{text(item['text'])}</p> : null}</article>)}</div> : null;
      case 'haircare-reviews': return <Reviews slug={productSlug} heading={text(s['heading'])} ar={ar} displayOnly={displayOnly} />;
      case 'haircare-faq': return rows(s['items']).length ? <div className="hc-wrap hc-faq" data-hc-reveal="faq"><Questions items={s['items']} heading={text(s['heading'])} /></div> : null;
      default: return null;
    }
  };
  const dock = (): ReactElement | null => product ? <aside className="hc-dock" aria-label={ar ? 'طلب المنتج' : 'Order this product'}><div>{campaignUrl(presentation.image) ? <img src={presentation.image!} alt="" /> : null}<div><strong title={product.name}>{product.name}</strong>{prices()}</div></div>{order(sections[first('purchase')]?.settings?.['cta_label'])}</aside> : null;
  return <div ref={root} className="hc-root" id="hc-top" dir={ar ? 'rtl' : 'ltr'} lang={language}>
    {sections.map((section, i) => <section id={`hc-section-${i}`} key={section.id ?? i} data-section-id={section.id} data-haircare-section={section.type} className={customizer.selectedId === section.id ? 'hc-section hc-section-selected' : 'hc-section'}>{render(section, i)}</section>)}
    {first('purchase') < 0 ? <div className="hc-wrap hc-purchase-panel">{checkout}</div> : null}
    <footer className="hc-footer"><div className="hc-wrap"><a className="hc-brand" href="#hc-top">{store.logoUrl ? <img src={store.logoUrl} alt={store.name} /> : store.name}</a><nav aria-label={ar ? 'روابط المتجر' : 'Store links'}>{navigation.footer.flatMap(group => group.children?.length ? group.children : [group]).filter(link => !!link.url).map(link => <a href={link.url ?? undefined} key={link.url}>{link.label}</a>)}</nav><address>{store.merchantInformation?.address ? <span>{store.merchantInformation.address}</span> : null}{store.email ? <a href={`mailto:${store.email}`}>{store.email}</a> : null}{store.phone ? <a href={`tel:${store.phone.replace(/[^+\d]/g, '')}`} dir="ltr">{store.phone}</a> : null}</address>{store.identity?.social?.length ? <nav aria-label={ar ? 'روابط التواصل الاجتماعي' : 'Social links'}>{store.identity.social.map(link => <a href={link.url} key={link.url} target="_blank" rel="noopener noreferrer">{link.label}</a>)}</nav> : null}<StorePaymentMarks label={ar ? 'وسائل الدفع' : 'Payment methods'} /><p>© {new Date().getFullYear()} {store.name}</p></div></footer>
    {dock()}
    <dialog ref={dialog} id={menuId} className="hc-menu-dialog" aria-label={ar ? 'أقسام الصفحة' : 'Page sections'} onClose={() => setMenu(false)} onClick={event => { if (event.target === event.currentTarget) closeMenu(); }}><div className="hc-menu-panel"><button type="button" aria-label={ar ? 'إغلاق القائمة' : 'Close page menu'} onClick={closeMenu}><IconClose /></button><nav>{links(true)}</nav></div></dialog>
  </div>;
}

