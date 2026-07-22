/**
 * CartDrawer — slide-in mini-cart. Composes Drawer + HorizontalProductCard lines + a free-shipping
 * progress rule + subtotal + checkout. Optimistic quantity updates via the cart store; empty state
 * when there's nothing in the bag. §32.8.
 */
import type { ReactElement } from 'react';
import { Drawer } from '../components/Drawer';
import { OverlayBody, OverlayFooter } from '../components/overlay/Overlay';
import { ButtonLink } from '../components/ButtonLink';
import { EmptyState } from '../components/StateMessage';
import { HorizontalProductCard } from '../components/HorizontalProductCard';
import type { ProductCardModel } from '../../../types/catalog';
import { formatMoney } from '../../../utils/format';
import { useCart } from '../../../state/cart';

export interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  checkoutUrl?: string;
  cartUrl?: string;
  /** Show a free-shipping progress rule toward this subtotal (major units). */
  freeShippingThreshold?: number;
  locale?: string;
}

function lineToProduct(line: {
  productId: string;
  title: string;
  url: string;
  image?: string;
  price: number;
  currency: string;
}): ProductCardModel {
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

export function CartDrawer(props: CartDrawerProps): ReactElement {
  const { open, onClose, checkoutUrl = '/checkout', cartUrl = '/cart', freeShippingThreshold, locale } = props;
  const { lines, totals, updateQuantity, remove } = useCart();

  const remaining = freeShippingThreshold ? Math.max(0, freeShippingThreshold - totals.subtotal) : 0;
  const shipPct = freeShippingThreshold
    ? Math.min(100, (totals.subtotal / freeShippingThreshold) * 100)
    : 0;

  return (
    <Drawer open={open} onClose={onClose} title="Your bag">
      {lines.length === 0 ? (
        <OverlayBody>
          <EmptyState
            variant="cart"
            title="Your bag is empty"
            description="Discover the new season — pieces made to last."
            actions={
              <ButtonLink href="/collections/new-in" onClick={onClose}>
                Shop new in
              </ButtonLink>
            }
          />
        </OverlayBody>
      ) : (
        <>
          <OverlayBody>
            {freeShippingThreshold ? (
              <div className="sf-cart__ship">
                {remaining > 0 ? (
                  <span>You&rsquo;re {formatMoney(remaining, totals.currency, locale)} away from complimentary shipping.</span>
                ) : (
                  <span>You&rsquo;ve unlocked complimentary shipping.</span>
                )}
                <div className="sf-cart__ship-track" aria-hidden>
                  <div className="sf-cart__ship-fill" style={{ width: `${shipPct}%` }} />
                </div>
              </div>
            ) : null}

            <div className="sf-cart__lines">
              {lines.map((line) => (
                <HorizontalProductCard
                  key={line.id}
                  product={lineToProduct(line)}
                  quantity={line.quantity}
                  onQuantityChange={(q) => updateQuantity(line.id, q)}
                  {...(line.maxQuantity ? { maxQuantity: line.maxQuantity } : {})}
                  onRemove={() => remove(line.id)}
                  {...(line.attributes ? { attributes: line.attributes } : {})}
                  locale={locale}
                />
              ))}
            </div>
          </OverlayBody>

          <OverlayFooter>
            <div className="sf-cart__foot">
              <div className="sf-cart__subtotal">
                <span className="sf-cart__subtotal-label">Subtotal</span>
                <span className="sf-cart__subtotal-value">{formatMoney(totals.subtotal, totals.currency, locale)}</span>
              </div>
              <ButtonLink href={checkoutUrl} block>
                Checkout
              </ButtonLink>
              <ButtonLink href={cartUrl} variant="ghost" block onClick={onClose}>
                View bag
              </ButtonLink>
            </div>
          </OverlayFooter>
        </>
      )}
    </Drawer>
  );
}
