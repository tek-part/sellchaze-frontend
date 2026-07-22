import { useCallback, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { HiOutlineCheckBadge, HiOutlineCheckCircle, HiOutlineGlobeAlt, HiOutlineNoSymbol } from 'react-icons/hi2';
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

export default function MerchantsPage() {
    const { t } = useTranslation();
    const { isAdmin = false, me } = useOutletContext() ?? {};
    const selfId = me?.id;

    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState(null);
    const [err, setErr] = useState('');
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(15);
    const [searchInput, setSearchInput] = useState('');
    const debouncedSearch = useDebounced(searchInput, 400);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [selected, setSelected] = useState(() => new Set());
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
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

    const loadParams = useCallback(() => ({
        page,
        per_page: perPage,
        ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
        ...(dateFrom ? { date_from: dateFrom } : {}),
        ...(dateTo ? { date_to: dateTo } : {}),
    }), [page, perPage, debouncedSearch, dateFrom, dateTo]);

    useEffect(() => setPage(1), [debouncedSearch, dateFrom, dateTo, perPage]);

    useEffect(() => {
        setLoading(true);
        setErr('');
        api.get('/merchants', { params: loadParams() })
            .then(({ data }) => {
                setRows(data.data ?? []);
                setMeta(data.meta ?? null);
            })
            .catch((e) => setErr(e.response?.data?.message || e.message))
            .finally(() => setLoading(false));
    }, [loadParams]);

    useEffect(() => {
        setSelected(new Set());
    }, [rows]);

    const showAdminActions = isAdmin;

    const cols = [
        { key: 'name', header: t('col_name') },
        { key: 'email', header: t('email') },
        { key: 'status_col', header: t('col_status') },
        { key: 'pending_col', header: t('suppliers_col_pending') },
    ];

    const rowToExport = (row) => ({
        name: row.name,
        email: row.email,
        status: row.pending_approval ? t('suppliers_pending_badge') : row.is_active !== false ? t('status_active') : t('status_inactive'),
        pending: row.pending_approval ? t('yes') : t('no'),
    });

    const handleExportCurrent = () => {
        exportRowsToExcel(cols, rows.map(rowToExport), `merchants-p${page}`, { sheetName: 'Merchants' });
    };

    const handleExportAll = async () => {
        setLoading(true);
        try {
            const { page: _p, per_page: _pp, ...base } = loadParams();
            const all = await fetchAllPages('/merchants', { ...base, per_page: 100 });
            exportRowsToExcel(cols, all.map(rowToExport), 'merchants-all', { sheetName: 'Merchants' });
        } catch (e) {
            setErr(e.response?.data?.message || e.message);
        } finally {
            setLoading(false);
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

    const selectableIds = rows.filter((r) => r.id !== selfId).map((r) => r.id);
    const toggleAll = () => {
        if (selected.size === selectableIds.length && selectableIds.length > 0) {
            setSelected(new Set());
        } else {
            setSelected(new Set(selectableIds));
        }
    };

    const runDelete = async () => {
        if (!confirmDelete) return;
        setDeleteLoading(true);
        try {
            await api.delete(`/merchants/${confirmDelete.id}`);
            toast.success(t('merchant_deleted_toast') || t('deleted'));
            setConfirmDelete(null);
            setRows((prev) => prev.filter((r) => r.id !== confirmDelete.id));
        } catch (e) {
            toast.error(e.response?.data?.message || e.message);
        } finally {
            setDeleteLoading(false);
        }
    };

    const runBulkDelete = async () => {
        const ids = [...selected];
        if (ids.length === 0) return;
        setDeleteLoading(true);
        try {
            await api.post('/merchants/bulk-destroy', { ids });
            toast.success(t('merchants_bulk_deleted_toast', { count: ids.length }));
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
            await api.patch(`/merchants/${toggleTarget.id}/status`, { is_active: next });
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

    const runApprove = async () => {
        if (!approveTarget) return;
        const id = approveTarget.id;
        setApproveLoading(true);
        try {
            await api.patch(`/admin/users/${id}`, {
                approve_pending_registration: true,
                approval_role: 'Merchant',
            });
            toast.success(t('admin_user_approved_toast'));
            setApproveTarget(null);
            setRows((prev) =>
                prev.map((r) =>
                    r.id === id
                        ? { ...r, pending_approval: false, registration_role: null, is_active: r.is_active !== false }
                        : r,
                ),
            );
        } catch (e) {
            toast.error(e.response?.data?.message || e.message);
        } finally {
            setApproveLoading(false);
        }
    };

    const emptyColSpan = showAdminActions ? 6 : 5;

    return (
        <div className="space-y-5">
            <div className="border-s-4 border-brand ps-4">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t('merchants')}</h1>
                <p className="mt-1 text-sm text-slate-500">{t('merchants_help') || t('suppliers_help')}</p>
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
                    selectedCount={showAdminActions ? selected.size : 0}
                    onBulkDelete={
                        showAdminActions
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
                                {showAdminActions ? (
                                    <th className="px-3 py-3.5">
                                        <input
                                            type="checkbox"
                                            checked={
                                                selectableIds.length > 0 && selected.size === selectableIds.length
                                            }
                                            onChange={toggleAll}
                                            aria-label="select all"
                                        />
                                    </th>
                                ) : null}
                                <th className="px-4 py-3.5">{t('col_name')}</th>
                                <th className="px-4 py-3.5">{t('email')}</th>
                                <th className="px-4 py-3.5">{t('col_status')}</th>
                                <th className="px-4 py-3.5">{t('suppliers_col_pending')}</th>
                                <th className="px-4 py-3.5">{t('col_actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 && !loading ? (
                                <tr>
                                    <td colSpan={emptyColSpan} className="px-4 py-14 text-center text-sm text-slate-500">
                                        {t('empty')}
                                    </td>
                                </tr>
                            ) : null}
                            {rows.map((row) => (
                                <tr
                                    key={row.id}
                                    className="border-t border-slate-100 transition-colors hover:bg-slate-50/60"
                                >
                                    {showAdminActions ? (
                                        <td className="px-3 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selected.has(row.id)}
                                                disabled={row.id === selfId}
                                                onChange={() => toggleRow(row.id)}
                                                aria-label={`select ${row.id}`}
                                            />
                                        </td>
                                    ) : null}
                                    <td className="px-4 py-3 font-medium text-slate-900">{row.name}</td>
                                    <td className="px-4 py-3 text-slate-700">{row.email}</td>
                                    <td className="px-4 py-3">
                                        {row.pending_approval ? (
                                            <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                                                {t('suppliers_pending_badge')}
                                            </span>
                                        ) : (
                                            <span
                                                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                                    row.is_active !== false
                                                        ? 'bg-emerald-50 text-emerald-800'
                                                        : 'bg-slate-100 text-slate-600'
                                                }`}
                                            >
                                                {row.is_active !== false ? t('status_active') : t('status_inactive')}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-slate-700">
                                        {row.pending_approval ? t('yes') : t('no')}
                                    </td>
                                    <td className="px-4 py-3 text-slate-700">
                                        <div className="flex flex-wrap items-center gap-1">
                                            {row.username ? (
                                                <a
                                                    href={`/u/${encodeURIComponent(row.username)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    title={t('view_public_profile') || 'View public profile'}
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-brand hover:text-brand"
                                                >
                                                    <HiOutlineGlobeAlt className="h-4 w-4" aria-hidden />
                                                </a>
                                            ) : null}
                                            <TableIconActions
                                                viewTo={`/merchants/${row.id}`}
                                                editTo={showAdminActions ? `/merchants/${row.id}/edit` : undefined}
                                                showEdit={showAdminActions}
                                                onDelete={
                                                    showAdminActions ? () => setConfirmDelete(row) : undefined
                                                }
                                                deleteDisabled={selfId === row.id}
                                                showImpersonate={showAdminActions}
                                                onImpersonate={
                                                    showAdminActions &&
                                                    !row.pending_approval &&
                                                    row.is_active !== false &&
                                                    selfId !== row.id
                                                        ? () => void handleImpersonate(row.id)
                                                        : undefined
                                                }
                                                impersonateLoading={impersonateBusyId === row.id}
                                            />
                                            {showAdminActions && row.pending_approval ? (
                                                <button
                                                    type="button"
                                                    disabled={loading}
                                                    onClick={() => setApproveTarget(row)}
                                                    title={t('suppliers_approve_registration')}
                                                    aria-label={t('suppliers_approve_registration')}
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-amber-300 bg-amber-50 text-amber-900 transition hover:bg-amber-100 disabled:opacity-40"
                                                >
                                                    <HiOutlineCheckBadge className="h-4 w-4" aria-hidden />
                                                </button>
                                            ) : null}
                                            {showAdminActions && !row.pending_approval ? (
                                                <button
                                                    type="button"
                                                    disabled={selfId === row.id || loading}
                                                    onClick={() => setToggleTarget(row)}
                                                    title={row.is_active !== false ? t('action_deactivate') : t('action_activate')}
                                                    aria-label={row.is_active !== false ? t('action_deactivate') : t('action_activate')}
                                                    className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border bg-white transition disabled:opacity-40 ${
                                                        row.is_active !== false
                                                            ? 'border-slate-200 text-slate-600 hover:border-rose-300 hover:text-rose-600'
                                                            : 'border-slate-200 text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50'
                                                    }`}
                                                >
                                                    {row.is_active !== false ? (
                                                        <HiOutlineNoSymbol className="h-4 w-4" aria-hidden />
                                                    ) : (
                                                        <HiOutlineCheckCircle className="h-4 w-4" aria-hidden />
                                                    )}
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
                title={t('suppliers_approve_registration')}
                body={t('suppliers_approve_confirm_body', { name: approveTarget?.name ?? '' })}
                confirmLabel={t('admin_user_approve_registration')}
                cancelLabel={t('cancel')}
                loading={approveLoading}
                onConfirm={runApprove}
            />

            <ConfirmDialog
                open={Boolean(confirmDelete)}
                onClose={() => !deleteLoading && setConfirmDelete(null)}
                title={t('confirm_delete_merchant_title') || t('confirm_delete_supplier_title')}
                body={t('confirm_delete_merchant_body', { name: confirmDelete?.name ?? '' })}
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
                body={t('confirm_bulk_delete_merchants_body') || t('confirm_bulk_delete_suppliers_body')}
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
                    toggleTarget && (toggleTarget.is_active !== false)
                        ? t('confirm_deactivate_user_title')
                        : t('confirm_activate_user_title')
                }
                body={
                    toggleTarget && (toggleTarget.is_active !== false)
                        ? t('confirm_deactivate_user_body', { name: toggleTarget?.name ?? '' })
                        : t('confirm_activate_user_body', { name: toggleTarget?.name ?? '' })
                }
                confirmLabel={
                    toggleTarget && (toggleTarget.is_active !== false) ? t('action_deactivate') : t('action_activate')
                }
                cancelLabel={t('cancel')}
                loading={toggleLoading}
                onConfirm={runToggle}
            />
        </div>
    );
}
