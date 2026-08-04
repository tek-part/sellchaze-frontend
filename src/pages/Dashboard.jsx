import { useEffect, useState, useCallback, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Reveal from '../components/Reveal';
import {
    HiArrowDownTray,
    HiArrowUpTray,
    HiChartBar,
    HiCube,
    HiDocumentDuplicate,
    HiOutlineRectangleGroup,
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
        accent: 'text-teal-700',
        iconWrap: 'bg-teal-50 text-teal-700',
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
        accent: 'text-teal-800',
        iconWrap: 'bg-teal-50 text-teal-800',
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
        iconWrap: 'bg-teal-50 text-teal-700',
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
    if (isAdminOnly) {
        return <Navigate to="/admin/dashboard" replace />;
    }

    const loadDashboard = useCallback(async () => {
        const { data } = await api.get('/dashboard');
        setStats(data);
    }, []);

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

    const showAnalytics = stats ? dashboardHasAnyAnalyticsSection(isSupplierMode, can) : false;
    const showEmptyDashboard = stats && visibleStats.length === 0 && !showAnalytics;

    return (
        <div className="space-y-10">
            <Reveal index={0}>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">{t('dashboard')}</h1>
                <p className="mt-1 text-sm text-slate-500">
                    {t('app_name')} — {t('overview')}
                </p>
            </Reveal>

            {/* Shown until the 5 setup steps are done; hides itself afterwards. */}
            <OnboardingChecklist />

            {err && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{err}</div>
            )}

            {showEmptyDashboard ? (
                <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-card">
                    <p className="text-sm leading-relaxed text-slate-600">{t('dashboard_no_visible_sections')}</p>
                </div>
            ) : null}

            {stats && visibleStats.length > 0 ? (
                <section>
                    <Reveal as="h2" index={1} className="mb-4 text-lg font-semibold text-slate-800">
                        {t('overview')}
                    </Reveal>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {visibleStats.map(({ key, labelKey, Icon, iconWrap }, index) => {
                            const v = counts[key];
                            if (v === undefined || v === null) {
                                return null;
                            }
                            return (
                                <Reveal
                                    key={key}
                                    index={2 + index}
                                    className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card transition hover:border-brand/20 hover:shadow-soft"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                {t(labelKey)}
                                            </p>
                                            <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">{v ?? '—'}</p>
                                        </div>
                                        <div
                                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconWrap} shadow-xs transition group-hover:scale-105`}
                                        >
                                            <Icon className="h-6 w-6" aria-hidden />
                                        </div>
                                    </div>
                                </Reveal>
                            );
                        })}
                    </div>
                </section>
            ) : null}

            {stats ? (
                <Reveal index={2 + visibleStats.length}>
                    <DashboardAnalytics stats={stats} counts={counts} />
                </Reveal>
            ) : null}
        </div>
    );
}
