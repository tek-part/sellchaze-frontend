import type { CSSProperties } from 'react';
import { countdownDesign } from './countdown-designs';
import { countdownEffects } from './countdown-effects';
import { clockLabels,clockUnits } from './landing-clock';
import { useCountdownClock } from './useCountdownClock';
import { useLandingReveal } from './useLandingReveal';
import { landingUrl,type LandingImage,type LandingSettings } from './document';
import { escapeDescription as escape } from './description-rich';
import { StaticLandingFrame,landingStaticHtml,nativeLandingMarkup } from './StaticLandingFrame';
import baseCss from './countdown-base.css?inline';
import './countdown-base.css';
import './countdown-effects.css';
const photo=(image?:LandingImage)=>image?.url&&landingUrl(image.url)?`<img src="${escape(image.url)}" alt="${escape(image.alt??'')}" loading="lazy" data-landing-image>`:'';
export function CountdownLayouts({settings:s,productId='',sectionId='',preview=false,thumbnail=false,phonePreview=false,onTextSelect,onPurchase,onPurchaseSelect}:{settings:LandingSettings;productId?:string;sectionId?:string;preview?:boolean;thumbnail?:boolean;phonePreview?:boolean;onTextSelect?:(field:'title'|'description')=>void;onPurchase?:()=>void;onPurchaseSelect?:()=>void}){
  const d=countdownDesign(s.variant),clock=useCountdownClock(productId,sectionId,s.hours??4,s.ends_at??undefined,thumbnail),ref=useLandingReveal(!preview&&s.motion!==false,d.id);
  const title=thumbnail?(d.heading?'الوقت المتبقي':''):s.title??'',description=thumbnail?(d.sampleDescriptionLength?'تفاصيل العرض والوقت المتبقي.':''):s.description??'';
  const custom=s.countdown_css_mode==='custom',ownerCss=s.countdown_css_mode==='template'?'':s.css??'';
  const style={...(s.background?{backgroundColor:s.background}:{}),...(s.foreground?{'--cd-foreground':s.foreground}:{}),...(s.card_background?{'--cd-card':s.card_background}:{}),...(s.countdown_title_color?{'--cd-title':s.countdown_title_color}:{}),...(s.countdown_description_color?{'--cd-description':s.countdown_description_color}:{}),...(s.align?{'--cd-title-align':s.align}:{}),...(s.countdown_description_align?{'--cd-description-align':s.countdown_description_align}:{}),...(s.padding!==undefined?{'--cd-padding':`${s.padding}px`,padding:`${s.padding}px`}:{}),...(s.font_size?{'--cd-font-size':`${s.font_size}px`}:{}),...(s.radius!==undefined?{borderRadius:`${s.radius}px`}:{}),...(s.background_image?.url&&landingUrl(s.background_image.url)?{'--cd-artwork':`url(${JSON.stringify(s.background_image.url)})`,...(d.artwork?{}:{backgroundImage:`url(${JSON.stringify(s.background_image.url)})`,backgroundSize:'cover',backgroundPosition:'center'})}:thumbnail&&d.artwork?{'--cd-artwork':'url("/landing-illustrations/countdowns/background33.svg")'}:{})} as CSSProperties;
  const extra=[photo(s.image),...(s.images??[]).map(photo),...(s.items??[]).map(i=>`<article>${photo(i.image)}${i.title?`<h4>${escape(i.title)}</h4>`:''}${i.text?`<p>${escape(i.text)}</p>`:''}${landingStaticHtml((i.html??'').slice(0,6000))}${i.url&&landingUrl(i.url)?`<a href="${escape(i.url)}">عرض التفاصيل</a>`:''}</article>`),landingStaticHtml(s.html??'')].join('');
  const classes=`lp-countdown lp-countdown--${d.index}${s.card_background?' cd-owned-card':''}${extra?' cd-has-extra':''}`;
  const isolated=!thumbnail&&(custom||!!ownerCss.trim()||!!extra||preview&&phonePreview);
  const purchase=(s.button_text??'').trim();
  if(isolated){
    const inline=Object.entries(style).map(([key,value])=>`${key.replace(/[A-Z]/g,c=>'-'+c.toLowerCase())}:${value}`).join(';');
    const heading=title||description?`<div class="cd-heading" data-landing-reveal>${title?`<h3 data-landing-text="title">${escape(title)}</h3>`:''}${description?`<p class="description cd-description" data-landing-text="description">${escape(description)}</p>`:''}</div>`:'';
    const cells=clockUnits.map((unit,index)=>`<div><p class="${unit}" data-landing-clock="${unit}">0</p><span class="${unit}-text">${clockLabels[index]}</span></div>`).join('');
    const html=`<div class="${classes}" data-motion="${preview||s.motion===false?'paused':'playing'}" style="${escape(inline)}"><div class="cd-shell">${heading}<div class="cd-body"><div class="counter" aria-label="الوقت المتبقي">${cells}</div></div></div>${purchase?`<button data-purchase class="cd-purchase">${escape(purchase)}</button>`:''}${extra?`<div class="cd-extra">${extra}</div>`:''}</div>`;
    return <StaticLandingFrame nativeHtml={nativeLandingMarkup(html)} title={title||'العداد التنازلي'} countdown={clock} baseCss={`@layer native{${(baseCss+(custom?'':countdownEffects[d.id])).replace(/!important/g,'')}}`} css={ownerCss} pageViewport={phonePreview?'fragment':true} onTextSelect={preview?onTextSelect:undefined} onPurchase={preview?undefined:onPurchase} onEditPurchase={preview?onPurchaseSelect:undefined}/>;
  }
  return <div ref={ref} className={classes} style={style} data-thumbnail={thumbnail||undefined} data-motion={preview||s.motion===false?'paused':'playing'}><div className="cd-shell">{title||description?<div className="cd-heading" data-landing-reveal>{title?<h3>{preview&&!thumbnail&&onTextSelect?<button className="cd-text-edit" type="button" aria-label="تعديل عنوان العداد" onClick={()=>onTextSelect('title')}>{title}</button>:title}</h3>:null}{description?<p className="description cd-description">{preview&&!thumbnail&&onTextSelect?<button className="cd-text-edit" type="button" aria-label="تعديل وصف العداد" onClick={()=>onTextSelect('description')}>{description}</button>:description}</p>:null}</div>:null}<div className="cd-body"><div className="counter" role="timer" aria-live="off" aria-label="الوقت المتبقي">{clockUnits.map((unit,index)=><div key={unit}><p className={unit}>{clock[unit]}</p><span className={`${unit}-text`}>{clockLabels[index]}</span></div>)}</div></div></div>{purchase?(thumbnail?<span className="cd-purchase">{purchase}</span>:<button className="cd-purchase" type="button" onClick={preview?onPurchaseSelect:onPurchase}>{purchase}</button>):null}</div>;
}
