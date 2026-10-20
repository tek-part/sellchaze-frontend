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
        expect(groups[1].items.map((item) => item.to).slice(-3)).toEqual(['/store/product-feed', '/store/apps/catalog', '/store/ab-tests']);
        expect(merchantWorkspaceRouteAllowed('/store/ab-tests')).toBe(true);
        expect(groups[3].to).toBe('/store/funnels');
        expect(groups.slice(3, 6).map((group) => group.key)).toEqual(['funnels', 'tracking', 'marketing']);
        expect(groups[4].items.map((item) => item.to)).toEqual(['/store/pixels-settings', '/store/pixel-conversion', '/store/ga']);
        expect(groups[5].items.map((item) => item.to)).toEqual(['/store/apps/cross-selling', '/store/coupons', '/store/retargeting', '/store/apps/whatsapp-unofficial', '/store/apps/top-media-buyer', '/store/utm-builder', '/store/google-merchant', '/store/apps/social-proof', '/store/create-referral-link', '/store/settings/order-limits', '/store/downsell']);
        expect(groups.find((group) => group.key === 'wallet').items.map((row) => row.to)).toEqual(['/top-up', '/transactions']);
        expect(groups.filter((group) => group.section === 'other').map((group) => group.to)).toEqual(['/services', '/store/marketing-services', '/referral', '/store/settings/general']);
        expect(groups.flatMap(group => group.items ?? [group]).filter(item => item.badge).map(item => item.key)).toEqual([]);
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
    it('highlights an app under its product or marketing group without selecting Apps twice', () => {
        const groups = buildWorkspaceStoreNav(t, storeAccess(['Merchant'], []));
        const apps = groups.find(group => group.key === 'apps');
        const cross = groups.find(group => group.key === 'marketing').items.find(item => item.key === 'cross-selling');
        expect(workspaceStoreItemActive(cross, '/store/apps/cross-selling')).toBe(true);
        expect(workspaceStoreItemActive(apps, '/store/apps/cross-selling')).toBe(false);
        expect(workspaceStoreItemActive(apps, '/store/apps/pixels')).toBe(true);
        expect(workspaceStoreItemActive(apps, '/store/apps')).toBe(true);
    });
    it('does not expose app configuration links to an employee who can only manage products', () => {
        const permissions = ['store.products.manage'];
        const groups = buildWorkspaceStoreNav(t, storeAccess(['Employee'], permissions), permissions);
        expect(groups.flatMap(group => group.items ?? [group]).filter(item => item.to.startsWith('/store/apps'))).toEqual([]);
    });
});
