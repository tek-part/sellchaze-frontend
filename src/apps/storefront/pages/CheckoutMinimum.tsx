import type { ReactElement } from 'react';
import type { CheckoutQuote } from '../api/storefront';
import { useLocale } from '../i18n/useLocale';
import { minimumOrderMessage } from './minimum-order';

export function CheckoutMinimum({ quote }: { quote: CheckoutQuote | null }): ReactElement | null {
  const { locale } = useLocale();
  const message = minimumOrderMessage(quote, locale);
  return message ? <p role="status" className="sf-field__error" style={{ marginBlock: '1rem', lineHeight: 1.8 }}>{message}</p> : null;
}
