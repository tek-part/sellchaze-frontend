import { describe, expect, it } from 'vitest';
import { getCatalogEntry } from '../../platform/catalog/catalog';
import { buildBackendManifest } from '../../platform/export/theme-manifest-export';
import { productsFromContext } from '../../sections-lib/data';
import type { SectionRenderProps } from '../../theme-engine/rendering';
import { eliteTheme } from './index';
import { eliteCollectionContext, eliteProducts, rankEliteProducts } from './sections';
import type { ProductCardModel } from '../../types/catalog';
import { sampleProductDetail } from '../../dev/sampleData';
import { sphinxTheme } from '../sphinx';

describe('Elite Furniture package', () => {
  it('installs an independent layout and exports editable photo comparison rather than a skin alias', async () => {
    const entry = getCatalogEntry('elite-furniture')!;
    expect(await entry.load()).toBe(eliteTheme);
    expect(eliteTheme.layouts?.['default']).not.toBe(sphinxTheme.layouts?.['default']);
    const schemas = new Set(eliteTheme.sectionSchemas?.map(section => section.type));
    for (const page of Object.values(eliteTheme.templates ?? {})) for (const section of page.sections) {
      expect(eliteTheme.sections?.[section.type]).toBeDefined();
      expect(schemas.has(section.type)).toBe(true);
    }
    const output = buildBackendManifest(eliteTheme, entry);
    expect(output.templates['home']?.sections.map(section => section.type)).toContain('elite-image-compare');
    expect(output.sections_schema['elite-image-compare']?.settings.filter(field => field.type === 'image')).toHaveLength(2);
    expect(output.bundle_url).toBe('builtin:elite-furniture@1.0.0');
    expect(output.supported_features).not.toContain('dark-mode');
  });
  it('keeps an explicitly empty store collection empty instead of showing another collection or preview product', () => {
    const props = { context: { store: { name: 'Store', currency: 'USD' }, seo: {}, navigation: { header: [], footer: [] }, data: { collections: { sale: [{ id: 'unrelated' }] }, merchandisingCollections: { sale: [] } } } } as unknown as SectionRenderProps;
    const next = eliteCollectionContext(props);
    expect(productsFromContext(next.context, 'sale')).toEqual([]);
    expect(eliteProducts(props, [{ id: 'unrelated-preview' }] as ProductCardModel[], 'sale', 8)).toEqual([]);
    expect(props.context.data['collections']).toEqual({ sale: [{ id: 'unrelated' }] });
  });
  it('sorts actual price/rating values without mutating the store catalog or treating missing ratings as top rated', () => {
    const products = [{ id: 'a', price: 90 }, { id: 'b', price: 20, rating: 4 }, { id: 'c', price: 70, rating: 5 }] as ProductCardModel[];
    expect(rankEliteProducts(products, 'price-asc').map(p => p.id)).toEqual(['b', 'c', 'a']);
    expect(rankEliteProducts(products, 'price-desc').map(p => p.id)).toEqual(['a', 'c', 'b']);
    expect(rankEliteProducts(products, 'rating').map(p => p.id)).toEqual(['c', 'b', 'a']);
    expect(products.map(p => p.id)).toEqual(['a', 'b', 'c']);
  });
  it('uses furniture photography and inventory choices when previewing a furniture product', () => {
    const product = sampleProductDetail('walnut-sideboard', 'elite-furniture', 'en');
    expect(product.images[0]?.src).toBe(product.image?.src);
    expect(product.descriptionHtml).not.toContain('wool-cashmere');
    expect(product.variants?.map(variant => variant.label)).toEqual(['Walnut', 'Oak', 'Black']);
    expect(product.variants?.[1]?.availableStock).toBe(2);
    expect(product.variants?.[2]?.available).toBe(false);
  });
});
