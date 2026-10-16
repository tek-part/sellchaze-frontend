// @vitest-environment jsdom
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRoot } from 'react-dom/client';
import ProductLandingEditorPage from '../pages/ProductLandingEditorPage';
import api from '../api/client';

vi.mock('../api/client', () => ({ default: { get: vi.fn(), put: vi.fn(), post: vi.fn() } }));
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn(), useParams: () => ({ productId: '33' }), useOutletContext: () => ({ store: { name: 'Own', currency: 'EGP' } }) }));
vi.mock('../hooks/useStoreScope', () => ({ default: () => ({ apiBase: '/my-store', uiBase: '/store' }) }));
vi.mock('../apps/storefront/store-identity', () => ({ loadIdentityFonts: vi.fn().mockResolvedValue(), identityFontStylesheet: () => undefined }));
vi.mock('../apps/storefront/landing/LandingSections', () => ({ LandingBlock: ({ section }) => <div>{section.settings.title}</div> }));
const version = 'a'.repeat(64); const nextVersion = 'b'.repeat(64);
const product = { id: 33, name: 'Own product', slug: 'own-product', price: 150, media: [] };
let host, root;
beforeEach(() => { vi.clearAllMocks(); globalThis.IS_REACT_ACT_ENVIRONMENT = true; host = document.createElement('div'); document.body.append(host); root = createRoot(host); api.get.mockImplementation(url => Promise.resolve({ data: url.endsWith('/landing-page') ? { data: { schema: 1, mode: 'standard', sections: [] }, version, product } : { data: product } })); });
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });
const button = name => [...host.querySelectorAll('button')].find(el => (el.getAttribute('aria-label') || el.textContent).trim() === name);
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
});
