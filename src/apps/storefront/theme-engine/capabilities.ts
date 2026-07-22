/**
 * Theme capabilities — the engine (and feature code) determines what a theme can do by reading
 * declared capabilities, NEVER by checking a theme's name/id. This keeps the engine free of any
 * theme-specific conditionals: `if (hasCapability(theme, 'mega-menu'))`, never `if (id === 'x')`.
 *
 * The set is OPEN — themes may declare capabilities beyond the well-known list below (e.g. a
 * plugin-defined feature). Well-known keys are documented for discoverability + typo-safety.
 */

/** Well-known capability keys (extensible — see `ThemeCapability`). */
export const KNOWN_CAPABILITIES = [
  'rtl',
  'dark-mode',
  'mega-menu',
  'search-overlay',
  'cart-drawer',
  'wishlist',
  'compare',
  'quick-view',
  'quick-add',
  'reviews',
  'newsletter',
  'countdown',
  'lookbook',
  'instagram',
  'blog',
] as const;

export type KnownCapability = (typeof KNOWN_CAPABILITIES)[number];
/** A capability key: a well-known one or any theme/plugin-defined string. */
export type ThemeCapability = KnownCapability | (string & {});

export interface HasCapabilities {
  readonly capabilities: ReadonlyArray<ThemeCapability>;
}

/** True when the theme declares `capability`. */
export function hasCapability(source: HasCapabilities, capability: ThemeCapability): boolean {
  return source.capabilities.includes(capability);
}

/** True when the theme declares every listed capability. */
export function hasAllCapabilities(
  source: HasCapabilities,
  required: ReadonlyArray<ThemeCapability>,
): boolean {
  return required.every((c) => source.capabilities.includes(c));
}
