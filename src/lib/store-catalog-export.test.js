import { describe, it, expect } from 'vitest';
import { catalogExportRow } from './store-catalog-export';

describe('catalog exports', () => {
    it('exports serialized decimal prices as numeric spreadsheet cells', () => {
        expect(catalogExportRow({ price: '125.50' }).price).toBe(125.5);
        expect(catalogExportRow({ price: null }).price).toBe(null);
    });
    it('exports the actual price, visibility and tracked available stock', () => {
        expect(catalogExportRow({ id: 7, name: 'Bag', sku: 'BAG-7', slug: 'bag', price: 250, is_active: false, category: { name: 'Bags' }, track_inventory: true, stock: 0, variants: [{ sku: 'BLUE' }] }))
            .toEqual({ id: 7, name: 'Bag', sku: 'BAG-7', slug: 'bag', price: 250, published: false, category: 'Bags', stock: 0, variant_count: 1 });
    });
    it('does not serialize private delivery URLs, cost or personalization submissions', () => {
        const row = catalogExportRow({ id: 2, name: 'Guide', slug: 'guide', price: 100, is_active: true, track_inventory: false, cost: 30, digital_url: 'private/download', personalization_fields: [{ private: true }], stock: 44 });
        expect(row.stock).toBe('');
        expect(row).not.toHaveProperty('cost');
        expect(row).not.toHaveProperty('digital_url');
        expect(row).not.toHaveProperty('personalization_fields');
    });
});
