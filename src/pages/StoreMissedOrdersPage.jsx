import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import useStoreScope from '../hooks/useStoreScope';
import { fetchAllPages } from '../utils/fetchAllPages';
import { IndexFilters, IndexTable, downloadCsv, useIndexQuery, useIndexTable } from '../components/data-table';
import { HiOutlineArrowDownTray, HiOutlineArrowUturnLeft, HiOutlineCheckCircle, HiOutlineShoppingCart } from '../components/workspace/WorkspaceIcons';

const DEFAULTS = { sort: null, perPage: 25 };

export default function StoreMissedOrdersPage() {
    const { apiBase } = useStoreScope();
    return <MissedOrders key={apiBase} apiBase={apiBase} />;
}

function MissedOrders({ apiBase }) {
    const { i18n } = useTranslation(); const ar = i18n.language.startsWith('ar'); const text = (a, e) => ar ? a : e;
    const { store } = useOutletContext() ?? {};
    const [busy, setBusy] = useState(false); const [actionError, setActionError] = useState('');
    const path = `${apiBase}/missed-orders`;
    const statusLabel = (status) => (status === 'completed' ? text('مكتمل', 'Completed') : text('تحت المراجعة', 'Under review'));
    // Per-status counts arrive with each page of results and label the built-in views.
    const [counts, setCounts] = useState(null);

    const filters = useMemo(() => [
        { key: 'status', label: text('الحالة', 'Status'), type: 'select', options: [{ value: 'under_review', label: statusLabel('under_review') }, { value: 'completed', label: statusLabel('completed') }] },
        { key: 'source', label: text('المصدر', 'Source'), type: 'select', options: [{ value: 'storefront', label: text('المتجر', 'Storefront') }, { value: 'funnel', label: 'Funnels' }] },
        { key: 'date', label: text('تاريخ المحاولة', 'Checkout date'), type: 'date-range' },
    ], [ar]); // eslint-disable-line react-hooks/exhaustive-deps
    const total = (counts?.under_review || 0) + (counts?.completed || 0);
    const withCount = (label, value) => (counts ? `${label} (${value})` : label);
    const views = useMemo(() => [
        { id: 'all', label: withCount(text('جميع الطلبات', 'All orders'), total), state: { filters: {} } },
        { id: 'completed', label: withCount(statusLabel('completed'), counts?.completed || 0), state: { filters: { status: 'completed' } } },
        { id: 'under_review', label: withCount(statusLabel('under_review'), counts?.under_review || 0), state: { filters: { status: 'under_review' } } },
    ], [ar, counts?.completed, counts?.under_review]); // eslint-disable-line react-hooks/exhaustive-deps

    const money = (row) => new Intl.NumberFormat(ar ? 'ar-EG' : 'en-GB', { style: 'currency', currency: row.currency }).format(Number(row.subtotal));
    const columns = useMemo(() => [
        { key: 'customer', header: text('العميل', 'Customer'), hideable: false, primary: true, csv: (row) => row.customer_name ?? '',
            render: (row) => <div><strong className="ws-dt-title">{row.customer_name || '—'}</strong>{row.customer_phone ? <span className="ws-dt-sub" dir="ltr"><a href={`tel:${(row.phone_dial || row.customer_phone).replace(/[^+\d]/g, '')}`}>{row.customer_phone}</a></span> : null}{row.customer_email ? <span className="ws-dt-sub">{row.customer_email}</span> : null}{row.shipping_address || row.notes || row.coupon_code || row.shipping_selection?.region_name || row.shipping_selection?.option_name ? <details><summary>{text('تفاصيل التواصل', 'Contact details')}</summary><p>{Object.values(row.shipping_address || {}).filter(Boolean).join(' · ')}</p>{row.shipping_selection?.region_name ? <p>{row.shipping_selection.region_name}</p> : null}{row.shipping_selection?.option_name ? <p>{row.shipping_selection.option_name}</p> : null}{row.coupon_code ? <p>{text('الكوبون', 'Coupon')}: {row.coupon_code}</p> : null}{row.notes ? <p>{row.notes}</p> : null}</details> : null}</div> },
        { key: 'phone', header: text('الهاتف', 'Phone'), defaultHidden: true, csv: (row) => row.customer_phone ?? '', render: (row) => <span dir="ltr">{row.customer_phone || '—'}</span> },
        { key: 'email', header: text('البريد الإلكتروني', 'Email'), defaultHidden: true, csv: (row) => row.customer_email ?? '', render: (row) => row.customer_email || '—' },
        { key: 'products', header: text('المنتجات', 'Products'), csv: (row) => row.items.map((item) => `${item.name} × ${item.quantity}`).join('; '),
            render: (row) => <div>{row.items.map((item, index) => <div key={`${item.product_id}:${item.variant_id}:${index}`}>{item.name} × {item.quantity}</div>)}</div> },
        { key: 'source', header: text('المصدر', 'Source'), csv: (row) => row.source, render: (row) => (row.source === 'funnel' ? 'Funnels' : text('المتجر', 'Storefront')) },
        { key: 'subtotal', header: text('قيمة المنتجات', 'Product subtotal'), align: 'end', csv: (row) => row.subtotal,
            render: (row) => <span className="ws-dt-num" title={text('قبل الخصم والتوصيل', 'Before discounts and delivery')}>{money(row)}</span> },
        { key: 'activity', header: text('آخر نشاط', 'Last activity'), csv: (row) => row.last_activity_at ?? '', render: (row) => <span className="ws-dt-num">{new Date(row.last_activity_at).toLocaleString(ar ? 'ar-EG' : 'en-GB')}</span> },
        { key: 'status', header: text('الحالة', 'Status'), csv: (row) => row.status,
            render: (row) => <span className={`ws-dt-badge ${row.status === 'completed' ? 'is-success' : 'is-warning'}`}>{statusLabel(row.status)}</span> },
        { key: 'actions', header: <span className="sr-only">{text('إجراءات', 'Actions')}</span>, hideable: false, align: 'end',
            render: (row) => <div className="ws-dt-row-actions"><button type="button" className="ws-dt-button" disabled={busy} onClick={() => updateStatus(row.status === 'completed' ? 'under_review' : 'completed', [row])}>{row.status === 'completed' ? text('إعادة للمراجعة', 'Return to review') : text('تحديد كمكتمل', 'Mark completed')}</button></div> },
    ], [ar, busy]); // eslint-disable-line react-hooks/exhaustive-deps

    const table = useIndexTable({ scope: `store:${store?.id ?? apiBase}:missed-orders`, filters, columns, views, defaults: DEFAULTS });
    const { result, data: rows, meta, loading, error, reload } = useIndexQuery({ url: path, params: table.apiParams });
    useEffect(() => { if (result) setCounts(result.counts ?? null); }, [result]);
    // The 45 s auto-refresh runs in the background: it keeps the current rows on screen instead of
    // flashing the loading state, which made the page look like it kept reloading.
    useEffect(() => { const timer = window.setInterval(() => { if (document.visibilityState !== 'hidden' && !busy) reload({ quiet: true }); }, 45000); return () => window.clearInterval(timer); }, [busy, reload]);
    const pending = loading || table.searching;
    const selectedRows = [...table.selected.values()];

    async function updateStatus(nextStatus, selections) {
        if (busy || !selections.length) return; setBusy(true); setActionError('');
        try { await api.post(`${path}/bulk-status`, { status: nextStatus, leads: selections.map((row) => ({ id: row.id, version: row.edit_version })) }); table.clearSelection(); reload(); }
        catch (e) { setActionError(e.response?.data?.message || e.message); } finally { setBusy(false); }
    }
    async function exportRows() {
        if (busy || pending) return; setBusy(true); setActionError('');
        try {
            if (!selectedRows.length && meta?.total > 10000) throw new Error(text('ضيّق الفلاتر لتصدير 10,000 محاولة أو أقل.', 'Narrow filters to export 10,000 checkouts or fewer.'));
            const { page: _page, per_page: _perPage, ...filterParams } = table.apiParams;
            const data = selectedRows.length ? selectedRows : await fetchAllPages(path, filterParams);
            const href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' })); const link = document.createElement('a'); link.href = href; link.download = 'missed-orders.json'; link.click(); URL.revokeObjectURL(href);
        } catch (e) { setActionError(e.message); } finally { setBusy(false); }
    }
    const bulkActions = [
        { key: 'completed', label: text('تحديد كمكتمل', 'Mark completed'), icon: HiOutlineCheckCircle, disabled: () => busy, onAction: (list) => void updateStatus('completed', list) },
        { key: 'review', label: text('إعادة للمراجعة', 'Return to review'), icon: HiOutlineArrowUturnLeft, disabled: () => busy, onAction: (list) => void updateStatus('under_review', list) },
    ];

    return <section className="ws-catalog-page ws-missed">
        <header className="ws-catalog-heading"><div><h1>{text('الطلبات المفقودة', 'Missed orders')}</h1><p>{text('الطلبات المفقودة هي الطلبات التي لم يتم إرسالها لمتجرك بسبب عدم إكمال العميل للطلب.', 'Missed orders are checkouts the customer did not complete.')}</p></div><div className="ws-catalog-actions"><button type="button" className="ws-dt-button" disabled={busy || pending || (!selectedRows.length && !meta?.total)} onClick={exportRows}><HiOutlineArrowDownTray aria-hidden />{selectedRows.length ? text('تصدير المحدد JSON', 'Export selected (JSON)') : text('تصدير JSON', 'Export JSON')}</button></div></header>
        {actionError ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{actionError}</p> : null}
        <div className="ws-dt-card">
            <IndexFilters table={table} searchPlaceholder={text('الاسم أو الهاتف أو البريد الإلكتروني', 'Name, phone or email')} exportDisabled={!rows.length}
                onExport={() => downloadCsv(`missed-orders-${new Date().toISOString().slice(0, 10)}.csv`, table.visibleColumns, selectedRows.length ? selectedRows : rows)} />
            <IndexTable table={table} rows={rows} loading={loading} error={error} onRetry={reload} meta={meta}
                label={text('الطلبات المفقودة', 'Missed orders')} bulkActions={bulkActions} maxSelection={100}
                emptyState={{ icon: HiOutlineShoppingCart, title: text('لا توجد طلبات مفقودة حتى الآن', 'No missed orders yet'), description: text('تظهر هنا محاولات الشراء التي لم يكملها العملاء لتتواصل معهم.', 'Checkouts that customers did not complete appear here so you can follow up.') }} />
        </div>
    </section>;
}
