import { useEffect, useState } from 'react';
import {
    Dialog,
    DialogBackdrop,
    DialogPanel,
    DialogTitle,
    Menu,
    MenuButton,
    MenuItem,
    MenuItems,
    MenuSeparator,
} from '@headlessui/react';
import { motion } from 'framer-motion';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { FaWhatsapp } from 'react-icons/fa';
import {
    HiOutlineBars3,
    HiOutlineArrowRightOnRectangle,
    HiOutlineChatBubbleLeftRight,
    HiOutlineClipboardDocumentList,
    HiOutlineChevronDown,
    HiOutlineCog6Tooth,
    HiOutlineCube,
    HiOutlineGlobeAlt,
    HiOutlineBuildingStorefront,
    HiOutlineHome,
    HiOutlineMegaphone,
    HiOutlinePresentationChartLine,
    HiOutlineSignal,
    HiOutlineUserCircle,
    HiOutlineArrowUturnLeft,
    HiOutlineXMark,
} from 'react-icons/hi2';
import api, { clearTokens } from '../api/client';
import { endImpersonation, isImpersonating } from '../utils/impersonation';
import NotificationsMenu from './NotificationsMenu';
import { useChatUnread } from '../lib/useChatUnread';
import { CHAT_ENABLED } from '../lib/features';
import SidebarNav from './SidebarNav';
import UserAvatar from './UserAvatar';
import AdminSidebar from './admin/AdminSidebar';

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

export default function AppLayout() {
    const chatUnread = useChatUnread();
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const [me, setMe] = useState(null);
    const [storeHost, setStoreHost] = useState(null);
    const [logoutOpen, setLogoutOpen] = useState(false);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [impersonationActive, setImpersonationActive] = useState(() => isImpersonating());
    const [impersonationExitLoading, setImpersonationExitLoading] = useState(false);

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
    // public storefront host so the header can offer a direct "View store" link.
    useEffect(() => {
        const roles = Array.isArray(me?.roles) ? me.roles : [];
        const owner = !roles.includes('Admin') && (roles.includes('Merchant') || roles.includes('Supplier'));
        if (!owner) {
            setStoreHost(null);
            return undefined;
        }
        let cancelled = false;
        api.get('/my-store')
            .then(({ data }) => {
                if (!cancelled) setStoreHost(data?.data?.storefront_url ?? (data?.data?.subdomain_host ? `https://${data.data.subdomain_host}` : null));
            })
            .catch(() => { /* no store / not provisioned yet */ });
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
    const canWavex = permissions.includes('wavex-access');
    const canViewMonitoring = permissions.includes('monitoring-live-view');
    const canViewActivityLogs = permissions.includes('activity-logs-list');
    const currentLng = i18n.language?.startsWith('ar') ? 'ar' : 'en';
    const headerIconBtnClass =
        'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/80 transition-all duration-200 hover:bg-white/10 hover:text-white focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/60';

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

    return (
        <div className="flex h-dvh max-h-dvh w-full flex-col overflow-hidden bg-surface">
            <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden bg-surface">
                {isAdminOnly ? <AdminSidebar me={me} permissions={permissions} /> : null}
                <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                {impersonationActive ? (
                    <div
                        className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-amber-200/80 bg-amber-100 px-3 py-2.5 text-sm text-amber-950 md:px-5"
                        role="status"
                    >
                        <p className="flex min-w-0 items-center gap-2 font-medium">
                            <HiOutlineArrowUturnLeft className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                            <span>{t('impersonation_banner')}</span>
                        </p>
                        <button
                            type="button"
                            disabled={impersonationExitLoading}
                            onClick={() => void handleExitImpersonation()}
                            className="shrink-0 rounded-lg bg-amber-900 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-amber-950 disabled:opacity-50"
                        >
                            {impersonationExitLoading ? '…' : t('impersonation_exit')}
                        </button>
                    </div>
                ) : null}
                <header className={`z-40 flex h-[72px] shrink-0 items-center justify-between gap-3 px-3 md:px-5 lg:px-8 ${isAdminOnly ? 'border-b border-slate-200/80 bg-white text-slate-900 shadow-[0_1px_0_rgba(15,23,42,0.02)]' : 'bg-[#0a3d7c] text-white shadow-[0_1px_0_rgba(255,255,255,0.08)]'}`}>
                    {isAdminOnly ? (
                        <>
                            <div className="flex min-w-0 items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setMobileNavOpen(true)}
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-xs transition hover:border-blue-200 hover:bg-blue-50 hover:text-brand lg:hidden"
                                    aria-label={t('nav_all', 'All')}
                                >
                                    <HiOutlineBars3 className="h-5 w-5" aria-hidden />
                                </button>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-bold text-[#0a2540] md:text-base">
                                        {t('admin_control_center', 'Platform control center')}
                                    </p>
                                    <p className="hidden text-xs text-slate-500 sm:block">
                                        {t('admin_control_center_hint', 'Operations, users and marketplace health')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Link
                                    to="/"
                                    className="hidden h-9 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-600 transition hover:bg-blue-50 hover:text-brand md:inline-flex"
                                >
                                    <HiOutlineGlobeAlt className="h-4.5 w-4.5" aria-hidden />
                                    {t('nav_visit_website', 'Website')}
                                </Link>
                                <button
                                    type="button"
                                    onClick={toggleLanguage}
                                    className="inline-flex h-9 min-w-9 items-center justify-center rounded-xl px-2 text-xs font-bold text-slate-600 transition hover:bg-blue-50 hover:text-brand"
                                    aria-label={t('language')}
                                >
                                    {currentLng === 'en' ? 'ع' : 'EN'}
                                </button>
                                <NotificationsMenu isSupplier={false} />
                                <Link
                                    to="/settings/profile"
                                    className="ms-1 flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1 pe-2 shadow-xs transition hover:border-blue-200 hover:bg-blue-50"
                                    aria-label={t('nav_profile')}
                                >
                                    <UserAvatar user={me} alt="" sizeClass="h-8 w-8" />
                                    <span className="hidden max-w-32 truncate text-xs font-semibold text-slate-700 xl:block">{me.name}</span>
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => setLogoutOpen(true)}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                                    aria-label={t('logout')}
                                    title={t('logout')}
                                >
                                    <HiOutlineArrowRightOnRectangle className="h-5 w-5" aria-hidden />
                                </button>
                            </div>
                        </>
                    ) : (
                    <>
                    <div className="flex min-w-0 flex-1 items-center gap-2 lg:gap-3">
                        <Link
                            to="/dashboard"
                            className="me-1 flex shrink-0 items-center rounded-lg outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
                            aria-label={t('app_name')}
                        >
                            <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-xl bg-white shadow-sm">
                                <img src="/icon.png" alt="" className="h-8 w-8 object-contain" />
                            </span>
                            <span className="ms-2 hidden text-lg font-extrabold tracking-tight text-white xl:inline">Sellchaze</span>
                        </Link>
                        <button
                            type="button"
                            onClick={() => setMobileNavOpen(true)}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl px-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                            aria-label={t('nav_all', 'All')}
                            title={t('nav_all', 'All')}
                        >
                            <HiOutlineBars3 className="h-5 w-5" aria-hidden />
                            <span className="hidden sm:inline">{t('nav_all', 'All')}</span>
                        </button>
                        <nav className="hidden min-w-0 items-center gap-1 lg:flex" aria-label={t('primary_navigation', 'Primary navigation')}>
                            <Link to="/dashboard" className="flex items-center gap-2 rounded-xl bg-white px-3.5 py-2.5 text-sm font-semibold text-brand-dark shadow-sm">
                                <HiOutlineHome className="h-5 w-5" aria-hidden />
                                {t('nav_home', 'Home')}
                            </Link>
                            <Link to="/orders/in" className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/90 transition hover:bg-white/10 hover:text-white">
                                <HiOutlineClipboardDocumentList className="h-5 w-5" aria-hidden />
                                {t('orders', 'Orders')}
                            </Link>
                            <Link to="/products" className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/90 transition hover:bg-white/10 hover:text-white">
                                <HiOutlineCube className="h-5 w-5" aria-hidden />
                                {t('products', 'Products')}
                            </Link>
                            <Link to="/feed" className="hidden items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/90 transition hover:bg-white/10 hover:text-white xl:flex">
                                <HiOutlineMegaphone className="h-5 w-5" aria-hidden />
                                {t('feed_title', 'Community')}
                            </Link>
                            <Link to="/store/onboarding" className="hidden items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/90 transition hover:bg-white/10 hover:text-white 2xl:flex">
                                <HiOutlineBuildingStorefront className="h-5 w-5" aria-hidden />
                                {t('store_and_channels', 'Store & Channels')}
                            </Link>
                            {isAdmin ? (
                                <Link to="/admin/reports/orders" className="hidden items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/90 transition hover:bg-white/10 hover:text-white 2xl:flex">
                                    <HiOutlinePresentationChartLine className="h-5 w-5" aria-hidden />
                                    {t('reports', 'Reports')}
                                </Link>
                            ) : null}
                        </nav>
                    </div>
                    {/* hide actions on mobile/tablet; show on desktop */}
                    <div className="ms-auto hidden flex-row items-center gap-3 lg:flex" dir="ltr">
                        <div className="flex items-center gap-1">
                            {canViewMonitoring ? (
                                <Link
                                    to="/admin/monitoring/live"
                                    className={headerIconBtnClass}
                                    title={t('nav_monitoring_live')}
                                    aria-label={t('nav_monitoring_live')}
                                >
                                    <HiOutlineSignal className="h-5 w-5" aria-hidden />
                                </Link>
                            ) : null}
                            {canViewActivityLogs ? (
                                <Link
                                    to="/admin/activity"
                                    className={headerIconBtnClass}
                                    title={t('nav_activity_log')}
                                    aria-label={t('nav_activity_log')}
                                >
                                    <HiOutlineClipboardDocumentList className="h-5 w-5" aria-hidden />
                                </Link>
                            ) : null}
                            {isAdmin ? (
                                <Link
                                    to="/settings"
                                    className={headerIconBtnClass}
                                    title={t('settings')}
                                    aria-label={t('settings')}
                                >
                                    <HiOutlineCog6Tooth className="h-5 w-5" aria-hidden />
                                </Link>
                            ) : null}

                            {storeHost ? (
                                <a
                                    href="/?preview=1"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={headerIconBtnClass}
                                    title={t('view_store') || 'View store'}
                                    aria-label={t('view_store') || 'View store'}
                                >
                                    <HiOutlineBuildingStorefront className="h-5 w-5" aria-hidden />
                                </a>
                            ) : null}

                            {me?.profile?.username ? (
                                <a
                                    href={`/u/${encodeURIComponent(me.profile.username)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={headerIconBtnClass}
                                    title={t('view_public_profile') || 'My public profile'}
                                    aria-label={t('view_public_profile') || 'My public profile'}
                                >
                                    <HiOutlineGlobeAlt className="h-5 w-5" aria-hidden />
                                </a>
                            ) : null}

                            <NotificationsMenu isSupplier={isSupplier} />

                            {CHAT_ENABLED && (
                                <Link
                                    to="/chat"
                                    className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/80 transition-all duration-200 hover:bg-white/10 hover:text-white focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/60"
                                    title={t('nav_messages', 'Messages')}
                                    aria-label={t('nav_messages', 'Messages')}
                                >
                                    <HiOutlineChatBubbleLeftRight className="h-5 w-5" aria-hidden />
                                    {chatUnread > 0 && (
                                        <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold text-[#0a2540] ring-2 ring-[#0a3d7c]">
                                            {chatUnread > 99 ? '99+' : chatUnread}
                                        </span>
                                    )}
                                </Link>
                            )}

                            {canWavex ? (
                                <Link
                                    to="/wavex/chats"
                                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xs ring-1 ring-black/5 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#20bd5a] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#25D366]/40"
                                    title={t('wavex_nav_chats')}
                                    aria-label={t('wavex_nav_chats')}
                                >
                                    <FaWhatsapp className="h-5 w-5" aria-hidden />
                                </Link>
                            ) : null}
                        </div>
                        <Menu as="div" className="relative">
                            <MenuButton
                                type="button"
                                aria-label={t('user_menu_aria', { name: me.name })}
                                className="flex max-w-[min(100vw-9rem,18rem)] items-center gap-2 rounded-xl border-0 bg-transparent py-1 pe-2 ps-1 text-start shadow-none outline-hidden transition-colors hover:bg-white/10 aria-expanded:bg-white/10 focus-visible:ring-2 focus-visible:ring-accent/60 md:max-w-[16rem]"
                            >
                                {({ open }) => (
                                    <>
                                        <UserAvatar user={me} alt="" sizeClass="h-8 w-8 md:h-9 md:w-9" />
                                        <span className="hidden max-w-44 truncate text-sm font-semibold text-white md:inline">
                                            {me.name}
                                        </span>
                                        <HiOutlineChevronDown
                                            className={`h-3.5 w-3.5 shrink-0 text-white/60 transition duration-200 ${open ? '-rotate-180' : ''}`}
                                            aria-hidden
                                        />
                                    </>
                                )}
                            </MenuButton>
                            <MenuItems
                                transition
                                anchor="bottom end"
                                modal={false}
                                className="z-50 mt-2 w-[min(calc(100vw-2rem),18rem)] rounded-xl border border-slate-200/80 bg-white p-1 shadow-lg outline-hidden transition duration-100 ease-out [--anchor-gap:0.5rem] data-closed:scale-95 data-closed:opacity-0"
                            >
                                <div className="rounded-lg px-3 py-2.5">
                                    <div className="flex items-center gap-3">
                                        <UserAvatar user={me} sizeClass="h-11 w-11" alt="" />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate font-semibold text-slate-900">{me.name}</p>
                                            {me.email ? (
                                                <p className="truncate text-xs text-slate-500">{me.email}</p>
                                            ) : null}
                                            {isAdmin ? (
                                                <p className="mt-1 text-xs font-semibold text-accent">
                                                    {t('admin_badge')}
                                                </p>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                                <MenuSeparator className="my-1 h-px bg-slate-100" />
                                <MenuItem>
                                    {({ focus }) => (
                                        <Link
                                            to="/settings/profile"
                                            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-800 ${
                                                focus ? 'bg-slate-50 ring-1 ring-slate-200/80' : 'hover:bg-slate-50'
                                            }`}
                                        >
                                            <HiOutlineUserCircle className="h-5 w-5 shrink-0 text-brand" aria-hidden />
                                            {t('nav_profile')}
                                        </Link>
                                    )}
                                </MenuItem>
                                <MenuSeparator className="my-1 h-px bg-slate-100" />
                                <MenuItem>
                                    {({ focus }) => (
                                        <Link
                                            to="/"
                                            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-800 ${
                                                focus ? 'bg-slate-50 ring-1 ring-slate-200/80' : 'hover:bg-slate-50'
                                            }`}
                                        >
                                            <HiOutlineGlobeAlt className="h-5 w-5 shrink-0 text-brand" aria-hidden />
                                            {t('nav_visit_website', 'Visit website')}
                                        </Link>
                                    )}
                                </MenuItem>
                                <MenuSeparator className="my-1 h-px bg-slate-100" />
                                <MenuItem>
                                    {({ focus }) => (
                                        <button
                                            type="button"
                                            onClick={() => toggleLanguage()}
                                            title={currentLng === 'en' ? 'العربية' : 'English'}
                                            className={`flex w-full items-center gap-1.5 rounded-lg border border-transparent px-3 py-2.5 text-sm font-medium text-slate-800 ${
                                                focus ? 'bg-slate-50 ring-1 ring-slate-200/80' : 'hover:bg-slate-50'
                                            }`}
                                        >
                                            {currentLng === 'en' ? (
                                                <span className="inline-flex items-center gap-1.5">
                                                    <span className="text-base" aria-hidden>
                                                        🇸🇦
                                                    </span>
                                                    العربية
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5">
                                                    <span className="text-base" aria-hidden>
                                                        🇬🇧
                                                    </span>
                                                    English
                                                </span>
                                            )}
                                        </button>
                                    )}
                                </MenuItem>
                                <MenuSeparator className="my-1 h-px bg-slate-100" />
                                <MenuItem>
                                    {({ focus }) => (
                                        <button
                                            type="button"
                                            onClick={() => setLogoutOpen(true)}
                                            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium ${
                                                focus
                                                    ? 'bg-red-50 text-red-700'
                                                    : 'text-slate-700 hover:bg-slate-50'
                                            }`}
                                        >
                                            <HiOutlineArrowRightOnRectangle
                                                className="h-5 w-5 shrink-0 opacity-80"
                                                aria-hidden
                                            />
                                            {t('logout')}
                                        </button>
                                    )}
                                </MenuItem>
                            </MenuItems>
                        </Menu>
                    </div>

                    <div className="ms-auto flex items-center gap-2 lg:hidden">
                        {isAdmin ? (
                            <Link
                                to="/settings"
                                className={headerIconBtnClass}
                                title={t('settings')}
                                aria-label={t('settings')}
                            >
                                <HiOutlineCog6Tooth className="h-5 w-5" aria-hidden />
                            </Link>
                        ) : null}
                        <Menu as="div" className="relative">
                            <MenuButton
                                type="button"
                                aria-label={t('user_menu_aria', { name: me.name })}
                                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-1.5 py-1 shadow-xs"
                            >
                                <UserAvatar user={me} alt="" sizeClass="h-8 w-8" />
                                <HiOutlineChevronDown className="h-3.5 w-3.5 text-slate-400" aria-hidden />
                            </MenuButton>
                            <MenuItems
                                transition
                                anchor="bottom end"
                                modal={false}
                                className="z-50 mt-2 w-[min(calc(100vw-2rem),18rem)] rounded-xl border border-slate-200/80 bg-white p-1 shadow-lg outline-hidden transition duration-100 ease-out [--anchor-gap:0.5rem] data-closed:scale-95 data-closed:opacity-0"
                            >
                                <MenuItem>
                                    {({ focus }) => (
                                        <Link
                                            to="/settings/profile"
                                            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-800 ${
                                                focus ? 'bg-slate-50 ring-1 ring-slate-200/80' : 'hover:bg-slate-50'
                                            }`}
                                        >
                                            <HiOutlineUserCircle className="h-5 w-5 shrink-0 text-brand" aria-hidden />
                                            {t('nav_profile')}
                                        </Link>
                                    )}
                                </MenuItem>
                                <MenuSeparator className="my-1 h-px bg-slate-100" />
                                <MenuItem>
                                    {({ focus }) => (
                                        <Link
                                            to="/"
                                            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-800 ${
                                                focus ? 'bg-slate-50 ring-1 ring-slate-200/80' : 'hover:bg-slate-50'
                                            }`}
                                        >
                                            <HiOutlineGlobeAlt className="h-5 w-5 shrink-0 text-brand" aria-hidden />
                                            {t('nav_visit_website', 'Visit website')}
                                        </Link>
                                    )}
                                </MenuItem>
                                <MenuSeparator className="my-1 h-px bg-slate-100" />
                                <MenuItem>
                                    {({ focus }) => (
                                        <button
                                            type="button"
                                            onClick={() => setLogoutOpen(true)}
                                            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium ${
                                                focus ? 'bg-red-50 text-red-700' : 'text-slate-700 hover:bg-slate-50'
                                            }`}
                                        >
                                            <HiOutlineArrowRightOnRectangle className="h-5 w-5 shrink-0 opacity-80" aria-hidden />
                                            {t('logout')}
                                        </button>
                                    )}
                                </MenuItem>
                            </MenuItems>
                        </Menu>
                    </div>
                    </>
                    )}
                </header>

                <motion.main
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className={`min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-3 md:p-5 lg:p-7 ${isAdminOnly ? 'bg-[#f5f8fc]' : 'bg-surface'}`}
                >
                    <div key={location.pathname} className="sc-page mx-auto w-full max-w-[1440px]">
                        <Outlet
                            context={{
                                me,
                                isAdmin,
                                isSupplier,
                                permissions,
                            }}
                        />
                    </div>
                </motion.main>
                </div>
            </div>

            <Dialog open={logoutOpen} onClose={() => setLogoutOpen(false)} className="relative z-50">
                <DialogBackdrop
                    transition
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition duration-200 data-closed:opacity-0"
                />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <DialogPanel
                        transition
                        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-soft ring-1 ring-slate-200/80 transition duration-200 data-closed:scale-95 data-closed:opacity-0"
                    >
                        <DialogTitle className="text-lg font-bold text-slate-900">
                            {t('logout_confirm_title')}
                        </DialogTitle>
                        <p className="mt-2 text-sm text-slate-600">{t('logout_confirm_body')}</p>
                        <div className="mt-6 flex flex-wrap justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setLogoutOpen(false)}
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                            >
                                {t('cancel')}
                            </button>
                            <button
                                type="button"
                                onClick={() => void confirmLogout()}
                                className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-brand-dark"
                            >
                                {t('logout')}
                            </button>
                        </div>
                    </DialogPanel>
                </div>
            </Dialog>

            <Dialog open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} className="relative z-60">
                <DialogBackdrop
                    transition
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition duration-200 data-closed:opacity-0"
                />
                <div className="fixed inset-0 flex">
                    <DialogPanel
                        transition
                        className="h-full w-[min(86vw,22rem)] overflow-y-auto border-e border-slate-200/80 bg-linear-to-b from-slate-50 via-white to-brand-light/30 px-3 py-4 shadow-soft transition duration-200 data-closed:-translate-x-full"
                    >
                        <div className="mb-4 flex items-center justify-between">
                            <img src="/logo.png" alt={t('app_name')} className="h-10 w-auto object-contain" />
                            <button
                                type="button"
                                onClick={() => setMobileNavOpen(false)}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700"
                                aria-label={t('close')}
                                title={t('close')}
                            >
                                <HiOutlineXMark className="h-5 w-5" aria-hidden />
                            </button>
                        </div>
                        <SidebarNav
                            isAdmin={isAdmin}
                            isSupplier={isSupplier}
                            roles={me.roles ?? []}
                            permissions={permissions}
                            onNavigate={() => setMobileNavOpen(false)}
                        />
                    </DialogPanel>
                </div>
            </Dialog>
        </div>
    );
}
