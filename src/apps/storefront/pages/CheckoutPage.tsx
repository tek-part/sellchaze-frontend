import PaymentMethodLogo from '../../../shared/payments/PaymentMethodLogo';
import { PaymentAdjustmentLine } from './PaymentAdjustmentLine';
import { CheckoutDiscountLines } from './CheckoutDiscountLines';
import { GiftCardField, GiftCardLines } from './CheckoutGiftCards';
import { useGiftCards, type GiftCardsModel } from './useGiftCards';
import { giftCardsCoverTotal, quoteAmountDue } from './checkout-gift-cards';
import { UiBlock } from '../ui-blocks/UiBlocks';
import { useEffect, useMemo, useState, type FormEvent, type ReactElement } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, ButtonLink, Container, Input, Section, Spinner } from '../foundation/components';
import './checkout/checkout.css';
import { useCart } from '../state/cart';
import { useStore } from '../state/store-context';
import { getThankYouPage, quoteCheckout } from '../api/storefront';
import { useAsync } from '../api/useAsync';
import { useLocale } from '../i18n/useLocale';
import { formatMoney } from '../utils/format';
import { taxLineLabel } from '../utils/shipping';
import { ThemeRenderer, useTemplate } from '../theme-engine';
import { flowContext } from './flow-context';
import { useCheckoutPaymentFlow } from './useCheckoutPaymentFlow';
import { CheckoutRecovery } from './CheckoutRecovery';
import { clearCheckoutAttempt, readCheckoutAttempt } from './checkout-attempt';
import { CheckoutFieldsForm, useCheckoutFields } from './CheckoutFields';
import { PersonalizationSummary } from '../foundation/components/PersonalizationSummary';
import { OrderReceiptPanel } from './OrderReceiptPanel';
import { CheckoutMinimum } from './CheckoutMinimum';
import { minimumOrderAllows } from './minimum-order';
import { ThankYouContent, ThankYouProducts } from './ThankYouContent';
import { currentThankYou } from './thank-you';
import { useCheckoutLead } from './useCheckoutLead';
import { checkoutCartItems } from './checkout-cart-items';
import { useCheckoutMetrics } from '../analytics/checkout-hooks';
import { chosenOfferCoupon, clearOfferCoupon } from '../downsell/offer-session';
import ProductDirectCheckout from './ProductDirectCheckout';

export function CheckoutPage(): ReactElement {
  const [search] = useSearchParams(); const id = search.get('product');
  return id && /^[1-9]\d*$/.test(id) && Number.isSafeInteger(Number(id)) ? <ProductDirectCheckout productId={Number(id)} /> : <BasketCheckout />;
}

type Quote = Awaited<ReturnType<typeof quoteCheckout>>['data'];

function LockIcon(): ReactElement {
  return <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden focusable="false"><path fill="currentColor" d="M10 2a4 4 0 0 0-4 4v2H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1h-1V6a4 4 0 0 0-4-4Zm-2 6V6a2 2 0 1 1 4 0v2H8Z" /></svg>;
}

/** Order summary column (and the mobile drop-down): lines with thumbnails, discount code, totals. */
function OrderSummary({ quote, quoteQ, coupon, setCoupon, appliedCoupon, applyCoupon, removeCoupon, giftCards, disabled, reloadAll }: {
  quote: Quote | null; quoteQ: { loading: boolean; error: Error | null }; coupon: string; setCoupon: (value: string) => void; appliedCoupon: string;
  applyCoupon: () => void; removeCoupon: () => void; giftCards: GiftCardsModel; disabled: boolean; reloadAll: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const ar = locale === 'ar';
  const cart = useCart();
  const { store } = useStore();
  const images = useMemo(() => new Map(cart.lines.map((line) => [`${line.productId}:${line.variantId ?? ''}`, line])), [cart.lines]);
  const money = (value: string | number): string => formatMoney(Number(value), quote?.currency || cart.totals.currency || store.currency, locale);
  const lines = quote ? quote.items.map((line) => {
    const local = images.get(`${line.product_id}:${line.variant_id ?? ''}`);
    return { key: `${line.product_id}:${line.variant_id}:${line.personalization_key ?? ''}:${line.quantity_offer?.id ?? ''}`, name: line.name, quantity: line.quantity, image: local?.image, meta: local?.attributes, total: money(line.line_total), personalization: line.personalization };
  }) : cart.lines.map((line) => ({ key: line.id, name: line.title, quantity: line.quantity, image: line.image, meta: line.attributes, total: money(line.price * line.quantity), personalization: line.personalizationEntries }));

  return <>
    <ul className="sf-co-lines" aria-label={ar ? 'منتجات الطلب' : 'Order items'}>
      {lines.map((line) => <li key={line.key}>
        <div className="sf-co-line">
          <span className="sf-co-thumb">{line.image ? <img src={line.image} alt="" loading="lazy" /> : null}<span className="sf-co-thumb__qty" aria-label={ar ? `الكمية ${line.quantity}` : `Quantity ${line.quantity}`}>{line.quantity}</span></span>
          <span><span className="sf-co-line__name">{line.name}</span>{line.meta ? <span className="sf-co-line__meta">{line.meta}</span> : null}</span>
          <span className="sf-co-line__price">{line.total}</span>
        </div>
        <PersonalizationSummary entries={line.personalization} />
      </li>)}
    </ul>
    {quote?.offer_free_shipping ? <p className="sf-co-free">{ar ? 'العرض يشمل شحن الطلب مجانًا.' : 'Your selected offer includes free shipping for this order.'}</p> : null}
    <fieldset disabled={disabled} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
      <div className="sf-co-discount">
        <Input label={t('checkout.couponCode')} value={coupon} maxLength={100} onChange={(event) => setCoupon(event.target.value)}
          onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); applyCoupon(); } }} />
        <Button type="button" variant="secondary" disabled={quoteQ.loading || !coupon.trim()} onClick={applyCoupon}>{t('checkout.apply')}</Button>
      </div>
      {appliedCoupon ? <span className="sf-co-discount__applied">{appliedCoupon}<button type="button" onClick={removeCoupon} aria-label={ar ? 'إزالة الخصم' : 'Remove coupon'}>×</button></span> : null}
      <GiftCardField model={giftCards} disabled={disabled} />
    </fieldset>
    <div className="sf-co-totals" aria-live="polite">
      {quoteQ.loading ? <Spinner label={ar ? 'جارٍ حساب الإجمالي…' : 'Calculating total…'} /> : null}
      {quoteQ.error ? <div className="sf-co-alert" role="alert"><p>{quoteQ.error.message}</p><Button type="button" variant="secondary" onClick={reloadAll}>{ar ? 'إعادة الحساب' : 'Recalculate'}</Button></div> : null}
      {quote ? <>
        <div className="sf-co-row"><span>{ar ? 'المجموع الفرعي' : 'Subtotal'}</span><span>{money(quote.totals.subtotal)}</span></div>
        <CheckoutDiscountLines quote={quote} fallbackLabel={t('checkout.discount')} className="sf-co-row" />
        {quote.requires_shipping ? <div className="sf-co-row"><span>{t('checkout.shipping')}</span><span>{Number(quote.totals.shipping_total) > 0 ? money(quote.totals.shipping_total) : (ar ? 'مجاني' : 'Free')}</span></div> : null}
        {Number(quote.totals.tax_total) > 0 ? <div className="sf-co-row" data-tax-line><span>{taxLineLabel(quote.tax, locale)}</span><span>{money(quote.totals.tax_total)}</span></div> : null}
        <PaymentAdjustmentLine amount={quote.totals.payment_adjustment_total} currency={quote.currency} />
        <div className="sf-co-total"><span>{t('checkout.total')}</span><span className="sf-co-total__value"><span className="sf-co-total__currency">{quote.currency}</span>{money(quote.totals.grand_total)}</span></div>
        <GiftCardLines quote={quote} className="sf-co-row" />
      </> : !quoteQ.loading && !quoteQ.error ? <>
        <div className="sf-co-row"><span>{ar ? 'المجموع الفرعي' : 'Subtotal'}</span><span>{money(cart.totals.subtotal)}</span></div>
        <p className="sf-co-note">{ar ? 'يُحسب الشحن والإجمالي النهائي بعد إدخال عنوان التوصيل.' : 'Shipping and the final total are calculated once you enter your delivery details.'}</p>
      </> : null}
    </div>
  </>;
}

function BasketCheckout(): ReactElement {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const ar = locale === 'ar';
  const cart = useCart();
  const { store } = useStore();
  const [coupon, setCoupon] = useState(() => chosenOfferCoupon(store));
  const [appliedCoupon, setAppliedCoupon] = useState(() => chosenOfferCoupon(store));
  const [summaryOpen, setSummaryOpen] = useState(false);
  const giftCards = useGiftCards();
  const checkout = useCheckoutPaymentFlow();
  const tpl = useTemplate('checkout');
  const items = useMemo(() => checkoutCartItems(cart.lines), [cart.lines]);
  useCheckoutMetrics(items, 'storefront');
  const contact = useCheckoutFields(checkout.paymentMethod, items.map((item) => item.product_id));
  const lead = useCheckoutLead({ contact: { ...contact.payload(), coupon_code: appliedCoupon }, items, source: 'storefront', kind: 'cart', paymentMethod: checkout.paymentMethod, enabled: contact.ready && !checkout.busy && !checkout.completed && !checkout.unresolved && !checkout.paymentRetry });
  const quoteKey = JSON.stringify([items, appliedCoupon, giftCards.codes, contact.shippingSelection, contact.shippingReady, checkout.paymentMethod, checkout.unresolved]);
  const quoteQ = useAsync(async () => !checkout.unresolved && items.length && contact.shippingReady ? { key: quoteKey, data: (await quoteCheckout(items, appliedCoupon, contact.shippingSelection, checkout.paymentMethod, giftCards.codes)).data } : null, [quoteKey, locale]);
  const quote = !quoteQ.loading && !quoteQ.error && quoteQ.data?.key === quoteKey ? quoteQ.data.data : null;
  // Gift cards that pay everything leave nothing for a payment method to collect.
  const paidByGiftCards = giftCardsCoverTotal(quote, giftCards.codes);
  const placeOrder = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    if (!checkout.paymentRetry && (!minimumOrderAllows(quote) || !contact.shippingReady || !contact.phoneVerification.ready || !contact.botProtection.ready)) return;
    await checkout.submit({ ...contact.payload(), coupon_code: appliedCoupon, lead_token: lead.submitToken(), ...(quote?.payment_adjustment_token ? { payment_adjustment_token: quote.payment_adjustment_token } : {}),
      ...(giftCards.codes.length ? { gift_cards: giftCards.codes } : {}), ...(paidByGiftCards ? { payment_method: undefined } : {}) });
  };
  if (!cart.lines.length && !checkout.completed && !checkout.busy && !checkout.unresolved) return <Navigate to="/cart" replace />;
  // A rate that stopped fitting the cart (coupon, quantity) is dropped so the cheapest eligible one applies.
  const reloadAll = (): void => { contact.resetRate(); contact.query.reload(); quoteQ.reload(); };
  const summary = <OrderSummary quote={quote} quoteQ={quoteQ} coupon={coupon} setCoupon={setCoupon} appliedCoupon={appliedCoupon} disabled={checkout.busy || checkout.unresolved}
    applyCoupon={() => { setAppliedCoupon(coupon.trim()); quoteQ.reload(); }} removeCoupon={() => { clearOfferCoupon(store); setAppliedCoupon(''); setCoupon(''); }} giftCards={giftCards} reloadAll={reloadAll} />;
  const totalText = quote ? formatMoney(Number(quote.totals.grand_total), quote.currency, locale) : formatMoney(cart.totals.subtotal, cart.totals.currency || store.currency, locale);
  const methodName = (method: (typeof checkout.paymentMethods)[number]): string => (method.slug === 'cod' && method.name === 'Cash on delivery' ? (ar ? 'الدفع عند الاستلام' : 'Cash on delivery') : method.slug === 'bank_transfer' && method.name === 'Bank transfer' ? (ar ? 'تحويل بنكي' : 'Bank transfer') : method.name) + (method.test_mode ? (ar ? ' (تجريبي)' : ' (Test)') : '');

  return <div className="sf-co">
    <div className="sf-co__main">
      <section className="sf-co-mobile-summary" data-open={summaryOpen}>
        <button type="button" className="sf-co-mobile-summary__toggle" aria-expanded={summaryOpen} aria-controls="sf-co-mobile-summary" onClick={() => setSummaryOpen((open) => !open)}>
          <span>{summaryOpen ? (ar ? 'إخفاء ملخص الطلب' : 'Hide order summary') : (ar ? 'عرض ملخص الطلب' : 'Show order summary')} <span className="sf-co-mobile-summary__chev" aria-hidden>▾</span></span>
          <strong>{totalText}</strong>
        </button>
        {summaryOpen ? <div id="sf-co-mobile-summary" className="sf-co-mobile-summary__body">{summary}</div> : null}
      </section>
      {tpl ? <ThemeRenderer page={tpl} context={flowContext(store)} /> : null}
      <h1 className="sf-co-title">{t('checkout.title')}</h1>
      <p className="sf-co-lead">{ar ? 'أكمل بياناتك لإتمام الطلب. لن يستغرق ذلك سوى دقيقة.' : 'Complete your details to place the order — it only takes a minute.'}</p>
      <UiBlock slot="before_checkout" />
      <form className="sf-co-form" onSubmit={(event) => void placeOrder(event)}>
        <CheckoutRecovery flow={checkout} />
        <fieldset disabled={checkout.busy || checkout.unresolved}>
          <section className="sf-co-section" aria-labelledby="sf-co-delivery">
            <h2 id="sf-co-delivery">{ar ? 'بيانات التواصل والتوصيل' : 'Contact & delivery'}</h2>
            <div className="sf-co-fields"><CheckoutFieldsForm model={contact} quote={quote ?? quoteQ.data?.data} /></div>
          </section>
          <section className="sf-co-section" aria-labelledby="sf-co-payment">
            <h2 id="sf-co-payment">{t('checkout.payment')}</h2>
            <p className="sf-co-section__note">{ar ? 'كل المعاملات آمنة ومشفّرة.' : 'All transactions are secure and encrypted.'}</p>
            {paidByGiftCards ? <p className="sf-co-paid-note" role="status" data-paid-by-gift-cards>{ar ? 'بطاقات الهدايا تغطي إجمالي الطلب، لا حاجة لطريقة دفع.' : 'Your gift cards cover the full total. No payment method is needed.'}</p>
              : checkout.paymentMethods.length ? <div className="sf-co-choices" role="radiogroup" aria-labelledby="sf-co-payment">
              {checkout.paymentMethods.map((method) => {
                const selected = checkout.paymentMethod === method.slug;
                return <div key={method.slug} style={{ display: 'contents' }}>
                  <label className={`sf-co-choice ${selected ? 'is-selected' : ''}`}>
                    <input type="radio" name="payment_method" checked={selected} onChange={() => checkout.setPaymentMethod(method.slug)} required />
                    <span className="sf-co-choice__label"><strong>{methodName(method)}</strong></span>
                    <span className="sf-co-choice__aside"><PaymentMethodLogo slug={method.slug} src={method.logo_url} /></span>
                  </label>
                  {selected && method.description ? <div className="sf-co-choice__detail">{method.description}</div> : null}
                </div>;
              })}
            </div> : <p className="sf-field__error">{ar ? 'لا توجد طريقة دفع متاحة حاليًا.' : 'No payment method is currently available.'}</p>}
          </section>
        </fieldset>
        {checkout.error && !checkout.unresolved ? <div className="sf-co-alert" role="alert"><p>{checkout.error}</p>{!checkout.paymentRetry ? <Button type="button" variant="secondary" onClick={reloadAll}>{ar ? 'تحديث خيارات التوصيل' : 'Refresh delivery options'}</Button> : null}</div> : null}
        {!checkout.paymentRetry && !checkout.unresolved ? <CheckoutMinimum quote={quote} /> : null}
        {quote?.order_minimum?.eligible === false && !checkout.paymentRetry && !checkout.unresolved ? <ButtonLink href="/cart" variant="secondary" block>{ar ? 'تعديل السلة' : 'Edit cart'}</ButtonLink> : null}
        {!checkout.unresolved ? <Button type="submit" block className="sf-co-pay" loading={checkout.busy} disabled={(!checkout.paymentMethod && !paidByGiftCards) || !quote || !contact.shippingReady || (!checkout.paymentRetry && (!minimumOrderAllows(quote) || !contact.phoneVerification.ready || !contact.botProtection.ready))}>
          {`${t('checkout.placeOrder')}${quote ? ` · ${formatMoney(quoteAmountDue(quote), quote.currency, locale)}` : ''}`}
        </Button> : null}
        <p className="sf-co-trust"><LockIcon />{ar ? 'بياناتك محمية ولا تُشارك مع أي طرف.' : 'Your details are protected and never shared.'}</p>
        <a className="sf-co-back" href="/cart">{ar ? '→' : '←'} {ar ? 'العودة إلى السلة' : 'Return to cart'}</a>
      </form>
      <UiBlock slot="after_checkout" />
    </div>
    <aside className="sf-co__summary" aria-label={ar ? 'ملخص الطلب' : 'Order summary'}><div className="sf-co__summary-inner">{summary}</div></aside>
  </div>;
}

export function OrderSuccessPage(): ReactElement {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const [params] = useSearchParams();
  const { store } = useStore();
  const tpl = useTemplate('order-success');
  const number = params.get('number');
  const thankYouQuery = useAsync(async () => ({ locale, data: (await getThankYouPage()).data }), [locale]);
  const custom = currentThankYou(thankYouQuery, locale);
  useEffect(() => {
    const scope = window.location.origin;
    if (number && readCheckoutAttempt(scope)?.orderNumber === number) clearCheckoutAttempt(scope);
  }, [number]);
  if (thankYouQuery.loading) return <><Section><Container narrow><Spinner label={locale === 'ar' ? 'جارٍ تحميل الصفحة…' : 'Loading page…'} /></Container></Section><OrderReceiptPanel number={number} /></>;
  if (custom) return <><ThankYouContent page={custom} number={number} /><OrderReceiptPanel number={number} /><ThankYouProducts page={custom} /></>;
  if (tpl) return <><ThemeRenderer page={tpl} context={flowContext(store)} /><OrderReceiptPanel number={number} /></>;
  return (
    <><Section>
      <Container narrow>
        <div className="sf-state">
          <span className="sf-state__code" aria-hidden>
            ✓
          </span>
          <h1 className="sf-state__title">{t('checkout.thankYou')}</h1>
          <p className="sf-state__text">
            {number ? t('checkout.orderConfirmedNumber', { number }) : t('checkout.orderConfirmed')}
          </p>
          <div className="sf-state__actions">
            <a className="sf-btn sf-btn--primary sf-btn--md" href="/">
              <span className="sf-btn__label">{t('cart.continueShopping')}</span>
            </a>
          </div>
        </div>
      </Container>
    </Section><OrderReceiptPanel number={number} /></>
  );
}
