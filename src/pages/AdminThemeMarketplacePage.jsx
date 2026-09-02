import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../api/client';

const FLOW = {
    draft: ['review'],
    review: ['approved', 'draft'],
    approved: ['published', 'review'],
    published: ['deprecated'],
    deprecated: ['published'],
};

const STATUS_TONE = {
    draft: 'border-slate-200 bg-slate-100 text-slate-700',
    review: 'border-amber-200 bg-amber-50 text-amber-700',
    approved: 'border-sky-200 bg-sky-50 text-sky-700',
    published: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    deprecated: 'border-rose-200 bg-rose-50 text-rose-700',
};

function errorMessage(error, fallback) {
    const fields = error?.response?.data?.errors;
    return (fields && Object.values(fields)?.[0]?.[0]) || error?.response?.data?.message || error?.message || fallback;
}

function ThemeCommercialCard({ theme, busy, onChange, onSave, onTransition }) {
    const { t } = useTranslation();
    const [manifest, setManifest] = useState(null);
    const [bundle, setBundle] = useState(null);
    const paid = Number(theme.price) > 0;
    const transitions = FLOW[theme.status] || [];
    const versionFlow = FLOW;

    return (
        <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="grid gap-0 lg:grid-cols-[16rem_1fr]">
                <div className="relative min-h-48 overflow-hidden bg-[radial-gradient(circle_at_top_left,_#0f766e,_#0f172a_72%)]">
                    {theme.preview_image ? <img src={theme.preview_image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-75" /> : null}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/10 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">{theme.key}</p>
                        <h2 className="mt-1 text-xl font-semibold">{theme.name}</h2>
                        <p className="mt-1 text-sm text-white/65">{theme.author || t('theme_platform_verified', 'Platform theme')}</p>
                    </div>
                </div>

                <div className="p-5 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_TONE[theme.status] || STATUS_TONE.draft}`}>
                                {theme.status}
                            </span>
                            <p className="mt-2 max-w-2xl text-sm text-slate-500">{theme.description || t('theme_no_description', 'No description provided.')}</p>
                        </div>
                        <div className="text-end">
                            <p className="text-2xl font-semibold text-slate-900">{paid ? `${theme.price} ${theme.currency}` : t('theme_free', 'Free')}</p>
                            <p className="text-xs text-slate-400">{theme.installs_count || 0} {t('theme_installs', 'installs')} · {theme.versions_count || 0} {t('theme_versions', 'versions')}</p>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <label className="space-y-1.5 text-sm font-medium text-slate-700">
                            <span>{t('theme_price', 'Price')}</span>
                            <input type="number" min="0" step="0.01" value={theme.price ?? 0} onChange={(event) => onChange(theme.id, 'price', event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" />
                        </label>
                        <label className="space-y-1.5 text-sm font-medium text-slate-700">
                            <span>{t('theme_currency', 'Currency')}</span>
                            <input maxLength={3} value={theme.currency || 'USD'} onChange={(event) => onChange(theme.id, 'currency', event.target.value.toUpperCase())} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 uppercase outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" />
                        </label>
                        <label className="space-y-1.5 text-sm font-medium text-slate-700">
                            <span>{t('theme_license', 'License')}</span>
                            <select value={theme.license_type || 'free'} onChange={(event) => onChange(theme.id, 'license_type', event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100">
                                <option value="free">{t('theme_free', 'Free')}</option>
                                <option value="lifetime">{t('theme_license_lifetime', 'Lifetime')}</option>
                            </select>
                        </label>
                        <label className="space-y-1.5 text-sm font-medium text-slate-700">
                            <span>{t('theme_support_days', 'Support days')}</span>
                            <input type="number" min="0" max="3650" value={theme.support_days ?? 0} onChange={(event) => onChange(theme.id, 'support_days', event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" />
                        </label>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-5">
                        <div className="flex flex-wrap gap-5">
                            <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                                <input type="checkbox" checked={Boolean(theme.is_marketplace)} onChange={(event) => onChange(theme.id, 'is_marketplace', event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-teal-600" />
                                {t('theme_list_marketplace', 'List in marketplace')}
                            </label>
                            <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                                <input type="checkbox" checked={Boolean(theme.is_featured)} onChange={(event) => onChange(theme.id, 'is_featured', event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-teal-600" />
                                {t('theme_featured', 'Featured')}
                            </label>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {transitions.map((status) => (
                                <button key={status} type="button" disabled={busy} onClick={() => onTransition(theme, status)} className="rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                                    {t('theme_move_status', 'Move to')} {status}
                                </button>
                            ))}
                            <button type="button" disabled={busy} onClick={() => onSave(theme)} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50">
                                {busy ? t('saving', 'Saving…') : t('save_changes', 'Save changes')}
                            </button>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-5 border-t border-slate-100 pt-5 xl:grid-cols-2">
                        <section>
                            <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-semibold text-slate-900">{t('theme_gallery', 'Marketplace gallery')}</h3><label className="cursor-pointer rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"><input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) onSave(theme, { asset: file }); event.target.value = ''; }} />{t('theme_add_image', 'Add image')}</label></div>
                            <div className="mt-3 grid grid-cols-3 gap-2">
                                {(theme.assets || []).map((asset) => <div key={asset.id} className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-slate-200 bg-slate-100"><img src={asset.url} alt="" className="h-full w-full object-cover" /><button type="button" onClick={() => onTransition(theme, 'delete-asset', asset)} className="absolute end-1.5 top-1.5 rounded-lg bg-slate-950/75 px-2 py-1 text-[11px] font-semibold text-white opacity-0 transition group-hover:opacity-100">{t('delete', 'Delete')}</button></div>)}
                                {(theme.assets || []).length === 0 ? <p className="col-span-3 rounded-xl border border-dashed border-slate-200 p-5 text-center text-xs text-slate-400">{t('theme_no_gallery', 'No gallery images yet.')}</p> : null}
                            </div>
                        </section>

                        <section>
                            <h3 className="text-sm font-semibold text-slate-900">{t('theme_versions', 'Theme versions')}</h3>
                            <div className="mt-3 space-y-2">{(theme.versions || []).map((version) => <div key={version.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2"><div><span className="font-mono text-sm font-semibold text-slate-800">v{version.version}</span><span className="ms-2 text-xs text-slate-400">{version.status}</span></div><div className="flex gap-1">{(versionFlow[version.status] || []).map((to) => <button key={to} type="button" disabled={busy} onClick={() => onTransition(theme, 'version', { ...version, to })} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600">{to}</button>)}</div></div>)}</div>
                            <div className="mt-3 grid gap-2 sm:grid-cols-2"><label className="rounded-xl border border-dashed border-slate-300 p-3 text-xs text-slate-500"><span className="block font-semibold text-slate-700">manifest.json</span><input type="file" accept="application/json,.json" className="mt-2 block w-full" onChange={(event) => setManifest(event.target.files?.[0] || null)} /></label><label className="rounded-xl border border-dashed border-slate-300 p-3 text-xs text-slate-500"><span className="block font-semibold text-slate-700">bundle.js</span><input type="file" accept="text/javascript,.js,.mjs" className="mt-2 block w-full" onChange={(event) => setBundle(event.target.files?.[0] || null)} /></label></div>
                            <button type="button" disabled={busy || !manifest || !bundle} onClick={() => onSave(theme, { manifest, bundle, clear: () => { setManifest(null); setBundle(null); } })} className="mt-2 w-full rounded-xl bg-teal-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40">{t('theme_upload_version', 'Upload draft version')}</button>
                        </section>
                    </div>
                </div>
            </div>
        </article>
    );
}

export default function AdminThemeMarketplacePage() {
    const { t } = useTranslation();
    const [themes, setThemes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(() => new Set());
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/admin/themes');
            setThemes(Array.isArray(data?.data) ? data.data : []);
            setError('');
        } catch (requestError) {
            setError(errorMessage(requestError, t('error_loading', 'Could not load themes.')));
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => { void load(); }, [load]);

    const summary = useMemo(() => ({
        total: themes.length,
        published: themes.filter((theme) => theme.status === 'published').length,
        paid: themes.filter((theme) => Number(theme.price) > 0).length,
        listed: themes.filter((theme) => theme.is_marketplace).length,
    }), [themes]);

    const change = (id, field, value) => setThemes((current) => current.map((theme) => theme.id === id ? { ...theme, [field]: value } : theme));

    const run = async (theme, action) => {
        setBusy((current) => new Set(current).add(theme.id));
        try {
            await action();
        } catch (requestError) {
            toast.error(errorMessage(requestError, t('save_failed', 'Could not save changes.')));
        } finally {
            setBusy((current) => { const next = new Set(current); next.delete(theme.id); return next; });
        }
    };

    const save = (theme, upload) => run(theme, async () => {
        if (upload?.asset) {
            const body = new FormData();
            body.append('type', (theme.assets || []).some((asset) => asset.type === 'preview') ? 'gallery' : 'preview');
            body.append('position', String((theme.assets || []).length));
            body.append('image', upload.asset);
            const { data } = await api.post(`/admin/themes/${theme.id}/assets`, body);
            setThemes((current) => current.map((row) => row.id === theme.id ? { ...row, assets: [...(row.assets || []), data.data] } : row));
            toast.success(t('theme_image_uploaded', 'Image uploaded.'));
            return;
        }
        if (upload?.manifest && upload?.bundle) {
            const body = new FormData();
            body.append('manifest', upload.manifest);
            body.append('bundle', upload.bundle);
            const { data } = await api.post(`/admin/themes/${theme.id}/versions`, body);
            setThemes((current) => current.map((row) => row.id === theme.id ? { ...row, versions: [data.data, ...(row.versions || [])], versions_count: Number(row.versions_count || 0) + 1 } : row));
            upload.clear?.();
            toast.success(t('theme_version_uploaded', 'Draft version uploaded.'));
            return;
        }
        const { data } = await api.patch(`/admin/themes/${theme.id}/commercial`, {
            price: Number(theme.price || 0),
            currency: theme.currency || 'USD',
            license_type: Number(theme.price || 0) === 0 ? 'free' : theme.license_type,
            support_days: Number(theme.support_days || 0),
            is_marketplace: Boolean(theme.is_marketplace),
            is_featured: Boolean(theme.is_featured),
        });
        setThemes((current) => current.map((row) => row.id === theme.id ? { ...row, ...data.data } : row));
        toast.success(t('saved', 'Saved.'));
    });

    const transition = (theme, status, subject) => run(theme, async () => {
        if (status === 'delete-asset') {
            await api.delete(`/admin/themes/${theme.id}/assets/${subject.id}`);
            setThemes((current) => current.map((row) => row.id === theme.id ? { ...row, assets: (row.assets || []).filter((asset) => asset.id !== subject.id) } : row));
            toast.success(t('deleted', 'Deleted.'));
            return;
        }
        if (status === 'version') {
            const { data } = await api.post(`/admin/themes/${theme.id}/versions/${subject.id}/transition`, { to: subject.to });
            setThemes((current) => current.map((row) => row.id === theme.id ? { ...row, versions: (row.versions || []).map((version) => version.id === subject.id ? { ...version, ...data.data } : version) } : row));
            toast.success(t('theme_status_updated', 'Publishing status updated.'));
            return;
        }
        const { data } = await api.post(`/admin/themes/${theme.id}/transition`, { to: status });
        setThemes((current) => current.map((row) => row.id === theme.id ? { ...row, status: data.data.status } : row));
        toast.success(t('theme_status_updated', 'Publishing status updated.'));
    });

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <header className="overflow-hidden rounded-3xl bg-[radial-gradient(circle_at_top_right,_#14b8a6,_#0f172a_58%)] px-6 py-8 text-white sm:px-9">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-200">Sellchaze Studio</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t('theme_marketplace_admin', 'Theme marketplace')}</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{t('theme_marketplace_admin_help', 'Control commercial terms and move every theme through a reviewed publishing workflow.')}</p>
                <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {Object.entries(summary).map(([key, value]) => <div key={key} className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur"><p className="text-2xl font-semibold">{value}</p><p className="mt-1 text-xs uppercase tracking-wide text-slate-300">{key}</p></div>)}
                </div>
            </header>

            {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}
            {loading ? <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-500">{t('loading', 'Loading…')}</div> : null}
            {!loading && themes.length === 0 ? <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">{t('theme_empty_none_title', 'No themes available')}</div> : null}
            <div className="space-y-5">
                {themes.map((theme) => <ThemeCommercialCard key={theme.id} theme={theme} busy={busy.has(theme.id)} onChange={change} onSave={save} onTransition={transition} />)}
            </div>
        </div>
    );
}
