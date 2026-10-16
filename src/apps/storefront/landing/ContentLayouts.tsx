import { type CSSProperties } from 'react';
import { ContentQuoteMark, ContentTitleRule } from './ContentArtwork';
import { landingUrl, type LandingImage, type LandingItem, type LandingSettings } from './document';
import { contentDesign } from './content-designs';
import { StaticLandingFrame } from './StaticLandingFrame';
import { StoreFeatureIcon } from './StoreFeatureIcon';
import './content-layouts.css';

const validPhoto = (image?: LandingImage) => !!(image?.url && !image.url.startsWith('#') && landingUrl(image.url));
const hasItem = (item: LandingItem) => !!(item.title?.trim() || item.text?.trim() || item.caption?.trim() || item.html?.trim() || item.icon?.trim() || validPhoto(item.image) || item.url && landingUrl(item.url));
export function hasContentLayout(s: LandingSettings): boolean {
  const d = contentDesign(s.variant);
  if (d.kind === 'quote') return !!(s.description?.trim() || s.html?.trim() || s.author?.trim() || s.caption?.trim() || validPhoto(s.image));
  const header = !!(s.title?.trim() || s.description?.trim() || s.html?.trim() || ['framed', 'stats'].includes(d.kind) && s.eyebrow?.trim());
  const action = d.purchase && !!s.button_text?.trim();
  if (d.kind === 'cards') return header || !!s.items?.some(hasItem);
  if (d.kind === 'stats') return header || action || validPhoto(s.image) || !!s.items?.some(hasItem);
  if (d.kind === 'framed') return header || action || validPhoto(s.image) || validPhoto(s.secondary_image) || !!s.images?.some(validPhoto);
  return header || action || validPhoto(s.image) || validPhoto(s.secondary_image) || !!s.images?.some(validPhoto) || !!s.items?.some(hasItem);
}

export function ContentLayouts({ settings: s, preview = false, thumbnail = false, onItemSelect, onImageSelect, onPurchase }: { settings: LandingSettings; preview?: boolean; thumbnail?: boolean; onItemSelect?: (index: number) => void; onImageSelect?: (index: number | 'hero' | 'secondary') => void; onPurchase?: () => void }) {
  const d = contentDesign(s.variant); const examples = preview && !(s.items ?? []).some(hasItem);
  const items: LandingItem[] = examples ? Array.from({ length: d.count }, (_, i) => ({ title: d.kind === 'stats' ? '—' : `عنوان العنصر ${i + 1}`, text: d.kind === 'stats' ? 'وصف القيمة' : d.kind === 'cards' ? 'اكتب وصف العنصر هنا.\nأضف تفاصيل المنتج المناسبة.\nيمكنك تعديل النص والصورة.' : '', icon: 'badge' })) : preview ? s.items ?? [] : (s.items ?? []).filter(hasItem);
  const images = preview ? s.images ?? [] : (s.images ?? []).filter(validPhoto);
  const pairedPhotos = preview || validPhoto(s.image) || validPhoto(s.secondary_image);
  if (!preview && !hasContentLayout(s)) return null;
  const label = s.button_text ?? 'الشراء الان';
  const quote = s.description ?? (preview ? 'اكتب الاقتباس هنا.\nأضف تجربة صاحب الاقتباس.\nيمكنك تعديل النص والصورة.' : '');
  const author = s.author ?? (preview ? 'صاحب الاقتباس' : ''); const caption = s.caption ?? (preview ? 'الصفة أو المصدر' : '');
  const eyebrow = ['framed','stats'].includes(d.kind) ? s.eyebrow : undefined;
  const style = {
    '--content-text': s.foreground ?? '#000000', '--content-body': s.secondary_foreground ?? '#6b7280', '--content-accent': s.accent ?? '#4bde1c',
    '--content-card': s.card_background ?? (d.kind === 'quote' ? s.accent ?? '#4bde1c' : '#ffffff'), '--content-eye': s.eyebrow_color ?? (d.kind === 'stats' ? '#007e60' : '#f05936'),
    '--content-heading-size': `${s.font_size ?? d.headingSize}px`, '--content-heading-line': `${s.font_size ? s.font_size * d.headingLine / d.headingSize : d.headingLine}px`,
    '--content-icon-bg': s.icon_background ?? '#f0f0f0', '--content-icon': s.icon_color ?? '#000000', '--content-hover-bg': s.hover_background ?? '#ffffff',
    '--content-hover-text': s.hover_foreground ?? s.foreground ?? '#000000', '--content-hover-body': s.hover_secondary_foreground ?? s.secondary_foreground ?? '#6b7280',
    ...(s.align ? { '--content-item-align': s.align } : {}), textAlign: s.align ?? d.align,
  } as CSSProperties;
  const photo = (image: LandingImage | undefined, index: number | 'hero' | 'secondary', className = '', editable = true) => {
    if (!preview && !validPhoto(image)) return null;
    const picture = validPhoto(image) ? <img src={image!.url} alt={image!.alt ?? ''} loading="lazy" /> : <div className="lp-content-placeholder" role="img" aria-label="موضع صورة المحتوى"><svg viewBox="0 0 48 48" fill="none" aria-hidden><rect x="5" y="7" width="38" height="34" rx="4" stroke="currentColor" strokeWidth="2" /><circle cx="16" cy="18" r="4" stroke="currentColor" strokeWidth="2" /><path d="m7 36 11-10 8 7 7-11 9 14" stroke="currentColor" strokeWidth="2" /></svg></div>;
    return <figure className={`lp-content-photo ${className}`}>{!preview && image?.link_url && landingUrl(image.link_url) ? <a href={image.link_url} aria-label={image.alt || s.title || 'عرض الوجهة'}>{picture}</a> : picture}{editable && preview && !thumbnail && onImageSelect ? <button type="button" className="lp-content-edit" aria-label={index === 'hero' ? 'تعديل صورة المحتوى الرئيسية' : index === 'secondary' ? 'تعديل صورة المحتوى الثانية' : `تعديل صورة المحتوى ${index + 1}`} onClick={() => onImageSelect(index)} /> : null}</figure>;
  };
  const buy = d.purchase && label ? <div className="lp-content-buy-wrap">{thumbnail ? <span className="lp-content-buy">{label}</span> : <button type="button" className="lp-content-buy" onClick={preview ? undefined : onPurchase}>{label}</button>}</div> : null;
  const header = s.title || s.description || eyebrow || s.html ? <header className={`lp-content-header${d.enterHeading ? ' lp-content-enter' : ''}`}>
    {eyebrow ? <div className="lp-content-eyebrow"><p>{eyebrow}</p></div> : null}
    <div className="lp-content-header-copy">{s.title ? <div className="lp-content-title"><h2>{s.title}</h2>{d.kind === 'stats' ? <ContentTitleRule /> : null}</div> : null}{s.description ? <p className="lp-content-description">{s.description}</p> : null}{s.html ? <StaticLandingFrame title={s.title || 'محتوى'} html={s.html} css={s.css} onPurchase={preview ? undefined : onPurchase} /> : null}</div>
  </header> : null;
  const itemStyle = (item: LandingItem) => ({ ...(item.background ? { '--content-card': item.background } : {}), ...(item.foreground ? { '--content-text': item.foreground, '--content-body': item.foreground } : {}), ...(item.accent ? { '--content-icon': item.accent } : {}) } as CSSProperties);
  const edit = (i: number) => preview && !thumbnail && onItemSelect ? <button type="button" className="lp-content-edit" aria-label={`تعديل عنصر المحتوى ${i + 1}`} onClick={() => onItemSelect(i)} /> : null;
  const details = (item: LandingItem) => <>{item.caption ? <p className="lp-content-item-caption">{item.caption}</p> : null}{item.html ? <StaticLandingFrame title={item.title || 'تفاصيل العنصر'} html={item.html} /> : null}{item.url && landingUrl(item.url) ? preview ? <span className="lp-content-details">عرض التفاصيل</span> : <a className="lp-content-details" href={item.url}>عرض التفاصيل</a> : null}</>;
  const icon = (item: LandingItem) => <span className="lp-content-icon">{validPhoto(item.image) ? photo(item.image, 'hero', 'lp-content-icon-image', false) : <StoreFeatureIcon name={item.icon} />}</span>;
  const list = <div className="lp-content-items">{items.map((item, i) => <article className={`lp-content-item${d.kind !== 'cards' ? ' lp-content-enter' : ''}`} key={i} style={itemStyle(item)}>{d.kind !== 'stats' ? icon(item) : null}<div className="lp-content-item-copy">{item.title ? <h3>{item.title}</h3> : null}{d.kind !== 'cards' ? <p className="lp-content-item-text">{item.text ?? ''}</p> : null}{d.kind !== 'cards' ? details(item) : null}</div>{d.kind === 'cards' ? <><p className="lp-content-item-text">{item.text ?? ''}</p>{details(item)}</> : null}{edit(i)}</article>)}</div>;
  const hero = photo(s.image, 'hero', 'lp-content-hero');
  return <div className={`lp-content lp-content--${d.kind}`} data-design={d.id} data-motion={preview || s.motion === false ? 'paused' : 'playing'} data-thumbnail={thumbnail || undefined} style={style}>
    {d.kind === 'quote' ? <div className={`lp-content-quote-panel${hero ? '' : ' lp-content-quote-panel--no-photo'}`}>
      <div className="lp-content-quote-copy"><ContentQuoteMark />{quote ? <blockquote>{quote}</blockquote> : null}{s.html ? <StaticLandingFrame title="محتوى الاقتباس" html={s.html} css={s.css} /> : null}<span className="lp-content-quote-rule" aria-hidden /><div className="lp-content-attribution">{author ? <h3>{author}</h3> : null}{caption ? <p>{caption}</p> : null}</div></div>{hero}
    </div> : d.kind === 'cards' ? <>{header}{list}</> : d.kind === 'framed' ? <>
      <div className="lp-content-framed"><div className="lp-content-image-slot">{photo(s.image, 'hero')}</div><div className="lp-content-copy">{header}{buy}</div><div className="lp-content-image-slot">{photo(s.secondary_image, 'secondary')}</div></div>{images.length > 0 ? <div className="lp-content-extra-images">{images.map((image, i) => <div key={i}>{photo(image, i)}</div>)}</div> : null}
    </> : <div className={`lp-content-main${d.kind === 'stats' && !hero ? ' lp-content-main--no-photo' : ''}`}>{d.kind === 'stats' ? hero : null}<div className="lp-content-copy">{header}{list}{buy}</div>{d.kind === 'benefits' && (pairedPhotos || images.length > 0) ? <div className="lp-content-images">{pairedPhotos ? <><div>{photo(s.image, 'hero')}</div><div>{photo(s.secondary_image, 'secondary')}</div></> : null}{images.map((image, i) => <div key={i}>{photo(image, i)}</div>)}</div> : null}</div>}
    {examples && d.count > 0 && !thumbnail ? <p className="lp-content-note">عناصر إرشادية للمعاينة — أضف محتوى منتجك من الإعدادات.</p> : null}
  </div>;
}
