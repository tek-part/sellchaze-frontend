/**
 * Theme registration — lazy runtime wiring into the engine registry.
 *
 * The storefront and marketplace share loader functions. Marketplace descriptions, screenshots,
 * licensing and changelogs stay out of storefront boot; each selected theme supplies its own
 * manifest after its chunk loads. Adding a package changes loaders/listings, not the frozen engine.
 */
import { themeRegistry } from '../theme-engine/registry';
import { THEME_LOADERS } from '../platform/catalog/loaders';

let registered = false;

export function registerThemes(): void {
  if (registered) return;
  registered = true;
  for (const [id, load] of Object.entries(THEME_LOADERS)) {
    if (!themeRegistry.has(id)) themeRegistry.register(id, load);
  }
}

export { themeRegistry };
