import { describe, expect, it } from 'vitest';
import { productImages, productMedia, toProductDetail } from './mappers';
import type { ApiProduct } from './types';

const product: ApiProduct = { id: 1, name: 'Bag', slug: 'bag', price: 10, image_url: '/storage/cover.png',
  images: ['/storage/second.png', '/storage/cover.png'], media: [
    { id: 2, type: 'video', url: '/storage/movie.mp4', alt: 'Bag in use' },
    { id: 1, type: 'image', url: '/storage/second.png' },
  ] };

describe('product media mapping', () => {
  it('keeps cover first, mixed media order and labels without repeating images', () => {
    expect(productMedia(product)).toEqual([
      { type: 'image', src: '/storage/cover.png', alt: 'Bag' },
      { type: 'video', src: '/storage/movie.mp4', alt: 'Bag in use' },
      { type: 'image', src: '/storage/second.png', alt: 'Bag' },
    ]);
    expect(productImages(product).map((item) => item.src)).toEqual(['/storage/cover.png', '/storage/second.png']);
    expect(toProductDetail(product, 'EGP').media).toEqual(productMedia(product));
  });
  it('does not render active or protocol-relative media URLs', () => {
    expect(productMedia({ ...product, image_url: null, images: [], media: [
      { id: 1, type: 'video', url: 'javascript:alert(1)' },
      { id: 2, type: 'image', url: 'data:text/html,payload' },
      { id: 3, type: 'image', url: '//untrusted.test/file' },
    ] })).toEqual([]);
  });
  it('preserves legacy descriptions until explicitly replaced and accepts the localized canonical copy', () => {
    expect(toProductDetail({ ...product, long_description: 'Legacy', description: 'Old summary' }, 'EGP').descriptionHtml).toBe('Legacy');
    expect(toProductDetail({ ...product, long_description: null, description: 'English edited copy' }, 'EGP').descriptionHtml).toBe('English edited copy');
  });
});
