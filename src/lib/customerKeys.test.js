import { describe, expect, it } from 'vitest';
import { customerHref, mergeTags, readCustomerKey } from './customerKeys';

describe('customer keys', () => {
    it('round-trips phone, email and order keys through the query string', () => {
        for (const key of ['+201001112222', 'omar+news@example.test', 'order:42']) {
            const url = new URL(customerHref('/store', key), 'http://local.test');
            expect(url.pathname).toBe('/store/customers/view');
            expect(readCustomerKey(url.searchParams.get('key'))).toBe(key);
        }
    });
    it('restores a plus that was typed unencoded', () => {
        expect(readCustomerKey(new URLSearchParams('key=+201001112222').get('key'))).toBe('+201001112222');
        expect(readCustomerKey(null)).toBe('');
    });
    it('merges comma lists without case-insensitive duplicates', () => {
        expect(mergeTags(['VIP'], ' vip,  late   payer , ,Cairo')).toEqual(['VIP', 'late payer', 'Cairo']);
    });
});
