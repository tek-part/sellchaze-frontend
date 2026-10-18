import { describe, expect, it } from 'vitest';
import { getCatalogEntry } from '../../platform/catalog/catalog';
import { buildBackendManifest } from '../../platform/export/theme-manifest-export';
import { resolveSectionSettings } from '../../sections-lib/schema';
import { fashionTheme } from './index';
import { hypeTheme } from '../hype-perfumes';
import { fashionFeaturesSchema, fashionPromotionSchema, fashionReviewsSchema } from './sections';
import { petProducts } from '../blast-pets/data';

describe('Native fashion package', () => {
  it('exports its independent composition with editable linked products and real page renderers', async () => {
    const entry = getCatalogEntry('hype-fashion')!; expect(await entry.load()).toBe(fashionTheme);
    expect(fashionTheme.layouts?.['default']).not.toBe(hypeTheme.layouts?.['default']);
    const manifest = buildBackendManifest(fashionTheme, entry);
    expect(manifest.bundle_url).toBe('builtin:hype-fashion@1.0.0');
    expect(manifest.templates['home']?.sections).toHaveLength(13);
    for (const page of Object.values(manifest.templates)) for (const section of page.sections) {
      expect(fashionTheme.sections?.[section.type]).toBeDefined(); expect(manifest.sections_schema[section.type]).toBeDefined();
    }
    expect(manifest.sections_schema['fashion-linked-look']?.settings.find(field => field.id === 'products')?.type).toBe('list');
  });
  it('does not invent promotions, service promises, reviews or merchant products', () => {
    expect(resolveSectionSettings(fashionReviewsSchema, {}, 'en')['photos']).toEqual([]);
    expect(resolveSectionSettings(fashionFeaturesSchema, {}, 'ar')['items']).toEqual([]);
    expect(JSON.stringify(resolveSectionSettings(fashionPromotionSchema, {}, 'en'))).not.toMatch(/30%|140|free shipping|automatically applied/i);
    const context = { store: { name: 'Merchant', currency: 'USD' }, seo: {}, navigation: { header: [], footer: [] }, data: { products: [{ id: 'demo', title: 'Preview' }], merchandisingCollections: { featured: [] } } };
    expect(petProducts(context, 'featured', 8)).toEqual([]); expect(petProducts(context, 'missing-category', 8)).toEqual([]);
  });
});
