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
import SearchableSelect from '../components/ui/SearchableSelect';
import { HiOutlinePlus } from 'react-icons/hi2';
import { exportRowsToExcel } from '../utils/exportExcel';
import { fetchAllPages } from '../utils/fetchAllPages';

const NAME_PREVIEW_MAX = 40;

function productNamePreview(name) {
    const s = String(name ?? '');
    if (s.length <= NAME_PREVIEW_MAX) {
        return s;
    }
    return `${s.slice(0, NAME_PREVIEW_MAX)}…`;
}

export default function ProductsPage() {
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
    const [perPage, setPerPage] = useState(15);
    const [searchInput, setSearchInput] = useState('');
    const debouncedSearch = useDebounced(searchInput, 400);
    const [categoryId, setCategoryId] = useState('');
    const [categories, setCategories] = useState([]);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [selected, setSelected] = useState(() => new Set());
    const [confirmOne, setConfirmOne] = useState(null);
    const [confirmBulk, setConfirmBulk] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [listNonce, setListNonce] = useState(0);

    const loadParams = useCallback(() => {
        const params = {
            page,
            per_page: perPage,
            ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
            ...(categoryId ? { category_id: categoryId } : {}),
            ...(dateFrom ? { date_from: dateFrom } : {}),
            ...(dateTo ? { date_to: dateTo } : {}),
        };
        return params;
    }, [page, perPage, debouncedSearch, categoryId, dateFrom, dateTo]);

    useEffect(() => {
        api.get('/categories', { params: { per_page: 200 } })
            .then(({ data }) => setCategories(data.data ?? []))
            .catch(() => {});
    }, []);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, categoryId, dateFrom, dateTo, perPage]);

    useEffect(() => {
        if (!permissions.includes('products-list')) {
            return;
        }
        setLoading(true);
        setErr('');
        api.get('/products', { params: loadParams() })
            .then(({ data }) => {
                setRows(data.data ?? []);
                setMeta(data.meta ?? null);
            })
            .catch((e) => setErr(e.response?.data?.message || e.message))
            .finally(() => setLoading(false));
    }, [permissions, loadParams, listNonce]);

    useEffect(() => {
        setSelected(new Set());
    }, [rows]);

    if (!can('products-list')) {
        return <Navigate to="/dashboard" replace />;
    }

    const exportColumns = [
        { key: 'id', header: 'ID' },
        { key: 'name', header: t('col_name') },
        { key: 'category', header: t('col_category') },
        { key: 'description', header: 'Description' },
        { key: 'created_at', header: t('col_created') },
    ];

    const toExportRow = (r) => ({
        id: r.id,
        name: r.name,
        category: r.category?.name ?? '',
        description: r.description ?? '',
        created_at: r.created_at ? new Date(r.created_at).toISOString() : '',
    });

    const handleExportCurrent = () => {
        exportRowsToExcel(exportColumns, rows.map(toExportRow), `products-p${page}`, { sheetName: 'Products' });
    };

    const handleExportAll = async () => {
        setLoading(true);
        try {
            const { page: _p, per_page: _pp, ...base } = loadParams();
            const all = await fetchAllPages('/products', { ...base, per_page: 100 });
            exportRowsToExcel(exportColumns, all.map(toExportRow), 'products-all', { sheetName: 'Products' });
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
            setSelected(new Set(rows.map((r) => Number(r.id))));
        }
    };

    const runDeleteOne = async () => {
        if (!confirmOne) {
            return;
        }
        setDeleting(true);
        try {
            await api.delete(`/products/${confirmOne}`);
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
            const { data } = await api.post('/products/bulk-destroy', { ids });
            toast.success(
                typeof data?.deleted === 'number'
                    ? `${t('action_delete')} (${data.deleted})`
                    : t('action_delete'),
            );
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
                title={t('products')}
                subtitle={t('products_subtitle')}
                action={can('products-create') ? (
                    <button
                        type="button"
                        onClick={() => navigate('/products/new')}
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
                        canBulkDeleteByActivity && can('products-delete')
                            ? () => {
                                  if (selected.size > 0) {
                                      setConfirmBulk(true);
                                  }
                              }
                            : undefined
                    }
                    bulkDeleteDisabled={deleting}
                    advanced={
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                                <label className="mb-1 block text-[11px] font-semibold uppercase text-slate-500">
                                    {t('col_category')}
                                </label>
                                <SearchableSelect
                                    value={categoryId}
                                    onChange={(e) => setCategoryId(e.target.value)}
                                    placeholder={t('filter_all')}
                                    className="w-full"
                                >
                                    <option value="">{t('filter_all')}</option>
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </SearchableSelect>
                            </div>
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
                                {canBulkDeleteByActivity && can('products-delete') ? (
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
                                <th className="px-4 py-3.5">{t('col_category')}</th>
                                <th className="px-4 py-3.5">{t('col_created')}</th>
                                <th className="px-4 py-3.5">{t('col_actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 && !loading ? (
                                <tr>
                                    <td
                                        colSpan={canBulkDeleteByActivity && can('products-delete') ? 5 : 4}
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
                                    {canBulkDeleteByActivity && can('products-delete') ? (
                                        <td className="px-3 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selected.has(Number(row.id))}
                                                onChange={() => toggleRow(Number(row.id))}
                                                aria-label={`select ${row.id}`}
                                            />
                                        </td>
                                    ) : null}
                                    <td className="max-w-[min(100%,28rem)] px-4 py-3">
                                        <div className="flex items-start gap-3">
                                            {row.image_thumb_url ? (
                                                <img
                                                    src={row.image_thumb_url}
                                                    alt=""
                                                    className="h-11 w-11 shrink-0 rounded-lg object-cover ring-1 ring-slate-200"
                                                />
                                            ) : (
                                                <div
                                                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400 ring-1 ring-slate-200"
                                                    aria-hidden
                                                >
                                                    —
                                                </div>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <p
                                                    className="font-medium text-slate-900"
                                                    title={row.name || undefined}
                                                >
                                                    {productNamePreview(row.name)}
                                                </p>
                                                {row.description ? (
                                                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
                                                        {row.description}
                                                    </p>
                                                ) : null}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-slate-700">{row.category?.name ?? '—'}</td>
                                    <td className="px-4 py-3 text-slate-600">
                                        {row.created_at ? new Date(row.created_at).toLocaleString() : '—'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <TableIconActions
                                            viewTo={
                                                can('products-list')
                                                    ? `/products/${row.id}`
                                                    : undefined
                                            }
                                            editTo={
                                                can('products-edit')
                                                    ? `/products/${row.id}/edit`
                                                    : undefined
                                            }
                                            reviewsTo={
                                                can('store.reviews.manage')
                                                    ? `/store/reviews?product=${row.id}&product_name=${encodeURIComponent(row.name)}`
                                                    : undefined
                                            }
                                            onDelete={
                                                can('products-delete')
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
