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

const DELIVERY_METHODS = [
  { value: 'standard', labelKey: 'checkout.methodStandard' },
  { value: 'two-person', labelKey: 'checkout.methodTwoPerson' },
  { value: 'white-glove', labelKey: 'checkout.methodWhiteGlove' },
] as const;

export function CheckoutSection(props: SectionRenderProps): ReactElement {
  const { t } = useTranslation();
  const cart = useCart();
  const currency = cart.totals.currency || props.context.store.currency || 'USD';
  const [email, setEmail] = useState('');
  const [method, setMethod] = useState<string>('standard');
  const [busy, setBusy] = useState(false);

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
    if (!email.trim()) return;
    setBusy(true);
    // Provider-hosted payment happens off-theme; on success the app records the order. Here we
    // complete the demo flow by clearing the bag and routing to the confirmation page.
    cart.clear();
    if (typeof window !== 'undefined') window.location.assign('/order-success');
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </fieldset>

            <fieldset className="hh-checkout__step">
              <legend className="hh-checkout__legend">{t('checkout.deliveryAddress')}</legend>
              <div className="hh-checkout__grid">
                <Input label={t('checkout.firstName')} name="given-name" autoComplete="given-name" required />
                <Input label={t('checkout.lastName')} name="family-name" autoComplete="family-name" required />
              </div>
              <Input label={t('checkout.address')} name="address" autoComplete="street-address" required />
              <div className="hh-checkout__grid">
                <Input label={t('account.city')} name="city" autoComplete="address-level2" required />
                <Input label={t('account.postalCode')} name="postcode" autoComplete="postal-code" required />
              </div>
              <Select label={t('account.country')} options={countries} defaultValue="US" />
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
            <Button type="submit" block loading={busy}>
              {t('checkout.continueToPayment')}
            </Button>
          </aside>
        </form>
      </Container>
    </Section>
  );
}
