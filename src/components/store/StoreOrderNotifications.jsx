import { useCallback, useEffect, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';
import { maskRecipient, resendTargets } from '../../features/store/notifications';

const button = 'rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold disabled:opacity-40';
const errorText = (error) => error.response?.status === 429
    ? null
    : Object.values(error.response?.data?.errors || {}).flat().join(' ') || error.response?.data?.message || error.message;
const ORDER_NOTIFICATION_EVENTS = {
    order_confirmation: ['استلام الطلب', 'Order confirmation'], order_confirmed: ['تأكيد الطلب', 'Order confirmed'],
    shipping_confirmation: ['تأكيد الشحن', 'Shipping confirmation'], order_delivered: ['تم التوصيل', 'Order delivered'],
    order_cancelled: ['إلغاء الطلب', 'Order cancelled'], order_refunded: ['استرداد المبلغ', 'Order refunded'],
    staff_new_order: ['طلب جديد للموظفين', 'New order (staff)'],
};
const CUSTOMER_EVENTS = new Set(Object.keys(ORDER_NOTIFICATION_EVENTS).filter((key) => key !== 'staff_new_order'));
const states = {
    sent: ['أُرسل', 'Sent', 'bg-emerald-50 text-emerald-800'], queued: ['في الانتظار', 'Queued', 'bg-slate-100 text-slate-700'],
    skipped: ['تم التخطي', 'Skipped', 'bg-slate-100 text-slate-600'], failed: ['فشل', 'Failed', 'bg-red-50 text-red-700'],
    accepted: ['قبله مزوّد واتساب', 'Accepted by provider', 'bg-sky-50 text-sky-800'], rejected: ['رفضه المزوّد', 'Rejected', 'bg-red-50 text-red-700'],
    unknown: ['النتيجة غير مؤكدة', 'Outcome unknown', 'bg-amber-50 text-amber-800'],
};
const channelLabel = (channel, ar) => channel === 'whatsapp' ? (ar ? 'واتساب' : 'WhatsApp') : (ar ? 'البريد' : 'Email');

export default function StoreOrderNotifications({ order, apiBase }) {
    const { access } = useOutletContext() ?? {};
    const { i18n } = useTranslation();
    const ar = i18n.language.startsWith('ar');
    const text = (a, e) => ar ? a : e;
    const allowed = Boolean(access?.canStoreOrders);
    const endpoint = `${apiBase}/orders/${order.id}/notifications`;
    const [rows, setRows] = useState(null);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [review, setReview] = useState(null);
    const [busy, setBusy] = useState(false);
    const revision = useRef(0);
    const working = useRef(false);
    const label = (event) => ORDER_NOTIFICATION_EVENTS[event]?.[ar ? 0 : 1] ?? event;
    const load = useCallback(async () => {
        const current = ++revision.current;
        try { const { data } = await api.get(endpoint); if (current === revision.current) { setRows(data.data ?? []); setError(''); } }
        catch (e) { if (current === revision.current) setError(e.response?.data?.message || e.message); }
    }, [endpoint]);
    useEffect(() => { if (allowed) load(); const tracker = revision; return () => { tracker.current++; }; }, [allowed, load, order.status]);
    async function resend() {
        if (!review || working.current) return;
        working.current = true; setBusy(true); setError(''); setNotice('');
        try {
            await api.post(`${endpoint}/resend`, review);
            setNotice(text(`تمت جدولة إعادة إرسال «${label(review.event)}» عبر ${channelLabel(review.channel, true)}.`, `“${label(review.event)}” was queued again by ${channelLabel(review.channel, false)}.`));
            setReview(null); await load();
        } catch (e) {
            setError(errorText(e) ?? text('أعدت الإرسال عدة مرات مؤخرًا. انتظر قليلًا ثم حاول مجددًا.', 'Resent too often recently. Wait a little and try again.'));
        } finally { working.current = false; setBusy(false); }
    }
    if (!allowed) return null;
    const targets = rows ? resendTargets(rows, CUSTOMER_EVENTS) : [];
    const uncertain = review && rows?.some((row) => row.event === review.event && row.channel === review.channel && ['unknown', 'accepted', 'queued'].includes(row.state));
    return <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5" aria-labelledby={`order-${order.id}-notifications`}>
        <header className="flex flex-wrap items-center justify-between gap-3"><h2 id={`order-${order.id}-notifications`} className="font-semibold">{text('الإشعارات', 'Notifications')}</h2><button type="button" className={button} disabled={busy} onClick={() => void load()}>{text('تحديث', 'Refresh')}</button></header>
        {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
        {notice ? <p role="status" className="text-sm text-emerald-800">{notice}</p> : null}
        {!rows && !error ? <p role="status" className="text-sm text-slate-500">{text('جارٍ التحميل…', 'Loading…')}</p> : null}
        {rows && !rows.length ? <p className="text-sm text-slate-500">{text('لم تُرسل إشعارات لهذا الطلب بعد.', 'No notifications have been sent for this order yet.')}</p> : null}
        {rows?.length ? <ul className="divide-y divide-slate-100">{rows.map((row) => {
            const state = states[row.state] ?? states.unknown;
            const time = row.sent_at || row.created_at;
            return <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <div className="min-w-0"><p className="font-medium">{label(row.event)} <span className="text-slate-500">• {channelLabel(row.channel, ar)}</span></p>
                    <p className="text-xs text-slate-500"><bdi dir="ltr" className="break-all">{maskRecipient(row.recipient)}</bdi>{time ? <> · <time dateTime={time}>{new Date(time).toLocaleString(i18n.language)}</time></> : null}</p></div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${state[2]}`}>{state[ar ? 0 : 1]}</span>
            </li>;
        })}</ul> : null}
        {targets.length && !review ? <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">{targets.map((target) => <button key={`${target.event}:${target.channel}`} type="button" className={button} disabled={busy}
            onClick={() => { setNotice(''); setError(''); setReview(target); }}>{text('إعادة إرسال', 'Resend')}: {label(target.event)} • {channelLabel(target.channel, ar)}</button>)}</div> : null}
        {review ? <div className="space-y-3 rounded-xl bg-slate-50 p-4 text-sm">
            <p>{text(`سيُرسل «${label(review.event)}» مرة أخرى إلى العميل عبر ${channelLabel(review.channel, true)} بالقالب الحالي.`, `“${label(review.event)}” will be sent to the customer again by ${channelLabel(review.channel, false)} using the current template.`)}</p>
            {uncertain ? <p className="text-amber-800">{text('قد تكون الرسالة السابقة وصلت بالفعل؛ تأكد قبل الإرسال مرة أخرى.', 'The previous message may already have arrived; check before sending again.')}</p> : null}
            <div className="flex flex-wrap gap-2"><button type="button" className={`${button} border-emerald-600 bg-emerald-600 text-white`} disabled={busy} onClick={resend}>{busy ? text('جارٍ الجدولة…', 'Queuing…') : text('تأكيد إعادة الإرسال', 'Confirm resend')}</button><button type="button" className={button} disabled={busy} onClick={() => setReview(null)}>{text('إلغاء', 'Cancel')}</button></div>
        </div> : null}
    </section>;
}
