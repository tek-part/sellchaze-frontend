/**
 * Live-customizer state — a tiny external store (no React context needed) that the
 * `CustomizeBridge` writes from editor postMessages and pages read via `useCustomizerState()`.
 *
 *   active     — the SPA was opened with `?customize=1` (inside the dashboard's customizer iframe)
 *   sections   — the draft home/page sections pushed by the editor (`hydrate`), or null before the
 *                first hydrate (pages then render their normal API/theme composition)
 *   path       — which route the draft belongs to ('/' or '/pages/<slug>')
 *   selectedId — the section the editor wants outlined/scrolled into view
 */
import { useSyncExternalStore } from 'react';
import type { SectionInstance } from '../theme-engine/rendering';

export interface CustomizerState {
  readonly active: boolean;
  readonly sections: ReadonlyArray<SectionInstance> | null;
  readonly path: string;
  readonly selectedId: string | null;
  readonly locale: string | null;
}

/** True when the storefront runs inside the dashboard customizer iframe. */
export function isCustomizeMode(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('customize') === '1';
}

let state: CustomizerState = Object.freeze({
  active: isCustomizeMode(),
  sections: null,
  path: '/',
  selectedId: null,
  locale: null,
});

const listeners = new Set<() => void>();

function emit(): void {
  for (const l of listeners) l();
}

export function getCustomizerState(): CustomizerState {
  return state;
}

export function setCustomizerState(patch: Partial<CustomizerState>): void {
  state = Object.freeze({ ...state, ...patch });
  emit();
}

/** Test/HMR helper. */
export function resetCustomizerState(): void {
  state = Object.freeze({ active: isCustomizeMode(), sections: null, path: '/', selectedId: null, locale: null });
  emit();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useCustomizerState(): CustomizerState {
  return useSyncExternalStore(subscribe, getCustomizerState, getCustomizerState);
}

/**
 * The editor's draft sections for `path`, when the customizer has hydrated that route; otherwise
 * null so the page falls back to its API/theme composition.
 */
export function useCustomizerSections(path: string): ReadonlyArray<SectionInstance> | null {
  const s = useCustomizerState();
  if (!s.active || !s.sections) return null;
  return normalizePath(s.path) === normalizePath(path) ? s.sections : null;
}

export function normalizePath(path: string): string {
  const p = (path || '/').split('?')[0]!.replace(/\/+$/, '');
  return p === '' ? '/' : p;
}
