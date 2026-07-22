/**
 * Rouge CartDrawer — the bag as a slide-in panel: line items with thumbnail, shade/variant, quantity
 * stepper and remove, plus a sticky footer with subtotal and a rouge checkout CTA. Reads the shared
 * cart store. Empty state invites a return to shopping.
 */
import type { ReactElement } from 'react';
import { Drawer } from '../components/overlay/Drawer';
import { IconButton } from '../components/IconButton';
import { ButtonLink } from '../components/ButtonLink';
import { QuantityStepper } from '../components/QuantityStepper';
import { Price } from '../components/Price';
import { StoreImage } from '../components/Image';
import { Eyebrow } from '../components/Typography';
import { IconClose } from '../components/icons';
import { useCart } from '../../../state/cart';

export interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function CartDrawer(props: CartDrawerProps): ReactElement {
  const { open, onClose } = props;
  const cart = useCart();

  return (
    <Drawer open={open} onClose={onClose} side="end" label="Shopping bag">
      <header className="rge-cartdrawer__head">
        <Eyebrow>Your bag ({cart.totals.count})</Eyebrow>
        <IconButton label="Close bag" onClick={onClose}><IconClose /></IconButton>
      </header>

      {cart.lines.length === 0 ? (
        <div className="rge-cartdrawer__empty">
          <p className="rge-cartdrawer__empty-title">Your bag is empty</p>
          <p className="rge-cartdrawer__empty-text">Discover the edit — pieces made to glow.</p>
          <ButtonLink href="/collections/new-in" onClick={onClose}>Shop new in</ButtonLink>
        </div>
      ) : (
        <>
          <ul className="rge-cartdrawer__lines">
            {cart.lines.map((line) => (
              <li key={line.id} className="rge-cartdrawer__line">
                <span className="rge-cartdrawer__media">
                  <StoreImage src={line.image} alt="" aria-hidden />
                </span>
                <div className="rge-cartdrawer__info">
                  <a href={line.url} className="rge-cartdrawer__name" onClick={onClose}>{line.title}</a>
                  {line.attributes ? <span className="rge-cartdrawer__attrs">{line.attributes}</span> : null}
                  <div className="rge-cartdrawer__controls">
                    <QuantityStepper
                      value={line.quantity}
                      onChange={(q) => cart.updateQuantity(line.id, q)}
                      {...(line.maxQuantity ? { max: line.maxQuantity } : {})}
                      label={`Quantity for ${line.title}`}
                    />
                    <button type="button" className="rge-linkbtn rge-cartdrawer__remove" onClick={() => cart.remove(line.id)}>Remove</button>
                  </div>
                </div>
                <Price className="rge-cartdrawer__price" amount={line.price * line.quantity} currency={line.currency} />
              </li>
            ))}
          </ul>

          <footer className="rge-cartdrawer__foot">
            <div className="rge-cartdrawer__subtotal">
              <span>Subtotal</span>
              <Price amount={cart.totals.subtotal} currency={cart.totals.currency || 'USD'} />
            </div>
            <p className="rge-cartdrawer__note">Shipping &amp; taxes calculated at checkout.</p>
            <ButtonLink href="/checkout" size="lg" block onClick={onClose}>Checkout</ButtonLink>
            <ButtonLink href="/cart" variant="ghost" block onClick={onClose}>View bag</ButtonLink>
          </footer>
        </>
      )}
    </Drawer>
  );
}
