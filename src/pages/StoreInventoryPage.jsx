import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useOutletContext } from 'react-router-dom';
import api from '../api/client';
import useStoreScope from '../hooks/useStoreScope';
import { IndexFilters, IndexTable, downloadCsv, useIndexTable } from '../components/data-table';
import { HiOutlineArrowPath, HiOutlineCube } from '../components/workspace/WorkspaceIcons';

const button = 'rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold disabled:opacity-40';
const field = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm';
const errorText = (e) => Object.values(e.response?.data?.errors || {}).flat().join(' ') || e.response?.data?.message || e.message;
// The inventory endpoint pages 20 products at a time and only supports a name search.
const DEFAULTS = { sort: null, perPage: 20, perPageOptions: [20] };
const NO_FILTERS = [];
const available = (stock) => Math.max(0, stock.stock_quantity - stock.reserved_quantity);

export default function StoreInventoryPage() {
    const { apiBase, uiBase } = useStoreScope();
    const { i18n } = useTranslation();
    const { permissions = [], store } = useOutletContext();
    const ar = i18n.language?.startsWith('ar');
    const text = (a, e) => ar ? a : e;
    const [result, setResult] = useState(null);
    const [reload, setReload] = useState(0);
    const [busy, setBusy] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [loadError, setLoadError] = useState('');
    const [saved, setSaved] = useState(false);
    const [edit, setEdit] = useState(null);
    const [history, setHistory] = useState(null);
    const inFlight = useRef(false);
    const canEdit = permissions.includes('products-edit');
    const openEdit = (product, stock) => { setSaved(false); setError(''); setEdit({ productId: product.id, variantId: product.variants.length ? stock.id : null, name: `${product.name}${product.variants.length ? ` — ${stock.name}` : ''}`, tracking: stock.track_inventory, quantity: stock.stock_quantity, original: stock, note: '' }); };

    const columns = useMemo(() => [
        { key: 'item', header: text('المنتج / الخيار', 'Product / option'), hideable: false, primary: true,
            csv: (row) => (row.variant ? `${row.product.name} — ${row.stock.name}` : row.product.name),
            render: ({ product, stock, variant }) => <div><Link className="ws-dt-title" to={`${uiBase}/products/${product.id}/edit`}>{product.name}</Link>{variant ? <span className="ws-dt-sub">{stock.name}</span> : null}{stock.sku ? <span className="ws-dt-sub" dir="ltr">{stock.sku}</span> : null}</div> },
        { key: 'sku', header: 'SKU', defaultHidden: true, csv: (row) => row.stock.sku ?? '', render: (row) => <span dir="ltr">{row.stock.sku || '—'}</span> },
        { key: 'on_hand', header: text('الفعلية', 'On hand'), align: 'end', csv: (row) => row.stock.stock_quantity, render: (row) => <span className="ws-dt-num">{row.stock.stock_quantity}</span> },
        { key: 'reserved', header: text('المحجوزة', 'Reserved'), align: 'end', csv: (row) => row.stock.reserved_quantity, render: (row) => <span className="ws-dt-num">{row.stock.reserved_quantity}</span> },
        { key: 'available', header: text('المتاحة', 'Available'), align: 'end', csv: (row) => (row.stock.track_inventory ? available(row.stock) : 'untracked'),
            render: ({ stock }) => {
                if (!stock.track_inventory) return <span className="ws-dt-badge">{text('دون تتبع', 'Untracked')}</span>;
                const value = available(stock);
                return value <= 0 ? <span className="ws-dt-badge is-critical">{value}</span> : value <= 5 ? <span className="ws-dt-badge is-warning">{value}</span> : <span className="ws-dt-num">{value}</span>;
            } },
        { key: 'actions', header: <span className="sr-only">{text('الإجراءات', 'Actions')}</span>, hideable: false, align: 'end',
            render: ({ product, stock }) => <div className="ws-dt-row-actions">
                {canEdit ? <button type="button" className="ws-dt-button" onClick={() => openEdit(product, stock)}>{text('تعديل', 'Edit')}</button> : null}
                <button type="button" className="ws-dt-button" onClick={() => showHistory(product)}>{text('السجل', 'History')}</button>
            </div> },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [ar, uiBase, canEdit, apiBase]);

    const table = useIndexTable({ scope: `store:${store?.id ?? apiBase}:inventory`, filters: NO_FILTERS, columns, defaults: DEFAULTS });
    const paramsKey = JSON.stringify(table.apiParams);
    useEffect(() => {
        let active = true; setLoading(true); setLoadError('');
        api.get(`${apiBase}/catalog/inventory`, { params: table.apiParams })
            .then(({ data }) => { if (active) setResult(data); }).catch((e) => { if (active) setLoadError(errorText(e)); }).finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiBase, paramsKey, reload]);
    useEffect(() => { setEdit(null); setHistory(null); setSaved(false); setError(''); setResult(null); }, [apiBase]);

    // One row per stock-keeping line: the product itself, or each of its variants.
    const rows = (result?.data || []).flatMap((product) => (product.variants.length ? product.variants : [product]).map((stock) => ({
        key: `${product.id}-${product.variants.length ? stock.id : 'base'}`, product, stock, variant: product.variants.length > 0,
    })));

    async function save(e) {
        e.preventDefault(); if (inFlight.current) return;
        inFlight.current = true; setBusy(true); setError(''); setSaved(false);
        try {
            await api.put(`${apiBase}/catalog/inventory/${edit.productId}`, {
                variant_id: edit.variantId, track_inventory: edit.tracking, stock_quantity: Number(edit.quantity),
                expected_stock: edit.original.stock_quantity, expected_reserved: edit.original.reserved_quantity,
                expected_tracking: edit.original.track_inventory, note: edit.note,
            });
            setEdit(null); setSaved(true); setReload((value) => value + 1);
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
    const labels = { variant_deleted: text('حذف صنف', 'Variant deleted'), adjusted: text('تعديل الكمية', 'Stock adjustment'), reserved: text('حجز لطلب', 'Order reservation'), shipped: text('شحن الطلب', 'Order shipped'), digital_committed: text('احتساب وحدات رقمية', 'Digital units committed'), cancelled: text('فك حجز طلب ملغى', 'Cancelled order released') };
    return <section className="ws-catalog-page">
        <header className="ws-catalog-heading"><div><h1>{text('مخزون المتجر', 'Store inventory')}</h1><p>{text('المتاح للبيع = الكمية الفعلية − المحجوز للطلبات. يُفك الحجز عند الإلغاء وتُخصم الكمية عند الشحن.', 'Available to sell = on hand − reserved orders. Cancellation releases reservations; shipping deducts stock.')}</p><p>{text('فعّل التتبع للمنتجات محدودة الكمية. المنتجات دون تتبع تقبل الطلبات دون حد مخزون.', 'Enable tracking for limited stock. Untracked products have no inventory limit.')}</p></div></header>
        {error ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{error}</p> : null}
        {saved ? <p role="status" className="rounded-lg bg-emerald-50 p-3 text-emerald-800">{text('تم حفظ المخزون.', 'Inventory saved.')}</p> : null}
        {edit ? <form onSubmit={save} className="space-y-4 rounded-xl border border-emerald-200 bg-white p-5"><h2 className="font-bold">{edit.name}</h2><fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2"><label className="flex items-center gap-2"><input type="checkbox" checked={edit.tracking} onChange={(e) => setEdit({ ...edit, tracking: e.target.checked })} />{text('تتبع المخزون', 'Track inventory')}</label><label>{text('الكمية الفعلية', 'On-hand quantity')}<input className={field} type="number" min={edit.original.reserved_quantity} max="100000000" step="1" required value={edit.quantity} onChange={(e) => setEdit({ ...edit, quantity: e.target.value })} /></label><label className="sm:col-span-2">{text('سبب التعديل (اختياري)', 'Adjustment reason (optional)')}<input className={field} maxLength={500} value={edit.note} onChange={(e) => setEdit({ ...edit, note: e.target.value })} /></label><p className="text-sm">{text('محجوز حاليًا', 'Currently reserved')}: {edit.original.reserved_quantity}</p><div className="flex gap-2"><button type="submit" className={`${button} bg-brand text-white`}>{busy ? text('جارٍ الحفظ…', 'Saving…') : text('حفظ المخزون', 'Save inventory')}</button><button type="button" className={button} onClick={() => setEdit(null)}>{text('إلغاء', 'Cancel')}</button></div></fieldset></form> : null}
        <div className="ws-dt-card">
            <IndexFilters table={table} searchPlaceholder={text('بحث باسم المنتج', 'Search by product name')} exportDisabled={!rows.length}
                actions={<button type="button" className="ws-dt-button" aria-label={text('تحديث', 'Refresh')} disabled={loading} onClick={() => setReload((value) => value + 1)}><HiOutlineArrowPath aria-hidden /><span className="ws-dt-hide-sm">{text('تحديث', 'Refresh')}</span></button>}
                onExport={() => downloadCsv(`inventory-${new Date().toISOString().slice(0, 10)}.csv`, table.visibleColumns, rows)} />
            <IndexTable table={table} rows={rows} rowKey={(row) => row.key} loading={loading} error={loadError} onRetry={() => setReload((value) => value + 1)} meta={result?.meta}
                label={text('مخزون المتجر', 'Store inventory')} emptyState={{ icon: HiOutlineCube, title: text('لا توجد منتجات مطابقة.', 'No matching products.') }} />
        </div>
        {history ? <section className="rounded-xl border border-slate-200 bg-white p-5"><div className="flex justify-between"><h2 className="font-bold">{text('آخر 40 حركة', 'Latest 40 movements')} · {history.name}</h2><button className={button} onClick={() => setHistory(null)}>{text('إغلاق', 'Close')}</button></div>{history.loading ? <p>{text('جارٍ التحميل…', 'Loading…')}</p> : <ul className="mt-4 space-y-3">{history.rows.map((row) => <li key={row.id} className="border-s-2 border-emerald-100 ps-3 text-sm"><b>{labels[row.reason] || row.reason}</b> · {new Date(row.created_at).toLocaleString(ar ? 'ar-EG' : 'en-GB')}<p>{text('الفعلية / المحجوزة بعد الحركة', 'On hand / reserved after movement')}: {row.stock_after} / {row.reserved_after}{row.variant_id ? ` · ${text('خيار', 'Option')} #${row.variant_id}` : ''}</p>{row.note ? <p className="text-slate-500">{row.note}</p> : null}</li>)}</ul>}{!history.loading && !history.rows.length ? <p>{text('لا توجد حركات بعد.', 'No movements yet.')}</p> : null}</section> : null}
    </section>;
}
