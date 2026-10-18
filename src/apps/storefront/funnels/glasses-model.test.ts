import { expect, it } from 'vitest';
import type { ApiProduct } from '../api/types';
import { campaignUrl, offerRemaining, productPictures, specificationRows } from './glasses-model';

it('expires at a fixed merchant-configured instant without resetting on another visit', () => {
  const expiry = '2026-10-20T14:00:00+03:00';
  expect(offerRemaining(expiry, Date.parse('2026-10-20T10:59:00Z'))).toBe(60);
  expect(offerRemaining(expiry, Date.parse('2026-10-20T11:01:00Z'))).toBe(0);
  expect(offerRemaining('2026-10-20T14:00', 0)).toBeNull();
  expect(offerRemaining('not a date', 0)).toBeNull();
  expect(offerRemaining('', 0)).toBeNull();
});

it('rejects executable and credential-bearing campaign URLs', () => {
  for (const value of ['javascript:alert(1)', 'data:image/svg+xml,x', '//other.example/image.png', '/\\other.example/a', 'https://user:password@example.test/a', '/broken\npath']) expect(campaignUrl(value)).toBeUndefined();
  expect(campaignUrl('/media/own-image.png')).toBe('/media/own-image.png');
  expect(campaignUrl('https://example.test/photo.png')).toBe('https://example.test/photo.png');
});

it('prioritizes the selected variant photo, deduplicates galleries and excludes video', () => {
  const product: ApiProduct = { id: 1, name: 'Own product', slug: 'own-product', price: 100, image_url: '/main.png', images: ['/main.png', '/side.png'], media: [{ id: 1, type: 'video', url: '/film.mp4' }, { id: 2, type: 'image', url: '/detail.png' }] };
  expect(productPictures(product, '/variant.png')).toEqual(['/variant.png', '/main.png', '/side.png', '/detail.png']);
  expect(productPictures(null)).toEqual([]);
});

it('renders only scalar specification values from either supported API shape', () => {
  expect(specificationRows({ specifications: { Color: 'Black', Width: 145, Unknown: { hidden: true } } } as unknown as ApiProduct)).toEqual([{ label: 'Color', value: 'Black' }, { label: 'Width', value: '145' }]);
  expect(specificationRows({ specifications: [{ name: 'Frame', value: 'Acetate' }, { label: 'Width', value: 145 }, null] } as unknown as ApiProduct)).toEqual([{ label: 'Frame', value: 'Acetate' }, { label: 'Width', value: '145' }]);
});
