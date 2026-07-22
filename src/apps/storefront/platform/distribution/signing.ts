/**
 * Digital signatures for distribution packages. A `Signer` signs a package's integrity digest; a
 * `Verifier` checks a signature against a trust store of keys. The default implementation is
 * HMAC-SHA256 (RFC 2104) with a keyed trust store — deterministic and testable. The Signer/Verifier
 * interfaces are the seam: an asymmetric verifier (Ed25519/RSA via WebCrypto) can replace the HMAC
 * one without touching the installer or verification pipeline.
 */
import { hmacSha256Hex, timingSafeEqualHex } from './crypto';
import { computeIntegrity, type PackageSignature, type ThemeDistributionPackage } from './package';

export interface Signer {
  readonly keyId: string;
  sign(digest: string): string;
}

export interface Verifier {
  isTrusted(keyId: string): boolean;
  verify(keyId: string, digest: string, signature: string): boolean;
}

/** keyId → secret (HMAC). For asymmetric schemes this becomes keyId → public key. */
export type TrustStore = Readonly<Record<string, string>>;

export function createHmacSigner(keyId: string, secret: string): Signer {
  return { keyId, sign: (digest) => hmacSha256Hex(secret, digest) };
}

export function createHmacVerifier(trust: TrustStore): Verifier {
  return {
    isTrusted: (keyId) => Object.prototype.hasOwnProperty.call(trust, keyId),
    verify: (keyId, digest, signature) => {
      const secret = trust[keyId];
      if (secret === undefined) return false;
      return timingSafeEqualHex(hmacSha256Hex(secret, digest), signature);
    },
  };
}

/** (Re)compute the integrity digest and sign it, returning a new signed package. */
export function signPackage(pkg: ThemeDistributionPackage, signer: Signer): ThemeDistributionPackage {
  const integrity = computeIntegrity(pkg.payload);
  const signature: PackageSignature = { algo: 'hmac-sha256', keyId: signer.keyId, value: signer.sign(integrity.digest) };
  return { payload: pkg.payload, integrity, signature };
}

export type SignatureStatus = 'unsigned' | 'trusted' | 'untrusted-key' | 'invalid';

/** Assess a package's signature: unsigned / signed-by-untrusted-key / invalid / trusted. */
export function checkSignature(pkg: ThemeDistributionPackage, verifier: Verifier): SignatureStatus {
  if (!pkg.signature) return 'unsigned';
  if (!verifier.isTrusted(pkg.signature.keyId)) return 'untrusted-key';
  return verifier.verify(pkg.signature.keyId, pkg.integrity.digest, pkg.signature.value) ? 'trusted' : 'invalid';
}
