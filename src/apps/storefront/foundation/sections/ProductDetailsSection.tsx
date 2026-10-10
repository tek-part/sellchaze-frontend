/**
 * product-details — the PDP buy box (convert). Gallery + price + variant selection + quantity +
 * add-to-cart (optimistic via the cart store, single toast) + wishlist/share + description/shipping
 * tabs + reviews. Reads the product from context.data.product. Settings: show_sku, show_share,
 * gallery_layout. §08 product-details.
 */
import { useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import type { SectionRenderProps } from '../../theme-engine/rendering';
import { Container } from '../components/Container';
import { ProductGallery } from '../components/ProductGallery';
import { ProductDescription } from '../components/ProductDescription';
import { Price } from '../components/Price';
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
  // Product data arrives asynchronously. Resolve the displayed default on every render,
  // so an untouched select still adds the visible variant instead of the parent product.
  const choice = selection?.productId === product?.id ? selection?.choice : undefined;
  const activeVariant = resolveVariant(product?.variants ?? [], choice, automatic);
  const variantId = activeVariant?.id;

  if (!product) return null;

  const showSku = flag(settings, 'show_sku', false);
  const showShare = flag(settings, 'show_share', true);
  const selectionRequired = Boolean(product.variants?.length && !activeVariant);
  const outOfStock = product.inStock === false || Boolean(activeVariant && !variantAvailable(activeVariant));
  const unitPrice = activeVariant?.price ?? product.price;
  const selectedImage = variantImage(product, activeVariant);
  const compareAt = activeVariant?.compareAtPrice ?? product.compareAtPrice;
  const availableStock = product.variants?.length ? activeVariant?.availableStock : product.availableStock;
  const custom = customChoice?.productId === product.id ? customChoice.choice : { values: {}, entries: [], busy: false };
  const customFields = product.personalizationFields ?? [];
  const customReady = !custom.busy && personalizationReady(customFields, custom.values);
  const lineId = personalizedLineId(product.id, variantId, custom.values);
  const remaining = cartAdditionLimit(cart.lines, { productId: product.id, digitalType: product.digitalType ?? 'physical', ...(variantId ? { variantId } : {}), ...(availableStock !== undefined ? { maxQuantity: availableStock } : {}), ...(product.sharedMaxQuantity !== undefined ? { sharedMaxQuantity: product.sharedMaxQuantity } : {}), ...(product.orderMaxQuantity !== undefined ? { orderMaxQuantity: product.orderMaxQuantity } : {}) });
  const quantity = Math.max(1, boundedQuantity(qty, remaining));
  const unavailable = selectionRequired || outOfStock || remaining === 0;

  const addToCart = (): void => {
    if (unavailable || !customReady) return;
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
      currency: product.currency,
      quantity,
      ...(availableStock !== undefined ? { maxQuantity: availableStock } : {}),
      ...(activeVariant ? { attributes: activeVariant.label } : {}),
      personalization: normalizedPersonalization(custom.values),
      personalizationEntries: custom.entries,
    });
    toast.toast({ message: t('pdp.addedToBag', { title: product.title }), variant: 'success' });
  };

  const tabs = [
    { id: 'description', label: t('pdp.tabDescription') },
    { id: 'shipping', label: t('pdp.tabShipping') },
  ];

  return (
    <section className="sf-section">
      <Container>
        <div className="sf-pdp">
          <ProductGallery key={`${product.id}:${variantId ?? 'default'}:${selectedImage ?? ''}`} images={product.images} media={variantGallery(product, selectedImage)} {...(selectedImage ? { initialSrc: selectedImage } : {})} title={product.title} />

          <div className="sf-pdp__buybox">
            {product.vendor ? <span className="sf-pdp__vendor">{product.vendor}</span> : null}
            <h1 className="sf-pdp__title">{product.title}</h1>
            {product.digitalType && product.digitalType !== 'physical' ? <p>{ar ? 'منتج رقمي — يُتاح الرابط أو الكود بعد تأكيد الدفع.' : 'Digital product — your link or code is available after payment is confirmed.'}</p> : null}

            <div className="sf-pdp__price">
              <Price amount={unitPrice} {...(compareAt !== undefined ? { compareAt } : {})} currency={product.currency} emphasis />
              {typeof product.rating === 'number' ? <Rating value={product.rating} {...(product.reviewCount ? { count: product.reviewCount } : {})} /> : null}
            </div>

            {showSku && product.sku ? <span className="sf-pdp__vendor">{t('pdp.skuLabel', { sku: product.sku })}</span> : null}

            {product.variants && product.variants.length > 0 ? (
              <ProductOptionPicker variants={product.variants} display={product.optionDisplay ?? []}
                automatic={automatic}
                selection={choice ?? (activeVariant ? selectionFor(activeVariant) : blankSelection(product.variants))}
                onChange={(next) => { setSelection({ productId: product.id, choice: next }); setQuantityChoice({ productId: product.id, value: 1 }); }} />
            ) : null}

            <ProductPersonalizationFields key={product.id} productId={product.id} fields={customFields} choice={custom} onChange={(next) => setCustomChoice({ productId: product.id, choice: next })} />
            <div className="sf-pdp__row">
              <QuantityStepper value={quantity} onChange={(value) => setQuantityChoice({ productId: product.id, value })} max={Math.max(1, remaining)} disabled={unavailable} label={t('pdp.quantityFor', { title: product.title })} />
              <Button className="sf-pdp__add" onClick={addToCart} disabled={unavailable || !customReady}>
                {outOfStock ? (ar ? 'هذا الاختيار غير متاح' : 'This selection is unavailable') : selectionRequired ? (ar ? 'اختر خيارات المنتج' : 'Choose product options') : remaining === 0 ? (ar ? 'الكمية المتاحة في السلة' : 'Available quantity is in your bag') : t('product.addToCart')}
              </Button>
            </div>

            {product.lowStock && !outOfStock ? <span className="sf-pdp__stock sf-pdp__stock--low">{t('pdp.lowStockSoon')}</span> : null}

            {product.orderMaxQuantity !== undefined ? <p>{ar ? 'أقصى عدد قطع من هذا المنتج في الطلب، عبر كل الخيارات' : 'Maximum units of this product per order, across all options'}: {product.orderMaxQuantity}</p> : null}
            <div className="sf-pdp__actions">
              <WishlistButton active={wishlist.has(product.id)} onToggle={() => wishlist.toggle(product.id)} labelledText={t('pdp.save')} />
              {showShare ? (
                <ShareButton
                  url={typeof window !== 'undefined' ? window.location.href : product.url}
                  title={product.title}
                  onResult={(r) => r === 'copied' && toast.toast({ message: t('pdp.linkCopied') })}
                />
              ) : null}
            </div>

            <Tabs tabs={tabs} value={activeTab} onChange={setActiveTab} renderPanel={(id) =>
              id === 'description' ? (
                <ProductDescription html={product.descriptionHtml ?? ''} />
              ) : (
                <p className="sf-pdp__desc">
                  {t('pdp.luxuryShipping')}
                </p>
              )
            } />
          </div>
        </div>

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
