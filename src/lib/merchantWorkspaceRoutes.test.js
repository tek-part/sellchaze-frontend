import { describe, expect, it } from 'vitest';
import { merchantWorkspaceRouteAllowed } from './merchantWorkspaceRoutes';

describe('Merchant route scope', () => {
    it('keeps reference store pages and the community exception, including nested routes', () => {
        for (const path of ['/dashboard', '/store/pixels-settings', '/store/pixel-conversion', '/store/ga', '/store/inventory', '/store/products/8/edit', '/store/orders/42', '/store/categories/2/edit', '/store/themes/naseem/customize', '/store/settings/phone-verification', '/community/post/123', '/community/groups/7', '/reels', '/feed']) expect(merchantWorkspaceRouteAllowed(path)).toBe(true);
    });
    it('does not let legacy permissions or matching prefixes expose extra sections', () => {
        for (const path of ['/products', '/categories', '/inventory/transfers', '/store/analytics', '/store/overview', '/orders', '/quotations', '/deals', '/employees', '/suppliers', '/wavex/chats', '/store/media', '/store/menus', '/community-other', '/store/products-copy']) expect(merchantWorkspaceRouteAllowed(path)).toBe(false);
    });
});
