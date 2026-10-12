import { describe, expect, it } from 'vitest';
import { getCatalogEntry } from '../../platform/catalog/catalog';
import { buildBackendManifest } from '../../platform/export/theme-manifest-export';
import { catalogFor } from '../../content/demo';
import { sphinxTheme } from './index';
import { naseemTheme } from '../naseem';

describe('Sphinx storefront package', () => {
  it('loads its own layout and editable sections through the marketplace', async () => {
    const entry = getCatalogEntry('sphinx-v3');
    expect(entry).toBeDefined();
    const loaded = await entry!.load();
    expect(loaded).toBe(sphinxTheme);
    expect(loaded.layouts?.['default']).not.toBe(naseemTheme.layouts?.['default']);
    const schemaTypes = new Set(loaded.sectionSchemas?.map((section) => section.type));
    for (const page of Object.values(loaded.templates ?? {})) for (const section of page.sections) {
      expect(loaded.sections?.[section.type]).toBeDefined();
      expect(schemaTypes.has(section.type)).toBe(true);
    }
    expect(schemaTypes.has('sphinx-categories')).toBe(true);
    expect(schemaTypes.has('sphinx-shelf')).toBe(true);
  });
  it('exports localized editable settings and its actual template compositions', () => {
    const output = buildBackendManifest(sphinxTheme, getCatalogEntry('sphinx-v3')!);
    expect(output.key).toBe('sphinx-v3');
    expect(output.templates['home']?.sections.some((section) => section.type === 'sphinx-categories')).toBe(true);
    const fields = output.settings_schema.flatMap((group) => group.fields);
    expect(fields.find((field) => field.id === 'announcement_text')?.default).toEqual({ ar: 'أهلًا بكم في متجرنا', en: 'Welcome to our store' });
    expect(fields.find((field) => field.id === 'heading_font')?.default).toBe('Raleway');
    expect(fields.find((field) => field.id === 'container_width')?.default).toBe(1316);
  });
  it('keeps preview product routes and prices stable when translated', () => {
    const en = catalogFor('sphinx-v3', 'en'); const ar = catalogFor('sphinx-v3', 'ar');
    expect(en.categories).toHaveLength(6);
    expect(ar.products.map((product) => [product.id, product.url, product.price])).toEqual(en.products.map((product) => [product.id, product.url, product.price]));
    expect(ar.products[0]?.title).not.toBe(en.products[0]?.title);
    expect(en.testimonials).toEqual([]);
  });
});
