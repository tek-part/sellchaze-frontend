import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlineArrowPath, HiOutlinePlus, HiOutlineSquares2X2, HiOutlineTrash } from '../components/workspace/WorkspaceIcons';
import api from '../api/client';
import PageHeader from '../components/PageHeader';
import { confirmDialog } from '../components/ui/confirmDialog';
import FormField, { INPUT_CLASS } from '../components/ui/FormField';
import { notify } from '../components/ui/notify';
import SearchableSelect from '../components/ui/SearchableSelect';
import useStoreContext from '../hooks/useStoreContext';
import SimplePagesPanel from '../components/store/SimplePagesPanel';
import { IndexFilters, IndexTable, downloadCsv, useIndexTable } from '../components/data-table';

const badgeCls = 'inline-block rounded-full border px-2 py-0.5 text-xs font-medium';
const thCls = 'px-4 py-3.5 text-start';
const tdCls = 'px-4 py-3 align-middle';
const rowCls = 'border-t border-slate-100 hover:bg-slate-50/60';
const btnPrimary = 'rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark';

function slugify(value) {
    return String(value || '')
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/[\s_]+/g, '-')
        .replace(/-+/g, '-');
}

/** "New page" form: title + optional slug + template. Creates a draft and opens the builder. */
function NewPageForm({ apiBase, uiBase, locales, onClose, onCreated }) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [slugTouched, setSlugTouched] = useState(false);
    const [template, setTemplate] = useState('page');
    const [locale, setLocale] = useState(locales?.default || 'en');
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        try {
            const payload = { title: title.trim(), template, locale, status: 'draft' };
            const finalSlug = slugify(slugTouched ? slug : title);
            if (finalSlug) payload.slug = finalSlug;
            const { data } = await api.post(`${apiBase}/pages`, payload);
            const page = data?.data;
            notify.success(t('store_pages_created', 'Page created'), t('store_pages_created_hint', 'Opening the builder…'));
            onCreated(page);
            if (page?.id) navigate(`${uiBase}/pages/${page.id}/builder`);
        } catch (err) {
            const fieldErrors = err.response?.data?.errors;
            if (fieldErrors) setErrors(fieldErrors);
            notify.error(t('store_pages_create_failed', 'Could not create the page'), err.response?.data?.message || err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={submit} className="grid gap-4 border-t border-slate-100 bg-slate-50/60 px-4 py-4 sm:grid-cols-2 lg:grid-cols-4">
            <FormField label={t('store_pages_field_title', 'Title')} htmlFor="new-page-title" required error={errors.title}>
                <input id="new-page-title" value={title} onChange={(e) => setTitle(e.target.value)} className={INPUT_CLASS} maxLength={255} required autoFocus />
            </FormField>
            <FormField label={t('store_pages_field_slug', 'Slug')} htmlFor="new-page-slug" error={errors.slug} hint={t('store_pages_slug_hint', 'Left empty, it follows the title.')}>
                <input
                    id="new-page-slug"
                    value={slugTouched ? slug : slugify(title)}
                    onChange={(e) => { setSlugTouched(true); setSlug(e.target.value); }}
                    className={`${INPUT_CLASS} font-mono`}
                    dir="ltr"
                    maxLength={255}
                />
            </FormField>
            <FormField label={t('store_pages_field_template', 'Template')} htmlFor="new-page-template" error={errors.template}>
                <SearchableSelect
                    id="new-page-template"
                    value={template}
                    onChange={(e) => setTemplate(e.target.value)}
                    options={[
                        { value: 'page', label: t('store_pages_template_page', 'Standard page') },
                        { value: 'landing', label: t('store_pages_template_landing', 'Landing page') },
                    ]}
                    className="w-full"
                />
            </FormField>
            <FormField label={t('store_pages_field_locale', 'Language')} htmlFor="new-page-locale" error={errors.locale}>
                <SearchableSelect
                    id="new-page-locale"
                    value={locale}
                    onChange={(e) => setLocale(e.target.value)}
                    options={(locales?.supported || ['en']).map((code) => ({ value: code, label: code.toUpperCase() }))}
                    className="w-full"
                />
            </FormField>
            <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-4">
                <button type="submit" disabled={saving || !title.trim()} className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50">
                    {saving ? <HiOutlineArrowPath className="h-4 w-4 animate-spin" aria-hidden /> : <HiOutlineSquares2X2 className="h-4 w-4" aria-hidden />}
                    {t('store_pages_create_open', 'Create & open builder')}
                </button>
                <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">{t('cancel', 'Cancel')}</button>
            </div>
        </form>
    );
}

// The custom pages endpoint filters by status and template only (no search or sorting; newest first).
const DEFAULTS = { sort: null, perPage: 25 };
const PAGE_STATUSES = ['published', 'draft', 'scheduled'];
const STATUS_TONE = { published: 'is-success', scheduled: 'is-info', draft: '' };

export default function StorePagesPage() {
    const { t, i18n } = useTranslation();
    const ar = i18n.language?.startsWith('ar'); const text = (a, e) => (ar ? a : e);
    const navigate = useNavigate();
    const { apiBase, uiBase, locales, store } = useStoreContext();

    const [contentPages, setContentPages] = useState([]);
    const [result, setResult] = useState(null);
    const [loadingCustom, setLoadingCustom] = useState(true);
    const [reload, setReload] = useState(0);
    const [creating, setCreating] = useState(false);
    const [err, setErr] = useState('');
    const [customErr, setCustomErr] = useState('');

    const load = useCallback(() => {
        api.get(`${apiBase}/content`)
            .then(({ data }) => setContentPages(data.data ?? []))
            .catch((e) => setErr(e.response?.data?.message || e.message));
    }, [apiBase]);
    useEffect(() => { load(); }, [load]);

    const statusLabel = (status) => t(`store_pages_status_${status}`, status);
    const templateLabel = (template) => (template === 'landing' ? t('store_pages_template_landing', 'Landing page') : template === 'page' ? t('store_pages_template_page', 'Standard page') : template);
    const filters = useMemo(() => [
        { key: 'status', label: t('col_status', 'Status'), type: 'select', options: PAGE_STATUSES.map((status) => ({ value: status, label: statusLabel(status) })) },
        { key: 'locale', label: t('store_pages_col_locale', 'Language'), type: 'select', options: [{ value: 'ar', label: 'العربية' }, { value: 'en', label: 'English' }] },
        { key: 'template', label: t('store_pages_field_template', 'Template'), type: 'multi', options: ['page', 'landing'].map((template) => ({ value: template, label: templateLabel(template) })) },
    ], [ar, t]); // eslint-disable-line react-hooks/exhaustive-deps
    const views = useMemo(() => [
        { id: 'all', label: text('الكل', 'All'), state: { filters: {} } },
        ...PAGE_STATUSES.map((status) => ({ id: status, label: statusLabel(status), state: { filters: { status } } })),
    ], [ar, t]); // eslint-disable-line react-hooks/exhaustive-deps

    const deletePage = async (page) => {
        const ok = await confirmDialog({
            title: t('store_pages_delete_title', 'Delete this page?'),
            text: t('store_pages_delete_text', '"{{title}}" and its sections will be removed from the storefront.', { title: page.title }),
            confirmText: t('action_delete', 'Delete'),
            danger: true,
        });
        if (!ok) return;
        try {
            await api.delete(`${apiBase}/pages/${page.id}`);
            setResult((current) => (current ? { ...current, data: current.data.filter((row) => row.id !== page.id) } : current));
            notify.success(t('store_pages_deleted', 'Page deleted'));
        } catch (e) {
            notify.error(t('store_pages_delete_failed', 'Could not delete the page'), e.response?.data?.message || e.message);
        }
    };

    const date = (value) => (value ? new Date(value).toLocaleDateString(ar ? 'ar-EG' : 'en-GB') : '—');
    const columns = useMemo(() => [
        { key: 'page', header: t('col_page', 'Page'), hideable: false, primary: true, sortKey: 'title', csv: (page) => page.title,
            render: (page) => <Link className="ws-dt-title" to={`${uiBase}/pages/${page.id}/builder`}>{page.title}</Link> },
        { key: 'path', header: t('col_path', 'Path'), csv: (page) => `/${page.slug}`, render: (page) => <span className="font-mono text-xs" dir="ltr">/{page.slug}</span> },
        { key: 'locale', header: t('store_pages_col_locale', 'Language'), csv: (page) => page.locale ?? '', render: (page) => <span className="uppercase">{page.locale || '—'}</span> },
        { key: 'template', header: t('store_pages_field_template', 'Template'), defaultHidden: true, csv: (page) => page.template ?? '', render: (page) => templateLabel(page.template) || '—' },
        { key: 'status', header: t('col_status', 'Status'), csv: (page) => page.status,
            render: (page) => <span className={`ws-dt-badge ${STATUS_TONE[page.status] ?? ''}`}>{statusLabel(page.status)}</span> },
        { key: 'published', header: text('تاريخ النشر', 'Published'), defaultHidden: true, sortKey: 'published_at', csv: (page) => page.published_at ?? page.publish_at ?? '', render: (page) => <span className="ws-dt-num">{date(page.published_at ?? page.publish_at)}</span> },
        { key: 'actions', header: <span className="sr-only">{t('col_actions', 'Actions')}</span>, hideable: false, align: 'end',
            render: (page) => <div className="ws-dt-row-actions">
                <Link to={`${uiBase}/pages/${page.id}/builder`} className="ws-dt-button">{t('store_pages_open_builder', 'Open builder')}</Link>
                <button type="button" onClick={() => deletePage(page)} className="ws-dt-icon" aria-label={`${t('action_delete', 'Delete')} ${page.title}`} title={t('action_delete', 'Delete')}><HiOutlineTrash aria-hidden /></button>
            </div> },
    ], [ar, t, uiBase, apiBase]); // eslint-disable-line react-hooks/exhaustive-deps

    const table = useIndexTable({ scope: `store:${store?.id ?? apiBase}:pages`, filters, columns, views, defaults: DEFAULTS });
    const paramsKey = JSON.stringify(table.apiParams);
    useEffect(() => {
        let active = true; setLoadingCustom(true); setCustomErr('');
        api.get(`${apiBase}/pages`, { params: table.apiParams })
            .then(({ data }) => { if (active) setResult({ ...data, data: Array.isArray(data?.data) ? data.data : [] }); })
            .catch((e) => { if (active) setCustomErr(e.response?.data?.message || e.message); })
            .finally(() => { if (active) setLoadingCustom(false); });
        return () => { active = false; };
    }, [apiBase, paramsKey, reload]); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => { setCreating(false); setResult(null); }, [apiBase]);
    const customPages = result?.data ?? [];

    return (
        <div className="mx-auto max-w-5xl space-y-5">
            <PageHeader
                title={t('pages_title', 'Pages')}
                subtitle={t('standard_pages_subtitle', 'Edit the built-in storefront pages. Unset fields keep the theme default.')}
                action={
                    <button type="button" onClick={() => navigate(`${uiBase}/menus`)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                        {t('menus_title', 'Menus')}
                    </button>
                }
            />

            {err && <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}

            {/* Standard pages — fixed system pages editable with structured fields. */}
            <SimplePagesPanel />
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
                <div className="border-b border-slate-100 px-4 py-3">
                    <h2 className="text-sm font-semibold text-slate-900">{t('standard_pages_title', 'Standard pages')}</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-start text-sm">
                        <thead className="bg-surface-muted/90 text-xs font-semibold uppercase tracking-wide text-slate-600">
                            <tr>
                                <th className={thCls}>{t('col_page', 'Page')}</th>
                                <th className={thCls}>{t('col_path', 'Path')}</th>
                                <th className={thCls}>{t('col_status', 'Status')}</th>
                                <th className={`${thCls} text-end`}>{t('col_actions', 'Actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {contentPages.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-4 py-12 text-center text-sm text-slate-500">{t('empty', 'Nothing here yet.')}</td>
                                </tr>
                            ) : null}
                            {contentPages.map((c) => (
                                <tr key={c.key} className={rowCls}>
                                    <td className={`${tdCls} font-medium text-slate-800`}>{t(c.label, c.label)}</td>
                                    <td className={`${tdCls} text-slate-500`} dir="ltr">{c.path}</td>
                                    <td className={tdCls}>
                                        <span className={`${badgeCls} ${c.customized ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-500'}`}>
                                            {c.customized ? t('customized', 'Customized') : t('theme_default_label', 'Theme default')}
                                        </span>
                                    </td>
                                    <td className={`${tdCls} text-end`}>
                                        <button type="button" onClick={() => navigate(`${uiBase}/content/${c.key}`)} className={btnPrimary}>
                                            {t('page_edit', 'Edit')}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Custom pages — free-form pages built with the page builder. */}
            <section className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-sm font-semibold text-slate-900">{t('store_pages_custom_title', 'Custom pages')}</h2>
                        <p className="text-xs text-slate-500">{t('store_pages_custom_hint', 'Landing pages and extra content built from theme sections.')}</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setCreating((v) => !v)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
                    >
                        <HiOutlinePlus className="h-4 w-4" aria-hidden />
                        {t('store_pages_new', 'New page')}
                    </button>
                </div>
                {creating ? (
                    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
                        <NewPageForm
                            apiBase={apiBase}
                            uiBase={uiBase}
                            locales={locales}
                            onClose={() => setCreating(false)}
                            onCreated={() => { setCreating(false); setReload((value) => value + 1); }}
                        />
                    </div>
                ) : null}
                <div className="ws-dt-card">
                    <IndexFilters table={table} searchPlaceholder={text('ابحث بالعنوان أو الرابط', 'Search title or path')} exportDisabled={!customPages.length}
                        onExport={() => downloadCsv(`pages-${new Date().toISOString().slice(0, 10)}.csv`, table.visibleColumns, customPages)} />
                    <IndexTable table={table} rows={customPages} loading={loadingCustom} error={customErr} onRetry={() => setReload((value) => value + 1)} meta={result?.meta}
                        label={t('store_pages_custom_title', 'Custom pages')} rowHref={(page) => `${uiBase}/pages/${page.id}/builder`}
                        emptyState={{ icon: HiOutlineSquares2X2, title: t('store_pages_custom_empty', 'No custom pages yet. Create one to open the page builder.'),
                            action: <button type="button" className="ws-dt-button ws-dt-button-primary" onClick={() => setCreating(true)}>{t('store_pages_new', 'New page')}</button> }} />
                </div>
            </section>
        </div>
    );
}
