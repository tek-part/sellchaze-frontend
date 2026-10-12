import { describe, it, expect } from 'vitest';
import { buildWorkspaceStoreNav, workspaceStoreItemActive } from '../components/store/workspaceStoreNav';
import { storeAccess } from './storeAccess';
import { merchantWorkspaceRouteAllowed } from './merchantWorkspaceRoutes';
const t = (_key, fallback) => fallback || _key;

describe('Store workspace navigation', () => {
    it('puts store orders, products and design first, with funnels as a direct link', () => {
        const groups = buildWorkspaceStoreNav(t, storeAccess(['Merchant'], ['products-list', 'categories-list']), ['products-list', 'categories-list']);
        expect(groups.slice(0, 4).map((group) => group.key)).toEqual(['orders', 'products', 'design', 'funnels']);
        expect(groups[0].items.map((item) => item.to)).toEqual(['/store/orders', '/store/missed-orders', '/store/blocked-phone-numbers', '/store/blocked-phones', '/store/newsletter']);
        expect(groups[1].items[0].to).toBe('/store/products');
        expect(groups[1].items.map((item) => item.to)).toContain('/store/categories');
        expect(groups[1].items.at(-1).to).toBe('/store/product-feed');
        expect(groups[3].to).toBe('/store/funnels');
        expect(groups.slice(3, 6).map((group) => group.key)).toEqual(['funnels', 'tracking', 'marketing']);
        expect(groups[4].items.map((item) => item.to)).toEqual(['/store/pixels-settings', '/store/pixel-conversion', '/store/ga']);
        expect(groups[5].items.map((item) => item.to)).toEqual(['/store/coupons', '/store/retargeting', '/store/utm-builder', '/store/google-merchant', '/store/create-referral-link']);
        expect(groups.filter((group) => group.section === 'other').map((group) => group.to)).toEqual(['/store/marketing-services', '/store/settings/general']);
        for (const row of groups.flatMap((group) => group.single ? [group] : group.items)) expect(merchantWorkspaceRouteAllowed(row.to)).toBe(true);
        expect(merchantWorkspaceRouteAllowed('/store/inventory')).toBe(true);
        expect(merchantWorkspaceRouteAllowed('/admin/settings')).toBe(false);
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
