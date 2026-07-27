import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
    HiOutlinePencilSquare,
    HiOutlinePlus,
    HiOutlineTrash,
    HiOutlineEye,
    HiOutlineEyeSlash,
} from 'react-icons/hi2';
import api from '../api/client';
import SearchableSelect from '../components/ui/SearchableSelect';
import { useDebounced } from '../hooks/useDebounced';
import ConfirmDialog from '../components/ConfirmDialog';

export default function AdminArticlesPage() {
    const { t, i18n } = useTranslation();
    const isAr = (i18n.language || '').toLowerCase().startsWith('ar');
    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState(null);
    const [page, setPage] = useState(1);
    const [perPage] = useState(15);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState(''); // '' | 'published' | 'draft'
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState('');
    const [confirmDel, setConfirmDel] = useState(null);
    const debouncedSearch = useDebounced(search, 350);

    const load = useCallback(async () => {
        try {
            setLoading(true);
            setErr('');
            const { data } = await api.get('/admin/articles', {
                params: { page, per_page: perPage, q: debouncedSearch || undefined, status: status || undefined },
            });
            setRows(data.data ?? []);
            setMeta(data.meta ?? null);
        } catch (e) {
            setErr(e.response?.data?.message || e.message);
        } finally {
            setLoading(false);
        }
    }, [page, perPage, debouncedSearch, status]);

    useEffect(() => {
        load();
    }, [load]);

    async function togglePublish(row) {
        try {
            await api.post(`/admin/articles/${row.id}/${row.published ? 'unpublish' : 'publish'}`);
            toast.success(t('saved', 'Saved'));
            load();
        } catch (e) {
            toast.error(e.response?.data?.message || e.message);
        }
    }

    async function doDelete() {
        if (!confirmDel) return;
        try {
            await api.delete(`/admin/articles/${confirmDel.id}`);
            toast.success(t('deleted', 'Deleted'));
            setConfirmDel(null);
            load();
        } catch (e) {
            toast.error(e.response?.data?.message || e.message);
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

            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
                <input
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                    }}
                    placeholder={t('search', 'Search')}
                    className="min-w-64 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-hidden"
                />
                <SearchableSelect
                    value={status}
                    onChange={(e) => {
                        setStatus(e.target.value);
                        setPage(1);
                    }}
                    className="w-full sm:w-56"
                >
                    <option value="">{t('all', 'All')}</option>
                    <option value="published">{t('published', 'Published')}</option>
                    <option value="draft">{t('draft', 'Draft')}</option>
                </SearchableSelect>
            </div>

            {err ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>
            ) : null}

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                            <th className="px-4 py-3 text-start">{t('admin_articles_col_title', 'Title')}</th>
                            <th className="px-4 py-3 text-start">{t('admin_articles_col_author', 'Author')}</th>
                            <th className="px-4 py-3 text-start">{t('admin_articles_col_status', 'Status')}</th>
                            <th className="px-4 py-3 text-start">{t('admin_articles_col_published_at', 'Published at')}</th>
                            <th className="px-4 py-3 text-end">{t('actions', 'Actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                                    {t('loading', 'Loading…')}
                                </td>
                            </tr>
                        ) : rows.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                                    {t('admin_articles_empty', 'No articles yet.')}
                                </td>
                            </tr>
                        ) : (
                            rows.map((a) => (
                                <tr key={a.id}>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            {a.featured_image_thumb_url ? (
                                                <img
                                                    src={a.featured_image_thumb_url}
                                                    alt=""
                                                    className="h-12 w-16 rounded-sm object-cover"
                                                />
                                            ) : (
                                                <div className="h-12 w-16 rounded-sm bg-slate-100" />
                                            )}
                                            <div>
                                                <div className="font-medium text-slate-900">
                                                    {(isAr && a.title_ar) ? a.title_ar : a.title}
                                                </div>
                                                <div className="text-xs text-slate-500">/{a.slug}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-700">{a.author?.name ?? '—'}</td>
                                    <td className="px-4 py-3">
                                        {a.published ? (
                                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                                                {t('published', 'Published')}
                                            </span>
                                        ) : (
                                            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                                                {t('draft', 'Draft')}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-slate-500">
                                        {a.published_at ? new Date(a.published_at).toLocaleString() : '—'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                type="button"
                                                onClick={() => togglePublish(a)}
                                                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                                                title={a.published ? t('unpublish', 'Unpublish') : t('publish', 'Publish')}
                                            >
                                                {a.published ? <HiOutlineEyeSlash className="h-4 w-4" /> : <HiOutlineEye className="h-4 w-4" />}
                                            </button>
                                            <Link
                                                to={`/admin/articles/${a.id}/edit`}
                                                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                                                title={t('edit', 'Edit')}
                                            >
                                                <HiOutlinePencilSquare className="h-4 w-4" />
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => setConfirmDel(a)}
                                                className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                                                title={t('delete', 'Delete')}
                                            >
                                                <HiOutlineTrash className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {meta && meta.last_page > 1 ? (
                <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>
                        {t('page', 'Page')} {meta.current_page} / {meta.last_page}
                    </span>
                    <div className="flex gap-2">
                        <button
                            disabled={page <= 1}
                            onClick={() => setPage((p) => p - 1)}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-50"
                        >
                            {t('previous', 'Previous')}
                        </button>
                        <button
                            disabled={page >= meta.last_page}
                            onClick={() => setPage((p) => p + 1)}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-50"
                        >
                            {t('next', 'Next')}
                        </button>
                    </div>
                </div>
            ) : null}

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
