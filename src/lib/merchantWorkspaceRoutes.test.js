import { describe, expect, it } from 'vitest';
import { merchantWorkspaceRouteAllowed } from './merchantWorkspaceRoutes';

describe('Merchant route scope', () => {
    it('allows the merchant plans separately from community posting subscriptions', () => {
        expect(merchantWorkspaceRouteAllowed('/subscriptions')).toBe(true);
        expect(merchantWorkspaceRouteAllowed('/subscription')).toBe(true);
        expect(merchantWorkspaceRouteAllowed('/subscriptions-other')).toBe(false);
    });
    it('keeps reference store pages and the community exception, including nested routes', () => {
        for (const path of ['/dashboard', '/store/pixels-settings', '/store/pixel-conversion', '/store/ga', '/store/inventory', '/store/products/8/edit', '/store/orders/42', '/store/customers/view', '/store/categories/2/edit', '/store/themes/naseem/customize', '/store/settings/phone-verification', '/store/articles', '/store/articles/new', '/store/articles/12', '/store/gift-cards', '/store/gift-cards/5', '/community/post/123', '/community/groups/7', '/reels', '/feed', '/store/collections', '/store/collections/new', '/store/collections/5', '/store/draft-orders', '/store/draft-orders/new', '/store/draft-orders/7', '/store/returns']) expect(merchantWorkspaceRouteAllowed(path)).toBe(true);
    });
    it('does not let legacy permissions or matching prefixes expose extra sections', () => {
        for (const path of ['/products', '/categories', '/inventory/transfers', '/store/analytics', '/store/overview', '/orders', '/quotations', '/deals', '/employees', '/suppliers', '/wavex/chats', '/store/media', '/store/menus', '/community-other', '/store/products-copy', '/collections', '/store/collections-copy', '/store/draft-orders-old', '/store/returns-old', '/returns', '/store/gift-cards-copy']) expect(merchantWorkspaceRouteAllowed(path)).toBe(false);
    });
});
