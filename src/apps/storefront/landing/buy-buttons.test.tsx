// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BuyButton } from './BuyButton';
import { buyButtonDesigns } from './buy-button-designs';
import { parseLanding, type LandingDocument } from './document';
import { LandingSections } from './LandingSections';
import type { StorefrontContext } from '../theme-engine/rendering';

let host: HTMLDivElement; let root: Root;
beforeEach(() => { Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }); host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
const context = { store: {}, data: {} } as unknown as StorefrontContext;

describe('native purchase-button designs', () => {
  it('keeps all34 compositions native and gallery actions inert without copying demo claims', () => {
    for (const d of buyButtonDesigns) {
      const settings = { variant: d.id, button_text: ' Own purchase ', caption: ' Own alternate ', motion: false };
      const before = JSON.stringify(settings); const html = renderToStaticMarkup(<BuyButton settings={settings} />);
      expect(html).toContain(`data-design="${d.id}"`); expect(html).toContain('data-motion="paused"'); expect(html).toContain('aria-label=" Own purchase "'); expect(html).toContain('data-effect-label=" Own alternate "'); expect(JSON.stringify(settings)).toBe(before);
      const thumbnail = renderToStaticMarkup(<BuyButton settings={settings} preview thumbnail />);
      expect(thumbnail).not.toContain('<button'); expect(thumbnail).not.toContain('<a '); expect(thumbnail).not.toContain('<iframe'); expect(thumbnail).not.toContain('عرض محدود');
    }
  });
  it('selects editor properties without purchase and sends public buttons to the one existing checkout', async () => {
    const select = vi.fn(); const purchase = vi.fn();
    await act(async () => root.render(<BuyButton settings={{ variant: 'buy-14', button_text: 'Own purchase' }} preview onSelect={select} onPurchase={purchase} />));
    await act(async () => host.querySelector<HTMLButtonElement>('button')!.click()); expect(select).toHaveBeenCalledOnce(); expect(purchase).not.toHaveBeenCalled();
    const doc: LandingDocument = { schema: 1, mode: 'standalone', sections: [{ id: 'own', type: 'buy_button', settings: { variant: 'buy-30', button_text: 'Own purchase' } }, { id: 'form', type: 'checkout', settings: {} }] };
    const submit = vi.fn(e => e.preventDefault());
    await act(async () => root.render(<LandingSections document={doc} context={context} checkout={<form onSubmit={submit}><button type="submit">Submit</button></form>} />));
    const scroll = vi.fn(); Object.assign(host.querySelector('[data-landing-checkout]')!, { scrollIntoView: scroll }); vi.stubGlobal('matchMedia', () => ({ matches: true }));
    await act(async () => host.querySelector<HTMLButtonElement>('.lp-buy-button')!.click()); expect(scroll).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' }); expect(submit).not.toHaveBeenCalled(); expect(host.querySelectorAll('form')).toHaveLength(1);
  });
  it('honors explicit clears and isolates full-length custom CSS from the application', async () => {
    await act(async () => root.render(<BuyButton settings={{ variant: 'buy-18', button_text: '' }} />)); expect(host.innerHTML).toBe('');
    const css = '/*'+ 'x'.repeat(11800)+'*/button { color: red }';
    await act(async () => root.render(<BuyButton settings={{ variant: 'buy-18', button_text: 'Own <label> " ', caption: '', css, motion: false }} />));
    const frame = host.querySelector('iframe')!; const html = frame.getAttribute('srcdoc')!; const isolated = new DOMParser().parseFromString(html, 'text/html');
    expect(host.querySelector('.lp-buy-button')).toBeNull(); expect(isolated.querySelector('button')!.textContent).toBe('Own <label> " '); expect(isolated.querySelector('button')!.getAttribute('data-effect-label')).toBe('Own <label> " ');
    expect(isolated.querySelector('.lp-buy')!.getAttribute('data-motion')).toBe('paused'); expect(html).toContain(css); expect(html).toContain('@layer native'); expect(html).toContain('/fonts/almarai/Almarai-Regular.ttf'); expect(isolated.querySelector('link[href*="fonts.googleapis"]')).toBeNull(); expect(frame.getAttribute('sandbox')).not.toContain('allow-same-origin'); expect(isolated.querySelectorAll('form')).toHaveLength(0); expect(isolated.querySelectorAll('script')).toHaveLength(1);
  });
  it('retains legacy rendering and rejects crossed families without changing documents', () => {
    const own = { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', type: 'buy_button' as const, settings: { button_text: 'Own legacy purchase' } }; const doc: LandingDocument = { schema: 1, mode: 'standalone', sections: [own] };
    const before = JSON.stringify(doc); const html = renderToStaticMarkup(<LandingSections document={doc} context={context} />); expect(html).toContain('Own legacy purchase'); expect(html).not.toContain('lp-buy--'); expect(JSON.stringify(doc)).toBe(before);
    for (const d of buyButtonDesigns) expect(parseLanding({ ...doc, sections: [{ ...own, settings: { variant: d.id } }] })).not.toBeNull();
    for (const [type, variant] of [['buy_button','buy-35'],['buy_button','buy-0'],['content','buy-1'],['buy_button','content-1'],['checkout','buy-34']]) expect(parseLanding({ ...doc, sections: [{ ...own, type, settings: { variant } }] })).toBeNull();
  });
});
