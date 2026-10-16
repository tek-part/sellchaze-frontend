import { useLandingReveal } from './useLandingReveal';
import { type CSSProperties } from 'react';
import { landingUrl, type LandingImage, type LandingItem, type LandingSettings } from './document';
import { reviewDesign } from './review-designs';
import { reviewEffects } from './review-effects';
import { StaticLandingFrame, landingStaticHtml, nativeLandingMarkup } from './StaticLandingFrame';
import baseCss from './reviews.css?inline';
import './reviews.css';
import './review-effects.css';

const escape = (value: string) => value.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!);
const itemHasContent = (item: LandingItem) => !!(item.author?.trim() || item.title?.trim() || item.text?.trim() || item.html?.trim() || item.caption?.trim() || item.platform?.trim() || typeof item.rating === 'number' || item.image?.url && landingUrl(item.image.url));
export const hasNativeReviewContent = (s: LandingSettings) => !!(s.title?.trim() || s.description?.trim() || s.html?.trim() || s.items?.some(itemHasContent));
const ratingOf = (item: LandingItem) => typeof item.rating === 'number' && Number.isFinite(item.rating) ? Math.max(0, Math.min(5, Math.round(item.rating))) : undefined;
const stylesOf = (s: LandingSettings): CSSProperties => Object.fromEntries([
  ['background','--rv-background'],['foreground','--rv-title'],['secondary_foreground','--rv-body'],['card_background','--rv-card'],
  ['hover_background','--rv-hover-card'],['hover_foreground','--rv-hover-title'],['hover_secondary_foreground','--rv-hover-body'],['align','--rv-align'],
].flatMap(([field,variable]) => s[field as keyof LandingSettings] ? [[variable,s[field as keyof LandingSettings]]] : [])) as CSSProperties;
const inline = (style: CSSProperties) => Object.entries(style).map(([key,value]) => `${key.replace(/[A-Z]/g,ch=>'-'+ch.toLowerCase())}:${value}`).join(';');
export function NativeReviews({ settings: s, preview = false, thumbnail = false, onItemSelect }: { settings: LandingSettings; preview?: boolean; thumbnail?: boolean; onItemSelect?: (index: number) => void }) {
  const d = reviewDesign(s.variant); const revealRef=useLandingReveal(!preview && s.motion!==false,d.id); const supplied = s.items ?? [];
  const examples = preview && !supplied.some(itemHasContent);
  const items: LandingItem[] = examples ? Array.from({length:Math.max(d.count,supplied.length)},()=>({title:'اسم صاحب التقييم',text:'اكتب تجربة العميل وتفاصيل رأيه في المنتج هنا.',...(d.advanced?{caption:'صفة صاحب التقييم'}:{})})) : preview ? supplied : supplied.filter(itemHasContent);
  if (!preview && !hasNativeReviewContent(s)) return null;
  const title = s.title ?? (examples ? 'آراء العملاء' : ''); const description = s.description ?? '';
  const style = stylesOf(s); if(s.padding !== undefined)(style as Record<string,unknown>)['--rv-padding'] = `${s.padding}px`; if(s.font_size)(style as Record<string,unknown>)['--rv-title-size'] = `${s.font_size}px`;
  const classes = `lp-native-reviews lp-native-reviews--${d.id.slice(8)}${s.hover_foreground?' rv-custom-hover-title':''}${s.hover_secondary_foreground?' rv-custom-hover-body':''}`;
  const data = (item: LandingItem) => ({'data-rating':ratingOf(item)===undefined ? examples ? '☆☆☆☆☆' : '' : '⭐'.repeat(ratingOf(item)!), 'data-badge':item.caption || (examples?'ملاحظة':''), 'data-role-label':item.platform || '', 'data-label':title});
  const itemStyle = (item: LandingItem): CSSProperties => ({...(item.background?{'--rv-card':item.background}:{}),...(item.foreground?{'--rv-title':item.foreground}:{})} as CSSProperties);
  const photo = (image: LandingImage | undefined, index: number) => {
    const valid = image?.url && landingUrl(image.url); const ratio=d.ratios[index % d.ratios.length] ?? [200,200];
    const node=<div className="rv-image-wrap">{valid?<img data-landing-image="" src={image.url} alt={image.alt || ''} loading="lazy"/>:examples?<img data-landing-image="" src={`/landing-illustrations/reviews/${ratio[0] || 200}-${ratio[1] || 200}.svg`} alt="صورة توضيحية"/>:null}</div>;
    return !preview && image?.link_url && landingUrl(image.link_url)?<a className="rv-link" href={image.link_url}>{node}</a>:node;
  };
  const content=<div ref={revealRef} className={classes} data-design={d.id} data-motion={preview || s.motion===false?'paused':'playing'} data-thumbnail={thumbnail || undefined} style={style}><div className="rv-flow">
    {d.advanced?<div className="advanced-text container"><div className="ql-editor"><div className="rv-rich" data-landing-reveal="">{title?<h1 data-label={title}>{title}</h1>:null}{description?<p className="description">{description}</p>:null}{items.map((item,index)=><div className="rv-quote" key={index} style={itemStyle(item)}>
      <div className="rv-quote-image">{item.image?.url && landingUrl(item.image.url)?photo(item.image,index):s.image?.url && landingUrl(s.image.url)?photo(s.image,index):<img data-landing-image="" src="/landing-icons/reviews/quote.svg" alt=""/>}</div>
      {ratingOf(item)!==undefined?<span className="rv-stars" aria-label={`التقييم ${ratingOf(item)} من 5`}>{'⭐'.repeat(ratingOf(item)!)}</span>:null}
      {item.text?<h6>{item.text}</h6>:null}<h3>{item.author || item.title?<strong>{item.author || item.title}</strong>:null}{item.caption?<em>{item.caption}</em>:null}</h3>{item.date?<small className="rv-date">{item.date}</small>:null}
      {preview && !thumbnail && onItemSelect?<button type="button" className="rv-select" aria-label={`تعديل التقييم ${index+1}`} onClick={()=>onItemSelect(index)}/>:null}
    </div>)}</div></div></div>:<>{d.header && (title || description)?<div className="rv-heading" data-landing-reveal="">{title?<h3 data-label={title}>{title}</h3>:null}{description?<p className="description">{description}</p>:null}</div>:null}<div className="lp-native-reviews-grid" tabIndex={preview?undefined:0} aria-label="بطاقات التقييمات">{items.map((item,index)=><div className="icon-container" data-landing-reveal="" key={index} {...data(item)} style={itemStyle(item)}>
      <div className="icon-image-container">{photo(item.image,index)}</div><div className="icon-text-container">{item.author || item.title?<p className="author-name" {...data(item)} style={{fontWeight:600,fontSize:20.8}} aria-label={ratingOf(item)!==undefined?`${item.author || item.title || ''} — التقييم ${ratingOf(item)} من 5`:undefined}>{item.author || item.title}</p>:null}{item.text?<span className="review-text" {...data(item)} style={{lineHeight:[13,22].includes(Number(d.id.slice(8)))?1.6:1.5}}>{item.text}</span>:null}{item.date?<small className="rv-date">{item.date}</small>:null}{item.url && landingUrl(item.url) && !preview?<a className="rv-link" href={item.url}>عرض التفاصيل</a>:null}</div>
      {preview && !thumbnail && onItemSelect?<button type="button" className="rv-select" aria-label={`تعديل التقييم ${index+1}`} onClick={()=>onItemSelect(index)}/>:null}
    </div>)}</div></>}
  </div></div>;
  if (!thumbnail && (s.css?.trim() || s.html?.trim() || items.some(item=>item.html?.trim()))) {
    const attrs = (item: LandingItem) => Object.entries(data(item)).map(([key,value])=>`${key}="${escape(value)}"`).join(' ');
    const imageMarkup = (image?: LandingImage) => image?.url && landingUrl(image.url)?`<div class="rv-image-wrap"><img data-landing-image="" src="${escape(image.url)}" alt="${escape(image.alt || '')}"></div>`:'';
    const ownerHtml = (item: LandingItem) => landingStaticHtml((item.html || '').slice(0,6000));
    const cards=items.map(item=>`<div class="icon-container" data-landing-reveal ${attrs(item)} style="${escape(inline(itemStyle(item)))}"><div class="icon-image-container">${imageMarkup(item.image)}</div><div class="icon-text-container">${item.author || item.title?`<p class="author-name" ${attrs(item)} style="font-weight:600;font-size:20.8px">${escape(item.author || item.title || '')}</p>`:''}${item.text?`<span class="review-text" ${attrs(item)} style="line-height:${[13,22].includes(Number(d.id.slice(8)))?1.6:1.5}">${escape(item.text)}</span>`:''}${ownerHtml(item)}${item.date?`<small class="rv-date">${escape(item.date)}</small>`:''}${item.url && landingUrl(item.url)?`<a href="${escape(item.url)}">عرض التفاصيل</a>`:''}</div></div>`).join('');
    const quotes=items.map(item=>`<div class="rv-quote" style="${escape(inline(itemStyle(item)))}"><div class="rv-quote-image">${imageMarkup(item.image || s.image) || '<img data-landing-image="" src="/landing-icons/reviews/quote.svg" alt="">'}</div>${ratingOf(item)!==undefined?`<span class="rv-stars" aria-label="التقييم ${ratingOf(item)} من 5">${'⭐'.repeat(ratingOf(item)!)}</span>`:''}${item.text?`<h6>${escape(item.text)}</h6>`:''}<h3>${item.author || item.title?`<strong>${escape(item.author || item.title || '')}</strong>`:''}${item.caption?`<em>${escape(item.caption)}</em>`:''}</h3>${ownerHtml(item)}${item.date?`<small class="rv-date">${escape(item.date)}</small>`:''}</div>`).join('');
    const heading=`${title?`<h3 data-label="${escape(title)}">${escape(title)}</h3>`:''}${description?`<p class="description">${escape(description)}</p>`:''}`;
    const body=d.advanced?`<div class="advanced-text container"><div class="ql-editor"><div class="rv-rich" data-landing-reveal>${title?`<h1 data-label="${escape(title)}">${escape(title)}</h1>`:''}${description?`<p class="description">${escape(description)}</p>`:''}${quotes}${landingStaticHtml(s.html || '')}</div></div></div>`:`${d.header?`<div class="rv-heading" data-landing-reveal>${heading}</div>`:''}<div class="lp-native-reviews-grid">${cards}</div>${landingStaticHtml(s.html || '')}`;
    const html=`<div class="${classes}" data-design="${d.id}" data-motion="${preview || s.motion===false?'paused':'playing'}" style="${escape(inline(style))}"><div class="rv-flow">${body}</div></div>`;
    return <StaticLandingFrame title={title || 'تقييمات العملاء'} nativeHtml={nativeLandingMarkup(html)} css={s.css} baseCss={`@layer native {${baseCss}\n${(reviewEffects[d.id] || '').replace(/!important/g,'')}}`}/>;
  }
  return content;
}
