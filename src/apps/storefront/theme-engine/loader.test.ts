/** Theme loader — memoisation + retry-after-failure (no permanent cache poisoning). */
import { describe, expect, it, beforeEach } from 'vitest';
import { ThemeRegistry } from './registry';
import { loadTheme, clearThemeCache } from './loader';
import type { ThemeModule } from './types';

function moduleFor(id: string): ThemeModule {
  return {
    manifest: {
      id,
      name: id,
      version: '1.0.0',
      description: '',
      author: '',
      archetype: '',
      tags: [],
      schemaVersion: 1,
      supports: { colorSchemes: ['light'] },
    },
    defaultSettings: {},
    tokens: {},
  } as unknown as ThemeModule;
}

describe('loadTheme', () => {
  beforeEach(() => clearThemeCache());

  it('memoises a successful load (loader invoked once)', async () => {
    const registry = new ThemeRegistry();
    let calls = 0;
    registry.register('t', () => {
      calls += 1;
      return Promise.resolve(moduleFor('t'));
    });
    const a = await loadTheme({ registry, id: 't', fallbackId: 't' });
    const b = await loadTheme({ registry, id: 't', fallbackId: 't' });
    expect(a).toBe(b);
    expect(calls).toBe(1);
  });

  it('does NOT cache a failed load — a later call retries and can succeed', async () => {
    const registry = new ThemeRegistry();
    let calls = 0;
    registry.register('t', () => {
      calls += 1;
      return calls === 1 ? Promise.reject(new Error('network')) : Promise.resolve(moduleFor('t'));
    });

    await expect(loadTheme({ registry, id: 't', fallbackId: 't' })).rejects.toThrow('network');
    // The failed promise must have been evicted, so a retry re-invokes the loader.
    const recovered = await loadTheme({ registry, id: 't', fallbackId: 't' });
    expect(recovered.manifest.id).toBe('t');
    expect(calls).toBe(2);
  });

  it('falls back to the fallback theme for an unknown id', async () => {
    const registry = new ThemeRegistry();
    registry.register('fallback', () => Promise.resolve(moduleFor('fallback')));
    const loaded = await loadTheme({ registry, id: 'does-not-exist', fallbackId: 'fallback' });
    expect(loaded.manifest.id).toBe('fallback');
  });
});
