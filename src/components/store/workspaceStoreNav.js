import { buildStoreNav } from './storeNav';
import { HiOutlineShoppingBag, HiOutlineCube, HiOutlinePencilSquare, HiOutlineFunnel, HiOutlineTicket, HiOutlineChartBar, HiOutlineBuildingStorefront, HiOutlineCog6Tooth } from '../workspace/WorkspaceIcons';

/** Merchant navigation follows the shopping workflow, using existing authorized routes. */
export function buildWorkspaceStoreNav(t, access, permissions = []) {
    const groups = buildStoreNav(t, access);
    const items = groups.flatMap((group) => group.items);
    const item = (key) => items.find((row) => row.key === key);
    const absolute = (row) => row ? { ...row, to: `/store/${row.to}`, label: row.key === 'products' ? t('workspace_all_products', 'All products') : row.key === 'orders' ? t('workspace_all_orders', 'All orders') : row.label } : null;
    const route = (key, to, label, Icon, show) => show ? { key, to, label, Icon } : null;
    const can = (permission) => permissions.includes(permission);
    const group = (key, label, Icon, rows) => ({ key, label, Icon, items: rows.filter(Boolean) });
    const settingsItems = groups.find((row) => row.key === 'settings')?.items.map(absolute) ?? [];
    return [
        group('orders', t('orders', 'Orders'), HiOutlineShoppingBag, ['orders', 'blocked-phone-numbers', 'blocked-phones'].map((key) => absolute(item(key)))),
        group('products', t('products', 'Products'), HiOutlineCube, [
            absolute(item('products')),
            route('categories', '/categories', t('categories', 'Categories'), HiOutlineCube, can('categories-list')),
            absolute(item('reviews')),
            absolute(item('inventory')),
            route('bundles', '/bundles', t('bundles', 'Bundles'), HiOutlineCube, can('bundles-list')),
            route('attributes', '/attributes', t('attributes_nav_definitions', 'Attributes'), HiOutlineCube, can('attributes-list')),
            route('attribute-groups', '/attributes/groups', t('attributes_nav_groups', 'Attribute groups'), HiOutlineCube, can('attributes-list')),
        ]),
        group('design', t('workspace_store_design', 'Store design'), HiOutlinePencilSquare,
            ['themes', 'customize', 'pages', 'checkout-fields', 'thanks-edit', 'ui-blocks', 'upload-assets', 'marketplace', 'menus', 'media'].map((key) => absolute(item(key)))),
        { key: 'funnels', ...absolute(item('funnels')), Icon: HiOutlineFunnel, single: true },
        group('marketing', t('workspace_marketing_tools', 'Marketing tools'), HiOutlineTicket, [absolute(item('coupons'))]),
        { key: 'analytics', ...absolute(item('analytics')), Icon: HiOutlineChartBar, single: true },
        { key: 'overview', ...absolute(item('overview')), Icon: HiOutlineBuildingStorefront, single: true },
        { ...group('settings', t('nav_store_settings', 'Store settings'), HiOutlineCog6Tooth, settingsItems), single: true, to: settingsItems[0]?.to },
    ].filter((row) => row.single ? Boolean(row.to) : row.items.length > 0);
}

export function workspaceStoreItemActive(item, pathname) {
    if (item.to.startsWith('/store/') && !pathname.startsWith('/store/')) return false;
    if (item.isActive) return item.isActive(pathname.startsWith('/store') ? pathname.slice(6) : pathname);
    return pathname === item.to || pathname.startsWith(`${item.to}/`);
}
