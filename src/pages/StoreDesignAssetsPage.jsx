import { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import PageHeader from '../components/PageHeader';
import Toggle from '../components/ui/Toggle';
import useStoreContext from '../hooks/useStoreContext';
import { confirmDialog } from '../components/ui/confirmDialog';
import { useDirty } from '../hooks/useStoreSettings';

const field = 'w-full rounded-xl border border-slate-200 bg-white p-2 text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100';
const button = field.replace('w-full ', '') + ' w-auto';
const errorText = (e) => Object.values(e.response?.data?.errors || {}).flat().join(' ') || e.response?.data?.message || e.message;

export default function StoreDesignAssetsPage() {
    const { apiBase, access } = useStoreContext(); const { i18n } = useTranslation();
    const ar = i18n.language.startsWith('ar'); const text = (a, e) => ar ? a : e;
    const [rows, setRows] = useState([]); const [meta, setMeta] = useState(null);
    const [config, setConfig] = useState(null); const [initial, setInitial] = useState(null);
    const [search, setSearch] = useState(''); const [kind, setKind] = useState(''); const [archived, setArchived] = useState(false); const [page, setPage] = useState(1);
    const [nonce, setNonce] = useState(0); const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false);
    const [error, setError] = useState(''); const [status, setStatus] = useState(''); const [conflict, setConflict] = useState(false);
    const [catalog, setCatalog] = useState({}); const fileInput = useRef(null); const working = useRef(false); const scope = useRef(apiBase);
    const dirty = useDirty(initial, config);
    useEffect(() => {
        scope.current = apiBase; setConfig(null); setInitial(null); setCatalog({}); setPage(1); setConflict(false); setStatus('');
    }, [apiBase]);
    useEffect(() => {
        let active = true; setLoading(true); setError('');
        const timer = window.setTimeout(() => {
            api.get(`${apiBase}/design-assets`, { params: { search, kind: kind || undefined, archived: archived ? 1 : 0, page } })
                .then(({ data }) => { if (!active) return; setRows(data.data); setMeta(data.meta);
                    setCatalog((old) => ({ ...old, ...Object.fromEntries([...data.data, ...data.selected].map((row) => [row.id, row])) }));
                    setConfig((old) => old ?? data.configuration); setInitial((old) => old ?? data.configuration);
                }).catch((e) => { if (active) setError(errorText(e)); }).finally(() => { if (active) setLoading(false); });
        }, 250);
        return () => { active = false; window.clearTimeout(timer); };
    }, [apiBase, search, kind, archived, page, nonce]);
    if (!access?.canStoreThemes) return <Navigate to=".." replace />;

    const reload = () => { setConfig(null); setInitial(null); setConflict(false); setStatus(''); setNonce((n) => n + 1); };
    async function run(action) {
        if (working.current) return;
        const currentScope = apiBase; working.current = true; setBusy(true); setError(''); setStatus('');
        try { await action(currentScope); }
        catch (e) { if (scope.current === currentScope) { setError(errorText(e)); if (e.response?.status === 409) setConflict(true); } }
        finally { working.current = false; setBusy(false); }
    }
    const upload = (files) => run(async (base) => {
        let count = 0; let duplicate = 0;
        try {
            for (const file of Array.from(files || [])) {
                const body = new FormData(); body.append('file', file);
                const { data } = await api.post(`${base}/design-assets`, body); count++; if (data.deduplicated) duplicate++;
                if (scope.current === base) setCatalog((old) => ({ ...old, [data.data.id]: data.data }));
            }
            if (scope.current === base) setStatus(text(`تم رفع ${count} ملف؛ ${duplicate} موجود مسبقًا.`, `${count} uploaded; ${duplicate} already present.`));
        } finally { if (scope.current === base) setNonce((n) => n + 1); }
    });
    const save = () => run(async (base) => {
        if (!config || conflict) return;
        const { data } = await api.put(`${base}/design-assets/configuration`, config);
        if (scope.current === base) { setConfig(data.data); setInitial(data.data); setStatus(text('تم حفظ ملفات التصميم. حدّث صفحة المتجر لرؤية التغييرات.', 'Design files saved. Reload the storefront to see changes.')); }
    });
    const archive = async (row) => {
        if (dirty || busy) return;
        if (!await confirmDialog({ title: text('أرشفة ملف التصميم؟', 'Archive this design file?'), text: text('سيتوقف رابط الملف ويُزال من الملفات المفعّلة. يمكنك استعادته من الأرشيف.', 'Its URL stops serving and it is removed from active files. You can restore it from the archive.'), confirmText: text('أرشفة', 'Archive'), danger: true })) return;
        await run(async (base) => { await api.delete(`${base}/design-assets/${row.id}`); if (scope.current === base) reload(); });
    };
    const restore = (row) => run(async (base) => { await api.post(`${base}/design-assets/${row.id}/restore`); if (scope.current === base) { setNonce((n) => n + 1); setStatus(text('تمت الاستعادة؛ اختر الملف لتفعيله مجددًا.', 'Restored; select it to activate again.')); } });
    const copy = async (value) => { try { await navigator.clipboard.writeText(value); setStatus(text('تم النسخ.', 'Copied.')); } catch { setError(text('تعذر النسخ. يمكنك تحديد الرابط ونسخه.', 'Unable to copy. Select and copy the URL.')); } };
    const select = (row) => { setStatus(''); setConfig({ ...config, assets: config.assets.includes(row.id) ? config.assets.filter((id) => id !== row.id) : [...config.assets, row.id] }); };
    const move = (index, offset) => { const ids = [...config.assets]; [ids[index], ids[index + offset]] = [ids[index + offset], ids[index]]; setConfig({ ...config, assets: ids }); };
    return <div className="mx-auto max-w-6xl space-y-5">
        <PageHeader title={text('رفع ملفات التصاميم', 'Design files')} subtitle={text('ارفع ملفات CSS وJavaScript لتخصيص المتجر والفانل. الملفات متاحة بروابط عامة؛ الرفع وحده لا يفعّلها.', 'Upload CSS and JavaScript for your storefront and funnels. Files have public URLs; uploading alone does not activate them.')} />
        {error ? <p role="alert" className="rounded-xl bg-red-50 p-3 text-red-800 dark:bg-red-950 dark:text-red-200">{error}</p> : null}
        {status ? <p role="status" className="rounded-xl bg-emerald-50 p-3 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">{status}</p> : null}
        {conflict ? <div role="alert"><p>{text('تغيّرت الملفات. حمّل النسخة الحالية قبل الحفظ؛ ستُستبدل المسودة المفتوحة.', 'Files changed. Reload before saving; this replaces the current draft.')}</p><button type="button" disabled={busy} onClick={reload} className={field}>{text('تحميل النسخة الحالية', 'Reload current version')}</button></div> : null}
        <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <button type="button" disabled={busy} onClick={() => fileInput.current.click()} className="rounded-xl bg-emerald-700 px-4 py-2 font-semibold text-white">{busy ? text('جارٍ التنفيذ…', 'Working…') : text('رفع الملفات', 'Upload files')}</button>
            <input ref={fileInput} type="file" accept=".css,.js,text/css,text/javascript,application/javascript" multiple aria-label={text('ملفات التصميم', 'Design files')} className="hidden" onChange={(e) => { if (e.target.files?.length) void upload(e.target.files); e.target.value = ''; }} />
            <p className="text-sm text-slate-500 dark:text-slate-300">{text('CSS أو JavaScript بترميز UTF-8 حتى 2 ميجابايت للملف. اختر الملفات ورتّبها ثم احفظ لتفعيلها. JavaScript يُنفّذ في المتجر العام.', 'UTF-8 CSS or JavaScript up to 2 MB each. Select and order files, then save to activate. JavaScript runs on the public storefront.')}</p>
            <div className="grid gap-3 sm:grid-cols-3">
                <label>{text('البحث', 'Search')}<input className={field} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></label>
                <label>{text('نوع الملف', 'File type')}<select className={field} value={kind} onChange={(e) => { setKind(e.target.value); setPage(1); }}><option value="">{text('الكل', 'All')}</option><option value="css">CSS</option><option value="js">JavaScript</option></select></label>
                <label>{text('حالة الملفات', 'File status')}<select className={field} value={archived ? 'archived' : 'active'} onChange={(e) => { setArchived(e.target.value === 'archived'); setPage(1); }}><option value="active">{text('المتاحة', 'Available')}</option><option value="archived">{text('الأرشيف', 'Archive')}</option></select></label>
            </div>
        </section>
        {config ? <section aria-label={text('الملفات المفعّلة', 'Active files')} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <Toggle checked={config.enabled} disabled={busy} onChange={(enabled) => setConfig({ ...config, enabled })} label={text('تفعيل ملفات التصميم', 'Enable design files')} />
            <p className="text-sm">{text('التعطيل يحفظ قائمة الملفات وترتيبها. أرشفة ملف تزيله من هذه القائمة.', 'Disabling keeps selected files and order. Archiving removes a file from this list.')}</p>
            <ol className="space-y-2">{config.assets.map((id, index) => <li key={id} className="flex min-w-0 flex-wrap items-center gap-2"><span className="min-w-0 flex-1 break-all">{catalog[id]?.name ?? `#${id}`}</span><button type="button" disabled={busy || index === 0} onClick={() => move(index, -1)} className={button} aria-label={text(`تحريك الملف ${id} لأعلى`, `Move file ${id} up`)}>↑</button><button type="button" disabled={busy || index === config.assets.length - 1} onClick={() => move(index, 1)} className={button} aria-label={text(`تحريك الملف ${id} لأسفل`, `Move file ${id} down`)}>↓</button><button type="button" disabled={busy} onClick={() => setConfig({ ...config, assets: config.assets.filter((value) => value !== id) })} className={button}>{text('إزالة من التفعيل', 'Unselect')}</button></li>)}</ol>
            <button type="button" disabled={busy || conflict || !dirty} onClick={() => void save()} className="rounded-xl bg-emerald-700 px-4 py-2 font-semibold text-white disabled:opacity-40">{text('حفظ التفعيل والترتيب', 'Save activation and order')}</button>
        </section> : null}
        {loading ? <p role="status">{text('جارٍ تحميل الملفات…', 'Loading files…')}</p> : !rows.length ? <p>{text('لا توجد ملفات مطابقة.', 'No matching files.')}</p> : <div className="grid gap-3 md:grid-cols-2">{rows.map((row) => <article key={row.id} aria-label={row.name} className="min-w-0 space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <h2 className="break-all font-semibold">{row.name}</h2><p dir="ltr" className="text-sm text-slate-500 dark:text-slate-300">{row.kind.toUpperCase()} · {row.size_bytes} B</p>
            <label className="block">{text('رابط الملف', 'File URL')}<input readOnly dir="ltr" className={field + ' text-xs'} value={row.url} /></label>
            <div className="flex flex-wrap gap-2"><button type="button" onClick={() => void copy(row.url)} className={button}>{text('نسخ الرابط', 'Copy URL')}</button><button type="button" onClick={() => void copy(row.kind === 'css' ? `<link rel="stylesheet" href="${row.url}">` : `<script defer src="${row.url}"></script>`)} className={button}>{text('نسخ كود الربط', 'Copy embed code')}</button>
            {row.archived ? <button type="button" disabled={busy} onClick={() => void restore(row)} className={button}>{text('استعادة', 'Restore')}</button> : <><label className="flex items-center gap-2"><input type="checkbox" disabled={busy || !config} checked={config?.assets.includes(row.id) ?? false} onChange={() => select(row)} />{text('استخدام في المتجر', 'Use in storefront')}</label><button type="button" disabled={busy || dirty} onClick={() => void archive(row)} className={button}>{text('أرشفة', 'Archive')}</button></>}
            </div>
        </article>)}</div>}
        {meta ? <nav aria-label={text('صفحات الملفات', 'File pages')} className="flex items-center gap-3"><button type="button" className={button} disabled={loading || page <= 1} onClick={() => setPage((n) => n - 1)}>{text('السابق', 'Previous')}</button><span>{meta.current_page} / {meta.last_page} · {meta.total}</span><button type="button" className={button} disabled={loading || page >= meta.last_page} onClick={() => setPage((n) => n + 1)}>{text('التالي', 'Next')}</button><button type="button" className={button} disabled={loading || busy} onClick={() => setNonce((n) => n + 1)}>{text('تحديث', 'Refresh')}</button></nav> : <button type="button" className={field} onClick={reload}>{text('إعادة المحاولة', 'Retry')}</button>}
    </div>;
}
