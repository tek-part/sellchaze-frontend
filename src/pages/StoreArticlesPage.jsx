import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import ConfirmDialog from '../components/ConfirmDialog';
import { IndexFilters, IndexTable, useIndexTable } from '../components/data-table';
import useStoreContext from '../hooks/useStoreContext';
import { HiOutlineDocumentText, HiOutlinePlus } from '../components/workspace/WorkspaceIcons';
import { ARTICLE_STATUS_TONES, articleImage, articleTitle } from '../lib/storeArticles';

// The articles endpoint filters by status and searches title/slug; rows are always newest-updated first.
const DEFAULTS = { sort: null, perPage: 25 };
const errorText = (error) => Object.values(error.response?.data?.errors || {}).flat().join(' ') || error.response?.data?.message || error.message;

function Cover({ url }) {
    const [failed, setFailed] = useState(false);
    return <span className="ws-dt-thumb">{url && !failed ? <img src={url} alt="" loading="lazy" onError={() => setFailed(true)} /> : <HiOutlineDocumentText aria-hidden />}</span>;
}

export default function StoreArticlesPage() {
    const context = useStoreContext();
    if (!context.access?.canStorePages) return <Navigate to={`${context.uiBase}/overview`} replace />;
    return <ArticlesList context={context} />;
}

function ArticlesList({ context: { apiBase, uiBase, store, locales } }) {
    const { i18n } = useTranslation();
    const ar = i18n.language.startsWith('ar');
    const text = (a, e) => (ar ? a : e);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [reload, setReload] = useState(0);
    const [importing, setImporting] = useState(false);
    const [importOpen, setImportOpen] = useState(false);
    const [notice, setNotice] = useState('');
    const scope = useRef(apiBase); scope.current = apiBase;

    const statusLabel = (status) => ({
        draft: text('مسودة', 'Draft'), published: text('منشور', 'Published'), scheduled: text('مجدول', 'Scheduled'), archived: text('مؤرشف', 'Archived'),
    })[status] ?? status;
    const date = (value) => (value ? new Intl.DateTimeFormat(ar ? 'ar-EG' : 'en', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value)) : '—');
    const preferred = [ar ? 'ar' : 'en', locales?.default, ...(locales?.supported ?? [])];

    const columns = useMemo(() => [
        { key: 'title', header: text('المقال', 'Post'), hideable: false, primary: true,
            render: (row) => <div className="ws-dt-cell-media"><Cover key={articleImage(row, preferred) || 'empty'} url={articleImage(row, preferred)} />
                <div className="min-w-0"><Link className="ws-dt-title" to={`${uiBase}/articles/${row.id}`}>{articleTitle(row, preferred) || text('مقال بدون عنوان', 'Untitled post')}</Link>
                    <span className="ws-dt-sub" dir="ltr">/blog/{row.slug}</span></div></div> },
        { key: 'status', header: text('الحالة', 'Status'),
            render: (row) => <span className={`ws-dt-badge ${ARTICLE_STATUS_TONES[row.status] ?? ''}`}>{statusLabel(row.status)}</span> },
        { key: 'visibility', header: text('الظهور في المتجر', 'Storefront'),
            render: (row) => <span className="flex flex-wrap gap-1">
                {row.is_live ? <span className="ws-dt-badge is-success">{text('ظاهر', 'Live')}</span> : <span className="ws-dt-badge">{text('مخفي', 'Hidden')}</span>}
                {row.status !== 'draft' && row.has_unpublished_changes ? <span className="ws-dt-badge is-warning">{text('تعديلات غير منشورة', 'Unpublished changes')}</span> : null}
            </span> },
        { key: 'updated', header: text('آخر تحديث', 'Updated'), render: (row) => <span className="ws-dt-num">{date(row.updated_at)}</span> },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [ar, uiBase, locales]);

    const statuses = ['draft', 'published', 'scheduled', 'archived'];
    const filters = useMemo(() => [
        { key: 'status', label: text('الحالة', 'Status'), type: 'select', options: statuses.map((value) => ({ value, label: statusLabel(value) })) },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [ar]);
    const views = useMemo(() => [
        { id: 'all', label: text('الكل', 'All'), state: { filters: {} } },
        ...statuses.map((value) => ({ id: value, label: statusLabel(value), state: { filters: { status: value } } })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [ar]);
    const table = useIndexTable({ scope: `store:${store?.id ?? apiBase}:articles`, filters, columns, views, defaults: DEFAULTS });
    const paramsKey = JSON.stringify(table.apiParams);
    useEffect(() => {
        let active = true; setLoading(true); setError('');
        api.get(`${apiBase}/articles`, { params: table.apiParams })
            .then(({ data }) => { if (active) setResult(data); })
            .catch((e) => { if (active) setError(errorText(e)); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiBase, paramsKey, reload]);
    useEffect(() => { setResult(null); }, [apiBase]);

    const rows = result?.data ?? [];
    // Laravel paginator fields sit at the top level of this response.
    const meta = result ? { total: result.total, last_page: result.last_page } : null;
    const legacyCount = Number(result?.legacy_count ?? 0);

    const runImport = async () => {
        const origin = scope.current;
        setImporting(true);
        try {
            const { data } = await api.post(`${apiBase}/articles/import-legacy`);
            if (scope.current !== origin) return;
            setImportOpen(false);
            setNotice(text(`تم نقل ${data.imported ?? 0} مقال إلى المدونة الجديدة.`, `${data.imported ?? 0} posts moved to the new blog.`));
            setReload((value) => value + 1);
        } catch (e) {
            setImportOpen(false);
            setError(errorText(e));
        } finally {
            setImporting(false);
        }
    };

    const newPost = <Link to={`${uiBase}/articles/new`} className="ws-dt-button ws-dt-button-primary"><HiOutlinePlus aria-hidden />{text('اكتب أول مقال', 'Write your first post')}</Link>;

    return (
        <section className="ws-catalog-page">
            <header className="ws-catalog-heading">
                <div>
                    <h1>{text('المقالات', 'Blog posts')}</h1>
                    <p>{text('اكتب مقالات المدونة وانشرها في متجرك على /blog.', 'Write blog posts and publish them on your store at /blog.')}</p>
                </div>
                <div className="ws-catalog-actions">
                    <Link to={`${uiBase}/articles/new`} className="ws-dt-button ws-dt-button-primary"><HiOutlinePlus aria-hidden />{text('مقال جديد', 'New post')}</Link>
                </div>
            </header>

            {notice ? <p role="status" className="mb-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p> : null}
            {legacyCount > 0 ? <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <p>{text(`لديك ${legacyCount} مقال في صفحة المدونة القديمة. انقلها لتعديلها هنا.`, `You have ${legacyCount} posts in the old blog page. Move them here to edit them.`)}</p>
                <button type="button" className="ws-dt-button" onClick={() => setImportOpen(true)}>{text('نقل المقالات القديمة', 'Move old posts')}</button>
            </div> : null}

            <div className="ws-dt-card">
                <IndexFilters table={table} searchPlaceholder={text('ابحث بالعنوان أو الرابط', 'Search by title or URL')} />
                <IndexTable table={table} rows={rows} loading={loading} error={error} onRetry={() => setReload((value) => value + 1)} meta={meta}
                    label={text('المقالات', 'Blog posts')} rowHref={(row) => `${uiBase}/articles/${row.id}`}
                    emptyState={{ icon: HiOutlineDocumentText, title: text('لا توجد مقالات بعد', 'No blog posts yet'),
                        description: text('شارك أخبار متجرك ونصائحك مع عملائك وحسّن ظهورك في محركات البحث.', 'Share store news and tips with your customers and help search engines find you.'),
                        action: newPost }} />
            </div>

            <ConfirmDialog
                open={importOpen}
                onClose={() => setImportOpen(false)}
                title={text('نقل المقالات القديمة', 'Move old posts')}
                body={text('ستُنقل مقالات صفحة المدونة القديمة إلى هنا مع الحفاظ على روابطها وحالة نشرها. تُحفظ نسخة احتياطية من المحتوى الأصلي.', 'Posts from the old blog page move here with the same URLs and publish state. A backup of the original content is kept.')}
                confirmLabel={text('نقل', 'Move posts')}
                cancelLabel={text('إلغاء', 'Cancel')}
                loading={importing}
                onConfirm={runImport}
            />
        </section>
    );
}
