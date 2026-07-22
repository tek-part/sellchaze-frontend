/**
 * CheckoutPage — /checkout. Contact + shipping form and an order summary with coupon support, then
 * submits to the storefront checkout endpoint. On success the cart clears and the shopper lands on
 * the order-success page. Empty cart redirects to the bag.
 */
import { useState, type FormEvent, type ReactElement } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Button,
  Container,
  Input,
  Section,
} from '../themes/luxury-fashion/components';
import { useCart } from '../state/cart';
import { useStore } from '../state/store-context';
import { applyCoupon, submitCheckout } from '../api/storefront';
import { formatMoney } from '../utils/format';
import { ThemeRenderer, useTemplate } from '../theme-engine';
import { flowContext } from './flow-context';

export function CheckoutPage(): ReactElement {
  const cart = useCart();
  const { store } = useStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', name: '', line1: '', city: '', postal_code: '', country: '' });
  const [coupon, setCoupon] = useState('');
  const [couponMsg, setCouponMsg] = useState<string>();
  const [discount, setDiscount] = useState(0);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
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
      setCouponMsg(value > 0 ? 'Coupon applied.' : (res?.data?.message ?? 'Coupon applied.'));
    } catch (err) {
      setDiscount(0);
      setCouponMsg(err instanceof Error ? err.message : 'That code could not be applied.');
    }
  };

  const placeOrder = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setBusy(true);
    setError(undefined);
    try {
      const res = (await submitCheckout({
        email: form.email,
        shipping_address: { name: form.name, line1: form.line1, city: form.city, postal_code: form.postal_code, country: form.country },
        items: cart.lines.map((l) => ({ product_id: Number(l.productId), variant_id: l.variantId ? Number(l.variantId) : undefined, quantity: l.quantity })),
        ...(coupon ? { coupon_code: coupon } : {}),
      })) as { data?: { number?: string } };
      cart.clear();
      const number = res?.data?.number;
      navigate(number ? `/order/success?number=${encodeURIComponent(number)}` : '/order/success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We could not place your order. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section>
      <Container>
        <div className="sf-page-head" style={{ textAlign: 'start' }}>
          <h1 className="sf-page-head__title">Checkout</h1>
        </div>
        <div className="sf-cart-page">
          <form className="sf-account__panel" onSubmit={(e) => void placeOrder(e)} noValidate>
            <Input label="Email" type="email" value={form.email} onChange={set('email')} required autoComplete="email" />
            <Input label="Full name" value={form.name} onChange={set('name')} required autoComplete="name" />
            <Input label="Address" value={form.line1} onChange={set('line1')} required autoComplete="address-line1" />
            <Input label="City" value={form.city} onChange={set('city')} required autoComplete="address-level2" />
            <Input label="Postal code" value={form.postal_code} onChange={set('postal_code')} required autoComplete="postal-code" />
            <Input label="Country" value={form.country} onChange={set('country')} required autoComplete="country-name" />
            {error ? <p className="sf-field__error" role="alert">{error}</p> : null}
            <Button type="submit" block loading={busy}>
              Place order · {formatMoney(total, currency)}
            </Button>
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
              <Input label="Coupon code" value={coupon} onChange={(e) => setCoupon(e.target.value)} />
              <Button type="button" variant="secondary" onClick={() => void applyCode()} disabled={!coupon}>
                Apply
              </Button>
            </div>
            {couponMsg ? <p className="sf-card-row__meta">{couponMsg}</p> : null}
            {discount > 0 ? (
              <div className="sf-cart-summary__row">
                <span>Discount</span>
                <span>−{formatMoney(discount, currency)}</span>
              </div>
            ) : null}
            <div className="sf-cart-summary__row">
              <span>Shipping</span>
              <span>Calculated after address</span>
            </div>
            <div className="sf-cart-summary__total">
              <span>Total</span>
              <span className="sf-cart-summary__total-value">{formatMoney(total, currency)}</span>
            </div>
          </aside>
        </div>
      </Container>
    </Section>
  );
}

export function OrderSuccessPage(): ReactElement {
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
          <h1 className="sf-state__title">Thank you for your order</h1>
          <p className="sf-state__text">
            {number ? `Your order ${number} is confirmed.` : 'Your order is confirmed.'} A confirmation email is on its way.
          </p>
          <div className="sf-state__actions">
            <a className="sf-btn sf-btn--primary sf-btn--md" href="/">
              <span className="sf-btn__label">Continue shopping</span>
            </a>
          </div>
        </div>
      </Container>
    </Section>
  );
}
