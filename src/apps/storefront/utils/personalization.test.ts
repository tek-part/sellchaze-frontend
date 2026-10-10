import { describe, expect, it } from 'vitest';
import { normalizedPersonalization, personalizedLineId, personalizationReady } from './personalization';
import { toProductCard, toProductDetail } from '../api/mappers';
import { cardCartInput } from './card-purchase';

describe('personalized product purchases', () => {
  it('merges equivalent trimmed input independent of key order, preserving distinct text and images', () => {
    const a = personalizedLineId('1', '2', { photo: 'token', name: ' Alice ', optional: ' ' });
    expect(a).toBe(personalizedLineId('1', '2', { name: 'Alice', photo: 'token' }));
    expect(a).not.toBe(personalizedLineId('1', '2', { name: 'Bob', photo: 'token' }));
    expect(a).not.toBe(personalizedLineId('1', '3', { name: 'Alice', photo: 'token' }));
    expect(a).not.toBe(personalizedLineId('1', '2', { name: 'Alice', photo: 'other' }));
    expect(normalizedPersonalization({ name: ' Alice ', empty: '' })).toEqual({ name: 'Alice' });
    expect(personalizedLineId('1', undefined, {})).toBe('1:default');
  });
  it('requires configured values and counts Unicode characters without rejecting optional blank fields', () => {
    const fields = [{ key: 'name', type: 'text' as const, label: 'Name', required: true, max_length: 2 }, { key: 'photo', type: 'image' as const, label: 'Photo', required: false, max_length: 100 }];
    expect(personalizationReady(fields, {})).toBe(false);
    expect(personalizationReady(fields, { name: '  ' })).toBe(false);
    expect(personalizationReady(fields, { name: '😀😀' })).toBe(true);
    expect(personalizationReady(fields, { name: 'ABC' })).toBe(false);
    expect(personalizationReady([{ ...fields[1]!, required: true }], {})).toBe(false);
  });
  it('maps the public schema and prevents quick-add bypassing personalization', () => {
    const api = { id: 1, name: 'Mug', slug: 'mug', price: 100, has_personalization: true, personalization_fields: [{ key: 'name', type: 'text' as const, label: 'Name', required: true, max_length: 10 }] };
    expect(toProductDetail(api, 'EGP').personalizationFields).toEqual(api.personalization_fields);
    expect(cardCartInput(toProductCard(api, 'EGP'))).toBeNull();
    expect(cardCartInput(toProductCard({ ...api, variants: [{ id: 2, name: 'Blue', is_active: true }] }, 'EGP'), '2')).toBeNull();
  });
});
