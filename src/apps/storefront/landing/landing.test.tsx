// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { LandingSections } from './LandingSections';
import { StaticLandingFrame, landingStaticHtml } from './StaticLandingFrame';
import { emptyLanding, landingUrl, moveLanding, parseLanding, type LandingDocument } from './document';
import type { StorefrontContext } from '../theme-engine/rendering';

const id = '9830618c-9919-4832-8e82-7d7818a5c581';
const context: StorefrontContext = { store: { name: 'Own store', currency: 'EGP' }, seo: {}, navigation: { header: [], footer: [] }, data: { reviews: [] } };
let host: HTMLDivElement; let root: Root;
beforeEach(() => { Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }); host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.restoreAllMocks(); });

describe('product landing document boundaries', () => {
  it('keeps disabled layouts intact and rejects malformed, duplicate and unknown blocks', () => {
    const doc = { ...emptyLanding(), sections: [{ id, type: 'heading', settings: { title: 'Own heading' } }] };
    expect(parseLanding(doc)?.sections).toHaveLength(1);
    expect(parseLanding({ ...doc, sections: [...doc.sections, ...doc.sections] })).toBeNull();
    expect(parseLanding({ ...doc, sections: [{ id, type: 'payment-script', settings: {} }] })).toBeNull();
    expect(parseLanding({ ...doc, sections: [{ id, type: 'image', settings: { image: { url: 'javascript:bad()' } } }] })).toBeNull();
    expect(parseLanding({ ...doc, sections: [{ id, type: 'countdown', settings: { hours: Infinity } }] })).toBeNull();
    expect(landingUrl('https://example.test/\u0000x')).toBe(false);
    expect(landingUrl('//other.test/image')).toBe(false);
    expect(landingUrl('/storage/own.png')).toBe(true);
  });
  it('moves a section without changing its identity, content or neighbours', () => {
    const a = { id, type: 'heading' as const, settings: { title: 'First' } }; const b = { ...a, id: crypto.randomUUID(), settings: { title: 'Second' } }; const c = { ...a, id: crypto.randomUUID() };
    expect(moveLanding([a, b, c], b.id, -1)).toEqual([b, a, c]);
    expect(moveLanding([a, b, c], a.id, -1)).toEqual([a, b, c]);
    expect(moveLanding([a, b, c], 'missing', 1)).toEqual([a, b, c]);
  });
  it('renders a single live checkout when the document contains several checkout blocks', () => {
    const doc: LandingDocument = { schema: 1, mode: 'standalone', sections: [{ id, type: 'checkout', settings: {} }, { id: crypto.randomUUID(), type: 'checkout', settings: {} }] };
    const html = renderToStaticMarkup(<LandingSections document={doc} context={context} checkout={<form aria-label="Actual purchase" />} />);
    expect(html.match(/<form/g)).toHaveLength(1);
    expect(html.match(/data-landing-checkout/g)).toHaveLength(1);
    expect(html).toContain('sf-landing-buy');
  });
});

describe('isolated static landing content', () => {
  it('retains static structure but removes active content, forms, navigation injection and handlers', () => {
    const html = landingStaticHtml('<section class="own" style="color:red"><h2>Own</h2><script>bad()</script><iframe src="https://evil.test"></iframe><form><input value="private"></form><img src="javascript:bad()" onerror="bad()"><a href="https://example.test" onclick="bad()">Open</a><meta http-equiv="refresh" content="0;url=https://evil.test"></section>');
    expect(html).toContain('class="own"'); expect(html).toContain('color:red');
    for (const unsafe of ['<script', '<iframe', '<form', '<input', '<meta', 'onclick', 'onerror', 'javascript:']) expect(html).not.toContain(unsafe);
    expect(html).toContain('noopener noreferrer nofollow');
  });
  it('uses an opaque sandbox, prevents CSS tag breakout and ignores forged resize or purchase messages', async () => {
    const purchase = vi.fn();
    await act(async () => root.render(<StaticLandingFrame html="<h2>Own</h2>" css={'</style><script>bad()</script>'} title="Own content" onPurchase={purchase} />));
    const iframe = host.querySelector('iframe')!;
    expect(iframe.sandbox?.contains('allow-same-origin') ?? iframe.getAttribute('sandbox')?.includes('allow-same-origin')).toBeFalsy();
    const src = iframe.srcdoc; expect(src).toContain("form-action 'none'"); expect(src).not.toContain('</style><script>bad()');
    const key = src.match(/script-src 'nonce-([^']+)'/)?.[1]; expect(key).toBeTruthy();
    await act(async () => window.dispatchEvent(new MessageEvent('message', { source: window, data: { landing: key, height: 10000, purchase: true } })));
    expect(purchase).not.toHaveBeenCalled(); expect(iframe.style.height).toBe('160px');
    await act(async () => window.dispatchEvent(new MessageEvent('message', { source: iframe.contentWindow, data: { landing: key, height: 240 } })));
    expect(iframe.style.height).toBe('240px');
    expect(document.querySelector('h2')).toBeNull();
  });
});
