// @vitest-environment jsdom
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import StoreProductEditorPage from '../pages/StoreProductEditorPage';
import api from '../api/client';

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }));
vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn() } }));
vi.mock('react-router-dom', () => ({ Link: ({ to, children, ...props }) => React.createElement('a', { href: to, ...props }, children), useNavigate: () => navigate, useParams: () => ({}), useOutletContext: () => ({ store: { currency: 'EGP' }, permissions: ['products-create'] }) }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ i18n: { language: 'en' } }) }));
vi.mock('../hooks/useStoreScope', () => ({ default: () => ({ apiBase: '/my-store', uiBase: '/store' }) }));
vi.mock('../hooks/useStoreLocales', () => ({ default: () => ({ locales: ['en'], defaultLocale: 'en' }) }));
vi.mock('../utils/fetchAllPages', () => ({ fetchAllPages: vi.fn().mockResolvedValue([]) }));
vi.mock('../components/store/ProductRichText', () => ({ default: () => null }));
vi.mock('../components/store/ProductMediaEditor', () => ({ default: () => null }));
vi.mock('../components/store/StoreProductOptions', () => ({ default: () => null, ProductStockControl: () => null }));
vi.mock('../components/store/StoreProductPersonalization', () => ({ default: () => null }));
vi.mock('../components/store/StoreProductQuantityOffers', () => ({ default: () => null }));

let host, root;
beforeEach(() => { vi.clearAllMocks(); globalThis.IS_REACT_ACT_ENVIRONMENT = true; host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(async () => { if (root) await act(async () => root.unmount()); host.remove(); });
const findButton = (label) => [...host.querySelectorAll('button')].find((el) => el.textContent === label);
async function fill(input, value) { const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; await act(async () => { setter.call(input, value); input.dispatchEvent(new Event('input', { bubbles: true })); }); }
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
        expect(JSON.parse(first.get('creation'))).toMatchObject({ inventory: { stock_quantity: 12 }, variants: [] });
        expect(first.get('creation_key')).toMatch(/^[a-f0-9-]{36}$/);
        expect(host.querySelector('[role=alert]').textContent).toContain('Connection interrupted');
        api.post.mockResolvedValueOnce(response); await submit();
        expect(api.post.mock.calls[1][1].get('creation_key')).toBe(first.get('creation_key'));
        expect(navigate).toHaveBeenCalledExactlyOnceWith('/store/products/99/edit', { replace: true });
    });
    it('blocks incomplete properties without sending a request', async () => {
        await mount(); await fill(host.querySelector('.pe-name input'), 'Review product');
        await act(async () => findButton('Add a property').click());
        expect(findButton('Save').disabled).toBe(true);
        await submit(); expect(api.post).not.toHaveBeenCalled();
        expect(host.querySelector('[role=alert]').textContent).toContain('Complete properties');
    });
    it('discards a late create response after leaving the editor', async () => {
        let resolve; api.post.mockReturnValueOnce(new Promise((done) => { resolve = done; }));
        await mount(); await fill(host.querySelector('.pe-name input'), 'Review product'); await submit();
        await act(async () => root.unmount()); root = null;
        await act(async () => resolve(response)); expect(navigate).not.toHaveBeenCalled();
    });
});
