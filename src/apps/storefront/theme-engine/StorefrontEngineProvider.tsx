/**
 * StorefrontEngineProvider — the outermost engine boundary. Composes the given plugins into a
 * `PluginManager` (runs their `setup`), and provides it via `EngineContext`. Sits above the
 * `ThemeProvider`; the engine layer never depends on which theme is active.
 */
import { useMemo, type ReactElement, type ReactNode } from 'react';
import { EngineContext, type EngineContextValue } from './engine-context';
import { PluginManager, type StorefrontPlugin } from './plugins';

export interface StorefrontEngineProviderProps {
  /** Optional storefront feature plugins. Pass a stable array. */
  plugins?: ReadonlyArray<StorefrontPlugin>;
  children: ReactNode;
}

export function StorefrontEngineProvider(props: StorefrontEngineProviderProps): ReactElement {
  const { plugins, children } = props;

  const manager = useMemo(() => {
    const m = new PluginManager();
    for (const plugin of plugins ?? []) m.use(plugin);
    m.init();
    return m;
  }, [plugins]);

  const value = useMemo<EngineContextValue>(() => ({ plugins: manager }), [manager]);

  return <EngineContext.Provider value={value}>{children}</EngineContext.Provider>;
}
