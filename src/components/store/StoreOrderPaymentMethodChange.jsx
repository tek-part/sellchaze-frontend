import { useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';
import { paymentMethodChangeable } from '../../lib/order-deposit';

const button = 'rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold disabled:opacity-40';
const BLOCKERS = {
    order_archived: ['الطلب مؤرشف.', 'The order is archived.'],
    order_closed: ['تغيّرت حالة الطلب ولم يعد يقبل تغيير طريقة الدفع.', 'The order has moved on and its payment method can no longer change.'],
    payment_settled: ['تم الدفع بالفعل.', 'A payment was already made.'],
    currency_changed: ['عملة الطلب تختلف عن عملة المتجر الحالية.', 'The order currency differs from the store currency.'],
    shipment_exists: ['أُنشئت شحنة لهذا الطلب.', 'A shipment exists for this order.'],
    payment_in_progress: ['هناك عملية دفع قيد المعالجة.', 'A payment is being processed.'],
};
const METHOD_NAMES = { cod: ['الدفع عند الاستلام', 'Cash on delivery'], bank_transfer: ['تحويل بنكي', 'Bank transfer'], transfer_receipt: ['تحويل مع إيصال', 'Transfer with receipt'] };

/** G1 (TAR-036 #11): move an unpaid order (e.g. a failed online payment) to cash on delivery or a transfer. */
export default function StoreOrderPaymentMethodChange({ order, apiBase, onOrderUpdated }) {
    const { access } = useOutletContext() ?? {};
    const { i18n } = useTranslation();
    const ar = i18n.language.startsWith('ar');
    const text = (a, e) => ar ? a : e;
    const [options, setOptions] = useState(null);
    const [choice, setChoice] = useState('');
    const [note, setNote] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const working = useRef(false);
    if (!access?.canStoreOrders || !paymentMethodChangeable(order)) return null;
    const base = `${apiBase}/orders/${order.id}/payment`;
    const message = (e) => Object.values(e.response?.data?.errors || {}).flat().filter((value) => typeof value === 'string' && !BLOCKERS[value]).join(' ') || e.response?.data?.message || e.message;

    async function open() {
        if (working.current) return;
        working.current = true; setBusy(true); setError('');
        try {
            const { data } = await api.get(`${base}/methods`);
            setOptions(data.data); setChoice(data.data.methods[0]?.slug ?? '');
        } catch (e) { setError(message(e)); } finally { working.current = false; setBusy(false); }
    }
    async function save() {
        const selected = options?.methods.find((method) => method.slug === choice);
        if (working.current || !selected) return;
        working.current = true; setBusy(true); setError('');
        try {
            const { data } = await api.post(`${base}/method`, { payment_method: selected.slug, expected_grand_total: selected.grand_total, note: note.trim() || null });
            setOptions(null); setNote('');
            onOrderUpdated(data.data);
        } catch (e) {
            if (e.response?.status === 409) { setOptions(null); setError(text('تغيّر إجمالي الطلب. افتح الخيارات مرة أخرى لمراجعة الإجمالي الجديد.', 'The order total changed. Open the options again to review the new total.')); }
            else setError(message(e));
        } finally { working.current = false; setBusy(false); }
    }
    const name = (method) => METHOD_NAMES[method.slug]?.[ar ? 0 : 1] ?? method.name;
    const selected = options?.methods.find((method) => method.slug === choice);

    return <section aria-label={text('تغيير طريقة الدفع', 'Change payment method')} className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
        <h2 className="font-semibold">{text('تغيير طريقة الدفع', 'Change payment method')}</h2>
        <p className="text-sm text-slate-600">{text('إذا فشل الدفع الإلكتروني أو طلب العميل طريقة أخرى، انقل الطلب إلى الدفع عند الاستلام أو التحويل. يُعاد حساب رسوم طريقة الدفع ويُسجل التغيير في سجل الطلب.', 'If an online payment failed or the customer asked for another way to pay, move the order to cash on delivery or a transfer. Payment method fees are recalculated and the change is recorded in the order history.')}</p>
        {!options ? <button type="button" className={button} disabled={busy} onClick={open}>{text('عرض الطرق المتاحة', 'Show available methods')}</button> : options.blocker ? <p role="status" className="text-sm text-amber-800">{BLOCKERS[options.blocker]?.[ar ? 0 : 1] ?? options.blocker}</p> : !options.methods.length ? <p role="status" className="text-sm text-slate-600">{text('لا توجد طريقة دفع أخرى مفعّلة لهذا الطلب.', 'No other payment method is enabled for this order.')}</p> : <div className="space-y-3">
            <fieldset className="space-y-2 text-sm"><legend className="sr-only">{text('طريقة الدفع الجديدة', 'New payment method')}</legend>
                {options.methods.map((method) => <label key={method.slug} className="flex items-start gap-2"><input type="radio" name={`payment-method-${order.id}`} value={method.slug} checked={choice === method.slug} disabled={busy} onChange={() => setChoice(method.slug)} className="mt-1" />
                    <span><b>{name(method)}</b> · <bdi dir="ltr">{order.currency} {method.grand_total}</bdi>{Number(method.payment_adjustment_total) !== 0 ? <span className="text-slate-500"> ({text('رسوم/خصم الطريقة', 'method fee/discount')} <bdi dir="ltr">{method.payment_adjustment_total}</bdi>)</span> : null}
                        {method.deposit ? <span className="block text-slate-500">{text('عربون', 'Deposit')} <bdi dir="ltr">{method.deposit.amount}</bdi> · {text('المتبقي عند الاستلام', 'remaining on delivery')} <bdi dir="ltr">{method.deposit.remaining}</bdi></span> : null}
                        {method.deposit_removed ? <span className="block text-amber-700">{text('يُلغى العربون ويُدفع المبلغ كله عند الاستلام.', 'The deposit is waived; the whole amount is paid on delivery.')}</span> : null}</span></label>)}
            </fieldset>
            {selected && order.grand_total !== selected.grand_total ? <p className="text-sm">{text('الإجمالي', 'Total')}: <bdi dir="ltr">{order.currency} {order.grand_total}</bdi> → <b dir="ltr">{order.currency} {selected.grand_total}</b></p> : null}
            <p className="text-xs text-slate-500">{text('إذا أكمل العميل الدفع الإلكتروني السابق لاحقًا فلن يُطبّق تلقائيًا؛ راجع لوحة مزود الدفع.', 'If the customer still completes the earlier online payment it is not applied automatically; check your payment provider dashboard.')}</p>
            <label className="block text-sm">{text('ملاحظة داخلية (اختياري)', 'Internal note (optional)')}<textarea className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} rows={2} disabled={busy} /></label>
            <div className="flex flex-wrap gap-2"><button type="button" className="ws-order-primary-button disabled:opacity-40" disabled={busy || !selected} onClick={save}>{text('تغيير طريقة الدفع', 'Change payment method')}</button><button type="button" className={button} disabled={busy} onClick={() => setOptions(null)}>{text('إلغاء', 'Cancel')}</button></div>
        </div>}
        {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
    </section>;
}
