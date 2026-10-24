import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import useStoreScope from '../hooks/useStoreScope';
import { fetchAllPages } from '../utils/fetchAllPages';
import ConfirmDialog from '../components/ConfirmDialog';
import { IndexFilters, IndexTable, downloadCsv, useIndexTable } from '../components/data-table';
import { HiOutlinePlus, HiOutlineEye, HiOutlinePencilSquare, HiOutlineTrash, HiOutlineArrowDownTray, HiOutlineRectangleStack } from '../components/workspace/WorkspaceIcons';

const errorText = (e) => Object.values(e.response?.data?.errors || {}).flat().join(' ') || e.response?.data?.message || e.message;
const DEFAULTS = { sort: null, perPage: 25 };
const NO_FILTERS = []; // the endpoint only supports search and sorting

function CategoryImage({ url }) {
    const [failed, setFailed] = useState(false);
    return <span className="ws-dt-thumb">{url && !failed ? <img src={url} alt="" loading="lazy" onError={() => setFailed(true)} /> : <HiOutlineRectangleStack aria-hidden />}</span>;
}

export default function StoreCategoriesPage() {
    const { apiBase, uiBase } = useStoreScope(); const { permissions = [], store } = useOutletContext();
    const { i18n } = useTranslation(); const ar = i18n.language.startsWith('ar'); const text = (a, e) => ar ? a : e;
    const [result, setResult] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [reload, setReload] = useState(0);
    const [actionError, setActionError] = useState(''); const [confirm, setConfirm] = useState(null); const [busy, setBusy] = useState(false);
    const path = `${apiBase}/catalog/categories`;
    const scope = useRef(apiBase); scope.current = apiBase;
    const publicUrl = store?.storefront_url || store?.public_url;
    const canEdit = permissions.includes('categories-edit');

    const columns = useMemo(() => [
        { key: 'name', header: text('اسم القسم', 'Category name'), hideable: false, primary: true, sortKey: 'name', csv: (row) => row.name,
            render: (row) => <div className="ws-dt-cell-media"><CategoryImage key={row.image_url || 'empty'} url={row.image_url} /><div><Link className="ws-dt-title" to={`${uiBase}/categories/${row.id}/edit`}>{row.name}</Link>{row.slug ? <span className="ws-dt-sub" dir="ltr">/{row.slug}</span> : null}</div></div> },
        { key: 'visibility', header: text('الظهور', 'Visibility'), csv: (row) => (row.is_hidden ? 'hidden' : 'visible'),
            render: (row) => <span className={`ws-dt-badge ${row.is_hidden ? '' : 'is-success'}`}>{row.is_hidden ? text('مخفي', 'Hidden') : text('ظاهر', 'Visible')}</span> },
        { key: 'products', header: text('المنتجات', 'Products'), align: 'end', csv: (row) => row.products_count ?? '', render: (row) => <span className="ws-dt-num">{row.products_count ?? '—'}</span> },
        { key: 'children', header: text('أقسام فرعية', 'Subcategories'), align: 'end', csv: (row) => row.children_count || 0, render: (row) => <span className="ws-dt-num">{row.children_count || 0}</span> },
        { key: 'header', header: text('إظهار في الهيدر', 'Show in header'), sortKey: 'show_in_header', csv: (row) => (row.show_in_header ? 'yes' : 'no'),
            render: (row) => <span className={`ws-dt-badge ${row.show_in_header ? 'is-info' : ''}`}>{row.show_in_header ? text('نعم', 'Yes') : text('لا', 'No')}</span> },
        { key: 'position', header: text('الترتيب', 'Position'), sortKey: 'position', align: 'end', defaultHidden: true, csv: (row) => row.position ?? '', render: (row) => <span className="ws-dt-num">{row.position ?? '—'}</span> },
        { key: 'actions', header: <span className="sr-only">{text('إجراءات', 'Actions')}</span>, hideable: false, align: 'end',
            render: (row) => <div className="ws-dt-row-actions">
                {publicUrl && row.is_active ? <a className="ws-dt-icon" href={`${publicUrl.replace(/\/$/, '')}/collections/${row.slug}`} target="_blank" rel="noreferrer" aria-label={`${text('عرض', 'View')} ${row.name}`} title={text('مشاهدة في المتجر', 'View in store')}><HiOutlineEye aria-hidden /></a> : null}
                {canEdit ? <Link className="ws-dt-icon" to={`${uiBase}/categories/${row.id}/edit`} aria-label={`${text('تعديل', 'Edit')} ${row.name}`} title={text('تعديل', 'Edit')}><HiOutlinePencilSquare aria-hidden /></Link> : null}
            </div> },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [ar, uiBase, publicUrl, canEdit]);

    const table = useIndexTable({ scope: `store:${store?.id ?? apiBase}:categories`, filters: NO_FILTERS, columns, defaults: DEFAULTS });
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
    const pending = loading || table.searching;

    async function destroy() {
        if (busy || !confirm) return; const origin = scope.current; setBusy(true); setActionError('');
        try {
            await api.post(`${path}/bulk-delete`, { categories: confirm.map((row) => ({ id: row.id, version: row.edit_version })) });
            if (scope.current !== origin) return;
            table.clearSelection(); setConfirm(null); setReload((v) => v + 1);
        } catch (e) { if (scope.current === origin) { setActionError(errorText(e)); setConfirm(null); } }
        finally { if (scope.current === origin) setBusy(false); }
    }
    async function exportRows() {
        setBusy(true); setActionError('');
        try {
            if (!selectedRows.length && result?.meta?.total > 10000) throw new Error(text('ضيّق البحث لتصدير 10,000 قسم أو أقل.', 'Narrow the search to export 10,000 categories or fewer.'));
            const { page: _page, per_page: _perPage, ...filters } = table.apiParams;
            const data = selectedRows.length ? selectedRows : await fetchAllPages(path, filters);
            const safe = data.map(({ id, name, slug, image_url, position, parent_id, show_in_header, is_hidden, children_count }) => ({ id, name, slug, image_url, position, parent_id, show_in_header, is_hidden, children_count }));
            const href = URL.createObjectURL(new Blob([JSON.stringify(safe, null, 2)], { type: 'application/json;charset=utf-8' })); const a = document.createElement('a'); a.href = href; a.download = 'store-categories.json'; a.click(); URL.revokeObjectURL(href);
        } catch (e) { setActionError(e.message); } finally { setBusy(false); }
    }
    const bulkActions = permissions.includes('categories-delete') ? [
        { key: 'delete', label: text('حذف المحدد', 'Delete selected'), icon: HiOutlineTrash, tone: 'danger', disabled: (list) => busy || list.some((row) => !row.edit_version), onAction: (list) => { setActionError(''); setConfirm(list); } },
    ] : [];

    return <section className="ws-catalog-page">
        <header className="ws-catalog-heading"><div><h1>{text('الأقسام', 'Categories')}</h1><p>{text('نظّم أقسام متجرك ورتّب ظهورها.', 'Organize your store categories and their display order.')}</p></div><div className="ws-catalog-actions"><button type="button" className="ws-dt-button" disabled={busy || pending} onClick={exportRows}><HiOutlineArrowDownTray aria-hidden />{selectedRows.length ? text('تصدير المحدد JSON', 'Export selected (JSON)') : text('تصدير JSON', 'Export JSON')}</button>{permissions.includes('categories-create') ? <Link className="ws-dt-button ws-dt-button-primary" to={`${uiBase}/categories/new`}><HiOutlinePlus aria-hidden />{text('إنشاء قسم', 'Create category')}</Link> : null}</div></header>
        {actionError ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{actionError}</p> : null}
        <div className="ws-dt-card">
            <IndexFilters table={table} searchPlaceholder={text('بحث بالاسم أو الرابط', 'Search name or slug')} exportDisabled={!rows.length}
                onExport={() => downloadCsv(`categories-${new Date().toISOString().slice(0, 10)}.csv`, table.visibleColumns, selectedRows.length ? selectedRows : rows)} />
            <IndexTable table={table} rows={rows} loading={loading} error={error} onRetry={() => setReload((v) => v + 1)} meta={result?.meta}
                label={text('الأقسام', 'Categories')} bulkActions={bulkActions} maxSelection={100} rowHref={(row) => `${uiBase}/categories/${row.id}/edit`}
                emptyState={{ icon: HiOutlineRectangleStack, title: text('لا توجد أقسام.', 'No categories.'), description: text('أنشئ أقسامًا لتنظيم منتجاتك وتسهيل تصفحها.', 'Create categories to organize your products and make browsing easier.'),
                    action: permissions.includes('categories-create') ? <Link className="ws-dt-button ws-dt-button-primary" to={`${uiBase}/categories/new`}>{text('إنشاء قسم', 'Create category')}</Link> : null }} />
        </div>
        <ConfirmDialog open={Boolean(confirm)} onClose={() => setConfirm(null)} danger loading={busy} onConfirm={destroy}
            title={text('حذف الأقسام المحددة', 'Delete selected categories')}
            body={text(`حذف ${confirm?.length ?? 0} قسم؟ ستبقى المنتجات وتصبح دون قسم، وستُفصل الأقسام الفرعية عن الأب المحذوف.`, `Delete ${confirm?.length ?? 0} categories? Products are preserved without a category, and children are detached from the deleted parent.`)}
            confirmLabel={text('تأكيد الحذف', 'Confirm deletion')} cancelLabel={text('إلغاء', 'Cancel')} />
    </section>;
}
