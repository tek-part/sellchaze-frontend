/**
 * Theme Marketplace — catalog contract.
 *
 * A `CatalogEntry` is the marketplace LISTING for an installable theme: the lightweight metadata a
 * shopper browses (name, archetype, price, screenshots, changelog) plus a lazy `load` to the theme
 * module — the SAME code-split loader mechanism the frozen engine registry consumes. Listing metadata
 * is intentionally available WITHOUT loading the theme module (browse before download); the platform
 * validator cross-checks it against the real manifest once the module is loaded.
 *
 * This module is the single declarative source of installable themes — adding a theme is one catalog
 * record (data), never an edit to engine, pages, or component wiring. The Theme Engine stays frozen.
 */
import type { ThemeCapability, ThemeLoader } from '../../theme-engine';

/** How a theme is monetised / entitled. */
export type LicenseType = 'free' | 'premium' | 'trial';

export interface ThemeLicense {
  readonly type: LicenseType;
  /** Premium: one-time price. */
  readonly price?: number;
  readonly currency?: string;
  /** Trial: evaluation window in days before activation is gated. */
  readonly trialDays?: number;
  /** Stable licence SKU for entitlement records. */
  readonly sku?: string;
}

export interface ChangelogEntry {
  readonly version: string;
  /** ISO date (YYYY-MM-DD). */
  readonly date: string;
  readonly notes: ReadonlyArray<string>;
}

/** A single marketplace listing. */
export interface CatalogEntry {
  readonly id: string;
  readonly name: string;
  /** Latest version the marketplace advertises (semver). */
  readonly version: string;
  readonly archetype: string;
  readonly description: string;
  readonly author: string;
  readonly tags: ReadonlyArray<string>;
  /** Brand swatch used on the marketplace card (CSS colour). */
  readonly accent: string;
  /** Secondary brand swatch for a gradient chip. */
  readonly accentAlt?: string;
  readonly previewImage?: string;
  /** Minimum engine version this listing requires (semver). */
  readonly minEngineVersion: string;
  readonly capabilities: ReadonlyArray<ThemeCapability>;
  readonly license: ThemeLicense;
  readonly changelog: ReadonlyArray<ChangelogEntry>;
  readonly featured?: boolean;
  /** Lazy module loader — code-split; only invoked on install/preview. */
  readonly load: ThemeLoader;
}

export type ThemeCatalog = ReadonlyArray<CatalogEntry>;
