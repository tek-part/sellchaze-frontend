import { describe, expect, it } from 'vitest';
import { getCatalogEntry } from '../../platform/catalog/catalog';
import { buildBackendManifest } from '../../platform/export/theme-manifest-export';
import { sampleNewest, sampleProductDetail } from '../../dev/sampleData';
import { hypeTheme } from './index';
import { pureTheme } from '../pure-furniture';
import { resolveSectionSettings } from '../../sections-lib/schema';
import { hypeHeroSchema, hypeReviewPhotosSchema, comparisonValue } from './sections';
import { petProducts } from '../blast-pets/data';
describe('Hype Perfumes native contract', () => {
  it('loads a distinct layout and exports every editable section through the backend contract', async () => {
    const entry = getCatalogEntry('hype-perfumes')!;
    expect(await entry.load()).toBe(hypeTheme); expect(hypeTheme.layouts?.['default']).not.toBe(pureTheme.layouts?.['default']);
    const manifest = buildBackendManifest(hypeTheme, entry);
    expect(manifest.bundle_url).toBe('builtin:hype-perfumes@1.0.0'); expect(manifest.templates['home']?.sections).toHaveLength(12);
    for (const page of Object.values(manifest.templates)) for (const section of page.sections) {
      expect(hypeTheme.sections?.[section.type]).toBeDefined(); expect(manifest.sections_schema[section.type]).toBeDefined();
    }
    expect(manifest.sections_schema['hype-review-photos']?.settings.find(field => field.id === 'photos')?.type).toBe('list');
    expect(hypeTheme.tokens.typography.fontSans).toContain('Jost'); expect(hypeTheme.tokens.typography.fontSerif).toContain('Newsreader');
  });
  it('localizes new defaults and has no invented customer review photos', () => {
    expect(resolveSectionSettings(hypeHeroSchema, {}, 'ar')['title']).toBe('عطر يرافق لحظاتك');
    expect(resolveSectionSettings(hypeHeroSchema, {}, 'en')['title']).toBe('A scent for your moments');
    expect(resolveSectionSettings(hypeReviewPhotosSchema, {}, 'en')['photos']).toEqual([]);
    expect(comparisonValue(-1)).toBe(0); expect(comparisonValue(200)).toBe(100); expect(comparisonValue(NaN)).toBe(50);
  });
  it('keeps fragrance demo facts identical across locales and never fills an empty merchant collection', () => {
    const en = sampleNewest('hype-perfumes', 'en'); const ar = sampleNewest('hype-perfumes', 'ar');
    expect(en).toHaveLength(12); expect(en[0]?.title).not.toBe(ar[0]?.title); expect(en[0]?.price).toBe(ar[0]?.price);
    const detail = sampleProductDetail(en[0]!.handle, 'hype-perfumes', 'en');
    expect(detail.variants?.[0]?.availableStock).toBe(2); expect(detail.variants?.[1]?.available).toBe(false); expect(detail.images[0]?.src).toContain('/media/theme-campaigns/hype-perfumes-');
    const context = { store: { name: 'Merchant', currency: 'EGP' }, seo: {}, navigation: { header: [], footer: [] }, data: { products: en, merchandisingCollections: { featured: [] } } };
    expect(petProducts(context, 'featured', 8)).toEqual([]); expect(petProducts(context, 'unknown-category', 8)).toEqual([]);
  });
});
