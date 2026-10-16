// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NativeReviews } from './NativeReviews';
import { reviewDesigns } from './review-designs';
import { parseLanding, type LandingDocument } from './document';
import { LandingSections } from './LandingSections';
import { StaticLandingFrame, nativeLandingMarkup, type NativeLandingMarkup } from './StaticLandingFrame';
import type { StorefrontContext } from '../theme-engine/rendering';
let host:HTMLDivElement;let root:Root;
beforeEach(()=>{Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});host=document.createElement('div');document.body.append(host);root=createRoot(host);});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.unstubAllGlobals();vi.restoreAllMocks();});
const context={store:{},data:{}} as unknown as StorefrontContext;
describe('native review layouts',()=>{
 it('keeps47 presets native, neutral gallery previews inert and seven owned reviews intact',()=>{
  for(const d of reviewDesigns){
   const settings={variant:d.id,title:'Owned heading',items:Array.from({length:7},(_,i)=>({title:`Owned ${i}`,author:`Author ${i}`,text:'Owned experience',image:{url:'/own.png'},rating:4,caption:'Owned note',platform:'Owned source',date:'2026-10-16'})),motion:false};const before=JSON.stringify(settings);const html=renderToStaticMarkup(<NativeReviews settings={settings}/>);
   expect(html).toContain(`data-design="${d.id}"`);expect(html).toContain('Author 6');expect(html).toContain('Owned experience');expect(JSON.stringify(settings)).toBe(before);
   const preview=renderToStaticMarkup(<NativeReviews settings={{variant:d.id}} preview thumbnail/>);expect(preview).not.toMatch(/<button|<a |<iframe|easy-orders|مراجع موثوق|أوصي بهذا المنتج/);expect(preview).toContain('اسم صاحب التقييم');
  }
 });
 it('never supplies a review score or verification claim when the owner has not entered it',()=>{
  const plain=renderToStaticMarkup(<NativeReviews settings={{variant:'reviews-1',items:[{title:'Owner',text:'Own experience'}]}}/>);expect(plain).toContain('data-rating=""');expect(plain).not.toContain('⭐⭐⭐⭐⭐');expect(plain).not.toMatch(/verified|موثوق/);
  const supplied=renderToStaticMarkup(<NativeReviews settings={{variant:'reviews-1',items:[{title:'Owner',rating:3}]}}/>);expect(supplied).toContain('data-rating="⭐⭐⭐"');expect(supplied).not.toContain('data-rating="⭐⭐⭐⭐⭐"');
 });
 it('selects the exact editor card without following public links or touching commerce',async()=>{
  const select=vi.fn();await act(async()=>root.render(<NativeReviews settings={{variant:'reviews-4',items:[{title:'First',url:'/one'},{title:'Second',url:'/two'}]}} preview onItemSelect={select}/>));await act(async()=>host.querySelector<HTMLButtonElement>('[aria-label="تعديل التقييم 2"]')!.click());expect(select).toHaveBeenCalledWith(1);expect(host.querySelectorAll('a,form')).toHaveLength(0);
  await act(async()=>root.render(<NativeReviews settings={{variant:'reviews-4',items:[{title:'First',url:'/one'}]}}/>));expect(host.querySelector('a')!.getAttribute('href')).toBe('/one');expect(host.querySelectorAll('form')).toHaveLength(0);
 });
 it('retains every long review and separately bounded HTML inside the unchanged sandbox',async()=>{
  const text='Owned & < > " '.repeat(350);const settings={variant:'reviews-1' as const,title:'Own title',items:Array.from({length:30},(_,i)=>({title:`Long ${i}`,text,html:'<p>Own fragment</p><script>bad()</script>'+'x'.repeat(6100)+'<p>Outside item cap</p>'})),html:'<p>Own root</p>'+'x'.repeat(20100)+'<p>Outside root cap</p>',css:'/*'+'x'.repeat(11600)+'*/ .review-text { color: red }'};const before=JSON.stringify(settings);
  await act(async()=>root.render(<NativeReviews settings={settings}/>));const frame=host.querySelector('iframe')!,src=frame.getAttribute('srcdoc')!,dom=new DOMParser().parseFromString(src,'text/html');expect(dom.querySelectorAll('.icon-container')).toHaveLength(30);expect(dom.querySelectorAll('.review-text')[29]!.textContent).toBe(text);expect(src).toContain(settings.css);expect(src).not.toMatch(/Outside item cap|Outside root cap|bad\(\)/);expect(dom.querySelectorAll('script')).toHaveLength(1);expect(frame.getAttribute('sandbox')).not.toContain('allow-same-origin');expect(dom.querySelectorAll('form')).toHaveLength(0);expect(JSON.stringify(settings)).toBe(before);
 });
 it('allows full native layout height while preserving raw HTML limits and message authentication',async()=>{
  await act(async()=>root.render(<StaticLandingFrame title="Native" nativeHtml={nativeLandingMarkup('<div>Own long layout</div>')}/>));let frame=host.querySelector('iframe')!,key=frame.srcdoc.match(/script-src 'nonce-([^']+)'/)![1];
  await act(async()=>window.dispatchEvent(new MessageEvent('message',{source:window,data:{landing:key,height:90000}})));expect(frame.style.height).toBe('160px');
  await act(async()=>window.dispatchEvent(new MessageEvent('message',{source:frame.contentWindow,data:{landing:'wrong',height:90000}})));expect(frame.style.height).toBe('160px');
  await act(async()=>window.dispatchEvent(new MessageEvent('message',{source:frame.contentWindow,data:{landing:key,height:90000}})));expect(frame.style.height).toBe('90000px');
  await act(async()=>root.render(<StaticLandingFrame title="Raw" html={'x'.repeat(20100)+'<p>Outside raw cap</p>'}/>));frame=host.querySelector('iframe')!;key=frame.srcdoc.match(/script-src 'nonce-([^']+)'/)![1];expect(frame.srcdoc).not.toContain('Outside raw cap');await act(async()=>window.dispatchEvent(new MessageEvent('message',{source:frame.contentWindow,data:{landing:key,height:90000}})));expect(frame.style.height).toBe('30000px');
  await act(async()=>root.render(<StaticLandingFrame title="Forged" nativeHtml={{html:'<script>bad()</script>'} as NativeLandingMarkup}/>));expect(host.querySelector('iframe')!.srcdoc).not.toContain('bad()');
 });
 it('keeps real customer reviews and their visibility flag in the legacy path',()=>{
  const doc:LandingDocument={schema:1,mode:'standalone',sections:[{id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',type:'reviews',settings:{title:'Legacy'}}]};const ctx={...context,data:{reviews:[{id:'actual',author:'Actual source author',rating:2,body:'Actual source body'}],product:{id:'own',productPreferences:{is_reviews_enabled:true}}}} as unknown as StorefrontContext;
  const legacy=renderToStaticMarkup(<LandingSections document={doc} context={ctx}/>);expect(legacy).toContain('sf-review-list');expect(legacy).toContain('Actual source body');expect(legacy).not.toContain('lp-native-reviews');
  const hidden={...ctx,data:{...ctx.data,product:{id:'own',productPreferences:{is_reviews_enabled:false}}}} as unknown as StorefrontContext;expect(renderToStaticMarkup(<LandingSections document={doc} context={hidden}/>)).not.toContain('Actual source body');
  const manual={...doc,sections:[{...doc.sections[0]!,settings:{variant:'reviews-1' as const,items:[{title:'Explicit owner review',text:'Owned review'}]}}]};const html=renderToStaticMarkup(<LandingSections document={manual} context={hidden}/>);expect(html).toContain('Owned review');expect(html).not.toContain('Actual source body');
 });
 it('scopes all47 variants to reviews and rejects crossed families without mutation',()=>{
  const doc={schema:1,mode:'standalone',sections:[{id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',type:'reviews',settings:{}}]};for(const d of reviewDesigns)expect(parseLanding({...doc,sections:[{...doc.sections[0],settings:{variant:d.id}}]})).not.toBeNull();
  for(const[type,variant]of[['reviews','reviews-48'],['reviews','reviews-0'],['product_features','reviews-1'],['reviews','testimonials-1'],['checkout','reviews-47']])expect(parseLanding({...doc,sections:[{...doc.sections[0],type,settings:{variant}}]})).toBeNull();
 });
});
