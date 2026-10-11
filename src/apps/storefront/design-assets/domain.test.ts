import { describe, expect, it } from 'vitest';
import { availableAssets, type DesignAsset } from './domain';
const id = '12345678-1234-1234-1234-123456789abc';
const other = 'abcdefab-1234-1234-1234-123456789abc';
const css: DesignAsset = { id, kind: 'css', url: `/api/v1/storefront/design-assets/${id}.css` };
const js: DesignAsset = { id: other, kind: 'js', url: `/api/v1/storefront/design-assets/${other}.js` };
describe('Executable storefront design files', () => {
  it('preserves chosen order while hiding disabled configuration and duplicate scripts', () => {
    expect(availableAssets({ enabled: true, assets: [js, css, js] })).toEqual([js, css]);
    expect(availableAssets({ enabled: false, assets: [css, js] })).toEqual([]);
    expect(availableAssets(null)).toEqual([]);
  });
  it('rejects external, mismatched, query-bearing and executable pseudo-URLs', () => {
    for (const url of ['https://other.test/file.js', '//other.test/file.js', 'javascript:alert(1)', `${css.url}?redirect=evil`, js.url, '/api/v1/my-store/media/1']) {
      expect(availableAssets({ enabled: true, assets: [{ ...css, url }] })).toEqual([]);
    }
    expect(availableAssets({ enabled: true, assets: [{ ...css, id: '" onload="x' }] })).toEqual([]);
  });
});
