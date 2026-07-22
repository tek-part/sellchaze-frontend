/**
 * Theme Loader — resolves a registered theme id into a concrete `ThemeModule`.
 *
 * Fail-closed (docs/THEME-ENGINE-V2.md I2): an unknown id falls back to the configured
 * fallback theme so the storefront always renders. Resolved modules are memoised so repeat
 * loads (e.g. re-mounts) are instant and stable.
 */
import { invariant } from '../../../shared/utils/invariant';
import { migrateManifest } from './migration';
import type { ThemeRegistry } from './registry';
import type { ThemeModule } from './types';

const cache = new Map<string, Promise<ThemeModule>>();

export interface LoadThemeOptions {
  readonly registry: ThemeRegistry;
  readonly id: string;
  /** Used when `id` is not registered. Must itself be registered. */
  readonly fallbackId: string;
}

/** Resolve a theme module for `id`, falling back to `fallbackId` when `id` is unknown. */
export function loadTheme({ registry, id, fallbackId }: LoadThemeOptions): Promise<ThemeModule> {
  const resolvedId = registry.has(id) ? id : fallbackId;
  invariant(
    registry.has(resolvedId),
    `neither theme "${id}" nor fallback "${fallbackId}" is registered`,
  );

  const cached = cache.get(resolvedId);
  if (cached) return cached;

  const loader = registry.get(resolvedId);
  invariant(loader, `theme "${resolvedId}" has no loader`);

  const promise = Promise.resolve(loader())
    .then((module) => {
      invariant(
        module.manifest.id === resolvedId,
        `theme "${resolvedId}" loaded a module whose manifest id is "${module.manifest.id}"`,
      );
      // Auto-migrate the manifest to the current internal shape before anything consumes it,
      // so older themes keep working after engine upgrades.
      const manifest = migrateManifest(module.manifest).manifest;
      return { ...module, manifest };
    })
    .catch((error: unknown) => {
      // Never cache a failed load: a transient chunk/network error would otherwise poison the cache
      // permanently, so the theme could never recover. Evict so the next call retries from scratch.
      if (cache.get(resolvedId) === promise) cache.delete(resolvedId);
      throw error;
    });

  cache.set(resolvedId, promise);
  return promise;
}

/** Test/HMR aid — clear the module cache. */
export function clearThemeCache(): void {
  cache.clear();
}
