import { Fragment, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';
import { Link, Navigate, Outlet, useLocation, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlineArrowPath, HiOutlineBars3, HiOutlineXMark } from '../workspace/WorkspaceIcons';
import api from '../../api/client';
import useStoreScope from '../../hooks/useStoreScope';
import { fullStoreAccess, storeAccess, storeUiPermissions } from '../../lib/storeAccess';
import StoreSidebar from './StoreSidebar';
import StoreStatusPill from './StoreStatusPill';
import StoreSettingsNavigation from './StoreSettingsNavigation';
import { buildStoreNav, findActiveGroup, relativeStorePath } from './storeNav';
import BrandLoader from '../BrandLoader';
import { readStoreSnapshot, writeStoreSnapshot } from '../../lib/sessionSnapshots';
import './merchant-settings-frame.css';

/**
 * Pathless layout route for the store admin (`/store/*` for owners,
 * `/stores/:id/*` for admins). Loads the store once, guards access and hands
 * `{ ...parentContext, store, setStore, refreshStore, access, apiBase, uiBase,
 * locales }` to every child page through the outlet context.
 */
export default function StoreLayout() {
    const outlet = useOutletContext();
    const parent = useMemo(() => outlet ?? {}, [outlet]);
    const { id, owner, apiBase, uiBase } = useStoreScope();
    const { t } = useTranslation();
    const location = useLocation();
    const isAdminScope = !owner;
    const unifiedNavigation = owner && parent.unifiedStoreNavigation;
    const canAdminEdit = Array.isArray(parent.permissions) && parent.permissions.includes('stores-edit');

    const access = useMemo(() => {
        if (isAdminScope && canAdminEdit) return fullStoreAccess();
        const permissions = Array.isArray(parent.permissions) ? parent.permissions : [];
        const roles = Array.isArray(parent.me?.roles) ? parent.me.roles : [];
        return storeAccess(roles, permissions);
    }, [isAdminScope, canAdminEdit, parent.permissions, parent.me?.roles]);
    const allowed = isAdminScope ? canAdminEdit : access.hasStoreAccess;

    // An owner's store paints from the last-known copy while /my-store refreshes it.
    const userId = parent.me?.id;
    const [store, setStore] = useState(() => (owner ? readStoreSnapshot(userId) : null));
    const [loading, setLoading] = useState(() => !store);
    const [error, setError] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);

    const refreshStore = useCallback(async () => {
        try {
            const { data } = await api.get(apiBase);
            const next = data?.data ?? data ?? null;
            if (owner) writeStoreSnapshot(userId, next);
            setStore(next);
            setError('');
            return next;
        } catch (e) {
            setError(e.response?.data?.message || e.message);
            throw e;
        } finally {
            setLoading(false);
        }
    }, [apiBase, owner, userId]);

    useEffect(() => {
        if (!allowed) return;
        const snapshot = owner ? readStoreSnapshot(userId) : null;
        setLoading(!snapshot);
        setStore(snapshot);
        refreshStore().catch(() => { /* surfaced through `error` */ });
    }, [allowed, refreshStore, owner, userId]);

    // Close the drawer on every navigation so a tap never leaves it hanging.
    useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

    const groups = useMemo(() => buildStoreNav(t, access), [t, access]);
    const rel = relativeStorePath(location.pathname, uiBase);
    const activeGroup = useMemo(() => findActiveGroup(groups, rel), [groups, rel]);
    const settingsNavigation = unifiedNavigation && activeGroup?.key === 'settings';
    const referenceSettings = settingsNavigation && (['/settings/general', '/settings/store-info', '/settings/head-code', '/settings/seo', '/settings/social-links', '/settings/order-push', '/settings/managers', '/settings/login-sessions'].includes(rel) || rel.startsWith('/settings/webhooks') || rel.startsWith('/settings/public-api'));
    const settingsOrder = ['general', 'domains', 'store-info', 'head-code', 'seo-settings', 'payments', 'digital-delivery', 'notifications', 'order-push', 'shipping', 'social-links', 'managers', 'webhooks', 'public-api', 'login-sessions', 'phone-verification', 'customer-login'];
    const settingsItems = settingsNavigation
        ? [...activeGroup.items].filter((item) => settingsOrder.includes(item.key) || item.isActive(rel))
            .sort((a, b) => settingsOrder.indexOf(a.key) - settingsOrder.indexOf(b.key))
        : [];

    const context = useMemo(() => ({
        ...parent,
        permissions: storeUiPermissions(parent.permissions ?? [], parent.me?.roles ?? []),
        store,
        setStore,
        refreshStore,
        access,
        apiBase,
        uiBase,
        storeId: id,
        isAdminScope,
        locales: {
            supported: Array.isArray(store?.supported_locales) && store.supported_locales.length ? store.supported_locales : ['en'],
            default: store?.default_locale || 'en',
        },
    }), [parent, store, refreshStore, access, apiBase, uiBase, id, isAdminScope]);

    if (!allowed) {
        return <Navigate to={isAdminScope ? '/stores' : '/dashboard'} replace />;
    }

    const sidebarProps = { store, groups, uiBase, isAdminScope, loading };
    // This layout stays mounted across store pages; each page still remounts per path, and while a
    // page's code loads the previous page stays on screen (router navigations are transitions).
    const page = <Suspense fallback={<BrandLoader />}><Fragment key={location.pathname}><Outlet context={context} /></Fragment></Suspense>;

    return (
        <div className="min-w-0">
            <div className="ws-store-content min-w-0 flex-1">
                {/* Mobile / tablet: sticky sub-bar + the active group's items as a scroll strip. */}
                {!unifiedNavigation ? <div className="mb-4 border-b border-slate-200/80 bg-surface/95 sticky -top-3 z-30 -mx-3 backdrop-blur md:-top-5 md:-mx-5">
                    <div className="flex items-center gap-3 px-3 py-2.5 md:px-5">
                        {!unifiedNavigation && <button
                            type="button"
                            onClick={() => setDrawerOpen(true)}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-xs transition hover:bg-brand-light/60 hover:text-brand-dark"
                            aria-label={t('store_nav_open_menu', 'Open store menu')}
                        >
                            <HiOutlineBars3 className="h-5 w-5" aria-hidden />
                        </button>}
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                            {store?.logo_url ? (
                                <img src={store.logo_url} alt="" className="h-8 w-8 shrink-0 rounded-lg border border-slate-200 object-cover" />
                            ) : null}
                            <span className="truncate text-sm font-bold text-slate-900">{store?.name || t('store_nav_untitled', 'My store')}</span>
                            {store ? <StoreStatusPill status={store.status} size="xs" className="shrink-0" /> : null}
                        </div>
                    </div>
                    {!unifiedNavigation && activeGroup ? (
                        <div className="sc-rail flex gap-1.5 overflow-x-auto px-3 pb-2.5 md:px-5">
                            {activeGroup.items.map((item) => {
                                const active = item.isActive(rel);
                                return (
                                    <Link
                                        key={item.key}
                                        to={`${uiBase}/${item.to}`}
                                        aria-current={active ? 'page' : undefined}
                                        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                                            active ? 'bg-brand text-white shadow-sm shadow-brand/25' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-brand-light/70 hover:text-brand-dark'
                                        }`}
                                    >
                                        <item.Icon className="h-4 w-4" aria-hidden />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </div>
                    ) : null}
                </div> : null}

                {loading && !store ? (
                    <div className="flex items-center justify-center rounded-2xl border border-slate-200/80 bg-white py-20 shadow-card">
                        <HiOutlineArrowPath className="h-7 w-7 animate-spin text-brand" aria-hidden />
                    </div>
                ) : error && !store ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
                        <p className="text-sm font-semibold text-red-700">{t('store_nav_load_failed', 'The store could not be loaded.')}</p>
                        <p className="mt-1 text-xs text-red-600">{error}</p>
                        <button
                            type="button"
                            onClick={() => { setLoading(true); refreshStore().catch(() => {}); }}
                            className="mt-4 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-100"
                        >
                            {t('action_retry', 'Retry')}
                        </button>
                    </div>
                ) : (
                    settingsNavigation ? <>
                    {referenceSettings ? <header className="ws-settings-page-heading"><h1>{t('settings', 'Settings')}</h1><p>{t('store_general_control', 'Manage your store')}</p></header> : null}
                    <div className={`ws-settings-layout${referenceSettings ? ' ws-settings-layout--reference' : ''}`}>
                        <StoreSettingsNavigation items={settingsItems} uiBase={uiBase} rel={rel} label={activeGroup.label} />
                        <div className="ws-settings-content">{page}</div>
                    </div></> : page
                )}
            </div>

            {/* Mobile drawer */}
            <Dialog open={!unifiedNavigation && drawerOpen} onClose={() => setDrawerOpen(false)} className="relative z-60">
                <DialogBackdrop
                    transition
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition duration-200 data-closed:opacity-0"
                />
                <div className="fixed inset-0 flex">
                    <DialogPanel
                        transition
                        className="relative flex h-full w-[min(86vw,20rem)] flex-col overflow-y-auto rounded-e-3xl bg-white p-4 shadow-2xl shadow-brand-dark/20 transition duration-300 ease-out data-closed:-translate-x-full data-closed:rtl:translate-x-full"
                    >
                        <div className="mb-3 flex items-center justify-between">
                            <span className="text-sm font-bold text-slate-900">{t('store_nav_title', 'Store admin')}</span>
                            <button
                                type="button"
                                onClick={() => setDrawerOpen(false)}
                                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                aria-label={t('close', 'Close')}
                            >
                                <HiOutlineXMark className="h-5 w-5" aria-hidden />
                            </button>
                        </div>
                        <StoreSidebar {...sidebarProps} onNavigate={() => setDrawerOpen(false)} />
                    </DialogPanel>
                </div>
            </Dialog>
        </div>
    );
}
