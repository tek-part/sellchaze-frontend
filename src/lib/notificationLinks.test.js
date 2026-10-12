import { describe, expect, it } from 'vitest';
import { notificationDestination } from '../utils/notificationLinks';

describe('notification destinations', () => {
    const origin = 'https://sellchaze.com';
    it('opens store and community events and retains query/anchor', () => {
        expect(notificationDestination('/store/orders/42?tab=timeline#status', origin)).toBe('/store/orders/42?tab=timeline#status');
        expect(notificationDestination('https://sellchaze.com/community/posts/8', origin)).toBe('/community/posts/8');
        expect(notificationDestination('/store/settings/domains', origin)).toBe('/store/settings/domains');
    });
    it('rejects removed routes, external destinations and executable URLs', () => {
        for (const path of ['/inventory', '/orders/42', '//other.test/path', 'https://sellchaze.com.evil.test/store/orders', 'javascript:alert(1)', 'data:text/html,x', 'https://user@ sellchaze.com/store/orders', '/store/orders-fake']) expect(notificationDestination(path, origin)).toBeNull();
        expect(notificationDestination('/admin/users', origin, false)).toBe('/admin/users');
    });
});
