/**
 * Storefront app — public surface.
 *
 * The host application mounts `<StorefrontThemeRoot>` and renders storefront routes inside it.
 * Everything else (pages, sections, components — later phases) consumes the active theme only
 * through the engine hooks re-exported here, never through a theme package directly.
 */
export { StorefrontThemeRoot, type StorefrontThemeRootProps } from './StorefrontThemeRoot';
export { storefrontConfig, type StorefrontConfig } from './config/storefront.config';
export { registerThemes } from './themes/registry';

export {
  THEME_ENGINE_VERSION,
  ThemeProvider,
  themeRegistry,
  useTheme,
  useThemeTokens,
  useThemeManifest,
  useThemeSettings,
  useColorScheme,
  useDirection,
  useReducedMotion,
} from './theme-engine';

export type {
  ColorScheme,
  ColorSchemePreference,
  Direction,
  DesignTokens,
  ThemeManifest,
  ThemeModule,
  ThemeSettings,
  ThemeSettingValue,
  ThemeContextValue,
} from './theme-engine';
