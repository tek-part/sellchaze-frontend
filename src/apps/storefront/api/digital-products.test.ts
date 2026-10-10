import { describe, expect, it } from 'vitest';
import { toProductCard, toProductDetail } from './mappers';

describe('digital product mapping', () => {
  it('preserves public delivery type and code stock without mapping private delivery data', () => {
    const dto = { id: 1, name: 'Guide', slug: 'guide', price: '100.00', digital_type: 'codes' as const, stock: 2, digital_url: 'https://example.test/private', digital_codes: ['PRIVATE-CODE'] };
    const card = toProductCard(dto, 'EGP');
    expect(card.digitalType).toBe('codes');
    expect(card.availableStock).toBe(2);
    expect(JSON.stringify(toProductDetail(dto, 'EGP'))).not.toContain('PRIVATE-CODE');
    expect(JSON.stringify(card)).not.toContain('example.test/private');
  });
  it('marks an exhausted code pool sold out and keeps legacy products physical', () => {
    const dto = { id: 1, name: 'Guide', slug: 'guide', price: 100, digital_type: 'codes' as const, stock: 0 };
    expect(toProductCard(dto, 'EGP').soldOut).toBe(true);
    expect(toProductDetail(dto, 'EGP').inStock).toBe(false);
    expect(toProductCard({ id: 2, name: 'Book', slug: 'book', price: 100 }, 'EGP').digitalType).toBe('physical');
  });
});
