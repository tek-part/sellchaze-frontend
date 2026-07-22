/**
 * Distribution installer — installs a theme from a verified package, with rollback. Every mutation
 * (install / update / uninstall) first runs the verification pipeline, then snapshots the prior
 * installed set onto a history stack so ANY step can be rolled back. Pure + clock-injected; reuses the
 * platform domain for licensing (grants/entitlement) and settings migration, and the frozen engine for
 * setting types. Registering the theme's runtime loader is the engine registry's job (catalog-driven),
 * so installing a package changes no application code.
 */
import type { ThemeSettingValue } from '../../theme-engine';
import { grantForInstall, type LicenseGrant } from '../domain/licensing';
import { migrateThemeSettings, type SettingsMigration } from '../domain/migration';
import { isUpdateAvailable } from '../domain/versioning';
import type { ThemeDistributionPackage } from './package';
import { verifyPackage, type VerificationReport, type VerifyOptions } from './verification';

export const DISTRIBUTION_STATE_VERSION = 1 as const;

/**
 * Cap on the rollback-history stack. Each snapshot embeds a full copy of the prior installed map, so
 * an uncapped history would grow without bound under install/uninstall/update loops — bloating memory
 * and eventually overflowing the persistence quota. Keeping the most recent N snapshots bounds both
 * while preserving multi-step rollback.
 */
export const MAX_HISTORY = 25;

export interface InstalledPackage {
  readonly id: string;
  readonly version: string;
  readonly loaderId: string;
  /** Integrity digest of the installed package (for audit / re-verify). */
  readonly integrity: string;
  readonly signatureKeyId?: string;
  readonly signatureTrusted: boolean;
  readonly license: LicenseGrant;
  readonly settings: Readonly<Record<string, ThemeSettingValue>>;
  readonly installedAt: string;
  readonly updatedAt: string;
}

export type DistributionAction = 'install' | 'update' | 'uninstall';

export interface Snapshot {
  readonly at: string;
  readonly action: DistributionAction;
  readonly packageId: string;
  readonly version: string;
  /** The installed map BEFORE the action — restored on rollback. */
  readonly previous: Readonly<Record<string, InstalledPackage>>;
}

export interface DistributionState {
  readonly version: typeof DISTRIBUTION_STATE_VERSION;
  readonly installed: Readonly<Record<string, InstalledPackage>>;
  readonly history: ReadonlyArray<Snapshot>;
}

export const EMPTY_DISTRIBUTION_STATE: DistributionState = {
  version: DISTRIBUTION_STATE_VERSION,
  installed: {},
  history: [],
};

/* ------------------------------------------------------------------ queries */

export function listInstalledPackages(state: DistributionState): ReadonlyArray<InstalledPackage> {
  return Object.values(state.installed);
}
export function getInstalledPackage(state: DistributionState, id: string): InstalledPackage | undefined {
  return state.installed[id];
}
export function canRollback(state: DistributionState): boolean {
  return state.history.length > 0;
}

function pushSnapshot(state: DistributionState, snap: Snapshot, nextInstalled: Record<string, InstalledPackage>): DistributionState {
  const history = [...state.history, snap];
  return {
    version: DISTRIBUTION_STATE_VERSION,
    installed: nextInstalled,
    history: history.length > MAX_HISTORY ? history.slice(-MAX_HISTORY) : history,
  };
}

/* ------------------------------------------------------------------ install */

export interface InstallPackageOptions extends VerifyOptions {
  readonly at: string;
}

export interface InstallPackageResult {
  readonly ok: boolean;
  readonly state: DistributionState;
  readonly report: VerificationReport;
  readonly record?: InstalledPackage;
  readonly error?: string;
}

function recordFrom(pkg: ThemeDistributionPackage, report: VerificationReport, at: string, prior?: InstalledPackage): InstalledPackage {
  const settings: Record<string, ThemeSettingValue> = { ...(pkg.payload.defaults ?? {}) };
  return {
    id: pkg.payload.manifest.id,
    version: pkg.payload.manifest.version,
    loaderId: pkg.payload.source.loaderId,
    integrity: pkg.integrity.digest,
    ...(pkg.signature ? { signatureKeyId: pkg.signature.keyId } : {}),
    signatureTrusted: report.signature === 'trusted',
    license: prior?.license ?? grantForInstall(pkg.payload.license, at),
    settings: prior?.settings ?? settings,
    installedAt: prior?.installedAt ?? at,
    updatedAt: at,
  };
}

/** Install a theme from a package: verify → (on pass) snapshot + record. Never installs on a failed check. */
export function installPackage(state: DistributionState, pkg: ThemeDistributionPackage, opts: InstallPackageOptions): InstallPackageResult {
  const report = verifyPackage(pkg, opts);
  if (!report.ok) {
    const failed = report.checks.find((c) => c.status === 'fail');
    return { ok: false, state, report, error: failed ? `${failed.name}: ${failed.detail}` : 'package failed verification' };
  }
  const id = pkg.payload.manifest.id;
  const record = recordFrom(pkg, report, opts.at, state.installed[id]);
  const snap: Snapshot = { at: opts.at, action: 'install', packageId: id, version: record.version, previous: state.installed };
  const next = pushSnapshot(state, snap, { ...state.installed, [id]: record });
  return { ok: true, state: next, report, record };
}

/* ------------------------------------------------------------------ update */

export interface UpdatePackageOptions extends InstallPackageOptions {
  readonly migrations?: ReadonlyArray<SettingsMigration>;
}

/** Update an installed theme to a newer package version, migrating its settings. Verified + snapshotted. */
export function updatePackage(state: DistributionState, pkg: ThemeDistributionPackage, opts: UpdatePackageOptions): InstallPackageResult {
  const id = pkg.payload.manifest.id;
  const current = state.installed[id];
  if (!current) return { ok: false, state, report: verifyPackage(pkg, opts), error: `“${id}” is not installed` };
  if (!isUpdateAvailable(current.version, pkg.payload.manifest.version)) {
    return { ok: false, state, report: verifyPackage(pkg, opts), error: `no newer version (${current.version} ≥ ${pkg.payload.manifest.version})` };
  }
  const report = verifyPackage(pkg, opts);
  if (!report.ok) {
    const failed = report.checks.find((c) => c.status === 'fail');
    return { ok: false, state, report, error: failed ? `${failed.name}: ${failed.detail}` : 'update failed verification' };
  }
  const migrated = migrateThemeSettings(id, current.version, pkg.payload.manifest.version, current.settings, opts.migrations);
  const record: InstalledPackage = {
    ...current,
    version: pkg.payload.manifest.version,
    loaderId: pkg.payload.source.loaderId,
    integrity: pkg.integrity.digest,
    ...(pkg.signature ? { signatureKeyId: pkg.signature.keyId } : {}),
    signatureTrusted: report.signature === 'trusted',
    settings: migrated.settings,
    updatedAt: opts.at,
  };
  const snap: Snapshot = { at: opts.at, action: 'update', packageId: id, version: current.version, previous: state.installed };
  const next = pushSnapshot(state, snap, { ...state.installed, [id]: record });
  return { ok: true, state: next, report, record };
}

/* ------------------------------------------------------------------ uninstall + rollback */

export function uninstallPackage(state: DistributionState, id: string, at: string): DistributionState {
  if (!state.installed[id]) return state;
  const nextInstalled: Record<string, InstalledPackage> = { ...state.installed };
  delete nextInstalled[id];
  const snap: Snapshot = { at, action: 'uninstall', packageId: id, version: state.installed[id]!.version, previous: state.installed };
  return pushSnapshot(state, snap, nextInstalled);
}

export interface RollbackResult {
  readonly ok: boolean;
  readonly state: DistributionState;
  readonly undone?: Snapshot;
  readonly error?: string;
}

/** Undo the most recent install/update/uninstall, restoring the prior installed set. */
export function rollback(state: DistributionState): RollbackResult {
  const last = state.history[state.history.length - 1];
  if (!last) return { ok: false, state, error: 'nothing to roll back' };
  const restored: DistributionState = {
    version: DISTRIBUTION_STATE_VERSION,
    installed: last.previous,
    history: state.history.slice(0, -1),
  };
  return { ok: true, state: restored, undone: last };
}
