import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlineArrowPath } from 'react-icons/hi2';
import api, { clearTokens } from '../../api/client';
import useStoreScope from '../../hooks/useStoreScope';
import { fullStoreAccess, storeAccess } from '../../lib/storeAccess';

const unwrapUser = (payload) => (payload ? payload.data ?? payload : null);

/**
 * Full-viewport shell for the store editor (`/store/customize`, `/stores/:id/customize`).
 *
 * Lives OUTSIDE AppLayout/StoreLayout on purpose — no global header, no store sidebar — so it
 * loads the current user and the store itself and hands children the same outlet context shape
 * StoreLayout provides (`me`, `permissions`, `store`, `access`, `apiBase`, `uiBase`, `locales`…),
 * which keeps `useStoreContext()` / `useStoreLocales()` working unchanged inside the editor.
 */
export default function EditorLayout() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { id, owner, apiBase, uiBase } = useStoreScope();
    const isAdminScope = !owner;

    const [me, setMe] = useState(null);
    const [meLoaded, setMeLoaded] = useState(false);
    const [store, setStore] = useState(null);
    const [storeLoading, setStoreLoading] = useState(true);
    const [storeError, setStoreError] = useState('');

    // Current user — same `/auth/me` contract AppLayout uses; a failure drops the session.
    useEffect(() => {
        let cancelled = false;
        const onSessionExpired = () => { clearTokens(); navigate('/login', { replace: true }); };
        window.addEventListener('sellchase:session-expired', onSessionExpired);
        api.get('/auth/me')
            .then(({ data }) => { if (!cancelled) { setMe(unwrapUser(data?.user)); setMeLoaded(true); } })
            .catch(() => { if (!cancelled) { clearTokens(); navigate('/login', { replace: true }); } });
        return () => { cancelled = true; window.removeEventListener('sellchase:session-expired', onSessionExpired); };
    }, [navigate]);

    const permissions = useMemo(() => (Array.isArray(me?.permissions) ? me.permissions : []), [me?.permissions]);
    const roles = useMemo(() => (Array.isArray(me?.roles) ? me.roles : []), [me?.roles]);
    const canAdminEdit = permissions.includes('stores-edit');
    const access = useMemo(() => (isAdminScope && canAdminEdit ? fullStoreAccess() : storeAccess(roles, permissions)), [isAdminScope, canAdminEdit, roles, permissions]);
    const allowed = meLoaded && (isAdminScope ? canAdminEdit : access.canStoreThemes);

    const refreshStore = useCallback(async () => {
        try {
            const { data } = await api.get(apiBase);
            const next = data?.data ?? data ?? null;
            setStore(next);
            setStoreError('');
            return next;
        } catch (e) {
            setStoreError(e?.response?.data?.message || e?.message || 'Error');
            throw e;
        } finally {
            setStoreLoading(false);
        }
    }, [apiBase]);

    useEffect(() => {
        if (!allowed) return;
        setStoreLoading(true);
        setStore(null);
        refreshStore().catch(() => { /* surfaced through `storeError` */ });
    }, [allowed, refreshStore]);

    const context = useMemo(() => ({
        me,
        permissions,
        isAdmin: roles.includes('Admin'),
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
    }), [me, permissions, roles, store, refreshStore, access, apiBase, uiBase, id, isAdminScope]);

    if (meLoaded && !allowed) return <Navigate to={isAdminScope ? '/stores' : '/dashboard'} replace />;

    return (
        <div className="flex h-screen w-screen flex-col overflow-hidden bg-slate-100 text-[13px] text-slate-800 antialiased">
            {!meLoaded || (storeLoading && !store) ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3" role="status">
                    <HiOutlineArrowPath className="h-7 w-7 animate-spin text-brand" aria-hidden />
                    <p className="text-xs font-medium text-slate-500">{t('editor_loading', 'Loading the editor…')}</p>
                </div>
            ) : storeError && !store ? (
                <div className="flex flex-1 items-center justify-center p-6">
                    <div className="w-full max-w-md rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
                        <p className="text-sm font-semibold text-red-700">{t('store_nav_load_failed', 'The store could not be loaded.')}</p>
                        <p className="mt-1 text-xs text-red-600">{storeError}</p>
                        <div className="mt-4 flex items-center justify-center gap-2">
                            <button type="button" onClick={() => { setStoreLoading(true); refreshStore().catch(() => {}); }} className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400">
                                {t('action_retry', 'Retry')}
                            </button>
                            <button type="button" onClick={() => navigate(`${uiBase}/themes`)} className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40">
                                {t('editor_exit', 'Exit')}
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <Outlet context={context} />
            )}
        </div>
    );
}
