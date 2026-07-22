/**
 * HomePage — fetches the store's products + categories and renders the theme's `home` template via
 * the engine. In DEV it falls back to preview data if the API isn't reachable, so the store is always
 * demoable; production shows whatever the API returns (empty states if nothing).
 */
import { previewOrDev } from '../preview';
import { useMemo, type ReactElement } from 'react';
import { ThemeRenderer, useTemplate, type StorefrontContext, useThemeManifest } from '../theme-engine';
import { useStore } from '../state/store-context';
import { useAsync } from '../api/useAsync';
import { getCategories, getProducts } from '../api/storefront';
import { toCategoryCard, toProductCard } from '../api/mappers';
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
  const products = useAsync(() => getProducts({ perPage: 12 }), []);
  const cats = useAsync(() => getCategories(), []);
  const currency = store.currency;

  const context = useMemo<StorefrontContext>(() => {
    const dev = previewOrDev();
    let newest: ProductCardModel[] = products.data ? products.data.data.map((p) => toProductCard(p, currency)) : [];
    let categories: CategoryCardModel[] = cats.data ? cats.data.data.map(toCategoryCard) : [];
    if (dev && !products.data) newest = sampleNewest(manifest.id, locale);
    if (dev && !cats.data) categories = sampleCategories(manifest.id, locale);
    const featured = newest.length > 0 ? newest.slice(0, 4) : dev ? sampleFeatured(manifest.id, locale) : [];

    // Themes merchandise by named collection ('bestsellers', 'sale', …). Previously only `newest`
    // and `featured` were supplied, so every other named rail resolved to nothing and rendered
    // empty on every theme. These are derived from the products we already hold — no extra request,
    // and each is described by what it actually ranks on rather than implying sales data the API
    // does not expose.
    const bestsellers = [...newest]
      .sort((a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0) || (b.rating ?? 0) - (a.rating ?? 0))
      .slice(0, 8);
    const sale = newest.filter((p) => p.compareAtPrice && p.compareAtPrice > p.price).slice(0, 8);
    const topRated = [...newest].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 8);
    return {
      store: { name: store.name, currency },
      seo: {},
      navigation: { header: [], footer: [] },
      data: {
        loading: dev ? false : products.loading || cats.loading,
        // Let sections distinguish a failed fetch from an empty catalogue.
        ...(products.error ? { error: products.error } : {}),
        categories,
        collections: { newest, featured, bestsellers, sale, 'top-rated': topRated, all: newest },
      },
    };
  }, [products.data, products.loading, products.error, cats.data, cats.loading, currency, store.name, manifest.id, locale]);

  const site = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <>
      <Seo path="/" jsonLd={[organizationSchema(store.name, site), websiteSchema(store.name, site)]} />
      {home ? <ThemeRenderer page={home} context={context} /> : null}
    </>
  );
}
