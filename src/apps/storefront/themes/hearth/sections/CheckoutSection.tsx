/**
 * checkout — a calm, trustworthy checkout for big-ticket home purchases
 * (docs/themes/theme-03/13-checkout-experience). Contact → delivery → delivery-method → payment →
 * review, with a persistent order summary. PAYMENT IS PROVIDER-HOSTED: the theme renders the
 * surrounding shell only and never a raw card / CVV / expiry field (engine §25). Empty cart routes
 * back to the bag.
 */
import { useState, type FormEvent, type ReactElement } from 'react';
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
  { value: 'standard', label: 'Standard courier — 3–5 days' },
  { value: 'two-person', label: 'Two-person delivery (large items) — room of choice' },
  { value: 'white-glove', label: 'White-glove + assembly' },
] as const;

const COUNTRIES = [
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'AE', label: 'United Arab Emirates' },
];

export function CheckoutSection(props: SectionRenderProps): ReactElement {
  const cart = useCart();
  const currency = cart.totals.currency || props.context.store.currency || 'USD';
  const [email, setEmail] = useState('');
  const [method, setMethod] = useState<string>('standard');
  const [busy, setBusy] = useState(false);

  if (cart.lines.length === 0) {
    return (
      <Section>
        <Container narrow>
          <div className="hh-checkout__empty">
            <h1 className="hh-page-title">Your bag is empty</h1>
            <ButtonLink href="/rooms">Browse rooms</ButtonLink>
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
        <h1 className="hh-page-title">Checkout</h1>
        <form className="hh-checkout" onSubmit={onSubmit} noValidate>
          <div className="hh-checkout__main">
            <fieldset className="hh-checkout__step">
              <legend className="hh-checkout__legend">Contact</legend>
              <Input
                label="Email"
                type="email"
                name="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </fieldset>

            <fieldset className="hh-checkout__step">
              <legend className="hh-checkout__legend">Delivery address</legend>
              <div className="hh-checkout__grid">
                <Input label="First name" name="given-name" autoComplete="given-name" required />
                <Input label="Last name" name="family-name" autoComplete="family-name" required />
              </div>
              <Input label="Address" name="address" autoComplete="street-address" required />
              <div className="hh-checkout__grid">
                <Input label="City" name="city" autoComplete="address-level2" required />
                <Input label="Postcode" name="postcode" autoComplete="postal-code" required />
              </div>
              <Select label="Country" options={COUNTRIES} defaultValue="US" />
            </fieldset>

            <fieldset className="hh-checkout__step">
              <legend className="hh-checkout__legend">Delivery method</legend>
              <div className="hh-checkout__methods" role="radiogroup" aria-label="Delivery method">
                {DELIVERY_METHODS.map((m) => (
                  <label key={m.value} className="hh-checkout__method">
                    <input
                      type="radio"
                      name="delivery"
                      value={m.value}
                      checked={method === m.value}
                      onChange={() => setMethod(m.value)}
                    />
                    <span>{m.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="hh-checkout__step">
              <legend className="hh-checkout__legend">Payment</legend>
              <p className="hh-checkout__payment-note">
                Payment is completed securely on our provider’s hosted page. You’ll be redirected after
                you review your order — no card details are entered here.
              </p>
            </fieldset>
          </div>

          <aside className="hh-checkout__summary" aria-label="Order summary">
            <h2 className="hh-cart__summary-title">Your order</h2>
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
              <span>Subtotal</span>
              <Price value={cart.totals.subtotal} currency={currency} />
            </div>
            <p className="hh-cart__note">Delivery &amp; taxes calculated on the next step.</p>
            <Button type="submit" block loading={busy}>
              Continue to payment
            </Button>
          </aside>
        </form>
      </Container>
    </Section>
  );
}
