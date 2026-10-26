import { useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';
import { orderDeposit, remainderCollectionRequest } from '../../lib/order-deposit';

const button = 'rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold disabled:opacity-40';
const input = 'mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50';
const CLOSED = ['cancelled', 'returning_from_delivery', 'request_refund', 'refund_in_progress', 'refunded'];

/** G1 (TAR-036 #1): a deposit order's paid deposit and the remainder recorded as collected on delivery. */
export default function StoreOrderDepositPayment({ order, apiBase, onOrderUpdated }) {
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
    const working = useRef(false);
    const deposit = orderDeposit(order);
    if (!deposit) return null;
    const money = (value) => <b dir="ltr">{order.currency} {value}</b>;
    const closed = CLOSED.includes(order.status);
    const canCollect = access?.canStoreOrders && deposit.paid && !deposit.remainder_collected && Number(deposit.remaining) > 0 && !closed;
    const request = remainderCollectionRequest(order, reference, amount, collected, note);

    async function confirm() {
        if (working.current || !review) return;
        working.current = true; setBusy(true); setError('');
        try {
            const { data } = await api.post(`${apiBase}/orders/${order.id}/payment/collect-remainder`, review);
            setReview(null); setReference(''); setAmount(''); setCollected(false); setNote('');
            onOrderUpdated(data.data);
        } catch (e) {
            setError(Object.values(e.response?.data?.errors || {}).flat().join(' ') || e.response?.data?.message || text('تعذر تسجيل التحصيل. حدّث الطلب ثم حاول مرة أخرى؛ لن يُسجل المبلغ مرتين بنفس المرجع.', 'The collection could not be recorded. Refresh the order and try again; the same reference is never recorded twice.'));
        } finally { working.current = false; setBusy(false); }
    }

    return <section aria-label={text('العربون والمبلغ المتبقي', 'Deposit and remaining amount')} className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
        <h2 className="font-semibold">{text('العربون والمبلغ المتبقي', 'Deposit and remaining amount')}</h2>
        <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-slate-500">{text('العربون', 'Deposit')}</dt><dd>{money(deposit.amount)} · {deposit.paid ? <span className="text-emerald-700">{text('مدفوع', 'Paid')}</span> : <span className="text-amber-700">{text('بانتظار الدفع', 'Awaiting payment')}</span>}</dd>
            <dt className="text-slate-500">{text('المتبقي عند الاستلام', 'Remaining on delivery')}</dt><dd>{money(deposit.remaining)} · {deposit.remainder_collected ? <span className="text-emerald-700">{text('تم التحصيل', 'Collected')}</span> : <span>{text('لم يُحصّل بعد', 'Not collected yet')}</span>}</dd>
        </dl>
        {!deposit.paid && deposit.confirm_after_payment ? <p className="text-sm text-amber-800">{text('لا يمكن تأكيد هذا الطلب قبل دفع العربون.', 'This order cannot be confirmed before its deposit is paid.')}</p> : null}
        {canCollect ? (!review ? <>
            <p className="text-sm text-slate-600">{text('بعد التسليم، سجّل تحصيل المبلغ المتبقي كاملًا بعد مراجعة كشف التحصيل.', 'After delivery, record the full remaining amount once you have checked the collection statement.')}</p>
            <label className="block text-sm">{text('مرجع التحصيل', 'Collection reference')}<input className={input} value={reference} onChange={(e) => setReference(e.target.value)} maxLength={200} disabled={busy} /></label>
            <label className="block text-sm">{text('المبلغ المحصّل', 'Collected amount')}<input className={input} value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" dir="ltr" disabled={busy} /></label>
            <label className="block text-sm">{text('ملاحظة داخلية (اختياري)', 'Internal note (optional)')}<textarea className={input} value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} rows={2} disabled={busy} /></label>
            <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={collected} onChange={(e) => setCollected(e.target.checked)} disabled={busy} className="mt-1" />{text('أؤكد تحصيل كامل المبلغ المتبقي بالعملة المعروضة.', 'I confirm receipt of the full remaining amount in the displayed currency.')}</label>
            <button type="button" className={button} disabled={busy || !request} onClick={() => { setReview(request); setError(''); }}>{text('مراجعة تسجيل المتبقي', 'Review remaining amount')}</button>
        </> : <div className="space-y-3 rounded-lg bg-slate-50 p-3 text-sm">
            <p>{text('سجّل تحصيل', 'Record collection of')} <b dir="ltr">{review.currency} {review.amount}</b> {text('للطلب', 'for order')} <b className="break-all">{order.order_number}</b></p>
            <p className="break-all">{text('المرجع', 'Reference')}: <b>{review.reference}</b></p>
            <div className="flex flex-wrap gap-2"><button type="button" className="ws-order-primary-button disabled:opacity-40" disabled={busy} onClick={confirm}>{text('تأكيد تحصيل المتبقي', 'Confirm remaining amount collected')}</button><button type="button" className={button} disabled={busy} onClick={() => setReview(null)}>{text('رجوع', 'Back')}</button></div>
        </div>) : null}
        {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
    </section>;
}
