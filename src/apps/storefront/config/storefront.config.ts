/**
 * Storefront app configuration. App-level (not theme-level) concerns: which theme is active
 * and which theme to fall back to when a merchant's selected theme is unavailable.
 *
 * In production the active theme id comes from the merchant's storefront context (API); this
 * default is used before that resolves and in isolated previews.
 */
export interface StorefrontConfig {
  /** Theme rendered when no merchant selection is available yet. */
  readonly defaultThemeId: string;
  /** Fail-closed fallback when a selected theme id is not registered. */
  readonly fallbackThemeId: string;
}

export const storefrontConfig: StorefrontConfig = {
  defaultThemeId: 'luxury-fashion',
  fallbackThemeId: 'luxury-fashion',
};
