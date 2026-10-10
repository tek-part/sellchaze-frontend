import { useCallback, useEffect, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';

const button = 'rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold disabled:opacity-40';
const states = {
    not_scheduled: ['لم تتم الجدولة', 'Not scheduled'], queued: ['بانتظار الإرسال', 'Queued'],
    retrying: ['تجري إعادة المحاولة تلقائيًا', 'Retrying automatically'], failed: ['تعذر الإرسال بعد المحاولات التلقائية', 'Automatic retries exhausted'],
    sent: ['تم تسليمه لخدمة البريد', 'Handed to mail service'], skipped: ['تجاوزته حالة الطلب الحالية', 'Skipped for the current order state'],
    processed: ['تمت معالجة الإرسال', 'Processed'],
};

export default function StoreOrderDigitalEmail({ order, apiBase, onOrderUpdated }) {
    const { access } = useOutletContext() ?? {};
    const { i18n } = useTranslation();
    const ar = i18n.language.startsWith('ar');
    const text = (a, e) => ar ? a : e;
    const allowed = Boolean(access?.canStoreOrders);
    const endpoint = `${apiBase}/orders/${order.id}/digital-email`;
    const [rows, setRows] = useState(null);
    const [error, setError] = useState('');
    const [review, setReview] = useState(null);
    const [busy, setBusy] = useState(false);
    const [queued, setQueued] = useState(false);
    const [uncertain, setUncertain] = useState(false);
    const generation = useRef(0);
    const working = useRef(false);
    const load = useCallback(async () => {
        const revision = ++generation.current;
        try {
            const { data } = await api.get(endpoint);
            if (revision === generation.current) { setRows(data.data); setError(''); setQueued(false); }
        } catch (e) {
            if (revision === generation.current) setError(e.response?.data?.message || e.message);
        }
    }, [endpoint]);
    useEffect(() => {
        if (allowed) load();
        const tracker = generation;
        return () => { tracker.current++; };
    }, [allowed, load, order.payment_status, order.status]);

    async function send() {
        if (working.current || !review) return;
        working.current = true; setBusy(true); setError('');
        try {
            const { data } = await api.post(endpoint, review);
            generation.current++; setRows(data.data); setReview(null); setUncertain(false); setQueued(true);
            onOrderUpdated?.();
        } catch (e) {
            // A lost response may already have queued an email. Retain this exact
            // request key until replay confirms the result, including status refresh.
            const definite = e.response?.status >= 400 && e.response?.status < 500;
            if (definite) { setReview(null); setUncertain(false); await load(); }
            else setUncertain(true);
            setError(Object.values(e.response?.data?.errors || {}).flat().join(' ') || e.response?.data?.message || e.message);
        } finally { working.current = false; setBusy(false); }
    }

    if (!allowed) return null;
    return <section className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card" aria-label={text('بريد الطلب الرقمي', 'Digital order email')}>
        <header className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold">{text('بريد الطلب الرقمي', 'Digital order email')}</h2><button className={button} disabled={busy} onClick={load}>{text('تحديث الحالة', 'Refresh status')}</button></header>
        <p className="break-all text-sm text-slate-600">{text('المستلم', 'Recipient')}: {order.customer?.email}</p>
        {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
        {queued ? <p role="status" className="text-sm text-emerald-700">{text('تمت جدولة البريد. حدّث الحالة لمتابعة الإرسال.', 'Email queued. Refresh status to follow delivery.')}</p> : null}
        {!rows && !error ? <p>{text('جارٍ تحميل الحالة…', 'Loading status…')}</p> : null}
        {rows?.map((row) => <div key={row.kind} className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
            <div className="space-y-1"><h3 className="text-sm font-semibold">{row.kind === 'receipt' ? text('الإيصال وتعليمات الدفع', 'Receipt and payment instructions') : text('تسليم المنتجات الرقمية', 'Digital product delivery')}</h3>
                <p className="text-sm text-slate-600">{(states[row.state] || states.processed)[ar ? 0 : 1]}</p>
                {row.sent_at ? <p className="text-xs text-slate-500">{new Date(row.sent_at).toLocaleString(i18n.language)}</p> : null}
                {row.next_attempt_at && row.state === 'retrying' ? <p className="text-xs text-slate-500">{text('المحاولة التالية', 'Next attempt')}: {new Date(row.next_attempt_at).toLocaleString(i18n.language)}</p> : null}
                {row.resend_after ? <p className="text-xs text-slate-500">{text('إعادة الإرسال متاحة بعد', 'Resend available after')}: {new Date(row.resend_after).toLocaleString(i18n.language)}</p> : null}
            </div>
            {row.can_send && !review ? <button className={button} disabled={busy} onClick={() => { setQueued(false); setError(''); setReview({ kind: row.kind, message_id: row.id, request_key: crypto.randomUUID() }); }}>{text('مراجعة الإرسال', 'Review send')}</button> : null}
        </div>)}
        {review ? <div className="space-y-3 rounded-xl bg-slate-50 p-4"><p className="text-sm">{review.kind === 'receipt' ? text('سيُرسل الإيصال الخاص وتعليمات الدفع إلى', 'Send the private receipt and payment instructions to') : text('ستُرسل المنتجات الرقمية المدفوعة والرابط الخاص إلى', 'Send paid digital products and the private link to')} <b className="break-all">{order.customer?.email}</b></p>
            {uncertain ? <p role="status" className="text-sm text-amber-800">{text('لم تصل نتيجة الطلب. أعد المحاولة لتأكيد نفس الإرسال.', 'The request result was not received. Retry to confirm the same send.')}</p> : null}
            <div className="flex flex-wrap gap-2"><button className={button} disabled={busy} onClick={send}>{busy ? text('جارٍ الجدولة…', 'Scheduling…') : uncertain ? text('تأكيد نتيجة الإرسال', 'Confirm send result') : text('تأكيد جدولة البريد', 'Confirm email scheduling')}</button>{!uncertain ? <button className={button} disabled={busy} onClick={() => setReview(null)}>{text('إلغاء', 'Cancel')}</button> : null}</div>
        </div> : null}
    </section>;
}
