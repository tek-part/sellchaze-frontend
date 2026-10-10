import { useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';
import { cashCollectionRequest } from '../../lib/cash-collection';

const button = 'rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold disabled:opacity-40';
const input = 'mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50';

export default function StoreOrderCashPayment({ order, apiBase, onOrderUpdated }) {
    const { access } = useOutletContext() ?? {};
    const { i18n } = useTranslation();
    const ar = i18n.language.startsWith('ar');
    const text = (a, e) => ar ? a : e;
    const [reference, setReference] = useState('');
    const [amount, setAmount] = useState('');
    const [collected, setCollected] = useState(false);
    const [note, setNote] = useState('');
    const [review, setReview] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [uncertain, setUncertain] = useState(false);
    const working = useRef(false);
    if (order.payment_method !== 'cod' || !access?.canStoreOrders) return null;

    async function confirm() {
        if (working.current || !review) return;
        working.current = true; setBusy(true); setError('');
        try {
            const { data } = await api.post(`${apiBase}/orders/${order.id}/payment/confirm-cash`, review);
            setReview(null); setUncertain(false); onOrderUpdated(data.data);
        } catch (e) {
            const definite = e.response?.status >= 400 && e.response?.status < 500;
            if (definite) { setReview(null); setUncertain(false); }
            else setUncertain(true);
            setError(Object.values(e.response?.data?.errors || {}).flat().join(' ') || e.response?.data?.message || text('تعذر تأكيد نتيجة التحصيل.', 'The collection result could not be confirmed.'));
        } finally { working.current = false; setBusy(false); }
    }
    async function refresh() {
        if (working.current) return;
        working.current = true; setBusy(true); setError('');
        try {
            const { data } = await api.get(`${apiBase}/orders/${order.id}`);
            onOrderUpdated(data.data);
            if (data.data.payment_status === 'paid' || data.data.status === 'cancelled') { setReview(null); setUncertain(false); }
        } catch { setError(text('تعذر تحديث حالة الطلب. حاول مرة أخرى.', 'Order status could not be refreshed. Try again.')); }
        finally { working.current = false; setBusy(false); }
    }
    const request = cashCollectionRequest(order, reference, amount, collected, note);
    const paid = order.payment_status === 'paid';
    const cancelled = order.status === 'cancelled';
    return <section aria-label={text('تحصيل الدفع عند الاستلام', 'Cash on delivery collection')} className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
        <h2 className="font-semibold">{text('تحصيل الدفع عند الاستلام', 'Cash on delivery collection')}</h2>
        <p className="text-sm text-slate-600">{text('إجمالي طلب العميل', 'Complete customer order')}: <b dir="ltr">{order.currency} {order.grand_total}</b></p>
        {paid ? <p role="status" className="break-words text-sm text-emerald-700">{text('تم تأكيد الدفع', 'Payment confirmed')}{order.payment_reference ? <> · <b>{order.payment_reference}</b></> : null}</p> : cancelled ? <p className="text-sm text-slate-600">{text('الطلب ملغى ولا يمكن تسجيل تحصيل له.', 'This order is cancelled and cannot collect payment.')}</p> : <>
            <p className="text-sm text-slate-600">{text('حالة الشحن لا تؤكد التحصيل. سجّل وصول كامل المبلغ بعد مراجعة الإيصال أو كشف التحصيل؛ لا يدعم هذا الإجراء الدفعات الجزئية.', 'Shipping status does not confirm payment. Record the full amount received after checking the receipt or collection statement; partial payments are not supported here.')}</p>
            {order.fulfillment?.digital_quantity > 0 ? <p className="text-sm text-sky-800">{text('بعد التأكيد ستصبح المنتجات الرقمية متاحة للمشتري وسيُجدول بريد التسليم.', 'Confirmation releases digital products to the buyer and queues the delivery email.')}</p> : null}
            {!review ? <>
                <label className="block text-sm">{text('مرجع التحصيل', 'Collection reference')}<input className={input} value={reference} onChange={(e) => setReference(e.target.value)} maxLength={200} disabled={busy} /></label>
                <label className="block text-sm">{text('المبلغ المحصّل', 'Collected amount')}<input className={input} value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" dir="ltr" disabled={busy} /></label>
                <label className="block text-sm">{text('ملاحظة داخلية (اختياري)', 'Internal note (optional)')}<textarea className={input} value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} rows={2} disabled={busy} /></label>
                <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={collected} onChange={(e) => setCollected(e.target.checked)} disabled={busy} className="mt-1" />{text('أؤكد تحصيل كامل قيمة الطلب بالعملة المعروضة.', 'I confirm receipt of the full order amount in the displayed currency.')}</label>
                <p className="text-xs text-slate-500">{text('أدخل المبلغ المطابق للإجمالي ومرجع التحصيل للمراجعة.', 'Enter the full matching amount and collection reference to review.')}</p>
                <button type="button" className={button} disabled={busy || !request} onClick={() => { setReview(request); setError(''); }}>{text('مراجعة تأكيد التحصيل', 'Review collection confirmation')}</button>
            </> : <div className="space-y-3 rounded-lg bg-slate-50 p-3 text-sm">
                <p>{text('سجّل تحصيل', 'Record collection of')} <b dir="ltr">{review.currency} {review.amount}</b> {text('للطلب', 'for order')} <b className="break-all">{order.order_number}</b></p>
                <p className="break-all">{text('المرجع', 'Reference')}: <b>{review.reference}</b></p>
                {review.note ? <p className="break-words">{review.note}</p> : null}
                <p>{text('سيُسجل اسمك ووقت التأكيد في سجل الطلب.', 'Your name and the confirmation time will be recorded in the order history.')}</p>
                {uncertain ? <p role="status" className="text-amber-800">{text('لم تصل النتيجة. حدّث الحالة أو أعد تأكيد نفس المرجع؛ لن يُسجل التحصيل مرتين.', 'The result was not received. Refresh status or confirm the same reference again; collection will not be recorded twice.')}</p> : null}
                <div className="flex flex-wrap gap-2"><button type="button" className={`${button} bg-brand text-white`} disabled={busy} onClick={confirm}>{text('تأكيد تحصيل المبلغ', 'Confirm collected payment')}</button>{uncertain ? <button type="button" className={button} disabled={busy} onClick={refresh}>{text('تحديث حالة الدفع', 'Refresh payment status')}</button> : <button type="button" className={button} disabled={busy} onClick={() => setReview(null)}>{text('رجوع للمراجعة', 'Back to review')}</button>}</div>
            </div>}
        </>}
        {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
    </section>;
}
