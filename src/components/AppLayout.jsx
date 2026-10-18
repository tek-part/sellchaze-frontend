import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { motion, useReducedMotion } from 'framer-motion';
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { HiOutlineArrowUturnLeft, HiOutlineXMark, HiOutlineMagnifyingGlass, HiOutlineLanguage, HiOutlineEye } from './workspace/WorkspaceIcons';
import api, { clearTokens } from '../api/client';
import { endImpersonation, isImpersonating } from '../utils/impersonation';
import { useChatUnread } from '../lib/useChatUnread';
import SidebarNav from './SidebarNav';
import AdminSidebar from './admin/AdminSidebar';
import MerchantSidebar from './MerchantSidebar';
import MerchantSidebarFooter from './workspace/MerchantSidebarFooter';
import WorkspaceHeader from './workspace/WorkspaceHeader';
import WorkspaceAppearanceControl from './workspace/WorkspaceAppearanceControl';
import useWorkspaceAppearance from './workspace/useWorkspaceAppearance';
import useWorkspaceCopy from './workspace/workspaceCopy';
import './workspace/workspace.css';
import { storeAccess } from '../lib/storeAccess';
import { merchantWorkspaceRouteAllowed } from '../lib/merchantWorkspaceRoutes';
import { WorkspaceIconProvider } from './workspace/WorkspaceIcons';

function unwrapUser(payload) {
    if (!payload) {
        return null;
    }
    return payload.data ?? payload;
}

function applyLocale(next) {
    localStorage.setItem('sellchase_locale', next);
    document.documentElement.setAttribute('dir', next === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', next);
}

function navigationViewport() {
    const frame = document.querySelector('.ws-frame[data-merchant-workspace]');
    return { width: frame?.clientWidth ?? window.innerWidth, merchant: Boolean(frame) };
}

export default function AppLayout() {
    const chatUnread = useChatUnread();
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const [me, setMe] = useState(null);
    // Public URL of the owner's storefront (custom domain > primary domain > tenant
    // subdomain). null = no store yet, so the header hides the "View store" button.
    const [storeUrl, setStoreUrl] = useState(null);
    const [logoutOpen, setLogoutOpen] = useState(false);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [mobileDrawerWidth, setMobileDrawerWidth] = useState(null);
    const [mobileDrawerViewportWidth, setMobileDrawerViewportWidth] = useState(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const sidebarToggleRef = useRef(null);
    const [impersonationActive, setImpersonationActive] = useState(() => isImpersonating());
    const [impersonationExitLoading, setImpersonationExitLoading] = useState(false);
    const appearance = useWorkspaceAppearance();
    const reducedMotion = useReducedMotion();
    const ws = useWorkspaceCopy();
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [navigationQuery, setNavigationQuery] = useState('');
    const openMobileNavigation = () => {
        // Preserve the actual available width when the dialog locks scrolling.
        const viewport = navigationViewport();
        setMobileDrawerViewportWidth(viewport.merchant ? viewport.width : null);
        setMobileDrawerWidth(Math.min(384, viewport.width * 0.75));
        setMobileNavOpen(true);
    };
    useEffect(() => {
        if (!mobileNavOpen) return;
        const resize = () => {
            if (window.matchMedia('(min-width: 768px)').matches) setMobileNavOpen(false);
            else {
                const viewport = navigationViewport();
                setMobileDrawerViewportWidth(viewport.merchant ? viewport.width : null);
                setMobileDrawerWidth(Math.min(384, viewport.width * 0.75));
            }
        };
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
    }, [mobileNavOpen]);
    useLayoutEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        return () => window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, [location.pathname]);
    useEffect(() => {
        document.body.setAttribute('data-workspace-theme', appearance.theme);
        const roles = me?.roles || [];
        const operator = roles.includes('Admin') && !roles.some((role) => ['Merchant', 'Supplier', 'Customer', 'Employee'].includes(role));
        document.body.setAttribute('data-workspace-merchant', String(Boolean(me) && !operator));
        return () => { document.body.removeAttribute('data-workspace-theme'); document.body.removeAttribute('data-workspace-merchant'); };
    }, [appearance.theme, me]);
    useEffect(() => {
        setMobileNavOpen(false); setSearchOpen(false); setNavigationQuery(''); setSearchQuery('');
    }, [location.pathname]);
    useEffect(() => {
        const shortcut = (event) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setSearchOpen(true); }
        };
        window.addEventListener('keydown', shortcut);
        return () => window.removeEventListener('keydown', shortcut);
    }, []);


    useEffect(() => {
        let cancelled = false;

        const onSessionExpired = () => {
            clearTokens();
            navigate('/login', { replace: true });
        };

        window.addEventListener('sellchase:session-expired', onSessionExpired);

        const fetchMe = async () => {
            try {
                const { data } = await api.get('/auth/me');
                if (!cancelled) {
                    setMe(unwrapUser(data.user));
                }
            } catch {
                if (!cancelled) {
                    clearTokens();
                    navigate('/login', { replace: true });
                }
            }
        };
        void fetchMe();
        const onMeUpdated = () => {
            void fetchMe();
            setImpersonationActive(isImpersonating());
        };
        window.addEventListener('sellchase:me-updated', onMeUpdated);
        return () => {
            cancelled = true;
            window.removeEventListener('sellchase:session-expired', onSessionExpired);
            window.removeEventListener('sellchase:me-updated', onMeUpdated);
        };
    }, [navigate]);

    // Owners (Merchant/Supplier, non-admin) own exactly one store — resolve its
    // public storefront URL so the header can offer a direct "View store" link.
    // Owners without a published store (404, draft, or no URL yet) get no button at all.
    useEffect(() => {
        const roles = Array.isArray(me?.roles) ? me.roles : [];
        const owner = !roles.includes('Admin') && (roles.includes('Merchant') || roles.includes('Supplier'));
        if (!owner) {
            setStoreUrl(null);
            return undefined;
        }
        let cancelled = false;
        api.get('/my-store')
            .then(({ data }) => {
                if (cancelled) return;
                const store = data?.data;
                // Only a published store is reachable on its public host; a draft
                // store answers "No store for this host", so offer no link for it.
                const url = store?.status === 'active' ? (store?.public_url || store?.storefront_url) : null;
                setStoreUrl(url || null);
            })
            .catch(() => { if (!cancelled) setStoreUrl(null); });
        return () => { cancelled = true; };
    }, [me]);

    async function confirmLogout() {
        const refresh = localStorage.getItem('sellchase_refresh_token');
        try {
            await api.post('/auth/logout', refresh ? { refresh_token: refresh } : {});
        } catch {
            /* ignore */
        }
        clearTokens();
        setLogoutOpen(false);
        toast.success(t('toast_signed_out'));
        navigate('/', { replace: true });
    }

    if (!me) {
        return (
            <div className="flex h-dvh items-center justify-center bg-surface">
                <motion.div
                    initial={{ opacity: 0.5 }}
                    animate={{ opacity: 1 }}
                    transition={{ repeat: Infinity, duration: 1.2, repeatType: 'reverse' }}
                    className="h-10 w-10 rounded-full border-2 border-brand border-t-transparent"
                    aria-hidden
                />
            </div>
        );
    }

    const isAdmin = Array.isArray(me.roles) && me.roles.includes('Admin');
    const isSupplier = Array.isArray(me.roles) && me.roles.includes('Supplier');
    const hasBusinessRole = Array.isArray(me.roles)
        && me.roles.some((role) => ['Merchant', 'Supplier', 'Customer', 'Employee'].includes(role));
    const isAdminOnly = isAdmin && !hasBusinessRole;
    const permissions = Array.isArray(me?.permissions) ? me.permissions : [];
    const currentLng = i18n.language?.startsWith('ar') ? 'ar' : 'en';


    function toggleLanguage() {
        const next = currentLng === 'en' ? 'ar' : 'en';
        void i18n.changeLanguage(next);
        applyLocale(next);
    }

    async function handleExitImpersonation() {
        if (impersonationExitLoading) {
            return;
        }
        setImpersonationExitLoading(true);
        try {
            const refresh = localStorage.getItem('sellchase_refresh_token');
            try {
                await api.post('/auth/logout', refresh ? { refresh_token: refresh } : {});
            } catch {
                /* ignore */
            }
            if (endImpersonation()) {
                // Full reload so the app re-bootstraps with the restored ADMIN token and
                // lands on the admin dashboard. A soft navigate can race the stale `me`
                // and land the admin token on a page it was just impersonating.
                window.location.assign('/admin/dashboard');
            } else {
                toast.error(t('impersonation_exit_failed_toast'));
                window.location.assign('/login');
            }
        } finally {
            setImpersonationExitLoading(false);
        }
    }

    const merchantWorkspace = !isAdminOnly;
    const hasOwnedWorkspace = storeAccess(me.roles ?? [], permissions).hasStoreAccess;
    if (merchantWorkspace && (!merchantWorkspaceRouteAllowed(location.pathname) || (!hasOwnedWorkspace && location.pathname === '/dashboard'))) return <Navigate to={hasOwnedWorkspace ? '/dashboard' : '/community'} replace />;

    const navigationProps = { isAdmin, isSupplier, roles: me.roles ?? [], permissions };
    const Sidebar = isAdminOnly ? AdminSidebar : MerchantSidebar;
    return (
        <WorkspaceIconProvider><div className="sc-workspace ws-frame" data-workspace-theme={appearance.theme} data-merchant-workspace={merchantWorkspace || undefined}>
            <a href="#workspace-content" className="ws-skip-link">{currentLng === 'ar' ? 'انتقل إلى المحتوى' : 'Skip to content'}</a>
            <motion.div id="workspace-sidebar" className="ws-sidebar-container" data-collapsed={sidebarCollapsed || undefined} initial={false} animate={{ width: sidebarCollapsed ? 64 : 272 }} transition={{ duration: reducedMotion ? 0 : 0.15, ease: [0.4, 0, 0.2, 1] }}>
                <Sidebar me={me} permissions={permissions} storeUrl={storeUrl} toggleButtonRef={merchantWorkspace ? sidebarToggleRef : undefined} collapsed={sidebarCollapsed} onSearch={() => setSearchOpen(true)} onCollapse={() => { setSidebarCollapsed(true); requestAnimationFrame(() => sidebarToggleRef.current?.focus()); }} onExpand={() => { setSidebarCollapsed(false); requestAnimationFrame(() => sidebarToggleRef.current?.focus()); }} />
                {merchantWorkspace ? <button type="button" className="ws-sidebar-rail" tabIndex={-1} aria-label={ws(sidebarCollapsed ? 'expand' : 'collapse')} title={ws(sidebarCollapsed ? 'expand' : 'collapse')} aria-expanded={!sidebarCollapsed} aria-controls="workspace-sidebar" onClick={() => { setSidebarCollapsed(value => !value); requestAnimationFrame(() => sidebarToggleRef.current?.focus()); }} /> : null}
            </motion.div>
            <div className="ws-main-column">
                <div className="ws-header-container">
                {impersonationActive ? <div className="ws-impersonation" role="status">
                    <p><HiOutlineArrowUturnLeft aria-hidden />{t('impersonation_banner')}</p>
                    <button type="button" disabled={impersonationExitLoading} onClick={() => void handleExitImpersonation()}>{impersonationExitLoading ? '…' : t('impersonation_exit')}</button>
                </div> : null}
                <WorkspaceHeader merchantWorkspace={merchantWorkspace} me={me} permissions={permissions} storeUrl={storeUrl} isSupplier={isSupplier} chatUnread={chatUnread} appearance={appearance} onLanguage={toggleLanguage} onNavigation={openMobileNavigation} onToggleSidebar={() => setSidebarCollapsed((value) => !value)} sidebarToggleRef={sidebarToggleRef} collapsed={sidebarCollapsed} onSearch={() => setSearchOpen(true)} onLogout={() => setLogoutOpen(true)} />
                </div>
                <main id="workspace-content" tabIndex={-1} className="ws-main-scroll">
                    <div key={location.pathname} className="ws-page"><Outlet context={{ me, isAdmin, isSupplier, permissions, unifiedStoreNavigation: !isAdminOnly }} /></div>
                </main>
            </div>
            <Dialog open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} className="ws-dialog-layer">
                <DialogBackdrop transition className="ws-backdrop" />
                <div className="ws-drawer-position" dir={currentLng === 'ar' ? 'rtl' : 'ltr'} style={mobileDrawerViewportWidth ? { width: mobileDrawerViewportWidth, left: 0, right: 'auto' } : undefined}>
                    <DialogPanel transition className="ws-sidebar ws-drawer" style={{ width: mobileDrawerWidth ?? undefined }} data-workspace-theme={appearance.theme}>
                        <div className="ws-sidebar-brand"><Link to={isAdminOnly ? '/admin/dashboard' : '/dashboard'}><img src="/icon.png" alt="" /><DialogTitle as="strong">Sellchaze</DialogTitle></Link><div className="ws-sidebar-brand-actions">{merchantWorkspace && storeUrl ? <a href={storeUrl} target="_blank" rel="noopener noreferrer" className="ws-icon-button" aria-label={t('view_store', 'View store')} title={t('view_store', 'View store')}><HiOutlineEye aria-hidden /></a> : null}<button type="button" className="ws-icon-button" onClick={() => setMobileNavOpen(false)} aria-label={t('close')}><HiOutlineXMark aria-hidden /></button></div></div>
                        {!merchantWorkspace ? <div className="ws-sidebar-tools"><label className="ws-sidebar-search"><HiOutlineMagnifyingGlass aria-hidden /><input value={navigationQuery} onChange={(e) => setNavigationQuery(e.target.value)} placeholder={ws('search')} aria-label={ws('search')} /></label></div> : null}
                        <div className={`ws-sidebar-scroll${merchantWorkspace ? ' ws-sidebar-scroll--merchant' : ''}`}><SidebarNav {...navigationProps} query={merchantWorkspace ? '' : navigationQuery} onNavigate={() => setMobileNavOpen(false)} />
                            {merchantWorkspace ? <div className="ws-mobile-sidebar-preferences"><WorkspaceAppearanceControl appearance={appearance} inDrawer /><button type="button" className="ws-icon-button" onClick={toggleLanguage} aria-label={ws('language')}><HiOutlineLanguage aria-hidden /></button></div> : null}
                            {merchantWorkspace && me.roles?.some(role => ['Merchant', 'Supplier'].includes(role)) && !me.parent_user_id ? <MerchantSidebarFooter onNavigate={() => setMobileNavOpen(false)} /> : null}
                        </div>
                        {!merchantWorkspace ? <div className="ws-sidebar-footer"><div className="ws-drawer-preferences"><WorkspaceAppearanceControl appearance={appearance} inDrawer /><button type="button" className="ws-icon-button" onClick={toggleLanguage} aria-label={ws('language')}><HiOutlineLanguage aria-hidden /></button></div><Link to="/contact" onClick={() => setMobileNavOpen(false)}>{ws('help')}</Link></div> : null}
                    </DialogPanel>
                </div>
            </Dialog>
            <Dialog open={searchOpen} onClose={() => setSearchOpen(false)} className="ws-dialog-layer">
                <DialogBackdrop transition className="ws-backdrop" />
                <div className="ws-search-position"><DialogPanel transition className="ws-search-dialog" data-workspace-theme={appearance.theme}>
                    <div className="ws-search-dialog-header"><div><DialogTitle>{ws('searchTitle')}</DialogTitle><p>{ws('searchHint')}</p></div><button type="button" className="ws-icon-button" onClick={() => setSearchOpen(false)} aria-label={t('close')}><HiOutlineXMark aria-hidden /></button></div>
                    <label className="ws-command-input"><HiOutlineMagnifyingGlass aria-hidden /><input data-autofocus value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={ws('search')} aria-label={ws('search')} /></label>
                    <div className="ws-command-results"><SidebarNav {...navigationProps} query={searchQuery} search onNavigate={() => setSearchOpen(false)} /></div>
                </DialogPanel></div>
            </Dialog>
            <Dialog open={logoutOpen} onClose={() => setLogoutOpen(false)} className="ws-dialog-layer">
                <DialogBackdrop transition className="ws-backdrop" />
                <div className="ws-confirm-position"><DialogPanel transition className="ws-confirm-dialog">
                    <DialogTitle>{t('logout_confirm_title')}</DialogTitle><p>{t('logout_confirm_body')}</p>
                    <div className="ws-confirm-actions"><button type="button" className="ws-secondary-button" onClick={() => setLogoutOpen(false)}>{t('cancel')}</button><button type="button" className="ws-primary-button" onClick={() => void confirmLogout()}>{t('logout')}</button></div>
                </DialogPanel></div>
            </Dialog>
        </div></WorkspaceIconProvider>
    );
}
