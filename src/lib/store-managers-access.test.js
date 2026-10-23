import { describe, expect, it } from 'vitest';
import { fullStoreAccess, storeAccess, storeUiPermissions } from './storeAccess';
import { buildStoreNav } from '../components/store/storeNav';
import { buildWorkspaceStoreNav } from '../components/store/workspaceStoreNav';

const t = (_key, fallback) => fallback;
const settings = (access) => buildStoreNav(t, access).find(group => group.key === 'settings')?.items ?? [];

describe('Store manager navigation and catalog controls', () => {
    it('exposes account administration only to store owners, never through a settings grant', () => {
        for (const role of ['Merchant']) expect(settings(storeAccess([role])).some(item => item.key === 'managers')).toBe(true);
        for (const access of [storeAccess(['StoreManager'], ['store.view', 'store.settings.manage']), storeAccess(['Employee'], ['store.settings.manage']), fullStoreAccess()]) {
            expect(access.canStoreManagers).toBe(false);
            expect(settings(access).some(item => item.key === 'managers')).toBe(false);
        }
    });
    it('maps a store product grant to complete controls only within a store layout', () => {
        const account = ['store.view', 'store.products.manage'];
        const ui = storeUiPermissions(account, ['StoreManager']);
        expect(account).toEqual(['store.view', 'store.products.manage']);
        expect(ui).toEqual(expect.arrayContaining(['products-list', 'products-create', 'products-edit', 'products-delete', 'categories-list']));
        expect(storeAccess(['StoreManager'], account).canStoreInventory).toBe(true);
        expect(ui).not.toContain('categories-edit');
        expect(ui).not.toContain('stores-edit');
        expect(ui).not.toContain('users-edit');
    });
    it('does not reveal category management merely because products use category choices', () => {
        const permissions = ['store.view', 'store.products.manage'];
        const nav = buildWorkspaceStoreNav(t, storeAccess(['StoreManager'], permissions), permissions);
        expect(nav.find(group => group.key === 'products').items.some(item => item.key === 'categories')).toBe(false);
        const categories = ['store.view', 'store.categories.manage'];
        const categoryNav = buildWorkspaceStoreNav(t, storeAccess(['StoreManager'], categories), categories);
        expect(categoryNav.find(group => group.key === 'products').items.some(item => item.key === 'categories')).toBe(true);
        expect(storeUiPermissions(categories, ['StoreManager'])).toContain('categories-edit');
        expect(storeUiPermissions(categories, ['StoreManager'])).not.toContain('products-edit');
    });
    it('keeps theme navigation editing within the theme grant', () => {
        expect(storeAccess(['StoreManager'], ['store.themes.manage']).canStoreMenus).toBe(true);
        expect(storeUiPermissions(['store.themes.manage'], ['StoreManager'])).toContain('store.menus.manage');
        expect(storeUiPermissions(['store.pages.manage'], ['StoreManager'])).not.toContain('store.menus.manage');
    });
    it('keeps legacy permissions and does not manufacture controls for a view-only account', () => {
        expect(storeUiPermissions(['products-list'])).toEqual(['products-list']);
        for (const role of ['Merchant', 'Employee']) expect(storeUiPermissions(['store.products.manage'], [role])).toEqual(['store.products.manage']);
        expect(storeUiPermissions(['store.view'])).toEqual(['store.view']);
        expect(storeUiPermissions([])).toEqual([]);
    });
});
