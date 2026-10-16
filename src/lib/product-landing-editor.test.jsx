// @vitest-environment jsdom
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRoot } from 'react-dom/client';
import ProductLandingEditorPage from '../pages/ProductLandingEditorPage';
import api from '../api/client';

vi.mock('../api/client', () => ({ default: { get: vi.fn(), put: vi.fn(), post: vi.fn() } }));
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn(), useParams: () => ({ productId: '33' }), useOutletContext: () => ({ store: { name: 'Own', currency: 'EGP' } }) }));
vi.mock('../hooks/useStoreScope', () => ({ default: () => ({ apiBase: '/my-store', uiBase: '/store' }) }));
vi.mock('../apps/storefront/store-identity', () => ({ loadIdentityFonts: vi.fn().mockResolvedValue(), identityFontStylesheet: () => undefined, identityForeground: () => '#ffffff' }));
vi.mock('../apps/storefront/landing/LandingSections', () => ({ LandingBlock: ({ section }) => <div>{section.settings.title}</div> }));
const version = 'a'.repeat(64); const nextVersion = 'b'.repeat(64);
const product = { id: 33, name: 'Own product', slug: 'own-product', price: 150, media: [] };
let host, root;
beforeEach(() => { vi.clearAllMocks(); globalThis.IS_REACT_ACT_ENVIRONMENT = true; host = document.createElement('div'); document.body.append(host); root = createRoot(host); api.get.mockImplementation(url => Promise.resolve({ data: url.endsWith('/landing-page') ? { data: { schema: 1, mode: 'standard', sections: [] }, version, product } : { data: product } })); });
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
const button = name => [...host.querySelectorAll('button')].find(el => (el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent).trim() === name);
const click = async name => act(async () => button(name).click());

describe('product landing editor save recovery', () => {
  it('retains edits after a conflict and retries with the same document and version until accepted', async () => {
    await act(async () => root.render(<ProductLandingEditorPage />));
    await click('نموذج الشراء'); await click('إغلاق الإعدادات');
    api.put.mockRejectedValueOnce({ response: { status: 409, data: { message: 'Changed elsewhere' } } });
    await click('حفظ'); const [path, first] = api.put.mock.calls[0];
    expect(path).toBe('/my-store/catalog/products/33/landing-page'); expect(first.version).toBe(version); expect(first.document.mode).toBe('standalone');
    expect(host.querySelector('[role=alert]').textContent).toContain('Changed elsewhere');
    expect(host.querySelectorAll('.pl-section')).toHaveLength(1);
    api.put.mockResolvedValueOnce({ data: { data: first.document, version: nextVersion } });
    await click('حفظ'); expect(api.put.mock.calls[1][1]).toEqual(first); expect(host.querySelector('[role=status]').textContent).toContain('تم حفظ');
    await click('زر الشراء'); await click('إغلاق الإعدادات');
    api.put.mockResolvedValueOnce({ data: { data: { ...first.document, sections: [] }, version: 'c'.repeat(64) } });
    await click('حفظ'); expect(api.put.mock.calls[2][1].version).toBe(nextVersion);
  });
  it('can undo deletion and redo it without issuing a publish request', async () => {
    await act(async () => root.render(<ProductLandingEditorPage />)); await click('نموذج الشراء');
    await click('حذف القسم'); expect(host.querySelectorAll('.pl-section')).toHaveLength(0);
    await click('تراجع'); expect(host.querySelectorAll('.pl-section')).toHaveLength(1);
    await click('إعادة'); expect(host.querySelectorAll('.pl-section')).toHaveLength(0);
    expect(api.put).not.toHaveBeenCalled(); expect(api.post).not.toHaveBeenCalled();
  });
  it('applies and undoes a testimonial design without persisting gallery examples', async () => {
    await act(async () => root.render(<ProductLandingEditorPage />)); await click('تقييمات مخصصة');
    expect(document.querySelector('[role=dialog]')).not.toBeNull();
    const preset = [...document.querySelectorAll('button')].find(el => el.getAttribute('aria-label')?.startsWith('استخدام التنسيق 3:'));
    await act(async () => preset.click());
    expect(document.querySelector('[role=dialog]')).toBeNull();
    api.put.mockImplementation((_, payload) => Promise.resolve({ data: { data: payload.document, version: nextVersion } }));
    await click('حفظ'); const saved = api.put.mock.calls[0][1].document.sections[0];
    expect(saved.settings.variant).toBe('testimonials-3'); expect(saved.settings.items).toEqual([]);
    expect(JSON.stringify(saved)).not.toContain('اسم العميل');
    await click('تغيير تنسيق التقييمات');
    await act(async () => [...document.querySelectorAll('button')].find(el => el.getAttribute('aria-label')?.startsWith('استخدام التنسيق 11:')).click());
    await click('تراجع'); await click('حفظ');
    // Undo restores the accepted document, so no second save is necessary.
    expect(api.put).toHaveBeenCalledTimes(1);
  });
  it('preserves banner images and destinations when applying a different layout and exports portable links', async () => {
    const banner = { id: crypto.randomUUID(), type: 'promo_banners', settings: { variant: 'banners-1', items: [{ image: { url: '/own.png' }, destination: { type: 'page', id: 23 } }] } };
    api.get.mockResolvedValue({ data: { data: { schema: 1, mode: 'standalone', sections: [banner] }, version, product, destination_urls: { 'page:23': '/pages/own' } } });
    api.put.mockImplementation((_, payload) => Promise.resolve({ data: { data: payload.document, version: nextVersion, destination_urls: { 'page:23': '/pages/own' } } }));
    await act(async () => root.render(<ProductLandingEditorPage />));
    // The palette and existing section each have this label; select the section tool.
    await act(async () => [...host.querySelectorAll('button')].filter(el => el.textContent.trim() === 'لافتات ترويجية مخصصة').at(-1).click());
    await click('تغيير تنسيق اللافتات');
    await act(async () => [...document.querySelectorAll('button')].find(el => el.getAttribute('aria-label')?.startsWith('استخدام تنسيق اللافتات 4:')).click());
    await click('حفظ'); const saved = api.put.mock.calls[0][1].document.sections[0];
    expect(saved.settings.variant).toBe('banners-4'); expect(saved.settings.items).toHaveLength(5);
    expect(saved.settings.items[0]).toEqual(banner.settings.items[0]);
    let blob; vi.stubGlobal('URL', class extends URL { static createObjectURL(value) { blob = value; return 'blob:own'; } static revokeObjectURL() {} });
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    await click('تصدير صفحة Sellchaze');
    const exported = JSON.parse(await new Promise(resolve => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.readAsText(blob); })); expect(exported.sections[0].settings.items[0].url).toBe('/pages/own'); expect(exported.sections[0].settings.items[0]).not.toHaveProperty('destination');
    anchorClick.mockRestore();
  });
});
