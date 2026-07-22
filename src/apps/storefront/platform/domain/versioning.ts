/**
 * Theme versioning — semver comparison for install records vs. marketplace listings, built on the
 * frozen engine's semver primitives (no re-implementation). Drives the update system.
 */
import { compareSemVer, parseSemVer } from '../../theme-engine';

export type VersionComparison = 'ahead' | 'current' | 'behind' | 'unknown';

/** Compare an installed version against an available one. `unknown` when either is not semver. */
export function compareVersions(installed: string, available: string): VersionComparison {
  const a = parseSemVer(installed);
  const b = parseSemVer(available);
  if (!a || !b) return 'unknown';
  const cmp = compareSemVer(a, b);
  if (cmp === 0) return 'current';
  return cmp < 0 ? 'behind' : 'ahead';
}

/** True when `available` is a strictly newer semver than `installed`. */
export function isUpdateAvailable(installed: string, available: string): boolean {
  return compareVersions(installed, available) === 'behind';
}

/** True when `version` is valid semver. */
export function isValidVersion(version: string): boolean {
  return parseSemVer(version) !== null;
}
