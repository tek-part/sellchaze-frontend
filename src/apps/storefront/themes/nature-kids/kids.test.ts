import { describe, expect, it } from 'vitest';
import { getCatalogEntry } from '../../platform/catalog/catalog';
import { buildBackendManifest } from '../../platform/export/theme-manifest-export';
import type { StorefrontContext } from '../../theme-engine/rendering';
import type { ProductCardModel } from '../../types/catalog';
import { sampleProductDetail } from '../../dev/sampleData';
import { kidsTheme } from './index';
import { pureTheme } from '../pure-furniture';
import { kidsProducts, pickLookProducts } from './sections';
import { slideshowPosition } from './PeekSlideshow';
import { reviewError } from './ProductReviews';
import { ApiError } from '../../api/client';

describe('Nature Kids package', () => {
  it('loads its own layout and exports all placed home, product and category sections', async () => {
    const entry = getCatalogEntry('nature-kids')!;
    expect(await entry.load()).toBe(kidsTheme);
    expect(kidsTheme.layouts?.['default']).not.toBe(pureTheme.layouts?.['default']);
    const schemas = new Set(kidsTheme.sectionSchemas?.map(section => section.type));
    for (const page of Object.values(kidsTheme.templates ?? {})) for (const section of page.sections) {
      expect(kidsTheme.sections?.[section.type]).toBeDefined(); expect(schemas.has(section.type)).toBe(true);
    }
    const output = buildBackendManifest(kidsTheme, entry);
    expect(output.bundle_url).toBe('builtin:nature-kids@1.0.0');
    expect(output.templates['home']?.sections).toHaveLength(12);
    expect(output.sections_schema['kids-shop-look']?.settings.find(field => field.id === 'products')?.type).toBe('list');
    expect(kidsTheme.tokens.typography.fontSans).toContain('DM Sans');
  });
  it('keeps explicitly empty and unknown custom collections empty, without leaking other products', () => {
    const context: StorefrontContext = { store: { name: 'Test', currency: 'EGP' }, seo: {}, navigation: { header: [], footer: [] }, data: { products: [{ id: 'unrelated' }], collections: { sale: [{ id: 'old' }], custom: [] }, merchandisingCollections: { sale: [] } } };
    const fallback = [{ id: 'preview' }] as ProductCardModel[];
    expect(kidsProducts(context, 'sale', fallback, 8)).toEqual([]);
    expect(kidsProducts(context, 'custom', fallback, 8)).toEqual([]);
    expect(kidsProducts(context, 'removed-custom', fallback, 8)).toEqual([]);
    expect(context.data['collections']).toEqual({ sale: [{ id: 'old' }], custom: [] });
  });
  it('preserves the chosen look product order and ignores missing references', () => {
    const products = [{ id: '1', handle: 'shirt' }, { id: '2', handle: 'shorts' }] as ProductCardModel[];
    expect(pickLookProducts(products, ['2', 'missing', 'shirt']).map(product => product.id)).toEqual(['2', '1']);
    expect(products.map(product => product.id)).toEqual(['1', '2']);
  });
  it('wraps hero navigation in both directions and handles an empty list', () => {
    expect(slideshowPosition(-1, 3)).toBe(2); expect(slideshowPosition(3, 3)).toBe(0); expect(slideshowPosition(8, 0)).toBe(0);
  });
  it('previews clothing sizes and stock limits instead of furniture or adult sizes', () => {
    const product = sampleProductDetail('everyday-cotton-t-shirt', 'nature-kids', 'en');
    expect(product.id).toContain('kids-preview'); expect(product.variants?.map(variant => variant.label)).toEqual(['4–6 years', '7–9 years']);
    expect(product.orderMaxQuantity).toBe(3); expect(product.variants?.[1]?.availableStock).toBe(2);
  });
  it('shows the actual duplicate-review validation message instead of a success', () => {
    expect(reviewError(new ApiError(422, 'Invalid', { errors: { rating: ['Already reviewed.'] } }), 'Fallback')).toBe('Already reviewed.');
    expect(reviewError(new Error('Network unavailable.'), 'Fallback')).toBe('Network unavailable.');
  });
});
