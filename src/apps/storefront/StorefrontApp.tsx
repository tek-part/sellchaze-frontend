/**
 * StorefrontApp — resolves the active theme's `default` layout (global chrome) and renders the
 * router inside it, so the header/footer/cart persist across navigations while the page content
 * changes. The base context (store, navigation, announcements) drives the chrome; each page builds
 * its own context for its sections.
 *
 * Navigation comes from the store's categories (with static shop links); in DEV it uses preview
 * nav/footer so the chrome is fully populated without a seeded backend.
 */
import { previewOrDev } from './preview';
import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocale } from './i18n/useLocale';
import { useDirection, useLayout, useThemeManifest, type StorefrontContext } from './theme-engine';
import { useStore } from './state/store-context';
import { useAsync } from './api/useAsync';
import { getCategories } from './api/storefront';
import type { ApiNavItem } from './api/types';
import { pickLocalized } from './i18n/localized';
import type { FooterGroup, NavItem } from './types/navigation';
import { AppRoutes } from './pages/AppRoutes';
import { AppErrorBoundary } from './AppErrorBoundary';
import { NavigationInterceptor } from './pages/NavigationInterceptor';
import { RouteAnnouncer } from './pages/RouteAnnouncer';
import { CustomizeBridge } from './customize/CustomizeBridge';
import { isCustomizeMode } from './customize/customizer-state';

type PreviewData = typeof import('./dev/sampleData');

/**
 * Copyright year for rendered chrome. A literal, not `new Date()`: engine invariant I4 requires
 * rendered output to be deterministic so the SSR and Blade paths byte-match. Bumped at release.
 */
const BUILD_YEAR = 2026;

/**
 * Header navigation — a conventional premium-storefront bar.
 *
 * Every URL here resolves to a route registered in AppRoutes. The merchandising entries are curated
 * views (see pages/curated) and the directory entries are real pages; the store's own categories are
 * nested inside Shop rather than promoted to top level, so the bar stays stable no matter how many
 * categories a merchant creates.
 */
function buildHeaderNav(categories: ReadonlyArray<NavItem>, t: (key: string) => string): NavItem[] {
  const shopChildren: NavItem[] = [
    { label: t('nav.allProducts'), url: '/shop' },
    { label: t('nav.newArrivals'), url: '/collections/new-arrivals' },
    { label: t('nav.bestSellers'), url: '/collections/best-sellers' },
    { label: t('nav.collections'), url: '/collections' },
    { label: t('nav.categories'), url: '/categories' },
    { label: t('nav.brands'), url: '/brands' },
  ];

  return [
    { label: t('nav.home'), url: '/' },
    {
      label: t('nav.shop'),
      url: '/shop',
      children: shopChildren,
      // The mega menu renders `children` as its first column and `columns` as the rest, so a store
      // with no categories yet degrades to a plain dropdown rather than an empty panel.
      ...(categories.length > 0
        ? { columns: [{ title: t('nav.shopByCategory'), items: categories.slice(0, 8) }] }
        : {}),
    },
    { label: t('nav.about'), url: '/about' },
    { label: t('nav.blog'), url: '/blog' },
    { label: t('nav.contact'), url: '/contact' },
  ];
}

/**
 * Footer link columns derived from live data. Shop links come from the store's own categories; the
 * remaining columns point only at routes `AppRoutes` actually registers, so the footer can never
 * emit a dead link. Columns with no links are dropped rather than rendered empty.
 */
function buildFooter(categories: ReadonlyArray<NavItem>, t: (key: string) => string): FooterGroup[] {
  const groups: FooterGroup[] = [];
  const shop = categories.slice(0, 5);
  if (shop.length > 0) groups.push({ title: t('footer.shopColumn'), links: shop });
  groups.push({
    title: t('footer.help'),
    links: [
      { label: 'Contact us', url: '/contact' },
      { label: 'FAQ', url: '/faq' },
      { label: 'Track your order', url: '/account/orders' },
      { label: 'Wishlist', url: '/wishlist' },
    ],
  });
  groups.push({
    title: t('footer.accountColumn'),
    links: [
      { label: 'Sign in', url: '/login' },
      { label: 'Create account', url: '/register' },
      { label: 'My orders', url: '/account/orders' },
      { label: 'Addresses', url: '/account/addresses' },
    ],
  });
  groups.push({
    title: t('footer.company'),
    links: [
      { label: 'About us', url: '/about' },
      { label: 'Journal', url: '/blog' },
    ],
  });
  return groups;
}

/**
 * Merchant-managed menus (dashboard → Menus) arrive on the bootstrap payload as typed items
 * (`{ label, label_i18n, type, target, children }`). Map each to a route this app serves: a
 * category → its collection page, a product → its PDP, an internal path as-is, a raw URL untouched.
 */
function navUrl(item: ApiNavItem): string {
  if (item.url) return item.url;
  const target = (item.target ?? '').trim();
  switch (item.type) {
    case 'category':
      return target ? `/collections/${target}` : '/categories';
    case 'product':
      return target ? `/products/${target}` : '/shop';
    case 'internal':
      if (!target) return '/';
      return target.startsWith('/') ? target : `/${target}`;
    default:
      return target || '/';
  }
}

function toNavItems(items: ReadonlyArray<ApiNavItem>, locale: string, fallback: string): NavItem[] {
  return items.map((item) => {
    const label = pickLocalized(item.label_i18n ?? item.label, locale, fallback) || item.label || '';
    const children = item.children?.length ? toNavItems(item.children, locale, fallback) : null;
    return { label, url: navUrl(item), ...(children ? { children } : {}) };
  });
}

/**
 * A footer menu is flat or one level deep: an item with children becomes a titled column; loose
 * top-level links are gathered into one "Links" column so nothing the merchant added is dropped.
 */
function footerFromMenu(items: ReadonlyArray<ApiNavItem>, locale: string, fallback: string, t: (key: string) => string): FooterGroup[] {
  const groups: FooterGroup[] = [];
  const loose: { label: string; url: string }[] = [];
  for (const item of toNavItems(items, locale, fallback)) {
    if (item.children?.length) groups.push({ title: item.label, links: item.children.map(({ label, url }) => ({ label, url })) });
    else loose.push({ label: item.label, url: item.url });
  }
  if (loose.length > 0) groups.unshift({ title: t('footer.links'), links: loose });
  return groups;
}

export function StorefrontApp(): ReactElement {
  const manifest = useThemeManifest();
  const { t } = useTranslation();
  // Applies direction + <html lang> from the active language. Called here so every theme gets it
  // without each one having to remember.
  const { locale } = useLocale();
  const direction = useDirection();
  const Layout = useLayout('default');
  const { store, navigation, setCurrency } = useStore();
  // Re-fetched per locale: category names in the chrome come back translated by the API (`?lang=`).
  const categoriesQ = useAsync(() => getCategories(), [locale]);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);

  useEffect(() => {
    if (!previewOrDev()) return;

    let active = true;
    void import('./dev/sampleData').then((module) => {
      if (active) setPreviewData(module);
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    document.documentElement.dir = direction;
  }, [direction]);

  const context = useMemo<StorefrontContext>(() => {
    const dev = previewOrDev();
    const categoryNav: NavItem[] = categoriesQ.data
      ? categoriesQ.data.data.map((c) => ({ label: c.name, url: `/collections/${c.slug}` }))
      : [];
    // A merchant-managed menu wins when it has items; otherwise fall back to the generated chrome
    // (categories + the routes AppRoutes registers) so a store without menus still navigates.
    const menuHeader = navigation.header.length > 0 ? toNavItems(navigation.header, locale, store.defaultLocale) : null;
    const header: NavItem[] = menuHeader
      ?? (dev && previewData && categoryNav.length === 0
        ? previewData.sampleNav(manifest.id, t, locale)
        : buildHeaderNav(categoryNav, t));
    // Production previously rendered an EMPTY footer (`[]`), so every live storefront shipped a
    // footer with no links. Build real groups from the store's own categories plus the routes that
    // actually exist in AppRoutes — never links to routes we do not serve.
    const menuFooter = navigation.footer.length > 0 ? footerFromMenu(navigation.footer, locale, store.defaultLocale, t) : null;
    const footer: FooterGroup[] = menuFooter
      ?? (dev && previewData && categoryNav.length === 0
        ? previewData.sampleFooter(manifest.id, t, locale)
        : buildFooter(categoryNav, t));
    const announcements = dev && previewData ? previewData.sampleAnnouncements(manifest.id, locale) : [];

    return {
      store: {
        name: store.name,
        currency: store.currency,
        ...(store.description ? { description: store.description } : {}),
      },
      seo: {},
      navigation: { header, footer },
      data: {
        announcements,
        freeShippingThreshold: 200,
        // Resolved once here, at the app boundary, so rendered chrome carries no request-time clock
        // (engine invariant I4) while never going stale in source.
        year: BUILD_YEAR,
        payments: ['Visa', 'Mastercard', 'American Express', 'PayPal', 'Apple Pay'],
        // Social handles are merchant data the storefront API does not expose yet; shown in DEV
        // preview only so the chrome reads complete, never fabricated for a live store.
        ...(dev && previewData ? { social: previewData.sampleSocial() } : {}),
      },
    };
  }, [categoriesQ.data, navigation, store.name, store.currency, store.description, store.defaultLocale, manifest.id, t, locale, previewData]);

  return (
    <div className="sf-root" data-theme-id={manifest.id}>
      {store.supportedCurrencies.length > 1 ? (
        <label className="fixed bottom-4 end-4 z-[var(--z-toast,9999)] rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs shadow-lg">
          <span className="sr-only">Display currency</span>
          <select aria-label="Display currency" value={store.currency} onChange={(event) => setCurrency(event.target.value)} className="bg-transparent font-semibold outline-none">
            {store.supportedCurrencies.map((currency) => <option key={currency} value={currency}>{currency}</option>)}
          </select>
        </label>
      ) : null}
      <NavigationInterceptor />
      <RouteAnnouncer />
      {isCustomizeMode() ? <CustomizeBridge /> : null}
      <a
        href="#sf-main"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-50 focus:bg-ink focus:px-4 focus:py-2 focus:text-on-ink"
        onClick={(e) => {
          // Move focus to the main region directly rather than relying on a hash jump, so the
          // URL stays clean and the target is actually focused for assistive tech.
          e.preventDefault();
          const main = document.getElementById('sf-main');
          if (main) {
            main.setAttribute('tabindex', '-1');
            main.focus();
          }
        }}
      >
        Skip to content
      </a>
      {Layout ? (
        <Layout context={context}>
          <AppErrorBoundary>
            <AppRoutes />
          </AppErrorBoundary>
        </Layout>
      ) : (
        <main id="sf-main">
          <AppErrorBoundary>
            <AppRoutes />
          </AppErrorBoundary>
        </main>
      )}
    </div>
  );
}
