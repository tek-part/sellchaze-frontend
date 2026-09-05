/**
 * useHomeContext — the store-wide data bundle every section-driven page (home, custom builder
 * pages) renders from: catalogue rows + merchandising + editable content in ONE request
 * (GET /storefront/home), packed into `StorefrontContext.data`. DEV/preview falls back to demo data
 * when the API isn't reachable, so the store is always demoable. Shared by HomePage + BuilderPage.
 */
import { useMemo } from 'react';
import { previewOrDev } from '../preview';
import { useThemeManifest, type StorefrontContext } from '../theme-engine';
import { useStore } from '../state/store-context';
import { useAsync } from '../api/useAsync';
import { getHome, type ApiLocaleContent } from '../api/storefront';
import { toCategoryCard, toProductCard } from '../api/mappers';
import { buildHomeExtras } from '../content/home-data';
import type { ApiProduct } from '../api/types';
import type { CategoryCardModel, ProductCardModel } from '../types/catalog';
import { useLocale } from '../i18n/useLocale';
import { pickLocaleContent } from '../i18n/localized';
import { sampleCategories, sampleFeatured, sampleNewest } from '../dev/sampleData';

export interface HomeContextResult {
  context: StorefrontContext;
  loading: boolean;
}

export function useHomeContext(): HomeContextResult {
  const manifest = useThemeManifest();
  const { locale } = useLocale();
  const { store } = useStore();
  const currency = store.currency;

  // One request for the entire home page (catalogue rows + merchandising + editable content).
  // Keyed on the locale: product/category names come back translated by the API (`?lang=`).
  const bundle = useAsync(() => getHome(), [locale]);

  const context = useMemo<StorefrontContext>(() => {
    const dev = previewOrDev();
    const b = bundle.data?.data;
    const cards = (arr: ReadonlyArray<ApiProduct> | undefined): ProductCardModel[] =>
      arr ? arr.map((p) => toProductCard(p, currency, store.currencyMultipliers[currency] ?? 1)) : [];
    // Pick the active-locale slice of a { en, ar, … } content payload: locale → store default → any.
    const pick = (c: ApiLocaleContent): Record<string, unknown> | null => pickLocaleContent(c, locale, store.defaultLocale);

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

    // Named collections the API exposes (by slug and by id) so a `collection` field can reference one.
    const named: Record<string, ProductCardModel[]> = {};
    for (const c of b?.collections ?? []) {
      if (c.products && c.products.length > 0) {
        const items = cards(c.products);
        named[c.slug] = items;
        named[String(c.id)] = items;
      }
    }

    return {
      store: { name: store.name, currency },
      seo: {},
      navigation: { header: [], footer: [] },
      data: {
        loading: dev ? false : bundle.loading,
        ...(bundle.error ? { error: bundle.error } : {}),
        categories,
        collections: {
          ...named,
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
  }, [bundle.data, bundle.loading, bundle.error, currency, store.currencyMultipliers, store.name, store.defaultLocale, manifest.id, locale]);

  return { context, loading: bundle.loading };
}
