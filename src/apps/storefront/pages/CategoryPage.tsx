/**
 * CategoryPage — /collections/:slug. Fetches the category + its products and renders the `category`
 * template (category-header + product-grid). DEV falls back to preview products.
 *
 * A few slugs are curated views rather than real categories — `all`, `new-arrivals`, `best-sellers`
 * (see ./curated). Fetching a category for those would 404 and strand the primary nav, so they are
 * recognised here and served from the unfiltered products endpoint. No invented endpoint.
 *
 * Merchant collections (manual or automated, managed in the dashboard) share the `/collections/:slug`
 * URL with categories. The collection endpoint is asked first, in parallel with the category
 * listing; a published collection wins, anything else (404, network) falls back to the category, so
 * every existing category link keeps working.
 */
import { previewOrDev } from '../preview';
import { useMemo, type ReactElement } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { kidsListingSearch, sortKidsPreview } from '../themes/nature-kids/listing';
import { ThemeRenderer, useTemplate, type StorefrontContext, useThemeManifest } from '../theme-engine';
import { useStore } from '../state/store-context';
import { useAsync } from '../api/useAsync';
import { getCategory, getCollection, getProducts } from '../api/storefront';
import type { ApiCollection, ApiPaginated, ApiProduct } from '../api/types';
import { toProductCard } from '../api/mappers';
import type { ProductCardModel } from '../types/catalog';
import { useLocale } from '../i18n/useLocale';
import { useTranslation } from 'react-i18next';
import { Seo } from '../seo/Seo';
import { breadcrumbSchema, collectionSchema } from '../seo/schema';
import { sampleCategory, sampleNewest } from '../dev/sampleData';
import { curatedView, isCuratedSlug } from './curated';
import { useProductListingPages } from './useProductListingPages';

/** The merchant collection behind a slug, or null when there is none (or it cannot be read). */
async function findCollection(slug: string, params: { perPage: number; page?: number; sort?: string }): Promise<{ data: ApiCollection; products: ApiPaginated<ApiProduct> } | null> {
  try {
    const response = await getCollection(slug, params);
    return response?.data && response.products ? { data: response.data, products: response.products } : null;
  } catch {
    return null;
  }
}

export function CategoryPage(): ReactElement | null {
  const manifest = useThemeManifest();
  const { locale } = useLocale();
  const { t } = useTranslation();
  // `/shop` has no :slug segment; it is the shop-all view, same as /collections/all.
  const { slug = 'all' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const wallets = manifest.id === 'elite-wallets';
  const kids = ['nature-kids', 'blast-pets', 'nature-pets', 'hype-perfumes', 'hype-fashion', 'elite-wallets'].includes(manifest.id);
  const perPage = wallets ? 20 : kids ? 24 : 60;
  const listing = kidsListingSearch(searchParams);
  const { store } = useStore();
  const currency = store.currency;
  const template = useTemplate('category');
  const curated = isCuratedSlug(slug) ? curatedView(slug) : null;
  // Keyed on the locale as well: the API returns translated names per `?lang=`.
  const category = useAsync(() => (curated ? Promise.resolve(null) : getCategory(slug)), [slug, locale]);
  const listingScope = `${store.id}:${slug}:${locale}:${kids ? listing.sort : "default"}:${perPage}`;
  const productScope = `${listingScope}:${kids ? listing.page : 1}`;
  const collectionKey = `${store.id}:${slug}:${locale}`;
  const productsQ = useAsync(
    async () => {
      const collectionRequest = curated ? Promise.resolve(null) : findCollection(slug, { perPage, ...(kids ? listing : {}) });
      const productsRequest = getProducts({ ...(curated ? {} : { category: slug }), perPage, ...(kids ? listing : {}) });
      productsRequest.catch(() => undefined); // a collection hit makes this response unused
      const collection = await collectionRequest;
      return { scope: productScope, listingScope, collectionKey, collection: collection?.data ?? null, payload: collection?.products ?? await productsRequest };
    },
    [productScope],
  );
  const collection = productsQ.data?.collectionKey === collectionKey ? productsQ.data.collection : null;

  const productsData = productsQ.data?.scope === productScope ? productsQ.data.payload : null;
  const loadedProducts = useProductListingPages(wallets, `${store.id}:${slug}:${locale}:${listing.sort}`, listing.page, productsData?.data);
  const dev = previewOrDev();
  let products: ProductCardModel[] = loadedProducts.map((p) => toProductCard(p, currency, store.currencyMultipliers[currency] ?? 1));
  let previewTotal = 0;
  if (dev && !productsData && (!wallets || (!productsQ.loading && !loadedProducts.length))) {
    products = sampleNewest(manifest.id, locale);
    if (kids && !curated) products = products.filter(product => product.categorySlug === slug);
    previewTotal = products.length;
    if (kids) products = sortKidsPreview(products, listing.sort).slice(wallets ? 0 : (listing.page - 1) * perPage, listing.page * perPage);
  }
  if (curated?.rank && !kids) products = [...curated.rank(products)];

  // A merchant collection takes over the header; otherwise the category (if any) provides it.
  const c = collection ?? category.data?.data;
  // DEV, no API: fall back to the demo category so the page gets its real title
  // and hero image instead of a slug-cased heading with an empty header band.
  const demoCategory = dev && !c && !curated ? sampleCategory(slug, manifest.id, locale) : undefined;
  const title = curated ? t(curated.titleKey) : (c?.name ?? demoCategory?.title ?? slug.replace(/-/g, ' '));
  const headerImage = c?.image_url ?? demoCategory?.image?.src;
  const site = typeof window !== 'undefined' ? window.location.origin : '';

  const context = useMemo<StorefrontContext>(
    () => ({
      store: { name: store.name, currency },
      seo: { title },
      navigation: { header: [], footer: [] },
      data: {
        loading: dev ? false : productsQ.loading || category.loading,
        // Surface the fetch failure so sections can render an error state. Without this the section
        // could only tell "loading" from "empty", and a failed request looked like an empty shelf.
        ...(productsQ.error ? { error: productsQ.error } : {}),
        products,
        ...(kids ? { listing: { ...listing, lastPage: productsData?.meta.last_page ?? (wallets && productsQ.data?.listingScope === listingScope ? productsQ.data.payload.meta.last_page : wallets ? Math.max(1, Math.ceil(previewTotal / perPage)) : 1), loading: productsQ.loading, retry: productsQ.reload,
          change: (sort: typeof listing.sort, page: number): void => { const next = new URLSearchParams(searchParams); next.set('sort', sort); next.set('page', String(page)); setSearchParams(next); } } } : {}),
        pageHeader: {
          title,
          ...(curated
            ? { description: t(curated.descriptionKey) }
            : c?.description
              ? { descriptionHtml: c.description }
              : {}),
          ...(headerImage ? { image: headerImage } : {}),
          children: (collection ? [] : category.data?.children ?? []).map((child) => ({ label: child.name, url: `/collections/${child.slug}` })),
          breadcrumbs: [
            { label: t('nav.home'), url: '/' },
            { label: title, url: `/collections/${slug}` },
          ],
        },
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [productsData, productsQ.data, productsQ.loading, productsQ.error, category.data, category.loading, collection, currency, slug, store.id, store.name, curated, locale, kids, listing.sort, listing.page, searchParams, setSearchParams],
  );

  return (
    <>
      <Seo
        title={c?.seo_title || title}
        path={`/collections/${slug}`}
        {...(c?.seo_description || c?.description ? { description: c.seo_description || c.description?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() } : {})}
        jsonLd={[
          breadcrumbSchema(
            [
              { label: t('nav.home'), url: '/' },
              { label: title, url: `/collections/${slug}` },
            ],
            site,
          ),
          collectionSchema(title, `${site}/collections/${slug}`, products, site),
        ]}
      />
      {template ? <ThemeRenderer page={template} context={context} /> : null}
    </>
  );
}
