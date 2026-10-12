import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import useStoreScope from '../hooks/useStoreScope';
import { useDebounced } from '../hooks/useDebounced';
import { fetchAllPages } from '../utils/fetchAllPages';
import { HiOutlinePlus, HiOutlineEye, HiOutlinePencilSquare, HiOutlineChevronUpDown } from '../components/workspace/WorkspaceIcons';

export default function StoreCategoriesPage() {
    const { apiBase, uiBase } = useStoreScope(); const { permissions = [], store } = useOutletContext();
    const { i18n } = useTranslation(); const ar = i18n.language.startsWith('ar'); const text = (a, e) => ar ? a : e;
    const [query, setQuery] = useState(''); const search = useDebounced(query, 250);
    const [page, setPage] = useState(1); const [perPage, setPerPage] = useState(20); const [sortBy, setSortBy] = useState('position'); const [direction, setDirection] = useState('asc');
    const [result, setResult] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [reload, setReload] = useState(0);
    const [selected, setSelected] = useState(new Map()); const [confirm, setConfirm] = useState(false); const [busy, setBusy] = useState(false);
    const path = `${apiBase}/catalog/categories`; const params = { search, page, per_page: perPage, sort_by: sortBy, sort_direction: direction };
    useEffect(() => {
        let active = true; setLoading(true); setError('');
        api.get(path, { params: { search, page, per_page: perPage, sort_by: sortBy, sort_direction: direction } }).then(({ data }) => { if (active) setResult(data); }).catch((e) => { if (active) setError(e.response?.data?.message || e.message); }).finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [path, search, page, perPage, sortBy, direction, reload]);
    useEffect(() => { setSelected(new Map()); setConfirm(false); setPage(1); }, [path]);
    const pending = loading || query !== search; const rows = result?.data || [];
    const toggle = (row, checked) => setSelected((current) => { const next = new Map(current); if (checked) next.set(row.id, row); else next.delete(row.id); return next; });
    const sort = (key) => { setSortBy(key); setDirection(sortBy === key && direction === 'asc' ? 'desc' : 'asc'); setPage(1); };
    async function destroy() {
        if (busy) return; setBusy(true); setError('');
        try { await api.post(`${path}/bulk-delete`, { categories: [...selected.values()].map((row) => ({ id: row.id, version: row.edit_version })) }); setSelected(new Map()); setConfirm(false); setReload((v) => v + 1); }
        catch (e) { setError(Object.values(e.response?.data?.errors || {}).flat().join(' ') || e.response?.data?.message || e.message); }
        finally { setBusy(false); }
    }
    async function exportRows() {
        setBusy(true); setError('');
        try {
            if (!selected.size && result?.meta?.total > 10000) throw new Error(text('ضيّق البحث لتصدير 10,000 قسم أو أقل.', 'Narrow the search to export 10,000 categories or fewer.'));
            const data = selected.size ? [...selected.values()] : await fetchAllPages(path, { ...params, per_page: 100 });
            const safe = data.map(({ id, name, slug, image_url, position, parent_id, show_in_header, is_hidden, children_count }) => ({ id, name, slug, image_url, position, parent_id, show_in_header, is_hidden, children_count }));
            const href = URL.createObjectURL(new Blob([JSON.stringify(safe, null, 2)], { type: 'application/json;charset=utf-8' })); const a = document.createElement('a'); a.href = href; a.download = 'store-categories.json'; a.click(); URL.revokeObjectURL(href);
        } catch (e) { setError(e.message); } finally { setBusy(false); }
    }
    const header = (key, title) => <th aria-sort={sortBy === key ? direction === 'asc' ? 'ascending' : 'descending' : 'none'}><button className="ws-catalog-sort" onClick={() => sort(key)}>{title}<HiOutlineChevronUpDown aria-hidden /></button></th>;
    const publicUrl = store?.storefront_url || store?.public_url;
    return <div className="ws-catalog space-y-5">
        <header className="ws-catalog-heading"><div><h1>{text('الأقسام', 'Categories')}</h1><p>{text('نظّم أقسام متجرك ورتّب ظهورها.', 'Organize your store categories and their display order.')}</p></div><div className="ws-catalog-actions"><button className="ws-catalog-button" disabled={busy || pending} onClick={exportRows}>{text('تصدير', 'Export')}</button>{permissions.includes('categories-create') ? <Link className="ws-catalog-button ws-catalog-button--primary" to={`${uiBase}/categories/new`}><HiOutlinePlus />{text('إنشاء قسم', 'Create category')}</Link> : null}</div></header>
        {error ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{error}<button className="ms-3 underline" onClick={() => setReload((v) => v + 1)}>{text('إعادة التحميل', 'Reload')}</button></p> : null}
        <section className="ws-catalog-card"><div className="ws-catalog-toolbar"><input className="ws-catalog-filter" aria-label={text('بحث الأقسام', 'Search categories')} placeholder={text('بحث بالاسم أو الرابط', 'Search name or slug')} value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} /><span>{selected.size ? `${selected.size} ${text('محدد', 'selected')}` : ''}</span>{selected.size && permissions.includes('categories-delete') ? <button className="ws-catalog-button" disabled={busy || selected.size > 100 || [...selected.values()].some((row) => !row.edit_version)} onClick={() => setConfirm(true)}>{text('حذف المحدد', 'Delete selected')}</button> : null}</div>
            {confirm ? <div role="alert" className="m-4 rounded-lg border border-red-200 bg-red-50 p-4"><p>{text('حذف الأقسام المحددة؟ ستبقى المنتجات وتصبح دون قسم، وستُفصل الأقسام الفرعية عن الأب المحذوف.', 'Delete selected categories? Products are preserved without a category, and children are detached from the deleted parent.')}</p><div className="mt-3 flex gap-3"><button className="ws-catalog-button" disabled={busy} onClick={destroy}>{text('تأكيد الحذف', 'Confirm deletion')}</button><button className="ws-catalog-button" disabled={busy} onClick={() => setConfirm(false)}>{text('إلغاء', 'Cancel')}</button></div></div> : null}
            <div className="ws-catalog-table"><table><thead><tr><th><input type="checkbox" disabled={pending || !rows.length} aria-label={text('اختيار الصفحة', 'Select page')} checked={rows.length > 0 && rows.every((row) => selected.has(row.id))} onChange={(e) => rows.forEach((row) => toggle(row, e.target.checked))} /></th><th>{text('الصورة', 'Image')}</th>{header('name', text('اسم القسم', 'Category name'))}<th>{text('أقسام فرعية', 'Subcategories')}</th>{header('show_in_header', text('إظهار في الهيدر', 'Show in header'))}<th>{text('مشاهدة', 'View')}</th><th>{text('تعديل', 'Edit')}</th></tr></thead><tbody>{!pending ? rows.map((row) => <tr key={row.id}><td><input type="checkbox" aria-label={`${text('اختيار', 'Select')} ${row.name}`} checked={selected.has(row.id)} onChange={(e) => toggle(row, e.target.checked)} /></td><td>{row.image_url ? <img className="h-20 w-20 rounded-lg object-cover" src={row.image_url} alt="" /> : <span className="ws-catalog-image">—</span>}</td><td><Link to={`${uiBase}/categories/${row.id}/edit`}>{row.name}</Link>{row.is_hidden ? <small className="ms-2">{text('مخفي', 'Hidden')}</small> : null}</td><td>{row.children_count || 0}</td><td>{row.show_in_header ? text('نعم', 'Yes') : text('لا', 'No')}</td><td>{publicUrl && row.is_active ? <a href={`${publicUrl.replace(/\/$/, '')}/collections/${row.slug}`} target="_blank" rel="noreferrer" aria-label={`${text('عرض', 'View')} ${row.name}`}><HiOutlineEye className="h-5 w-5" /></a> : '—'}</td><td>{permissions.includes('categories-edit') ? <Link to={`${uiBase}/categories/${row.id}/edit`} aria-label={`${text('تعديل', 'Edit')} ${row.name}`}><HiOutlinePencilSquare className="h-5 w-5" /></Link> : '—'}</td></tr>) : <tr><td colSpan={7} role="status">{text('جارٍ التحميل…', 'Loading…')}</td></tr>}{!pending && !rows.length ? <tr><td colSpan={7}>{text('لا توجد أقسام.', 'No categories.')}</td></tr> : null}</tbody></table></div>
            <footer className="ws-catalog-pagination"><label>{text('عدد الصفوف', 'Rows per page')}<select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}>{[10, 20, 50, 100].map((n) => <option key={n}>{n}</option>)}</select></label><span>{result?.meta?.total || 0} · {page}/{result?.meta?.last_page || 1}</span><button disabled={pending || page <= 1} onClick={() => setPage(page - 1)}>{text('السابق', 'Previous')}</button><button disabled={pending || page >= (result?.meta?.last_page || 1)} onClick={() => setPage(page + 1)}>{text('التالي', 'Next')}</button></footer>
        </section>
    </div>;
}
