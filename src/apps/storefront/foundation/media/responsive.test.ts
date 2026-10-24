import { describe, expect, it } from 'vitest';
import { densityImage, mobileSrcSet, responsiveImage, sizedImage, snapWidth } from './responsive';

const original = 'https://api.sellchaze.com/storage/stores/12/media/2026/10/hero.png';

describe('storefront responsive images', () => {
  it('snaps widths to the shared ladder', () => {
    expect(snapWidth(600)).toBe(640);
    expect(snapWidth(5000)).toBe(1920);
  });

  it('builds WebP derivative URLs for images on Sellchaze storage', () => {
    expect(sizedImage(original, 700)).toBe('https://api.sellchaze.com/storage/_img/w800/stores/12/media/2026/10/hero.png.webp');
    const image = responsiveImage(original);
    expect(image.srcSet).toContain('/storage/_img/w320/stores/12/media/2026/10/hero.png.webp 320w');
    expect(image.srcSet).toContain('1600w');
    expect(image.src).toBe('https://api.sellchaze.com/storage/_img/w960/stores/12/media/2026/10/hero.png.webp');
    expect(densityImage(original, 240).srcSet).toMatch(/w320\/.*1x, .*w480\/.*2x$/);
    expect(mobileSrcSet(original)).toContain('480w');
  });

  it('leaves foreign, animated, already-sized and query-string images untouched', () => {
    for (const src of ['https://cdn.example.com/storage/a.png', 'https://api.sellchaze.com/storage/a.gif', 'https://api.sellchaze.com/storage/_img/w320/a.png.webp', 'https://api.sellchaze.com/storage/a.png?v=2', '/media/demo.jpg', undefined]) {
      expect(responsiveImage(src)).toEqual({ src });
      expect(sizedImage(src, 320)).toBe(src);
    }
  });
});
