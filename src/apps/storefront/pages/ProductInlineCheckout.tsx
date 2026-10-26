import PaymentMethodLogo from '../../../shared/payments/PaymentMethodLogo';
import { PaymentAdjustmentLine } from './PaymentAdjustmentLine';
import { CheckoutDiscountLines } from './CheckoutDiscountLines';
import { GiftCardField, GiftCardLines } from './CheckoutGiftCards';
import { useGiftCards } from './useGiftCards';
import { giftCardsCoverTotal } from './checkout-gift-cards';
import { quoteHasFreeShippingDiscount } from './checkout-discounts';
import { useMemo, useState, type FormEvent, type ReactElement } from 'react';
import type { CheckoutItem } from '../api/storefront';
import { quoteCheckout } from '../api/storefront';
import { useAsync } from '../api/useAsync';
import { Button, Input, Spinner } from '../foundation/components';
import { useLocale } from '../i18n/useLocale';
import { useCheckoutPaymentFlow } from './useCheckoutPaymentFlow';
import { DepositNote, PaymentMethodDetail, useDepositPaymentMethods } from './CheckoutDeposit';
import { quoteConfirmation } from './checkout-deposit';
import { useQuoteContact } from './useQuoteContact';
import { CheckoutFieldsForm, useCheckoutFields } from './CheckoutFields';
import { CheckoutRecovery } from './CheckoutRecovery';
import { PersonalizationSummary } from '../foundation/components/PersonalizationSummary';
import { CheckoutMinimum } from './CheckoutMinimum';
import { minimumOrderAllows } from './minimum-order';
import { useCheckoutLead } from './useCheckoutLead';
import { useCheckoutMetrics } from '../analytics/checkout-hooks';
import { formatMoney } from '../utils/format';
import { taxLineLabel } from '../utils/shipping';

export default function ProductInlineCheckout({ productId, items, ready, buttonText, surface = 'product' }: { productId: string; items: ReadonlyArray<CheckoutItem>; ready: boolean; buttonText?: string; surface?: 'product' | 'storefront' }): ReactElement {
  const { locale } = useLocale(); const ar = locale === 'ar'; const text = (a: string, e: string): string => ar ? a : e;
  const stableItems = useMemo(() => items, [items]);
  const payment = useCheckoutPaymentFlow({ items: stableItems, preserveCart: true, surface });
  const contact = useCheckoutFields(payment.paymentMethod, [Number(productId)]);
  const [coupon, setCoupon] = useState(''); const [appliedCoupon, setAppliedCoupon] = useState('');
  const giftCards = useGiftCards();
  useCheckoutMetrics(ready ? stableItems : [], 'storefront', surface === 'product' ? 'product' : undefined);
  const lead = useCheckoutLead({ contact: { ...contact.payload(), coupon_code: appliedCoupon }, items: stableItems, source: 'storefront', kind: `product:${productId}`, paymentMethod: payment.paymentMethod, enabled: ready && contact.ready && !payment.busy && !payment.completed && !payment.unresolved && !payment.paymentRetry });
  const quoteContact = useQuoteContact(contact.payload());
  const quoteKey = JSON.stringify([items, appliedCoupon, giftCards.codes, contact.shippingSelection, contact.shippingReady, ready, payment.paymentMethod, payment.unresolved, quoteContact]);
  const quotes = useAsync(async () => !payment.unresolved && ready && items.length && contact.shippingReady ? { key: quoteKey, data: (await quoteCheckout(items, appliedCoupon, contact.shippingSelection, payment.paymentMethod, giftCards.codes, quoteContact)).data } : null, [quoteKey, locale]);
  const quote = payment.correctedQuote(quoteKey) ?? (!quotes.loading && !quotes.error && quotes.data?.key === quoteKey ? quotes.data.data : null);
  const paidByGiftCards = giftCardsCoverTotal(quote, giftCards.codes);
  const paymentMethods = useDepositPaymentMethods(payment, quote);
  const submit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    if (!payment.paymentRetry && (!ready || !quote || !minimumOrderAllows(quote) || !contact.shippingReady || !contact.phoneVerification.ready || !contact.botProtection.ready || contact.countryAllowed === false)) return;
    await payment.submit({ ...contact.payload(), coupon_code: appliedCoupon, lead_token: lead.submitToken(), ...(quote?.payment_adjustment_token ? { payment_adjustment_token: quote.payment_adjustment_token } : {}),
      ...(giftCards.codes.length ? { gift_cards: giftCards.codes } : {}), ...(paidByGiftCards ? { payment_method: undefined } : {}), ...quoteConfirmation(quote) }, quoteKey);
  };
  return <section className="sf-product-checkout" aria-label={text('الشراء من صفحة المنتج', 'Product checkout')}><h2>{text('أكمل طلبك', 'Complete your order')}</h2><CheckoutRecovery flow={payment} />
    <form onSubmit={(event) => void submit(event)}><fieldset disabled={payment.busy || payment.unresolved} className="sf-product-checkout__fields"><CheckoutFieldsForm model={contact} quote={quote ?? quotes.data?.data} />
      {paidByGiftCards ? <p role="status" data-paid-by-gift-cards>{text('بطاقات الهدايا تغطي إجمالي الطلب، لا حاجة لطريقة دفع.', 'Your gift cards cover the full total. No payment method is needed.')}</p> : <fieldset><legend>{text('طريقة الدفع', 'Payment method')}</legend><DepositNote quote={quote} />{paymentMethods.map((method) => <div key={method.slug}><label className="sf-product-checkout__payment"><input type="radio" name={`product-payment-${productId}`} checked={payment.paymentMethod === method.slug} onChange={() => payment.setPaymentMethod(method.slug)} required /><PaymentMethodLogo slug={method.slug} src={method.logo_url} />{method.slug === 'cod' && method.name === 'Cash on delivery' ? text('الدفع عند الاستلام', 'Cash on delivery') : method.slug === 'bank_transfer' && method.name === 'Bank transfer' ? text('تحويل بنكي', 'Bank transfer') : method.name}{method.test_mode ? text(' (تجريبي)', ' (Test)') : ''}</label>{payment.paymentMethod === method.slug ? <PaymentMethodDetail method={method} className="sf-product-checkout__payment-detail" /> : null}</div>)}</fieldset>}
      <div className="sf-product-checkout__coupon"><Input label={text('كود الخصم', 'Coupon code')} value={coupon} maxLength={100} onChange={(event) => setCoupon(event.target.value)} /><Button type="button" variant="secondary" disabled={!ready || quotes.loading} onClick={() => { setAppliedCoupon(coupon.trim()); quotes.reload(); }}>{text('تطبيق', 'Apply')}</Button>{appliedCoupon ? <Button type="button" variant="ghost" onClick={() => { setAppliedCoupon(''); setCoupon(''); }}>{text('إزالة', 'Remove')}</Button> : null}</div>
      <GiftCardField model={giftCards} />
    </fieldset>
    {!ready ? <p role="status">{text('اختر الصنف وأكمل بيانات تخصيص المنتج.', 'Choose an available option and complete product personalization.')}</p> : null}
    {quotes.loading ? <Spinner label={text('جارٍ حساب الإجمالي…', 'Calculating total…')} /> : null}
    {quotes.error ? <div role="alert"><p>{quotes.error.message}</p><Button type="button" variant="secondary" onClick={quotes.reload}>{text('إعادة المحاولة', 'Try again')}</Button></div> : null}
    {quote ? <div className="sf-product-checkout__selection">{quote.items.map((line) => <div key={`${line.product_id}:${line.variant_id}:${line.personalization_key ?? ''}:${line.quantity_offer?.id ?? ''}`}><p>{line.name} × {line.quantity} <strong>{formatMoney(Number(line.line_total), quote.currency, locale)}</strong></p><PersonalizationSummary entries={line.personalization} /></div>)}</div> : null}
    {quote ? <dl className="sf-product-checkout__totals"><div><dt>{text('المنتجات', 'Products')}</dt><dd>{formatMoney(Number(quote.totals.subtotal), quote.currency, locale)}</dd></div><CheckoutDiscountLines quote={quote} fallbackLabel={text('الخصم', 'Discount')} definition />{quote.requires_shipping ? <div><dt>{text('الشحن', 'Shipping')}</dt><dd>{Number(quote.totals.shipping_total) === 0 && quoteHasFreeShippingDiscount(quote) ? text('مجاني', 'Free') : formatMoney(Number(quote.totals.shipping_total), quote.currency, locale)}</dd></div> : null}{Number(quote.totals.tax_total) > 0 ? <div data-tax-line><dt>{taxLineLabel(quote.tax, locale)}</dt><dd>{formatMoney(Number(quote.totals.tax_total), quote.currency, locale)}</dd></div> : null}<PaymentAdjustmentLine amount={quote.totals.payment_adjustment_total} currency={quote.currency} definition /><div><dt>{text('الإجمالي', 'Total')}</dt><dd>{formatMoney(Number(quote.totals.grand_total), quote.currency, locale)}</dd></div><GiftCardLines quote={quote} definition /></dl> : null}
    {payment.error && !payment.unresolved ? <p role="alert">{payment.error}</p> : null}
    {!payment.paymentRetry && !payment.unresolved ? <CheckoutMinimum quote={quote} /> : null}
    {!payment.unresolved ? <Button type="submit" block loading={payment.busy} disabled={(!payment.paymentMethod && !paidByGiftCards) || !quote || !contact.shippingReady || (!payment.paymentRetry && (!ready || !minimumOrderAllows(quote) || !contact.phoneVerification.ready || !contact.botProtection.ready || contact.countryAllowed === false))}>{buttonText || text('تأكيد الطلب', 'Place order')}</Button> : null}
    </form></section>;
}
