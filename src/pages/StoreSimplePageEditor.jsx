import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import PageHeader from '../components/PageHeader';
import Toggle from '../components/ui/Toggle';
import ProductRichText from '../components/store/ProductRichText';
import useStoreContext from '../hooks/useStoreContext';
import { useDirty } from '../hooks/useStoreSettings';
import { sanitizeHtml } from '../shared/utils/sanitizeHtml';
import './store-simple-pages.css';

const blank = () => ({ version: 0, title: { ar: '', en: '' }, content: { ar: '', en: '' }, slug: '', position: 0, active: true, show_in_header: false, show_in_footer: true });
const input = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900';
const message = (e) => Object.values(e.response?.data?.errors || {}).flat().join(' ') || e.response?.data?.message || e.message;

export default function StoreSimplePageEditor() {
    const context = useStoreContext(); const { pageId } = useParams();
    if (!context.access?.canStorePages) return <Navigate to={`${context.uiBase}/overview`} replace />;
    return <Editor key={`${context.apiBase}:${pageId || 'create'}`} context={context} pageId={pageId} />;
}

function Editor({ context: { apiBase, uiBase }, pageId }) {
    const { i18n } = useTranslation(); const ar = i18n.language.startsWith('ar'); const text = (a, e) => ar ? a : e;
    const navigate = useNavigate(); const [locale, setLocale] = useState(ar ? 'ar' : 'en');
    const [settings, setSettings] = useState(pageId ? null : blank); const [initial, setInitial] = useState(pageId ? null : blank);
    const [error, setError] = useState(''); const [saved, setSaved] = useState(false); const [busy, setBusy] = useState(false); const [conflict, setConflict] = useState(false); const [attempt, setAttempt] = useState(0);
    const working = useRef(false); const dirty = useDirty(initial, settings);
    const apply = (data) => { setSettings(data); setInitial(data); setConflict(false); };
    useEffect(() => {
        if (!pageId) return;
        let active = true;
        api.get(`${apiBase}/simple-pages/${pageId}`).then(({ data }) => { if (active) apply(data.data); }).catch((e) => { if (active) setError(message(e)); });
        return () => { active = false; };
    }, [apiBase, pageId, attempt]);
    const update = (key, value) => { setSettings((current) => ({ ...current, [key]: value })); setSaved(false); setError(''); };
    const reload = () => { setSettings(null); setInitial(null); setError(''); setSaved(false); setConflict(false); setAttempt((n) => n + 1); };
    async function save(e) {
        e.preventDefault(); if (working.current || conflict || !settings) return;
        working.current = true; setBusy(true); setError(''); setSaved(false);
        try {
            const { data } = pageId ? await api.put(`${apiBase}/simple-pages/${pageId}`, settings) : await api.post(`${apiBase}/simple-pages`, settings);
            apply(data.data); setSaved(true);
            if (!pageId) navigate(`${uiBase}/simple-pages/${data.data.id}`, { replace: true });
        } catch (e) { setConflict(e.response?.status === 409); setError(message(e)); }
        finally { working.current = false; setBusy(false); }
    }
    if (settings?.archived) return <div className="space-y-4"><p role="status">{text('هذه الصفحة في سلة المهملات. استعدها من قائمة الصفحات قبل تعديلها.', 'This page is in trash. Restore it from the page list before editing.')}</p><Link to={`${uiBase}/pages`}>{text('العودة للصفحات', 'Back to pages')}</Link></div>;
    return <form onSubmit={save} className="simple-page-editor mx-auto max-w-6xl space-y-5">
        <PageHeader title={pageId ? text('تعديل صفحة محتوى', 'Edit content page') : text('إنشاء صفحة محتوى', 'Create content page')} subtitle={text('احفظ المحتوى والرابط وترتيبه وظهوره في الهيدر والفوتر. الصفحة غير النشطة لا تظهر في المتجر.', 'Save content, URL, position and header/footer placement. Inactive pages are hidden from the store.')} />
        <Link to={`${uiBase}/pages`} className="inline-block text-sm underline">{text('العودة للصفحات', 'Back to pages')}</Link>
        {error ? <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{error}{pageId && (conflict || !settings) ? <button type="button" className="mx-2 underline" onClick={reload}>{text('تحميل النسخة الحالية', 'Reload current page')}</button> : null}</p> : null}
        {saved ? <p role="status" className="rounded-xl bg-emerald-50 p-4 text-emerald-800">{text('تم حفظ الصفحة.', 'Page saved.')}</p> : null}
        {!settings && !error ? <p role="status">{text('جارٍ تحميل الصفحة…', 'Loading page…')}</p> : null}
        {settings ? <><div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <fieldset disabled={busy} className="min-w-0 space-y-5 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
                <label className="block space-y-2 text-sm font-semibold">{text('لغة المحتوى والمعاينة', 'Content and preview language')}<select className={input} value={locale} onChange={(e) => setLocale(e.target.value)}><option value="ar">العربية</option><option value="en">English</option></select></label>
                <label className="block space-y-2 text-sm font-semibold">{text('عنوان الصفحة', 'Page title')}<input className={input} dir={locale === 'ar' ? 'rtl' : 'ltr'} value={settings.title[locale]} maxLength={255} onChange={(e) => update('title', { ...settings.title, [locale]: e.target.value })} /></label>
                <label className="block space-y-2 text-sm font-semibold">{text('الرابط', 'URL slug')}<input aria-label={text('الرابط', 'URL slug')} className={`${input} font-mono`} dir="ltr" value={settings.slug} maxLength={120} pattern="[a-z0-9]+(-[a-z0-9]+)*" required onChange={(e) => update('slug', e.target.value)} /><span className="block text-xs font-normal text-slate-500 dark:text-slate-300">/pages/{settings.slug || 'your-page'} · {text('حروف إنجليزية صغيرة وأرقام وشرطات. لا يُستخدم رابط صفحة أخرى.', 'Lowercase letters, numbers and hyphens. Another page’s URL cannot be used.')}</span></label>
                <label className="block space-y-2 text-sm font-semibold">{text('الترتيب في العرض', 'Display position')}<input aria-label={text('الترتيب في العرض', 'Display position')} type="number" min={0} max={100000} step={1} required className={input} value={settings.position} onChange={(e) => update('position', e.target.value === '' ? '' : Number(e.target.value))} /><span className="block text-xs font-normal text-slate-500 dark:text-slate-300">{text('الرقم الأصغر يظهر أولًا بين روابط صفحات المحتوى.', 'Lower numbers appear first among content-page links.')}</span></label>
                <Toggle label={text('نشطة', 'Active')} checked={settings.active} onChange={(value) => update('active', value)} description={text('عند التعطيل تختفي الصفحة وروابطها التلقائية وتبقى مسودتك محفوظة.', 'Disabling hides the page and its automatic links while preserving your draft.')} />
                <Toggle label={text('ظهور في الهيدر', 'Show in header')} checked={settings.show_in_header} onChange={(value) => update('show_in_header', value)} />
                <Toggle label={text('ظهور في الفوتر', 'Show in footer')} checked={settings.show_in_footer} onChange={(value) => update('show_in_footer', value)} />
                <ProductRichText key={locale} pageContent value={settings.content[locale]} onChange={(value) => update('content', { ...settings.content, [locale]: value })} label={text('محتوى الصفحة', 'Page content')} locale={locale} ar={ar} disabled={busy} />
                <Link className="text-sm underline" to={`${uiBase}/media`}>{text('فتح مكتبة وسائط المتجر', 'Open store media library')}</Link>
            </fieldset>
            <aside className="min-w-0 space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800"><h2 className="font-semibold">{text('معاينة المسودة', 'Draft preview')}</h2><p className="text-xs leading-5 text-slate-500 dark:text-slate-300">{text('تصميم الثيم وألوان المتجر يظهران في الصفحة الفعلية بعد الحفظ.', 'The theme and store colors apply on the actual page after saving.')}</p><article className="simple-page-prose" dir={locale === 'ar' ? 'rtl' : 'ltr'}><h1>{settings.title[locale] || text('عنوان الصفحة', 'Page title')}</h1><div dangerouslySetInnerHTML={{ __html: sanitizeHtml(settings.content[locale], { formatting: true }) }} /></article>{initial?.active && initial.public_url ? <a href={initial.public_url} target="_blank" rel="noopener noreferrer" className="inline-block text-sm underline">{text('مشاهدة الصفحة المحفوظة', 'View saved page')}</a> : null}</aside>
        </div><button disabled={busy || conflict || !dirty} className="rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white disabled:opacity-40">{busy ? text('جارٍ الحفظ…', 'Saving…') : text('حفظ الصفحة', 'Save page')}</button></> : null}
    </form>;
}
