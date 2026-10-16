import { descriptionDesign, type DescriptionNode } from './description-designs';
import { landingUrl, type LandingSettings } from './document';
import { landingStaticHtml } from './StaticLandingFrame';

export const escapeDescription = (value: string) => value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]!);
export const hasDescriptionContent = (s: LandingSettings) => {
  if(s.description_mode==='formatted')return !!(s.html?.trim()||s.image?.url&&landingUrl(s.image.url));
  const content=!!(s.description_mode!=='fields'&&s.html?.trim()||s.items?.some(i=>i.title?.trim()||i.text?.trim()||i.html?.trim()||i.image?.url&&landingUrl(i.image.url)));
  return descriptionDesign(s.variant).advanced?!!(content||s.title?.trim()||s.description?.trim()||s.eyebrow?.trim()||s.image?.url&&landingUrl(s.image.url)):content;
};

/** This schema contains only native element/formatting definitions, never Source business text. */
export function descriptionRichHtml(s: LandingSettings, examples = false): string {
  const d = descriptionDesign(s.variant); const items=s.items??[];
  const text=(node:DescriptionNode,overrideIndex?:number) => {
    const item=items[overrideIndex??node.index??0];
    const value=node.slot==='title'?s.title:node.slot==='description'?s.description:node.field==='title'?item?.title:node.field==='text'?item?.text:[item?.title,item?.text].filter(Boolean).join('\n');
    if(value!==undefined && value!=='')return escapeDescription(value).replace(/\n/g,'<br>');
    if(!examples)return '';
    if(node.slot==='title')return 'عن المنتج';
    const sentence=node.slot==='description'?'اكتب وصف المنتج وتفاصيله هنا. ':'تفصيل مملوك عن المنتج. ';
    return sentence.repeat(Math.ceil(Math.min(node.length??30,300)/sentence.length)).slice(0,Math.min(node.length??30,300));
  };
  const render=(node:DescriptionNode,overrideIndex?:number):string=>{
    if(!node.tag)return text(node,overrideIndex);
    let body=(node.children??[]).map(child=>render(child,overrideIndex)).join('');
    if(node.repeat){const template=node.children?.at(-1);if(template)body+=items.slice(d.count).map((_,i)=>render(template,d.count+i)).join('');}
    if(!body && node.tag!=='br')return '';
    const alignment=/ql-align-(right|left|center|justify)/.exec(node.class??'')?.[1];
    const nativeStyle=(node.style??'')+(alignment?`;text-align:var(--pd-align,${alignment})`:'');
    const attrs=(node.class?` class="${escapeDescription(node.class)}"`:'')+(nativeStyle?` style="${escapeDescription(nativeStyle.replace(/text-align:\s*(right|left|center|justify|start|end)/g,'text-align:var(--pd-align,$1)'))}"`:'');
    return `<${node.tag}${attrs}>${body}</${node.tag}>`;
  };
  const repeating=(node:DescriptionNode):boolean=>!!node.repeat||(node.children??[]).some(repeating);
  const headingTemplates=(d.schema.children??[]).filter(n=>n.tag&&/^h[1-6]$/.test(n.tag)).slice([17,20,21,23].includes(Number(d.id.slice(12)))?-2:-1);
  const extra=repeating(d.schema)?'':items.slice(d.count).map((_,i)=>headingTemplates.map(node=>render(node,d.count+i)).join('')).join('');
  const fragments=items.map(i=>(i.html?`<div class="pd-item-html">${landingStaticHtml(i.html.slice(0,6000))}</div>`:'')+(i.url&&landingUrl(i.url)?`<a href="${escapeDescription(i.url)}">عرض التفاصيل</a>`:'')).join('');
  const additionalDescription=!d.slots.some(n=>n.slot==='description')&&s.description?`<h2>${escapeDescription(s.description)}</h2>`:'';
  return (s.eyebrow?`<h4>${escapeDescription(s.eyebrow)}</h4>`:'')+(d.schema.children??[]).map((node,i)=>render(node)+(i===0?additionalDescription:'')).join('')+extra+fragments;
}
