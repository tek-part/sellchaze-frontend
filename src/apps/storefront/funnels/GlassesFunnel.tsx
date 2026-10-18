import { useEffect, useState, type ReactElement, type ReactNode } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import ShoppingCart01Icon from '@hugeicons/core-free-icons/ShoppingCart01Icon';
import { useParams } from 'react-router-dom';
import type { SectionInstance } from '../theme-engine/rendering';
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
import { glassesPreview } from './glasses-preview';
import { isPreview } from '../preview';
import { NotFoundPage } from '../pages/NotFoundPage';
import { Seo } from '../seo/Seo';
import './glasses.css';

interface Props { sections: ReadonlyArray<SectionInstance>; productSlug: string | null; locale?: string }
type Values = Readonly<Record<string, unknown>>;
const text = (value: unknown): string => typeof value === 'string' ? value : '';
const rows = (value: unknown): Values[] => Array.isArray(value) ? value.filter((row): row is Values => !!row && typeof row === 'object' && !Array.isArray(row)).slice(0, 12) : [];

function Announcement({ settings, ar }: { settings: Values; ar: boolean }): ReactElement | null {
  const [now, setNow] = useState(Date.now);
  const expiry = settings['expires_at'];
  const remaining = offerRemaining(expiry, now);
  useEffect(() => {
    if (offerRemaining(expiry, Date.now()) === null || offerRemaining(expiry, Date.now()) === 0) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [expiry]);
  const label = text(settings['announcement']);
  if (!label && !remaining) return null;
  return <div className="gf-announcement"><span>{label}</span>{remaining ? <span role="timer" aria-label={ar ? 'الوقت المتبقي للعرض' : 'Offer ends in'} dir="ltr">{[Math.floor(remaining / 86400), Math.floor(remaining / 3600) % 24, Math.floor(remaining / 60) % 60, remaining % 60].map(n => String(n).padStart(2, '0')).join(' : ')}</span> : null}</div>;
}

function Gallery({ presentation, ar }: { presentation: FunnelPresentation; ar: boolean }): ReactElement {
  const pictures = productPictures(presentation.product, presentation.image);
  const [chosen, setChosen] = useState<{ image: string; selected: string | null }>();
  const current = chosen?.selected === presentation.image && pictures.includes(chosen.image) ? chosen.image : pictures[0];
  return <div className="gf-gallery">{current ? <img className="gf-gallery-main" src={current} alt={presentation.product?.name || ''} /> : <div className="gf-gallery-empty" role="status">{ar ? 'صور المنتج' : 'Product images'}</div>}
    {pictures.length > 1 ? <div className="gf-gallery-thumbs" role="group" aria-label={ar ? 'صور المنتج' : 'Product images'}>{pictures.map((url, i) => <button type="button" key={url} onClick={() => setChosen({ image: url, selected: presentation.image })} aria-label={`${ar ? 'صورة' : 'Image'} ${i + 1}`} aria-pressed={url === current}><img src={url} alt="" loading="lazy" /></button>)}</div> : null}
  </div>;
}

function Reviews({ slug, heading, ar }: { slug: string | null; heading: string; ar: boolean }): ReactElement | null {
  const { locale } = useLocale();
  const query = useAsync(() => slug ? getProductReviews(slug) : Promise.resolve(null), [slug, locale]);
  if (!query.data?.data.length) return null;
  return <div className="gf-wrap"><h2>{heading}</h2><div className="gf-review-grid">{query.data.data.slice(0, 6).map(review => <article key={review.id}><span aria-label={`${review.rating} / 5`} className="gf-stars">{'★'.repeat(Math.max(0, Math.min(5, Math.round(review.rating))))}</span>{review.title ? <h3>{review.title}</h3> : null}<p>{review.body}</p><strong>{review.author_name || review.customer?.name || (ar ? 'عميل المتجر' : 'Store customer')}</strong>{review.is_verified ? <small>{ar ? 'مشتري موثّق' : 'Verified purchase'}</small> : null}</article>)}</div></div>;
}

function Preview(props: Props): ReactElement {
  const { locale } = useLocale();
  const customizer = useCustomizerState();
  const query = useAsync(() => props.productSlug ? getProduct(props.productSlug) : Promise.resolve(null), [props.productSlug, locale]);
  const product = query.data?.data ?? null; const ar = (customizer.locale ?? props.locale ?? locale) === 'ar';
  return <Composition {...props} presentation={{ product, unitPrice: Number(product?.price ?? 0), quantity: 1, ready: false, image: product?.image_url ?? product?.image ?? null }} checkout={<section id="funnel-checkout" className="sf-funnel-checkout"><h2>{ar ? 'أكمل طلبك' : 'Complete your order'}</h2><p>{ar ? 'معاينة نموذج الطلب — افتح المعاينة المنفصلة لاختيار تفاصيل المنتج.' : 'Checkout preview — open the standalone preview to choose product options.'}</p><fieldset disabled>{[ar ? 'الاسم' : 'Name', ar ? 'رقم الهاتف' : 'Phone', ar ? 'العنوان' : 'Address'].map(label => <label key={label}>{label}<input placeholder={label} /></label>)}<button type="button" className="gf-button">{ar ? 'تأكيد الطلب' : 'Place order'}</button></fieldset></section>} />;
}

export default function GlassesFunnel(props: Props): ReactElement {
  const customizer = useCustomizerState();
  return customizer.active ? <Preview {...props} /> : <FunnelCheckout compactHeader productSlug={props.productSlug} renderLayout={(presentation, checkout) => <Composition {...props} presentation={presentation} checkout={checkout} />} />;
}

/** Public catalog preview: no checkout hooks, product API reads or order form. */
export function GlassesTemplatePreview(): ReactElement {
  const { key } = useParams();
  if (!isPreview() || (key !== 'glasses-ar' && key !== 'glasses-en')) return <NotFoundPage />;
  const locale = key === 'glasses-ar' ? 'ar' : 'en'; const ar = locale === 'ar';
  const { product, sections } = glassesPreview(locale);
  const checkout = <section id="funnel-checkout" className="sf-funnel-checkout"><h3>{ar ? 'نموذج طلب توضيحي' : 'Demo order form'}</h3><p>{ar ? 'المعاينة فقط — لا يمكن إرسال طلب من هذه الصفحة.' : 'Preview only — orders cannot be submitted from this page.'}</p><fieldset disabled>{[ar ? 'الاسم' : 'Name', ar ? 'رقم الهاتف' : 'Phone', ar ? 'العنوان' : 'Address'].map(label => <label key={label}>{label}<input placeholder={label} /></label>)}<button type="button" className="gf-button">{ar ? 'تأكيد الطلب (معطّل)' : 'Place order (disabled)'}</button></fieldset></section>;
  return <div className="gf-template-preview"><Seo title={ar ? 'معاينة قالب النظارات' : 'Glasses template preview'} noindex /><aside className="gf-demo-note" role="status">{ar ? 'بيانات توضيحية — الشراء معطّل' : 'Sample data — checkout disabled'} · <a href="/store/funnels" data-preview-exit>{ar ? 'العودة للقوالب' : 'Back to templates'}</a></aside><Composition sections={sections} productSlug={null} locale={locale} presentation={{ product, unitPrice: Number(product.price), quantity: 1, ready: false, image: product.image_url ?? null }} checkout={checkout} /></div>;
}

function Composition({ sections, productSlug, locale: pageLocale, presentation, checkout }: Props & { presentation: FunnelPresentation; checkout: ReactElement }): ReactElement {
  const { store, navigation } = useStore(); const { locale } = useLocale();
  const customizer = useCustomizerState(); const ar = ((customizer.active ? customizer.locale : null) ?? pageLocale ?? locale) === 'ar'; const product = presentation.product;
  const [menu, setMenu] = useState(false);
  const first = (type: string): number => sections.findIndex(section => section.type === `glasses-${type}`);
  const anchor = (type: string): string => `gf-section-${first(type)}`;
  const order = (label?: unknown, cart = false): ReactElement => <a className="gf-button" href="#funnel-checkout">{text(label) || (ar ? 'اطلب الآن' : 'Shop now')}{cart ? <HugeiconsIcon icon={ShoppingCart01Icon} size={22} aria-hidden="true" /> : null}</a>;
  const picture = (settings: Values, className = ''): ReactElement | null => {
    const src = campaignUrl(settings['image']);
    return src ? <img className={className} src={src} alt={text(settings['image_alt'])} loading="lazy" /> : null;
  };
  const heading = (settings: Values): ReactNode => text(settings['heading']) ? <h2>{text(settings['heading'])}</h2> : null;
  const render = (section: SectionInstance, index: number): ReactNode => {
    const s = section.settings ?? {};
    switch (section.type) {
      case 'glasses-hero': return <><Announcement settings={s} ar={ar} /><div className="gf-hero" style={campaignUrl(s['image']) ? { backgroundImage: `linear-gradient(#0004,#0005),url(${JSON.stringify(campaignUrl(s['image']))})` } : undefined}>
        <header className="gf-header gf-wrap"><a className="gf-brand" href="/">{store.logoUrl ? <img src={store.logoUrl} alt={store.name} /> : store.name}</a><button type="button" className="gf-menu-toggle" aria-expanded={menu} aria-controls={`gf-nav-${index}`} aria-label={ar ? 'قائمة الصفحة' : 'Page menu'} onClick={() => setMenu(!menu)}>{menu ? <IconClose /> : <IconMenu />}</button><nav id={`gf-nav-${index}`} data-open={menu} onClick={() => setMenu(false)} aria-label={ar ? 'أقسام الصفحة' : 'Page sections'}>{[['features', ar ? 'الميزات' : 'Features'], ['faq', ar ? 'الأسئلة الشائعة' : 'FAQs'], ['reviews', ar ? 'التقييمات' : 'Reviews']].filter(([type]) => first(type!) >= 0).map(([type, label]) => <a href={`#${anchor(type!)}`} key={type}>{label}</a>)}{order(s['cta_label'], true)}</nav></header>
        <div className="gf-hero-content gf-wrap">{text(s['text']) ? <p>{text(s['text'])}</p> : null}{index === first('hero') ? <h1>{text(s['heading'])}</h1> : <h2>{text(s['heading'])}</h2>}{order(s['cta_label'])}</div>
      </div></>;
      case 'glasses-purchase': return index === first('purchase') ? <div className="gf-wrap gf-purchase"><Gallery presentation={presentation} ar={ar} /><div className="gf-purchase-panel"><h2>{text(s['heading']) || product?.name}</h2>{product ? <div className="gf-product-prices"><p className="gf-price">{formatMoney(presentation.unitPrice, store.baseCurrency, locale)}</p>{presentation.comparePrice && presentation.comparePrice > presentation.unitPrice ? <del>{formatMoney(presentation.comparePrice, store.baseCurrency, locale)}</del> : null}</div> : null}{text(s['text']) || product?.short_description ? <p className="gf-purchase-description">{text(s['text']) || product?.short_description}</p> : null}{checkout}</div></div> : null;
      case 'glasses-details': {
        const specs = [...specificationRows(product), ...rows(s['rows']).map(row => ({ label: text(row['label']), value: text(row['value']) }))].filter(row => row.label && row.value);
        return specs.length ? <div className="gf-wrap gf-specs">{heading(s)}<dl>{specs.map((row, i) => <div key={i}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}</dl></div> : null;
      }
      case 'glasses-story': return <div className="gf-wrap gf-split gf-story">{picture(s)}<div>{heading(s)}<p className="gf-prose">{text(s['text'])}</p>{order(s['cta_label'])}</div></div>;
      case 'glasses-features': return rows(s['items']).length ? <div className="gf-wrap gf-features">{heading(s)}{rows(s['items']).map((item, i) => <div className="gf-split gf-feature" key={i}>{picture(item)}<div><h3>{text(item['heading'])}</h3><p className="gf-prose">{text(item['text'])}</p></div></div>)}</div> : null;
      case 'glasses-media': {
        const video = campaignUrl(s['video_url']);
        return <div className="gf-media gf-wrap">{heading(s)}{video ? <video controls playsInline preload="none" poster={campaignUrl(s['image'])}><source src={video} /></video> : picture(s)}</div>;
      }
      case 'glasses-quote': return text(s['text']) ? <figure className="gf-wrap gf-quote"><blockquote>{text(s['text'])}</blockquote>{text(s['attribution']) ? <figcaption>{text(s['attribution'])}</figcaption> : null}</figure> : null;
      case 'glasses-reviews': return <Reviews slug={productSlug} heading={text(s['heading'])} ar={ar} />;
      case 'glasses-faq': return rows(s['items']).length ? <div className="gf-wrap gf-split gf-faq"><div>{heading(s)}{rows(s['items']).map((item, i) => <details key={i}><summary>{text(item['question'])}<span aria-hidden="true" /></summary><p className="gf-prose">{text(item['answer'])}</p></details>)}</div>{picture(s)}</div> : null;
      case 'glasses-closing': return <div className="gf-closing"><div className="gf-wrap">{heading(s)}<p>{text(s['text'])}</p>{order(s['cta_label'])}</div></div>;
      default: return null;
    }
  };
  const purchase = sections.find(section => section.type === 'glasses-purchase');
  return <div className="gf-root" dir={ar ? 'rtl' : 'ltr'} lang={ar ? 'ar' : 'en'}>
    {sections.map((section, index) => <div id={`gf-section-${index}`} key={section.id ?? index} data-section-id={section.id} className={customizer.selectedId === section.id ? 'gf-section gf-section-selected' : 'gf-section'}>{render(section, index)}</div>)}
    {!purchase ? <div className="gf-wrap gf-purchase-panel">{checkout}</div> : null}
    <footer className="gf-footer"><div className="gf-wrap"><a className="gf-brand" href="/">{store.name}</a><nav aria-label={ar ? 'روابط المتجر' : 'Store links'}>{navigation.footer.flatMap(group => group.children?.length ? group.children : [group]).filter(link => !!link.url).map(link => <a href={link.url ?? undefined} key={link.url}>{link.label}</a>)}</nav><StorePaymentMarks label={ar ? 'وسائل الدفع' : 'Payment methods'} /><p>© {new Date().getFullYear()} {store.name}</p></div></footer>
    {product ? <aside className="gf-dock" aria-label={ar ? 'طلب المنتج' : 'Order this product'}><div className="gf-dock-product">{campaignUrl(presentation.image) ? <img src={presentation.image!} alt="" /> : null}<div><strong>{product.name}</strong><span>{formatMoney(presentation.unitPrice, store.baseCurrency, locale)}</span></div></div>{order(purchase?.settings?.['cta_label'], true)}</aside> : null}
  </div>;
}
