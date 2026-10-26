/**
 * ProductPage — /products/:slug. Fetches the product, its reviews and a related set, then renders the
 * `product` template (product-details + related-products). DEV falls back to a preview product.
 */
import { previewOrDev } from '../preview';
import { lazy, Suspense, useEffect, useMemo, type ReactElement } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { ThemeRenderer, useTemplate, type StorefrontContext, useThemeManifest } from '../theme-engine';
import { Button, Container, ErrorState, Section, Spinner } from '../foundation/components';
import { useStore } from '../state/store-context';
import { useAsync } from '../api/useAsync';
import { getProduct, getProductReviews, getProducts } from '../api/storefront';
import { toProductCard, toProductDetail, toReview } from '../api/mappers';
import type { ProductCardModel, ProductDetailModel, ReviewModel } from '../types/catalog';
import { useLocale } from '../i18n/useLocale';
import { useTranslation } from 'react-i18next';
import { Seo } from '../seo/Seo';
import { breadcrumbSchema, productSchema } from '../seo/schema';
import { useRecentlyViewed } from '../state/recently-viewed';
import { sampleNewest, sampleProductDetail } from '../dev/sampleData';
import { useProductAdvertising } from '../advertising/hooks';
import { catalogVariantSelection, resolveVariant, selectionAutomatic, variantAvailable } from '../state/variant-selection';
import { variantImage } from '../utils/variant-image';
import { recordReferral } from '../analytics/events';
import { referralFromSearch } from '../../../shared/marketing/referral';
import { useProductPresentation } from '../state/product-presentation';
import { ProductPurchaseProvider } from '../state/product-purchase';
import { parseLanding } from '../landing/document';

const LandingProductLayout = lazy(() => import('../landing/LandingProductLayout'));
const FrequentlyBoughtTogether = lazy(() => import('../bundles/FrequentlyBoughtTogether'));

export function ProductPage(): ReactElement | null {
  const manifest = useThemeManifest();
  const { locale } = useLocale();
  const { t } = useTranslation();
  const { slug = '' } = useParams();
  const [searchParams] = useSearchParams(); const catalogVariantId = searchParams.get('variant');
  const { store } = useStore();
  const currency = store.currency;
  const template = useTemplate('product');
  // Keyed on the locale as well: the API returns translated names/descriptions per `?lang=`.
  const productQ = useAsync(() => getProduct(slug), [slug, locale]);
  const reviewsQ = useAsync(() => getProductReviews(slug), [slug, locale]);
  const relatedQ = useAsync(() => getProducts({ perPage: 8 }), [slug, locale]);
  const referralSearch = searchParams.toString(); const referralProductId = productQ.data?.data.id;
  useEffect(() => {
    if (referralProductId && !productQ.loading && !productQ.error) recordReferral(store.id, referralFromSearch(referralSearch, Number(referralProductId)));
  }, [store.id, referralProductId, referralSearch, productQ.loading, productQ.error]);

  const { record } = useRecentlyViewed();
  const dev = previewOrDev();
  const multiplier = store.currencyMultipliers[currency] ?? 1;
  let detail: ProductDetailModel | null = productQ.data?.data.slug === slug && !productQ.error ? toProductDetail(productQ.data.data, currency, multiplier) : null;
  if (dev && !detail && !productQ.loading) detail = sampleProductDetail(slug, manifest.id, locale);
  useProductPresentation(detail?.id, detail?.productPreferences);

  // Record the view (client-side history) once the product resolves.
  const viewedId = detail?.id;
  useProductAdvertising(productQ.data ? viewedId : undefined, detail?.variants?.find((row) => row.id === catalogVariantId)?.id);
  useEffect(() => {
    if (detail && viewedId) {
      const { images: _images, media: _media, variants: _variants, descriptionHtml: _d, ...card } = detail;
      record(card);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewedId]);

  const context = useMemo<StorefrontContext>(() => {
    const landingDocument=parseLanding(productQ.data?.data.landing_page);
    const reviews: ReviewModel[] = detail?.productPreferences?.is_reviews_enabled === false ? [] : reviewsQ.data ? reviewsQ.data.data.map(toReview) : [];
    let related: ProductCardModel[] = relatedQ.data ? relatedQ.data.data.map((p) => toProductCard(p, currency, multiplier)) : [];
    if (dev && !relatedQ.data) related = sampleNewest(manifest.id, locale).slice(0, 6);
    related = related.filter((product) => product.id !== detail?.id).map((product) => ({ ...product, analyticsSource: 'cross_sell' }));

    return {
      store: { name: store.name, currency },
      seo: detail ? { title: detail.title } : {},
      navigation: { header: [], footer: [] },
      data: {
        loading: dev ? false : productQ.loading,
        product: detail,
        catalogVariantId,
        landingCheckout: landingDocument?.sections.some(section => section.type === 'checkout') ?? false,
        presetInlineCheckout: landingDocument?.mode==='below'&&landingDocument.sections.some(section=>section.type==='product_preset'),
        reviews,
        collections: { related },
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productQ.data, productQ.loading, reviewsQ.data, relatedQ.data, currency, slug, store.name, catalogVariantId]);

  const site = typeof window !== 'undefined' ? window.location.origin : '';
  const landing = parseLanding(productQ.data?.data.landing_page);
  const productUrl = `${site}/products/${slug}`;
  const metadataVariant = detail ? resolveVariant(detail.variants ?? [], catalogVariantSelection(detail.variants ?? [], catalogVariantId), selectionAutomatic(store.autoSelectVariants, detail.autoSelectVariants)) : undefined;
  const metadataBasePrice = metadataVariant?.price ?? detail?.price ?? 0;
  const metadataOffer = detail?.quantityOffers?.find((row) => row.quantity === 1 && row.unitPrice <= metadataBasePrice);
  const metadataImage = detail ? variantImage(detail, metadataVariant) : undefined;
  const metadataSelection = { price: metadataOffer?.unitPrice ?? metadataBasePrice, inStock: detail?.inStock !== false && (!metadataVariant || variantAvailable(metadataVariant)),
    ...(metadataVariant && detail ? { sku: `p${detail.id}-v${metadataVariant.id}` } : {}), ...(metadataImage ? { image: metadataImage } : {}) };

  // Hard load failure (no product to show) → recoverable error state.
  if (!detail && productQ.error) {
    return (
      <Section>
        <Container>
          <ErrorState
            headingLevel={1}
            title={t('pdp.unavailableTitle')}
            description={t('pdp.unavailableBody')}
            actions={<Button onClick={productQ.reload}>{t('pdp.tryAgain')}</Button>}
          />
        </Container>
      </Section>
    );
  }
  if (!detail && productQ.loading) {
    return (
      <Section>
        <Container>
          <div style={{ display: 'grid', placeItems: 'center', minHeight: '40vh' }}>
            <Spinner label={t('pdp.loadingProduct')} />
          </div>
        </Container>
      </Section>
    );
  }

  const templateBody = template ? <div data-landing-fallback><ThemeRenderer page={detail?.productPreferences?.hide_related_products ? { ...template, sections: template.sections.filter((section) => section.type !== 'related-products') } : template} context={context} /></div> : null;

  return (
    <>
      {detail ? (
        <Seo
          title={detail.title}
          type="product"
          path={`/products/${slug}`}
          {...(detail.image ? { image: detail.image.src } : {})}
          {...(detail.descriptionHtml ? { description: detail.descriptionHtml.replace(/<[^>]+>/g, '').slice(0, 160) } : {})}
          jsonLd={[
            productSchema(detail, productUrl + (catalogVariantId && metadataVariant ? `?variant=${metadataVariant.id}` : ''), metadataSelection),
            breadcrumbSchema(
              [
                { label: t('nav.home'), url: '/' },
                { label: detail.title, url: `/products/${slug}` },
              ],
              site,
            ),
          ]}
        />
      ) : null}
      <ProductPurchaseProvider key={detail?.id ?? slug}>
        {landing ? (
          <Suspense fallback={null}><LandingProductLayout landing={landing} context={context} template={templateBody} /></Suspense>
        ) : templateBody}
      </ProductPurchaseProvider>
      {store.bundlesEnabled && detail ? <Suspense fallback={null}><FrequentlyBoughtTogether productId={detail.id} /></Suspense> : null}
    </>
  );
}
