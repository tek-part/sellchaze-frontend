import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../api/client';
import useStoreScope from '../hooks/useStoreScope';

const stepStateClass = {
    done: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    active: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    pending: 'bg-slate-50 text-slate-500 border-slate-200',
};

export default function StoreSetupPage() {
    const { id, apiBase, uiBase } = useStoreScope();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { permissions } = useOutletContext();
    const can = (p) => permissions.includes(p);

    const [store, setStore] = useState(null);
    const [themeRows, setThemeRows] = useState([]);
    const [activeThemeId, setActiveThemeId] = useState(null);
    const [domains, setDomains] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingRefresh, setLoadingRefresh] = useState(false);
    const [error, setError] = useState('');

    if (id && !can('stores-edit')) {
        return <Navigate to="/stores" replace />;
    }

    const load = useCallback(async () => {
        try {
            const [storeRes, themesRes, domainsRes] = await Promise.all([
                api.get(`${apiBase}`),
                api.get(`${apiBase}/themes`),
                api.get(`${apiBase}/domains`),
            ]);

            setStore(storeRes.data?.data ?? storeRes.data);
            setThemeRows(Array.isArray(themesRes.data?.data) ? themesRes.data.data : []);
            setActiveThemeId(themesRes.data?.active_theme_id ?? null);
            setDomains(Array.isArray(domainsRes.data?.data) ? domainsRes.data.data : []);
            setError('');
        } catch (e) {
            setError(e.response?.data?.message || e.message);
        } finally {
            setLoading(false);
            setLoadingRefresh(false);
        }
    }, [apiBase]);

    useEffect(() => {
        setLoading(true);
        void load();
    }, [load]);

    const primaryDomain = useMemo(
        () => domains.find((item) => item?.is_primary) ?? null,
        [domains],
    );

    const hasAnyDomain = useMemo(
        () => Boolean(primaryDomain || store?.subdomain_host),
        [primaryDomain, store?.subdomain_host],
    );

    const themeReady = useMemo(
        () => themeRows.some((item) => item?.id === activeThemeId),
        [themeRows, activeThemeId],
    );

    const themeCount = useMemo(
        () => themeRows.filter((item) => item?.installed).length,
        [themeRows],
    );

    const activeTheme = useMemo(
        () => themeRows.find((item) => item?.id === activeThemeId) ?? null,
        [themeRows, activeThemeId],
    );

    const storeHost = useMemo(
        () => primaryDomain?.host || store?.subdomain_host || null,
        [primaryDomain, store?.subdomain_host],
    );

    const doneCount = useMemo(
        () =>
            [themeReady, hasAnyDomain, Boolean(storeHost)].filter((v) => Boolean(v)).length,
        [hasAnyDomain, storeHost, themeReady],
    );

    const openStorefront = () => {
        if (!storeHost) {
            toast.error(t('theme_wizard_no_domain', 'No storefront host is available yet.')); 
            return;
        }

        window.open(`https://${storeHost}`, '_blank', 'noopener');
    };

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <div className="border-s-4 border-brand ps-4">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t('store_setup_title', 'Store setup')}</h1>
                <p className="mt-1 text-sm text-slate-500">
                    {store?.name ? `${t('store_setup_for', 'Setup for')} ${store.name}` : t('store_setup_subtitle', 'Complete theme and domain setup for this store.')}
                </p>
            </div>

            {loading ? (
                <p className="text-sm text-slate-500">{t('loading', 'Loading...')}</p>
            ) : (
                <>
                    {error && (
                        <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
                    )}

                    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">{t('store_setup_progress', 'Setup checklist')}</h2>
                                <p className="mt-0.5 text-sm text-slate-500">
                                    {t('store_setup_progress_hint', 'Progress')}: {doneCount}/3
                                </p>
                            </div>
                            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${doneCount >= 2 ? stepStateClass.done : stepStateClass.pending}`}>
                                {doneCount >= 2 ? t('store_setup_ready', 'Ready') : t('store_setup_pending', 'Pending')}
                            </span>
                        </div>

                        <ol className="mt-4 grid gap-3 sm:grid-cols-3">
                            <li className="rounded-xl border p-3">
                                <p className="mb-1 text-xs uppercase tracking-wider text-slate-400">1) {t('store_setup_theme', 'Theme')}</p>
                                <div className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${themeReady ? stepStateClass.done : stepStateClass.active}`}>
                                    {themeReady
                                        ? t('store_setup_done', 'Published theme active')
                                        : t('store_setup_wait_theme', 'Pick and activate a theme')}
                                </div>
                                <p className="mt-2 text-sm text-slate-600">
                                    {activeTheme ? `${activeTheme.name} (${themeCount} installed)` : `${themeCount} ${t('themes_title', 'themes')} ${t('store_setup_state_pending', 'installed, none active')}`}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => navigate(`${uiBase}/themes`)}
                                    className="mt-3 inline-flex rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                >
                                    {themeReady
                                        ? t('theme_manage', 'Manage theme')
                                        : t('theme_pick', 'Choose theme')}
                                </button>
                            </li>

                            <li className="rounded-xl border p-3">
                                <p className="mb-1 text-xs uppercase tracking-wider text-slate-400">2) {t('store_setup_domain', 'Domain')}</p>
                                <div className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${hasAnyDomain ? stepStateClass.done : stepStateClass.active}`}>
                                    {Boolean(primaryDomain)
                                        ? t('store_setup_done', 'Custom domain connected')
                                        : hasAnyDomain
                                            ? t('store_setup_ready', 'Subdomain assigned')
                                            : t('store_setup_wait_domain', 'Add a custom domain')}
                                </div>
                                <p className="mt-2 text-sm text-slate-600" dir="ltr">
                                    {primaryDomain?.host || store?.subdomain_host || t('domain_empty_title', 'No domain assigned yet')}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => navigate(`${uiBase}/settings`)}
                                    className="mt-3 inline-flex rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                >
                                    {t('store_setup_manage_domain', 'Open domain settings')}
                                </button>
                            </li>

                            <li className="rounded-xl border p-3">
                                <p className="mb-1 text-xs uppercase tracking-wider text-slate-400">3) {t('store_setup_publish', 'Publish')}</p>
                                <div className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${store?.id ? stepStateClass.done : stepStateClass.pending}`}>
                                    {Boolean(storeHost)
                                        ? t('store_setup_done', 'Store ready to publish')
                                        : t('store_setup_wait_publish', 'Store not available')}
                                </div>
                                <p className="mt-2 text-sm text-slate-600">
                                    {storeHost ? t('store_setup_visit_hint', 'Open storefront in browser to verify') : t('store_setup_visit_hint_pending', 'Open storefront after domain is ready')}
                                </p>
                                <button
                                    type="button"
                                    onClick={openStorefront}
                                    className="mt-3 inline-flex rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-dark"
                                >
                                    {t('store_visit', 'Open storefront')}
                                </button>
                            </li>
                        </ol>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                setLoadingRefresh(true);
                                void load();
                            }}
                            disabled={loadingRefresh}
                            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                            {loadingRefresh ? t('loading', 'Checking status...') : t('action_refresh', 'Refresh status')}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                if (id) navigate('/stores');
                                else navigate('/store');
                            }}
                            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700"
                        >
                            {id ? t('stores_title', 'Stores') : t('dashboard_title', 'Dashboard')}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
