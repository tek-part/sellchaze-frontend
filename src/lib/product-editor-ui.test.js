// @vitest-environment jsdom
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import StoreProductEditorPage from '../pages/StoreProductEditorPage';
import api from '../api/client';

const { navigate, params } = vi.hoisted(() => ({ navigate: vi.fn(), params: {} }));
vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn() } }));
vi.mock('react-router-dom', () => ({ Link: ({ to, children, ...props }) => React.createElement('a', { href: to, ...props }, children), useNavigate: () => navigate, useLocation: () => ({ pathname: '/', search: '', state: null }), useParams: () => params, useOutletContext: () => ({ store: { currency: 'EGP' }, permissions: ['products-create', 'products-edit'] }) }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ i18n: { language: 'en' } }) }));
vi.mock('../hooks/useStoreScope', () => ({ default: () => ({ apiBase: '/my-store', uiBase: '/store' }) }));
vi.mock('../hooks/useStoreLocales', () => ({ default: () => ({ locales: ['en', 'ar'], defaultLocale: 'en' }) }));
vi.mock('../utils/fetchAllPages', () => ({ fetchAllPages: vi.fn().mockResolvedValue([]) }));
vi.mock('../components/store/ProductRichText', () => ({ default: ({ label, value, onChange }) => React.createElement('textarea', { 'aria-label': label, value, onChange: event => onChange(event.target.value) }) }));
vi.mock('../components/store/ProductMediaEditor', () => ({ default: () => null }));
vi.mock('../components/store/StoreProductOptions', () => ({ default: () => null, ProductStockControl: () => null }));
vi.mock('../components/store/StoreProductPersonalization', () => ({ default: () => null }));
vi.mock('../components/store/StoreProductQuantityOffers', () => ({ default: () => null }));

let host, root;
beforeEach(() => { vi.clearAllMocks(); delete params.productId; api.get.mockReset().mockResolvedValue({ data: { data: [] } }); api.post.mockReset(); globalThis.IS_REACT_ACT_ENVIRONMENT = true; host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(async () => { if (root) await act(async () => root.unmount()); host.remove(); });
const findButton = (label) => [...host.querySelectorAll('button')].find((el) => el.textContent === label);
async function fill(input, value) { const setter = Object.getOwnPropertyDescriptor(input.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, 'value').set; await act(async () => { setter.call(input, value); input.dispatchEvent(new Event('input', { bubbles: true })); }); }
async function mount() { await act(async () => root.render(React.createElement(StoreProductEditorPage))); }
async function submit() { await act(async () => host.querySelector('form#store-product-editor').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))); }
const response = { data: { data: { id: 99, name: 'Review product', price: '40.00', media: [], variants: [] } } };

describe('initial editor save workflow', () => {
    it('posts stock and editorial fields once with a stable key on a failed retry', async () => {
        await mount(); await fill(host.querySelector('.pe-name input'), 'Review product'); await fill(host.querySelector('.pe-fields-three input'), '40');
        await fill(host.querySelector('.pe-inventory-draft input[type=number]'), '12');
        expect(host.querySelector('.pe-name input').form.id).toBe('store-product-editor');
        expect(host.querySelectorAll('form form')).toHaveLength(0);
        api.post.mockRejectedValueOnce(new Error('Connection interrupted'));
        await submit(); const first = api.post.mock.calls[0][1];
        for (const [key, value] of Object.entries({ barcode: '', weight: '', position: '0', is_featured: '0', short_description: '' })) expect(first.get(key)).toBe(value);
        expect(JSON.parse(first.get('creation'))).toMatchObject({ inventory: { stock_quantity: 12 }, variants: [] });
        expect(JSON.parse(first.get('product_preferences'))).toMatchObject({ is_one_page_checkout: false, is_skip_cart: false, buy_now_text: 'اضغط هنا للشراء' });
        expect(first.has('preferences_version')).toBe(false);
        expect(first.get('creation_key')).toMatch(/^[a-f0-9-]{36}$/);
        expect(host.querySelector('[role=alert]').textContent).toContain('Connection interrupted');
        api.post.mockResolvedValueOnce(response); await submit();
        expect(api.post.mock.calls[1][1].get('creation_key')).toBe(first.get('creation_key'));
        expect(navigate).toHaveBeenCalledExactlyOnceWith('/store/products/99/edit', { replace: true, state: { editorSaved: true } });
    });
    it('blocks incomplete properties without sending a request', async () => {
        await mount(); await fill(host.querySelector('.pe-name input'), 'Review product');
        await act(async () => findButton('Add a property').click());
        expect(findButton('Save').disabled).toBe(true);
        await submit(); expect(api.post).not.toHaveBeenCalled();
        expect(host.querySelector('[role=alert]').textContent).toContain('Complete properties');
    });
    it('blocks incomplete pixel rows and submits canonical selected networks with the initial product', async () => {
        await mount(); await fill(host.querySelector('.pe-name input'), 'Review product'); await fill(host.querySelector('.pe-fields-three input'), '40');
        await act(async () => findButton('Add Pixel').click());
        expect(findButton('Save').disabled).toBe(true);
        await submit(); expect(api.post).not.toHaveBeenCalled();
        await fill(host.querySelector('.pe-pixel-row input'), ' 2345678901 ');
        await act(async () => { const select = host.querySelector('.pe-pixel-row select'); select.value = 'facebook'; select.dispatchEvent(new Event('change', { bubbles: true })); });
        expect(findButton('Save').disabled).toBe(false);
        api.post.mockResolvedValueOnce(response); await submit();
        const preferences = JSON.parse(api.post.mock.calls[0][1].get('product_preferences'));
        expect(preferences.browser_pixels).toEqual([{ provider: 'facebook', id: '2345678901' }]);
        expect(preferences.is_skip_cart).toBe(false);
    });
    it('retains existing product pixel rows and preference version when editing other fields', async () => {
        params.productId = '99';
        const preferences = { is_skip_cart: true, browser_pixels: [{ provider: 'tiktok', id: 'C7TEST0123456789ABCDE0' }, { provider: 'facebook', id: '2345678901' }] };
        const fixture = { ...response.data.data, product_preferences: preferences, preferences_version: 'a'.repeat(64) };
        api.get.mockResolvedValue({ data: { data: fixture } }); api.post.mockResolvedValue({ data: { data: fixture } });
        await mount(); expect(host.querySelectorAll('.pe-pixel-row')).toHaveLength(2);
        await fill(host.querySelector('.pe-name input'), 'Retained product'); await submit();
        const payload = api.post.mock.calls[0][1];
        expect(JSON.parse(payload.get('product_preferences'))).toEqual(preferences);
        expect(payload.get('preferences_version')).toBe('a'.repeat(64));
    });
    it('preserves legacy fields and both short-description locales when visible product fields change', async () => {
        params.productId = '99';
        const legacy = { ...response.data.data, description: '<p>Old description</p>', short_description: 'Existing summary', barcode: 'KEEP-123', weight: '2.450', position: 7, is_featured: true,
            translations: { name: { en: 'Review product', ar: 'منتج قديم' }, short_description: { en: 'Existing summary', ar: 'وصف محفوظ' } } };
        api.get.mockResolvedValue({ data: { data: legacy } });
        api.post.mockResolvedValue({ data: { data: legacy } });
        await mount();
        expect(host.textContent).not.toContain('Additional details');
        expect(host.querySelector('.pe-basic .pe-extra-copy')).toBeNull();
        await fill(host.querySelector('.pe-name input'), 'Updated name');
        await fill(host.querySelector('.pe-basic textarea'), '<p>Updated rich description</p>');
        await fill(host.querySelector('.pe-fields-three input'), '55');
        await submit();
        expect(api.post).toHaveBeenCalledTimes(1);
        const [url, payload] = api.post.mock.calls[0];
        expect(url).toBe('/my-store/catalog/products/99');
        for (const [key, value] of Object.entries({ name: 'Updated name', price: '55', description: '<p>Updated rich description</p>', barcode: 'KEEP-123', weight: '2.450', position: '7', is_featured: '1', short_description: 'Existing summary' })) expect(payload.get(key)).toBe(value);
        expect(JSON.parse(payload.get('translations')).short_description).toEqual(legacy.translations.short_description);
        expect(payload.get('_method')).toBe('PUT');
    });
    it('discards a late create response after leaving the editor', async () => {
        let resolve; api.post.mockReturnValueOnce(new Promise((done) => { resolve = done; }));
        await mount(); await fill(host.querySelector('.pe-name input'), 'Review product'); await submit();
        await act(async () => root.unmount()); root = null;
        await act(async () => resolve(response)); expect(navigate).not.toHaveBeenCalled();
    });
});
