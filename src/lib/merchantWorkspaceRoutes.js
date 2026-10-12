// Merchant workspace follows the reference app. Community is the requested exception.
// The platform operator console lives outside this merchant route boundary.
const roots = [
    '/dashboard', '/community', '/reels', '/feed', '/chat', '/notifications', '/settings/profile', '/subscription',
    '/store/products', '/store/categories', '/store/reviews', '/store/funnels', '/store/coupons',
    '/store/orders',
    '/store/themes', '/store/customize', '/store/pages', '/store/settings', '/store/checkout-fields',
    '/store/thanks-edit', '/store/ui-blocks', '/store/upload-assets', '/store/blocked-phone-numbers', '/store/blocked-phones',
];

export function merchantWorkspaceRouteAllowed(pathname) {
    return roots.some((root) => pathname === root || pathname.startsWith(`${root}/`));
}
