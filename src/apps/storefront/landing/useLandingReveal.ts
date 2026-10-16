import { useEffect, useRef } from 'react';
import './landing-reveal.css';

/** Entry motion stays independent of preset-specific animation selectors. */
export function useLandingReveal(active: boolean, design: string) {
  const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const host=ref.current;
    if(!host || !active || typeof IntersectionObserver==='undefined' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const targets=Array.from(host.querySelectorAll<HTMLElement>('[data-landing-reveal],[data-landing-image]'));const seen=new WeakSet<Element>();
    const enter=(node:HTMLElement)=>{
      if(node.hasAttribute('data-landing-image') && !(node as HTMLImageElement).naturalWidth) return;
      node.classList.remove('lp-reveal-pending','lp-image-pending');node.classList.add(node.hasAttribute('data-landing-image')?'lp-image-entered':'lp-reveal-entered');observer.unobserve(node);
    };
    const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){seen.add(entry.target);enter(entry.target as HTMLElement);}}, {threshold:0});
    for(const target of targets){if(target instanceof HTMLImageElement && target.complete && !target.naturalWidth)continue;target.classList.remove('lp-reveal-entered','lp-image-entered');target.classList.add(target.hasAttribute('data-landing-image')?'lp-image-pending':'lp-reveal-pending');observer.observe(target);}
    const loaded=(event:Event)=>{const target=event.target;if(target instanceof HTMLImageElement && seen.has(target))enter(target);};
    const failed=(event:Event)=>{const target=event.target;if(target instanceof HTMLImageElement){target.classList.remove('lp-image-pending');observer.unobserve(target);}};
    host.addEventListener('load',loaded,true);host.addEventListener('error',failed,true);
    return()=>{observer.disconnect();host.removeEventListener('load',loaded,true);host.removeEventListener('error',failed,true);for(const target of targets)target.classList.remove('lp-reveal-pending','lp-image-pending');};
  },[active,design]);
  return ref;
}
