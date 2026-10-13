import { describe, expect, it } from 'vitest';
import { getCatalogEntry } from '../../platform/catalog/catalog';
import { buildBackendManifest } from '../../platform/export/theme-manifest-export';
import type { StorefrontContext } from '../../theme-engine/rendering';
import type { ProductCardModel } from '../../types/catalog';
import { sampleProductDetail } from '../../dev/sampleData';
import { pureTheme } from './index';
import { eliteTheme } from '../elite-furniture';
import { pureCollectionContext, pureProducts, clampComparison, sortPureProducts } from './sections';

describe('Pure Furniture package', () => {
  it('loads its own shell and exports every placed section to the merchant editor', async () => {
    const entry = getCatalogEntry('pure-furniture')!;
    expect(await entry.load()).toBe(pureTheme);
    expect(pureTheme.layouts?.['default']).not.toBe(eliteTheme.layouts?.['default']);
    const schemas = new Set(pureTheme.sectionSchemas?.map(section => section.type));
    for (const page of Object.values(pureTheme.templates ?? {})) for (const section of page.sections) {
      expect(pureTheme.sections?.[section.type]).toBeDefined(); expect(schemas.has(section.type)).toBe(true);
    }
    const output = buildBackendManifest(pureTheme, entry);
    expect(output.bundle_url).toBe('builtin:pure-furniture@1.0.0');
    expect(output.templates['home']?.sections.map(section => section.type)).toEqual(['pure-hero', 'pure-categories', 'pure-marquee', 'pure-shelf', 'pure-story', 'pure-shelf', 'pure-image-compare', 'pure-shelf', 'pure-newsletter']);
    expect(output.sections_schema['pure-hero']?.settings.find(field => field.id === 'video')?.type).toBe('url');
    expect(output.sections_schema['pure-image-compare']?.settings.filter(field => field.type === 'image')).toHaveLength(2);
    expect(pureTheme.tokens?.typography.fontSans).toContain('Jost');
  });
  it('does not leak preview or unrelated products into explicitly empty merchant collections', () => {
    const context: StorefrontContext = { store: { name: 'Test', currency: 'USD' }, seo: {}, navigation: { header: [], footer: [] }, data: { collections: { featured: [{ id: 'old' }] }, merchandisingCollections: { featured: [] } } };
    const scoped = pureCollectionContext(context);
    expect(pureProducts(scoped, 'featured', [{ id: 'preview' }] as ProductCardModel[], 4)).toEqual([]);
    expect(context.data['collections']).toEqual({ featured: [{ id: 'old' }] });
    expect(pureProducts({ ...context, data: { products: [] } }, 'featured', [{ id: 'preview' }] as ProductCardModel[], 4)).toEqual([]);
  });
  it('bounds the keyboard comparison value and sorts without mutating inventory', () => {
    expect([-5, 50, 200, NaN].map(clampComparison)).toEqual([0, 50, 100, 50]);
    const products = [{ id: 'a', price: 90 }, { id: 'b', price: 20, rating: 5 }] as ProductCardModel[];
    expect(sortPureProducts(products, 'price-asc').map(product => product.id)).toEqual(['b', 'a']);
    expect(sortPureProducts(products, 'rating').map(product => product.id)).toEqual(['b', 'a']);
    expect(products.map(product => product.id)).toEqual(['a', 'b']);
  });
  it('uses furniture photos and real variant availability in the preview product', () => {
    const product = sampleProductDetail('walnut-sideboard', 'pure-furniture', 'en');
    expect(product.images[0]?.src).toBe(product.image?.src);
    expect(product.variants?.[1]?.availableStock).toBe(2);
    expect(product.variants?.[2]?.available).toBe(false);
  });
});
