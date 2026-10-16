// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { StaticLandingFrame, nativeLandingMarkup } from './StaticLandingFrame';
import { BillboardLayouts } from './BillboardLayouts';
import { billboardDesigns } from './billboard-designs';
import { billboardRichHtml } from './billboard-rich';
import { parseLanding, type LandingDocument, type LandingSettings } from './document';
import { LandingSections } from './LandingSections';
import type { StorefrontContext } from '../theme-engine/rendering';

let host: HTMLDivElement, root: Root;
beforeEach(() => { host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });
const blockId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const ctx = { store: {}, navigation: { header: [], footer: [] }, seo: {}, data: { product: { id: 'own', title: 'Actual product' } } } as unknown as StorefrontContext;
describe('native billboard layouts', () => {
  it('preserves every owned root field and extra item across17 advanced presets and card12', () => {
    expect(billboardDesigns).toHaveLength(18); expect(billboardDesigns.filter(d => d.advanced)).toHaveLength(17);
    for (const d of billboardDesigns) {
      const s: LandingSettings = { variant: d.id, title: 'Owned title', description: 'Owned terms', eyebrow: 'Owned introduction', items: Array.from({ length: 12 }, (_, i) => ({ title: `Own ${i}`, text: `Own body ${i}` })) };
      const before = JSON.stringify(s); const html = renderToStaticMarkup(<BillboardLayouts settings={s} />);
      expect(html).toContain(`data-design="${d.id}"`); for (let i = 0; i < 12; i++) expect(html).toContain(`Own ${i}`);
      if (d.advanced) for (const value of ['Owned title', 'Owned terms', 'Owned introduction']) expect(html).toContain(value);
      expect(JSON.stringify(s)).toBe(before);
      const gallery = renderToStaticMarkup(<BillboardLayouts settings={{ variant: d.id }} preview thumbnail />);
      expect(gallery).not.toMatch(/<button|<iframe|<a |easy-orders|خصم|25 %|لفتره محدوده|Medik8/);
    }
  });
  it('keeps Source heading order and emphasis while escaping merchant text', () => {
    const normal = billboardRichHtml({ variant: 'billboard-1', title: '<h1>Own</h1>', description: 'Own terms', eyebrow: 'Own intro' });
    expect(normal).toContain('&lt;h1&gt;Own&lt;/h1&gt;'); expect(normal).toMatch(/<h4[^>]*><em>Own terms<\/em><\/h4>/);
    const reordered = billboardRichHtml({ variant: 'billboard-13', title: 'Own title', description: 'Own terms', eyebrow: 'Own intro' });
    expect(reordered.indexOf('Own intro')).toBeLessThan(reordered.indexOf('Own title')); expect(reordered.indexOf('Own title')).toBeLessThan(reordered.indexOf('Own terms'));
  });
  it('keeps long generated content and bounded owner fragments inside the existing sandbox', async () => {
    const text = 'Own long billboard detail. '.repeat(160);
    const s: LandingSettings = { variant: 'billboard-1', title: 'Own', css: '/*' + 'x'.repeat(11600) + '*/ h1 { color:red }', items: Array.from({ length: 30 }, (_, i) => ({ title: `Own detail ${i}`, text, html: '<p>Own HTML</p><script>bad()</script>' + 'x'.repeat(6100) + '<p>Outside cap</p>' })) };
    await act(async () => root.render(<BillboardLayouts settings={s} />));
    const frame = host.querySelector('iframe')!; const doc = new DOMParser().parseFromString(frame.srcdoc, 'text/html');
    expect(frame.srcdoc).toContain(s.css); expect(doc.body.textContent).toContain(text); expect(frame.srcdoc).toContain('Own detail 29');
    expect(frame.srcdoc).not.toMatch(/bad\(\)<\/script>|Outside cap/); expect(doc.querySelectorAll('script')).toHaveLength(1); expect(frame.getAttribute('sandbox')).not.toContain('allow-same-origin');
    expect(frame.srcdoc).toContain("form-action 'none'");
  });
  it('supports formatted/CSS clearing and recovers the original fields without mutation', async () => {
    const s: LandingSettings = { variant: 'billboard-1', title: 'Original title', eyebrow: 'Original intro', items: [{ title: 'Original item' }], billboard_mode: 'formatted', html: '<h2>Own edited body</h2>', billboard_css_mode: 'custom', css: '' };
    const before = JSON.stringify(s); await act(async () => root.render(<BillboardLayouts settings={s} />)); expect(host.querySelector('iframe')!.srcdoc).toContain('Own edited body'); expect(host.querySelector('iframe')!.srcdoc).not.toContain('Original title');
    expect(renderToStaticMarkup(<BillboardLayouts settings={{ ...s, html: '' }} />)).toBe('');
    await act(async () => root.render(<BillboardLayouts settings={{ ...s, billboard_mode: 'fields' }} />)); const doc = host.querySelector('iframe')!.srcdoc; expect(doc).toContain('Original title'); expect(doc).toContain('Original intro'); expect(doc).toContain('Original item'); expect(doc).not.toContain('Own edited body'); expect(JSON.stringify(s)).toBe(before);
  });
  it('selects card12 directly and uses one existing purchase action including explicit label clears', async () => {
    const select = vi.fn(), purchase = vi.fn(); await act(async () => root.render(<BillboardLayouts settings={{ variant: 'billboard-12', items: [{ title: 'Own one' }, { title: 'Own two' }] }} preview onItemSelect={select} />));
    await act(async () => host.querySelector<HTMLButtonElement>('[aria-label="تعديل بطاقة اللوحة 2"]')!.click()); expect(select).toHaveBeenCalledWith(1);
    await act(async () => root.render(<BillboardLayouts settings={{ variant: 'billboard-1', title: 'Own' }} onPurchase={purchase} />)); await act(async () => host.querySelector<HTMLButtonElement>('[data-purchase]')!.click()); expect(purchase).toHaveBeenCalledOnce(); expect(host.querySelector('form')).toBeNull();
    expect(renderToStaticMarkup(<BillboardLayouts settings={{ variant: 'billboard-1', title: 'Own', button_text: '' }} />)).not.toContain('data-purchase');
    const legacy: LandingDocument = { schema: 1, mode: 'standalone', sections: [{ id: blockId, type: 'billboard', settings: { title: 'Legacy owned billboard', description: 'Legacy body' } }] };
    const html = renderToStaticMarkup(<LandingSections document={legacy} context={ctx} />); expect(html).toContain('Legacy owned billboard'); expect(html).not.toContain('lp-pd');
  });
  it('keeps decorative text owned and quoted without creating extra CSS declarations', async () => {
    const caption = 'OWN"; color:red; --other:"';
    await act(async () => root.render(<BillboardLayouts settings={{ variant:'billboard-13', title:'Own title', caption }}/>));
    const region = host.querySelector<HTMLElement>('[data-design="billboard-13"]')!;
    expect(region.style.getPropertyValue('--bb-caption')).toBe(JSON.stringify(caption)); expect(region.style.color).toBe(''); expect(region.style.getPropertyValue('--other')).toBe('');
  });
  it('mirrors the page viewport only for branded native CSS, updates on resize and retains the opaque raw path', async () => {
    const previous = Object.getOwnPropertyDescriptor(window, 'matchMedia'), previousWidth = Object.getOwnPropertyDescriptor(window, 'innerWidth'), previousHeight = Object.getOwnPropertyDescriptor(window, 'innerHeight');
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1600 }); Object.defineProperty(window, 'innerHeight', { configurable: true, value: 900 });
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: (query: string) => ({ matches: query.includes('min-width') ? window.innerWidth >= 1200 : window.innerWidth <= 1200, addEventListener: vi.fn(), removeEventListener: vi.fn() }) });
    const css = 'h1{min-height:80vh}@media(min-width:1200px){h1{--layout:desktop}}@media(max-width:1200px){h1{--layout:mobile}}';
    try {
      await act(async () => root.render(<StaticLandingFrame pageViewport title="Own" nativeHtml={nativeLandingMarkup('<h1>Own</h1>')} css={css}/>));
      expect(host.querySelector('iframe')!.srcdoc).toContain('min-height:720px'); expect(host.querySelector('iframe')!.srcdoc).toContain('--layout:desktop'); expect(host.querySelector('iframe')!.srcdoc).not.toContain('--layout:mobile'); expect(host.querySelector('style')).toBeNull();
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 }); await act(async () => window.dispatchEvent(new Event('resize')));
      expect(host.querySelector('iframe')!.srcdoc).toContain('--layout:mobile'); expect(host.querySelector('iframe')!.srcdoc).not.toContain('--layout:desktop');
      await act(async () => root.render(<StaticLandingFrame pageViewport title="Raw" html="<h1>Own raw</h1>" css={css}/>));
      expect(host.querySelector('iframe')!.srcdoc).toContain(css); expect(host.querySelector('iframe')!.getAttribute('sandbox')).not.toContain('allow-same-origin');
    } finally {
      if (previous) Object.defineProperty(window, 'matchMedia', previous); else Reflect.deleteProperty(window, 'matchMedia');
      if (previousWidth) Object.defineProperty(window, 'innerWidth', previousWidth); if (previousHeight) Object.defineProperty(window, 'innerHeight', previousHeight);
    }
  });
  it('rejects cross-family variants and mode keys while retaining all18 explicit variants', () => {
    for (const d of billboardDesigns) expect(parseLanding({ schema: 1, mode: 'standalone', sections: [{ id: blockId, type: 'billboard', settings: { variant: d.id, billboard_mode: 'fields', billboard_css_mode: 'template' } }] })).not.toBeNull();
    for (const [type, settings] of [['billboard', { variant: 'billboard-19' }], ['content', { variant: 'billboard-1' }], ['billboard', { variant: 'description-1' }], ['billboard', { variant: 'billboard-1', billboard_mode: 'bad' }], ['billboard', { billboard_css_mode: 'custom' }], ['billboard', { variant: 'billboard-1', description_mode: 'fields' }]]) expect(parseLanding({ schema: 1, mode: 'standalone', sections: [{ id: blockId, type, settings }] })).toBeNull();
  });
  it('preserves native orientation inside phone preview without enabling owner event attributes', async () => {
    await act(async () => root.render(<BillboardLayouts settings={{ variant:'billboard-1', title:'Own title', layout:'reverse' }} preview phonePreview />));
    const frame=host.querySelector('iframe')!;
    const doc=new DOMParser().parseFromString(frame.srcdoc,'text/html');
    expect(doc.querySelector('.advanced-text')?.getAttribute('data-layout')).toBe('reverse');
    expect(nativeLandingMarkup('<div data-layout="stack" onclick="bad()">Own</div>').html).toBe('<div data-layout="stack">Own</div>');
    expect(frame.getAttribute('sandbox')).not.toContain('allow-same-origin');
  });
});
