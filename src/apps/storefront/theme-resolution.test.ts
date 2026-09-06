import { describe, expect, it, vi } from 'vitest';
import { LEGACY_THEME_ALIASES, applyLegacyThemeAlias, resolveStorefrontThemeId } from './theme-resolution';

const known = new Set(['naseem', 'bazaar', 'sahra', 'fresh', 'techno']);
const base = { isRegistered: (id: string) => known.has(id), fallbackId: 'naseem' };

describe('LEGACY_THEME_ALIASES', () => {
  it('maps every retired or renamed key onto one of the five library themes', () => {
    expect(LEGACY_THEME_ALIASES).toEqual({
      default: 'naseem',
      aurora: 'naseem',
      modern: 'naseem',
      atlas: 'bazaar',
      verde: 'fresh',
      'luxury-fashion': 'sahra',
      rouge: 'sahra',
      hearth: 'naseem',
      voltage: 'techno',
    });
    for (const target of Object.values(LEGACY_THEME_ALIASES)) expect(known.has(target)).toBe(true);
  });

  it('passes current ids through untouched', () => {
    for (const id of known) expect(applyLegacyThemeAlias(id)).toBe(id);
  });
});

describe('resolveStorefrontThemeId', () => {
  it('uses the API bootstrap key when no ?theme= param is present', () => {
    expect(resolveStorefrontThemeId({ ...base, bootstrapKey: 'sahra' })).toBe('sahra');
  });

  it('maps legacy aliases from the bootstrap key', () => {
    expect(resolveStorefrontThemeId({ ...base, bootstrapKey: 'aurora' })).toBe('naseem');
    expect(resolveStorefrontThemeId({ ...base, bootstrapKey: 'default' })).toBe('naseem');
    expect(resolveStorefrontThemeId({ ...base, bootstrapKey: 'luxury-fashion' })).toBe('sahra');
    expect(resolveStorefrontThemeId({ ...base, bootstrapKey: 'rouge' })).toBe('sahra');
    expect(resolveStorefrontThemeId({ ...base, bootstrapKey: 'hearth' })).toBe('naseem');
    expect(resolveStorefrontThemeId({ ...base, bootstrapKey: 'voltage' })).toBe('techno');
    expect(resolveStorefrontThemeId({ ...base, bootstrapKey: 'atlas' })).toBe('bazaar');
    expect(resolveStorefrontThemeId({ ...base, bootstrapKey: 'verde' })).toBe('fresh');
  });

  it('fails closed to the fallback for an unknown or missing bootstrap key', () => {
    expect(resolveStorefrontThemeId({ ...base, bootstrapKey: 'not-a-theme' })).toBe('naseem');
    expect(resolveStorefrontThemeId({ ...base, bootstrapKey: '' })).toBe('naseem');
    expect(resolveStorefrontThemeId({ ...base, bootstrapKey: null })).toBe('naseem');
    expect(resolveStorefrontThemeId({ ...base })).toBe('naseem');
  });

  it('keeps an unregistered key when a remote bundle will register it later', () => {
    expect(resolveStorefrontThemeId({ ...base, bootstrapKey: 'marketplace-x', hasRemoteBundle: true })).toBe('marketplace-x');
  });

  it('lets the ?theme= param win over the bootstrap key (aliases applied)', () => {
    expect(resolveStorefrontThemeId({ ...base, explicitTheme: 'sahra', bootstrapKey: 'naseem' })).toBe('sahra');
    expect(resolveStorefrontThemeId({ ...base, explicitTheme: 'rouge', bootstrapKey: 'naseem' })).toBe('sahra');
    // QA override for an id the registry does not know is passed through; ThemeProvider falls back.
    const isRegistered = vi.fn(() => false);
    expect(resolveStorefrontThemeId({ ...base, isRegistered, explicitTheme: 'wip-theme', bootstrapKey: 'naseem' })).toBe('wip-theme');
    expect(isRegistered).not.toHaveBeenCalled();
  });
});
