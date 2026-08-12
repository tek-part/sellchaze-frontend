/**
 * ThemeProvider — the runtime that loads the active theme, resolves its tokens against
 * merchant settings, projects them onto the DOM as CSS custom properties, and exposes
 * everything via context. Manages colour-scheme (incl. `auto`), direction (LTR/RTL), and
 * reduced-motion. Fail-closed: an unknown theme id falls back to the configured default.
 *
 * React 18 / 19 compatible (no version-specific APIs). Presentation is theme-owned; this
 * engine component owns none of it.
 */
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { prefersDarkScheme, prefersReducedMotion, watchMedia } from '../../../shared/env/media';
import { applyTokensToElement } from './applyTokens';
import { ThemeContext } from './context';
import { loadTheme } from './loader';
import { ThemeRegistry, themeRegistry as defaultRegistry } from './registry';
import { resolveSettings } from './settings';
import { buildThemeRegistries } from './registries';
import type {
  ColorScheme,
  ColorSchemePreference,
  Direction,
  ThemeContextValue,
  ThemeModule,
  ThemeSettings,
  ThemeSettingValue,
} from './types';

export interface ThemeProviderProps {
  /** Active theme id (e.g. the merchant's selected theme). */
  themeId: string;
  /** Registry to resolve from. Defaults to the process-wide registry. */
  registry?: ThemeRegistry;
  /** Fallback theme id used when `themeId` is not registered. */
  fallbackId: string;
  /** Merchant setting overrides (validated/coerced against the theme schema). */
  settings?: Partial<Record<string, ThemeSettingValue>>;
  initialColorScheme?: ColorSchemePreference;
  initialDirection?: Direction;
  /**
   * Element that receives the `--token` custom properties + `dir`/`data-theme`. Defaults to
   * `document.documentElement` so the whole storefront inherits them. Pass a container to
   * scope the theme (e.g. embedding a preview).
   */
  target?: HTMLElement | null;
  /** Rendered while the theme module is loading (fail-closed, never a blank crash). */
  fallback?: ReactNode;
  children: ReactNode;
}

function resolveScheme(pref: ColorSchemePreference): ColorScheme {
  if (pref === 'auto') return prefersDarkScheme() ? 'dark' : 'light';
  return pref;
}

export function ThemeProvider(props: ThemeProviderProps): ReactElement | null {
  const {
    themeId,
    registry = defaultRegistry,
    fallbackId,
    settings: settingOverrides,
    initialColorScheme = 'auto',
    initialDirection = 'ltr',
    target,
    fallback = null,
    children,
  } = props;

  const [module, setModule] = useState<ThemeModule | null>(null);
  const [schemePref, setSchemePref] = useState<ColorSchemePreference>(initialColorScheme);
  const [direction, setDirection] = useState<Direction>(initialDirection);
  const [reducedMotion, setReducedMotion] = useState<boolean>(prefersReducedMotion);
  const [osScheme, setOsScheme] = useState<ColorScheme>(() => (prefersDarkScheme() ? 'dark' : 'light'));
  const [localSettings, setLocalSettings] = useState<Partial<Record<string, ThemeSettingValue>>>({});

  // Load (or fallback to) the active theme module whenever the id/registry changes.
  useEffect(() => {
    let active = true;
    loadTheme({ registry, id: themeId, fallbackId })
      .then((loaded) => {
        if (active) setModule(loaded);
      })
      .catch(() => {
        // The requested theme is registered but its chunk failed to load (transient network error).
        // The loader has evicted the failed entry; degrade to the reliably-bundled fallback theme so
        // the storefront still renders rather than staying blank on an unhandled rejection.
        if (!active || themeId === fallbackId) return;
        loadTheme({ registry, id: fallbackId, fallbackId })
          .then((loaded) => {
            if (active) setModule(loaded);
          })
          .catch(() => {
            /* fallback unavailable too — stay on the loading state (no throw) */
          });
      });
    return () => {
      active = false;
    };
  }, [registry, themeId, fallbackId]);

  // Track OS colour-scheme + reduced-motion for `auto` resolution.
  useEffect(() => watchMedia('(prefers-color-scheme: dark)', (m) => setOsScheme(m ? 'dark' : 'light')), []);
  useEffect(() => watchMedia('(prefers-reduced-motion: reduce)', setReducedMotion), []);

  const colorScheme: ColorScheme = schemePref === 'auto' ? osScheme : resolveScheme(schemePref);

  // Resolve settings (fail-safe) and tokens for the loaded module.
  const settings: ThemeSettings = useMemo(() => {
    if (!module) return Object.freeze({});
    return resolveSettings(module.manifest.settingsSchema, {
      ...settingOverrides,
      ...localSettings,
    });
  }, [module, settingOverrides, localSettings]);

  const tokens = useMemo(
    () => (module ? module.createTokens(settings) : null),
    [module, settings],
  );

  // Wrap the theme's authoring maps into resolvable registries (registry-driven rendering).
  const registries = useMemo(() => (module ? buildThemeRegistries(module) : null), [module]);

  // Project tokens onto the DOM + set dir/data-theme on every relevant change.
  useLayoutEffect(() => {
    const el = target ?? (typeof document !== 'undefined' ? document.documentElement : null);
    if (!el || !tokens) return;
    applyTokensToElement(el, tokens, colorScheme);
    el.setAttribute('dir', direction);

    let active = true;
    const reveal = (): void => {
      if (active) el.setAttribute('data-storefront-ready', 'true');
    };
    if (typeof document !== 'undefined' && document.fonts) {
      void document.fonts.ready.then(reveal);
    } else {
      reveal();
    }
    return () => {
      active = false;
    };
  }, [target, tokens, colorScheme, direction]);

  const updateSettings = useCallback((patch: Partial<Record<string, ThemeSettingValue>>) => {
    setLocalSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const value = useMemo<ThemeContextValue | null>(() => {
    if (!module || !tokens || !registries) return null;
    return {
      manifest: module.manifest,
      tokens,
      settings,
      registries,
      capabilities: module.manifest.capabilities,
      lifecycle: module.lifecycle,
      colorScheme,
      colorSchemePreference: schemePref,
      direction,
      reducedMotion,
      setColorSchemePreference: setSchemePref,
      setDirection,
      updateSettings,
    };
  }, [module, tokens, registries, settings, colorScheme, schemePref, direction, reducedMotion, updateSettings]);

  if (!value) return <>{fallback}</>;
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
