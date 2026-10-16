// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { LandingSections } from './LandingSections';
import { LandingVideo, landingVideoSource } from './LandingVideo';
import { VideoTemplates } from './VideoTemplates';
import { videoDesigns } from './video-designs';
import { parseLanding, type LandingDocument, type LandingItem } from './document';
import type { StorefrontContext } from '../theme-engine/rendering';

let host: HTMLDivElement; let root: Root;
beforeEach(() => { Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }); host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
const own: LandingItem[] = Array.from({ length: 7 }, (_, index) => ({ title: `Own benefit ${index}`, text: 'Own multiline\nexplanation ', icon: 'shield', image: { url: '/storage/own.png', alt: 'Own image' }, html: '<p>Own details</p>', url: '/pages/own-details' }));
const context = { store: {}, data: {} } as unknown as StorefrontContext;

describe('video landing templates', () => {
  it('normalizes supported providers without autoplay, arbitrary frames or HTML injection', () => {
    for (const url of ['https://youtu.be/abcdefghijk', 'https://www.youtube.com/watch?v=abcdefghijk&autoplay=1', 'https://www.youtube.com/shorts/abcdefghijk', 'https://www.youtube-nocookie.com/embed/abcdefghijk']) expect(landingVideoSource(url)).toEqual({ kind: 'embed', src: 'https://www.youtube-nocookie.com/embed/abcdefghijk' });
    expect(landingVideoSource('https://player.vimeo.com/video/123456')).toEqual({ kind: 'embed', src: 'https://player.vimeo.com/video/123456' });
    expect(landingVideoSource('/storage/own.mp4?token=own')).toEqual({ kind: 'file', src: '/storage/own.mp4?token=own' });
    for (const url of ['javascript:alert(1)', 'https://youtube.com.evil.test/embed/abcdefghijk', 'https://youtu.be/wrong', 'https://example.test/embed/abcdefghijk', '//evil.test/video.mp4', 'https://example.test/a.mp4\u0000']) expect(landingVideoSource(url)).toBeNull();
    const html = renderToStaticMarkup(<LandingVideo url="/storage/own.mp4" title="Own movie" />);
    expect(html).toContain('controls=""'); expect(html).toContain('playsInline=""'); expect(html.toLowerCase()).not.toContain('autoplay');
  });
  it('renders all five distinct structures using owned URLs and never changes stored content', () => {
    for (const d of videoDesigns) {
      const settings = { variant: d.id, title: 'Own video', description: 'Own caption', video: '/storage/own.mp4', items: own, css: '.own { color:red }' };
      const before = JSON.stringify(settings); const html = renderToStaticMarkup(<VideoTemplates settings={settings} />);
      expect(html).toContain(`lp-video--${d.kind}`); expect(html.match(/<video /g)).toHaveLength(1); expect(html).toContain('Own video'); expect(html).toContain('Own caption'); expect(html).not.toContain('<style'); expect(JSON.stringify(settings)).toBe(before);
    }
    const html = renderToStaticMarkup(<VideoTemplates settings={{ variant: 'video-3', items: own }} />);
    expect(html.match(/<article/g)).toHaveLength(7); expect(html).toContain('Own benefit 6'); expect(html.match(/<img /g)).toHaveLength(7); expect(html).toContain('/pages/own-details');
  });
  it('uses neutral editor slots without loading videos or saving benefit examples', () => {
    const settings = { variant: 'video-3' as const, video: 'https://youtu.be/abcdefghijk', items: [] }; const before = JSON.stringify(settings);
    const html = renderToStaticMarkup(<VideoTemplates settings={settings} preview />);
    expect(html).toContain('lp-video-placeholder'); expect(html).not.toContain('<iframe'); expect(html).not.toContain('<video'); expect(html.match(/<article/g)).toHaveLength(3); expect(html).toContain('data-motion="paused"'); expect(JSON.stringify(settings)).toBe(before);
    expect(renderToStaticMarkup(<VideoTemplates settings={{ variant: 'video-1' }} />)).toBe('');
  });
  it('scrolls to one existing checkout without submitting, supports cleared labels and inert editor actions', async () => {
    const doc: LandingDocument = { schema: 1, mode: 'standalone', sections: [{ id: 'own-video', type: 'video', settings: { variant: 'video-4', title: 'Own title', video: '/storage/own.mp4' } }, { id: 'own-form', type: 'checkout', settings: {} }] };
    const submit = vi.fn(e => e.preventDefault());
    await act(async () => root.render(<LandingSections document={doc} context={context} checkout={<form onSubmit={submit}><button type="submit">Submit</button></form>} />));
    const scroll = vi.fn(); Object.assign(host.querySelector('[data-landing-checkout]')!, { scrollIntoView: scroll }); vi.stubGlobal('matchMedia', () => ({ matches: true }));
    expect(host.querySelector<HTMLButtonElement>('.lp-video-buy')!.type).toBe('button');
    await act(async () => host.querySelector<HTMLButtonElement>('.lp-video-buy')!.click());
    expect(scroll).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' }); expect(submit).not.toHaveBeenCalled(); expect(host.querySelectorAll('form')).toHaveLength(1);
    const purchase = vi.fn(); await act(async () => root.render(<VideoTemplates settings={{ variant: 'video-4', title: 'Own' }} preview onPurchase={purchase} />));
    await act(async () => host.querySelector<HTMLButtonElement>('.lp-video-buy')!.click()); expect(purchase).not.toHaveBeenCalled();
    await act(async () => root.render(<VideoTemplates settings={{ variant: 'video-4', title: 'Own', button_text: '' }} />)); expect(host.querySelector('.lp-video-buy')).toBeNull();
  });
  it('retains legacy video rendering and validates strict family membership', () => {
    const section = { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', type: 'video' as const, settings: { title: 'Legacy', video: '/own.mp4' } };
    const doc: LandingDocument = { schema: 1, mode: 'standalone', sections: [section] }; const before = JSON.stringify(doc);
    const html = renderToStaticMarkup(<LandingSections document={doc} context={context} />);
    expect(html).toContain('<video'); expect(html).not.toContain('lp-video--'); expect(JSON.stringify(doc)).toBe(before);
    for (const d of videoDesigns) expect(parseLanding({ ...doc, sections: [{ ...section, settings: { variant: d.id } }] })).not.toBeNull();
    for (const [type, variant] of [['video','video-6'],['video','faq-1'],['youtube','video-1'],['checkout','video-4']]) expect(parseLanding({ ...doc, sections: [{ ...section, type, settings: { variant } }] })).toBeNull();
  });
});
