/**
 * Stride CartDrawer — slide-in bag: a free-shipping "track" in the accent, square thumbnails,
 * quantity steppers, subtotal and checkout / view bag. Reads the shared client-side cart store.
 */
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Drawer } from '../../../foundation/components/Drawer';
import { formatMoney } from '../../../utils/format';
import { useCart } from '../../../state/cart';
import { cartRequiresShipping, cartHasFreeShippingOffer } from '../../../utils/shipping';
import { cartLineLimit, quantityStep } from '../../../state/cart-quantity';
import { PersonalizationSummary } from '../../../foundation/components/PersonalizationSummary';
import { useLocale } from '../../../i18n/useLocale';
import { stText } from '../components/i18n';
import { IconBag, IconMinus, IconPlus, IconTrash } from './icons';

export interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  freeShippingThreshold?: number;
}

export function CartDrawer(props: CartDrawerProps): ReactElement {
  const { open, onClose, freeShippingThreshold } = props;
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { lines, totals, updateQuantity, remove } = useCart();
  const offerShipping = cartHasFreeShippingOffer(lines);
  const remaining = offerShipping ? 0 : freeShippingThreshold !== undefined ? Math.max(0, Math.round((freeShippingThreshold - totals.subtotal) * 100) / 100) : 0;
  const pct = offerShipping ? 100 : freeShippingThreshold !== undefined ? (freeShippingThreshold > 0 ? Math.min(100, (totals.subtotal / freeShippingThreshold) * 100) : 100) : 0;
  const preview = typeof window !== 'undefined' && window.location.search.includes('preview=1') ? '?preview=1' : '';

  return (
    <Drawer open={open} onClose={onClose} title={`${t('cart.title')}${totals.count > 0 ? ` (${totals.count})` : ''}`} className="st-drawer st-drawer--cart">
      {lines.length === 0 ? (
        <div className="sf-overlay__body st-cart__empty">
          <span className="st-cart__empty-icon" aria-hidden><IconBag width={34} height={34} /></span>
          <p className="st-cart__empty-title">{t('cart.empty')}</p>
          <p className="st-cart__empty-hint">{t('cart.emptyBrowseHint')}</p>
          <a href={`/shop${preview}`} className="st-btn st-btn--accent" onClick={onClose}>{t('nav.allProducts')}</a>
        </div>
      ) : (
        <>
          <div className="sf-overlay__body st-cart">
            {(offerShipping || freeShippingThreshold !== undefined) && cartRequiresShipping(lines) ? (
              <div className="st-cart__ship">
                <span>{offerShipping ? stText(locale, 'freeShipping') : remaining > 0 ? t('cart.freeShippingProgress', { amount: formatMoney(remaining, totals.currency, locale) }) : t('cart.freeShippingReached')}</span>
                <div className="st-cart__track" aria-hidden><div className="st-cart__fill" style={{ width: `${pct}%` }} /></div>
              </div>
            ) : null}
            <ul className="st-cart__lines">
              {lines.map((line) => (
                <li key={line.id} className="st-cart__line">
                  <a href={line.url} className="st-cart__thumb" tabIndex={-1} aria-hidden>
                    {line.image ? <img src={line.image} alt="" loading="lazy" decoding="async" width={88} height={88} /> : <span className="st-cart__thumb-fallback" />}
                  </a>
                  <div className="st-cart__info">
                    <a href={line.url} className="st-cart__title">{line.title}</a>
                    {line.attributes ? <span className="st-cart__attrs">{line.attributes}</span> : null}
                    <PersonalizationSummary entries={line.personalizationEntries} />
                    <div className="st-cart__controls">
                      <div className="st-qty" role="group" aria-label={t('product.quantity')}>
                        <button type="button" className="st-qty__btn" aria-label={t('product.decreaseQuantity')} onClick={() => updateQuantity(line.id, Math.max(quantityStep(line), line.quantity - quantityStep(line)))} disabled={line.quantity <= quantityStep(line)}><IconMinus /></button>
                        <span className="st-qty__value" aria-live="polite">{line.quantity}</span>
                        <button type="button" className="st-qty__btn" aria-label={t('product.increaseQuantity')} onClick={() => updateQuantity(line.id, line.quantity + quantityStep(line))} disabled={line.quantity >= cartLineLimit(lines, line)}><IconPlus /></button>
                      </div>
                      <span className="st-cart__price">{formatMoney(line.price * line.quantity, line.currency, locale)}</span>
                    </div>
                  </div>
                  <button type="button" className="st-cart__remove" aria-label={`${t('common.remove')}: ${line.title}`} onClick={() => remove(line.id)}><IconTrash /></button>
                </li>
              ))}
            </ul>
          </div>
          <div className="sf-overlay__footer st-cart__foot">
            <div className="st-cart__subtotal">
              <span>{t('cart.subtotal')}</span>
              <strong>{formatMoney(totals.subtotal, totals.currency, locale)}</strong>
            </div>
            <a href={`/checkout${preview}`} onClick={onClose} className="st-btn st-btn--accent st-btn--lg st-btn--block">{t('cart.checkout')}<span className="st-btn__arrow" aria-hidden>→</span></a>
            <a href={`/cart${preview}`} className="st-btn st-btn--outline st-btn--block" onClick={onClose}>{t('cart.viewBag')}</a>
          </div>
        </>
      )}
    </Drawer>
  );
}
