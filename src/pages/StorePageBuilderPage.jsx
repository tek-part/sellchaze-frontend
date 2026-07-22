import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams, useOutletContext } from 'react-router-dom';
import useStoreScope from '../hooks/useStoreScope';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../api/client';

function SectionSettings({ schema, value, onChange }) {
    const fields = schema?.settings ?? [];
    if (!fields.length) return <p className="text-xs text-slate-400">No settings.</p>;
    const set = (k, v) => onChange({ ...value, [k]: v });
    return (
        <div className="space-y-2">
            {fields.map((f) => {
                const v = value?.[f.id];
                const cls = 'w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm';
                return (
                    <div key={f.id}>
                        <label className="mb-0.5 block text-[11px] font-medium text-slate-500">{f.label || f.id}</label>
                        {f.type === 'toggle' ? (
                            <input type="checkbox" checked={!!v} onChange={(e) => set(f.id, e.target.checked)} />
                        ) : f.type === 'textarea' || f.type === 'richtext' ? (
                            <textarea rows={2} value={v ?? ''} onChange={(e) => set(f.id, e.target.value)} className={cls} />
                        ) : f.type === 'select' ? (
                            <select value={v ?? ''} onChange={(e) => set(f.id, e.target.value)} className={cls}>
                                {(f.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
                            </select>
                        ) : f.type === 'number' || f.type === 'range' ? (
                            <input type="number" value={v ?? ''} onChange={(e) => set(f.id, e.target.value === '' ? '' : Number(e.target.value))} className={cls} />
                        ) : f.type === 'color' ? (
                            <input type="color" value={v || '#000000'} onChange={(e) => set(f.id, e.target.value)} />
                        ) : (
                            <input type="text" value={v ?? ''} onChange={(e) => set(f.id, e.target.value)} className={cls} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default function StorePageBuilderPage() {
    const { pageId } = useParams();
    const { id, apiBase, uiBase } = useStoreScope();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { permissions } = useOutletContext();
    const can = (p) => permissions.includes(p);

    const [page, setPage] = useState(null);
    const [schema, setSchema] = useState({});
    const [sections, setSections] = useState([]);
    const [revisions, setRevisions] = useState([]);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState('');

    const load = useCallback(() => {
        Promise.all([
            api.get(`${apiBase}/pages/${pageId}`),
            api.get(`${apiBase}/pages/schema`),
            api.get(`${apiBase}/pages/${pageId}/revisions`),
        ]).then(([pg, sc, rv]) => {
            setPage(pg.data.data);
            setSections((pg.data.data.sections ?? []).map((s) => ({ type: s.type, settings: s.settings ?? {}, reusable_section_id: s.reusable_section_id ?? null })));
            setSchema(sc.data.sections_schema ?? {});
            setRevisions(rv.data.data ?? []);
        }).catch((e) => setErr(e.response?.data?.message || e.message));
    }, [id, pageId]);

    useEffect(() => { load(); }, [load]);

    const types = useMemo(() => Object.keys(schema), [schema]);
    if (id && !can('stores-edit')) return <Navigate to="/stores" replace />;
    if (!page) return <p className="p-6 text-sm text-slate-500">…</p>;

    const move = (i, dir) => setSections((prev) => {
        const next = [...prev]; const j = i + dir;
        if (j < 0 || j >= next.length) return prev;
        [next[i], next[j]] = [next[j], next[i]];
        return next;
    });
    const duplicate = (i) => setSections((prev) => { const n = [...prev]; n.splice(i + 1, 0, JSON.parse(JSON.stringify(prev[i]))); return n; });
    const remove = (i) => setSections((prev) => prev.filter((_, j) => j !== i));
    const add = (type) => setSections((prev) => [...prev, { type, settings: {}, reusable_section_id: null }]);
    const editSettings = (i, settings) => setSections((prev) => prev.map((s, j) => (j === i ? { ...s, settings } : s)));

    const saveSections = () => run(async () => {
        await api.put(`${apiBase}/pages/${pageId}/sections`, { sections });
        toast.success(t('page_sections_saved', 'Layout saved'));
        load();
    });
    const savePage = () => run(async () => {
        await api.put(`${apiBase}/pages/${pageId}`, { title: page.title, slug: page.slug, template: page.template, seo: page.seo || {} });
        toast.success(t('page_saved', 'Saved'));
    });
    const restore = (rid) => run(async () => { await api.post(`${apiBase}/pages/${pageId}/revisions/${rid}/restore`); toast.success(t('page_restored', 'Restored')); load(); });
    const preview = async () => {
        try { const { data } = await api.post(`${apiBase}/pages/${pageId}/preview`); window.open(data.preview_url, '_blank', 'noopener'); }
        catch (e) { toast.error(e.response?.data?.message || e.message); }
    };
    async function run(fn) { setSaving(true); try { await fn(); } catch (e) { toast.error(e.response?.data?.message || e.message); } finally { setSaving(false); } }

    const field = 'w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm';

    return (
        <div className="mx-auto max-w-5xl space-y-5">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-slate-900">{t('page_builder', 'Page builder')}: {page.title}</h1>
                <div className="flex gap-2">
                    <button type="button" onClick={preview} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">{t('theme_preview', 'Preview')}</button>
                    <button type="button" onClick={() => navigate(`${uiBase}/pages`)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">{t('cancel', 'Back')}</button>
                </div>
            </div>
            {err && <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}

            <div className="grid gap-5 lg:grid-cols-3">
                {/* Sections (builder) */}
                <div className="space-y-3 lg:col-span-2">
                    {sections.map((s, i) => (
                        <div key={i} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card">
                            <div className="mb-2 flex items-center justify-between">
                                <strong className="text-sm">{s.type}{s.reusable_section_id ? ' (reusable)' : ''}</strong>
                                <div className="flex gap-1 text-xs">
                                    <button type="button" onClick={() => move(i, -1)} className="rounded-sm border px-2 py-1">↑</button>
                                    <button type="button" onClick={() => move(i, 1)} className="rounded-sm border px-2 py-1">↓</button>
                                    <button type="button" onClick={() => duplicate(i)} className="rounded-sm border px-2 py-1">copy</button>
                                    <button type="button" onClick={() => remove(i)} className="rounded-sm border px-2 py-1 text-red-600">×</button>
                                </div>
                            </div>
                            {!s.reusable_section_id && <SectionSettings schema={schema[s.type]} value={s.settings} onChange={(v) => editSettings(i, v)} />}
                        </div>
                    ))}
                    {sections.length === 0 && <p className="text-sm text-slate-500">{t('page_no_sections', 'No sections yet — add one from the right.')}</p>}
                    <button type="button" disabled={saving} onClick={saveSections} className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                        {t('page_save_layout', 'Save layout')}
                    </button>
                </div>

                {/* Right rail: add sections, page settings, revisions */}
                <div className="space-y-5">
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card">
                        <h3 className="mb-2 text-sm font-semibold">{t('page_add_section', 'Add section')}</h3>
                        <div className="flex flex-wrap gap-1">
                            {types.map((tp) => (
                                <button key={tp} type="button" onClick={() => add(tp)} className="rounded-lg border border-slate-200 px-2 py-1 text-xs hover:bg-slate-50">{tp}</button>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card space-y-2">
                        <h3 className="text-sm font-semibold">{t('page_settings', 'Page settings')}</h3>
                        <input value={page.title} onChange={(e) => setPage({ ...page, title: e.target.value })} placeholder="Title" className={field} />
                        <input value={page.slug} onChange={(e) => setPage({ ...page, slug: e.target.value })} placeholder="slug" className={field} />
                        <select value={page.template} onChange={(e) => setPage({ ...page, template: e.target.value })} className={field}>
                            <option value="page">page</option><option value="landing">landing</option>
                        </select>
                        <input value={page.seo?.title ?? ''} onChange={(e) => setPage({ ...page, seo: { ...(page.seo || {}), title: e.target.value } })} placeholder="SEO title" className={field} />
                        <textarea rows={2} value={page.seo?.description ?? ''} onChange={(e) => setPage({ ...page, seo: { ...(page.seo || {}), description: e.target.value } })} placeholder="SEO description" className={field} />
                        <button type="button" disabled={saving} onClick={savePage} className="w-full rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">
                            {t('page_save_settings', 'Save settings')}
                        </button>
                    </div>

                    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card">
                        <h3 className="mb-2 text-sm font-semibold">{t('page_revisions', 'Revisions')}</h3>
                        <div className="space-y-1">
                            {revisions.map((r) => (
                                <div key={r.id} className="flex items-center justify-between text-xs">
                                    <span className="text-slate-500">#{r.revision_number} · {r.sections_count} sections</span>
                                    <button type="button" onClick={() => restore(r.id)} className="rounded-sm border px-2 py-0.5">{t('page_restore', 'Restore')}</button>
                                </div>
                            ))}
                            {revisions.length === 0 && <p className="text-xs text-slate-400">No revisions yet.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
