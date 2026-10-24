/**
 * Glow CartDrawer — "Your bag": free-shipping progress as a soft glow bar, lines with rounded
 * thumbnails, size/variant, 44px quantity steppers and remove, then subtotal + checkout. Reads the
 * shared client-side cart store.
 */
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Drawer } from '../../../foundation/components/Drawer';
import { densityImage } from '../../../foundation/media/responsive';
import { formatMoney } from '../../../utils/format';
import { useCart } from '../../../state/cart';
import { cartRequiresShipping, cartHasFreeShippingOffer } from '../../../utils/shipping';
import { cartLineLimit, quantityStep } from '../../../state/cart-quantity';
import { PersonalizationSummary } from '../../../foundation/components/PersonalizationSummary';
import { useLocale } from '../../../i18n/useLocale';
import { glText } from '../components/i18n';
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
  const title = (
    <span className="gl-bag__title">
      {glText(locale, 'bag')}
      {totals.count > 0 ? <span className="gl-bag__count">{totals.count}</span> : null}
    </span>
  );

  return (
    <Drawer open={open} onClose={onClose} title={title} ariaLabel={glText(locale, 'bag')} className="gl-drawer gl-drawer--bag">
      {lines.length === 0 ? (
        <div className="sf-overlay__body gl-bag__empty">
          <span className="gl-bag__empty-icon" aria-hidden><IconBag width={28} height={28} /></span>
          <p className="gl-bag__empty-title">{glText(locale, 'bagEmpty')}</p>
          <p className="gl-bag__empty-hint">{glText(locale, 'bagEmptyHint')}</p>
          <a href={`/shop${preview}`} className="lib-btn lib-btn--primary lib-btn--md" onClick={onClose}>{glText(locale, 'shopAll')}</a>
        </div>
      ) : (
        <>
          <div className="sf-overlay__body gl-bag">
            {(offerShipping || freeShippingThreshold !== undefined) && cartRequiresShipping(lines) ? (
              <div className="gl-bag__ship">
                <span>{offerShipping ? (locale === 'ar' ? 'شحن مجاني مع عرض الكمية المختار؛ يُؤكد عند الدفع' : 'Free shipping with the selected quantity offer; confirmed at checkout') : remaining > 0 ? t('cart.freeShippingProgress', { amount: formatMoney(remaining, totals.currency, locale) }) : t('cart.freeShippingReached')}</span>
                <div className="gl-bag__track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)} aria-label={t('cart.freeShippingReached')}>
                  <div className="gl-bag__fill" style={{ inlineSize: `${pct}%` }} />
                </div>
              </div>
            ) : null}
            <ul className="gl-bag__lines">
              {lines.map((line) => (
                <li key={line.id} className="gl-bag__line">
                  <a href={line.url} className="gl-bag__thumb" tabIndex={-1} aria-hidden>
                    {line.image ? <img {...densityImage(line.image, 88)} alt="" loading="lazy" decoding="async" width={88} height={110} /> : <span className="gl-bag__thumb-fallback">{line.title.charAt(0)}</span>}
                  </a>
                  <div className="gl-bag__info">
                    <div className="gl-bag__row">
                      <a href={line.url} className="gl-bag__name">{line.title}</a>
                      <span className="gl-bag__price">{formatMoney(line.price * line.quantity, line.currency, locale)}</span>
                    </div>
                    {line.attributes ? <span className="gl-bag__attrs">{line.attributes}</span> : null}
                    <PersonalizationSummary entries={line.personalizationEntries} />
                    <div className="gl-bag__controls">
                      <div className="gl-qty" role="group" aria-label={glText(locale, 'quantity')}>
                        <button type="button" className="gl-qty__btn" aria-label={glText(locale, 'decrease')} onClick={() => updateQuantity(line.id, Math.max(quantityStep(line), line.quantity - quantityStep(line)))} disabled={line.quantity <= quantityStep(line)}><IconMinus /></button>
                        <span className="gl-qty__value" aria-live="polite">{line.quantity}</span>
                        <button type="button" className="gl-qty__btn" aria-label={glText(locale, 'increase')} onClick={() => updateQuantity(line.id, line.quantity + quantityStep(line))} disabled={line.quantity >= cartLineLimit(lines, line)}><IconPlus /></button>
                      </div>
                      <button type="button" className="gl-bag__remove" aria-label={`${glText(locale, 'remove')}: ${line.title}`} onClick={() => remove(line.id)}><IconTrash /></button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="sf-overlay__footer gl-bag__foot">
            <div className="gl-bag__subtotal">
              <span>{glText(locale, 'subtotal')}</span>
              <strong>{formatMoney(totals.subtotal, totals.currency, locale)}</strong>
            </div>
            <p className="gl-bag__note">{glText(locale, 'taxesNote')}</p>
            <a href={`/checkout${preview}`} onClick={onClose} className="lib-btn lib-btn--primary lib-btn--lg lib-btn--block">{glText(locale, 'checkout')}</a>
            <a href={`/cart${preview}`} className="lib-btn lib-btn--secondary lib-btn--md lib-btn--block" onClick={onClose}>{glText(locale, 'viewBag')}</a>
          </div>
        </>
      )}
    </Drawer>
  );
}
