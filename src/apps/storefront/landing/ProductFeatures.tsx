import { Fragment, type CSSProperties } from 'react';
import { landingUrl, type LandingImage, type LandingItem, type LandingSettings } from './document';
import { productFeatureDesign } from './product-feature-designs';
import { productFeatureEffects } from './product-feature-effects';
import { StaticLandingFrame } from './StaticLandingFrame';
import baseCss from './product-features.css?inline';
import './product-features.css';
import './product-feature-effects.css';

const escape = (value: string) => value.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!);
const hasItem = (item: LandingItem) => !!(item.title?.trim() || item.text?.trim() || item.html?.trim() || item.image?.url && landingUrl(item.image.url));
export const hasProductFeatureContent = (s: LandingSettings) => !!(s.title?.trim() || s.description?.trim() || s.html?.trim() || s.image?.url && landingUrl(s.image.url) || s.items?.some(hasItem));
export function ProductFeatures({ settings: s, preview = false, thumbnail = false, onItemSelect, onImageSelect, onPurchase }: { settings: LandingSettings; preview?: boolean; thumbnail?: boolean; onItemSelect?: (index: number) => void; onImageSelect?: () => void; onPurchase?: () => void }) {
  const d = productFeatureDesign(s.variant);
  const examples = preview && !hasProductFeatureContent(s);
  const items: LandingItem[] = examples ? Array.from({ length: d.count }, (_, i) => ({ title: `ميزة المنتج ${i + 1}`, text: 'اكتب وصف الميزة وتفاصيلها هنا.' })) : s.items ?? [];
  if (!preview && !hasProductFeatureContent(s)) return null;
  const style = Object.fromEntries([
    ['background', '--pf-background'], ['foreground', '--pf-title'], ['secondary_foreground', '--pf-body'], ['card_background', '--pf-card'],
    ['hover_background', '--pf-hover-card'], ['hover_foreground', '--pf-hover-title'], ['hover_secondary_foreground', '--pf-hover-body'],
  ].flatMap(([field, variable]) => s[field as keyof LandingSettings] ? [[variable, s[field as keyof LandingSettings]]] : [])) as CSSProperties;
  if (s.align) (style as Record<string, unknown>)['--pf-align'] = s.align;
  if (s.background_image?.url && landingUrl(s.background_image.url) && !s.background_image.url.startsWith('#')) Object.assign(style,{ backgroundImage:`url(${JSON.stringify(s.background_image.url)})`,backgroundSize:'cover',backgroundPosition:'center' });
  if (s.padding !== undefined) (style as Record<string, unknown>)['--pf-padding'] = `${s.padding}px`;
  if (s.font_size) (style as Record<string, unknown>)['--pf-title-size'] = `${s.font_size}px`;
  const photo = (image: LandingImage | undefined, index: number, hero = false) => {
    const valid = image?.url && landingUrl(image.url);
    const ratio = d.ratios[index % d.ratios.length] ?? [1, 1];
    const imageNode = <div className="lp-pf-image-wrap">{valid ? <img src={image.url} alt={image.alt || ''} loading="lazy" /> : examples ? <img className="lp-pf-placeholder" src={`/landing-illustrations/product-features/${ratio[0]}-${ratio[1]}.svg`} alt="صورة توضيحية" /> : null}{preview && !thumbnail && hero && onImageSelect ? <button className="lp-pf-select" type="button" aria-label="تعديل صورة مميزات المنتج" onClick={onImageSelect} /> : null}</div>;
    return !preview && image?.link_url && landingUrl(image.link_url) ? <a className="lp-pf-image-link" href={image.link_url}>{imageNode}</a> : imageNode;
  };
  const title = s.title ?? (examples ? 'مميزات المنتج' : '');
  const description = s.description ?? '';
  const classes = `lp-pf lp-pf--${d.id.slice(17)}${s.hover_background ? ' lp-pf--hover-card' : ''}${s.hover_foreground ? ' lp-pf--hover-title' : ''}${s.hover_secondary_foreground ? ' lp-pf--hover-body' : ''}`;
  const content = <div className={classes} data-design={d.id} data-motion={preview || s.motion === false ? 'paused' : 'playing'} data-thumbnail={thumbnail || undefined} style={style}><div className="lp-pf-flow">
    {d.advanced ? <><div className="advanced-text container"><div className="lp-pf-hero">{photo(s.image, 0, true)}</div><div className="ql-editor"><div className="lp-pf-rich">{d.id === 'product-features-30' ? items.map((item, index) => <Fragment key={index}><h4>{item.title}</h4><h2>{item.text}</h2>{item.html ? <StaticLandingFrame html={item.html} title={item.title || 'تفاصيل الميزة'} /> : null}</Fragment>) : <><h4>{title}</h4>{description ? <h2>{description}</h2> : null}<ul>{items.map((item, index) => <li key={index}>{item.title}{item.text ? <span>{item.text}</span> : null}</li>)}</ul></>}{s.html ? <StaticLandingFrame html={s.html} title={title || 'تفاصيل المزايا'} /> : null}</div></div></div>{d.id === 'product-features-44' && (s.button_text ?? 'الشراء الآن').trim() ? thumbnail ? <span className="lp-pf-purchase">{s.button_text ?? 'الشراء الآن'}</span> : <button type="button" className="lp-pf-purchase" data-purchase onClick={preview ? undefined : onPurchase}>{s.button_text ?? 'الشراء الآن'}</button> : null}</> : <>{(title || description) && d.header ? <div className="lp-pf-heading">{title ? <h3>{title}</h3> : null}{description ? <p className="description">{description}</p> : null}</div> : null}<div className="lp-pf-grid">{items.map((item, index) => <div className="icon-container" key={index} style={{ ...(item.background ? { '--pf-card': item.background } : {}), ...(item.foreground ? { '--pf-title': item.foreground } : {}) } as CSSProperties}><div className="icon-image-container">{photo(item.image, index)}</div><div className="icon-text-container">{item.title ? <p className="author-name" style={{ fontWeight: 600 }} data-caption={item.caption || ''}>{item.title}</p> : null}{item.text ? <span className="review-text" style={{ lineHeight: 1.5 }}>{item.text}</span> : null}{item.html ? <StaticLandingFrame html={item.html} title={item.title || 'تفاصيل الميزة'} /> : null}{item.url && landingUrl(item.url) && !preview ? <a className="lp-pf-link" href={item.url}>عرض التفاصيل</a> : null}</div>{preview && !thumbnail && onItemSelect ? <button type="button" className="lp-pf-select" aria-label={`تعديل ميزة المنتج ${index + 1}`} onClick={() => onItemSelect(index)} /> : null}</div>)}</div></>}
  </div></div>;
  if (s.css?.trim() && !thumbnail) {
    const imageMarkup = (image?: LandingImage) => { const markup = image?.url && landingUrl(image.url) ? `<div class="lp-pf-image-wrap"><img src="${escape(image.url)}" alt="${escape(image.alt || '')}"></div>` : ''; return !preview && image?.link_url && landingUrl(image.link_url) ? `<a class="lp-pf-image-link" href="${escape(image.link_url)}">${markup}</a>` : markup; };
    const cardMarkup = items.map(item => `<div class="icon-container" style="${escape([item.background ? `--pf-card:${item.background}` : '',item.foreground ? `--pf-title:${item.foreground}` : ''].filter(Boolean).join(';'))}"><div class="icon-image-container">${imageMarkup(item.image)}</div><div class="icon-text-container">${item.title ? `<p class="author-name" style="font-weight:600">${escape(item.title)}</p>` : ''}${item.text ? `<span class="review-text" style="line-height:1.5">${escape(item.text)}</span>` : ''}${item.html || ''}${item.url && landingUrl(item.url) ? `<a class="lp-pf-link" href="${escape(item.url)}">عرض التفاصيل</a>` : ''}</div></div>`).join('');
    const rich = d.id === 'product-features-30' ? items.map(item => `<h4>${escape(item.title || '')}</h4><h2>${escape(item.text || '')}</h2>${item.html || ''}`).join('') : `<h4>${escape(title)}</h4>${description ? `<h2>${escape(description)}</h2>` : ''}<ul>${items.map(item => `<li>${escape(item.title || '')}${item.text ? `<span>${escape(item.text)}</span>` : ''}</li>`).join('')}</ul>`;
    const body = d.advanced ? `<div class="advanced-text container"><div class="lp-pf-hero">${imageMarkup(s.image)}</div><div class="ql-editor"><div class="lp-pf-rich">${rich}${s.html || ''}</div></div></div>${d.id === 'product-features-44' && (s.button_text ?? 'الشراء الآن').trim() ? `<button class="lp-pf-purchase" data-purchase>${escape(s.button_text ?? 'الشراء الآن')}</button>` : ''}` : `${d.header ? `<div class="lp-pf-heading">${title ? `<h3>${escape(title)}</h3>` : ''}${description ? `<p class="description">${escape(description)}</p>` : ''}</div>` : ''}<div class="lp-pf-grid">${cardMarkup}</div>`;
    const inline = Object.entries(style).map(([key, value]) => `${key.replace(/[A-Z]/g,ch => '-'+ch.toLowerCase())}:${value}`).join(';');
    const html = `<div class="${classes}" data-design="${d.id}" data-motion="${preview || s.motion === false ? 'paused' : 'playing'}" style="${escape(inline)}"><div class="lp-pf-flow">${body}</div></div>`;
    return <StaticLandingFrame title={title || 'مميزات المنتج'} html={html} css={s.css} baseCss={`@layer native {${baseCss}\n${(productFeatureEffects[d.id] ?? '').replace(/!important/g, '')}}`} onPurchase={preview ? undefined : onPurchase} />;
  }
  return content;
}
