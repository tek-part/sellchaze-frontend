/**
 * Voltage checkout — contact + shipping console with a live order-summary rail (coupon support), then
 * submits to the shared checkout endpoint. On success the cart clears and we land on order success.
 * Real integration via the shared cart store + checkout/coupon APIs. Voltage's own .vlt-* markup.
 */
import { useState, type FormEvent, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { Container } from '../components/Container';
import { Section } from '../components/Section';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useCart } from '../../../state/cart';
import { useStore } from '../../../state/store-context';
import { applyCoupon } from '../../../api/storefront';
import { formatMoney } from '../../../utils/format';
import { useCheckoutPaymentFlow } from '../../../pages/useCheckoutPaymentFlow';

export function CheckoutSection(_props: SectionRenderProps): ReactElement {
  const { t } = useTranslation();
  const cart = useCart();
  const { store } = useStore();
  const checkout = useCheckoutPaymentFlow();
  const [form, setForm] = useState({ email: '', name: '', line1: '', city: '', postal_code: '', country: '' });
  const [coupon, setCoupon] = useState('');
  const [couponMsg, setCouponMsg] = useState<string>();
  const [discount, setDiscount] = useState(0);
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }));

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
        <div className="vlt-flow-head">
          <span className="vlt-eyebrow">{t('checkout.eyebrow')}</span>
          <h1 className="vlt-flow-head__title">{t('checkout.title')}</h1>
        </div>
        <div className="vlt-checkout">
          <form className="vlt-checkout__form" onSubmit={(e) => void placeOrder(e)} noValidate>
            <span className="vlt-eyebrow">{t('contact.eyebrow')}</span>
            <Input label={t('auth.email')} type="email" value={form.email} onChange={set('email')} required autoComplete="email" />
            <span className="vlt-eyebrow">{t('checkout.eyebrowShipping')}</span>
            <Input label={t('auth.fullName')} value={form.name} onChange={set('name')} required autoComplete="name" />
            <Input label={t('checkout.address')} value={form.line1} onChange={set('line1')} required autoComplete="address-line1" />
            <div className="vlt-checkout__row">
              <Input label={t('account.city')} value={form.city} onChange={set('city')} required autoComplete="address-level2" />
              <Input label={t('account.postalCode')} value={form.postal_code} onChange={set('postal_code')} required autoComplete="postal-code" />
            </div>
            <Input label={t('account.country')} value={form.country} onChange={set('country')} required autoComplete="country-name" />
            <fieldset className="vlt-checkout__payment"><legend className="vlt-eyebrow">{t('checkout.payment')}</legend>{checkout.paymentMethods.map((payment) => <label key={payment.slug} className="vlt-summary__row"><input type="radio" name="payment_method" value={payment.slug} checked={checkout.paymentMethod === payment.slug} onChange={() => checkout.setPaymentMethod(payment.slug)} /><span>{payment.name}{payment.test_mode ? ' (Test)' : ''}</span></label>)}</fieldset>
            {checkout.error ? <p className="vlt-field__error" role="alert">{checkout.error}</p> : null}
            <Button type="submit" block loading={checkout.busy} disabled={!checkout.paymentMethod}>{checkout.paymentRetry ? t('checkout.retryPayment', 'Retry payment') : `${t('checkout.placeOrder')} · ${formatMoney(total, currency)}`}</Button>
            {checkout.paymentRetry ? <Button type="button" variant="secondary" block onClick={checkout.cancelRetry}>{t('checkout.startNewOrder', 'Start a new order instead')}</Button> : null}
          </form>

          <aside className="vlt-summary" aria-label={t('checkout.orderSummary')}>
            <span className="vlt-eyebrow">{t('checkout.eyebrowSummary')}</span>
            {cart.lines.map((line) => (
              <div key={line.id} className="vlt-summary__row">
                <span>{line.title} × {line.quantity}</span>
                <span className="vlt-num">{formatMoney(line.price * line.quantity, currency)}</span>
              </div>
            ))}
            <div className="vlt-checkout__coupon">
              <Input label={t('checkout.couponCode')} value={coupon} onChange={(e) => setCoupon(e.target.value)} />
              <Button type="button" variant="secondary" onClick={() => void applyCode()} disabled={!coupon}>{t('checkout.apply')}</Button>
            </div>
            {couponMsg ? <p className="vlt-checkout__coupon-msg" role="status">{couponMsg}</p> : null}
            {discount > 0 ? (
              <div className="vlt-summary__row"><span>{t('checkout.discount')}</span><span className="vlt-num">−{formatMoney(discount, currency)}</span></div>
            ) : null}
            <div className="vlt-summary__row vlt-summary__row--muted"><span>{t('checkout.shipping')}</span><span>{t('checkout.calculatedAfterAddress')}</span></div>
            <div className="vlt-summary__total"><span>{t('checkout.total')}</span><span className="vlt-num">{formatMoney(total, currency)}</span></div>
          </aside>
        </div>
      </Container>
    </Section>
  );
}
