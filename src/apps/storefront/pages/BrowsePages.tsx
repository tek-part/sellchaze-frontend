/**
 * Browse pages — the directory destinations the Shop mega menu links to.
 *
 * `/categories` and `/collections` both read the existing categories endpoint; they differ in
 * presentation, not data (a category grid vs. an editorial collection list), which matches how the
 * catalogue is actually modelled. `/brands` has no endpoint at all — the product resource carries a
 * brand name but the API exposes no brand index — so it derives the brand list from the products it
 * can see and says plainly where that list comes from. No endpoint is invented anywhere here.
 */
import { previewOrDev } from '../preview';
import { useMemo, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Container, EmptyState, ErrorState, Section, Spinner } from '../themes/luxury-fashion/components';
import { useLocale } from '../i18n/useLocale';
import { Seo } from '../seo/Seo';
import { useStore } from '../state/store-context';
import { useAsync } from '../api/useAsync';
import { getCategories, getProducts } from '../api/storefront';
import { toCategoryCard, toProductCard } from '../api/mappers';
import { breadcrumbSchema } from '../seo/schema';
import { sampleCategories, sampleNewest } from '../dev/sampleData';
import { ThemeRenderer, useTemplate, type StorefrontContext, useThemeManifest } from '../theme-engine';

function useSite(): string {
  return typeof window !== 'undefined' ? window.location.origin : '';
}

function crumbs(label: string, url: string, site: string): Record<string, unknown> {
  return breadcrumbSchema(
    [
      { label: 'Home', url: '/' },
      { label, url },
    ],
    site,
  );
}

/* ------------------------------------------------------------------ categories & collections */

function useCategoryContext(title: string, description: string): {
  context: StorefrontContext;
  loading: boolean;
  error: Error | null;
  count: number;
} {
  const { t } = useTranslation();
  const { store } = useStore();
  const manifest = useThemeManifest();
  const { locale } = useLocale();
  const categoriesQ = useAsync(() => getCategories(), []);
  const dev = previewOrDev();

  const categories = useMemo(() => {
    if (categoriesQ.data) return categoriesQ.data.data.map(toCategoryCard);
    return dev ? sampleCategories(manifest.id, locale) : [];
  }, [categoriesQ.data, dev, manifest.id, locale]);

  const context = useMemo<StorefrontContext>(
    () => ({
      store: { name: store.name, currency: store.currency },
      seo: { title },
      navigation: { header: [], footer: [] },
      data: {
        loading: dev ? false : categoriesQ.loading,
        ...(categoriesQ.error ? { error: categoriesQ.error } : {}),
        categories,
        pageHeader: {
          title,
          description,
          breadcrumbs: [
            { label: t('nav.home'), url: '/' },
            { label: title, url: '#' },
          ],
        },
      },
    }),
    [categories, categoriesQ.loading, categoriesQ.error, dev, store.name, store.currency, title, description],
  );

  return { context, loading: categoriesQ.loading, error: categoriesQ.error, count: categories.length };
}

export function CategoriesPage(): ReactElement {
  const { t } = useTranslation();
  const site = useSite();
  const { context, loading, error, count } = useCategoryContext(
    t('nav.categories'),
    t('browse.categoriesDesc'),
  );
  const template = useTemplate('category');

  return (
    <>
      <Seo
        title="Categories"
        path="/categories"
        description="Browse the full range by category."
        jsonLd={[crumbs('Categories', '/categories', site)]}
      />
      <BrowseBody template={template} context={context} loading={loading} error={error} count={count} empty={t('browse.noCategories')} emptyText={t('browse.noCategoriesHint')} />
    </>
  );
}

export function CollectionsPage(): ReactElement {
  const { t } = useTranslation();
  const site = useSite();
  const { context, loading, error, count } = useCategoryContext(
    t('nav.collections'),
    t('browse.collectionsDesc'),
  );
  const template = useTemplate('category');

  return (
    <>
      <Seo
        title="Collections"
        path="/collections"
        description="Curated groupings from across the catalogue."
        jsonLd={[crumbs('Collections', '/collections', site)]}
      />
      <BrowseBody template={template} context={context} loading={loading} error={error} count={count} empty={t('browse.noCollections')} emptyText={t('browse.noCollectionsHint')} />
    </>
  );
}

function BrowseBody(props: {
  template: ReturnType<typeof useTemplate>;
  context: StorefrontContext;
  loading: boolean;
  error: Error | null;
  count: number;
  empty: string;
  emptyText: string;
}): ReactElement {
  const { t } = useTranslation();
  const { template, context, loading, error, count, empty, emptyText } = props;

  if (error && count === 0) {
    return (
      <Section>
        <Container>
          <ErrorState title={t('browse.loadFailed')} description={error.message || t('browse.tryAgainShortly')} />
        </Container>
      </Section>
    );
  }
  if (loading && count === 0) {
    return (
      <Section>
        <Container>
          <div style={{ display: 'grid', placeItems: 'center', minHeight: '30vh' }}>
            <Spinner label={t('common.loading')} />
          </div>
        </Container>
      </Section>
    );
  }
  if (count === 0) {
    return (
      <Section>
        <Container>
          <EmptyState variant="generic" title={empty} description={emptyText} />
        </Container>
      </Section>
    );
  }
  return template ? <ThemeRenderer page={template} context={context} /> : <></>;
}

/* ------------------------------------------------------------------ brands */

interface BrandEntry {
  name: string;
  count: number;
}

export function BrandsPage(): ReactElement {
  const { t } = useTranslation();
  const site = useSite();
  const { store } = useStore();
  const manifest = useThemeManifest();
  const { locale } = useLocale();
  const productsQ = useAsync(() => getProducts({ perPage: 60 }), []);
  const dev = previewOrDev();

  const brands = useMemo<BrandEntry[]>(() => {
    const source = productsQ.data
      ? productsQ.data.data.map((p) => toProductCard(p, store.currency))
      : dev
        ? sampleNewest(manifest.id, locale)
        : [];
    const tally = new Map<string, number>();
    for (const product of source) {
      const vendor = product.vendor?.trim();
      if (vendor) tally.set(vendor, (tally.get(vendor) ?? 0) + 1);
    }
    return [...tally.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [productsQ.data, store.currency, dev, manifest.id, locale]);

  return (
    <Section>
      <Seo
        title="Brands"
        path="/brands"
        description={`The brands stocked at ${store.name}.`}
        jsonLd={[crumbs('Brands', '/brands', site)]}
      />
      <Container>
        <div className="sf-page-head">
          <h1 className="sf-page-head__title">{t('nav.brands')}</h1>
          <p className="sf-page-head__sub">{t('browse.brandsSub', { store: store.name })}</p>
        </div>

        {productsQ.error && brands.length === 0 ? (
          <ErrorState
            title={t('browse.loadBrandsFailed')}
            description={productsQ.error.message || t('browse.tryAgainShortly')}
          />
        ) : productsQ.loading && brands.length === 0 ? (
          <div style={{ display: 'grid', placeItems: 'center', minHeight: '30vh' }}>
            <Spinner label={t('common.loading')} />
          </div>
        ) : brands.length === 0 ? (
          <EmptyState
            variant="generic"
            title={t('browse.noBrands')}
            description={t('browse.noBrandsHint')}
          />
        ) : (
          <>
            <ul className="sf-brandgrid">
              {brands.map((brand) => (
                <li key={brand.name} className="sf-brandgrid__item">
                  {/* Search is the only brand-filtered view the API can serve today. */}
                  <a className="sf-brandgrid__link" href={`/search?q=${encodeURIComponent(brand.name)}`}>
                    <span className="sf-brandgrid__name">{brand.name}</span>
                    <span className="sf-brandgrid__count">
                      {t('browse.productCount', { count: brand.count })}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
            {/*
              Stated plainly rather than implied: this list is derived from the products the
              storefront can currently see, not from a brand directory, because the API has none.
            */}
            <p className="sf-brandgrid__note">
              {t('browse.brandsNote')}
            </p>
          </>
        )}
      </Container>
    </Section>
  );
}
