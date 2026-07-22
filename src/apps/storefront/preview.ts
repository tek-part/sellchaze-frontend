/**
 * Theme-preview detection.
 *
 * A theme preview (the `?preview=1` links the dashboard's theme manager opens)
 * renders the storefront to SHOW a theme's look — it is not a live customer
 * store. On the dashboard host there is no store to resolve and no live API, so
 * the preview must render from the same demo data the app uses in development.
 *
 * `import.meta.env.DEV` alone does not cover this: a production build sets it to
 * false and tree-shakes the demo data out. Referencing `isPreview()` alongside
 * the DEV guards keeps that data in the bundle and lets a deployed preview use
 * it, while a real storefront (no `?preview=1`) is completely unaffected.
 */
export function isPreview(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return new URLSearchParams(window.location.search).get('preview') === '1';
}

/**
 * True when the storefront should render from demo data — i.e. development OR a
 * theme preview. Plain function (not a hook) so pages can call it inline next to
 * their existing `import.meta.env.DEV` checks.
 */
export function previewOrDev(): boolean {
  return import.meta.env.DEV || isPreview();
}
