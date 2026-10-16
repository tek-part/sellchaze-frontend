import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import revealCss from './landing-reveal.css?inline';
import { pageViewportCss } from './viewport-css';

const tags = new Set('section article header footer main aside div span p h1 h2 h3 h4 h5 h6 b strong i em u s br hr ul ol li blockquote pre code figure figcaption table thead tbody tfoot tr td th details summary a button img video source small mark sup sub'.split(' '));
const attributes = new Set('class style id title dir aria-label href rel target type data-purchase data-label data-effect-label data-motion data-design data-layout data-rating data-badge data-role-label data-landing-reveal data-landing-image data-landing-item data-landing-hero src alt width height controls playsinline preload poster colspan rowspan scope'.split(' '));
const safeUrl = (value: string) => /^(https?:\/\/|\/(?!\/)|#[a-zA-Z0-9_-]+$)/i.test(value.trim()) && !/[<>]/.test(value) && !Array.from(value).some(char => char.charCodeAt(0) < 32);

/** No merchant script, forms, styles or media ever enter the application document. */
function sanitizeLandingMarkup(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  for (const el of Array.from(doc.body.querySelectorAll('*'))) {
    if (!tags.has(el.localName)) { el.remove(); continue; }
    for (const attr of Array.from(el.attributes)) if (!attributes.has(attr.name) || ['href', 'src', 'poster'].includes(attr.name) && !safeUrl(attr.value) && !(attr.name === 'href' && /^(mailto:|tel:)[^<>\s]+$/i.test(attr.value))) el.removeAttribute(attr.name);
    if (el.localName === 'a') { el.setAttribute('rel', 'noopener noreferrer nofollow'); el.setAttribute('target', '_blank'); }
    if (el.localName === 'button') el.setAttribute('type', 'button');
  }
  return doc.body.innerHTML;
}

/** Raw owner HTML retains its existing section limit. */
export function landingStaticHtml(html: string): string {
  return sanitizeLandingMarkup(html.slice(0, 20000));
}
const nativeMarkupBrand = Symbol('sanitized-native-landing-markup');
export interface NativeLandingMarkup { readonly html: string; readonly [nativeMarkupBrand]: true }
/** Internal generated wrappers and escaped text. Bound/sanitize every raw owner fragment before composing. */
export function nativeLandingMarkup(html: string): NativeLandingMarkup {
  return Object.freeze({ html: sanitizeLandingMarkup(html), [nativeMarkupBrand]: true as const });
}

export function StaticLandingFrame({ html = '', nativeHtml, css = '', baseCss = '', title, onPurchase, onItemSelect, onEditPurchase, onEditImage, pageViewport = false }: { html?: string; nativeHtml?: NativeLandingMarkup; css?: string; baseCss?: string; title: string; onPurchase?: () => void; onItemSelect?: (index:number)=>void; onEditPurchase?:()=>void;onEditImage?:()=>void;pageViewport?:boolean | 'fragment' }) {
  const frame = useRef<HTMLIFrameElement>(null); const [height, setHeight] = useState(160);
  const nonce = useMemo(() => crypto.randomUUID(), []);
  const nativeContent = nativeHtml?.[nativeMarkupBrand] === true ? nativeHtml.html : undefined;
  const maximumHeight = nativeContent === undefined ? 30000 : 2000000;
  const editing=nativeContent!==undefined&&!!(onItemSelect||onEditPurchase||onEditImage);
  const mirrorViewport=!!pageViewport&&nativeContent!==undefined&&typeof window.matchMedia==='function';
  const [cssViewport,setCssViewport]=useState(()=>({width:window.innerWidth,height:window.innerHeight}));
  const renderedStyles=useMemo(()=>{
    const owner=css.slice(0,12000);
    if(!mirrorViewport)return{base:baseCss,owner,queries:[] as string[]};
    try{
      const match=(query:string)=>pageViewport==='fragment'?null:window.matchMedia(query).matches;
      const base=pageViewportCss(baseCss,cssViewport.width,cssViewport.height,match);
      const resolved=pageViewportCss(owner,cssViewport.width,cssViewport.height,match);
      return{base:base.css,owner:resolved.css,queries:[...new Set([...base.queries,...resolved.queries])]};
    }catch{return{base:baseCss,owner,queries:[] as string[]};}
  },[mirrorViewport,pageViewport,css,baseCss,cssViewport]);
  useEffect(()=>{
    if(!mirrorViewport)return;
    const dimensions=()=>({width:pageViewport==='fragment'?frame.current?.getBoundingClientRect().width||window.innerWidth:window.innerWidth,height:window.innerHeight});
    const refresh=(force=false)=>{const next=dimensions();setCssViewport(current=>!force&&current.width===next.width&&current.height===next.height?current:next);};
    const resize=()=>refresh();const preference=()=>refresh(true);refresh();
    const queries=renderedStyles.queries.map(query=>window.matchMedia(query));
    const observer=pageViewport==='fragment'&&typeof ResizeObserver==='function'?new ResizeObserver(resize):null;
    if(observer&&frame.current)observer.observe(frame.current);
    window.addEventListener('resize',resize);queries.forEach(query=>query.addEventListener?.('change',preference));
    return()=>{observer?.disconnect();window.removeEventListener('resize',resize);queries.forEach(query=>query.removeEventListener?.('change',preference));};
  },[mirrorViewport,pageViewport,renderedStyles.queries]);
  const srcDoc = useMemo(() => {
    const content = nativeContent ?? landingStaticHtml(html);
    const fontOrigin = /^https?:$/.test(window.location.protocol) ? window.location.origin : '';
    const trustedCss = renderedStyles.base.replace(/</g, '\\3c ');
    const safeCss = renderedStyles.owner.replace(/</g, '\\3c ');
    const script = `const key=${JSON.stringify(nonce)};const editing=${JSON.stringify(editing)};const nodes=[...document.querySelectorAll('[data-landing-reveal],[data-landing-image]')];const moving=document.querySelector('[data-motion="playing"]')&&!matchMedia('(prefers-reduced-motion:reduce)').matches;let view=null;const seen=new WeakSet();const reveal=()=>{if(!moving||!view)return;for(const el of nodes){if(seen.has(el))continue;const r=el.getBoundingClientRect();if(r.bottom<=view.top||r.top>=view.bottom)continue;const img=el.hasAttribute('data-landing-image');if(img&&!el.naturalWidth)continue;seen.add(el);el.classList.remove('lp-reveal-pending','lp-image-pending');el.classList.add(img?'lp-image-entered':'lp-reveal-entered')}};if(moving)for(const el of nodes){if(el.hasAttribute('data-landing-image')&&el.complete&&!el.naturalWidth){seen.add(el);continue;}el.classList.add(el.hasAttribute('data-landing-image')?'lp-image-pending':'lp-reveal-pending');}addEventListener('message',e=>{if(e.source!==parent||e.data?.landing!==key||!Number.isFinite(e.data.viewport?.top)||!Number.isFinite(e.data.viewport?.bottom))return;view=e.data.viewport;reveal()});document.addEventListener('load',reveal,true);document.addEventListener('error',e=>e.target?.classList?.remove('lp-image-pending'),true);const send=()=>parent.postMessage({landing:key,height:Math.ceil(document.body.getBoundingClientRect().height)},'*');new ResizeObserver(send).observe(document.body);document.addEventListener('load',send,true);document.addEventListener('click',e=>{if(editing){const item=e.target.closest('[data-landing-item]');if(item){e.preventDefault();parent.postMessage({landing:key,item:Number(item.getAttribute('data-landing-item'))},'*');return;}if(e.target.closest('[data-landing-hero]')){e.preventDefault();parent.postMessage({landing:key,editImage:true},'*');return;}if(e.target.closest('[data-purchase]')){e.preventDefault();parent.postMessage({landing:key,editPurchase:true},'*');return;}}const a=e.target.closest('[data-purchase],a[href="#purchase"]');if(a){e.preventDefault();parent.postMessage({landing:key,purchase:true},'*')}});send();`;
    return `<!doctype html><html dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline' https://fonts.googleapis.com; img-src https: http:; media-src https: http:; font-src https: ${fontOrigin}; connect-src 'none'; form-action 'none'; base-uri 'none'"><style>@font-face{font-family:Almarai;src:url("/fonts/almarai/Almarai-Regular.ttf") format("truetype");font-weight:400;font-style:normal;font-display:swap}@font-face{font-family:Almarai;src:url("/fonts/almarai/Almarai-Bold.ttf") format("truetype");font-weight:700;font-style:normal;font-display:swap}html,body{margin:0;min-height:0;font-family:Almarai,Arial,sans-serif;overflow-wrap:anywhere}*{box-sizing:border-box}img,video{max-width:100%;height:auto}body{display:flow-root}a,button{cursor:pointer}@layer native {${revealCss}}${trustedCss}${safeCss}</style></head><body>${content}<script nonce="${nonce}">${script}</script></body></html>`;
  }, [html, nativeContent, renderedStyles, nonce, editing]);
  const viewportFrame = useRef<number | null>(null);
  const notifyViewport = useCallback(() => {
    if (!frame.current) return; const rect=frame.current.getBoundingClientRect();
    frame.current.contentWindow?.postMessage({ landing:nonce, viewport:{ top:-rect.top, bottom:window.innerHeight-rect.top } }, '*');
  },[nonce]);
  const queueViewport = useCallback(() => {
    if(viewportFrame.current !== null)return;
    if(typeof window.requestAnimationFrame !== 'function'){notifyViewport();return;}
    viewportFrame.current=window.requestAnimationFrame(()=>{viewportFrame.current=null;notifyViewport();});
  },[notifyViewport]);
  useEffect(() => {
    window.addEventListener('scroll',queueViewport,true);window.addEventListener('resize',queueViewport);queueViewport();
    return()=>{window.removeEventListener('scroll',queueViewport,true);window.removeEventListener('resize',queueViewport);if(viewportFrame.current!==null)window.cancelAnimationFrame(viewportFrame.current);viewportFrame.current=null;};
  },[queueViewport]);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow || event.data?.landing !== nonce) return;
      if(editing && Number.isInteger(event.data.item) && event.data.item>=0 && event.data.item<30)onItemSelect?.(event.data.item);
      if(editing && event.data.editPurchase===true)onEditPurchase?.();
      if(editing && event.data.editImage===true)onEditImage?.();
      if (event.data.purchase === true) onPurchase?.();
      if (Number.isFinite(event.data.height) && event.data.height > 0) { setHeight(Math.min(maximumHeight, Math.ceil(event.data.height))); queueViewport(); }
    };
    window.addEventListener('message', receive); return () => window.removeEventListener('message', receive);
  }, [nonce, onPurchase, maximumHeight, queueViewport, editing, onItemSelect, onEditPurchase, onEditImage]);
  return <iframe ref={frame} onLoad={queueViewport} title={title} srcDoc={srcDoc} sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox" referrerPolicy="no-referrer" style={{ display: 'block', width: '100%', border: 0, height }} />;
}
