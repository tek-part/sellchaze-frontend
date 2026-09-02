import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams, useOutletContext } from 'react-router-dom';
import useStoreScope from '../hooks/useStoreScope';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../api/client';
import SearchableSelect from '../components/ui/SearchableSelect';
import StoreMediaPicker from '../components/store/StoreMediaPicker';

/** Flatten settings_schema groups -> field list. */
function fieldsOf(schema) {
    return (schema || []).flatMap((g) => (g.fields || []).map((f) => ({ ...f, group: g.label })));
}

function defaultsOf(schema) {
    const out = {};
    fieldsOf(schema).forEach((f) => {
        out[f.id] = f.default ?? (f.type === 'toggle' ? false : '');
    });
    return out;
}

/** Client-side live validation (mirrors the server ThemeSettingsValidator). */
function validate(field, value) {
    if (field.type === 'url' && value && !/^https?:\/\/.+/.test(value)) return 'Must be a valid URL';
    if ((field.type === 'number' || field.type === 'range') && value !== '' && Number.isNaN(Number(value))) return 'Must be a number';
    if (field.type === 'select' && field.options && value && !field.options.includes(value)) return 'Invalid option';
    return null;
}

export default function StoreThemeSettingsPage() {
    const { themeId } = useParams();
    const { id, apiBase, uiBase } = useStoreScope();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { permissions } = useOutletContext();
    const can = (p) => permissions.includes(p);

    const [schema, setSchema] = useState([]);
    const [values, setValues] = useState({});
    const [themeName, setThemeName] = useState('');
    const [themeKey, setThemeKey] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savedValues, setSavedValues] = useState({});
    const [saveStatus, setSaveStatus] = useState('saved');
    const [revisions, setRevisions] = useState([]);
    const [err, setErr] = useState('');
    const [previewBaseUrl, setPreviewBaseUrl] = useState('');
    const [previewError, setPreviewError] = useState('');
    const [device, setDevice] = useState('desktop');
    const [publishing, setPublishing] = useState(false);
    const [hasUnpublishedChanges, setHasUnpublishedChanges] = useState(false);
    const [publishedAt, setPublishedAt] = useState(null);

    const loadRevisions = useCallback(async () => {
        try {
            const { data } = await api.get(`${apiBase}/themes/${themeId}/revisions`);
            setRevisions(data.data || []);
        } catch { setRevisions([]); }
    }, [apiBase, themeId]);

    const load = useCallback(() => {
        setLoading(true);
        api.get(`${apiBase}/themes/${themeId}`)
            .then(({ data }) => {
                const s = data.version?.settings_schema ?? [];
                setSchema(s);
                setThemeName(data.theme?.name ?? '');
                setThemeKey(data.theme?.key ?? '');
                const loaded = { ...defaultsOf(s), ...(data.install?.draft_settings ?? data.install?.settings ?? {}) };
                setValues(loaded);
                setSavedValues(loaded);
                setHasUnpublishedChanges(!!data.install?.has_unpublished_changes);
                setPublishedAt(data.install?.published_at ?? null);
                return api.post(`${apiBase}/themes/preview`, { theme_id: Number(themeId) });
            })
            .then(({ data }) => {
                setPreviewBaseUrl(data.preview_url || '');
                setPreviewError(data.preview_url ? '' : t('theme_preview_failed', 'Preview URL was not returned.'));
            })
            .catch((e) => setErr(e.response?.data?.message || e.message))
            .finally(() => setLoading(false));
    }, [apiBase, themeId]);

    useEffect(() => {
        load();
        loadRevisions();
    }, [load, loadRevisions]);

    const fields = useMemo(() => fieldsOf(schema), [schema]);
    const livePreviewUrl = useMemo(() => {
        if (!themeKey || !previewBaseUrl) return '';
        const encoded = btoa(encodeURIComponent(JSON.stringify(values)));
        const url = new URL(previewBaseUrl);
        url.searchParams.set('theme', themeKey);
        url.searchParams.set('preview', '1');
        url.searchParams.set('settings', encoded);
        return url.toString();
    }, [previewBaseUrl, themeKey, values]);
    const errors = useMemo(() => {
        const e = {};
        fields.forEach((f) => {
            const msg = validate(f, values[f.id]);
            if (msg) e[f.id] = msg;
        });
        return e;
    }, [fields, values]);
    const hasErrors = Object.keys(errors).length > 0;

    const setValue = (fid, v) => setValues((prev) => ({ ...prev, [fid]: v }));

    const persist = useCallback(async (snapshot, source, notify = false) => {
        setSaving(true);
        setSaveStatus('saving');
        try {
            // POST is an explicit backend alias because some production
            // proxies do not preserve PUT before PHP receives it.
            await api.post(`${apiBase}/themes/settings`, { theme_id: Number(themeId), settings: snapshot, source });
            setSavedValues(snapshot);
            setSaveStatus('saved');
            setHasUnpublishedChanges(true);
            await loadRevisions();
            if (notify) toast.success(t('theme_settings_saved', 'Settings saved'));
            return true;
        } catch (e) {
            setSaveStatus('error');
            const serverErrors = e.response?.data?.errors?.settings;
            if (notify) toast.error(Array.isArray(serverErrors) ? serverErrors.join(', ') : e.response?.data?.message || e.message);
            return false;
        } finally {
            setSaving(false);
        }
    }, [apiBase, loadRevisions, t, themeId]);

    useEffect(() => {
        if (loading || hasErrors || JSON.stringify(values) === JSON.stringify(savedValues)) return undefined;
        setSaveStatus('pending');
        const snapshot = values;
        const timer = window.setTimeout(() => { persist(snapshot, 'autosave'); }, 900);
        return () => window.clearTimeout(timer);
    }, [hasErrors, loading, persist, savedValues, values]);

    const save = async () => {
        if (hasErrors) return;
        await persist(values, 'manual', true);
    };

    const publish = async () => {
        if (hasErrors) return;
        const saved = await persist(values, 'manual');
        if (!saved) return;
        setPublishing(true);
        try {
            const { data } = await api.post(`${apiBase}/themes/publish`, { theme_id: Number(themeId) });
            setHasUnpublishedChanges(false);
            setPublishedAt(data.data?.published_at ?? new Date().toISOString());
            toast.success(t('theme_published', 'Theme changes published'));
        } catch (e) { toast.error(e.response?.data?.message || e.message); }
        finally { setPublishing(false); }
    };

    const restoreRevision = async (revision) => {
        try {
            setSaving(true);
            const { data } = await api.post(`${apiBase}/themes/${themeId}/revisions/${revision.id}/restore`);
            const restored = data.data?.settings || {};
            setValues(restored);
            setSavedValues(restored);
            setSaveStatus('saved');
            setHasUnpublishedChanges(true);
            await loadRevisions();
            toast.success(t('theme_revision_restored', 'Revision restored'));
        } catch (e) { toast.error(e.response?.data?.message || e.message); }
        finally { setSaving(false); }
    };

    const resetDefaults = () => setValues(defaultsOf(schema));

    const inputClass = 'w-full rounded-xl border border-slate-200 px-3 py-2 text-sm';

    const renderField = (f) => {
        const v = values[f.id];
        switch (f.type) {
            case 'toggle':
                return <input type="checkbox" checked={!!v} onChange={(e) => setValue(f.id, e.target.checked)} />;
            case 'textarea':
                return <textarea rows={3} value={v ?? ''} onChange={(e) => setValue(f.id, e.target.value)} className={inputClass} />;
            case 'select':
                return (
                    <SearchableSelect value={v ?? ''} onChange={(e) => setValue(f.id, e.target.value)} className="w-full">
                        {(f.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
                    </SearchableSelect>
                );
            case 'color':
                return <input type="color" value={v || '#000000'} onChange={(e) => setValue(f.id, e.target.value)} className="h-9 w-16 rounded-sm border border-slate-200" />;
            case 'number':
                return <input type="number" value={v ?? ''} onChange={(e) => setValue(f.id, e.target.value === '' ? '' : Number(e.target.value))} className={inputClass} />;
            case 'range':
                return (
                    <div className="flex items-center gap-3">
                        <input type="range" min={f.min ?? 0} max={f.max ?? 100} value={v ?? f.min ?? 0} onChange={(e) => setValue(f.id, Number(e.target.value))} />
                        <span className="text-sm text-slate-600">{v}</span>
                    </div>
                );
            case 'url':
                return <input type="url" value={v ?? ''} onChange={(e) => setValue(f.id, e.target.value)} placeholder="https://…" className={inputClass} />;
            case 'image':
                return <StoreMediaPicker apiBase={apiBase} value={v ?? ''} onChange={(next) => setValue(f.id, next)} />;
            default: // text, image (URL), etc.
                return <input type="text" value={v ?? ''} onChange={(e) => setValue(f.id, e.target.value)} className={inputClass} />;
        }
    };

    if (id && !can('stores-edit')) return <Navigate to="/stores" replace />;
    if (loading) return <p className="p-6 text-sm text-slate-500">…</p>;

    return (
        <div className="mx-auto max-w-[1600px] space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-s-4 border-brand ps-4">
                <div><h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t('theme_settings', 'Visual theme editor')}</h1><p className="mt-1 text-sm text-slate-500">{themeName} · {hasUnpublishedChanges ? t('theme_draft_changes', 'Draft changes not published') : t('theme_live_synced', 'Live version is up to date')}</p></div>
                <div className="flex items-center gap-2"><button type="button" onClick={() => navigate(`${uiBase}/themes`)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700">{t('cancel', 'Exit')}</button><button type="button" onClick={publish} disabled={publishing || saving || hasErrors || !hasUnpublishedChanges} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50">{publishing ? t('theme_publishing', 'Publishing…') : t('theme_publish', 'Publish')}</button></div>
            </div>
            {err && <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}

            <div className="grid items-start gap-5 lg:grid-cols-[390px_minmax(0,1fr)]">
            <div className="space-y-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card lg:max-h-[calc(100vh-150px)] lg:overflow-y-auto">
                {schema.map((group) => (
                    <fieldset key={group.id} className="space-y-4">
                        <legend className="text-sm font-semibold uppercase tracking-wide text-slate-500">{group.label}</legend>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {(group.fields || []).map((f) => (
                                <div key={f.id}>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">{f.label || f.id}</label>
                                    {renderField(f)}
                                    {errors[f.id] && <p className="mt-1 text-xs text-red-600">{errors[f.id]}</p>}
                                </div>
                            ))}
                        </div>
                    </fieldset>
                ))}

                <div className="flex gap-2 pt-2">
                    <button type="button" onClick={save} disabled={saving || hasErrors} className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50">
                        {t('product_form_save', 'Save')}
                    </button>
                    <button type="button" onClick={resetDefaults} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700">
                        {t('theme_reset_defaults', 'Reset to defaults')}
                    </button>
                    <span className={`ms-auto self-center text-xs font-semibold ${saveStatus === 'error' ? 'text-red-600' : saveStatus === 'saved' ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {saveStatus === 'saving' ? t('theme_autosaving', 'Autosaving…') : saveStatus === 'pending' ? t('theme_unsaved', 'Unsaved changes') : saveStatus === 'error' ? t('theme_autosave_failed', 'Autosave failed') : t('theme_autosaved', 'All changes saved')}
                    </span>
                </div>

                {revisions.length > 0 && <section className="border-t border-slate-100 pt-5">
                    <h2 className="text-sm font-semibold text-slate-800">{t('theme_revision_history', 'Revision history')}</h2>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{revisions.slice(0, 9).map((revision) => <div key={revision.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2"><div><p className="text-xs font-semibold text-slate-700">{revision.source}</p><p className="text-[11px] text-slate-400">{new Date(revision.created_at).toLocaleString()}</p></div><button type="button" disabled={saving} onClick={() => restoreRevision(revision)} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-brand disabled:opacity-50">{t('theme_restore', 'Restore')}</button></div>)}</div>
                </section>}
            </div>
            <section className="sticky top-4 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 text-white"><div><p className="text-sm font-semibold">{t('theme_live_preview', 'Draft preview')}</p><p className="text-xs text-slate-400">{publishedAt ? `${t('theme_last_published', 'Last published')} ${new Date(publishedAt).toLocaleString()}` : t('theme_not_published', 'Not published yet')}</p></div><div className="flex items-center gap-1 rounded-lg bg-white/10 p-1">{[['mobile', 'Mobile'], ['tablet', 'Tablet'], ['desktop', 'Desktop']].map(([key, label]) => <button key={key} type="button" onClick={() => setDevice(key)} className={`rounded-md px-2.5 py-1 text-xs font-semibold ${device === key ? 'bg-white text-slate-900' : 'text-slate-300'}`}>{t(`theme_device_${key}`, label)}</button>)}</div><a href={livePreviewUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold">{t('open', 'Open')}</a></div>
                <div className="flex min-h-[650px] justify-center overflow-auto bg-[radial-gradient(circle_at_top,#334155,#0f172a_65%)] p-3 sm:p-6">
                    {previewError ? <p className="m-auto rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{previewError}</p> : livePreviewUrl ? <div className="overflow-hidden bg-white shadow-2xl transition-[width] duration-300" style={{ width: device === 'mobile' ? 390 : device === 'tablet' ? 820 : '100%', minHeight: 620, borderRadius: device === 'desktop' ? 8 : 24 }}><iframe title={t('theme_live_preview', 'Draft preview')} src={livePreviewUrl} sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals" className="h-[720px] w-full border-0" /></div> : <p className="m-auto text-sm text-slate-400">{t('common.loading', 'Loading preview…')}</p>}
                </div>
            </section>
            </div>
        </div>
    );
}
