import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import useStoreScope from '../hooks/useStoreScope';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../api/client';
import ListToolbar from '../components/table/ListToolbar';
import PaginationBar from '../components/table/PaginationBar';
import TableLoadingOverlay from '../components/table/TableLoadingOverlay';
import ConfirmDialog from '../components/ConfirmDialog';
import StatusBadge from '../components/StatusBadge';

const REVIEW_STATUS_STYLE = {
    approved: 'active',
    pending: 'pending',
    rejected: 'cancelled',
    hidden: 'inactive',
};

export default function StoreReviewsPage() {
    const { id, apiBase, uiBase } = useStoreScope();
    const { t } = useTranslation();

    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState(null);
    const [err, setErr] = useState('');
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(15);
    const [status, setStatus] = useState('');
    const [busyId, setBusyId] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const loadParams = useCallback(() => ({
        page, per_page: perPage, ...(status ? { status } : {}),
    }), [page, perPage, status]);

    useEffect(() => setPage(1), [status, perPage]);

    const reload = useCallback(() => {
        setLoading(true);
        setErr('');
        api.get(`${apiBase}/reviews`, { params: loadParams() })
            .then(({ data }) => { setRows(data.data ?? []); setMeta(data.meta ?? null); })
            .catch((e) => setErr(e.response?.data?.message || e.message))
            .finally(() => setLoading(false));
    }, [id, loadParams]);

    useEffect(() => { reload(); }, [reload]);

    const moderate = async (review, next) => {
        setBusyId(review.id);
        try {
            const { data } = await api.patch(`${apiBase}/reviews/${review.id}/status`, { status: next });
            setRows((r) => r.map((x) => (x.id === review.id ? data.data : x)));
            toast.success(t(`review_status_${next}`, next));
        } catch (e) {
            toast.error(e.response?.data?.message || e.message);
        } finally {
            setBusyId(null);
        }
    };

    const runDelete = async () => {
        if (!confirmDelete) return;
        setDeleting(true);
        try {
            await api.delete(`${apiBase}/reviews/${confirmDelete}`);
            toast.success(t('action_delete', 'Delete'));
            setConfirmDelete(null);
            setRows((r) => r.filter((x) => x.id !== confirmDelete));
        } catch (e) {
            toast.error(e.response?.data?.message || e.message);
        } finally {
            setDeleting(false);
        }
    };

    const actionBtn = 'rounded-lg border px-2 py-1 text-xs font-medium disabled:opacity-40';

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="border-s-4 border-brand ps-4">
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t('reviews_title', 'Reviews')}</h1>
                    <p className="mt-1 text-sm text-slate-500">{t('reviews_subtitle', 'Moderate customer reviews for this store.')}</p>
                </div>
                {id ? <Link to="/stores" className="text-sm text-brand hover:underline">← {t('stores_title', 'Stores')}</Link> : null}
            </div>
            {err && <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}

            <div className="overflow-hidden rounded-2xl border border-slate-200/80 shadow-card">
                <ListToolbar
                    perPage={perPage}
                    onPerPageChange={(n) => { setPerPage(n); setPage(1); }}
                    advanced={
                        <div>
                            <label className="mb-1 block text-[11px] font-semibold uppercase text-slate-500">{t('col_status', 'Status')}</label>
                            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm sm:w-48">
                                <option value="">—</option>
                                {['approved', 'pending', 'rejected', 'hidden'].map((s) => <option key={s} value={s}>{t(`review_status_${s}`, s)}</option>)}
                            </select>
                        </div>
                    }
                />
                <div className="relative min-h-48 overflow-auto bg-white">
                    <TableLoadingOverlay show={loading} />
                    <table className="min-w-full text-start text-sm">
                        <thead className="bg-surface-muted/90 text-xs font-semibold uppercase tracking-wide text-slate-600">
                            <tr>
                                <th className="px-4 py-3.5">{t('review_rating', 'Rating')}</th>
                                <th className="px-4 py-3.5">{t('review_product', 'Product')}</th>
                                <th className="px-4 py-3.5">{t('review_customer', 'Customer')}</th>
                                <th className="px-4 py-3.5">{t('review_comment', 'Comment')}</th>
                                <th className="px-4 py-3.5">{t('col_status', 'Status')}</th>
                                <th className="px-4 py-3.5">{t('col_actions', 'Actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 && !loading ? (
                                <tr><td colSpan={6} className="px-4 py-14 text-center text-sm text-slate-500">{t('empty', 'Nothing here yet.')}</td></tr>
                            ) : null}
                            {rows.map((row) => (
                                <tr key={row.id} className="border-t border-slate-100 align-top hover:bg-slate-50/60">
                                    <td className="whitespace-nowrap px-4 py-3 text-amber-500">{'★'.repeat(row.rating)}<span className="text-slate-300">{'★'.repeat(5 - row.rating)}</span></td>
                                    <td className="px-4 py-3 text-slate-700">{row.product?.name || '—'}</td>
                                    <td className="px-4 py-3 text-slate-700">{row.author || '—'}</td>
                                    <td className="max-w-88 px-4 py-3 text-slate-600">
                                        {row.title ? <p className="font-medium text-slate-800">{row.title}</p> : null}
                                        <p className="text-slate-600">{row.body}</p>
                                    </td>
                                    <td className="px-4 py-3"><StatusBadge status={REVIEW_STATUS_STYLE[row.status] || 'inactive'} label={t(`review_status_${row.status}`, row.status)} /></td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1.5">
                                            {row.status !== 'approved' && (
                                                <button type="button" disabled={busyId === row.id} onClick={() => moderate(row, 'approved')} className={`${actionBtn} border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100`}>{t('review_approve', 'Approve')}</button>
                                            )}
                                            {row.status !== 'hidden' && (
                                                <button type="button" disabled={busyId === row.id} onClick={() => moderate(row, 'hidden')} className={`${actionBtn} border-slate-200 bg-white text-slate-600 hover:bg-slate-50`}>{t('review_hide', 'Hide')}</button>
                                            )}
                                            {row.status !== 'rejected' && (
                                                <button type="button" disabled={busyId === row.id} onClick={() => moderate(row, 'rejected')} className={`${actionBtn} border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100`}>{t('review_reject', 'Reject')}</button>
                                            )}
                                            <button type="button" disabled={busyId === row.id} onClick={() => setConfirmDelete(row.id)} className={`${actionBtn} border-red-200 bg-red-50 text-red-700 hover:bg-red-100`}>{t('action_delete', 'Delete')}</button>
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
                open={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                title={t('review_delete_title', 'Delete review')}
                body={t('review_delete_body', 'This review will be permanently removed.')}
                confirmLabel={t('action_delete', 'Delete')}
                cancelLabel={t('cancel', 'Cancel')}
                danger
                loading={deleting}
                onConfirm={runDelete}
            />
        </div>
    );
}
