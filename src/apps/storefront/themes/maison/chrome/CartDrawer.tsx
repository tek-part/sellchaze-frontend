/**
 * Maison CartDrawer — "your basket": lines with soft thumbnails and quantity steppers, a gentle
 * free-delivery progress line, subtotal and checkout / view basket. Reads the shared cart store.
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
import { LibImage } from '../../../sections-lib';
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
    <Drawer open={open} onClose={onClose} title={t('cart.title')} className="mai-drawer mai-drawer--cart">
      {lines.length === 0 ? (
        <div className="sf-overlay__body mai-cart__empty">
          <span className="mai-cart__empty-art" aria-hidden><IconBag width={34} height={34} /></span>
          <p className="mai-cart__empty-title">{t('cart.empty')}</p>
          <p className="mai-cart__empty-hint">{t('cart.emptyBrowseHint')}</p>
          <a href={`/shop${preview}`} className="lib-btn lib-btn--primary lib-btn--md" onClick={onClose}>{t('nav.allProducts')}</a>
        </div>
      ) : (
        <>
          <div className="sf-overlay__body mai-cart">
            {(offerShipping || freeShippingThreshold !== undefined) && cartRequiresShipping(lines) ? (
              <div className="mai-cart__ship">
                <p className="mai-cart__ship-text">
                  {offerShipping
                    ? (locale === 'ar' ? 'شحن مجاني مع عرض الكمية المختار؛ يتأكد عند الدفع' : 'Free shipping with the selected quantity offer; confirmed at checkout')
                    : remaining > 0
                      ? t('cart.freeShippingProgress', { amount: formatMoney(remaining, totals.currency, locale) })
                      : t('cart.freeShippingReached')}
                </p>
                <div className="mai-cart__track" aria-hidden><div className="mai-cart__fill" style={{ inlineSize: `${pct}%` }} /></div>
              </div>
            ) : null}
            <ul className="mai-cart__lines">
              {lines.map((line) => (
                <li key={line.id} className="mai-cart__line">
                  <a href={line.url} className="mai-cart__thumb" tabIndex={-1} aria-hidden>
                    <LibImage src={line.image} alt="" sizes="88px" className="mai-cart__img" monogram={line.title.charAt(0)} />
                  </a>
                  <div className="mai-cart__info">
                    <div className="mai-cart__top">
                      <a href={line.url} className="mai-cart__title">{line.title}</a>
                      <button type="button" className="mai-cart__remove" aria-label={`${t('common.remove')}: ${line.title}`} onClick={() => remove(line.id)}><IconTrash /></button>
                    </div>
                    {line.attributes ? <span className="mai-cart__attrs">{line.attributes}</span> : null}
                    <PersonalizationSummary entries={line.personalizationEntries} />
                    <div className="mai-cart__controls">
                      <div className="mai-qty" role="group" aria-label={t('product.quantity')}>
                        <button type="button" className="mai-qty__btn" aria-label={t('product.decreaseQuantity')} onClick={() => updateQuantity(line.id, Math.max(quantityStep(line), line.quantity - quantityStep(line)))} disabled={line.quantity <= quantityStep(line)}><IconMinus /></button>
                        <span className="mai-qty__value" aria-live="polite">{line.quantity}</span>
                        <button type="button" className="mai-qty__btn" aria-label={t('product.increaseQuantity')} onClick={() => updateQuantity(line.id, line.quantity + quantityStep(line))} disabled={line.quantity >= cartLineLimit(lines, line)}><IconPlus /></button>
                      </div>
                      <span className="mai-cart__price">{formatMoney(line.price * line.quantity, line.currency, locale)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="sf-overlay__footer mai-cart__foot">
            <div className="mai-cart__subtotal">
              <span>{t('cart.subtotal')}</span>
              <strong>{formatMoney(totals.subtotal, totals.currency, locale)}</strong>
            </div>
            <a href={`/checkout${preview}`} onClick={onClose} className="lib-btn lib-btn--primary lib-btn--lg lib-btn--block">{t('cart.checkout')}</a>
            <a href={`/cart${preview}`} className="lib-btn lib-btn--secondary lib-btn--md lib-btn--block" onClick={onClose}>{t('cart.viewBag')}</a>
          </div>
        </>
      )}
    </Drawer>
  );
}
