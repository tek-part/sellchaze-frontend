import type { ReactElement } from 'react';
import type { CheckoutQuote } from '../api/storefront';
import { Button, Input } from '../foundation/components';
import { useLocale } from '../i18n/useLocale';
import { formatMoney } from '../utils/format';
import { giftCardLines, maskGiftCard, quoteAmountDue } from './checkout-gift-cards';
import type { GiftCardsModel } from './useGiftCards';

/** "Gift card" field next to the discount code: adds codes as masked chips with a remove button. */
export function GiftCardField({ model, disabled = false, className }: { model: GiftCardsModel; disabled?: boolean; className?: string }): ReactElement {
  const { locale } = useLocale();
  const ar = locale === 'ar';
  return <div className={className} data-gift-card-field>
    <div className="sf-co-discount sf-co-gift-card">
      <Input label={ar ? 'بطاقة هدية' : 'Gift card'} value={model.input} maxLength={40} autoComplete="off" spellCheck={false} disabled={disabled}
        error={model.error || undefined} onChange={(event) => model.setInput(event.target.value)}
        onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void model.add(); } }} />
      <Button type="button" variant="secondary" loading={model.checking} disabled={disabled || model.checking || !model.input.trim()} onClick={() => void model.add()}>{ar ? 'تطبيق' : 'Apply'}</Button>
    </div>
    {model.cards.length ? <ul className="sf-co-gift-card__chips" aria-label={ar ? 'بطاقات الهدايا المطبقة' : 'Applied gift cards'}>
      {model.cards.map((card) => <li key={card.code} className="sf-co-discount__applied" dir="ltr">
        <span>{maskGiftCard(card.last4)}</span>
        <button type="button" disabled={disabled} onClick={() => model.remove(card.code)} aria-label={ar ? `إزالة بطاقة الهدية ${maskGiftCard(card.last4)}` : `Remove gift card ${maskGiftCard(card.last4)}`}>×</button>
      </li>)}
    </ul> : null}
  </div>;
}

/** "Gift card •••• 1234 −X" lines, then what is left to pay. */
export function GiftCardLines({ quote, definition = false, className }: {
  quote: Pick<CheckoutQuote, 'gift_cards' | 'amount_due' | 'totals' | 'currency'>; definition?: boolean; className?: string;
}): ReactElement | null {
  const { locale } = useLocale();
  const ar = locale === 'ar';
  const lines = giftCardLines(quote);
  if (!lines.length) return null;
  const Label = definition ? 'dt' : 'span';
  const Value = definition ? 'dd' : 'span';
  return <>
    {lines.map((line) => <div key={line.key} className={className} data-gift-card-line>
      <Label>{ar ? 'بطاقة هدية' : 'Gift card'} <bdi dir="ltr">{maskGiftCard(line.last4)}</bdi></Label>
      <Value>−{formatMoney(line.amount, quote.currency, locale)}</Value>
    </div>)}
    <div className={className} data-amount-due>
      <Label>{ar ? 'المبلغ المستحق' : 'Amount due'}</Label>
      <Value>{formatMoney(quoteAmountDue(quote), quote.currency, locale)}</Value>
    </div>
  </>;
}
