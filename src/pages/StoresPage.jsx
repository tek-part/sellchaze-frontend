import { useCallback, useEffect, useState } from 'react';
import { Navigate, useNavigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useDebounced } from '../hooks/useDebounced';
import ListToolbar from '../components/table/ListToolbar';
import PaginationBar from '../components/table/PaginationBar';
import TableLoadingOverlay from '../components/table/TableLoadingOverlay';
import ConfirmDialog from '../components/ConfirmDialog';
import TableIconActions from '../components/table/TableIconActions';

const STATUS_STYLES = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    draft: 'bg-slate-100 text-slate-600 border-slate-200',
    suspended: 'bg-red-50 text-red-700 border-red-100',
};

export default function StoresPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { permissions } = useOutletContext();
    const can = (p) => permissions.includes(p);

    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState(null);
    const [err, setErr] = useState('');
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(15);
    const [searchInput, setSearchInput] = useState('');
    const debouncedSearch = useDebounced(searchInput, 400);
    const [statusFilter, setStatusFilter] = useState('');
    const [confirmOne, setConfirmOne] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [listNonce, setListNonce] = useState(0);

    const loadParams = useCallback(
        () => ({
            page,
            per_page: perPage,
            ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
            ...(statusFilter ? { status: statusFilter } : {}),
        }),
        [page, perPage, debouncedSearch, statusFilter],
    );

    useEffect(() => setPage(1), [debouncedSearch, statusFilter, perPage]);

    useEffect(() => {
        if (!permissions.includes('stores-list')) return;
        setLoading(true);
        setErr('');
        api.get('/stores', { params: loadParams() })
            .then(({ data }) => {
                setRows(data.data ?? []);
                setMeta(data.meta ?? null);
            })
            .catch((e) => setErr(e.response?.data?.message || e.message))
            .finally(() => setLoading(false));
    }, [permissions, loadParams, listNonce]);

    if (!can('stores-list')) {
        return <Navigate to="/dashboard" replace />;
    }

    const statusLabel = (s) => t(`store_status_${s}`, s);

    const runDeleteOne = async () => {
        if (!confirmOne) return;
        setDeleting(true);
        try {
            await api.delete(`/stores/${confirmOne}`);
            toast.success(t('action_delete'));
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
            <div className="border-s-4 border-brand ps-4">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t('stores_title')}</h1>
                <p className="mt-1 text-sm text-slate-500">{t('stores_subtitle')}</p>
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
                    onCreate={can('stores-create') ? () => navigate('/stores/new') : undefined}
                    createLabel={t('table_create')}
                    advanced={
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-[11px] font-semibold uppercase text-slate-500">
                                    {t('store_status')}
                                </label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                                >
                                    <option value="">—</option>
                                    <option value="draft">{t('store_status_draft')}</option>
                                    <option value="active">{t('store_status_active')}</option>
                                    <option value="suspended">{t('store_status_suspended')}</option>
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
                                <th className="px-4 py-3.5">#</th>
                                <th className="px-4 py-3.5">{t('col_name')}</th>
                                <th className="px-4 py-3.5">{t('store_owner_type')}</th>
                                <th className="px-4 py-3.5">{t('store_status')}</th>
                                <th className="px-4 py-3.5">{t('store_currency')}</th>
                                <th className="px-4 py-3.5">{t('col_created')}</th>
                                <th className="px-4 py-3.5">{t('col_actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 && !loading ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-14 text-center text-sm text-slate-500">
                                        {t('empty')}
                                    </td>
                                </tr>
                            ) : null}
                            {rows.map((row) => (
                                <tr
                                    key={row.id}
                                    className="border-t border-slate-100 transition-colors hover:bg-slate-50/60"
                                >
                                    <td className="px-4 py-3 font-medium text-slate-900">{row.id}</td>
                                    <td className="max-w-[18rem] px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            {row.logo_url ? (
                                                <img
                                                    src={row.logo_url}
                                                    alt=""
                                                    className="h-8 w-8 rounded-lg object-cover"
                                                />
                                            ) : null}
                                            <div className="min-w-0">
                                                <p className="truncate font-medium text-slate-900">{row.name}</p>
                                                <p className="truncate text-xs text-slate-400">/{row.slug}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-slate-700">{row.owner_type}</td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${
                                                STATUS_STYLES[row.status] || STATUS_STYLES.draft
                                            }`}
                                        >
                                            {statusLabel(row.status)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-slate-700">{row.currency}</td>
                                    <td className="px-4 py-3 text-slate-600">
                                        {row.created_at ? new Date(row.created_at).toLocaleDateString() : '—'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            {can('stores-edit') && (
                                                <button
                                                    type="button"
                                                    onClick={() => navigate(`/stores/${row.id}/products`)}
                                                    className="text-xs font-medium text-brand hover:underline"
                                                >
                                                    {t('products_title', 'Products')}
                                                </button>
                                            )}
                                            {can('stores-edit') && (
                                                <button
                                                    type="button"
                                                    onClick={() => navigate(`/stores/${row.id}/themes`)}
                                                    className="text-xs font-medium text-brand hover:underline"
                                                >
                                                    {t('store_themes_title', 'Themes')}
                                                </button>
                                            )}
                                            {can('stores-edit') && (
                                                <button
                                                    type="button"
                                                    onClick={() => navigate(`/stores/${row.id}/pages`)}
                                                    className="text-xs font-medium text-brand hover:underline"
                                                >
                                                    {t('pages_title', 'Pages')}
                                                </button>
                                            )}
                                            {can('stores-edit') && (
                                                <button
                                                    type="button"
                                                    onClick={() => navigate(`/stores/${row.id}/coupons`)}
                                                    className="text-xs font-medium text-brand hover:underline"
                                                >
                                                    {t('coupons_title', 'Coupons')}
                                                </button>
                                            )}
                                            {can('stores-edit') && (
                                                <button
                                                    type="button"
                                                    onClick={() => navigate(`/stores/${row.id}/orders`)}
                                                    className="text-xs font-medium text-brand hover:underline"
                                                >
                                                    {t('orders_title', 'Orders')}
                                                </button>
                                            )}
                                            {can('stores-edit') && (
                                                <button
                                                    type="button"
                                                    onClick={() => navigate(`/stores/${row.id}/analytics`)}
                                                    className="text-xs font-medium text-brand hover:underline"
                                                >
                                                    {t('analytics_title', 'Analytics')}
                                                </button>
                                            )}
                                            {can('stores-edit') && (
                                                <button
                                                    type="button"
                                                    onClick={() => navigate(`/stores/${row.id}/reviews`)}
                                                    className="text-xs font-medium text-brand hover:underline"
                                                >
                                                    {t('reviews_title', 'Reviews')}
                                                </button>
                                            )}
                                            <TableIconActions
                                                viewTo={
                                                    can('stores-edit') ? `/stores/${row.id}/settings` : undefined
                                                }
                                                editTo={can('stores-edit') ? `/stores/${row.id}/edit` : undefined}
                                                onDelete={
                                                    can('stores-delete') ? () => setConfirmOne(row.id) : undefined
                                                }
                                                deleteDisabled={deleting}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <PaginationBar meta={meta} loading={loading} onPageChange={setPage} />
            </div>
            <p className="text-sm text-slate-600">{t('stores_manage_hint')}</p>

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
        </div>
    );
}
