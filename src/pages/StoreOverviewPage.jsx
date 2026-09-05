import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    HiOutlineArrowPath,
    HiOutlineArrowTopRightOnSquare,
    HiOutlineBars3BottomLeft,
    HiOutlineCog6Tooth,
    HiOutlineCreditCard,
    HiOutlineCube,
    HiOutlineDocumentText,
    HiOutlineGlobeAlt,
    HiOutlineRocketLaunch,
    HiOutlineShoppingBag,
    HiOutlineSwatch,
} from 'react-icons/hi2';
import api from '../api/client';
import { notify } from '../components/ui/notify';
import PageHeader from '../components/PageHeader';
import SettingsCard from '../components/ui/SettingsCard';
import ReadinessChecklist, { useStoreReadiness } from '../components/store/ReadinessChecklist';
import StoreStatusPill from '../components/store/StoreStatusPill';
import useStoreContext from '../hooks/useStoreContext';

function QuickLink({ to, Icon, title, hint }) {
    return (
        <Link
            to={to}
            className="group flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lg"
        >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand transition group-hover:bg-brand group-hover:text-white">
                <Icon className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0">
                <span className="block text-sm font-semibold text-slate-900">{title}</span>
                <span className="mt-0.5 block text-xs text-slate-500">{hint}</span>
            </span>
        </Link>
    );
}

/**
 * Store overview — publish readiness at a glance, quick links to every area,
 * and the store's key facts. Replaces the old "Store setup" checklist.
 */
export default function StoreOverviewPage() {
    const { t } = useTranslation();
    const { store, setStore, apiBase, uiBase, access } = useStoreContext();
    const { checks, loading, error, reload, done, total, ready } = useStoreReadiness(apiBase);
    const [publishing, setPublishing] = useState(false);

    const isLive = store?.status === 'active';
    const storefrontUrl = store?.storefront_url || store?.public_url || null;
    const progress = total ? Math.round((done / total) * 100) : 0;

    const publish = async () => {
        setPublishing(true);
        try {
            const { data } = await api.post(`${apiBase}/publish`);
            if (data?.data) setStore(data.data);
            notify.success(t('store_publish_success', 'Store published'), t('store_publish_success_hint', 'Your storefront is now live.'));
            await reload();
        } catch (e) {
            const detail = e.response?.data?.errors?.store?.[0] || e.response?.data?.message || e.message;
            notify.error(t('store_publish_failed', 'Could not publish'), detail);
        } finally {
            setPublishing(false);
        }
    };

    const links = useMemo(() => [
        access?.canStoreSettings && { to: `${uiBase}/settings/general`, Icon: HiOutlineCog6Tooth, title: t('store_nav_general', 'General'), hint: t('store_overview_link_general', 'Name, logo, contact details') },
        access?.canStorePayments && { to: `${uiBase}/settings/payments`, Icon: HiOutlineCreditCard, title: t('store_nav_payments', 'Payment gateways'), hint: t('store_overview_link_payments', 'Enable how customers pay') },
        access?.canStoreThemes && { to: `${uiBase}/themes`, Icon: HiOutlineSwatch, title: t('store_nav_themes', 'Themes'), hint: t('store_overview_link_themes', 'Pick and customize a design') },
        access?.canStorePages && { to: `${uiBase}/pages`, Icon: HiOutlineDocumentText, title: t('store_nav_pages', 'Pages'), hint: t('store_overview_link_pages', 'Standard and custom pages') },
        access?.canStoreMenus && { to: `${uiBase}/menus`, Icon: HiOutlineBars3BottomLeft, title: t('store_nav_menus', 'Menus'), hint: t('store_overview_link_menus', 'Header and footer navigation') },
        access?.canStoreSettings && { to: `${uiBase}/settings/domains`, Icon: HiOutlineGlobeAlt, title: t('store_nav_domains', 'Domains'), hint: t('store_overview_link_domains', 'Subdomain and custom domains') },
        { to: '/products', Icon: HiOutlineCube, title: t('products', 'Products'), hint: t('store_overview_link_products', 'Your catalog powers the storefront') },
        access?.canStoreOrders && { to: `${uiBase}/orders`, Icon: HiOutlineShoppingBag, title: t('store_nav_orders', 'Orders'), hint: t('store_overview_link_orders', 'Storefront orders and fulfilment') },
    ].filter(Boolean), [access, t, uiBase]);

    return (
        <div className="mx-auto max-w-6xl space-y-6">
            <PageHeader
                title={store?.name || t('store_nav_overview', 'Overview')}
                subtitle={t('store_overview_subtitle', 'Everything you need to launch and run your storefront.')}
                badge={<StoreStatusPill status={store?.status} />}
                action={
                    isLive && storefrontUrl ? (
                        <a
                            href={storefrontUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-xs transition hover:border-brand/40 hover:text-brand-dark"
                        >
                            <HiOutlineArrowTopRightOnSquare className="h-4 w-4" aria-hidden />
                            {t('store_nav_view_storefront', 'View storefront')}
                        </a>
                    ) : null
                }
            />

            <div className="grid gap-5 lg:grid-cols-3">
                {/* Readiness */}
                <SettingsCard
                    className="lg:col-span-2"
                    title={isLive ? t('store_overview_live_title', 'Your store is live') : t('store_overview_launch_title', 'Launch checklist')}
                    description={isLive
                        ? t('store_overview_live_hint', 'Keep these checks green so the storefront stays healthy.')
                        : t('store_overview_launch_hint', 'Complete the checks below, then publish.')}
                    actions={
                        <button
                            type="button"
                            onClick={() => void reload()}
                            disabled={loading}
                            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50"
                        >
                            <HiOutlineArrowPath className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden />
                            {t('action_refresh', 'Refresh')}
                        </button>
                    }
                    footer={
                        !isLive ? (
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <p className="text-xs text-slate-500">
                                    {ready
                                        ? t('store_publish_ready_hint', 'All checks passed — you can publish now.')
                                        : t('store_publish_missing_hint', 'Publishing is enabled once every check passes.')}
                                </p>
                                <button
                                    type="button"
                                    onClick={publish}
                                    disabled={!ready || publishing || loading}
                                    className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-brand-dark disabled:opacity-40"
                                >
                                    {publishing ? <HiOutlineArrowPath className="h-4 w-4 animate-spin" aria-hidden /> : <HiOutlineRocketLaunch className="h-4 w-4" aria-hidden />}
                                    {t('store_publish_action', 'Publish store')}
                                </button>
                            </div>
                        ) : null
                    }
                >
                    <div className="mb-4">
                        <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                            <span>{t('store_overview_progress', '{{done}} of {{total}} complete', { done, total })}</span>
                            <span>{progress}%</span>
                        </div>
                        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                            <div className={`h-full rounded-full transition-all duration-500 ${ready ? 'bg-emerald-500' : 'bg-brand'}`} style={{ width: `${progress}%` }} />
                        </div>
                    </div>
                    {error ? <p className="mb-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p> : null}
                    <ReadinessChecklist checks={checks} uiBase={uiBase} loading={loading} />
                </SettingsCard>

                {/* Store facts */}
                <SettingsCard title={t('store_overview_details', 'Store details')}>
                    <dl className="space-y-3 text-sm">
                        <div>
                            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{t('store_slug', 'Slug')}</dt>
                            <dd className="mt-0.5 font-mono text-slate-700" dir="ltr">{store?.slug || '—'}</dd>
                        </div>
                        <div>
                            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{t('store_generated_subdomain', 'Subdomain')}</dt>
                            <dd className="mt-0.5 truncate font-mono text-slate-700" dir="ltr" title={store?.subdomain_host || ''}>{store?.subdomain_host || '—'}</dd>
                        </div>
                        {store?.primary_custom_domain ? (
                            <div>
                                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{t('store_overview_custom_domain', 'Custom domain')}</dt>
                                <dd className="mt-0.5 truncate font-mono text-slate-700" dir="ltr">{store.primary_custom_domain}</dd>
                            </div>
                        ) : null}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{t('store_currency', 'Currency')}</dt>
                                <dd className="mt-0.5 text-slate-700">{store?.currency || '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{t('store_locale_languages', 'Languages')}</dt>
                                <dd className="mt-0.5 uppercase text-slate-700">{(store?.supported_locales || []).join(' · ') || '—'}</dd>
                            </div>
                        </div>
                        <div>
                            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{t('store_timezone', 'Timezone')}</dt>
                            <dd className="mt-0.5 text-slate-700">{store?.timezone || '—'}</dd>
                        </div>
                    </dl>
                    <Link
                        to={`${uiBase}/settings/general`}
                        className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
                    >
                        <HiOutlineCog6Tooth className="h-4 w-4" aria-hidden />
                        {t('store_overview_edit_details', 'Edit store settings')}
                    </Link>
                </SettingsCard>
            </div>

            {/* Quick links */}
            <div>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">{t('store_overview_quick_links', 'Manage your store')}</h2>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {links.map((link) => <QuickLink key={link.to} {...link} />)}
                </div>
            </div>
        </div>
    );
}
