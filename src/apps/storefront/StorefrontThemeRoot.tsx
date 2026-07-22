/**
 * StorefrontThemeRoot — the single mount point the rest of the storefront renders inside.
 *
 * It registers the theme packages, then wraps `children` in the engine's `ThemeProvider` for
 * the active theme. Everything below it consumes the theme purely through engine hooks and
 * never knows which theme is active. Swapping the merchant's theme is a prop change.
 */
import { useEffect, useState, type ReactElement, type ReactNode } from 'react';
import { StorefrontEngineProvider, ThemeProvider } from './theme-engine';
import type {
  ColorSchemePreference,
  Direction,
  StorefrontPlugin,
  ThemeSettingValue,
} from './theme-engine';
import { storefrontConfig } from './config/storefront.config';
import { registerThemes } from './themes/registry';

export interface StorefrontThemeRootProps {
  /** Merchant's active theme id. Defaults to the configured default. */
  themeId?: string;
  /** Merchant setting overrides (validated against the theme schema). */
  settings?: Partial<Record<string, ThemeSettingValue>>;
  colorScheme?: ColorSchemePreference;
  direction?: Direction;
  /** Optional storefront feature plugins (analytics, recently-viewed, …). Pass a stable array. */
  plugins?: ReadonlyArray<StorefrontPlugin>;
  children: ReactNode;
}

export function StorefrontThemeRoot(props: StorefrontThemeRootProps): ReactElement | null {
  const {
    themeId = storefrontConfig.defaultThemeId,
    settings,
    colorScheme,
    direction,
    plugins,
    children,
  } = props;

  // Register theme packages once, before the provider resolves the active theme.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    registerThemes();
    setReady(true);
  }, []);

  if (!ready) return null;

  return (
    <StorefrontEngineProvider {...(plugins ? { plugins } : {})}>
      <ThemeProvider
        themeId={themeId}
        fallbackId={storefrontConfig.fallbackThemeId}
        {...(settings ? { settings } : {})}
        {...(colorScheme ? { initialColorScheme: colorScheme } : {})}
        {...(direction ? { initialDirection: direction } : {})}
      >
        {children}
      </ThemeProvider>
    </StorefrontEngineProvider>
  );
}
