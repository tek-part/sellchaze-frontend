import { useCallback, useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams, useOutletContext } from 'react-router-dom';
import useStoreScope from '../hooks/useStoreScope';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../api/client';

const STATUS_STYLE = {
    published: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    draft: 'bg-slate-100 text-slate-600 border-slate-200',
    scheduled: 'bg-amber-50 text-amber-700 border-amber-100',
};

export default function StorePagesPage() {
    const { id, apiBase, uiBase } = useStoreScope();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { permissions } = useOutletContext();
    const can = (p) => permissions.includes(p);

    const [pages, setPages] = useState([]);
    const [title, setTitle] = useState('');
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState('');

    const load = useCallback(() => {
        api.get(`${apiBase}/pages`)
            .then(({ data }) => setPages(data.data ?? []))
            .catch((e) => setErr(e.response?.data?.message || e.message));
    }, [id]);

    useEffect(() => { load(); }, [load]);

    if (id && !can('stores-edit')) return <Navigate to="/stores" replace />;

    const act = async (fn, msg) => {
        setBusy(true);
        try { await fn(); if (msg) toast.success(msg); load(); }
        catch (e) { toast.error(e.response?.data?.message || e.message); }
        finally { setBusy(false); }
    };

    const create = () => {
        if (!title.trim()) return;
        act(async () => {
            const { data } = await api.post(`${apiBase}/pages`, { title });
            setTitle('');
            navigate(`${uiBase}/pages/${data.data.id}/builder`);
        });
    };

    const publish = (pid, unpub) => act(() => api.post(`${apiBase}/pages/${pid}/${unpub ? 'unpublish' : 'publish'}`), t('page_saved', 'Saved'));
    const remove = (pid) => act(() => api.delete(`${apiBase}/pages/${pid}`), t('action_delete', 'Deleted'));
    const preview = async (pid) => {
        try {
            const { data } = await api.post(`${apiBase}/pages/${pid}/preview`);
            window.open(data.preview_url, '_blank', 'noopener');
        } catch (e) { toast.error(e.response?.data?.message || e.message); }
    };

    return (
        <div className="mx-auto max-w-3xl space-y-5">
            <div className="flex items-center justify-between">
                <div className="border-s-4 border-brand ps-4">
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t('pages_title', 'Pages')}</h1>
                    <p className="mt-1 text-sm text-slate-500">{t('pages_subtitle', 'Build landing pages and campaigns visually.')}</p>
                </div>
                <button type="button" onClick={() => navigate(`${uiBase}/menus`)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                    {t('menus_title', 'Menus')}
                </button>
            </div>

            {err && <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}

            <div className="flex gap-2">
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('page_title_placeholder', 'New page title')}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" onKeyDown={(e) => e.key === 'Enter' && create()} />
                <button type="button" disabled={busy} onClick={create} className="whitespace-nowrap rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                    {t('page_create', 'Create')}
                </button>
            </div>

            <div className="space-y-2">
                {pages.map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card">
                        <div>
                            <div className="flex items-center gap-2">
                                <strong className="text-slate-900">{p.title}</strong>
                                <span className="text-xs text-slate-400">/pages/{p.slug}</span>
                                <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[p.status]}`}>{p.status}</span>
                                <span className="text-xs text-slate-400">{p.template}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <button type="button" onClick={() => navigate(`${uiBase}/pages/${p.id}/builder`)} className="rounded-lg bg-brand px-3 py-1.5 font-semibold text-white">{t('page_edit', 'Edit')}</button>
                            <button type="button" onClick={() => preview(p.id)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-700">{t('theme_preview', 'Preview')}</button>
                            <button type="button" onClick={() => publish(p.id, p.status === 'published')} className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-700">
                                {p.status === 'published' ? t('page_unpublish', 'Unpublish') : t('theme_publish', 'Publish')}
                            </button>
                            <button type="button" onClick={() => remove(p.id)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-red-600">×</button>
                        </div>
                    </div>
                ))}
                {pages.length === 0 && <p className="text-sm text-slate-500">{t('empty', 'Nothing here yet.')}</p>}
            </div>

            {id ? <button type="button" onClick={() => navigate('/stores')} className="text-sm text-slate-500 hover:underline">← {t('stores_title', 'Stores')}</button> : null}
        </div>
    );
}
