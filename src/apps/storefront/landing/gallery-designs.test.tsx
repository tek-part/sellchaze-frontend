// @vitest-environment jsdom
import { act } from 'react';
import { createRoot,type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach,beforeEach,describe,expect,it,vi } from 'vitest';
import { GalleryLayouts,galleryMarkup } from './GalleryLayouts';
import { galleryDesigns } from './gallery-designs';
import { parseLanding,type LandingSettings } from './document';
let host:HTMLDivElement,root:Root;
beforeEach(()=>{host=document.createElement('div');document.body.append(host);root=createRoot(host);});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();});
const id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const images=Array.from({length:30},(_,i)=>({url:`/own/image-${i}.png`,alt:`Own image ${i}`}));
describe('native gallery layouts',()=>{
  it('keeps all30 owned images and explicit title/description across every layout',()=>{
    for(const d of galleryDesigns){const s:LandingSettings={variant:d.id,title:'Own title',description:'Own description',images};const before=JSON.stringify(s);const html=renderToStaticMarkup(<GalleryLayouts settings={s}/>);expect(html.match(/<img /g)).toHaveLength(30);expect(html).toContain('Own title');expect(html).toContain('Own description');expect(html).toContain('Own image 29');expect(JSON.stringify(s)).toBe(before);}
  });
  it('uses four text-free neutral native gallery previews without nested controls or iframes',()=>{
    expect(galleryDesigns).toHaveLength(4);
    for(const d of galleryDesigns){const html=renderToStaticMarkup(<GalleryLayouts settings={{variant:d.id}} preview thumbnail/>);expect(html).toContain('/landing-illustrations/galleries/');expect(html).not.toMatch(/<button|<iframe|<a |easy-orders|Why you|Beautifully/);}
  });
  it('edits each real image by keyboard/click and title/description independently',async()=>{
    const select=vi.fn(),text=vi.fn(),add=vi.fn();await act(async()=>root.render(<GalleryLayouts settings={{variant:'gallery-3',title:'Own title',description:'Own body',images:images.slice(0,7)}} preview onImageSelect={select} onTextSelect={text} onAddImage={add}/>));
    await act(async()=>host.querySelector<HTMLElement>('[aria-label="تعديل صورة المعرض 7"]')!.click());expect(select).toHaveBeenCalledWith(6);
    await act(async()=>host.querySelector<HTMLElement>('[aria-label="تعديل عنوان المعرض"]')!.dispatchEvent(new KeyboardEvent('keydown',{bubbles:true,key:'Enter'})));expect(text).toHaveBeenCalledWith('title');
    await act(async()=>host.querySelector<HTMLElement>('[aria-label="تعديل وصف المعرض"]')!.click());expect(text).toHaveBeenCalledWith('description');
    await act(async()=>host.querySelector('button')!.click());expect(add).toHaveBeenCalledOnce();
  });
  it('escapes text/URLs and isolates all custom CSS and bounded raw owner HTML',async()=>{
    expect(galleryMarkup({variant:'gallery-1',title:'<script>bad()</script>',images:[{url:'javascript:bad()',alt:'Own'}]})).toContain('&lt;script&gt;');
    const css='/*'+'x'.repeat(11600)+'*/ .lg-grid{gap:7px}';await act(async()=>root.render(<GalleryLayouts settings={{variant:'gallery-2',title:'Own',images,css,html:'<p>Own HTML</p><script>bad()</script>'}}/>));
    const frame=host.querySelector('iframe')!;expect(frame.srcdoc).toContain(css);expect(frame.srcdoc).toContain('Own image 29');expect(frame.srcdoc).toContain('Own HTML');expect(frame.srcdoc).not.toContain('<script>bad()');expect(frame.getAttribute('sandbox')).not.toContain('allow-same-origin');expect(frame.srcdoc).toContain("form-action 'none'");expect(host.querySelector('style')).toBeNull();expect(host.querySelector('form')).toBeNull();
  });
  it('uses the authenticated native image bridge in phone/CSS previews without adding checkout',async()=>{
    await act(async()=>root.render(<GalleryLayouts settings={{variant:'gallery-4',images}} preview phonePreview onImageSelect={vi.fn()}/>));const doc=new DOMParser().parseFromString(host.querySelector('iframe')!.srcdoc,'text/html');expect(doc.querySelectorAll('[data-landing-item]')).toHaveLength(30);expect(doc.querySelector('[data-landing-item="29"] img')?.getAttribute('src')).toBe('/own/image-29.png');expect(doc.querySelector('[data-purchase]')).toBeNull();
  });
  it('restricts variants and independent description alignment to explicit galleries',()=>{
    const valid=(type:string,settings:Record<string,unknown>)=>parseLanding({schema:1,mode:'standalone',sections:[{id,type,settings}]});
    for(const d of galleryDesigns)expect(valid('gallery',{variant:d.id,gallery_description_align:'end',images})).not.toBeNull();
    for(const [type,settings]of [['gallery',{variant:'gallery-5'}],['slider',{variant:'gallery-1'}],['gallery',{variant:'billboard-1'}],['gallery',{gallery_description_align:'end'}],['gallery',{variant:'gallery-1',gallery_description_align:'left'}]])expect(valid(type as string,settings as Record<string,unknown>)).toBeNull();
    expect(valid('gallery',{title:'Legacy',images})).not.toBeNull();
  });
  it('omits editing controls from toolbar preview when edit handlers are absent',()=>{
    const settings:LandingSettings={variant:'gallery-4',title:'Own',description:'Own description',images:images.slice(0,2)};
    expect(renderToStaticMarkup(<GalleryLayouts settings={settings} preview/>)).not.toMatch(/role="button"|tabindex|<button/);
    const isolated=renderToStaticMarkup(<GalleryLayouts settings={{...settings,css:'.lg-grid{gap:7px}'}} preview/>);
    expect(isolated).not.toContain('lg-frame-text');
  });
  it('observes replacement image/heading nodes after the generated gallery body changes',async()=>{
    const observed=vi.fn();vi.stubGlobal('IntersectionObserver',class{observe=observed;unobserve=vi.fn();disconnect=vi.fn();});
    try{
      await act(async()=>root.render(<GalleryLayouts settings={{variant:'gallery-4',images:images.slice(0,2)}}/>));
      expect(observed).toHaveBeenCalledTimes(3);
      const firstImage=host.querySelector('img');
      await act(async()=>root.render(<GalleryLayouts settings={{variant:'gallery-4',images:images.slice(0,2)}}/>));
      expect(host.querySelector('img')).toBe(firstImage);expect(firstImage?.classList.contains('lp-image-pending')).toBe(true);
      await act(async()=>root.render(<GalleryLayouts settings={{variant:'gallery-4',title:'New own title',images:images.slice(0,3)}}/>));
      const next=observed.mock.calls.slice(3);expect(next).toHaveLength(4);expect(next.every(([node])=>host.contains(node as Node))).toBe(true);expect(next.some(([node])=>(node as Element).getAttribute('src')==='/own/image-2.png')).toBe(true);
    }finally{vi.unstubAllGlobals();}
  });
});
