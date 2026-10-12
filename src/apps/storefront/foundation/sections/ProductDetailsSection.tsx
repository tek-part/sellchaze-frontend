import { UiBlock } from '../../ui-blocks/UiBlocks';
/**
 * product-details — the PDP buy box (convert). Gallery + price + variant selection + quantity +
 * add-to-cart (optimistic via the cart store, single toast) + wishlist/share + description/shipping
 * tabs + reviews. Reads the product from context.data.product. Settings: show_sku, show_share,
 * gallery_layout. §08 product-details.
 */
import { useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useInRouterContext, useNavigate } from 'react-router-dom';
import { withSessionParams } from '../../pages/NavigationInterceptor';
import { QuantityOfferPicker } from '../components/QuantityOfferPicker';
import type { QuantityOffer } from '../../types/quantity-offers';
import type { SectionRenderProps } from '../../theme-engine/rendering';
import { Container } from '../components/Container';
import { ProductGallery } from '../components/ProductGallery';
import { ProductDescription } from '../components/ProductDescription';
import { Price } from '../components/Price';
import { ProductOfferPrice } from '../components/ProductOfferPrice';
import { Rating } from '../components/Rating';
import { ProductOptionPicker } from '../components/ProductOptionPicker';
import { ProductPersonalizationFields } from '../components/ProductPersonalizationFields';
import type { PersonalizationChoice } from '../../types/personalization';
import { personalizedLineId, normalizedPersonalization, personalizationReady } from '../../utils/personalization';
import { blankSelection, resolveVariant, selectionFor, variantAvailable, type VariantSelection } from '../../state/variant-selection';
import { boundedQuantity, cartAdditionLimit } from '../../state/cart-quantity';
import { variantGallery, variantImage } from '../../utils/variant-image';
import { QuantityStepper } from '../components/QuantityStepper';
import { Button } from '../components/Button';
import { WishlistButton } from '../components/WishlistButton';
import { ShareButton } from '../components/ShareButton';
import { Tabs } from '../components/Tabs';
import { ReviewList, ReviewSummary } from '../components/Reviews';
import { useCart } from '../../state/cart';
import { useVariantSelectionAutomatic } from '../../state/store-context';
import { useWishlist } from '../../state/wishlist';
import { useToast } from '../components/toast/useToast';
import { productDetailOf, reviewsFor } from './section-data';
import { flag } from './section-settings';

function RoutedBuyNow({ disabled, add }: { disabled: boolean; add: () => boolean }): ReactElement {
  const navigate = useNavigate(); const { i18n } = useTranslation();
  return <Button className="sf-pdp__buy-now" disabled={disabled} onClick={() => { if (add()) navigate(withSessionParams('/checkout', window.location.search)); }}>{i18n.language.startsWith('ar') ? 'اشترِ الآن' : 'Buy now'}</Button>;
}

function BuyNow(props: { disabled: boolean; add: () => boolean }): ReactElement {
  const routed = useInRouterContext(); const { i18n } = useTranslation();
  return routed ? <RoutedBuyNow {...props} /> : <Button disabled className="sf-pdp__buy-now">{i18n.language.startsWith('ar') ? 'اشترِ الآن' : 'Buy now'}</Button>;
}

export function ProductDetailsSection(props: SectionRenderProps): ReactElement | null {
  const { t, i18n } = useTranslation();
  const ar = i18n.language.startsWith('ar');
  const { settings, context } = props;
  const product = productDetailOf(context);
  const automatic = useVariantSelectionAutomatic(product?.autoSelectVariants);
  const cart = useCart();
  const wishlist = useWishlist();
  const toast = useToast();
  const reviews = reviewsFor(context);

  const [selection, setSelection] = useState<{ productId: string; choice: VariantSelection }>();
  const [quantityChoice, setQuantityChoice] = useState<{ productId: string; value: number }>();
  const qty = quantityChoice?.productId === product?.id ? quantityChoice?.value ?? 1 : 1;
  const [activeTab, setActiveTab] = useState('description');
  const [customChoice, setCustomChoice] = useState<{ productId: string; choice: PersonalizationChoice }>();
  const [offerChoice, setOfferChoice] = useState<{ productId: string; id: string | null; version?: number }>();
  // Product data arrives asynchronously. Resolve the displayed default on every render,
  // so an untouched select still adds the visible variant instead of the parent product.
  const choice = selection?.productId === product?.id ? selection?.choice : undefined;
  const activeVariant = resolveVariant(product?.variants ?? [], choice, automatic);
  const variantId = activeVariant?.id;

  if (!product) return null;

  const showSku = flag(settings, 'show_sku', false);
  const showShare = flag(settings, 'show_share', true);
  const sphinx = flag(settings, 'sphinx_layout', false);
  const offers = flag(settings, 'show_quantity_offers', true) ? product.quantityOffers ?? [] : [];
  const selectionRequired = Boolean(product.variants?.length && !activeVariant);
  const outOfStock = product.inStock === false || Boolean(activeVariant && !variantAvailable(activeVariant));
  const basePrice = activeVariant?.price ?? product.price;
  const explicitOffer = offerChoice?.productId === product.id ? offerChoice : undefined;
  const activeOffer = explicitOffer ? offers.find((offer) => offer.id === explicitOffer.id) : offers.find((offer) => offer.quantity === 1 && offer.unitPrice <= basePrice);
  const staleOffer = !!explicitOffer?.id && (!activeOffer || activeOffer.version !== explicitOffer.version);
  const unitPrice = activeOffer?.unitPrice ?? basePrice;
  const selectedImage = variantImage(product, activeVariant);
  const compareAt = activeVariant?.compareAtPrice ?? product.compareAtPrice;
  const availableStock = product.variants?.length ? activeVariant?.availableStock : product.availableStock;
  const custom = customChoice?.productId === product.id ? customChoice.choice : { values: {}, entries: [], busy: false };
  const customFields = product.personalizationFields ?? [];
  const customReady = !custom.busy && personalizationReady(customFields, custom.values);
  const lineId = personalizedLineId(product.id, variantId, custom.values, activeOffer?.id);
  const remaining = cartAdditionLimit(cart.lines, { productId: product.id, digitalType: product.digitalType ?? 'physical', ...(variantId ? { variantId } : {}), ...(availableStock !== undefined ? { maxQuantity: availableStock } : {}), ...(product.sharedMaxQuantity !== undefined ? { sharedMaxQuantity: product.sharedMaxQuantity } : {}), ...(product.orderMaxQuantity !== undefined ? { orderMaxQuantity: product.orderMaxQuantity } : {}) });
  const step = activeOffer?.quantity ?? 1;
  const quantity = Math.max(step, boundedQuantity(qty, remaining, step));
  const unavailable = selectionRequired || outOfStock || remaining < step || staleOffer || unitPrice > basePrice;
  const chooseOffer = (offer: QuantityOffer | undefined): void => {
    setOfferChoice({ productId: product.id, id: offer?.id ?? null, ...(offer ? { version: offer.version } : {}) });
    setQuantityChoice({ productId: product.id, value: offer?.quantity ?? 1 });
  };

  const addToCart = (): boolean => {
    if (unavailable || !customReady) return false;
    cart.add({
      id: lineId,
      productId: product.id,
      digitalType: product.digitalType ?? 'physical',
      ...(product.sharedMaxQuantity !== undefined ? { sharedMaxQuantity: product.sharedMaxQuantity } : {}),
      ...(product.orderMaxQuantity !== undefined ? { orderMaxQuantity: product.orderMaxQuantity } : {}),
      ...(variantId ? { variantId } : {}),
      title: product.title,
      url: product.url,
      ...(selectedImage || product.image ? { image: selectedImage ?? product.image!.src } : {}),
      price: unitPrice,
      ...(activeOffer ? { quantityOffer: activeOffer } : {}),
      currency: product.currency,
      quantity,
      ...(availableStock !== undefined ? { maxQuantity: availableStock } : {}),
      ...(activeVariant ? { attributes: activeVariant.label } : {}),
      personalization: normalizedPersonalization(custom.values),
      personalizationEntries: custom.entries,
    });
    toast.toast({ message: t('pdp.addedToBag', { title: product.title }), variant: 'success' });
    return true;
  };

  const tabs = [
    { id: 'description', label: t('pdp.tabDescription') },
    { id: 'shipping', label: t('pdp.tabShipping') },
  ];

  return (
    <section className={`sf-section${sphinx ? ' sph-product' : ''}`}>
      <Container>
        <div className="sf-pdp">
          <div className="sf-pdp__media">
          <UiBlock slot="before_product_gallery" />
          <ProductGallery key={`${product.id}:${variantId ?? 'default'}:${selectedImage ?? ''}`} images={product.images} media={variantGallery(product, selectedImage)} {...(selectedImage ? { initialSrc: selectedImage } : {})} title={product.title} mobileSlideshow={sphinx} />
          <UiBlock slot="after_product_gallery" />
          </div>

          <div className="sf-pdp__buybox">
            {sphinx && product.categorySlug && product.categoryName ? <a className="sph-product__category" href={`/collections/${product.categorySlug}`}>{product.categoryName}</a> : null}
            {product.vendor ? <span className="sf-pdp__vendor">{product.vendor}</span> : null}
            <h1 className="sf-pdp__title">{product.title}</h1>
            {product.digitalType && product.digitalType !== 'physical' ? <p>{ar ? 'منتج رقمي — يُتاح الرابط أو الكود بعد تأكيد الدفع.' : 'Digital product — your link or code is available after payment is confirmed.'}</p> : null}

            <div className="sf-pdp__price">
              {sphinx ? <ProductOfferPrice amount={basePrice} compareAt={compareAt} currency={product.currency} /> : <Price amount={basePrice} {...(compareAt !== undefined ? { compareAt } : {})} currency={product.currency} emphasis />}
              {sphinx && compareAt !== undefined && compareAt > basePrice ? <span className="sph-product__discount">−{Math.round((1 - basePrice / compareAt) * 100)}%</span> : null}
              {typeof product.rating === 'number' ? <Rating value={product.rating} {...(product.reviewCount ? { count: product.reviewCount } : {})} /> : null}
            </div>

            {showSku && product.sku ? <span className="sf-pdp__vendor">{t('pdp.skuLabel', { sku: product.sku })}</span> : null}
            {sphinx && product.description ? <p className="sph-product__summary">{product.description}</p> : null}

            {product.variants && product.variants.length > 0 ? (
              <ProductOptionPicker variants={product.variants} display={product.optionDisplay ?? []}
                automatic={automatic}
                selection={choice ?? (activeVariant ? selectionFor(activeVariant) : blankSelection(product.variants))}
                onChange={(next) => { setSelection({ productId: product.id, choice: next }); setQuantityChoice({ productId: product.id, value: 1 }); setOfferChoice(undefined); }} />
            ) : null}

            <ProductPersonalizationFields key={product.id} productId={product.id} fields={customFields} choice={custom} onChange={(next) => setCustomChoice({ productId: product.id, choice: next })} />
            <QuantityOfferPicker offers={offers} selectedId={staleOffer ? '__stale__' : activeOffer?.id ?? null} basePrice={basePrice} currency={product.currency} remaining={remaining} disabled={selectionRequired || outOfStock} onChange={chooseOffer} />
            {staleOffer ? <p role="status">{ar ? 'تغيّر العرض. اختر عرضًا مرة أخرى قبل الشراء.' : 'This offer changed. Choose an offer again before buying.'}{!offers.length ? <button type="button" className="sf-btn sf-btn--ghost" onClick={() => chooseOffer(undefined)}>{ar ? 'استخدام السعر العادي' : 'Use regular price'}</button> : null}</p> : null}
            <div className="sf-pdp__row">
              {!offers.length ? <QuantityStepper value={quantity} onChange={(value) => setQuantityChoice({ productId: product.id, value })} max={Math.max(1, remaining)} disabled={unavailable} label={t('pdp.quantityFor', { title: product.title })} /> : null}
              {flag(settings, 'show_buy_now', false) ? <BuyNow disabled={unavailable || !customReady} add={addToCart} /> : null}
              <Button className="sf-pdp__add" variant={sphinx ? 'secondary' : 'primary'} onClick={addToCart} disabled={unavailable || !customReady}>
                {outOfStock ? (ar ? 'هذا الاختيار غير متاح' : 'This selection is unavailable') : selectionRequired ? (ar ? 'اختر خيارات المنتج' : 'Choose product options') : remaining === 0 ? (ar ? 'الكمية المتاحة في السلة' : 'Available quantity is in your bag') : t('product.addToCart')}
              </Button>
            </div>

            {product.lowStock && !outOfStock ? <span className="sf-pdp__stock sf-pdp__stock--low">{t('pdp.lowStockSoon')}</span> : null}

            {product.orderMaxQuantity !== undefined ? <p>{ar ? 'أقصى عدد قطع من هذا المنتج في الطلب، عبر كل الخيارات' : 'Maximum units of this product per order, across all options'}: {product.orderMaxQuantity}</p> : null}
            <div className="sf-pdp__actions">
              {flag(settings, 'show_wishlist', true) ? <WishlistButton active={wishlist.has(product.id)} onToggle={() => wishlist.toggle(product.id)} labelledText={t('pdp.save')} /> : null}
              {showShare ? (
                <ShareButton
                  url={typeof window !== 'undefined' ? window.location.href : product.url}
                  title={product.title}
                  onResult={(r) => r === 'copied' && toast.toast({ message: t('pdp.linkCopied') })}
                />
              ) : null}
            </div>

            {!sphinx ? <Tabs tabs={tabs} value={activeTab} onChange={setActiveTab} renderPanel={(id) =>
              id === 'description' ? (
                <ProductDescription html={product.descriptionHtml ?? ''} />
              ) : (
                <p className="sf-pdp__desc">
                  {t('pdp.luxuryShipping')}
                </p>
              )
            } /> : null}
          </div>
        </div>
        {sphinx ? <div className="sph-product__content"><ProductDescription html={product.descriptionHtml ?? ''} />{product.shippingReturns ? <details><summary>{ar ? 'الشحن والاسترجاع' : 'Shipping and returns'}</summary><p>{product.shippingReturns}</p></details> : null}</div> : null}

        {reviews.length > 0 ? (
          <div style={{ marginTop: 'var(--section-y)' }}>
            <ReviewSummary
              average={reviews.reduce((s, r) => s + r.rating, 0) / reviews.length}
              total={reviews.length}
            />
            <ReviewList reviews={reviews} />
          </div>
        ) : null}
      </Container>
    </section>
  );
}
