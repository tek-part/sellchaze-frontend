// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PromoBanners } from './PromoBanners';
import { promoDefaults, promoDesigns } from './promo-designs';
import { parseLanding, type LandingItem } from './document';
let host: HTMLDivElement; let root: Root;
beforeEach(() => { Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }); host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });
const items: LandingItem[] = Array.from({ length: 7 }, (_, i) => ({ image: { url: `/own-${i}.png`, alt: `Own image ${i}` }, url: `/products/own-${i}` }));
describe('promotional banner layouts', () => {
  it('renders all nine designs without discarding extra images or their destinations', async () => {
    for (const design of promoDesigns) {
      await act(async () => root.render(<PromoBanners settings={{ ...promoDefaults(design.id), items }} />));
      expect(host.querySelectorAll('img')).toHaveLength(7); expect(host.querySelectorAll('a')).toHaveLength(7);
      expect(host.querySelector('a:last-child')?.getAttribute('href')).toMatch(/^\/products\/own-/);
      expect(host.innerHTML).not.toContain('easy-orders');
    }
  });
  it('uses empty preview slots without manufacturing public images or storing placeholders', async () => {
    const settings = { ...promoDefaults('banners-4'), items: [] };
    await act(async () => root.render(<PromoBanners settings={settings} />)); expect(host.textContent).toBe('');
    await act(async () => root.render(<PromoBanners settings={settings} preview />));
    expect(host.querySelectorAll('.lp-promo-panel')).toHaveLength(5); expect(host.querySelector('img')).toBeNull(); expect(settings.items).toEqual([]);
  });
  it('opens the selected image in the editor without navigating while previewing a link', async () => {
    const select = vi.fn();
    await act(async () => root.render(<PromoBanners settings={{ ...promoDefaults('banners-8'), items }} preview onImageSelect={select} />));
    await act(async () => host.querySelectorAll<HTMLButtonElement>('button')[4]!.click());
    expect(select).toHaveBeenCalledWith(4); expect(host.querySelector('a')).toBeNull();
  });
  it('accepts only owned-reference shaped destinations in the correct section family', () => {
    const section = { id: crypto.randomUUID(), type: 'promo_banners', settings: { variant: 'banners-9', items: [{ destination: { type: 'page', id: 23 }, image: { url: '/own.png' } }] } };
    const doc = { schema: 1, mode: 'standalone', sections: [section] };
    expect(parseLanding(doc)).not.toBeNull(); expect(parseLanding({ ...doc, sections: [{ ...section, type: 'custom_reviews' }] })).toBeNull();
    for (const destination of [{ type: 'page', id: 0 }, { type: 'page', id: '23' }, { type: 'unknown', id: 23 }, { type: 'product' }]) {
      expect(parseLanding({ ...doc, sections: [{ ...section, settings: { variant: 'banners-9', items: [{ destination }] } }] })).toBeNull();
    }
  });
});
