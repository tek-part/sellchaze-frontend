import { useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import useStoreScope from '../hooks/useStoreScope';
import { IndexFilters, IndexTable, downloadCsv, useIndexTable } from '../components/data-table';
import { HiOutlineDocumentText, HiOutlinePlus } from '../components/workspace/WorkspaceIcons';
import '../components/store/orders/draft-orders.css';

const DEFAULTS = { sort: null, perPage: 25 };

export function draftStatusLabel(status, ar) {
    const labels = { open: ['مفتوحة', 'Open'], invoice_sent: ['تم إرسال الفاتورة', 'Invoice sent'], completed: ['مكتملة', 'Completed'], cancelled: ['ملغاة', 'Cancelled'] };
    const [arabic, english] = labels[status] ?? [status, status];
    return ar ? arabic : english;
}

export function draftStatusTone(status) {
    return status === 'completed' ? 'is-success' : status === 'invoice_sent' ? 'is-info' : status === 'cancelled' ? '' : 'is-warning';
}

export default function StoreDraftOrdersPage() {
    const { apiBase, uiBase } = useStoreScope();
    const { store, permissions = [] } = useOutletContext() ?? {};
    const canManage = permissions.includes('store.orders.manage');
    const { i18n } = useTranslation();
    const ar = i18n.language?.startsWith('ar'); const text = (a, e) => (ar ? a : e);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [reload, setReload] = useState(0);

    const money = (value, currency) => {
        const amount = Number(value);
        if (!Number.isFinite(amount)) return value ?? '—';
        try { return new Intl.NumberFormat(ar ? 'ar-EG' : 'en', currency ? { style: 'currency', currency, maximumFractionDigits: 2 } : { maximumFractionDigits: 2 }).format(amount); } catch { return amount.toFixed(2); }
    };
    const date = (value) => (value ? new Date(value).toLocaleDateString(ar ? 'ar-EG' : 'en') : '—');

    const columns = useMemo(() => [
        { key: 'number', header: text('المسودة', 'Draft'), hideable: false, primary: true, sortKey: 'number', csv: (row) => row.number,
            render: (row) => <Link className="ws-dt-title" dir="ltr" to={`${uiBase}/draft-orders/${row.id}`}>{row.number}</Link> },
        { key: 'customer', header: text('العميل', 'Customer'), csv: (row) => row.customer?.name ?? '',
            render: (row) => <span className="ws-draft-customer-cell"><span>{row.customer?.name || text('بدون عميل', 'No customer')}</span>{row.customer?.phone ? <small dir="ltr">{row.customer.phone}</small> : null}</span> },
        { key: 'status', header: text('الحالة', 'Status'), csv: (row) => row.status,
            render: (row) => <span className={`ws-dt-badge ${draftStatusTone(row.status)}`}>{draftStatusLabel(row.status, ar)}{row.expired && row.status === 'invoice_sent' ? ` · ${text('منتهية', 'Expired')}` : ''}</span> },
        { key: 'items', header: text('القطع', 'Items'), align: 'end', csv: (row) => row.items_count, render: (row) => <span className="ws-dt-num">{row.items_count}</span> },
        { key: 'total', header: text('الإجمالي', 'Total'), align: 'end', sortKey: 'grand_total', csv: (row) => row.grand_total, render: (row) => <span className="ws-dt-num">{money(row.grand_total, row.currency)}</span> },
        { key: 'tags', header: text('الوسوم', 'Tags'), defaultHidden: true, csv: (row) => (row.tags || []).join(' '), render: (row) => (row.tags || []).join('، ') || '—' },
        { key: 'updated', header: text('آخر تعديل', 'Updated'), sortKey: 'updated_at', csv: (row) => row.updated_at ?? '', render: (row) => <span className="ws-dt-num">{date(row.updated_at)}</span> },
        { key: 'created', header: text('تاريخ الإنشاء', 'Created'), defaultHidden: true, sortKey: 'created_at', csv: (row) => row.created_at ?? '', render: (row) => <span className="ws-dt-num">{date(row.created_at)}</span> },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [ar, uiBase]);
    const filters = useMemo(() => [
        { key: 'status', label: text('الحالة', 'Status'), type: 'select', options: ['open', 'invoice_sent', 'completed', 'cancelled'].map((value) => ({ value, label: draftStatusLabel(value, ar) })) },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [ar]);
    const views = useMemo(() => [
        { id: 'all', label: text('الكل', 'All'), state: { filters: {} } },
        { id: 'open', label: draftStatusLabel('open', ar), state: { filters: { status: 'open' } } },
        { id: 'invoice_sent', label: draftStatusLabel('invoice_sent', ar), state: { filters: { status: 'invoice_sent' } } },
        { id: 'completed', label: draftStatusLabel('completed', ar), state: { filters: { status: 'completed' } } },
        { id: 'cancelled', label: draftStatusLabel('cancelled', ar), state: { filters: { status: 'cancelled' } } },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [ar]);
    const table = useIndexTable({ scope: `store:${store?.id ?? apiBase}:draft-orders`, filters, columns, views, defaults: DEFAULTS });
    const paramsKey = JSON.stringify(table.apiParams);
    useEffect(() => {
        if (!canManage) return undefined;
        let active = true; setLoading(true); setError('');
        api.get(`${apiBase}/draft-orders`, { params: table.apiParams })
            .then(({ data }) => { if (active) setResult(data); })
            .catch((e) => { if (active) setError(e.response?.data?.message || e.message); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiBase, paramsKey, reload, canManage]);

    if (!canManage) return <p role="alert">{text('لا توجد صلاحية لإدارة الطلبات.', 'You do not have permission to manage orders.')}</p>;
    const rows = result?.data ?? [];
    const create = <Link to={`${uiBase}/draft-orders/new`} className="ws-dt-button ws-dt-button-primary"><HiOutlinePlus aria-hidden />{text('إنشاء مسودة', 'Create draft')}</Link>;
    return <section className="ws-catalog-page ws-draft-list">
        <header className="ws-catalog-heading">
            <div>
                <h1>{text('المسودات', 'Drafts')}</h1>
                <p>{text('جهّز طلبًا لعميل، أرسل له رابط الفاتورة، ثم حوّله إلى طلب حقيقي.', 'Prepare an order for a customer, share an invoice link, then turn it into a real order.')}</p>
            </div>
            <div className="ws-catalog-actions">{create}</div>
        </header>
        <div className="ws-dt-card">
            <IndexFilters table={table} searchPlaceholder={text('ابحث برقم المسودة أو اسم العميل أو هاتفه', 'Search by draft number, customer name or phone')} exportDisabled={!rows.length}
                onExport={() => downloadCsv(`draft-orders-${new Date().toISOString().slice(0, 10)}.csv`, table.visibleColumns, rows)} />
            <IndexTable table={table} rows={rows} loading={loading} error={error} onRetry={() => setReload((value) => value + 1)} meta={result?.meta}
                label={text('المسودات', 'Drafts')} rowHref={(row) => `${uiBase}/draft-orders/${row.id}`}
                emptyState={{ icon: HiOutlineDocumentText, title: text('لا توجد مسودات بعد', 'No drafts yet'),
                    description: text('أنشئ مسودة لطلب عبر الهاتف أو واتساب وشارك رابط الدفع مع العميل.', 'Create a draft for a phone or WhatsApp order and share a payment link with the customer.'), action: create }} />
        </div>
    </section>;
}
