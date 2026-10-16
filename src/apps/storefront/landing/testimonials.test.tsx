// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Testimonials } from './Testimonials';
import { testimonialDefaults, testimonialDesigns } from './testimonial-designs';
import { parseLanding, type LandingItem } from './document';
const items: LandingItem[] = Array.from({ length: 6 }, (_, i) => ({ author: `Own reviewer ${i}`, title: `Own title ${i}`, text: `Own review ${i}`, date: '2026-10-16', platform: 'Own source', caption: 'Own place' }));
let host: HTMLDivElement; let root: Root;
beforeEach(() => { Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }); host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.restoreAllMocks(); });
describe('editable testimonial designs', () => {
  it('renders all eleven designs using only supplied customer data', async () => {
    for (const design of testimonialDesigns) {
      await act(async () => root.render(<Testimonials settings={{ ...testimonialDefaults(design.id), items }} />));
      expect(host.textContent).toContain('Own reviewer 0'); expect(host.textContent).toContain('Own review 0');
      expect(host.textContent).not.toContain('Verified'); expect(host.querySelector('.lp-review-rating')).toBeNull();
      expect(host.querySelector('time')?.getAttribute('datetime')).toBe('2026-10-16');
    }
  });
  it('keeps gallery example content out of public empty sections and the input document', async () => {
    const settings = { ...testimonialDefaults('testimonials-9'), items: [] };
    await act(async () => root.render(<Testimonials settings={settings} />)); expect(host.textContent).toBe('');
    await act(async () => root.render(<Testimonials settings={settings} preview />)); expect(host.textContent).toContain('بيانات تجريبية');
    expect(settings.items).toEqual([]);
  });
  it('lets carousel dots navigate real cards and exposes the selected item', async () => {
    const scroll = vi.fn(); Object.defineProperty(Element.prototype, 'scrollIntoView', { value: scroll, configurable: true });
    await act(async () => root.render(<Testimonials settings={{ ...testimonialDefaults('testimonials-4'), items }} />));
    const buttons = host.querySelectorAll<HTMLButtonElement>('.lp-review-pages button'); expect(buttons).toHaveLength(6);
    await act(async () => buttons[2]!.click()); expect(scroll).toHaveBeenCalledOnce(); expect(buttons[2]?.getAttribute('aria-current')).toBe('true');
  });
  it('can pause moving rows and keeps repeated cards inert and hidden from assistive technology', async () => {
    await act(async () => root.render(<Testimonials settings={{ ...testimonialDefaults('testimonials-6'), items }} />));
    expect(host.querySelectorAll('article:not([aria-hidden])')).toHaveLength(6);
    expect(host.querySelectorAll('article[aria-hidden=true][inert]')).toHaveLength(6);
    const control = host.querySelector<HTMLButtonElement>('.lp-review-motion')!;
    await act(async () => control.click()); expect(control.getAttribute('aria-pressed')).toBe('true'); expect(control.textContent).toContain('تشغيل');
  });
  it('rejects cross-family styles and unsafe section background image documents', () => {
    const section = { id: crypto.randomUUID(), type: 'custom_reviews', settings: { variant: 'testimonials-11', background_image: { url: '/storage/own.png' }, items } };
    const doc = { schema: 1, mode: 'standalone', sections: [section] };
    expect(parseLanding(doc)).not.toBeNull(); expect(parseLanding({ ...doc, sections: [{ ...section, type: 'checkout' }] })).toBeNull();
    expect(parseLanding({ ...doc, sections: [{ id: section.id, type: 'checkout', settings: [] }] })).not.toBeNull();
    expect(parseLanding({ ...doc, sections: [{ id: section.id, type: 'checkout', settings: ['not-a-map'] }] })).toBeNull();
    expect(parseLanding({ ...doc, sections: [{ ...section, settings: { ...section.settings, background_image: { url: 'javascript:bad()' } } }] })).toBeNull();
  });
});
