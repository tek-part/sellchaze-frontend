import { describe, expect, it } from 'vitest';
import { toProductDetail } from '../api/mappers';
import { variantGallery, variantImage } from './variant-image';
import { cardCartInput } from './card-purchase';

const product = toProductDetail({ id: 1, name: 'Bag', slug: 'bag', price: 10, image_url: '/cover.png', images: ['/blue.png'],
  option_display: [{ name: 'Color', label: 'Color', type: 'image', values: [{ value: 'Blue', label: 'Blue', image_url: '/blue.png' }] }],
  variants: [{ id: 1, name: 'Blue', options: { color: 'blue' }, image_url: '/sku.png' }, { id: 2, name: 'Blue large', options: { color: 'blue' } }],
}, 'EGP');
describe('variant image selection', () => {
  it('prefers the exact SKU image and carries it to cart', () => {
    expect(variantImage(product, product.variants?.[0])).toBe('/sku.png');
    expect(cardCartInput(product, '1')?.image).toBe('/sku.png');
  });
  it('falls back to a property image and retains gallery order without duplicates', () => {
    expect(variantImage(product, product.variants?.[1])).toBe('/blue.png');
    expect(variantGallery(product, '/blue.png').map((m) => m.src)).toEqual(['/cover.png', '/blue.png']);
    expect(variantGallery(product, '/sku.png').map((m) => m.src)).toEqual(['/sku.png', '/cover.png', '/blue.png']);
  });
  it('leaves invalid selections on the normal gallery and rejects unsafe URLs', () => {
    expect(variantImage(product)).toBeUndefined();
    const unsafe = toProductDetail({ id: 2, name: 'Bad', slug: 'bad', price: 1, variants: [{ id: 4, image_url: 'javascript:alert(1)' }] }, 'EGP');
    expect(unsafe.variants?.[0]?.image).toBeUndefined();
    expect(variantImage(unsafe, unsafe.variants?.[0])).toBeUndefined();
  });
});
