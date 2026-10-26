import PaymentMethodLogo from '../../../shared/payments/PaymentMethodLogo';
import { PaymentAdjustmentLine } from './PaymentAdjustmentLine';
import { CheckoutDiscountLines } from './CheckoutDiscountLines';
import { quoteHasFreeShippingDiscount } from './checkout-discounts';
import { UiBlock } from '../ui-blocks/UiBlocks';
import { useMemo, useState, type FormEvent, type ReactElement } from 'react';
import { Button, Container, ErrorState, Input, Section, Spinner } from '../foundation/components';
import { getProduct, quoteCheckout, type CheckoutItem } from '../api/storefront';
import { GiftCardField, GiftCardLines } from './CheckoutGiftCards';
import { useGiftCards } from './useGiftCards';
import { giftCardsCoverTotal } from './checkout-gift-cards';
import { useAsync } from '../api/useAsync';
import { useLocale } from '../i18n/useLocale';
import { formatMoney } from '../utils/format';
import { taxLineLabel } from '../utils/shipping';
import { useCheckoutPaymentFlow } from './useCheckoutPaymentFlow';
import { useQuoteContact } from './useQuoteContact';
import { CheckoutRecovery } from './CheckoutRecovery';
import { CheckoutFieldsForm, useCheckoutFields } from './CheckoutFields';
import './funnel-checkout.css';
import { ProductPersonalizationFields } from '../foundation/components/ProductPersonalizationFields';
import type { PersonalizationChoice } from '../types/personalization';
import { personalizationReady, normalizedPersonalization } from '../utils/personalization';
import { boundedQuantity, cartAdditionLimit } from '../state/cart-quantity';
import { resolveCardVariant } from '../state/variant-selection';
import { toProductDetail, toVariant } from '../api/mappers';
import { QuantityOfferPicker } from '../foundation/components/QuantityOfferPicker';
import type { QuantityOffer } from '../types/quantity-offers';
import { useStore, useVariantSelectionAutomatic } from '../state/store-context';
import { CheckoutMinimum } from './CheckoutMinimum';
import { minimumOrderAllows } from './minimum-order';
import { useCheckoutLead } from './useCheckoutLead';
import { useCheckoutMetrics } from '../analytics/checkout-hooks';
import type { ApiProduct } from '../api/types';
import { useProductAdvertising } from '../advertising/hooks';

export interface FunnelPresentation {
  product: ApiProduct | null;
  unitPrice: number;
  quantity: number;
  ready: boolean;
  image: string | null;
  comparePrice?: number;
}

/** Product-specific checkout: leaves the visitor's ordinary shopping cart intact. */
export function FunnelCheckout({ productSlug, renderLayout, compactHeader = false }: { productSlug: string | null; renderLayout?: (presentation: FunnelPresentation, checkout: ReactElement) => ReactElement; compactHeader?: boolean }): ReactElement {
  const { locale } = useLocale();
  const { store } = useStore();
  const ar = locale === 'ar';
  const label = (arabic: string, english: string): string => ar ? arabic : english;
  const productQ = useAsync(() => productSlug ? getProduct(productSlug) : Promise.resolve(null), [productSlug, locale]);
  const product = productQ.data?.data;
  const [selection, setSelection] = useState<{ productId: number; id: string }>();
  const [quantityChoice, setQuantityChoice] = useState<{ productId: number; value: number }>();
  const [offerChoice, setOfferChoice] = useState<{ productId: number; id: string | null; version?: number }>();
  const [coupon, setCoupon] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const giftCards = useGiftCards();
  const [customChoice, setCustomChoice] = useState<{ productId: number; choice: PersonalizationChoice }>();
  const custom = customChoice?.productId === product?.id ? customChoice?.choice ?? { values: {}, entries: [], busy: false } : { values: {}, entries: [], busy: false };
  const variants = product?.variants ?? [];
  const automatic = useVariantSelectionAutomatic(product?.auto_select_variant);
  const explicitId = selection?.productId === product?.id ? selection?.id : undefined;
  const selectedVariant = resolveCardVariant(variants.map((variant) => toVariant(variant)), explicitId, automatic);
  const variantId = selectedVariant?.id ?? '';
  const selectedStock = variants.length ? variants.find((v) => String(v.id) === variantId)?.stock : product?.stock;
  const purchaseLimit = Math.min(999, cartAdditionLimit([], { productId: String(product?.id), digitalType: product?.digital_type ?? 'physical', maxQuantity: selectedStock ?? undefined, orderMaxQuantity: product?.order_quantity_limit || undefined, sharedMaxQuantity: product?.digital_pool_stock ?? undefined }));
  const offers = product ? toProductDetail(product, store.baseCurrency, 1).quantityOffers ?? [] : [];
  const basePrice = selectedVariant?.price ?? Number(product?.price ?? 0);
  const explicitOffer = offerChoice?.productId === product?.id ? offerChoice : undefined;
  const activeOffer = explicitOffer ? offers.find((offer) => offer.id === explicitOffer.id) : offers.find((offer) => offer.quantity === 1 && offer.unitPrice <= basePrice);
  const staleOffer = !!explicitOffer?.id && (!activeOffer || activeOffer.version !== explicitOffer.version);
  const step = activeOffer?.quantity ?? 1;
  const quantity = quantityChoice?.productId === product?.id ? quantityChoice?.value ?? step : step;
  const chooseOffer = (offer: QuantityOffer | undefined): void => {
    if (!product) return;
    setOfferChoice({ productId: product.id, id: offer?.id ?? null, ...(offer ? { version: offer.version } : {}) });
    setQuantityChoice({ productId: product.id, value: offer?.quantity ?? 1 });
  };
  const offerId = activeOffer?.id; const offerVersion = activeOffer?.version;
  const selectionReady = !!product && product.is_active !== false && !custom.busy && personalizationReady(product.personalization_fields ?? [], custom.values) && !staleOffer && (activeOffer?.unitPrice ?? basePrice) <= basePrice && quantity >= step && quantity % step === 0 && quantity <= purchaseLimit && (!variants.length || selectedVariant?.available === true);
  const customKey = JSON.stringify(custom.values);
  const items = useMemo<ReadonlyArray<CheckoutItem>>(() => selectionReady && product ? [{ product_id: product.id, quantity, personalization: normalizedPersonalization(JSON.parse(customKey) as Record<string, string>), ...(variantId ? { variant_id: Number(variantId) } : {}), ...(offerId ? { quantity_offer_id: offerId, quantity_offer_version: offerVersion } : {}) }] : [], [product, selectionReady, quantity, variantId, customKey, offerId, offerVersion]);
  const payment = useCheckoutPaymentFlow({ items, preserveCart: true, surface: 'funnel' });
  useProductAdvertising(product ? String(product.id) : undefined, variantId || undefined);
  useCheckoutMetrics(items, 'funnel');
  const contact = useCheckoutFields(payment.paymentMethod, product ? [product.id] : []);
  const lead = useCheckoutLead({ contact: { ...contact.payload(), coupon_code: appliedCoupon }, items, source: 'funnel', paymentMethod: payment.paymentMethod, kind: `funnel:${productSlug ?? ''}`, enabled: contact.ready && !payment.busy && !payment.completed && !payment.unresolved && !payment.paymentRetry });
  const quoteContact = useQuoteContact(contact.payload());
  const quoteKey = JSON.stringify([items, appliedCoupon, giftCards.codes, contact.shippingSelection, contact.shippingReady, payment.paymentMethod, payment.unresolved, quoteContact]);
  const quoteQ = useAsync(async () => !payment.unresolved && items.length && contact.shippingReady ? { key: quoteKey, quote: (await quoteCheckout(items, appliedCoupon, contact.shippingSelection, payment.paymentMethod, giftCards.codes, quoteContact)).data } : null, [quoteKey, locale]);
  const quote = payment.correctedQuote(quoteKey) ?? (!quoteQ.loading && !quoteQ.error && quoteQ.data?.key === quoteKey ? quoteQ.data.quote : null);
  const paidByGiftCards = giftCardsCoverTotal(quote, giftCards.codes);
  const submit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    if (!payment.paymentRetry && (!minimumOrderAllows(quote) || !selectionReady || !contact.shippingReady || !contact.phoneVerification.ready || !contact.botProtection.ready || contact.countryAllowed === false)) return;
    await payment.submit({ ...contact.payload(), coupon_code: appliedCoupon, lead_token: lead.submitToken(), ...(quote?.payment_adjustment_token ? { payment_adjustment_token: quote.payment_adjustment_token } : {}),
      ...(giftCards.codes.length ? { gift_cards: giftCards.codes } : {}), ...(paidByGiftCards ? { payment_method: undefined } : {}), ...(quote ? { expected_total: quote.totals.grand_total } : {}) }, quoteKey);
  };

  const checkout = <Section id="funnel-checkout" className="sf-funnel-checkout"><Container narrow>
    {!compactHeader ? <><h2>{label('أكمل طلبك', 'Complete your order')}</h2>
      <p>{contact.requiresShipping === false ? label('اختر الكمية وأدخل بيانات التواصل لاستلام المنتج الرقمي بعد تأكيد الدفع.', 'Choose your quantity and enter your contact details to receive the digital product after payment confirmation.') : label('اختر الكمية وأدخل بيانات التوصيل.', 'Choose your quantity and enter your delivery details.')}</p></> : null}
    <CheckoutRecovery flow={payment} />
    {productQ.loading ? <Spinner label={label('جارٍ تحميل المنتج…', 'Loading product…')} /> : productQ.error ? <ErrorState
      title={label('تعذّر تحميل المنتج', 'Unable to load product')}
      actions={<Button onClick={productQ.reload}>{label('إعادة المحاولة', 'Retry')}</Button>} /> : !product ? <p role="status">{label('هذا المنتج غير متاح للطلب حاليًا.', 'This product is currently unavailable.')}</p> : <><UiBlock slot="before_checkout" /><form onSubmit={(event) => void submit(event)}>
      <fieldset disabled={payment.busy || payment.unresolved} className="sf-funnel-checkout__fields">
        <legend className="sf-funnel-checkout__product">{product.name}</legend>
        <div className="sf-funnel-checkout__selection">
          {variants.length > 0 ? <label className="sf-funnel-checkout__option">
            <span>{label('اختر اللون أو المقاس', 'Choose an option')}</span>
            <select value={variantId} onChange={(event) => { setSelection({ productId: product.id, id: event.target.value }); setQuantityChoice(undefined); setOfferChoice(undefined); }} required>
              <option value="">{label('اختر…', 'Choose…')}</option>
              {variants.filter((variant) => variant.is_active !== false).map((variant) => <option key={variant.id} value={variant.id} disabled={variant.stock != null && variant.stock <= 0}>{variant.name || Object.values(variant.options ?? {}).join(' / ')}{variant.stock != null && variant.stock <= 0 ? label(' — نفدت الكمية', ' — Sold out') : ''}</option>)}
            </select>
          </label> : null}
          <Input label={label('الكمية', 'Quantity')} type="number" min={step} max={Math.floor(purchaseLimit / step) * step} step={step} value={quantity} required
            onChange={(event) => setQuantityChoice({ productId: product.id, value: Math.max(step, boundedQuantity(Number(event.target.value) || step, purchaseLimit, step)) })} />
        </div>
        <QuantityOfferPicker offers={offers} selectedId={staleOffer ? '__stale__' : offerId ?? null} basePrice={basePrice} currency={store.baseCurrency} remaining={purchaseLimit} disabled={!!variants.length && !selectedVariant?.available} onChange={chooseOffer} />
        {staleOffer ? <p role="status">{label('تغيّر العرض. اختر عرضًا مرة أخرى قبل الشراء.', 'This offer changed. Choose an offer again before buying.')}{!offers.length ? <Button type="button" variant="ghost" onClick={() => chooseOffer(undefined)}>{label('استخدام السعر العادي', 'Use regular price')}</Button> : null}</p> : null}
        {selectedStock != null && selectedStock < quantity ? <p role="status">{label('الكمية المتاحة', 'Available quantity')}: {Math.max(0, selectedStock)}</p> : null}
        {product.order_quantity_limit ? <p>{label('أقصى عدد قطع من هذا المنتج في الطلب', 'Maximum units of this product per order')}: {product.order_quantity_limit}</p> : null}
        <ProductPersonalizationFields key={product.id} productId={String(product.id)} fields={product.personalization_fields ?? []} choice={custom} onChange={(next) => setCustomChoice({ productId: product.id, choice: next })} />
        <CheckoutFieldsForm model={contact} quote={quote ?? quoteQ.data?.quote} />
        <div className="sf-funnel-checkout__coupon">
          <Input label={label('كود الخصم', 'Coupon code')} value={coupon} onChange={(event) => setCoupon(event.target.value)} maxLength={100} />
          <Button type="button" variant="secondary" disabled={!selectionReady || quoteQ.loading} onClick={() => { setAppliedCoupon(coupon.trim()); quoteQ.reload(); }}>{label('تطبيق', 'Apply')}</Button>
          {appliedCoupon ? <Button type="button" variant="ghost" onClick={() => { setAppliedCoupon(''); setCoupon(''); }}>{label('إزالة', 'Remove')}</Button> : null}
        </div>
        <GiftCardField model={giftCards} />
        {paidByGiftCards ? <p role="status" data-paid-by-gift-cards>{label('بطاقات الهدايا تغطي إجمالي الطلب، لا حاجة لطريقة دفع.', 'Your gift cards cover the full total. No payment method is needed.')}</p> : <fieldset className="sf-funnel-checkout__payment">
          <legend>{label('طريقة الدفع', 'Payment method')}</legend>
          {payment.paymentMethods.map((method) => <label key={method.slug}>
            <input type="radio" name="funnel-payment" value={method.slug} checked={payment.paymentMethod === method.slug} onChange={() => payment.setPaymentMethod(method.slug)} required />
            <PaymentMethodLogo slug={method.slug} src={method.logo_url} /><span>{method.slug === 'cod' && method.name === 'Cash on delivery' ? label('الدفع عند الاستلام', 'Cash on delivery') : method.slug === 'bank_transfer' && method.name === 'Bank transfer' ? label('تحويل بنكي', 'Bank transfer') : method.name}{method.test_mode ? label(' (تجريبي)', ' (Test)') : ''}{method.description ? <small style={{ display: 'block', whiteSpace: 'pre-wrap' }}>{method.description}</small> : null}</span>
          </label>)}
          {!payment.paymentMethods.length ? <p>{label('لا توجد طريقة دفع متاحة حاليًا.', 'No payment method is currently available.')}</p> : null}
        </fieldset>}
      </fieldset>
      <div aria-live="polite" className="sf-funnel-checkout__totals">
        {quoteQ.loading && selectionReady ? <Spinner label={label('جارٍ حساب الإجمالي…', 'Calculating total…')} /> : null}
        {quoteQ.error ? <div role="alert"><p>{quoteQ.error.message}</p><Button type="button" variant="secondary" onClick={() => { contact.query.reload(); quoteQ.reload(); }}>{label('إعادة الحساب', 'Recalculate')}</Button></div> : null}
        {quote?.offer_free_shipping ? <p>{label('شحن مجاني مع عرض الكمية المختار.', 'Free shipping with the selected quantity offer.')}</p> : null}
        {quote ? <dl>
          <div><dt>{label('المنتجات', 'Products')}</dt><dd>{formatMoney(Number(quote.totals.subtotal), quote.currency, locale)}</dd></div>
          <CheckoutDiscountLines quote={quote} fallbackLabel={label('الخصم', 'Discount')} definition />
          {quote.requires_shipping ? <div><dt>{label('الشحن', 'Shipping')}</dt><dd>{Number(quote.totals.shipping_total) === 0 && quoteHasFreeShippingDiscount(quote) ? label('مجاني', 'Free') : formatMoney(Number(quote.totals.shipping_total), quote.currency, locale)}</dd></div> : null}
          {Number(quote.totals.tax_total) > 0 ? <div data-tax-line><dt>{taxLineLabel(quote.tax, locale)}</dt><dd>{formatMoney(Number(quote.totals.tax_total), quote.currency, locale)}</dd></div> : null}
          <PaymentAdjustmentLine amount={quote.totals.payment_adjustment_total} currency={quote.currency} definition />
          <div className="sf-funnel-checkout__grand"><dt>{label('الإجمالي', 'Total')}</dt><dd>{formatMoney(Number(quote.totals.grand_total), quote.currency, locale)}</dd></div>
          <GiftCardLines quote={quote} definition />
        </dl> : null}
      </div>
      {payment.error && !payment.unresolved ? <div role="alert"><p className="sf-field__error">{payment.error}</p>{!payment.paymentRetry && !payment.totalChanged ? <Button type="button" variant="secondary" onClick={() => { contact.query.reload(); quoteQ.reload(); }}>{label('تحديث خيارات التوصيل', 'Refresh delivery options')}</Button> : null}</div> : null}
      {!payment.paymentRetry && !payment.unresolved ? <CheckoutMinimum quote={quote} /> : null}
      {!payment.unresolved ? <Button type="submit" block loading={payment.busy} disabled={(!payment.paymentMethod && !paidByGiftCards) || !quote || !contact.shippingReady || (!payment.paymentRetry && (!minimumOrderAllows(quote) || !contact.phoneVerification.ready || !contact.botProtection.ready || contact.countryAllowed === false))}>
        {label('تأكيد الطلب', 'Place order')}
      </Button> : null}
    </form><UiBlock slot="after_checkout" /></>}
  </Container></Section>;
  return renderLayout ? renderLayout({ product: product ?? null, unitPrice: activeOffer?.unitPrice ?? basePrice, comparePrice: selectedVariant?.compareAtPrice ?? Number(product?.compare_price ?? 0), quantity, ready: selectionReady, image: selectedVariant?.image?.src ?? product?.image_url ?? product?.image ?? null }, checkout) : checkout;
}
