import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';
import useStoreContext from '../../hooks/useStoreContext';
import { confirmDialog } from '../ui/confirmDialog';

const input = 'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900';
const message = (e) => Object.values(e.response?.data?.errors || {}).flat().join(' ') || e.response?.data?.message || e.message;

export default function SimplePagesPanel() {
    const context = useStoreContext();
    if (!context.access?.canStorePages) return null;
    return <PageList key={context.apiBase} context={context} />;
}

function PageList({ context: { apiBase, uiBase } }) {
    const { i18n } = useTranslation(); const ar = i18n.language.startsWith('ar'); const text = (a, e) => ar ? a : e;
    const [rows, setRows] = useState([]); const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 25 });
    const [page, setPage] = useState(1); const [perPage, setPerPage] = useState(25); const [search, setSearch] = useState(''); const [query, setQuery] = useState('');
    const [sort, setSort] = useState('position'); const [direction, setDirection] = useState('asc'); const [archived, setArchived] = useState(false);
    const [selected, setSelected] = useState({}); const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [attempt, setAttempt] = useState(0);
    useEffect(() => {
        let active = true; setLoading(true); setError(''); setSelected({});
        api.get(`${apiBase}/simple-pages`, { params: { page, per_page: perPage, q: query, sort, direction, archived: archived ? 1 : 0 } })
            .then(({ data }) => { if (active) { setRows(data.data); setMeta(data.meta); } })
            .catch((e) => { if (active) { setError(message(e)); setRows([]); } })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [apiBase, page, perPage, query, sort, direction, archived, attempt]);
    const reload = () => setAttempt((n) => n + 1);
    const title = (row) => row.title[ar ? 'ar' : 'en'] || row.title[ar ? 'en' : 'ar'];
    const allSelected = rows.length > 0 && rows.every((row) => selected[row.id]);
    const sortBy = (key) => { setPage(1); setDirection(sort === key && direction === 'asc' ? 'desc' : 'asc'); setSort(key); };
    async function archiveSelection() {
        if (!await confirmDialog({ title: text('نقل الصفحات المحددة إلى سلة المهملات؟', 'Move selected pages to trash?'), text: text('تختفي الصفحات وروابطها التلقائية من المتجر. يمكنك استعادتها لاحقًا.', 'The pages and their automatic links leave the store. You can restore them later.'), confirmText: text('نقل إلى سلة المهملات', 'Move to trash'), danger: true })) return;
        setBusy(true); setError('');
        try { await api.post(`${apiBase}/simple-pages/archive`, { pages: Object.entries(selected).map(([id, version]) => ({ id: Number(id), version })) }); reload(); }
        catch (e) { setError(message(e)); }
        finally { setBusy(false); }
    }
    async function restore(row) {
        setBusy(true); setError('');
        try { await api.post(`${apiBase}/simple-pages/${row.id}/restore`, { version: row.version }); reload(); }
        catch (e) { setError(message(e)); }
        finally { setBusy(false); }
    }
    const columns = [['title', text('العنوان', 'Title')], ['slug', text('الرابط', 'URL')], ['position', text('الترتيب', 'Position')], ['show_in_header', text('الهيدر', 'Header')], ['show_in_footer', text('الفوتر', 'Footer')], ['active', text('نشطة', 'Active')]];
    return <section aria-label={text('صفحات المحتوى', 'Content pages')} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h2 className="font-semibold">{text('صفحات المحتوى', 'Content pages')}</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{text('سياسات المتجر وأي صفحات إضافية، مع ترتيب الروابط في الهيدر والفوتر.', 'Store policies and extra pages, with ordered header and footer links.')}</p></div>
            <Link to={`${uiBase}/simple-pages/create`} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">{text('إنشاء صفحة', 'Create page')}</Link>
        </div>
        <div className="flex flex-wrap gap-2">
            <form className="flex min-w-0 flex-1 gap-2" onSubmit={(e) => { e.preventDefault(); setQuery(search.trim()); setPage(1); }}><input aria-label={text('بحث في الصفحات', 'Search pages')} className={`${input} min-w-0 flex-1`} value={search} onChange={(e) => setSearch(e.target.value)} maxLength={255} /><button className={input}>{text('بحث', 'Search')}</button></form>
            <button type="button" className={input} disabled={busy} onClick={reload}>{text('إعادة تحميل الصفحات', 'Reload pages')}</button>
            <button type="button" className={input} onClick={() => { setArchived(!archived); setPage(1); }}>{archived ? text('الصفحات الحالية', 'Current pages') : text('سلة المهملات', 'Trash')}</button>
        </div>
        {archived ? <p className="text-sm text-slate-500 dark:text-slate-300">{text('الاستعادة تحفظ الصفحة كمسودة غير نشطة. يبقى الرابط محجوزًا للصفحة المحذوفة.', 'Restored pages stay inactive drafts. Trashed pages retain their URLs.')}</p> : null}
        {error ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        {!archived ? <div className="flex flex-wrap items-center gap-3 text-sm"><span>{text('المحدد', 'Selected')}: {Object.keys(selected).length}</span><button type="button" onClick={() => setSelected({})}>{text('إلغاء التحديد', 'Clear selection')}</button><button type="button" disabled={busy || loading || !Object.keys(selected).length} className="text-red-700 disabled:opacity-40" onClick={archiveSelection}>{text('حذف المحدد', 'Delete selected')}</button></div> : null}
        {loading ? <p role="status">{text('جارٍ تحميل الصفحات…', 'Loading pages…')}</p> : <div className="overflow-x-auto"><table className="min-w-full text-start text-sm"><thead><tr>
            {!archived ? <th className="p-2"><input type="checkbox" aria-label={text('اختيار كل الصفحات المعروضة', 'Select all displayed pages')} checked={allSelected} onChange={(e) => setSelected(e.target.checked ? Object.fromEntries(rows.map((row) => [row.id, row.version])) : {})} disabled={busy} /></th> : null}
            {columns.map(([key, label]) => <th key={key} scope="col" className="whitespace-nowrap p-2 text-start" aria-sort={sort === key ? direction === 'asc' ? 'ascending' : 'descending' : 'none'}><button type="button" onClick={() => sortBy(key)}>{label}{sort === key ? direction === 'asc' ? ' ↑' : ' ↓' : ''}</button></th>)}<th scope="col" className="p-2">{text('إجراءات', 'Actions')}</th>
        </tr></thead><tbody>{rows.length ? rows.map((row) => <tr key={row.id} className="border-t border-slate-100 dark:border-slate-700">
            {!archived ? <td className="p-2"><input type="checkbox" aria-label={text('تحديد', 'Select') + ' ' + title(row)} checked={!!selected[row.id]} disabled={busy} onChange={(e) => setSelected((current) => { const next = { ...current }; if (e.target.checked) next[row.id] = row.version; else delete next[row.id]; return next; })} /></td> : null}
            <td className="p-2 font-medium">{title(row)}</td><td className="p-2" dir="ltr">{row.slug}</td><td className="p-2">{row.position}</td>{['show_in_header', 'show_in_footer', 'active'].map((key) => <td key={key} className="p-2">{row[key] ? text('نعم', 'Yes') : text('لا', 'No')}</td>)}
            <td className="p-2"><div className="flex gap-3 whitespace-nowrap">{archived ? <button type="button" disabled={busy} onClick={() => restore(row)}>{text('استعادة كمسودة', 'Restore as draft')}</button> : <><Link to={`${uiBase}/simple-pages/${row.id}`}>{text('تعديل', 'Edit')}</Link>{row.active && row.public_url ? <a href={row.public_url} target="_blank" rel="noopener noreferrer">{text('مشاهدة', 'View')}</a> : null}</>}</div></td>
        </tr>) : <tr><td colSpan={archived ? 7 : 8} className="p-6 text-center">{text('لا توجد صفحات مطابقة.', 'No matching pages.')}</td></tr>}</tbody></table></div>}
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm"><label>{text('الصفوف لكل صفحة', 'Rows per page')} <select className={input} value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}>{[25, 50, 100].map((n) => <option key={n}>{n}</option>)}</select></label><span>{meta.total ? (meta.current_page - 1) * meta.per_page + 1 : 0}–{Math.min(meta.current_page * meta.per_page, meta.total)} / {meta.total}</span><div className="flex gap-3"><button type="button" disabled={loading || page <= 1} onClick={() => setPage(page - 1)}>{text('السابق', 'Previous')}</button><button type="button" disabled={loading || page >= meta.last_page} onClick={() => setPage(page + 1)}>{text('التالي', 'Next')}</button></div></div>
    </section>;
}
