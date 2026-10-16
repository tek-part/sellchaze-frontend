// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Faq } from './Faq';
import { faqDefaults, faqDesigns } from './faq-designs';
import { parseLanding, type LandingItem, type LandingSettings } from './document';
import { LandingSections } from './LandingSections';
import type { StorefrontContext } from '../theme-engine/rendering';

let host: HTMLDivElement; let root: Root;
beforeEach(() => { Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }); host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.restoreAllMocks(); });
const own: LandingItem[] = Array.from({ length: 9 }, (_, i) => ({ title: `Own question ${i}`, text: `Own answer ${i}\nSecond line`, image: { url: `/own-${i}.png`, alt: `Own image ${i}` }, url: `/pages/own-${i}` }));
const questions = () => [...host.querySelectorAll<HTMLButtonElement>('[aria-expanded]')];
describe('native FAQ designs', () => {
  it('renders all35 styles, preserving every extra item and owned answer without inventing policies', async () => {
    for (const design of faqDesigns) {
      const s = { ...faqDefaults(design.id), title: 'Own heading', items: own }; const before = JSON.stringify(s);
      await act(async () => root.render(<Faq settings={s} />));
      expect(questions()).toHaveLength(9); expect(host.textContent).toContain('Own answer 8');
      expect(host.querySelectorAll('img')).toHaveLength(9); expect(host.querySelectorAll('a')).toHaveLength(9);
      expect(host.textContent).not.toMatch(/ضمان|توصيل مجاني|استرجاع|أضف إجابتك/); expect(JSON.stringify(s)).toBe(before);
    }
  });
  it('opens one answer at a time, closes on second activation, and keeps closed content inert', async () => {
    await act(async () => root.render(<Faq settings={{ variant: 'faq-35', items: own }} />));
    expect(questions().every(b => b.getAttribute('aria-expanded') === 'false')).toBe(true);
    await act(async () => questions()[0]!.click());
    const first = document.getElementById(questions()[0]!.getAttribute('aria-controls')!)!;
    expect(first.getAttribute('aria-hidden')).toBe('false'); expect(first.hasAttribute('inert')).toBe(false);
    await act(async () => questions()[1]!.click());
    expect(questions()[0]!.getAttribute('aria-expanded')).toBe('false'); expect(first.hasAttribute('inert')).toBe(true);
    expect(questions().filter(b => b.getAttribute('aria-expanded') === 'true')).toHaveLength(1);
    await act(async () => questions()[1]!.click()); expect(questions().every(b => b.getAttribute('aria-expanded') === 'false')).toBe(true);
  });
  it('supports directional focus, Home and End with unique question/panel associations', async () => {
    await act(async () => root.render(<><Faq settings={{ items: own }} /><Faq settings={{ items: own }} /></>));
    const buttons = questions(); buttons[0]!.focus();
    await act(async () => buttons[0]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true })));
    expect(document.activeElement).toBe(buttons[8]);
    await act(async () => buttons[8]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true })));
    expect(document.activeElement).toBe(buttons[0]);
    await act(async () => buttons[0]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true })));
    expect(document.activeElement).toBe(buttons[8]);
    const ids = buttons.map(b => b.getAttribute('aria-controls')); expect(new Set(ids).size).toBe(18);
    for (const b of buttons) expect(document.getElementById(b.getAttribute('aria-controls')!)!.getAttribute('aria-labelledby')).toBe(b.id);
  });
  it('targets original item indices and uses neutral guidance only in the editor', async () => {
    const select = vi.fn(); const s: LandingSettings = { variant: 'faq-1', items: [{}, own[0]!, {}] };
    await act(async () => root.render(<Faq settings={s} preview onItemSelect={select} />));
    await act(async () => questions()[2]!.click()); expect(select).toHaveBeenLastCalledWith(2); expect(host.textContent).toContain('أضف إجابتك هنا.'); expect(host.querySelector('a')).toBeNull();
    await act(async () => root.render(<Faq settings={s} />)); expect(questions()).toHaveLength(1); expect(host.textContent).not.toContain('أضف إجابتك'); expect(s.items![2]).toEqual({});
  });
  it('isolates supplied rich HTML and styles while exposing explicit colors and motion settings', async () => {
    await act(async () => root.render(<Faq settings={{ variant: 'faq-7', motion: false, foreground: '#112233', question_background: '#abcdef', items: [{ title: 'Own HTML', html: '<style>body{position:fixed}</style><p>Own rich answer</p><script>bad()</script>' }] }} />));
    expect(host.querySelector('.lp-faq')!.getAttribute('data-motion')).toBe('paused');
    expect(host.querySelector('.lp-faq--gradient')).toBeNull();
    expect(host.querySelector<HTMLElement>('.lp-faq')!.style.getPropertyValue('--faq-card')).toBe('#abcdef');
    expect(host.querySelector('iframe')).not.toBeNull(); expect(host.querySelector('script')).toBeNull(); expect(host.querySelector('style')).toBeNull();
  });
  it('shows the source22 purchase action, supports clearing its label, and keeps editor clicks inert', async () => {
    const purchase = vi.fn();
    await act(async () => root.render(<Faq settings={{ variant: 'faq-22', title: 'Own FAQs', items: own }} onPurchase={purchase} />));
    const buy = host.querySelector<HTMLButtonElement>('.lp-faq-buy')!; expect(buy.type).toBe('button'); expect(buy.textContent).toBe('الشراء الآن');
    await act(async () => buy.click()); expect(purchase).toHaveBeenCalledTimes(1);
    await act(async () => root.render(<Faq settings={{ variant: 'faq-22', button_text: 'Own purchase label' }} preview onPurchase={purchase} />));
    await act(async () => host.querySelector<HTMLButtonElement>('.lp-faq-buy')!.click()); expect(purchase).toHaveBeenCalledTimes(1);
    await act(async () => root.render(<Faq settings={{ variant: 'faq-22', button_text: '' }} onPurchase={purchase} />)); expect(host.querySelector('.lp-faq-buy')).toBeNull();
  });
  it('routes the FAQ purchase action to the existing single checkout without submitting a form', async () => {
    const context = { store: {}, data: {} } as unknown as StorefrontContext; const submit = vi.fn(event => event.preventDefault());
    const document = { schema: 1 as const, mode: 'standalone' as const, sections: [{ id: '1', type: 'faq' as const, settings: { variant: 'faq-22' as const, title: 'Own heading' } }, { id: '2', type: 'checkout' as const, settings: {} }] };
    await act(async () => root.render(<LandingSections document={document} context={context} checkout={<form onSubmit={submit}><button type="submit">Submit own order</button></form>} />));
    const scroll = vi.fn(); Object.assign(host.querySelector('[data-landing-checkout]')!, { scrollIntoView: scroll }); vi.stubGlobal('matchMedia', () => ({ matches: true }));
    await act(async () => host.querySelector<HTMLButtonElement>('.lp-faq-buy')!.click());
    expect(scroll).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' }); expect(submit).not.toHaveBeenCalled(); expect(host.querySelectorAll('form')).toHaveLength(1); vi.unstubAllGlobals();
  });
  it('gives legacy FAQ documents the single-open behavior without changing their stored content', async () => {
    const document = { schema: 1 as const, mode: 'standalone' as const, sections: [{ id: 'legacy-faq', type: 'faq' as const, settings: { title: 'Own legacy heading', question_background: '#abcdef', items: own } }] };
    const before = JSON.stringify(document); const context = { store: {}, data: {} } as unknown as StorefrontContext;
    await act(async () => root.render(<LandingSections document={document} context={context} />));
    expect(host.querySelector('details')).toBeNull(); expect(questions()).toHaveLength(9);
    await act(async () => questions()[0]!.click()); await act(async () => questions()[1]!.click());
    expect(questions().filter(b => b.getAttribute('aria-expanded') === 'true')).toHaveLength(1);
    expect(questions()[0]!.getAttribute('aria-expanded')).toBe('false'); expect(JSON.stringify(document)).toBe(before);
    expect(host.querySelectorAll('img')).toHaveLength(9);
  });
  it('validates the complete variant family and rejects crossed or unknown designs', () => {
    const section = { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', type: 'faq', settings: {} };
    for (const d of faqDesigns) expect(parseLanding({ schema: 1, mode: 'standalone', sections: [{ ...section, settings: faqDefaults(d.id) }] })).not.toBeNull();
    for (const variant of ['faq-0', 'faq-36', 'features-1', 'banners-1']) expect(parseLanding({ schema: 1, mode: 'standalone', sections: [{ ...section, settings: { variant } }] })).toBeNull();
    expect(parseLanding({ schema: 1, mode: 'standalone', sections: [{ ...section, type: 'checkout', settings: { variant: 'faq-1' } }] })).toBeNull();
  });
  it('keeps one live purchase form alongside FAQ designs and omits an entirely empty public FAQ', async () => {
    const context = { store: {}, data: {} } as unknown as StorefrontContext;
    const document = { schema: 1 as const, mode: 'standalone' as const, sections: [{ id: '1', type: 'faq' as const, settings: { variant: 'faq-1' as const } }, { id: '2', type: 'checkout' as const, settings: {} }, { id: '3', type: 'checkout' as const, settings: {} }] };
    await act(async () => root.render(<LandingSections document={document} context={context} checkout={<form aria-label="Own checkout" />} />));
    expect(host.querySelectorAll('form')).toHaveLength(1); expect(host.querySelector('.lp-faq')).toBeNull();
  });
});
