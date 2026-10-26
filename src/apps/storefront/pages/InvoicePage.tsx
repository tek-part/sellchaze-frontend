/**
 * Draft-order invoice (`/invoices/:token`): the merchant shares this private link; the customer
 * reviews the items and totals, confirms contact/delivery details, picks one of the store's payment
 * methods and confirms. Rendered inside the distraction-free checkout shell.
 */
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactElement } from 'react';
import { useParams } from 'react-router-dom';
import PaymentMethodLogo from '../../../shared/payments/PaymentMethodLogo';
import { ApiError } from '../api/client';
import { checkoutInvoice, getInvoice, retryCheckoutPayment, type InvoiceCheckoutResponse, type StorefrontInvoice } from '../api/storefront';
import { useAsync } from '../api/useAsync';
import { Button, Input, Select, Spinner } from '../foundation/components';
import { useLocale } from '../i18n/useLocale';
import { countryOptions } from '../utils/countries';
import { formatMoney } from '../utils/format';
import { checkoutContact, type CheckoutField, type Values } from './checkout-contact';
import { saveOrderReceipt } from './order-receipt';
import { OrderReceiptPanel } from './OrderReceiptPanel';
import { Seo } from '../seo/Seo';
import './checkout/checkout.css';

type Phase = { kind: 'form' } | { kind: 'done'; number: string } | { kind: 'retry'; token: string; number?: string };

function initialValues(invoice: StorefrontInvoice): Values {
  const address = invoice.shipping_address ?? {};
  return {
    name: invoice.customer.name ?? '', phone: invoice.customer.phone ?? '', email: invoice.customer.email ?? '',
    address: address.line1 ?? '', city: address.city ?? '', country: address.country ?? '', postal_code: address.postal_code ?? '',
  };
}

function Summary({ invoice, money, ar }: { invoice: StorefrontInvoice; money: (value: string | number) => string; ar: boolean }): ReactElement {
  const totals = invoice.totals;
  return <>
    <ul className="sf-co-lines" aria-label={ar ? 'منتجات الفاتورة' : 'Invoice items'}>
      {invoice.line_items.map((line, index) => <li key={`${line.title}-${index}`}>
        <div className="sf-co-line">
          <span className="sf-co-thumb">{line.image_url ? <img src={line.image_url} alt="" loading="lazy" /> : null}<span className="sf-co-thumb__qty" aria-label={ar ? `الكمية ${line.quantity}` : `Quantity ${line.quantity}`}>{line.quantity}</span></span>
          <span><span className="sf-co-line__name">{line.title}</span><span className="sf-co-line__meta">{money(line.unit_price)}</span></span>
          <span className="sf-co-line__price">{money(line.line_total ?? Number(line.unit_price) * line.quantity)}</span>
        </div>
      </li>)}
    </ul>
    <div className="sf-co-totals">
      <div className="sf-co-row"><span>{ar ? 'المجموع الفرعي' : 'Subtotal'}</span><span>{money(totals.subtotal)}</span></div>
      {Number(totals.discount_total) > 0 ? <div className="sf-co-row"><span>{ar ? 'الخصم' : 'Discount'}{totals.discounts[0] ? ` (${totals.discounts[0].code || totals.discounts[0].title})` : ''}</span><span>−{money(totals.discount_total)}</span></div> : null}
      {invoice.requires_shipping ? <div className="sf-co-row"><span>{ar ? 'الشحن' : 'Shipping'}{totals.shipping_title ? ` (${totals.shipping_title})` : ''}</span><span>{Number(totals.shipping_total) > 0 ? money(totals.shipping_total) : (ar ? 'مجاني' : 'Free')}</span></div> : null}
      {Number(totals.tax_total) > 0 ? <div className="sf-co-row"><span>{totals.tax_included ? (ar ? 'الضريبة المشمولة' : 'Included tax') : (ar ? 'الضريبة' : 'Tax')}</span><span>{money(totals.tax_total)}</span></div> : null}
      <div className="sf-co-total"><span>{ar ? 'الإجمالي' : 'Total'}</span><span className="sf-co-total__value"><span className="sf-co-total__currency">{invoice.currency}</span>{money(totals.grand_total)}</span></div>
    </div>
  </>;
}

export function InvoicePage(): ReactElement {
  const { token = '' } = useParams();
  const { locale } = useLocale();
  const ar = locale === 'ar';
  const lang = ar ? 'ar' : 'en';
  const query = useAsync(() => getInvoice(token), [token]);
  const invoice = query.data?.data ?? null;
  const [values, setValues] = useState<Values>({});
  const [method, setMethod] = useState('');
  const [phase, setPhase] = useState<Phase>({ kind: 'form' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [summaryOpen, setSummaryOpen] = useState(true);
  const submitting = useRef(false);
  const countries = useMemo(() => [{ value: '', label: ar ? 'اختر الدولة' : 'Choose country' }, ...countryOptions(locale)], [locale, ar]);

  useEffect(() => {
    if (!invoice) return;
    setValues(initialValues(invoice));
    setMethod((current) => current || invoice.payment_methods[0]?.slug || '');
  }, [invoice]);

  const money = (value: string | number): string => formatMoney(Number(value), invoice?.currency || 'USD', locale);
  const fields: ReadonlyArray<CheckoutField> = (invoice?.fields ?? []).filter((field) => field.enabled && !field.shipping_region);
  const selected = invoice?.payment_methods.find((row) => row.slug === method);

  const finish = (response: InvoiceCheckoutResponse): void => {
    const number = response.data?.number;
    if (number && response.receipt?.token) saveOrderReceipt(number, response.receipt.token);
    if (response.payment?.redirect_url) { window.location.assign(response.payment.redirect_url); return; }
    setPhase({ kind: 'done', number: number ?? '' });
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const submit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    if (!invoice || submitting.current || !method) return;
    submitting.current = true; setBusy(true); setError('');
    try {
      if (phase.kind === 'retry') finish(await retryCheckoutPayment(phase.token) as InvoiceCheckoutResponse);
      else finish(await checkoutInvoice(token, { ...checkoutContact(fields, values), payment_method: method }));
    } catch (requestError) {
      const body = requestError instanceof ApiError ? requestError.payload as (InvoiceCheckoutResponse & { errors?: Record<string, string[]> }) | undefined : undefined;
      if (body?.data?.number && body.receipt?.token) saveOrderReceipt(body.data.number, body.receipt.token);
      if (body?.payment_retry?.token) setPhase({ kind: 'retry', token: body.payment_retry.token, number: body.data?.number });
      const messages = Object.values(body?.errors ?? {}).flat();
      setError(messages.length ? messages.join(' ') : requestError instanceof Error ? requestError.message : (ar ? 'تعذّر إتمام الطلب.' : 'Unable to complete the order.'));
    } finally {
      submitting.current = false; setBusy(false);
    }
  };

  if (query.loading) return <div className="sf-co"><div className="sf-co__main"><Spinner label={ar ? 'جارٍ تحميل الفاتورة…' : 'Loading invoice…'} /></div></div>;
  if (!invoice) {
    const status = query.error instanceof ApiError ? query.error.status : 0;
    return <div className="sf-co"><div className="sf-co__main">
      <h1 className="sf-co-title">{status === 409 ? (ar ? 'تم دفع هذه الفاتورة' : 'This invoice is already complete') : (ar ? 'الفاتورة غير متاحة' : 'Invoice unavailable')}</h1>
      <p className="sf-co-lead">{status === 409 ? (ar ? 'تم تحويل هذه الفاتورة إلى طلب بالفعل.' : 'This invoice has already been turned into an order.') : (ar ? 'الرابط غير صالح أو انتهت صلاحيته. اطلب من المتجر رابطًا جديدًا.' : 'This link is invalid or has expired. Ask the store for a new link.')}</p>
      {status !== 404 && status !== 409 ? <Button type="button" variant="secondary" onClick={query.reload}>{ar ? 'إعادة المحاولة' : 'Try again'}</Button> : null}
    </div></div>;
  }
  if (phase.kind === 'done') {
    return <><div className="sf-co"><div className="sf-co__main">
      <div className="sf-state" role="status">
        <span className="sf-state__code" aria-hidden>✓</span>
        <h1 className="sf-state__title">{ar ? 'شكرًا لك!' : 'Thank you!'}</h1>
        <p className="sf-state__text">{phase.number ? (ar ? `تم تأكيد طلبك رقم ${phase.number}.` : `Your order ${phase.number} is confirmed.`) : (ar ? 'تم تأكيد طلبك.' : 'Your order is confirmed.')}</p>
      </div>
    </div></div><OrderReceiptPanel number={phase.number || null} /></>;
  }

  const summary = <Summary invoice={invoice} money={money} ar={ar} />;
  const payable = selected ? selected.grand_total : invoice.totals.grand_total;
  const methodName = (row: StorefrontInvoice['payment_methods'][number]): string => (row.slug === 'cod' && row.name === 'Cash on delivery' ? (ar ? 'الدفع عند الاستلام' : 'Cash on delivery') : row.slug === 'bank_transfer' && row.name === 'Bank transfer' ? (ar ? 'تحويل بنكي' : 'Bank transfer') : row.name) + (row.test_mode ? (ar ? ' (تجريبي)' : ' (Test)') : '');

  return <div className="sf-co sf-invoice">
    <Seo title={ar ? `فاتورة ${invoice.number}` : `Invoice ${invoice.number}`} noindex />
    <div className="sf-co__main">
      <section className="sf-co-mobile-summary" data-open={summaryOpen}>
        <button type="button" className="sf-co-mobile-summary__toggle" aria-expanded={summaryOpen} aria-controls="sf-invoice-mobile-summary" onClick={() => setSummaryOpen((open) => !open)}>
          <span>{summaryOpen ? (ar ? 'إخفاء ملخص الفاتورة' : 'Hide invoice summary') : (ar ? 'عرض ملخص الفاتورة' : 'Show invoice summary')} <span className="sf-co-mobile-summary__chev" aria-hidden>▾</span></span>
          <strong>{money(payable)}</strong>
        </button>
        {summaryOpen ? <div id="sf-invoice-mobile-summary" className="sf-co-mobile-summary__body">{summary}</div> : null}
      </section>
      <h1 className="sf-co-title">{ar ? `فاتورة ${invoice.number}` : `Invoice ${invoice.number}`}</h1>
      <p className="sf-co-lead">{ar ? `أرسل ${invoice.store.name} هذه الفاتورة إليك. راجع بياناتك وأكّد الطلب.` : `${invoice.store.name} sent you this invoice. Review your details and confirm the order.`}{invoice.expires_at ? ` ${ar ? 'صالحة حتى' : 'Valid until'} ${new Date(invoice.expires_at).toLocaleDateString(locale)}.` : ''}</p>
      <form className="sf-co-form" onSubmit={(event) => void submit(event)}>
        <fieldset disabled={busy || phase.kind === 'retry'}>
          <section className="sf-co-section" aria-labelledby="sf-invoice-contact">
            <h2 id="sf-invoice-contact">{invoice.requires_shipping ? (ar ? 'بيانات التواصل والتوصيل' : 'Contact & delivery') : (ar ? 'بيانات التواصل' : 'Contact')}</h2>
            <div className="sf-co-fields">{fields.map((field) => {
              const label = `${field.label[lang]}${field.required ? ' *' : ''}`;
              const change = (event: { target: { value: string } }): void => setValues((current) => ({ ...current, [field.key]: event.target.value }));
              if (field.key === 'country') return <Select key={field.key} label={label} value={values.country ?? ''} onChange={change} required={field.required} options={countries} autoComplete="country" />;
              const autoComplete = { name: 'name', phone: 'tel', email: 'email', address: 'street-address', city: 'address-level2', postal_code: 'postal-code', phone_alt: 'off', notes: 'off', national_address: 'off' }[field.key];
              return <Input key={field.key} label={label} hint={field.hint[lang] || undefined} value={values[field.key] ?? ''} onChange={change} required={field.required}
                type={field.key === 'email' ? 'email' : field.key === 'phone' || field.key === 'phone_alt' ? 'tel' : 'text'} autoComplete={autoComplete}
                maxLength={field.key === 'notes' ? 2000 : field.key === 'phone' || field.key === 'phone_alt' ? 50 : field.key === 'postal_code' ? 32 : field.key === 'city' ? 120 : 255} />;
            })}</div>
          </section>
          <section className="sf-co-section" aria-labelledby="sf-invoice-payment">
            <h2 id="sf-invoice-payment">{ar ? 'الدفع' : 'Payment'}</h2>
            <p className="sf-co-section__note">{ar ? 'كل المعاملات آمنة ومشفّرة.' : 'All transactions are secure and encrypted.'}</p>
            {invoice.payment_methods.length ? <div className="sf-co-choices" role="radiogroup" aria-labelledby="sf-invoice-payment">
              {invoice.payment_methods.map((row) => {
                const active = method === row.slug;
                return <div key={row.slug} style={{ display: 'contents' }}>
                  <label className={`sf-co-choice ${active ? 'is-selected' : ''}`}>
                    <input type="radio" name="payment_method" checked={active} onChange={() => setMethod(row.slug)} required />
                    <span className="sf-co-choice__label"><strong>{methodName(row)}</strong>{row.grand_total !== invoice.totals.grand_total ? <small>{money(row.grand_total)}</small> : null}</span>
                    <span className="sf-co-choice__aside"><PaymentMethodLogo slug={row.slug} src={row.logo_url} /></span>
                  </label>
                  {active && row.description ? <div className="sf-co-choice__detail">{row.description}</div> : null}
                </div>;
              })}
            </div> : <p className="sf-field__error">{ar ? 'لا توجد طريقة دفع متاحة حاليًا.' : 'No payment method is currently available.'}</p>}
          </section>
        </fieldset>
        {error ? <div className="sf-co-alert" role="alert"><p>{error}</p></div> : null}
        <Button type="submit" block className="sf-co-pay" loading={busy} disabled={!method}>
          {phase.kind === 'retry' ? (ar ? 'إعادة محاولة الدفع' : 'Retry payment') : `${ar ? 'تأكيد الطلب' : 'Confirm order'} · ${money(payable)}`}
        </Button>
      </form>
    </div>
    <aside className="sf-co__summary" aria-label={ar ? 'ملخص الفاتورة' : 'Invoice summary'}><div className="sf-co__summary-inner">{summary}</div></aside>
  </div>;
}
