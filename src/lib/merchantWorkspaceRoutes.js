// Merchant workspace follows the reference app. Community is the requested exception.
// The platform operator console lives outside this merchant route boundary.
const roots = [
    '/dashboard', '/community', '/reels', '/feed', '/chat', '/notifications', '/settings/profile', '/subscription', '/subscriptions', '/top-up', '/transactions', '/referral', '/services', '/support',
    '/store/products', '/store/categories', '/store/collections', '/store/reviews', '/store/funnels', '/store/coupons', '/store/apps', '/store/sheets', '/store/downsell',
    '/store/orders', '/store/customers', '/store/missed-orders', '/store/newsletter', '/store/ab-tests', '/store/draft-orders',
    '/store/pixels-settings', '/store/pixel-conversion', '/store/ga', '/store/inventory',
    '/store/product-feed', '/store/google-merchant', '/store/utm-builder', '/store/create-referral-link', '/store/retargeting', '/store/marketing-services',
    '/store/themes', '/store/customize', '/store/pages', '/store/articles', '/store/settings', '/store/checkout-fields',
    '/store/thanks-edit', '/store/ui-blocks', '/store/upload-assets', '/store/blocked-phone-numbers', '/store/blocked-phones',
];

export function merchantWorkspaceRouteAllowed(pathname) {
    return roots.some((root) => pathname === root || pathname.startsWith(`${root}/`));
}
