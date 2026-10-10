import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';
import { variantStockPreview, variantStockTargets } from '../../lib/variant-stock-preview';

const field = 'mt-1 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm';
const button = 'rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold disabled:opacity-40';
const errorText = (e) => Object.values(e.response?.data?.errors || {}).flat().join(' ') || e.response?.data?.message || e.message;

export default function StoreVariantStockActions({ path, rows, canEdit, canDelete, onSaved, onProductHidden }) {
    const { i18n } = useTranslation(); const ar = i18n.language.startsWith('ar'); const text = (a, e) => ar ? a : e;
    const [selected, setSelected] = useState([]); const [search, setSearch] = useState('');
    const [mode, setMode] = useState('set'); const [quantity, setQuantity] = useState(''); const [tracking, setTracking] = useState('keep'); const [note, setNote] = useState('');
    const [review, setReview] = useState(null); const [confirmed, setConfirmed] = useState(false);
    const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [saved, setSaved] = useState(''); const inFlight = useRef(false);
    const targets = rows.filter((row) => selected.includes(row.id));
    const visible = rows.filter((row) => `${row.name} ${row.sku || ''}`.toLowerCase().includes(search.trim().toLowerCase()));
    const preview = variantStockPreview(targets, mode, quantity, tracking);
    const invalid = preview.error === 'quantity' ? text('يجب أن تكون كل كمية ناتجة عددًا صحيحًا بين 0 و100000000.', 'Every resulting quantity must be a whole number between 0 and 100000000.')
        : preview.error === 'reserved' ? text('لا يمكن خفض المخزون تحت المحجوز أو إيقاف التتبع مع وجود حجوزات.', 'Cannot undercut reserved quantities or disable tracking while reservations exist.') : '';
    function prepare(operation) {
        setError(''); setSaved(''); setConfirmed(false);
        setReview({ operation, variants: variantStockTargets(targets), names: targets.map((row) => row.name),
            preview: preview.rows, mode, quantity: Number(quantity), tracking, note,
            removesAll: targets.length === rows.length, removedStock: targets.reduce((sum, row) => sum + row.stock_quantity, 0) });
    }
    async function save() {
        if (inFlight.current || (review.operation === 'delete' && !confirmed)) return;
        inFlight.current = true; setBusy(true); setError('');
        try {
            if (review.operation === 'delete') {
                const { data } = await api.delete(`${path}/bulk`, { data: { variants: review.variants, note: review.note, confirm: true } });
                if (data.meta.product_active === false) onProductHidden?.();
                setSaved(`${text('تم حذف الأصناف', 'Variants deleted')}: ${data.meta.deleted}${review.removesAll ? text(' · أصبح المنتج مسودة.', ' · Product is now a draft.') : ''}`);
            } else {
                const { data } = await api.put(`${path}/bulk/inventory`, { variants: review.variants, mode: review.mode, quantity: review.quantity, tracking: review.tracking, note: review.note });
                setSaved(`${text('تم تحديث مخزون الأصناف', 'Variant stock updated')}: ${data.meta.updated}`);
            }
            setReview(null); setSelected([]); await onSaved();
        } catch (e) { setError(errorText(e)); } finally { inFlight.current = false; setBusy(false); }
    }
    async function refresh() {
        setReview(null); setSelected([]);
        try { await onSaved(); setError(''); } catch (e) { setError(errorText(e)); }
    }
    return <details className="rounded-lg border border-slate-200 p-4"><summary className="cursor-pointer font-bold">{text('مخزون وحذف الأصناف جماعيًا', 'Bulk variant stock and deletion')}</summary>
        <p className="my-3 text-sm text-slate-500">{text('تُسجّل كل حركة، وتظل الكميات المحجوزة للطلبات محمية. تُطبّق الدفعة كاملة أو تُرفض كاملة عند أي تعارض.', 'Every movement is recorded and order reservations stay protected. The entire batch is applied or rejected if any conflict occurs.')}</p>
        {saved ? <p role="status" className="mb-3 text-emerald-700">{saved}</p> : null}
        {error ? <div role="alert" className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700"><p>{error}</p><button className={button} disabled={busy} onClick={refresh}>{text('تحديث كميات الأصناف', 'Refresh variant quantities')}</button></div> : null}
        {review ? <div className="space-y-3 rounded-lg bg-slate-50 p-3"><h3 className="font-bold">{review.operation === 'delete' ? text('مراجعة حذف الأصناف', 'Review variant deletion') : text('مراجعة تعديل المخزون', 'Review stock adjustment')} ({review.variants.length})</h3>
            {review.operation === 'delete' ? <><p className="max-h-40 overflow-auto break-words text-sm">{review.names.join(' · ')}</p><p className="text-sm text-red-700">{text('سيُحذف', 'Will remove')} {review.removedStock} {text('وحدة من سجل المخزون الحالي. تحتفظ الطلبات والسجل بتاريخها. لا يمكن التراجع عن حذف الأصناف.', 'units from current inventory. Orders and movement history are retained. Variant deletion cannot be undone.')}</p>{review.removesAll ? <p className="text-sm font-semibold">{text('حذف كل الأصناف يحوّل المنتج إلى مسودة. اضبط مخزون المنتج وأعد نشره لبيعه دون خيارات.', 'Deleting all variants makes this product a draft. Configure base-product stock and republish to sell it without options.')}</p> : null}<label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} disabled={busy} />{text('أؤكد حذف الأصناف المحددة نهائيًا', 'I confirm permanent deletion of the selected variants')}</label></> : <ul className="max-h-72 space-y-2 overflow-auto text-sm">{review.preview.map((row) => <li key={row.id} className="break-words"><b>{row.name}</b>: {row.before} → {row.after} · {text('محجوز', 'Reserved')} {row.reserved} · {row.tracking ? text('مع تتبع', 'Tracked') : text('دون تتبع', 'Untracked')}</li>)}</ul>}
            {review.note ? <p className="break-words text-sm">{text('السبب', 'Reason')}: {review.note}</p> : null}
            <div className="flex flex-wrap gap-2"><button className={`${button} ${review.operation === 'delete' ? 'text-red-700' : ''}`} disabled={busy || (review.operation === 'delete' && !confirmed)} onClick={save}>{review.operation === 'delete' ? text('حذف الأصناف المحددة', 'Delete selected variants') : text('تطبيق تعديل المخزون', 'Apply stock adjustment')}</button><button className={button} disabled={busy} onClick={() => setReview(null)}>{text('العودة للتحديد', 'Back to selection')}</button></div>
        </div> : <fieldset disabled={busy} className="min-w-0 space-y-3">
            <label className="block">{text('بحث أصناف المخزون', 'Search inventory variants')}<input className={field} value={search} onChange={(e) => setSearch(e.target.value)} /></label>
            <div className="flex flex-wrap gap-2"><button className={button} onClick={() => setSelected(Array.from(new Set([...selected, ...visible.map((row) => row.id)])))}>{text('تحديد كميات النتائج', 'Select inventory results')} ({visible.length})</button><button className={button} onClick={() => setSelected([])}>{text('مسح تحديد الكميات', 'Clear inventory selection')}</button><span className="self-center text-sm">{text('المحدد', 'Selected')}: {targets.length}</span></div>
            <div className="max-h-64 space-y-2 overflow-auto rounded-lg border border-slate-200 p-3">{visible.map((row) => <label key={row.id} className="flex items-start gap-2 text-sm"><input type="checkbox" checked={selected.includes(row.id)} onChange={(e) => setSelected(e.target.checked ? [...selected, row.id] : selected.filter((id) => id !== row.id))} /><span className="min-w-0 break-words">{row.name} · {text('فعلية', 'On hand')} {row.stock_quantity} · {text('محجوزة', 'Reserved')} {row.reserved_quantity} · {row.track_inventory ? text('مع تتبع', 'Tracked') : text('دون تتبع', 'Untracked')}</span></label>)}</div>
            <label className="block">{text('سبب العملية (اختياري)', 'Operation note (optional)')}<input className={field} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} /></label>
            {canEdit ? <div className="space-y-3 rounded-lg bg-slate-50 p-3"><div className="grid gap-3 sm:grid-cols-2"><label>{text('طريقة تعديل الكمية', 'Quantity operation')}<select className={field} value={mode} onChange={(e) => setMode(e.target.value)}><option value="set">{text('تعيين كمية فعلية', 'Set on-hand quantity')}</option><option value="increase">{text('زيادة الكمية', 'Increase quantity')}</option><option value="decrease">{text('خفض الكمية', 'Decrease quantity')}</option></select></label><label>{text('الكمية لكل صنف', 'Quantity per variant')}<input className={field} type="number" min="0" max="100000000" step="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} /></label><label>{text('تتبع الكميات', 'Inventory tracking')}<select className={field} value={tracking} onChange={(e) => setTracking(e.target.value)}><option value="keep">{text('إبقاء إعداد كل صنف', 'Keep each variant setting')}</option><option value="on">{text('تفعيل التتبع', 'Enable tracking')}</option><option value="off">{text('إيقاف التتبع', 'Disable tracking')}</option></select></label></div>
                {targets.length && quantity !== '' && invalid ? <p role="alert" className="text-sm text-red-700">{invalid}</p> : null}<button className={button} disabled={!targets.length || !!preview.error} onClick={() => prepare('inventory')}>{text('مراجعة كميات الأصناف', 'Review variant quantities')}</button></div> : null}
            {canDelete ? <div className="space-y-2 border-t border-slate-200 pt-3">{targets.some((row) => row.reserved_quantity > 0) ? <p className="text-sm text-red-700">{text('اشحن الطلبات المحجوزة أو ألغها قبل حذف هذه الأصناف.', 'Ship or cancel reserved orders before deleting these variants.')}</p> : null}<button className={`${button} text-red-700`} disabled={!targets.length || targets.some((row) => row.reserved_quantity > 0)} onClick={() => prepare('delete')}>{text('مراجعة حذف المحدد', 'Review deletion of selected')}</button></div> : null}
        </fieldset>}
    </details>;
}
