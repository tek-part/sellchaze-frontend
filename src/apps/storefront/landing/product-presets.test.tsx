// @vitest-environment jsdom
import {describe,expect,it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {createProductPreset,applyProductPreset,productPagePresets,productPresetPage} from './product-presets';
import {parseLanding} from './document';
import {productPresetMarkup} from './product-preset-content';
import {nativePresetScript,nativePresetVideo} from './native-preset-features';
import {StaticLandingFrame,landingStaticHtml,nativeLandingMarkup} from './StaticLandingFrame';

const product={name:'منتجنا {{title}} <script>owned</script>',description:'<p>وصف المنتج الخاص بنا.</p>',media:[{id:12,url:'/own.png',alt:'صورة مملوكة'}]};
describe('complete product page presets',()=>{
  it('creates all22 documents with scoped297 fragments, fresh identities, actual product media and a single shared checkout',async()=>{
    let count=0;
    for(const page of productPagePresets){
      const doc=await createProductPreset(page.id,product),again=await createProductPreset(page.id,product),fragments=await productPresetPage(page.id);
      expect(parseLanding(doc)).toEqual(doc);expect(doc.sections[0]!.id).not.toBe(again.sections[0]!.id);
      expect(doc.sections.filter(section=>section.type==='checkout')).toHaveLength(page.mode==='standalone'?1:0);
      expect(doc.sections.filter(section=>section.type==='product_preset')).toHaveLength(page.fragments.length);
      expect(doc.sections.some(section=>section.settings.html?.includes('وصف المنتج الخاص بنا.'))).toBe(true);
      count+=fragments.length;
      for(const fragment of fragments){
        expect(fragment.css.length).toBeLessThanOrEqual(12000);
        expect(JSON.stringify(fragment)).not.toMatch(/easy-orders\.net|myeasyorders\.com|digitaloceanspaces|product_id|sectionid|Verified Customer/);
        const section=doc.sections.find(section=>section.settings.preset_section===fragment.id)!;
        if(['reviews','testimonials','faq'].includes(fragment.kind))expect(section.settings.items).toEqual([]);
        if(fragment.image)expect(section.settings.image?.media_id).toBe(12);
        if(fragment.pageStyle)continue;
        const html=productPresetMarkup(fragment,section.settings);
        expect(html).not.toMatch(/\{\{(?:region:|item\.|image:)/);
        expect(html).not.toContain('<script>owned</script>');
        const dom=new DOMParser().parseFromString(html,'text/html');
        expect(dom.body.firstElementChild?.classList.contains('lp-'+fragment.id)).toBe(true);
        if(fragment.purchase)expect(dom.querySelector('[data-purchase]')?.textContent).toBe('الشراء الآن');
        if(fragment.kind==='countdown')expect(dom.querySelector('[data-landing-clock="seconds"]')?.textContent).toBe('0');
      }
    }
    expect(count).toBe(297);
  },90000);
  it('rejects unknown IDs and cross-family preset fields, and appends within limits without duplicating checkout',async()=>{
    await expect(createProductPreset('__proto__',product)).rejects.toThrow();await expect(productPresetPage('constructor')).rejects.toThrow();
    const doc=await createProductPreset('product-page-03',product);
    const section=doc.sections[0]!;
    expect(parseLanding({...doc,sections:[{...section,settings:{preset_section:'product-page-03-99'}}]})).toBeNull();
    expect(parseLanding({...doc,sections:[{...section,type:'heading'}]})).toBeNull();
    expect(parseLanding({...doc,sections:[{...section,settings:{preset_css_mode:'custom'}}]})).toBeNull();
    expect(parseLanding({...doc,sections:[{...section,settings:{...section.settings,preset_description_align:'left'}}]})).toBeNull();
    expect(applyProductPreset(doc,doc,true).sections.filter(section=>section.type==='checkout')).toHaveLength(1);
    expect(applyProductPreset({schema:1,mode:'below',sections:[]},doc,true).sections.some(section=>section.type==='checkout')).toBe(false);
    expect(applyProductPreset(doc,doc)).toBe(doc);
    expect(()=>applyProductPreset({...doc,sections:Array.from({length:60},()=>({...section,id:crypto.randomUUID()}))},doc,true)).toThrow('60');
  });
  it('retains30 owner items and images in every repeat layout, escapes values once and sanitizes raw owner HTML',async()=>{
    const rows=await Promise.all(productPagePresets.map(page=>productPresetPage(page.id)));
    const items=Array.from({length:30},(_,i)=>({title:`اسم ${i}`,text:`نص ${i} <script>bad()</script>`,image:{url:`/own-${i}.png`},html:'<b>own</b><svg onload="bad()"><path/></svg><iframe src="https://bad.test"/>'}));
    for(const fragment of rows.flat().filter(row=>row.regions.length)){
      const html=productPresetMarkup(fragment,{title:'{{item.title}}',...(fragment.kind==='gallery'?{images:items.map(item=>item.image)}:{items})},{foreground:'#123456',align:'end'}),dom=new DOMParser().parseFromString(html,'text/html');
      expect(dom.querySelectorAll('[data-landing-item]')).toHaveLength(30);
      expect(dom.querySelectorAll('img')).toHaveLength(30);
      expect(dom.querySelector('script,iframe,svg[onload]')).toBeNull();
      expect(dom.querySelector('[data-landing-text="title"]')?.textContent).toBe('{{item.title}}');
      expect((dom.querySelector('[data-landing-text="title"]') as HTMLElement).style.textAlign).toBe('end');
    }
  },90000);
  it('keeps native SVG and validated media separate from raw owner privileges',()=>{
    const markup='<div data-preset-video></div><svg viewBox="0 0 20 20"><path d="M0 0h20"/><foreignObject><script>bad()</script></foreignObject></svg>';
    expect(landingStaticHtml(markup)).not.toContain('<svg');expect(landingStaticHtml(markup)).not.toContain('data-preset-video');
    const native=nativeLandingMarkup(markup).html;expect(native).toContain('<svg');expect(native).not.toContain('foreignObject');expect(native).not.toContain('<script');
    expect(nativePresetVideo(native,'javascript:bad()').html).toBe(native);
    expect(nativePresetVideo(native,'https://evil.test/frame').html).toBe(native);
    const valid=nativePresetVideo(native,'https://youtu.be/dQw4w9WgXcQ');expect(valid.frameOrigin).toMatch(/^https:\/\/www.youtube/);expect(valid.html).toContain('sandbox=');
    const raw=renderToStaticMarkup(<StaticLandingFrame title="raw" html={markup} nativeFeatures={{video:'https://youtu.be/dQw4w9WgXcQ',accordion:true}}/>);
    expect(raw).toContain('frame-src &#x27;none&#x27;');expect(raw).not.toContain('presetAccordion=true');
    expect(nativePresetScript({})).toBe('');expect(nativePresetScript({accordion:true})).toContain('if(editing)return');
  });
  it('opens and closes native answers with accessible single-open state',()=>{
    const doc=document.implementation.createHTMLDocument('FAQ');
    doc.body.innerHTML='<div data-preset-accordion>'+[0,1].map(index=>`<section class="szh-accordion__item"><button data-preset-question="${index}" aria-expanded="false">Question ${index}</button><div data-preset-answer="${index}" style="display:none"><div class="szh-accordion__item-panel">Answer ${index}</div></div></section>`).join('')+'</div>';
    new Function('document','editing','matchMedia',nativePresetScript({accordion:true}))(doc,false,()=>({matches:true}));
    const buttons=[...doc.querySelectorAll('button')],answers=[...doc.querySelectorAll<HTMLElement>('[data-preset-answer]')];
    buttons[0]!.click();expect(buttons[0]!.getAttribute('aria-expanded')).toBe('true');expect(answers[0]!.style.display).toBe('block');expect(answers[0]!.getAttribute('aria-hidden')).toBe('false');
    buttons[1]!.click();expect(buttons[0]!.getAttribute('aria-expanded')).toBe('false');expect(answers[0]!.style.display).toBe('none');expect(buttons[1]!.getAttribute('aria-expanded')).toBe('true');
    buttons[1]!.click();expect(answers[1]!.style.display).toBe('none');
  });
});
