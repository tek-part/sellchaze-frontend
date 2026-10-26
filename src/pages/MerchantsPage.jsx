import { useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
    HiOutlineCheckBadge, HiOutlineCheckCircle, HiOutlineEye, HiOutlineGlobeAlt, HiOutlineNoSymbol, HiOutlinePencilSquare,
    HiOutlineTrash, HiOutlineUserCircle, HiOutlineUsers,
} from '../components/workspace/WorkspaceIcons';
import { IndexFilters, IndexTable, downloadCsv, useIndexQuery, useIndexTable } from '../components/data-table';
import api from '../api/client';
import ConfirmDialog from '../components/ConfirmDialog';
import { fetchAllPages } from '../utils/fetchAllPages';
import { impersonateUserId } from '../utils/impersonationApi';
import { publicProfileUrl } from '../config/marketing';

const DEFAULTS = { sort: null, perPage: 25 };
const errorText = (e) => e.response?.data?.message || e.message;

export default function MerchantsPage() {
    const { t, i18n } = useTranslation();
    const { isAdmin = false, me } = useOutletContext() ?? {};
    const selfId = me?.id;
    const showAdminActions = isAdmin;

    const [exporting, setExporting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [confirmBulkDelete, setConfirmBulkDelete] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [toggleTarget, setToggleTarget] = useState(null);
    const [toggleLoading, setToggleLoading] = useState(false);
    const [approveTarget, setApproveTarget] = useState(null);
    const [approveLoading, setApproveLoading] = useState(false);
    const [impersonateBusyId, setImpersonateBusyId] = useState(null);

    const handleImpersonate = async (uid) => {
        setImpersonateBusyId(uid);
        await impersonateUserId(uid, t);
        setImpersonateBusyId(null);
    };

    const statusOf = (row) => (row.pending_approval ? 'pending' : row.is_active !== false ? 'active' : 'inactive');
    const statusLabel = (row) => ({ pending: t('merchants_pending_badge'), active: t('status_active'), inactive: t('status_inactive') })[statusOf(row)];

    const statusOptions = [{ value: 'pending', label: t('merchants_pending_badge') }, { value: 'active', label: t('status_active') }, { value: 'inactive', label: t('status_inactive') }];
    const filters = useMemo(() => [
        { key: 'status', label: t('col_status'), type: 'select', options: statusOptions },
        { key: 'created', param: 'date', label: t('col_created'), type: 'date-range' },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [i18n.language]);
    const views = useMemo(() => [
        { id: 'all', label: t('filter_all'), state: { filters: {} } },
        ...statusOptions.map((option) => ({ id: option.value, label: option.label, state: { filters: { status: option.value } } })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [i18n.language]);
    const columns = useMemo(() => [
        { key: 'name', header: t('col_name'), hideable: false, primary: true, sortKey: 'name', csv: (row) => row.name,
            render: (row) => <div><Link className="ws-dt-title" to={`/merchants/${row.id}`}>{row.name}</Link>{row.username ? <span className="ws-dt-sub" dir="ltr">@{row.username}</span> : null}</div> },
        { key: 'email', header: t('email'), sortKey: 'email', csv: (row) => row.email, render: (row) => <span dir="ltr">{row.email}</span> },
        { key: 'status', header: t('col_status'), csv: statusLabel,
            render: (row) => <span className={`ws-dt-badge ${{ pending: 'is-warning', active: 'is-success', inactive: '' }[statusOf(row)]}`}>{statusLabel(row)}</span> },
        { key: 'pending', header: t('merchants_col_pending'), csv: (row) => (row.pending_approval ? t('yes') : t('no')),
            render: (row) => (row.pending_approval ? t('yes') : t('no')) },
        { key: 'actions', header: <span className="sr-only">{t('col_actions')}</span>, hideable: false, align: 'end',
            render: (row, { loading }) => {
                const active = row.is_active !== false;
                return <div className="ws-dt-row-actions">
                    {row.username ? <a className="ws-dt-icon" href={publicProfileUrl(row.username)} target="_blank" rel="noopener noreferrer" title={t('view_public_profile') || 'View public profile'} aria-label={t('view_public_profile') || 'View public profile'}><HiOutlineGlobeAlt aria-hidden /></a> : null}
                    <Link className="ws-dt-icon" to={`/merchants/${row.id}`} title={t('aria_view')} aria-label={t('aria_view')}><HiOutlineEye aria-hidden /></Link>
                    {showAdminActions ? <Link className="ws-dt-icon" to={`/merchants/${row.id}/edit`} title={t('aria_edit')} aria-label={t('aria_edit')}><HiOutlinePencilSquare aria-hidden /></Link> : null}
                    {showAdminActions && !row.pending_approval && active && selfId !== row.id ? <button type="button" className="ws-dt-icon" disabled={impersonateBusyId === row.id} onClick={() => void handleImpersonate(row.id)} title={t('aria_impersonate')} aria-label={t('aria_impersonate')}><HiOutlineUserCircle aria-hidden /></button> : null}
                    {showAdminActions && row.pending_approval ? <button type="button" className="ws-dt-icon" disabled={loading} onClick={() => setApproveTarget(row)} title={t('merchants_approve_registration')} aria-label={t('merchants_approve_registration')}><HiOutlineCheckBadge aria-hidden /></button> : null}
                    {showAdminActions && !row.pending_approval ? <button type="button" className="ws-dt-icon" disabled={selfId === row.id || loading} onClick={() => setToggleTarget(row)} title={active ? t('action_deactivate') : t('action_activate')} aria-label={active ? t('action_deactivate') : t('action_activate')}>{active ? <HiOutlineNoSymbol aria-hidden /> : <HiOutlineCheckCircle aria-hidden />}</button> : null}
                    {showAdminActions ? <button type="button" className="ws-dt-icon" disabled={selfId === row.id} onClick={() => setConfirmDelete(row)} title={t('aria_delete')} aria-label={t('aria_delete')}><HiOutlineTrash aria-hidden /></button> : null}
                </div>;
            } },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [i18n.language, showAdminActions, selfId, impersonateBusyId]);

    const table = useIndexTable({ scope: 'admin:merchants', filters, columns, views, defaults: DEFAULTS });
    const { data: rows, meta, loading, error: err, reload, setResult } = useIndexQuery({ url: '/merchants', params: table.apiParams, formatError: errorText });

    const selectedRows = [...table.selected.values()];
    const patchRow = (id, patch) => setResult((current) => (current ? { ...current, data: current.data.map((row) => (row.id === id ? { ...row, ...patch } : row)) } : current));
    const refresh = () => { table.clearSelection(); reload(); };

    const handleExport = async () => {
        if (selectedRows.length) {
            downloadCsv(`merchants-${new Date().toISOString().slice(0, 10)}.csv`, table.visibleColumns, selectedRows);
            return;
        }
        setExporting(true);
        try {
            const { page: _page, per_page: _perPage, ...base } = table.apiParams;
            const all = await fetchAllPages('/merchants', base);
            downloadCsv(`merchants-all-${new Date().toISOString().slice(0, 10)}.csv`, table.visibleColumns, all);
        } catch (e) {
            toast.error(errorText(e));
        } finally {
            setExporting(false);
        }
    };

    const runDelete = async () => {
        if (!confirmDelete) return;
        setDeleteLoading(true);
        try {
            await api.delete(`/merchants/${confirmDelete.id}`);
            toast.success(t('merchant_deleted_toast'));
            setConfirmDelete(null);
            refresh();
        } catch (e) {
            toast.error(errorText(e));
        } finally {
            setDeleteLoading(false);
        }
    };

    const runBulkDelete = async () => {
        const ids = confirmBulkDelete ?? [];
        if (ids.length === 0) return;
        setDeleteLoading(true);
        try {
            await api.post('/merchants/bulk-destroy', { ids });
            toast.success(t('merchants_bulk_deleted_toast', { count: ids.length }));
            setConfirmBulkDelete(null);
            refresh();
        } catch (e) {
            toast.error(errorText(e));
        } finally {
            setDeleteLoading(false);
        }
    };

    const runToggle = async () => {
        if (!toggleTarget) return;
        setToggleLoading(true);
        try {
            const next = !(toggleTarget.is_active !== false);
            await api.patch(`/merchants/${toggleTarget.id}/status`, { is_active: next });
            toast.success(next ? t('staff_activated_toast') : t('staff_deactivated_toast'));
            setToggleTarget(null);
            patchRow(toggleTarget.id, { is_active: next });
        } catch (e) {
            toast.error(errorText(e));
        } finally {
            setToggleLoading(false);
        }
    };

    const runApprove = async () => {
        if (!approveTarget) return;
        const { id } = approveTarget;
        setApproveLoading(true);
        try {
            await api.patch(`/admin/users/${id}`, { approve_pending_registration: true, approval_role: 'Merchant' });
            toast.success(t('admin_user_approved_toast'));
            setApproveTarget(null);
            patchRow(id, { pending_approval: false, registration_role: null, is_active: approveTarget.is_active !== false });
        } catch (e) {
            toast.error(errorText(e));
        } finally {
            setApproveLoading(false);
        }
    };

    // The signed-in admin can never select (or bulk-delete) their own account.
    const deletable = (list) => list.filter((row) => row.id !== selfId);
    const bulkActions = showAdminActions ? [
        { key: 'delete', label: t('action_delete'), icon: HiOutlineTrash, tone: 'danger', disabled: (list) => deleteLoading || deletable(list).length === 0,
            onAction: (list) => setConfirmBulkDelete(deletable(list).map((row) => row.id)) },
    ] : [];

    return (
        <div className="space-y-5">
            <div className="border-s-4 border-brand ps-4">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t('merchants')}</h1>
                <p className="mt-1 text-sm text-slate-500">{t('merchants_help')}</p>
            </div>
            <div className="ws-dt-card">
                <IndexFilters table={table} searchPlaceholder={t('admin_dt_search_name_email')} onExport={() => void handleExport()} exportDisabled={loading || exporting || !rows.length} />
                <IndexTable table={table} rows={rows} loading={loading} error={err} onRetry={reload} meta={meta}
                    label={t('merchants')} bulkActions={bulkActions} rowHref={(row) => `/merchants/${row.id}`}
                    emptyState={{ icon: HiOutlineUsers, title: t('empty'), description: t('merchants_help') }} />
            </div>

            <ConfirmDialog
                open={Boolean(approveTarget)}
                onClose={() => !approveLoading && setApproveTarget(null)}
                title={t('merchants_approve_registration')}
                body={t('merchants_approve_confirm_body', { name: approveTarget?.name ?? '' })}
                confirmLabel={t('admin_user_approve_registration')}
                cancelLabel={t('cancel')}
                loading={approveLoading}
                onConfirm={runApprove}
            />
            <ConfirmDialog
                open={Boolean(confirmDelete)}
                onClose={() => !deleteLoading && setConfirmDelete(null)}
                title={t('confirm_delete_merchant_title')}
                body={t('confirm_delete_merchant_body', { name: confirmDelete?.name ?? '' })}
                confirmLabel={t('action_delete')}
                cancelLabel={t('cancel')}
                danger
                loading={deleteLoading}
                onConfirm={runDelete}
            />
            <ConfirmDialog
                open={Boolean(confirmBulkDelete)}
                onClose={() => !deleteLoading && setConfirmBulkDelete(null)}
                title={t('confirm_bulk_delete_title')}
                body={t('confirm_bulk_delete_merchants_body')}
                confirmLabel={t('action_delete')}
                cancelLabel={t('cancel')}
                danger
                loading={deleteLoading}
                onConfirm={runBulkDelete}
            />
            <ConfirmDialog
                open={Boolean(toggleTarget)}
                onClose={() => !toggleLoading && setToggleTarget(null)}
                title={toggleTarget && toggleTarget.is_active !== false ? t('confirm_deactivate_user_title') : t('confirm_activate_user_title')}
                body={toggleTarget && toggleTarget.is_active !== false
                    ? t('confirm_deactivate_user_body', { name: toggleTarget?.name ?? '' })
                    : t('confirm_activate_user_body', { name: toggleTarget?.name ?? '' })}
                confirmLabel={toggleTarget && toggleTarget.is_active !== false ? t('action_deactivate') : t('action_activate')}
                cancelLabel={t('cancel')}
                loading={toggleLoading}
                onConfirm={runToggle}
            />
        </div>
    );
}
