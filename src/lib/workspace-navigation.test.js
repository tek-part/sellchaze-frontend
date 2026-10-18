import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import SidebarNav from '../components/SidebarNav';
import { collectCompactNavigation, normalizeNavigationText } from '../components/workspace/NavigationResults';
import { NavLink } from 'react-router-dom';

const i18n = createInstance();
await i18n.init({ lng: 'en', initImmediate: false, resources: { en: { translation: {} } } });
function links(props) {
    const html = renderToStaticMarkup(React.createElement(I18nextProvider, { i18n }, React.createElement(MemoryRouter, null, React.createElement(SidebarNav, { search: true, ...props }))));
    return [...html.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);
}
describe('Workspace search uses the authorized sidebar', () => {
    it('does not expose store management or admin routes to a customer', () => {
        const routes = links({ roles: ['Customer'], permissions: [] });
        expect(routes).not.toContain('/store/analytics');
        expect(routes).not.toContain('/store/products');
        expect(routes).not.toContain('/admin/users');
        expect(routes).not.toContain('/products');
    });
    it('includes closed store groups for an owner', () => {
        const routes = links({ roles: ['Merchant'], permissions: [] });
        expect(routes).not.toContain('/store/analytics');
        expect(routes).toContain('/community');
        expect(routes).toContain('/store/orders');
        expect(routes).toContain('/store/settings/general');
        expect(routes).not.toContain('/admin/users');
    });
    it('retains granular employee permission filtering', () => {
        const routes = links({ roles: ['Employee'], permissions: ['store.analytics.view'] });
        expect(routes).not.toContain('/store/analytics');
        expect(routes).toContain('/community');
        expect(routes).not.toContain('/store/orders');
        expect(routes).not.toContain('/store/settings/general');
    });
    it('finds a route inside a closed group without exposing unrelated routes', () => {
        const routes = links({ roles: ['Merchant'], permissions: [], query: 'all orders' });
        expect(routes).toEqual(['/store/orders']);
    });
    it('searches secondary store settings while respecting employee access', () => {
        expect(links({ roles: ['Merchant'], permissions: [], query: 'phone verification' })).toEqual(['/store/settings/phone-verification']);
        expect(links({ roles: ['Employee'], permissions: ['store.analytics.view'], query: 'phone verification' })).toEqual([]);
    });
    it('normalizes Arabic diacritics and hamza for navigation search', () => {
        expect(normalizeNavigationText('إِحْصَاءات')).toBe(normalizeNavigationText('احصاءات'));
        expect(normalizeNavigationText('Orders')).toBe('orders');
    });
    it('removes non-reference business sections from merchant search even with legacy grants', () => {
        const routes = links({ roles: ['Merchant'], permissions: ['products-list', 'categories-list', 'stores-list'] });
        expect(routes).toContain('/store/products');
        expect(routes).not.toContain('/products');
        expect(routes).not.toContain('/inventory/transfers');
        expect(routes).not.toContain('/stores');
        expect(routes).not.toContain('/categories');
        expect(routes).toContain('/store/categories');
        expect(routes).toContain('/community');
    });
    it('keeps independent group identities even when two sections have the same title', () => {
        const Icon = () => React.createElement('svg');
        const Group = () => null;
        const rows = collectCompactNavigation([
            React.createElement(Group, { key: 'store', title: 'Orders', groupKey: 'store-orders', icon: Icon }),
            React.createElement(Group, { key: 'business', title: 'Orders', groupKey: 'business-orders', icon: Icon }),
        ]);
        expect(rows.map(({ groupKey }) => groupKey)).toEqual(['store-orders', 'business-orders']);
    });
    it('keeps compact links permission-filtered and named for assistive technology', () => {
        const routes = links({ compact: true, roles: ['Customer'], permissions: [] });
        expect(routes).toContain('/community');
        expect(routes).not.toContain('/products');
        expect(routes).not.toContain('/admin/users');
        expect(routes).not.toContain('/store/analytics');
    });
    it('represents each compact group once without exposing its closed children', () => {
        const Icon = () => React.createElement('svg');
        const Group = () => null;
        const rows = collectCompactNavigation(React.createElement('nav', null,
            React.createElement(NavLink, { to: '/dashboard' }, React.createElement(Icon), 'Dashboard'),
            React.createElement(Group, { title: 'Store settings', icon: Icon }, React.createElement(NavLink, { to: '/store/settings/general' }, 'General'))));
        expect(rows.map(({ label }) => label)).toEqual(['Dashboard', 'Store settings']);
        expect(rows[0].element.props.to).toBe('/dashboard');
        expect(rows[1].Icon).toBe(Icon);
    });
    it('retains the current group in compact navigation without marking every group active', () => {
        const html = renderToStaticMarkup(React.createElement(I18nextProvider, { i18n }, React.createElement(MemoryRouter, { initialEntries: ['/store/products/30/edit'] }, React.createElement(SidebarNav, { roles: ['Merchant'], permissions: [], compact: true }))));
        expect(html).toMatch(/aria-label="Products" aria-current="location"/);
        expect(html.match(/aria-current="location"/g)).toHaveLength(1);
        expect(html).not.toMatch(/aria-label="Orders" aria-current=/);
    });
});
