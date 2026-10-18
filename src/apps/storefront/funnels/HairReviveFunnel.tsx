import { useEffect, useRef, useState, type ReactElement, type ReactNode } from 'react';
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
import { hairVideoEmbed, hairVideoFile } from './hair-model';
import { hairPreview } from './hair-preview';
import { isPreview } from '../preview';
import { NotFoundPage } from '../pages/NotFoundPage';
import { Seo } from '../seo/Seo';
import './hair-revive.css';

interface Props { sections: ReadonlyArray<SectionInstance>; productSlug: string | null; locale?: string }
type Values = Readonly<Record<string, unknown>>;
const text = (value: unknown): string => typeof value === 'string' ? value : '';
const rows = (value: unknown): Values[] => Array.isArray(value) ? value.filter((row): row is Values => !!row && typeof row === 'object' && !Array.isArray(row)).slice(0, 12) : [];

function Announcement({ settings, ar }: { settings: Values; ar: boolean }): ReactElement | null {
  const [now, setNow] = useState(Date.now); const expiry = settings['expires_at']; const remaining = offerRemaining(expiry, now);
  useEffect(() => {
    if (!offerRemaining(expiry, Date.now())) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [expiry]);
  if (!text(settings['announcement']) && !remaining) return null;
  return <div className="hr-announcement"><span>{text(settings['announcement'])}</span>{remaining ? <span role="timer" aria-label={ar ? 'الوقت المتبقي للعرض' : 'Offer ends in'} dir="ltr">{[Math.floor(remaining / 86400), Math.floor(remaining / 3600) % 24, Math.floor(remaining / 60) % 60, remaining % 60].map(n => String(n).padStart(2, '0')).join(' : ')}</span> : null}</div>;
}

function Gallery({ presentation, ar }: { presentation: FunnelPresentation; ar: boolean }): ReactElement {
  const pictures = productPictures(presentation.product, presentation.image);
  const [choice, setChoice] = useState<{ variant: string | null; image: string }>();
  const current = choice?.variant === presentation.image && pictures.includes(choice.image) ? choice.image : pictures[0];
  return <div className="hr-gallery">
    {current ? <img className="hr-gallery-main" src={current} alt={presentation.product?.name || ''} /> : <div className="hr-image-placeholder">{ar ? 'صور المنتج' : 'Product photographs'}</div>}
    <div className="hr-gallery-rail" role="group" aria-label={ar ? 'صور المنتج' : 'Product photographs'}>{pictures.map((src, index) => <button key={src} type="button" aria-label={`${ar ? 'صورة' : 'Image'} ${index + 1}`} aria-pressed={src === current} onClick={() => setChoice({ variant: presentation.image, image: src })}><img src={src} alt={presentation.product?.name || ''} loading={index ? 'lazy' : 'eager'} /></button>)}</div>
  </div>;
}

function NumberedDetails({ settings, ar }: { settings: Values; ar: boolean }): ReactElement | null {
  const items = rows(settings['items']).slice(0, 8); const [selected, setSelected] = useState(0); const current = items[selected] ?? items[0];
  if (!current) return null;
  const image = campaignUrl(current['image']);
  return <div className="hr-wrap hr-factors"><div className="hr-factor-list" data-hr-reveal="right" role="group" aria-label={ar ? 'تفاصيل المنتج' : 'Product details'}>{items.map((item, index) => <button type="button" key={index} onClick={() => setSelected(index)} aria-pressed={item === current}><span>{String(index + 1).padStart(2, '0')}</span><strong>{text(item['heading'])}</strong></button>)}</div><div className="hr-factor-content" data-hr-reveal aria-live="polite">{image ? <img src={image} alt={text(current['image_alt'])} loading="lazy" /> : null}<p>{text(current['text'])}</p></div></div>;
}

function Video({ settings, ar }: { settings: Values; ar: boolean }): ReactElement {
  const [playing, setPlaying] = useState(false); const image = campaignUrl(settings['image']);
  const embed = hairVideoEmbed(settings['video_url']); const file = hairVideoFile(settings['video_url']);
  return <div className="hr-wrap hr-video"><h2>{text(settings['heading'])}</h2><div className="hr-video-frame">{playing && embed ? <iframe src={embed} title={text(settings['heading']) || (ar ? 'فيديو المنتج' : 'Product video')} allow="encrypted-media; picture-in-picture" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /> : file ? <video controls playsInline preload="none" poster={image}><source src={file} /></video> : <>{image ? <img src={image} alt={text(settings['image_alt'])} loading="lazy" /> : null}{embed ? <button type="button" className="hr-video-play" onClick={() => setPlaying(true)} aria-label={ar ? 'تشغيل الفيديو' : 'Play video'}>▶</button> : null}</>}</div></div>;
}

function Questions({ settings, id }: { settings: Values; id: string }): ReactElement | null {
  const [open, setOpen] = useState<number | null>(null); const items = rows(settings['items']);
  if (!items.length) return null;
  return <div className="hr-wrap hr-faq"><h2>{text(settings['heading'])}</h2><div className="hr-faq-grid">{items.map((item, i) => <div className="hr-question" key={i}><h3><button id={`${id}-q-${i}`} type="button" aria-expanded={open === i} aria-controls={`${id}-a-${i}`} onClick={() => setOpen(open === i ? null : i)}>{text(item['question'])}<span aria-hidden="true">{open === i ? '−' : '+'}</span></button></h3><div id={`${id}-a-${i}`} role="region" aria-labelledby={`${id}-q-${i}`} hidden={open !== i}><p>{text(item['answer'])}</p></div></div>)}</div></div>;
}

function Reviews({ slug, heading, ar, presentation, displayOnly }: { slug: string | null; heading: string; ar: boolean; presentation: FunnelPresentation; displayOnly: boolean }): ReactElement | null {
  const { locale } = useLocale(); const query = useAsync(() => slug ? getProductReviews(slug) : Promise.resolve(null), [slug, locale]);
  const examples: ApiReview[] = [1, 2, 3].map(id => ({ id: -id, author_name: ar ? `عميل توضيحي ${id}` : `Sample customer ${id}`, rating: 5, title: ar ? 'نموذج لتنسيق التقييمات' : 'Sample review layout', body: ar ? 'محتوى توضيحي لعرض شكل التقييم في القالب، وليس تقييمًا لمنتج حقيقي.' : 'Sample content showing the template review layout, not a review of a real product.' }));
  const reviews = displayOnly ? examples : query.data?.data ?? [];
  if (!reviews.length) return null;
  const rating = displayOnly ? null : presentation.product?.rating;
  const count = displayOnly ? reviews.length : presentation.product?.reviews_count ?? query.data?.meta?.total ?? reviews.length;
  return <div className="hr-wrap hr-reviews"><div className="hr-reviews-heading"><h2>{heading}</h2><div>{rating != null ? <strong>{Number(rating).toFixed(2)}</strong> : null}<span>{ar ? `${count} ${displayOnly ? 'تقييمات توضيحية' : 'تقييم'}` : `${count} ${displayOnly ? 'sample reviews' : 'reviews'}`}</span></div></div><div className="hr-review-list">{reviews.slice(0, 6).map(review => <article key={review.id}><div className="hr-review-author"><span className="hr-stars" aria-label={`${review.rating} / 5`}>{'★'.repeat(Math.max(0, Math.min(5, Math.round(review.rating))))}</span><strong>{review.author_name || review.customer?.name || (ar ? 'عميل المتجر' : 'Store customer')}</strong>{review.is_verified ? <small>{ar ? 'مشتري موثّق' : 'Verified purchase'}</small> : null}</div><div className="hr-review-copy">{review.title ? <h3>{review.title}</h3> : null}<p>{review.body}</p></div>{review.photos?.length ? <div className="hr-review-photos">{review.photos.slice(0, 2).map((photo, i) => { const src = campaignUrl(typeof photo === 'string' ? photo : photo.src); return src ? <img src={src} alt={ar ? 'صورة أرفقها العميل' : 'Customer photograph'} key={i} loading="lazy" /> : null; })}</div> : null}</article>)}</div></div>;
}

function EditorPreview(props: Props): ReactElement {
  const { locale } = useLocale(); const customizer = useCustomizerState();
  const query = useAsync(() => props.productSlug ? getProduct(props.productSlug) : Promise.resolve(null), [props.productSlug, locale]);
  const product = query.data?.data ?? null; const ar = (customizer.locale ?? props.locale ?? locale) === 'ar';
  return <HairComposition {...props} presentation={{ product, unitPrice: Number(product?.price ?? 0), quantity: 1, ready: false, image: product?.image_url ?? product?.image ?? null }} checkout={<DisabledCheckout ar={ar} editor />} />;
}

function DisabledCheckout({ ar, editor = false }: { ar: boolean; editor?: boolean }): ReactElement {
  return <section id="funnel-checkout" className="sf-funnel-checkout"><h3>{ar ? 'نموذج الطلب' : 'Order form'}</h3><p>{editor ? (ar ? 'معاينة النموذج — اختر تفاصيل المنتج في المعاينة المنفصلة.' : 'Form preview — choose product options in the standalone preview.') : (ar ? 'معاينة توضيحية فقط — لا يمكن إرسال طلب من هذه الصفحة.' : 'Display-only preview — orders cannot be submitted from this page.')}</p><fieldset disabled>{[ar ? 'الاسم' : 'Name', ar ? 'رقم الهاتف' : 'Phone', ar ? 'العنوان' : 'Address'].map(label => <label key={label}>{label}<input placeholder={label} /></label>)}<button type="button" className="hr-button">{ar ? 'تأكيد الطلب (معطّل)' : 'Place order (disabled)'}</button></fieldset></section>;
}

export default function HairReviveFunnel(props: Props): ReactElement {
  const customizer = useCustomizerState();
  return customizer.active ? <EditorPreview {...props} /> : <FunnelCheckout compactHeader productSlug={props.productSlug} renderLayout={(presentation, checkout) => <HairComposition {...props} presentation={presentation} checkout={checkout} />} />;
}

/** No checkout hooks, product reads, analytics events or order forms in the public catalog. */
export function HairTemplatePreview(): ReactElement {
  const { key } = useParams();
  if (!isPreview() || (key !== 'hair-revive-ar' && key !== 'hair-revive-en')) return <NotFoundPage />;
  const locale = key === 'hair-revive-ar' ? 'ar' : 'en'; const ar = locale === 'ar'; const { product, sections } = hairPreview(locale);
  return <div className="hr-template-preview"><Seo title={ar ? 'معاينة قالب العناية بالشعر' : 'Hair Revive template preview'} noindex /><aside className="hr-demo-note" role="status">{ar ? 'بيانات توضيحية — الشراء معطّل' : 'Sample data — checkout disabled'} · <a href="/store/funnels" data-preview-exit>{ar ? 'العودة للقوالب' : 'Back to templates'}</a></aside><HairComposition sections={sections} productSlug={null} locale={locale} displayOnly presentation={{ product, unitPrice: Number(product.price), quantity: 1, ready: false, image: product.image_url ?? null }} checkout={<DisabledCheckout ar={ar} />} /></div>;
}

export function HairComposition({ sections, productSlug, locale: pageLocale, presentation, checkout, displayOnly = false }: Props & { presentation: FunnelPresentation; checkout: ReactElement; displayOnly?: boolean }): ReactElement {
  const { store, navigation } = useStore(); const { locale } = useLocale(); const customizer = useCustomizerState();
  const ar = ((customizer.active ? customizer.locale : null) ?? pageLocale ?? locale) === 'ar'; const product = presentation.product;
  const root = useRef<HTMLDivElement>(null); const menuDialog = useRef<HTMLDialogElement>(null); const [menu, setMenu] = useState(false);
  const first = (type: string): number => sections.findIndex(section => section.type === `hair-${type}`);
  const closeMenu = (): void => { menuDialog.current?.close(); setMenu(false); };
  useEffect(() => { if (menu && !menuDialog.current?.open) menuDialog.current?.showModal(); if (!menu && menuDialog.current?.open) menuDialog.current.close(); }, [menu]);
  useEffect(() => {
    const element = root.current;
    if (!element || !('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches || customizer.active) return;
    element.classList.add('hr-motion');
    const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('hr-visible'); observer.unobserve(entry.target); } }), { threshold: 0.08 });
    element.querySelectorAll('[data-hr-reveal]').forEach(node => observer.observe(node));
    return () => { observer.disconnect(); element.classList.remove('hr-motion'); };
  }, [sections, customizer.active]);
  const order = (label?: unknown, cart = false): ReactElement => <a className="hr-button" href="#funnel-checkout">{text(label) || (ar ? 'اطلب الآن' : 'Order now')}{cart ? <HugeiconsIcon icon={ShoppingCart01Icon} size={22} aria-hidden="true" /> : null}</a>;
  const navigationLinks = (close = false): ReactNode => <>{[['factors', ar ? 'مميزات' : 'Features'], ['faq', ar ? 'أسئلة وأجوبة' : 'Questions & answers'], ['reviews', ar ? 'مراجعات' : 'Reviews']].filter(([type]) => first(type!) >= 0).map(([type, label]) => <a href={`#hr-section-${first(type!)}`} key={type} onClick={close ? closeMenu : undefined}>{label}</a>)}<span onClick={close ? closeMenu : undefined}>{order(undefined, true)}</span></>;
  const image = (settings: Values, className = ''): ReactElement | null => { const src = campaignUrl(settings['image']); return src ? <img className={className} src={src} alt={text(settings['image_alt'])} loading="lazy" /> : null; };
  const render = (section: SectionInstance, index: number): ReactNode => {
    const s = section.settings ?? {};
    switch (section.type) {
      case 'hair-hero': return <><Announcement settings={s} ar={ar} /><header className="hr-header"><div className="hr-wrap"><a className="hr-brand" href="#hr-top">{store.logoUrl ? <img src={store.logoUrl} alt={store.name} /> : store.name}</a><nav aria-label={ar ? 'أقسام الصفحة' : 'Page sections'}>{navigationLinks()}</nav><button type="button" className="hr-menu-toggle" aria-expanded={menu} aria-controls="hr-menu" aria-label={ar ? 'قائمة الصفحة' : 'Page menu'} onClick={() => setMenu(true)}><IconMenu /></button></div></header><div className="hr-hero">{campaignUrl(s['image']) ? <img className="hr-hero-image" src={campaignUrl(s['image'])} alt={text(s['image_alt'])} fetchPriority="high" /> : null}<div className="hr-hero-content hr-wrap"><div data-hr-reveal>{index === first('hero') ? <h1>{text(s['heading'])}</h1> : <h2>{text(s['heading'])}</h2>}{text(s['text']) ? <p>{text(s['text'])}</p> : null}{order(s['cta_label'])}</div>{text(s['badge_value']) || text(s['badge_heading']) || text(s['badge_text']) ? <div className="hr-badge" data-hr-reveal>{text(s['badge_value']) ? <strong>{text(s['badge_value'])}</strong> : null}<div><h3>{text(s['badge_heading'])}</h3><p>{text(s['badge_text'])}</p></div></div> : null}</div></div></>;
      case 'hair-purchase': return index === first('purchase') ? <div className="hr-wrap hr-purchase"><Gallery presentation={presentation} ar={ar} /><div className="hr-purchase-panel"><h2>{text(s['heading']) || product?.name}</h2>{product ? <div className="hr-prices"><strong>{formatMoney(presentation.unitPrice, store.baseCurrency, locale)}</strong>{presentation.comparePrice && presentation.comparePrice > presentation.unitPrice ? <del>{formatMoney(presentation.comparePrice, store.baseCurrency, locale)}</del> : null}</div> : null}<p className="hr-product-description">{text(s['text']) || product?.short_description}</p>{rows(s['highlights']).length ? <ul className="hr-highlights">{rows(s['highlights']).slice(0, 3).map((item, i) => <li key={i}><span aria-hidden="true">✓</span>{text(item['label'])}</li>)}</ul> : null}{checkout}</div></div> : null;
      case 'hair-statement': return <div className="hr-statement"><div className="hr-wrap" data-hr-reveal><h2>{text(s['heading'])}</h2><p>{text(s['text'])}</p></div></div>;
      case 'hair-factors': return <NumberedDetails settings={s} ar={ar} />;
      case 'hair-video': return <Video settings={s} ar={ar} />;
      case 'hair-comparisons': return rows(s['items']).length ? <div className="hr-wrap hr-comparisons"><h2>{text(s['heading'])}</h2>{rows(s['items']).slice(0, 6).map((item, i) => <article key={i} data-hr-reveal><div className="hr-comparison-images">{[['before_image', 'before_label'], ['after_image', 'after_label']].map(([srcKey, labelKey]) => { const src = campaignUrl(item[srcKey!]); return <figure key={srcKey}>{src ? <img src={src} alt={text(item[labelKey!])} loading="lazy" /> : null}<figcaption>{text(item[labelKey!])}</figcaption></figure>; })}</div><div className="hr-comparison-copy"><h3>{text(item['heading'])}</h3><p>{text(item['text'])}</p></div></article>)}</div> : null;
      case 'hair-statistics': return rows(s['items']).length ? <div className="hr-wrap hr-statistics">{image(s)}<div data-hr-reveal>{rows(s['items']).slice(0, 4).map((item, i) => <article key={i}><h3>{text(item['value'])}</h3><p>{text(item['label'])}</p></article>)}</div></div> : null;
      case 'hair-quote': return text(s['text']) ? <figure className="hr-wrap hr-quote" data-hr-reveal><span aria-hidden="true">“</span><blockquote>{text(s['text'])}</blockquote>{text(s['attribution']) ? <figcaption>{text(s['attribution'])}</figcaption> : null}</figure> : null;
      case 'hair-marquee': return rows(s['items']).length ? <div className="hr-marquee"><div>{[false, true].map(repeat => <p key={String(repeat)} aria-hidden={repeat || undefined}>{rows(s['items']).map((item, i) => <span key={i}>{text(item['label'])}</span>)}</p>)}</div></div> : null;
      case 'hair-reviews': return <Reviews slug={productSlug} heading={text(s['heading'])} ar={ar} presentation={presentation} displayOnly={displayOnly} />;
      case 'hair-faq': return <Questions settings={s} id={`hr-section-${index}`} />;
      default: return null;
    }
  };
  const purchase = sections.find(section => section.type === 'hair-purchase');
  return <div ref={root} className="hr-root" id="hr-top" dir={ar ? 'rtl' : 'ltr'} lang={ar ? 'ar' : 'en'}>
    {sections.map((section, i) => <section id={`hr-section-${i}`} key={section.id ?? i} data-section-id={section.id} className={customizer.selectedId === section.id ? 'hr-section hr-section-selected' : 'hr-section'}>{render(section, i)}</section>)}
    {!purchase ? <div className="hr-wrap hr-purchase-panel">{checkout}</div> : null}
    <footer className="hr-footer"><div className="hr-wrap"><strong className="hr-brand">{store.name}</strong><nav aria-label={ar ? 'روابط المتجر' : 'Store links'}>{navigation.footer.flatMap(group => group.children?.length ? group.children : [group]).filter(link => !!link.url).map(link => <a href={link.url ?? undefined} key={link.url}>{link.label}</a>)}</nav><StorePaymentMarks label={ar ? 'وسائل الدفع' : 'Payment methods'} /><p>© {new Date().getFullYear()} {store.name}</p></div></footer>
    <dialog ref={menuDialog} id="hr-menu" className="hr-menu-dialog" aria-label={ar ? 'أقسام الصفحة' : 'Page sections'} onClose={() => setMenu(false)} onClick={event => { if (event.target === event.currentTarget) closeMenu(); }}><div className="hr-menu-panel"><button type="button" className="hr-menu-close" aria-label={ar ? 'إغلاق القائمة' : 'Close page menu'} onClick={closeMenu}><IconClose /></button><nav>{navigationLinks(true)}</nav></div></dialog>
    {product ? <aside className="hr-dock" aria-label={ar ? 'طلب المنتج' : 'Order this product'}><div className="hr-dock-product">{campaignUrl(presentation.image) ? <img src={presentation.image!} alt="" /> : null}<div><strong>{product.name}</strong><span>{formatMoney(presentation.unitPrice, store.baseCurrency, locale)}{presentation.comparePrice && presentation.comparePrice > presentation.unitPrice ? <del>{formatMoney(presentation.comparePrice, store.baseCurrency, locale)}</del> : null}</span></div></div>{order(purchase?.settings?.['cta_label'], true)}</aside> : null}
  </div>;
}
