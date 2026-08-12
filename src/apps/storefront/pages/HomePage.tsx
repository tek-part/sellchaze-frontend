/**
 * HomePage — fetches the store's catalogue AND all the merchant-editable content the theme's home
 * sections render (hero, why-choose-us, testimonials, brands, coupons, collections, editorial, UGC,
 * newsletter copy) in ONE consolidated request (GET /storefront/home) and packs it into
 * `context.data` for the active theme's `home` template. Every content section reads this real data
 * (see content/home-data.ts) instead of hardcoded settings. In DEV it falls back to preview data if
 * the API isn't reachable, so the store is always demoable.
 */
import { previewOrDev } from '../preview';
import { useMemo, type ReactElement } from 'react';
import { ThemeRenderer, useTemplate, type StorefrontContext, useThemeManifest } from '../theme-engine';
import { useStore } from '../state/store-context';
import { useAsync } from '../api/useAsync';
import { getHome, type ApiLocaleContent } from '../api/storefront';
import { toCategoryCard, toProductCard } from '../api/mappers';
import { buildHomeExtras } from '../content/home-data';
import type { ApiProduct } from '../api/types';
import type { CategoryCardModel, ProductCardModel } from '../types/catalog';
import { useLocale } from '../i18n/useLocale';
import { Seo } from '../seo/Seo';
import { organizationSchema, websiteSchema } from '../seo/schema';
import { sampleCategories, sampleFeatured, sampleNewest } from '../dev/sampleData';

export function HomePage(): ReactElement | null {
  const manifest = useThemeManifest();
  const { locale } = useLocale();
  const { store } = useStore();
  const home = useTemplate('home');
  const currency = store.currency;

  // One request for the entire home page (catalogue rows + merchandising + editable content).
  const bundle = useAsync(() => getHome(), []);

  const context = useMemo<StorefrontContext>(() => {
    const dev = previewOrDev();
    const b = bundle.data?.data;
    const cards = (arr: ReadonlyArray<ApiProduct> | undefined): ProductCardModel[] =>
      arr ? arr.map((p) => toProductCard(p, currency, store.currencyMultipliers[currency] ?? 1)) : [];
    // Pick the active-locale slice of a { en, ar } content payload, falling back to the other locale.
    const pick = (c: ApiLocaleContent): Record<string, unknown> | null =>
      c ? (c[locale] ?? c[locale === 'ar' ? 'en' : 'ar'] ?? null) : null;

    let newest = cards(b?.products);
    let categories: CategoryCardModel[] = b?.categories ? b.categories.map(toCategoryCard) : [];
    if (dev && !b) newest = sampleNewest(manifest.id, locale);
    if (dev && !b) categories = sampleCategories(manifest.id, locale);
    const featured = newest.length > 0 ? newest.slice(0, 4) : dev ? sampleFeatured(manifest.id, locale) : [];

    // Real merchandising rows from product flags; fall back to the base set so no rail is empty.
    const best = cards(b?.best_sellers);
    const fresh = cards(b?.new_arrivals);
    const sale = cards(b?.on_sale);
    const trend = cards(b?.trending);
    const topRated = [...newest].sort((a, b2) => (b2.rating ?? 0) - (a.rating ?? 0)).slice(0, 8);
    const orEmpty = (a: ProductCardModel[], fb: ProductCardModel[]): ProductCardModel[] => (a.length ? a : fb);

    const extras = buildHomeExtras(
      pick(b?.content?.home ?? null),
      pick(b?.content?.about ?? null),
      b?.brands ?? [],
      b?.coupons ?? [],
      b?.collections ?? [],
      pick(b?.content?.faq ?? null),
    );

    return {
      store: { name: store.name, currency },
      seo: {},
      navigation: { header: [], footer: [] },
      data: {
        loading: dev ? false : bundle.loading,
        ...(bundle.error ? { error: bundle.error } : {}),
        categories,
        collections: {
          newest,
          featured,
          all: newest,
          bestsellers: orEmpty(best, newest.slice(0, 8)),
          'best-sellers': orEmpty(best, newest.slice(0, 8)),
          'new-arrivals': orEmpty(fresh, newest.slice(0, 8)),
          sale: orEmpty(sale, newest.filter((p) => p.compareAtPrice && p.compareAtPrice > p.price).slice(0, 8)),
          'flash-deals': orEmpty(sale, newest.slice(0, 8)),
          trending: orEmpty(trend, newest.slice(0, 8)),
          'top-rated': topRated,
        },
        ...extras,
      },
    };
  }, [bundle.data, bundle.loading, bundle.error, currency, store.currencyMultipliers, store.name, manifest.id, locale]);

  const site = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <>
      <Seo path="/" jsonLd={[organizationSchema(store.name, site), websiteSchema(store.name, site)]} />
      {home ? <ThemeRenderer page={home} context={context} /> : null}
    </>
  );
}
