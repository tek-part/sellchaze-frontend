/**
 * Shared, app-agnostic media-query helpers (SSR-safe). Framework-level utilities usable by
 * any app module. The storefront Theme Engine uses these to resolve `color_scheme: auto`
 * and `prefers-reduced-motion` without coupling to any theme or dashboard code.
 */

const canMatchMedia = typeof window !== 'undefined' && typeof window.matchMedia === 'function';

/** True when the OS prefers a dark colour scheme. Returns `false` when unknown (SSR). */
export function prefersDarkScheme(): boolean {
  return canMatchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/** True when the user has requested reduced motion. Returns `false` when unknown (SSR). */
export function prefersReducedMotion(): boolean {
  return canMatchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Subscribe to a media query. Returns an unsubscribe function. No-op (returns a noop
 * unsubscribe) when `matchMedia` is unavailable, so callers never need to branch on SSR.
 */
export function watchMedia(query: string, onChange: (matches: boolean) => void): () => void {
  if (!canMatchMedia) return () => {};
  const mql = window.matchMedia(query);
  const handler = (event: MediaQueryListEvent): void => onChange(event.matches);
  mql.addEventListener('change', handler);
  return () => mql.removeEventListener('change', handler);
}
