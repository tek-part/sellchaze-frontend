import { useCallback, useEffect, useMemo, useState } from 'react';
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';
import { Link, Navigate, Outlet, useLocation, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlineArrowPath, HiOutlineBars3, HiOutlineXMark } from 'react-icons/hi2';
import api from '../../api/client';
import useStoreScope from '../../hooks/useStoreScope';
import { fullStoreAccess, storeAccess } from '../../lib/storeAccess';
import StoreSidebar from './StoreSidebar';
import StoreStatusPill from './StoreStatusPill';
import { buildStoreNav, findActiveGroup, relativeStorePath } from './storeNav';

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
    const canAdminEdit = Array.isArray(parent.permissions) && parent.permissions.includes('stores-edit');

    const access = useMemo(() => {
        if (isAdminScope && canAdminEdit) return fullStoreAccess();
        const permissions = Array.isArray(parent.permissions) ? parent.permissions : [];
        const roles = Array.isArray(parent.me?.roles) ? parent.me.roles : [];
        return storeAccess(roles, permissions);
    }, [isAdminScope, canAdminEdit, parent.permissions, parent.me?.roles]);
    const allowed = isAdminScope ? canAdminEdit : access.hasStoreAccess;

    const [store, setStore] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);

    const refreshStore = useCallback(async () => {
        try {
            const { data } = await api.get(apiBase);
            const next = data?.data ?? data ?? null;
            setStore(next);
            setError('');
            return next;
        } catch (e) {
            setError(e.response?.data?.message || e.message);
            throw e;
        } finally {
            setLoading(false);
        }
    }, [apiBase]);

    useEffect(() => {
        if (!allowed) return;
        setLoading(true);
        setStore(null);
        refreshStore().catch(() => { /* surfaced through `error` */ });
    }, [allowed, refreshStore]);

    // Close the drawer on every navigation so a tap never leaves it hanging.
    useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

    const groups = useMemo(() => buildStoreNav(t, access), [t, access]);
    const rel = relativeStorePath(location.pathname, uiBase);
    const activeGroup = useMemo(() => findActiveGroup(groups, rel), [groups, rel]);

    const context = useMemo(() => ({
        ...parent,
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

    return (
        <div className="flex items-start gap-6">
            {/* Desktop rail */}
            <aside className="sticky top-0 hidden w-64 shrink-0 self-start lg:block">
                <StoreSidebar {...sidebarProps} />
            </aside>

            <div className="min-w-0 flex-1">
                {/* Mobile / tablet: sticky sub-bar + the active group's items as a scroll strip. */}
                <div className="sticky -top-3 z-30 -mx-3 mb-4 border-b border-slate-200/80 bg-surface/95 backdrop-blur md:-top-5 md:-mx-5 lg:hidden">
                    <div className="flex items-center gap-3 px-3 py-2.5 md:px-5">
                        <button
                            type="button"
                            onClick={() => setDrawerOpen(true)}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-xs transition hover:bg-brand-light/60 hover:text-brand-dark"
                            aria-label={t('store_nav_open_menu', 'Open store menu')}
                        >
                            <HiOutlineBars3 className="h-5 w-5" aria-hidden />
                        </button>
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                            {store?.logo_url ? (
                                <img src={store.logo_url} alt="" className="h-8 w-8 shrink-0 rounded-lg border border-slate-200 object-cover" />
                            ) : null}
                            <span className="truncate text-sm font-bold text-slate-900">{store?.name || t('store_nav_untitled', 'My store')}</span>
                            {store ? <StoreStatusPill status={store.status} size="xs" className="shrink-0" /> : null}
                        </div>
                    </div>
                    {activeGroup ? (
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
                </div>

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
                    <Outlet context={context} />
                )}
            </div>

            {/* Mobile drawer */}
            <Dialog open={drawerOpen} onClose={() => setDrawerOpen(false)} className="relative z-60 lg:hidden">
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
