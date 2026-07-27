import { useCallback, useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useDebounced } from '../hooks/useDebounced';
import ListToolbar from '../components/table/ListToolbar';
import PaginationBar from '../components/table/PaginationBar';
import TableLoadingOverlay from '../components/table/TableLoadingOverlay';
import ConfirmDialog from '../components/ConfirmDialog';
import TableIconActions from '../components/table/TableIconActions';
import PageHeader from '../components/PageHeader';
import { HiOutlinePlus, HiOutlinePhoto } from 'react-icons/hi2';
import { exportRowsToExcel } from '../utils/exportExcel';
import { fetchAllPages } from '../utils/fetchAllPages';

export default function CategoriesPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { permissions } = useOutletContext();
    const can = (p) => permissions.includes(p);
    const canBulkDeleteByActivity = permissions.includes('activity-logs-list');
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
    const [selected, setSelected] = useState(() => new Set());
    const [confirmOne, setConfirmOne] = useState(null);
    const [confirmBulk, setConfirmBulk] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [listNonce, setListNonce] = useState(0);

    const loadParams = useCallback(() => {
        return {
            page,
            per_page: perPage,
            ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
            ...(dateFrom ? { date_from: dateFrom } : {}),
            ...(dateTo ? { date_to: dateTo } : {}),
        };
    }, [page, perPage, debouncedSearch, dateFrom, dateTo]);

    useEffect(() => setPage(1), [debouncedSearch, dateFrom, dateTo, perPage]);

    useEffect(() => {
        if (!permissions.includes('categories-list')) {
            return;
        }
        setLoading(true);
        setErr('');
        api.get('/categories', { params: loadParams() })
            .then(({ data }) => {
                setRows(data.data ?? []);
                setMeta(data.meta ?? null);
            })
            .catch((e) => setErr(e.response?.data?.message || e.message))
            .finally(() => setLoading(false));
    }, [permissions, loadParams, listNonce]);

    useEffect(() => setSelected(new Set()), [rows]);

    if (!can('categories-list')) {
        return <Navigate to="/dashboard" replace />;
    }

    const exportColumns = [
        { key: 'id', header: 'ID' },
        { key: 'name', header: t('col_name') },
        { key: 'products_count', header: t('col_products_count') },
        { key: 'created_at', header: t('col_created') },
    ];

    const handleExportCurrent = () => {
        exportRowsToExcel(
            exportColumns,
            rows.map((r) => ({
                ...r,
                created_at: r.created_at ? new Date(r.created_at).toISOString() : '',
            })),
            `categories-p${page}`,
            { sheetName: 'Categories' },
        );
    };

    const handleExportAll = async () => {
        setLoading(true);
        try {
            const { page: _p, per_page: _pp, ...base } = loadParams();
            const all = await fetchAllPages('/categories', { ...base, per_page: 100 });
            exportRowsToExcel(
                exportColumns,
                all.map((r) => ({
                    ...r,
                    created_at: r.created_at ? new Date(r.created_at).toISOString() : '',
                })),
                'categories-all',
                { sheetName: 'Categories' },
            );
        } catch (e) {
            setErr(e.response?.data?.message || e.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleRow = (id) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const toggleAll = () => {
        if (selected.size === rows.length) {
            setSelected(new Set());
        } else {
            setSelected(new Set(rows.map((r) => r.id)));
        }
    };

    const runDeleteOne = async () => {
        if (!confirmOne) {
            return;
        }
        setDeleting(true);
        try {
            await api.delete(`/categories/${confirmOne}`);
            toast.success(t('action_delete'));
            setConfirmOne(null);
            setRows((r) => r.filter((x) => x.id !== confirmOne));
        } catch (e) {
            toast.error(e.response?.data?.message || e.message);
        } finally {
            setDeleting(false);
        }
    };

    const runBulkDelete = async () => {
        const ids = [...selected];
        if (ids.length === 0) {
            return;
        }
        setDeleting(true);
        try {
            const { data } = await api.post('/categories/bulk-destroy', { ids });
            toast.success(`${t('action_delete')} (${data.deleted ?? 0})`);
            if (data.skipped) {
                toast(`${data.skipped} skipped (have products)`);
            }
            setConfirmBulk(false);
            setSelected(new Set());
            setListNonce((n) => n + 1);
        } catch (e) {
            toast.error(e.response?.data?.message || e.message);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="space-y-5">
            <PageHeader
                title={t('categories')}
                subtitle={t('categories_subtitle')}
                action={can('categories-create') ? (
                    <button
                        type="button"
                        onClick={() => navigate('/categories/new')}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-brand-dark"
                    >
                        <HiOutlinePlus className="h-4 w-4" aria-hidden />
                        {t('table_create')}
                    </button>
                ) : null}
            />
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
                        canBulkDeleteByActivity && can('categories-delete')
                            ? () => {
                                  if (selected.size > 0) {
                                      setConfirmBulk(true);
                                  }
                              }
                            : undefined
                    }
                    bulkDeleteDisabled={deleting}
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
                                {canBulkDeleteByActivity && can('categories-delete') ? (
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
                                <th className="px-4 py-3.5">{t('col_products_count')}</th>
                                <th className="px-4 py-3.5">{t('col_created')}</th>
                                <th className="px-4 py-3.5">{t('col_actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 && !loading ? (
                                <tr>
                                    <td
                                        colSpan={canBulkDeleteByActivity && can('categories-delete') ? 5 : 4}
                                        className="px-4 py-14 text-center text-sm text-slate-500"
                                    >
                                        {t('empty')}
                                    </td>
                                </tr>
                            ) : null}
                            {rows.map((row) => (
                                <tr
                                    key={row.id}
                                    className="border-t border-slate-100 transition-colors hover:bg-slate-50/60"
                                >
                                    {canBulkDeleteByActivity && can('categories-delete') ? (
                                        <td className="px-3 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selected.has(Number(row.id))}
                                                onChange={() => toggleRow(Number(row.id))}
                                                aria-label={`select ${row.id}`}
                                            />
                                        </td>
                                    ) : null}
                                    <td className="px-4 py-3 font-medium text-slate-900">
                                        <div className="flex items-center gap-3">
                                            {row.image_url ? (
                                                <img
                                                    src={row.image_url}
                                                    alt=""
                                                    className="h-10 w-10 shrink-0 rounded-lg object-cover ring-1 ring-slate-200"
                                                />
                                            ) : (
                                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400 ring-1 ring-slate-200">
                                                    <HiOutlinePhoto className="h-5 w-5" aria-hidden />
                                                </span>
                                            )}
                                            <span>{row.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-slate-700">{row.products_count ?? 0}</td>
                                    <td className="px-4 py-3 text-slate-600">
                                        {row.created_at ? new Date(row.created_at).toLocaleString() : '—'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <TableIconActions
                                            viewTo={
                                                can('categories-list')
                                                    ? `/categories/${row.id}`
                                                    : undefined
                                            }
                                            editTo={
                                                can('categories-edit')
                                                    ? `/categories/${row.id}/edit`
                                                    : undefined
                                            }
                                            onDelete={
                                                can('categories-delete')
                                                    ? () => setConfirmOne(row.id)
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
            <p className="text-sm text-slate-600">{t('categories_manage_hint')}</p>

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
            <ConfirmDialog
                open={confirmBulk}
                onClose={() => setConfirmBulk(false)}
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
