/**
 * Distribution System — F2 installer tests: verified install, tamper/incompatible rejection, update +
 * settings migration, uninstall, and multi-level rollback. Pure logic (node env).
 */
import { describe, expect, it } from 'vitest';
import type { SettingsMigration } from '../domain/migration';
import { buildPackage } from './packager';
import { createHmacSigner, createHmacVerifier, signPackage } from './signing';
import {
  EMPTY_DISTRIBUTION_STATE,
  MAX_HISTORY,
  canRollback,
  getInstalledPackage,
  installPackage,
  listInstalledPackages,
  rollback,
  uninstallPackage,
  updatePackage,
} from './installer';

const AT = '2026-07-16T00:00:00.000Z';
const LATER = '2026-08-16T00:00:00.000Z';
const signer = createHmacSigner('sellchase-2026', 'release-key');
const verifier = createHmacVerifier({ 'sellchase-2026': 'release-key' });

function pkg(version = '1.0.0', over: Partial<Parameters<typeof buildPackage>[0]> = {}) {
  return signPackage(
    buildPackage({
      id: 'test-theme',
      name: 'Test Theme',
      version,
      minEngineVersion: '1.0.0',
      author: 'SellChase',
      archetype: 'Test',
      capabilities: ['rtl'],
      license: { type: 'free' },
      loaderId: 'test-theme',
      createdAt: AT,
      ...over,
    }),
    signer,
  );
}

describe('distribution installer', () => {
  it('installs a verified, signed package', () => {
    const r = installPackage(EMPTY_DISTRIBUTION_STATE, pkg(), { verifier, engineVersion: '1.0.0', requireSignature: true, at: AT });
    expect(r.ok).toBe(true);
    expect(r.record?.version).toBe('1.0.0');
    expect(r.record?.signatureTrusted).toBe(true);
    expect(listInstalledPackages(r.state)).toHaveLength(1);
  });

  it('refuses a tampered package (integrity)', () => {
    const signed = pkg();
    const tampered = { ...signed, payload: { ...signed.payload, manifest: { ...signed.payload.manifest, name: 'Evil' } } };
    const r = installPackage(EMPTY_DISTRIBUTION_STATE, tampered, { verifier, engineVersion: '1.0.0', at: AT });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/integrity/);
    expect(listInstalledPackages(r.state)).toHaveLength(0);
  });

  it('refuses an engine-incompatible package', () => {
    const r = installPackage(EMPTY_DISTRIBUTION_STATE, pkg('1.0.0', { minEngineVersion: '9.0.0' }), { verifier, engineVersion: '1.0.0', at: AT });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/compatibility/);
  });

  it('refuses an unsigned package when a signature is required', () => {
    const unsigned = buildPackage({
      id: 'test-theme', name: 'T', version: '1.0.0', minEngineVersion: '1.0.0', author: 'S', archetype: 'T', capabilities: [], license: { type: 'free' }, loaderId: 'test-theme', createdAt: AT,
    });
    const r = installPackage(EMPTY_DISTRIBUTION_STATE, unsigned, { verifier, engineVersion: '1.0.0', requireSignature: true, at: AT });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/signature/);
  });

  it('updates to a newer version, migrating settings', () => {
    const installed = installPackage(EMPTY_DISTRIBUTION_STATE, pkg('1.0.0', { defaults: { flag: false } }), { verifier, engineVersion: '1.0.0', at: AT }).state;
    const migrations: ReadonlyArray<SettingsMigration> = [
      { themeId: 'test-theme', from: '1.0.0', to: '1.1.0', description: 'set flag', migrate: (s) => { s['flag'] = true; } },
    ];
    const r = updatePackage(installed, pkg('1.1.0'), { verifier, engineVersion: '1.0.0', at: LATER, migrations });
    expect(r.ok).toBe(true);
    expect(r.record?.version).toBe('1.1.0');
    expect(r.record?.settings['flag']).toBe(true);
    expect(r.record?.installedAt).toBe(AT); // preserved
  });

  it('rejects a downgrade / same-version update', () => {
    const installed = installPackage(EMPTY_DISTRIBUTION_STATE, pkg('1.1.0'), { verifier, engineVersion: '1.0.0', at: AT }).state;
    expect(updatePackage(installed, pkg('1.0.0'), { verifier, engineVersion: '1.0.0', at: LATER }).ok).toBe(false);
  });

  it('uninstalls', () => {
    const installed = installPackage(EMPTY_DISTRIBUTION_STATE, pkg(), { verifier, engineVersion: '1.0.0', at: AT }).state;
    const after = uninstallPackage(installed, 'test-theme', LATER);
    expect(getInstalledPackage(after, 'test-theme')).toBeUndefined();
  });
});

describe('rollback', () => {
  it('undoes the last action (multi-level)', () => {
    let s = EMPTY_DISTRIBUTION_STATE;
    s = installPackage(s, pkg('1.0.0'), { verifier, engineVersion: '1.0.0', at: AT }).state;
    s = updatePackage(s, pkg('1.1.0'), { verifier, engineVersion: '1.0.0', at: LATER }).state;
    expect(getInstalledPackage(s, 'test-theme')?.version).toBe('1.1.0');

    // roll back the update → back to 1.0.0
    const r1 = rollback(s);
    expect(r1.ok).toBe(true);
    expect(getInstalledPackage(r1.state, 'test-theme')?.version).toBe('1.0.0');
    expect(r1.undone?.action).toBe('update');

    // roll back the install → empty
    const r2 = rollback(r1.state);
    expect(r2.ok).toBe(true);
    expect(listInstalledPackages(r2.state)).toHaveLength(0);
    expect(canRollback(r2.state)).toBe(false);
  });

  it('rolls back an uninstall (restores the theme)', () => {
    let s = installPackage(EMPTY_DISTRIBUTION_STATE, pkg(), { verifier, engineVersion: '1.0.0', at: AT }).state;
    s = uninstallPackage(s, 'test-theme', LATER);
    expect(listInstalledPackages(s)).toHaveLength(0);
    const r = rollback(s);
    expect(getInstalledPackage(r.state, 'test-theme')?.version).toBe('1.0.0');
  });

  it('reports nothing to roll back', () => {
    expect(rollback(EMPTY_DISTRIBUTION_STATE).ok).toBe(false);
  });

  it('bounds the history stack under install/uninstall loops (no unbounded growth)', () => {
    let s = EMPTY_DISTRIBUTION_STATE;
    // Far more than MAX_HISTORY operations — each install/uninstall pushes one snapshot.
    for (let i = 0; i < MAX_HISTORY * 3; i++) {
      s = installPackage(s, pkg('1.0.0'), { verifier, engineVersion: '1.0.0', at: AT }).state;
      s = uninstallPackage(s, 'test-theme', LATER);
    }
    expect(s.history.length).toBeLessThanOrEqual(MAX_HISTORY);
    // The most recent action is still rollback-able (undo stack preserved at the top).
    const r = rollback(s);
    expect(r.ok).toBe(true);
    expect(r.undone?.action).toBe('uninstall');
  });
});
