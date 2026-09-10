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

/**
 * The closed set of setting field types the engine understands (mirrors the manifest contract,
 * docs/THEME_SECTIONS_CONTRACT.md §1). `list` is a repeater of flat objects; `product`/`category`/
 * `collection` hold the referenced id/slug as a string.
 */
export type ThemeSettingType =
  | 'text' | 'textarea' | 'color' | 'richtext'
  | 'select' | 'image' | 'url'
  | 'toggle' | 'number' | 'range'
  | 'list' | 'product' | 'category' | 'collection';

/** A single resolved scalar setting value. */
export type ThemeSettingScalar = string | number | boolean;
/** A translatable default/raw text: one string per locale (`{ ar: '…', en: '…' }`). */
export type ThemeLocalizedText = Readonly<Record<string, string>>;
/** What a schema DEFAULT may be for a scalar field: a scalar, or a locale map for translatable text. */
export type ThemeSettingDefaultScalar = ThemeSettingScalar | ThemeLocalizedText;
/** One resolved item of a `list` field — a flat object keyed by the item field ids. */
export type ThemeSettingListItem = Readonly<Record<string, ThemeSettingScalar>>;
/** A resolved setting value: a scalar or (for `list` fields) an array of flat items. */
export type ThemeSettingValue = ThemeSettingScalar | ReadonlyArray<ThemeSettingListItem>;

/** CSS properties a responsive `range` may drive (contract §1 `css_property`). */
export type ThemeSettingCssProperty = 'padding-block' | 'padding-inline' | 'margin-block' | 'gap' | 'font-size';

export interface ThemeSettingFieldBase {
  readonly id: string;
  readonly label: string;
  readonly group?: string;
  /** @deprecated alias of `hint` kept for the existing themes. */
  readonly help?: string;
  /** Short helper copy shown under the control in the editor. */
  readonly hint?: string;
  /** text/textarea/richtext: the stored value may be a string or a `{ ar, en }` locale map. */
  readonly translatable?: boolean;
  /** range with `css_property`: the editor offers a per-viewport override. */
  readonly responsive?: boolean;
  readonly css_property?: ThemeSettingCssProperty;
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
  /** A plain string, or — for `translatable` text — a `{ ar, en }` map resolved per locale. */
  readonly default: string | ThemeLocalizedText;
}
/** A reference to a catalogue entity — the value is its id/slug (empty string = none). */
export interface ThemeReferenceField extends ThemeSettingFieldBase {
  readonly type: 'product' | 'category' | 'collection';
  readonly default: string;
}

/** Fields allowed inside a `list` item (no nested lists). */
export type ThemeListItemField =
  | ThemeSelectField
  | ThemeRangeField
  | ThemeToggleField
  | ThemeStringField
  | ThemeReferenceField;

/** A repeater: an array of flat objects, each validated against `item`. `max` caps the item count. */
export interface ThemeListField extends ThemeSettingFieldBase {
  readonly type: 'list';
  readonly item: ReadonlyArray<ThemeListItemField>;
  readonly max?: number;
  readonly default: ReadonlyArray<Readonly<Record<string, ThemeSettingDefaultScalar>>>;
}

export type ThemeSettingField = ThemeListItemField | ThemeListField;

export type ThemeSettingsSchema = ReadonlyArray<ThemeSettingField>;
export type ThemeSettings = Readonly<Record<string, ThemeSettingValue>>;

/* -------------------------------------------------------------- section schema */

/**
 * Editor-facing description of one section type (contract §1 `SectionSchema`). The section library
 * (`sections-lib`) authors these; a theme may ship overrides on `ThemeModule.sectionSchemas`. The
 * engine only carries the shape so the manifest export can read it without importing the library.
 */
export type ThemeSectionCategory = 'hero' | 'products' | 'categories' | 'content' | 'marketing' | 'social' | 'layout';

/** One display style of a section (contract §7 `variants.options[]`). */
export interface ThemeVariantOption {
  readonly value: string;
  readonly label: string;
  readonly description?: string;
  /** react-icons/hi2 name shown in the visual picker. */
  readonly icon?: string;
}

/** Display styles of a section: a visual picker stored in `settings[field]` (contract §7). */
export interface ThemeSectionVariants {
  readonly field: string;
  readonly options: ReadonlyArray<ThemeVariantOption>;
  /**
   * Frontend-only: older stored keys/values that map onto a variant (e.g. `style: 'plain'` →
   * `icons-row`), read when `settings[field]` is absent. Not exported to the manifest.
   */
  readonly legacy?: ReadonlyArray<{ readonly field: string; readonly map: Readonly<Record<string, string>> }>;
}

/** A nested component type the merchant can add/reorder/remove inside a section (contract §7). */
export interface ThemeBlockSchema {
  readonly type: string;
  readonly label: string;
  readonly icon?: string;
  /** Flat fields (no nested lists) — the block's `settings` are validated against them. */
  readonly settings: ReadonlyArray<ThemeListItemField>;
  /** Max instances of this block type in one section. */
  readonly limit?: number;
}

export interface ThemeSectionBlocks {
  readonly types: ReadonlyArray<ThemeBlockSchema>;
  readonly min?: number;
  readonly max?: number;
  /**
   * Id of the legacy `list` field this section used for the same items. Read when `blocks` is
   * absent/empty so stored data from before §7 keeps rendering; the editor hides the list and
   * migrates it into blocks on first edit.
   */
  readonly legacy?: string;
}

/** A stored block instance inside `settings.blocks` (raw values; validated by the section). */
export interface ThemeSettingBlock {
  readonly id: string;
  readonly type: string;
  readonly hidden?: boolean;
  readonly settings?: Readonly<Record<string, unknown>>;
}

export interface ThemeSectionSchema {
  readonly type: string;
  readonly label: string;
  readonly description?: string;
  readonly category: ThemeSectionCategory;
  /** react-icons/hi2 name, e.g. 'HiOutlinePhoto'. */
  readonly icon?: string;
  readonly settings: ThemeSettingsSchema;
  readonly presets?: ReadonlyArray<{ readonly label: string; readonly settings: Readonly<Record<string, unknown>> }>;
  /** Display styles rendered as a visual picker; stored in `settings[variants.field]` (§7). */
  readonly variants?: ThemeSectionVariants;
  /** Nested blocks the merchant composes inside the section (§7). */
  readonly blocks?: ThemeSectionBlocks;
  /** Show the shared "Section style" group (default true) — applied by the library `SectionFrame`. */
  readonly style?: boolean;
}

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
  /** Marketplace category key (e.g. "general", "fashion"). Falls back to the archetype on export. */
  readonly category?: string;
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
  /**
   * Editor schemas for the section types this theme renders (contract §1/§2). Themes built on the
   * section library get these from `sections-lib`; the manifest export reads them from here.
   */
  readonly sectionSchemas?: ReadonlyArray<ThemeSectionSchema>;
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
