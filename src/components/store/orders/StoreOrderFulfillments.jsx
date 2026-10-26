import { useCallback, useEffect, useRef, useState } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import api from '../../../api/client';
import { HiOutlineXMark } from '../../workspace/WorkspaceIcons';
import {
    CARRIERS, FULFILLMENT_STATUSES, FULFILLMENT_STATUS_TONES, SHIPMENT_STATUSES, SHIPMENT_STATUS_TONES,
    carrierLabel, chosenUnits, clampQuantity, fulfillmentPayload, safeTrackingUrl, vocabularyLabel,
} from './order-fulfillments';
import './order-fulfillments.css';

const errorMessage = (error) => Object.values(error.response?.data?.errors || {}).flat().join(' ') || error.response?.data?.message || error.message;

/**
 * Shipments of an order: what is still unfulfilled, each fulfillment with its carrier, tracking link,
 * items and status, and the Fulfill items dialog. Every fulfillment commits stock for the units it ships.
 */
export default function StoreOrderFulfillments({ endpoint, apiBase, orderVersion, ar, theme, canManage, open, onOpenChange, onOrderUpdated }) {
    const text = (a, e) => (ar ? a : e);
    const [summary, setSummary] = useState(null); const [error, setError] = useState(''); const [notice, setNotice] = useState('');
    const [editing, setEditing] = useState(null); const [cancelling, setCancelling] = useState(null); const [busy, setBusy] = useState(null);
    const active = useRef(true);
    const load = useCallback(async () => {
        try {
            const { data } = await api.get(`${endpoint}/fulfillments`);
            const value = data?.data;
            if (active.current) { setSummary(value && typeof value === 'object' && !Array.isArray(value) ? value : { items: [], fulfillments: [] }); setError(''); }
        } catch (e) { if (active.current) setError(errorMessage(e)); }
    }, [endpoint]);
    // Reload when the order changes elsewhere on the page (status updates, edits, refunds).
    useEffect(() => { active.current = true; void load(); return () => { active.current = false; }; }, [load, orderVersion]);
    useEffect(() => {
        if (open && summary && !summary.can_fulfill) { onOpenChange(false); setNotice(text('لا توجد منتجات بانتظار الشحن في هذا الطلب.', 'Nothing on this order is waiting to ship.')); }
    }, [open, summary, onOpenChange]); // eslint-disable-line react-hooks/exhaustive-deps

    const date = (value) => (value ? new Date(value).toLocaleString(ar ? 'ar-EG' : 'en-GB') : '—');
    const carriers = summary?.carriers?.length ? summary.carriers : CARRIERS;
    const waiting = (summary?.items || []).filter((line) => line.unfulfilled_quantity > 0);
    const shipments = summary?.fulfillments || [];

    async function saved(message, data) {
        setNotice(message);
        if (data?.data) setSummary(data.data); else await load();
        onOrderUpdated();
    }
    async function setStatus(row, status) {
        if (busy) return; setBusy(row.id); setError(''); setNotice('');
        try {
            const { data } = await api.patch(`${apiBase}/fulfillments/${row.id}`, { status });
            if (active.current) await saved(status === 'delivered' ? text('سُجّل تسليم الشحنة.', 'Shipment marked delivered.') : text('حُدّثت حالة الشحنة.', 'Shipment updated.'), data);
        } catch (e) { if (active.current) setError(errorMessage(e)); }
        finally { if (active.current) setBusy(null); }
    }

    return <>
        <section className="ws-order-card ws-fulfillments" aria-labelledby="ws-fulfillments-title">
            <div className="ws-refunds-head">
                <h2 id="ws-fulfillments-title">{text('الشحنات', 'Fulfillment')}</h2>
                {summary?.fulfillment_status ? <span className={`ws-dt-badge ${FULFILLMENT_STATUS_TONES[summary.fulfillment_status] || ''}`} data-testid="fulfillment-status">{vocabularyLabel(FULFILLMENT_STATUSES, summary.fulfillment_status, ar)}</span> : null}
                {canManage && summary?.can_fulfill ? <button type="button" className="ws-order-primary-button" onClick={() => { setNotice(''); onOpenChange(true); }}>{text('شحن المنتجات', 'Fulfill items')}</button> : null}
            </div>
            {error ? <p role="alert" className="ws-orders-error">{error}<button type="button" onClick={() => void load()}>{text('إعادة المحاولة', 'Retry')}</button></p> : null}
            {notice ? <p role="status" className="ws-orders-notice">{notice}</p> : null}
            {!summary && !error ? <p role="status" className="ws-order-muted">{text('جار تحميل الشحنات…', 'Loading shipments…')}</p> : null}
            {summary && waiting.length ? <div className="ws-fulfil-waiting"><strong>{text('بانتظار الشحن', 'Waiting to ship')}</strong>
                <ul>{waiting.map((line) => <li key={line.store_order_item_id}>{line.name}{line.variant_name ? ` (${line.variant_name})` : ''} × {line.unfulfilled_quantity}</li>)}</ul></div> : null}
            {summary && !shipments.length ? <p className="ws-order-muted">{text('لم تُشحن أي منتجات بعد.', 'Nothing has shipped yet.')}</p> : null}
            {shipments.length ? <ol className="ws-refunds-history ws-shipments">{shipments.map((row, index) => {
                const url = safeTrackingUrl(row.tracking_url); const closed = ['cancelled'].includes(row.status);
                return <li key={row.id} className={closed ? 'is-cancelled' : ''} data-testid="fulfillment-card">
                    <div className="ws-returns-row-head"><strong>{text(`الشحنة ${index + 1}`, `Shipment ${index + 1}`)}</strong>
                        <span className={`ws-dt-badge ${SHIPMENT_STATUS_TONES[row.status] || ''}`}>{vocabularyLabel(SHIPMENT_STATUSES, row.status, ar)}</span></div>
                    <small>{row.carrier_name}{row.tracking_number ? <> · <bdi dir="ltr">{row.tracking_number}</bdi></> : <> · {text('بدون رقم تتبع', 'No tracking number')}</>}</small>
                    {url ? <a className="ws-shipment-track" href={url} target="_blank" rel="noopener noreferrer">{text('تتبع الشحنة', 'Track shipment')}<span className="ws-sr-only">{text(' (يفتح في تبويب جديد)', ' (opens in a new tab)')}</span></a> : null}
                    <ul>{row.items.map((item) => <li key={item.store_order_item_id}>{item.name || `#${item.store_order_item_id}`}{item.variant_name ? ` (${item.variant_name})` : ''} × {item.quantity}</li>)}</ul>
                    <small>{text('شُحنت', 'Shipped')} {date(row.shipped_at)}{row.delivered_at ? ` · ${text('سُلّمت', 'Delivered')} ${date(row.delivered_at)}` : ''}{row.cancelled_at ? ` · ${text('أُلغيت', 'Cancelled')} ${date(row.cancelled_at)}` : ''}{row.actor ? ` · ${row.actor}` : ''}</small>
                    {row.note ? <p>{row.note}</p> : null}
                    {canManage && !closed ? <div className="ws-returns-actions">
                        <button type="button" disabled={Boolean(busy)} onClick={() => { setNotice(''); setEditing(row); }}>{text('تعديل التتبع', 'Edit tracking')}</button>
                        {row.status !== 'delivered' && ['shipped', 'delivered'].includes(summary.order_status) ? <button type="button" disabled={Boolean(busy)} onClick={() => void setStatus(row, 'delivered')}>{text('تم التسليم', 'Mark delivered')}</button> : null}
                        {['pending', 'in_transit'].includes(row.status) && summary.order_status === 'shipped' ? <button type="button" disabled={Boolean(busy)} onClick={() => void setStatus(row, 'failed')}>{text('تعذر التسليم', 'Mark failed')}</button> : null}
                        {row.status !== 'delivered' && summary.order_status === 'shipped' ? <button type="button" className="ws-shipment-cancel" disabled={Boolean(busy)} onClick={() => { setNotice(''); setCancelling(row); }}>{text('إلغاء الشحنة', 'Cancel shipment')}</button> : null}
                    </div> : null}
                </li>;
            })}</ol> : null}
        </section>
        {open && summary?.can_fulfill ? <FulfillDialog endpoint={endpoint} summary={summary} carriers={carriers} ar={ar} theme={theme} onClose={() => onOpenChange(false)}
            onSaved={async (data, message) => { onOpenChange(false); await saved(message, data); }} /> : null}
        {editing ? <TrackingDialog apiBase={apiBase} row={editing} carriers={carriers} ar={ar} theme={theme} onClose={() => setEditing(null)}
            onSaved={async (data) => { setEditing(null); await saved(text('حُفظت بيانات التتبع.', 'Tracking saved.'), data); }} /> : null}
        {cancelling ? <CancelDialog apiBase={apiBase} row={cancelling} ar={ar} theme={theme} onClose={() => setCancelling(null)}
            onSaved={async (data) => { setCancelling(null); await saved(text('أُلغيت الشحنة وأعيدت المنتجات إلى قائمة الانتظار والمخزون المحجوز.', 'Shipment cancelled. Its items are waiting to ship again and their stock is held for this order.'), data); }} /> : null}
    </>;
}

function CarrierFields({ ar, carriers, carrier, setCarrier, carrierName, setCarrierName, trackingNumber, setTrackingNumber, trackingUrl, setTrackingUrl, busy, idPrefix }) {
    const text = (a, e) => (ar ? a : e);
    const current = carriers.find((row) => row.key === carrier);
    const urlInvalid = trackingUrl.trim() !== '' && !safeTrackingUrl(trackingUrl);
    return <>
        <label htmlFor={`${idPrefix}-carrier`}>{text('شركة الشحن', 'Carrier')}
            <select id={`${idPrefix}-carrier`} value={carrier} disabled={busy} onChange={(event) => setCarrier(event.target.value)}>
                {carriers.map((row) => <option key={row.key} value={row.key}>{carrierLabel(row, ar)}</option>)}
            </select></label>
        {carrier === 'other' ? <label htmlFor={`${idPrefix}-carrier-name`}>{text('اسم شركة الشحن', 'Carrier name')}
            <input id={`${idPrefix}-carrier-name`} type="text" maxLength={100} value={carrierName} disabled={busy} onChange={(event) => setCarrierName(event.target.value)} /></label> : null}
        <label htmlFor={`${idPrefix}-tracking`}>{text('رقم التتبع (اختياري)', 'Tracking number (optional)')}
            <input id={`${idPrefix}-tracking`} type="text" dir="ltr" maxLength={100} autoComplete="off" value={trackingNumber} disabled={busy} onChange={(event) => setTrackingNumber(event.target.value)} /></label>
        <label htmlFor={`${idPrefix}-url`}>{text('رابط التتبع (اختياري)', 'Tracking URL (optional)')}
            <input id={`${idPrefix}-url`} type="url" dir="ltr" maxLength={500} placeholder="https://" value={trackingUrl} disabled={busy} aria-invalid={urlInvalid} aria-describedby={`${idPrefix}-url-hint`} onChange={(event) => setTrackingUrl(event.target.value)} />
            <small id={`${idPrefix}-url-hint`} className="ws-order-muted">{current?.tracking_url_template ? text('اتركه فارغًا لاستخدام صفحة التتبع الخاصة بشركة الشحن تلقائيًا.', 'Leave empty to link to the carrier’s tracking page automatically.') : text('أدخل رابط صفحة التتبع ليظهر للعميل.', 'Enter the tracking page link to show it to the customer.')}</small></label>
        {urlInvalid ? <p role="alert" className="ws-orders-error">{text('أدخل رابطًا يبدأ بـ https://', 'Enter a link that starts with https://')}</p> : null}
    </>;
}

function FulfillDialog({ endpoint, summary, carriers, ar, theme, onClose, onSaved }) {
    const text = (a, e) => (ar ? a : e);
    const lines = (summary.items || []).filter((line) => line.unfulfilled_quantity > 0);
    const [quantities, setQuantities] = useState(() => Object.fromEntries(lines.map((line) => [line.store_order_item_id, line.unfulfilled_quantity])));
    const [carrier, setCarrier] = useState(carriers[0]?.key || 'other'); const [carrierName, setCarrierName] = useState('');
    const [trackingNumber, setTrackingNumber] = useState(''); const [trackingUrl, setTrackingUrl] = useState('');
    const [notify, setNotify] = useState(true); const [note, setNote] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
    const working = useRef(false);
    const units = chosenUnits(quantities);
    const urlInvalid = trackingUrl.trim() !== '' && !safeTrackingUrl(trackingUrl);
    const setQuantity = (line, value) => setQuantities((current) => ({ ...current, [line.store_order_item_id]: clampQuantity(value, line.unfulfilled_quantity) }));

    async function submit(event) {
        event.preventDefault();
        if (working.current || units === 0 || urlInvalid) return;
        working.current = true; setBusy(true); setError('');
        try {
            const { data } = await api.post(`${endpoint}/fulfillments`, fulfillmentPayload({ quantities, carrier, carrierName, trackingNumber, trackingUrl, notify, note }));
            await onSaved(data, notify ? text(`شُحنت ${units} قطعة وأُبلغ العميل.`, `${units} item(s) fulfilled. The customer was notified.`) : text(`شُحنت ${units} قطعة.`, `${units} item(s) fulfilled.`));
        } catch (e) { setError(errorMessage(e)); }
        finally { working.current = false; setBusy(false); }
    }

    return <Dialog open onClose={() => { if (!working.current) onClose(); }} className="ws-orders-dialog" dir={ar ? 'rtl' : 'ltr'} data-workspace-theme={theme}>
        <DialogBackdrop className="ws-orders-backdrop" /><div className="ws-orders-dialog-position"><DialogPanel className="ws-order-action-panel ws-refund-panel ws-fulfil-panel"><form onSubmit={submit} noValidate>
            <header><DialogTitle>{text('شحن المنتجات', 'Fulfill items')}</DialogTitle><button type="button" onClick={onClose} disabled={busy} aria-label={text('إغلاق', 'Close')}><HiOutlineXMark aria-hidden /></button></header>
            <div className="ws-order-action-body">
                <fieldset className="ws-refund-items"><legend>{text('المنتجات المشحونة', 'Items in this shipment')}</legend>
                    {lines.map((line) => {
                        const value = quantities[line.store_order_item_id] || 0; const id = `fulfil-qty-${line.store_order_item_id}`;
                        return <div className="ws-refund-line" key={line.store_order_item_id}>
                            <div className="ws-refund-line-name"><label htmlFor={id}>{line.name}</label>{line.variant_name ? <small>{line.variant_name}</small> : null}
                                <small>{text(`بانتظار الشحن ${line.unfulfilled_quantity} من ${line.quantity}`, `${line.unfulfilled_quantity} of ${line.quantity} unfulfilled`)}</small></div>
                            <div className="ws-refund-stepper">
                                <button type="button" aria-label={text(`إنقاص ${line.name}`, `Decrease ${line.name}`)} disabled={busy || value <= 0} onClick={() => setQuantity(line, value - 1)}>−</button>
                                <input id={id} type="number" inputMode="numeric" min={0} max={line.unfulfilled_quantity} step={1} value={value} disabled={busy} onChange={(event) => setQuantity(line, event.target.value)} />
                                <button type="button" aria-label={text(`زيادة ${line.name}`, `Increase ${line.name}`)} disabled={busy || value >= line.unfulfilled_quantity} onClick={() => setQuantity(line, value + 1)}>+</button>
                            </div>
                        </div>;
                    })}
                </fieldset>
                <CarrierFields ar={ar} carriers={carriers} carrier={carrier} setCarrier={setCarrier} carrierName={carrierName} setCarrierName={setCarrierName}
                    trackingNumber={trackingNumber} setTrackingNumber={setTrackingNumber} trackingUrl={trackingUrl} setTrackingUrl={setTrackingUrl} busy={busy} idPrefix="fulfil" />
                <label className="ws-refund-check"><input type="checkbox" checked={notify} disabled={busy} onChange={(event) => setNotify(event.target.checked)} />{text('إرسال إشعار الشحن للعميل', 'Send a shipping notification to the customer')}</label>
                <label>{text('ملاحظة داخلية (اختياري)', 'Internal note (optional)')}<textarea rows={2} maxLength={2000} value={note} disabled={busy} onChange={(event) => setNote(event.target.value)} /></label>
                {units === 0 ? <p className="ws-order-muted" role="status">{text('اختر منتجًا واحدًا على الأقل.', 'Choose at least one item.')}</p> : null}
                {error ? <p role="alert" className="ws-orders-error">{error}</p> : null}
            </div>
            <footer><button type="button" onClick={onClose} disabled={busy}>{text('إلغاء', 'Cancel')}</button><button className="ws-order-primary-button" type="submit" disabled={busy || units === 0 || urlInvalid}>{busy ? text('جار الحفظ…', 'Saving…') : text(`شحن ${units} قطعة`, `Fulfill ${units} item(s)`)}</button></footer>
        </form></DialogPanel></div>
    </Dialog>;
}

function TrackingDialog({ apiBase, row, carriers, ar, theme, onClose, onSaved }) {
    const text = (a, e) => (ar ? a : e);
    const [carrier, setCarrier] = useState(row.carrier); const [carrierName, setCarrierName] = useState(row.custom_carrier_name || '');
    const [trackingNumber, setTrackingNumber] = useState(row.tracking_number || ''); const [trackingUrl, setTrackingUrl] = useState(row.custom_tracking_url || '');
    const [notify, setNotify] = useState(Boolean(row.notify_customer)); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
    const working = useRef(false);
    const urlInvalid = trackingUrl.trim() !== '' && !safeTrackingUrl(trackingUrl);

    async function submit(event) {
        event.preventDefault();
        if (working.current || urlInvalid) return;
        working.current = true; setBusy(true); setError('');
        try {
            const payload = fulfillmentPayload({ quantities: {}, carrier, carrierName, trackingNumber, trackingUrl, notify, note: null });
            delete payload.items; delete payload.note;
            const { data } = await api.patch(`${apiBase}/fulfillments/${row.id}`, payload);
            await onSaved(data);
        } catch (e) { setError(errorMessage(e)); }
        finally { working.current = false; setBusy(false); }
    }

    return <Dialog open onClose={() => { if (!working.current) onClose(); }} className="ws-orders-dialog" dir={ar ? 'rtl' : 'ltr'} data-workspace-theme={theme}>
        <DialogBackdrop className="ws-orders-backdrop" /><div className="ws-orders-dialog-position"><DialogPanel className="ws-order-action-panel ws-refund-panel ws-fulfil-panel"><form onSubmit={submit} noValidate>
            <header><DialogTitle>{text('تعديل بيانات التتبع', 'Edit tracking')}</DialogTitle><button type="button" onClick={onClose} disabled={busy} aria-label={text('إغلاق', 'Close')}><HiOutlineXMark aria-hidden /></button></header>
            <div className="ws-order-action-body">
                <CarrierFields ar={ar} carriers={carriers} carrier={carrier} setCarrier={setCarrier} carrierName={carrierName} setCarrierName={setCarrierName}
                    trackingNumber={trackingNumber} setTrackingNumber={setTrackingNumber} trackingUrl={trackingUrl} setTrackingUrl={setTrackingUrl} busy={busy} idPrefix="tracking" />
                <label className="ws-refund-check"><input type="checkbox" checked={notify} disabled={busy} onChange={(event) => setNotify(event.target.checked)} />{text('إبلاغ العميل برقم التتبع الجديد', 'Notify the customer about a new tracking number')}</label>
                {error ? <p role="alert" className="ws-orders-error">{error}</p> : null}
            </div>
            <footer><button type="button" onClick={onClose} disabled={busy}>{text('إلغاء', 'Cancel')}</button><button className="ws-order-primary-button" type="submit" disabled={busy || urlInvalid}>{busy ? text('جار الحفظ…', 'Saving…') : text('حفظ', 'Save')}</button></footer>
        </form></DialogPanel></div>
    </Dialog>;
}

function CancelDialog({ apiBase, row, ar, theme, onClose, onSaved }) {
    const text = (a, e) => (ar ? a : e);
    const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const working = useRef(false);
    async function confirm() {
        if (working.current) return;
        working.current = true; setBusy(true); setError('');
        try { const { data } = await api.post(`${apiBase}/fulfillments/${row.id}/cancel`); await onSaved(data); }
        catch (e) { setError(errorMessage(e)); }
        finally { working.current = false; setBusy(false); }
    }
    return <Dialog open onClose={() => { if (!working.current) onClose(); }} className="ws-orders-dialog" dir={ar ? 'rtl' : 'ltr'} data-workspace-theme={theme}>
        <DialogBackdrop className="ws-orders-backdrop" /><div className="ws-orders-dialog-position"><DialogPanel className="ws-order-action-panel ws-fulfil-panel">
            <header><DialogTitle>{text('إلغاء الشحنة', 'Cancel shipment')}</DialogTitle><button type="button" onClick={onClose} disabled={busy} aria-label={text('إغلاق', 'Close')}><HiOutlineXMark aria-hidden /></button></header>
            <div className="ws-order-action-body">
                <p>{text('ستعود منتجات هذه الشحنة إلى قائمة الانتظار ويُحجز مخزونها للطلب مرة أخرى. لا يُرسل أي إشعار للعميل.', 'The items in this shipment go back to waiting and their stock is held for this order again. The customer is not notified.')}</p>
                {error ? <p role="alert" className="ws-orders-error">{error}</p> : null}
            </div>
            <footer><button type="button" onClick={onClose} disabled={busy}>{text('رجوع', 'Back')}</button><button type="button" className="ws-order-danger-button" disabled={busy} onClick={() => void confirm()}>{busy ? text('جار الإلغاء…', 'Cancelling…') : text('إلغاء الشحنة', 'Cancel shipment')}</button></footer>
        </DialogPanel></div>
    </Dialog>;
}
