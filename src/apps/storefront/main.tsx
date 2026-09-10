/**
 * Storefront entry — an isolated Vite entry document, independent of the
 * dashboard's `src/main.jsx`. It gets its own CSS bundle (`styles/index.css` → its own Tailwind
 * v4 build), so the storefront and dashboard design systems never share a `@theme` namespace.
 *
 * This bootstraps React and mounts: ThemeRoot (theme engine) → Router → StoreProvider → App. The
 * store info + routes live inside the theme runtime so pages resolve templates/layouts and read the
 * active theme's tokens, colour-scheme and direction with zero further wiring.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { detectLocale, storefrontI18n } from './i18n';
import { pickLocalized } from './i18n/localized';
import { StorefrontThemeRoot, registerThemes, storefrontConfig, themeRegistry } from './index';
import { StorefrontApp } from './StorefrontApp';
import { StoreProvider } from './state/store-context';
import { AuthProvider } from './state/auth-context';
import { RecentlyViewedProvider } from './state/recently-viewed';
import { WishlistProvider } from './state/wishlist';
import type { ApiStorefrontBootstrap } from './api/storefront';
import { loadStorefrontBootstrap } from './api/bootstrap';
import type { ThemeSettingValue } from './theme-engine/types';
import { applyLegacyThemeAlias, resolveStorefrontThemeId } from './theme-resolution';
import { setActiveThemeMatch } from './active-theme-match';
import './styles/index.css';
// Editorial layout for the journal/brands pages. App-level, not theme-level: these render the
// shared `.sf-*` library, so a theme stylesheet would leave three themes unstyled. Every value
// reads a token, so each theme's own tokens do the visual differentiation.
import './styles/editorial.css';
import './styles/company.css';
// Foundation skin (buttons, form fields incl. the floating-label mechanics, cards, layout helpers,
// page flows). The shared route pages (Auth / Account / Cart / Checkout / Static / NotFound / errors)
// and the library PDP render the foundation's `.sf-*` components regardless of the active theme —
// they hard-import them in JS — so the skin loads app-level to match. Every value reads a
// `var(--token)` on <html>, so each theme's own tokens still do the visual differentiation, and a
// theme that wants a different look overrides in its own `shared.css`, which loads afterwards and
// wins on source order.
import './foundation/base.css';
import './foundation/pages.css';
// Arabic typography + the direction-dependent corrections logical properties cannot make.
import './styles/rtl.css';

// A deploy replaces hashed bundles; a tab opened before it may lazy-load a chunk that no longer
// exists. Vite reports that as `vite:preloadError` — reload once so the page picks up the new build.
window.addEventListener('vite:preloadError', (event: Event) => {
    const key = 'sellchaze:reloaded-for-stale-chunk';
    if (sessionStorage.getItem(key) === window.location.href) return; // avoid a reload loop
    sessionStorage.setItem(key, window.location.href);
    event.preventDefault();
    window.location.reload();
});


const rootElement = document.getElementById('storefront-root');
if (!rootElement) {
  throw new Error('Storefront failed to start: #storefront-root element is missing from the document.');
}
const storefrontContainer = rootElement;

// Theme resolution order (see ./theme-resolution.ts):
//   1. explicit `?theme=voltage` (Preview / QA override, optionally `&scheme=dark|light`)
//   2. the merchant's ACTIVE theme from the API bootstrap (`theme.key`) — what the dashboard
//      "Activate" publishes and what the "View store" link / customizer iframe rely on
//   3. the configured default (`storefrontConfig.defaultThemeId`)
const params = new URLSearchParams(window.location.search);
const explicitTheme = params.get('theme') ?? undefined;
const schemeParam = params.get('scheme');
const schemeOverride =
  schemeParam === 'dark' || schemeParam === 'light' || schemeParam === 'auto' ? schemeParam : undefined;

// Theme Studio live preview: an optional `?settings=<base64(json)>` param lets the platform's Live
// Theme Editor preview the active theme with unsaved merchant settings applied. Decode fail-safe.
// Translatable settings arrive as `{ ar: '…', en: '…' }` maps and are picked for the preview's
// language (`?lang=`, which detectLocale honours first) — the editor re-issues the URL per tab.
let settingsOverride: Record<string, string | number | boolean> | undefined;
const settingsParam = params.get('settings');
if (settingsParam) {
  try {
    const decoded: unknown = JSON.parse(decodeURIComponent(atob(settingsParam)));
    if (decoded && typeof decoded === 'object' && !Array.isArray(decoded)) {
      const previewLocale = detectLocale();
      const out: Record<string, string | number | boolean> = {};
      for (const [k, v] of Object.entries(decoded as Record<string, unknown>)) {
        if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') out[k] = v;
        else if (v && typeof v === 'object' && !Array.isArray(v)) out[k] = pickLocalized(v, previewLocale);
      }
      settingsOverride = out;
    }
  } catch {
    settingsOverride = undefined;
  }
}

async function bootstrap(): Promise<void> {
  // i18n first: it seeds the API client's locale so the bootstrap request carries `?lang=` (the
  // navigation labels and theme copy it returns are language-resolved server-side).
  const i18n = storefrontI18n();

  // ONE bootstrap request for the whole document. It runs in every mode — live store host, dev
  // `?preview=1`, and the customizer iframe `?preview=1&customize=1` — because the SPA has no
  // Blade-injected initial data and the store's ACTIVE theme lives only in this payload. The
  // promise is cached, so StoreProvider (which receives the result as `initialData`) never
  // re-fetches. On failure (no store for this host / network) `initialData` stays undefined and
  // everything below behaves exactly as before: default theme, DEV/preview demo fallback.
  let initialData: ApiStorefrontBootstrap | undefined;
  try {
    initialData = await loadStorefrontBootstrap();
  } catch {
    // The store context exposes the normal unresolved-host state; preview/local mode still renders.
  }

  // Resolve the theme id BEFORE mounting so the ThemeProvider loads the right package on first
  // paint (no default-theme → active-theme flash). Registering the catalog here is idempotent — the theme root
  // calls it again — and is what lets the resolver fail closed on a key the registry does not know.
  registerThemes();
  const bootstrapTheme = initialData?.theme ?? null;
  const themeId = resolveStorefrontThemeId({
    explicitTheme: explicitTheme ?? null,
    bootstrapKey: bootstrapTheme?.key ?? null,
    hasRemoteBundle: Boolean(bootstrapTheme?.bundle_url && bootstrapTheme.bundle_integrity && bootstrapTheme.version),
    isRegistered: (id) => themeRegistry.has(id),
    fallbackId: storefrontConfig.defaultThemeId,
  });

  // Settings precedence (lowest → highest): theme defaults < published bootstrap settings <
  // `?settings=` live-preview param < customizer `hydrate` (applied later through
  // `updateSettings`, which the ThemeProvider layers above this prop).
  // Merchant settings/CSS/layout only apply when the mounted package IS the active theme; a
  // `?theme=` preview of another theme shows that theme's own defaults.
  const activeKey = bootstrapTheme?.key ? applyLegacyThemeAlias(bootstrapTheme.key) : null;
  // `?defaults=1` forces the theme's own defaults (marketplace screenshots / clean previews).
  const themeMatchesStore = !bootstrapTheme || (activeKey === themeId && params.get('defaults') !== '1');
  setActiveThemeMatch(themeMatchesStore);
  // Prefer the raw locale maps (`settings_i18n`) over the server-flattened `settings`: the engine
  // picks the current language itself, so switching languages updates translatable settings
  // (announcement text, headlines) without re-fetching the bootstrap.
  const bootstrapSettings = themeMatchesStore
    ? ((bootstrapTheme?.settings_i18n ?? bootstrapTheme?.settings) as Partial<Record<string, ThemeSettingValue>> | undefined)
    : undefined;
  const effectiveSettings =
    bootstrapSettings || settingsOverride ? { ...bootstrapSettings, ...settingsOverride } : undefined;
  const customCss = themeMatchesStore ? bootstrapTheme?.custom_css : undefined;
  if (customCss) {
    const style = document.createElement('style');
    style.id = 'sellchaze-merchant-css';
    style.textContent = customCss;
    document.head.appendChild(style);
  }

  createRoot(storefrontContainer).render(
    <StrictMode>
    {/*
      i18n wraps the theme root: switching language must not remount the theme (which would drop
      cart, filters and scroll position). Direction is derived from the language by useLocale and
      applied through the engine, so the two can never disagree.
    */}
    <I18nextProvider i18n={i18n}>
    <StorefrontThemeRoot
      themeId={themeId}
      {...(initialData?.theme?.bundle_url ? { bundleUrl: initialData.theme.bundle_url } : {})}
      {...(initialData?.theme?.bundle_integrity ? { bundleIntegrity: initialData.theme.bundle_integrity } : {})}
      {...(initialData?.theme?.version ? { bundleVersion: initialData.theme.version } : {})}
      {...(schemeOverride ? { colorScheme: schemeOverride } : {})}
      {...(effectiveSettings ? { settings: effectiveSettings } : {})}
    >
      {/*
        BrowserRouter, not HashRouter. In production the storefront is the ROOT of a store's own
        host (resolve.store middleware), so `/about` is simply the about page — clean, crawlable,
        shareable URLs with no `#`. The hash router only ever existed because dev serves the
        storefront and the dashboard from one Vite origin; a dev-only middleware now disambiguates
        on `preview=1` instead (see vite.config.js), so both routers can own real paths.

        `preview` and `theme` are query params, which BrowserRouter preserves across navigation
        automatically — no special handling needed to keep a preview session alive.
      */}
      <BrowserRouter>
        <StoreProvider {...(initialData ? { initialData } : {})}>
          <AuthProvider>
            <WishlistProvider>
              <RecentlyViewedProvider>
                <StorefrontApp />
              </RecentlyViewedProvider>
            </WishlistProvider>
          </AuthProvider>
        </StoreProvider>
      </BrowserRouter>
    </StorefrontThemeRoot>
    </I18nextProvider>
    </StrictMode>,
  );
}

void bootstrap();

const platformHosts = new Set(['sellchaze.com', 'www.sellchaze.com']);
const isStoreHost = !platformHosts.has(window.location.hostname.toLowerCase());

if ('serviceWorker' in navigator && import.meta.env.PROD && isStoreHost) {
  window.addEventListener('load', () => {
    // Tenant hosts served through the Laravel shell do not host the worker script (the request
    // falls through to the HTML shell), so only register when a real script is present.
    void fetch('/storefront-sw.js', { method: 'HEAD', cache: 'no-store' })
      .then((res) => {
        const type = res.headers.get('content-type') ?? '';
        if (!res.ok || !/javascript/i.test(type)) return;
        return navigator.serviceWorker.register('/storefront-sw.js', { scope: '/' }).then(() => undefined);
      })
      .catch(() => undefined);
  });
}
