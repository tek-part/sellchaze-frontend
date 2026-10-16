import { landingVideoSource } from './LandingVideo';

export interface NativePresetFeatures { accordion?: boolean; carousel?: boolean; video?: string }

/** Insert a provider-validated video only after owner HTML has been sanitized. */
export function nativePresetVideo(html: string, url?: string): { html: string; frameOrigin?: string } {
  const source = landingVideoSource(url);
  if (!source) return { html };
  const document = new DOMParser().parseFromString(html, 'text/html');
  const placeholders = document.querySelectorAll('[data-preset-video]');
  if (!placeholders.length) return { html };
  for (const placeholder of placeholders) {
    if (source.kind === 'file') {
      const video = document.createElement('video');
      video.src = source.src; video.controls = true; video.playsInline = true; video.preload = 'metadata';
      video.style.cssText = 'width:100%;height:100%;object-fit:contain';
      placeholder.replaceChildren(video);
    } else {
      const frame = document.createElement('iframe');
      frame.src = source.src; frame.title = 'فيديو المنتج'; frame.loading = 'lazy';
      frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation');
      frame.setAttribute('allow', 'fullscreen; picture-in-picture'); frame.allowFullscreen = true;
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      frame.style.cssText = 'display:block;width:100%;height:100%;border:0';
      placeholder.replaceChildren(frame);
    }
  }
  return { html: document.body.innerHTML, ...(source.kind === 'embed' ? { frameOrigin: new URL(source.src).origin } : {}) };
}

/** Fixed trusted behaviors; no merchant-provided JavaScript is interpolated. */
export function nativePresetScript(features: Pick<NativePresetFeatures, 'accordion' | 'carousel'>): string {
  if (!features.accordion && !features.carousel) return '';
  return `
const presetAccordion=${features.accordion === true},presetCarousel=${features.carousel === true};
const presetReduced=()=>matchMedia('(prefers-reduced-motion:reduce)').matches||!!document.querySelector('[data-motion="paused"]');
function presetSetAnswer(button,expanded){
  const region=button.closest('[data-preset-accordion]');
  if(!region)return;
  const index=button.getAttribute('data-preset-question');
  const answer=[...region.querySelectorAll('[data-preset-answer]')].find(n=>n.getAttribute('data-preset-answer')===index);
  if(!answer)return;
  button.setAttribute('aria-expanded',String(expanded));
  answer.setAttribute('aria-hidden',String(!expanded));answer.inert=!expanded;
  const item=button.closest('.szh-accordion__item');
  item?.classList.toggle('szh-accordion__item--expanded',expanded);
  item?.classList.toggle('szh-accordion__item--status-entered',expanded);
  item?.classList.toggle('szh-accordion__item--status-exited',!expanded);
  if(presetReduced()){answer.style.display=expanded?'block':'none';answer.style.height=expanded?'auto':'0px';return;}
  const height=expanded?answer.querySelector('.szh-accordion__item-panel')?.scrollHeight??answer.scrollHeight:answer.getBoundingClientRect().height;
  answer.style.overflow='hidden';answer.style.transition='height 250ms ease';
  answer.style.display='block';answer.style.height=expanded?'0px':height+'px';
  requestAnimationFrame(()=>{answer.style.height=expanded?height+'px':'0px';});
  setTimeout(()=>{if((button.getAttribute('aria-expanded')==='true')===expanded){answer.style.height=expanded?'auto':'0px';if(!expanded)answer.style.display='none';}},270);
}
function presetMove(track,direction){const sign=getComputedStyle(track).direction==='rtl'?-1:1;track.scrollBy({left:sign*direction*track.clientWidth,behavior:presetReduced()?'auto':'smooth'});}
document.addEventListener('click',event=>{
  if(editing)return;
  const question=event.target.closest('[data-preset-question]');
  if(presetAccordion&&question){
    event.preventDefault();const region=question.closest('[data-preset-accordion]');if(!region)return;
    const expanded=question.getAttribute('aria-expanded')==='true';
    for(const button of region.querySelectorAll('[data-preset-question]'))if(button!==question&&button.getAttribute('aria-expanded')==='true')presetSetAnswer(button,false);
    presetSetAnswer(question,!expanded);return;
  }
  const control=event.target.closest('[data-preset-next],[data-preset-prev]');
  if(presetCarousel&&control){const track=control.closest('[data-preset-slider]')?.querySelector('[data-preset-carousel]');if(track){event.preventDefault();presetMove(track,control.hasAttribute('data-preset-next')?1:-1);}}
});
document.addEventListener('keydown',event=>{
  if(editing)return;
  const control=event.target.closest('[data-preset-next],[data-preset-prev]');
  if(presetCarousel&&control&&(event.key==='Enter'||event.key===' ')){event.preventDefault();control.click();return;}
  const question=event.target.closest('[data-preset-question]');
  if(presetAccordion&&question){const buttons=[...question.closest('[data-preset-accordion]').querySelectorAll('[data-preset-question]')],index=buttons.indexOf(question);const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:event.key==='ArrowDown'?(index+1)%buttons.length:event.key==='ArrowUp'?(index-1+buttons.length)%buttons.length:null;if(next!==null){event.preventDefault();buttons[next].focus();}}
  const track=event.target.closest('[data-preset-carousel]');
  if(presetCarousel&&track&&(event.key==='ArrowRight'||event.key==='ArrowLeft')){event.preventDefault();presetMove(track,event.key==='ArrowRight'?1:-1);}
});
if(presetAccordion)for(const answer of document.querySelectorAll('[data-preset-answer]')){answer.inert=true;answer.setAttribute('aria-hidden','true');}
`;
}
