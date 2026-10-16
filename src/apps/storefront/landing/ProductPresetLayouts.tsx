import { useEffect,useState } from 'react';
import type { LandingSection,LandingDocument } from './document';
import type { ProductPresetFragment } from './product-preset-types';
import { productPresetPage,presetLabels } from './product-presets';
import { productPresetMarkup } from './product-preset-content';
import { StaticLandingFrame,nativeLandingMarkup } from './StaticLandingFrame';
import { useCountdownClock } from './useCountdownClock';
import sharedCss from './product-preset-shared.css?inline';
import baseCss from './product-preset-base.css?inline';

export function ProductPresetLayouts({section,productId='',preview=false,phonePreview=false,thumbnail=false,onItemSelect,onImageSelect,onTextSelect,onPurchase,onEditPurchase}:{section:LandingSection;productId?:string;preview?:boolean;phonePreview?:boolean;thumbnail?:boolean;onItemSelect?:(index:number)=>void;onImageSelect?:(index:number|'hero'|'secondary')=>void;onTextSelect?:(field:'title'|'description')=>void;onPurchase?:()=>void;onEditPurchase?:()=>void}){
  const s=section.settings;
  const [fragment,setFragment]=useState<ProductPresetFragment>();
  const [failed,setFailed]=useState(false);
  useEffect(()=>{let active=true;setFragment(undefined);setFailed(false);if(s.preset_section)productPresetPage(s.preset_section).then(rows=>{if(active)setFragment(rows.find(row=>row.id===s.preset_section));}).catch(()=>{if(active)setFailed(true);});return()=>{active=false;};},[s.preset_section]);
  if(failed)return <p role="alert">تعذّر تحميل القالب. أعد فتح الصفحة.</p>;
  if(!fragment)return <div aria-busy="true" style={{minHeight:thumbnail?180:40}}/>;
  if(fragment.pageStyle)return preview?<div className="pl-preset-page-style">خلفية الصفحة — عدّل لونها أو صورتها من الإعدادات</div>:null;
  const hasItems=s.items?.some(item=>item.title?.trim()||item.author?.trim()||item.text?.trim()||item.html?.trim()||item.image?.url);
  if(!preview&&['features','reviews','testimonials','faq'].includes(fragment.kind)&&!hasItems&&!s.description&&!s.html&&!s.image&&(!s.title||s.title===presetLabels[fragment.kind]))return null;
  return <PresetFrame fragment={fragment} section={section} productId={productId} preview={preview} phonePreview={phonePreview} thumbnail={thumbnail} onItemSelect={onItemSelect} onImageSelect={onImageSelect} onTextSelect={onTextSelect} onPurchase={onPurchase} onEditPurchase={onEditPurchase}/>;
}
function PresetFrame({fragment,section,productId,preview,phonePreview,thumbnail,onItemSelect,onImageSelect,onTextSelect,onPurchase,onEditPurchase}:Parameters<typeof ProductPresetLayouts>[0]&{fragment:ProductPresetFragment}){
  const s=section.settings,clock=useCountdownClock(productId??'',section.id,s.hours??4,s.ends_at??undefined,thumbnail||fragment.kind!=='countdown');
  const html=productPresetMarkup(fragment,s,{foreground:s.foreground,secondaryForeground:s.secondary_foreground,background:s.background,backgroundImage:s.background_image,align:s.align,descriptionAlign:s.preset_description_align,motion:!preview&&s.motion!==false,padding:s.padding,radius:s.radius,fontSize:s.font_size,clockColor:s.accent,clockLabelColor:s.icon_color});
  return <StaticLandingFrame title={s.title||'قسم صفحة المنتج'} nativeHtml={nativeLandingMarkup(html)} baseCss={sharedCss+baseCss+(s.preset_css_mode==='custom'?'':fragment.css)} css={s.preset_css_mode==='template'?'':s.css} pageViewport={phonePreview||thumbnail?'fragment':true} nativeFeatures={{accordion:fragment.kind==='faq',carousel:fragment.kind==='testimonials',video:s.video}} countdown={fragment.kind==='countdown'?clock:undefined} onItemSelect={preview?(fragment.kind==='gallery'&&onImageSelect?index=>onImageSelect(index):onItemSelect):undefined} onEditImage={preview&&onImageSelect?()=>onImageSelect('hero'):undefined} onTextSelect={preview?onTextSelect:undefined} onEditPurchase={preview?onEditPurchase:undefined} onPurchase={preview?undefined:onPurchase}/>;
}

/** One static frame previews the entire composition without mounting timers or media players. */
export function ProductPresetThumbnail({document:doc}:{document:LandingDocument}){
  const first=doc.sections.find(section=>section.type==='product_preset')?.settings.preset_section;
  const [fragments,setFragments]=useState<ProductPresetFragment[]>([]);
  useEffect(()=>{let active=true;if(first)productPresetPage(first).then(rows=>{if(active)setFragments(rows);}).catch(()=>{});return()=>{active=false;};},[first]);
  if(!fragments.length)return <span>جارٍ تحميل المعاينة…</span>;
  const sections=doc.sections.filter(section=>section.type==='product_preset');
  const markup=fragments.filter(fragment=>!fragment.pageStyle).map(fragment=>{
    const section=sections.find(section=>section.settings.preset_section===fragment.id);if(!section)return '';
    const settings={...section.settings};
    if(fragment.regions.some(region=>region.kind==='items')&&!settings.items?.some(item=>item.title||item.text||item.author))settings.items=Array.from({length:fragment.itemCount||3},(_,index)=>({title:fragment.kind==='faq'?`سؤال ${index+1}`:fragment.kind==='reviews'||fragment.kind==='testimonials'?'اسم العميل':'عنوان الميزة',text:fragment.kind==='faq'?'إجابة السؤال':fragment.kind==='reviews'||fragment.kind==='testimonials'?'رأي العميل':'تفاصيل الميزة'}));
    return productPresetMarkup(fragment,settings,{motion:false});
  }).join('');
  return <StaticLandingFrame title="معاينة تصميم الصفحة ببيانات توضيحية" nativeHtml={nativeLandingMarkup(markup)} baseCss={sharedCss+baseCss+fragments.map(fragment=>fragment.css).join('\n')}/>;
}
