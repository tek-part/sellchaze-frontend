/**
 * Theme registration — catalog-driven wiring into the engine registry.
 *
 * Themes are no longer hardcoded here: the platform's declarative catalog
 * (`platform/catalog/catalog.ts`) is the single source of installable themes, and the registry
 * bridge registers each entry's lazy (code-split) loader into the frozen engine registry. Adding a
 * theme is now a catalog data change only — this file, the engine, pages, and components are all
 * untouched. Importing this module once (for its side effect) makes every catalogued theme available
 * to the loader.
 */
import { themeRegistry } from '../theme-engine/registry';
import { THEME_CATALOG } from '../platform/catalog/catalog';
import { registerCatalog } from '../platform/domain/registry-bridge';

let registered = false;

export function registerThemes(): void {
  if (registered) return;
  registered = true;
  registerCatalog(THEME_CATALOG, themeRegistry);
}

export { themeRegistry };
