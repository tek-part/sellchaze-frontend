/**
 * Storefront Theme Engine — public surface (permanently frozen architecture).
 *
 * Layers: Engine (registry/loader/migration/compatibility/validation) → Provider/Context
 * (tokens, scheme, direction, capabilities) → Renderer (page → sections, registry-driven) →
 * Sections/Widgets/Layouts (theme-owned, resolved by key). Plus lifecycle hooks and a
 * plugin/slot extension system. Theme-agnostic and stable. See ARCHITECTURE.md.
 */
export const THEME_ENGINE_VERSION = '1.0.0';

/* providers + context */
export { ThemeProvider, type ThemeProviderProps } from './ThemeProvider';
export { StorefrontEngineProvider, type StorefrontEngineProviderProps } from './StorefrontEngineProvider';
export { EngineContext, useEngine, type EngineContextValue } from './engine-context';
export {
  ThemeContext,
  useTheme,
  useThemeTokens,
  useThemeManifest,
  useThemeSettings,
  useColorScheme,
  useDirection,
  useReducedMotion,
  useThemeRegistries,
  useWidgetRegistry,
  useLayout,
  useTemplate,
  useCapabilities,
  useCapability,
} from './context';

/* engine core */
export { ThemeRegistry, themeRegistry } from './registry';
export { loadTheme, clearThemeCache } from './loader';
export { defaultSettings, resolveSettings } from './settings';
export { flattenTokens, applyTokensToElement } from './applyTokens';
export { ENGINE_VERSION, checkThemeCompatibility, type CompatibilityResult } from './compatibility';
export { parseSemVer, compareSemVer, satisfiesMinimum, type SemVer } from './semver';
export { validateTheme, type ValidationReport, type ValidationIssue, type ValidationLevel } from './validation';

/* registries (registry-driven resolution) */
export {
  Registry,
  buildThemeRegistries,
  type ThemeRegistries,
  type ThemeContentMaps,
} from './registries';

/* capabilities (feature detection — never theme-name checks) */
export {
  hasCapability,
  hasAllCapabilities,
  KNOWN_CAPABILITIES,
  type ThemeCapability,
  type KnownCapability,
  type HasCapabilities,
} from './capabilities';

/* manifest migration */
export {
  migrateManifest,
  CURRENT_MANIFEST_SCHEMA_VERSION,
  MANIFEST_MIGRATIONS,
  type ManifestMigration,
  type ManifestMigrationResult,
} from './migration';

/* rendering layer */
export { ThemeRenderer, type ThemeRendererProps } from './ThemeRenderer';
export { Slot, type SlotProps } from './Slot';
export { Widget, type WidgetProps } from './Widget';
export { Capability, type CapabilityProps } from './Capability';
export { SectionErrorBoundary, type SectionErrorBoundaryProps } from './SectionErrorBoundary';

/* lifecycle + plugins */
export {
  LifecycleManager,
  type ThemeLifecycle,
  type RenderPhaseInfo,
  type SectionPhaseInfo,
} from './lifecycle';
export {
  PluginManager,
  SlotRegistry,
  type StorefrontPlugin,
  type StorefrontPluginContext,
  type SlotRenderer,
  type SlotRenderProps,
  type SlotEntry,
} from './plugins';

/* types — tokens & theme */
export type {
  ColorScheme,
  ColorSchemePreference,
  Direction,
  ColorTokens,
  TypographyTokens,
  SpacingTokens,
  RadiusTokens,
  ShadowTokens,
  MotionTokens,
  SizeTokens,
  ZIndexTokens,
  BreakpointTokens,
  DesignTokens,
  TypeScaleStep,
  SpaceStep,
  ThemeSettingType,
  ThemeSettingValue,
  ThemeSettingField,
  ThemeSettingsSchema,
  ThemeSettings,
  ThemeManifest,
  ThemeModule,
  ThemeLoader,
  ThemeContextValue,
} from './types';

/* types — rendering */
export type {
  StorefrontContext,
  StorefrontStoreInfo,
  StorefrontSeoInfo,
  StorefrontNavigation,
  SectionInstance,
  PageDefinition,
  SectionRenderProps,
  SectionComponent,
  SectionMap,
  LayoutRenderProps,
  LayoutComponent,
  LayoutMap,
  WidgetRenderProps,
  WidgetComponent,
  WidgetMap,
  TemplateMap,
} from './rendering';
