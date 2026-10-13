import {
    HiOutlineAdjustmentsHorizontal,
    HiOutlineBars3BottomLeft,
    HiOutlineChartBar,
    HiOutlineStar,
    HiOutlineCube,
    HiOutlineFunnel,
    HiOutlineCog6Tooth,
    HiOutlineCreditCard,
    HiOutlineDocumentText,
    HiOutlineBell,
    HiOutlineComputerDesktop,
    HiOutlineCommandLine,
    HiOutlineGlobeAlt,
    HiOutlineLanguage,
    HiOutlinePhoto,
    HiOutlineRocketLaunch,
    HiOutlineShoppingBag,
    HiOutlineSparkles,
    HiOutlineSquares2X2,
    HiOutlineSwatch,
    HiOutlineTicket,
    HiOutlineTruck,
    HiOutlineShieldCheck,
} from '../workspace/WorkspaceIcons';

/**
 * Pure navigation config for the store admin sidebar. Paths are relative to
 * `uiBase` (`/store` for owners, `/stores/:id` for admins). Each item carries
 * an `isActive(rel)` matcher over the path *relative to uiBase*, so sibling
 * routes (installed themes vs. marketplace, themes list vs. the customize
 * editor) highlight the right entry.
 */
const startsWith = (rel, prefix) => rel === prefix || rel.startsWith(`${prefix}/`);
// Legacy `/themes/:id/settings` links redirect into the full-screen editor, so they highlight "Customize".
const CUSTOMIZE_RE = /^\/themes\/[^/]+\/settings(\/|$)/;

export function buildStoreNav(t, access = {}) {
    const groups = [
        {
            key: 'store',
            label: t('store_nav_group_store', 'Store'),
            items: [
                { key: 'overview', to: 'overview', label: t('store_nav_overview', 'Overview'), Icon: HiOutlineSquares2X2, show: true },
                { key: 'orders', to: 'orders', label: t('store_nav_orders', 'Orders'), Icon: HiOutlineShoppingBag, show: access.canStoreOrders },
                { key: 'missed-orders', to: 'missed-orders', label: t('store_nav_missed_orders', 'Missed orders'), Icon: HiOutlineShoppingBag, show: access.canStoreOrders },
                { key: 'blocked-phone-numbers', to: 'blocked-phone-numbers', label: t('store_nav_blocked_phones', 'Blocked phones'), Icon: HiOutlineShoppingBag, show: access.canStoreOrders },
                { key: 'blocked-phones', to: 'blocked-phones', label: t('store_nav_blocked_otp_phones', 'Blocked OTP phones'), Icon: HiOutlineShoppingBag, show: access.canStoreOrders },
                { key: 'newsletter', to: 'newsletter', label: 'NewsLetter', Icon: HiOutlineDocumentText, show: access.canStoreOrders },
                { key: 'inventory', to: 'inventory', label: t('store_nav_inventory', 'Store inventory'), Icon: HiOutlineSquares2X2, show: access.canStoreInventory },
                { key: 'products', to: 'products', label: t('products', 'Products'), Icon: HiOutlineCube, show: access.canStoreProducts },
                { key: 'coupons', to: 'coupons', label: t('store_nav_coupons', 'Coupons'), Icon: HiOutlineTicket, show: access.canStoreCoupons },
                { key: 'reviews', to: 'reviews', label: t('store_nav_reviews', 'Reviews'), Icon: HiOutlineStar, show: access.canStoreReviews },
                { key: 'product-feed', to: 'product-feed', label: 'Product Feed', Icon: HiOutlineDocumentText, show: access.canStoreSettings },
                { key: 'google-merchant', to: 'google-merchant', label: 'Google Merchant', Icon: HiOutlineGlobeAlt, show: access.canStoreSettings },
                { key: 'utm-builder', to: 'utm-builder', label: t('store_nav_utm_builder', 'Track advertising campaigns'), Icon: HiOutlineGlobeAlt, show: access.canStoreSettings },
                { key: 'retargeting', to: 'retargeting', label: t('store_nav_retargeting', 'Retargeting'), Icon: HiOutlineGlobeAlt, show: access.canStoreSettings },
                { key: 'marketing-services', to: 'marketing-services', label: t('store_nav_marketing_services', 'Marketing services'), Icon: HiOutlineGlobeAlt, show: access.canStoreSettings },
                { key: 'create-referral-link', to: 'create-referral-link', label: t('store_nav_referral_builder', 'Create referral links'), Icon: HiOutlineGlobeAlt, show: access.canStoreSettings },
                { key: 'analytics', to: 'analytics', label: t('store_nav_analytics', 'Analytics'), Icon: HiOutlineChartBar, show: access.canStoreAnalytics },
            ],
        },
        {
            key: 'design',
            label: t('store_nav_group_design', 'Design'),
            items: [
                { key: 'funnels', to: 'funnels', label: t('store_nav_funnels', 'Sales funnels'), Icon: HiOutlineFunnel, show: access.canStorePages },
                {
                    key: 'themes',
                    to: 'themes',
                    label: t('store_nav_themes', 'Themes'),
                    Icon: HiOutlineSwatch,
                    show: access.canStoreThemes,
                    isActive: (rel) => startsWith(rel, '/themes') && !startsWith(rel, '/themes/marketplace') && !CUSTOMIZE_RE.test(rel),
                },
                { key: 'marketplace', to: 'themes/marketplace', label: t('store_nav_marketplace', 'Marketplace'), Icon: HiOutlineSparkles, show: access.canStoreThemes },
                {
                    key: 'customize',
                    to: 'customize',
                    label: t('store_nav_customize', 'Customize'),
                    Icon: HiOutlineAdjustmentsHorizontal,
                    show: access.canStoreThemes,
                    isActive: (rel) => startsWith(rel, '/customize') || CUSTOMIZE_RE.test(rel),
                },
                {
                    key: 'pages',
                    to: 'pages',
                    label: t('store_nav_pages', 'Pages'),
                    Icon: HiOutlineDocumentText,
                    show: access.canStorePages,
                    isActive: (rel) => startsWith(rel, '/pages') || startsWith(rel, '/content') || startsWith(rel, '/simple-pages'),
                },
                { key: 'checkout-fields', to: 'checkout-fields', label: t('store_nav_checkout_fields', 'Checkout form'), Icon: HiOutlineDocumentText, show: access.canStoreSettings },
                { key: 'thanks-edit', to: 'thanks-edit', label: t('store_nav_thank_you', 'Thank-you page'), Icon: HiOutlineDocumentText, show: access.canStoreSettings },
                { key: 'upload-assets', to: 'upload-assets', label: t('store_nav_design_assets', 'Design files'), Icon: HiOutlineDocumentText, show: access.canStoreThemes },
                { key: 'ui-blocks', to: 'ui-blocks', label: t('store_nav_ui_blocks', 'UI blocks'), Icon: HiOutlineDocumentText, show: access.canStorePages },
                { key: 'menus', to: 'menus', label: t('store_nav_menus', 'Menus'), Icon: HiOutlineBars3BottomLeft, show: access.canStoreMenus },
                { key: 'media', to: 'media', label: t('store_nav_media', 'Media'), Icon: HiOutlinePhoto, show: access.canStorePages || access.canStoreThemes },
            ],
        },
        {
            key: 'tracking',
            label: t('workspace_tracking_tools', 'Tracking tools'),
            items: [
                { key: 'pixels-settings', to: 'pixels-settings', label: t('store_nav_pixels', 'Pixel settings'), Icon: HiOutlineShieldCheck, show: access.canStoreSettings },
                { key: 'pixel-conversion', to: 'pixel-conversion', label: 'Conversion api', Icon: HiOutlineShieldCheck, show: access.canStoreSettings },
                { key: 'ga', to: 'ga', label: t('store_nav_google_tag', 'Connect Google tag'), Icon: HiOutlineGlobeAlt, show: access.canStoreSettings },
            ],
        },
        {
            key: 'settings',
            label: t('nav_store_settings', 'Store settings'),
            items: [
                { key: 'general', to: 'settings/general', label: t('store_nav_general', 'General'), Icon: HiOutlineCog6Tooth, show: access.canStoreSettings },
                { key: 'store-info', to: 'settings/store-info', label: t('store_nav_store_info', 'Store policies'), Icon: HiOutlineDocumentText, show: access.canStoreSettings },
                { key: 'head-code', to: 'settings/head-code', label: t('store_nav_head_code', 'Add head code'), Icon: HiOutlineCommandLine, show: access.canStoreHeadCode },
                { key: 'seo-settings', to: 'settings/seo', label: t('store_nav_seo_settings', 'SEO settings'), Icon: HiOutlineGlobeAlt, show: access.canStoreSettings },
                { key: 'social-links', to: 'settings/social-links', label: t('store_nav_social_links', 'Social links'), Icon: HiOutlineGlobeAlt, show: access.canStoreSettings },
                { key: 'order-push', to: 'settings/order-push', label: t('store_nav_order_push', 'Order notifications'), Icon: HiOutlineBell, show: access.isStoreOwner },
                { key: 'login-sessions', to: 'settings/login-sessions', label: t('store_nav_login_sessions', 'Login sessions'), Icon: HiOutlineComputerDesktop, show: access.isStoreOwner },
                { key: 'webhooks', to: 'settings/webhooks', label: 'Webhooks', Icon: HiOutlineCommandLine, show: access.canStoreWebhooks },
                { key: 'bot-protection', to: 'settings/bot-protection', label: t('store_nav_bot_protection', 'Bot protection'), Icon: HiOutlineCog6Tooth, show: access.canStoreSettings },
                { key: 'shopping-preferences', to: 'settings/shopping-preferences', label: t('store_nav_shopping_preferences', 'Shopping preferences'), Icon: HiOutlineCog6Tooth, show: access.canStoreSettings },
                { key: 'localization', to: 'settings/localization', label: t('store_nav_localization', 'Language & currency'), Icon: HiOutlineLanguage, show: access.canStoreSettings },
                { key: 'payments', to: 'settings/payments', label: t('store_nav_payments', 'Payment gateways'), Icon: HiOutlineCreditCard, show: access.canStorePayments },
                { key: 'shipping', to: 'settings/shipping', label: t('store_nav_shipping', 'Shipping & tax'), Icon: HiOutlineTruck, show: access.canStoreSettings },
                { key: 'digital-delivery', to: 'settings/digital-delivery', label: t('store_nav_digital_delivery', 'Digital delivery'), Icon: HiOutlineDocumentText, show: access.canStoreSettings },
                { key: 'order-limits', to: 'settings/order-limits', label: t('store_nav_order_limits', 'Order limits'), Icon: HiOutlineDocumentText, show: access.canStoreSettings },
                { key: 'phone-verification', to: 'settings/phone-verification', label: t('store_nav_phone_verification', 'Phone verification'), Icon: HiOutlineDocumentText, show: access.canStoreSettings },
                { key: 'domains', to: 'settings/domains', label: t('store_nav_domains', 'Domains'), Icon: HiOutlineGlobeAlt, show: access.canStoreSettings },
                { key: 'publish', to: 'settings/publish', label: t('store_nav_publish', 'Publish'), Icon: HiOutlineRocketLaunch, show: access.canStoreSettings },
            ],
        },
    ];

    return groups
        .map((group) => ({
            ...group,
            items: group.items
                .filter((item) => Boolean(item.show))
                .map((item) => ({
                    ...item,
                    isActive: item.isActive ?? ((rel) => startsWith(rel, `/${item.to}`)),
                })),
        }))
        .filter((group) => group.items.length > 0);
}

/** Path relative to uiBase ('' when on the base itself), e.g. '/settings/general'. */
export function relativeStorePath(pathname, uiBase) {
    if (pathname === uiBase) return '';
    return pathname.startsWith(`${uiBase}/`) ? pathname.slice(uiBase.length) : pathname;
}

/** The group holding the currently active item (falls back to the first group). */
export function findActiveGroup(groups, rel) {
    return groups.find((group) => group.items.some((item) => item.isActive(rel))) ?? groups[0] ?? null;
}
