/**
 * Install state — the platform's persistent model of which themes are installed, which is active,
 * and each install's settings + licence. Pure data + pure reducers (no engine, no I/O, no clock).
 * Timestamps are passed in by callers so every operation is deterministic and unit-testable.
 */
import type { ColorSchemePreference, Direction, ThemeSettingValue } from '../../theme-engine';
import type { LicenseGrant } from './licensing';

/** State-schema version — bump + migrate in `storage.normalizeState` on a breaking shape change. */
export const INSTALL_STATE_VERSION = 1 as const;

export interface ThemeInstallRecord {
  readonly id: string;
  /** Version recorded at install / last update (semver). */
  readonly version: string;
  readonly installedAt: string;
  readonly updatedAt: string;
  /** Merchant setting overrides (already resolved against the theme schema). */
  readonly settings: Readonly<Record<string, ThemeSettingValue>>;
  readonly colorScheme?: ColorSchemePreference;
  readonly direction?: Direction;
  readonly license: LicenseGrant;
}

export interface InstallState {
  readonly version: typeof INSTALL_STATE_VERSION;
  readonly installed: Readonly<Record<string, ThemeInstallRecord>>;
  readonly activeId: string | null;
}

export const EMPTY_STATE: InstallState = {
  version: INSTALL_STATE_VERSION,
  installed: {},
  activeId: null,
};

/* ------------------------------------------------------------------ queries */

export function isInstalled(state: InstallState, id: string): boolean {
  return Object.prototype.hasOwnProperty.call(state.installed, id);
}

export function getRecord(state: InstallState, id: string): ThemeInstallRecord | undefined {
  return state.installed[id];
}

export function listInstalled(state: InstallState): ReadonlyArray<ThemeInstallRecord> {
  return Object.values(state.installed);
}

export function getActiveRecord(state: InstallState): ThemeInstallRecord | null {
  return state.activeId ? state.installed[state.activeId] ?? null : null;
}

/* ------------------------------------------------------------------ reducers (pure) */

/** Insert or replace an install record. */
export function putRecord(state: InstallState, record: ThemeInstallRecord): InstallState {
  return { ...state, installed: { ...state.installed, [record.id]: record } };
}

/** Remove an install record; clears `activeId` if it referenced the removed theme. */
export function removeRecord(state: InstallState, id: string): InstallState {
  if (!isInstalled(state, id)) return state;
  const next: Record<string, ThemeInstallRecord> = { ...state.installed };
  delete next[id];
  return { ...state, installed: next, activeId: state.activeId === id ? null : state.activeId };
}

/** Set the active theme id (caller guarantees it is installed + entitled). */
export function setActive(state: InstallState, id: string | null): InstallState {
  return { ...state, activeId: id };
}

/** Patch a record via an updater; no-op when the id is not installed. */
export function updateRecord(
  state: InstallState,
  id: string,
  update: (record: ThemeInstallRecord) => ThemeInstallRecord,
): InstallState {
  const record = state.installed[id];
  if (!record) return state;
  return putRecord(state, update(record));
}
