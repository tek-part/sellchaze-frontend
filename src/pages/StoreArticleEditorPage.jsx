import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import ProductRichText from '../components/store/ProductRichText';
import useStoreContext from '../hooks/useStoreContext';
import { useDirty } from '../hooks/useStoreSettings';
import { HiOutlineArrowPath, HiOutlineArrowTopRightOnSquare, HiOutlinePhoto } from '../components/workspace/WorkspaceIcons';
// Status badges share the index table styles, which a direct load of this page would not have yet.
import '../components/data-table/data-table.css';
import { ARTICLE_STATUS_TONES, SLUG_MAX, articleForm, articlePayload, fieldErrors, slugify, validSlug } from '../lib/storeArticles';

const input = 'w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100';
const button = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50';
const secondary = `${button} border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100`;
const card = 'min-w-0 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-700 dark:bg-slate-800';
const hint = 'block text-xs font-normal text-slate-600 dark:text-slate-300';
const errorClass = 'block text-xs font-medium text-red-700 dark:text-red-300';

export default function StoreArticleEditorPage() {
    const context = useStoreContext();
    const { articleId } = useParams();
    if (!context.access?.canStorePages) return <Navigate to={`${context.uiBase}/overview`} replace />;
    return <ArticleEditor key={`${context.apiBase}:${articleId || 'new'}`} context={context} articleId={articleId} />;
}

function ArticleEditor({ context: { apiBase, uiBase, locales: storeLocales }, articleId }) {
    const { i18n } = useTranslation();
    const ar = i18n.language.startsWith('ar');
    const text = (a, e) => (ar ? a : e);
    const navigate = useNavigate();
    const location = useLocation();
    const locales = useMemo(() => {
        const supported = storeLocales?.supported?.length ? storeLocales.supported : ['en'];
        const fallback = storeLocales?.default && supported.includes(storeLocales.default) ? storeLocales.default : supported[0];
        return { supported, default: fallback };
    }, [storeLocales]);
    const languageName = (code) => { try { return new Intl.DisplayNames([ar ? 'ar' : 'en'], { type: 'language' }).of(code) || code; } catch { return code; } };

    const [article, setArticle] = useState(null);
    const [form, setForm] = useState(() => (articleId ? null : articleForm(null, locales.supported)));
    const [initial, setInitial] = useState(form);
    const [locale, setLocale] = useState(locales.default);
    const [slugTouched, setSlugTouched] = useState(Boolean(articleId));
    const [loadError, setLoadError] = useState('');
    const [errors, setErrors] = useState({ fields: {}, general: '' });
    const [conflict, setConflict] = useState(false);
    const [busy, setBusy] = useState('');
    const [notice, setNotice] = useState(typeof location.state?.notice === 'string' ? location.state.notice : '');
    const [scheduleAt, setScheduleAt] = useState('');
    const [uploading, setUploading] = useState('');
    const [attempt, setAttempt] = useState(0);
    const working = useRef(false);
    const dirty = useDirty(initial, form);

    const apply = (data) => {
        const next = articleForm(data, locales.supported);
        setArticle(data); setForm(next); setInitial(next); setConflict(false); setSlugTouched(true);
    };

    useEffect(() => {
        if (!articleId) return undefined;
        let active = true;
        api.get(`${apiBase}/articles/${articleId}`)
            .then(({ data }) => { if (active) apply(data.data); })
            .catch((e) => { if (active) setLoadError(e.response?.status === 404 ? text('لم يتم العثور على هذا المقال.', 'This post was not found.') : e.response?.data?.message || e.message); });
        return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiBase, articleId, attempt]);

    // Leaving with unsaved edits (closing the tab or reloading) asks first.
    useEffect(() => {
        if (!dirty) return undefined;
        const warn = (event) => { event.preventDefault(); event.returnValue = ''; };
        window.addEventListener('beforeunload', warn);
        return () => window.removeEventListener('beforeunload', warn);
    }, [dirty]);

    const reload = () => { setForm(null); setInitial(null); setArticle(null); setErrors({ fields: {}, general: '' }); setNotice(''); setLoadError(''); setConflict(false); setAttempt((n) => n + 1); };
    const setField = (key, value) => {
        setNotice(''); setErrors((current) => ({ ...current, fields: { ...current.fields, [`draft.${locale}.${key}`]: undefined } }));
        setForm((current) => {
            const draft = { ...current.draft, [locale]: { ...current.draft[locale], [key]: value } };
            const autoSlug = key === 'title' && locale === locales.default && !slugTouched && !article;
            return { ...current, draft, slug: autoSlug ? slugify(value) : current.slug };
        });
    };
    const setSlug = (value) => { setNotice(''); setSlugTouched(true); setErrors((current) => ({ ...current, fields: { ...current.fields, slug: undefined } })); setForm((current) => ({ ...current, slug: value })); };

    const knownMessage = (message) => ({
        'This article changed in another session. Reload before saving.': text('تم تعديل هذا المقال في جلسة أخرى. أعد التحميل للحصول على أحدث نسخة قبل الحفظ.', 'This post was changed in another session. Reload to get the latest version before saving.'),
        'This article URL is already in use.': text('هذا الرابط مستخدم لمقال آخر.', 'This URL is already used by another post.'),
        'This URL is already used by an existing blog article.': text('هذا الرابط مستخدم لمقال في المدونة القديمة.', 'This URL is already used by a post in the old blog.'),
        'The URL of a published article cannot be changed.': text('لا يمكن تغيير رابط مقال تم نشره.', 'The URL of a published post cannot be changed.'),
        'Add a title in the default store language before publishing.': text('أضف عنوانًا بلغة المتجر الافتراضية قبل النشر.', 'Add a title in the store’s default language before publishing.'),
    })[message] ?? message;
    const fail = (e) => {
        const status = e.response?.status;
        const message = knownMessage(e.response?.data?.message || e.message);
        if (status === 409) { setConflict(true); setErrors({ fields: {}, general: knownMessage('This article changed in another session. Reload before saving.') }); return; }
        const mapped = fieldErrors(e.response?.data?.errors);
        if (!Object.keys(mapped.fields).length && /URL/.test(e.response?.data?.message || '')) mapped.fields.slug = message;
        setErrors({ fields: mapped.fields, general: mapped.general || (Object.keys(mapped.fields).length ? text('راجع الحقول المميزة.', 'Check the highlighted fields.') : message) });
        const errorLocale = Object.keys(mapped.fields).map((key) => key.split('.')[1]).find((code) => code && code !== locale && locales.supported.includes(code));
        if (errorLocale && !Object.keys(mapped.fields).some((key) => key.split('.')[1] === locale)) setLocale(errorLocale);
    };

    /** Saves the form (create or update) and returns the latest article. */
    const persist = async () => {
        if (article && !dirty) return article;
        const { data } = article
            ? await api.post(`${apiBase}/articles/${article.id}`, articlePayload(form, article.version))
            : await api.post(`${apiBase}/articles`, articlePayload(form));
        apply(data.data);
        return data.data;
    };
    const run = async (name, action) => {
        if (working.current || conflict) return;
        working.current = true; setBusy(name); setErrors({ fields: {}, general: '' }); setNotice('');
        const created = !article;
        try {
            const { saved, message } = await action();
            // A new post moves to its own URL; the editor remounts there and shows the message.
            if (created && saved?.id) navigate(`${uiBase}/articles/${saved.id}`, { replace: true, state: { notice: message } });
            else setNotice(message);
        } catch (e) { fail(e); } finally { working.current = false; setBusy(''); }
    };
    const save = (event) => {
        event?.preventDefault();
        run('save', async () => ({ saved: await persist(), message: text('تم حفظ المسودة.', 'Draft saved.') }));
    };
    const mutate = (name, path, body, done) => run(name, async () => {
        const saved = await persist();
        const { data } = await api.post(`${apiBase}/articles/${saved.id}/${path}`, { version: saved.version, ...body });
        apply(data.data);
        return { saved: data.data, message: done };
    });
    const publish = () => {
        const when = scheduleAt ? new Date(scheduleAt) : null;
        if (when && Number.isNaN(when.getTime())) return;
        mutate('publish', 'publish', when ? { publish_at: when.toISOString() } : {}, when ? text('تمت جدولة نشر المقال.', 'Post scheduled.') : text('تم نشر المقال في متجرك.', 'Post published on your store.'));
        setScheduleAt('');
    };
    const preview = () => {
        // Open the tab during the click so pop-up blockers allow it, then point it at the signed preview URL.
        const tab = window.open('about:blank', '_blank');
        run('preview', async () => {
            try {
                const saved = await persist();
                const { data } = await api.post(`${apiBase}/articles/${saved.id}/preview`);
                if (tab) { tab.opener = null; tab.location.href = data.preview_url; } else window.open(data.preview_url, '_blank', 'noopener');
                return { saved, message: text('فُتحت المعاينة في تبويب جديد.', 'Preview opened in a new tab.') };
            } catch (e) { tab?.close(); throw e; }
        });
    };

    const upload = async (file, target) => {
        if (!file) return;
        setUploading(target); setErrors((current) => ({ ...current, general: '' }));
        try {
            const body = new FormData(); body.append('image', file);
            const { data } = await api.post(`${apiBase}/content/upload-image`, body, { headers: { 'Content-Type': 'multipart/form-data' } });
            if (target === 'cover') setField('image', data.url);
            else setField('body', `${form.draft[locale].body || ''}<p><img src="${data.url.replace(/"/g, '&quot;')}" alt=""></p>`);
        } catch (e) {
            setErrors((current) => ({ ...current, general: Object.values(e.response?.data?.errors || {}).flat().join(' ') || e.response?.data?.message || e.message }));
        } finally { setUploading(''); }
    };
    const coverToAll = () => setForm((current) => ({ ...current, draft: Object.fromEntries(Object.entries(current.draft).map(([code, row]) => [code, { ...row, image: current.draft[locale].image }])) }));

    const statusLabel = (status) => ({ draft: text('مسودة', 'Draft'), published: text('منشور', 'Published'), scheduled: text('مجدول', 'Scheduled'), archived: text('مؤرشف', 'Archived') })[status] ?? status;
    const dateTime = (value) => (value ? new Intl.DateTimeFormat(ar ? 'ar-EG' : 'en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '');
    const slugLocked = Boolean(article?.publish_at);
    const slugInvalid = Boolean(form && form.slug !== '' && form.slug !== initial?.slug && !validSlug(form.slug));
    const fieldError = (key) => errors.fields[`draft.${locale}.${key}`];
    const localeHasError = (code) => Object.keys(errors.fields).some((key) => errors.fields[key] && key.startsWith(`draft.${code}.`));
    const disabled = Boolean(busy) || conflict;
    const backLink = <Link to={`${uiBase}/articles`} className="text-sm font-medium text-slate-700 underline dark:text-slate-200">{text('العودة إلى المقالات', 'Back to blog posts')}</Link>;

    if (loadError) return <div className="mx-auto max-w-3xl space-y-4"><p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{loadError}</p><div className="flex flex-wrap gap-3"><button type="button" className={secondary} onClick={reload}>{text('إعادة المحاولة', 'Retry')}</button>{backLink}</div></div>;
    if (!form) return <p role="status" className="p-6 text-sm text-slate-700 dark:text-slate-200">{text('جارٍ تحميل المقال…', 'Loading post…')}</p>;

    const row = form.draft[locale] ?? {};
    const dir = locale === 'ar' ? 'rtl' : 'ltr';
    const id = (key) => `article-${key}-${locale}`;
    const field = (key, label, control, help) => <div className="space-y-1.5">
        <label htmlFor={id(key)} className="block text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</label>
        {control}
        {help ? <span className={hint}>{help}</span> : null}
        {fieldError(key) ? <span id={`${id(key)}-error`} className={errorClass}>{fieldError(key)}</span> : null}
    </div>;
    const describedBy = (key) => (fieldError(key) ? `${id(key)}-error` : undefined);
    const canUnpublish = article && (article.is_live || article.status === 'scheduled');

    return <form onSubmit={save} className="store-article-editor mx-auto max-w-6xl space-y-5" noValidate>
        <header className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
                {backLink}
                <h1 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-white">{article ? text('تعديل المقال', 'Edit post') : text('مقال جديد', 'New post')}</h1>
                <div className="flex flex-wrap items-center gap-1.5" aria-live="polite">
                    <span className={`ws-dt-badge ${ARTICLE_STATUS_TONES[article?.status ?? 'draft'] ?? ''}`}>{statusLabel(article?.status ?? 'draft')}</span>
                    {article?.is_live ? <span className="ws-dt-badge is-success">{text('ظاهر في المتجر', 'Live on store')}</span> : null}
                    {article && article.status !== 'draft' && article.has_unpublished_changes ? <span className="ws-dt-badge is-warning">{text('تعديلات غير منشورة', 'Unpublished changes')}</span> : null}
                    {dirty ? <span className="ws-dt-badge is-warning">{text('تغييرات غير محفوظة', 'Unsaved changes')}</span> : null}
                </div>
            </div>
            <div className="flex flex-wrap gap-2">
                <button type="button" className={secondary} disabled={disabled} onClick={preview}><HiOutlineArrowTopRightOnSquare className="h-4 w-4" aria-hidden />{text('معاينة', 'Preview')}</button>
                <button type="submit" className={`${button} bg-slate-900 text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900`} disabled={disabled || (article && !dirty)}>
                    {busy === 'save' ? <HiOutlineArrowPath className="h-4 w-4 animate-spin" aria-hidden /> : null}{busy === 'save' ? text('جارٍ الحفظ…', 'Saving…') : text('حفظ المسودة', 'Save draft')}
                </button>
            </div>
        </header>

        {errors.general ? <div role="alert" className="flex flex-wrap items-center gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-800">
            <p className="min-w-0 flex-1">{errors.general}</p>
            {conflict ? <button type="button" className={secondary} onClick={reload}>{text('إعادة تحميل المقال', 'Reload post')}</button> : null}
        </div> : null}
        {notice ? <p role="status" className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">{notice}</p> : null}

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <fieldset disabled={disabled} className="min-w-0 space-y-5">
                <legend className="sr-only">{text('محتوى المقال', 'Post content')}</legend>
                <div className={card}>
                    {locales.supported.length > 1 ? <div role="tablist" aria-label={text('لغة المحتوى', 'Content language')} className="flex flex-wrap gap-1.5">
                        {locales.supported.map((code) => <button key={code} type="button" role="tab" id={`article-tab-${code}`} aria-controls="article-locale-panel" aria-selected={code === locale}
                            onClick={() => setLocale(code)}
                            className={`rounded-full px-3 py-1.5 text-sm font-semibold ${code === locale ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-100'}`}>
                            {languageName(code)}{code === locales.default ? ` · ${text('الافتراضية', 'default')}` : ''}{localeHasError(code) ? <span className="ms-1" aria-label={text('بها أخطاء', 'has errors')}>•</span> : null}
                        </button>)}
                    </div> : null}
                    <div id="article-locale-panel" role={locales.supported.length > 1 ? 'tabpanel' : undefined} aria-labelledby={locales.supported.length > 1 ? `article-tab-${locale}` : undefined} className="space-y-4">
                        {field('title', text('العنوان', 'Title'), <input id={id('title')} className={input} dir={dir} value={row.title} maxLength={200} aria-invalid={Boolean(fieldError('title'))} aria-describedby={describedBy('title')} onChange={(e) => setField('title', e.target.value)} />,
                            locale === locales.default ? text('مطلوب للنشر.', 'Required to publish.') : null)}
                        {field('excerpt', text('الملخص', 'Excerpt'), <textarea id={id('excerpt')} className={input} dir={dir} rows={3} value={row.excerpt} maxLength={1000} aria-invalid={Boolean(fieldError('excerpt'))} aria-describedby={describedBy('excerpt')} onChange={(e) => setField('excerpt', e.target.value)} />,
                            text('يظهر في قائمة المقالات.', 'Shown in the blog list.'))}
                        <div className="space-y-1.5">
                            <ProductRichText key={locale} pageContent value={row.body || ''} onChange={(value) => setField('body', value)} label={text('محتوى المقال', 'Post body')} locale={locale} ar={ar} disabled={disabled} />
                            <div className="flex flex-wrap items-center gap-2">
                                <label className={`${secondary} cursor-pointer`}>
                                    <HiOutlinePhoto className="h-4 w-4" aria-hidden />{uploading === 'body' ? text('جارٍ الرفع…', 'Uploading…') : text('رفع صورة إلى المقال', 'Upload an image into the post')}
                                    <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" disabled={disabled || Boolean(uploading)} onChange={(e) => { upload(e.target.files?.[0], 'body'); e.target.value = ''; }} />
                                </label>
                                <span className={hint}>{text('تُضاف الصورة في نهاية المقال.', 'The image is added at the end of the post.')}</span>
                            </div>
                            {fieldError('body') ? <span className={errorClass}>{fieldError('body')}</span> : null}
                        </div>
                    </div>
                </div>

                <div className={card}>
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white">{text('صورة الغلاف', 'Cover image')}</h2>
                    {row.image ? <img src={row.image} alt={text('صورة الغلاف الحالية', 'Current cover image')} className="aspect-video w-full max-w-md rounded-xl border border-slate-200 object-cover dark:border-slate-700" /> : null}
                    <div className="flex flex-wrap items-center gap-2">
                        <label className={`${secondary} cursor-pointer`}>
                            <HiOutlinePhoto className="h-4 w-4" aria-hidden />{uploading === 'cover' ? text('جارٍ الرفع…', 'Uploading…') : row.image ? text('تغيير الصورة', 'Change image') : text('رفع صورة', 'Upload image')}
                            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" disabled={disabled || Boolean(uploading)} onChange={(e) => { upload(e.target.files?.[0], 'cover'); e.target.value = ''; }} />
                        </label>
                        {row.image ? <button type="button" className={secondary} onClick={() => setField('image', '')}>{text('إزالة', 'Remove')}</button> : null}
                        {row.image && locales.supported.length > 1 ? <button type="button" className={secondary} onClick={coverToAll}>{text('استخدامها لكل اللغات', 'Use for all languages')}</button> : null}
                    </div>
                    {field('image', text('رابط الصورة', 'Image URL'), <input id={id('image')} className={`${input} font-mono`} dir="ltr" type="url" value={row.image} maxLength={2048} placeholder="https://…" aria-invalid={Boolean(fieldError('image'))} aria-describedby={describedBy('image')} onChange={(e) => setField('image', e.target.value)} />)}
                </div>

                <div className={card}>
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white">{text('محركات البحث', 'Search engine listing')}</h2>
                    {field('seo_title', text('عنوان الصفحة', 'Page title'), <input id={id('seo_title')} className={input} dir={dir} value={row.seo_title} maxLength={200} placeholder={row.title} aria-invalid={Boolean(fieldError('seo_title'))} aria-describedby={describedBy('seo_title')} onChange={(e) => setField('seo_title', e.target.value)} />,
                        `${(row.seo_title || '').length}/200 · ${text('يُستخدم عنوان المقال إذا تُرك فارغًا.', 'The post title is used when empty.')}`)}
                    {field('seo_description', text('وصف الصفحة', 'Meta description'), <textarea id={id('seo_description')} className={input} dir={dir} rows={3} value={row.seo_description} maxLength={500} aria-invalid={Boolean(fieldError('seo_description'))} aria-describedby={describedBy('seo_description')} onChange={(e) => setField('seo_description', e.target.value)} />,
                        `${(row.seo_description || '').length}/500`)}
                </div>
            </fieldset>

            <aside className="min-w-0 space-y-5">
                <fieldset disabled={disabled} className={card}>
                    <legend className="sr-only">{text('رابط المقال وتاريخه', 'Post URL and date')}</legend>
                    <div className="space-y-1.5">
                        <label htmlFor="article-slug" className="block text-sm font-semibold text-slate-800 dark:text-slate-100">{text('رابط المقال', 'URL handle')}</label>
                        <input id="article-slug" className={`${input} font-mono`} dir="ltr" value={form.slug} maxLength={SLUG_MAX} required readOnly={slugLocked}
                            aria-invalid={Boolean(errors.fields.slug || slugInvalid)} aria-describedby="article-slug-help" onChange={(e) => setSlug(e.target.value)} onBlur={() => { if (form.slug && !slugLocked && !validSlug(form.slug)) setSlug(slugify(form.slug)); }} />
                        <span id="article-slug-help" className={hint}>
                            <bdi dir="ltr">/blog/{form.slug || '…'}</bdi> · {slugLocked ? text('لا يمكن تغيير الرابط بعد النشر.', 'The URL can’t change after publishing.') : text('حروف وأرقام تفصلها شرطات.', 'Letters and numbers separated by hyphens.')}
                        </span>
                        {errors.fields.slug ? <span className={errorClass}>{errors.fields.slug}</span> : slugInvalid ? <span className={errorClass}>{text('استخدم حروفًا وأرقامًا تفصلها شرطة واحدة.', 'Use letters and numbers separated by single hyphens.')}</span> : null}
                    </div>
                    {field('date', text('تاريخ المقال (اختياري)', 'Post date (optional)'), /^(\d{4}-\d{2}-\d{2})?$/.test(row.date || '')
                        ? <input id={id('date')} type="date" className={input} dir="ltr" value={row.date || ''} aria-invalid={Boolean(fieldError('date'))} aria-describedby={describedBy('date')} onChange={(e) => setField('date', e.target.value)} />
                        : <input id={id('date')} className={input} dir="ltr" value={row.date} maxLength={100} aria-invalid={Boolean(fieldError('date'))} aria-describedby={describedBy('date')} onChange={(e) => setField('date', e.target.value)} />,
                    text('يظهر على المقال بدلًا من تاريخ النشر.', 'Shown on the post instead of the publish date.'))}
                </fieldset>

                <section className={card} aria-labelledby="article-publishing">
                    <h2 id="article-publishing" className="text-base font-semibold text-slate-900 dark:text-white">{text('النشر', 'Publishing')}</h2>
                    {article?.publish_at ? <p className="text-sm text-slate-700 dark:text-slate-200">
                        {article.status === 'scheduled' ? text('موعد النشر: ', 'Scheduled for ') : text('نُشر في ', 'Published ')}<bdi>{dateTime(article.publish_at)}</bdi>
                    </p> : <p className="text-sm text-slate-700 dark:text-slate-200">{text('لم يُنشر بعد. العملاء لا يرون المسودات.', 'Not published yet. Customers can’t see drafts.')}</p>}
                    {dirty && article ? <p className={hint}>{text('سيتم حفظ تغييراتك قبل النشر.', 'Your changes are saved before publishing.')}</p> : null}
                    <div className="space-y-1.5">
                        <label htmlFor="article-schedule" className="block text-sm font-semibold text-slate-800 dark:text-slate-100">{text('جدولة النشر (اختياري)', 'Schedule for later (optional)')}</label>
                        <input id="article-schedule" type="datetime-local" className={input} dir="ltr" value={scheduleAt} disabled={disabled} onChange={(e) => setScheduleAt(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                        <button type="button" className={`${button} bg-emerald-700 text-white hover:bg-emerald-800`} disabled={disabled || (article?.is_live && !article.has_unpublished_changes && !dirty && !scheduleAt)} onClick={publish}>
                            {busy === 'publish' ? <HiOutlineArrowPath className="h-4 w-4 animate-spin" aria-hidden /> : null}
                            {scheduleAt ? text('جدولة النشر', 'Schedule') : article?.is_live ? text('نشر التعديلات', 'Publish changes') : text('نشر', 'Publish')}
                        </button>
                        {canUnpublish ? <button type="button" className={secondary} disabled={disabled} onClick={() => mutate('unpublish', 'unpublish', {}, text('تم إلغاء نشر المقال.', 'Post unpublished.'))}>{text('إلغاء النشر', 'Unpublish')}</button> : null}
                        {article && article.status !== 'archived' ? <button type="button" className={secondary} disabled={disabled} onClick={() => mutate('archive', 'archive', {}, text('تمت أرشفة المقال.', 'Post archived.'))}>{text('أرشفة', 'Archive')}</button> : null}
                    </div>
                    {article?.status === 'archived' ? <p className={hint}>{text('المقال مؤرشف ومخفي من المدونة. انشره لإعادته.', 'This post is archived and hidden from the blog. Publish it to bring it back.')}</p> : null}
                </section>
            </aside>
        </div>
    </form>;
}
