/**
 * Theme validation pipeline. Runs composable checks over a `ThemeModule` — manifest, settings
 * schema, tokens, and section/template wiring — and returns a structured report. Fail-safe
 * (never throws). Run at registration / in dev to catch a malformed theme before it ships
 * (mirrors docs/THEME-ENGINE-V2 §6). Theme-agnostic.
 */
import { checkThemeCompatibility, ENGINE_VERSION } from './compatibility';
import { parseSemVer } from './semver';
import type { ThemeModule } from './types';

export type ValidationLevel = 'error' | 'warning';

export interface ValidationIssue {
  readonly level: ValidationLevel;
  readonly code: string;
  readonly message: string;
  readonly path?: string;
}

export interface ValidationReport {
  readonly valid: boolean;
  readonly issues: ReadonlyArray<ValidationIssue>;
  readonly errors: ReadonlyArray<ValidationIssue>;
  readonly warnings: ReadonlyArray<ValidationIssue>;
}

const ID_RE = /^[a-z0-9-]+$/;
const REQUIRED_TEMPLATES = ['home', 'product', 'category'] as const;

function err(code: string, message: string, path?: string): ValidationIssue {
  return path === undefined ? { level: 'error', code, message } : { level: 'error', code, message, path };
}
function warn(code: string, message: string, path?: string): ValidationIssue {
  return path === undefined ? { level: 'warning', code, message } : { level: 'warning', code, message, path };
}

function validateManifest(module: ThemeModule, engineVersion: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const m = module.manifest;
  if (!ID_RE.test(m.id)) issues.push(err('manifest.id', `id "${m.id}" must match ${ID_RE}`, 'manifest.id'));
  if (m.name.trim() === '') issues.push(err('manifest.name', 'name is required', 'manifest.name'));
  if (m.author.trim() === '') issues.push(err('manifest.author', 'author is required', 'manifest.author'));
  if (!Number.isInteger(m.schemaVersion) || m.schemaVersion < 1) {
    issues.push(err('manifest.schemaVersion', `schemaVersion "${m.schemaVersion}" must be a positive integer`, 'manifest.schemaVersion'));
  }
  if (!parseSemVer(m.version)) issues.push(err('manifest.version', `version "${m.version}" is not semver`, 'manifest.version'));
  if (!parseSemVer(m.minEngineVersion)) {
    issues.push(err('manifest.minEngineVersion', `"${m.minEngineVersion}" is not semver`, 'manifest.minEngineVersion'));
  }
  const compat = checkThemeCompatibility(m, engineVersion);
  if (!compat.compatible) issues.push(err('manifest.compatibility', compat.reason ?? 'incompatible', 'manifest'));
  if (m.supports.colorSchemes.length === 0) {
    issues.push(err('manifest.supports', 'supports.colorSchemes must not be empty', 'manifest.supports'));
  } else if (!m.supports.colorSchemes.includes('light')) {
    issues.push(warn('manifest.supports', 'theme does not support the light scheme', 'manifest.supports'));
  }
  return issues;
}

function validateSettings(module: ThemeModule): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seen = new Set<string>();
  for (const field of module.manifest.settingsSchema) {
    const path = `settings.${field.id}`;
    if (seen.has(field.id)) issues.push(err('settings.duplicate', `duplicate setting id "${field.id}"`, path));
    seen.add(field.id);
    if (field.type === 'select') {
      if (field.options.length === 0) issues.push(err('settings.options', `select "${field.id}" has no options`, path));
      else if (!field.options.some((o) => o.value === field.default)) {
        issues.push(err('settings.default', `select "${field.id}" default is not among options`, path));
      }
    }
    if (field.type === 'range' || field.type === 'number') {
      if (field.min !== undefined && field.max !== undefined && field.min > field.max) {
        issues.push(err('settings.range', `"${field.id}" min > max`, path));
      }
      if (field.min !== undefined && field.default < field.min) issues.push(warn('settings.default', `"${field.id}" default < min`, path));
      if (field.max !== undefined && field.default > field.max) issues.push(warn('settings.default', `"${field.id}" default > max`, path));
    }
  }
  return issues;
}

function validateTokens(module: ThemeModule): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const b = module.tokens.breakpoints;
  if (!(b.sm < b.md && b.md < b.lg && b.lg < b.xl && b.xl < b['2xl'])) {
    issues.push(warn('tokens.breakpoints', 'breakpoints are not strictly ascending', 'tokens.breakpoints'));
  }
  for (const scheme of module.manifest.supports.colorSchemes) {
    const ramp = module.tokens.color[scheme];
    if (ramp.primary.trim() === '' || ramp.bg.trim() === '') {
      issues.push(err('tokens.color', `${scheme} colour ramp has empty primary/bg`, `tokens.color.${scheme}`));
    }
  }
  try {
    const probe = module.createTokens(module.defaultSettings);
    if (probe.color.light.primary.trim() === '') {
      issues.push(err('tokens.createTokens', 'createTokens produced an empty primary', 'createTokens'));
    }
  } catch (error) {
    issues.push(err('tokens.createTokens', `createTokens threw: ${String(error)}`, 'createTokens'));
  }
  return issues;
}

function validateSectionsAndTemplates(module: ThemeModule): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const templates = module.templates;
  if (!templates) return issues;
  const sections = module.sections ?? {};
  for (const [name, page] of Object.entries(templates)) {
    for (const instance of page.sections) {
      if (!(instance.type in sections)) {
        issues.push(err('templates.unknownSection', `template "${name}" references unknown section "${instance.type}"`, `templates.${name}`));
      }
    }
  }
  for (const required of REQUIRED_TEMPLATES) {
    if (!(required in templates)) {
      issues.push(warn('templates.missing', `no "${required}" template`, 'templates'));
    }
  }
  return issues;
}

/** Run the full validation pipeline over a theme module. */
export function validateTheme(
  module: ThemeModule,
  engineVersion: string = ENGINE_VERSION,
): ValidationReport {
  const issues: ValidationIssue[] = [
    ...validateManifest(module, engineVersion),
    ...validateSettings(module),
    ...validateTokens(module),
    ...validateSectionsAndTemplates(module),
  ];
  const errors = issues.filter((i) => i.level === 'error');
  const warnings = issues.filter((i) => i.level === 'warning');
  return { valid: errors.length === 0, issues, errors, warnings };
}
