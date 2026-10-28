import ReportingMoney from '../components/ReportingMoney';
import { useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlineShoppingBag, HiOutlineUsers } from '../components/workspace/WorkspaceIcons';
import { IndexFilters, IndexTable, downloadCsv, useIndexQuery, useIndexTable } from '../components/data-table';
import api from '../api/client';
import useStoreScope from '../hooks/useStoreScope';
import { customerHref } from '../lib/customerKeys';
import './store/product-list.css';
import './store/customer-detail.css';

const errorText = (error) => Object.values(error.response?.data?.errors || {}).flat().join(' ') || error.response?.data?.message || error.message;
const DEFAULTS = { sort: { by: 'last_order_at', direction: 'desc' }, perPage: 25 };
const daysAgo = (days) => new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);

/** "VIP" segment: amount spent at or above this (EGP stores, else Gulf/USD-scale currencies). Merchants can save their own threshold as a view. */
const vipThreshold = (currency) => (currency === 'EGP' ? '10000' : '1000');

/**
 * Customers built from orders (guest checkouts included), Shopify-style: segments as views,
 * filters on orders count / amount spent / order dates / tags / marketing consent, and a page per customer.
 */
export default function StoreCustomersPage() {
    const { apiBase, uiBase } = useStoreScope();
    const { store } = useOutletContext();
    const { i18n } = useTranslation();
    const ar = i18n.language.startsWith('ar');
    const text = (a, e) => (ar ? a : e);
    const [tags, setTags] = useState([]);
    const [exporting, setExporting] = useState(false);

    const date = (value) => (value ? new Intl.DateTimeFormat(ar ? 'ar-EG' : 'en', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value)) : '—');
    const ordersLink = (customer) => `${uiBase}/orders?search=${encodeURIComponent(customer.phone || customer.email || '')}`;
    const detailLink = (customer) => customerHref(uiBase, customer.key);

    useEffect(() => {
        let active = true;
        api.get(`${apiBase}/customers/tags`).then(({ data }) => { if (active) setTags((data.data ?? []).map((row) => row.tag)); }).catch(() => {});
        return () => { active = false; };
    }, [apiBase]);

    const filters = useMemo(() => [
        { key: 'orders', param: 'orders', label: text('عدد الطلبات', 'Number of orders'), type: 'range' },
        { key: 'spent', param: 'spent', label: `${text('الإنفاق بما يعادل', 'Amount spent equivalent in')} ${store?.currency || 'EGP'}`, type: 'range' },
        { key: 'last_order', param: 'last_order', label: text('تاريخ آخر طلب', 'Last order date'), type: 'date-range' },
        { key: 'first_order', param: 'first_order', label: text('تاريخ أول طلب (من)', 'First order from'), type: 'date-range' },
        { key: 'account', label: text('الحساب', 'Account'), type: 'select', options: [{ value: 'registered', label: text('لديه حساب', 'Has an account') }, { value: 'guest', label: text('ضيف', 'Guest checkout') }] },
        { key: 'tag', label: text('الوسوم', 'Tags'), type: 'multi', options: tags.map((tag) => ({ value: tag, label: tag })) },
        { key: 'marketing', label: text('التسويق', 'Email & SMS marketing'), type: 'select', options: [{ value: 'subscribed', label: text('مشترك', 'Subscribed') }, { value: 'not_subscribed', label: text('غير مشترك', 'Not subscribed') }] },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [ar, tags, store?.currency]);
    const views = useMemo(() => [
        { id: 'all', label: text('كل العملاء', 'All customers'), state: { filters: {} } },
        { id: 'repeat', label: text('عملاء متكررون', 'Repeat customers'), state: { filters: { orders: { min: '2', max: '' } } } },
        { id: 'new', label: text('جدد (30 يومًا)', 'New (30 days)'), state: { filters: { first_order: { min: daysAgo(30), max: '' } } } },
        { id: 'inactive', label: text('غير نشطين (90 يومًا)', 'Inactive (90 days)'), state: { filters: { last_order: { min: '', max: daysAgo(90) } } } },
        { id: 'top', label: text('الأعلى إنفاقًا', 'Top spenders'), state: { filters: {}, sort: { by: 'total_spent', direction: 'desc' } } },
        { id: 'vip', label: text('كبار العملاء', 'VIP'), state: { filters: { spent: { min: vipThreshold(store?.currency || 'EGP'), max: '' } }, sort: { by: 'total_spent', direction: 'desc' } } },
        { id: 'subscribed', label: text('مشتركون في التسويق', 'Subscribed to marketing'), state: { filters: { marketing: 'subscribed' } } },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [ar, store?.currency]);
    const columns = useMemo(() => [
        { key: 'customer', header: text('العميل', 'Customer'), primary: true, hideable: false, sortKey: 'name', csv: (c) => c.name ?? '',
            render: (c) => <div className="ws-dt-cell-media"><span className="ws-dt-thumb" aria-hidden>{(c.name || '?').trim().charAt(0).toUpperCase()}</span><div><Link className="ws-dt-title" to={detailLink(c)}>{c.name || text('بدون اسم', 'No name')}</Link><span className="ws-dt-sub" dir="ltr">{c.phone || c.email || '—'}</span></div></div> },
        { key: 'account', header: text('الحساب', 'Account'), csv: (c) => (c.account_id ? 'registered' : 'guest'),
            render: (c) => <span className={`ws-dt-badge ${c.account_id ? 'is-info' : ''}`}>{c.account_id ? text('لديه حساب', 'Account') : text('ضيف', 'Guest')}</span> },
        { key: 'tags', header: text('الوسوم', 'Tags'), csv: (c) => (c.tags ?? []).join(', '),
            render: (c) => (c.tags?.length ? <div className="ws-customer-row-tags">{c.tags.slice(0, 3).map((tag) => <span key={tag} className="ws-dt-badge">{tag}</span>)}{c.tags.length > 3 ? <span className="ws-dt-sub">+{c.tags.length - 3}</span> : null}</div> : <span className="ws-dt-sub">—</span>) },
        { key: 'marketing', header: text('التسويق', 'Marketing'), csv: (c) => (c.accepts_marketing ? 'subscribed' : 'not subscribed'),
            render: (c) => <span className={`ws-dt-badge ${c.accepts_marketing ? 'is-success' : ''}`}>{c.accepts_marketing ? text('مشترك', 'Subscribed') : text('غير مشترك', 'Not subscribed')}</span> },
        { key: 'city', header: text('المدينة', 'Location'), csv: (c) => c.city ?? '', render: (c) => c.city || <span className="ws-dt-sub">—</span> },
        { key: 'orders', header: text('الطلبات', 'Orders'), sortKey: 'orders_count', align: 'end', csv: (c) => c.orders_count,
            render: (c) => <span className="ws-dt-num">{c.orders_count}</span> },
        { key: 'spent', header: text('إجمالي الإنفاق', 'Amount spent'), sortKey: 'total_spent', align: 'end', csv: (c) => c.total_spent,
            render: (c) => <span className="ws-dt-num"><ReportingMoney value={c.total_spent} report={c.reporting_money} currency={c.currency || store?.currency} /></span> },
        { key: 'average', header: text('متوسط الطلب', 'Average order'), align: 'end', defaultHidden: true, csv: (c) => c.reporting_money?.average_base_equivalent ?? '',
            render: (c) => <span className="ws-dt-num"><ReportingMoney value={c.reporting_money?.average_base_equivalent} report={c.reporting_money} currency={c.currency || store?.currency} average /></span> },
        { key: 'last', header: text('آخر طلب', 'Last order'), sortKey: 'last_order_at', csv: (c) => c.last_order_at ?? '', render: (c) => <span className="ws-dt-num">{date(c.last_order_at)}</span> },
        { key: 'first', header: text('أول طلب', 'First order'), sortKey: 'first_order_at', defaultHidden: true, csv: (c) => c.first_order_at ?? '', render: (c) => <span className="ws-dt-num">{date(c.first_order_at)}</span> },
        { key: 'email', header: text('البريد الإلكتروني', 'Email'), defaultHidden: true, csv: (c) => c.email ?? '', render: (c) => <span dir="ltr">{c.email || '—'}</span> },
        { key: 'actions', header: <span className="sr-only">{text('إجراءات', 'Actions')}</span>, hideable: false, align: 'end',
            render: (c) => <div className="ws-dt-row-actions"><Link className="ws-dt-button" to={ordersLink(c)}><HiOutlineShoppingBag aria-hidden />{text('الطلبات', 'Orders')}</Link></div> },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [ar, uiBase, store?.currency]);

    const table = useIndexTable({ scope: `store:${store?.id ?? apiBase}:customers`, filters, columns, views, defaults: DEFAULTS });
    const { data: rows, meta, loading, error, reload, setError } = useIndexQuery({ url: `${apiBase}/customers/directory`, params: table.apiParams, formatError: errorText });
    const selectedRows = [...table.selected.values()];
    const exportAll = async () => {
        setExporting(true);
        try {
            const { per_page: _per, page: _page, ...filters } = table.apiParams;
            const { data } = await api.get(`${apiBase}/customers/directory/export`, { params: filters, responseType: 'blob' });
            const url = URL.createObjectURL(data);
            const link = document.createElement('a');
            link.href = url;
            link.download = `customers-${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (e) {
            setError(errorText(e));
        } finally {
            setExporting(false);
        }
    };
    const exportColumns = [...table.visibleColumns,
        { header: 'Reporting currency', csv: (row) => row.currency || store?.currency || '' },
        { header: 'Original totals by currency', csv: (row) => JSON.stringify(row.reporting_money?.totals_by_currency || {}) },
        { header: 'Equivalent complete', csv: (row) => row.reporting_money?.complete === false ? 'no' : 'yes' },
        { header: 'Policy version', csv: (row) => row.reporting_money?.policy?.version || '' },
    ];
    const bulkActions = [{ key: 'export', label: text('تصدير CSV', 'Export CSV'), onAction: (list) => downloadCsv(`customers-${new Date().toISOString().slice(0, 10)}.csv`, exportColumns, list) }];

    return <section className="ws-catalog-page ws-product-list">
        <header className="ws-products-heading"><div className="ws-products-intro">
            <h1>{text('العملاء', 'Customers')}</h1>
            <p>{text('كل من طلب من متجرك، بما في ذلك الطلبات بدون حساب، مع عدد طلباته وإجمالي إنفاقه.', 'Everyone who ordered from your store, including guest checkouts, with their orders and total spend.')}</p>
        </div></header>
        <div className="ws-dt-card">
            <IndexFilters table={table} searchPlaceholder={text('ابحث بالاسم أو الهاتف أو البريد', 'Search name, phone or email')} exportDisabled={!rows.length || exporting}
                onExport={() => (selectedRows.length ? downloadCsv(`customers-${new Date().toISOString().slice(0, 10)}.csv`, exportColumns, selectedRows) : exportAll())} />
            <IndexTable table={table} rows={rows} rowKey={(c) => c.key} loading={loading} error={error} onRetry={reload} meta={meta}
                label={text('العملاء', 'Customers')} bulkActions={bulkActions} rowHref={detailLink}
                emptyState={{ icon: HiOutlineUsers, title: text('لا يوجد عملاء بعد', 'No customers yet'), description: text('سيظهر هنا كل عميل يطلب من متجرك تلقائيًا.', 'Everyone who orders from your store will appear here automatically.') }} />
        </div>
    </section>;
}
