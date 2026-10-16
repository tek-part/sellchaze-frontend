// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HowToSteps } from './HowToSteps';
import { howToDesigns } from './howto-designs';
import { parseLanding, type LandingDocument, type LandingItem } from './document';
import { LandingSections } from './LandingSections';
import type { StorefrontContext } from '../theme-engine/rendering';

let host: HTMLDivElement; let root: Root;
beforeEach(() => { Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }); host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
const own: LandingItem[] = Array.from({ length: 7 }, (_, i) => ({ title: `Own step ${i}`, caption: ` Own caption ${i} `, text: ' Own instructions\nsecond line ', image: { url: '/storage/own.png', alt: 'Own image' }, icon: 'gear', url: '/pages/own-details', html: '<p>Own rich detail</p>' }));
const context = { store: {}, data: {} } as unknown as StorefrontContext;

describe('how-to landing designs', () => {
  it('renders all six structures and every owned step without changing the document', () => {
    for (const d of howToDesigns) {
      const settings = { variant: d.id, eyebrow: 'Own intro', title: 'Own instructions', description: 'Own subtitle', image: { url: '/storage/own-hero.png' }, items: own, accent: '#123456', motion: false };
      const before = JSON.stringify(settings); const html = renderToStaticMarkup(<HowToSteps settings={settings} />);
      expect(html).toContain(`lp-howto--${d.kind}`); expect(html).toContain('Own step 6'); expect(html).toContain('Own intro'); expect(html).toContain('data-motion="paused"'); expect(JSON.stringify(settings)).toBe(before);
      expect(html.match(/Own rich detail/g)).toHaveLength(7); expect(html.match(/href="\/pages\/own-details"/g)).toHaveLength(7);
    }
    const wave = renderToStaticMarkup(<HowToSteps settings={{ variant: 'howto-4', title: 'Only heading' }} />);
    expect(wave).toContain('Only heading'); expect(renderToStaticMarkup(<HowToSteps settings={{ variant: 'howto-1' }} />)).toBe('');
  });
  it('opens the second step initially, supports one open step or all closed, and keeps ids unique', async () => {
    await act(async () => root.render(<><HowToSteps settings={{ variant: 'howto-6', items: own }} /><HowToSteps settings={{ variant: 'howto-6', items: own }} /></>));
    const triggers = [...host.querySelectorAll<HTMLButtonElement>('.lp-howto-toggle')];
    const panels = [...host.querySelectorAll<HTMLElement>('.lp-howto-panel')];
    expect(triggers.filter(el => el.getAttribute('aria-expanded') === 'true')).toEqual([triggers[1], triggers[8]]);
    expect(new Set(panels.map(el => el.id)).size).toBe(14);
    expect(panels[0]!.hasAttribute('inert')).toBe(true); expect(panels[1]!.hasAttribute('inert')).toBe(false);
    await act(async () => triggers[0]!.click());
    expect(triggers[0]!.getAttribute('aria-expanded')).toBe('true'); expect(triggers[1]!.getAttribute('aria-expanded')).toBe('false');
    await act(async () => triggers[0]!.click());
    expect(triggers.slice(0, 7).every(el => el.getAttribute('aria-expanded') === 'false')).toBe(true);
    for (const trigger of triggers) expect(document.getElementById(trigger.getAttribute('aria-controls')!)!.getAttribute('aria-labelledby')).toBe(trigger.id);
  });
  it('uses neutral inert gallery examples and a real gear icon without persisting sample content', () => {
    const settings = { variant: 'howto-6' as const, items: [] }; const before = JSON.stringify(settings);
    const html = renderToStaticMarkup(<HowToSteps settings={settings} preview thumbnail />);
    expect(html).toContain('lp-howto-placeholder'); expect(html).not.toContain('<button'); expect(html).not.toContain('<a '); expect(html).not.toContain('<iframe'); expect(JSON.stringify(settings)).toBe(before);
    const cards = renderToStaticMarkup(<HowToSteps settings={{ variant: 'howto-3' }} preview />);
    expect(cards).toContain('<svg'); expect(cards).not.toContain('>gear<'); expect(cards).not.toContain('الخطوة الأولى');
  });
  it('scrolls to one purchase form without submitting and honors empty labels and preview isolation', async () => {
    const doc: LandingDocument = { schema: 1, mode: 'standalone', sections: [{ id: 'own', type: 'how_to', settings: { variant: 'howto-6', items: own } }, { id: 'form', type: 'checkout', settings: {} }] };
    const submit = vi.fn(e => e.preventDefault());
    await act(async () => root.render(<LandingSections document={doc} context={context} checkout={<form onSubmit={submit}><button type="submit">Submit</button></form>} />));
    const scroll = vi.fn(); Object.assign(host.querySelector('[data-landing-checkout]')!, { scrollIntoView: scroll }); vi.stubGlobal('matchMedia', () => ({ matches: true }));
    await act(async () => host.querySelector<HTMLButtonElement>('.lp-howto-panel[aria-hidden=false] .lp-howto-buy')!.click());
    expect(scroll).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' }); expect(submit).not.toHaveBeenCalled(); expect(host.querySelectorAll('form')).toHaveLength(1);
    const purchase = vi.fn(); await act(async () => root.render(<HowToSteps settings={{ variant: 'howto-6', items: own }} preview onPurchase={purchase} />));
    await act(async () => host.querySelector<HTMLButtonElement>('.lp-howto-buy')!.click()); expect(purchase).not.toHaveBeenCalled();
    await act(async () => root.render(<HowToSteps settings={{ variant: 'howto-6', items: own, button_text: '' }} />)); expect(host.querySelector('.lp-howto-buy')).toBeNull();
    await act(async () => root.render(<HowToSteps settings={{ variant: 'howto-6', items: [{ title: 'Own', caption: '' }] }} />)); expect(host.querySelector('.lp-howto-caption')!.textContent).toBe('');
  });
  it('retains the legacy renderer and rejects variants in the wrong family or malformed headings', () => {
    const section = { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', type: 'how_to' as const, settings: { title: 'Legacy', items: own } };
    const doc: LandingDocument = { schema: 1, mode: 'standalone', sections: [section] }; const before = JSON.stringify(doc);
    const html = renderToStaticMarkup(<LandingSections document={doc} context={context} />);
    expect(html).toContain('sf-landing-step'); expect(html).not.toContain('lp-howto--'); expect(JSON.stringify(doc)).toBe(before);
    for (const d of howToDesigns) expect(parseLanding({ ...doc, sections: [{ ...section, settings: { variant: d.id, eyebrow: 'Own intro' } }] })).not.toBeNull();
    for (const [type, variant] of [['how_to', 'howto-7'], ['how_to', 'faq-1'], ['video', 'howto-1'], ['checkout', 'howto-6']]) expect(parseLanding({ ...doc, sections: [{ ...section, type, settings: { variant } }] })).toBeNull();
    expect(parseLanding({ ...doc, sections: [{ ...section, settings: { eyebrow: 3 } }] })).toBeNull();
  });
});
