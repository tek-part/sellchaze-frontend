import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useOutletContext } from 'react-router-dom';
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../api/client';
import ConfirmDialog from '../components/ConfirmDialog';
import PageHeader from '../components/PageHeader';
import { IndexFilters, IndexTable, downloadCsv, useIndexTable } from '../components/data-table';
import { fetchAllPages } from '../utils/fetchAllPages';
import {
    HiOutlineBuildingStorefront, HiOutlineEllipsisHorizontal, HiOutlineEye, HiOutlinePencilSquare, HiOutlinePlus, HiOutlineTrash,
} from '../components/workspace/WorkspaceIcons';

const STATUS_TONES = { active: 'is-success', draft: '', suspended: 'is-critical' };
const DEFAULTS = { sort: null, perPage: 25 };
const errorText = (e) => e.response?.data?.message || e.message;

function StoreLogo({ url }) {
    const [failed, setFailed] = useState(false);
    return <span className="ws-dt-thumb">{url && !failed ? <img src={url} alt="" loading="lazy" onError={() => setFailed(true)} /> : <HiOutlineBuildingStorefront aria-hidden />}</span>;
}

export default function StoresPage() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { permissions } = useOutletContext();
    const can = (p) => permissions.includes(p);
    const canList = can('stores-list');
    const canEdit = can('stores-edit');
    const canDelete = can('stores-delete');

    const [result, setResult] = useState(null);
    const [err, setErr] = useState('');
    const [loading, setLoading] = useState(true);
    const [reload, setReload] = useState(0);
    const [exporting, setExporting] = useState(false);
    const [confirmOne, setConfirmOne] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const statusLabel = (s) => t(`store_status_${s}`, s);
    const sections = [
        ['products', t('products_title', 'Products')],
        ['themes', t('store_themes_title', 'Themes')],
        ['pages', t('pages_title', 'Pages')],
        ['coupons', t('coupons_title', 'Discounts')],
        ['orders', t('orders_title', 'Orders')],
        ['analytics', t('analytics_title', 'Analytics')],
        ['reviews', t('reviews_title', 'Reviews')],
    ];

    const statusOptions = ['active', 'draft', 'suspended'].map((value) => ({ value, label: statusLabel(value) }));
    const filters = useMemo(() => [
        { key: 'status', label: t('store_status'), type: 'select', options: statusOptions },
        { key: 'created', param: 'date', label: t('col_created'), type: 'date-range' },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [i18n.language]);
    const views = useMemo(() => [
        { id: 'all', label: t('filter_all'), state: { filters: {} } },
        ...statusOptions.map((option) => ({ id: option.value, label: option.label, state: { filters: { status: option.value } } })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [i18n.language]);
    const columns = useMemo(() => [
        { key: 'id', header: '#', csv: (row) => row.id, render: (row) => <span className="ws-dt-num">{row.id}</span> },
        { key: 'name', header: t('col_name'), hideable: false, primary: true, csv: (row) => row.name,
            render: (row) => <div className="ws-dt-cell-media"><StoreLogo key={row.logo_url || 'empty'} url={row.logo_url} /><div className="min-w-0">
                {canEdit ? <Link className="ws-dt-title" to={`/stores/${row.id}/overview`}>{row.name}</Link> : <span className="ws-dt-title">{row.name}</span>}
                <span className="ws-dt-sub" dir="ltr">/{row.slug}</span>
            </div></div> },
        { key: 'slug', header: 'Slug', defaultHidden: true, csv: (row) => row.slug, render: (row) => <span dir="ltr">{row.slug}</span> },
        { key: 'owner_type', header: t('store_owner_type'), defaultHidden: true, csv: (row) => row.owner_type ?? '', render: (row) => row.owner_type ?? '—' },
        { key: 'status', header: t('store_status'), csv: (row) => statusLabel(row.status),
            render: (row) => <span className={`ws-dt-badge ${STATUS_TONES[row.status] ?? ''}`}>{statusLabel(row.status)}</span> },
        { key: 'currency', header: t('store_currency'), csv: (row) => row.currency ?? '', render: (row) => <span dir="ltr">{row.currency || '—'}</span> },
        { key: 'created', header: t('col_created'), csv: (row) => row.created_at ?? '',
            render: (row) => <span className="ws-dt-num">{row.created_at ? new Date(row.created_at).toLocaleDateString() : '—'}</span> },
        { key: 'actions', header: <span className="sr-only">{t('col_actions')}</span>, hideable: false, align: 'end',
            render: (row) => <div className="ws-dt-row-actions">
                {canEdit ? <Link className="ws-dt-icon" to={`/stores/${row.id}/overview`} title={t('aria_view')} aria-label={t('aria_view')}><HiOutlineEye aria-hidden /></Link> : null}
                {canEdit ? <Link className="ws-dt-icon" to={`/stores/${row.id}/edit`} title={t('aria_edit')} aria-label={t('aria_edit')}><HiOutlinePencilSquare aria-hidden /></Link> : null}
                {canEdit ? <Popover className="ws-dt-popover">
                    <PopoverButton className="ws-dt-icon" title={t('admin_dt_store_sections')} aria-label={`${t('admin_dt_store_sections')}: ${row.name}`}><HiOutlineEllipsisHorizontal aria-hidden /></PopoverButton>
                    <PopoverPanel anchor="bottom end" className="ws-dt-menu">
                        <strong>{t('admin_dt_store_sections')}</strong>
                        {sections.map(([path, label]) => <Link key={path} to={`/stores/${row.id}/${path}`} className="block rounded-md px-2 py-1.5 hover:bg-[var(--ws-panel-soft)]">{label}</Link>)}
                    </PopoverPanel>
                </Popover> : null}
                {canDelete ? <button type="button" className="ws-dt-icon" disabled={deleting} onClick={() => setConfirmOne(row.id)} title={t('aria_delete')} aria-label={t('aria_delete')}><HiOutlineTrash aria-hidden /></button> : null}
            </div> },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [i18n.language, canEdit, canDelete, deleting]);

    const table = useIndexTable({ scope: 'admin:stores', filters, columns, views, defaults: DEFAULTS });
    const paramsKey = JSON.stringify(table.apiParams);
    useEffect(() => {
        if (!canList) return undefined;
        let active = true;
        setLoading(true);
        setErr('');
        api.get('/stores', { params: table.apiParams })
            .then(({ data }) => { if (active) setResult(data); })
            .catch((e) => { if (active) setErr(errorText(e)); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canList, paramsKey, reload]);

    if (!canList) {
        return <Navigate to="/dashboard" replace />;
    }

    const rows = result?.data ?? [];
    const selectedRows = [...table.selected.values()];

    const handleExport = async () => {
        if (selectedRows.length) {
            downloadCsv(`stores-${new Date().toISOString().slice(0, 10)}.csv`, table.visibleColumns, selectedRows);
            return;
        }
        setExporting(true);
        try {
            const { page: _page, per_page: _perPage, ...base } = table.apiParams;
            downloadCsv(`stores-all-${new Date().toISOString().slice(0, 10)}.csv`, table.visibleColumns, await fetchAllPages('/stores', base));
        } catch (e) {
            toast.error(errorText(e));
        } finally {
            setExporting(false);
        }
    };

    const runDeleteOne = async () => {
        if (!confirmOne) return;
        setDeleting(true);
        try {
            await api.delete(`/stores/${confirmOne}`);
            toast.success(t('action_delete'));
            setConfirmOne(null);
            table.clearSelection();
            setReload((value) => value + 1);
        } catch (e) {
            toast.error(errorText(e));
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="space-y-5">
            <PageHeader
                title={t('stores_title')}
                subtitle={t('stores_subtitle')}
                action={can('stores-create') ? (
                    <button
                        type="button"
                        onClick={() => navigate('/stores/new')}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-brand-dark"
                    >
                        <HiOutlinePlus className="h-4 w-4" aria-hidden />
                        {t('table_create')}
                    </button>
                ) : null}
            />
            <div className="ws-dt-card">
                <IndexFilters table={table} searchPlaceholder={t('admin_dt_search_stores')} onExport={() => void handleExport()} exportDisabled={loading || exporting || !rows.length} />
                <IndexTable table={table} rows={rows} loading={loading} error={err} onRetry={() => setReload((value) => value + 1)} meta={result?.meta}
                    label={t('stores_title')} rowHref={canEdit ? (row) => `/stores/${row.id}/overview` : undefined}
                    emptyState={{ icon: HiOutlineBuildingStorefront, title: t('empty'), description: t('stores_subtitle') }} />
            </div>
            <p className="text-sm text-slate-600">{t('stores_manage_hint')}</p>

            <ConfirmDialog
                open={!!confirmOne}
                onClose={() => setConfirmOne(null)}
                title={t('confirm_delete_title')}
                body={t('confirm_delete_body')}
                confirmLabel={t('action_delete')}
                cancelLabel={t('cancel')}
                danger
                loading={deleting}
                onConfirm={runDeleteOne}
            />
        </div>
    );
}
