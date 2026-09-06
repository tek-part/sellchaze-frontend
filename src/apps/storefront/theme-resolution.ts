/**
 * Active-theme resolution for the storefront entry — a pure function so the precedence is testable
 * without a DOM or a network:
 *
 *   1. explicit `?theme=` (Preview / QA override) — always wins, even for an id the registry does
 *      not know: the ThemeProvider's own `fallbackId` handles that case, as it always has.
 *   2. the merchant's ACTIVE theme from the API bootstrap (`theme.key`), after the legacy alias
 *      map. Fails closed to the configured fallback when the key is missing or not registered —
 *      unless the bootstrap also ships a remote bundle, whose runtime id is only registered later
 *      by `registerRemoteTheme` (StorefrontThemeRoot) and so cannot be known here yet.
 *   3. the configured fallback.
 */

/**
 * Theme keys the API may still emit for stores activated before a rename or before the legacy
 * themes (luxury-fashion, voltage, hearth, rouge) were retired. Each maps to the closest of the five
 * library-based themes so an old store keeps rendering instead of failing closed to the default.
 */
export const LEGACY_THEME_ALIASES: Readonly<Record<string, string>> = Object.freeze({
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

export function applyLegacyThemeAlias(key: string): string {
  return LEGACY_THEME_ALIASES[key] ?? key;
}

export interface ResolveThemeIdInput {
  /** `?theme=` query param, when present. */
  explicitTheme?: string | null;
  /** `theme.key` from the API bootstrap, when the request succeeded. */
  bootstrapKey?: string | null;
  /** True when the bootstrap carries a verifiable remote bundle for `bootstrapKey`. */
  hasRemoteBundle?: boolean;
  /** Registry membership test (`themeRegistry.has`). */
  isRegistered: (id: string) => boolean;
  /** Configured default / fail-closed fallback. */
  fallbackId: string;
}

export function resolveStorefrontThemeId(input: ResolveThemeIdInput): string {
  const explicit = input.explicitTheme?.trim();
  if (explicit) return applyLegacyThemeAlias(explicit);

  const key = input.bootstrapKey?.trim();
  if (!key) return input.fallbackId;

  const id = applyLegacyThemeAlias(key);
  if (input.isRegistered(id) || input.hasRemoteBundle) return id;
  return input.fallbackId;
}
