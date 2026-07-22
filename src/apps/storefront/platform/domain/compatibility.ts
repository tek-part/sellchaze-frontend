/**
 * Theme compatibility checker — verifies a marketplace listing (or loaded manifest) against the
 * frozen engine's version and reports capability support. Built on the engine's semver + capability
 * primitives; the engine is untouched.
 */
import {
  ENGINE_VERSION,
  hasAllCapabilities,
  parseSemVer,
  satisfiesMinimum,
  type ThemeCapability,
} from '../../theme-engine';
import type { CatalogEntry } from '../catalog/types';

export interface CompatibilityResult {
  readonly compatible: boolean;
  readonly reason?: string;
}

/** Compatibility of a catalog listing with an engine version — no module load required. */
export function checkEntryCompatibility(
  entry: Pick<CatalogEntry, 'id' | 'version' | 'minEngineVersion'>,
  engineVersion: string = ENGINE_VERSION,
): CompatibilityResult {
  if (!parseSemVer(entry.version)) {
    return { compatible: false, reason: `version "${entry.version}" is not valid semver` };
  }
  if (!parseSemVer(entry.minEngineVersion)) {
    return { compatible: false, reason: `minEngineVersion "${entry.minEngineVersion}" is not valid semver` };
  }
  if (!satisfiesMinimum(engineVersion, entry.minEngineVersion)) {
    return {
      compatible: false,
      reason: `“${entry.id}” needs engine ≥ ${entry.minEngineVersion}, but engine is ${engineVersion}`,
    };
  }
  return { compatible: true };
}

export interface CapabilityReport {
  readonly supported: ReadonlyArray<ThemeCapability>;
  readonly missing: ReadonlyArray<ThemeCapability>;
  readonly satisfied: boolean;
}

/** Which of `required` capabilities a listing declares, and which it lacks. */
export function checkCapabilities(
  entry: Pick<CatalogEntry, 'capabilities'>,
  required: ReadonlyArray<ThemeCapability>,
): CapabilityReport {
  const supported = required.filter((c) => entry.capabilities.includes(c));
  const missing = required.filter((c) => !entry.capabilities.includes(c));
  return {
    supported,
    missing,
    satisfied: hasAllCapabilities({ capabilities: entry.capabilities }, required),
  };
}
