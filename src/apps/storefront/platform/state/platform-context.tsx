/**
 * Platform context — the React binding over the pure domain layer. Holds the persisted install
 * state, loads/caches theme modules on demand (code-split), and exposes install / uninstall /
 * activate / update / edit / import / export / licence actions. All mutations flow through the pure
 * domain functions with an injected clock; the engine stays frozen. Persistence is the localStorage
 * port (fail-safe).
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import {
  ENGINE_VERSION,
  resolveSettings,
  type ColorSchemePreference,
  type Direction,
  type ThemeModule,
  type ThemeSettingValue,
} from '../../theme-engine';
import { getCatalogEntry, listCatalog } from '../catalog/catalog';
import type { ThemeCatalog } from '../catalog/types';
import {
  PLATFORM_STORAGE_KEY,
  activate,
  activateLicense,
  checkEntryCompatibility,
  createLocalStoragePort,
  deactivate,
  detectUpdates,
  install,
  installFromPackage,
  packageFromRecord,
  parsePackage,
  serializePackage,
  setInstalledSettings,
  uninstall,
  updateInstalled,
  updateRecord,
  validateInstallable,
  type InstallState,
  type ThemeInstallRecord,
  type UpdateInfo,
} from '../domain';

const now = (): string => new Date().toISOString();

export interface PlatformContextValue {
  readonly catalog: ThemeCatalog;
  readonly state: InstallState;
  readonly engineVersion: string;
  readonly updates: ReadonlyArray<UpdateInfo>;
  /** Per-theme in-flight flag (install/update/etc.). */
  readonly pending: ReadonlySet<string>;
  readonly notice: string | null;
  readonly error: string | null;
  clearMessages(): void;
  /** Load (and cache) a theme module by id. Returns null on failure. */
  loadModule(id: string): Promise<ThemeModule | null>;
  installTheme(id: string): Promise<void>;
  uninstallTheme(id: string): void;
  activateTheme(id: string): void;
  deactivateTheme(): void;
  updateTheme(id: string): Promise<void>;
  saveSettings(id: string, settings: Partial<Record<string, ThemeSettingValue>>): Promise<void>;
  setRecordScheme(id: string, scheme: ColorSchemePreference): void;
  setRecordDirection(id: string, direction: Direction): void;
  activateLicenseFor(id: string, key: string): void;
  exportTheme(id: string): string | null;
  importPackageJson(json: string): Promise<void>;
}

const PlatformContext = createContext<PlatformContextValue | null>(null);

export function PlatformProvider(props: { children: ReactNode }): ReactElement {
  const portRef = useRef(createLocalStoragePort(PLATFORM_STORAGE_KEY));
  const [state, setState] = useState<InstallState>(() => portRef.current.load());
  const [pending, setPending] = useState<ReadonlySet<string>>(new Set());
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const modules = useRef(new Map<string, ThemeModule>());
  const catalog = listCatalog();

  // Always-current mirror of state for pre-checks inside async actions (mutations still go through
  // functional setState so concurrent operations compose).
  const stateRef = useRef(state);

  // Persist on every state change (fail-safe port) + keep the mirror fresh.
  useEffect(() => {
    stateRef.current = state;
    portRef.current.save(state);
  }, [state]);

  const mark = useCallback((id: string, on: boolean) => {
    setPending((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const loadModule = useCallback(async (id: string): Promise<ThemeModule | null> => {
    const cached = modules.current.get(id);
    if (cached) return cached;
    const entry = getCatalogEntry(id);
    if (!entry) return null;
    try {
      const module = await entry.load();
      modules.current.set(id, module);
      return module;
    } catch (e) {
      setError(`Failed to load “${id}”: ${String(e)}`);
      return null;
    }
  }, []);

  const installTheme = useCallback(
    async (id: string): Promise<void> => {
      const entry = getCatalogEntry(id);
      if (!entry) return;
      mark(id, true);
      setError(null);
      const module = await loadModule(id);
      if (!module) {
        mark(id, false);
        return;
      }
      // Pure pre-checks (state-independent) drive messaging; the actual mutation is a functional
      // update so concurrent installs compose instead of clobbering each other.
      const compat = checkEntryCompatibility(entry);
      if (!compat.compatible) {
        setError(compat.reason ?? 'Incompatible with this engine.');
        mark(id, false);
        return;
      }
      const report = validateInstallable(entry, module);
      if (!report.valid) {
        setError(report.errors[0]?.message ?? 'Theme failed validation.');
        mark(id, false);
        return;
      }
      setState((prev) => install(prev, entry, { module, at: now(), requireValid: false }).state);
      setNotice(`Installed ${entry.name}.`);
      mark(id, false);
    },
    [loadModule, mark],
  );

  const uninstallTheme = useCallback((id: string): void => {
    setState((s) => uninstall(s, id));
    setNotice('Theme uninstalled.');
  }, []);

  const activateTheme = useCallback((id: string): void => {
    setState((s) => {
      const result = activate(s, id, now());
      if (!result.ok) {
        setError(result.error ?? 'Activation failed.');
        return s;
      }
      setNotice('Theme activated — it is now live.');
      setError(null);
      return result.state;
    });
  }, []);

  const deactivateTheme = useCallback((): void => {
    setState((s) => deactivate(s));
  }, []);

  const updateTheme = useCallback(
    async (id: string): Promise<void> => {
      const entry = getCatalogEntry(id);
      if (!entry) return;
      mark(id, true);
      setError(null);
      const module = await loadModule(id);
      if (!module) {
        mark(id, false);
        return;
      }
      if (!stateRef.current.installed[id]) {
        setError(`“${entry.id}” is not installed.`);
        mark(id, false);
        return;
      }
      const report = validateInstallable(entry, module);
      if (!report.valid) {
        setError(report.errors[0]?.message ?? 'Update failed validation.');
        mark(id, false);
        return;
      }
      setState((prev) => updateInstalled(prev, entry, { module, at: now() }).state);
      setNotice(`Updated ${entry.name} to v${module.manifest.version}.`);
      mark(id, false);
    },
    [loadModule, mark],
  );

  const saveSettings = useCallback(
    async (id: string, settings: Partial<Record<string, ThemeSettingValue>>): Promise<void> => {
      const module = await loadModule(id);
      if (!module) return;
      const resolved = resolveSettings(module.manifest.settingsSchema, settings);
      setState((s) => setInstalledSettings(s, id, resolved, now()));
      setNotice('Settings saved.');
    },
    [loadModule],
  );

  const setRecordScheme = useCallback((id: string, scheme: ColorSchemePreference): void => {
    setState((s) => updateRecord(s, id, (r) => ({ ...r, colorScheme: scheme, updatedAt: now() })));
  }, []);

  const setRecordDirection = useCallback((id: string, direction: Direction): void => {
    setState((s) => updateRecord(s, id, (r) => ({ ...r, direction, updatedAt: now() })));
  }, []);

  const activateLicenseFor = useCallback((id: string, key: string): void => {
    setState((s) =>
      updateRecord(s, id, (r) => ({ ...r, license: activateLicense(r.license, key, now()) })),
    );
    setNotice('Licence activated.');
  }, []);

  const exportTheme = useCallback(
    (id: string): string | null => {
      const record = state.installed[id];
      const entry = getCatalogEntry(id);
      if (!record) return null;
      const pkg = packageFromRecord(record, now(), entry ? { name: entry.name, author: entry.author } : undefined);
      return serializePackage(pkg);
    },
    [state],
  );

  const importPackageJson = useCallback(
    async (json: string): Promise<void> => {
      const parsed = parsePackage(json);
      if (!parsed.ok) {
        setError(`Import failed: ${parsed.error}.`);
        return;
      }
      const entry = getCatalogEntry(parsed.package.theme.id);
      if (!entry) {
        setError(`Import failed: “${parsed.package.theme.id}” is not in the marketplace.`);
        return;
      }
      mark(entry.id, true);
      const module = await loadModule(entry.id);
      if (!module) {
        mark(entry.id, false);
        return;
      }
      const compat = checkEntryCompatibility(entry);
      if (!compat.compatible) {
        setError(compat.reason ?? 'Incompatible with this engine.');
        mark(entry.id, false);
        return;
      }
      const report = validateInstallable(entry, module);
      if (!report.valid) {
        setError(report.errors[0]?.message ?? 'Theme failed validation.');
        mark(entry.id, false);
        return;
      }
      setState((prev) => installFromPackage(prev, entry, parsed.package, { module, at: now() }).state);
      setNotice(`Imported settings for ${entry.name}.`);
      mark(entry.id, false);
    },
    [loadModule, mark],
  );

  const clearMessages = useCallback((): void => {
    setNotice(null);
    setError(null);
  }, []);

  const updates = useMemo(() => detectUpdates(state, catalog), [state, catalog]);

  const value = useMemo<PlatformContextValue>(
    () => ({
      catalog,
      state,
      engineVersion: ENGINE_VERSION,
      updates,
      pending,
      notice,
      error,
      clearMessages,
      loadModule,
      installTheme,
      uninstallTheme,
      activateTheme,
      deactivateTheme,
      updateTheme,
      saveSettings,
      setRecordScheme,
      setRecordDirection,
      activateLicenseFor,
      exportTheme,
      importPackageJson,
    }),
    [
      catalog,
      state,
      updates,
      pending,
      notice,
      error,
      clearMessages,
      loadModule,
      installTheme,
      uninstallTheme,
      activateTheme,
      deactivateTheme,
      updateTheme,
      saveSettings,
      setRecordScheme,
      setRecordDirection,
      activateLicenseFor,
      exportTheme,
      importPackageJson,
    ],
  );

  return <PlatformContext.Provider value={value}>{props.children}</PlatformContext.Provider>;
}

export function usePlatform(): PlatformContextValue {
  const ctx = useContext(PlatformContext);
  if (!ctx) throw new Error('usePlatform must be used within a PlatformProvider');
  return ctx;
}

/** Convenience selector for a single installed record. */
export function useInstallRecord(id: string): ThemeInstallRecord | undefined {
  const { state } = usePlatform();
  return state.installed[id];
}
