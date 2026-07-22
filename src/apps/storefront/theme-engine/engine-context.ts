/**
 * Engine context — exposes the composed `PluginManager` (its aggregated lifecycle hooks, slot
 * registry, and services) to descendants. Separate from `ThemeContext`: the engine layer is
 * theme-independent, so plugins + slots live here and outlive any single active theme.
 */
import { createContext, useContext } from 'react';
import { invariant } from '../../../shared/utils/invariant';
import type { PluginManager } from './plugins';

export interface EngineContextValue {
  readonly plugins: PluginManager;
}

export const EngineContext = createContext<EngineContextValue | null>(null);
EngineContext.displayName = 'StorefrontEngineContext';

export function useEngine(): EngineContextValue {
  const value = useContext(EngineContext);
  invariant(value, 'useEngine() must be used inside a <StorefrontEngineProvider>');
  return value;
}
