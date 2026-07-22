/**
 * Rendering-layer contracts: Engine → Renderer → Sections → Components.
 *
 * A page is a list of section instances; a theme provides a section registry mapping each
 * section `type` to a component. The engine's `ThemeRenderer` walks the page and renders each
 * section from the active theme's registry — with per-section isolation and graceful drop of
 * unknown types (docs/THEME-ENGINE-V2 §10/§15). All of this is theme-agnostic.
 */
import type { ComponentType, ReactNode } from 'react';
import type { ThemeSettings } from './types';

/* ------------------------------------------------------------------ render context */

/**
 * The tenant-scoped, read-only data a theme renders from. Mirrors the documented data
 * contract (docs/THEME-ENGINE-V2 §11). `data` stays open here and is refined in later phases
 * as concrete storefront APIs are wired; sections must always tolerate missing fields.
 */
export interface StorefrontStoreInfo {
  readonly name: string;
  readonly currency: string;
  readonly logo?: string;
  readonly description?: string;
  readonly email?: string;
  readonly phone?: string;
}

export interface StorefrontSeoInfo {
  readonly title?: string;
  readonly description?: string;
  readonly canonical?: string;
  readonly ogImage?: string;
}

export interface StorefrontNavigation {
  readonly header: ReadonlyArray<unknown>;
  readonly footer: ReadonlyArray<unknown>;
}

export interface StorefrontContext {
  readonly store: StorefrontStoreInfo;
  readonly seo: StorefrontSeoInfo;
  readonly navigation: StorefrontNavigation;
  /** Page/template-specific data (products, category, etc.) — refined in later phases. */
  readonly data: Readonly<Record<string, unknown>>;
}

/* --------------------------------------------------------------------- page shape */

/** A single placed section within a page/template. */
export interface SectionInstance {
  readonly type: string;
  /** Stable instance id (for keys, analytics, anchors). */
  readonly id?: string;
  /** Per-instance setting overrides for this section. */
  readonly settings?: ThemeSettings;
}

/** A page/template = an ordered list of section instances. */
export interface PageDefinition {
  readonly template: string;
  readonly sections: ReadonlyArray<SectionInstance>;
}

/* ------------------------------------------------------------ section & layout comps */

/** Props every section component receives. Themes own the markup; the engine owns the call. */
export interface SectionRenderProps {
  readonly instance: SectionInstance;
  readonly settings: ThemeSettings;
  readonly context: StorefrontContext;
}

export type SectionComponent = ComponentType<SectionRenderProps>;
/** Authoring map a theme provides: section `type` → component. The engine wraps it in a Registry. */
export type SectionMap = Readonly<Record<string, SectionComponent>>;

/** Props a layout (shell) component receives. */
export interface LayoutRenderProps {
  readonly context: StorefrontContext;
  readonly children: ReactNode;
}

export type LayoutComponent = ComponentType<LayoutRenderProps>;
export type LayoutMap = Readonly<Record<string, LayoutComponent>>;

/**
 * A reusable widget — a component addressed by key through the widget registry, so sections and
 * layouts compose it without importing a concrete component (registry-driven resolution).
 */
export interface WidgetRenderProps {
  readonly context: StorefrontContext | null;
  readonly params?: Readonly<Record<string, unknown>>;
}
export type WidgetComponent = ComponentType<WidgetRenderProps>;
export type WidgetMap = Readonly<Record<string, WidgetComponent>>;

/** Authoring map of default page compositions per template (home/product/category/…). */
export type TemplateMap = Readonly<Record<string, PageDefinition>>;
