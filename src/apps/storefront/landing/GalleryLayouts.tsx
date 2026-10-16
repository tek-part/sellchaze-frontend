import { useMemo, type CSSProperties, type MouseEvent } from 'react';
import { landingUrl, type LandingImage, type LandingSettings } from './document';
import { galleryDesign } from './gallery-designs';
import { escapeDescription as escape } from './description-rich';
import { StaticLandingFrame, nativeLandingMarkup, landingStaticHtml } from './StaticLandingFrame';
import { useLandingReveal } from './useLandingReveal';
import css from './gallery-layouts.css?inline';
import './gallery-layouts.css';

export const hasGalleryContent=(s:LandingSettings)=>!!(s.title?.trim()||s.description?.trim()||s.html?.trim()||s.images?.some(i=>i.url&&landingUrl(i.url))||s.items?.some(i=>i.title?.trim()||i.text?.trim()||i.html?.trim()||i.image?.url&&landingUrl(i.image.url)));
const photo=(image?:LandingImage)=>image?.url&&landingUrl(image.url)?`<img src="${escape(image.url)}" alt="${escape(image.alt??'')}" loading="lazy" data-landing-image>`:'';
/** Generated wrappers contain escaped fields only; owner fragments are sanitized separately. */
export function galleryMarkup(s:LandingSettings,preview=false,thumbnail=false,editText=preview):string{
  const d=galleryDesign(s.variant);const example=thumbnail;
  const images=example?Array.from({length:d.count},(_,i)=>({url:`/landing-illustrations/galleries/image-${i%4+1}.svg`,alt:''})):s.images??[];
  const sample=(text:string,length:number)=>text.repeat(Math.ceil(length/text.length)).slice(0,length);
  const title=example?sample('صور المنتج وتفاصيله ',d.sample[0]??0):s.title??'';
  const description=example?sample('تعرّف على المنتج من جميع الزوايا والتفاصيل. ',d.sample[1]??0):s.description??'';
  const header=`<header class="lg-heading"${d.index===4?' data-landing-reveal':''}>${title?`<h3${editText&&!thumbnail?' data-gallery-text="title" tabindex="0" role="button" aria-label="تعديل عنوان المعرض"':''}>${escape(title)}</h3>`:''}${description?`<p class="lg-description"${editText&&!thumbnail?' data-gallery-text="description" tabindex="0" role="button" aria-label="تعديل وصف المعرض"':''}>${escape(description)}</p>`:''}</header>`;
  const cells=images.map((image,index)=>`<div class="lg-cell"><div class="lg-image"${preview&&!thumbnail?` data-landing-item="${index}" tabindex="0" role="button" aria-label="تعديل صورة المعرض ${index+1}"`:''}>${photo(image)}</div></div>`).join('');
  return `${header}<div class="lg-grid">${cells}</div>`;
}
export function GalleryLayouts({settings:s,preview=false,thumbnail=false,phonePreview=false,onImageSelect,onTextSelect,onAddImage}:{settings:LandingSettings;preview?:boolean;thumbnail?:boolean;phonePreview?:boolean;onImageSelect?:(index:number)=>void;onTextSelect?:(field:'title'|'description')=>void;onAddImage?:()=>void}){
  const d=galleryDesign(s.variant);const markup=galleryMarkup(s,preview&&!!onImageSelect,thumbnail,preview&&!!onTextSelect);const content=useMemo(()=>({__html:markup}),[markup]);const ref=useLandingReveal(!preview&&s.motion!==false,d.id,markup);
  if(!preview&&!hasGalleryContent(s))return null;
  const style={...(s.background?{backgroundColor:s.background}:{}),...(s.foreground?{'--lg-title':s.foreground}:{}),...(s.secondary_foreground?{'--lg-description':s.secondary_foreground}:{}),...(s.align?{'--lg-align':s.align}:{}),...(s.gallery_description_align?{'--lg-description-align':s.gallery_description_align}:{}),...(s.padding!==undefined?{'--lg-padding':`${s.padding}px`}:{}),...(s.font_size?{'--lg-font-size':`${s.font_size}px`}:{}),...(s.background_image?.url&&landingUrl(s.background_image.url)?{backgroundImage:`url(${JSON.stringify(s.background_image.url)})`,backgroundSize:'cover',backgroundPosition:'center'}:{})} as CSSProperties;
  const classes=`lp-gallery lp-gallery--${d.index}`;
  const extra=(s.items??[]).map(i=>`<article>${i.image?photo(i.image):''}${i.title?`<h4>${escape(i.title)}</h4>`:''}${i.text?`<p>${escape(i.text)}</p>`:''}${landingStaticHtml((i.html??'').slice(0,6000))}${i.url&&landingUrl(i.url)?`<a href="${escape(i.url)}">عرض التفاصيل</a>`:''}</article>`).join('');
  const isolated=!thumbnail&&(preview&&phonePreview||!!s.css?.trim()||!!s.html?.trim()||!!extra);
  const choose=(node:Element)=>{const cell=node.closest('[data-landing-item]');if(cell){onImageSelect?.(Number(cell.getAttribute('data-landing-item')));return;}const field=node.closest('[data-gallery-text]')?.getAttribute('data-gallery-text');if(field==='title'||field==='description')onTextSelect?.(field);};
  const click=(event:MouseEvent<HTMLDivElement>)=>{if(preview&&event.target instanceof Element)choose(event.target);};
  const add=preview&&!thumbnail&&onAddImage?<div className="lg-add"><button type="button" disabled={(s.images?.length??0)>=30} onClick={onAddImage}>اضافة صورة جديدة</button></div>:null;
  if(isolated){
    const inline=Object.entries(style).map(([key,value])=>`${key.replace(/[A-Z]/g,c=>'-'+c.toLowerCase())}:${value}`).join(';');
    // The existing authenticated image bridge carries the index. Header editing uses
    // separate title/description selectors only in the parent preview below.
    const body=galleryMarkup(s,false).replace(/<div class="lg-image">/g,(()=>{let index=0;return()=>`<div class="lg-image" data-landing-item="${index++}">`;})());
    const html=`<div class="${classes}" data-motion="${preview||s.motion===false?'paused':'playing'}" style="${escape(inline)}">${body}<div class="lg-extra">${extra}${landingStaticHtml(s.html??'')}</div></div>`;
    return <><StaticLandingFrame title={s.title||'معرض الصور'} nativeHtml={nativeLandingMarkup(html)} css={s.css} baseCss={`@layer native{${css}}`} pageViewport={phonePreview?'fragment':true} onItemSelect={preview?onImageSelect:undefined}/>{preview&&onTextSelect?<div className="lg-frame-text"><button type="button" onClick={()=>onTextSelect('title')}>تعديل عنوان المعرض</button><button type="button" onClick={()=>onTextSelect('description')}>تعديل وصف المعرض</button></div>:null}{add}</>;
  }
  return <><div ref={ref} className={classes} data-motion={preview||s.motion===false?'paused':'playing'} data-thumbnail={thumbnail||undefined} style={style} onClick={click} onKeyDown={e=>{if(preview&&(e.key==='Enter'||e.key===' ')&&e.target instanceof Element&&e.target.matches('[data-landing-item],[data-gallery-text]')){e.preventDefault();choose(e.target);}}} dangerouslySetInnerHTML={content}/>{add}</>;
}
