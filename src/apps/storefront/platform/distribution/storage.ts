/**
 * Distribution-state persistence — a localStorage port with a fail-safe normaliser (malformed blob →
 * EMPTY_DISTRIBUTION_STATE) plus an in-memory adapter for tests/SSR. Mirrors the platform storage port.
 */
import type { ThemeSettingValue } from '../../theme-engine';
import type { LicenseGrant, LicenseStatus } from '../domain/licensing';
import {
  DISTRIBUTION_STATE_VERSION,
  EMPTY_DISTRIBUTION_STATE,
  type DistributionAction,
  type DistributionState,
  type InstalledPackage,
  type Snapshot,
} from './installer';

export interface DistributionPort {
  load(): DistributionState;
  save(state: DistributionState): void;
}

const LICENSE_STATUSES: ReadonlyArray<LicenseStatus> = ['active', 'trial', 'expired', 'none'];
const ACTIONS: ReadonlyArray<DistributionAction> = ['install', 'update', 'uninstall'];

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}
function settingsOf(raw: unknown): Record<string, ThemeSettingValue> {
  const out: Record<string, ThemeSettingValue> = {};
  if (isObj(raw)) for (const [k, v] of Object.entries(raw)) if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') out[k] = v;
  return out;
}
function licenseOf(raw: unknown): LicenseGrant {
  if (!isObj(raw)) return { type: 'free', status: 'active' };
  const type = raw['type'] === 'premium' || raw['type'] === 'trial' ? raw['type'] : 'free';
  const status = typeof raw['status'] === 'string' && LICENSE_STATUSES.includes(raw['status'] as LicenseStatus) ? (raw['status'] as LicenseStatus) : 'active';
  return {
    type,
    status,
    ...(typeof raw['grantedAt'] === 'string' ? { grantedAt: raw['grantedAt'] } : {}),
    ...(typeof raw['trialEndsAt'] === 'string' ? { trialEndsAt: raw['trialEndsAt'] } : {}),
    ...(typeof raw['key'] === 'string' ? { key: raw['key'] } : {}),
  };
}
function packageOf(raw: unknown): InstalledPackage | null {
  if (!isObj(raw) || typeof raw['id'] !== 'string') return null;
  const installedAt = typeof raw['installedAt'] === 'string' ? raw['installedAt'] : '';
  return {
    id: raw['id'],
    version: typeof raw['version'] === 'string' ? raw['version'] : '0.0.0',
    loaderId: typeof raw['loaderId'] === 'string' ? raw['loaderId'] : raw['id'],
    integrity: typeof raw['integrity'] === 'string' ? raw['integrity'] : '',
    ...(typeof raw['signatureKeyId'] === 'string' ? { signatureKeyId: raw['signatureKeyId'] } : {}),
    signatureTrusted: raw['signatureTrusted'] === true,
    license: licenseOf(raw['license']),
    settings: settingsOf(raw['settings']),
    installedAt,
    updatedAt: typeof raw['updatedAt'] === 'string' ? raw['updatedAt'] : installedAt,
  };
}
function installedMapOf(raw: unknown): Record<string, InstalledPackage> {
  const out: Record<string, InstalledPackage> = {};
  if (isObj(raw)) for (const [id, v] of Object.entries(raw)) {
    // Prototype-pollution hardening: skip dangerous keys before the object-valued assignment.
    if (id === '__proto__' || id === 'constructor' || id === 'prototype') continue;
    const p = packageOf(v); if (p && p.id === id) out[id] = p;
  }
  return out;
}
function snapshotOf(raw: unknown): Snapshot | null {
  if (!isObj(raw) || typeof raw['packageId'] !== 'string') return null;
  const action = typeof raw['action'] === 'string' && ACTIONS.includes(raw['action'] as DistributionAction) ? (raw['action'] as DistributionAction) : 'install';
  return {
    at: typeof raw['at'] === 'string' ? raw['at'] : '',
    action,
    packageId: raw['packageId'],
    version: typeof raw['version'] === 'string' ? raw['version'] : '0.0.0',
    previous: installedMapOf(raw['previous']),
  };
}

export function normalizeDistributionState(raw: unknown): DistributionState {
  if (!isObj(raw)) return EMPTY_DISTRIBUTION_STATE;
  const history = Array.isArray(raw['history'])
    ? raw['history'].map(snapshotOf).filter((s): s is Snapshot => s !== null)
    : [];
  return { version: DISTRIBUTION_STATE_VERSION, installed: installedMapOf(raw['installed']), history };
}

export function createMemoryDistributionPort(initial: DistributionState = EMPTY_DISTRIBUTION_STATE): DistributionPort {
  let current = initial;
  return { load: () => current, save: (s) => { current = s; } };
}

interface WebStorageLike { getItem(key: string): string | null; setItem(key: string, value: string): void }
function resolveStorage(explicit?: WebStorageLike): WebStorageLike | null {
  if (explicit) return explicit;
  try {
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) return (globalThis as unknown as { localStorage: WebStorageLike }).localStorage;
  } catch { /* blocked */ }
  return null;
}

export function createDistributionPort(key: string, storage?: WebStorageLike): DistributionPort {
  const store = resolveStorage(storage);
  if (!store) return createMemoryDistributionPort();
  return {
    load: () => {
      try { const raw = store.getItem(key); return raw ? normalizeDistributionState(JSON.parse(raw)) : EMPTY_DISTRIBUTION_STATE; } catch { return EMPTY_DISTRIBUTION_STATE; }
    },
    save: (state) => { try { store.setItem(key, JSON.stringify(state)); } catch { /* quota */ } },
  };
}

export const DISTRIBUTION_STORAGE_KEY = 'sellchase.theme-distribution.v1';
