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

export default function StoreProductsPage() {
    const { id, apiBase, uiBase } = useStoreScope();
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState(null);
    const [categories, setCategories] = useState([]);
    const [err, setErr] = useState('');
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(15);
    const [searchInput, setSearchInput] = useState('');
    const debouncedSearch = useDebounced(searchInput, 400);
    const [categoryId, setCategoryId] = useState('');
    const [status, setStatus] = useState('');
    const [confirmOne, setConfirmOne] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [busyId, setBusyId] = useState(null);

    useEffect(() => {
        api.get(`${apiBase}/catalog/categories`, { params: { per_page: 100 } })
            .then(({ data }) => setCategories(data.data ?? []))
            .catch(() => {});
    }, [id]);

    const loadParams = useCallback(() => ({
        page, per_page: perPage,
        ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
        ...(categoryId ? { category_id: categoryId } : {}),
    }), [page, perPage, debouncedSearch, categoryId]);

    useEffect(() => setPage(1), [debouncedSearch, categoryId, status, perPage]);

    const reload = useCallback(() => {
        setLoading(true);
        setErr('');
        api.get(`${apiBase}/catalog/products`, { params: loadParams() })
            .then(({ data }) => {
                let list = data.data ?? [];
                if (status) list = list.filter((p) => (status === 'active' ? p.is_active : !p.is_active));
                setRows(list);
                setMeta(data.meta ?? null);
            })
            .catch((e) => setErr(e.response?.data?.message || e.message))
            .finally(() => setLoading(false));
    }, [id, loadParams, status]);

    useEffect(() => { reload(); }, [reload]);

    const toggleActive = async (row) => {
        setBusyId(row.id);
        try {
            const fd = new FormData();
            fd.append('_method', 'PUT');
            fd.append('is_active', row.is_active ? '0' : '1');
            const { data } = await api.post(`${apiBase}/catalog/products/${row.id}`, fd);
            setRows((r) => r.map((x) => (x.id === row.id ? data.data : x)));
        } catch (e) {
            toast.error(e.response?.data?.message || e.message);
        } finally {
            setBusyId(null);
        }
    };

    const runDelete = async () => {
        if (!confirmOne) return;
        setDeleting(true);
        try {
            await api.delete(`${apiBase}/catalog/products/${confirmOne}`);
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
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t('products_title', 'Products')}</h1>
                    <p className="mt-1 text-sm text-slate-500">{t('store_products_subtitle', 'Manage this store’s catalog.')}</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link to={`${uiBase}/categories`} className="text-sm text-brand hover:underline">{t('categories_title', 'Categories')}</Link>
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
                    onCreate={() => navigate(`${uiBase}/products/new`)}
                    createLabel={t('product_create', 'New product')}
                    advanced={
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-[11px] font-semibold uppercase text-slate-500">{t('product_category', 'Category')}</label>
                                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm">
                                    <option value="">—</option>
                                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-[11px] font-semibold uppercase text-slate-500">{t('col_status', 'Status')}</label>
                                <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm">
                                    <option value="">—</option>
                                    <option value="active">{t('status_active', 'Active')}</option>
                                    <option value="inactive">{t('status_inactive', 'Inactive')}</option>
                                </select>
                            </div>
                        </div>
                    }
                />
                <div className="relative min-h-48 overflow-auto bg-white">
                    <TableLoadingOverlay show={loading} />
                    <table className="min-w-full text-start text-sm">
                        <thead className="bg-surface-muted/90 text-xs font-semibold uppercase tracking-wide text-slate-600">
                            <tr>
                                <th className="px-4 py-3.5">{t('col_name', 'Product')}</th>
                                <th className="px-4 py-3.5">{t('product_sku', 'SKU')}</th>
                                <th className="px-4 py-3.5">{t('product_category', 'Category')}</th>
                                <th className="px-4 py-3.5">{t('product_price', 'Price')}</th>
                                <th className="px-4 py-3.5">{t('col_status', 'Status')}</th>
                                <th className="px-4 py-3.5">{t('col_actions', 'Actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 && !loading ? (
                                <tr><td colSpan={6} className="px-4 py-14 text-center text-sm text-slate-500">{t('empty', 'Nothing here yet.')}</td></tr>
                            ) : null}
                            {rows.map((row) => (
                                <tr key={row.id} className="border-t border-slate-100 transition-colors hover:bg-slate-50/60">
                                    <td className="max-w-[18rem] px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            {row.image_url ? <img src={row.image_url} alt="" className="h-8 w-8 rounded-lg object-cover" /> : <div className="h-8 w-8 rounded-lg bg-slate-100" />}
                                            <div className="min-w-0">
                                                <p className="truncate font-medium text-slate-900">{row.name}</p>
                                                <p className="truncate text-xs text-slate-400">/{row.slug}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{row.sku || '—'}</td>
                                    <td className="px-4 py-3 text-slate-700">{row.category?.name || '—'}</td>
                                    <td className="px-4 py-3 font-medium text-slate-900">{Number(row.price).toFixed(2)}</td>
                                    <td className="px-4 py-3">
                                        <button type="button" disabled={busyId === row.id} onClick={() => toggleActive(row)} title={t('product_toggle_active', 'Toggle active')}>
                                            <StatusBadge status={row.is_active ? 'active' : 'inactive'} label={row.is_active ? t('status_active', 'Active') : t('status_inactive', 'Inactive')} />
                                        </button>
                                        {row.is_featured ? <span className="ms-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">{t('product_featured', 'Featured')}</span> : null}
                                    </td>
                                    <td className="px-4 py-3">
                                        <TableIconActions
                                            viewTo={`${uiBase}/products/${row.id}`}
                                            editTo={`${uiBase}/products/${row.id}/edit`}
                                            onDelete={() => setConfirmOne(row.id)}
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
                title={t('product_delete_title', 'Delete product')}
                body={t('product_delete_body', 'This product and its variants will be removed.')}
                confirmLabel={t('action_delete', 'Delete')}
                cancelLabel={t('cancel', 'Cancel')}
                danger
                loading={deleting}
                onConfirm={runDelete}
            />
        </div>
    );
}
