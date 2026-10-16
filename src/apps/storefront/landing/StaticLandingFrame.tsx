import { useEffect, useMemo, useRef, useState } from 'react';

const tags = new Set('section article header footer main aside div span p h1 h2 h3 h4 h5 h6 b strong i em u s br hr ul ol li blockquote pre code figure figcaption table thead tbody tfoot tr td th details summary a button img video source small mark sup sub'.split(' '));
const attributes = new Set('class style id title dir aria-label href rel target type data-purchase data-label data-effect-label data-motion data-design src alt width height controls playsinline preload poster colspan rowspan scope'.split(' '));
const safeUrl = (value: string) => /^(https?:\/\/|\/(?!\/)|#[a-zA-Z0-9_-]+$)/i.test(value.trim()) && !/[<>]/.test(value) && !Array.from(value).some(char => char.charCodeAt(0) < 32);

/** No merchant script, forms, styles or media ever enter the application document. */
export function landingStaticHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html.slice(0, 20000), 'text/html');
  for (const el of Array.from(doc.body.querySelectorAll('*'))) {
    if (!tags.has(el.localName)) { el.remove(); continue; }
    for (const attr of Array.from(el.attributes)) if (!attributes.has(attr.name) || ['href', 'src', 'poster'].includes(attr.name) && !safeUrl(attr.value) && !(attr.name === 'href' && /^(mailto:|tel:)[^<>\s]+$/i.test(attr.value))) el.removeAttribute(attr.name);
    if (el.localName === 'a') { el.setAttribute('rel', 'noopener noreferrer nofollow'); el.setAttribute('target', '_blank'); }
    if (el.localName === 'button') el.setAttribute('type', 'button');
  }
  return doc.body.innerHTML;
}

export function StaticLandingFrame({ html, css = '', baseCss = '', title, onPurchase }: { html: string; css?: string; baseCss?: string; title: string; onPurchase?: () => void }) {
  const frame = useRef<HTMLIFrameElement>(null); const [height, setHeight] = useState(160);
  const nonce = useMemo(() => crypto.randomUUID(), []);
  const srcDoc = useMemo(() => {
    const content = landingStaticHtml(html);
    const fontOrigin = /^https?:$/.test(window.location.protocol) ? window.location.origin : '';
    const trustedCss = baseCss.replace(/</g, '\\3c ');
    const safeCss = css.slice(0, 12000).replace(/</g, '\\3c ');
    const script = `const key=${JSON.stringify(nonce)};const send=()=>parent.postMessage({landing:key,height:Math.ceil(document.body.getBoundingClientRect().height)},'*');new ResizeObserver(send).observe(document.body);document.addEventListener('load',send,true);document.addEventListener('click',e=>{const a=e.target.closest('[data-purchase],a[href="#purchase"]');if(a){e.preventDefault();parent.postMessage({landing:key,purchase:true},'*')}});send();`;
    return `<!doctype html><html dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline' https://fonts.googleapis.com; img-src https: http:; media-src https: http:; font-src https: ${fontOrigin}; connect-src 'none'; form-action 'none'; base-uri 'none'"><style>@font-face{font-family:Almarai;src:url("/fonts/almarai/Almarai-Regular.ttf") format("truetype");font-weight:400;font-style:normal;font-display:swap}@font-face{font-family:Almarai;src:url("/fonts/almarai/Almarai-Bold.ttf") format("truetype");font-weight:700;font-style:normal;font-display:swap}html,body{margin:0;min-height:0;font-family:Almarai,Arial,sans-serif;overflow-wrap:anywhere}*{box-sizing:border-box}img,video{max-width:100%;height:auto}body{display:flow-root}a,button{cursor:pointer}${trustedCss}${safeCss}</style></head><body>${content}<script nonce="${nonce}">${script}</script></body></html>`;
  }, [html, css, baseCss, nonce]);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow || event.data?.landing !== nonce) return;
      if (event.data.purchase === true) onPurchase?.();
      if (Number.isFinite(event.data.height) && event.data.height > 0) setHeight(Math.min(30000, Math.ceil(event.data.height)));
    };
    window.addEventListener('message', receive); return () => window.removeEventListener('message', receive);
  }, [nonce, onPurchase]);
  return <iframe ref={frame} title={title} srcDoc={srcDoc} sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox" referrerPolicy="no-referrer" style={{ display: 'block', width: '100%', border: 0, height }} />;
}
