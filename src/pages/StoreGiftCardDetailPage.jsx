import { useCallback, useEffect, useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import useStoreScope from '../hooks/useStoreScope';
import api from '../api/client';
import { giftCardAdjustPayload, giftCardReasonLabel, giftCardStateLabel, maskGiftCardCode } from '../features/store/giftCards';

const FIELD = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-xs outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20';
const LABEL = 'mb-1 block text-sm font-medium text-slate-700';
const CARD = 'min-w-0 space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card';
const HEADING = 'text-base font-semibold text-slate-900';
const BUTTON = 'rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50';
const BADGE = { active: 'bg-emerald-50 text-emerald-800 ring-emerald-200', expired: 'bg-amber-50 text-amber-800 ring-amber-200', disabled: 'bg-slate-100 text-slate-700 ring-slate-200', depleted: 'bg-slate-100 text-slate-700 ring-slate-200' };

/** One gift card: balance, ledger, enable/disable, expiry and note, and logged balance adjustments. */
export default function StoreGiftCardDetailPage() {
    const { giftCardId } = useParams();
    const { apiBase, uiBase } = useStoreScope();
    const { store, access } = useOutletContext() ?? {};
    // Discount managers can look; issuing, adjusting and disabling needs store.gift_cards.manage.
    const canManage = access?.canManageGiftCards ?? true;
    const { i18n } = useTranslation();
    const ar = i18n.language?.startsWith('ar'); const text = (a, e) => (ar ? a : e);
    const [card, setCard] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [error, setError] = useState('');
    const [details, setDetails] = useState({ expires_at: '', note: '' });
    const [adjust, setAdjust] = useState({ direction: 'add', amount: '', reason: '' });
    const [busy, setBusy] = useState('');

    const money = (value) => new Intl.NumberFormat(ar ? 'ar-EG' : 'en', { style: 'currency', currency: card?.currency || store?.currency || 'EGP', maximumFractionDigits: 2 }).format(Number(value));
    const fmtDate = (d, time = false) => (d ? new Date(d)[time ? 'toLocaleString' : 'toLocaleDateString'](ar ? 'ar-EG' : 'en') : '—');

    const apply = useCallback((data) => {
        setCard(data.data);
        if (data.transactions) setTransactions(data.transactions);
        setDetails({ expires_at: data.data.expires_at ? String(data.data.expires_at).slice(0, 10) : '', note: data.data.note ?? '' });
    }, []);
    const load = useCallback(() => api.get(`${apiBase}/gift-cards/${giftCardId}`).then(({ data }) => apply(data)), [apiBase, giftCardId, apply]);
    useEffect(() => {
        setError('');
        load().catch((e) => setError(e.response?.data?.message || e.message));
    }, [load]);

    const run = async (key, request, done) => {
        setBusy(key);
        try {
            await request();
            await load();
            toast.success(done);
            return true;
        } catch (e) {
            const errors = e.response?.data?.errors;
            toast.error((errors && Object.values(errors)[0]?.[0]) || e.response?.data?.message || e.message);
            return false;
        } finally {
            setBusy('');
        }
    };

    if (error) return <section className="mx-auto max-w-4xl space-y-4"><p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p><Link to={`${uiBase}/gift-cards`} className="text-sm font-medium text-slate-700">{text('العودة إلى بطاقات الهدايا', 'Back to gift cards')}</Link></section>;
    if (!card) return <p className="p-6 text-sm text-slate-600" role="status">{text('جارٍ التحميل…', 'Loading…')}</p>;

    const enabled = card.status === 'active';
    const adjustBody = giftCardAdjustPayload(adjust.direction, adjust.amount, adjust.reason);

    return (
        <section className="mx-auto max-w-5xl space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                    <Link to={`${uiBase}/gift-cards`} className="text-sm font-medium text-slate-700 hover:text-slate-900">{ar ? '→' : '←'} {text('بطاقات الهدايا', 'Gift cards')}</Link>
                    <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{text('بطاقة هدية', 'Gift card')} <bdi className="font-mono" dir="ltr">{maskGiftCardCode(card.last4)}</bdi></h1>
                </div>
                <span className={`rounded-full px-3 py-1 text-sm font-medium ring-1 ${BADGE[card.state] ?? BADGE.disabled}`} data-gift-card-state>{giftCardStateLabel(card.state, ar)}</span>
            </div>

            <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="min-w-0 space-y-5">
                    <section className={CARD} aria-labelledby="gift-card-balance">
                        <h2 id="gift-card-balance" className={HEADING}>{text('الرصيد', 'Balance')}</h2>
                        <p className="text-3xl font-semibold tabular-nums text-slate-900" data-gift-card-balance>{money(card.balance)}</p>
                        <p className="text-sm text-slate-600">{text('القيمة الأصلية', 'Initial value')}: {money(card.initial_value)}</p>
                    </section>

                    {canManage ? <section className={CARD} aria-labelledby="gift-card-adjust">
                        <h2 id="gift-card-adjust" className={HEADING}>{text('تعديل الرصيد', 'Adjust balance')}</h2>
                        <form className="space-y-4" onSubmit={async (event) => {
                            event.preventDefault();
                            if (!adjustBody) return;
                            if (await run('adjust', () => api.post(`${apiBase}/gift-cards/${card.id}/adjust`, adjustBody), text('تم تعديل الرصيد', 'Balance adjusted'))) setAdjust({ direction: 'add', amount: '', reason: '' });
                        }}>
                            <fieldset className="flex flex-wrap gap-x-5 gap-y-2">
                                <legend className="sr-only">{text('نوع التعديل', 'Adjustment type')}</legend>
                                {[['add', text('إضافة رصيد', 'Add to balance')], ['remove', text('خصم من الرصيد', 'Remove from balance')]].map(([value, label]) => (
                                    <label key={value} className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                                        <input type="radio" name="adjust_direction" value={value} checked={adjust.direction === value} onChange={() => setAdjust((a) => ({ ...a, direction: value }))} className="accent-brand" />{label}
                                    </label>
                                ))}
                            </fieldset>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="min-w-0">
                                    <label className={LABEL} htmlFor="gift-card-adjust-amount">{text('المبلغ', 'Amount')} ({card.currency})</label>
                                    <input id="gift-card-adjust-amount" className={FIELD} type="number" inputMode="decimal" min="0.01" step="0.01" required value={adjust.amount} onChange={(e) => setAdjust((a) => ({ ...a, amount: e.target.value }))} />
                                </div>
                                <div className="min-w-0">
                                    <label className={LABEL} htmlFor="gift-card-adjust-reason">{text('السبب', 'Reason')}</label>
                                    <input id="gift-card-adjust-reason" className={FIELD} required maxLength={500} value={adjust.reason} onChange={(e) => setAdjust((a) => ({ ...a, reason: e.target.value }))} />
                                </div>
                            </div>
                            <p className="text-xs text-slate-600">{text('يُسجَّل كل تعديل مع السبب واسمك في سجل البطاقة. لا يمكن أن يصبح الرصيد سالبًا.', 'Every adjustment is logged with its reason and your name. The balance can never go below zero.')}</p>
                            <button type="submit" className={BUTTON} disabled={!adjustBody || busy === 'adjust'}>{busy === 'adjust' ? '…' : text('حفظ التعديل', 'Save adjustment')}</button>
                        </form>
                    </section> : null}

                    <section className={CARD} aria-labelledby="gift-card-history">
                        <h2 id="gift-card-history" className={HEADING}>{text('السجل', 'History')}</h2>
                        {transactions.length ? <div className="overflow-x-auto">
                            <table className="w-full min-w-[520px] text-start text-sm">
                                <thead className="text-xs text-slate-600"><tr>
                                    <th scope="col" className="py-2 text-start font-medium">{text('التاريخ', 'Date')}</th>
                                    <th scope="col" className="py-2 text-start font-medium">{text('الحركة', 'Activity')}</th>
                                    <th scope="col" className="py-2 text-end font-medium">{text('المبلغ', 'Amount')}</th>
                                    <th scope="col" className="py-2 text-end font-medium">{text('الرصيد بعدها', 'Balance after')}</th>
                                </tr></thead>
                                <tbody className="divide-y divide-slate-100">
                                    {transactions.map((row) => <tr key={row.id} data-gift-card-transaction={row.reason}>
                                        <td className="py-2.5 pe-3 align-top text-slate-700">{fmtDate(row.created_at, true)}</td>
                                        <td className="py-2.5 pe-3 align-top text-slate-900">
                                            {giftCardReasonLabel(row.reason, ar)}
                                            {row.store_order_id ? <> · <Link className="font-medium text-slate-900 underline" to={`${uiBase}/orders/${row.store_order_id}`}>{row.order_number || `#${row.store_order_id}`}</Link></> : null}
                                            {row.note ? <span className="block text-xs text-slate-600">{row.note}</span> : null}
                                            {row.actor_name ? <span className="block text-xs text-slate-600">{text('بواسطة', 'By')} {row.actor_name}</span> : null}
                                        </td>
                                        <td className={`py-2.5 pe-3 text-end align-top tabular-nums ${Number(row.amount) < 0 ? 'text-red-700' : 'text-emerald-700'}`} dir="ltr">{Number(row.amount) < 0 ? '−' : '+'}{money(Math.abs(Number(row.amount)))}</td>
                                        <td className="py-2.5 text-end align-top tabular-nums text-slate-700" dir="ltr">{money(row.balance_after)}</td>
                                    </tr>)}
                                </tbody>
                            </table>
                        </div> : <p className="text-sm text-slate-600">{text('لا توجد حركات بعد.', 'No activity yet.')}</p>}
                    </section>
                </div>

                <div className="min-w-0 space-y-5">
                    <section className={CARD} aria-labelledby="gift-card-status">
                        <h2 id="gift-card-status" className={HEADING}>{text('الحالة', 'Status')}</h2>
                        <p className="text-sm text-slate-600">{enabled ? text('البطاقة قابلة للاستخدام عند الدفع.', 'The card can be used at checkout.') : text('البطاقة معطلة ولا يمكن استخدامها.', 'The card is disabled and cannot be used.')}</p>
                        {canManage ? <>
                        <button type="button" className={enabled ? 'rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50' : BUTTON} disabled={busy === 'status'}
                            onClick={() => void run('status', () => api.put(`${apiBase}/gift-cards/${card.id}`, { status: enabled ? 'disabled' : 'active' }), enabled ? text('تم تعطيل البطاقة', 'Gift card disabled') : text('تم تفعيل البطاقة', 'Gift card enabled'))}>
                            {enabled ? text('تعطيل البطاقة', 'Disable gift card') : text('تفعيل البطاقة', 'Enable gift card')}
                        </button>
                        </> : null}
                    </section>

                    <section className={CARD} aria-labelledby="gift-card-details">
                        <h2 id="gift-card-details" className={HEADING}>{text('التفاصيل', 'Details')}</h2>
                        <dl className="space-y-2 text-sm">
                            <div><dt className="text-slate-600">{text('العميل', 'Customer')}</dt><dd className="text-slate-900">{[card.customer_name, card.customer_email, card.customer_phone].filter(Boolean).join(' · ') || '—'}</dd></div>
                            <div><dt className="text-slate-600">{text('تاريخ الإصدار', 'Issued')}</dt><dd className="text-slate-900">{fmtDate(card.created_at)}</dd></div>
                        </dl>
                        {canManage ? <>
                        <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); void run('details', () => api.put(`${apiBase}/gift-cards/${card.id}`, { expires_at: details.expires_at || null, note: details.note.trim() || null }), text('تم الحفظ', 'Saved')); }}>
                            <div>
                                <label className={LABEL} htmlFor="gift-card-expiry">{text('تاريخ الانتهاء', 'Expiry date')}</label>
                                <input id="gift-card-expiry" className={FIELD} type="date" value={details.expires_at} onChange={(e) => setDetails((d) => ({ ...d, expires_at: e.target.value }))} />
                            </div>
                            <div>
                                <label className={LABEL} htmlFor="gift-card-detail-note">{text('ملاحظة داخلية', 'Internal note')}</label>
                                <textarea id="gift-card-detail-note" className={FIELD} rows={3} maxLength={1000} value={details.note} onChange={(e) => setDetails((d) => ({ ...d, note: e.target.value }))} />
                            </div>
                            <button type="submit" className={BUTTON} disabled={busy === 'details'}>{busy === 'details' ? '…' : text('حفظ', 'Save')}</button>
                        </form>
                        </> : <p className="text-sm text-slate-600">{text('تاريخ الانتهاء', 'Expiry date')}: {fmtDate(card.expires_at)}{card.note ? ` · ${card.note}` : ''}</p>}
                    </section>
                </div>
            </div>
        </section>
    );
}
