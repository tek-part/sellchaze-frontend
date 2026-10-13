import { describe, expect, it } from 'vitest';
import { fullStoreAccess, storeAccess } from './storeAccess';
import { buildStoreNav } from '../components/store/storeNav';
const t = (_key, fallback) => fallback;
describe('private store webhook configuration', () => {
    it('is visible to owners and global store administration', () => {
        for (const access of [storeAccess(['Merchant']), storeAccess(['Supplier']), fullStoreAccess()]) {
            expect(access.canStoreWebhooks).toBe(true);
            expect(buildStoreNav(t, access).find(group => group.key === 'settings').items.some(item => item.key === 'webhooks')).toBe(true);
        }
    });
    it('does not expose order export destinations through a general employee settings grant', () => {
        const access = storeAccess(['Employee'], ['store.settings.manage', 'store.orders.manage']);
        expect(access.canStoreSettings).toBe(true);
        expect(access.canStoreWebhooks).toBe(false);
        expect(buildStoreNav(t, access).find(group => group.key === 'settings').items.some(item => item.key === 'webhooks')).toBe(false);
    });
});
