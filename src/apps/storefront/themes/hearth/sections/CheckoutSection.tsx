/**
 * checkout — a calm, trustworthy checkout for big-ticket home purchases
 * (docs/themes/theme-03/13-checkout-experience). Contact → delivery → delivery-method → payment →
 * review, with a persistent order summary. PAYMENT IS PROVIDER-HOSTED: the theme renders the
 * surrounding shell only and never a raw card / CVV / expiry field (engine §25). Empty cart routes
 * back to the bag.
 */
import { useState, type FormEvent, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { useCart } from '../../../state/cart';
import { ButtonLink } from '../components/ButtonLink';
import { Button } from '../components/Button';
import { Container } from '../components/Container';
import { Input } from '../components/Input';
import { Select } from '../components/Field';
import { Price } from '../components/Price';
import { Section } from '../components/Section';
import { useCheckoutPaymentFlow } from '../../../pages/useCheckoutPaymentFlow';

const DELIVERY_METHODS = [
  { value: 'standard', labelKey: 'checkout.methodStandard' },
  { value: 'two-person', labelKey: 'checkout.methodTwoPerson' },
  { value: 'white-glove', labelKey: 'checkout.methodWhiteGlove' },
] as const;

export function CheckoutSection(props: SectionRenderProps): ReactElement {
  const { t } = useTranslation();
  const cart = useCart();
  const currency = cart.totals.currency || props.context.store.currency || 'USD';
  const [form, setForm] = useState({ email: '', firstName: '', lastName: '', address: '', city: '', postcode: '', country: 'US' });
  const [method, setMethod] = useState<string>('standard');
  const checkout = useCheckoutPaymentFlow();
  const set = (key: keyof typeof form) => (event: { target: { value: string } }) => setForm((current) => ({ ...current, [key]: event.target.value }));

  const countries = [
    { value: 'US', label: t('checkout.countryUS') },
    { value: 'GB', label: t('checkout.countryGB') },
    { value: 'AE', label: t('checkout.countryAE') },
  ];

  if (cart.lines.length === 0) {
    return (
      <Section>
        <Container narrow>
          <div className="hh-checkout__empty">
            <h1 className="hh-page-title">{t('cart.empty')}</h1>
            <ButtonLink href="/rooms">{t('hearth.browseRooms')}</ButtonLink>
          </div>
        </Container>
      </Section>
    );
  }

  const onSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!form.email.trim()) return;
    void checkout.submit({
      customer_name: `${form.firstName} ${form.lastName}`.trim(),
      customer_email: form.email,
      shipping_address: { name: `${form.firstName} ${form.lastName}`.trim(), line1: form.address, city: form.city, postal_code: form.postcode, country: form.country, delivery_method: method },
    });
  };

  return (
    <Section>
      <Container>
        <h1 className="hh-page-title">{t('checkout.title')}</h1>
        <form className="hh-checkout" onSubmit={onSubmit} noValidate>
          <div className="hh-checkout__main">
            <fieldset className="hh-checkout__step">
              <legend className="hh-checkout__legend">{t('checkout.contact')}</legend>
              <Input
                label={t('auth.email')}
                type="email"
                name="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={set('email')}
              />
            </fieldset>

            <fieldset className="hh-checkout__step">
              <legend className="hh-checkout__legend">{t('checkout.deliveryAddress')}</legend>
              <div className="hh-checkout__grid">
                <Input label={t('checkout.firstName')} name="given-name" autoComplete="given-name" required value={form.firstName} onChange={set('firstName')} />
                <Input label={t('checkout.lastName')} name="family-name" autoComplete="family-name" required value={form.lastName} onChange={set('lastName')} />
              </div>
              <Input label={t('checkout.address')} name="address" autoComplete="street-address" required value={form.address} onChange={set('address')} />
              <div className="hh-checkout__grid">
                <Input label={t('account.city')} name="city" autoComplete="address-level2" required value={form.city} onChange={set('city')} />
                <Input label={t('account.postalCode')} name="postcode" autoComplete="postal-code" required value={form.postcode} onChange={set('postcode')} />
              </div>
              <Select label={t('account.country')} options={countries} value={form.country} onChange={set('country')} />
            </fieldset>

            <fieldset className="hh-checkout__step">
              <legend className="hh-checkout__legend">{t('checkout.deliveryMethod')}</legend>
              <div className="hh-checkout__methods" role="radiogroup" aria-label={t('checkout.deliveryMethod')}>
                {DELIVERY_METHODS.map((m) => (
                  <label key={m.value} className="hh-checkout__method">
                    <input
                      type="radio"
                      name="delivery"
                      value={m.value}
                      checked={method === m.value}
                      onChange={() => setMethod(m.value)}
                    />
                    <span>{t(m.labelKey)}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="hh-checkout__step">
              <legend className="hh-checkout__legend">{t('checkout.payment')}</legend>
              <p className="hh-checkout__payment-note">
                {t('checkout.paymentNote')}
              </p>
              <div className="hh-checkout__methods">{checkout.paymentMethods.map((payment) => <label key={payment.slug} className="hh-checkout__method"><input type="radio" name="payment_method" value={payment.slug} checked={checkout.paymentMethod === payment.slug} onChange={() => checkout.setPaymentMethod(payment.slug)} /><span>{payment.name}{payment.test_mode ? ' (Test)' : ''}</span></label>)}</div>
              {checkout.error ? <p className="hh-field__error" role="alert">{checkout.error}</p> : null}
            </fieldset>
          </div>

          <aside className="hh-checkout__summary" aria-label={t('checkout.orderSummary')}>
            <h2 className="hh-cart__summary-title">{t('checkout.yourOrder')}</h2>
            <ul className="hh-checkout__lines">
              {cart.lines.map((line) => (
                <li key={line.id} className="hh-checkout__line">
                  <span className="hh-checkout__line-title">
                    {line.title} <span className="hh-checkout__line-qty">× {line.quantity}</span>
                  </span>
                  <Price value={line.price * line.quantity} currency={currency} size="sm" />
                </li>
              ))}
            </ul>
            <div className="hh-cart__row">
              <span>{t('cart.subtotal')}</span>
              <Price value={cart.totals.subtotal} currency={currency} />
            </div>
            <p className="hh-cart__note">{t('checkout.deliveryTaxNext')}</p>
            <Button type="submit" block loading={checkout.busy} disabled={!checkout.paymentMethod}>
              {checkout.paymentRetry ? t('checkout.retryPayment', 'Retry payment') : t('checkout.continueToPayment')}
            </Button>
            {checkout.paymentRetry ? <Button type="button" variant="secondary" block onClick={checkout.cancelRetry}>{t('checkout.startNewOrder', 'Start a new order instead')}</Button> : null}
          </aside>
        </form>
      </Container>
    </Section>
  );
}
