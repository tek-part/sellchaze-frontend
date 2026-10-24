/**
 * Karat CartDrawer — "your bag": lines with a portrait thumbnail, attributes (size, metal…),
 * hairline quantity steppers, the free-shipping progress when the store offers it, subtotal and
 * checkout. Reads the shared client-side cart store.
 */
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Drawer } from '../../../foundation/components/Drawer';
import { PersonalizationSummary } from '../../../foundation/components/PersonalizationSummary';
import { formatMoney } from '../../../utils/format';
import { useCart } from '../../../state/cart';
import { cartRequiresShipping, cartHasFreeShippingOffer } from '../../../utils/shipping';
import { cartLineLimit, quantityStep } from '../../../state/cart-quantity';
import { useLocale } from '../../../i18n/useLocale';
import { LibImage } from '../../../sections-lib';
import { krText } from '../components/i18n';
import { IconMinus, IconPlus } from './icons';

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
    <Drawer open={open} onClose={onClose} title={krText(locale, 'bagTitle')} className="kr-drawer kr-drawer--bag">
      {lines.length === 0 ? (
        <div className="sf-overlay__body kr-bag__empty">
          <span className="kr-bag__empty-mark" aria-hidden />
          <p className="kr-bag__empty-title">{krText(locale, 'emptyBag')}</p>
          <p className="kr-bag__empty-hint">{krText(locale, 'emptyBagHint')}</p>
          <a href={`/shop${preview}`} className="kr-btn kr-btn--primary" onClick={onClose}>{krText(locale, 'explore')}</a>
        </div>
      ) : (
        <>
          <div className="sf-overlay__body kr-bag">
            {(offerShipping || freeShippingThreshold !== undefined) && cartRequiresShipping(lines) ? (
              <div className="kr-bag__ship">
                <span>{offerShipping ? (locale === 'ar' ? 'شحن مجاني مع عرض الكمية المختار؛ يُؤكَّد عند الدفع' : 'Free shipping with the selected quantity offer; confirmed at checkout') : remaining > 0 ? t('cart.freeShippingProgress', { amount: formatMoney(remaining, totals.currency, locale) }) : t('cart.freeShippingReached')}</span>
                <div className="kr-bag__track" aria-hidden><div className="kr-bag__fill" style={{ inlineSize: `${pct}%` }} /></div>
              </div>
            ) : null}
            <ul className="kr-bag__lines">
              {lines.map((line) => (
                <li key={line.id} className="kr-bag__line">
                  <a href={line.url} className="kr-bag__thumb" tabIndex={-1} aria-hidden>
                    <LibImage src={line.image} alt="" sizes="88px" monogram={line.title.charAt(0)} />
                  </a>
                  <div className="kr-bag__info">
                    <a href={line.url} className="kr-bag__title">{line.title}</a>
                    {line.attributes ? <span className="kr-bag__attrs">{line.attributes}</span> : null}
                    <PersonalizationSummary entries={line.personalizationEntries} />
                    <span className="kr-bag__price">{formatMoney(line.price * line.quantity, line.currency, locale)}</span>
                    <div className="kr-bag__controls">
                      <div className="kr-qty" role="group" aria-label={t('product.quantity')}>
                        <button type="button" className="kr-qty__btn" aria-label={t('product.decreaseQuantity')} onClick={() => updateQuantity(line.id, Math.max(quantityStep(line), line.quantity - quantityStep(line)))} disabled={line.quantity <= quantityStep(line)}><IconMinus /></button>
                        <span className="kr-qty__value" aria-live="polite">{line.quantity}</span>
                        <button type="button" className="kr-qty__btn" aria-label={t('product.increaseQuantity')} onClick={() => updateQuantity(line.id, line.quantity + quantityStep(line))} disabled={line.quantity >= cartLineLimit(lines, line)}><IconPlus /></button>
                      </div>
                      <button type="button" className="kr-bag__remove" onClick={() => remove(line.id)}>{t('common.remove')}</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="sf-overlay__footer kr-bag__foot">
            <div className="kr-bag__subtotal">
              <span>{t('cart.subtotal')}</span>
              <strong>{formatMoney(totals.subtotal, totals.currency, locale)}</strong>
            </div>
            <a href={`/checkout${preview}`} onClick={onClose} className="kr-btn kr-btn--primary kr-btn--block">{t('cart.checkout')}</a>
            <a href={`/cart${preview}`} className="kr-btn kr-btn--outline kr-btn--block" onClick={onClose}>{t('cart.viewBag')}</a>
          </div>
        </>
      )}
    </Drawer>
  );
}
