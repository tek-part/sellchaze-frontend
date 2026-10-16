// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StoreFeatures } from './StoreFeatures';
import { storeFeatureDefaults, storeFeatureDesigns } from './store-feature-designs';
import { parseLanding, type LandingItem, type LandingSettings } from './document';
import { LandingSections } from './LandingSections';
import type { StorefrontContext } from '../theme-engine/rendering';

let host: HTMLDivElement; let root: Root;
beforeEach(() => { Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }); host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.restoreAllMocks(); });
const ownItems: LandingItem[] = Array.from({ length: 9 }, (_, index) => ({ title: `Own benefit ${index}`, text: `Own detail ${index}`, icon: 'shield', image: { url: `/own-${index}.png`, alt: `Own image ${index}` }, url: `/pages/own-${index}` }));

describe('native store-feature designs', () => {
  it('renders all45 designs from supplied content without truncating extra items or inventing commercial promises', async () => {
    for (const d of storeFeatureDesigns) {
      const settings = { ...storeFeatureDefaults(d.id), title: 'Own heading', items: ownItems };
      const before = JSON.stringify(settings);
      await act(async () => root.render(<StoreFeatures settings={settings} />));
      expect(host.querySelectorAll('.lp-feature-card:not([aria-hidden])')).toHaveLength(9);
      expect(host.textContent).toContain('Own benefit 8');
      expect(host.textContent).not.toMatch(/شحن مجاني|ضمان|500|55,000|بيانات تجريبية/);
      expect(JSON.stringify(settings)).toBe(before);
      expect(host.querySelector('.lp-features')).not.toBeNull();
    }
  });
  it('uses editor-only examples for blank slots without publishing or persisting them', async () => {
    const settings: LandingSettings = { ...storeFeatureDefaults('features-9'), items: [{ title: '', text: '' }] };
    await act(async () => root.render(<StoreFeatures settings={settings} />)); expect(host.textContent).toBe('');
    await act(async () => root.render(<StoreFeatures settings={settings} preview />)); expect(host.textContent).toContain('بيانات تجريبية');
    expect(settings.items).toEqual([{ title: '', text: '' }]);
  });
  it('lets the editor target the correct item including blank slots', async () => {
    const select = vi.fn();
    await act(async () => root.render(<StoreFeatures settings={{ ...storeFeatureDefaults('features-1'), items: [{}, ownItems[0]!, ownItems[1]!] }} preview onItemSelect={select} />));
    const buttons = host.querySelectorAll<HTMLButtonElement>('.lp-feature-edit');
    expect(buttons).toHaveLength(3);
    await act(async () => buttons[2]!.click()); expect(select).toHaveBeenLastCalledWith(2);
    expect(host.querySelector('a')).toBeNull();
  });
  it('keeps ticker copies inert and link-free, and supports pausing without hiding the real items', async () => {
    await act(async () => root.render(<StoreFeatures settings={{ ...storeFeatureDefaults('features-40'), items: ownItems }} />));
    expect(host.querySelectorAll('article:not([aria-hidden])')).toHaveLength(9);
    expect(host.querySelectorAll('article[aria-hidden=true][inert]')).toHaveLength(9);
    expect(host.querySelectorAll('.lp-feature-ticker-copy a,.lp-feature-ticker-copy iframe')).toHaveLength(0);
    const control = host.querySelector<HTMLButtonElement>('.lp-feature-motion')!;
    await act(async () => control.click()); expect(control.getAttribute('aria-pressed')).toBe('true');
    expect(host.querySelector('.lp-features')?.getAttribute('data-motion')).toBe('paused');
    await act(async () => root.render(<StoreFeatures settings={{ ...storeFeatureDefaults('features-45'), motion: false, items: ownItems }} />));
    expect(host.querySelector('.lp-feature-ticker-copy')).toBeNull(); expect(host.querySelector('.lp-feature-motion')).toBeNull();
  });
  it('preserves merchant HTML in an opaque frame and treats unknown icon strings as text', async () => {
    await act(async () => root.render(<StoreFeatures settings={{ ...storeFeatureDefaults('features-3'), items: [{ title: 'Own safe title', icon: '<script>bad()</script>', html: '<h2>Own rich detail</h2><script>bad()</script>' }] }} />));
    expect(host.querySelector('script')).toBeNull();
    expect(host.querySelector('.lp-feature-symbol')?.textContent).toBe('<script>bad()</script>');
    const frame = host.querySelector('iframe')!;
    expect(frame.getAttribute('sandbox')).not.toContain('allow-same-origin');
    expect(frame.srcdoc).not.toContain('<script>bad()'); expect(frame.srcdoc).toContain('Own rich detail');
  });
  it('renders merchant numbers and statements without calculating fake metrics or losing the live checkout', async () => {
    const context: StorefrontContext = { store: { name: 'Own store', currency: 'EGP' }, seo: {}, navigation: { header: [], footer: [] }, data: { reviews: [] } };
    await act(async () => root.render(<LandingSections context={context} document={{ schema: 1, mode: 'standalone', sections: [
      { id: crypto.randomUUID(), type: 'store_features', settings: { ...storeFeatureDefaults('features-41'), items: [{ title: '42', text: 'Own measured count' }] } },
      { id: crypto.randomUUID(), type: 'store_features', settings: { ...storeFeatureDefaults('features-42'), title: 'Own statement' } },
      { id: crypto.randomUUID(), type: 'checkout', settings: {} },
    ] }} checkout={<form aria-label="Own live purchase" />} />));
    expect(host.textContent).toContain('42'); expect(host.textContent).toContain('Own measured count'); expect(host.textContent).toContain('Own statement');
    expect(host.querySelectorAll('form')).toHaveLength(1);
  });
  it('validates all45 styles, family boundaries, motion and color values in native imports', () => {
    const section = { id: crypto.randomUUID(), type: 'store_features', settings: { ...storeFeatureDefaults('features-45'), items: [{ title: 'Own', icon: 'gift', accent: '#aabbcc', background: 'transparent', foreground: '#111111', url: '' }] } };
    const doc = { schema: 1, mode: 'standalone', sections: [section] };
    for (const d of storeFeatureDesigns) expect(parseLanding({ ...doc, sections: [{ ...section, settings: { ...section.settings, variant: d.id } }] })).not.toBeNull();
    for (const invalid of [{ ...section, type: 'checkout' }, ...['features-0', 'features-46', 'features-1.1', 'features-01', 'testimonials-1'].map(variant => ({ ...section, settings: { ...section.settings, variant } })), { ...section, settings: { ...section.settings, motion: 'true' } }, { ...section, settings: { ...section.settings, hover_background: 'url(evil)' } }, { ...section, settings: { ...section.settings, items: [{ accent: 'red;position:fixed' }] } }]) expect(parseLanding({ ...doc, sections: [invalid] })).toBeNull();
  });
});
