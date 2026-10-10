import { useMemo, useState, type FormEvent, type ReactElement } from 'react';
import { Button, Container, ErrorState, Input, Section, Spinner } from '../foundation/components';
import { getProduct, quoteCheckout, type CheckoutItem } from '../api/storefront';
import { useAsync } from '../api/useAsync';
import { useLocale } from '../i18n/useLocale';
import { formatMoney } from '../utils/format';
import { useCheckoutPaymentFlow } from './useCheckoutPaymentFlow';
import { CheckoutFieldsForm, useCheckoutFields } from './CheckoutFields';
import './funnel-checkout.css';

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
  const variants = product?.variants ?? [];
  const selectionReady = !!product && (!variants.length || variants.some((v) => v.is_active !== false && String(v.id) === variantId));
  const items = useMemo<ReadonlyArray<CheckoutItem>>(() => selectionReady && product ? [{ product_id: product.id, quantity, ...(variantId ? { variant_id: Number(variantId) } : {}) }] : [], [product, selectionReady, quantity, variantId]);
  const payment = useCheckoutPaymentFlow({ items, preserveCart: true });
  const contact = useCheckoutFields(payment.paymentMethod);
  const quoteKey = JSON.stringify([items, appliedCoupon, contact.shippingSelection, contact.shippingReady]);
  const quoteQ = useAsync(async () => items.length && contact.shippingReady ? { key: quoteKey, quote: (await quoteCheckout(items, appliedCoupon, contact.shippingSelection)).data } : null, [quoteKey, locale]);
  const quote = !quoteQ.loading && !quoteQ.error && quoteQ.data?.key === quoteKey ? quoteQ.data.quote : null;
  const submit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    if (!payment.paymentRetry && (!quote || !selectionReady || !contact.shippingReady)) return;
    await payment.submit({ ...contact.payload(), coupon_code: appliedCoupon });
  };

  return <Section id="funnel-checkout" className="sf-funnel-checkout"><Container narrow>
    <h2>{label('أكمل طلبك', 'Complete your order')}</h2>
    <p>{label('اختر الكمية وأدخل بيانات التوصيل.', 'Choose your quantity and enter your delivery details.')}</p>
    {productQ.loading ? <Spinner label={label('جارٍ تحميل المنتج…', 'Loading product…')} /> : productQ.error ? <ErrorState
      title={label('تعذّر تحميل المنتج', 'Unable to load product')}
      actions={<Button onClick={productQ.reload}>{label('إعادة المحاولة', 'Retry')}</Button>} /> : !product ? <p role="status">{label('هذا المنتج غير متاح للطلب حاليًا.', 'This product is currently unavailable.')}</p> : <form onSubmit={(event) => void submit(event)}>
      <fieldset disabled={payment.busy || !!payment.paymentRetry} className="sf-funnel-checkout__fields">
        <legend className="sf-funnel-checkout__product">{product.name}</legend>
        <div className="sf-funnel-checkout__selection">
          {variants.length > 0 ? <label className="sf-funnel-checkout__option">
            <span>{label('اختر اللون أو المقاس', 'Choose an option')}</span>
            <select value={variantId} onChange={(event) => setVariantId(event.target.value)} required>
              <option value="">{label('اختر…', 'Choose…')}</option>
              {variants.filter((variant) => variant.is_active !== false).map((variant) => <option key={variant.id} value={variant.id}>{variant.name || Object.values(variant.options ?? {}).join(' / ')}</option>)}
            </select>
          </label> : null}
          <Input label={label('الكمية', 'Quantity')} type="number" min={1} max={999} step={1} value={quantity} required
            onChange={(event) => setQuantity(Math.max(1, Math.min(999, Math.trunc(Number(event.target.value) || 1))))} />
        </div>
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
            <span>{method.slug === 'cod' ? label('الدفع عند الاستلام', 'Cash on delivery') : method.name}{method.test_mode ? label(' (تجريبي)', ' (Test)') : ''}</span>
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
          <div><dt>{label('الشحن', 'Shipping')}</dt><dd>{formatMoney(Number(quote.totals.shipping_total), quote.currency, locale)}</dd></div>
          {Number(quote.totals.tax_total) > 0 ? <div><dt>{label('الضريبة', 'Tax')}</dt><dd>{formatMoney(Number(quote.totals.tax_total), quote.currency, locale)}</dd></div> : null}
          <div className="sf-funnel-checkout__grand"><dt>{label('الإجمالي', 'Total')}</dt><dd>{formatMoney(Number(quote.totals.grand_total), quote.currency, locale)}</dd></div>
        </dl> : null}
      </div>
      {payment.error ? <div role="alert"><p className="sf-field__error">{payment.error}</p>{!payment.paymentRetry ? <Button type="button" variant="secondary" onClick={() => { contact.query.reload(); quoteQ.reload(); }}>{label('تحديث خيارات التوصيل', 'Refresh delivery options')}</Button> : null}</div> : null}
      <Button type="submit" block loading={payment.busy} disabled={!payment.paymentMethod || (!payment.paymentRetry && (!quote || !contact.shippingReady))}>
        {payment.paymentRetry ? label('إعادة محاولة الدفع', 'Retry payment') : label('تأكيد الطلب', 'Place order')}
      </Button>
      {payment.paymentRetry ? <Button type="button" variant="secondary" block onClick={payment.cancelRetry}>{label('بدء طلب جديد بدلًا من ذلك', 'Start a new order instead')}</Button> : null}
    </form>}
  </Container></Section>;
}
