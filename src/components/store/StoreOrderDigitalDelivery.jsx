import { useCallback, useEffect, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';

const button = 'rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold disabled:opacity-40';
const states = {
    not_scheduled: ['لم تتم الجدولة', 'Not scheduled'], queued: ['بانتظار الإرسال', 'Queued'], retrying: ['تجري إعادة محاولة البريد', 'Retrying email'],
    failed: ['تعذر الإرسال بعد المحاولات', 'Email retries exhausted'], sent: ['تم التسليم لخدمة البريد', 'Handed to mail service'],
    accepted: ['قبلها مزوّد واتساب؛ الوصول للعميل غير مؤكد', 'WhatsApp provider accepted; recipient delivery not confirmed'],
    sending: ['محاولة واتساب قيد التنفيذ', 'WhatsApp attempt in progress'], unknown: ['النتيجة غير مؤكدة؛ تحقق لدى المزوّد قبل إعادة الإرسال', 'Outcome uncertain; check with the provider before sending again'],
    rejected: ['رفض مزوّد واتساب الرسالة', 'WhatsApp provider rejected the message'], invalid: ['تعذر الإرسال؛ راجع الرقم الدولي وحجم الرسالة', 'Unable to send; check international number and message length'],
    skipped: ['تجاوزته إعدادات القناة أو حالة الطلب', 'Skipped for channel settings or order state'], processed: ['تمت المعالجة', 'Processed'],
};

export default function StoreOrderDigitalDelivery({ order, apiBase, onOrderUpdated }) {
    const { access } = useOutletContext() ?? {};
    const { i18n } = useTranslation();
    const ar = i18n.language.startsWith('ar');
    const text = (a, e) => ar ? a : e;
    const allowed = Boolean(access?.canStoreOrders);
    const endpoint = `${apiBase}/orders/${order.id}/digital-delivery`;
    const [rows, setRows] = useState([]);
    const [error, setError] = useState('');
    const [review, setReview] = useState(null);
    const [busy, setBusy] = useState(false);
    const [uncertain, setUncertain] = useState(false);
    const [queued, setQueued] = useState(false);
    const revision = useRef(0);
    const working = useRef(false);
    const load = useCallback(async () => {
        const current = ++revision.current;
        try { const { data } = await api.get(endpoint); if (current === revision.current) { setRows(data.data); setError(''); } }
        catch (e) { if (current === revision.current) setError(e.response?.data?.message || e.message); }
    }, [endpoint]);
    useEffect(() => { if (allowed) load(); const tracker = revision; return () => { tracker.current++; }; }, [allowed, load, order.payment_status, order.status]);
    async function send() {
        if (!review || working.current) return;
        working.current = true; setBusy(true); setError('');
        try {
            const { data } = await api.post(`${endpoint}/email`, review);
            revision.current++; setRows(data.data); setReview(null); setUncertain(false); setQueued(true); onOrderUpdated?.();
        } catch (e) {
            if (e.response?.status >= 400 && e.response?.status < 500) { setReview(null); setUncertain(false); await load(); }
            else setUncertain(true);
            setError(Object.values(e.response?.data?.errors || {}).flat().join(' ') || e.response?.data?.message || e.message);
        } finally { working.current = false; setBusy(false); }
    }
    if (!allowed || (!rows.length && !error)) return null;
    return <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5" aria-label={text('تسليم كل منتج رقمي', 'Per-product digital delivery')}>
        <header className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold">{text('تسليم كل منتج رقمي', 'Per-product digital delivery')}</h2><button className={button} disabled={busy} onClick={load}>{text('تحديث حالة التسليم', 'Refresh delivery status')}</button></header>
        {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
        {queued ? <p role="status" className="text-sm text-emerald-800">{text('تمت جدولة بريد هذا المنتج فقط.', 'Only this product email was queued.')}</p> : null}
        {rows.map((row) => <article key={`${row.item_id}-${row.channel}`} className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
            <div className="min-w-0 space-y-1"><h3 className="font-semibold">{row.product_name} • {row.channel === 'email' ? text('البريد', 'Email') : text('واتساب', 'WhatsApp')}</h3>
                <p className="break-all text-sm text-slate-600">{row.recipient || '—'}</p><p className="text-sm">{(states[row.state] ?? states.processed)[ar ? 0 : 1]}</p>
                {row.sent_at ? <p className="text-xs text-slate-500">{new Date(row.sent_at).toLocaleString(i18n.language)}</p> : null}
                {row.provider_reference ? <p className="break-all text-xs text-slate-500">{text('مرجع المزوّد', 'Provider reference')}: {row.provider_reference}</p> : null}
            </div>
            {row.can_resend && !review ? <button className={button} disabled={busy} onClick={() => { setQueued(false); setError(''); setReview({ item_id: row.item_id, message_id: row.message_id, request_key: crypto.randomUUID() }); }}>{text('مراجعة إرسال هذا المنتج', 'Review this product email')}</button> : null}
        </article>)}
        {review ? <div className="space-y-3 rounded-xl bg-slate-50 p-4"><p>{text('سيُرسل هذا المنتج فقط إلى بريد العميل المسجل بالطلب:', 'Send only this product to the customer email saved on the order:')} <b className="break-all">{order.customer?.email}</b></p>
            {uncertain ? <p role="status" className="text-sm text-amber-800">{text('لم تصل النتيجة؛ أعد المحاولة لتأكيد نفس الإرسال.', 'Result not received; retry to confirm the same send.')}</p> : null}
            <div className="flex flex-wrap gap-2"><button className={button} disabled={busy} onClick={send}>{busy ? text('جارٍ الجدولة…', 'Scheduling…') : uncertain ? text('تأكيد نتيجة الإرسال', 'Confirm send result') : text('تأكيد جدولة البريد', 'Confirm email scheduling')}</button>{!uncertain ? <button className={button} disabled={busy} onClick={() => setReview(null)}>{text('إلغاء', 'Cancel')}</button> : null}</div>
        </div> : null}
    </section>;
}
