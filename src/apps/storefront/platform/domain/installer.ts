/**
 * Theme installer — orchestrates install / update / uninstall / import over the pure install state.
 * Composes the compatibility checker, validator, settings resolver (engine), licence grants, and
 * settings migration. Pure + clock-injected: every op takes the loaded `ThemeModule` and an `at`
 * timestamp, returning a new state (never mutates). The React layer loads the module then calls these.
 */
import { ENGINE_VERSION, resolveSettings, type ThemeModule, type ThemeSettingValue, type ValidationReport } from '../../theme-engine';
import type { CatalogEntry } from '../catalog/types';
import { checkEntryCompatibility } from './compatibility';
import { grantForInstall } from './licensing';
import { migrateThemeSettings, type SettingsMigration } from './migration';
import { validateInstallable } from './validator';
import {
  getRecord,
  putRecord,
  removeRecord,
  updateRecord,
  type InstallState,
  type ThemeInstallRecord,
} from './install-state';
import type { ThemePackage } from './packaging';

export interface InstallOptions {
  readonly module: ThemeModule;
  readonly at: string;
  readonly engineVersion?: string;
  /** Raw setting overrides (resolved against the theme schema). */
  readonly settings?: Partial<Record<string, ThemeSettingValue>>;
  /** Block install when validation has errors (default true). */
  readonly requireValid?: boolean;
}

export interface InstallResult {
  readonly ok: boolean;
  readonly state: InstallState;
  readonly record?: ThemeInstallRecord;
  readonly report?: ValidationReport;
  readonly error?: string;
}

/** Install (or reinstall) a catalogued theme from its loaded module. */
export function install(state: InstallState, entry: CatalogEntry, opts: InstallOptions): InstallResult {
  const engineVersion = opts.engineVersion ?? ENGINE_VERSION;
  const compat = checkEntryCompatibility(entry, engineVersion);
  if (!compat.compatible) return { ok: false, state, error: compat.reason ?? 'incompatible' };

  const report = validateInstallable(entry, opts.module, engineVersion);
  if (!report.valid && opts.requireValid !== false) {
    return { ok: false, state, report, error: report.errors[0]?.message ?? 'theme failed validation' };
  }

  const settings = resolveSettings(opts.module.manifest.settingsSchema, opts.settings);
  const record: ThemeInstallRecord = {
    id: entry.id,
    version: opts.module.manifest.version,
    installedAt: state.installed[entry.id]?.installedAt ?? opts.at,
    updatedAt: opts.at,
    settings,
    license: state.installed[entry.id]?.license ?? grantForInstall(entry.license, opts.at),
  };
  return { ok: true, state: putRecord(state, record), record, report };
}

/** Uninstall a theme (clears active if it was active). */
export function uninstall(state: InstallState, id: string): InstallState {
  return removeRecord(state, id);
}

export interface UpdateOptions {
  readonly module: ThemeModule;
  readonly at: string;
  readonly engineVersion?: string;
  readonly migrations?: ReadonlyArray<SettingsMigration>;
}

/** Update an installed theme to the loaded module's version, migrating + re-resolving its settings. */
export function updateInstalled(state: InstallState, entry: CatalogEntry, opts: UpdateOptions): InstallResult {
  const current = getRecord(state, entry.id);
  if (!current) return { ok: false, state, error: `“${entry.id}” is not installed` };
  const engineVersion = opts.engineVersion ?? ENGINE_VERSION;
  const compat = checkEntryCompatibility(entry, engineVersion);
  if (!compat.compatible) return { ok: false, state, error: compat.reason ?? 'incompatible' };

  const report = validateInstallable(entry, opts.module, engineVersion);
  if (!report.valid) return { ok: false, state, report, error: report.errors[0]?.message ?? 'update failed validation' };

  const nextVersion = opts.module.manifest.version;
  const migrated = migrateThemeSettings(entry.id, current.version, nextVersion, current.settings, opts.migrations);
  const settings = resolveSettings(opts.module.manifest.settingsSchema, migrated.settings);

  const record: ThemeInstallRecord = {
    ...current,
    version: nextVersion,
    updatedAt: opts.at,
    settings,
  };
  return { ok: true, state: putRecord(state, record), record, report };
}

/** Persist resolved settings for an installed theme (live editor save). */
export function setInstalledSettings(
  state: InstallState,
  id: string,
  settings: Readonly<Record<string, ThemeSettingValue>>,
  at: string,
): InstallState {
  return updateRecord(state, id, (record) => ({ ...record, settings, updatedAt: at }));
}

export interface ImportOptions {
  readonly module: ThemeModule;
  readonly at: string;
  readonly engineVersion?: string;
}

/**
 * Install a theme from an imported package: the package's settings are resolved against the target
 * module's schema (unknown keys dropped, invalid coerced), and scheme/direction carried over.
 */
export function installFromPackage(
  state: InstallState,
  entry: CatalogEntry,
  pkg: ThemePackage,
  opts: ImportOptions,
): InstallResult {
  const engineVersion = opts.engineVersion ?? ENGINE_VERSION;
  if (pkg.theme.id !== entry.id) {
    return { ok: false, state, error: `package is for “${pkg.theme.id}”, not “${entry.id}”` };
  }
  const compat = checkEntryCompatibility(entry, engineVersion);
  if (!compat.compatible) return { ok: false, state, error: compat.reason ?? 'incompatible' };

  const report = validateInstallable(entry, opts.module, engineVersion);
  if (!report.valid) return { ok: false, state, report, error: report.errors[0]?.message ?? 'theme failed validation' };

  const settings = resolveSettings(opts.module.manifest.settingsSchema, pkg.settings);
  const existing = state.installed[entry.id];
  const record: ThemeInstallRecord = {
    id: entry.id,
    version: opts.module.manifest.version,
    installedAt: existing?.installedAt ?? opts.at,
    updatedAt: opts.at,
    settings,
    ...(pkg.colorScheme ? { colorScheme: pkg.colorScheme } : {}),
    ...(pkg.direction ? { direction: pkg.direction } : {}),
    license: existing?.license ?? grantForInstall(entry.license, opts.at),
  };
  return { ok: true, state: putRecord(state, record), record, report };
}
