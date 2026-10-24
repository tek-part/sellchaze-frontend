import { describe, expect, it } from 'vitest';
import { clientIndexRows } from './clientIndexRows';

const rows = [
    { id: 1, name: 'Beta', email: 'b@x.io', active: true, count: 10 },
    { id: 2, name: 'alpha', email: 'a@x.io', active: false, count: 2 },
    { id: 3, name: 'Gamma', email: 'g@y.io', active: true, count: null },
];
const state = (patch = {}) => ({ search: '', sort: null, page: 1, perPage: 25, filters: {}, ...patch });
const config = {
    search: [(row) => row.name, (row) => row.email],
    filters: { status: (row, value) => (value === 'active' ? row.active : !row.active) },
    sorts: { name: (row) => row.name, count: (row) => row.count },
};

describe('clientIndexRows', () => {
    it('searches the configured fields case-insensitively', () => {
        expect(clientIndexRows(rows, state({ search: ' X.IO ' }), config).rows.map((row) => row.id)).toEqual([1, 2]);
        expect(clientIndexRows(rows, state({ search: 'gam' }), config).rows.map((row) => row.id)).toEqual([3]);
    });

    it('applies filters and ignores unknown filter keys', () => {
        expect(clientIndexRows(rows, state({ filters: { status: 'active', other: 'x' } }), config).rows.map((row) => row.id)).toEqual([1, 3]);
    });

    it('sorts strings naturally and keeps empty values last in both directions', () => {
        expect(clientIndexRows(rows, state({ sort: { by: 'name', direction: 'asc' } }), config).rows.map((row) => row.id)).toEqual([2, 1, 3]);
        expect(clientIndexRows(rows, state({ sort: { by: 'count', direction: 'asc' } }), config).rows.map((row) => row.id)).toEqual([2, 1, 3]);
        expect(clientIndexRows(rows, state({ sort: { by: 'count', direction: 'desc' } }), config).rows.map((row) => row.id)).toEqual([1, 2, 3]);
    });

    it('paginates and clamps the page to the last one', () => {
        const result = clientIndexRows(rows, state({ perPage: 2, page: 9 }), config);
        expect(result.rows.map((row) => row.id)).toEqual([3]);
        expect(result.meta).toEqual({ total: 3, last_page: 2, current_page: 2, per_page: 2 });
        expect(result.all).toHaveLength(3);
    });
});
