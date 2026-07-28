/**
 * Voltage checkout — contact + shipping console with a live order-summary rail (coupon support), then
 * submits to the shared checkout endpoint. On success the cart clears and we land on order success.
 * Real integration via the shared cart store + checkout/coupon APIs. Voltage's own .vlt-* markup.
 */
import { useState, type FormEvent, type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { Container } from '../components/Container';
import { Section } from '../components/Section';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useCart } from '../../../state/cart';
import { useStore } from '../../../state/store-context';
import { applyCoupon, submitCheckout } from '../../../api/storefront';
import { formatMoney } from '../../../utils/format';

export function CheckoutSection(_props: SectionRenderProps): ReactElement {
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
        customer_name: form.name,
        customer_email: form.email,
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
        <div className="vlt-flow-head">
          <span className="vlt-eyebrow">// Checkout</span>
          <h1 className="vlt-flow-head__title">Checkout</h1>
        </div>
        <div className="vlt-checkout">
          <form className="vlt-checkout__form" onSubmit={(e) => void placeOrder(e)} noValidate>
            <span className="vlt-eyebrow">// Contact</span>
            <Input label="Email" type="email" value={form.email} onChange={set('email')} required autoComplete="email" />
            <span className="vlt-eyebrow">// Shipping</span>
            <Input label="Full name" value={form.name} onChange={set('name')} required autoComplete="name" />
            <Input label="Address" value={form.line1} onChange={set('line1')} required autoComplete="address-line1" />
            <div className="vlt-checkout__row">
              <Input label="City" value={form.city} onChange={set('city')} required autoComplete="address-level2" />
              <Input label="Postal code" value={form.postal_code} onChange={set('postal_code')} required autoComplete="postal-code" />
            </div>
            <Input label="Country" value={form.country} onChange={set('country')} required autoComplete="country-name" />
            {error ? <p className="vlt-field__error" role="alert">{error}</p> : null}
            <Button type="submit" block loading={busy}>Place order · {formatMoney(total, currency)}</Button>
          </form>

          <aside className="vlt-summary" aria-label="Order summary">
            <span className="vlt-eyebrow">// Summary</span>
            {cart.lines.map((line) => (
              <div key={line.id} className="vlt-summary__row">
                <span>{line.title} × {line.quantity}</span>
                <span className="vlt-num">{formatMoney(line.price * line.quantity, currency)}</span>
              </div>
            ))}
            <div className="vlt-checkout__coupon">
              <Input label="Coupon code" value={coupon} onChange={(e) => setCoupon(e.target.value)} />
              <Button type="button" variant="secondary" onClick={() => void applyCode()} disabled={!coupon}>Apply</Button>
            </div>
            {couponMsg ? <p className="vlt-checkout__coupon-msg" role="status">{couponMsg}</p> : null}
            {discount > 0 ? (
              <div className="vlt-summary__row"><span>Discount</span><span className="vlt-num">−{formatMoney(discount, currency)}</span></div>
            ) : null}
            <div className="vlt-summary__row vlt-summary__row--muted"><span>Shipping</span><span>Calculated after address</span></div>
            <div className="vlt-summary__total"><span>Total</span><span className="vlt-num">{formatMoney(total, currency)}</span></div>
          </aside>
        </div>
      </Container>
    </Section>
  );
}
