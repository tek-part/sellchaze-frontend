/**
 * Install-state persistence — a small port with a localStorage adapter and an in-memory adapter
 * (tests / SSR). Loading is fail-safe: any malformed / partial persisted blob normalises to a valid
 * state (worst case `EMPTY_STATE`), so a corrupt store never crashes the platform.
 */
import type { ColorSchemePreference, Direction, ThemeSettingValue } from '../../theme-engine';
import {
  EMPTY_STATE,
  INSTALL_STATE_VERSION,
  type InstallState,
  type ThemeInstallRecord,
} from './install-state';
import type { LicenseGrant, LicenseStatus } from './licensing';

export interface StatePort {
  load(): InstallState;
  save(state: InstallState): void;
}

const LICENSE_STATUSES: ReadonlyArray<LicenseStatus> = ['active', 'trial', 'expired', 'none'];

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function normalizeSettings(raw: unknown): Record<string, ThemeSettingValue> {
  const out: Record<string, ThemeSettingValue> = {};
  if (!isObject(raw)) return out;
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') out[k] = v;
  }
  return out;
}

function normalizeLicense(raw: unknown): LicenseGrant {
  if (!isObject(raw)) return { type: 'free', status: 'active' };
  const type = raw['type'] === 'premium' || raw['type'] === 'trial' ? raw['type'] : 'free';
  const status: LicenseStatus =
    typeof raw['status'] === 'string' && LICENSE_STATUSES.includes(raw['status'] as LicenseStatus)
      ? (raw['status'] as LicenseStatus)
      : 'active';
  return {
    type,
    status,
    ...(typeof raw['grantedAt'] === 'string' ? { grantedAt: raw['grantedAt'] } : {}),
    ...(typeof raw['trialEndsAt'] === 'string' ? { trialEndsAt: raw['trialEndsAt'] } : {}),
    ...(typeof raw['key'] === 'string' ? { key: raw['key'] } : {}),
  };
}

function normalizeRecord(raw: unknown): ThemeInstallRecord | null {
  if (!isObject(raw) || typeof raw['id'] !== 'string' || raw['id'] === '') return null;
  const version = typeof raw['version'] === 'string' ? raw['version'] : '0.0.0';
  const installedAt = typeof raw['installedAt'] === 'string' ? raw['installedAt'] : '';
  const scheme = raw['colorScheme'];
  const dir = raw['direction'];
  return {
    id: raw['id'],
    version,
    installedAt,
    updatedAt: typeof raw['updatedAt'] === 'string' ? raw['updatedAt'] : installedAt,
    settings: normalizeSettings(raw['settings']),
    ...(scheme === 'light' || scheme === 'dark' || scheme === 'auto'
      ? { colorScheme: scheme as ColorSchemePreference }
      : {}),
    ...(dir === 'ltr' || dir === 'rtl' ? { direction: dir as Direction } : {}),
    license: normalizeLicense(raw['license']),
  };
}

/** Coerce any parsed value into a valid `InstallState` (fail-safe). */
export function normalizeState(raw: unknown): InstallState {
  if (!isObject(raw) || !isObject(raw['installed'])) return EMPTY_STATE;
  const installed: Record<string, ThemeInstallRecord> = {};
  for (const [id, value] of Object.entries(raw['installed'])) {
    // Security: never let an attacker-controlled localStorage key (__proto__/constructor/
    // prototype) reach the object-valued assignment below (prototype-pollution hardening).
    if (id === '__proto__' || id === 'constructor' || id === 'prototype') continue;
    const record = normalizeRecord(value);
    if (record && record.id === id) installed[id] = record;
  }
  const activeRaw = raw['activeId'];
  const activeId =
    typeof activeRaw === 'string' && Object.prototype.hasOwnProperty.call(installed, activeRaw)
      ? activeRaw
      : null;
  return { version: INSTALL_STATE_VERSION, installed, activeId };
}

/** In-memory adapter — for tests and SSR. */
export function createMemoryPort(initial: InstallState = EMPTY_STATE): StatePort {
  let current = initial;
  return {
    load: () => current,
    save: (state) => {
      current = state;
    },
  };
}

interface WebStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function resolveStorage(explicit?: WebStorageLike): WebStorageLike | null {
  if (explicit) return explicit;
  try {
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
      return (globalThis as unknown as { localStorage: WebStorageLike }).localStorage;
    }
  } catch {
    // localStorage access can throw (privacy mode / sandbox) — fall through to null.
  }
  return null;
}

/**
 * localStorage-backed adapter. Absent/blocked storage degrades to an in-memory shadow, so the
 * platform still runs (just non-persistent) rather than crashing.
 */
export function createLocalStoragePort(key: string, storage?: WebStorageLike): StatePort {
  const store = resolveStorage(storage);
  if (!store) return createMemoryPort();
  return {
    load: () => {
      try {
        const raw = store.getItem(key);
        if (!raw) return EMPTY_STATE;
        return normalizeState(JSON.parse(raw));
      } catch {
        return EMPTY_STATE;
      }
    },
    save: (state) => {
      try {
        store.setItem(key, JSON.stringify(state));
      } catch {
        // Quota / privacy errors are non-fatal — the in-memory state remains authoritative.
      }
    },
  };
}

export const PLATFORM_STORAGE_KEY = 'sellchase.theme-platform.v1';
