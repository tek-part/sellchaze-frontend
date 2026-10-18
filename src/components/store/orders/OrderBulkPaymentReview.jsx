import { useEffect, useRef, useState } from 'react';
import api from '../../../api/client';
import PaymentMethodLogo from '../../../shared/payments/PaymentMethodLogo';

const reasons = {
    order_closed: ['الطلب ملغي أو ضمن مراحل الإرجاع.', 'The order is cancelled or in a return stage.'],
    provider_controls: ['تحدد بوابة الدفع الإلكترونية نتيجة هذه المعاملة.', 'The online payment provider controls this transaction.'],
    settled_payment: ['يوجد تحصيل مسجل؛ لا يمكن إعادته إلى حالة غير مدفوعة.', 'A collection is recorded; it cannot be changed to unpaid.'],
    missing_transaction: ['لا توجد معاملة دفع مسجلة لهذا الطلب.', 'No payment transaction is recorded for this order.'],
    amount_changed: ['مبلغ المعاملة أو عملتها لا يطابق الطلب.', 'The transaction amount or currency differs from the order.'],
    processing_payment: ['حالة المعاملة الحالية لا تسمح بهذا التحديث.', 'The current transaction state does not allow this update.'],
    receipt_required: ['يلزم إيصال تحويل بانتظار المراجعة.', 'An uploaded transfer receipt must be awaiting review.'],
};
const failureMessage = error => Object.values(error.response?.data?.errors || {}).flat().join(' ') || error.response?.data?.message || error.message;
const localizedFailure = (error, ar) => !ar ? failureMessage(error) : ({
    402: 'يلزم شحن المحفظة لعرض هذه الطلبات ومراجعتها.',
    403: 'لا تملك صلاحية تحديث دفعات هذه الطلبات.',
    404: 'بعض الطلبات لم تعد متاحة. حدّث قائمة الطلبات ثم أعد المراجعة.',
    409: 'تغيّرت بيانات الدفع أو تفاصيل المراجعة. أعد تحميلها قبل التأكيد.',
    422: 'راجع المبلغ الكامل والعملة ومرجع التحصيل وتأكيد الاستلام وسبب التحديث لكل طلب مؤهل.',
}[error.response?.status] || 'لم نتمكن من تأكيد نتيجة الطلب. أعد المحاولة أو حمّل المراجعة للتحقق من حالته.');
const manualMethodNames = { cod: ['الدفع عند الاستلام', 'Cash on delivery'], bank_transfer: ['تحويل بنكي', 'Bank transfer'], transfer_receipt: ['تحويل بنكي بإيصال', 'Transfer with receipt'] };
const methodName = (method, ar) => manualMethodNames[method]?.[ar ? 0 : 1] || (typeof method === 'string' && method.trim() ? method.replaceAll('_', ' ') : ar ? 'طريقة غير محددة' : 'Unspecified method');

export default function OrderBulkPaymentReview({ ids, target, apiBase, uiBase, ar, onCancel, onComplete, onBusy }) {
    const text = (a, e) => ar ? a : e; const idsKey = ids.join(',');
    const [rows, setRows] = useState(null); const [fields, setFields] = useState({}); const [error, setError] = useState('');
    const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false); const [reload, setReload] = useState(0);
    const [confirmed, setConfirmed] = useState(false); const [downloading, setDownloading] = useState(null); const requestId = useRef(null);
    const mounted = useRef(true); const language = useRef(ar);
    useEffect(() => { language.current = ar; }, [ar]);
    useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
    useEffect(() => {
        let active = true; setLoading(true); setError(''); setRows(null); setFields({}); setConfirmed(false); requestId.current = crypto.randomUUID();
        api.post(`${apiBase}/orders/bulk-payment-review`, { ids: idsKey.split(',').map(Number), target }).then(({ data }) => {
            if (!active) return; setRows(data.data); setFields(Object.fromEntries(data.data.map(row => [row.id, { reference: '', amount: row.amount, currency: row.currency, note: '', acknowledged: false }])));
        }).catch(e => { if (active) setError(localizedFailure(e, language.current)); }).finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [apiBase, idsKey, target, reload]);
    const setField = (id, key, value) => setFields(current => ({ ...current, [id]: { ...current[id], [key]: value } }));
    async function download(row) {
        if (downloading) return; setDownloading(row.id); setError('');
        try {
            const response = await api.get(`${apiBase}/orders/${row.id}/payment/proofs/${row.receipt.id}`, { responseType: 'blob' });
            if (!mounted.current) return;
            const url = URL.createObjectURL(response.data); const link = document.createElement('a'); link.href = url;
            const extension = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/webp': 'webp' }[row.receipt.mime] || 'png';
            link.download = `transfer-receipt-${row.id}.${extension}`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (e) { if (mounted.current) setError(localizedFailure(e, ar)); } finally { if (mounted.current) setDownloading(null); }
    }
    async function submit(event) {
        event.preventDefault(); if (busy || loading || !rows || !confirmed) return;
        setBusy(true); onBusy(true); setError('');
        try {
            const { data } = await api.post(`${apiBase}/orders/bulk-payment-status`, { target, request_id: requestId.current, confirmed: true,
                orders: rows.map(row => ({ id: row.id, version: row.version, ...(row.state === 'eligible' ? fields[row.id] : {}) })) });
            if (mounted.current) onComplete(data);
        } catch (e) { if (mounted.current) setError(localizedFailure(e, ar)); } finally { if (mounted.current) { setBusy(false); onBusy(false); } }
    }
    const eligible = rows?.filter(row => row.state === 'eligible') || [];
    return <section className="ws-bulk-payment-review" aria-label={text('مراجعة الدفع للطلبات المحددة', 'Review payments for selected orders')}>
        <p>{target === 'paid' ? text('أدخل مرجع التحصيل وأكد المبلغ الكامل لكل طلب يدوي مؤهل.', 'Enter a collection reference and confirm the full amount for each eligible manual payment.') : text('وثّق سبب تحديث كل دفعة يدوية مؤهلة. تبقى مراحل الشحن كما هي.', 'Record a reason for each eligible manual payment update. Fulfillment stages stay as recorded.')}</p>
        {loading ? <p role="status">{text('جارٍ تحميل مراجعة الدفع…', 'Loading payment review…')}</p> : null}
        {error ? <div role="alert" className="ws-orders-error">{error}<button type="button" disabled={busy} onClick={() => setReload(value => value + 1)}>{text('إعادة تحميل المراجعة', 'Reload review')}</button></div> : null}
        {rows ? <form onSubmit={submit}>
            <p className="ws-bulk-payment-counts">{text('مؤهل', 'Eligible')}: {eligible.length} · {text('دون تغيير', 'Unchanged')}: {rows.filter(row => row.state === 'unchanged').length} · {text('غير مؤهل', 'Ineligible')}: {rows.filter(row => row.state === 'skipped').length}</p>
            <div className="ws-bulk-payment-rows">{rows.map(row => <fieldset key={row.id} disabled={busy} className="ws-bulk-payment-row" data-state={row.state}>
                <legend><a href={`${uiBase}/orders/${row.id}`} target="_blank" rel="noopener noreferrer">#{row.order_number || row.id}</a></legend>
                <div className="ws-bulk-payment-summary"><PaymentMethodLogo slug={row.payment_method || ''} /><div className="ws-bulk-payment-identity"><span>{row.customer_name || '—'}</span><small>{methodName(row.payment_method, ar)}</small></div><bdi>{row.amount} {row.currency}</bdi></div>
                {row.state === 'eligible' ? <>
                    {target === 'paid' ? <>
                        <div className="ws-bulk-payment-fields"><label>{text('مرجع التحصيل', 'Collection reference')}<input required maxLength={200} value={fields[row.id]?.reference || ''} onChange={e => setField(row.id, 'reference', e.target.value)} /></label>
                            <label>{text('المبلغ المستلم', 'Amount received')}<input type="number" required min="0" step="0.01" value={fields[row.id]?.amount ?? ''} onChange={e => setField(row.id, 'amount', e.target.value)} /></label>
                            <label>{text('العملة', 'Currency')}<input required maxLength={3} pattern="[A-Za-z]{3}" value={fields[row.id]?.currency || ''} onChange={e => setField(row.id, 'currency', e.target.value.toUpperCase())} /></label></div>
                        {row.receipt ? <div className="ws-bulk-payment-receipt"><span>{text('مرجع الإيصال', 'Receipt reference')}: {row.receipt.reference || '—'}</span><button type="button" disabled={!!downloading || busy} onClick={() => void download(row)}>{downloading === row.id ? text('جارٍ التنزيل…', 'Downloading…') : text('تنزيل الإيصال للمراجعة', 'Download receipt for review')}</button></div> : null}
                        <label className="ws-bulk-payment-check"><input type="checkbox" required checked={fields[row.id]?.acknowledged || false} onChange={e => setField(row.id, 'acknowledged', e.target.checked)} />{row.receipt ? text('راجعت هذا الإيصال وأؤكد وصول المبلغ الكامل.', 'I reviewed this receipt and confirm receipt of the full amount.') : text('أؤكد استلام المبلغ الكامل لهذا الطلب.', 'I confirm receipt of the full amount for this order.')}</label>
                    </> : null}
                    <label>{target === 'paid' ? text('ملاحظة داخلية — اختياري', 'Internal note — optional') : text('سبب التحديث', 'Reason for update')}<textarea required={target !== 'paid'} maxLength={2000} value={fields[row.id]?.note || ''} onChange={e => setField(row.id, 'note', e.target.value)} /></label>
                </> : <p>{row.state === 'unchanged' ? text('الدفع مسجل بهذه الحالة بالفعل.', 'Payment is already recorded in this state.') : !row.payment_method ? text('طريقة الدفع غير مسجلة لهذا الطلب؛ راجع تفاصيله.', 'The payment method is not recorded. Review the order details.') : reasons[row.reason]?.[ar ? 0 : 1] || text('هذا الطلب غير مؤهل لهذا التحديث.', 'This order is ineligible for this update.')}</p>}
            </fieldset>)}</div>
            <label className="ws-bulk-payment-check"><input type="checkbox" checked={confirmed} disabled={busy} onChange={e => setConfirmed(e.target.checked)} />{text('راجعت الطلبات ونتائج الأهلية وأؤكد تحديث الدفعات المؤهلة.', 'I reviewed these orders and eligibility results and confirm updating eligible payments.')}</label>
            <div className="ws-bulk-payment-footer"><button type="button" disabled={busy} onClick={onCancel}>{text('إلغاء', 'Cancel')}</button><button type="submit" disabled={busy || !confirmed}>{busy ? text('جارٍ التحديث…', 'Updating…') : text('تأكيد تحديث الدفع', 'Confirm payment update')}</button></div>
        </form> : <div className="ws-bulk-payment-footer"><button type="button" onClick={onCancel}>{text('إلغاء', 'Cancel')}</button></div>}
    </section>;
}
