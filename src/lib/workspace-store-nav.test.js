import { describe, it, expect } from 'vitest';
import { buildWorkspaceStoreNav, workspaceStoreItemActive } from '../components/store/workspaceStoreNav';
import { storeAccess } from './storeAccess';
import { merchantWorkspaceRouteAllowed } from './merchantWorkspaceRoutes';
const t = (_key, fallback) => fallback || _key;

describe('Store workspace navigation', () => {
    it('puts store orders, products and design first, with funnels as a direct link', () => {
        const groups = buildWorkspaceStoreNav(t, storeAccess(['Merchant'], ['products-list', 'categories-list']), ['products-list', 'categories-list']);
        expect(groups.slice(0, 4).map((group) => group.key)).toEqual(['orders', 'products', 'design', 'funnels']);
        expect(groups[0].items.map((item) => item.to)).toEqual(['/store/orders', '/store/blocked-phone-numbers', '/store/blocked-phones']);
        expect(groups[1].items[0].to).toBe('/store/products');
        expect(groups[1].items.map((item) => item.to)).toContain('/store/categories');
        expect(groups[3].to).toBe('/store/funnels');
        for (const row of groups.flatMap((group) => group.single ? [group] : group.items)) expect(merchantWorkspaceRouteAllowed(row.to)).toBe(true);
    });
    it('does not add store editing routes to an employee with analytics alone', () => {
        const permissions = ['store.analytics.view'];
        const groups = buildWorkspaceStoreNav(t, storeAccess(['Employee'], permissions), permissions);
        expect(groups.map((group) => group.key)).toEqual(['community']);
    });
    it('keeps sibling theme pages and business products from highlighting the wrong link', () => {
        const groups = buildWorkspaceStoreNav(t, storeAccess(['Merchant'], []));
        const products = groups.find((group) => group.key === 'products').items[0];
        expect(workspaceStoreItemActive(products, '/products')).toBe(false);
        expect(workspaceStoreItemActive(products, '/store/products/17/edit')).toBe(true);
        const themes = groups.find((group) => group.key === 'design').items.find((item) => item.key === 'themes');
        expect(workspaceStoreItemActive(themes, '/store/themes/marketplace')).toBe(false);
        expect(workspaceStoreItemActive(themes, '/store/themes')).toBe(true);
    });
});
