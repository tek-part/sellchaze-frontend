import { StaticLandingFrame } from './StaticLandingFrame';
// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProductDescriptionLayouts } from './ProductDescriptionLayouts';
import { descriptionDesigns } from './description-designs';
import { descriptionRichHtml } from './description-rich';
import { parseLanding, type LandingDocument, type LandingSettings } from './document';
import { LandingSections } from './LandingSections';
import type { StorefrontContext } from '../theme-engine/rendering';

let host:HTMLDivElement,root:Root;
beforeEach(()=>{host=document.createElement('div');document.body.append(host);root=createRoot(host);});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();});
const ctx={store:{},data:{product:{id:'own',title:'Actual product',descriptionHtml:'<p>Actual product description</p>'}},navigation:{header:[],footer:[]},seo:{}} as unknown as StorefrontContext;
describe('native product description designs',()=>{
 it('renders25 distinct native layouts with all owned extra content and inert neutral thumbnails',()=>{
  expect(descriptionDesigns).toHaveLength(25);expect(descriptionDesigns.filter(d=>d.advanced)).toHaveLength(17);
  for(const d of descriptionDesigns){
   const s:LandingSettings={variant:d.id,title:'Owned heading',description:'Owned body',image:{url:'/own.png'},items:Array.from({length:20},(_,i)=>({title:`Owned item ${i}`,text:`Own detail ${i}`})),motion:false};const before=JSON.stringify(s);const html=renderToStaticMarkup(<ProductDescriptionLayouts settings={s}/>);
   expect(html).toContain(`data-design="${d.id}"`);for(let i=0;i<20;i++)expect(html).toContain(`Owned item ${i}`);expect(JSON.stringify(s)).toBe(before);
   const gallery=renderToStaticMarkup(<ProductDescriptionLayouts settings={{variant:d.id}} preview thumbnail/>);expect(gallery).not.toMatch(/<button|<a |<iframe|easy-orders|Medik8|adidas|EcoRide/);expect(gallery).toContain('عن المنتج');
  }
 });
 it('escapes field text and isolates separately bounded owner HTML and full CSS without losing long lists',async()=>{
  const text='Owned < & > content. '.repeat(220);const s:LandingSettings={variant:'description-15',title:'<img src=x onerror=bad()>',items:Array.from({length:30},(_,i)=>({title:`Item ${i}`,text,html:'<p>Own fragment</p><script>bad()</script>'+'x'.repeat(6100)+'<p>Outside item cap</p>'})),css:'/*'+'x'.repeat(11600)+'*/ h4 { color:red }'};
  await act(async()=>root.render(<ProductDescriptionLayouts settings={s}/>));const frame=host.querySelector('iframe')!;const dom=new DOMParser().parseFromString(frame.srcdoc,'text/html');expect(frame.srcdoc).toContain(s.css);expect(frame.srcdoc).toContain('Item 29');expect(dom.body.textContent).toContain(text);expect(frame.srcdoc).not.toMatch(/Outside item cap|bad\(\)<\/script>/);expect(frame.getAttribute('sandbox')).not.toContain('allow-same-origin');expect(host.querySelector('img[src=x]')).toBeNull();expect(dom.querySelectorAll('script')).toHaveLength(1);
 });
 it('supports deliberate formatted content, empty clears and recovering every original field',async()=>{
  const original:LandingSettings={variant:'description-13',title:'Keep original title',description:'Keep original body',items:[{title:'Keep original item'}]};const s={...original,description_mode:'formatted' as const,html:'<h2>Edited owner heading</h2><ul><li>Edited list</li></ul>'};const before=JSON.stringify(s);
  await act(async()=>root.render(<ProductDescriptionLayouts settings={s}/>));expect(host.querySelector('iframe')!.srcdoc).toContain('Edited owner heading');expect(host.querySelector('iframe')!.srcdoc).not.toContain('Keep original title');expect(JSON.stringify(s)).toBe(before);
  expect(renderToStaticMarkup(<ProductDescriptionLayouts settings={{...s,html:''}}/>)).toBe('');
  const fields=renderToStaticMarkup(<ProductDescriptionLayouts settings={{...s,description_mode:'fields'}}/>);expect(fields).toContain('Keep original title');expect(fields).toContain('Keep original item');expect(fields).not.toContain('Edited owner heading');
 });
 it('edits a particular card or rich body without following links and reuses the existing purchase action',async()=>{
  const select=vi.fn(),rich=vi.fn(),purchase=vi.fn();await act(async()=>root.render(<ProductDescriptionLayouts settings={{variant:'description-3',items:[{title:'One',url:'/one'},{title:'Two',url:'/two'}]}} preview onItemSelect={select}/>));await act(async()=>host.querySelector<HTMLButtonElement>('[aria-label="تعديل بطاقة الوصف 2"]')!.click());expect(select).toHaveBeenCalledWith(1);expect(host.querySelector('a')).toBeNull();
  await act(async()=>root.render(<ProductDescriptionLayouts settings={{variant:'description-1',title:'Owned'}} preview onRichSelect={rich}/>));await act(async()=>host.querySelector<HTMLButtonElement>('[aria-label="تعديل نص وصف المنتج"]')!.click());expect(rich).toHaveBeenCalledOnce();
  await act(async()=>root.render(<ProductDescriptionLayouts settings={{variant:'description-15',title:'Owned'}} onPurchase={purchase}/>));await act(async()=>host.querySelector<HTMLButtonElement>('[data-purchase]')!.click());expect(purchase).toHaveBeenCalledOnce();expect(host.querySelector('form')).toBeNull();expect(renderToStaticMarkup(<ProductDescriptionLayouts settings={{variant:'description-15',title:'Owned',button_text:''}}/>)).not.toContain('data-purchase');
 });
 it('preserves nested lists, heading levels and the legacy actual product description path',()=>{
  const html=descriptionRichHtml({variant:'description-18',title:'Owned title',items:Array.from({length:12},(_,i)=>({title:`Own ${i}`}))});expect(html).toMatch(/<ul/);expect(html).toMatch(/<ol/);expect(html).toContain('ql-indent-1');expect(html).toContain('Own 11');
  const doc:LandingDocument={schema:1,mode:'standalone',sections:[{id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',type:'product_description',settings:{title:'Legacy'}}]};const output=renderToStaticMarkup(<LandingSections document={doc} context={ctx}/>);expect(output).toContain('Actual product description');expect(output).not.toContain('lp-pd');
 });
 it('authenticates editor selection inside a native frame and never enables selection on raw owner HTML',async()=>{
  const select=vi.fn(),editPurchase=vi.fn(),editImage=vi.fn();await act(async()=>root.render(<ProductDescriptionLayouts settings={{variant:'description-3',items:[{title:'One'},{title:'Two'}],css:'.author-name { color:red }'}} preview onItemSelect={select} onPurchaseSelect={editPurchase} onImageSelect={editImage}/>));let frame=host.querySelector('iframe')!,key=frame.srcdoc.match(/script-src 'nonce-([^']+)'/)![1];expect(frame.srcdoc).toContain('data-landing-item="1"');expect(frame.srcdoc).toContain('const editing=true');
  for(const data of [{landing:'wrong',item:1},{landing:key,item:-1},{landing:key,item:30},{landing:key,item:'1'}])await act(async()=>window.dispatchEvent(new MessageEvent('message',{source:frame.contentWindow,data})));
  await act(async()=>window.dispatchEvent(new MessageEvent('message',{source:window,data:{landing:key,item:1}})));expect(select).not.toHaveBeenCalled();
  await act(async()=>window.dispatchEvent(new MessageEvent('message',{source:frame.contentWindow,data:{landing:key,item:1}})));expect(select).toHaveBeenCalledExactlyOnceWith(1);
  await act(async()=>window.dispatchEvent(new MessageEvent('message',{source:frame.contentWindow,data:{landing:key,editPurchase:true}})));expect(editPurchase).toHaveBeenCalledOnce();
  await act(async()=>window.dispatchEvent(new MessageEvent('message',{source:frame.contentWindow,data:{landing:key,editImage:true}})));expect(editImage).toHaveBeenCalledOnce();
  await act(async()=>root.render(<StaticLandingFrame title="Raw" html='<div data-landing-item="1">Owned</div>' onItemSelect={select}/>));frame=host.querySelector('iframe')!;key=frame.srcdoc.match(/script-src 'nonce-([^']+)'/)![1];expect(frame.srcdoc).toContain('const editing=false');await act(async()=>window.dispatchEvent(new MessageEvent('message',{source:frame.contentWindow,data:{landing:key,item:1}})));expect(select).toHaveBeenCalledTimes(1);
 });
 it('allows deleting the full template CSS while retaining original content and the stored custom rules on recovery',async()=>{
  const s:LandingSettings={variant:'description-1',title:'Owned title',description:'Owned body',items:[{title:'Own list item'}],description_css_mode:'custom',css:''};await act(async()=>root.render(<ProductDescriptionLayouts settings={s}/>));const frame=host.querySelector('iframe')!,doc=new DOMParser().parseFromString(frame.srcdoc,'text/html');expect(doc.body.textContent).toContain('Owned title');expect(frame.srcdoc).not.toContain('shape-3.png');expect(frame.srcdoc).not.toContain('lp-pd-1-bounce');expect(frame.srcdoc).not.toContain('.lp-pd.lp-pd--1{padding:');
  const recovery={...s,description_css_mode:'template' as const,css:'h4 { color:magenta }'};const before=JSON.stringify(recovery);const native=renderToStaticMarkup(<ProductDescriptionLayouts settings={recovery}/>);expect(native).toContain('lp-pd--1');expect(native).not.toContain('iframe');expect(JSON.stringify(recovery)).toBe(before);
 });
 it('rejects crossed families and misplaced modes while accepting all25 variants',()=>{
  const base={schema:1,mode:'standalone',sections:[{id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',type:'product_description',settings:{}}]};for(const d of descriptionDesigns)expect(parseLanding({...base,sections:[{...base.sections[0],settings:{variant:d.id,description_mode:'formatted'}}]})).not.toBeNull();
  for(const[type,settings]of[['product_description',{variant:'description-26'}],['reviews',{variant:'description-1'}],['content',{description_mode:'formatted'}],['product_description',{description_mode:'formatted'}],['product_description',{variant:'description-1',description_mode:'bad'}]])expect(parseLanding({...base,sections:[{...base.sections[0],type,settings}]})).toBeNull();
 });
});
