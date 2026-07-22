/**
 * Package verification pipeline — the gate every package passes before install. Runs five checks and
 * aggregates them into a report: integrity (checksum/tamper), manifest (well-formedness), compatibility
 * (engine version), license (known type), and signature (trusted/unsigned/untrusted/invalid). Built on
 * the frozen engine's semver primitives. A `fail` on any check blocks install; unsigned/untrusted are
 * warnings unless `requireSignature` is set.
 */
import { ENGINE_VERSION, parseSemVer, satisfiesMinimum } from '../../theme-engine';
import { computeIntegrity, type ThemeDistributionPackage } from './package';
import { checkSignature, type SignatureStatus, type Verifier } from './signing';

export type CheckStatus = 'pass' | 'warn' | 'fail';

export interface VerificationCheck {
  readonly name: 'integrity' | 'manifest' | 'compatibility' | 'license' | 'signature';
  readonly status: CheckStatus;
  readonly detail: string;
}

export interface VerificationReport {
  readonly ok: boolean;
  readonly checks: ReadonlyArray<VerificationCheck>;
  readonly signature: SignatureStatus;
}

export interface VerifyOptions {
  readonly verifier?: Verifier;
  readonly engineVersion?: string;
  /** When true, an unsigned or untrusted-key package fails verification (default: warn only). */
  readonly requireSignature?: boolean;
}

const ID_RE = /^[a-z0-9-]+$/;
const LICENSE_TYPES = ['free', 'premium', 'trial'];

export function verifyPackage(pkg: ThemeDistributionPackage, opts: VerifyOptions = {}): VerificationReport {
  const engineVersion = opts.engineVersion ?? ENGINE_VERSION;
  const checks: VerificationCheck[] = [];

  // 1. Integrity — recompute the digest over the payload and compare (tamper detection).
  const recomputed = computeIntegrity(pkg.payload).digest;
  const integrityOk = recomputed === pkg.integrity.digest;
  checks.push({
    name: 'integrity',
    status: integrityOk ? 'pass' : 'fail',
    detail: integrityOk ? 'checksum matches payload' : 'checksum mismatch — package has been tampered with',
  });

  // 2. Manifest — well-formed id / semver / name.
  const m = pkg.payload.manifest;
  const manifestOk = ID_RE.test(m.id) && parseSemVer(m.version) !== null && parseSemVer(m.minEngineVersion) !== null && m.name.trim() !== '';
  checks.push({
    name: 'manifest',
    status: manifestOk ? 'pass' : 'fail',
    detail: manifestOk ? `manifest ${m.id}@${m.version} well-formed` : 'manifest invalid (id / version / minEngineVersion / name)',
  });

  // 3. Compatibility — engine satisfies the package's minimum.
  const compatOk = parseSemVer(m.minEngineVersion) !== null && satisfiesMinimum(engineVersion, m.minEngineVersion);
  checks.push({
    name: 'compatibility',
    status: compatOk ? 'pass' : 'fail',
    detail: compatOk ? `engine ${engineVersion} ≥ required ${m.minEngineVersion}` : `requires engine ≥ ${m.minEngineVersion}, but engine is ${engineVersion}`,
  });

  // 4. License — a known license type.
  const licOk = LICENSE_TYPES.includes(pkg.payload.license.type);
  checks.push({
    name: 'license',
    status: licOk ? 'pass' : 'fail',
    detail: licOk ? `license: ${pkg.payload.license.type}` : `unknown license type "${pkg.payload.license.type}"`,
  });

  // 5. Signature — trusted / unsigned / untrusted-key / invalid.
  const sig: SignatureStatus = opts.verifier ? checkSignature(pkg, opts.verifier) : pkg.signature ? 'untrusted-key' : 'unsigned';
  let sigStatus: CheckStatus;
  let sigDetail: string;
  if (sig === 'trusted') {
    sigStatus = 'pass';
    sigDetail = `signed by ${pkg.signature?.keyId} (trusted)`;
  } else if (sig === 'invalid') {
    sigStatus = 'fail';
    sigDetail = 'signature invalid — package tampered or signed with the wrong key';
  } else if (sig === 'unsigned') {
    sigStatus = opts.requireSignature ? 'fail' : 'warn';
    sigDetail = 'package is not digitally signed';
  } else {
    sigStatus = opts.requireSignature ? 'fail' : 'warn';
    sigDetail = `signed by an untrusted key${pkg.signature ? ` (${pkg.signature.keyId})` : ''}`;
  }
  checks.push({ name: 'signature', status: sigStatus, detail: sigDetail });

  return { ok: checks.every((c) => c.status !== 'fail'), checks, signature: sig };
}
