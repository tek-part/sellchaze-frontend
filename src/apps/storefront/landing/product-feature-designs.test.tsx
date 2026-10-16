// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProductFeatures } from './ProductFeatures';
import { productFeatureDesigns } from './product-feature-designs';
import { parseLanding, type LandingDocument } from './document';
import { LandingSections } from './LandingSections';
import type { StorefrontContext } from '../theme-engine/rendering';
let host: HTMLDivElement; let root: Root;
beforeEach(() => { Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true}); host=document.createElement('div'); document.body.append(host); root=createRoot(host); });
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.unstubAllGlobals(); });
const context={store:{},data:{}} as unknown as StorefrontContext;
describe('product feature designs',()=>{
 it('renders all44 distinct presets with inert neutral thumbnails and retains extra owned fields',()=>{
  for(const d of productFeatureDesigns){
   const items=Array.from({length:7},(_,i)=>({title:`Own ${i}`,text:'Own description',image:{url:'/own.png',link_url:'/own-destination'},caption:'Own caption'}));
   const settings={variant:d.id,title:'Own heading',description:'Own description',image:{url:'/own.png',link_url:'/own-destination'},items,motion:false};const before=JSON.stringify(settings);
   const html=renderToStaticMarkup(<ProductFeatures settings={settings} />);
   expect(html).toContain(`data-design="${d.id}"`);expect(html).toContain('Own 6');expect(html).toContain('href="/own-destination"');expect(JSON.stringify(settings)).toBe(before);
   const thumbnail=renderToStaticMarkup(<ProductFeatures settings={{variant:d.id}} preview thumbnail />);
   expect(thumbnail).not.toMatch(/<button|<a |<iframe|easy-orders|⭐⭐/); expect(thumbnail).toContain('/landing-illustrations/product-features/');
  }
 });
 it('selects the clicked editor card and sends public purchase to one existing form',async()=>{
  const select=vi.fn(),purchase=vi.fn();await act(async()=>root.render(<ProductFeatures settings={{variant:'product-features-1',items:[{title:'First'},{title:'Second'}]}} preview onItemSelect={select} onPurchase={purchase}/>));
  await act(async()=>host.querySelector<HTMLButtonElement>('[aria-label="تعديل ميزة المنتج 2"]')!.click());expect(select).toHaveBeenCalledWith(1);expect(purchase).not.toHaveBeenCalled();
  const doc:LandingDocument={schema:1,mode:'standalone',sections:[{id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',type:'product_features',settings:{variant:'product-features-44',title:'Own',button_text:'Own purchase'}},{id:'checkout',type:'checkout',settings:{}}]};
  await act(async()=>root.render(<LandingSections document={doc} context={context} checkout={<form/>}/>));const scroll=vi.fn();Object.assign(host.querySelector('[data-landing-checkout]')!,{scrollIntoView:scroll});vi.stubGlobal('matchMedia',()=>({matches:true}));
  await act(async()=>host.querySelector<HTMLButtonElement>('.lp-pf-purchase')!.click());expect(scroll).toHaveBeenCalledWith({behavior:'auto',block:'start'});expect(host.querySelectorAll('form')).toHaveLength(1);
 });
 it('isolates custom CSS and owner HTML, preserves full CSS allowance and explicit clears',async()=>{
  const css='/*'+'x'.repeat(11600)+'*/ .author-name { color: red }';
  await act(async()=>root.render(<ProductFeatures settings={{variant:'product-features-44',title:'Own <heading>',items:[{title:'Extra',text:'Own text'}],html:'<script>bad()</script><p>Own HTML</p>',css,button_text:''}}/>));
  const frame=host.querySelector('iframe')!,html=frame.getAttribute('srcdoc')!,dom=new DOMParser().parseFromString(html,'text/html');
  expect(html).toContain(css);expect(html).toContain('Own HTML');expect(html).toContain('@layer native');expect(html).not.toContain('bad()');expect(dom.querySelector('.lp-pf-purchase')).toBeNull();expect(frame.getAttribute('sandbox')).not.toContain('allow-same-origin');expect(dom.querySelectorAll('script')).toHaveLength(1);expect(dom.querySelector('h4')!.textContent).toBe('Own <heading>');
 });
 it('retains legacy rendering and scopes the variant family across import/export',()=>{
  const doc:LandingDocument={schema:1,mode:'standalone',sections:[{id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',type:'product_features',settings:{title:'Own legacy',items:[{title:'Own item'}]}}]};
  expect(renderToStaticMarkup(<LandingSections document={doc} context={context}/>)).toContain('Own legacy');
  for(const d of productFeatureDesigns)expect(parseLanding({...doc,sections:[{...doc.sections[0],settings:{variant:d.id}}]})).not.toBeNull();
  for(const [type,variant]of [['product_features','product-features-45'],['product_features','product-features-0'],['content','product-features-1'],['product_features','features-1'],['checkout','product-features-44']])expect(parseLanding({...doc,sections:[{...doc.sections[0],type,settings:{variant}}]})).toBeNull();
 });
});
