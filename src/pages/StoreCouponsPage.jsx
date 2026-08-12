import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import { HiOutlinePlus } from 'react-icons/hi2';

export default function StoreCouponsPage() {
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
        page,
        per_page: perPage,
        ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
    }), [page, perPage, debouncedSearch]);

    useEffect(() => setPage(1), [debouncedSearch, perPage]);

    const reload = useCallback(() => {
        setLoading(true);
        setErr('');
        api.get(`${apiBase}/coupons`, { params: loadParams() })
            .then(({ data }) => {
                setRows(data.data ?? []);
                setMeta(data.meta ?? null);
            })
            .catch((e) => setErr(e.response?.data?.message || e.message))
            .finally(() => setLoading(false));
    }, [apiBase, loadParams]);

    useEffect(() => { reload(); }, [reload]);

    const runDelete = async () => {
        if (!confirmOne) return;
        setDeleting(true);
        try {
            await api.delete(`${apiBase}/coupons/${confirmOne}`);
            toast.success(t('action_delete'));
            setConfirmOne(null);
            setRows((r) => r.filter((x) => x.id !== confirmOne));
        } catch (e) {
            toast.error(e.response?.data?.message || e.message);
        } finally {
            setDeleting(false);
        }
    };

    const fmtValue = (row) => (row.type === 'percentage' ? `${Number(row.value)}%` : Number(row.value).toFixed(2));
    const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="border-s-4 border-brand ps-4">
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t('coupons_title', 'Coupons')}</h1>
                    <p className="mt-1 text-sm text-slate-500">{t('coupons_subtitle', 'Create and manage discount codes for this store.')}</p>
                </div>
                <div className="flex items-center gap-2">
                    {id ? <Link to="/stores" className="text-sm text-brand hover:underline">← {t('stores_title', 'Stores')}</Link> : null}
                    <button
                        type="button"
                        onClick={() => navigate(`${uiBase}/coupons/new`)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-brand-dark"
                    >
                        <HiOutlinePlus className="h-4 w-4" aria-hidden />
                        {t('coupon_create', 'New coupon')}
                    </button>
                </div>
            </div>
            {err && <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}

            <div className="overflow-hidden rounded-2xl border border-slate-200/80 shadow-card">
                <ListToolbar
                    searchValue={searchInput}
                    onSearchChange={setSearchInput}
                    perPage={perPage}
                    onPerPageChange={(n) => { setPerPage(n); setPage(1); }}
                />
                <div className="relative min-h-48 overflow-auto bg-white">
                    <TableLoadingOverlay show={loading} />
                    <table className="min-w-full text-start text-sm">
                        <thead className="bg-surface-muted/90 text-xs font-semibold uppercase tracking-wide text-slate-600">
                            <tr>
                                <th className="px-4 py-3.5">{t('coupon_code', 'Code')}</th>
                                <th className="px-4 py-3.5">{t('coupon_type', 'Type')}</th>
                                <th className="px-4 py-3.5">{t('coupon_value', 'Value')}</th>
                                <th className="px-4 py-3.5">{t('col_status', 'Status')}</th>
                                <th className="px-4 py-3.5">{t('coupon_used', 'Used')}</th>
                                <th className="px-4 py-3.5">{t('coupon_expires', 'Expires')}</th>
                                <th className="px-4 py-3.5">{t('col_actions', 'Actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 && !loading ? (
                                <tr><td colSpan={7} className="px-4 py-14 text-center text-sm text-slate-500">{t('empty', 'Nothing here yet.')}</td></tr>
                            ) : null}
                            {rows.map((row) => (
                                <tr key={row.id} className="border-t border-slate-100 transition-colors hover:bg-slate-50/60">
                                    <td className="px-4 py-3 font-mono font-medium text-slate-900">{row.code}</td>
                                    <td className="px-4 py-3 text-slate-700">{t(`coupon_type_${row.type}`, row.type)}</td>
                                    <td className="px-4 py-3 font-medium text-slate-900">{fmtValue(row)}</td>
                                    <td className="px-4 py-3"><StatusBadge status={row.is_active ? 'active' : 'inactive'} label={row.is_active ? t('status_active', 'Active') : t('status_inactive', 'Inactive')} /></td>
                                    <td className="px-4 py-3 text-slate-600">{row.used_count ?? 0}{row.max_uses ? ` / ${row.max_uses}` : ''}</td>
                                    <td className="px-4 py-3 text-slate-600">{fmtDate(row.expires_at)}</td>
                                    <td className="px-4 py-3">
                                        <TableIconActions
                                            editTo={`${uiBase}/coupons/${row.id}/edit`}
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
                title={t('coupon_delete_title', 'Delete coupon')}
                body={t('coupon_delete_body', 'This coupon will no longer be redeemable.')}
                confirmLabel={t('action_delete', 'Delete')}
                cancelLabel={t('cancel', 'Cancel')}
                danger
                loading={deleting}
                onConfirm={runDelete}
            />
        </div>
    );
}
