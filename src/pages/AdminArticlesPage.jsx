import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
    HiOutlineEye,
    HiOutlineEyeSlash,
    HiOutlineNewspaper,
    HiOutlinePencilSquare,
    HiOutlinePlus,
    HiOutlineTrash,
} from '../components/workspace/WorkspaceIcons';
import api from '../api/client';
import ConfirmDialog from '../components/ConfirmDialog';
import { IndexFilters, IndexTable, downloadCsv, useIndexTable } from '../components/data-table';
import { fetchAllPages } from '../utils/fetchAllPages';

const DEFAULTS = { sort: null, perPage: 25 };
const errorText = (e) => e.response?.data?.message || e.message;

function ArticleThumb({ url }) {
    const [failed, setFailed] = useState(false);
    return <span className="ws-dt-thumb">{url && !failed ? <img src={url} alt="" loading="lazy" onError={() => setFailed(true)} /> : <HiOutlineNewspaper aria-hidden />}</span>;
}

export default function AdminArticlesPage() {
    const { t, i18n } = useTranslation();
    const isAr = (i18n.language || '').toLowerCase().startsWith('ar');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState('');
    const [reload, setReload] = useState(0);
    const [exporting, setExporting] = useState(false);
    const [confirmDel, setConfirmDel] = useState(null);

    const title = (a) => ((isAr && a.title_ar) ? a.title_ar : a.title);
    const statusText = (a) => (a.published ? t('published', 'Published') : t('draft', 'Draft'));
    const date = (value) => (value ? new Date(value).toLocaleString() : '—');

    // The endpoint filters on `published` (boolean) and searches with `q`.
    const statusOptions = [{ value: '1', label: t('admin_dt_articles_published') }, { value: '0', label: t('admin_dt_articles_draft') }];
    const filters = useMemo(() => [
        { key: 'published', label: t('admin_dt_articles_status'), type: 'select', options: statusOptions },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [i18n.language]);
    const views = useMemo(() => [
        { id: 'all', label: t('filter_all'), state: { filters: {} } },
        { id: 'published', label: t('admin_dt_articles_published'), state: { filters: { published: '1' } } },
        { id: 'draft', label: t('admin_dt_articles_draft'), state: { filters: { published: '0' } } },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [i18n.language]);

    async function togglePublish(row) {
        try {
            await api.post(`/admin/articles/${row.id}/${row.published ? 'unpublish' : 'publish'}`);
            toast.success(t('saved', 'Saved'));
            setReload((value) => value + 1);
        } catch (e) {
            toast.error(errorText(e));
        }
    }

    const columns = useMemo(() => [
        { key: 'title', header: t('admin_articles_col_title', 'Title'), hideable: false, primary: true, csv: title,
            render: (a) => <div className="ws-dt-cell-media"><ArticleThumb key={a.featured_image_thumb_url || 'empty'} url={a.featured_image_thumb_url} /><div className="min-w-0">
                <Link className="ws-dt-title" to={`/admin/articles/${a.id}/edit`}>{title(a)}</Link>
                <span className="ws-dt-sub" dir="ltr">/{a.slug}</span>
            </div></div> },
        { key: 'author', header: t('admin_articles_col_author', 'Author'), csv: (a) => a.author?.name ?? '', render: (a) => a.author?.name ?? '—' },
        { key: 'status', header: t('admin_articles_col_status', 'Status'), csv: statusText,
            render: (a) => <span className={`ws-dt-badge ${a.published ? 'is-success' : 'is-warning'}`}>{statusText(a)}</span> },
        { key: 'published_at', header: t('admin_articles_col_published_at', 'Published at'), csv: (a) => a.published_at ?? '',
            render: (a) => <span className="ws-dt-num">{date(a.published_at)}</span> },
        { key: 'created', header: t('admin_dt_articles_created'), defaultHidden: true, csv: (a) => a.created_at ?? '',
            render: (a) => <span className="ws-dt-num">{date(a.created_at)}</span> },
        { key: 'actions', header: <span className="sr-only">{t('actions', 'Actions')}</span>, hideable: false, align: 'end',
            render: (a) => <div className="ws-dt-row-actions">
                <button type="button" className="ws-dt-icon" onClick={() => void togglePublish(a)} title={a.published ? t('unpublish', 'Unpublish') : t('publish', 'Publish')} aria-label={a.published ? t('unpublish', 'Unpublish') : t('publish', 'Publish')}>
                    {a.published ? <HiOutlineEyeSlash aria-hidden /> : <HiOutlineEye aria-hidden />}
                </button>
                <Link className="ws-dt-icon" to={`/admin/articles/${a.id}/edit`} title={t('edit', 'Edit')} aria-label={t('edit', 'Edit')}><HiOutlinePencilSquare aria-hidden /></Link>
                <button type="button" className="ws-dt-icon" onClick={() => setConfirmDel(a)} title={t('delete', 'Delete')} aria-label={t('delete', 'Delete')}><HiOutlineTrash aria-hidden /></button>
            </div> },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [i18n.language]);

    const table = useIndexTable({ scope: 'admin:articles', filters, columns, views, defaults: DEFAULTS });
    const listParams = useMemo(() => {
        const { search, ...rest } = table.apiParams;
        return { ...rest, ...(search ? { q: search } : {}) };
    }, [table.apiParams]);
    const paramsKey = JSON.stringify(listParams);
    useEffect(() => {
        let active = true;
        setLoading(true);
        setErr('');
        api.get('/admin/articles', { params: listParams })
            .then(({ data }) => { if (active) setResult(data); })
            .catch((e) => { if (active) setErr(errorText(e)); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paramsKey, reload]);

    const rows = result?.data ?? [];

    const handleExport = async () => {
        setExporting(true);
        try {
            const { page: _page, per_page: _perPage, ...base } = listParams;
            downloadCsv(`articles-${new Date().toISOString().slice(0, 10)}.csv`, table.visibleColumns, await fetchAllPages('/admin/articles', base));
        } catch (e) {
            toast.error(errorText(e));
        } finally {
            setExporting(false);
        }
    };

    async function doDelete() {
        if (!confirmDel) return;
        try {
            await api.delete(`/admin/articles/${confirmDel.id}`);
            toast.success(t('deleted', 'Deleted'));
            setConfirmDel(null);
            setReload((value) => value + 1);
        } catch (e) {
            toast.error(errorText(e));
        }
    }

    return (
        <div className="mx-auto w-full max-w-7xl space-y-4 p-4 md:p-6">
            <header className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{t('admin_articles_title', 'Articles')}</h1>
                    <p className="mt-1 text-sm text-slate-600">
                        {t('admin_articles_sub', 'Manage blog posts shown on the public marketing site.')}
                    </p>
                </div>
                <Link
                    to="/admin/articles/new"
                    className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark"
                >
                    <HiOutlinePlus className="h-4 w-4" /> {t('admin_articles_new', 'New article')}
                </Link>
            </header>

            <div className="ws-dt-card">
                <IndexFilters table={table} searchPlaceholder={t('admin_dt_search_articles')} onExport={() => void handleExport()} exportDisabled={loading || exporting || !rows.length} />
                <IndexTable table={table} rows={rows} loading={loading} error={err} onRetry={() => setReload((value) => value + 1)} meta={result?.meta}
                    label={t('admin_articles_title', 'Articles')} rowHref={(a) => `/admin/articles/${a.id}/edit`}
                    emptyState={{ icon: HiOutlineNewspaper, title: t('admin_articles_empty', 'No articles yet.'),
                        action: <Link className="ws-dt-button ws-dt-button-primary" to="/admin/articles/new">{t('admin_articles_new', 'New article')}</Link> }} />
            </div>

            <ConfirmDialog
                open={!!confirmDel}
                title={t('confirm_delete', 'Confirm delete')}
                body={t('admin_articles_confirm_delete', 'Delete this article permanently?')}
                confirmLabel={t('delete', 'Delete')}
                cancelLabel={t('cancel', 'Cancel')}
                danger
                onConfirm={doDelete}
                onClose={() => setConfirmDel(null)}
            />
        </div>
    );
}
