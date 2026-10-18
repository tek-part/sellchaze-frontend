import { describe, expect, it } from 'vitest';
import { getCatalogEntry } from '../../platform/catalog/catalog';
import { buildBackendManifest } from '../../platform/export/theme-manifest-export';
import { sampleNewest, sampleProductDetail } from '../../dev/sampleData';
import { naturePetsTheme } from './index';
import { kidsTheme } from '../nature-kids';
import { petsTheme } from '../blast-pets';
import { resolveSectionSettings } from '../../sections-lib/schema';
import { natureCategoriesSchema, natureFaqSchema } from './sections';
describe('Nature Pets native package', () => {
 it('loads an independent composition with editable sections and a paired backend contract', async () => {
  const entry = getCatalogEntry('nature-pets')!; expect(await entry.load()).toBe(naturePetsTheme);
  expect(naturePetsTheme.layouts?.['default']).not.toBe(kidsTheme.layouts?.['default']);
  expect(naturePetsTheme.layouts?.['default']).not.toBe(petsTheme.layouts?.['default']);
  const schemaTypes = new Set(naturePetsTheme.sectionSchemas?.map(section => section.type));
  for (const page of Object.values(naturePetsTheme.templates ?? {})) for (const section of page.sections) { expect(naturePetsTheme.sections?.[section.type]).toBeDefined(); expect(schemaTypes.has(section.type)).toBe(true); }
  const manifest = buildBackendManifest(naturePetsTheme, entry);
  expect(manifest.bundle_url).toBe('builtin:nature-pets@1.0.0');
  expect(manifest.templates['home']?.sections.map(section => section.type)).toEqual(['nature-pets-hero', 'nature-pets-categories', 'nature-pets-shelf', 'nature-pets-story', 'nature-pets-shelf', 'nature-pets-faq', 'nature-pets-shelf', 'nature-pets-editorial', 'nature-pets-newsletter']);
  expect(manifest.sections_schema['nature-pets-faq']?.settings.find(field => field.id === 'items')?.type).toBe('list');
 });
 it('localizes fresh section defaults and keeps pet copy separate from the kids package', () => {
  const en = resolveSectionSettings(natureCategoriesSchema, {}, 'en'); const ar = resolveSectionSettings(natureCategoriesSchema, {}, 'ar');
  expect(en['title']).toBe('Everyday care for your companion'); expect(ar['title']).toBe('عناية يومية بحيوانك الأليف');
  expect(resolveSectionSettings(natureFaqSchema, { items: [{ question: '<img src=x>', answer: '<script>bad</script>' }] }, 'en')['items']).toHaveLength(1);
 });
 it('previews pet data with real option availability and matching localized amounts', () => {
  const english = sampleNewest('nature-pets', 'en'); const arabic = sampleNewest('nature-pets', 'ar');
  expect(english[0]?.price).toBe(arabic[0]?.price); expect(english[0]?.title).not.toBe(arabic[0]?.title);
  const bed = english.find(product => product.categorySlug === 'beds-accessories')!;
  const detail = sampleProductDetail(bed.handle, 'nature-pets', 'en');
  expect(detail.variants?.[1]?.availableStock).toBe(2); expect(detail.variants?.[2]?.available).toBe(false);
  expect(naturePetsTheme.tokens.typography.fontSans).toContain('DM Sans');
 });
});
