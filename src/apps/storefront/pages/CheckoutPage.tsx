/**
 * CheckoutPage — /checkout. Contact + shipping form and an order summary with coupon support, then
 * submits to the storefront checkout endpoint. On success the cart clears and the shopper lands on
 * the order-success page. Empty cart redirects to the bag.
 */
import { useState, type FormEvent, type ReactElement } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Container,
  Input,
  Section,
} from '../foundation/components';
import { useCart } from '../state/cart';
import { useStore } from '../state/store-context';
import { applyCoupon } from '../api/storefront';
import { formatMoney } from '../utils/format';
import { ThemeRenderer, useTemplate } from '../theme-engine';
import { flowContext } from './flow-context';
import { useCheckoutPaymentFlow } from './useCheckoutPaymentFlow';

export function CheckoutPage(): ReactElement {
  const { t } = useTranslation();
  const cart = useCart();
  const { store } = useStore();
  const [form, setForm] = useState({ email: '', name: '', line1: '', city: '', postal_code: '', country: '' });
  const [coupon, setCoupon] = useState('');
  const [couponMsg, setCouponMsg] = useState<string>();
  const [discount, setDiscount] = useState(0);
  const checkout = useCheckoutPaymentFlow();
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const tpl = useTemplate('checkout');

  if (cart.lines.length === 0) return <Navigate to="/cart" replace />;
  if (tpl) return <ThemeRenderer page={tpl} context={flowContext(store)} />;

  const currency = cart.totals.currency || store.currency;
  const total = Math.max(0, cart.totals.subtotal - discount);

  const applyCode = async (): Promise<void> => {
    setCouponMsg(undefined);
    try {
      const res = (await applyCoupon(coupon)) as { data?: { discount?: number; message?: string } };
      const value = Number(res?.data?.discount ?? 0);
      setDiscount(Number.isFinite(value) ? value : 0);
      setCouponMsg(value > 0 ? t('checkout.couponApplied') : (res?.data?.message ?? t('checkout.couponApplied')));
    } catch (err) {
      setDiscount(0);
      setCouponMsg(err instanceof Error ? err.message : t('checkout.couponFailed'));
    }
  };

  const placeOrder = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    await checkout.submit({
      customer_name: form.name,
      customer_email: form.email,
      shipping_address: { name: form.name, line1: form.line1, city: form.city, postal_code: form.postal_code, country: form.country },
      ...(coupon ? { coupon_code: coupon } : {}),
    });
  };

  return (
    <Section>
      <Container>
        <div className="sf-page-head" style={{ textAlign: 'start' }}>
          <h1 className="sf-page-head__title">{t('checkout.title')}</h1>
        </div>
        <div className="sf-cart-page">
          <form className="sf-account__panel" onSubmit={(e) => void placeOrder(e)} noValidate>
            <Input label={t('auth.email')} type="email" value={form.email} onChange={set('email')} required autoComplete="email" />
            <Input label={t('auth.fullName')} value={form.name} onChange={set('name')} required autoComplete="name" />
            <Input label={t('checkout.address')} value={form.line1} onChange={set('line1')} required autoComplete="address-line1" />
            <Input label={t('account.city')} value={form.city} onChange={set('city')} required autoComplete="address-level2" />
            <Input label={t('account.postalCode')} value={form.postal_code} onChange={set('postal_code')} required autoComplete="postal-code" />
            <Input label={t('account.country')} value={form.country} onChange={set('country')} required autoComplete="country-name" />
            <fieldset className="sf-account__panel" style={{ padding: '1rem' }}>
              <legend>{t('checkout.payment')}</legend>
              {checkout.paymentMethods.map((method) => (
                <label key={method.slug} className="sf-card-row" style={{ cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="payment_method"
                    value={method.slug}
                    checked={checkout.paymentMethod === method.slug}
                    onChange={() => checkout.setPaymentMethod(method.slug)}
                    required
                  />
                  <span>{method.name}{method.test_mode ? ' (Test)' : ''}</span>
                </label>
              ))}
              {checkout.paymentMethods.length === 0 ? <p className="sf-field__error">No payment method is currently available.</p> : null}
            </fieldset>
            {checkout.error ? <p className="sf-field__error" role="alert">{checkout.error}</p> : null}
            <Button type="submit" block loading={checkout.busy} disabled={!checkout.paymentMethod}>
              {checkout.paymentRetry
                ? t('checkout.retryPayment', 'Retry payment')
                : `${t('checkout.placeOrder')} · ${formatMoney(total, currency)}`}
            </Button>
            {checkout.paymentRetry ? (
              <Button type="button" variant="secondary" block onClick={checkout.cancelRetry}>
                {t('checkout.startNewOrder', 'Start a new order instead')}
              </Button>
            ) : null}
          </form>

          <aside className="sf-cart-summary">
            {cart.lines.map((line) => (
              <div key={line.id} className="sf-cart-summary__row">
                <span>
                  {line.title} × {line.quantity}
                </span>
                <span>{formatMoney(line.price * line.quantity, currency)}</span>
              </div>
            ))}
            <div className="sf-pdp__row">
              <Input label={t('checkout.couponCode')} value={coupon} onChange={(e) => setCoupon(e.target.value)} />
              <Button type="button" variant="secondary" onClick={() => void applyCode()} disabled={!coupon}>
                {t('checkout.apply')}
              </Button>
            </div>
            {couponMsg ? <p className="sf-card-row__meta">{couponMsg}</p> : null}
            {discount > 0 ? (
              <div className="sf-cart-summary__row">
                <span>{t('checkout.discount')}</span>
                <span>−{formatMoney(discount, currency)}</span>
              </div>
            ) : null}
            <div className="sf-cart-summary__row">
              <span>{t('checkout.shipping')}</span>
              <span>{t('checkout.calculatedAfterAddress')}</span>
            </div>
            <div className="sf-cart-summary__total">
              <span>{t('checkout.total')}</span>
              <span className="sf-cart-summary__total-value">{formatMoney(total, currency)}</span>
            </div>
          </aside>
        </div>
      </Container>
    </Section>
  );
}

export function OrderSuccessPage(): ReactElement {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const { store } = useStore();
  const tpl = useTemplate('order-success');
  const number = params.get('number');
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
            {number ? t('checkout.orderConfirmedNumber', { number }) : t('checkout.orderConfirmed')} {t('checkout.confirmationEmail')}
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
