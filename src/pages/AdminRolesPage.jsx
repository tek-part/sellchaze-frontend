import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { Link, Navigate, useNavigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../api/client';
import ConfirmDialog from '../components/ConfirmDialog';
import { IndexFilters, IndexTable, useIndexTable } from '../components/data-table';
import { HiOutlineKey, HiOutlinePencilSquare, HiOutlineTrash } from '../components/workspace/WorkspaceIcons';
import { clientIndexRows } from '../lib/clientIndexRows';
import { exportWorkbookSheets } from '../utils/exportExcel';
import { ROLES_OMITTED_FROM_ADMIN_ROLES_INDEX } from '../config/rolesUi';

const PROTECTED_ROLE_NAMES = ['Admin'];
const DEFAULTS = { sort: null, perPage: 25 };
const NO_FILTERS = [];
const permCount = (r) => (Array.isArray(r.permissions) ? r.permissions.length : 0);
const userCount = (r) => (typeof r.users_count === 'number' ? r.users_count : 0);
// The endpoint returns every role at once; search, sort and paging happen here.
const CLIENT = {
    search: [(r) => r.name],
    sorts: { name: (r) => r.name, users_count: userCount, permissions_count: permCount },
};

export default function AdminRolesPage() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { isAdmin } = useOutletContext();
    const canBulkDelete = isAdmin;
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState('');
    const [reload, setReload] = useState(0);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [usersModalRole, setUsersModalRole] = useState(null);
    const [usersModalRows, setUsersModalRows] = useState([]);
    const [usersModalLoading, setUsersModalLoading] = useState(false);
    const [usersModalErr, setUsersModalErr] = useState('');
    const [confirmBulkDelete, setConfirmBulkDelete] = useState(null);

    useEffect(() => {
        if (!isAdmin) return undefined;
        let active = true;
        setLoading(true);
        setErr('');
        api.get('/admin/roles')
            .then(({ data }) => {
                if (!active) return;
                const raw = data.roles ?? [];
                setRoles(raw.filter((r) => !ROLES_OMITTED_FROM_ADMIN_ROLES_INDEX.includes(String(r.name ?? ''))));
                setPermissions(data.permissions ?? []);
            })
            .catch((e) => { if (active) setErr(e.response?.data?.message || e.message); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [isAdmin, reload]);
    const loadRoles = () => setReload((value) => value + 1);

    const openUsersModal = async (r) => {
        setUsersModalRole(r);
        setUsersModalRows([]);
        setUsersModalErr('');
        setUsersModalLoading(true);
        try {
            const { data } = await api.get(`/admin/roles/${r.id}/users`);
            setUsersModalRows(data.data ?? []);
        } catch (e) {
            setUsersModalErr(e.response?.data?.message || e.message || t('role_users_load_error'));
            toast.error(e.response?.data?.message || e.message || t('role_users_load_error'));
        } finally {
            setUsersModalLoading(false);
        }
    };

    const closeUsersModal = () => {
        setUsersModalRole(null);
        setUsersModalRows([]);
        setUsersModalErr('');
        setUsersModalLoading(false);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const views = useMemo(() => [{ id: 'all', label: t('filter_all'), state: { filters: {} } }], [i18n.language]);
    const columns = useMemo(() => [
        { key: 'name', header: t('name'), hideable: false, primary: true, sortKey: 'name',
            render: (r) => <span className="inline-flex flex-wrap items-center gap-2">
                <Link className="ws-dt-title" to={`/admin/roles/${r.id}/edit`}>{r.name}</Link>
                {PROTECTED_ROLE_NAMES.includes(r.name) ? <span className="ws-dt-badge is-warning">{t('role_protected_badge')}</span> : null}
            </span> },
        { key: 'users', header: t('role_users_col'), sortKey: 'users_count', align: 'end',
            render: (r) => <button type="button" onClick={() => void openUsersModal(r)} className="ws-dt-button ws-dt-num" aria-label={t('role_users_dialog_title', { name: r.name })}>{userCount(r)}</button> },
        { key: 'permissions', header: t('permissions_count_col'), sortKey: 'permissions_count', align: 'end', render: (r) => <span className="ws-dt-num">{permCount(r)}</span> },
        { key: 'actions', header: <span className="sr-only">{t('col_actions')}</span>, hideable: false, align: 'end',
            render: (r) => <div className="ws-dt-row-actions">
                <Link className="ws-dt-icon" to={`/admin/roles/${r.id}/edit`} title={t('action_edit')} aria-label={`${t('action_edit')} ${r.name}`}><HiOutlinePencilSquare aria-hidden /></Link>
                {!PROTECTED_ROLE_NAMES.includes(r.name) ? <button type="button" className="ws-dt-icon" onClick={() => setDeleteTarget(r)} title={t('action_delete')} aria-label={`${t('action_delete')} ${r.name}`}><HiOutlineTrash aria-hidden /></button> : null}
            </div> },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [i18n.language]);

    const table = useIndexTable({ scope: 'admin:roles', filters: NO_FILTERS, columns, views, defaults: DEFAULTS });
    const { rows, meta, all: filteredRoles } = clientIndexRows(roles, table.state, CLIENT);

    if (!isAdmin) {
        return <Navigate to="/dashboard" replace />;
    }

    const handleExportMulti = () => {
        const q = table.state.search.trim().toLowerCase();
        const filteredPerms = q ? permissions.filter((p) => String(p.name).toLowerCase().includes(q)) : permissions;
        exportWorkbookSheets(
            [
                {
                    name: 'Roles',
                    columns: [
                        { key: 'id', header: 'ID' },
                        { key: 'name', header: t('name') },
                        { key: 'users_count', header: t('role_users_col') },
                        { key: 'permissions_count', header: t('permissions_count_col') },
                    ],
                    rows: filteredRoles.map((r) => ({ id: r.id, name: r.name, users_count: userCount(r), permissions_count: permCount(r) })),
                },
                {
                    name: 'Permissions',
                    columns: [
                        { key: 'id', header: 'ID' },
                        { key: 'name', header: t('permissions') },
                    ],
                    rows: filteredPerms,
                },
            ],
            'roles-permissions-export',
        );
    };

    const runDelete = async () => {
        if (!deleteTarget) return;
        setDeleteLoading(true);
        try {
            await api.delete(`/admin/roles/${deleteTarget.id}`);
            toast.success(t('role_deleted_toast'));
            setDeleteTarget(null);
            table.clearSelection();
            loadRoles();
        } catch (e) {
            toast.error(e.response?.data?.message || e.message);
        } finally {
            setDeleteLoading(false);
        }
    };
    const runBulkDelete = async () => {
        const ids = confirmBulkDelete ?? [];
        if (ids.length === 0) return;
        setDeleteLoading(true);
        try {
            await Promise.all(ids.map((id) => api.delete(`/admin/roles/${id}`)));
            toast.success(`${t('action_delete')} (${ids.length})`);
            setConfirmBulkDelete(null);
            table.clearSelection();
            loadRoles();
        } catch (e) {
            toast.error(e.response?.data?.message || e.message);
            loadRoles();
        } finally {
            setDeleteLoading(false);
        }
    };

    // Protected roles (Admin) can never be deleted, even when selected with "select all".
    const deletable = (list) => list.filter((r) => !PROTECTED_ROLE_NAMES.includes(r.name));
    const bulkActions = canBulkDelete ? [
        { key: 'delete', label: t('action_delete'), icon: HiOutlineTrash, tone: 'danger', disabled: (list) => deleteLoading || deletable(list).length === 0,
            onAction: (list) => setConfirmBulkDelete(deletable(list).map((r) => r.id)) },
    ] : [];

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4 border-s-4 border-brand ps-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t('roles')}</h1>
                    <p className="mt-1 text-sm text-slate-500">{t('admin_roles_subtitle')}</p>
                </div>
                <button
                    type="button"
                    onClick={() => navigate('/admin/roles/new')}
                    className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-xs"
                >
                    {t('role_new')}
                </button>
            </div>
            <div className="ws-dt-card">
                <IndexFilters table={table} searchPlaceholder={t('admin_dt_search_roles')} onExport={handleExportMulti} exportDisabled={loading} />
                <IndexTable table={table} rows={rows} loading={loading} error={err} onRetry={loadRoles} meta={meta}
                    label={t('roles')} bulkActions={bulkActions} rowHref={(r) => `/admin/roles/${r.id}/edit`}
                    emptyState={{ icon: HiOutlineKey, title: t('empty') }} />
            </div>
            <p className="text-xs text-slate-500">{t('roles_export_hint')}</p>

            <ConfirmDialog
                open={Boolean(deleteTarget)}
                onClose={() => !deleteLoading && setDeleteTarget(null)}
                title={t('role_delete_confirm_title')}
                body={t('role_delete_confirm_body', { name: deleteTarget?.name ?? '' })}
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

            <Dialog open={Boolean(usersModalRole)} onClose={closeUsersModal} className="relative z-100">
                <DialogBackdrop className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <DialogPanel className="flex max-h-[min(90dvh,36rem)] w-full max-w-lg flex-col rounded-2xl bg-white shadow-xl ring-1 ring-slate-200/80">
                        <div className="shrink-0 border-b border-slate-100 px-5 py-4">
                            <DialogTitle className="text-lg font-bold text-slate-900">
                                {usersModalRole
                                    ? t('role_users_dialog_title', { name: usersModalRole.name })
                                    : ''}
                            </DialogTitle>
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3">
                            {usersModalLoading ? (
                                <p className="py-8 text-center text-sm text-slate-500">{t('loading')}</p>
                            ) : usersModalErr ? (
                                <p className="py-4 text-sm text-red-600">{usersModalErr}</p>
                            ) : usersModalRows.length === 0 ? (
                                <p className="py-8 text-center text-sm text-slate-500">{t('role_users_empty')}</p>
                            ) : (
                                <ul className="divide-y divide-slate-100">
                                    {usersModalRows.map((u) => (
                                        <li key={u.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                                            <div className="min-w-0">
                                                <Link
                                                    to={`/admin/users/${u.id}`}
                                                    className="font-medium text-brand hover:underline"
                                                    onClick={closeUsersModal}
                                                >
                                                    {u.name}
                                                </Link>
                                                <p className="truncate text-xs text-slate-500">{u.email}</p>
                                            </div>
                                            <span
                                                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                                                    u.is_active
                                                        ? 'bg-emerald-50 text-emerald-800'
                                                        : 'bg-slate-100 text-slate-600'
                                                }`}
                                            >
                                                {u.is_active ? t('status_active') : t('status_inactive')}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div className="shrink-0 border-t border-slate-100 px-5 py-3">
                            <button
                                type="button"
                                onClick={closeUsersModal}
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                            >
                                {t('cancel')}
                            </button>
                        </div>
                    </DialogPanel>
                </div>
            </Dialog>
        </div>
    );
}
