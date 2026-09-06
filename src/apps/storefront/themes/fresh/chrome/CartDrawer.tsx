/**
 * Fresh CartDrawer — slide-in basket: lines with big pill quantity steppers, free-delivery
 * progress, subtotal, checkout / view basket. Reads the shared client-side cart store.
 */
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Drawer } from '../../../foundation/components/Drawer';
import { formatMoney } from '../../../utils/format';
import { useCart } from '../../../state/cart';
import { useLocale } from '../../../i18n/useLocale';
import { frText } from './text';
import { IconBasket, IconMinus, IconPlus, IconTrash } from './icons';

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
    <Drawer open={open} onClose={onClose} title={t('cart.title')} className="fr-drawer">
      {lines.length === 0 ? (
        <div className="sf-overlay__body fr-cart__empty">
          <span className="fr-cart__empty-icon" aria-hidden><IconBasket width={40} height={40} /></span>
          <p className="fr-cart__empty-title">{t('cart.empty')}</p>
          <p className="fr-cart__empty-hint">{t('cart.emptyBrowseHint')}</p>
          <a href={`/shop${preview}`} className="lib-btn lib-btn--primary lib-btn--md" onClick={onClose}>{t('nav.allProducts')}</a>
        </div>
      ) : (
        <>
          <div className="sf-overlay__body fr-cart">
            {freeShippingThreshold ? (
              <div className="fr-cart__ship">
                <span>{remaining > 0 ? t('cart.freeShippingProgress', { amount: formatMoney(remaining, totals.currency, locale) }) : t('cart.freeShippingReached')}</span>
                <div className="fr-cart__track" aria-hidden><div className="fr-cart__fill" style={{ width: `${pct}%` }} /></div>
              </div>
            ) : null}
            <ul className="fr-cart__lines">
              {lines.map((line) => (
                <li key={line.id} className="fr-cart__line">
                  <a href={line.url} className="fr-cart__thumb" tabIndex={-1} aria-hidden>
                    {line.image ? <img src={line.image} alt="" loading="lazy" /> : <span className="fr-cart__thumb-fallback" />}
                  </a>
                  <div className="fr-cart__info">
                    <a href={line.url} className="fr-cart__title">{line.title}</a>
                    {line.attributes ? <span className="fr-cart__attrs">{line.attributes}</span> : null}
                    <span className="fr-cart__price">{formatMoney(line.price * line.quantity, line.currency, locale)}</span>
                    <div className="fr-cart__controls">
                      <div className="fr-qty" role="group" aria-label={frText(locale, 'quantity')}>
                        <button type="button" className="fr-qty__btn" aria-label={frText(locale, 'decrease')} onClick={() => updateQuantity(line.id, Math.max(1, line.quantity - 1))} disabled={line.quantity <= 1}><IconMinus /></button>
                        <span className="fr-qty__value" aria-live="polite">{line.quantity}</span>
                        <button type="button" className="fr-qty__btn" aria-label={frText(locale, 'increase')} onClick={() => updateQuantity(line.id, line.quantity + 1)}><IconPlus /></button>
                      </div>
                      <button type="button" className="fr-cart__remove" aria-label={t('common.remove')} onClick={() => remove(line.id)}><IconTrash /></button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="sf-overlay__footer fr-cart__foot">
            <div className="fr-cart__subtotal">
              <span>{frText(locale, 'basketTotal')}</span>
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
