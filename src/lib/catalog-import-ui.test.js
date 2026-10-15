// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import CatalogImportDialog from '../components/store/CatalogImportDialog';
import api from '../api/client';

vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn() } }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ i18n: { language: 'en' } }) }));
vi.mock('../components/workspace/WorkspaceIcons', () => ({ HiOutlineArrowDownTray: () => null, HiOutlineArrowUpTray: () => null, HiOutlineXMark: () => null }));

let root, host;
beforeEach(() => {
    vi.clearAllMocks();
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
    host = document.createElement('div'); document.body.append(host); root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.unstubAllGlobals(); });
const button = (name) => [...document.querySelectorAll('button')].find((item) => item.textContent === name);
async function mount(props = {}) {
    await act(async () => root.render(React.createElement(CatalogImportDialog, { apiBase: '/my-store', format: 'json', onClose: vi.fn(), onImported: vi.fn(), ...props })));
}
async function choose(name = 'products.json', contents = '[{"name":"Bag","price":10}]') {
    const input = document.querySelector('input[type="file"]');
    Object.defineProperty(input, 'files', { configurable: true, value: [new File([contents], name)] });
    await act(async () => input.dispatchEvent(new Event('change', { bubbles: true })));
}
async function click(name) { await act(async () => button(name).click()); }

describe('catalog import confirmation and recovery', () => {
    it('previews the selected file before allowing creation and reuses one key on a failed apply retry', async () => {
        const onImported = vi.fn();
        api.post.mockResolvedValueOnce({ data: { data: { count: 1, currency: 'EGP', products: [{ name: 'Bag', price: 10, variants: 0, categories: [], warnings: [], is_active: true }] } } });
        await mount({ onImported });
        expect(button('Preview products').disabled).toBe(true);
        await choose(); await click('Preview products');
        expect(api.post.mock.calls[0][0]).toBe('/my-store/catalog/products/import/preview');
        expect(api.post.mock.calls[0][1].has('idempotency_key')).toBe(false);
        expect(onImported).not.toHaveBeenCalled();
        api.post.mockRejectedValueOnce({ message: 'Connection interrupted' });
        await click('Confirm import');
        const firstKey = api.post.mock.calls[1][1].get('idempotency_key');
        expect(firstKey).toMatch(/^[0-9a-f-]{36}$/);
        expect(document.querySelector('[role="alert"]').textContent).toContain('Connection interrupted');
        api.post.mockResolvedValueOnce({ data: { meta: { created: 1 } } });
        await click('Confirm import');
        expect(api.post.mock.calls[2][1].get('idempotency_key')).toBe(firstKey);
        expect(onImported).toHaveBeenCalledExactlyOnceWith(1);
    });

    it('rejects a wrong extension without posting and resets a previous preview when the file changes', async () => {
        await mount(); await choose('products.exe');
        expect(document.querySelector('[role="alert"]').textContent).toContain('JSON');
        expect(button('Preview products').disabled).toBe(true);
        expect(api.post).not.toHaveBeenCalled();
        api.post.mockResolvedValueOnce({ data: { data: { count: 1, currency: 'EGP', products: [{ name: 'Bag', price: 10, variants: 0, categories: [], warnings: [], is_active: false }] } } });
        await choose(); await click('Preview products');
        expect(button('Confirm import')).toBeDefined();
        await choose('different.json', '[{"name":"Other","price":20}]');
        expect(button('Confirm import')).toBeUndefined();
        expect(button('Preview products').disabled).toBe(false);
    });

    it('does not deliver a stale response after the dialog is unmounted during a store change', async () => {
        let finish;
        api.post.mockReturnValueOnce(new Promise((resolve) => { finish = resolve; }));
        const onImported = vi.fn(); await mount({ onImported }); await choose(); await click('Preview products');
        expect(button('Processing…').disabled).toBe(true);
        await act(async () => root.render(null));
        await act(async () => finish({ data: { data: { count: 1, currency: 'EGP', products: [] } } }));
        expect(onImported).not.toHaveBeenCalled();
        expect(document.querySelector('[role="dialog"]')).toBeNull();
    });
});
