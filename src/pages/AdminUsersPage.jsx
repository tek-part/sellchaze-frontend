import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../api/client';
import ConfirmDialog from '../components/ConfirmDialog';
import { IndexFilters, IndexTable, downloadCsv, useIndexTable } from '../components/data-table';
import { fetchAllPages } from '../utils/fetchAllPages';
import { impersonateUserId } from '../utils/impersonationApi';
import {
    HiOutlineCheckBadge, HiOutlineCheckCircle, HiOutlineClock, HiOutlineEye, HiOutlineNoSymbol, HiOutlinePencilSquare, HiOutlinePlus,
    HiOutlineSignal, HiOutlineTrash, HiOutlineUserCircle, HiOutlineUsers,
} from '../components/workspace/WorkspaceIcons';

function unwrapUser(payload) {
    if (!payload) {
        return null;
    }
    return payload.data ?? payload;
}

const DEFAULTS = { sort: null, perPage: 25 };
const errorText = (e) => e.response?.data?.message || e.message;

export default function AdminUsersPage() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { isAdmin, me, permissions = [] } = useOutletContext();
    const can = (p) => permissions.includes(p);
    const canListEmployees = can('users-list');
    const canListPending = can('users-pending-list');
    const canAccessEmployeesSection = canListEmployees || canListPending;
    const canCreateUser = can('users-create') && canListEmployees;
    const canEditUser = can('users-edit');
    const canDeleteUser = can('users-delete');
    const canApprovePending = canEditUser && canListPending;
    const canBulkDelete = (isAdmin || can('activity-logs-list')) && canDeleteUser;
    const canViewMonitoring = isAdmin || can('monitoring-live-view');
    const selfId = me?.id;
    const [searchParams, setSearchParams] = useSearchParams();
    const pendingTab = searchParams.get('pending') === '1';
    const canDeleteHere = canDeleteUser && (pendingTab ? canListPending : canListEmployees);

    const [result, setResult] = useState(null);
    const [err, setErr] = useState('');
    const [loading, setLoading] = useState(true);
    const [reload, setReload] = useState(0);
    const [exporting, setExporting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [toggleTarget, setToggleTarget] = useState(null);
    const [toggleLoading, setToggleLoading] = useState(false);
    const [confirmBulkDelete, setConfirmBulkDelete] = useState(null);
    const [approveTarget, setApproveTarget] = useState(null);
    const [approveLoading, setApproveLoading] = useState(false);
    const [impersonateBusyId, setImpersonateBusyId] = useState(null);

    const handleImpersonate = async (uid) => {
        setImpersonateBusyId(uid);
        await impersonateUserId(uid, t);
        setImpersonateBusyId(null);
    };

    const rolesText = (u) => (Array.isArray(u.roles) && u.roles.length > 0 ? u.roles.join(', ') : '—');
    const statusText = (u) => (pendingTab ? t('admin_users_badge_pending') : u.is_active !== false ? t('status_active') : t('status_inactive'));

    const [roleNames, setRoleNames] = useState([]);
    useEffect(() => {
        let active = true;
        api.get('/admin/roles').then(({ data }) => { if (active) setRoleNames((data.roles ?? []).map((role) => String(role.name ?? '')).filter((name) => name && name !== 'Merchant')); }).catch(() => {});
        return () => { active = false; };
    }, []);
    const filters = useMemo(() => [
        ...(pendingTab ? [] : [
            { key: 'status', label: t('col_status'), type: 'select', options: [{ value: 'active', label: t('status_active') }, { value: 'inactive', label: t('status_inactive') }] },
            ...(roleNames.length ? [{ key: 'role', label: t('roles'), type: 'select', options: roleNames.map((name) => ({ value: name, label: name })) }] : []),
        ]),
        { key: 'created', param: 'date', label: t('col_created'), type: 'date-range' },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [i18n.language, pendingTab, roleNames]);
    const views = useMemo(() => [
        { id: 'all', label: t('filter_all'), state: { filters: {} } },
        ...(pendingTab ? [] : [{ id: 'inactive', label: t('status_inactive'), state: { filters: { status: 'inactive' } } }]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [i18n.language, pendingTab]);
    const columns = useMemo(() => [
        { key: 'name', header: t('col_name'), hideable: false, primary: true, sortKey: 'name', csv: (u) => u.name,
            render: (u) => <Link className="ws-dt-title" to={`/admin/users/${u.id}`}>{u.name}</Link> },
        { key: 'email', header: t('email'), sortKey: 'email', csv: (u) => u.email, render: (u) => <span dir="ltr">{u.email}</span> },
        { key: 'roles', header: pendingTab ? t('admin_users_col_requested_role') : t('roles'), csv: (u) => (pendingTab ? u.registration_role || '' : Array.isArray(u.roles) ? u.roles.join(', ') : ''),
            render: (u) => (pendingTab ? u.registration_role || '—' : <span className="inline-flex flex-wrap items-center gap-1.5">
                {u.pending_approval ? <span className="ws-dt-badge is-warning">{t('admin_users_badge_pending')}</span> : null}
                <span>{rolesText(u)}</span>
            </span>) },
        { key: 'status', header: t('col_status'), csv: statusText,
            render: (u) => <span className={`ws-dt-badge ${pendingTab ? 'is-warning' : u.is_active !== false ? 'is-success' : ''}`}>{statusText(u)}</span> },
        { key: 'created', header: t('col_created'), defaultHidden: true, sortKey: 'created_at', csv: (u) => u.created_at ?? '',
            render: (u) => <span className="ws-dt-num">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</span> },
        { key: 'actions', header: <span className="sr-only">{t('col_actions')}</span>, hideable: false, align: 'end',
            render: (u) => {
                const active = u.is_active !== false;
                return <div className="ws-dt-row-actions">
                    <Link className="ws-dt-icon" to={`/admin/users/${u.id}`} title={t('aria_view')} aria-label={t('aria_view')}><HiOutlineEye aria-hidden /></Link>
                    {!pendingTab && canEditUser ? <Link className="ws-dt-icon" to={`/admin/users/${u.id}/edit`} title={t('aria_edit')} aria-label={t('aria_edit')}><HiOutlinePencilSquare aria-hidden /></Link> : null}
                    {isAdmin && !pendingTab && !u.pending_approval && active && selfId !== u.id ? <button type="button" className="ws-dt-icon" disabled={impersonateBusyId === u.id} onClick={() => void handleImpersonate(u.id)} title={t('aria_impersonate')} aria-label={t('aria_impersonate')}><HiOutlineUserCircle aria-hidden /></button> : null}
                    {canApprovePending && (pendingTab || u.pending_approval) ? <button type="button" className="ws-dt-icon" disabled={loading} onClick={() => setApproveTarget(u)} title={t('admin_user_approve_registration')} aria-label={t('admin_user_approve_registration')}><HiOutlineCheckBadge aria-hidden /></button> : null}
                    {!pendingTab && canEditUser && canListEmployees ? <button type="button" className="ws-dt-icon" disabled={selfId === u.id || loading} onClick={() => setToggleTarget(u)} title={active ? t('action_deactivate') : t('action_activate')} aria-label={active ? t('action_deactivate') : t('action_activate')}>{active ? <HiOutlineNoSymbol aria-hidden /> : <HiOutlineCheckCircle aria-hidden />}</button> : null}
                    {canDeleteHere ? <button type="button" className="ws-dt-icon" disabled={selfId === u.id} onClick={() => setConfirmDelete(u)} title={t('aria_delete')} aria-label={t('aria_delete')}><HiOutlineTrash aria-hidden /></button> : null}
                </div>;
            } },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [i18n.language, pendingTab, canEditUser, canListEmployees, canApprovePending, canDeleteHere, isAdmin, selfId, impersonateBusyId, loading]);

    const table = useIndexTable({ scope: pendingTab ? 'admin:users-pending' : 'admin:users', filters, columns, views, defaults: DEFAULTS });
    const listParams = useMemo(() => ({ ...table.apiParams, ...(pendingTab ? { pending_registration: true } : {}) }), [table.apiParams, pendingTab]);
    const paramsKey = JSON.stringify(listParams);
    const allowed = canAccessEmployeesSection && (pendingTab ? canListPending : canListEmployees);
    useEffect(() => {
        if (!allowed) return undefined;
        let active = true;
        setLoading(true);
        setErr('');
        api.get('/admin/users', { params: listParams })
            .then(({ data }) => { if (active) setResult({ data: (data.data ?? []).map(unwrapUser).filter(Boolean), meta: data.meta ?? null }); })
            .catch((e) => { if (active) setErr(errorText(e)); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allowed, paramsKey, reload]);
    // Staff and pending lists have different columns: never show one list's rows under the other's header.
    useEffect(() => { setResult(null); }, [pendingTab]);

    if (!canAccessEmployeesSection) {
        return <Navigate to="/dashboard" replace />;
    }
    if (pendingTab && !canListPending) {
        return <Navigate to="/admin/users" replace />;
    }
    if (!pendingTab && !canListEmployees) {
        if (canListPending) {
            return <Navigate to="/admin/users?pending=1" replace />;
        }
        return <Navigate to="/dashboard" replace />;
    }

    const rows = result?.data ?? [];
    const selectedRows = [...table.selected.values()];
    const refresh = () => { table.clearSelection(); setReload((value) => value + 1); };
    const patchRow = (id, patch) => setResult((current) => (current ? { ...current, data: current.data.map((row) => (row.id === id ? { ...row, ...patch } : row)) } : current));

    const handleExport = async () => {
        const name = pendingTab ? 'users-pending' : 'users';
        if (selectedRows.length) {
            downloadCsv(`${name}-${new Date().toISOString().slice(0, 10)}.csv`, table.visibleColumns, selectedRows);
            return;
        }
        setExporting(true);
        try {
            const { page: _page, per_page: _perPage, ...base } = listParams;
            const all = (await fetchAllPages('/admin/users', base, { unwrap: unwrapUser })).filter(Boolean);
            downloadCsv(`${name}-all-${new Date().toISOString().slice(0, 10)}.csv`, table.visibleColumns, all);
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
            await api.delete(`/admin/users/${confirmDelete.id}`);
            toast.success(t('staff_deleted_toast'));
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
            await Promise.all(ids.map((id) => api.delete(`/admin/users/${id}`)));
            toast.success(`${t('action_delete')} (${ids.length})`);
            setConfirmBulkDelete(null);
            refresh();
        } catch (e) {
            toast.error(errorText(e));
            refresh();
        } finally {
            setDeleteLoading(false);
        }
    };

    const runToggle = async () => {
        if (!toggleTarget) return;
        setToggleLoading(true);
        try {
            const next = !(toggleTarget.is_active !== false);
            await api.patch(`/admin/users/${toggleTarget.id}/status`, { is_active: next });
            toast.success(next ? t('staff_activated_toast') : t('staff_deactivated_toast'));
            setToggleTarget(null);
            patchRow(toggleTarget.id, { is_active: next });
        } catch (e) {
            toast.error(errorText(e));
        } finally {
            setToggleLoading(false);
        }
    };

    const runApproveFromList = async () => {
        if (!approveTarget) return;
        const { id } = approveTarget;
        setApproveLoading(true);
        try {
            await api.patch(`/admin/users/${id}`, { approve_pending_registration: true, approval_role: 'Staff' });
            toast.success(t('admin_user_approved_toast'));
            setApproveTarget(null);
            if (pendingTab) refresh();
            else patchRow(id, { pending_approval: false, registration_role: null, roles: ['Staff'] });
        } catch (e) {
            toast.error(errorText(e));
        } finally {
            setApproveLoading(false);
        }
    };

    // The signed-in user can never bulk-delete their own account.
    const deletable = (list) => list.filter((u) => u.id !== selfId);
    const bulkActions = canBulkDelete ? [
        { key: 'delete', label: t('action_delete'), icon: HiOutlineTrash, tone: 'danger', disabled: (list) => deleteLoading || deletable(list).length === 0,
            onAction: (list) => setConfirmBulkDelete(deletable(list).map((u) => u.id)) },
    ] : [];

    const tabClass = (activeTab, tone) => `rounded-lg px-4 py-2 text-sm font-semibold transition ${activeTab ? `${tone} text-white shadow-xs` : 'text-slate-600 hover:bg-slate-50'}`;

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3 border-s-4 border-brand ps-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t('nav_employees')}</h1>
                    <p className="mt-1 text-sm text-slate-500">{t('admin_users_subtitle')}</p>
                    {canListEmployees && canListPending ? (
                        <div className="mt-3 inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-xs">
                            <button type="button" onClick={() => setSearchParams({})} className={tabClass(!pendingTab, 'bg-brand')}>
                                {t('admin_users_tab_staff')}
                            </button>
                            <button type="button" onClick={() => setSearchParams({ pending: '1' })} className={tabClass(pendingTab, 'bg-amber-600')}>
                                {t('admin_users_tab_pending')}
                            </button>
                        </div>
                    ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {!pendingTab && canCreateUser ? (
                        <button
                            type="button"
                            onClick={() => navigate('/admin/users/new')}
                            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-brand px-4 text-sm font-semibold text-white shadow-xs transition hover:bg-brand-dark"
                        >
                            <HiOutlinePlus className="h-4 w-4" aria-hidden />
                            {t('staff_add_user')}
                        </button>
                    ) : null}
                    {canViewMonitoring ? (
                        <>
                            <Link
                                to="/admin/monitoring/live"
                                className="inline-flex h-10 items-center gap-1 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                                <HiOutlineSignal className="h-4 w-4" />
                                {t('nav_monitoring_live')}
                            </Link>
                            <Link
                                to="/admin/monitoring/sessions"
                                className="inline-flex h-10 items-center gap-1 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                                <HiOutlineClock className="h-4 w-4" />
                                {t('monitoring_view_all_sessions')}
                            </Link>
                        </>
                    ) : null}
                </div>
            </div>
            <div className="ws-dt-card">
                <IndexFilters table={table} searchPlaceholder={t('admin_dt_search_name_email')} onExport={() => void handleExport()} exportDisabled={loading || exporting || !rows.length} />
                <IndexTable table={table} rows={rows} loading={loading} error={err} onRetry={() => setReload((value) => value + 1)} meta={result?.meta}
                    label={pendingTab ? t('admin_users_tab_pending') : t('nav_employees')} bulkActions={bulkActions} rowHref={(u) => `/admin/users/${u.id}`}
                    emptyState={{ icon: HiOutlineUsers, title: t('empty') }} />
            </div>

            <ConfirmDialog
                open={Boolean(approveTarget)}
                onClose={() => !approveLoading && setApproveTarget(null)}
                title={t('admin_user_approve_registration')}
                body={<p className="text-start">{t('admin_user_approve_staff_pending_body')}</p>}
                confirmLabel={t('admin_user_approve_registration')}
                cancelLabel={t('cancel')}
                loading={approveLoading}
                onConfirm={runApproveFromList}
            />
            <ConfirmDialog
                open={Boolean(confirmDelete)}
                onClose={() => !deleteLoading && setConfirmDelete(null)}
                title={t('confirm_delete_user_title')}
                body={t('confirm_delete_user_body', { name: confirmDelete?.name ?? '' })}
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
                body={t('confirm_bulk_delete_body')}
                confirmLabel={t('action_delete')}
                cancelLabel={t('cancel')}
                danger
                loading={deleteLoading}
                onConfirm={runBulkDelete}
            />
            <ConfirmDialog
                open={Boolean(toggleTarget)}
                onClose={() => !toggleLoading && setToggleTarget(null)}
                title={toggleTarget?.is_active !== false ? t('confirm_deactivate_user_title') : t('confirm_activate_user_title')}
                body={toggleTarget?.is_active !== false
                    ? t('confirm_deactivate_user_body', { name: toggleTarget?.name ?? '' })
                    : t('confirm_activate_user_body', { name: toggleTarget?.name ?? '' })}
                confirmLabel={t('btn_confirm')}
                cancelLabel={t('cancel')}
                loading={toggleLoading}
                onConfirm={runToggle}
            />
        </div>
    );
}
