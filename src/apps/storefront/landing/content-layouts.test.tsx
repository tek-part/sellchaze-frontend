// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentLayouts } from './ContentLayouts';
import { contentDesigns } from './content-designs';
import { parseLanding, type LandingDocument, type LandingItem, type LandingSettings } from './document';
import { LandingSections } from './LandingSections';
import type { StorefrontContext } from '../theme-engine/rendering';

let host: HTMLDivElement; let root: Root;
beforeEach(() => { Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }); host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
const own: LandingItem[] = Array.from({ length: 7 }, (_, i) => ({ title: `Own value ${i}`, text: ' Own description\nsecond line ', caption: 'Own note', icon: 'badge', image: { url: '/own-icon.png', link_url: '/collections/own' }, html: '<p>Own rich detail</p>', url: '/pages/own' }));
const context = { store: {}, data: {} } as unknown as StorefrontContext;
const settings: LandingSettings = { title: 'Own heading', description: ' Own quote\nsecond line ', author: ' Own author ', caption: ' Own source ', eyebrow: 'Own intro', image: { url: '/own-primary.png', alt: 'Own main photo', link_url: '/products/own' }, secondary_image: { url: '/own-secondary.png', link_url: '/pages/own' }, images: [{ url: '/own-extra.png' }], items: own, css: '.own { color: red }' };

describe('content landing layouts', () => {
  it('renders five distinct structures while preserving owned media and all stored fields', () => {
    for (const d of contentDesigns) {
      const value = { ...settings, variant: d.id, motion: false }; const before = JSON.stringify(value);
      const html = renderToStaticMarkup(<ContentLayouts settings={value} />);
      expect(html).toContain(`lp-content--${d.kind}`); expect(html).toContain('data-motion="paused"'); expect(html).toContain('Own quote'); expect(JSON.stringify(value)).toBe(before);
      if (['benefits','stats','cards'].includes(d.kind)) { expect(html.match(/<article/g)).toHaveLength(7); expect(html).toContain('Own value 6'); expect(html.match(/Own rich detail/g)).toHaveLength(7); }
      if (d.kind === 'quote') { expect(html).toContain('Own author'); expect(html).toContain('Own source'); expect(html).not.toContain('Own heading'); }
    }
  });
  it('keeps both image slots independent, exposes safe public destinations and leaves editor clicks inert', async () => {
    await act(async () => root.render(<ContentLayouts settings={{ ...settings, variant: 'content-2', image: undefined }} />));
    expect(host.querySelectorAll('.lp-content-framed>.lp-content-image-slot')).toHaveLength(2);
    expect(host.querySelector('.lp-content-image-slot:first-child img')).toBeNull();
    expect(host.querySelector('.lp-content-image-slot:last-child img')!.getAttribute('src')).toBe('/own-secondary.png');
    expect(host.querySelector('.lp-content-image-slot:last-child a')!.getAttribute('href')).toBe('/pages/own');
    const select = vi.fn(); const purchase = vi.fn();
    await act(async () => root.render(<ContentLayouts settings={{ ...settings, variant: 'content-2' }} preview onImageSelect={select} onPurchase={purchase} />));
    expect(host.querySelectorAll('.lp-content-photo a')).toHaveLength(0);
    await act(async () => host.querySelector<HTMLButtonElement>('[aria-label="تعديل صورة المحتوى الثانية"]')!.click()); expect(select).toHaveBeenCalledWith('secondary');
    await act(async () => host.querySelector<HTMLButtonElement>('.lp-content-buy')!.click()); expect(purchase).not.toHaveBeenCalled();
  });
  it('uses neutral gallery samples without nested controls, navigation or persisted statistics', () => {
    for (const d of contentDesigns) {
      const value = { variant: d.id, items: [] }; const before = JSON.stringify(value);
      const html = renderToStaticMarkup(<ContentLayouts settings={value} preview thumbnail />);
      expect(html).not.toContain('<button'); expect(html).not.toContain('<a '); expect(JSON.stringify(value)).toBe(before);
      expect(html).not.toContain('>100M<'); expect(html).not.toContain('>97<');
    }
    expect(renderToStaticMarkup(<ContentLayouts settings={{ variant: 'content-3' }} />)).toBe('');
    for (const variant of ['content-1', 'content-5'] as const) expect(renderToStaticMarkup(<ContentLayouts settings={{ variant, eyebrow: 'Hidden preserved field', ...(variant === 'content-5' ? { image: settings.image, button_text: 'Hidden action' } : {}) }} />)).toBe('');
    expect(renderToStaticMarkup(<ContentLayouts settings={{ variant: 'content-2', items: own }} />)).toBe('');
  });
  it('uses the existing purchase form without submitting and honors cleared purchase and quote labels', async () => {
    const doc: LandingDocument = { schema: 1, mode: 'standalone', sections: [{ id: 'own', type: 'content', settings: { variant: 'content-4', ...settings } }, { id: 'form', type: 'checkout', settings: {} }] };
    const submit = vi.fn(e => e.preventDefault());
    await act(async () => root.render(<LandingSections document={doc} context={context} checkout={<form onSubmit={submit}><button type="submit">Submit</button></form>} />));
    const scroll = vi.fn(); Object.assign(host.querySelector('[data-landing-checkout]')!, { scrollIntoView: scroll }); vi.stubGlobal('matchMedia', () => ({ matches: true }));
    await act(async () => host.querySelector<HTMLButtonElement>('.lp-content-buy')!.click()); expect(scroll).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' }); expect(submit).not.toHaveBeenCalled(); expect(host.querySelectorAll('form')).toHaveLength(1);
    await act(async () => root.render(<ContentLayouts settings={{ ...settings, variant: 'content-1', button_text: '' }} />)); expect(host.querySelector('.lp-content-buy')).toBeNull();
    await act(async () => root.render(<ContentLayouts settings={{ variant: 'content-3', description: '', author: '', caption: '' }} preview />)); expect(host.querySelector('blockquote')).toBeNull(); expect(host.querySelector('.lp-content-attribution')!.textContent).toBe('');
  });
  it('keeps legacy content rendering and validates variant, media-link and image-slot scope', () => {
    const section = { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', type: 'content' as const, settings: { title: 'Legacy', description: 'Own legacy text', image: { url: '/legacy.png' } } };
    const doc: LandingDocument = { schema: 1, mode: 'standalone', sections: [section] }; const before = JSON.stringify(doc);
    const html = renderToStaticMarkup(<LandingSections document={doc} context={context} />); expect(html).toContain('Own legacy text'); expect(html).not.toContain('lp-content--'); expect(JSON.stringify(doc)).toBe(before);
    for (const d of contentDesigns) expect(parseLanding({ ...doc, sections: [{ ...section, settings: { ...settings, variant: d.id } }] })).not.toBeNull();
    for (const [type, variant] of [['content','content-6'],['content','howto-1'],['how_to','content-1'],['checkout','content-3']]) expect(parseLanding({ ...doc, sections: [{ ...section, type, settings: { variant } }] })).toBeNull();
    for (const image of [{ url: '/own.png', link_url: 'javascript:bad()' }, { url: '/own.png', destination: { type: 'page', id: 0 } }]) expect(parseLanding({ ...doc, sections: [{ ...section, settings: { image } }] })).toBeNull();
    expect(parseLanding({ ...doc, sections: [{ ...section, type: 'video', settings: { image: { url: '/own.png', destination: { type: 'page', id: 2 } } } }] })).toBeNull();
    expect(parseLanding({ ...doc, sections: [{ ...section, settings: { secondary_image: { url: '/own.png', destination: { type: 'page', id: 2 } } } }] })).not.toBeNull();
  });
});
