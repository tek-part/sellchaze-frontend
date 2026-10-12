import { describe, expect, it } from 'vitest';
import { breadcrumbSchema, collectionSchema, productSchema } from './schema';
import type { ProductDetailModel } from '../types/catalog';

const product: ProductDetailModel = {
  id: '9',
  handle: 'coat',
  title: 'Coat',
  url: '/products/coat',
  price: 180,
  currency: 'USD',
  images: [{ src: 'a.jpg' }],
  descriptionHtml: '<p>Warm</p>',
  sku: 'X1',
  inStock: true,
  rating: 4.5,
  reviewCount: 10,
};

interface ProductLd {
  '@type': string;
  offers: { price: string; priceCurrency: string; availability: string };
  aggregateRating?: { reviewCount: number };
  description?: string;
}
interface ListLd {
  itemListElement: ReadonlyArray<{ position: number; item?: string }>;
}
interface CollectionLd {
  '@type': string;
  mainEntity: { numberOfItems: number; itemListElement: ReadonlyArray<unknown> };
}

describe('productSchema', () => {
  it('emits an Offer with price/currency/availability and aggregateRating', () => {
    const s = productSchema(product, 'https://x/products/coat') as unknown as ProductLd;
    expect(s['@type']).toBe('Product');
    expect(s.offers.price).toBe('180.00');
    expect(s.offers.priceCurrency).toBe('USD');
    expect(s.offers.availability).toBe('https://schema.org/InStock');
    expect(s.aggregateRating?.reviewCount).toBe(10);
    expect(s.description).toBe('Warm');
  });

  it('marks out-of-stock', () => {
    const s = productSchema({ ...product, inStock: false }, 'u') as unknown as ProductLd;
    expect(s.offers.availability).toBe('https://schema.org/OutOfStock');
  });
});

describe('breadcrumb / collection schema', () => {
  it('breadcrumb numbers positions and absolutises urls', () => {
    const s = breadcrumbSchema(
      [
        { label: 'Home', url: '/' },
        { label: 'Coats', url: '/collections/coats' },
      ],
      'https://x',
    ) as unknown as ListLd;
    expect(s.itemListElement).toHaveLength(2);
    expect(s.itemListElement[1]).toMatchObject({ position: 2, item: 'https://x/collections/coats' });
  });

  it('collection builds an ItemList capped at 24', () => {
    const many = Array.from({ length: 30 }, (_, i) => ({ title: `P${i}`, url: `/products/p${i}` }));
    const s = collectionSchema('Coats', 'https://x/c', many, 'https://x') as unknown as CollectionLd;
    expect(s['@type']).toBe('CollectionPage');
    expect(s.mainEntity.numberOfItems).toBe(30);
    expect(s.mainEntity.itemListElement).toHaveLength(24);
  });
});

describe('catalog landing-page structured data', () => {
  it('uses the selected SKU price, availability and image without modifying the parent catalog record', () => {
    const product: ProductDetailModel = { id: '13', handle: 'bag', url: '/products/bag', title: 'Bag', price: 250, currency: 'EGP', images: [{ src: 'https://images.example.com/parent.png', alt: 'Bag' }], inStock: true };
    const result = productSchema(product, 'https://shop.example.com/products/bag?variant=12', { price: 200, inStock: false, sku: 'p13-v12', image: 'https://images.example.com/blue.png' });
    expect(result).toMatchObject({ sku: 'p13-v12', image: ['https://images.example.com/blue.png'], offers: { price: '200.00', priceCurrency: 'EGP', availability: 'https://schema.org/OutOfStock', url: 'https://shop.example.com/products/bag?variant=12' } });
    expect(product.price).toBe(250); expect(product.images[0]?.src).toContain('parent');
    expect(productSchema(product, 'https://shop.example.com/products/bag')).toMatchObject({ offers: { price: '250.00', availability: 'https://schema.org/InStock' } });
  });
});
