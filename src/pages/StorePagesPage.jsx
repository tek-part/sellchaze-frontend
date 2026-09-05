import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlineArrowPath, HiOutlinePlus, HiOutlineSquares2X2, HiOutlineTrash } from 'react-icons/hi2';
import api from '../api/client';
import PageHeader from '../components/PageHeader';
import { confirmDialog } from '../components/ui/confirmDialog';
import FormField, { INPUT_CLASS } from '../components/ui/FormField';
import { notify } from '../components/ui/notify';
import SearchableSelect from '../components/ui/SearchableSelect';
import useStoreContext from '../hooks/useStoreContext';

const badgeCls = 'inline-block rounded-full border px-2 py-0.5 text-xs font-medium';
const thCls = 'px-4 py-3.5 text-start';
const tdCls = 'px-4 py-3 align-middle';
const rowCls = 'border-t border-slate-100 hover:bg-slate-50/60';
const btnPrimary = 'rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark';
const btnGhost = 'rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50';

const PAGE_STATUS = {
    published: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    scheduled: 'border-sky-100 bg-sky-50 text-sky-700',
    draft: 'border-slate-200 bg-slate-100 text-slate-500',
};

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

export default function StorePagesPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { apiBase, uiBase, locales } = useStoreContext();

    const [contentPages, setContentPages] = useState([]);
    const [customPages, setCustomPages] = useState([]);
    const [loadingCustom, setLoadingCustom] = useState(true);
    const [creating, setCreating] = useState(false);
    const [err, setErr] = useState('');
    const [customErr, setCustomErr] = useState('');

    const load = useCallback(() => {
        api.get(`${apiBase}/content`)
            .then(({ data }) => setContentPages(data.data ?? []))
            .catch((e) => setErr(e.response?.data?.message || e.message));
    }, [apiBase]);

    const loadCustom = useCallback(async () => {
        setLoadingCustom(true);
        try {
            const { data } = await api.get(`${apiBase}/pages`, { params: { per_page: 50 } });
            setCustomPages(Array.isArray(data?.data) ? data.data : []);
            setCustomErr('');
        } catch (e) {
            setCustomErr(e.response?.data?.message || e.message);
        } finally {
            setLoadingCustom(false);
        }
    }, [apiBase]);

    useEffect(() => { load(); void loadCustom(); }, [load, loadCustom]);

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
            setCustomPages((rows) => rows.filter((row) => row.id !== page.id));
            notify.success(t('store_pages_deleted', 'Page deleted'));
        } catch (e) {
            notify.error(t('store_pages_delete_failed', 'Could not delete the page'), e.response?.data?.message || e.message);
        }
    };

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
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
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
                    <NewPageForm
                        apiBase={apiBase}
                        uiBase={uiBase}
                        locales={locales}
                        onClose={() => setCreating(false)}
                        onCreated={(page) => { if (page) setCustomPages((rows) => [page, ...rows]); setCreating(false); }}
                    />
                ) : null}
                {customErr ? (
                    <p className="m-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
                        {customErr}
                        <button type="button" onClick={() => void loadCustom()} className="ms-3 font-semibold underline">{t('action_retry', 'Retry')}</button>
                    </p>
                ) : null}
                <div className="overflow-x-auto">
                    <table className="min-w-full text-start text-sm">
                        <thead className="bg-surface-muted/90 text-xs font-semibold uppercase tracking-wide text-slate-600">
                            <tr>
                                <th className={thCls}>{t('col_page', 'Page')}</th>
                                <th className={thCls}>{t('col_path', 'Path')}</th>
                                <th className={thCls}>{t('store_pages_col_locale', 'Language')}</th>
                                <th className={thCls}>{t('col_status', 'Status')}</th>
                                <th className={`${thCls} text-end`}>{t('col_actions', 'Actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingCustom ? (
                                <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">{t('loading', 'Loading…')}</td></tr>
                            ) : customPages.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-500">
                                        {t('store_pages_custom_empty', 'No custom pages yet. Create one to open the page builder.')}
                                    </td>
                                </tr>
                            ) : customPages.map((page) => (
                                <tr key={page.id} className={rowCls}>
                                    <td className={`${tdCls} font-medium text-slate-800`}>{page.title}</td>
                                    <td className={`${tdCls} font-mono text-xs text-slate-500`} dir="ltr">/{page.slug}</td>
                                    <td className={`${tdCls} uppercase text-slate-500`}>{page.locale || '—'}</td>
                                    <td className={tdCls}>
                                        <span className={`${badgeCls} ${PAGE_STATUS[page.status] || PAGE_STATUS.draft}`}>
                                            {t(`store_pages_status_${page.status}`, page.status)}
                                        </span>
                                    </td>
                                    <td className={`${tdCls} text-end`}>
                                        <div className="inline-flex items-center gap-1.5">
                                            <Link to={`${uiBase}/pages/${page.id}/builder`} className={btnPrimary}>
                                                {t('store_pages_open_builder', 'Open builder')}
                                            </Link>
                                            <button type="button" onClick={() => deletePage(page)} className={`${btnGhost} text-red-600 hover:bg-red-50`} aria-label={t('action_delete', 'Delete')}>
                                                <HiOutlineTrash className="h-4 w-4" aria-hidden />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
