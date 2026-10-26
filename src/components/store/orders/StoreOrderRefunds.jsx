import { useCallback, useEffect, useRef, useState } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import api from '../../../api/client';
import { HiOutlineXMark } from '../../workspace/WorkspaceIcons';
import {
    REFUND_METHODS, REFUND_REASONS, RETURN_REASONS, RETURN_RESOLUTIONS, RETURN_STATUSES, RETURN_STATUS_TONES,
    fromCents, refundTotals, toCents, vocabularyLabel,
} from './order-refunds';
import './order-refunds.css';

const errorMessage = (error) => Object.values(error.response?.data?.errors || {}).flat().join(' ') || error.response?.data?.message || error.message;
const RETURN_ACTIONS = { approved: ['قبول', 'Approve'], rejected: ['رفض', 'Reject'], received: ['تم الاستلام', 'Mark received'], closed: ['إغلاق', 'Close'] };

/**
 * Refund history, the Refund dialog and the order's return requests. Refunds are recorded for the
 * merchant's books only; the money itself goes back through the gateway or by hand.
 */
export default function StoreOrderRefunds({ apiBase, endpoint, order, ar, theme, canManage, open, onOpenChange, onOrderUpdated }) {
    const text = (a, e) => (ar ? a : e);
    const [summary, setSummary] = useState(null); const [returns, setReturns] = useState([]); const [error, setError] = useState(''); const [notice, setNotice] = useState('');
    const [returnMode, setReturnMode] = useState(null); const [busyReturn, setBusyReturn] = useState(null);
    const active = useRef(true);
    const load = useCallback(async () => {
        try {
            const [refunds, rows] = await Promise.all([api.get(`${endpoint}/refunds`), api.get(`${endpoint}/returns`)]);
            if (!active.current) return;
            setSummary(refunds?.data?.data ?? null); setReturns(Array.isArray(rows?.data?.data) ? rows.data.data : []); setError('');
        } catch (e) { if (active.current) setError(errorMessage(e)); }
    }, [endpoint]);
    useEffect(() => { active.current = true; void load(); return () => { active.current = false; }; }, [load]);
    // The toolbar can ask for the dialog before refunds load or after everything was refunded.
    useEffect(() => {
        if (open && summary && !summary.refundable) { onOpenChange(false); setNotice(ar ? 'لا يوجد ما يمكن استرداده في هذا الطلب.' : 'There is nothing left to refund on this order.'); }
    }, [open, summary, onOpenChange, ar]);

    const money = (value) => `${String(value ?? '0.00')} ${order.currency}`;
    const date = (value) => (value ? new Date(value).toLocaleString(ar ? 'ar-EG' : 'en-GB') : '—');
    const names = Object.fromEntries((summary?.items || []).map((line) => [line.store_order_item_id, line.name]));

    async function moveReturn(row, status) {
        if (busyReturn) return; setBusyReturn(row.id); setError(''); setNotice('');
        try {
            await api.patch(`${apiBase}/returns/${row.id}`, { status });
            if (!active.current) return;
            setNotice(text('حُدّثت حالة طلب الإرجاع.', 'Return updated.')); await load(); onOrderUpdated();
        } catch (e) { if (active.current) setError(errorMessage(e)); }
        finally { if (active.current) setBusyReturn(null); }
    }
    function openRefund(row = null) { setReturnMode(row); setNotice(''); onOpenChange(true); }
    const refunded = summary ? `${text('مسترد', 'Refunded')} ${money(summary.refunded_total)} ${text('من', 'of')} ${money(summary.grand_total)}` : '';

    return <>
        <section className="ws-order-card ws-refunds" aria-labelledby="ws-refunds-title">
            <div className="ws-refunds-head"><h2 id="ws-refunds-title">{text('المبالغ المستردة', 'Refunds')}</h2>
                {canManage && summary?.refundable ? <button type="button" className="ws-order-primary-button" onClick={() => openRefund()}>{text('استرداد', 'Refund')}</button> : null}</div>
            {error ? <p role="alert" className="ws-orders-error">{error}<button type="button" onClick={() => void load()}>{text('إعادة المحاولة', 'Retry')}</button></p> : null}
            {notice ? <p role="status" className="ws-orders-notice">{notice}</p> : null}
            {!summary && !error ? <p role="status" className="ws-order-muted">{text('جار تحميل المبالغ المستردة…', 'Loading refunds…')}</p> : null}
            {summary ? <>
                <p className="ws-refunds-total" data-testid="refunded-of"><bdi>{refunded}</bdi></p>
                {!summary.payment_collected ? <p className="ws-order-muted">{text('لم يُحصَّل مبلغ لهذا الطلب، لذلك يسجل الاسترداد المنتجات المرتجعة فقط.', 'No payment was collected for this order, so a refund records returned items only.')}</p> : null}
                {summary.refunds?.length ? <ol className="ws-refunds-history">{summary.refunds.map((refund) => <li key={refund.id}>
                    <strong><bdi>{money(refund.amount)}</bdi> · {vocabularyLabel(REFUND_METHODS, refund.method, ar)}</strong>
                    <small>{refund.actor || text('النظام', 'System')} · {date(refund.created_at)}{refund.reason ? ` · ${vocabularyLabel(REFUND_REASONS, refund.reason, ar)}` : ''}</small>
                    <ul>{refund.items.map((item) => <li key={item.store_order_item_id}>{item.name || `#${item.store_order_item_id}`} × {item.quantity}{item.restocked_quantity ? ` · ${text('أعيد للمخزون', 'restocked')} ${item.restocked_quantity}` : ''}</li>)}
                        {Number(refund.shipping_amount) > 0 ? <li>{text('الشحن', 'Shipping')} <bdi>{money(refund.shipping_amount)}</bdi></li> : null}</ul>
                    {refund.note ? <p>{refund.note}</p> : null}
                </li>)}</ol> : <p className="ws-order-muted">{text('لا توجد مبالغ مستردة لهذا الطلب.', 'No refunds recorded for this order.')}</p>}
            </> : null}
        </section>
        {returns.length ? <section className="ws-order-card ws-returns" aria-labelledby="ws-returns-title"><h2 id="ws-returns-title">{text('طلبات الإرجاع', 'Returns')}</h2>
            <ol className="ws-returns-list">{returns.map((row) => <li key={row.id}>
                <div className="ws-returns-row-head"><strong>{text('إرجاع', 'Return')} #{row.id}</strong><span className={`ws-dt-badge ${RETURN_STATUS_TONES[row.status] || ''}`}>{vocabularyLabel(RETURN_STATUSES, row.status, ar)}</span></div>
                <small>{vocabularyLabel(RETURN_REASONS, row.reason, ar)} · {date(row.created_at)}{row.resolution ? ` · ${vocabularyLabel(RETURN_RESOLUTIONS, row.resolution, ar)}` : ''}</small>
                <ul>{row.items.map((item) => <li key={item.store_order_item_id}>{item.name || names[item.store_order_item_id] || `#${item.store_order_item_id}`} × {item.quantity}</li>)}</ul>
                {row.customer_note ? <p><span className="ws-order-muted">{text('ملاحظة العميل:', 'Customer note:')}</span> {row.customer_note}</p> : null}
                {row.merchant_note ? <p><span className="ws-order-muted">{text('ملاحظة المتجر:', 'Store note:')}</span> {row.merchant_note}</p> : null}
                {canManage && row.next_statuses?.length ? <div className="ws-returns-actions">
                    {row.next_statuses.map((status) => <button type="button" key={status} disabled={Boolean(busyReturn)} onClick={() => void moveReturn(row, status)}>{RETURN_ACTIONS[status]?.[ar ? 0 : 1] ?? status}</button>)}
                    {['approved', 'received'].includes(row.status) && !row.store_order_refund_id && summary?.refundable ? <button type="button" className="ws-order-primary-button" disabled={Boolean(busyReturn)} onClick={() => openRefund(row)}>{row.status === 'approved' ? text('استلام واسترداد', 'Receive and refund') : text('استرداد المرتجع', 'Refund return')}</button> : null}
                </div> : null}
            </li>)}</ol>
        </section> : null}
        {open && summary ? <RefundDialog key={`${summary.refunded_total}:${returnMode?.id ?? 'order'}`} apiBase={apiBase} endpoint={endpoint} summary={summary} returnRow={returnMode} order={order} ar={ar} theme={theme}
            onClose={() => onOpenChange(false)} onSaved={async (message) => { onOpenChange(false); setNotice(message); await load(); onOrderUpdated(); }} /> : null}
    </>;
}

function RefundDialog({ apiBase, endpoint, summary, returnRow, order, ar, theme, onClose, onSaved }) {
    const text = (a, e) => (ar ? a : e);
    const fixed = returnRow ? Object.fromEntries(returnRow.items.map((item) => [item.store_order_item_id, item.quantity])) : null;
    const [quantities, setQuantities] = useState(() => fixed ?? {});
    const [shipping, setShipping] = useState(''); const [manual, setManual] = useState(false); const [amount, setAmount] = useState('');
    const [reason, setReason] = useState(returnRow ? 'returned' : 'customer_request'); const [method, setMethod] = useState('original_payment');
    const [restock, setRestock] = useState(true); const [note, setNote] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
    const working = useRef(false);
    const collected = Boolean(summary.payment_collected);
    const totals = refundTotals(summary, quantities, shipping);
    const shippingMax = collected ? toCents(summary.shipping?.refundable) : 0;
    const amountCents = manual ? toCents(amount) : totals.max;
    const units = Object.values(quantities).reduce((sum, value) => sum + (Number(value) || 0), 0);
    const restockable = (summary.items || []).filter((line) => line.restockable && (quantities[line.store_order_item_id] || 0) > 0).reduce((sum, line) => sum + quantities[line.store_order_item_id], 0);
    const shippingInvalid = toCents(shipping) > shippingMax || Number(shipping) < 0;
    const amountInvalid = manual && (amount === '' || amountCents > totals.max || Number(amount) < 0);
    const nothing = units === 0 && toCents(shipping) === 0;
    const money = (cents) => `${fromCents(cents)} ${order.currency}`;
    const setQuantity = (line, value) => setQuantities((current) => ({ ...current, [line.store_order_item_id]: Math.max(0, Math.min(line.refundable_quantity, Math.trunc(Number(value) || 0))) }));

    async function submit(event) {
        event.preventDefault();
        if (working.current || nothing || shippingInvalid || amountInvalid) return;
        working.current = true; setBusy(true); setError('');
        const refund = { reason, method, restock: restockable > 0 && restock, note: note.trim() || null, shipping_amount: toCents(shipping) > 0 ? fromCents(toCents(shipping)) : null, amount: manual ? fromCents(amountCents) : null };
        try {
            if (returnRow) {
                // Approved returns are marked received in the same step; the server refunds exactly the returned lines.
                await api.patch(`${apiBase}/returns/${returnRow.id}`, { status: 'received', refund });
            } else {
                const items = Object.entries(quantities).filter(([, quantity]) => quantity > 0).map(([id, quantity]) => ({ store_order_item_id: Number(id), quantity }));
                await api.post(`${endpoint}/refunds`, { ...refund, items, expected_refunded_total: summary.refunded_total });
            }
            await onSaved(text(`سُجل استرداد ${money(amountCents)}. أعد المبلغ للعميل عبر بوابة الدفع أو يدويًا.`, `Refund of ${money(amountCents)} recorded. Return the money to the customer through your payment gateway or manually.`));
        } catch (e) { setError(errorMessage(e)); }
        finally { working.current = false; setBusy(false); }
    }

    return <Dialog open onClose={() => { if (!working.current) onClose(); }} className="ws-orders-dialog" dir={ar ? 'rtl' : 'ltr'} data-workspace-theme={theme}>
        <DialogBackdrop className="ws-orders-backdrop" /><div className="ws-orders-dialog-position"><DialogPanel className="ws-order-action-panel ws-refund-panel"><form onSubmit={submit} noValidate>
            <header><DialogTitle>{returnRow ? text(`استلام واسترداد الإرجاع #${returnRow.id}`, `Receive and refund return #${returnRow.id}`) : text('استرداد مبلغ', 'Refund')}</DialogTitle><button type="button" onClick={onClose} disabled={busy} aria-label={text('إغلاق', 'Close')}><HiOutlineXMark aria-hidden /></button></header>
            <div className="ws-order-action-body">
                <p className="ws-refund-warning" role="note">{text('لا تُعيد سيلشيز الأموال تلقائيًا. يُسجَّل الاسترداد في دفاترك فقط، ويجب عليك إعادة المبلغ للعميل عبر لوحة بوابة الدفع أو نقدًا أو بتحويل بنكي.', 'Sellchaze does not send money back automatically. This records the refund in your books; return the money to the customer yourself through your payment gateway dashboard, in cash or by bank transfer.')}</p>
                {!collected ? <p className="ws-order-muted">{text('لم يُحصَّل مبلغ لهذا الطلب، لذلك قيمة الاسترداد صفر ويُسجَّل إرجاع المنتجات فقط.', 'No payment was collected for this order, so the refund amount is zero and only the returned items are recorded.')}</p> : null}
                <fieldset className="ws-refund-items"><legend>{text('المنتجات', 'Items')}</legend>
                    {(summary.items || []).map((line) => {
                        const value = quantities[line.store_order_item_id] || 0; const id = `refund-qty-${line.store_order_item_id}`;
                        return <div className="ws-refund-line" key={line.store_order_item_id}>
                            <div className="ws-refund-line-name"><label htmlFor={id}>{line.name}</label>{line.variant_name ? <small>{line.variant_name}</small> : null}
                                <small>{text(`متاح للاسترداد ${line.refundable_quantity} من ${line.quantity}`, `${line.refundable_quantity} of ${line.quantity} refundable`)}{collected ? <> · <bdi>{money(toCents(line.refundable_amount))}</bdi></> : null}</small></div>
                            <div className="ws-refund-stepper">
                                <button type="button" aria-label={text(`إنقاص ${line.name}`, `Decrease ${line.name}`)} disabled={busy || Boolean(fixed) || value <= 0} onClick={() => setQuantity(line, value - 1)}>−</button>
                                <input id={id} type="number" inputMode="numeric" min={0} max={line.refundable_quantity} step={1} value={value} disabled={busy || Boolean(fixed) || line.refundable_quantity === 0} onChange={(event) => setQuantity(line, event.target.value)} />
                                <button type="button" aria-label={text(`زيادة ${line.name}`, `Increase ${line.name}`)} disabled={busy || Boolean(fixed) || value >= line.refundable_quantity} onClick={() => setQuantity(line, value + 1)}>+</button>
                            </div>
                        </div>;
                    })}
                </fieldset>
                {collected && shippingMax > 0 ? <label>{text('استرداد الشحن', 'Shipping refund')} <small className="ws-order-muted">({text('الحد الأقصى', 'max')} <bdi>{money(shippingMax)}</bdi>)</small>
                    <input type="number" inputMode="decimal" min={0} max={fromCents(shippingMax)} step="0.01" value={shipping} disabled={busy} aria-invalid={shippingInvalid} onChange={(event) => setShipping(event.target.value)} /></label> : null}
                <div className="ws-refund-summary" aria-live="polite"><span>{text('قيمة الاسترداد', 'Refund amount')}</span><strong><bdi data-testid="refund-total">{money(manual ? amountCents : totals.max)}</bdi></strong>
                    <small className="ws-order-muted">{text('المتبقي القابل للاسترداد', 'Remaining refundable')} <bdi>{money(toCents(summary.refundable_total))}</bdi></small></div>
                {collected ? <label className="ws-refund-check"><input type="checkbox" checked={manual} disabled={busy} onChange={(event) => { setManual(event.target.checked); setAmount(fromCents(totals.max)); }} />{text('إدخال مبلغ مختلف', 'Enter a different amount')}</label> : null}
                {manual ? <label>{text('المبلغ', 'Amount')} <small className="ws-order-muted">({text('الحد الأقصى', 'max')} <bdi>{money(totals.max)}</bdi>)</small>
                    <input type="number" inputMode="decimal" min={0} max={fromCents(totals.max)} step="0.01" value={amount} disabled={busy} aria-invalid={amountInvalid} onChange={(event) => setAmount(event.target.value)} /></label> : null}
                <label>{text('السبب', 'Reason')}<select value={reason} disabled={busy} onChange={(event) => setReason(event.target.value)}>{REFUND_REASONS.map(([key, a, e]) => <option key={key} value={key}>{ar ? a : e}</option>)}</select></label>
                <label>{text('طريقة الاسترداد', 'Refund method')}<select value={method} disabled={busy} onChange={(event) => setMethod(event.target.value)}>{REFUND_METHODS.map(([key, a, e]) => <option key={key} value={key}>{ar ? a : e}</option>)}</select></label>
                {restockable > 0 ? <label className="ws-refund-check"><input type="checkbox" checked={restock} disabled={busy} onChange={(event) => setRestock(event.target.checked)} />{text(`إعادة ${restockable} قطعة إلى المخزون`, `Restock ${restockable} item(s)`)}</label> : null}
                <label>{text('ملاحظة داخلية (اختياري)', 'Internal note (optional)')}<textarea rows={3} maxLength={2000} value={note} disabled={busy} onChange={(event) => setNote(event.target.value)} /></label>
                {shippingInvalid ? <p role="alert" className="ws-orders-error">{text('مبلغ الشحن أكبر من المتاح.', 'The shipping refund is more than what is available.')}</p> : null}
                {amountInvalid ? <p role="alert" className="ws-orders-error">{text('المبلغ يجب ألا يتجاوز الحد الأقصى.', 'The amount cannot exceed the maximum.')}</p> : null}
                {error ? <p role="alert" className="ws-orders-error">{error}</p> : null}
            </div>
            <footer><button type="button" onClick={onClose} disabled={busy}>{text('إلغاء', 'Cancel')}</button><button className="ws-order-primary-button" type="submit" disabled={busy || nothing || shippingInvalid || amountInvalid}>{busy ? text('جار الحفظ…', 'Saving…') : `${text('استرداد', 'Refund')} ${money(amountCents)}`}</button></footer>
        </form></DialogPanel></div>
    </Dialog>;
}
