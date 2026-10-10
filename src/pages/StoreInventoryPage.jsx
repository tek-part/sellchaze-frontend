import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';
import api from '../api/client';
import useStoreScope from '../hooks/useStoreScope';
import { useDebounced } from '../hooks/useDebounced';

const button = 'rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold disabled:opacity-40';
const field = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm';
const errorText = (e) => Object.values(e.response?.data?.errors || {}).flat().join(' ') || e.response?.data?.message || e.message;

export default function StoreInventoryPage() {
    const { apiBase } = useStoreScope();
    const { i18n } = useTranslation();
    const { permissions = [] } = useOutletContext();
    const ar = i18n.language?.startsWith('ar');
    const text = (a, e) => ar ? a : e;
    const [query, setQuery] = useState('');
    const search = useDebounced(query, 350);
    const [page, setPage] = useState(1);
    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState(null);
    const [busy, setBusy] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saved, setSaved] = useState(false);
    const [edit, setEdit] = useState(null);
    const [history, setHistory] = useState(null);
    const inFlight = useRef(false);
    const generation = useRef(0);
    const load = useCallback(async () => {
        const current = ++generation.current; setLoading(true);
        try {
            const { data } = await api.get(`${apiBase}/catalog/inventory`, { params: { search, page } });
            if (current === generation.current) { setRows(data.data); setMeta(data.meta); }
        } catch (e) { if (current === generation.current) setError(errorText(e)); }
        finally { if (current === generation.current) setLoading(false); }
    }, [apiBase, page, search]);
    useEffect(() => { load(); return () => { generation.current += 1; }; }, [load]);
    async function save(e) {
        e.preventDefault(); if (inFlight.current) return;
        inFlight.current = true; setBusy(true); setError(''); setSaved(false);
        try {
            await api.put(`${apiBase}/catalog/inventory/${edit.productId}`, {
                variant_id: edit.variantId, track_inventory: edit.tracking, stock_quantity: Number(edit.quantity),
                expected_stock: edit.original.stock_quantity, expected_reserved: edit.original.reserved_quantity,
                expected_tracking: edit.original.track_inventory, note: edit.note,
            });
            setEdit(null); setSaved(true); await load();
        } catch (e) { setError(errorText(e)); }
        finally { setBusy(false); inFlight.current = false; }
    }
    async function showHistory(product) {
        setError(''); setHistory({ name: product.name, rows: [], loading: true });
        try {
            const { data } = await api.get(`${apiBase}/catalog/inventory/${product.id}/history`);
            setHistory({ name: product.name, rows: data.data, loading: false });
        } catch (e) { setHistory(null); setError(errorText(e)); }
    }
    const labels = { variant_deleted: text('حذف صنف', 'Variant deleted'), adjusted: text('تعديل الكمية', 'Stock adjustment'), reserved: text('حجز لطلب', 'Order reservation'), shipped: text('شحن الطلب', 'Order shipped'), cancelled: text('فك حجز طلب ملغى', 'Cancelled order released') };
    return <div className="space-y-5">
        <div className="border-s-4 border-brand ps-4"><h1 className="text-2xl font-bold">{text('مخزون المتجر', 'Store inventory')}</h1><p className="mt-2 text-sm text-slate-500">{text('المتاح للبيع = الكمية الفعلية − المحجوز للطلبات. يُفك الحجز عند الإلغاء وتُخصم الكمية عند الشحن.', 'Available to sell = on hand − reserved orders. Cancellation releases reservations; shipping deducts stock.')}</p></div>
        <p className="text-sm text-slate-500">{text('فعّل التتبع للمنتجات محدودة الكمية. المنتجات دون تتبع تقبل الطلبات دون حد مخزون. هذا مخزون المتجر الإلكتروني؛ مخازن التوريد تُدار من قسم المخزون.', 'Enable tracking for limited stock. Untracked products have no inventory limit. This is online store stock; supplier warehouses are managed in Inventory.')}</p>
        {error ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{error}</p> : null}
        {saved ? <p role="status" className="rounded-lg bg-emerald-50 p-3 text-emerald-800">{text('تم حفظ المخزون.', 'Inventory saved.')}</p> : null}
        {edit ? <form onSubmit={save} className="space-y-4 rounded-xl border border-emerald-200 bg-white p-5"><h2 className="font-bold">{edit.name}</h2><fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2"><label className="flex items-center gap-2"><input type="checkbox" checked={edit.tracking} onChange={(e) => setEdit({ ...edit, tracking: e.target.checked })} />{text('تتبع المخزون', 'Track inventory')}</label><label>{text('الكمية الفعلية', 'On-hand quantity')}<input className={field} type="number" min={edit.original.reserved_quantity} max="100000000" step="1" required value={edit.quantity} onChange={(e) => setEdit({ ...edit, quantity: e.target.value })} /></label><label className="sm:col-span-2">{text('سبب التعديل (اختياري)', 'Adjustment reason (optional)')}<input className={field} maxLength={500} value={edit.note} onChange={(e) => setEdit({ ...edit, note: e.target.value })} /></label><p className="text-sm">{text('محجوز حاليًا', 'Currently reserved')}: {edit.original.reserved_quantity}</p><div className="flex gap-2"><button type="submit" className={`${button} bg-brand text-white`}>{busy ? text('جارٍ الحفظ…', 'Saving…') : text('حفظ المخزون', 'Save inventory')}</button><button type="button" className={button} onClick={() => setEdit(null)}>{text('إلغاء', 'Cancel')}</button></div></fieldset></form> : null}
        <div className="flex gap-3"><input className={field} aria-label={text('بحث المنتجات', 'Search products')} placeholder={text('بحث باسم المنتج', 'Search by product name')} value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} /><button type="button" className={button} disabled={loading} onClick={load}>{text('تحديث', 'Refresh')}</button></div>
        {loading ? <p role="status">{text('جارٍ التحميل…', 'Loading…')}</p> : <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white"><table className="w-full text-start text-sm"><thead className="bg-slate-50"><tr>{[text('المنتج / الخيار', 'Product / option'), text('الفعلية', 'On hand'), text('المحجوزة', 'Reserved'), text('المتاحة', 'Available'), text('الإجراءات', 'Actions')].map((label) => <th className="p-3 text-start" key={label}>{label}</th>)}</tr></thead><tbody>{rows.flatMap((product) => (product.variants.length ? product.variants : [product]).map((stock) => <tr key={`${product.id}-${product.variants.length ? stock.id : 'base'}`} className="border-t border-slate-100"><td className="p-3"><b>{product.name}</b>{product.variants.length ? <p>{stock.name}</p> : null}<p className="text-xs text-slate-500">{stock.sku}</p></td><td className="p-3">{stock.stock_quantity}</td><td className="p-3">{stock.reserved_quantity}</td><td className="p-3">{stock.track_inventory ? Math.max(0, stock.stock_quantity - stock.reserved_quantity) : text('دون تتبع', 'Untracked')}</td><td className="p-3"><div className="flex flex-wrap gap-2">{permissions.includes('products-edit') ? <button type="button" className={button} onClick={() => { setSaved(false); setError(''); setEdit({ productId: product.id, variantId: product.variants.length ? stock.id : null, name: `${product.name}${product.variants.length ? ` — ${stock.name}` : ''}`, tracking: stock.track_inventory, quantity: stock.stock_quantity, original: stock, note: '' }); }}>{text('تعديل', 'Edit')}</button> : null}<button type="button" className={button} onClick={() => showHistory(product)}>{text('السجل', 'History')}</button></div></td></tr>))}</tbody></table>{!rows.length ? <p className="p-5 text-slate-500">{text('لا توجد منتجات مطابقة.', 'No matching products.')}</p> : null}</div>}
        {meta ? <div className="flex items-center justify-between"><button className={button} disabled={page <= 1 || loading} onClick={() => setPage(page - 1)}>{text('السابق', 'Previous')}</button><span>{page} / {meta.last_page}</span><button className={button} disabled={page >= meta.last_page || loading} onClick={() => setPage(page + 1)}>{text('التالي', 'Next')}</button></div> : null}
        {history ? <section className="rounded-xl border border-slate-200 bg-white p-5"><div className="flex justify-between"><h2 className="font-bold">{text('آخر 40 حركة', 'Latest 40 movements')} · {history.name}</h2><button className={button} onClick={() => setHistory(null)}>{text('إغلاق', 'Close')}</button></div>{history.loading ? <p>{text('جارٍ التحميل…', 'Loading…')}</p> : <ul className="mt-4 space-y-3">{history.rows.map((row) => <li key={row.id} className="border-s-2 border-emerald-100 ps-3 text-sm"><b>{labels[row.reason] || row.reason}</b> · {new Date(row.created_at).toLocaleString(ar ? 'ar-EG' : 'en-GB')}<p>{text('الفعلية / المحجوزة بعد الحركة', 'On hand / reserved after movement')}: {row.stock_after} / {row.reserved_after}{row.variant_id ? ` · ${text('خيار', 'Option')} #${row.variant_id}` : ''}</p>{row.note ? <p className="text-slate-500">{row.note}</p> : null}</li>)}</ul>}{!history.loading && !history.rows.length ? <p>{text('لا توجد حركات بعد.', 'No movements yet.')}</p> : null}</section> : null}
    </div>;
}
