/**
 * Theme context + typed hooks.
 *
 * The rest of the storefront app consumes the active theme ONLY through these hooks and never
 * imports a theme package directly — so it never knows which theme is active (docs I1).
 */
import { createContext, useContext } from 'react';
import { invariant } from '../../../shared/utils/invariant';
import { hasCapability, type ThemeCapability } from './capabilities';
import type { Registry, ThemeRegistries } from './registries';
import type { LayoutComponent, PageDefinition, WidgetComponent } from './rendering';
import type {
  ColorScheme,
  Direction,
  DesignTokens,
  ThemeContextValue,
  ThemeManifest,
  ThemeSettings,
} from './types';

export const ThemeContext = createContext<ThemeContextValue | null>(null);
ThemeContext.displayName = 'StorefrontThemeContext';

/** Access the full active-theme context. Throws when used outside a `ThemeProvider`. */
export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  invariant(value, 'useTheme() must be used inside a <ThemeProvider>');
  return value;
}

export function useThemeTokens(): DesignTokens {
  return useTheme().tokens;
}

export function useThemeManifest(): ThemeManifest {
  return useTheme().manifest;
}

export function useThemeSettings(): ThemeSettings {
  return useTheme().settings;
}

export function useColorScheme(): ColorScheme {
  return useTheme().colorScheme;
}

export function useDirection(): Direction {
  return useTheme().direction;
}

export function useReducedMotion(): boolean {
  return useTheme().reducedMotion;
}

/* ----------------------------------------------------- registries + capabilities */

export function useThemeRegistries(): ThemeRegistries {
  return useTheme().registries;
}

export function useWidgetRegistry(): Registry<WidgetComponent> {
  return useTheme().registries.widgets;
}

/** Resolve a layout component by key (registry-driven). `undefined` when not provided. */
export function useLayout(name: string): LayoutComponent | undefined {
  return useTheme().registries.layouts.resolve(name);
}

/** Resolve a page/template definition by key (registry-driven). */
export function useTemplate(name: string): PageDefinition | undefined {
  return useTheme().registries.templates.resolve(name);
}

export function useCapabilities(): ReadonlyArray<ThemeCapability> {
  return useTheme().capabilities;
}

/** True when the active theme declares `capability` (feature-detection, never name checks). */
export function useCapability(capability: ThemeCapability): boolean {
  return hasCapability({ capabilities: useTheme().capabilities }, capability);
}
