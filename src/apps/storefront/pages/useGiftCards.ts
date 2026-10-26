import { useCallback, useMemo, useState } from 'react';
import { checkGiftCard } from '../api/storefront';
import { useLocale } from '../i18n/useLocale';
import { MAX_GIFT_CARDS, normalizeGiftCardCode } from './checkout-gift-cards';

export interface AppliedGiftCard { code: string; last4: string }

/**
 * Gift card codes the shopper added at checkout. Each code is checked once (rate-limited, generic
 * error) before it joins the quote; codes live only in memory and in the order request.
 */
export function useGiftCards() {
  const { locale } = useLocale();
  const ar = locale === 'ar';
  const [cards, setCards] = useState<ReadonlyArray<AppliedGiftCard>>([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  const add = useCallback(async (): Promise<void> => {
    const code = normalizeGiftCardCode(input);
    if (!code || checking) return;
    if (cards.some((card) => card.code === code)) { setError(ar ? 'هذه البطاقة مضافة بالفعل.' : 'This gift card is already applied.'); return; }
    if (cards.length >= MAX_GIFT_CARDS) { setError(ar ? `يمكنك استخدام ${MAX_GIFT_CARDS} بطاقات هدايا كحد أقصى.` : `You can use up to ${MAX_GIFT_CARDS} gift cards.`); return; }
    setChecking(true); setError('');
    try {
      const { data } = await checkGiftCard(code);
      setCards((current) => current.some((card) => card.code === code) ? current : [...current, { code, last4: data.last4 }]);
      setInput('');
    } catch (requestError) {
      setError(requestError instanceof Error && requestError.message ? requestError.message : (ar ? 'تعذّر استخدام بطاقة الهدية.' : 'This gift card can’t be used.'));
    } finally {
      setChecking(false);
    }
  }, [ar, cards, checking, input]);

  const remove = useCallback((code: string): void => { setCards((current) => current.filter((card) => card.code !== code)); setError(''); }, []);
  const codes = useMemo(() => cards.map((card) => card.code), [cards]);

  return { cards, codes, input, setInput, add, remove, error, checking };
}

export type GiftCardsModel = ReturnType<typeof useGiftCards>;
