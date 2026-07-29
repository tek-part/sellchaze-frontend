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
import { storefrontI18n } from './i18n';
import { StorefrontThemeRoot } from './index';
import { StorefrontApp } from './StorefrontApp';
import { StoreProvider } from './state/store-context';
import { AuthProvider } from './state/auth-context';
import { RecentlyViewedProvider } from './state/recently-viewed';
import { WishlistProvider } from './state/wishlist';
import { PLATFORM_STORAGE_KEY, createLocalStoragePort } from './platform/domain';
import './styles/index.css';
// Editorial layout for the journal/brands pages. App-level, not theme-level: these render the
// shared `.sf-*` library, so a theme stylesheet would leave three themes unstyled. Every value
// reads a token, so each theme's own tokens do the visual differentiation.
import './styles/editorial.css';
import './styles/company.css';
// Shared component skin (buttons, form fields incl. the floating-label mechanics, cards, layout
// helpers). The shared route pages (Auth / Account / Static / NotFound / errors) render luxury's
// `.sf-*` components regardless of the active theme — they hard-import them in JS — but that skin
// used to load ONLY when luxury was the active theme, leaving those pages unstyled under
// hearth/voltage and half-styled under rouge (no floating-label rules). Loading it app-level makes
// the CSS match that JS reality: every value reads a `var(--token)` on <html>, so each theme's own
// tokens still do the visual differentiation, and a theme that wants a different look (rouge) simply
// overrides in its own `shared.css`, which loads afterwards and wins on source order.
import './themes/luxury-fashion/theme.css';
import './themes/luxury-fashion/pages.css';
// Arabic typography + the direction-dependent corrections logical properties cannot make.
import './styles/rtl.css';

const rootElement = document.getElementById('storefront-root');
if (!rootElement) {
  throw new Error('Storefront failed to start: #storefront-root element is missing from the document.');
}

// Theme resolution order:
//   1. explicit `?theme=voltage` (Preview / QA override, optionally `&scheme=dark|light`)
//   2. the merchant's ACTIVE theme from the shared platform state (localStorage) — this is what the
//      dashboard "Activate" writes and what the "View store" link relies on to show the live theme
//   3. the configured default (StorefrontThemeRoot's `defaultThemeId`)
const params = new URLSearchParams(window.location.search);
const activeThemeId = (() => {
  try {
    return createLocalStoragePort(PLATFORM_STORAGE_KEY).load().activeId ?? undefined;
  } catch {
    return undefined;
  }
})();
const themeOverride = params.get('theme') ?? activeThemeId;
const schemeParam = params.get('scheme');
const schemeOverride =
  schemeParam === 'dark' || schemeParam === 'light' || schemeParam === 'auto' ? schemeParam : undefined;

// Theme Studio live preview: an optional `?settings=<base64(json)>` param lets the platform's Live
// Theme Editor preview the active theme with unsaved merchant settings applied. Decode fail-safe.
let settingsOverride: Record<string, string | number | boolean> | undefined;
const settingsParam = params.get('settings');
if (settingsParam) {
  try {
    const decoded: unknown = JSON.parse(decodeURIComponent(atob(settingsParam)));
    if (decoded && typeof decoded === 'object' && !Array.isArray(decoded)) {
      const out: Record<string, string | number | boolean> = {};
      for (const [k, v] of Object.entries(decoded as Record<string, unknown>)) {
        if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') out[k] = v;
      }
      settingsOverride = out;
    }
  } catch {
    settingsOverride = undefined;
  }
}

createRoot(rootElement).render(
  <StrictMode>
    {/*
      i18n wraps the theme root: switching language must not remount the theme (which would drop
      cart, filters and scroll position). Direction is derived from the language by useLocale and
      applied through the engine, so the two can never disagree.
    */}
    <I18nextProvider i18n={storefrontI18n()}>
    <StorefrontThemeRoot
      {...(themeOverride ? { themeId: themeOverride } : {})}
      {...(schemeOverride ? { colorScheme: schemeOverride } : {})}
      {...(settingsOverride ? { settings: settingsOverride } : {})}
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
        <StoreProvider>
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
