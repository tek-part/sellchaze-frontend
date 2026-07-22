/**
 * cart — the full bag page (docs/themes/theme-03/12-cart-experience). Line items with quantity +
 * remove beside a sticky order summary; honest totals ("delivery & taxes at checkout"); free-delivery
 * progress; empty state that routes back to browsing. Reads/writes the shared cart state.
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { useCart } from '../../../state/cart';
import { ButtonLink } from '../components/ButtonLink';
import { Container } from '../components/Container';
import { EmptyState } from '../components/EmptyState';
import { HorizontalProductCard } from '../components/HorizontalProductCard';
import { Price } from '../components/Price';
import { QuantityStepper } from '../components/QuantityStepper';
import { Section } from '../components/Section';
import { range } from './section-settings';

export function CartSection(props: SectionRenderProps): ReactElement {
  const { settings, context } = props;
  const cart = useCart();
  const currency = cart.totals.currency || context.store.currency || 'USD';
  const threshold = range(settings, 'free_ship_threshold', 0, 0, 100000);
  const remaining = threshold > 0 ? Math.max(0, threshold - cart.totals.subtotal) : 0;

  if (cart.lines.length === 0) {
    return (
      <Section>
        <Container>
          <EmptyState
            variant="cart"
            title="Your bag is empty"
            description="Beautiful rooms start with one good piece."
            actions={<ButtonLink href="/rooms">Browse rooms</ButtonLink>}
          />
        </Container>
      </Section>
    );
  }

  return (
    <Section>
      <Container>
        <h1 className="hh-page-title">Your bag</h1>
        <div className="hh-cart">
          <ul className="hh-cart__lines">
            {cart.lines.map((line) => (
              <li key={line.id} className="hh-cart__line">
                <HorizontalProductCard
                  product={{ id: line.productId, handle: '', title: line.title, url: line.url, price: line.price, currency: line.currency, ...(line.image ? { image: { src: line.image } } : {}) }}
                  {...(line.attributes ? { meta: line.attributes } : {})}
                  actions={
                    <>
                      <QuantityStepper
                        value={line.quantity}
                        onChange={(q) => cart.updateQuantity(line.id, q)}
                        {...(line.maxQuantity ? { max: line.maxQuantity } : {})}
                      />
                      <button type="button" className="hh-cart__remove" onClick={() => cart.remove(line.id)}>
                        Remove
                      </button>
                    </>
                  }
                />
              </li>
            ))}
          </ul>

          <aside className="hh-cart__summary" aria-label="Order summary">
            <h2 className="hh-cart__summary-title">Summary</h2>
            {threshold > 0 ? (
              <p className="hh-cart__ship">
                {remaining > 0 ? (
                  <>
                    You’re <Price value={remaining} currency={currency} size="sm" /> from free delivery
                  </>
                ) : (
                  'You’ve unlocked free delivery.'
                )}
              </p>
            ) : null}
            <div className="hh-cart__row">
              <span>Subtotal</span>
              <Price value={cart.totals.subtotal} currency={currency} />
            </div>
            <p className="hh-cart__note">Delivery &amp; taxes calculated at checkout.</p>
            <ButtonLink href="/checkout" block>
              Checkout
            </ButtonLink>
            <ButtonLink href="/rooms" variant="ghost" block>
              Continue shopping
            </ButtonLink>
          </aside>
        </div>
      </Container>
    </Section>
  );
}
