import { useEffect, useMemo, useState, type FormEvent, type ReactElement } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Container, Input, Section, Spinner } from '../foundation/components';
import { useCart } from '../state/cart';
import { useStore } from '../state/store-context';
import { quoteCheckout } from '../api/storefront';
import { useAsync } from '../api/useAsync';
import { useLocale } from '../i18n/useLocale';
import { formatMoney } from '../utils/format';
import { ThemeRenderer, useTemplate } from '../theme-engine';
import { flowContext } from './flow-context';
import { useCheckoutPaymentFlow } from './useCheckoutPaymentFlow';
import { CheckoutRecovery } from './CheckoutRecovery';
import { clearCheckoutAttempt, readCheckoutAttempt } from './checkout-attempt';
import { CheckoutFieldsForm, useCheckoutFields } from './CheckoutFields';

export function CheckoutPage(): ReactElement {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const ar = locale === 'ar';
  const cart = useCart();
  const { store } = useStore();
  const [coupon, setCoupon] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const checkout = useCheckoutPaymentFlow();
  const contact = useCheckoutFields(checkout.paymentMethod);
  const tpl = useTemplate('checkout');
  const items = useMemo(() => cart.lines.map((line) => ({ product_id: Number(line.productId), quantity: line.quantity, ...(line.variantId ? { variant_id: Number(line.variantId) } : {}) })), [cart.lines]);
  const quoteKey = JSON.stringify([items, appliedCoupon, contact.shippingSelection, contact.shippingReady]);
  const quoteQ = useAsync(async () => items.length && contact.shippingReady ? { key: quoteKey, data: (await quoteCheckout(items, appliedCoupon, contact.shippingSelection)).data } : null, [quoteKey, locale]);
  const quote = !quoteQ.loading && !quoteQ.error && quoteQ.data?.key === quoteKey ? quoteQ.data.data : null;
  const placeOrder = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    if (!checkout.paymentRetry && (!quote || !contact.shippingReady)) return;
    await checkout.submit({ ...contact.payload(), coupon_code: appliedCoupon });
  };
  if (!cart.lines.length && !checkout.completed && !checkout.busy && !checkout.unresolved) return <Navigate to="/cart" replace />;
  return <>
    {tpl ? <ThemeRenderer page={tpl} context={flowContext(store)} /> : null}
    <Section><Container>
      <div className="sf-page-head" style={{ textAlign: 'start' }}><h1 className="sf-page-head__title">{t('checkout.title')}</h1></div>
      <div className="sf-cart-page">
        <form className="sf-account__panel" onSubmit={(event) => void placeOrder(event)}>
          <CheckoutRecovery flow={checkout} />
          <fieldset disabled={checkout.busy || checkout.unresolved} style={{ display: 'grid', gap: '1rem', border: 0, padding: 0, margin: 0 }}>
            <CheckoutFieldsForm model={contact} />
            <fieldset className="sf-account__panel" style={{ padding: '1rem' }}>
              <legend>{t('checkout.payment')}</legend>
              {checkout.paymentMethods.map((method) => <label key={method.slug} className="sf-card-row" style={{ cursor: 'pointer' }}>
                <input type="radio" name="payment_method" checked={checkout.paymentMethod === method.slug} onChange={() => checkout.setPaymentMethod(method.slug)} required />
                <span>{method.slug === 'cod' ? (ar ? 'الدفع عند الاستلام' : 'Cash on delivery') : method.name}{method.test_mode ? (ar ? ' (تجريبي)' : ' (Test)') : ''}</span>
              </label>)}
              {!checkout.paymentMethods.length ? <p className="sf-field__error">{ar ? 'لا توجد طريقة دفع متاحة حاليًا.' : 'No payment method is currently available.'}</p> : null}
            </fieldset>
          </fieldset>
          {checkout.error && !checkout.unresolved ? <div role="alert"><p className="sf-field__error">{checkout.error}</p>{!checkout.paymentRetry ? <Button type="button" variant="secondary" onClick={() => { contact.query.reload(); quoteQ.reload(); }}>{ar ? 'تحديث خيارات التوصيل' : 'Refresh delivery options'}</Button> : null}</div> : null}
          {!checkout.unresolved ? <Button type="submit" block loading={checkout.busy} disabled={!checkout.paymentMethod || !quote || !contact.shippingReady}>
            {`${t('checkout.placeOrder')}${quote ? ` · ${formatMoney(Number(quote.totals.grand_total), quote.currency, locale)}` : ''}`}
          </Button> : null}
        </form>
        <aside className="sf-cart-summary">
          {quote ? quote.items.map((line) => <div key={`${line.product_id}:${line.variant_id}`} className="sf-cart-summary__row"><span>{line.name} × {line.quantity}</span><span>{formatMoney(Number(line.line_total), quote.currency, locale)}</span></div>) : cart.lines.map((line) => <div key={line.id} className="sf-cart-summary__row"><span>{line.title} × {line.quantity}</span></div>)}
          <fieldset disabled={checkout.busy || checkout.unresolved} style={{ border: 0, padding: 0, margin: 0 }}>
            <div className="sf-pdp__row"><Input label={t('checkout.couponCode')} value={coupon} maxLength={100} onChange={(event) => setCoupon(event.target.value)} />
              <Button type="button" variant="secondary" disabled={quoteQ.loading} onClick={() => { setAppliedCoupon(coupon.trim()); quoteQ.reload(); }}>{t('checkout.apply')}</Button>
            </div>
            {appliedCoupon ? <Button type="button" variant="ghost" onClick={() => { setAppliedCoupon(''); setCoupon(''); }}>{ar ? 'إزالة الخصم' : 'Remove coupon'}</Button> : null}
          </fieldset>
          <div aria-live="polite">
            {quoteQ.loading ? <Spinner label={ar ? 'جارٍ حساب الإجمالي…' : 'Calculating total…'} /> : null}
            {quoteQ.error ? <div role="alert"><p>{quoteQ.error.message}</p><Button type="button" variant="secondary" onClick={() => { contact.query.reload(); quoteQ.reload(); }}>{ar ? 'إعادة الحساب' : 'Recalculate'}</Button></div> : null}
            {quote ? <>
              <div className="sf-cart-summary__row"><span>{ar ? 'المنتجات' : 'Products'}</span><span>{formatMoney(Number(quote.totals.subtotal), quote.currency, locale)}</span></div>
              {Number(quote.totals.discount_total) > 0 ? <div className="sf-cart-summary__row"><span>{t('checkout.discount')}</span><span>−{formatMoney(Number(quote.totals.discount_total), quote.currency, locale)}</span></div> : null}
              <div className="sf-cart-summary__row"><span>{t('checkout.shipping')}</span><span>{formatMoney(Number(quote.totals.shipping_total), quote.currency, locale)}</span></div>
              {Number(quote.totals.tax_total) > 0 ? <div className="sf-cart-summary__row"><span>{ar ? 'الضريبة' : 'Tax'}</span><span>{formatMoney(Number(quote.totals.tax_total), quote.currency, locale)}</span></div> : null}
              <div className="sf-cart-summary__total"><span>{t('checkout.total')}</span><span className="sf-cart-summary__total-value">{formatMoney(Number(quote.totals.grand_total), quote.currency, locale)}</span></div>
            </> : null}
          </div>
        </aside>
      </div>
    </Container></Section>
  </>;
}

export function OrderSuccessPage(): ReactElement {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const { store } = useStore();
  const tpl = useTemplate('order-success');
  const number = params.get('number');
  useEffect(() => {
    const scope = window.location.origin;
    if (number && readCheckoutAttempt(scope)?.orderNumber === number) clearCheckoutAttempt(scope);
  }, [number]);
  if (tpl) return <ThemeRenderer page={tpl} context={flowContext(store)} />;
  return (
    <Section>
      <Container narrow>
        <div className="sf-state">
          <span className="sf-state__code" aria-hidden>
            ✓
          </span>
          <h1 className="sf-state__title">{t('checkout.thankYou')}</h1>
          <p className="sf-state__text">
            {number ? t('checkout.orderConfirmedNumber', { number }) : t('checkout.orderConfirmed')}
          </p>
          <div className="sf-state__actions">
            <a className="sf-btn sf-btn--primary sf-btn--md" href="/">
              <span className="sf-btn__label">{t('cart.continueShopping')}</span>
            </a>
          </div>
        </div>
      </Container>
    </Section>
  );
}
