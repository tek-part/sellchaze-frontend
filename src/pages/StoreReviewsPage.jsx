import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useOutletContext, useSearchParams } from 'react-router-dom';
import useStoreScope from '../hooks/useStoreScope';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../api/client';
import ConfirmDialog from '../components/ConfirmDialog';
import { IndexFilters, IndexTable, downloadCsv, useIndexQuery, useIndexTable } from '../components/data-table';
import { HiOutlineStar } from '../components/workspace/WorkspaceIcons';

const STATUSES = ['pending', 'approved', 'rejected', 'hidden'];
const STATUS_TONE = { approved: 'is-success', pending: 'is-warning', rejected: 'is-critical', hidden: '' };
// The reviews endpoint filters by status and product only (no search or sorting; newest first).
const DEFAULTS = { sort: null, perPage: 25 };

export default function StoreReviewsPage() {
    const { id, apiBase } = useStoreScope();
    const { store } = useOutletContext() ?? {};
    const { t, i18n } = useTranslation();
    const ar = i18n.language?.startsWith('ar'); const text = (a, e) => (ar ? a : e);
    const [searchParams, setSearchParams] = useSearchParams();
    const productId = searchParams.get('product') || '';
    const productName = searchParams.get('product_name') || '';

    const [busyId, setBusyId] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const scope = useRef(apiBase); scope.current = apiBase;

    const statusLabel = (status) => t(`review_status_${status}`, status);
    const filters = useMemo(() => [
        { key: 'status', label: t('col_status', 'Status'), type: 'select', options: STATUSES.map((status) => ({ value: status, label: statusLabel(status) })) },
        { key: 'rating', label: t('review_rating', 'Rating'), type: 'multi', options: [5, 4, 3, 2, 1].map((stars) => ({ value: String(stars), label: '★'.repeat(stars) })) },
        { key: 'created', label: text('التاريخ', 'Date'), type: 'date-range' },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [ar, t]);
    const views = useMemo(() => [
        { id: 'all', label: text('الكل', 'All'), state: { filters: {} } },
        ...STATUSES.map((status) => ({ id: status, label: statusLabel(status), state: { filters: { status } } })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [ar, t]);

    const moderate = async (review, next) => {
        const origin = scope.current;
        setBusyId(review.id);
        try {
            const { data } = await api.patch(`${apiBase}/reviews/${review.id}/status`, { status: next });
            if (scope.current !== origin) return;
            setResult((current) => (current ? { ...current, data: current.data.map((x) => (x.id === review.id ? data.data : x)) } : current));
            toast.success(t(`review_status_${next}`, next));
        } catch (e) {
            toast.error(e.response?.data?.message || e.message);
        } finally {
            setBusyId(null);
        }
    };

    const [bulkBusy, setBulkBusy] = useState(false);
    const moderateMany = async (list, next, clear) => {
        const origin = scope.current;
        setBulkBusy(true);
        try {
            const { data } = await api.post(`${apiBase}/reviews/bulk-status`, { ids: list.map((review) => review.id), status: next });
            if (scope.current !== origin) return;
            toast.success(text(`تم تحديث ${data.meta.updated} تقييم`, `${data.meta.updated} reviews updated`));
            clear(); reload();
        } catch (e) {
            toast.error(e.response?.data?.message || e.message);
        } finally {
            setBulkBusy(false);
        }
    };

    const actionBtn = 'rounded-lg border px-2 py-1 text-xs font-medium disabled:opacity-40';
    const date = (value) => (value ? new Date(value).toLocaleDateString(ar ? 'ar-EG' : 'en-GB') : '—');
    const columns = useMemo(() => [
        { key: 'review', header: text('التقييم', 'Review'), hideable: false, primary: true, csv: (row) => [row.title, row.body].filter(Boolean).join(' — '),
            render: (row) => <div className="max-w-88">
                <span className="whitespace-nowrap text-amber-500" role="img" aria-label={text(`${row.rating} من 5`, `${row.rating} out of 5`)}>{'★'.repeat(row.rating)}<span className="text-slate-300">{'★'.repeat(5 - row.rating)}</span></span>
                {row.title ? <p className="font-medium text-slate-800">{row.title}</p> : null}
                <p className="ws-dt-sub whitespace-normal">{row.body}</p>
            </div> },
        { key: 'rating', header: t('review_rating', 'Rating'), align: 'end', defaultHidden: true, sortKey: 'rating', csv: (row) => row.rating, render: (row) => <span className="ws-dt-num">{row.rating} / 5</span> },
        { key: 'product', header: t('review_product', 'Product'), csv: (row) => row.product?.name ?? '', render: (row) => row.product?.name || '—' },
        { key: 'customer', header: t('review_customer', 'Customer'), csv: (row) => row.author ?? '', render: (row) => row.author || '—' },
        { key: 'status', header: t('col_status', 'Status'), csv: (row) => row.status, render: (row) => <span className={`ws-dt-badge ${STATUS_TONE[row.status] ?? ''}`}>{statusLabel(row.status)}</span> },
        { key: 'created', header: text('التاريخ', 'Date'), sortKey: 'created_at', csv: (row) => row.created_at ?? '', render: (row) => <span className="ws-dt-num">{date(row.created_at)}</span> },
        { key: 'actions', header: <span className="sr-only">{t('col_actions', 'Actions')}</span>, hideable: false, align: 'end',
            render: (row) => <div className="ws-dt-row-actions flex-wrap gap-1.5">
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
            </div> },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [ar, t, busyId, apiBase]);

    const table = useIndexTable({ scope: `store:${store?.id ?? apiBase}:reviews`, filters, columns, views, defaults: DEFAULTS });
    const params = { ...table.apiParams, ...(productId ? { product_id: productId } : {}) };
    const { data: rows, meta, loading, error: err, reload, setResult } = useIndexQuery({ url: `${apiBase}/reviews`, params });
    useEffect(() => { setConfirmDelete(null); }, [apiBase]);

    const runDelete = async () => {
        if (!confirmDelete) return;
        const origin = scope.current;
        setDeleting(true);
        try {
            await api.delete(`${apiBase}/reviews/${confirmDelete}`);
            if (scope.current !== origin) return;
            toast.success(t('action_delete', 'Delete'));
            setConfirmDelete(null);
            setResult((current) => (current ? { ...current, data: current.data.filter((x) => x.id !== confirmDelete) } : current));
        } catch (e) {
            toast.error(e.response?.data?.message || e.message);
        } finally {
            setDeleting(false);
        }
    };
    const showAll = () => setSearchParams((current) => { const next = new URLSearchParams(current); next.delete('product'); next.delete('product_name'); next.delete('page'); return next; }, { replace: true });

    return (
        <section className="ws-catalog-page">
            <header className="ws-catalog-heading">
                <div>
                    <h1>{t('reviews_title', 'Reviews')}</h1>
                    <p>{t('reviews_subtitle', 'Moderate customer reviews for this store.')}</p>
                </div>
                {id ? <div className="ws-catalog-actions"><Link to="/stores" className="ws-dt-button">← {t('stores_title', 'Stores')}</Link></div> : null}
            </header>

            {productId ? (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand/20 bg-brand/5 px-4 py-2.5">
                    <p className="text-sm text-slate-700">
                        {t('reviews_filtered_by_product', 'Showing reviews for:')}{' '}
                        <span className="font-semibold text-slate-900">{productName || `#${productId}`}</span>
                    </p>
                    <button type="button" onClick={showAll} className="text-sm font-medium text-brand hover:underline">
                        {t('reviews_show_all', 'Show all reviews')}
                    </button>
                </div>
            ) : null}

            <div className="ws-dt-card">
                <IndexFilters table={table} searchPlaceholder={text('ابحث في التقييمات أو اسم المنتج', 'Search reviews or product name')} exportDisabled={!rows.length}
                    onExport={() => downloadCsv(`reviews-${new Date().toISOString().slice(0, 10)}.csv`, table.visibleColumns, rows)} />
                <IndexTable table={table} rows={rows} loading={loading} error={err} onRetry={reload} meta={meta}
                    label={t('reviews_title', 'Reviews')} maxSelection={100}
                    bulkActions={['approved', 'hidden', 'rejected'].map((status) => ({ key: status, label: statusLabel(status), disabled: () => bulkBusy, onAction: (list, clear) => void moderateMany(list, status, clear) }))}
                    emptyState={{ icon: HiOutlineStar, title: text('لا توجد تقييمات بعد', 'No reviews yet'), description: text('تظهر هنا تقييمات العملاء لمنتجاتك لمراجعتها ونشرها.', 'Customer reviews of your products appear here for moderation.') }} />
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
        </section>
    );
}
