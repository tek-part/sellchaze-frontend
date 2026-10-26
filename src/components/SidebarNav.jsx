import NavigationResults from './workspace/NavigationResults';
import useWorkspaceCopy from './workspace/workspaceCopy';
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useChatUnread } from '../lib/useChatUnread';
import { CHAT_ENABLED } from '../lib/features';
import { storeAccess } from '../lib/storeAccess';

import { buildWorkspaceStoreNav, workspaceStoreItemActive } from './store/workspaceStoreNav';
import { DashboardIcon, SidebarChevronIcon } from './workspace/SidebarReferenceIcons';
import { FaGoogle, FaWhatsapp } from 'react-icons/fa';
import {
    HiOutlineBanknotes,
    HiOutlineChatBubbleLeftRight,
    HiOutlineChevronDown,
    HiOutlineClipboardDocumentList,
    HiOutlineCog6Tooth,
    HiOutlineDocumentText,
    HiOutlineEnvelope,
    HiOutlineHome,
    HiOutlineRectangleStack,
    HiOutlineShieldCheck,
    HiOutlineShoppingBag,
    HiOutlineSquares2X2,
    HiOutlineUserCircle,
    HiOutlineUserGroup,
    HiOutlineUsers,
    HiOutlineClock,
    HiOutlineChartBar,
    HiOutlineNewspaper,
    HiOutlinePresentationChartLine,
    HiOutlineQuestionMarkCircle,
    HiOutlineSparkles,
    HiOutlineCurrencyDollar,
} from './workspace/WorkspaceIcons';

function usePathPrefix(prefix) {
    const { pathname } = useLocation();
    return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function listNavLinkClass({ isActive }) {
    return [
        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
        isActive
            ? 'bg-brand text-white shadow-md shadow-brand/25 ring-1 ring-brand/20'
            : 'text-slate-600 hover:bg-white hover:text-brand-dark',
    ].join(' ');
}

function listSubNavLinkClass({ isActive }) {
    return [
        'flex items-center gap-2 rounded-lg border-s-4 px-3 py-2 text-sm transition-all duration-200',
        isActive
            ? 'border-brand bg-brand font-semibold text-white shadow-xs'
            : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-white hover:text-slate-900',
    ].join(' ');
}

// Mega drawer links: open, borderless rows that glide sideways on hover.
function megaNavLinkClass({ isActive }) {
    return [
        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition-all duration-200',
        isActive
            ? 'bg-linear-to-r from-brand to-accent-dark text-white shadow-md shadow-brand/25'
            : 'text-slate-700 hover:translate-x-1 hover:bg-brand-light/70 hover:text-brand-dark rtl:hover:-translate-x-1',
    ].join(' ');
}

function megaSubNavLinkClass({ isActive }) {
    return [
        'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all duration-200',
        isActive
            ? 'bg-brand-light font-semibold text-brand-dark'
            : 'text-slate-500 hover:translate-x-1 hover:bg-slate-50 hover:text-brand-dark rtl:hover:-translate-x-1',
    ].join(' ');
}

/**
 * 'list' — the classic vertical sidebar (admin aside, narrow mobile drawer).
 * 'mega' — the wide "All" drawer: sections become cards laid out 3-up on desktop.
 */
const NavVariantContext = createContext('list');
const ExpandedGroupContext = createContext('');
const AccordionContext = createContext(null);

function RegisterDisclosure({ groupKey, close, buttonRef, groupActive, expanded, open }) {
    const accordion = useContext(AccordionContext);
    const previous = useRef({ groupActive, expanded });
    useEffect(() => {
        const newlyActive = groupActive && !previous.current.groupActive;
        const newlyExpanded = expanded && !previous.current.expanded;
        previous.current = { groupActive, expanded };
        if ((newlyActive || newlyExpanded) && !open) buttonRef.current?.click();
    }, [groupActive, expanded, open, buttonRef]);
    useEffect(() => {
        if (!accordion) return;
        const unregister = accordion.register(groupKey, close);
        if (expanded || groupActive) accordion.activate(groupKey, expanded ? buttonRef.current : document.activeElement);
        return unregister;
    }, [accordion, groupKey, close, buttonRef, groupActive, expanded]);
    return null;
}

// No boxes: sections are open columns of links separated by whitespace only.
const MEGA_SECTION_CLASS = 'flex flex-col gap-0.5';

function SectionLabel({ children }) {
    const mega = useContext(NavVariantContext) === 'mega';
    if (mega) {
        return (
            <div className="mb-2 px-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand">{children}</p>
                <span
                    className="mt-2 block h-px w-full bg-linear-to-r from-brand/40 via-brand/10 to-transparent rtl:bg-linear-to-l"
                    aria-hidden
                />
            </div>
        );
    }
    return (
        <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">{children}</p>
    );
}

function NavGroup({ title, groupKey = title, icon: Icon, defaultOpen, groupActive, reference = false, children }) {
    const mega = useContext(NavVariantContext) === 'mega';
    const expanded = useContext(ExpandedGroupContext) === groupKey;
    const accordion = useContext(AccordionContext); const buttonRef = useRef(null);
    const ChevronIcon = reference ? SidebarChevronIcon : HiOutlineChevronDown;
    return (
        <Disclosure defaultOpen={defaultOpen || expanded}>
            {({ open, close }) => (
                <div className="flex flex-col overflow-hidden rounded-xl">
                    <RegisterDisclosure groupKey={groupKey} close={close} buttonRef={buttonRef} groupActive={groupActive} expanded={expanded} open={open} />
                    <DisclosureButton
                        ref={buttonRef}
                        onClick={() => accordion?.activate(groupKey, buttonRef.current)}
                        onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') accordion?.activate(groupKey, buttonRef.current); }}
                        className={[
                            'flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-start font-medium transition-all duration-200',
                            mega ? 'text-[15px]' : 'text-sm',
                            groupActive
                                ? 'bg-brand-light/90 text-brand-dark'
                                : mega
                                    ? 'text-slate-700 hover:translate-x-1 hover:bg-brand-light/70 hover:text-brand-dark rtl:hover:-translate-x-1'
                                    : 'text-slate-700 hover:bg-white/70',
                        ].join(' ')}
                    >
                        <span className="flex min-w-0 items-center gap-2">
                            <Icon
                                className={`h-5 w-5 shrink-0 ${groupActive ? 'text-brand' : 'text-brand/80'}`}
                                aria-hidden
                            />
                            <span className="truncate">{title}</span>
                        </span>
                        <span
                            className={`shrink-0 transition-transform duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none ${open ? 'rotate-180' : ''} ${groupActive ? 'text-brand' : 'text-slate-400'}`}
                        >
                            <ChevronIcon className={reference ? 'h-5 w-5' : 'h-4 w-4'} />
                        </span>
                    </DisclosureButton>
                    <DisclosurePanel
                        transition
                        className={`ws-nav-panel ${mega ? 'ms-5 border-s-2 border-brand/15 ps-2 py-1.5' : 'px-0 py-1.5'}`}
                    >
                        <div className="ws-nav-panel-inner space-y-0.5">{children}</div>
                    </DisclosurePanel>
                </div>
            )}
        </Disclosure>
    );
}

export default function SidebarNav({ variant = 'list', expandedGroup = '', exclusive = false, ...props }) {
    const closers = useRef(new Map());
    const accordion = useMemo(() => exclusive ? {
        register(key, close) { closers.current.set(key, close); return () => { if (closers.current.get(key) === close) closers.current.delete(key); }; },
        activate(key, target) { for (const [other, close] of closers.current) if (other !== key) close(target); },
    } : null, [exclusive]);
    return (
        <NavVariantContext.Provider value={variant}>
            <AccordionContext.Provider value={accordion}><ExpandedGroupContext.Provider value={expandedGroup}><SidebarNavInner {...props} variant={variant} /></ExpandedGroupContext.Provider></AccordionContext.Provider>
        </NavVariantContext.Provider>
    );
}

function SidebarNavInner({ isAdmin = false, roles = [], permissions = [], onNavigate, onExpand, compact = false, variant = 'list', query = '', search = false }) {
    const { t } = useTranslation();
    const ws = useWorkspaceCopy();
    const mega = variant === 'mega';
    // Link styles follow the variant; the JSX below references these local names.
    const navLinkClass = mega ? megaNavLinkClass : listNavLinkClass;
    const subNavLinkClass = mega ? megaSubNavLinkClass : listSubNavLinkClass;
    // Section wrapper: divider-separated blocks in the list sidebar, open columns in the mega drawer.
    const sec = (listClass) => (mega ? MEGA_SECTION_CLASS : listClass);
    // Mega drawer: CSS columns flow sections of uneven height, 3-up on desktop.
    const navClass = mega
        ? 'columns-1 gap-10 md:columns-2 lg:columns-3 [&>div]:mb-9 [&>div]:break-inside-avoid'
        : 'flex flex-col';
    const chatUnread = useChatUnread({ enabled: isAdmin });
    const location = useLocation();
    const adminUsersPendingView =
        location.pathname === '/admin/users' && new URLSearchParams(location.search).get('pending') === '1';
    const adminUsersEmployeesActive = location.pathname.startsWith('/admin/users') && !adminUsersPendingView;
    const openWavex = usePathPrefix('/wavex');
    // Show the Admin section only when at least one of its links will render —
    // mirror its actual contents (users/roles/verifications/activity/monitoring)
    // so it never appears as an empty header.
    // Admin-only sidebar: user has Admin role with no business role (Merchant/Customer/Employee).
    const hasBusinessRole = Array.isArray(roles)
        && roles.some((r) => ['Merchant', 'Customer', 'Employee'].includes(r));
    const isAdminOnly = isAdmin && !hasBusinessRole;
    // Type-based store access (owners see everything; employees/admin-internal
    // users need store.* grants) — shared with StoreLayout via lib/storeAccess.
    const access = storeAccess(roles, permissions);
    const { hasStoreAccess } = access;

    const workspaceStoreGroups = hasStoreAccess ? buildWorkspaceStoreNav(t, access, permissions) : [];

    const openReports = usePathPrefix('/admin/reports');
    const openAdminSettings = usePathPrefix('/settings');

    if (isAdminOnly) {
        return (
            <NavigationResults query={query} search={search} onNavigate={onNavigate} compact={compact} onExpand={onExpand}>
            <nav
                className={navClass}
                aria-label="Main"
                onClick={(event) => {
                    if (event.target instanceof Element && event.target.closest('a')) {
                        onNavigate?.();
                    }
                }}
            >
                <div className={sec('flex flex-col gap-1')}>
                    <SectionLabel>{t('nav_sidebar_section_overview')}</SectionLabel>
                    <NavLink to="/admin/dashboard" className={navLinkClass}>
                        <HiOutlineHome className="h-5 w-5 shrink-0 opacity-95" aria-hidden />
                        {t('admin_dashboard_title', 'Admin Dashboard')}
                    </NavLink>
                </div>

                <div className={sec('mt-5 flex flex-col gap-1.5 border-t border-slate-200/80 pt-5')}>
                    <SectionLabel>{t('nav_admin_section_users_access', 'Users & Access')}</SectionLabel>
                    <NavLink
                        to="/admin/users"
                        className={() => navLinkClass({ isActive: adminUsersEmployeesActive })}
                    >
                        <HiOutlineUsers className="h-5 w-5 shrink-0 opacity-95" aria-hidden />
                        {t('nav_admin_users')}
                    </NavLink>
                    <NavLink
                        to="/admin/users?pending=1"
                        className={() => navLinkClass({ isActive: adminUsersPendingView })}
                    >
                        <HiOutlineClock className="h-5 w-5 shrink-0 opacity-95" aria-hidden />
                        {t('nav_pending_registrations')}
                    </NavLink>
                    <NavLink to="/admin/roles" className={navLinkClass}>
                        <HiOutlineShieldCheck className="h-5 w-5 shrink-0 opacity-95" aria-hidden />
                        {t('roles')}
                    </NavLink>
                    <NavLink to="/admin/verifications" className={navLinkClass}>
                        <HiOutlineShieldCheck className="h-5 w-5 shrink-0 opacity-95" aria-hidden />
                        {t('nav_admin_verifications')}
                    </NavLink>
                </div>

                <div className={sec('mt-5 flex flex-col gap-1.5 border-t border-slate-200/80 pt-5')}>
                    <SectionLabel>{t('nav_admin_section_content', 'Content')}</SectionLabel>
                    <NavLink to="/admin/articles" className={navLinkClass}>
                        <HiOutlineNewspaper className="h-5 w-5 shrink-0 opacity-95" aria-hidden />
                        {t('nav_admin_articles', 'Articles')}
                    </NavLink>
                    <NavLink to="/admin/themes" className={navLinkClass}>
                        <HiOutlineSparkles className="h-5 w-5 shrink-0 opacity-95" aria-hidden />
                        {t('theme_marketplace_admin', 'Theme marketplace')}
                    </NavLink>
                </div>

                <div className={sec('mt-5 flex flex-col gap-1.5 border-t border-slate-200/80 pt-5')}>
                    <SectionLabel>{t('nav_sidebar_section_people', 'People')}</SectionLabel>
                    <NavLink to="/community" className={navLinkClass}>
                        <HiOutlineNewspaper className="h-5 w-5 shrink-0 opacity-95" aria-hidden />
                        {t('feed_title', 'Community')}
                    </NavLink>
                    <NavLink to="/merchants" className={navLinkClass}>
                        <HiOutlineUserGroup className="h-5 w-5 shrink-0 opacity-95" aria-hidden />
                        {t('nav_merchants')}
                    </NavLink>
                    {permissions.includes('support-tickets-manage') ? (
                        <NavLink to="/admin/support" className={navLinkClass}>
                            <HiOutlineQuestionMarkCircle className="h-5 w-5 shrink-0 opacity-95" aria-hidden />
                            {t('nav_admin_support', 'Support inbox')}
                        </NavLink>
                    ) : null}
                    {CHAT_ENABLED && (
                        <NavLink to="/chat" className={navLinkClass}>
                            <HiOutlineChatBubbleLeftRight className="h-5 w-5 shrink-0 opacity-95" aria-hidden />
                            <span className="flex-1">{t('nav_messages', 'Messages')}</span>
                            {chatUnread > 0 && (
                                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-bold text-white">
                                    {chatUnread > 99 ? '99+' : chatUnread}
                                </span>
                            )}
                        </NavLink>
                    )}
                </div>

                <div className={sec('mt-5 flex flex-col gap-2 border-t border-slate-200/80 pt-5')}>
                    <SectionLabel>{t('nav_sidebar_section_wavex')}</SectionLabel>
                    <NavGroup
                        title={t('nav_group_wavex')}
                        icon={FaWhatsapp}
                        defaultOpen={openWavex}
                        groupActive={openWavex}
                    >
                        <NavLink to="/wavex/settings" className={subNavLinkClass}>
                            <HiOutlineCog6Tooth className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                            {t('wavex_nav_settings')}
                        </NavLink>
                        <NavLink to="/wavex/connect" className={subNavLinkClass}>
                            <HiOutlineShieldCheck className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                            {t('wavex_nav_connect')}
                        </NavLink>
                        <NavLink to="/wavex/chats" className={subNavLinkClass}>
                            <HiOutlineEnvelope className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                            {t('wavex_nav_chats')}
                        </NavLink>
                        <NavLink to="/wavex/templates" className={subNavLinkClass}>
                            <HiOutlineDocumentText className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                            {t('wavex_nav_templates')}
                        </NavLink>
                        <NavLink to="/wavex/groups" className={subNavLinkClass}>
                            <HiOutlineUserGroup className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                            {t('wavex_nav_groups')}
                        </NavLink>
                        <NavLink to="/wavex/campaigns" className={subNavLinkClass}>
                            <HiOutlineRectangleStack className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                            {t('wavex_nav_campaigns')}
                        </NavLink>
                    </NavGroup>
                </div>

                <div className={sec('mt-5 flex flex-col gap-2 border-t border-slate-200/80 pt-5')}>
                    <SectionLabel>{t('nav_admin_section_reports', 'Reports & Analytics')}</SectionLabel>
                    <NavGroup
                        title={t('nav_admin_reports', 'Reports')}
                        icon={HiOutlinePresentationChartLine}
                        defaultOpen={openReports}
                        groupActive={openReports}
                    >
                        <NavLink to="/admin/reports/users" className={subNavLinkClass}>
                            <HiOutlineUsers className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                            {t('admin_reports_users', 'Users Growth')}
                        </NavLink>
                        <NavLink to="/admin/reports/orders" className={subNavLinkClass}>
                            <HiOutlineShoppingBag className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                            {t('admin_reports_orders', 'Orders Volume')}
                        </NavLink>
                        <NavLink to="/admin/reports/revenue" className={subNavLinkClass}>
                            <HiOutlineBanknotes className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                            {t('admin_reports_revenue', 'Revenue')}
                        </NavLink>
                    </NavGroup>
                </div>

                <div className={sec('mt-5 flex flex-col gap-1.5 border-t border-slate-200/80 pt-5')}>
                    <SectionLabel>{t('nav_admin_section_system', 'System')}</SectionLabel>
                    <NavLink to="/admin/monitoring/live" className={navLinkClass}>
                        <HiOutlineChartBar className="h-5 w-5 shrink-0 opacity-95" aria-hidden />
                        {t('nav_monitoring_live')}
                    </NavLink>
                    <NavLink to="/admin/monitoring/sessions" className={navLinkClass}>
                        <HiOutlineRectangleStack className="h-5 w-5 shrink-0 opacity-95" aria-hidden />
                        {t('nav_monitoring_sessions', 'Sessions')}
                    </NavLink>
                    <NavLink to="/admin/activity" className={navLinkClass}>
                        <HiOutlineClipboardDocumentList className="h-5 w-5 shrink-0 opacity-95" aria-hidden />
                        {t('nav_activity_log')}
                    </NavLink>
                </div>

                <div className={sec('mt-5 flex flex-col gap-2 border-t border-slate-200/80 pt-5')}>
                    <SectionLabel>{t('nav_sidebar_section_settings')}</SectionLabel>
                    <NavGroup
                        title={t('settings')}
                        icon={HiOutlineCog6Tooth}
                        defaultOpen={openAdminSettings}
                        groupActive={openAdminSettings}
                    >
                        <NavLink to="/pricing" className={subNavLinkClass}>
                            <HiOutlineSparkles className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                            {t('sub_plans_title', 'Plans')}
                        </NavLink>
                        <NavLink to="/settings/profile" className={subNavLinkClass}>
                            <HiOutlineUserCircle className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                            {t('nav_profile')}
                        </NavLink>
                        <NavLink to="/settings/sectors" className={subNavLinkClass}>
                            <HiOutlineSquares2X2 className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                            {t('mysec_title', 'My sectors')}
                        </NavLink>
                        <NavLink to="/settings" end className={subNavLinkClass}>
                            <HiOutlineCog6Tooth className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                            {t('settings_overview')}
                        </NavLink>
                        <NavLink to="/settings/email" className={subNavLinkClass}>
                            <HiOutlineEnvelope className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                            {t('settings_email')}
                        </NavLink>
                        <NavLink to="/settings/google" className={subNavLinkClass}>
                            <FaGoogle className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
                            {t('settings_google')}
                        </NavLink>
                        <NavLink to="/settings/currencies" className={subNavLinkClass}>
                            <HiOutlineCurrencyDollar className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                            {t('settings_currencies')}
                        </NavLink>
                    </NavGroup>
                </div>
            </nav>
            </NavigationResults>
        );
    }

    return (
        <NavigationResults query={query} search={search} onNavigate={onNavigate} compact={compact} onExpand={onExpand} additionalItems={(workspaceStoreGroups.find((group) => group.key === 'settings')?.items ?? []).map((item) => ({ ...item, group: t('nav_store_settings', 'Store settings') }))}>
            <nav
            className={navClass}
            aria-label="Main"
            onClick={(event) => {
                if (event.target instanceof Element && event.target.closest('a')) {
                    onNavigate?.();
                }
            }}
        >
            <div className={sec('flex flex-col gap-1')}>
                <SectionLabel>{hasStoreAccess ? t('workspace_nav_main', 'Main') : t('nav_sidebar_section_overview')}</SectionLabel>
                {hasStoreAccess ? <NavLink to="/dashboard" className={navLinkClass}>
                    <DashboardIcon className="h-5 w-5 shrink-0 opacity-95" aria-hidden />
                    {ws('statisticsDashboard')}
                </NavLink> : <NavLink to="/community" className={navLinkClass}><HiOutlineUsers aria-hidden />{t('feed_title', 'Community')}</NavLink>}
                {workspaceStoreGroups.filter((group) => group.section !== 'other').map((group) => {
                    if (group.single) {
                        const active = group.items ? group.items.some((item) => workspaceStoreItemActive(item, location.pathname)) : workspaceStoreItemActive(group, location.pathname);
                        return <Link key={group.key} to={group.to} aria-current={active ? 'page' : undefined} className={navLinkClass({ isActive: active })}><group.Icon className="h-5 w-5 shrink-0" aria-hidden />{group.label}</Link>;
                    }
                    const active = group.items.some((item) => workspaceStoreItemActive(item, location.pathname));
                    return <NavGroup reference key={group.key} groupKey={`store-${group.key}`} title={group.label} icon={group.Icon} defaultOpen={active} groupActive={active}>
                        {group.items.map((item) => <Link key={item.key} to={item.to} aria-current={workspaceStoreItemActive(item, location.pathname) ? 'page' : undefined} className={subNavLinkClass({ isActive: workspaceStoreItemActive(item, location.pathname) })}><span className="ws-nav-label">{item.label}</span>{item.badge ? <span className="ws-nav-badge">{item.badge}</span> : null}</Link>)}
                    </NavGroup>;
                })}
            </div>

            {workspaceStoreGroups.some((group) => group.section === 'other') ? <div className={sec('mt-5 flex flex-col gap-1.5')}>
                <SectionLabel>{ws('communityServices')}</SectionLabel>
                {workspaceStoreGroups.filter((group) => group.section === 'other').map((group) => {
                    const active = group.items ? group.items.some((item) => workspaceStoreItemActive(item, location.pathname)) : workspaceStoreItemActive(group, location.pathname);
                    return <Link key={group.key} to={group.to} aria-current={active ? 'page' : undefined} className={navLinkClass({ isActive: active })}><group.Icon className="h-5 w-5" aria-hidden /><span className="ws-nav-label">{group.label}</span>{group.badge ? <span className="ws-nav-badge">{group.badge}</span> : null}</Link>;
                })}
            </div> : null}
        </nav>
            </NavigationResults>
    );
}
