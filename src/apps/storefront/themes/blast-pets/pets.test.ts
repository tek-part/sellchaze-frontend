import { describe, expect, it } from 'vitest';
import { getCatalogEntry } from '../../platform/catalog/catalog';
import { buildBackendManifest } from '../../platform/export/theme-manifest-export';
import type { StorefrontContext } from '../../theme-engine/rendering';
import type { ProductCardModel } from '../../types/catalog';
import { sampleProductDetail, sampleNewest } from '../../dev/sampleData';
import { petsTheme } from './index';
import { kidsTheme } from '../nature-kids';
import { petProducts, slideIndex } from './data';

describe('Blast Pets independent package', () => {
  it('loads its own composition and exports editable sections for every placed page', async () => {
    const entry = getCatalogEntry('blast-pets')!;
    expect(await entry.load()).toBe(petsTheme);
    expect(petsTheme.layouts?.['default']).not.toBe(kidsTheme.layouts?.['default']);
    const schemas = new Set(petsTheme.sectionSchemas?.map(section => section.type));
    for (const page of Object.values(petsTheme.templates ?? {})) for (const section of page.sections) {
      expect(petsTheme.sections?.[section.type]).toBeDefined(); expect(schemas.has(section.type)).toBe(true);
    }
    const output = buildBackendManifest(petsTheme, entry);
    expect(output.bundle_url).toBe('builtin:blast-pets@1.0.0');
    expect(output.templates['home']?.sections.map(section => section.type)).toEqual(['pets-categories', 'pets-slideshow', 'pets-marquee', 'pets-shelf', 'pets-search-banner', 'pets-shelf', 'pets-timed-offer', 'pets-linked-look', 'pets-editorial', 'pets-shelf', 'pets-categories', 'pets-newsletter']);
    expect(output.sections_schema['pets-slideshow']?.settings.find(field => field.id === 'slides')?.type).toBe('list');
    expect(output.sections_schema['pets-linked-look']?.settings.find(field => field.id === 'products')?.type).toBe('list');
    expect(output.sections_schema['pets-timed-offer']?.settings.find(field => field.id === 'ends_at')?.default).toBe('');
    expect(petsTheme.tokens?.typography.fontSans).toContain('Jost');
  });
  it('respects authoritative empty merchant collections and never borrows unknown collections', () => {
    const sample = { id: 'visible' } as ProductCardModel;
    const context: StorefrontContext = { store: { name: 'Test', currency: 'EGP' }, seo: {}, navigation: { header: [], footer: [] }, data: { products: [sample], collections: { featured: [sample] }, merchandisingCollections: { featured: [] } } };
    expect(petProducts(context, 'featured', 4)).toEqual([]);
    expect(petProducts(context, 'missing-category', 4)).toEqual([]);
    expect(petProducts({ ...context, data: { products: [sample] } }, 'missing-category', 4)).toEqual([]);
    expect(context.data['collections']).toEqual({ featured: [sample] });
    expect(petProducts({ ...context, data: { products: [] } }, 'featured', 4)).toEqual([]);
  });
  it('filters the chosen collection by category without borrowing other products', () => {
    const cats = { id: 'cat', categorySlug: 'cats' } as ProductCardModel;
    const dogs = { id: 'dog', categorySlug: 'dogs' } as ProductCardModel;
    const context: StorefrontContext = { store: { name: 'Test', currency: 'EGP' }, seo: {}, navigation: { header: [], footer: [] }, data: { collections: { all: [cats, dogs] } } };
    expect(petProducts(context, 'all', 4, 'dogs')).toEqual([dogs]);
    expect(petProducts(context, 'all', 4, 'unknown')).toEqual([]);
    expect(petProducts(context, 'all', 1)).toEqual([cats]);
  });
  it('wraps slideshow navigation in both directions and handles an empty gallery', () => {
    expect([-1, 0, 2, 3].map(index => slideIndex(index, 3))).toEqual([2, 0, 2, 0]);
    expect(slideIndex(5, 0)).toBe(0);
  });
  it('uses its own pet preview in both languages with honest variant availability', () => {
    const english = sampleNewest('blast-pets', 'en'); const arabic = sampleNewest('blast-pets', 'ar');
    expect(english[0]?.image?.src).toContain('/blast-pets-');
    expect(english[0]?.price).toBe(arabic[0]?.price);
    expect(english[0]?.title).not.toBe(arabic[0]?.title);
    const bed = english.find(product => product.categorySlug === 'beds-accessories')!;
    const detail = sampleProductDetail(bed.handle, 'blast-pets', 'en');
    expect(detail.variants?.[1]?.availableStock).toBe(2);
    expect(detail.variants?.[2]?.available).toBe(false);
  });
});
