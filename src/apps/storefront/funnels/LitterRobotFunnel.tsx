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
import { campaignUrl, offerRemaining, productPictures, specificationRows } from './glasses-model';
import { IconMenu, IconClose } from '../foundation/components/icons';
import { litterPreview } from './litter-preview';
import { isPreview } from '../preview';
import { NotFoundPage } from '../pages/NotFoundPage';
import { Seo } from '../seo/Seo';
import './litter-robot.css';

interface Props { sections: ReadonlyArray<SectionInstance>; productSlug: string | null; locale?: string }
type Values = Readonly<Record<string, unknown>>;
const text = (value: unknown): string => typeof value === 'string' ? value : '';
const rows = (value: unknown): Values[] => Array.isArray(value) ? value.filter((row): row is Values => !!row && typeof row === 'object' && !Array.isArray(row)).slice(0, 12) : [];

function Announcement({ settings, ar }: { settings: Values; ar: boolean }): ReactElement | null {
  const [now, setNow] = useState(Date.now); const expiry = settings['expires_at']; const remaining = offerRemaining(expiry, now);
  useEffect(() => { if (!offerRemaining(expiry, Date.now())) return; const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, [expiry]);
  if (!text(settings['announcement']) && remaining === null) return null;
  return <div className="lr-announcement"><span>{text(settings['announcement'])}</span>{remaining !== null ? <span role="timer" aria-label={ar ? 'الوقت المتبقي للعرض' : 'Offer ends in'} dir="ltr">{[Math.floor(remaining / 86400), Math.floor(remaining / 3600) % 24, Math.floor(remaining / 60) % 60, remaining % 60].map(n => String(n).padStart(2, '0')).join(' : ')}</span> : null}</div>;
}

function Gallery({ presentation, ar }: { presentation: FunnelPresentation; ar: boolean }): ReactElement {
  const pictures = productPictures(presentation.product, presentation.image);
  const [choice, setChoice] = useState<{ variant: string | null; image: string }>();
  const current = choice?.variant === presentation.image && pictures.includes(choice.image) ? choice.image : pictures[0];
  return <div className="lr-gallery">{current ? <img className="lr-gallery-main" src={current} alt={presentation.product?.name || ''} /> : <div className="lr-placeholder">{ar ? 'صور المنتج' : 'Product photographs'}</div>}<div className="lr-gallery-rail" role="group" aria-label={ar ? 'صور المنتج' : 'Product photographs'}>{pictures.map((src, index) => <button key={src} type="button" aria-label={`${ar ? 'صورة' : 'Image'} ${index + 1}`} aria-pressed={src === current} onClick={() => setChoice({ variant: presentation.image, image: src })}><img src={src} alt="" loading="lazy" /></button>)}</div></div>;
}

function Questions({ items, heading }: { items: unknown; heading?: string }): ReactElement | null {
  const questions = rows(items); const [open, setOpen] = useState<number | null>(null); const id = useId();
  if (!questions.length) return null;
  return <div className="lr-questions">{heading ? <h2>{heading}</h2> : null}{questions.map((item, i) => <article key={i}><h3><button type="button" aria-expanded={open === i} aria-controls={`${id}-${i}`} onClick={() => setOpen(open === i ? null : i)}>{text(item['question'])}<span aria-hidden="true">{open === i ? '−' : '+'}</span></button></h3><div id={`${id}-${i}`} hidden={open !== i}><p>{text(item['answer'])}</p></div></article>)}</div>;
}

function Reviews({ slug, heading, ar, displayOnly }: { slug: string | null; heading: string; ar: boolean; displayOnly: boolean }): ReactElement | null {
  const { locale } = useLocale(); const query = useAsync(() => slug ? getProductReviews(slug) : Promise.resolve(null), [slug, locale]);
  const sample: ApiReview[] = [1, 2, 3].map(id => ({ id: -id, author_name: ar ? `عميل توضيحي ${id}` : `Sample customer ${id}`, rating: 5, title: ar ? 'مثال لتنسيق التقييم' : 'Sample review layout', body: ar ? 'هذا نص توضيحي لشكل التقييم، وليس تقييمًا لمنتج حقيقي.' : 'Sample content showing the review layout, not a review of a real product.' }));
  const reviews = displayOnly ? sample : query.data?.data ?? [];
  if (!reviews.length) return null;
  return <div className="lr-wrap lr-reviews"><header><h2>{heading}</h2><p>{displayOnly ? (ar ? 'تقييمات توضيحية فقط' : 'Sample reviews only') : (ar ? `${query.data?.meta?.total ?? reviews.length} تقييم` : `${query.data?.meta?.total ?? reviews.length} reviews`)}</p></header><div className="lr-review-list">{reviews.slice(0, 6).map(review => <article key={review.id}><div className="lr-stars" aria-label={`${review.rating} / 5`}>{'★'.repeat(Math.max(0, Math.min(5, Math.round(review.rating))))}</div><strong>{review.author_name || review.customer?.name || (ar ? 'عميل المتجر' : 'Store customer')}</strong>{review.is_verified ? <small>{ar ? 'مشتري موثّق' : 'Verified purchase'}</small> : null}{review.title ? <h3>{review.title}</h3> : null}<p>{review.body}</p>{review.photos?.length ? <div className="lr-review-photos">{review.photos.slice(0, 2).map((photo, i) => { const src = campaignUrl(typeof photo === 'string' ? photo : photo.src); return src ? <img src={src} alt={ar ? 'صورة أرفقها العميل' : 'Customer photograph'} key={i} loading="lazy" /> : null; })}</div> : null}</article>)}</div></div>;
}

function DisabledCheckout({ ar, editor = false }: { ar: boolean; editor?: boolean }): ReactElement {
  return <section id="funnel-checkout" className="sf-funnel-checkout"><h3>{ar ? 'نموذج الطلب' : 'Order form'}</h3><p>{editor ? (ar ? 'معاينة النموذج — اختر تفاصيل المنتج في المعاينة المنفصلة.' : 'Form preview — choose product options in the standalone preview.') : (ar ? 'معاينة توضيحية فقط — الشراء معطّل.' : 'Display-only preview — checkout is disabled.')}</p><fieldset disabled>{[ar ? 'الاسم' : 'Name', ar ? 'رقم الهاتف' : 'Phone', ar ? 'العنوان' : 'Address'].map(label => <label key={label}>{label}<input placeholder={label} /></label>)}<button type="button" className="lr-button">{ar ? 'تأكيد الطلب (معطّل)' : 'Place order (disabled)'}</button></fieldset></section>;
}

function EditorPreview(props: Props): ReactElement {
  const { locale } = useLocale(); const customizer = useCustomizerState();
  const query = useAsync(() => props.productSlug ? getProduct(props.productSlug) : Promise.resolve(null), [props.productSlug, locale]);
  const product = query.data?.data ?? null; const ar = (customizer.locale ?? props.locale ?? locale) === 'ar';
  return <LitterComposition {...props} presentation={{ product, unitPrice: Number(product?.price ?? 0), quantity: 1, ready: false, image: product?.image_url ?? product?.image ?? null }} checkout={<DisabledCheckout ar={ar} editor />} />;
}

export default function LitterRobotFunnel(props: Props): ReactElement {
  const customizer = useCustomizerState();
  return customizer.active ? <EditorPreview {...props} /> : <FunnelCheckout compactHeader productSlug={props.productSlug} renderLayout={(presentation, checkout) => <LitterComposition {...props} presentation={presentation} checkout={checkout} />} />;
}

export function LitterTemplatePreview(): ReactElement {
  const { key } = useParams();
  if (!isPreview() || (key !== 'litter-robot-ar' && key !== 'litter-robot-en')) return <NotFoundPage />;
  const locale = key === 'litter-robot-ar' ? 'ar' : 'en'; const ar = locale === 'ar'; const { product, sections } = litterPreview(locale);
  return <div className="lr-template-preview"><Seo title={ar ? 'معاينة قالب Litter Robot' : 'Litter Robot template preview'} noindex /><aside className="lr-demo-note" role="status">{ar ? 'بيانات توضيحية — الشراء معطّل' : 'Sample data — checkout disabled'} · <a href="/store/funnels" data-preview-exit>{ar ? 'العودة للقوالب' : 'Back to templates'}</a></aside><LitterComposition sections={sections} productSlug={null} locale={locale} displayOnly presentation={{ product, unitPrice: Number(product.price), quantity: 1, ready: false, image: product.image_url ?? null }} checkout={<DisabledCheckout ar={ar} />} /></div>;
}

export function LitterComposition({ sections, productSlug, locale: pageLocale, presentation, checkout, displayOnly = false }: Props & { presentation: FunnelPresentation; checkout: ReactElement; displayOnly?: boolean }): ReactElement {
  const { store, navigation } = useStore(); const { locale } = useLocale(); const customizer = useCustomizerState();
  const ar = ((customizer.active ? customizer.locale : null) ?? pageLocale ?? locale) === 'ar'; const product = presentation.product;
  const root = useRef<HTMLDivElement>(null); const menuDialog = useRef<HTMLDialogElement>(null); const [menu, setMenu] = useState(false); const menuId = useId();
  const first = (type: string): number => sections.findIndex(section => section.type === `litter-${type}`);
  const closeMenu = (): void => { menuDialog.current?.close(); setMenu(false); };
  useEffect(() => { if (menu && !menuDialog.current?.open) menuDialog.current?.showModal(); if (!menu && menuDialog.current?.open) menuDialog.current.close(); }, [menu]);
  useEffect(() => {
    const element = root.current;
    if (!element || !('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches || customizer.active) return;
    element.classList.add('lr-motion'); const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('lr-visible'); observer.unobserve(entry.target); } }), { threshold: 0.06 });
    element.querySelectorAll('[data-lr-reveal]').forEach(node => observer.observe(node));
    return () => { observer.disconnect(); element.classList.remove('lr-motion'); };
  }, [sections, customizer.active]);
  const order = (label?: unknown, close = false): ReactElement => <a className="lr-button" href="#funnel-checkout" onClick={close ? closeMenu : undefined}>{text(label) || (ar ? 'اطلب الآن' : 'Order now')}<HugeiconsIcon icon={ShoppingCart01Icon} size={20} aria-hidden="true" /></a>;
  const navigationLinks = (close = false): ReactNode => <>{[['feature-cards', ar ? 'مميزات' : 'Features'], ['faq', ar ? 'أسئلة وأجوبة' : 'Questions & answers'], ['reviews', ar ? 'مراجعات' : 'Reviews']].filter(([type]) => first(type!) >= 0).map(([type, label]) => <a href={`#lr-section-${first(type!)}`} key={type} onClick={close ? closeMenu : undefined}>{label}</a>)}<span onClick={close ? closeMenu : undefined}>{order()}</span></>;
  const image = (s: Values, cls = ''): ReactElement | null => campaignUrl(s['image']) ? <img className={cls} src={campaignUrl(s['image'])} alt={text(s['image_alt'])} loading="lazy" /> : null;
  const cards = (s: Values, cls: string): ReactElement => <div className={cls}>{rows(s['items']).slice(0, 8).map((item, i) => <article key={i} data-lr-reveal>{image(item)}<div><h3>{text(item['heading'])}</h3><p>{text(item['text'])}</p></div></article>)}</div>;
  const render = (section: SectionInstance, index: number): ReactNode => {
    const s = section.settings ?? {};
    switch (section.type) {
      case 'litter-hero': return <><Announcement settings={s} ar={ar} /><header className="lr-header"><div className="lr-wrap"><a className="lr-brand" href="#lr-top">{store.logoUrl ? <img src={store.logoUrl} alt={store.name} /> : store.name}</a><nav aria-label={ar ? 'أقسام الصفحة' : 'Page sections'}>{navigationLinks()}</nav><button type="button" className="lr-menu-toggle" aria-expanded={menu} aria-controls={menuId} aria-label={ar ? 'قائمة الصفحة' : 'Page menu'} onClick={() => setMenu(true)}><IconMenu /></button></div></header><div className="lr-hero">{campaignUrl(s['image']) ? <img src={campaignUrl(s['image'])} alt={text(s['image_alt'])} fetchPriority="high" /> : null}<div className="lr-hero-copy lr-wrap"><p>{text(s['eyebrow'])}</p>{index === first('hero') ? <h1>{text(s['heading'])}</h1> : <h2>{text(s['heading'])}</h2>}{text(s['text']) ? <p>{text(s['text'])}</p> : null}{order(s['cta_label'])}</div>{text(s['offer_heading']) || text(s['offer_text']) || text(s['offer_value']) ? <div className="lr-offer"><div><h2>{text(s['offer_heading'])}</h2><p>{text(s['offer_text'])}</p></div><strong>{text(s['offer_value'])}</strong></div> : null}</div></>;
      case 'litter-purchase': return index === first('purchase') ? <div className="lr-wrap lr-purchase"><Gallery presentation={presentation} ar={ar} /><div className="lr-purchase-panel"><h2>{text(s['heading']) || product?.name}</h2>{product ? <div className="lr-prices"><strong>{formatMoney(presentation.unitPrice, store.baseCurrency, locale)}</strong>{presentation.comparePrice && presentation.comparePrice > presentation.unitPrice ? <del>{formatMoney(presentation.comparePrice, store.baseCurrency, locale)}</del> : null}</div> : null}<p>{text(s['text']) || product?.short_description}</p>{checkout}</div></div> : null;
      case 'litter-assurances': return <div className="lr-wrap lr-assurances"><h2>{text(s['heading'])}</h2>{cards(s, 'lr-assurance-cards')}<Questions items={s['questions']} /></div>;
      case 'litter-specifications': return <div className="lr-wrap lr-specifications">{rows(s['items']).slice(0, 2).map((item, i) => <figure key={i} data-lr-reveal>{image(item)}<dl>{rows(item['labels']).map((label, j) => <div key={j}><dt>{text(label['label'])}</dt><dd>{text(label['value'])}</dd></div>)}</dl></figure>)}</div>;
      case 'litter-feature-cards': return <div className="lr-wrap">{cards(s, 'lr-feature-cards')}</div>;
      case 'litter-feature-orbit': return <div className="lr-wrap lr-orbit">{image(s, 'lr-orbit-image')}{cards({ ...s, items: rows(s['items']).slice(0, 4) }, 'lr-orbit-features')}</div>;
      case 'litter-technical': { const supplied = rows(s['items']); const specs = supplied.length ? supplied : specificationRows(product).map(item => ({ heading: item.label, text: item.value })); return <div className="lr-wrap lr-technical">{image(s)}<div><h2>{text(s['heading'])}</h2>{cards({ items: specs }, 'lr-technical-features')}</div></div>; }
      case 'litter-editorial': return <div className="lr-wrap"><div className="lr-editorial">{image(s)}<div data-lr-reveal><h2>{text(s['heading'])}</h2><p>{text(s['text'])}</p>{text(s['cta_label']) ? order(s['cta_label']) : null}</div></div></div>;
      case 'litter-feature-rows': return <div className="lr-wrap lr-feature-rows">{image(campaignUrl(s['image']) ? s : rows(s['items'])[0] ?? {}, 'lr-feature-rows-image')}<div>{rows(s['items']).slice(0, 3).map((item, i) => <article key={i} data-lr-reveal><h3>{text(item['heading'])}</h3><p>{text(item['text'])}</p></article>)}</div></div>;
      case 'litter-quote': return text(s['text']) ? <figure className="lr-quote"><div className="lr-wrap"><div className="lr-quote-images">{rows(s['images']).slice(0, 4).map((item, i) => <span key={i}>{image(item)}</span>)}</div><blockquote>{text(s['text'])}</blockquote>{text(s['attribution']) ? <figcaption>{text(s['attribution'])}</figcaption> : null}</div></figure> : null;
      case 'litter-marquee': return rows(s['items']).length ? <div className="lr-marquee"><div>{[false, true].map(repeat => <p key={String(repeat)} aria-hidden={repeat || undefined}>{rows(s['items']).map((item, i) => <span key={i}>{text(item['label'])}</span>)}</p>)}</div></div> : null;
      case 'litter-reviews': return <Reviews slug={productSlug} heading={text(s['heading'])} ar={ar} displayOnly={displayOnly} />;
      case 'litter-faq': return <div className="lr-wrap lr-faq"><Questions items={s['items']} heading={text(s['heading'])} /></div>;
      default: return null;
    }
  };
  const dock = (inMenu = false): ReactElement | null => product ? <aside className={`lr-dock ${inMenu ? 'lr-menu-dock' : 'lr-page-dock'}`} aria-label={ar ? 'طلب المنتج' : 'Order this product'}><div>{campaignUrl(presentation.image) ? <img src={presentation.image!} alt="" /> : null}<div><strong title={product.name}>{product.name}</strong><span>{formatMoney(presentation.unitPrice, store.baseCurrency, locale)}{presentation.comparePrice && presentation.comparePrice > presentation.unitPrice ? <del>{formatMoney(presentation.comparePrice, store.baseCurrency, locale)}</del> : null}</span></div></div>{order(sections[first('purchase')]?.settings?.['cta_label'], inMenu)}</aside> : null;
  return <div ref={root} className="lr-root" id="lr-top" dir={ar ? 'rtl' : 'ltr'} lang={ar ? 'ar' : 'en'}>
    {sections.map((section, i) => <section id={`lr-section-${i}`} key={section.id ?? i} data-section-id={section.id} data-litter-section={section.type} className={customizer.selectedId === section.id ? 'lr-section lr-section-selected' : 'lr-section'}>{render(section, i)}</section>)}
    {first('purchase') < 0 ? <div className="lr-wrap lr-purchase-panel">{checkout}</div> : null}
    <footer className="lr-footer"><div className="lr-wrap"><a className="lr-brand" href="#lr-top">{store.logoUrl ? <img src={store.logoUrl} alt={store.name} /> : store.name}</a><nav aria-label={ar ? 'روابط المتجر' : 'Store links'}>{navigation.footer.flatMap(group => group.children?.length ? group.children : [group]).filter(link => !!link.url).map(link => <a href={link.url ?? undefined} key={link.url}>{link.label}</a>)}</nav><address>{store.merchantInformation?.address ? <span>{store.merchantInformation.address}</span> : null}{store.email ? <a href={`mailto:${store.email}`}>{store.email}</a> : null}{store.phone ? <a href={`tel:${store.phone.replace(/[^+\d]/g, '')}`} dir="ltr">{store.phone}</a> : null}</address>{store.identity?.social?.length ? <nav aria-label={ar ? 'روابط التواصل الاجتماعي' : 'Social links'}>{store.identity.social.map(link => <a href={link.url} key={link.url} target="_blank" rel="noopener noreferrer">{link.label}</a>)}</nav> : null}<StorePaymentMarks label={ar ? 'وسائل الدفع' : 'Payment methods'} /><p>© {new Date().getFullYear()} {store.name}</p></div></footer>
    {dock()}
    <dialog ref={menuDialog} id={menuId} className="lr-menu-dialog" aria-label={ar ? 'أقسام الصفحة' : 'Page sections'} onClose={() => setMenu(false)} onClick={event => { if (event.target === event.currentTarget) closeMenu(); }}><div className="lr-menu-panel"><button type="button" aria-label={ar ? 'إغلاق القائمة' : 'Close page menu'} onClick={closeMenu}><IconClose /></button><nav>{navigationLinks(true)}</nav></div>{dock(true)}</dialog>
  </div>;
}
