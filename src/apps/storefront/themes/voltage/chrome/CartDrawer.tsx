/**
 * Voltage CartDrawer — a mini bag in a right-side Drawer. Reads/writes the shared cart store: line
 * rows (thumb + title + qty + remove), a subtotal, and View-bag / Checkout actions. Voltage's own.
 */
import type { ReactElement } from 'react';
import { Drawer } from '../components/Drawer';
import { ButtonLink } from '../components/ButtonLink';
import { IconButton } from '../components/IconButton';
import { StoreImage } from '../components/Image';
import { Price } from '../components/Price';
import { QuantityStepper } from '../components/QuantityStepper';
import { IconClose } from '../components/icons';
import { useCart } from '../../../state/cart';

export interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function CartDrawer(props: CartDrawerProps): ReactElement {
  const { open, onClose } = props;
  const cart = useCart();
  const currency = cart.totals.currency || 'USD';
  const empty = cart.lines.length === 0;

  const footer = empty ? null : (
    <div className="vlt-minicart__foot">
      <div className="vlt-minicart__subtotal">
        <span>Subtotal</span>
        <span className="vlt-num"><Price amount={cart.totals.subtotal} currency={currency} /></span>
      </div>
      <div className="vlt-minicart__ctas">
        <ButtonLink href="/cart" variant="secondary" onClick={onClose}>View bag</ButtonLink>
        <ButtonLink href="/checkout" variant="primary" onClick={onClose}>Checkout</ButtonLink>
      </div>
    </div>
  );

  return (
    <Drawer open={open} onClose={onClose} side="right" title={`Your bag (${cart.totals.count})`} {...(footer ? { footer } : {})}>
      {empty ? (
        <div className="vlt-minicart__empty">
          <span className="vlt-empty__title">Your bag is empty</span>
          <span className="vlt-empty__text">Nothing loaded yet.</span>
          <ButtonLink href="/collections/new-in" onClick={onClose} className="vlt-empty__cta">Shop new in</ButtonLink>
        </div>
      ) : (
        <ul className="vlt-minicart__lines">
          {cart.lines.map((line) => (
            <li key={line.id} className="vlt-minicart__line">
              <a href={line.url} className="vlt-minicart__thumb" onClick={onClose} tabIndex={-1} aria-hidden="true">
                <StoreImage className="vlt-minicart__thumb-img" src={line.image} alt="" />
              </a>
              <div className="vlt-minicart__body">
                <a href={line.url} className="vlt-minicart__title" onClick={onClose}>{line.title}</a>
                {line.attributes ? <span className="vlt-minicart__attr">{line.attributes}</span> : null}
                <div className="vlt-minicart__row">
                  <QuantityStepper value={line.quantity} onChange={(q) => cart.updateQuantity(line.id, q)} {...(line.maxQuantity ? { max: line.maxQuantity } : {})} label={`Quantity for ${line.title}`} />
                  <span className="vlt-num vlt-minicart__price"><Price amount={line.price * line.quantity} currency={line.currency} /></span>
                </div>
              </div>
              <IconButton label={`Remove ${line.title}`} onClick={() => cart.remove(line.id)} className="vlt-minicart__rm"><IconClose /></IconButton>
            </li>
          ))}
        </ul>
      )}
    </Drawer>
  );
}
