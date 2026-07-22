/**
 * CartDrawer — a warm slide-in cart summary reading the shared cart state. Line items with quantity
 * steppers + remove, an honest subtotal (shipping/tax "calculated at checkout"), free-delivery
 * progress, and a checkout CTA. Empty state guides back to browsing. A JS enhancement over the full
 * /cart page; closes on scrim click or Escape.
 */
import { useEffect, type ReactElement } from 'react';
import { cn } from '../../../../../shared/utils/cn';
import { useCart } from '../../../state/cart';
import { Button } from '../components/Button';
import { ButtonLink } from '../components/ButtonLink';
import { QuantityStepper } from '../components/QuantityStepper';
import { Price } from '../components/Price';
import { StoreImage } from '../components/Image';
import { IconButton } from '../components/IconButton';
import { CloseIcon } from '../components/icons';

export interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  freeShippingThreshold?: number;
}

export function CartDrawer(props: CartDrawerProps): ReactElement {
  const { open, onClose, freeShippingThreshold = 0 } = props;
  const { lines, totals, updateQuantity, remove } = useCart();

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const remaining = freeShippingThreshold > 0 ? Math.max(0, freeShippingThreshold - totals.subtotal) : 0;
  const progress = freeShippingThreshold > 0 ? Math.min(100, (totals.subtotal / freeShippingThreshold) * 100) : 0;

  return (
    <div className={cn('hh-drawer', open && 'hh-drawer--open')} aria-hidden={!open}>
      <div className="hh-drawer__scrim" onClick={onClose} />
      <aside
        className="hh-drawer__panel"
        role="dialog"
        aria-modal="true"
        aria-label="Your cart"
        inert={!open}
      >
        <header className="hh-drawer__head">
          <h2 className="hh-drawer__title">Your cart ({totals.count})</h2>
          <IconButton label="Close cart" icon={<CloseIcon />} onClick={onClose} />
        </header>

        {freeShippingThreshold > 0 && totals.count > 0 ? (
          <div className="hh-drawer__ship">
            <p className="hh-drawer__ship-msg">
              {remaining > 0 ? (
                <>
                  You’re <Price value={remaining} currency={totals.currency} size="sm" /> from free delivery
                </>
              ) : (
                'You’ve unlocked free delivery.'
              )}
            </p>
            <span className="hh-drawer__ship-bar">
              <span className="hh-drawer__ship-fill" style={{ inlineSize: `${progress}%` }} />
            </span>
          </div>
        ) : null}

        {lines.length === 0 ? (
          <div className="hh-drawer__empty">
            <p className="hh-drawer__empty-title">Your cart is empty</p>
            <p className="hh-drawer__empty-body">Beautiful rooms start with one good piece.</p>
            <Button onClick={onClose}>Browse rooms</Button>
          </div>
        ) : (
          <>
            <ul className="hh-drawer__lines">
              {lines.map((line) => (
                <li key={line.id} className="hh-cart-line">
                  <a href={line.url} className="hh-cart-line__media">
                    <StoreImage src={line.image} alt={line.title} className="hh-cart-line__img" />
                  </a>
                  <div className="hh-cart-line__body">
                    <a href={line.url} className="hh-cart-line__title">
                      {line.title}
                    </a>
                    {line.attributes ? <p className="hh-cart-line__attrs">{line.attributes}</p> : null}
                    <div className="hh-cart-line__row">
                      <QuantityStepper
                        value={line.quantity}
                        onChange={(q) => updateQuantity(line.id, q)}
                        {...(line.maxQuantity ? { max: line.maxQuantity } : {})}
                      />
                      <Price value={line.price * line.quantity} currency={line.currency} size="sm" />
                    </div>
                    <button type="button" className="hh-cart-line__remove" onClick={() => remove(line.id)}>
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <footer className="hh-drawer__foot">
              <div className="hh-drawer__subtotal">
                <span>Subtotal</span>
                <Price value={totals.subtotal} currency={totals.currency} size="base" />
              </div>
              <p className="hh-drawer__note">Shipping &amp; taxes calculated at checkout.</p>
              <ButtonLink href="/checkout" block>
                Checkout
              </ButtonLink>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
