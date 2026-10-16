// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NativeReviews } from './NativeReviews';
let host:HTMLDivElement,root:Root;let callback:IntersectionObserverCallback;let observer:IntersectionObserver;
beforeEach(()=>{Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});host=document.createElement('div');document.body.append(host);root=createRoot(host);vi.stubGlobal('matchMedia',()=>({matches:false}));
 vi.stubGlobal('IntersectionObserver',class{constructor(cb:IntersectionObserverCallback){callback=cb;observer=this as unknown as IntersectionObserver;}observe=vi.fn();unobserve=vi.fn();disconnect=vi.fn();});});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.unstubAllGlobals();});
const settings={variant:'reviews-1' as const,title:'Own',items:[{title:'First',image:{url:'/owned.png'}},{title:'Second'}]};
describe('viewport entry motion',()=>{
 it('reveals only intersecting cards and waits for an owned image to load',async()=>{
  await act(async()=>root.render(<NativeReviews settings={settings}/>));const cards=host.querySelectorAll<HTMLElement>('.icon-container'),image=host.querySelector('img')!;
  expect(cards[0]!.classList.contains('lp-reveal-pending')).toBe(true);expect(cards[1]!.classList.contains('lp-reveal-pending')).toBe(true);
  await act(async()=>callback([{target:cards[0]!,isIntersecting:true},{target:image,isIntersecting:true}]as unknown as IntersectionObserverEntry[],observer));
  expect(cards[0]!.classList.contains('lp-reveal-entered')).toBe(true);expect(cards[1]!.classList.contains('lp-reveal-entered')).toBe(false);expect(image.classList.contains('lp-image-pending')).toBe(true);
  Object.defineProperty(image,'naturalWidth',{value:200});await act(async()=>image.dispatchEvent(new Event('load')));expect(image.classList.contains('lp-image-entered')).toBe(true);expect(image.classList.contains('lp-image-pending')).toBe(false);
 });
 it('leaves content visible when motion is disabled or the user reduces motion',async()=>{
  await act(async()=>root.render(<NativeReviews settings={{...settings,motion:false}}/>));expect(host.querySelector('.lp-reveal-pending,.lp-image-pending')).toBeNull();
  vi.stubGlobal('matchMedia',()=>({matches:true}));await act(async()=>root.render(<NativeReviews settings={settings}/>));expect(host.querySelector('.lp-reveal-pending,.lp-image-pending')).toBeNull();
 });
});
