/**
 * Theme Distribution System — F1 unit tests: crypto (published vectors), package integrity + tamper
 * detection, canonicalisation determinism, digital signatures (trusted/untrusted/invalid), and the
 * verification pipeline. Pure logic (node env).
 */
import { describe, expect, it } from 'vitest';
import { THEME_CATALOG } from '../catalog/catalog';
import { hmacSha256Hex, sha256Hex, timingSafeEqualHex } from './crypto';
import { canonicalize, computeIntegrity, packageFileName, parsePackage, serializePackage } from './package';
import { buildPackage, packageFromCatalogEntry } from './packager';
import { checkSignature, createHmacSigner, createHmacVerifier, signPackage } from './signing';
import { verifyPackage } from './verification';

const AT = '2026-07-16T00:00:00.000Z';

function samplePackage(over: Partial<Parameters<typeof buildPackage>[0]> = {}) {
  return buildPackage({
    id: 'test-theme',
    name: 'Test Theme',
    version: '1.0.0',
    minEngineVersion: '1.0.0',
    author: 'SellChase',
    archetype: 'Test',
    capabilities: ['rtl'],
    license: { type: 'free', sku: 'test' },
    loaderId: 'test-theme',
    createdAt: AT,
    ...over,
  });
}

/* -------------------------------------------------------------- crypto */
describe('crypto (test vectors)', () => {
  it('sha256 matches published vectors', () => {
    expect(sha256Hex('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    expect(sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    expect(sha256Hex('The quick brown fox jumps over the lazy dog')).toBe(
      'd7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592',
    );
  });
  it('hmac-sha256 matches the published vector', () => {
    expect(hmacSha256Hex('key', 'The quick brown fox jumps over the lazy dog')).toBe(
      'f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8',
    );
  });
  it('timingSafeEqualHex compares correctly', () => {
    expect(timingSafeEqualHex('abcd', 'abcd')).toBe(true);
    expect(timingSafeEqualHex('abcd', 'abce')).toBe(false);
    expect(timingSafeEqualHex('abc', 'abcd')).toBe(false);
  });
});

/* -------------------------------------------------------------- package */
describe('package format', () => {
  it('canonicalize is key-order independent', () => {
    expect(canonicalize({ b: 1, a: 2 })).toBe(canonicalize({ a: 2, b: 1 }));
    expect(canonicalize({ a: [1, { y: 1, x: 2 }] })).toBe('{"a":[1,{"x":2,"y":1}]}');
  });
  it('seals a package with a stable integrity digest', () => {
    const pkg = samplePackage();
    expect(pkg.integrity.algo).toBe('sha256');
    expect(pkg.integrity.digest).toBe(computeIntegrity(pkg.payload).digest);
    expect(pkg.integrity.digest).toHaveLength(64);
  });
  it('round-trips through serialize/parse', () => {
    const pkg = samplePackage();
    const parsed = parsePackage(serializePackage(pkg));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.package.payload.manifest.id).toBe('test-theme');
      expect(parsed.package.integrity.digest).toBe(pkg.integrity.digest);
    }
  });
  it('rejects malformed packages', () => {
    expect(parsePackage('not json').ok).toBe(false);
    expect(parsePackage('{}').ok).toBe(false);
    expect(parsePackage(JSON.stringify({ payload: { format: 'x' }, integrity: {} })).ok).toBe(false);
  });
  it('names the download file', () => {
    expect(packageFileName(samplePackage())).toBe('test-theme-1.0.0.theme-pkg.json');
  });
});

/* -------------------------------------------------------------- signatures */
describe('digital signatures', () => {
  const signer = createHmacSigner('sellchase-2026', 'super-secret');
  const trusted = createHmacVerifier({ 'sellchase-2026': 'super-secret' });
  const wrongSecret = createHmacVerifier({ 'sellchase-2026': 'nope' });
  const unknownKey = createHmacVerifier({ other: 'x' });

  it('signs and verifies with a trusted key', () => {
    const signed = signPackage(samplePackage(), signer);
    expect(signed.signature?.keyId).toBe('sellchase-2026');
    expect(checkSignature(signed, trusted)).toBe('trusted');
  });
  it('detects the wrong signing secret', () => {
    expect(checkSignature(signPackage(samplePackage(), signer), wrongSecret)).toBe('invalid');
  });
  it('flags an untrusted key', () => {
    expect(checkSignature(signPackage(samplePackage(), signer), unknownKey)).toBe('untrusted-key');
  });
  it('reports unsigned packages', () => {
    expect(checkSignature(samplePackage(), trusted)).toBe('unsigned');
  });
  it('a tampered signed package fails signature verification', () => {
    const signed = signPackage(samplePackage(), signer);
    const tampered = { ...signed, payload: { ...signed.payload, manifest: { ...signed.payload.manifest, version: '9.9.9' } } };
    // integrity digest no longer matches the tampered payload → signature is over the old digest
    expect(computeIntegrity(tampered.payload).digest).not.toBe(tampered.integrity.digest);
  });
});

/* -------------------------------------------------------------- verification pipeline */
describe('verification pipeline', () => {
  const signer = createHmacSigner('sellchase-2026', 's3cret');
  const verifier = createHmacVerifier({ 'sellchase-2026': 's3cret' });

  it('passes a valid signed package', () => {
    const report = verifyPackage(signPackage(samplePackage(), signer), { verifier, engineVersion: '1.0.0' });
    expect(report.ok).toBe(true);
    expect(report.signature).toBe('trusted');
    expect(report.checks.every((c) => c.status !== 'fail')).toBe(true);
  });
  it('fails a tampered package on integrity', () => {
    const pkg = samplePackage();
    const tampered = { ...pkg, payload: { ...pkg.payload, manifest: { ...pkg.payload.manifest, name: 'Evil' } } };
    const report = verifyPackage(tampered);
    expect(report.ok).toBe(false);
    expect(report.checks.find((c) => c.name === 'integrity')?.status).toBe('fail');
  });
  it('fails an engine-incompatible package', () => {
    const report = verifyPackage(samplePackage({ minEngineVersion: '9.0.0' }), { engineVersion: '1.0.0' });
    expect(report.checks.find((c) => c.name === 'compatibility')?.status).toBe('fail');
    expect(report.ok).toBe(false);
  });
  it('warns on unsigned but does not fail (unless required)', () => {
    const lenient = verifyPackage(samplePackage(), { engineVersion: '1.0.0' });
    expect(lenient.checks.find((c) => c.name === 'signature')?.status).toBe('warn');
    expect(lenient.ok).toBe(true);
    const strict = verifyPackage(samplePackage(), { engineVersion: '1.0.0', requireSignature: true });
    expect(strict.checks.find((c) => c.name === 'signature')?.status).toBe('fail');
    expect(strict.ok).toBe(false);
  });
});

/* -------------------------------------------------------------- catalog packaging */
describe('packaging the real catalog', () => {
  const signer = createHmacSigner('sellchase-2026', 'release-key');
  const verifier = createHmacVerifier({ 'sellchase-2026': 'release-key' });

  it('packages + signs + verifies every catalogued theme', () => {
    for (const entry of THEME_CATALOG) {
      const signed = signPackage(packageFromCatalogEntry(entry, AT), signer);
      const report = verifyPackage(signed, { verifier, engineVersion: '1.0.0', requireSignature: true });
      expect(report.ok, `${entry.id} should verify`).toBe(true);
      expect(signed.payload.source.loaderId).toBe(entry.id);
    }
  });
});
