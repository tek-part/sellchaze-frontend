// @vitest-environment jsdom
import { act } from 'react';
import { createRoot,type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach,beforeEach,describe,expect,it,vi } from 'vitest';
import { CountdownLayouts } from './CountdownLayouts';
import { countdownDesigns } from './countdown-designs';
import { countdownEffects } from './countdown-effects';
import { countdownDeadline,landingClock,validLandingClock } from './landing-clock';
import { parseLanding,type LandingSettings } from './document';
import { StaticLandingFrame,nativeLandingMarkup } from './StaticLandingFrame';
let host:HTMLDivElement,root:Root;
beforeEach(()=>{sessionStorage.clear();host=document.createElement('div');document.body.append(host);root=createRoot(host);});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.useRealTimers();});
describe('countdown clocks and designs',()=>{
  it('reuses the legacy session deadline, including expired clocks, with bounded inputs',()=>{
    const now=100000,end=countdownDeadline('p','s',4,undefined,now,sessionStorage);
    expect(end).toBe(now+14400000);expect(countdownDeadline('p','s',4,undefined,end+99999,sessionStorage)).toBe(end);
    expect(countdownDeadline('p','s',2,undefined,now,sessionStorage)).toBe(now+7200000);
    expect(countdownDeadline('p','s',4,'bad',now)).toBe(0);
    expect(countdownDeadline('p','s',4,'2026-01-01T00:00:00Z',now)).toBe(Date.parse('2026-01-01T00:00:00Z'));
    expect(countdownDeadline('p','s',NaN,undefined,now,{getItem(){throw Error();},setItem(){throw Error();}})).toBe(now+14400000);
    expect(landingClock(-1)).toEqual({days:0,hours:0,minutes:0,seconds:0});expect(landingClock(90061)).toEqual({days:1,hours:1,minutes:1,seconds:1});
    expect(validLandingClock({days:0,hours:24,minutes:0,seconds:0})).toBeUndefined();expect(validLandingClock({days:0,hours:4,minutes:0,seconds:0})).toEqual(landingClock(14400));
  });
  it('ticks without resetting on design/text changes or remount and stops at expiry',async()=>{
    vi.useFakeTimers();vi.setSystemTime(new Date('2026-10-16T12:00:00Z'));
    const draw=(s:LandingSettings)=>root.render(<CountdownLayouts productId="p" sectionId="s" settings={s}/>);
    await act(async()=>draw({variant:'countdown-1',hours:1}));expect(host.querySelector('.hours')?.textContent).toBe('1');
    await act(async()=>vi.advanceTimersByTime(2000));expect(host.querySelector('.seconds')?.textContent).toBe('58');
    await act(async()=>draw({variant:'countdown-33',hours:1,title:'Own new title'}));expect(host.querySelector('.seconds')?.textContent).toBe('58');
    await act(async()=>root.unmount());root=createRoot(host);await act(async()=>draw({variant:'countdown-2',hours:1}));expect(host.querySelector('.seconds')?.textContent).toBe('58');
    await act(async()=>vi.advanceTimersByTime(3600000));expect(host.querySelector('.hours')?.textContent).toBe('0');expect(host.querySelector('.seconds')?.textContent).toBe('0');expect(vi.getTimerCount()).toBe(0);
  });
  it('has33 scoped layouts with static, storage-free gallery previews and no reference photos or copy',()=>{
    expect(countdownDesigns).toHaveLength(33);
    for(const d of countdownDesigns){const html=renderToStaticMarkup(<CountdownLayouts settings={{variant:d.id}} preview thumbnail/>);expect(html.match(/class="(?:days|hours|minutes|seconds)"/g)).toHaveLength(4);expect(html).not.toMatch(/<button|<iframe|easy-orders|70%|limited offer/i);expect(countdownEffects[d.id]).toContain(`.lp-countdown.lp-countdown--${d.index}`);expect(countdownEffects[d.id]).not.toMatch(/https?:|url\(/);}
    expect(sessionStorage.length).toBe(0);
  });
  it('updates frame clocks without reloading srcdoc, and authenticates text/purchase actions',async()=>{
    vi.useFakeTimers();vi.setSystemTime(new Date('2026-10-16T12:00:00Z'));
    const text=vi.fn(),buy=vi.fn();await act(async()=>root.render(<CountdownLayouts productId="p" sectionId="frame" settings={{variant:'countdown-1',title:'Owned title',css:'.counter{gap:7px}',button_text:'Owned purchase'}} preview onTextSelect={text} onPurchaseSelect={buy}/>));
    const frame=host.querySelector('iframe')!,before=frame.srcdoc,key=before.match(/script-src 'nonce-([^']+)'/)![1],post=vi.spyOn(frame.contentWindow!,'postMessage');
    await act(async()=>vi.advanceTimersByTime(2000));expect(host.querySelector('iframe')).toBe(frame);expect(frame.srcdoc).toBe(before);expect(post).toHaveBeenLastCalledWith({landing:key,clock:{days:0,hours:3,minutes:59,seconds:58}},'*');
    for(const data of [{landing:'wrong',text:'title'},{landing:key,text:'title'}])await act(async()=>window.dispatchEvent(new MessageEvent('message',{source:window,data})));
    expect(text).not.toHaveBeenCalled();await act(async()=>window.dispatchEvent(new MessageEvent('message',{source:frame.contentWindow,data:{landing:key,text:'title'}})));expect(text).toHaveBeenCalledWith('title');
    await act(async()=>window.dispatchEvent(new MessageEvent('message',{source:frame.contentWindow,data:{landing:key,editPurchase:true}})));expect(buy).toHaveBeenCalledOnce();
    expect(before).toContain('e.source!==parent');expect(before).toContain('Number.isSafeInteger(c[k])');expect(frame.getAttribute('sandbox')).not.toContain('allow-same-origin');expect(host.querySelector('form')).toBeNull();
  });
  it('keeps clocks and text editing disabled on raw owner HTML',async()=>{
    await act(async()=>root.render(<StaticLandingFrame title="Raw" html='<p data-landing-clock="seconds">Owned</p>' countdown={landingClock(30)} onTextSelect={vi.fn()}/>));const doc=host.querySelector('iframe')!.srcdoc;expect(doc).toContain('const clockEnabled=false');expect(doc).toContain('const editing=false');
    await act(async()=>root.render(<StaticLandingFrame title="Native" nativeHtml={nativeLandingMarkup('<p>Native</p>')} countdown={landingClock(30)}/>));expect(host.querySelector('iframe')!.srcdoc).toContain('const clockEnabled=true');
  });
  it('preserves30 extra items/images and the full custom CSS allowance, while clearing CSS removes the template',async()=>{
    const css='/*'+'x'.repeat(11600)+'*/ .counter{gap:7px}',s:LandingSettings={variant:'countdown-33',title:'Own title',countdown_css_mode:'custom',css,images:Array.from({length:30},(_,i)=>({url:`/owned/${i}.png`})),items:Array.from({length:30},(_,i)=>({title:`Own extra ${i}`,text:'long '.repeat(1000)})),html:'<p>Own HTML</p><script>bad()</script>'},before=JSON.stringify(s);
    await act(async()=>root.render(<CountdownLayouts settings={s}/>));const doc=host.querySelector('iframe')!.srcdoc;expect(doc).toContain(css);expect(doc).toContain('Own extra 29');expect(doc).toContain('/owned/29.png');expect(doc).not.toContain('<script>bad()');expect(doc).not.toContain('.lp-countdown.lp-countdown--33{');expect(JSON.stringify(s)).toBe(before);
  });
  it('validates33 explicit variants and restricts countdown fields to their family, retaining legacy documents',()=>{
    const valid=(type:string,settings:Record<string,unknown>)=>parseLanding({schema:1,mode:'standalone',sections:[{id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',type,settings}]});
    for(const d of countdownDesigns)expect(valid('countdown',{variant:d.id,countdown_css_mode:'custom',countdown_title_color:'#123456',countdown_description_color:'#abcdef',countdown_description_align:'end',hours:4})).not.toBeNull();
    for(const[type,s]of [['countdown',{variant:'countdown-34'}],['gallery',{variant:'countdown-1'}],['countdown',{countdown_css_mode:'custom'}],['countdown',{variant:'countdown-1',countdown_description_align:'left'}],['countdown',{variant:'countdown-1',countdown_css_mode:'bad'}]])expect(valid(type as string,s as Record<string,unknown>)).toBeNull();
    expect(valid('countdown',{hours:1,title:'Legacy'})).not.toBeNull();
  });
});
