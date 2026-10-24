import { buildStoreNav } from './storeNav';
import { HiOutlineCube, HiOutlineUserGroup, HiOutlineCog6Tooth, HiOutlineQuestionMarkCircle } from '../workspace/WorkspaceIcons';
import { OrdersIcon, ProductsIcon, DesignIcon, TrackingIcon, MarketingIcon, FunnelsIcon, MarketingServicesIcon, WalletReferenceIcon, AffiliateReferenceIcon, ServiceMarketplaceIcon, AppsReferenceIcon } from '../workspace/SidebarReferenceIcons';

const SIDEBAR_APP_KEYS = new Set(['catalog', 'cross-selling', 'whatsapp-unofficial', 'top-media-buyer', 'social-proof']);

/** Merchant navigation follows the shopping workflow, using existing authorized routes. */
export function buildWorkspaceStoreNav(t, access, permissions = []) {
    const groups = buildStoreNav(t, access);
    const items = groups.flatMap((group) => group.items);
    const item = (key) => items.find((row) => row.key === key);
    const menuLabels = {
        products: t('workspace_all_products', 'All products'),
        orders: t('workspace_all_orders', 'All orders'),
        themes: t('workspace_menu_themes', 'Themes'),
        customize: t('workspace_menu_homepage', 'Edit homepage'),
        'thanks-edit': t('workspace_menu_thank_you', 'Edit thank-you page'),
        'ui-blocks': 'UI Blocks',
        'upload-assets': t('workspace_menu_upload_designs', 'Upload design files'),
    };
    const absolute = (row) => row ? { ...row, to: `/store/${row.to}`, label: menuLabels[row.key] ?? row.label } : null;
    const route = (key, to, label, Icon, show) => show ? { key, to, label, Icon } : null;
    const app = (key, label) => route(key, `/store/apps/${key}`, label, HiOutlineCog6Tooth, access.canStoreSettings);
    const can = (permission) => permissions.includes(permission);
    const group = (key, label, Icon, rows) => ({ key, label, Icon, items: rows.filter(Boolean) });
    const settingsItems = groups.find((row) => row.key === 'settings')?.items.map(absolute) ?? [];
    return [
        group('orders', t('orders', 'Orders'), OrdersIcon, ['orders', 'customers', 'missed-orders', 'blocked-phone-numbers', 'blocked-phones', 'newsletter'].map((key) => absolute(item(key)))),
        group('products', t('products', 'Products'), ProductsIcon, [
            absolute(item('products')),
            route('categories', '/store/categories', t('categories', 'Categories'), HiOutlineCube, access.canStoreCategories || can('categories-list')),
            absolute(item('reviews')),
            absolute(item('product-feed')),
            app('catalog', 'Easy Catalog'),
            absolute(item('ab-tests')),
        ]),
        group('design', t('workspace_store_design', 'Store design'), DesignIcon,
            ['themes', 'customize', 'pages', 'checkout-fields', 'thanks-edit', 'ui-blocks', 'upload-assets'].map((key) => absolute(item(key)))),
        { key: 'funnels', ...absolute(item('funnels')), label: 'Funnels', Icon: FunnelsIcon, single: true },
        group('tracking', t('workspace_tracking_tools', 'Tracking tools'), TrackingIcon,
            ['pixels-settings', 'pixel-conversion', 'ga'].map((key) => absolute(item(key)))),
        group('marketing', t('workspace_marketing_tools', 'Marketing tools'), MarketingIcon, [
            app('cross-selling', 'CROSS SELLING'),
            ...['coupons', 'retargeting'].map((key) => absolute(item(key))),
            app('whatsapp-unofficial', 'Whatsapp Marketing'),
            app('top-media-buyer', t('workspace_top_mb', 'Verify orders with Top MB')),
            ...['utm-builder', 'google-merchant'].map((key) => absolute(item(key))),
            app('social-proof', 'Sales Popup'),
            absolute(item('create-referral-link')),
            route('minimum-order', '/store/settings/order-limits', t('workspace_minimum_order', 'Minimum order and free shipping'), HiOutlineCog6Tooth, access.canStoreSettings),
            route('downsell', '/store/downsell', 'Downsell', HiOutlineCog6Tooth, access.canStoreSettings && access.canStoreCoupons),
        ]),
        group('wallet', t('platform_wallet_nav', 'Your wallet'), WalletReferenceIcon, [route('top-up', '/top-up', t('platform_wallet_balance', 'Your balance'), WalletReferenceIcon, access.isStoreOwner), route('transactions', '/transactions', t('platform_wallet_transactions', 'Transactions'), WalletReferenceIcon, access.isStoreOwner)]),
        { ...route('apps', '/store/apps', t('workspace_apps', 'Apps'), AppsReferenceIcon, access.canStoreSettings), single: true,
            isActive: (rel) => rel === '/apps' || (rel.startsWith('/apps/') && !SIDEBAR_APP_KEYS.has(rel.split('/')[2])) },
        { key: 'community', label: t('feed_title', 'Community'), to: '/community', Icon: HiOutlineUserGroup, single: true },
        { ...route('service-marketplace', '/services', t('service_marketplace_nav', 'Service marketplace'), ServiceMarketplaceIcon, access.isStoreOwner), single: true, section: 'other' },
        { ...absolute(item('marketing-services')), Icon: MarketingServicesIcon, single: true, section: 'other' },
        { ...route('platform-referral', '/referral', t('platform_referral_nav', 'Affiliate program'), AffiliateReferenceIcon, access.isStoreOwner), single: true, section: 'other' },
        { ...route('support', '/support', t('nav_support', 'Support'), HiOutlineQuestionMarkCircle, access.isStoreOwner), single: true, section: 'other' },
        { ...group('settings', t('workspace_menu_settings', 'Settings'), HiOutlineCog6Tooth, settingsItems), single: true, section: 'other', to: settingsItems[0]?.to },
    ].filter((row) => row.single ? Boolean(row.to) : row.items.length > 0);
}

export function workspaceStoreItemActive(item, pathname) {
    if (item.to.startsWith('/store/') && !pathname.startsWith('/store/')) return false;
    if (item.isActive) return item.isActive(pathname.startsWith('/store') ? pathname.slice(6) : pathname);
    return pathname === item.to || pathname.startsWith(`${item.to}/`);
}
