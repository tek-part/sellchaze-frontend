import { describe, expect, it } from 'vitest';
import { storeAccess, fullStoreAccess } from './storeAccess';

describe('executable store code access', () => {
    it('allows owners and the global store administration scope', () => {
        expect(storeAccess(['Merchant']).canStoreHeadCode).toBe(true);
        expect(fullStoreAccess().canStoreHeadCode).toBe(true);
    });
    it('does not expose script editing through a general employee settings grant', () => {
        const staff = storeAccess(['Employee'], ['store.settings.manage']);
        expect(staff.canStoreSettings).toBe(true);
        expect(staff.canStoreHeadCode).toBe(false);
    });
});
