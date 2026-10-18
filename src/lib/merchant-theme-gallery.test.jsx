// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import StoreThemesPage from '../pages/StoreThemesPage';
import api from '../api/client';
import { filterGallery } from '../components/store/theme-gallery';

const state = vi.hoisted(() => ({ access: { canStoreThemes: true }, rows: [], active: 1 }));
vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn() } }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ i18n: { language: 'en' }, t: (key, fallback) => typeof fallback === 'string' ? fallback : key }) }));
vi.mock('react-router-dom', async original => ({ ...await original(), useOutletContext: () => ({ permissions: [], access: state.access }) }));
vi.mock('react-hot-toast', () => ({ default: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }) }));

function fixture() {
    return [
        { id: 1, key: 'naseem', name: 'Naseem', installed: true, status: 'active' },
        { id: 2, key: 'blast-pets', name: 'Blast Pets' },
        { id: 3, key: 'nature-kids', name: 'Nature Kids' },
        { id: 4, key: 'elite-furniture', name: 'Elite Furniture' },
        { id: 5, key: 'pure-furniture', name: 'Pure Furniture' },
        { id: 6, key: 'sphinx-v3', name: 'Sphinx V3' },
    ].map(row => ({ description: '', price: '0.00', currency: 'USD', licensed: true, ...row }));
}
let root, host, preview;
beforeEach(() => {
    vi.clearAllMocks(); globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
    state.access = { canStoreThemes: true }; state.rows = fixture(); state.active = 1;
    host = document.createElement('div'); document.body.append(host); root = createRoot(host);
    api.get.mockImplementation(() => Promise.resolve({ data: { data: state.rows, active_theme_id: state.active } }));
    api.post.mockResolvedValue({ data: {} });
    preview = { opener: {}, location: { href: '' }, close: vi.fn() }; vi.spyOn(window, 'open').mockReturnValue(preview);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
async function mount() { await act(async () => root.render(<MemoryRouter initialEntries={['/store/themes']}><StoreThemesPage /></MemoryRouter>)); }
const card = key => host.querySelector(`[data-theme-key="${key}"]`);
const button = (name, scope = document) => [...scope.querySelectorAll('button')].find(el => el.textContent.trim() === name || el.getAttribute('aria-label') === name);
async function click(el) { await act(async () => el.click()); }
async function select(value) { const el = host.querySelector('select'); await act(async () => { el.value = value; el.dispatchEvent(new Event('change', { bubbles: true })); }); }

describe('merchant theme gallery', () => {
    it('classifies a registered perfume package and filters it without showing unregistered packages', async () => {
        state.rows.push({ id: 7, key: 'hype-perfumes', name: 'Hype Perfumes', price: '0.00', currency: 'USD', licensed: true });
        await mount(); await click(button('Perfumes'));
        expect(card('hype-perfumes')).not.toBeNull(); expect(host.querySelectorAll('.ws-theme-modern article')).toHaveLength(1);
        expect(card('nature-pets')).toBeNull(); expect(api.post).not.toHaveBeenCalled();
    });
    it('shows all genuine available themes in modern/classic groups and the actual active banner', async () => {
        await mount(); expect(host.querySelectorAll('.ws-theme-modern article')).toHaveLength(4); expect(host.querySelectorAll('.ws-theme-classic article')).toHaveLength(2);
        expect(host.querySelector('.ws-theme-active-banner h2').textContent).toBe('Naseem');
        expect(host.querySelectorAll('[role="tablist"]')).toHaveLength(0);
        expect(api.get).toHaveBeenCalledTimes(1); expect(api.get).toHaveBeenCalledWith('/my-store/themes');
        expect(card('nature-pets')).toBeNull(); expect(api.post).not.toHaveBeenCalled();
    });
    it('allows an owner without individual permission strings to review activation, and cancels without writes', async () => {
        await mount(); const activate = card('blast-pets').querySelector('.ws-theme-activate'); expect(activate.disabled).toBe(false);
        await click(activate); expect(document.querySelector('[role="dialog"]').textContent).toContain('Blast Pets');
        expect(document.querySelector('[role="dialog"]').textContent).not.toContain('Package signature verified');
        expect(api.post).not.toHaveBeenCalled(); await click(button('Cancel')); expect(document.querySelector('[role="dialog"]')).toBeNull();
        expect(api.post).not.toHaveBeenCalled();
    });
    it('keeps view-only employees from activating or purchasing themes', async () => {
        state.access = { canStoreThemes: false }; await mount();
        expect([...host.querySelectorAll('.ws-theme-activate')].every(el => el.disabled)).toBe(true);
        expect(card('blast-pets').querySelector('.ws-theme-preview').disabled).toBe(false);
    });
    it('filters modern category/price separately from classic price, and resets the modern filters', async () => {
        state.rows.find(row => row.key === 'elite-furniture').price = '29.00';
        await mount(); await click(button('Pets')); expect(host.querySelectorAll('.ws-theme-modern article')).toHaveLength(1); expect(card('blast-pets')).not.toBeNull();
        await select('paid'); expect(host.querySelectorAll('.ws-theme-modern article')).toHaveLength(0); expect(host.querySelectorAll('.ws-theme-classic article')).toHaveLength(2);
        await click(button('Reset')); expect(host.querySelectorAll('.ws-theme-modern article')).toHaveLength(4);
        await click(button('Paid', host.querySelector('.ws-theme-classic-filters'))); expect(host.querySelectorAll('.ws-theme-classic article')).toHaveLength(0); expect(host.querySelectorAll('.ws-theme-modern article')).toHaveLength(4);
    });
    it('paginates real API packages six at a time and resets the page when a filter changes', async () => {
        state.rows.push(...Array.from({ length: 5 }, (_, index) => ({ id: 20 + index, key: `custom-${index}`, name: `Custom ${index}`, gallery_collection: 'modern', gallery_categories: ['pets'], gallery_rank: 200 + index, price: 0, licensed: true })));
        await mount(); expect(host.querySelectorAll('.ws-theme-modern article')).toHaveLength(6);
        await click(button('Next page')); expect(host.querySelectorAll('.ws-theme-modern article')).toHaveLength(3); expect(button('Page 2').getAttribute('aria-current')).toBe('page');
        await click(button('Kids')); expect(host.querySelectorAll('.ws-theme-modern article')).toHaveLength(1); expect(button('Page 1').getAttribute('aria-current')).toBe('page');
    });
    it('installs then activates only the selected real theme after confirmation and refreshes persisted state', async () => {
        api.post.mockImplementation(async (url, payload) => { if (url.endsWith('/activate')) { state.active = payload.theme_id; state.rows.find(row => row.id === payload.theme_id).installed = true; } return { data: {} }; });
        await mount(); await click(card('blast-pets').querySelector('.ws-theme-activate')); await click(button('Activate & publish'));
        expect(api.post.mock.calls).toEqual([['/my-store/themes/install', { theme_id: 2 }], ['/my-store/themes/activate', { theme_id: 2 }]]);
        expect(host.querySelector('.ws-theme-active-banner h2').textContent).toBe('Blast Pets'); expect(card('blast-pets').querySelector('.ws-theme-activate').disabled).toBe(true);
    });
    it('never attempts activation after an install error and retains the previous theme', async () => {
        api.post.mockRejectedValueOnce({ response: { data: { message: 'License unavailable' } } });
        await mount(); await click(card('blast-pets').querySelector('.ws-theme-activate')); await click(button('Activate & publish'));
        expect(api.post.mock.calls).toEqual([['/my-store/themes/install', { theme_id: 2 }]]); expect(host.querySelector('.ws-theme-active-banner h2').textContent).toBe('Naseem');
    });
    it('retains the persisted upgrade action for installed themes with a new version', async () => {
        state.rows[0].update_available = true;
        await mount(); await click(button('Update theme Naseem'));
        expect(api.post.mock.calls).toEqual([['/my-store/themes/upgrade', { theme_id: 1 }]]);
        expect(host.querySelector('.ws-theme-active-banner h2').textContent).toBe('Naseem');
    });
    it('uses the signed preview without installing or activating a theme', async () => {
        api.post.mockResolvedValueOnce({ data: { preview_url: 'https://store.example/?preview=valid' } });
        await mount(); await click(card('blast-pets').querySelector('.ws-theme-preview'));
        expect(api.post.mock.calls).toEqual([['/my-store/themes/preview', { theme_id: 2 }]]); expect(preview.location.href).toBe('https://store.example/?preview=valid'); expect(preview.opener).toBeNull();
    });
    it('keeps the gallery visible while a preview refreshes the catalog', async () => {
        api.post.mockResolvedValueOnce({ data: { preview_url: 'https://store.example/?preview=valid' } });
        await mount(); let finish;
        api.get.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
        await click(card('blast-pets').querySelector('.ws-theme-preview'));
        expect(host.querySelectorAll('[data-theme-key]')).toHaveLength(6); expect(host.querySelector('[aria-busy="true"]')).toBeNull();
        await act(async () => finish({ data: { data: state.rows, active_theme_id: state.active } }));
        expect(card('blast-pets')).not.toBeNull();
    });
    it('loads a corrected preview image after an earlier image failed', async () => {
        state.rows.find(row => row.key === 'blast-pets').preview_image = '/missing.png';
        api.post.mockResolvedValueOnce({ data: { preview_url: 'https://store.example/?preview=valid' } });
        await mount(); await act(async () => card('blast-pets').querySelector('img').dispatchEvent(new Event('error')));
        expect(card('blast-pets').querySelector('img')).toBeNull(); state.rows.find(row => row.key === 'blast-pets').preview_image = '/corrected.png';
        await click(card('blast-pets').querySelector('.ws-theme-preview')); expect(card('blast-pets').querySelector('img').getAttribute('src')).toBe('/corrected.png');
    });
    it('provides a keyboard-accessible guide without changing a theme', async () => {
        await mount(); await click(button('Theme guide')); expect(document.querySelector('[role="dialog"]').textContent).toContain('Choosing your theme');
        await click(button('Close')); expect(document.querySelector('[role="dialog"]')).toBeNull(); expect(api.post).not.toHaveBeenCalled();
    });
    it('recovers from a catalog request failure', async () => {
        api.get.mockRejectedValueOnce(new Error('Catalog unavailable')); await mount(); expect(host.querySelector('[role="alert"]').textContent).toContain('Catalog unavailable');
        await click(button('Retry')); expect(card('blast-pets')).not.toBeNull();
    });
    it('respects API-provided collections for new real packages without inventing names', () => {
        const row = { key: 'custom-published', name: 'Merchant package', galleryCollection: 'modern', galleryCategories: ['pets'], galleryRank: 4, premium: false };
        expect(filterGallery([row], { collection: 'modern', category: 'pets' })).toEqual([row]); expect(filterGallery([row], { collection: 'classic' })).toEqual([]);
    });
});
