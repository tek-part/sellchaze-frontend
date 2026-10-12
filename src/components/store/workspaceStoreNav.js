import { buildStoreNav } from './storeNav';
import { HiOutlineCube, HiOutlineUserGroup, HiOutlineCog6Tooth } from '../workspace/WorkspaceIcons';
import { OrdersIcon, ProductsIcon, DesignIcon, TrackingIcon, MarketingIcon, FunnelsIcon } from '../workspace/SidebarReferenceIcons';

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
        group('orders', t('orders', 'Orders'), OrdersIcon, ['orders', 'missed-orders', 'blocked-phone-numbers', 'blocked-phones', 'newsletter'].map((key) => absolute(item(key)))),
        group('products', t('products', 'Products'), ProductsIcon, [
            absolute(item('products')),
            route('categories', '/store/categories', t('categories', 'Categories'), HiOutlineCube, can('categories-list')),
            absolute(item('reviews')),
            absolute(item('product-feed')),
        ]),
        group('design', t('workspace_store_design', 'Store design'), DesignIcon,
            ['themes', 'customize', 'pages', 'checkout-fields', 'thanks-edit', 'ui-blocks', 'upload-assets'].map((key) => absolute(item(key)))),
        { key: 'funnels', ...absolute(item('funnels')), Icon: FunnelsIcon, single: true },
        group('tracking', t('workspace_tracking_tools', 'Tracking tools'), TrackingIcon,
            ['pixels-settings', 'pixel-conversion', 'ga'].map((key) => absolute(item(key)))),
        group('marketing', t('workspace_marketing_tools', 'Marketing tools'), MarketingIcon, [absolute(item('coupons')), absolute(item('utm-builder')), absolute(item('google-merchant')), absolute(item('create-referral-link'))]),
        { key: 'community', label: t('feed_title', 'Community'), to: '/community', Icon: HiOutlineUserGroup, single: true },
        { ...group('settings', t('nav_store_settings', 'Store settings'), HiOutlineCog6Tooth, settingsItems), single: true, to: settingsItems[0]?.to },
    ].filter((row) => row.single ? Boolean(row.to) : row.items.length > 0);
}

export function workspaceStoreItemActive(item, pathname) {
    if (item.to.startsWith('/store/') && !pathname.startsWith('/store/')) return false;
    if (item.isActive) return item.isActive(pathname.startsWith('/store') ? pathname.slice(6) : pathname);
    return pathname === item.to || pathname.startsWith(`${item.to}/`);
}
