/**
 * Multi-Theme Platform — domain unit tests. Pure logic only (node env): versioning, licensing,
 * install-state reducers, storage normalisation, packaging, compatibility, validation, migration,
 * installer, switcher, updates, catalog integrity, and the registry bridge.
 */
import { describe, expect, it } from 'vitest';
import { ThemeRegistry, type DesignTokens, type ThemeManifest, type ThemeModule } from '../../theme-engine';
import { rougeBaseTokens } from '../../themes/rouge/tokens';
import { THEME_CATALOG } from '../catalog/catalog';
import type { CatalogEntry } from '../catalog/types';
import {
  EMPTY_STATE,
  activate,
  checkCapabilities,
  checkEntryCompatibility,
  compareVersions,
  createLocalStoragePort,
  createMemoryPort,
  deactivate,
  detectUpdates,
  grantForInstall,
  activateLicense,
  install,
  installFromPackage,
  isEntitled,
  isUpdateAvailable,
  listInstalled,
  migrateThemeSettings,
  normalizeState,
  packageFromRecord,
  parsePackage,
  planUpdate,
  putRecord,
  refreshStatus,
  registerCatalog,
  removeRecord,
  serializePackage,
  setActive,
  setInstalledSettings,
  trialRemainingDays,
  uninstall,
  updateInstalled,
  validateCatalogEntry,
  validateInstallable,
  type InstallState,
  type SettingsMigration,
  type ThemeInstallRecord,
} from './index';

const AT = '2026-07-16T00:00:00.000Z';
const LATER = '2026-08-16T00:00:00.000Z';

function makeManifest(over: Partial<ThemeManifest> = {}): ThemeManifest {
  return {
    id: 'test-theme',
    name: 'Test Theme',
    version: '1.0.0',
    description: 'A test theme.',
    author: 'Sellchaze',
    archetype: 'Test',
    tags: [],
    schemaVersion: 2,
    supports: { colorSchemes: ['light', 'dark'] },
    capabilities: [],
    minEngineVersion: '1.0.0',
    settingsSchema: [],
    ...over,
  };
}

function makeModule(manifestOver: Partial<ThemeManifest> = {}): ThemeModule {
  const manifest = makeManifest(manifestOver);
  const tokens = rougeBaseTokens as DesignTokens;
  return { manifest, tokens, defaultSettings: {}, createTokens: () => tokens };
}

function makeEntry(over: Partial<CatalogEntry> = {}): CatalogEntry {
  return {
    id: 'test-theme',
    name: 'Test Theme',
    version: '1.0.0',
    archetype: 'Test',
    description: 'A test theme.',
    author: 'Sellchaze',
    tags: [],
    accent: '#000000',
    minEngineVersion: '1.0.0',
    capabilities: [],
    license: { type: 'free' },
    changelog: [{ version: '1.0.0', date: '2026-07-16', notes: ['Initial.'] }],
    load: () => Promise.resolve(makeModule()),
    ...over,
  };
}

function installedRecord(over: Partial<ThemeInstallRecord> = {}): ThemeInstallRecord {
  return {
    id: 'test-theme',
    version: '1.0.0',
    installedAt: AT,
    updatedAt: AT,
    settings: {},
    license: { type: 'free', status: 'active', grantedAt: AT },
    ...over,
  };
}

/* -------------------------------------------------------------- versioning */
describe('versioning', () => {
  it('compares semver correctly', () => {
    expect(compareVersions('1.0.0', '1.0.0')).toBe('current');
    expect(compareVersions('1.0.0', '1.1.0')).toBe('behind');
    expect(compareVersions('2.0.0', '1.9.9')).toBe('ahead');
    expect(compareVersions('x', '1.0.0')).toBe('unknown');
  });
  it('detects updates only when strictly newer', () => {
    expect(isUpdateAvailable('1.0.0', '1.0.1')).toBe(true);
    expect(isUpdateAvailable('1.0.0', '1.0.0')).toBe(false);
    expect(isUpdateAvailable('1.1.0', '1.0.0')).toBe(false);
  });
});

/* -------------------------------------------------------------- licensing */
describe('licensing', () => {
  it('grants free themes active immediately', () => {
    const g = grantForInstall({ type: 'free' }, AT);
    expect(g.status).toBe('active');
    expect(isEntitled(g, AT)).toBe(true);
  });
  it('grants premium themes no entitlement until activated', () => {
    const g = grantForInstall({ type: 'premium', price: 49 }, AT);
    expect(g.status).toBe('none');
    expect(isEntitled(g, AT)).toBe(false);
    const active = activateLicense(g, 'KEY-123', AT);
    expect(active.status).toBe('active');
    expect(isEntitled(active, AT)).toBe(true);
  });
  it('grants a trial that expires', () => {
    const g = grantForInstall({ type: 'trial', trialDays: 14 }, AT);
    expect(g.status).toBe('trial');
    expect(isEntitled(g, AT)).toBe(true);
    expect(trialRemainingDays(g, AT)).toBe(14);
    expect(isEntitled(g, LATER)).toBe(false);
    expect(refreshStatus(g, LATER).status).toBe('expired');
    expect(trialRemainingDays(g, LATER)).toBe(0);
  });
});

/* -------------------------------------------------------------- install-state */
describe('install-state reducers', () => {
  it('puts, lists, and removes records', () => {
    let s = EMPTY_STATE;
    s = putRecord(s, installedRecord());
    expect(listInstalled(s)).toHaveLength(1);
    s = removeRecord(s, 'test-theme');
    expect(listInstalled(s)).toHaveLength(0);
  });
  it('clears active when the active theme is removed', () => {
    let s = putRecord(EMPTY_STATE, installedRecord());
    s = setActive(s, 'test-theme');
    expect(s.activeId).toBe('test-theme');
    s = removeRecord(s, 'test-theme');
    expect(s.activeId).toBeNull();
  });
});

/* -------------------------------------------------------------- storage */
describe('storage', () => {
  it('normalises garbage to EMPTY_STATE', () => {
    expect(normalizeState(null)).toEqual(EMPTY_STATE);
    expect(normalizeState({ installed: 'nope' })).toEqual(EMPTY_STATE);
    expect(normalizeState(42)).toEqual(EMPTY_STATE);
  });
  it('drops malformed records and dangling activeId', () => {
    const s = normalizeState({
      version: 1,
      installed: { good: installedRecord({ id: 'good' }), bad: { id: 123 } },
      activeId: 'missing',
    });
    expect(Object.keys(s.installed)).toEqual(['good']);
    expect(s.activeId).toBeNull();
  });
  it('round-trips through the localStorage port', () => {
    const backing = new Map<string, string>();
    const fake = {
      getItem: (k: string) => backing.get(k) ?? null,
      setItem: (k: string, v: string) => backing.set(k, v),
    };
    const port = createLocalStoragePort('k', fake);
    const state = putRecord(EMPTY_STATE, installedRecord());
    port.save(state);
    expect(port.load().installed['test-theme']?.version).toBe('1.0.0');
  });
  it('memory port stores and loads', () => {
    const port = createMemoryPort();
    const state = putRecord(EMPTY_STATE, installedRecord());
    port.save(state);
    expect(port.load()).toBe(state);
  });
});

/* -------------------------------------------------------------- packaging */
describe('packaging', () => {
  it('round-trips a package', () => {
    const pkg = packageFromRecord(installedRecord({ settings: { primary_color: '#fff' }, colorScheme: 'dark' }), AT, { name: 'Test' });
    const json = serializePackage(pkg);
    const parsed = parsePackage(json);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.package.theme.id).toBe('test-theme');
      expect(parsed.package.settings['primary_color']).toBe('#fff');
      expect(parsed.package.colorScheme).toBe('dark');
    }
  });
  it('rejects a non-package and bad JSON', () => {
    expect(parsePackage('{}').ok).toBe(false);
    expect(parsePackage('not json').ok).toBe(false);
    expect(parsePackage(JSON.stringify({ format: 'wrong' })).ok).toBe(false);
  });
  it('drops non-primitive settings on parse', () => {
    const json = JSON.stringify({
      format: 'sellchase-theme-package',
      formatVersion: 1,
      theme: { id: 'x', version: '1.0.0' },
      settings: { good: 'a', arr: [1, 2], obj: {} },
      exportedAt: AT,
    });
    const parsed = parsePackage(json);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(Object.keys(parsed.package.settings)).toEqual(['good']);
  });
});

/* -------------------------------------------------------------- compatibility */
describe('compatibility', () => {
  it('accepts a compatible entry', () => {
    expect(checkEntryCompatibility(makeEntry(), '1.0.0').compatible).toBe(true);
  });
  it('rejects when the engine is too old', () => {
    const r = checkEntryCompatibility(makeEntry({ minEngineVersion: '2.0.0' }), '1.0.0');
    expect(r.compatible).toBe(false);
  });
  it('reports capability gaps', () => {
    const rep = checkCapabilities({ capabilities: ['rtl'] }, ['rtl', 'wishlist']);
    expect(rep.satisfied).toBe(false);
    expect(rep.missing).toContain('wishlist');
    expect(rep.supported).toContain('rtl');
  });
});

/* -------------------------------------------------------------- validator */
describe('validator', () => {
  it('passes a well-formed catalog entry', () => {
    expect(validateCatalogEntry(makeEntry()).valid).toBe(true);
  });
  it('flags a bad id and version', () => {
    const rep = validateCatalogEntry(makeEntry({ id: 'Bad ID', version: 'x' }));
    expect(rep.valid).toBe(false);
    expect(rep.errors.length).toBeGreaterThanOrEqual(2);
  });
  it('reports listing↔manifest drift as a warning', () => {
    const rep = validateInstallable(makeEntry({ version: '2.0.0' }), makeModule());
    expect(rep.warnings.some((w) => w.code === 'drift.version')).toBe(true);
  });
  it('every real catalog entry is structurally valid', () => {
    for (const entry of THEME_CATALOG) {
      expect(validateCatalogEntry(entry).valid, `${entry.id} should be valid`).toBe(true);
    }
  });
});

/* -------------------------------------------------------------- migration */
describe('settings migration', () => {
  const migrations: ReadonlyArray<SettingsMigration> = [
    { themeId: 'test-theme', from: '1.0.0', to: '1.1.0', description: 'rename a→b', migrate: (s) => { if ('a' in s) { s['b'] = s['a']; delete s['a']; } } },
    { themeId: 'test-theme', from: '1.1.0', to: '2.0.0', description: 'default c', migrate: (s) => { s['c'] = true; } },
  ];
  it('applies migrations across the upgrade window', () => {
    const r = migrateThemeSettings('test-theme', '1.0.0', '2.0.0', { a: 'x' }, migrations);
    expect(r.settings).toEqual({ b: 'x', c: true });
    expect(r.applied).toHaveLength(2);
  });
  it('applies only the crossed window', () => {
    const r = migrateThemeSettings('test-theme', '1.1.0', '2.0.0', { b: 'x' }, migrations);
    expect(r.settings).toEqual({ b: 'x', c: true });
    expect(r.applied).toHaveLength(1);
  });
  it('is a no-op on downgrade / equal', () => {
    expect(migrateThemeSettings('test-theme', '2.0.0', '1.0.0', { a: 'x' }, migrations).applied).toHaveLength(0);
    expect(migrateThemeSettings('test-theme', '1.0.0', '1.0.0', { a: 'x' }, migrations).applied).toHaveLength(0);
  });
});

/* -------------------------------------------------------------- installer */
describe('installer', () => {
  it('installs a free theme and records it', () => {
    const r = install(EMPTY_STATE, makeEntry(), { module: makeModule(), at: AT });
    expect(r.ok).toBe(true);
    expect(r.record?.version).toBe('1.0.0');
    expect(r.state.activeId).toBeNull();
  });
  it('refuses an incompatible theme', () => {
    const r = install(EMPTY_STATE, makeEntry({ minEngineVersion: '9.0.0' }), { module: makeModule({ minEngineVersion: '9.0.0' }), at: AT });
    expect(r.ok).toBe(false);
  });
  it('uninstalls', () => {
    const installed = install(EMPTY_STATE, makeEntry(), { module: makeModule(), at: AT }).state;
    expect(listInstalled(uninstall(installed, 'test-theme'))).toHaveLength(0);
  });
  it('updates + migrates settings to the new version', () => {
    const migrations: ReadonlyArray<SettingsMigration> = [
      { themeId: 'test-theme', from: '1.0.0', to: '1.1.0', description: 'add flag', migrate: (s) => { s['flag'] = true; } },
    ];
    const base = putRecord(EMPTY_STATE, installedRecord({ settings: {} }));
    const entry = makeEntry({ version: '1.1.0' });
    const mod = makeModule({ version: '1.1.0', settingsSchema: [{ id: 'flag', type: 'toggle', label: 'F', default: false }] });
    const r = updateInstalled(base, entry, { module: mod, at: LATER, migrations });
    expect(r.ok).toBe(true);
    expect(r.record?.version).toBe('1.1.0');
    expect(r.record?.settings['flag']).toBe(true);
    expect(r.record?.installedAt).toBe(AT); // preserved
  });
  it('installs from a package, resolving settings against the schema', () => {
    const mod = makeModule({ settingsSchema: [{ id: 'primary_color', type: 'color', label: 'P', default: '#000' }] });
    const pkg = packageFromRecord(installedRecord({ settings: { primary_color: '#abcabc', junk: 'x' } }), AT);
    const r = installFromPackage(EMPTY_STATE, makeEntry(), pkg, { module: mod, at: AT });
    expect(r.ok).toBe(true);
    expect(r.record?.settings['primary_color']).toBe('#abcabc');
    expect(r.record?.settings['junk']).toBeUndefined(); // unknown key dropped
  });
  it('saves edited settings', () => {
    const base = putRecord(EMPTY_STATE, installedRecord());
    const s = setInstalledSettings(base, 'test-theme', { primary_color: '#fff' }, LATER);
    expect(s.installed['test-theme']?.settings['primary_color']).toBe('#fff');
    expect(s.installed['test-theme']?.updatedAt).toBe(LATER);
  });
});

/* -------------------------------------------------------------- switcher */
describe('switcher', () => {
  it('activates an installed entitled theme', () => {
    const base = putRecord(EMPTY_STATE, installedRecord());
    const r = activate(base, 'test-theme', AT);
    expect(r.ok).toBe(true);
    expect(r.state.activeId).toBe('test-theme');
  });
  it('refuses to activate an un-entitled premium theme', () => {
    const base = putRecord(EMPTY_STATE, installedRecord({ license: { type: 'premium', status: 'none' } }));
    const r = activate(base, 'test-theme', AT);
    expect(r.ok).toBe(false);
    expect(r.state.activeId).toBeNull();
  });
  it('refuses to activate an uninstalled theme', () => {
    expect(activate(EMPTY_STATE, 'nope', AT).ok).toBe(false);
  });
  it('deactivates', () => {
    const base = setActive(putRecord(EMPTY_STATE, installedRecord()), 'test-theme');
    expect(deactivate(base).activeId).toBeNull();
  });
});

/* -------------------------------------------------------------- updates */
describe('updates', () => {
  it('detects an available update with aggregated notes', () => {
    const state: InstallState = putRecord(EMPTY_STATE, installedRecord({ version: '1.0.0' }));
    const catalog = [
      makeEntry({
        version: '1.2.0',
        changelog: [
          { version: '1.2.0', date: '2026-08-01', notes: ['New section.'] },
          { version: '1.0.0', date: '2026-07-16', notes: ['Initial.'] },
        ],
      }),
    ];
    const info = detectUpdates(state, catalog);
    expect(info).toHaveLength(1);
    expect(info[0]?.availableVersion).toBe('1.2.0');
    expect(info[0]?.notes.some((n) => n.includes('New section'))).toBe(true);
  });
  it('reports no update when current', () => {
    const state = putRecord(EMPTY_STATE, installedRecord({ version: '1.0.0' }));
    expect(planUpdate(installedRecord({ version: '1.0.0' }), makeEntry({ version: '1.0.0' }))).toBeNull();
    expect(detectUpdates(state, [makeEntry({ version: '1.0.0' })])).toHaveLength(0);
  });
});

/* -------------------------------------------------------------- catalog + bridge */
describe('catalog + registry bridge', () => {
  it('the real catalog has four unique, valid themes', () => {
    expect(THEME_CATALOG).toHaveLength(4);
    const ids = THEME_CATALOG.map((e) => e.id);
    expect(new Set(ids).size).toBe(4);
    expect(ids).toEqual(expect.arrayContaining(['luxury-fashion', 'voltage', 'hearth', 'rouge']));
  });
  it('registers every catalogued theme into a fresh registry', () => {
    const registry = new ThemeRegistry();
    const added = registerCatalog(THEME_CATALOG, registry);
    expect(added).toHaveLength(4);
    for (const entry of THEME_CATALOG) expect(registry.has(entry.id)).toBe(true);
    // idempotent — re-registering adds nothing.
    expect(registerCatalog(THEME_CATALOG, registry)).toHaveLength(0);
  });
});
