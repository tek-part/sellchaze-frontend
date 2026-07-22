import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { HiOutlineClipboardDocument, HiOutlineInformationCircle } from 'react-icons/hi2';
import api from '../api/client';

function CopyRow({ label, value, hint, t }) {
    const [done, setDone] = useState(false);
    if (!value) {
        return null;
    }
    const copy = async () => {
        try {
            await navigator.clipboard.writeText(value);
            setDone(true);
            toast.success(t('settings_google_copied'));
            setTimeout(() => setDone(false), 2000);
        } catch {
            toast.error(t('settings_google_copy_failed'));
        }
    };
    return (
        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
                    <p className="mt-1 break-all font-mono text-sm text-slate-900">{value}</p>
                    {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
                </div>
                <button
                    type="button"
                    onClick={copy}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
                >
                    <HiOutlineClipboardDocument className="h-4 w-4" aria-hidden />
                    {done ? t('settings_google_copy_done') : t('settings_google_copy')}
                </button>
            </div>
        </div>
    );
}

export default function GoogleSettingsPage() {
    const { t } = useTranslation();
    const { isAdmin } = useOutletContext();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState('');
    const [meta, setMeta] = useState(null);
    const [clientId, setClientId] = useState('');
    const [clientSecret, setClientSecret] = useState('');
    /** Current secret from API (admin-only); shown for copy / visibility. */
    const [storedClientSecret, setStoredClientSecret] = useState('');

    const load = useCallback(() => {
        if (!isAdmin) {
            return;
        }
        setErr('');
        setLoading(true);
        api.get('/admin/settings/google')
            .then(({ data }) => {
                setMeta(data);
                setClientId(data.client_id ?? '');
                setClientSecret('');
            })
            .catch((e) => setErr(e.response?.data?.message || e.message))
            .finally(() => setLoading(false));
    }, [isAdmin]);

    useEffect(() => {
        load();
    }, [load]);

    async function onSubmit(e) {
        e.preventDefault();
        setSaving(true);
        setErr('');
        try {
            const payload = { client_id: clientId.trim() };
            if (clientSecret.trim() !== '') {
                payload.client_secret = clientSecret.trim();
            }
            const { data } = await api.put('/admin/settings/google', payload);
            toast.success(data.message || t('settings_google_saved'));
            setMeta(data);
            setClientSecret('');
            setClientId(data.client_id ?? '');
            setStoredClientSecret(typeof data.client_secret === 'string' ? data.client_secret : '');
        } catch (e) {
            const msg = e.response?.data?.message || e.message;
            setErr(msg);
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    }

    if (!isAdmin) {
        return <Navigate to="/dashboard" replace />;
    }

    const origins = meta?.javascript_origins?.length ? meta.javascript_origins : [];

    return (
        <div className="space-y-6">
            <div className="border-s-4 border-brand ps-4">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t('settings_google')}</h1>
                <p className="mt-1 text-sm text-slate-500">{t('settings_google_subtitle')}</p>
            </div>

            {err ? (
                <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>
            ) : null}

            <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card sm:p-6">
                <h2 className="text-lg font-semibold text-slate-900">{t('settings_google_section_credentials')}</h2>
                <p className="mt-1 text-sm text-slate-500">{t('settings_google_credentials_help')}</p>

                {loading ? (
                    <p className="mt-8 py-4 text-center text-sm text-slate-500">{t('loading')}</p>
                ) : (
                    <form className="mt-6 space-y-4" onSubmit={onSubmit}>
                        <div>
                            <label htmlFor="google-client-id" className="block text-sm font-medium text-slate-700">
                                {t('settings_google_client_id_field')}
                            </label>
                            <input
                                id="google-client-id"
                                type="text"
                                value={clientId}
                                onChange={(e) => setClientId(e.target.value)}
                                autoComplete="off"
                                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-mono text-sm text-slate-900 shadow-xs focus:border-brand focus:outline-hidden focus:ring-2 focus:ring-brand/20"
                                placeholder="xxxxx.apps.googleusercontent.com"
                                required
                            />
                            {meta?.client_id_masked ? (
                                <p className="mt-1 text-xs text-slate-500">
                                    {t('settings_google_masked_preview')}: {meta.client_id_masked}
                                </p>
                            ) : null}
                        </div>
                        {storedClientSecret ? (
                            <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-3">
                                <p className="text-xs font-medium text-amber-900">{t('settings_google_secret_visible_warning')}</p>
                                <div className="mt-2">
                                    <CopyRow
                                        label={t('settings_google_client_secret_current')}
                                        value={storedClientSecret}
                                        hint={t('settings_google_client_secret_current_hint')}
                                        t={t}
                                    />
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500">{t('settings_google_no_stored_secret')}</p>
                        )}
                        <div>
                            <label htmlFor="google-client-secret" className="block text-sm font-medium text-slate-700">
                                {t('settings_google_client_secret_new_field')}
                            </label>
                            <input
                                id="google-client-secret"
                                type="password"
                                value={clientSecret}
                                onChange={(e) => setClientSecret(e.target.value)}
                                autoComplete="new-password"
                                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-mono text-sm text-slate-900 shadow-xs focus:border-brand focus:outline-hidden focus:ring-2 focus:ring-brand/20"
                                placeholder={t('settings_google_secret_placeholder')}
                            />
                            <p className="mt-1 text-xs text-slate-500">
                                {storedClientSecret
                                    ? t('settings_google_secret_kept_hint')
                                    : t('settings_google_secret_required_server')}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={saving}
                                className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-brand-dark disabled:opacity-50"
                            >
                                {saving ? t('loading') : t('settings_google_save')}
                            </button>
                            <button
                                type="button"
                                onClick={load}
                                disabled={loading || saving}
                                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                            >
                                {t('settings_google_reload')}
                            </button>
                        </div>
                    </form>
                )}
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card sm:p-6">
                <h2 className="text-lg font-semibold text-slate-900">{t('settings_google_section_console')}</h2>
                <p className="mt-1 text-sm text-slate-500">{t('settings_google_console_help')}</p>

                <div className="mt-5 space-y-3">
                    <CopyRow
                        label={t('settings_google_callback_uri')}
                        value={meta?.callback_url}
                        hint={t('settings_google_callback_hint')}
                        t={t}
                    />
                    {meta?.redirect_uri_effective && meta.redirect_uri_effective !== meta?.callback_url ? (
                        <CopyRow
                            label={t('settings_google_redirect_effective')}
                            value={meta.redirect_uri_effective}
                            hint={t('settings_google_redirect_effective_hint')}
                            t={t}
                        />
                    ) : null}
                    {origins.length > 0 ? (
                        <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                {t('settings_google_js_origins')}
                            </p>
                            {origins.map((origin) => (
                                <CopyRow
                                    key={origin}
                                    label={t('settings_google_js_origin_item')}
                                    value={origin}
                                    hint={t('settings_google_js_origins_hint')}
                                    t={t}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex gap-2 rounded-xl border border-amber-100 bg-amber-50/80 p-3 text-sm text-amber-900">
                            <HiOutlineInformationCircle className="h-5 w-5 shrink-0" aria-hidden />
                            <p>{t('settings_google_no_frontend_url')}</p>
                        </div>
                    )}
                </div>
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card sm:p-6">
                <h2 className="text-lg font-semibold text-slate-900">{t('settings_google_section_status')}</h2>
                <dl className="mt-4 space-y-3 text-sm">
                    <div className="flex flex-wrap justify-between gap-2 border-b border-slate-100 py-2">
                        <dt className="text-slate-500">{t('settings_google_status')}</dt>
                        <dd className="font-medium text-slate-900">
                            {meta?.oauth_configured ? t('settings_configured') : t('settings_not_set')}
                        </dd>
                    </div>
                    <div className="flex flex-wrap justify-between gap-2 border-b border-slate-100 py-2">
                        <dt className="text-slate-500">{t('settings_google_client_secret_field')}</dt>
                        <dd className="font-medium text-slate-900">
                            {meta?.client_secret_configured ? t('settings_configured') : t('settings_not_set')}
                        </dd>
                    </div>
                </dl>
                <p className="mt-4 flex gap-2 text-sm text-slate-600">
                    <HiOutlineInformationCircle className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />
                    <span>{t('settings_google_vite_hint')}</span>
                </p>
                <p className="mt-2 text-sm text-slate-600">{t('settings_google_env_fallback')}</p>
            </section>
        </div>
    );
}
