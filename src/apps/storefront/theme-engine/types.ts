/**
 * Storefront Theme Engine — public type contract.
 *
 * The engine core knows NOTHING theme-specific. A theme is a self-contained package that
 * satisfies `ThemeModule`; the engine loads it, resolves its design tokens against merchant
 * settings, and exposes them via context. Adding Theme 2 / Theme 3 = shipping another
 * `ThemeModule` and registering it — no engine change.
 *
 * Mirrors the documented token system (docs/themes/theme-01-modern-luxury-fashion) and the
 * engine contract (docs/THEME-ENGINE-V2.md). Design specification is the source of truth.
 */
import type { LayoutMap, SectionMap, TemplateMap, WidgetMap } from './rendering';
import type { ThemeLifecycle } from './lifecycle';
import type { ThemeCapability } from './capabilities';
import type { ThemeRegistries } from './registries';

/* ------------------------------------------------------------------ scheme & direction */

export type ColorScheme = 'light' | 'dark';
/** Merchant-facing colour-scheme setting; `auto` follows the OS `prefers-color-scheme`. */
export type ColorSchemePreference = ColorScheme | 'auto';
export type Direction = 'ltr' | 'rtl';

/* --------------------------------------------------------------------------- tokens */

/** One resolved colour ramp (light or dark). Values are CSS colour strings. */
export interface ColorTokens {
  readonly primary: string;
  readonly onPrimary: string;
  readonly accent: string;
  /** AA-safe gold for *text* (the bright accent fails small-text contrast). */
  readonly accentInk: string;
  readonly bg: string;
  readonly surface: string;
  readonly surface2: string;
  readonly text: string;
  readonly muted: string;
  readonly border: string;
  readonly borderStrong: string;
  readonly sale: string;
  readonly success: string;
  readonly danger: string;
  readonly warning: string;
  readonly info: string;
  readonly scrim: string;
  readonly scrimSoft: string;
}

export type TypeScaleStep = '4xl' | '3xl' | '2xl' | 'xl' | 'lg' | 'md' | 'base' | 'sm' | 'xs';

export interface TypographyTokens {
  readonly fontSans: string;
  readonly fontSerif: string;
  readonly fontMono: string;
  readonly fontArabic: string;
  /** Fluid `clamp(...)` font sizes keyed by scale step. */
  readonly fontSize: Readonly<Record<TypeScaleStep, string>>;
  readonly lineHeight: string;
  readonly lineHeightTight: string;
  readonly trackingEyebrow: string;
  readonly trackingCaps: string;
}

export type SpaceStep =
  | 'sp0' | 'sp1' | 'sp2' | 'sp3' | 'sp4' | 'sp5' | 'sp6'
  | 'sp7' | 'sp8' | 'sp9' | 'sp10' | 'sp11' | 'sp12';

export interface SpacingTokens {
  readonly scale: Readonly<Record<SpaceStep, string>>;
  readonly sectionY: string;
  readonly gutter: string;
  readonly gridGap: string;
  readonly stack: string;
  readonly container: string;
  readonly containerNarrow: string;
  readonly tap: string;
}

export interface RadiusTokens {
  readonly sm: string;
  readonly base: string;
  readonly lg: string;
  readonly pill: string;
}

export interface ShadowTokens {
  readonly sm: string;
  readonly base: string;
  readonly lg: string;
  readonly focus: string;
  readonly inset: string;
}

export interface MotionTokens {
  readonly ease: string;
  readonly easeInOut: string;
  readonly easeEmphasis: string;
  readonly transition: string;
  readonly transitionSlow: string;
  readonly transitionFast: string;
}

export interface SizeTokens {
  readonly iconSm: string;
  readonly iconMd: string;
  readonly iconLg: string;
}

export interface ZIndexTokens {
  readonly base: number;
  readonly sticky: number;
  readonly header: number;
  readonly dropdown: number;
  readonly overlay: number;
  readonly drawer: number;
  readonly modal: number;
  readonly toast: number;
}

/**
 * Breakpoints are exported as raw pixel numbers, NOT CSS variables — CSS media queries
 * cannot read custom properties. Themes/components consume these for JS + Tailwind.
 */
export interface BreakpointTokens {
  readonly sm: number;
  readonly md: number;
  readonly lg: number;
  readonly xl: number;
  readonly '2xl': number;
}

/**
 * The complete design-token set for a theme. Colours carry both schemes; the provider emits
 * the active scheme's colours as CSS custom properties and swaps them on scheme change.
 */
export interface DesignTokens {
  readonly color: Readonly<Record<ColorScheme, ColorTokens>>;
  readonly typography: TypographyTokens;
  readonly spacing: SpacingTokens;
  readonly radius: RadiusTokens;
  readonly shadow: ShadowTokens;
  readonly motion: MotionTokens;
  readonly size: SizeTokens;
  readonly zIndex: ZIndexTokens;
  readonly breakpoints: BreakpointTokens;
}

/* ---------------------------------------------------------------- settings (schema) */

/** The closed set of setting field types the engine understands (mirrors the manifest contract). */
export type ThemeSettingType =
  | 'text' | 'textarea' | 'color' | 'richtext'
  | 'select' | 'image' | 'url'
  | 'toggle' | 'number' | 'range';

export type ThemeSettingValue = string | number | boolean;

export interface ThemeSettingFieldBase {
  readonly id: string;
  readonly label: string;
  readonly group?: string;
  readonly help?: string;
}

export interface ThemeSelectField extends ThemeSettingFieldBase {
  readonly type: 'select';
  readonly options: ReadonlyArray<{ readonly value: string; readonly label: string }>;
  readonly default: string;
}
export interface ThemeRangeField extends ThemeSettingFieldBase {
  readonly type: 'range' | 'number';
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly default: number;
}
export interface ThemeToggleField extends ThemeSettingFieldBase {
  readonly type: 'toggle';
  readonly default: boolean;
}
export interface ThemeStringField extends ThemeSettingFieldBase {
  readonly type: 'text' | 'textarea' | 'color' | 'richtext' | 'image' | 'url';
  readonly default: string;
}

export type ThemeSettingField =
  | ThemeSelectField
  | ThemeRangeField
  | ThemeToggleField
  | ThemeStringField;

export type ThemeSettingsSchema = ReadonlyArray<ThemeSettingField>;
export type ThemeSettings = Readonly<Record<string, ThemeSettingValue>>;

/* --------------------------------------------------------------------- manifest */

export interface ThemeManifest {
  /** Stable, unique, lowercase key — the addressing handle across registry/loader/context. */
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly author: string;
  /** Style archetype (e.g. "Luxury Fashion") — presentation metadata only. */
  readonly archetype: string;
  readonly tags: ReadonlyArray<string>;
  readonly previewImage?: string;
  /**
   * Manifest-shape version. Older shapes are migrated forward by the engine before validation
   * and rendering (see migration.ts), so themes keep working across engine upgrades.
   */
  readonly schemaVersion: number;
  /** Structural support the engine needs to know (which colour schemes exist). */
  readonly supports: {
    readonly colorSchemes: ReadonlyArray<ColorScheme>;
  };
  /**
   * Declared feature capabilities (e.g. 'rtl', 'dark-mode', 'mega-menu', 'wishlist'). The engine
   * and feature code determine availability from THIS list — never from the theme's name/id.
   */
  readonly capabilities: ReadonlyArray<ThemeCapability>;
  /** Minimum engine version this theme requires (semver). */
  readonly minEngineVersion: string;
  readonly settingsSchema: ThemeSettingsSchema;
}

/* ----------------------------------------------------------------- theme module */

/**
 * A theme package. The engine consumes exactly this shape and nothing more.
 * `createTokens` is a pure function of resolved settings → design tokens, so merchant
 * settings can restyle the theme without the engine knowing any theme specifics.
 */
export interface ThemeModule {
  readonly manifest: ThemeManifest;
  /** Base tokens (settings applied at their defaults). */
  readonly tokens: DesignTokens;
  /** Fully-defaulted settings for this theme. */
  readonly defaultSettings: ThemeSettings;
  /** Pure: merge validated settings into a concrete token set. */
  readonly createTokens: (settings: ThemeSettings) => DesignTokens;
  /** Section authoring map (`type` → component). Wrapped into a registry by the engine. */
  readonly sections?: SectionMap;
  /** Layout/shell authoring map. */
  readonly layouts?: LayoutMap;
  /** Reusable widget authoring map (resolved by key, never imported directly). */
  readonly widgets?: WidgetMap;
  /** Default page compositions per template (home/product/category/…). */
  readonly templates?: TemplateMap;
  /** Optional theme-level lifecycle observers. */
  readonly lifecycle?: ThemeLifecycle;
}

/** A theme is registered either eagerly or as a lazy loader (for code-splitting). */
export type ThemeLoader = () => ThemeModule | Promise<ThemeModule>;

/* --------------------------------------------------------------------- context */

export interface ThemeContextValue {
  readonly manifest: ThemeManifest;
  /** Tokens resolved for the current settings (both schemes present). */
  readonly tokens: DesignTokens;
  readonly settings: ThemeSettings;
  /** Resolvable registries (sections, layouts, widgets, templates) for the active theme. */
  readonly registries: ThemeRegistries;
  /** The active theme's declared capabilities. */
  readonly capabilities: ReadonlyArray<ThemeCapability>;
  /** Active theme's lifecycle observers, if any. */
  readonly lifecycle?: ThemeLifecycle;
  /** The scheme currently applied to the DOM (never `auto` — resolved). */
  readonly colorScheme: ColorScheme;
  /** The merchant/user preference (`auto` follows the OS). */
  readonly colorSchemePreference: ColorSchemePreference;
  readonly direction: Direction;
  readonly reducedMotion: boolean;
  readonly setColorSchemePreference: (preference: ColorSchemePreference) => void;
  readonly setDirection: (direction: Direction) => void;
  readonly updateSettings: (patch: Partial<Record<string, ThemeSettingValue>>) => void;
}
