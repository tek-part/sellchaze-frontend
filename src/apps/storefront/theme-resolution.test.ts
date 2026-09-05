import { describe, expect, it, vi } from 'vitest';
import { resolveStorefrontThemeId } from './theme-resolution';

const known = new Set(['luxury-fashion', 'rouge', 'naseem']);
const base = { isRegistered: (id: string) => known.has(id), fallbackId: 'luxury-fashion' };

describe('resolveStorefrontThemeId', () => {
  it('uses the API bootstrap key when no ?theme= param is present', () => {
    expect(resolveStorefrontThemeId({ ...base, bootstrapKey: 'naseem' })).toBe('naseem');
  });

  it('maps legacy aliases from the bootstrap key', () => {
    expect(resolveStorefrontThemeId({ ...base, bootstrapKey: 'aurora' })).toBe('rouge');
    expect(resolveStorefrontThemeId({ ...base, bootstrapKey: 'default' })).toBe('luxury-fashion');
  });

  it('fails closed to the fallback for an unknown or missing bootstrap key', () => {
    expect(resolveStorefrontThemeId({ ...base, bootstrapKey: 'not-a-theme' })).toBe('luxury-fashion');
    expect(resolveStorefrontThemeId({ ...base, bootstrapKey: '' })).toBe('luxury-fashion');
    expect(resolveStorefrontThemeId({ ...base, bootstrapKey: null })).toBe('luxury-fashion');
    expect(resolveStorefrontThemeId({ ...base })).toBe('luxury-fashion');
  });

  it('keeps an unregistered key when a remote bundle will register it later', () => {
    expect(resolveStorefrontThemeId({ ...base, bootstrapKey: 'marketplace-x', hasRemoteBundle: true })).toBe('marketplace-x');
  });

  it('lets the ?theme= param win over the bootstrap key (aliases applied)', () => {
    expect(resolveStorefrontThemeId({ ...base, explicitTheme: 'rouge', bootstrapKey: 'naseem' })).toBe('rouge');
    expect(resolveStorefrontThemeId({ ...base, explicitTheme: 'aurora', bootstrapKey: 'naseem' })).toBe('rouge');
    // QA override for an id the registry does not know is passed through; ThemeProvider falls back.
    const isRegistered = vi.fn(() => false);
    expect(resolveStorefrontThemeId({ ...base, isRegistered, explicitTheme: 'wip-theme', bootstrapKey: 'naseem' })).toBe('wip-theme');
    expect(isRegistered).not.toHaveBeenCalled();
  });
});
