/**
 * ProductPage — /products/:slug. Fetches the product, its reviews and a related set, then renders the
 * `product` template (product-details + related-products). DEV falls back to a preview product.
 */
import { previewOrDev } from '../preview';
import { useEffect, useMemo, type ReactElement } from 'react';
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

  const { record } = useRecentlyViewed();
  const dev = previewOrDev();
  const multiplier = store.currencyMultipliers[currency] ?? 1;
  let detail: ProductDetailModel | null = productQ.data ? toProductDetail(productQ.data.data, currency, multiplier) : null;
  if (dev && !detail && !productQ.loading) detail = sampleProductDetail(slug, manifest.id, locale);

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
    const reviews: ReviewModel[] = reviewsQ.data ? reviewsQ.data.data.map(toReview) : [];
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
        reviews,
        collections: { related },
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productQ.data, productQ.loading, reviewsQ.data, relatedQ.data, currency, slug, store.name, catalogVariantId]);

  const site = typeof window !== 'undefined' ? window.location.origin : '';
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
      {template ? <ThemeRenderer page={template} context={context} /> : null}
    </>
  );
}
