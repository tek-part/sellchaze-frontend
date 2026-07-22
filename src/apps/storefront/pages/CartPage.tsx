/**
 * CartPage — /cart. The full bag: line items with quantity/remove + an order summary with checkout.
 * Reads/writes the shared cart store; empty state when there's nothing in the bag.
 */
import type { ReactElement } from 'react';
import {
  ButtonLink,
  Container,
  EmptyState,
  HorizontalProductCard,
  Section,
} from '../themes/luxury-fashion/components';
import type { ProductCardModel } from '../types/catalog';
import type { CartLine } from '../types/cart';
import { useCart } from '../state/cart';
import { useStore } from '../state/store-context';
import { formatMoney } from '../utils/format';
import { ThemeRenderer, useTemplate } from '../theme-engine';
import { flowContext } from './flow-context';

function lineToProduct(line: CartLine): ProductCardModel {
  return {
    id: line.productId,
    handle: '',
    title: line.title,
    url: line.url,
    price: line.price,
    currency: line.currency,
    ...(line.image ? { image: { src: line.image } } : {}),
  };
}

export function CartPage(): ReactElement {
  const cart = useCart();
  const { store } = useStore();
  const tpl = useTemplate('cart');

  if (tpl) return <ThemeRenderer page={tpl} context={flowContext(store)} />;

  if (cart.lines.length === 0) {
    return (
      <Section>
        <Container>
          <EmptyState
            variant="cart"
            title="Your bag is empty"
            description="Discover the new season — pieces made to last."
            actions={<ButtonLink href="/collections/new-in">Shop new in</ButtonLink>}
          />
        </Container>
      </Section>
    );
  }

  return (
    <Section>
      <Container>
        <div className="sf-page-head">
          <h1 className="sf-page-head__title">Your bag</h1>
        </div>
        <div className="sf-cart-page">
          <div className="sf-cart-page__lines">
            {cart.lines.map((line) => (
              <div key={line.id} className="sf-cart-page__line">
                <HorizontalProductCard
                  product={lineToProduct(line)}
                  quantity={line.quantity}
                  onQuantityChange={(q) => cart.updateQuantity(line.id, q)}
                  onRemove={() => cart.remove(line.id)}
                  {...(line.maxQuantity ? { maxQuantity: line.maxQuantity } : {})}
                  {...(line.attributes ? { attributes: line.attributes } : {})}
                />
              </div>
            ))}
          </div>
          <aside className="sf-cart-summary">
            <div className="sf-cart-summary__row">
              <span>Subtotal</span>
              <span>{formatMoney(cart.totals.subtotal, cart.totals.currency || store.currency)}</span>
            </div>
            <div className="sf-cart-summary__row">
              <span>Shipping</span>
              <span>Calculated at checkout</span>
            </div>
            <div className="sf-cart-summary__total">
              <span>Total</span>
              <span className="sf-cart-summary__total-value">
                {formatMoney(cart.totals.subtotal, cart.totals.currency || store.currency)}
              </span>
            </div>
            <ButtonLink href="/checkout" block>
              Checkout
            </ButtonLink>
          </aside>
        </div>
      </Container>
    </Section>
  );
}
