/**
 * Registry bridge — the ONE wiring point between the declarative catalog and the frozen engine
 * registry. It reads catalog data and registers each theme's lazy loader into the engine's
 * `ThemeRegistry`. The engine is untouched: this consumes only its public `register`/`has` API.
 *
 * Because registration is catalog-driven, adding/removing an installable theme is a catalog data
 * change — never an edit here or in the engine. Idempotent: re-registering a known id is a no-op
 * (the engine's `register` disallows overwrite, so we guard with `has`).
 */
import { themeRegistry as defaultRegistry, type ThemeRegistry } from '../../theme-engine';
import type { CatalogEntry, ThemeCatalog } from '../catalog/types';

/** Register a single catalog entry's loader into the registry (no-op if already present). */
export function registerCatalogEntry(
  entry: CatalogEntry,
  registry: ThemeRegistry = defaultRegistry,
): boolean {
  if (registry.has(entry.id)) return false;
  registry.register(entry.id, entry.load);
  return true;
}

/** Register every catalog entry into the registry. Returns the ids newly registered. */
export function registerCatalog(
  catalog: ThemeCatalog,
  registry: ThemeRegistry = defaultRegistry,
): ReadonlyArray<string> {
  const added: string[] = [];
  for (const entry of catalog) {
    if (registerCatalogEntry(entry, registry)) added.push(entry.id);
  }
  return added;
}
