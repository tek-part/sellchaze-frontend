import { useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlineShoppingBag, HiOutlineUsers } from '../components/workspace/WorkspaceIcons';
import { IndexFilters, IndexTable, downloadCsv, useIndexTable } from '../components/data-table';
import api from '../api/client';
import useStoreScope from '../hooks/useStoreScope';
import './store/product-list.css';

const errorText = (error) => Object.values(error.response?.data?.errors || {}).flat().join(' ') || error.response?.data?.message || error.message;
const DEFAULTS = { sort: { by: 'last_order_at', direction: 'desc' }, perPage: 25 };
const daysAgo = (days) => new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);

/**
 * Customers built from orders (guest checkouts included), Shopify-style: segments as views,
 * filters on orders count / amount spent / order dates, and a link to each customer's orders.
 */
export default function StoreCustomersPage() {
    const { apiBase, uiBase } = useStoreScope();
    const { store } = useOutletContext();
    const { i18n } = useTranslation();
    const ar = i18n.language.startsWith('ar');
    const text = (a, e) => (ar ? a : e);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [reload, setReload] = useState(0);

    const money = (value) => new Intl.NumberFormat(ar ? 'ar-EG' : 'en', { style: 'currency', currency: store?.currency || 'EGP', maximumFractionDigits: 2 }).format(Number(value || 0));
    const date = (value) => (value ? new Intl.DateTimeFormat(ar ? 'ar-EG' : 'en', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value)) : '—');
    const ordersLink = (customer) => `${uiBase}/orders?search=${encodeURIComponent(customer.phone || customer.email || '')}`;

    const filters = useMemo(() => [
        { key: 'orders', param: 'orders', label: text('عدد الطلبات', 'Number of orders'), type: 'range' },
        { key: 'spent', param: 'spent', label: text('إجمالي الإنفاق', 'Amount spent'), type: 'range' },
        { key: 'last_order', param: 'last_order', label: text('تاريخ آخر طلب', 'Last order date'), type: 'date-range' },
        { key: 'first_order', param: 'first_order', label: text('تاريخ أول طلب (من)', 'First order from'), type: 'date-range' },
        { key: 'account', label: text('الحساب', 'Account'), type: 'select', options: [{ value: 'registered', label: text('لديه حساب', 'Has an account') }, { value: 'guest', label: text('ضيف', 'Guest checkout') }] },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [ar]);
    const views = useMemo(() => [
        { id: 'all', label: text('كل العملاء', 'All customers'), state: { filters: {} } },
        { id: 'repeat', label: text('عملاء متكررون', 'Repeat customers'), state: { filters: { orders: { min: '2', max: '' } } } },
        { id: 'new', label: text('جدد (30 يومًا)', 'New (30 days)'), state: { filters: { first_order: { min: daysAgo(30), max: '' } } } },
        { id: 'inactive', label: text('غير نشطين (90 يومًا)', 'Inactive (90 days)'), state: { filters: { last_order: { min: '', max: daysAgo(90) } } } },
        { id: 'top', label: text('الأعلى إنفاقًا', 'Top spenders'), state: { filters: {}, sort: { by: 'total_spent', direction: 'desc' } } },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [ar]);
    const columns = useMemo(() => [
        { key: 'customer', header: text('العميل', 'Customer'), primary: true, hideable: false, sortKey: 'name', csv: (c) => c.name ?? '',
            render: (c) => <div className="ws-dt-cell-media"><span className="ws-dt-thumb" aria-hidden>{(c.name || '?').trim().charAt(0).toUpperCase()}</span><div><span className="ws-dt-title">{c.name || text('بدون اسم', 'No name')}</span><span className="ws-dt-sub" dir="ltr">{c.phone || c.email || '—'}</span></div></div> },
        { key: 'account', header: text('الحساب', 'Account'), csv: (c) => (c.account_id ? 'registered' : 'guest'),
            render: (c) => <span className={`ws-dt-badge ${c.account_id ? 'is-info' : ''}`}>{c.account_id ? text('لديه حساب', 'Account') : text('ضيف', 'Guest')}</span> },
        { key: 'city', header: text('المدينة', 'Location'), csv: (c) => c.city ?? '', render: (c) => c.city || <span className="ws-dt-sub">—</span> },
        { key: 'orders', header: text('الطلبات', 'Orders'), sortKey: 'orders_count', align: 'end', csv: (c) => c.orders_count,
            render: (c) => <span className="ws-dt-num">{c.orders_count}</span> },
        { key: 'spent', header: text('إجمالي الإنفاق', 'Amount spent'), sortKey: 'total_spent', align: 'end', csv: (c) => c.total_spent,
            render: (c) => <span className="ws-dt-num">{money(c.total_spent)}</span> },
        { key: 'average', header: text('متوسط الطلب', 'Average order'), align: 'end', defaultHidden: true, csv: (c) => (c.orders_count ? (c.total_spent / c.orders_count).toFixed(2) : ''),
            render: (c) => <span className="ws-dt-num">{c.orders_count ? money(c.total_spent / c.orders_count) : '—'}</span> },
        { key: 'last', header: text('آخر طلب', 'Last order'), sortKey: 'last_order_at', csv: (c) => c.last_order_at ?? '', render: (c) => <span className="ws-dt-num">{date(c.last_order_at)}</span> },
        { key: 'first', header: text('أول طلب', 'First order'), sortKey: 'first_order_at', defaultHidden: true, csv: (c) => c.first_order_at ?? '', render: (c) => <span className="ws-dt-num">{date(c.first_order_at)}</span> },
        { key: 'email', header: text('البريد الإلكتروني', 'Email'), defaultHidden: true, csv: (c) => c.email ?? '', render: (c) => <span dir="ltr">{c.email || '—'}</span> },
        { key: 'actions', header: <span className="sr-only">{text('إجراءات', 'Actions')}</span>, hideable: false, align: 'end',
            render: (c) => <div className="ws-dt-row-actions"><Link className="ws-dt-button" to={ordersLink(c)}><HiOutlineShoppingBag aria-hidden />{text('الطلبات', 'Orders')}</Link></div> },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [ar, uiBase, store?.currency]);

    const table = useIndexTable({ scope: `store:${store?.id ?? apiBase}:customers`, filters, columns, views, defaults: DEFAULTS });
    const paramsKey = JSON.stringify(table.apiParams);
    useEffect(() => {
        let active = true;
        setLoading(true);
        setError('');
        api.get(`${apiBase}/customers/directory`, { params: table.apiParams })
            .then(({ data }) => { if (active) setResult(data); })
            .catch((e) => { if (active) setError(errorText(e)); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiBase, paramsKey, reload]);

    const rows = result?.data ?? [];
    const selectedRows = [...table.selected.values()];
    const bulkActions = [{ key: 'export', label: text('تصدير CSV', 'Export CSV'), onAction: (list) => downloadCsv(`customers-${new Date().toISOString().slice(0, 10)}.csv`, table.visibleColumns, list) }];

    return <section className="ws-catalog-page ws-product-list">
        <header className="ws-products-heading"><div className="ws-products-intro">
            <h1>{text('العملاء', 'Customers')}</h1>
            <p>{text('كل من طلب من متجرك، بما في ذلك الطلبات بدون حساب، مع عدد طلباته وإجمالي إنفاقه.', 'Everyone who ordered from your store, including guest checkouts, with their orders and total spend.')}</p>
        </div></header>
        <div className="ws-dt-card">
            <IndexFilters table={table} searchPlaceholder={text('ابحث بالاسم أو الهاتف أو البريد', 'Search name, phone or email')} exportDisabled={!rows.length}
                onExport={() => downloadCsv(`customers-${new Date().toISOString().slice(0, 10)}.csv`, table.visibleColumns, selectedRows.length ? selectedRows : rows)} />
            <IndexTable table={table} rows={rows} rowKey={(c) => c.key} loading={loading} error={error} onRetry={() => setReload((value) => value + 1)} meta={result?.meta}
                label={text('العملاء', 'Customers')} bulkActions={bulkActions} rowHref={ordersLink}
                emptyState={{ icon: HiOutlineUsers, title: text('لا يوجد عملاء بعد', 'No customers yet'), description: text('سيظهر هنا كل عميل يطلب من متجرك تلقائيًا.', 'Everyone who orders from your store will appear here automatically.') }} />
        </div>
    </section>;
}
