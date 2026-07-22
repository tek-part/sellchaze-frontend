/**
 * Theme distribution package format — a self-describing, integrity-protected, optionally-signed
 * artifact for shipping a theme. Distinct from the platform's settings-config `ThemePackage`
 * (packaging.ts): this is the *distributable theme* envelope used by the installer.
 *
 * Shape: `{ payload, integrity, signature? }`. `payload` is the canonical, integrity-protected content
 * (manifest essentials + license + source + defaults). `integrity` is a SHA-256 digest over the
 * canonical JSON of `payload` (tamper detection). `signature` (optional) signs that digest with a
 * trusted key. Runtime theme CODE is resolved via `source` (a loader id registered in the frozen
 * engine registry) — the engine stays frozen and installing a package changes no application code.
 */
import type { LicenseType } from '../catalog/types';
import { sha256Hex } from './crypto';

export const DIST_FORMAT = 'sellchase-theme-dist' as const;
export const DIST_FORMAT_VERSION = 1 as const;

export interface PackageManifest {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly minEngineVersion: string;
  readonly author: string;
  readonly archetype: string;
  readonly capabilities: ReadonlyArray<string>;
}

export interface PackageLicense {
  readonly type: LicenseType;
  readonly sku?: string;
  readonly price?: number;
  readonly currency?: string;
  readonly trialDays?: number;
}

/** How the theme's runtime code is resolved. `registry` binds to an engine-registered loader id. */
export interface PackageSource {
  readonly kind: 'registry';
  readonly loaderId: string;
}

export interface PackagePayload {
  readonly format: typeof DIST_FORMAT;
  readonly formatVersion: typeof DIST_FORMAT_VERSION;
  readonly manifest: PackageManifest;
  readonly license: PackageLicense;
  readonly source: PackageSource;
  readonly defaults?: Readonly<Record<string, string | number | boolean>>;
  readonly createdAt: string;
}

export interface PackageIntegrity {
  readonly algo: 'sha256';
  readonly digest: string;
}

export interface PackageSignature {
  readonly algo: 'hmac-sha256';
  readonly keyId: string;
  readonly value: string;
}

export interface ThemeDistributionPackage {
  readonly payload: PackagePayload;
  readonly integrity: PackageIntegrity;
  readonly signature?: PackageSignature;
}

/* ------------------------------------------------------------------ canonicalisation */

/** Deterministic JSON with lexicographically-sorted keys (so digests are stable + reproducible). */
export function canonicalize(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).filter((k) => obj[k] !== undefined).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalize(obj[k])}`).join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

/** Compute the integrity digest for a payload (SHA-256 over its canonical JSON). */
export function computeIntegrity(payload: PackagePayload): PackageIntegrity {
  return { algo: 'sha256', digest: sha256Hex(canonicalize(payload)) };
}

/** Assemble a package from a payload, stamping its integrity digest (unsigned). */
export function sealPackage(payload: PackagePayload): ThemeDistributionPackage {
  return { payload, integrity: computeIntegrity(payload) };
}

export function serializePackage(pkg: ThemeDistributionPackage): string {
  return JSON.stringify(pkg, null, 2);
}

export function packageFileName(pkg: ThemeDistributionPackage): string {
  return `${pkg.payload.manifest.id}-${pkg.payload.manifest.version}.theme-pkg.json`;
}

/* ------------------------------------------------------------------ parsing */

export type ParseResult =
  | { readonly ok: true; readonly package: ThemeDistributionPackage }
  | { readonly ok: false; readonly error: string };

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}
const LICENSE_TYPES: ReadonlyArray<LicenseType> = ['free', 'premium', 'trial'];

function parseManifest(raw: unknown): PackageManifest | null {
  if (!isObj(raw)) return null;
  const { id, name, version, minEngineVersion, author, archetype, capabilities } = raw;
  if (typeof id !== 'string' || typeof name !== 'string' || typeof version !== 'string' || typeof minEngineVersion !== 'string') return null;
  return {
    id,
    name,
    version,
    minEngineVersion,
    author: typeof author === 'string' ? author : '',
    archetype: typeof archetype === 'string' ? archetype : '',
    capabilities: Array.isArray(capabilities) ? capabilities.filter((c): c is string => typeof c === 'string') : [],
  };
}

/** Parse + structurally validate a distribution package from JSON (never throws). */
export function parsePackage(json: string): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return { ok: false, error: 'not valid JSON' };
  }
  if (!isObj(raw) || !isObj(raw['payload']) || !isObj(raw['integrity'])) {
    return { ok: false, error: 'package must have payload + integrity' };
  }
  const p = raw['payload'];
  if (p['format'] !== DIST_FORMAT) return { ok: false, error: 'unrecognised package format' };
  if (p['formatVersion'] !== DIST_FORMAT_VERSION) return { ok: false, error: `unsupported package version "${String(p['formatVersion'])}"` };

  const manifest = parseManifest(p['manifest']);
  if (!manifest) return { ok: false, error: 'invalid package.manifest' };
  if (!isObj(p['license']) || typeof p['license']['type'] !== 'string' || !LICENSE_TYPES.includes(p['license']['type'] as LicenseType)) {
    return { ok: false, error: 'invalid package.license' };
  }
  if (!isObj(p['source']) || p['source']['kind'] !== 'registry' || typeof p['source']['loaderId'] !== 'string') {
    return { ok: false, error: 'invalid package.source' };
  }
  const integrity = raw['integrity'];
  if (integrity['algo'] !== 'sha256' || typeof integrity['digest'] !== 'string') {
    return { ok: false, error: 'invalid package.integrity' };
  }

  const lic = p['license'] as Record<string, unknown>;
  const license: PackageLicense = {
    type: lic['type'] as LicenseType,
    ...(typeof lic['sku'] === 'string' ? { sku: lic['sku'] } : {}),
    ...(typeof lic['price'] === 'number' ? { price: lic['price'] } : {}),
    ...(typeof lic['currency'] === 'string' ? { currency: lic['currency'] } : {}),
    ...(typeof lic['trialDays'] === 'number' ? { trialDays: lic['trialDays'] } : {}),
  };
  const defaultsRaw = p['defaults'];
  const defaults: Record<string, string | number | boolean> = {};
  if (isObj(defaultsRaw)) {
    for (const [k, v] of Object.entries(defaultsRaw)) {
      if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') defaults[k] = v;
    }
  }

  const payload: PackagePayload = {
    format: DIST_FORMAT,
    formatVersion: DIST_FORMAT_VERSION,
    manifest,
    license,
    source: { kind: 'registry', loaderId: (p['source'] as Record<string, unknown>)['loaderId'] as string },
    ...(Object.keys(defaults).length > 0 ? { defaults } : {}),
    createdAt: typeof p['createdAt'] === 'string' ? p['createdAt'] : '',
  };

  const sig = raw['signature'];
  const signature: PackageSignature | undefined =
    isObj(sig) && sig['algo'] === 'hmac-sha256' && typeof sig['keyId'] === 'string' && typeof sig['value'] === 'string'
      ? { algo: 'hmac-sha256', keyId: sig['keyId'], value: sig['value'] }
      : undefined;

  return {
    ok: true,
    package: {
      payload,
      integrity: { algo: 'sha256', digest: integrity['digest'] as string },
      ...(signature ? { signature } : {}),
    },
  };
}
