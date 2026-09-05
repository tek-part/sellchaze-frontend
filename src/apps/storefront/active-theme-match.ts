/**
 * Whether the mounted theme is the store's ACTIVE theme.
 *
 * `?theme=<key>` previews (marketplace "Preview", QA overrides) mount a different package than the
 * one the merchant published. In that case the merchant's saved theme settings, custom CSS and the
 * stored home composition belong to another theme and must not be layered onto the preview — the
 * preview shows the theme's own defaults instead. Set once by `main.tsx` before mounting.
 */
let matches = true;

export function setActiveThemeMatch(value: boolean): void {
  matches = value;
}

export function activeThemeMatches(): boolean {
  return matches;
}
