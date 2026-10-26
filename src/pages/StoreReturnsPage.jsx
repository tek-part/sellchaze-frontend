import { useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import useStoreScope from '../hooks/useStoreScope';
import { IndexFilters, IndexTable, downloadCsv, useIndexTable } from '../components/data-table';
import { HiOutlineArrowUturnLeft } from '../components/workspace/WorkspaceIcons';
import { RETURN_REASONS, RETURN_RESOLUTIONS, RETURN_STATUSES, RETURN_STATUS_TONES, vocabularyLabel } from '../components/store/orders/order-refunds';
import '../components/store/orders/orders-workspace.css';

const DEFAULTS = { sort: { by: 'created_at', direction: 'desc' }, perPage: 25, perPageOptions: [25, 50, 100] };

/** Returns / المرتجعات: every return request in the store, newest first, linked to its order. */
export default function StoreReturnsPage() {
    const { apiBase } = useStoreScope();
    return <StoreReturns key={apiBase} apiBase={apiBase} />;
}

function StoreReturns({ apiBase }) {
    const { i18n } = useTranslation(); const ar = i18n.language.startsWith('ar'); const text = (a, e) => (ar ? a : e);
    const { uiBase } = useStoreScope(); const { store } = useOutletContext() ?? {};
    const [result, setResult] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [reload, setReload] = useState(0);
    const counts = result?.counts;
    const total = counts ? Object.values(counts).reduce((sum, value) => sum + Number(value || 0), 0) : 0;
    const withCount = (label, value) => (counts ? `${label} (${value})` : label);

    const filters = useMemo(() => [
        { key: 'status', label: text('الحالة', 'Status'), type: 'select', options: RETURN_STATUSES.map(([value, a, e]) => ({ value, label: ar ? a : e })) },
    ], [ar]); // eslint-disable-line react-hooks/exhaustive-deps
    const views = useMemo(() => [
        { id: 'all', label: withCount(text('كل المرتجعات', 'All returns'), total), state: { filters: {} } },
        ...RETURN_STATUSES.map(([value, a, e]) => ({ id: value, label: withCount(ar ? a : e, counts?.[value] || 0), state: { filters: { status: value } } })),
    ], [ar, counts, total]); // eslint-disable-line react-hooks/exhaustive-deps
    const date = (value) => (value ? new Date(value).toLocaleString(ar ? 'ar-EG' : 'en-GB') : '—');
    const items = (row) => row.items.map((item) => `${item.name || `#${item.store_order_item_id}`} × ${item.quantity}`).join('، ');
    const columns = useMemo(() => [
        { key: 'return', header: text('الإرجاع', 'Return'), hideable: false, sortKey: 'id', csv: (row) => row.id,
            render: (row) => <Link className="ws-dt-title" to={`${uiBase}/orders/${row.store_order_id}`}>#{row.id}</Link> },
        { key: 'order', header: text('الطلب', 'Order'), csv: (row) => row.order?.order_number ?? '',
            render: (row) => <bdi className="ws-dt-num">{row.order?.order_number || `#${row.store_order_id}`}</bdi> },
        { key: 'customer', header: text('العميل', 'Customer'), primary: true, csv: (row) => row.order?.customer?.name ?? '',
            render: (row) => <div><span className="ws-dt-title">{row.order?.customer?.name || '—'}</span>{row.order?.customer?.phone ? <span className="ws-dt-sub" dir="ltr">{row.order.customer.phone}</span> : null}</div> },
        { key: 'items', header: text('المنتجات', 'Items'), csv: items, render: (row) => <span>{items(row)}</span> },
        { key: 'reason', header: text('السبب', 'Reason'), csv: (row) => row.reason, render: (row) => vocabularyLabel(RETURN_REASONS, row.reason, ar) },
        { key: 'status', header: text('الحالة', 'Status'), sortKey: 'status', csv: (row) => row.status,
            render: (row) => <span className={`ws-dt-badge ${RETURN_STATUS_TONES[row.status] || ''}`}>{vocabularyLabel(RETURN_STATUSES, row.status, ar)}</span> },
        { key: 'resolution', header: text('الحل', 'Resolution'), defaultHidden: true, csv: (row) => row.resolution ?? '', render: (row) => (row.resolution ? vocabularyLabel(RETURN_RESOLUTIONS, row.resolution, ar) : '—') },
        { key: 'date', header: text('تاريخ الطلب', 'Requested'), sortKey: 'created_at', csv: (row) => row.created_at ?? '', render: (row) => <span className="ws-dt-num">{date(row.created_at)}</span> },
    ], [ar, uiBase]); // eslint-disable-line react-hooks/exhaustive-deps

    const table = useIndexTable({ scope: `store:${store?.id ?? apiBase}:returns`, filters, columns, views, defaults: DEFAULTS });
    const paramsKey = JSON.stringify(table.apiParams);
    useEffect(() => {
        let active = true; setLoading(true); setError('');
        api.get(`${apiBase}/returns`, { params: JSON.parse(paramsKey) }).then(({ data }) => { if (active) setResult(data); })
            .catch((e) => { if (active) setError(e.response?.data?.message || e.message); }).finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [apiBase, paramsKey, reload]);
    const rows = result?.data || [];

    return <section className="ws-orders ws-orders-index ws-returns-page">
        <header className="ws-orders-heading"><div><h1>{text('المرتجعات', 'Returns')}</h1><p>{text('طلبات الإرجاع من عملائك. افتح الطلب لقبول الإرجاع أو رفضه أو تسجيل الاستلام والاسترداد.', 'Return requests from your customers. Open the order to approve, reject, mark received or record the refund.')}</p></div></header>
        <div className="ws-dt-card">
            <IndexFilters table={table} searchPlaceholder={text('ابحث برقم الطلب أو اسم العميل أو الهاتف', 'Search order number, customer or phone')} exportDisabled={!rows.length}
                onExport={() => downloadCsv(`returns-${new Date().toISOString().slice(0, 10)}.csv`, table.visibleColumns, rows)} />
            <IndexTable table={table} rows={rows} loading={loading && !result} error={error} onRetry={() => setReload((value) => value + 1)} meta={result?.meta}
                label={text('المرتجعات', 'Returns')} rowHref={(row) => `${uiBase}/orders/${row.store_order_id}`}
                emptyState={{ icon: HiOutlineArrowUturnLeft, title: text('لا توجد مرتجعات', 'No returns yet'), description: text('ستظهر هنا طلبات الإرجاع التي يرسلها العملاء من حساباتهم.', 'Return requests customers send from their account will appear here.') }} />
        </div>
    </section>;
}
