import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams, useOutletContext } from 'react-router-dom';
import useStoreScope from '../hooks/useStoreScope';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../api/client';
import SearchableSelect from '../components/ui/SearchableSelect';
import { commit, createHistory, isPreviewMessage, redo, reorder, undo, VIEWPORT_WIDTH } from '../apps/storefront/platform/studio/editor-domain';

function SectionSettings({ schema, value, onChange, viewport }) {
    const fields = schema?.settings ?? [];
    if (!fields.length) return <p className="text-xs text-slate-400">No settings.</p>;
    const set = (field, nextValue) => {
        if (!field.responsive || viewport === 'desktop') {
            onChange({ ...value, [field.id]: nextValue });
            return;
        }
        onChange({ ...value, __responsive: { ...(value.__responsive || {}), [field.id]: { ...(value.__responsive?.[field.id] || {}), [viewport]: nextValue } } });
    };
    return (
        <div className="space-y-2">
            {fields.map((f) => {
                const v = f.responsive && viewport !== 'desktop' ? value?.__responsive?.[f.id]?.[viewport] ?? value?.[f.id] : value?.[f.id];
                const cls = 'w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm';
                return (
                    <div key={f.id}>
                        <label className="mb-0.5 flex items-center justify-between text-[11px] font-medium text-slate-500"><span>{f.label || f.id}</span>{f.responsive && <span className="rounded bg-slate-100 px-1.5 py-0.5 uppercase">{viewport}</span>}</label>
                        {f.type === 'toggle' ? (
                            <input type="checkbox" checked={!!v} onChange={(e) => set(f, e.target.checked)} />
                        ) : f.type === 'textarea' || f.type === 'richtext' ? (
                            <textarea rows={2} value={v ?? ''} onChange={(e) => set(f, e.target.value)} className={cls} />
                        ) : f.type === 'select' ? (
                            <SearchableSelect value={v ?? ''} onChange={(e) => set(f, e.target.value)} className="w-full">
                                {(f.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
                            </SearchableSelect>
                        ) : f.type === 'number' || f.type === 'range' ? (
                            <input type="number" min={f.min} max={f.max} step={f.step} value={v ?? ''} onChange={(e) => set(f, e.target.value === '' ? '' : Number(e.target.value))} className={cls} />
                        ) : f.type === 'color' ? (
                            <input type="color" value={v || '#000000'} onChange={(e) => set(f, e.target.value)} />
                        ) : (
                            <input type="text" value={v ?? ''} onChange={(e) => set(f, e.target.value)} className={cls} />
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
    const [history, setHistory] = useState(() => createHistory([]));
    const sections = history.present;
    const [revisions, setRevisions] = useState([]);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState('');
    const [previewUrl, setPreviewUrl] = useState('');
    const [viewport, setViewport] = useState('desktop');
    const [locale, setLocale] = useState('ar');
    const [selected, setSelected] = useState(null);
    const [dragIndex, setDragIndex] = useState(null);
    const hydrated = useRef(false);
    const previewFrame = useRef(null);
    const [previewVersion, setPreviewVersion] = useState(0);

    const load = useCallback(() => {
        Promise.all([
            api.get(`${apiBase}/pages/${pageId}`),
            api.get(`${apiBase}/pages/schema`),
            api.get(`${apiBase}/pages/${pageId}/revisions`),
        ]).then(([pg, sc, rv]) => {
            setPage(pg.data.data);
            const loaded = (pg.data.data.sections ?? []).map((s) => ({
                id: String(s.id ?? crypto.randomUUID()), type: s.type, settings: s.settings ?? {},
                reusable_section_id: s.reusable_section_id ?? null, is_visible: s.is_visible ?? true,
            }));
            setHistory(createHistory(loaded));
            setLocale(pg.data.data.locale === 'en' ? 'en' : 'ar');
            setSchema(sc.data.sections_schema ?? {});
            setRevisions(rv.data.data ?? []);
        }).catch((e) => setErr(e.response?.data?.message || e.message));
    }, [apiBase, pageId]);

    useEffect(() => { load(); }, [load]);

    const types = useMemo(() => Object.keys(schema), [schema]);
    const changeSections = (recipe) => setHistory((current) => commit(current, recipe(current.present)));
    const move = (i, dir) => changeSections((prev) => reorder(prev, i, i + dir));
    const duplicate = (i) => changeSections((prev) => { const n = [...prev]; n.splice(i + 1, 0, { ...structuredClone(prev[i]), id: crypto.randomUUID() }); return n; });
    const remove = (i) => changeSections((prev) => prev.filter((_, j) => j !== i));
    const add = (type) => changeSections((prev) => [...prev, { id: crypto.randomUUID(), type, settings: {}, reusable_section_id: null, is_visible: true }]);
    const editSettings = (i, settings) => changeSections((prev) => prev.map((s, j) => (j === i ? { ...s, settings } : s)));
    const toggleVisibility = (i) => changeSections((prev) => prev.map((s, j) => (j === i ? { ...s, is_visible: !s.is_visible } : s)));

    const saveSections = () => run(async () => {
        await api.put(`${apiBase}/pages/${pageId}/sections`, { sections: sections.map(({ id: _id, ...section }) => section) });
        toast.success(t('page_sections_saved', 'Layout saved'));
        load();
    });
    const savePage = () => run(async () => {
        await api.put(`${apiBase}/pages/${pageId}`, { title: page.title, slug: page.slug, template: page.template, seo: page.seo || {} });
        toast.success(t('page_saved', 'Saved'));
    });
    const restore = (rid) => run(async () => { await api.post(`${apiBase}/pages/${pageId}/revisions/${rid}/restore`); toast.success(t('page_restored', 'Restored')); load(); });
    const preview = async () => {
        try { const { data } = await api.post(`${apiBase}/pages/${pageId}/preview`); setPreviewUrl(data.preview_url); }
        catch (e) { toast.error(e.response?.data?.message || e.message); }
    };
    async function run(fn) { setSaving(true); try { await fn(); } catch (e) { toast.error(e.response?.data?.message || e.message); } finally { setSaving(false); } }

    useEffect(() => {
        if (!page || !hydrated.current) { hydrated.current = true; return undefined; }
        const timer = window.setTimeout(() => {
            api.put(`${apiBase}/pages/${pageId}/sections`, { sections: sections.map(({ id: _id, ...section }) => section) })
                .then(() => setPreviewVersion((value) => value + 1)).catch(() => undefined);
        }, 900);
        return () => window.clearTimeout(timer);
    }, [apiBase, pageId, sections, page]);

    const sendPreviewState = useCallback(() => {
        previewFrame.current?.contentWindow?.postMessage({ channel: 'sellchaze-theme-studio', version: 1, type: 'hydrate', payload: { sections, locale, path: `/pages/${page?.slug || ''}` } }, window.location.origin);
    }, [locale, page?.slug, sections]);

    useEffect(() => {
        const receive = (event) => {
            if (event.origin !== window.location.origin || event.source !== previewFrame.current?.contentWindow || !isPreviewMessage(event.data)) return;
            if (event.data.type === 'ready') sendPreviewState();
            if (event.data.type === 'section-selected') setSelected(event.data.payload.id);
        };
        window.addEventListener('message', receive);
        return () => window.removeEventListener('message', receive);
    }, [sendPreviewState]);

    useEffect(() => { sendPreviewState(); }, [sendPreviewState]);

    if (id && !can('stores-edit')) return <Navigate to="/stores" replace />;
    if (!page) return <p className="p-6 text-sm text-slate-500">…</p>;

    const field = 'w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm';

    return (
        <div className="mx-auto max-w-5xl space-y-5">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-slate-900">{t('page_builder', 'Page builder')}: {page.title}</h1>
                <div className="flex gap-2">
                    <button type="button" onClick={() => setHistory(undo(history))} disabled={!history.past.length} className="rounded-xl border border-slate-200 px-3 py-2 text-sm disabled:opacity-40">Undo</button>
                    <button type="button" onClick={() => setHistory(redo(history))} disabled={!history.future.length} className="rounded-xl border border-slate-200 px-3 py-2 text-sm disabled:opacity-40">Redo</button>
                    <button type="button" onClick={preview} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">{t('theme_preview', 'Preview')}</button>
                    <button type="button" onClick={() => navigate(`${uiBase}/pages`)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">{t('cancel', 'Back')}</button>
                </div>
            </div>
            {err && <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}

            <div className="grid gap-5 lg:grid-cols-3">
                {/* Sections (builder) */}
                <div className="space-y-3 lg:col-span-2">
                    {sections.map((s, i) => (
                        <div key={s.id} draggable onDragStart={() => setDragIndex(i)} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (dragIndex !== null) changeSections((prev) => reorder(prev, dragIndex, i)); setDragIndex(null); }} onClick={() => setSelected(s.id)} className={`rounded-2xl border bg-white p-4 shadow-card ${selected === s.id ? 'border-brand ring-2 ring-brand/20' : 'border-slate-200/80'} ${s.is_visible ? '' : 'opacity-50'}`}>
                            <div className="mb-2 flex items-center justify-between">
                                <strong className="text-sm">{s.type}{s.reusable_section_id ? ' (reusable)' : ''}</strong>
                                <div className="flex gap-1 text-xs">
                                    <button type="button" onClick={() => move(i, -1)} className="rounded-sm border px-2 py-1">↑</button>
                                    <button type="button" onClick={() => move(i, 1)} className="rounded-sm border px-2 py-1">↓</button>
                                    <button type="button" onClick={() => duplicate(i)} className="rounded-sm border px-2 py-1">copy</button>
                                    <button type="button" onClick={() => toggleVisibility(i)} className="rounded-sm border px-2 py-1">{s.is_visible ? 'hide' : 'show'}</button>
                                    <button type="button" onClick={() => remove(i)} className="rounded-sm border px-2 py-1 text-red-600">×</button>
                                </div>
                            </div>
                            {!s.reusable_section_id && <SectionSettings schema={schema[s.type]} value={s.settings} onChange={(v) => editSettings(i, v)} viewport={viewport} />}
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
                        <SearchableSelect value={page.template} onChange={(e) => setPage({ ...page, template: e.target.value })} className="w-full">
                            <option value="page">page</option><option value="landing">landing</option>
                        </SearchableSelect>
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

            <section className="rounded-2xl border border-slate-200 bg-slate-100 p-3 shadow-card" aria-label="Live storefront canvas">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                    {Object.keys(VIEWPORT_WIDTH).map((mode) => <button key={mode} type="button" onClick={() => setViewport(mode)} className={`rounded-lg px-3 py-1.5 text-xs ${viewport === mode ? 'bg-brand text-white' : 'bg-white'}`}>{mode}</button>)}
                    {['ar', 'en'].map((lang) => <button key={lang} type="button" onClick={() => setLocale(lang)} className={`rounded-lg px-3 py-1.5 text-xs ${locale === lang ? 'bg-slate-800 text-white' : 'bg-white'}`}>{lang.toUpperCase()}</button>)}
                    <code className="ms-auto text-xs text-slate-500">/pages/{page.slug}</code>
                </div>
                {previewUrl ? (
                    <div className="mx-auto overflow-hidden rounded-xl bg-white shadow-lg transition-[width]" style={{ width: `min(100%, ${VIEWPORT_WIDTH[viewport]}px)` }}>
                        <iframe key={previewVersion} ref={previewFrame} onLoad={sendPreviewState} title="Live page preview" src={`${previewUrl}${previewUrl.includes('?') ? '&' : '?'}locale=${locale}`} className="h-[720px] w-full border-0" sandbox="allow-forms allow-same-origin allow-scripts" />
                    </div>
                ) : <button type="button" onClick={preview} className="mx-auto block rounded-xl bg-white px-5 py-3 text-sm font-semibold">Load live canvas</button>}
            </section>
        </div>
    );
}
