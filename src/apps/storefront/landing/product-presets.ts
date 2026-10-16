import { loadProductPresetPage, productPagePresets, productPresetIndex } from './product-presets.generated';
import type { LandingDocument, LandingImage, LandingSection,LandingType } from './document';
import type { ProductPresetFragment, ProductPresetKind } from './product-preset-types';
import { productPresetRichContent } from './product-preset-content';

export { productPagePresets, productPresetIndex };
export const presetLabels:Record<ProductPresetKind,string>={html:'محتوى',advanced:'وصف المنتج',features:'مميزات المنتج',reviews:'آراء العملاء',faq:'الأسئلة الشائعة',purchase:'زر الشراء',gallery:'معرض الصور',video:'فيديو المنتج',countdown:'العداد التنازلي',testimonials:'شهادات العملاء',text:'نص وصورة'};
export function presetSectionFamily(id:string):LandingType|undefined{
  const kind=productPresetIndex[id]?.kind;
  const families:Partial<Record<ProductPresetKind,LandingType>>={advanced:'product_description',features:'product_features',reviews:'reviews',faq:'faq',purchase:'buy_button',gallery:'gallery',video:'video',countdown:'countdown',testimonials:'custom_reviews',text:'content'};
  return kind?families[kind]:undefined;
}
const cache=new Map<string,Promise<ProductPresetFragment[]>>();
export function productPresetPage(id:string){
  if(!Object.hasOwn(productPresetIndex,id)&&!productPagePresets.some(page=>page.id===id))return Promise.reject(new Error('القالب غير موجود.'));
  const page=productPresetIndex[id]?.page??id;
  if(!cache.has(page))cache.set(page,loadProductPresetPage(page).catch(error=>{cache.delete(page);throw error;}));
  return cache.get(page)!;
}
export interface PresetProduct {name?:string;title?:string;description?:string;media?:Array<LandingImage&{id?:number;type?:string}>}
export async function createProductPreset(id:string,product:PresetProduct):Promise<LandingDocument>{
  const page=productPagePresets.find(p=>p.id===id);if(!page)throw new Error('القالب غير موجود.');
  const fragments=await productPresetPage(id);
  const images:LandingImage[]=(product.media??[]).filter(image=>image.type!=='video'&&(image.url||image.id)).map(image=>({...image.id?{media_id:image.id}:{},...image.url?{url:image.url}:{},alt:image.alt||product.name||product.title||''}));
  const name=(product.name||product.title||'المنتج').slice(0,300);
  const description=(new DOMParser().parseFromString(product.description??'','text/html').body.textContent??'').slice(0,2000);
  const sections:LandingSection[]=fragments.map(fragment=>{
    const settings:LandingSection['settings']={preset_section:fragment.id,preset_css_mode:'template'};
    if(fragment.pageStyle)settings.background_image={url:'/landing-illustrations/product-pages/ramadan-paper.svg',alt:''};
    if(fragment.title)settings.title=['advanced','text'].includes(fragment.kind)?name:fragment.kind==='html'?'تفاصيل العرض':presetLabels[fragment.kind];
    if(fragment.description)settings.description=['advanced','text'].includes(fragment.kind)?description:'';
    if(fragment.richTemplate)settings.html=productPresetRichContent(fragment.richTemplate,product).slice(0,20000);
    if(fragment.image&&images[0])settings.image=images[0];
    if(fragment.kind==='gallery')settings.images=images.slice(0,30);
    if(fragment.purchase)settings.button_text='الشراء الآن';
    if(fragment.kind==='features')settings.items=Array.from({length:fragment.itemCount},()=>({title:'',text:''}));
    if(['reviews','testimonials','faq'].includes(fragment.kind))settings.items=[];
    if(fragment.kind==='countdown')settings.hours=4;
    return {id:crypto.randomUUID(),type:'product_preset',settings};
  });
  if(page.mode==='standalone')sections.push({id:crypto.randomUUID(),type:'checkout',settings:{}});
  return {schema:1,mode:page.mode,sections};
}

/** A complete imported layout remains one undoable document operation. */
export function applyProductPreset(current:LandingDocument,next:LandingDocument,append=false):LandingDocument{
  if(!append)return next;
  const mode=current.mode==='standard'?next.mode:current.mode;
  const hasCheckout=current.sections.some(section=>section.type==='checkout');
  const sections=[...current.sections,...next.sections.filter(section=>section.type!=='checkout'||!hasCheckout&&mode!=='below')];
  if(sections.length>60)throw new Error('تدعم الصفحة 60 قسمًا كحد أقصى. احذف بعض الأقسام أو استبدل الصفحة بالقالب.');
  return {...current,mode,sections};
}
