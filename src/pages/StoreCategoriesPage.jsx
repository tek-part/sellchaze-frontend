import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import useStoreScope from '../hooks/useStoreScope';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useDebounced } from '../hooks/useDebounced';
import ListToolbar from '../components/table/ListToolbar';
import PaginationBar from '../components/table/PaginationBar';
import TableLoadingOverlay from '../components/table/TableLoadingOverlay';
import TableIconActions from '../components/table/TableIconActions';
import ConfirmDialog from '../components/ConfirmDialog';
import StatusBadge from '../components/StatusBadge';

export default function StoreCategoriesPage() {
    const { id, apiBase, uiBase } = useStoreScope();
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState(null);
    const [err, setErr] = useState('');
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(15);
    const [searchInput, setSearchInput] = useState('');
    const debouncedSearch = useDebounced(searchInput, 400);
    const [confirmOne, setConfirmOne] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const loadParams = useCallback(() => ({
        page, per_page: perPage, ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
    }), [page, perPage, debouncedSearch]);

    useEffect(() => setPage(1), [debouncedSearch, perPage]);

    const reload = useCallback(() => {
        setLoading(true);
        setErr('');
        api.get(`${apiBase}/catalog/categories`, { params: loadParams() })
            .then(({ data }) => { setRows(data.data ?? []); setMeta(data.meta ?? null); })
            .catch((e) => setErr(e.response?.data?.message || e.message))
            .finally(() => setLoading(false));
    }, [id, loadParams]);

    useEffect(() => { reload(); }, [reload]);

    const runDelete = async () => {
        if (!confirmOne) return;
        setDeleting(true);
        try {
            await api.delete(`${apiBase}/catalog/categories/${confirmOne}`);
            toast.success(t('action_delete', 'Delete'));
            setConfirmOne(null);
            setRows((r) => r.filter((x) => x.id !== confirmOne));
        } catch (e) {
            toast.error(e.response?.data?.message || e.message);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="border-s-4 border-brand ps-4">
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t('categories_title', 'Categories')}</h1>
                    <p className="mt-1 text-sm text-slate-500">{t('store_categories_subtitle', 'Organize this store’s catalog.')}</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link to={`${uiBase}/products`} className="text-sm text-brand hover:underline">{t('products_title', 'Products')}</Link>
                    {id ? <Link to="/stores" className="text-sm text-brand hover:underline">← {t('stores_title', 'Stores')}</Link> : null}
                </div>
            </div>
            {err && <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}

            <div className="overflow-hidden rounded-2xl border border-slate-200/80 shadow-card">
                <ListToolbar
                    searchValue={searchInput}
                    onSearchChange={setSearchInput}
                    perPage={perPage}
                    onPerPageChange={(n) => { setPerPage(n); setPage(1); }}
                    onCreate={() => navigate(`${uiBase}/categories/new`)}
                    createLabel={t('category_create', 'New category')}
                />
                <div className="relative min-h-48 overflow-auto bg-white">
                    <TableLoadingOverlay show={loading} />
                    <table className="min-w-full text-start text-sm">
                        <thead className="bg-surface-muted/90 text-xs font-semibold uppercase tracking-wide text-slate-600">
                            <tr>
                                <th className="px-4 py-3.5">{t('col_name', 'Name')}</th>
                                <th className="px-4 py-3.5">{t('category_products', 'Products')}</th>
                                <th className="px-4 py-3.5">{t('col_status', 'Status')}</th>
                                <th className="px-4 py-3.5">{t('col_actions', 'Actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 && !loading ? (
                                <tr><td colSpan={4} className="px-4 py-14 text-center text-sm text-slate-500">{t('empty', 'Nothing here yet.')}</td></tr>
                            ) : null}
                            {rows.map((row) => (
                                <tr key={row.id} className="border-t border-slate-100 transition-colors hover:bg-slate-50/60">
                                    <td className="px-4 py-3">
                                        <p className="font-medium text-slate-900">{row.name}</p>
                                        <p className="text-xs text-slate-400">/{row.slug}</p>
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">{row.products_count ?? 0}</td>
                                    <td className="px-4 py-3"><StatusBadge status={row.is_active ? 'active' : 'inactive'} label={row.is_active ? t('status_active', 'Active') : t('status_inactive', 'Inactive')} /></td>
                                    <td className="px-4 py-3">
                                        <TableIconActions editTo={`${uiBase}/categories/${row.id}/edit`} onDelete={() => setConfirmOne(row.id)} deleteDisabled={deleting} />
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
                title={t('category_delete_title', 'Delete category')}
                body={t('category_delete_body', 'Products in this category will become uncategorized.')}
                confirmLabel={t('action_delete', 'Delete')}
                cancelLabel={t('cancel', 'Cancel')}
                danger
                loading={deleting}
                onConfirm={runDelete}
            />
        </div>
    );
}
