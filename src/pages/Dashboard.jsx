import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Reveal from '../components/Reveal';
import {
    HiArrowDownTray,
    HiArrowUpTray,
    HiChartBar,
    HiCube,
    HiDocumentDuplicate,
    HiOutlineRectangleGroup,
    HiOutlineArrowRight,
    HiOutlineMegaphone,
    HiOutlinePaintBrush,
    HiOutlineUserGroup,
    HiOutlineClipboardDocumentList,
    HiSquares2X2,
    HiUsers,
} from 'react-icons/hi2';
import api from '../api/client';
import DashboardAnalytics from '../components/dashboard/DashboardAnalytics';
import OnboardingChecklist from '../components/OnboardingChecklist';
import { usePermissions } from '../hooks/usePermissions';
import {
    STAT_KEY_PERMISSION,
    SUPPLIER_STAT_KEY_PERMISSION,
    dashboardHasAnyAnalyticsSection,
} from '../utils/dashboardPermissions';

const STAT_META = [
    {
        key: 'orders_out',
        labelKey: 'stat_orders_out',
        Icon: HiArrowUpTray,
        accent: 'text-brand',
        iconWrap: 'bg-brand-light text-brand',
    },
    {
        key: 'orders_in',
        labelKey: 'stat_orders_in',
        Icon: HiArrowDownTray,
        accent: 'text-brand-dark',
        iconWrap: 'bg-brand-light/80 text-brand-dark',
    },
    {
        key: 'quotations_out',
        labelKey: 'stat_quotations_out',
        Icon: HiDocumentDuplicate,
        accent: 'text-accent-dark',
        iconWrap: 'bg-accent-light text-accent-dark',
    },
    {
        key: 'quotations_in',
        labelKey: 'stat_quotations_in',
        Icon: HiDocumentDuplicate,
        accent: 'text-blue-700',
        iconWrap: 'bg-blue-50 text-blue-700',
    },
    {
        key: 'deals_out',
        labelKey: 'stat_deals_out',
        Icon: HiChartBar,
        accent: 'text-brand',
        iconWrap: 'bg-slate-100 text-brand',
    },
    {
        key: 'deals_in',
        labelKey: 'stat_deals_in',
        Icon: HiChartBar,
        accent: 'text-slate-700',
        iconWrap: 'bg-surface-muted text-slate-700',
    },
    {
        key: 'users',
        labelKey: 'stat_users',
        Icon: HiUsers,
        accent: 'text-brand-dark',
        iconWrap: 'bg-brand-light text-brand-dark',
    },
    {
        key: 'products',
        labelKey: 'stat_products',
        Icon: HiCube,
        accent: 'text-accent-dark',
        iconWrap: 'bg-accent-light text-accent-dark',
    },
    {
        key: 'categories',
        labelKey: 'stat_categories',
        Icon: HiSquares2X2,
        accent: 'text-slate-700',
        iconWrap: 'bg-surface-muted text-slate-700',
    },
    {
        key: 'bundles',
        labelKey: 'stat_bundles',
        Icon: HiOutlineRectangleGroup,
        accent: 'text-blue-800',
        iconWrap: 'bg-blue-50 text-blue-800',
    },
];

const SUPPLIER_STAT_META = [
    {
        key: 'orders_out',
        labelKey: 'stat_orders_out_supplier',
        Icon: HiArrowUpTray,
        iconWrap: 'bg-brand-light text-brand',
    },
    {
        key: 'orders_awaiting_quotation',
        labelKey: 'stat_orders_awaiting_quotation',
        Icon: HiDocumentDuplicate,
        iconWrap: 'bg-accent-light text-accent-dark',
    },
    {
        key: 'quotations_out',
        labelKey: 'stat_quotations_out',
        Icon: HiDocumentDuplicate,
        iconWrap: 'bg-blue-50 text-blue-700',
    },
    {
        key: 'deals_in',
        labelKey: 'stat_deals_in',
        Icon: HiChartBar,
        iconWrap: 'bg-surface-muted text-slate-700',
    },
];

export default function Dashboard() {
    const { t } = useTranslation();
    const { can, isAdmin, isSupplier, me } = usePermissions();
    const [stats, setStats] = useState(null);
    const [err, setErr] = useState('');

    // Admin-only users: has Admin role and no business role (Merchant/Supplier/Customer/Employee).
    const roles = Array.isArray(me?.roles) ? me.roles : [];
    const hasBusinessRole = roles.some((r) => ['Merchant', 'Supplier', 'Customer', 'Employee'].includes(r));
    const isAdminOnly = isAdmin && !isSupplier && !hasBusinessRole;
    const loadDashboard = useCallback(async () => {
        if (isAdminOnly) return;
        const { data } = await api.get('/dashboard');
        setStats(data);
    }, [isAdminOnly]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                await loadDashboard();
            } catch (e) {
                if (!cancelled) {
                    setErr(e.response?.data?.message || e.message);
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [loadDashboard]);

    const counts = stats?.counts ?? {};
    const isSupplierMode = stats?.dashboard_mode === 'supplier';

    const visibleStats = useMemo(() => {
        const meta = isSupplierMode ? SUPPLIER_STAT_META : STAT_META;
        const permMap = isSupplierMode ? SUPPLIER_STAT_KEY_PERMISSION : STAT_KEY_PERMISSION;
        return meta.filter(({ key }) => {
            const perm = permMap[key];
            if (!perm) {
                return true;
            }
            return can(perm);
        });
    }, [isSupplierMode, can]);

    if (isAdminOnly) {
        return <Navigate to="/admin/dashboard" replace />;
    }

    const showAnalytics = stats ? dashboardHasAnyAnalyticsSection(isSupplierMode, can) : false;
    const showEmptyDashboard = stats && visibleStats.length === 0 && !showAnalytics;
    const firstName = String(me?.name || t('there', 'there')).trim().split(/\s+/)[0];
    const quickAccess = [
        { to: '/orders/in', label: t('orders', 'Orders'), Icon: HiDocumentDuplicate, show: can('orders-in') || can('orders-out') },
        { to: '/products', label: t('products', 'Products'), Icon: HiCube, show: can('products-list') },
        { to: '/store/themes', label: t('store_design', 'Store design'), Icon: HiOutlinePaintBrush, show: !isAdmin || can('stores-list') },
        { to: '/feed', label: t('feed_title', 'Community'), Icon: HiOutlineMegaphone, show: true },
        { to: '/partners', label: t('nav_partners', 'Partners'), Icon: HiOutlineUserGroup, show: true },
        { to: '/company', label: t('company_workspace', 'Company'), Icon: HiOutlineUserGroup, show: true },
        { to: '/procurement', label: t('procurement_network', 'Procurement'), Icon: HiOutlineClipboardDocumentList, show: true },
    ].filter((item) => item.show);

    return (
        <div className="space-y-6 pb-10">
            <Reveal index={0} className="border-b border-slate-200/80 pb-3">
                <span className="inline-flex border-b-2 border-brand pb-3 text-sm font-semibold text-brand-dark">
                    {t('store_summary', 'Business summary')}
                </span>
            </Reveal>

            <Reveal index={1}>
                <h1 className="text-xl font-bold tracking-tight text-[#0a2540] md:text-2xl">
                    {t('welcome_name', { name: firstName, defaultValue: `Welcome, ${firstName}` })}
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                    {t('dashboard_wish', 'Wishing you continued growth and successful partnerships')} ✦
                </p>
            </Reveal>

            {/* Shown until the 5 setup steps are done; hides itself afterwards. */}
            <OnboardingChecklist />

            {quickAccess.length > 0 ? (
                <Reveal index={2}>
                    <section className="rounded-2xl border border-slate-200/70 bg-white px-5 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <h2 className="flex items-center gap-2 text-sm font-bold text-[#0a2540]">
                                <span className="text-accent-dark">ϟ</span>
                                {t('quick_access', 'Quick access')}
                            </h2>
                            <Link to="/settings" className="text-xs font-semibold text-brand hover:underline">
                                {t('customize', 'Customize')}
                            </Link>
                        </div>
                        <div className="flex flex-wrap gap-2.5">
                            {quickAccess.map(({ to, label, Icon }) => (
                                <Link
                                    key={to}
                                    to={to}
                                    className="group inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-[#f9fbfe] px-3.5 py-2.5 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-brand-light hover:text-[#0a2540]"
                                >
                                    <Icon className="h-4.5 w-4.5 text-brand" aria-hidden />
                                    {label}
                                    <HiOutlineArrowRight className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-70 rtl:rotate-180" aria-hidden />
                                </Link>
                            ))}
                        </div>
                    </section>
                </Reveal>
            ) : null}

            {err && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{err}</div>
            )}

            {showEmptyDashboard ? (
                <div className="rounded-2xl border border-slate-200/70 bg-white p-8 text-center shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                    <p className="text-sm leading-relaxed text-slate-600">{t('dashboard_no_visible_sections')}</p>
                </div>
            ) : null}

            {stats && visibleStats.length > 0 ? (
                <section className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] md:p-6">
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                        <Reveal as="h2" index={3} className="text-base font-bold text-[#0a2540]">
                            {t('overview')}
                        </Reveal>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                            {t('updated_live', 'Live overview')}
                        </span>
                    </div>
                    <div className="grid gap-px overflow-hidden rounded-xl border border-slate-100 bg-slate-100 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {visibleStats.map(({ key, labelKey, Icon, iconWrap }, index) => {
                            const v = counts[key];
                            if (v === undefined || v === null) {
                                return null;
                            }
                            return (
                                <Reveal
                                    key={key}
                                    index={4 + index}
                                    className="group relative overflow-hidden bg-white p-4 transition hover:bg-[#f6faff]"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                {t(labelKey)}
                                            </p>
                                            <p className="mt-2 text-2xl font-bold tabular-nums text-[#0a2540]">{v ?? '—'}</p>
                                        </div>
                                        <div
                                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconWrap} transition group-hover:scale-105`}
                                        >
                                            <Icon className="h-5 w-5" aria-hidden />
                                        </div>
                                    </div>
                                </Reveal>
                            );
                        })}
                    </div>
                </section>
            ) : null}

            {stats ? (
                <Reveal index={4 + visibleStats.length}>
                    <DashboardAnalytics stats={stats} counts={counts} />
                </Reveal>
            ) : null}
        </div>
    );
}
