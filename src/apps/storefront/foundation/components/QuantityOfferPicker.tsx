import { useId, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import type { QuantityOffer } from '../../types/quantity-offers';
import { formatMoney } from '../../utils/format';
import { useLocale } from '../../i18n/useLocale';
import './quantity-offers.css';

export function QuantityOfferPicker({ offers, selectedId, basePrice, currency, remaining, disabled, onChange }: {
  offers: ReadonlyArray<QuantityOffer>; selectedId: string | null; basePrice: number; currency: string;
  remaining: number; disabled?: boolean; onChange: (offer: QuantityOffer | undefined) => void;
}): ReactElement | null {
  const { i18n } = useTranslation(); const { locale } = useLocale(); const id = useId();
  const ar = i18n.language.startsWith('ar'); const text = (a: string, e: string): string => ar ? a : e;
  const unitAmount = (amount: number): string => new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-GB', { maximumFractionDigits: 2 }).format(amount);
  if (!offers.length) return null;
  const regular: QuantityOffer = { id: '', quantity: 1, unitPrice: basePrice, version: 0, freeShipping: false, title: '', subtitle: '' };
  const choices = offers.some((offer) => offer.quantity === 1 && offer.unitPrice <= basePrice && offer.quantity <= remaining) ? offers : [regular, ...offers];
  return <fieldset className="sf-quantity-offers"><legend><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Zm0 9 8-4.5M12 12 4 7.5M12 12v9M8 5.3l8 4.4" /></svg><span>{text('اختر العرض', 'Choose offer')}</span></legend><div className="sf-quantity-offers__list">{choices.map((offer) => {
    const unavailable = disabled || offer.quantity > remaining || offer.unitPrice > basePrice;
    const saved = Math.max(0, Math.round((basePrice - offer.unitPrice) * offer.quantity * 100) / 100);
    const chosen = (selectedId ?? '') === offer.id;
    return <label key={offer.id} className={`sf-quantity-offer${chosen ? ' is-selected' : ''}${unavailable ? ' is-unavailable' : ''}`}>
      <input type="radio" name={`${id}-offer`} value={offer.id} checked={chosen} disabled={unavailable} onChange={() => onChange(offer.id ? offer : undefined)} />
      <span className="sf-quantity-offer__mark" aria-hidden="true">{chosen ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 12 4 4 8-8" /></svg> : null}</span>
      <span className="sf-quantity-offer__body"><strong>{offer.title || text(`اشترِ ${offer.quantity} قطعة بسعر ${unitAmount(offer.unitPrice)} للقطعة`, `Buy ${offer.quantity} ${offer.quantity === 1 ? 'piece' : 'pieces'} for ${unitAmount(offer.unitPrice)} each`)}</strong>
        {offer.subtitle ? <small>{offer.subtitle}</small> : offer.freeShipping ? <small>{text('اشترِ الآن واحصل على شحن مجاني', 'Buy now and get free shipping')}</small> : null}
        {saved > 0 ? <span className="sf-quantity-offer__saving">{text('وفّر', 'Save')} {formatMoney(saved, currency, locale)}</span> : null}
        {unavailable ? <small>{text('هذا العرض غير متاح للكمية أو الاختيار الحالي', 'Unavailable for the current stock or product option')}</small> : null}
      </span>
      {offer.unitPrice < basePrice ? <span className="sf-quantity-offer__prices"><span><small>{text('سعر القطعة', 'Piece price')}</small><b>{formatMoney(offer.unitPrice, currency, locale)}</b></span><span><small>{text('السعر الأساسي', 'Base price')}</small><del>{formatMoney(basePrice, currency, locale)}</del></span></span> : null}
    </label>;
  })}</div></fieldset>;
}
