import { useEffect, useState, type ReactElement } from 'react';
import { apiSend } from '../api/client';
import type { ApiOrder } from '../api/storefront';
import { useAsync } from '../api/useAsync';
import { Button, Section, Container, Spinner } from '../foundation/components';
import { DigitalDeliverySummary } from '../foundation/components/DigitalDeliverySummary';
import { useLocale } from '../i18n/useLocale';
import { formatMoney } from '../utils/format';
import { readOrderReceipt } from './order-receipt';
import { withSessionParams } from './NavigationInterceptor';

interface ReceiptResponse {
  data: ApiOrder & { payment_status: string; payment_method: string };
  bank_transfer: { fields: Record<string, string>; notes: string; test_mode: boolean } | null;
}

export function OrderReceiptPanel({ number }: { number: string | null }): ReactElement | null {
  const { locale } = useLocale();
  const ar = locale === 'ar';
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
  const query = useAsync(() => token ? apiSend<ReceiptResponse>('/checkout/receipt', 'POST', { token }) : Promise.resolve(null), [token, revision]);
  if (!token) return null;
  const order = query.data?.data;
  const bank = query.data?.bank_transfer;
  const labels: Record<string, string> = ar ? { account_name: 'اسم المستفيد', bank_name: 'البنك', iban: 'رقم الحساب / IBAN', swift_code: 'رمز SWIFT' } : { account_name: 'Account holder', bank_name: 'Bank', iban: 'Account / IBAN', swift_code: 'SWIFT' };
  const url = `${window.location.origin}${withSessionParams(`/order/success?number=${encodeURIComponent(number ?? '')}`, window.location.search)}#receipt=${encodeURIComponent(token)}`;
  return <Section><Container narrow><div className="sf-order-receipt sf-card">
    <h2>{ar ? 'إيصال طلبك الخاص' : 'Your private order receipt'}</h2>
    {query.loading ? <Spinner label={ar ? 'جارٍ تحميل الإيصال…' : 'Loading receipt…'} /> : query.error ? <p role="alert">{ar ? 'تعذر فتح الإيصال. قد يكون الرابط منتهيًا أو غير صالح.' : 'Unable to open this receipt. The link may be invalid or expired.'}</p> : order ? <>
      <p><bdi>{order.number}</bdi> · {formatMoney(Number(order.total), order.currency ?? 'USD', locale)}</p>
      <p role="status">{order.status === 'cancelled' ? (ar ? 'الطلب ملغى' : 'Order cancelled') : order.payment_status === 'paid' ? (ar ? 'تم تأكيد الدفع' : 'Payment confirmed') : (ar ? 'بانتظار تأكيد الدفع' : 'Awaiting payment confirmation')}</p>
      {order.payment_method === 'cod' && order.payment_status !== 'paid' && order.status !== 'cancelled' ? <p>{ar ? 'الدفع عند الاستلام: تتاح المنتجات الرقمية بعد مراجعة المتجر لتحصيل كامل قيمة الطلب. تسليم الطرد وحده لا يؤكد الدفع.' : 'Cash on delivery: digital products become available after the store verifies collection of the full order amount. Parcel delivery alone does not confirm payment.'}</p> : null}
      {order.items?.map((item, index) => <div key={item.id ?? index}><h3>{item.name} × {item.quantity}</h3><DigitalDeliverySummary delivery={item.digital_delivery} /></div>)}
      {bank && order.status !== 'cancelled' ? <div className="sf-order-receipt__bank">
        <h3>{ar ? 'تعليمات التحويل البنكي' : 'Bank transfer instructions'}{bank.test_mode ? (ar ? ' (تجريبي)' : ' (Test)') : ''}</h3>
        {Object.entries(bank.fields).length ? <dl>{Object.entries(bank.fields).map(([key, value]) => <div key={key}><dt>{labels[key] ?? key}</dt><dd><bdi>{value}</bdi></dd></div>)}</dl> : <p>{ar ? 'تواصل مع المتجر للحصول على بيانات التحويل.' : 'Contact the store for transfer details.'}</p>}
        {bank.notes ? <p style={{ whiteSpace: 'pre-wrap' }}>{bank.notes}</p> : null}
        <p>{ar ? 'استخدم رقم طلبك كمرجع للتحويل. يتاح المنتج الرقمي بعد مراجعة المتجر وتأكيد وصول المبلغ.' : 'Use your order number as the transfer reference. Digital products become available after the store verifies receipt of payment.'}</p>
      </div> : null}
    </> : null}
    <Button variant="secondary" disabled={query.loading} onClick={() => setRevision((value) => value + 1)}>{ar ? 'تحديث حالة الدفع' : 'Refresh payment status'}</Button>
    <label className="sf-field" style={{ marginTop: '1rem' }}><span>{ar ? 'رابطك الخاص — احتفظ به ولا تشاركه' : 'Your private link — keep it safe and do not share it'}</span><input className="sf-input" type="text" readOnly value={url} onFocus={(event) => event.currentTarget.select()} /></label>
  </div></Container></Section>;
}
