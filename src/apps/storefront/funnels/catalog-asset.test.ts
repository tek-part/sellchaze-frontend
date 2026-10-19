import { expect, it } from 'vitest';
import { funnelCatalogAsset } from './catalog-asset';
it('loads packaged funnel images from the bundle origin on merchant and custom domains', () => {
  for (const name of ['glasses','hair-revive','litter-robot','electric-biker','hair-care','skin-care','writing-board']) {
    const path = `/media/funnel-campaigns/${name}-hero-v1.webp`;
    expect(funnelCatalogAsset(path, 'https://assets.example.test/assets/catalog.js')).toBe(`https://assets.example.test${path}`);
    expect(funnelCatalogAsset(path, 'http://127.0.0.1:4183/assets/catalog.js')).toBe(`http://127.0.0.1:4183${path}`);
  }
});
it('keeps merchant uploads and remote product photos on their original hosts', () => {
  for (const path of ['/storage/stores/12/photo.jpg','/media/merchant.jpg','https://merchant.example/photo.jpg','//merchant.example/photo.jpg']) expect(funnelCatalogAsset(path, 'https://assets.example.test/assets/catalog.js')).toBe(path);
  expect(funnelCatalogAsset('/media/funnel-campaigns/own.png', 'file:///repo/catalog.ts')).toBe('/media/funnel-campaigns/own.png');
});
