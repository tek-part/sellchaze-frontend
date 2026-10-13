import { describe, expect, it } from 'vitest';
import { THEME_CATALOG } from '../platform/catalog/catalog';
import { THEME_LOADERS } from '../platform/catalog/loaders';
import { registerThemes, themeRegistry } from './registry';

describe('storefront runtime registry', () => {
  it('uses the same loaders as every installable marketplace package, without lost or extra keys', () => {
    expect(Object.keys(THEME_LOADERS)).toEqual(THEME_CATALOG.map(entry => entry.id));
    registerThemes();
    const before = themeRegistry.entries();
    registerThemes();
    expect(themeRegistry.entries()).toEqual(before);
    for (const entry of THEME_CATALOG) {
      const loader = themeRegistry.get(entry.id);
      expect(loader).toBe(entry.load);
    }
  });
  it.each(THEME_CATALOG)('resolves $id to the advertised module and version', async entry => {
    registerThemes();
    const module = await themeRegistry.get(entry.id)!();
    expect(module.manifest.id).toBe(entry.id);
    expect(module.manifest.version).toBe(entry.version);
  }, 15000);
});
