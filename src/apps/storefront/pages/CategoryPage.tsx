/**
 * CategoryPage — /collections/:slug. Fetches the category + its products and renders the `category`
 * template (category-header + product-grid). DEV falls back to preview products.
 *
 * A few slugs are curated views rather than real categories — `all`, `new-arrivals`, `best-sellers`
 * (see ./curated). Fetching a category for those would 404 and strand the primary nav, so they are
 * recognised here and served from the unfiltered products endpoint. No invented endpoint.
 */
import { previewOrDev } from '../preview';
import { useMemo, type ReactElement } from 'react';
import { useParams } from 'react-router-dom';
import { ThemeRenderer, useTemplate, type StorefrontContext, useThemeManifest } from '../theme-engine';
import { useStore } from '../state/store-context';
import { useAsync } from '../api/useAsync';
import { getCategory, getProducts } from '../api/storefront';
import { toProductCard } from '../api/mappers';
import type { ProductCardModel } from '../types/catalog';
import { useLocale } from '../i18n/useLocale';
import { useTranslation } from 'react-i18next';
import { Seo } from '../seo/Seo';
import { breadcrumbSchema, collectionSchema } from '../seo/schema';
import { sampleCategory, sampleNewest } from '../dev/sampleData';
import { curatedView, isCuratedSlug } from './curated';

export function CategoryPage(): ReactElement | null {
  const manifest = useThemeManifest();
  const { locale } = useLocale();
  const { t } = useTranslation();
  // `/shop` has no :slug segment; it is the shop-all view, same as /collections/all.
  const { slug = 'all' } = useParams();
  const { store } = useStore();
  const currency = store.currency;
  const template = useTemplate('category');
  const curated = isCuratedSlug(slug) ? curatedView(slug) : null;
  const category = useAsync(() => (curated ? Promise.resolve(null) : getCategory(slug)), [slug]);
  const productsQ = useAsync(
    () => getProducts(curated ? { perPage: 60 } : { category: slug, perPage: 60 }),
    [slug],
  );

  const dev = previewOrDev();
  let products: ProductCardModel[] = productsQ.data ? productsQ.data.data.map((p) => toProductCard(p, currency, store.currencyMultipliers[currency] ?? 1)) : [];
  if (dev && !productsQ.data) products = sampleNewest(manifest.id, locale);
  if (curated?.rank) products = [...curated.rank(products)];

  const c = category.data?.data;
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
        pageHeader: {
          title,
          ...(curated
            ? { description: t(curated.descriptionKey) }
            : c?.description
              ? { description: c.description }
              : {}),
          ...(headerImage ? { image: headerImage } : {}),
          breadcrumbs: [
            { label: t('nav.home'), url: '/' },
            { label: title, url: `/collections/${slug}` },
          ],
        },
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [productsQ.data, productsQ.loading, productsQ.error, category.data, category.loading, currency, slug, store.name, curated],
  );

  return (
    <>
      <Seo
        title={title}
        path={`/collections/${slug}`}
        {...(c?.description ? { description: c.description } : {})}
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
