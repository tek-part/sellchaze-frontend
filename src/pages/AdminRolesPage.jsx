import { useCallback, useEffect, useMemo, useState } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { Link, Navigate, useNavigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useDebounced } from '../hooks/useDebounced';
import ListToolbar from '../components/table/ListToolbar';
import TableLoadingOverlay from '../components/table/TableLoadingOverlay';
import ConfirmDialog from '../components/ConfirmDialog';
import { exportRowsToExcel, exportWorkbookSheets } from '../utils/exportExcel';
import { ROLES_OMITTED_FROM_ADMIN_ROLES_INDEX } from '../config/rolesUi';

const PROTECTED_ROLE_NAMES = ['Admin'];

export default function AdminRolesPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { isAdmin } = useOutletContext();
    const canBulkDelete = isAdmin;
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const debouncedSearch = useDebounced(searchInput, 400);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [usersModalRole, setUsersModalRole] = useState(null);
    const [usersModalRows, setUsersModalRows] = useState([]);
    const [usersModalLoading, setUsersModalLoading] = useState(false);
    const [usersModalErr, setUsersModalErr] = useState('');
    const [selected, setSelected] = useState(() => new Set());
    const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

    const loadRoles = useCallback(() => {
        if (!isAdmin) {
            return;
        }
        setLoading(true);
        setErr('');
        api
            .get('/admin/roles')
            .then(({ data }) => {
                const raw = data.roles ?? [];
                setRoles(
                    raw.filter((r) => !ROLES_OMITTED_FROM_ADMIN_ROLES_INDEX.includes(String(r.name ?? ''))),
                );
                setPermissions(data.permissions ?? []);
            })
            .catch((e) => setErr(e.response?.data?.message || e.message))
            .finally(() => setLoading(false));
    }, [isAdmin]);

    useEffect(() => {
        loadRoles();
    }, [loadRoles]);
    useEffect(() => {
        setSelected(new Set());
    }, [roles]);

    const filteredRoles = useMemo(() => {
        const q = debouncedSearch.trim().toLowerCase();
        if (!q) {
            return roles;
        }
        return roles.filter((r) => String(r.name).toLowerCase().includes(q));
    }, [roles, debouncedSearch]);

    const filteredPerms = useMemo(() => {
        const q = debouncedSearch.trim().toLowerCase();
        if (!q) {
            return permissions;
        }
        return permissions.filter((p) => String(p.name).toLowerCase().includes(q));
    }, [permissions, debouncedSearch]);

    if (!isAdmin) {
        return <Navigate to="/dashboard" replace />;
    }

    const permCount = (r) => (Array.isArray(r.permissions) ? r.permissions.length : 0);

    const userCount = (r) => (typeof r.users_count === 'number' ? r.users_count : 0);

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

    const handleExportMulti = () => {
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
                    rows: filteredRoles.map((r) => ({
                        id: r.id,
                        name: r.name,
                        users_count: userCount(r),
                        permissions_count: permCount(r),
                    })),
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

    const handleExportCurrent = () => {
        exportRowsToExcel(
            [
                { key: 'id', header: 'ID' },
                { key: 'name', header: t('name') },
                { key: 'users_count', header: t('role_users_col') },
                { key: 'permissions_count', header: t('permissions_count_col') },
            ],
            filteredRoles.map((r) => ({
                id: r.id,
                name: r.name,
                users_count: userCount(r),
                permissions_count: permCount(r),
            })),
            'roles-filtered',
            { sheetName: 'Roles' },
        );
    };

    const runDelete = async () => {
        if (!deleteTarget) return;
        setDeleteLoading(true);
        try {
            await api.delete(`/admin/roles/${deleteTarget.id}`);
            toast.success(t('role_deleted_toast'));
            setDeleteTarget(null);
            loadRoles();
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
        const deletableIds = filteredRoles
            .filter((r) => !PROTECTED_ROLE_NAMES.includes(r.name))
            .map((r) => r.id);
        if (selected.size === deletableIds.length) setSelected(new Set());
        else setSelected(new Set(deletableIds));
    };
    const runBulkDelete = async () => {
        const ids = [...selected];
        if (ids.length === 0) return;
        setDeleteLoading(true);
        try {
            await Promise.all(ids.map((id) => api.delete(`/admin/roles/${id}`)));
            toast.success(`${t('action_delete')} (${ids.length})`);
            setConfirmBulkDelete(false);
            setSelected(new Set());
            loadRoles();
        } catch (e) {
            toast.error(e.response?.data?.message || e.message);
        } finally {
            setDeleteLoading(false);
        }
    };

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
            {err && (
                <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>
            )}
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 shadow-card">
                <ListToolbar
                    searchValue={searchInput}
                    onSearchChange={setSearchInput}
                    perPage={15}
                    onPerPageChange={() => {}}
                    showPerPage={false}
                    onExportCurrent={handleExportCurrent}
                    onExportAll={handleExportMulti}
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
                    extra={<p className="text-xs text-slate-500">{t('roles_export_hint')}</p>}
                />
                <div className="relative min-h-56 overflow-auto bg-white">
                    <TableLoadingOverlay show={loading} />
                    <table className="min-w-full text-start text-sm">
                        <thead className="bg-surface-muted/90 text-xs font-semibold uppercase tracking-wide text-slate-600">
                            <tr>
                                <th className="px-3 py-3.5">
                                    <input
                                        type="checkbox"
                                        checked={
                                            filteredRoles.filter((r) => !PROTECTED_ROLE_NAMES.includes(r.name)).length > 0 &&
                                            selected.size === filteredRoles.filter((r) => !PROTECTED_ROLE_NAMES.includes(r.name)).length
                                        }
                                        onChange={toggleAll}
                                        aria-label="select all"
                                    />
                                </th>
                                <th className="px-4 py-3.5">{t('name')}</th>
                                <th className="px-4 py-3.5">{t('role_users_col')}</th>
                                <th className="px-4 py-3.5">{t('permissions_count_col')}</th>
                                <th className="px-4 py-3.5">{t('col_actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRoles.length === 0 && !loading ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-14 text-center text-sm text-slate-500">
                                        {t('empty')}
                                    </td>
                                </tr>
                            ) : null}
                            {filteredRoles.map((r) => {
                                const protectedRole = PROTECTED_ROLE_NAMES.includes(r.name);
                                return (
                                    <tr
                                        key={r.id}
                                        className="border-t border-slate-100 transition-colors hover:bg-slate-50/60"
                                    >
                                        <td className="px-3 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selected.has(r.id)}
                                                disabled={protectedRole}
                                                onChange={() => toggleRow(r.id)}
                                                aria-label={`select ${r.id}`}
                                            />
                                        </td>
                                        <td className="px-4 py-3 font-medium text-slate-900">
                                            {r.name}
                                            {protectedRole ? (
                                                <span className="ms-2 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-800">
                                                    {t('role_protected_badge')}
                                                </span>
                                            ) : null}
                                        </td>
                                        <td className="px-4 py-3 text-slate-700">
                                            <button
                                                type="button"
                                                onClick={() => void openUsersModal(r)}
                                                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-brand tabular-nums hover:bg-slate-50"
                                            >
                                                {userCount(r)}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 text-slate-700">{permCount(r)}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-2">
                                                <Link
                                                    to={`/admin/roles/${r.id}/edit`}
                                                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-brand hover:bg-slate-50"
                                                >
                                                    {t('action_edit')}
                                                </Link>
                                                {!protectedRole ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeleteTarget(r)}
                                                        className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                                                    >
                                                        {t('action_delete')}
                                                    </button>
                                                ) : null}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

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
