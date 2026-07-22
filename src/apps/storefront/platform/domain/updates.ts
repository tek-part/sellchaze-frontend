/**
 * Theme update system — compares install records against the marketplace catalog and describes the
 * available updates (new version + aggregated changelog notes). Applying an update is the installer's
 * `updateInstalled` (re-records the new version and migrates settings). Pure.
 */
import { compareSemVer, parseSemVer } from '../../theme-engine';
import type { CatalogEntry, ThemeCatalog } from '../catalog/types';
import type { InstallState, ThemeInstallRecord } from './install-state';
import { listInstalled } from './install-state';
import { isUpdateAvailable } from './versioning';

export interface UpdateInfo {
  readonly id: string;
  readonly name: string;
  readonly installedVersion: string;
  readonly availableVersion: string;
  /** Changelog notes for every catalog version strictly newer than the installed one. */
  readonly notes: ReadonlyArray<string>;
}

/** Notes from changelog entries whose version is strictly greater than `installedVersion`. */
function notesSince(entry: CatalogEntry, installedVersion: string): ReadonlyArray<string> {
  const installed = parseSemVer(installedVersion);
  if (!installed) return [];
  return entry.changelog
    .filter((c) => {
      const v = parseSemVer(c.version);
      return v !== null && compareSemVer(v, installed) > 0;
    })
    .flatMap((c) => c.notes.map((n) => `${c.version}: ${n}`));
}

/** Describe an available update for one record, or `null` when it is current/ahead. */
export function planUpdate(record: ThemeInstallRecord, entry: CatalogEntry): UpdateInfo | null {
  if (!isUpdateAvailable(record.version, entry.version)) return null;
  return {
    id: entry.id,
    name: entry.name,
    installedVersion: record.version,
    availableVersion: entry.version,
    notes: notesSince(entry, record.version),
  };
}

/** Every installed theme that has a newer version available in the catalog. */
export function detectUpdates(state: InstallState, catalog: ThemeCatalog): ReadonlyArray<UpdateInfo> {
  const byId = new Map(catalog.map((e) => [e.id, e]));
  const out: UpdateInfo[] = [];
  for (const record of listInstalled(state)) {
    const entry = byId.get(record.id);
    if (!entry) continue;
    const info = planUpdate(record, entry);
    if (info) out.push(info);
  }
  return out;
}
