import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useDebounced } from '../hooks/useDebounced';
import ListToolbar from '../components/table/ListToolbar';
import PaginationBar from '../components/table/PaginationBar';
import TableLoadingOverlay from '../components/table/TableLoadingOverlay';
import TableIconActions from '../components/table/TableIconActions';
import ConfirmDialog from '../components/ConfirmDialog';
import { exportRowsToExcel } from '../utils/exportExcel';
import { fetchAllPages } from '../utils/fetchAllPages';
import { impersonateUserId } from '../utils/impersonationApi';
import { HiOutlineClock, HiOutlineSignal, HiOutlinePlus } from 'react-icons/hi2';

function unwrapUser(payload) {
    if (!payload) {
        return null;
    }
    return payload.data ?? payload;
}

export default function AdminUsersPage() {
    const { t } = useTranslation();
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
    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState(null);
    const [err, setErr] = useState('');
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(20);
    const [searchInput, setSearchInput] = useState('');
    const debouncedSearch = useDebounced(searchInput, 400);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [toggleTarget, setToggleTarget] = useState(null);
    const [toggleLoading, setToggleLoading] = useState(false);
    const [selected, setSelected] = useState(() => new Set());
    const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const pendingTab = searchParams.get('pending') === '1';
    const [approveTarget, setApproveTarget] = useState(null);
    const [approveRole, setApproveRole] = useState('Staff');
    const [approveLoading, setApproveLoading] = useState(false);
    const [impersonateBusyId, setImpersonateBusyId] = useState(null);

    const loadParams = useCallback(() => {
        return {
            page,
            per_page: perPage,
            ...(pendingTab ? { pending_registration: true } : {}),
            ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
            ...(dateFrom ? { date_from: dateFrom } : {}),
            ...(dateTo ? { date_to: dateTo } : {}),
        };
    }, [page, perPage, pendingTab, debouncedSearch, dateFrom, dateTo]);

    useEffect(() => setPage(1), [debouncedSearch, dateFrom, dateTo, perPage, pendingTab]);

    useEffect(() => {
        if (!canAccessEmployeesSection) {
            return;
        }
        setLoading(true);
        setErr('');
        api.get('/admin/users', { params: loadParams() })
            .then(({ data }) => {
                const list = data.data ?? [];
                setRows(list.map(unwrapUser).filter(Boolean));
                setMeta(data.meta ?? null);
            })
            .catch((e) => setErr(e.response?.data?.message || e.message))
            .finally(() => setLoading(false));
    }, [canAccessEmployeesSection, loadParams]);
    useEffect(() => {
        setSelected(new Set());
    }, [rows]);

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

    const cols = [
        { key: 'name', header: t('col_name') },
        { key: 'email', header: t('email') },
        { key: 'roles', header: t('roles') },
        { key: 'status', header: t('col_status') },
    ];

    const toExport = (u) => ({
        name: u.name,
        email: u.email,
        roles: Array.isArray(u.roles) ? u.roles.join(', ') : '',
        status: u.is_active !== false ? t('status_active') : t('status_inactive'),
    });

    const handleExportCurrent = () => {
        exportRowsToExcel(cols, rows.map(toExport), `users-p${page}`, { sheetName: 'Users' });
    };

    const handleExportAll = async () => {
        setLoading(true);
        try {
            const { page: _p, per_page: _pp, ...base } = loadParams();
            const allRaw = await fetchAllPages('/admin/users', { ...base, per_page: 100 }, { unwrap: unwrapUser });
            const all = allRaw.filter(Boolean);
            exportRowsToExcel(cols, all.map(toExport), 'users-all', { sheetName: 'Users' });
        } catch (e) {
            setErr(e.response?.data?.message || e.message);
        } finally {
            setLoading(false);
        }
    };

    const runDelete = async () => {
        if (!confirmDelete) return;
        setDeleteLoading(true);
        try {
            await api.delete(`/admin/users/${confirmDelete.id}`);
            toast.success(t('staff_deleted_toast'));
            setConfirmDelete(null);
            setRows((prev) => prev.filter((r) => r.id !== confirmDelete.id));
        } catch (e) {
            toast.error(e.response?.data?.message || e.message);
        } finally {
            setDeleteLoading(false);
        }
    };
    const toggleRow = (id) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };
    const toggleAll = () => {
        if (selected.size === rows.length) setSelected(new Set());
        else setSelected(new Set(rows.map((r) => r.id).filter((id) => id !== selfId)));
    };
    const runBulkDelete = async () => {
        const ids = [...selected];
        if (ids.length === 0) return;
        setDeleteLoading(true);
        try {
            await Promise.all(ids.map((id) => api.delete(`/admin/users/${id}`)));
            toast.success(`${t('action_delete')} (${ids.length})`);
            setConfirmBulkDelete(false);
            setSelected(new Set());
            setRows((prev) => prev.filter((r) => !ids.includes(r.id)));
        } catch (e) {
            toast.error(e.response?.data?.message || e.message);
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
            setRows((prev) =>
                prev.map((r) => (r.id === toggleTarget.id ? { ...r, is_active: next } : r)),
            );
        } catch (e) {
            toast.error(e.response?.data?.message || e.message);
        } finally {
            setToggleLoading(false);
        }
    };

    const selfId = me?.id;

    const handleImpersonate = async (uid) => {
        setImpersonateBusyId(uid);
        await impersonateUserId(uid, t);
        setImpersonateBusyId(null);
    };


    const setStaffTab = () => {
        setSearchParams({});
    };
    const setPendingTab = () => {
        setSearchParams({ pending: '1' });
    };

    const runApproveFromList = async () => {
        if (!approveTarget) return;
        const id = approveTarget.id;
        const role = pendingTab ? 'Staff' : approveRole;
        setApproveLoading(true);
        try {
            await api.patch(`/admin/users/${id}`, {
                approve_pending_registration: true,
                approval_role: role,
            });
            toast.success(t('admin_user_approved_toast'));
            setApproveTarget(null);
            if (pendingTab || role === 'Supplier') {
                setRows((prev) => prev.filter((r) => r.id !== id));
            } else {
                setRows((prev) =>
                    prev.map((r) =>
                        r.id === id
                            ? { ...r, pending_approval: false, registration_role: null, roles: ['Staff'] }
                            : r,
                    ),
                );
            }
        } catch (e) {
            toast.error(e.response?.data?.message || e.message);
        } finally {
            setApproveLoading(false);
        }
    };

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3 border-s-4 border-brand ps-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t('nav_employees')}</h1>
                    <p className="mt-1 text-sm text-slate-500">{t('admin_users_subtitle')}</p>
                    {canListEmployees && canListPending ? (
                        <div className="mt-3 inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-xs">
                            <button
                                type="button"
                                onClick={setStaffTab}
                                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                                    !pendingTab ? 'bg-brand text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                {t('admin_users_tab_staff')}
                            </button>
                            <button
                                type="button"
                                onClick={setPendingTab}
                                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                                    pendingTab ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
                                }`}
                            >
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
            {err && (
                <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>
            )}
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 shadow-card">
                <ListToolbar
                    searchValue={searchInput}
                    onSearchChange={setSearchInput}
                    perPage={perPage}
                    onPerPageChange={(n) => {
                        setPerPage(n);
                        setPage(1);
                    }}
                    onExportCurrent={handleExportCurrent}
                    onExportAll={handleExportAll}
                    exportDisabled={loading}
                    selectedCount={selected.size}
                    onBulkDelete={
                        canBulkDelete
                            ? () => {
                                  if (selected.size > 0) setConfirmBulkDelete(true);
                              }
                            : undefined
                    }
                    bulkDeleteDisabled={deleteLoading}
                    advanced={
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-[11px] font-semibold uppercase text-slate-500">
                                    {t('filter_date_from')}
                                </label>
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-[11px] font-semibold uppercase text-slate-500">
                                    {t('filter_date_to')}
                                </label>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                                />
                            </div>
                        </div>
                    }
                />
                <div className="relative min-h-48 overflow-auto bg-white">
                    <TableLoadingOverlay show={loading} />
                    <table className="min-w-full text-start text-sm">
                        <thead className="bg-surface-muted/90 text-xs font-semibold uppercase tracking-wide text-slate-600">
                            <tr>
                                {canBulkDelete ? (
                                    <th className="px-3 py-3.5">
                                        <input
                                            type="checkbox"
                                            checked={rows.length > 0 && selected.size === rows.filter((r) => r.id !== selfId).length}
                                            onChange={toggleAll}
                                            aria-label="select all"
                                        />
                                    </th>
                                ) : null}
                                <th className="px-4 py-3.5">{t('col_name')}</th>
                                <th className="px-4 py-3.5">{t('email')}</th>
                                <th className="px-4 py-3.5">{pendingTab ? t('admin_users_col_requested_role') : t('roles')}</th>
                                <th className="px-4 py-3.5">{t('col_status')}</th>
                                <th className="px-4 py-3.5">{t('col_actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 && !loading ? (
                                <tr>
                                    <td colSpan={canBulkDelete ? 6 : 5} className="px-4 py-14 text-center text-sm text-slate-500">
                                        {t('empty')}
                                    </td>
                                </tr>
                            ) : null}
                            {rows.map((u) => (
                                <tr
                                    key={u.id}
                                    className="border-t border-slate-100 transition-colors hover:bg-slate-50/60"
                                >
                                    {canBulkDelete ? (
                                        <td className="px-3 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selected.has(u.id)}
                                                disabled={u.id === selfId}
                                                onChange={() => toggleRow(u.id)}
                                                aria-label={`select ${u.id}`}
                                            />
                                        </td>
                                    ) : null}
                                    <td className="px-4 py-3 font-medium text-slate-900">{u.name}</td>
                                    <td className="px-4 py-3 text-slate-700">{u.email}</td>
                                    <td className="px-4 py-3 text-slate-700">
                                        {pendingTab ? (
                                            u.registration_role || '—'
                                        ) : (
                                            <span className="inline-flex flex-wrap items-center gap-1.5">
                                                {u.pending_approval ? (
                                                    <span className="rounded-sm bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-900">
                                                        {t('admin_users_badge_pending')}
                                                    </span>
                                                ) : null}
                                                <span>
                                                    {Array.isArray(u.roles) && u.roles.length > 0
                                                        ? u.roles.join(', ')
                                                        : '—'}
                                                </span>
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        {pendingTab ? (
                                            <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                                                {t('admin_users_badge_pending')}
                                            </span>
                                        ) : (
                                            <span
                                                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                                    u.is_active !== false
                                                        ? 'bg-emerald-50 text-emerald-800'
                                                        : 'bg-slate-100 text-slate-600'
                                                }`}
                                            >
                                                {u.is_active !== false ? t('status_active') : t('status_inactive')}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap items-center gap-1">
                                            <TableIconActions
                                                viewTo={`/admin/users/${u.id}`}
                                                editTo={
                                                    !pendingTab && canEditUser ? `/admin/users/${u.id}/edit` : undefined
                                                }
                                                showEdit={canEditUser && !pendingTab}
                                                onDelete={
                                                    canDeleteUser &&
                                                    (pendingTab ? canListPending : canListEmployees)
                                                        ? () => setConfirmDelete(u)
                                                        : undefined
                                                }
                                                showDelete={
                                                    canDeleteUser &&
                                                    (pendingTab ? canListPending : canListEmployees)
                                                }
                                                deleteDisabled={selfId === u.id}
                                                showImpersonate={isAdmin && !pendingTab}
                                                onImpersonate={
                                                    isAdmin &&
                                                    !pendingTab &&
                                                    !u.pending_approval &&
                                                    u.is_active !== false &&
                                                    selfId !== u.id
                                                        ? () => void handleImpersonate(u.id)
                                                        : undefined
                                                }
                                                impersonateLoading={impersonateBusyId === u.id}
                                            />
                                            {canApprovePending && (pendingTab || u.pending_approval) ? (
                                                <button
                                                    type="button"
                                                    disabled={loading}
                                                    onClick={() => {
                                                        setApproveRole('Staff');
                                                        setApproveTarget(u);
                                                    }}
                                                    className="rounded-lg border border-amber-300 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-900 hover:bg-amber-100"
                                                >
                                                    {t('admin_user_approve_registration')}
                                                </button>
                                            ) : null}
                                            {!pendingTab && canEditUser && canListEmployees ? (
                                                <button
                                                    type="button"
                                                    disabled={selfId === u.id || loading}
                                                    onClick={() => setToggleTarget(u)}
                                                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                                                >
                                                    {u.is_active !== false ? t('action_deactivate') : t('action_activate')}
                                                </button>
                                            ) : null}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <PaginationBar meta={meta} loading={loading} onPageChange={setPage} />
            </div>

            <ConfirmDialog
                open={Boolean(approveTarget)}
                onClose={() => !approveLoading && setApproveTarget(null)}
                title={t('admin_user_approve_registration')}
                body={
                    pendingTab ? (
                        <p className="text-start">{t('admin_user_approve_staff_pending_body')}</p>
                    ) : (
                        <div className="space-y-3 text-start">
                            <p>{t('admin_user_approval_pick_role')}</p>
                            <label className="flex cursor-pointer items-center gap-2">
                                <input
                                    type="radio"
                                    name="list-approve-role"
                                    checked={approveRole === 'Staff'}
                                    onChange={() => setApproveRole('Staff')}
                                />
                                {t('auth_role_staff')}
                            </label>
                            <label className="flex cursor-pointer items-center gap-2">
                                <input
                                    type="radio"
                                    name="list-approve-role"
                                    checked={approveRole === 'Supplier'}
                                    onChange={() => setApproveRole('Supplier')}
                                />
                                {t('auth_role_supplier')}
                            </label>
                        </div>
                    )
                }
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
                open={confirmBulkDelete}
                onClose={() => !deleteLoading && setConfirmBulkDelete(false)}
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
                title={
                    toggleTarget?.is_active !== false
                        ? t('confirm_deactivate_user_title')
                        : t('confirm_activate_user_title')
                }
                body={
                    toggleTarget?.is_active !== false
                        ? t('confirm_deactivate_user_body', { name: toggleTarget?.name ?? '' })
                        : t('confirm_activate_user_body', { name: toggleTarget?.name ?? '' })
                }
                confirmLabel={t('btn_confirm')}
                cancelLabel={t('cancel')}
                loading={toggleLoading}
                onConfirm={runToggle}
            />
        </div>
    );
}
