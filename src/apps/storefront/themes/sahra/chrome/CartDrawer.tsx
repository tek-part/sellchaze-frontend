/**
 * Sahra CartDrawer — slide-in mini cart: lines with quantity steppers, free-shipping progress on a
 * thin gold track, subtotal, checkout / view cart. Reads the shared client-side cart store.
 */
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Drawer } from '../../../foundation/components/Drawer';
import { formatMoney } from '../../../utils/format';
import { useCart } from '../../../state/cart';
import { useLocale } from '../../../i18n/useLocale';
import { IconMinus, IconPlus, IconTrash } from './icons';

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
  const remaining = freeShippingThreshold ? Math.max(0, freeShippingThreshold - totals.subtotal) : 0;
  const pct = freeShippingThreshold ? Math.min(100, (totals.subtotal / freeShippingThreshold) * 100) : 0;
  const preview = typeof window !== 'undefined' && window.location.search.includes('preview=1') ? '?preview=1' : '';

  return (
    <Drawer open={open} onClose={onClose} title={t('cart.title')} className="sh-drawer">
      {lines.length === 0 ? (
        <div className="sf-overlay__body sh-cart__empty">
          <p className="sh-cart__empty-title">{t('cart.empty')}</p>
          <p className="sh-cart__empty-hint">{t('cart.emptyBrowseHint')}</p>
          <a href={`/shop${preview}`} className="lib-btn lib-btn--primary lib-btn--md" onClick={onClose}>{t('nav.allProducts')}</a>
        </div>
      ) : (
        <>
          <div className="sf-overlay__body sh-cart">
            {freeShippingThreshold ? (
              <div className="sh-cart__ship">
                <span>{remaining > 0 ? t('cart.freeShippingProgress', { amount: formatMoney(remaining, totals.currency, locale) }) : t('cart.freeShippingReached')}</span>
                <div className="sh-cart__track" aria-hidden><div className="sh-cart__fill" style={{ width: `${pct}%` }} /></div>
              </div>
            ) : null}
            <ul className="sh-cart__lines">
              {lines.map((line) => (
                <li key={line.id} className="sh-cart__line">
                  <a href={line.url} className="sh-cart__thumb" tabIndex={-1} aria-hidden>
                    {line.image ? <img src={line.image} alt="" loading="lazy" /> : <span className="sh-cart__thumb-fallback" />}
                  </a>
                  <div className="sh-cart__info">
                    <a href={line.url} className="sh-cart__title">{line.title}</a>
                    {line.attributes ? <span className="sh-cart__attrs">{line.attributes}</span> : null}
                    <span className="sh-cart__price">{formatMoney(line.price * line.quantity, line.currency, locale)}</span>
                    <div className="sh-cart__controls">
                      <div className="sh-qty" role="group" aria-label={t('product.quantity')}>
                        <button type="button" className="sh-qty__btn" aria-label={t('product.decreaseQuantity')} onClick={() => updateQuantity(line.id, Math.max(1, line.quantity - 1))} disabled={line.quantity <= 1}><IconMinus /></button>
                        <span className="sh-qty__value" aria-live="polite">{line.quantity}</span>
                        <button type="button" className="sh-qty__btn" aria-label={t('product.increaseQuantity')} onClick={() => updateQuantity(line.id, line.quantity + 1)}><IconPlus /></button>
                      </div>
                      <button type="button" className="sh-cart__remove" aria-label={t('common.remove')} onClick={() => remove(line.id)}><IconTrash /></button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="sf-overlay__footer sh-cart__foot">
            <div className="sh-cart__subtotal">
              <span>{t('cart.subtotal')}</span>
              <strong>{formatMoney(totals.subtotal, totals.currency, locale)}</strong>
            </div>
            <a href={`/checkout${preview}`} className="lib-btn lib-btn--primary lib-btn--lg lib-btn--block">{t('cart.checkout')}</a>
            <a href={`/cart${preview}`} className="lib-btn lib-btn--secondary lib-btn--md lib-btn--block" onClick={onClose}>{t('cart.viewBag')}</a>
          </div>
        </>
      )}
    </Drawer>
  );
}
