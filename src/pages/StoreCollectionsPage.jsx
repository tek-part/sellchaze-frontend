import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import useStoreScope from '../hooks/useStoreScope';
import ConfirmDialog from '../components/ConfirmDialog';
import { IndexFilters, IndexTable, downloadCsv, useIndexTable } from '../components/data-table';
import { HiOutlinePlus, HiOutlineEye, HiOutlinePencilSquare, HiOutlineTrash, HiOutlineRectangleStack, HiOutlineCheck, HiOutlineXMark } from '../components/workspace/WorkspaceIcons';

const errorText = (e) => Object.values(e.response?.data?.errors || {}).flat().join(' ') || e.response?.data?.message || e.message;
const DEFAULTS = { sort: null, perPage: 25 };

function CollectionImage({ url }) {
    const [failed, setFailed] = useState(false);
    return <span className="ws-dt-thumb">{url && !failed ? <img src={url} alt="" loading="lazy" onError={() => setFailed(true)} /> : <HiOutlineRectangleStack aria-hidden />}</span>;
}

/** Merchant collections (manual + automated) on the shared index table. */
export default function StoreCollectionsPage() {
    const { apiBase, uiBase } = useStoreScope(); const { permissions = [], store } = useOutletContext();
    const { i18n } = useTranslation(); const ar = i18n.language.startsWith('ar'); const text = (a, e) => ar ? a : e;
    const [result, setResult] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [reload, setReload] = useState(0);
    const [actionError, setActionError] = useState(''); const [confirm, setConfirm] = useState(null); const [busy, setBusy] = useState(false);
    const path = `${apiBase}/catalog/collections`;
    const scope = useRef(apiBase); scope.current = apiBase;
    const publicUrl = store?.storefront_url || store?.public_url;
    const canCreate = permissions.includes('categories-create');
    const canEdit = permissions.includes('categories-edit');
    const canDelete = permissions.includes('categories-delete');
    const sortLabels = { manual: text('يدوي', 'Manual'), best_selling: text('الأكثر مبيعًا', 'Best selling'), price_asc: text('السعر: من الأقل', 'Price: low to high'), price_desc: text('السعر: من الأعلى', 'Price: high to low'), newest: text('الأحدث', 'Newest'), title_asc: text('الاسم: أ-ي', 'Title: A-Z'), title_desc: text('الاسم: ي-أ', 'Title: Z-A') };

    const columns = useMemo(() => [
        { key: 'title', header: text('المجموعة', 'Collection'), hideable: false, primary: true, sortKey: 'title', csv: (row) => row.title,
            render: (row) => <div className="ws-dt-cell-media"><CollectionImage key={row.image_url || 'empty'} url={row.image_url} /><div><Link className="ws-dt-title" to={`${uiBase}/collections/${row.id}`}>{row.title}</Link>{row.handle ? <span className="ws-dt-sub" dir="ltr">/collections/{row.handle}</span> : null}</div></div> },
        { key: 'type', header: text('النوع', 'Type'), csv: (row) => row.type,
            render: (row) => <span className={`ws-dt-badge ${row.type === 'automated' ? 'is-info' : ''}`}>{row.type === 'automated' ? text('تلقائية', 'Automated') : text('يدوية', 'Manual')}</span> },
        { key: 'published', header: text('الحالة', 'Status'), csv: (row) => (row.published ? 'published' : 'draft'),
            render: (row) => <span className={`ws-dt-badge ${row.published ? 'is-success' : ''}`}>{row.published ? text('منشورة', 'Published') : text('مسودة', 'Draft')}</span> },
        { key: 'products', header: text('المنتجات', 'Products'), align: 'end', csv: (row) => row.products_count ?? '', render: (row) => <span className="ws-dt-num">{row.products_count ?? '—'}</span> },
        { key: 'sort_order', header: text('ترتيب المنتجات', 'Product order'), defaultHidden: true, csv: (row) => row.sort_order, render: (row) => sortLabels[row.sort_order] || row.sort_order },
        { key: 'updated_at', header: text('آخر تحديث', 'Updated'), sortKey: 'updated_at', defaultHidden: true, csv: (row) => row.updated_at || '', render: (row) => row.updated_at ? new Date(row.updated_at).toLocaleDateString(ar ? 'ar-EG' : 'en-US') : '—' },
        { key: 'actions', header: <span className="sr-only">{text('إجراءات', 'Actions')}</span>, hideable: false, align: 'end',
            render: (row) => <div className="ws-dt-row-actions">
                {publicUrl && row.published ? <a className="ws-dt-icon" href={`${publicUrl.replace(/\/$/, '')}/collections/${row.handle}`} target="_blank" rel="noreferrer" aria-label={`${text('عرض', 'View')} ${row.title}`} title={text('مشاهدة في المتجر', 'View in store')}><HiOutlineEye aria-hidden /></a> : null}
                {canEdit ? <Link className="ws-dt-icon" to={`${uiBase}/collections/${row.id}`} aria-label={`${text('تعديل', 'Edit')} ${row.title}`} title={text('تعديل', 'Edit')}><HiOutlinePencilSquare aria-hidden /></Link> : null}
            </div> },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [ar, uiBase, publicUrl, canEdit]);

    const filters = useMemo(() => [
        { key: 'type', label: text('النوع', 'Type'), type: 'select', options: [{ value: 'manual', label: text('يدوية', 'Manual') }, { value: 'automated', label: text('تلقائية', 'Automated') }] },
        { key: 'published', label: text('الحالة', 'Status'), type: 'select', options: [{ value: 'yes', label: text('منشورة', 'Published') }, { value: 'no', label: text('مسودة', 'Draft') }] },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [ar]);
    const views = useMemo(() => [
        { id: 'all', label: text('الكل', 'All'), state: { filters: {} } },
        { id: 'manual', label: text('يدوية', 'Manual'), state: { filters: { type: 'manual' } } },
        { id: 'automated', label: text('تلقائية', 'Automated'), state: { filters: { type: 'automated' } } },
        { id: 'draft', label: text('مسودة', 'Draft'), state: { filters: { published: 'no' } } },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [ar]);
    const table = useIndexTable({ scope: `store:${store?.id ?? apiBase}:collections`, filters, columns, views, defaults: DEFAULTS });
    const paramsKey = JSON.stringify(table.apiParams);
    useEffect(() => {
        let active = true; setLoading(true); setError('');
        api.get(path, { params: table.apiParams }).then(({ data }) => { if (active) setResult(data); }).catch((e) => { if (active) setError(e.response?.data?.message || e.message); }).finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [path, paramsKey, reload]);
    useEffect(() => { table.clearSelection(); setConfirm(null); setActionError(''); setBusy(false); setResult(null); }, [path]); // eslint-disable-line react-hooks/exhaustive-deps

    const rows = result?.data || [];
    const selectedRows = [...table.selected.values()];

    async function run(request) {
        if (busy) return; const origin = scope.current; setBusy(true); setActionError('');
        try {
            await request();
            if (scope.current !== origin) return;
            table.clearSelection(); setConfirm(null); setReload((v) => v + 1);
        } catch (e) { if (scope.current === origin) { setActionError(errorText(e)); setConfirm(null); } }
        finally { if (scope.current === origin) setBusy(false); }
    }
    const publish = (list, published) => run(() => api.post(`${path}/bulk-update`, { ids: list.map((row) => row.id), published }));
    const destroy = () => confirm && run(() => api.post(`${path}/bulk-delete`, { ids: confirm.map((row) => row.id) }));
    const bulkActions = [
        ...(canEdit ? [
            { key: 'publish', label: text('نشر', 'Publish'), icon: HiOutlineCheck, disabled: () => busy, onAction: (list) => publish(list, true) },
            { key: 'unpublish', label: text('إلغاء النشر', 'Unpublish'), icon: HiOutlineXMark, disabled: () => busy, onAction: (list) => publish(list, false) },
        ] : []),
        ...(canDelete ? [{ key: 'delete', label: text('حذف المحدد', 'Delete selected'), icon: HiOutlineTrash, tone: 'danger', disabled: () => busy, onAction: (list) => { setActionError(''); setConfirm(list); } }] : []),
    ];
    const createLink = canCreate ? <Link className="ws-dt-button ws-dt-button-primary" to={`${uiBase}/collections/new`}><HiOutlinePlus aria-hidden />{text('إنشاء مجموعة', 'Create collection')}</Link> : null;

    return <section className="ws-catalog-page">
        <header className="ws-catalog-heading"><div><h1>{text('المجموعات', 'Collections')}</h1><p>{text('اجمع المنتجات يدويًا أو بشروط تلقائية لعرضها في متجرك.', 'Group products by hand or with automatic conditions to feature them in your store.')}</p></div><div className="ws-catalog-actions">{createLink}</div></header>
        {actionError ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{actionError}</p> : null}
        <div className="ws-dt-card">
            <IndexFilters table={table} searchPlaceholder={text('بحث بالاسم أو الرابط', 'Search title or handle')} exportDisabled={!rows.length}
                onExport={() => downloadCsv(`collections-${new Date().toISOString().slice(0, 10)}.csv`, table.visibleColumns, selectedRows.length ? selectedRows : rows)} />
            <IndexTable table={table} rows={rows} loading={loading} error={error} onRetry={() => setReload((v) => v + 1)} meta={result?.meta}
                label={text('المجموعات', 'Collections')} bulkActions={bulkActions} maxSelection={100} rowHref={(row) => `${uiBase}/collections/${row.id}`}
                emptyState={{ icon: HiOutlineRectangleStack, title: text('لا توجد مجموعات.', 'No collections.'), description: text('أنشئ مجموعة مثل "وصل حديثًا" أو "عروض الصيف" لتسهيل التسوق.', 'Create a collection such as "New arrivals" or "Summer deals" to make shopping easier.'), action: createLink }} />
        </div>
        <ConfirmDialog open={Boolean(confirm)} onClose={() => setConfirm(null)} danger loading={busy} onConfirm={destroy}
            title={text('حذف المجموعات المحددة', 'Delete selected collections')}
            body={text(`حذف ${confirm?.length ?? 0} مجموعة؟ ستبقى المنتجات كما هي.`, `Delete ${confirm?.length ?? 0} collections? The products themselves are kept.`)}
            confirmLabel={text('تأكيد الحذف', 'Confirm deletion')} cancelLabel={text('إلغاء', 'Cancel')} />
    </section>;
}
