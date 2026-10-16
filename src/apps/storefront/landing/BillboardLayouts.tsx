import type { CSSProperties } from 'react';
import { landingUrl, type LandingImage, type LandingSettings } from './document';
import { billboardDesign } from './billboard-designs';
import { billboardEffects } from './billboard-effects';
import { billboardRichHtml, billboardSample, escapeDescription as escape, hasBillboardContent } from './billboard-rich';
import { StaticLandingFrame, nativeLandingMarkup, landingStaticHtml } from './StaticLandingFrame';
import { useLandingReveal } from './useLandingReveal';
import sharedCss from './product-descriptions.css?inline';
import extraCss from './billboard-base.css?inline';
import './billboard-base.css';
const baseCss=sharedCss+'\n'+extraCss;
import './product-descriptions.css';
import './billboard-effects.css';

export function BillboardLayouts({settings:s,preview=false,thumbnail=false,phonePreview=false,onItemSelect,onRichSelect,onImageSelect,onPurchase,onPurchaseSelect,onAddItem}:{settings:LandingSettings;preview?:boolean;thumbnail?:boolean;phonePreview?:boolean;onItemSelect?:(index:number)=>void;onRichSelect?:()=>void;onImageSelect?:()=>void;onPurchase?:()=>void;onPurchaseSelect?:()=>void;onAddItem?:()=>void}) {
  const d=billboardDesign(s.variant);const customCss=s.billboard_css_mode==='custom';const ownerCss=s.billboard_css_mode==='template'?'':s.css??'';const revealRef=useLandingReveal(!preview && s.motion!==false,d.id);
  const examples=preview&&!hasBillboardContent(s);const formatted=s.billboard_mode==='formatted';
  if(!preview&&!hasBillboardContent(s))return null;
  const style=Object.fromEntries([['background','--pd-background'],['foreground','--pd-title'],['secondary_foreground','--pd-body'],['card_background','--pd-card'],['hover_background','--pd-hover-card'],['hover_foreground','--pd-hover-title'],['hover_secondary_foreground','--pd-hover-body'],['align','--pd-align']].flatMap(([k,v])=>s[k as keyof LandingSettings]?[[v,s[k as keyof LandingSettings]]]:[]))as CSSProperties;
  if(d.index===13)(style as Record<string,unknown>)['--bb-caption']=JSON.stringify(s.caption??(thumbnail?'DESIGN':''));
  (style as Record<string,unknown>)['--pd-direction']=d.reversed?'row-reverse':'row';
  if(s.padding!==undefined)(style as Record<string,unknown>)['--pd-padding']=`${s.padding}px`;
  if(s.font_size)(style as Record<string,unknown>)['--pd-title-size']=`${s.font_size}px`;
  if(s.background_image?.url&&landingUrl(s.background_image.url)){Object.assign(style,{backgroundImage:`url(${JSON.stringify(s.background_image.url)})`,backgroundSize:'cover',backgroundPosition:'center','--pd-artwork':`url(${JSON.stringify(s.background_image.url)})`});}
  else if(thumbnail&&d.hasArtwork)(style as Record<string,unknown>)['--pd-artwork']=`url("/landing-illustrations/billboards/background${d.index}.svg")`;
  const classes=`lp-pd lp-pd--billboard-${d.index}${customCss?' pd-custom-css':''}${s.foreground&&!formatted?' pd-owner-title':''}${s.secondary_foreground&&!formatted?' pd-owner-body':''}${s.hover_background?' pd-owner-hover-card':''}${s.hover_foreground?' pd-owner-hover-title':''}${s.hover_secondary_foreground?' pd-owner-hover-body':''}`;
  const ratio=d.ratios[0]??[400,400];
  const image=(value?:LandingImage,hero=false)=>{const url=value?.url&&landingUrl(value.url)?value.url:examples&&d.hasImage?`/landing-illustrations/billboards/${ratio[0]}-${ratio[1]}.svg`:'';return <div className="pd-image-wrap">{url?<img data-landing-image="" src={url} alt={value?.alt||''} loading="lazy"/>:null}{hero&&preview&&!thumbnail&&onImageSelect?<button type="button" className="pd-select" aria-label="تعديل صورة اللوحة الإعلانية" onClick={onImageSelect}/>:null}</div>;};
  const addRow=preview&&!thumbnail&&!d.advanced&&onAddItem?<div className="pd-add-row"><button type="button" disabled={(s.items?.length??0)>=30} onClick={onAddItem}>اضافة ايقونه جديده</button></div>:null;
  const items=examples?[{title:billboardSample('منتج تختاره بعناية لتلبية احتياجاتك',d.sampleTitleLength),text:billboardSample('تعرّف على المنتج وتفاصيله هنا.',d.sampleTextLength)}]:(preview?s.items??[]:(s.items??[]).filter(i=>i.title?.trim()||i.text?.trim()||i.html?.trim()||i.image?.url&&landingUrl(i.image.url)));
  const rich=billboardRichHtml(s,examples);
  const hasHero=!!(s.image?.url&&landingUrl(s.image.url))||examples&&d.hasImage;
  const purchase=(s.button_text??'الحق العرض').trim();
  const button=d.purchase&&purchase?(thumbnail?<span className="pd-purchase">{purchase}</span>:<button className="pd-purchase" type="button" data-purchase onClick={preview?onPurchaseSelect:onPurchase}>{purchase}</button>):null;
  // Only escaped text and trusted schema attributes enter React. All owner HTML/CSS remains opaque.
  const isolated=preview&&phonePreview||customCss||formatted||!!ownerCss.trim()||s.billboard_mode!=='fields'&&!!s.html?.trim()||!!s.items?.some(i=>i.html?.trim());
  if(isolated&&!thumbnail){
    const photo=(value?:LandingImage)=>value?.url&&landingUrl(value.url)?`<div class="pd-image-wrap"><img data-landing-image="" src="${escape(value.url)}" alt="${escape(value.alt||'')}"></div>`:'';
    const richBody=formatted?landingStaticHtml(s.html??''):rich+(s.billboard_mode!=='fields'?landingStaticHtml(s.html??''):'');
    const cards=items.map((i,index)=>`<div class="icon-container" data-landing-reveal data-landing-item="${index}" style="${escape([i.background?`--pd-card:${i.background}`:'',i.foreground?`--pd-title:${i.foreground}`:''].filter(Boolean).join(';'))}"><div class="icon-image-container">${photo(i.image)}</div><div class="icon-text-container">${i.title?`<p class="author-name" style="font-weight:600;font-size:20.8px">${escape(i.title)}</p>`:''}${i.text?`<span class="review-text" style="line-height:1.5">${escape(i.text)}</span>`:''}${landingStaticHtml((i.html??'').slice(0,6000))}${i.url&&landingUrl(i.url)?`<a href="${escape(i.url)}">عرض التفاصيل</a>`:''}</div></div>`).join('');
    const body=d.advanced||formatted?`<div class="advanced-text container"${s.layout?` data-layout="${s.layout}"`:''}>${hasHero?`<div class="pd-hero${d.fadeImage?' bb-fade-hero':''}" data-landing-hero${d.fadeImage?' data-landing-reveal':''}>${photo(s.image)}</div>`:''}<div class="ql-editor"><div class="pd-rich" data-landing-reveal>${richBody}</div></div></div>`:`<div class="pd-grid">${cards}</div>${s.billboard_mode!=='fields'?landingStaticHtml(s.html??''):''}`;
    const inline=Object.entries(style).map(([k,v])=>`${k.replace(/[A-Z]/g,c=>'-'+c.toLowerCase())}:${v}`).join(';');
    const html=`<div class="${classes}" data-design="${d.id}" data-motion="${preview||s.motion===false?'paused':'playing'}" style="${escape(inline)}"><div class="pd-flow">${body}${d.purchase&&purchase?`<button class="pd-purchase" data-purchase>${escape(purchase)}</button>`:''}</div></div>`;
    return <><div className="pd-frame-wrap"><StaticLandingFrame pageViewport={phonePreview?'fragment':true} title={s.title||'اللوحة الإعلانية'} nativeHtml={nativeLandingMarkup(html)} css={ownerCss} baseCss={customCss?`@layer native {${baseCss}}`:`@layer native {${baseCss}\n${(billboardEffects[d.id]??'').replace(/!important/g,'')}}`} onPurchase={preview?undefined:onPurchase} onItemSelect={preview?onItemSelect:undefined} onEditPurchase={preview?onPurchaseSelect:undefined} onEditImage={preview?onImageSelect:undefined}/>{preview&&!thumbnail&&onRichSelect&&(d.advanced||formatted)?<button type="button" className="pd-frame-edit" onClick={onRichSelect}>تعديل نص اللوحة المنسق</button>:null}</div>{addRow}</>;
  }
  return <><div ref={revealRef} className={classes} data-design={d.id} data-motion={preview||s.motion===false?'paused':'playing'} data-thumbnail={thumbnail||undefined} style={style}><div className="pd-flow">
    {d.advanced?<div className="advanced-text container" data-layout={s.layout}>{hasHero?<div className={`pd-hero${d.fadeImage?' bb-fade-hero':''}`} data-landing-reveal={d.fadeImage?'':undefined}>{image(s.image,true)}</div>:null}<div className="ql-editor"><div className="pd-rich" data-landing-reveal="" dangerouslySetInnerHTML={{__html:rich}}/>{preview&&!thumbnail&&onRichSelect?<button className="pd-select" type="button" aria-label="تعديل نص اللوحة الإعلانية" onClick={onRichSelect}/>:null}</div></div>:<div className="pd-grid">{items.map((item,index)=><div className="icon-container" data-landing-reveal="" key={index} style={{...(item.background?{'--pd-card':item.background}:{}),...(item.foreground?{'--pd-title':item.foreground}:{})}as CSSProperties}><div className="icon-image-container">{image(item.image)}</div><div className="icon-text-container">{item.title?<p className="author-name" style={{fontWeight:600,fontSize:20.8}}>{item.title}</p>:null}{item.text?<span className="review-text" style={{lineHeight:1.5}}>{item.text}</span>:null}{item.url&&landingUrl(item.url)&&!preview?<a href={item.url}>عرض التفاصيل</a>:null}</div>{preview&&!thumbnail&&onItemSelect?<button type="button" className="pd-select" aria-label={`تعديل بطاقة اللوحة ${index+1}`} onClick={()=>onItemSelect(index)}/>:null}</div>)}</div>}
    {button}
  </div></div>{addRow}</>;
}
