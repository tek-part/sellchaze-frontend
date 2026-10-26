import TransferReceiptUpload, { type TransferProof } from './TransferReceiptUpload';
import { PaymentAdjustmentLine } from './PaymentAdjustmentLine';
import PaymentMethodLogo from '../../../shared/payments/PaymentMethodLogo';
import { useEffect, useState, type ReactElement } from 'react';
import { apiSend } from '../api/client';
import type { ApiOrder, TransferTarget } from '../api/storefront';
import { LinkedText, TransferTargets } from './CheckoutDeposit';
import { useAsync } from '../api/useAsync';
import { Button, Section, Container, Spinner } from '../foundation/components';
import { DigitalDeliverySummary } from '../foundation/components/DigitalDeliverySummary';
import { useLocale } from '../i18n/useLocale';
import { formatMoney } from '../utils/format';
import { readOrderReceipt } from './order-receipt';
import { withSessionParams } from './NavigationInterceptor';
import { browserAdvertisingAllowed, sendAdvertisingEnvelope } from '../advertising/events';
import { useStore } from '../state/store-context';

interface ReceiptResponse {
  data: ApiOrder & { payment_status: string; payment_method: string; tracking?: unknown };
  bank_transfer: { fields: Record<string, string>; targets?: ReadonlyArray<TransferTarget>; notes: string; test_mode: boolean } | null;
  transfer_proofs?: ReadonlyArray<TransferProof>;
  payment_method?: { name: string; logo_url?: string | null; description?: string } | null;
}

export function OrderReceiptPanel({ number }: { number: string | null }): ReactElement | null {
  const { locale } = useLocale();
  const ar = locale === 'ar';
  const { store } = useStore();
  const token = readOrderReceipt(number);
  useEffect(() => {
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    if (token && fragment.has('receipt')) {
      fragment.delete('receipt');
      const suffix = fragment.toString();
      window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}${suffix ? `#${suffix}` : ''}`);
    }
  }, [token]);
  const [revision, setRevision] = useState(0);
  const query = useAsync(() => token ? apiSend<ReceiptResponse>('/checkout/receipt', 'POST', { token, advertising_allowed: browserAdvertisingAllowed() }) : Promise.resolve(null), [token, revision]);
  const tracking = query.data?.data.tracking;
  useEffect(() => { sendAdvertisingEnvelope(store.id, tracking); }, [store.id, tracking]);
  if (!token) return null;
  const order = query.data?.data;
  const returnLabels: Record<string, string> = ar
    ? { returning_from_delivery: 'مرتجع من الشحن', request_refund: 'العميل طلب الارجاع', refund_in_progress: 'جاري الارجاع', refunded: 'تم الارجاع' }
    : { returning_from_delivery: 'Returning from delivery', request_refund: 'Return requested', refund_in_progress: 'Return in progress', refunded: 'Returned' };
  const returnLabel = returnLabels[order?.status ?? ''];
  const paymentClosed = Boolean(returnLabel) || order?.status === 'cancelled';
  const hasDigital = order?.items?.some((item) => Boolean(item.digital_delivery)) === true;
  const bank = query.data?.bank_transfer;
  const deposit = order?.deposit ?? null;
  const settled = order?.payment_status === 'paid' || order?.payment_status === 'deposit_paid';
  const money = (value: string | number): string => formatMoney(Number(value), order?.currency ?? 'USD', locale);
  const labels: Record<string, string> = ar ? { account_name: 'اسم المستفيد', bank_name: 'البنك', iban: 'رقم الحساب / IBAN', swift_code: 'رمز SWIFT' } : { account_name: 'Account holder', bank_name: 'Bank', iban: 'Account / IBAN', swift_code: 'SWIFT' };
  const url = `${window.location.origin}${withSessionParams(`/order/success?number=${encodeURIComponent(number ?? '')}`, window.location.search)}#receipt=${encodeURIComponent(token)}`;
  return <Section><Container narrow><div className="sf-order-receipt sf-card">
    <h2>{ar ? 'إيصال طلبك الخاص' : 'Your private order receipt'}</h2>
    {query.loading ? <Spinner label={ar ? 'جارٍ تحميل الإيصال…' : 'Loading receipt…'} /> : query.error ? <p role="alert">{ar ? 'تعذر فتح الإيصال. قد يكون الرابط منتهيًا أو غير صالح.' : 'Unable to open this receipt. The link may be invalid or expired.'}</p> : order ? <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><PaymentMethodLogo slug={order.payment_method} src={query.data?.payment_method?.logo_url} /><span>{query.data?.payment_method?.name}</span></div><p><bdi>{order.number}</bdi> · {formatMoney(Number(order.total), order.currency ?? 'USD', locale)}</p>
      <p role="status">{returnLabel || (order.status === 'cancelled' ? (ar ? 'الطلب ملغى' : 'Order cancelled') : order.payment_status === 'paid' ? (ar ? 'تم تأكيد الدفع' : 'Payment confirmed') : order.payment_status === 'deposit_paid' ? (ar ? 'تم تأكيد دفع العربون' : 'Deposit payment confirmed') : (ar ? 'بانتظار تأكيد الدفع' : 'Awaiting payment confirmation'))}</p>
      {deposit && !paymentClosed ? <div className="sf-order-receipt__deposit" data-receipt-deposit>
        <p>{deposit.paid ? (ar ? `العربون المدفوع: ${money(deposit.amount)}` : `Deposit paid: ${money(deposit.amount)}`) : (ar ? `العربون المطلوب الآن: ${money(deposit.amount)}` : `Deposit to pay now: ${money(deposit.amount)}`)}</p>
        {Number(deposit.remaining) > 0 ? <p>{deposit.remainder_collected ? (ar ? 'تم تحصيل المبلغ المتبقي.' : 'The remaining amount was collected.') : (ar ? `المتبقي عند الاستلام: ${money(deposit.remaining)}` : `Remaining on delivery: ${money(deposit.remaining)}`)}</p> : null}
        {!deposit.paid && deposit.confirm_after_payment ? <p>{ar ? 'يُؤكَّد الطلب بعد دفع العربون.' : 'Your order is confirmed once the deposit is paid.'}</p> : null}
      </div> : null}
      {returnLabel ? <p>{ar ? 'حالة الدفع المسجلة: ' : 'Recorded payment status: '}{order.payment_status === 'paid' ? (ar ? 'تم تأكيد الدفع' : 'Payment confirmed') : order.payment_status === 'failed' ? (ar ? 'فشل الدفع' : 'Payment failed') : (ar ? 'بانتظار التأكيد' : 'Awaiting confirmation')}</p> : null}
      <PaymentAdjustmentLine amount={order.payment_adjustment_total} currency={order.currency ?? 'USD'} />
      {Number(order.gift_card_total ?? 0) > 0 ? <p data-receipt-gift-cards>{ar ? 'مدفوع ببطاقات الهدايا' : 'Paid with gift cards'}: −{formatMoney(Number(order.gift_card_total), order.currency ?? 'USD', locale)} · {ar ? 'المبلغ المستحق' : 'Amount due'}: {formatMoney(Number(order.amount_due ?? 0), order.currency ?? 'USD', locale)}</p> : null}
      {hasDigital && order.payment_method === 'cod' && order.payment_status !== 'paid' && !paymentClosed ? <p>{ar ? 'الدفع عند الاستلام: تتاح المنتجات الرقمية بعد مراجعة المتجر لتحصيل كامل قيمة الطلب. تسليم الطرد وحده لا يؤكد الدفع.' : 'Cash on delivery: digital products become available after the store verifies collection of the full order amount. Parcel delivery alone does not confirm payment.'}</p> : null}
      {order.items?.map((item, index) => <div key={item.id ?? index}><h3>{item.name} × {item.quantity}</h3><DigitalDeliverySummary delivery={item.digital_delivery} /></div>)}
      {order.payment_method === 'transfer_receipt' ? <TransferReceiptUpload token={token} proofs={query.data?.transfer_proofs || []} ar={ar} canUpload={!settled && !paymentClosed} onUploaded={() => setRevision(value => value + 1)} /> : null}
      {bank && !paymentClosed ? <div className="sf-order-receipt__bank">
        <h3>{ar ? 'تعليمات التحويل البنكي' : 'Bank transfer instructions'}{bank.test_mode ? (ar ? ' (تجريبي)' : ' (Test)') : ''}</h3>
        {deposit && !deposit.paid ? <p>{ar ? `حوّل العربون فقط: ${money(deposit.amount)}.` : `Transfer the deposit only: ${money(deposit.amount)}.`}</p> : null}
        <TransferTargets targets={bank.targets} />
        {Object.entries(bank.fields).length ? <dl>{Object.entries(bank.fields).map(([key, value]) => <div key={key}><dt>{labels[key] ?? key}</dt><dd><bdi>{value}</bdi></dd></div>)}</dl> : bank.targets?.length ? null : <p>{ar ? 'تواصل مع المتجر للحصول على بيانات التحويل.' : 'Contact the store for transfer details.'}</p>}
        {bank.notes ? <p style={{ whiteSpace: 'pre-wrap' }}><LinkedText value={bank.notes} /></p> : null}
        <p>{ar ? 'استخدم رقم طلبك كمرجع للتحويل. يتاح المنتج الرقمي بعد مراجعة المتجر وتأكيد وصول المبلغ.' : 'Use your order number as the transfer reference. Digital products become available after the store verifies receipt of payment.'}</p>
      </div> : null}
    </> : null}
    <Button variant="secondary" disabled={query.loading} onClick={() => setRevision((value) => value + 1)}>{ar ? 'تحديث حالة الدفع' : 'Refresh payment status'}</Button>
    <label className="sf-field" style={{ marginTop: '1rem' }}><span>{ar ? 'رابطك الخاص — احتفظ به ولا تشاركه' : 'Your private link — keep it safe and do not share it'}</span><input className="sf-input" type="text" readOnly value={url} onFocus={(event) => event.currentTarget.select()} /></label>
  </div></Container></Section>;
}
