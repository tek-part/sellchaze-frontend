import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { motion } from 'framer-motion';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useChatUnread } from '../lib/useChatUnread';
import { CHAT_ENABLED } from '../lib/features';
import { FaGoogle, FaWhatsapp } from 'react-icons/fa';
import {
    HiOutlineArrowDownTray,
    HiOutlineArrowsRightLeft,
    HiOutlineArrowTrendingUp,
    HiOutlineArrowUpTray,
    HiOutlineBanknotes,
    HiOutlineRocketLaunch,
    HiOutlineBuildingOffice2,
    HiOutlineChatBubbleLeftRight,
    HiOutlineChevronDown,
    HiOutlineClipboardDocumentList,
    HiOutlineCog6Tooth,
    HiOutlineCreditCard,
    HiOutlineCube,
    HiOutlineDocumentText,
    HiOutlineEnvelope,
    HiOutlineBell,
    HiOutlineHome,
    HiOutlineRectangleGroup,
    HiOutlineRectangleStack,
    HiOutlineShieldCheck,
    HiOutlineShoppingBag,
    HiOutlineSquares2X2,
    HiOutlineBuildingStorefront,
    HiOutlineTag,
    HiOutlineTicket,
    HiOutlineTruck,
    HiOutlineUserCircle,
    HiOutlineUserGroup,
    HiOutlineUsers,
    HiOutlineClock,
    HiOutlineChartBar,
    HiOutlineNewspaper,
    HiOutlinePresentationChartLine,
    HiOutlineSparkles,
} from 'react-icons/hi2';

function usePathPrefix(prefix) {
    const { pathname } = useLocation();
    return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function navLinkClass({ isActive }) {
    return [
        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
        isActive
            ? 'bg-brand text-white shadow-md shadow-brand/25 ring-1 ring-brand/20'
            : 'text-slate-600 hover:bg-white hover:text-brand-dark',
    ].join(' ');
}

function subNavLinkClass({ isActive }) {
    return [
        'flex items-center gap-2 rounded-lg border-s-4 px-3 py-2 text-sm transition-all duration-200',
        isActive
            ? 'border-brand bg-brand font-semibold text-white shadow-xs'
            : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-white hover:text-slate-900',
    ].join(' ');
}

function SectionLabel({ children }) {
    return (
        <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">{children}</p>
    );
}

function NavGroup({ title, icon: Icon, defaultOpen, groupActive, children }) {
    return (
        <Disclosure defaultOpen={defaultOpen}>
            {({ open }) => (
                <div className="flex flex-col overflow-hidden rounded-xl">
                    <DisclosureButton
                        className={[
                            'flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-start text-sm font-medium transition-colors',
                            groupActive
                                ? 'bg-brand-light/90 text-brand-dark'
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
                        <motion.span
                            animate={{ rotate: open ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                            className={`shrink-0 ${groupActive ? 'text-brand' : 'text-slate-400'}`}
                        >
                            <HiOutlineChevronDown className="h-4 w-4" />
                        </motion.span>
                    </DisclosureButton>
                    <DisclosurePanel className="space-y-0.5 px-0 py-1.5">
                        {children}
                    </DisclosurePanel>
                </div>
            )}
        </Disclosure>
    );
}

export default function SidebarNav({ isAdmin = false, isSupplier = false, roles = [], permissions = [], onNavigate }) {
    const { t } = useTranslation();
    const chatUnread = useChatUnread();
    const location = useLocation();
    const adminUsersPendingView =
        location.pathname === '/admin/users' && new URLSearchParams(location.search).get('pending') === '1';
    const adminUsersEmployeesActive = location.pathname.startsWith('/admin/users') && !adminUsersPendingView;
    const can = (p) => permissions.includes(p);
    const isSupplierOnly = isSupplier && !isAdmin;
    const canViewMonitoring = can('monitoring-live-view');
    const openOrders = usePathPrefix('/orders');
    const openDeals = usePathPrefix('/deals');
    const openSettings = usePathPrefix('/settings');
    const openNotifications = usePathPrefix('/notifications');
    const openWavex = usePathPrefix('/wavex');
    const openShipping = usePathPrefix('/shipping');
    const openBalance = usePathPrefix('/balance');
    const openAttributes = usePathPrefix('/attributes');
    const openInventory = usePathPrefix('/inventory');
    const canViewOrdersGroup = (!isSupplierOnly && can('orders-out')) || can('orders-in') || can('orders-create');
    const canViewQuotationsGroup = (!isSupplierOnly && can('quotations-in')) || can('quotations-out');
    const canViewDealsGroup = can('deals-in') || (!isSupplierOnly && can('deals-out'));
    const canViewPipelineSection = canViewOrdersGroup || canViewQuotationsGroup || canViewDealsGroup;
    const canViewCatalogSection =
        can('products-list') || can('categories-list') || can('bundles-list') || can('attributes-list') || can('stores-list');
    const canViewMoreSection =
        !isSupplierOnly && (can('gateways-list') || can('balance-in') || can('balance-out'));
    const canViewAdminLinks =
        can('users-list') || can('users-pending-list') || can('roles-list') || can('activity-logs-list');
    // Show the Admin section only when at least one of its links will render —
    // mirror its actual contents (users/roles/verifications/activity/monitoring)
    // so it never appears as an empty header (e.g. a merchant with suppliers-list).
    const canViewAdminSection =
        canViewAdminLinks || can('verifications-review') || canViewMonitoring;
    const canViewSettingsSection = isAdmin || can('settings-view') || can('settings-edit');
    // Admin-only sidebar: user has Admin role with no business role (Merchant/Supplier/Customer/Employee).
    const hasBusinessRole = Array.isArray(roles)
        && roles.some((r) => ['Merchant', 'Supplier', 'Customer', 'Employee'].includes(r));
    const isAdminOnly = isAdmin && !isSupplier && !hasBusinessRole;
    // Type-based store access. A Merchant/Supplier OWNS exactly one store and
    // sees its full dashboard by virtue of their account type — no per-feature
    // permission needed. Granular store.* permissions still apply to their
    // employees and to admin-internal users (who are not owners themselves).
    const isStoreOwner = Array.isArray(roles) && roles.some((r) => ['Merchant', 'Supplier'].includes(r));
    const canStoreView = isStoreOwner || can('store.view');
    const canStoreProducts = isStoreOwner || can('store.products.manage');
    const canStoreCategories = isStoreOwner || can('store.categories.manage');
    const canStoreOrders = isStoreOwner || can('store.orders.manage');
    const canStoreCoupons = isStoreOwner || can('store.coupons.manage');
    const canStoreReviews = isStoreOwner || can('store.reviews.manage');
    const canStoreAnalytics = isStoreOwner || can('store.analytics.view');
    const canStoreThemes = isStoreOwner || can('store.themes.manage');
    const canStorePages = isStoreOwner || can('store.pages.manage');
    const canStoreMenus = isStoreOwner || can('store.menus.manage');
    const canStoreSettings = isStoreOwner || can('store.settings.manage');
    const openStore = usePathPrefix('/store');
    const storeMyGroup = canStoreSettings || canStoreThemes || canStorePages || canStoreMenus;
    const storeCatalogGroup = canStoreProducts || canStoreCategories;
    const storeSalesGroup = canStoreOrders || canStoreCoupons;
    const hasStoreAccess = canStoreView || storeMyGroup || storeCatalogGroup
        || storeSalesGroup || canStoreReviews || canStoreAnalytics;
    const openReports = usePathPrefix('/admin/reports');
    const openAdminSettings = usePathPrefix('/settings');

    if (isAdminOnly) {
        return (
            <motion.nav
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="flex flex-col"
                aria-label="Main"
                onClick={(event) => {
                    if (event.target instanceof Element && event.target.closest('a')) {
                        onNavigate?.();
                    }
                }}
            >
                <div className="flex flex-col gap-1">
                    <SectionLabel>{t('nav_sidebar_section_overview')}</SectionLabel>
                    <NavLink to="/admin/dashboard" className={navLinkClass}>
                        <HiOutlineHome className="h-5 w-5 shrink-0 opacity-95" aria-hidden />
                        {t('admin_dashboard_title', 'Admin Dashboard')}
                    </NavLink>
                </div>

                <div className="mt-5 flex flex-col gap-1.5 border-t border-slate-200/80 pt-5">
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

                <div className="mt-5 flex flex-col gap-1.5 border-t border-slate-200/80 pt-5">
                    <SectionLabel>{t('nav_admin_section_content', 'Content')}</SectionLabel>
                    <NavLink to="/admin/articles" className={navLinkClass}>
                        <HiOutlineNewspaper className="h-5 w-5 shrink-0 opacity-95" aria-hidden />
                        {t('nav_admin_articles', 'Articles')}
                    </NavLink>
                </div>

                <div className="mt-5 flex flex-col gap-1.5 border-t border-slate-200/80 pt-5">
                    <SectionLabel>{t('nav_sidebar_section_people', 'People')}</SectionLabel>
                    <NavLink to="/feed" className={navLinkClass}>
                        <HiOutlineNewspaper className="h-5 w-5 shrink-0 opacity-95" aria-hidden />
                        {t('feed_title', 'Community')}
                    </NavLink>
                    <NavLink to="/financing" className={navLinkClass}>
                        <HiOutlineBanknotes className="h-5 w-5 shrink-0 opacity-95" aria-hidden />
                        {t('nav_financing', 'Financing')}
                    </NavLink>
                    <NavLink to="/opportunities" className={navLinkClass}>
                        <HiOutlineRocketLaunch className="h-5 w-5 shrink-0 opacity-95" aria-hidden />
                        {t('nav_opportunities', 'Opportunities')}
                    </NavLink>
                    <NavLink to="/crm/suppliers" className={navLinkClass}>
                        <HiOutlineBuildingOffice2 className="h-5 w-5 shrink-0 opacity-95" aria-hidden />
                        {t('suppliers')}
                    </NavLink>
                    <NavLink to="/merchants" className={navLinkClass}>
                        <HiOutlineUserGroup className="h-5 w-5 shrink-0 opacity-95" aria-hidden />
                        {t('nav_merchants')}
                    </NavLink>
                    <NavLink to="/partners" className={navLinkClass}>
                        <HiOutlineUsers className="h-5 w-5 shrink-0 opacity-95" aria-hidden />
                        {t('nav_partners')}
                    </NavLink>
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

                <div className="mt-5 flex flex-col gap-2 border-t border-slate-200/80 pt-5">
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

                <div className="mt-5 flex flex-col gap-2 border-t border-slate-200/80 pt-5">
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
                        <NavLink to="/admin/reports/tickets" className={subNavLinkClass}>
                            <HiOutlineTicket className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                            {t('admin_reports_tickets', 'Tickets')}
                        </NavLink>
                    </NavGroup>
                </div>

                <div className="mt-5 flex flex-col gap-1.5 border-t border-slate-200/80 pt-5">
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

                <div className="mt-5 flex flex-col gap-2 border-t border-slate-200/80 pt-5">
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
                    </NavGroup>
                </div>
            </motion.nav>
        );
    }

    return (
        <motion.nav
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="flex flex-col"
            aria-label="Main"
            onClick={(event) => {
                if (event.target instanceof Element && event.target.closest('a')) {
                    onNavigate?.();
                }
            }}
        >
            <div className="flex flex-col gap-1">
                <SectionLabel>{t('nav_sidebar_section_overview')}</SectionLabel>
                <NavLink to="/dashboard" className={navLinkClass}>
                    <HiOutlineHome className="h-5 w-5 shrink-0 opacity-95" aria-hidden />
                    {t('dashboard')}
                </NavLink>
            </div>

            {(hasStoreAccess || canViewCatalogSection) ? (
                <div className="mt-5 flex flex-col gap-1.5 border-t border-slate-200/80 pt-5">
                    <SectionLabel>{t('nav_store_section')}</SectionLabel>

                    {/* Catalog — the unified per-owner catalog that also powers the
                        storefront, orders and inventory. Products & categories are the
                        most-used items, so they sit at the top as direct links. */}
                    {can('products-list') ? (
                        <NavLink to="/products" className={navLinkClass}>
                            <HiOutlineCube className="h-5 w-5 shrink-0 opacity-95" aria-hidden />
                            {t('products')}
                        </NavLink>
                    ) : null}
                    {can('categories-list') ? (
                        <NavLink to="/categories" className={navLinkClass}>
                            <HiOutlineRectangleStack className="h-5 w-5 shrink-0 opacity-95" aria-hidden />
                            {t('categories')}
                        </NavLink>
                    ) : null}
                    {can('bundles-list') ? (
                        <NavLink to="/bundles" className={navLinkClass}>
                            <HiOutlineRectangleGroup className="h-5 w-5 shrink-0 opacity-95" aria-hidden />
                            {t('bundles')}
                        </NavLink>
                    ) : null}

                    {can('products-list') ? (
                        <NavGroup
                            title={t('nav_group_inventory')}
                            icon={HiOutlineBuildingOffice2}
                            defaultOpen={openInventory}
                            groupActive={openInventory}
                        >
                            <NavLink to="/inventory" end className={subNavLinkClass}>
                                <HiOutlineCube className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                                {t('inventory_title')}
                            </NavLink>
                            <NavLink to="/inventory/transfers" className={subNavLinkClass}>
                                <HiOutlineArrowsRightLeft className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                                {t('inventory_transfers')}
                            </NavLink>
                        </NavGroup>
                    ) : null}

                    {can('attributes-list') ? (
                        <NavGroup
                            title={t('perm_group_attributes')}
                            icon={HiOutlineTag}
                            defaultOpen={openAttributes}
                            groupActive={openAttributes}
                        >
                            <NavLink to="/attributes" end className={subNavLinkClass}>
                                <HiOutlineTag className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                                {t('attributes_nav_definitions')}
                            </NavLink>
                            <NavLink to="/attributes/groups" className={subNavLinkClass}>
                                <HiOutlineRectangleGroup className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                                {t('attributes_nav_groups')}
                            </NavLink>
                        </NavGroup>
                    ) : null}

                    {storeSalesGroup ? (
                        <NavGroup
                            title={t('nav_store_group_sales')}
                            icon={HiOutlineShoppingBag}
                            defaultOpen={openStore}
                            groupActive={openStore}
                        >
                            {canStoreOrders ? (
                                <NavLink to="/store/orders" className={subNavLinkClass}>
                                    <HiOutlineShoppingBag className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                                    {t('nav_store_orders')}
                                </NavLink>
                            ) : null}
                            {canStoreCoupons ? (
                                <NavLink to="/store/coupons" className={subNavLinkClass}>
                                    <HiOutlineTicket className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                                    {t('nav_store_coupons')}
                                </NavLink>
                            ) : null}
                        </NavGroup>
                    ) : null}

                    {storeMyGroup ? (
                        <NavGroup
                            title={t('nav_store_group_mystore')}
                            icon={HiOutlineBuildingStorefront}
                            defaultOpen={openStore}
                            groupActive={openStore}
                        >
                            {canStoreSettings ? (
                                <NavLink to="/store/settings" className={subNavLinkClass}>
                                    <HiOutlineCog6Tooth className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                                    {t('nav_store_settings')}
                                </NavLink>
                            ) : null}
                            {canStoreThemes ? (
                                <NavLink to="/store/themes" className={subNavLinkClass}>
                                    <HiOutlineRectangleGroup className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                                    {t('nav_store_appearance')}
                                </NavLink>
                            ) : null}
                            {canStorePages ? (
                                <NavLink to="/store/pages" className={subNavLinkClass}>
                                    <HiOutlineDocumentText className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                                    {t('nav_store_pages')}
                                </NavLink>
                            ) : null}
                            {canStoreMenus ? (
                                <NavLink to="/store/menus" className={subNavLinkClass}>
                                    <HiOutlineNewspaper className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                                    {t('nav_store_menus')}
                                </NavLink>
                            ) : null}
                        </NavGroup>
                    ) : null}

                    {canStoreReviews ? (
                        <NavLink to="/store/reviews" className={navLinkClass}>
                            <HiOutlineChatBubbleLeftRight className="h-5 w-5 shrink-0 opacity-95" aria-hidden />
                            {t('nav_store_reviews')}
                        </NavLink>
                    ) : null}

                    {canStoreAnalytics ? (
                        <NavLink to="/store/analytics" className={navLinkClass}>
                            <HiOutlineChartBar className="h-5 w-5 shrink-0 opacity-95" aria-hidden />
                            {t('nav_store_analytics')}
                        </NavLink>
                    ) : null}

                    {can('stores-list') ? (
                        <NavLink to="/stores" className={navLinkClass}>
                            <HiOutlineBuildingStorefront className="h-5 w-5 shrink-0 opacity-95" aria-hidden />
                            {t('nav_stores')}
                        </NavLink>
                    ) : null}
                </div>
            ) : null}

            {canViewPipelineSection ? (
                <div className="mt-5 flex flex-col gap-2 border-t border-slate-200/80 pt-5">
                    <SectionLabel>{t('nav_sidebar_section_pipeline')}</SectionLabel>
                    {canViewOrdersGroup ? (
                        <NavGroup title={t('nav_group_orders')} icon={HiOutlineShoppingBag} defaultOpen={openOrders} groupActive={openOrders}>
                    {!isSupplierOnly ? (
                        <NavLink to="/orders/in" className={subNavLinkClass}>
                            <span className="text-xs opacity-80" aria-hidden>
                                →
                            </span>
                            {t('orders_in')}
                        </NavLink>
                    ) : null}
                    <NavLink to="/orders/out" className={subNavLinkClass}>
                        <span className="text-xs opacity-80" aria-hidden>
                            {isSupplierOnly ? '→' : '←'}
                        </span>
                        {isSupplierOnly ? t('orders_out_supplier') : t('orders_out')}
                    </NavLink>
                        </NavGroup>
                    ) : null}

                    {canViewQuotationsGroup ? (
                        <NavLink to="/quotations" className={navLinkClass}>
                            <HiOutlineDocumentText className="h-5 w-5 shrink-0 opacity-95" aria-hidden />
                            {t('nav_group_quotations')}
                        </NavLink>
                    ) : null}

                    <NavLink to="/ledger" className={navLinkClass}>
                        <HiOutlineBanknotes className="h-5 w-5 shrink-0 opacity-95" aria-hidden />
                        {t('nav_ledger')}
                    </NavLink>

                    {canViewDealsGroup ? (
                        <NavGroup
                    title={t('nav_group_deals')}
                    icon={HiOutlineArrowTrendingUp}
                    defaultOpen={openDeals}
                    groupActive={openDeals}
                >
                    <NavLink to="/deals/in" className={subNavLinkClass}>
                        <span className="text-xs opacity-80" aria-hidden>
                            ↓
                        </span>
                        {t('deals_in')}
                    </NavLink>
                    {!isSupplierOnly ? (
                        <NavLink to="/deals/out" className={subNavLinkClass}>
                            <span className="text-xs opacity-80" aria-hidden>
                                ↑
                            </span>
                            {t('deals_out')}
                        </NavLink>
                    ) : null}
                        </NavGroup>
                    ) : null}
                </div>
            ) : null}

            <div className="mt-5 flex flex-col gap-1.5 border-t border-slate-200/80 pt-5">
                <SectionLabel>{t('nav_sidebar_section_people')}</SectionLabel>
                <NavLink to="/feed" className={navLinkClass}>
                    <HiOutlineNewspaper className="h-5 w-5 shrink-0 opacity-95" aria-hidden />
                    {t('feed_title', 'Community')}
                </NavLink>
                <NavLink to="/partners" className={navLinkClass}>
                    <HiOutlineUserGroup className="h-5 w-5 shrink-0 opacity-95" aria-hidden />
                    {t('nav_partners')}
                </NavLink>
                <NavLink to="/financing" className={navLinkClass}>
                    <HiOutlineBanknotes className="h-5 w-5 shrink-0 opacity-95" aria-hidden />
                    {t('nav_financing', 'Financing')}
                </NavLink>
                <NavLink to="/opportunities" className={navLinkClass}>
                    <HiOutlineRocketLaunch className="h-5 w-5 shrink-0 opacity-95" aria-hidden />
                    {t('nav_opportunities', 'Opportunities')}
                </NavLink>
                {!isSupplierOnly && (can('suppliers-list') || isAdmin) ? (
                    <NavLink to="/crm/suppliers" className={navLinkClass}>
                        <HiOutlineUserGroup className="h-5 w-5 shrink-0 opacity-95" aria-hidden />
                        {t('suppliers')}
                    </NavLink>
                ) : null}
                {!isSupplierOnly && isAdmin ? (
                    <NavLink to="/merchants" className={navLinkClass}>
                        <HiOutlineBuildingOffice2 className="h-5 w-5 shrink-0 opacity-95" aria-hidden />
                        {t('nav_merchants')}
                    </NavLink>
                ) : null}
                {!isAdmin ? (
                    <NavLink to="/employees" className={navLinkClass}>
                        <HiOutlineUsers className="h-5 w-5 shrink-0 opacity-95" aria-hidden />
                        {t('nav_employees')}
                    </NavLink>
                ) : null}
            </div>

            {can('deliveries-list') || can('shipping-companies-list') ? (
                <div className="mt-5 flex flex-col gap-2 border-t border-slate-200/80 pt-5">
                    <SectionLabel>{t('nav_sidebar_section_shipping')}</SectionLabel>
                    <NavGroup
                        title={t('nav_group_shipping')}
                        icon={HiOutlineTruck}
                        defaultOpen={openShipping}
                        groupActive={openShipping}
                    >
                        {can('deliveries-list') ? (
                            <NavLink to="/shipping/deliveries" className={subNavLinkClass}>
                                <HiOutlineTruck className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                                {t('shipping_deliveries_nav')}
                            </NavLink>
                        ) : null}
                        {can('shipping-companies-list') ? (
                            <NavLink to="/shipping/companies" className={subNavLinkClass}>
                                <HiOutlineCube className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                                {t('shipping_companies_nav')}
                            </NavLink>
                        ) : null}
                    </NavGroup>
                </div>
            ) : null}

            {can('tickets-list') ? (
                <div className="mt-5 flex flex-col gap-1.5 border-t border-slate-200/80 pt-5">
                    <SectionLabel>{t('nav_sidebar_section_support')}</SectionLabel>
                    <NavLink to="/tickets" className={navLinkClass}>
                        <HiOutlineTicket className="h-5 w-5 shrink-0 opacity-95" aria-hidden />
                        {t('tickets')}
                    </NavLink>
                </div>
            ) : null}

            {can('wavex-access') ? (
                <div className="mt-5 flex flex-col gap-2 border-t border-slate-200/80 pt-5">
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
            ) : null}

            {canViewMoreSection ? (
                <div className="mt-5 flex flex-col gap-1.5 border-t border-slate-200/80 pt-5">
                    <SectionLabel>{t('nav_sidebar_section_more')}</SectionLabel>
                    {can('gateways-list') ? (
                        <NavLink to="/gateways" className={navLinkClass}>
                            <HiOutlineCreditCard className="h-5 w-5 shrink-0 opacity-95" aria-hidden />
                            {t('payment_methods')}
                        </NavLink>
                    ) : null}
                    {isAdmin || can('balance-in') || can('balance-out') ? (
                        <NavGroup
                            title={t('perm_group_balance')}
                            icon={HiOutlineBanknotes}
                            defaultOpen={openBalance}
                            groupActive={openBalance}
                        >
                            <NavLink to="/balance" end className={subNavLinkClass}>
                                <HiOutlineBanknotes className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                                {t('balance_nav_overview')}
                            </NavLink>
                            {(isAdmin || can('balance-in')) && (
                                <NavLink to="/balance/in" className={subNavLinkClass}>
                                    <HiOutlineArrowDownTray className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                                    {t('balance_nav_in')}
                                </NavLink>
                            )}
                            {(isAdmin || can('balance-out')) && (
                                <NavLink to="/balance/out" className={subNavLinkClass}>
                                    <HiOutlineArrowUpTray className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                                    {t('balance_nav_out')}
                                </NavLink>
                            )}
                        </NavGroup>
                    ) : null}
                </div>
            ) : null}

            {canViewAdminSection ? (
                <div className="mt-5 flex flex-col gap-1.5 border-t border-slate-200/80 pt-5">
                    <SectionLabel>{t('nav_sidebar_section_admin')}</SectionLabel>
                    {can('users-list') ? (
                        <NavLink
                            to="/admin/users"
                            className={() =>
                                navLinkClass({
                                    isActive: adminUsersEmployeesActive,
                                })
                            }
                        >
                            <HiOutlineUsers className="h-5 w-5 shrink-0 opacity-95" aria-hidden />
                            {t('nav_admin_users')}
                        </NavLink>
                    ) : null}
                    {can('users-pending-list') ? (
                        <NavLink
                            to="/admin/users?pending=1"
                            className={() =>
                                navLinkClass({
                                    isActive: adminUsersPendingView,
                                })
                            }
                        >
                            <HiOutlineClock className="h-5 w-5 shrink-0 opacity-95" aria-hidden />
                            {t('nav_pending_registrations')}
                        </NavLink>
                    ) : null}
                    {can('roles-list') ? (
                        <NavLink to="/admin/roles" className={navLinkClass}>
                            <HiOutlineShieldCheck className="h-5 w-5 shrink-0 opacity-95" aria-hidden />
                            {t('roles')}
                        </NavLink>
                    ) : null}
                    {can('verifications-review') ? (
                        <NavLink to="/admin/verifications" className={navLinkClass}>
                            <HiOutlineShieldCheck className="h-5 w-5 shrink-0 opacity-95" aria-hidden />
                            {t('nav_admin_verifications')}
                        </NavLink>
                    ) : null}
                    {can('activity-logs-list') ? (
                        <NavLink to="/admin/activity" className={navLinkClass}>
                            <HiOutlineClipboardDocumentList className="h-5 w-5 shrink-0 opacity-95" aria-hidden />
                            {t('nav_activity_log')}
                        </NavLink>
                    ) : null}
                    {canViewMonitoring ? (
                        <NavLink to="/admin/monitoring/live" className={navLinkClass}>
                            <HiOutlineRectangleStack className="h-5 w-5 shrink-0 opacity-95" aria-hidden />
                            {t('nav_monitoring_live')}
                        </NavLink>
                    ) : null}
                </div>
            ) : null}

            <div className="mt-5 flex flex-col gap-2 border-t border-slate-200/80 pt-5">
                <SectionLabel>{t('nav_sidebar_section_settings')}</SectionLabel>
                <NavGroup
                    title={t('settings')}
                    icon={HiOutlineCog6Tooth}
                    defaultOpen={openSettings || openNotifications}
                    groupActive={openSettings || openNotifications}
                >
                    <NavLink to="/notifications" className={subNavLinkClass}>
                        <HiOutlineBell className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                        {t('nav_notifications')}
                    </NavLink>
                    <NavLink to="/pricing" className={subNavLinkClass}>
                        <HiOutlineSparkles className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                        {t('sub_plans_title', 'Plans')}
                    </NavLink>
                    <NavLink to="/settings/profile" className={subNavLinkClass}>
                        <HiOutlineUserCircle className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                        {t('nav_profile')}
                    </NavLink>
                    {canViewSettingsSection ? (
                        <>
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
                        </>
                    ) : null}
                </NavGroup>
            </div>
        </motion.nav>
    );
}
