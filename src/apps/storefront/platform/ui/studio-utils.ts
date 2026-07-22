/** Theme Studio — small UI-only helpers (no domain logic). */
import type { ColorSchemePreference, ThemeSettingValue } from '../../theme-engine';

export function cx(...parts: ReadonlyArray<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/** Trigger a client-side text-file download (import/export). */
export function downloadText(filename: string, text: string, mime = 'application/json'): void {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Base64-encode settings for the storefront live-preview URL (`?settings=`). Unicode-safe. */
export function encodeSettingsParam(settings: Readonly<Record<string, ThemeSettingValue>>): string {
  try {
    return btoa(encodeURIComponent(JSON.stringify(settings)));
  } catch {
    return '';
  }
}

/**
 * Build a full-storefront preview URL for a theme (honours scheme + unsaved settings).
 *
 * Points at the storefront ROOT, not a separate document: preview launches the same application a
 * customer uses, distinguished only by the query params. `preview=1` is what tells the dev server
 * this is a storefront request (the dashboard shares the origin in dev); in production the store's
 * own host already makes that unambiguous, so the same URL works untouched.
 */
export function previewUrl(
  id: string,
  scheme?: ColorSchemePreference,
  settings?: Readonly<Record<string, ThemeSettingValue>>,
): string {
  const params = new URLSearchParams({ theme: id, preview: '1' });
  if (scheme) params.set('scheme', scheme);
  if (settings && Object.keys(settings).length > 0) {
    const encoded = encodeSettingsParam(settings);
    if (encoded) params.set('settings', encoded);
  }
  return `/?${params.toString()}`;
}
