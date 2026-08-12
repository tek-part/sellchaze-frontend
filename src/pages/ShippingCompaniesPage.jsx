import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import { useDebounced } from '../hooks/useDebounced';
import ListToolbar from '../components/table/ListToolbar';
import PaginationBar from '../components/table/PaginationBar';
import TableLoadingOverlay from '../components/table/TableLoadingOverlay';
import ConfirmDialog from '../components/ConfirmDialog';
import TableIconActions from '../components/table/TableIconActions';
import { exportRowsToExcel } from '../utils/exportExcel';
import { fetchAllPages } from '../utils/fetchAllPages';

function unwrapRow(o) {
    return o?.data ?? o;
}

export default function ShippingCompaniesPage() {
    const { t } = useTranslation();
    const { isAdmin, permissions } = useOutletContext();
    const can = (p) => isAdmin || permissions.includes(p);
    const canBulkDelete = (isAdmin || permissions.includes('activity-logs-list')) && can('shipping-companies-delete');
    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState(null);
    const [err, setErr] = useState('');
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(15);
    const [searchInput, setSearchInput] = useState('');
    const debouncedSearch = useDebounced(searchInput, 400);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [confirmBulk, setConfirmBulk] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [selected, setSelected] = useState(() => new Set());

    const loadParams = useCallback(() => {
        return {
            page,
            per_page: perPage,
            ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
        };
    }, [page, perPage, debouncedSearch]);

    useEffect(() => setPage(1), [debouncedSearch, perPage]);

    useEffect(() => {
        if (!(isAdmin || permissions.includes('shipping-companies-list'))) {
            return;
        }
        setLoading(true);
        setErr('');
        api.get('/shipping-companies', { params: loadParams() })
            .then(({ data }) => {
                const list = data.data ?? [];
                setRows(list.map(unwrapRow));
                setMeta(data.meta ?? null);
            })
            .catch((e) => setErr(e.response?.data?.message || e.message))
            .finally(() => setLoading(false));
    }, [loadParams, isAdmin, permissions]);
    useEffect(() => {
        setSelected(new Set());
    }, [rows]);

    if (!can('shipping-companies-list')) {
        return <Navigate to="/dashboard" replace />;
    }

    const cols = [
        { key: 'name', header: t('col_name') },
        { key: 'code', header: t('col_slug') },
        { key: 'phone', header: t('profile_phone') },
        { key: 'is_active', header: t('col_status') },
        { key: 'sort_order', header: t('col_sort_order') },
    ];

    const handleExportCurrent = () => {
        exportRowsToExcel(
            cols,
            rows.map((r) => ({
                ...r,
                is_active: r.is_active ? t('status_active') : t('status_inactive'),
            })),
            `shipping-companies-p${page}`,
            { sheetName: 'Shipping' },
        );
    };

    const handleExportAll = async () => {
        setLoading(true);
        try {
            const { page: _p, per_page: _pp, ...base } = loadParams();
            const all = await fetchAllPages('/shipping-companies', { ...base, per_page: 100 }, { unwrap: unwrapRow });
            exportRowsToExcel(
                cols,
                all.map((r) => ({
                    ...r,
                    is_active: r.is_active ? t('status_active') : t('status_inactive'),
                })),
                'shipping-companies-all',
                { sheetName: 'Shipping' },
            );
        } catch (e) {
            setErr(e.response?.data?.message || e.message);
        } finally {
            setLoading(false);
        }
    };

    const runDeleteOne = async () => {
        if (!confirmDeleteId) {
            return;
        }
        setDeleting(true);
        try {
            await api.delete(`/shipping-companies/${confirmDeleteId}`);
            setRows((prev) => prev.filter((row) => row.id !== confirmDeleteId));
            toast.success(t('action_delete'));
            setConfirmDeleteId(null);
        } catch (e) {
            const msg = e.response?.data?.message || e.message;
            setErr(msg);
            toast.error(msg);
        } finally {
            setDeleting(false);
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
        else setSelected(new Set(rows.map((r) => r.id)));
    };
    const runBulkDelete = async () => {
        const ids = [...selected];
        if (ids.length === 0) return;
        setDeleting(true);
        try {
            await Promise.all(ids.map((id) => api.delete(`/shipping-companies/${id}`)));
            toast.success(`${t('action_delete')} (${ids.length})`);
            setConfirmBulk(false);
            setSelected(new Set());
            setRows((prev) => prev.filter((r) => !ids.includes(r.id)));
        } catch (e) {
            const msg = e.response?.data?.message || e.message;
            setErr(msg);
            toast.error(msg);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3 border-s-4 border-brand ps-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t('shipping_companies_title')}</h1>
                    <p className="mt-1 text-sm text-slate-500">{t('list_subtitle_shipping_companies')}</p>
                </div>
                {can('shipping-companies-create') ? (
                    <Link
                        to="/shipping/companies/new"
                        className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-brand-dark"
                    >
                        {t('shipping_company_add')}
                    </Link>
                ) : null}
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
                    onBulkDelete={canBulkDelete ? () => selected.size > 0 && setConfirmBulk(true) : undefined}
                    bulkDeleteDisabled={deleting}
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
                                            checked={rows.length > 0 && selected.size === rows.length}
                                            onChange={toggleAll}
                                            aria-label="select all"
                                        />
                                    </th>
                                ) : null}
                                <th className="px-4 py-3.5">{t('col_name')}</th>
                                <th className="px-4 py-3.5">{t('col_slug')}</th>
                                <th className="px-4 py-3.5">{t('profile_phone')}</th>
                                <th className="px-4 py-3.5">{t('col_status')}</th>
                                <th className="px-4 py-3.5">{t('col_sort_order')}</th>
                                <th className="px-4 py-3.5">{t('col_actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 && !loading ? (
                                <tr>
                                    <td colSpan={canBulkDelete ? 7 : 6} className="px-4 py-14 text-center text-sm text-slate-500">
                                        {t('empty')}
                                    </td>
                                </tr>
                            ) : null}
                            {rows.map((row) => (
                                <tr
                                    key={row.id}
                                    className="border-t border-slate-100 transition-colors hover:bg-slate-50/60"
                                >
                                    {canBulkDelete ? (
                                        <td className="px-3 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selected.has(row.id)}
                                                onChange={() => toggleRow(row.id)}
                                                aria-label={`select ${row.id}`}
                                            />
                                        </td>
                                    ) : null}
                                    <td className="px-4 py-3 font-medium text-slate-900">{row.name}</td>
                                    <td className="px-4 py-3 text-slate-700">{row.code}</td>
                                    <td className="px-4 py-3 text-slate-700">{row.phone || '—'}</td>
                                    <td className="px-4 py-3 text-slate-700">
                                        {row.is_active ? t('status_active') : t('status_inactive')}
                                    </td>
                                    <td className="px-4 py-3 text-slate-700">{row.sort_order ?? 0}</td>
                                    <td className="px-4 py-3 text-slate-700">
                                        <TableIconActions
                                            showView={false}
                                            editTo={
                                                can('shipping-companies-edit')
                                                    ? `/shipping/companies/${row.id}/edit`
                                                    : undefined
                                            }
                                            onDelete={
                                                can('shipping-companies-delete')
                                                    ? () => setConfirmDeleteId(row.id)
                                                    : undefined
                                            }
                                            deleteDisabled={deleting}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <PaginationBar meta={meta} loading={loading} onPageChange={setPage} />
            </div>
            <ConfirmDialog
                open={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                title={t('confirm_delete_title')}
                body={t('confirm_delete_body')}
                confirmLabel={t('action_delete')}
                cancelLabel={t('cancel')}
                danger
                loading={deleting}
                onConfirm={runDeleteOne}
            />
            <ConfirmDialog
                open={confirmBulk}
                onClose={() => !deleting && setConfirmBulk(false)}
                title={t('confirm_bulk_delete_title')}
                body={t('confirm_bulk_delete_body')}
                confirmLabel={t('action_delete')}
                cancelLabel={t('cancel')}
                danger
                loading={deleting}
                onConfirm={runBulkDelete}
            />
        </div>
    );
}
