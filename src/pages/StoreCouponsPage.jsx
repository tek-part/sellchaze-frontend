import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import useStoreScope from '../hooks/useStoreScope';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../api/client';
import ConfirmDialog from '../components/ConfirmDialog';
import { IndexFilters, IndexTable, downloadCsv, useIndexTable } from '../components/data-table';
import { HiOutlinePlus, HiOutlinePencilSquare, HiOutlineTrash, HiOutlineTicket } from '../components/workspace/WorkspaceIcons';
import { fetchAllPages } from '../utils/fetchAllPages';
import { DISCOUNT_TYPES, discountMethodLabel, discountName, discountTypeLabel, summarizeDiscount } from '../features/store/discounts';

// Discounts (codes and automatic) still live on the `/coupons` endpoint: search matches code or
// title; method/type/status filters and sorting are server-side (newest first by default).
const DEFAULTS = { sort: null, perPage: 25 };

export default function StoreCouponsPage() {
    const { id, apiBase, uiBase } = useStoreScope();
    const { store } = useOutletContext() ?? {};
    const { t, i18n } = useTranslation();
    const ar = i18n.language?.startsWith('ar'); const text = (a, e) => (ar ? a : e);

    const [result, setResult] = useState(null);
    const [err, setErr] = useState('');
    const [loading, setLoading] = useState(true);
    const [reload, setReload] = useState(0);
    const [confirmOne, setConfirmOne] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [categoryNames, setCategoryNames] = useState(null);
    const scope = useRef(apiBase); scope.current = apiBase;

    const money = (value) => new Intl.NumberFormat(ar ? 'ar-EG' : 'en', { style: 'currency', currency: store?.currency || 'EGP', maximumFractionDigits: 2 }).format(Number(value));
    const summary = (row) => summarizeDiscount(row, { ar, money, names: { categories: categoryNames ?? {} } });
    const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');
    const expired = (row) => Boolean(row.expires_at) && new Date(row.expires_at) < new Date();

    const columns = useMemo(() => [
        { key: 'code', header: text('الخصم', 'Discount'), hideable: false, primary: true, sortKey: 'code', csv: (row) => discountName(row),
            render: (row) => <div>
                <Link className={`ws-dt-title ${row.method === 'automatic' ? '' : 'font-mono'}`} dir={row.method === 'automatic' ? undefined : 'ltr'} to={`${uiBase}/coupons/${row.id}/edit`}>{discountName(row)}</Link>
                {row.method !== 'automatic' && row.title ? <span className="ws-dt-sub" dir="ltr">{row.code}</span> : null}
            </div> },
        { key: 'method', header: text('الطريقة', 'Method'), csv: (row) => row.method || 'code',
            render: (row) => <span className={`ws-dt-badge ${row.method === 'automatic' ? 'is-info' : ''}`}>{discountMethodLabel(row.method, ar)}</span> },
        { key: 'summary', header: text('التفاصيل', 'Details'), csv: (row) => summary(row), render: (row) => <span className="block min-w-48 max-w-xs whitespace-normal">{summary(row)}</span> },
        { key: 'type', header: t('coupon_type', 'Type'), defaultHidden: true, csv: (row) => row.type, render: (row) => discountTypeLabel(row.type, ar) },
        { key: 'status', header: t('col_status', 'Status'), csv: (row) => (row.is_active ? 'active' : 'inactive'),
            render: (row) => <span className={`ws-dt-badge ${row.is_active ? (expired(row) ? 'is-warning' : 'is-success') : ''}`}>{row.is_active ? (expired(row) ? text('منتهي', 'Expired') : t('status_active', 'Active')) : t('status_inactive', 'Inactive')}</span> },
        { key: 'used', header: t('coupon_used', 'Used'), align: 'end', sortKey: 'usages_count', csv: (row) => row.used_count ?? 0,
            render: (row) => <span className="ws-dt-num">{row.used_count ?? 0}{row.max_uses ? ` / ${row.max_uses}` : ''}</span> },
        { key: 'minimum', header: text('الحد الأدنى للطلب', 'Minimum order'), align: 'end', defaultHidden: true, csv: (row) => row.minimum_order_amount ?? '',
            render: (row) => <span className="ws-dt-num">{row.minimum_order_amount ? Number(row.minimum_order_amount).toFixed(2) : '—'}</span> },
        { key: 'starts', header: text('يبدأ', 'Starts'), defaultHidden: true, csv: (row) => row.starts_at ?? '', render: (row) => <span className="ws-dt-num">{fmtDate(row.starts_at)}</span> },
        { key: 'expires', header: t('coupon_expires', 'Expires'), sortKey: 'expires_at', csv: (row) => row.expires_at ?? '', render: (row) => <span className="ws-dt-num">{fmtDate(row.expires_at)}</span> },
        { key: 'created', header: text('تاريخ الإنشاء', 'Created'), defaultHidden: true, sortKey: 'created_at', csv: (row) => row.created_at ?? '', render: (row) => <span className="ws-dt-num">{fmtDate(row.created_at)}</span> },
        { key: 'actions', header: <span className="sr-only">{t('col_actions', 'Actions')}</span>, hideable: false, align: 'end',
            render: (row) => <div className="ws-dt-row-actions">
                <Link className="ws-dt-icon" to={`${uiBase}/coupons/${row.id}/edit`} aria-label={`${t('action_edit', 'Edit')} ${discountName(row)}`} title={t('action_edit', 'Edit')}><HiOutlinePencilSquare aria-hidden /></Link>
                <button type="button" className="ws-dt-icon" disabled={deleting} onClick={() => setConfirmOne(row.id)} aria-label={`${t('action_delete', 'Delete')} ${discountName(row)}`} title={t('action_delete', 'Delete')}><HiOutlineTrash aria-hidden /></button>
            </div> },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [ar, t, uiBase, deleting, categoryNames, store?.currency]);

    const filters = useMemo(() => [
        { key: 'status', label: t('col_status', 'Status'), type: 'select', options: [
            { value: 'active', label: text('فعال الآن', 'Active now') }, { value: 'scheduled', label: text('مجدول', 'Scheduled') },
            { value: 'expired', label: text('منتهي', 'Expired') }, { value: 'disabled', label: text('معطل', 'Disabled') }] },
        { key: 'method', label: text('الطريقة', 'Method'), type: 'select', options: [
            { value: 'code', label: discountMethodLabel('code', ar) }, { value: 'automatic', label: discountMethodLabel('automatic', ar) }] },
        { key: 'type', label: t('coupon_type', 'Type'), type: 'select', options: DISCOUNT_TYPES.map((type) => ({ value: type, label: discountTypeLabel(type, ar) })) },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [ar, t]);
    const views = useMemo(() => [
        { id: 'all', label: text('الكل', 'All'), state: { filters: {} } },
        { id: 'active', label: text('فعال الآن', 'Active now'), state: { filters: { status: 'active' } } },
        { id: 'scheduled', label: text('مجدول', 'Scheduled'), state: { filters: { status: 'scheduled' } } },
        { id: 'expired', label: text('منتهي', 'Expired'), state: { filters: { status: 'expired' } } },
        { id: 'codes', label: text('أكواد الخصم', 'Codes'), state: { filters: { method: 'code' } } },
        { id: 'automatic', label: text('تلقائية', 'Automatic'), state: { filters: { method: 'automatic' } } },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [ar]);
    const table = useIndexTable({ scope: `store:${store?.id ?? apiBase}:coupons`, filters, columns, views, defaults: DEFAULTS });
    const paramsKey = JSON.stringify(table.apiParams);
    useEffect(() => {
        let active = true; setLoading(true); setErr('');
        api.get(`${apiBase}/coupons`, { params: table.apiParams })
            .then(({ data }) => { if (active) setResult(data); })
            .catch((e) => { if (active) setErr(e.response?.data?.message || e.message); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiBase, paramsKey, reload]);
    useEffect(() => { setConfirmOne(null); setResult(null); }, [apiBase]);

    const rows = result?.data ?? [];

    // Category names for summaries like "10% off Tops" (loaded once, only when a row needs them).
    const needsCategories = rows.some((row) => row.applies_to === 'categories' || row.bxgy?.buy_applies_to === 'categories' || row.bxgy?.get_applies_to === 'categories');
    useEffect(() => {
        if (!needsCategories || categoryNames) return undefined;
        let active = true;
        fetchAllPages(`${apiBase}/catalog/categories`, {}, { maxPages: 5 })
            .then((list) => { if (active) setCategoryNames(Object.fromEntries(list.map((row) => [String(row.id), String(row.name ?? '')]).filter(([, name]) => name))); })
            .catch(() => { if (active) setCategoryNames({}); });
        return () => { active = false; };
    }, [apiBase, needsCategories, categoryNames]);
    useEffect(() => { setCategoryNames(null); }, [apiBase]);

    const runDelete = async () => {
        if (!confirmOne) return;
        const origin = scope.current;
        setDeleting(true);
        try {
            await api.delete(`${apiBase}/coupons/${confirmOne}`);
            if (scope.current !== origin) return;
            toast.success(t('action_delete'));
            setConfirmOne(null);
            setResult((current) => (current ? { ...current, data: current.data.filter((x) => x.id !== confirmOne) } : current));
        } catch (e) {
            toast.error(e.response?.data?.message || e.message);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <section className="ws-catalog-page">
            <header className="ws-catalog-heading">
                <div>
                    <h1>{t('coupons_title', 'Discounts')}</h1>
                    <p>{t('coupons_subtitle', 'Create discount codes and automatic discounts for this store.')}</p>
                </div>
                <div className="ws-catalog-actions">
                    {id ? <Link to="/stores" className="ws-dt-button">← {t('stores_title', 'Stores')}</Link> : null}
                    <Link to={`${uiBase}/coupons/new`} className="ws-dt-button ws-dt-button-primary"><HiOutlinePlus aria-hidden />{t('coupon_create', 'Create discount')}</Link>
                </div>
            </header>

            <div className="ws-dt-card">
                <IndexFilters table={table} searchPlaceholder={text('ابحث بالكود أو العنوان', 'Search by code or title')} exportDisabled={!rows.length}
                    onExport={() => downloadCsv(`discounts-${new Date().toISOString().slice(0, 10)}.csv`, table.visibleColumns, rows)} />
                <IndexTable table={table} rows={rows} loading={loading} error={err} onRetry={() => setReload((value) => value + 1)} meta={result?.meta}
                    label={t('coupons_title', 'Discounts')} rowHref={(row) => `${uiBase}/coupons/${row.id}/edit`}
                    emptyState={{ icon: HiOutlineTicket, title: text('لا توجد خصومات بعد', 'No discounts yet'), description: t('coupons_subtitle', 'Create discount codes and automatic discounts for this store.'),
                        action: <Link className="ws-dt-button ws-dt-button-primary" to={`${uiBase}/coupons/new`}>{t('coupon_create', 'Create discount')}</Link> }} />
            </div>

            <ConfirmDialog
                open={!!confirmOne}
                onClose={() => setConfirmOne(null)}
                title={t('coupon_delete_title', 'Delete discount')}
                body={t('coupon_delete_body', 'This discount will no longer apply at checkout.')}
                confirmLabel={t('action_delete', 'Delete')}
                cancelLabel={t('cancel', 'Cancel')}
                danger
                loading={deleting}
                onConfirm={runDelete}
            />
        </section>
    );
}
