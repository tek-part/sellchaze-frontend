import { useMemo, useState, type FormEvent, type ReactElement } from 'react';
import { Button, Container, ErrorState, Input, Section, Spinner } from '../foundation/components';
import { getProduct, quoteCheckout, type CheckoutItem } from '../api/storefront';
import { useAsync } from '../api/useAsync';
import { useLocale } from '../i18n/useLocale';
import { formatMoney } from '../utils/format';
import { useCheckoutPaymentFlow } from './useCheckoutPaymentFlow';
import { CheckoutRecovery } from './CheckoutRecovery';
import { CheckoutFieldsForm, useCheckoutFields } from './CheckoutFields';
import './funnel-checkout.css';
import { ProductPersonalizationFields } from '../foundation/components/ProductPersonalizationFields';
import type { PersonalizationChoice } from '../types/personalization';
import { personalizationReady, normalizedPersonalization } from '../utils/personalization';
import { cartAdditionLimit } from '../state/cart-quantity';

/** Product-specific checkout: leaves the visitor's ordinary shopping cart intact. */
export function FunnelCheckout({ productSlug }: { productSlug: string | null }): ReactElement {
  const { locale } = useLocale();
  const ar = locale === 'ar';
  const label = (arabic: string, english: string): string => ar ? arabic : english;
  const productQ = useAsync(() => productSlug ? getProduct(productSlug) : Promise.resolve(null), [productSlug, locale]);
  const product = productQ.data?.data;
  const [variantId, setVariantId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [coupon, setCoupon] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [customChoice, setCustomChoice] = useState<{ productId: number; choice: PersonalizationChoice }>();
  const custom = customChoice?.productId === product?.id ? customChoice?.choice ?? { values: {}, entries: [], busy: false } : { values: {}, entries: [], busy: false };
  const variants = product?.variants ?? [];
  const selectedStock = variants.length ? variants.find((v) => String(v.id) === variantId)?.stock : product?.stock;
  const purchaseLimit = Math.min(999, cartAdditionLimit([], { productId: String(product?.id), digitalType: product?.digital_type ?? 'physical', maxQuantity: selectedStock ?? undefined, orderMaxQuantity: product?.order_quantity_limit || undefined, sharedMaxQuantity: product?.digital_pool_stock ?? undefined }));
  const selectionReady = !!product && product.is_active !== false && !custom.busy && personalizationReady(product.personalization_fields ?? [], custom.values) && quantity >= 1 && quantity <= purchaseLimit && (!variants.length || variants.some((v) => v.is_active !== false && String(v.id) === variantId));
  const customKey = JSON.stringify(custom.values);
  const items = useMemo<ReadonlyArray<CheckoutItem>>(() => selectionReady && product ? [{ product_id: product.id, quantity, personalization: normalizedPersonalization(JSON.parse(customKey) as Record<string, string>), ...(variantId ? { variant_id: Number(variantId) } : {}) }] : [], [product, selectionReady, quantity, variantId, customKey]);
  const payment = useCheckoutPaymentFlow({ items, preserveCart: true });
  const contact = useCheckoutFields(payment.paymentMethod, product ? [product.id] : []);
  const quoteKey = JSON.stringify([items, appliedCoupon, contact.shippingSelection, contact.shippingReady]);
  const quoteQ = useAsync(async () => items.length && contact.shippingReady ? { key: quoteKey, quote: (await quoteCheckout(items, appliedCoupon, contact.shippingSelection)).data } : null, [quoteKey, locale]);
  const quote = !quoteQ.loading && !quoteQ.error && quoteQ.data?.key === quoteKey ? quoteQ.data.quote : null;
  const submit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    if (!payment.paymentRetry && (!quote || !selectionReady || !contact.shippingReady || !contact.phoneVerification.ready)) return;
    await payment.submit({ ...contact.payload(), coupon_code: appliedCoupon });
  };

  return <Section id="funnel-checkout" className="sf-funnel-checkout"><Container narrow>
    <h2>{label('أكمل طلبك', 'Complete your order')}</h2>
    <p>{contact.requiresShipping === false ? label('اختر الكمية وأدخل بيانات التواصل لاستلام المنتج الرقمي بعد تأكيد الدفع.', 'Choose your quantity and enter your contact details to receive the digital product after payment confirmation.') : label('اختر الكمية وأدخل بيانات التوصيل.', 'Choose your quantity and enter your delivery details.')}</p>
    <CheckoutRecovery flow={payment} />
    {productQ.loading ? <Spinner label={label('جارٍ تحميل المنتج…', 'Loading product…')} /> : productQ.error ? <ErrorState
      title={label('تعذّر تحميل المنتج', 'Unable to load product')}
      actions={<Button onClick={productQ.reload}>{label('إعادة المحاولة', 'Retry')}</Button>} /> : !product ? <p role="status">{label('هذا المنتج غير متاح للطلب حاليًا.', 'This product is currently unavailable.')}</p> : <form onSubmit={(event) => void submit(event)}>
      <fieldset disabled={payment.busy || payment.unresolved} className="sf-funnel-checkout__fields">
        <legend className="sf-funnel-checkout__product">{product.name}</legend>
        <div className="sf-funnel-checkout__selection">
          {variants.length > 0 ? <label className="sf-funnel-checkout__option">
            <span>{label('اختر اللون أو المقاس', 'Choose an option')}</span>
            <select value={variantId} onChange={(event) => setVariantId(event.target.value)} required>
              <option value="">{label('اختر…', 'Choose…')}</option>
              {variants.filter((variant) => variant.is_active !== false).map((variant) => <option key={variant.id} value={variant.id} disabled={variant.stock != null && variant.stock <= 0}>{variant.name || Object.values(variant.options ?? {}).join(' / ')}{variant.stock != null && variant.stock <= 0 ? label(' — نفدت الكمية', ' — Sold out') : ''}</option>)}
            </select>
          </label> : null}
          <Input label={label('الكمية', 'Quantity')} type="number" min={1} max={purchaseLimit} step={1} value={quantity} required
            onChange={(event) => setQuantity(Math.max(1, Math.min(purchaseLimit, Math.trunc(Number(event.target.value) || 1))))} />
        </div>
        {selectedStock != null && selectedStock < quantity ? <p role="status">{label('الكمية المتاحة', 'Available quantity')}: {Math.max(0, selectedStock)}</p> : null}
        {product.order_quantity_limit ? <p>{label('أقصى عدد قطع من هذا المنتج في الطلب', 'Maximum units of this product per order')}: {product.order_quantity_limit}</p> : null}
        <ProductPersonalizationFields key={product.id} productId={String(product.id)} fields={product.personalization_fields ?? []} choice={custom} onChange={(next) => setCustomChoice({ productId: product.id, choice: next })} />
        <CheckoutFieldsForm model={contact} />
        <div className="sf-funnel-checkout__coupon">
          <Input label={label('كود الخصم', 'Coupon code')} value={coupon} onChange={(event) => setCoupon(event.target.value)} maxLength={100} />
          <Button type="button" variant="secondary" disabled={!selectionReady || quoteQ.loading} onClick={() => { setAppliedCoupon(coupon.trim()); quoteQ.reload(); }}>{label('تطبيق', 'Apply')}</Button>
          {appliedCoupon ? <Button type="button" variant="ghost" onClick={() => { setAppliedCoupon(''); setCoupon(''); }}>{label('إزالة', 'Remove')}</Button> : null}
        </div>
        <fieldset className="sf-funnel-checkout__payment">
          <legend>{label('طريقة الدفع', 'Payment method')}</legend>
          {payment.paymentMethods.map((method) => <label key={method.slug}>
            <input type="radio" name="funnel-payment" value={method.slug} checked={payment.paymentMethod === method.slug} onChange={() => payment.setPaymentMethod(method.slug)} required />
            <span>{method.slug === 'cod' ? label('الدفع عند الاستلام', 'Cash on delivery') : method.slug === 'bank_transfer' ? label('تحويل بنكي', 'Bank transfer') : method.name}{method.test_mode ? label(' (تجريبي)', ' (Test)') : ''}</span>
          </label>)}
          {!payment.paymentMethods.length ? <p>{label('لا توجد طريقة دفع متاحة حاليًا.', 'No payment method is currently available.')}</p> : null}
        </fieldset>
      </fieldset>
      <div aria-live="polite" className="sf-funnel-checkout__totals">
        {quoteQ.loading && selectionReady ? <Spinner label={label('جارٍ حساب الإجمالي…', 'Calculating total…')} /> : null}
        {quoteQ.error ? <div role="alert"><p>{quoteQ.error.message}</p><Button type="button" variant="secondary" onClick={() => { contact.query.reload(); quoteQ.reload(); }}>{label('إعادة الحساب', 'Recalculate')}</Button></div> : null}
        {quote ? <dl>
          <div><dt>{label('المنتجات', 'Products')}</dt><dd>{formatMoney(Number(quote.totals.subtotal), quote.currency, locale)}</dd></div>
          {Number(quote.totals.discount_total) > 0 ? <div><dt>{label('الخصم', 'Discount')}</dt><dd>−{formatMoney(Number(quote.totals.discount_total), quote.currency, locale)}</dd></div> : null}
          {quote.requires_shipping ? <div><dt>{label('الشحن', 'Shipping')}</dt><dd>{formatMoney(Number(quote.totals.shipping_total), quote.currency, locale)}</dd></div> : null}
          {Number(quote.totals.tax_total) > 0 ? <div><dt>{label('الضريبة', 'Tax')}</dt><dd>{formatMoney(Number(quote.totals.tax_total), quote.currency, locale)}</dd></div> : null}
          <div className="sf-funnel-checkout__grand"><dt>{label('الإجمالي', 'Total')}</dt><dd>{formatMoney(Number(quote.totals.grand_total), quote.currency, locale)}</dd></div>
        </dl> : null}
      </div>
      {payment.error && !payment.unresolved ? <div role="alert"><p className="sf-field__error">{payment.error}</p>{!payment.paymentRetry ? <Button type="button" variant="secondary" onClick={() => { contact.query.reload(); quoteQ.reload(); }}>{label('تحديث خيارات التوصيل', 'Refresh delivery options')}</Button> : null}</div> : null}
      {!payment.unresolved ? <Button type="submit" block loading={payment.busy} disabled={!payment.paymentMethod || !quote || !contact.shippingReady || (!payment.paymentRetry && !contact.phoneVerification.ready)}>
        {label('تأكيد الطلب', 'Place order')}
      </Button> : null}
    </form>}
  </Container></Section>;
}
