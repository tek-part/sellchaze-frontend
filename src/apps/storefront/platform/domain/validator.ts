/**
 * Theme validator — two layers. Structural validation of a marketplace listing (no module load),
 * and full validation of a loaded `ThemeModule` (delegating to the frozen engine's `validateTheme`)
 * plus a listing-vs-manifest DRIFT check so the catalog can't silently misdescribe a theme. Reuses
 * the engine's `ValidationIssue` shape. Fail-safe — never throws.
 */
import {
  ENGINE_VERSION,
  validateTheme,
  type ThemeModule,
  type ValidationIssue,
  type ValidationReport,
} from '../../theme-engine';
import { checkEntryCompatibility } from './compatibility';
import { isValidVersion } from './versioning';
import type { CatalogEntry } from '../catalog/types';

const ID_RE = /^[a-z0-9-]+$/;
const LICENSE_TYPES = ['free', 'premium', 'trial'] as const;

function issue(level: 'error' | 'warning', code: string, message: string, path?: string): ValidationIssue {
  return path === undefined ? { level, code, message } : { level, code, message, path };
}

function report(issues: ReadonlyArray<ValidationIssue>): ValidationReport {
  const errors = issues.filter((i) => i.level === 'error');
  const warnings = issues.filter((i) => i.level === 'warning');
  return { valid: errors.length === 0, issues, errors, warnings };
}

/** Validate a catalog listing WITHOUT loading the theme module (structural + compatibility). */
export function validateCatalogEntry(
  entry: CatalogEntry,
  engineVersion: string = ENGINE_VERSION,
): ValidationReport {
  const issues: ValidationIssue[] = [];
  if (!ID_RE.test(entry.id)) issues.push(issue('error', 'entry.id', `id "${entry.id}" must match ${ID_RE}`, 'id'));
  if (entry.name.trim() === '') issues.push(issue('error', 'entry.name', 'name is required', 'name'));
  if (!isValidVersion(entry.version)) issues.push(issue('error', 'entry.version', `version "${entry.version}" is not semver`, 'version'));
  if (!isValidVersion(entry.minEngineVersion)) {
    issues.push(issue('error', 'entry.minEngineVersion', `"${entry.minEngineVersion}" is not semver`, 'minEngineVersion'));
  }
  if (!LICENSE_TYPES.includes(entry.license.type)) {
    issues.push(issue('error', 'entry.license', `unknown license type "${entry.license.type}"`, 'license.type'));
  }
  if (entry.license.type === 'premium' && !(typeof entry.license.price === 'number' && entry.license.price >= 0)) {
    issues.push(issue('warning', 'entry.license', 'premium theme has no price', 'license.price'));
  }
  if (typeof entry.load !== 'function') {
    issues.push(issue('error', 'entry.load', 'load must be a function', 'load'));
  }
  const compat = checkEntryCompatibility(entry, engineVersion);
  if (!compat.compatible) issues.push(issue('error', 'entry.compatibility', compat.reason ?? 'incompatible', 'minEngineVersion'));
  return report(issues);
}

/**
 * Full validation of a loaded module for a listing: engine `validateTheme` + listing↔manifest drift.
 * Drift (id/version/minEngine/capabilities mismatch) is reported as warnings so a stale listing is
 * visible without blocking install.
 */
export function validateInstallable(
  entry: CatalogEntry,
  module: ThemeModule,
  engineVersion: string = ENGINE_VERSION,
): ValidationReport {
  const engineReport = validateTheme(module, engineVersion);
  const drift: ValidationIssue[] = [];
  const m = module.manifest;
  if (m.id !== entry.id) drift.push(issue('error', 'drift.id', `manifest id "${m.id}" ≠ catalog id "${entry.id}"`, 'manifest.id'));
  if (m.version !== entry.version) {
    drift.push(issue('warning', 'drift.version', `manifest version ${m.version} ≠ catalog ${entry.version}`, 'manifest.version'));
  }
  if (m.minEngineVersion !== entry.minEngineVersion) {
    drift.push(issue('warning', 'drift.minEngineVersion', `manifest minEngine ${m.minEngineVersion} ≠ catalog ${entry.minEngineVersion}`, 'manifest.minEngineVersion'));
  }
  for (const cap of entry.capabilities) {
    if (!m.capabilities.includes(cap)) {
      drift.push(issue('warning', 'drift.capabilities', `catalog advertises "${cap}" not in manifest`, 'manifest.capabilities'));
    }
  }
  const issues = [...engineReport.issues, ...drift];
  return report(issues);
}
