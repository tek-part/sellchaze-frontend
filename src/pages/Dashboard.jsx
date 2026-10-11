import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import StorePerformancePanel from '../components/dashboard/StorePerformancePanel';
import useWorkspaceCopy from '../components/workspace/workspaceCopy';
import { storeAccess } from '../lib/storeAccess';
import {
    HiArrowDownTray,
    HiArrowUpTray,
    HiChartBar,
    HiCube,
    HiDocumentDuplicate,
    HiOutlineRectangleGroup,
    HiOutlineMegaphone,
    HiOutlinePaintBrush,
    HiOutlineUserGroup,
    HiOutlineClipboardDocumentList,
    HiSquares2X2,
    HiUsers,
} from '../components/workspace/WorkspaceIcons';
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
    const { t, i18n } = useTranslation();
    const ws = useWorkspaceCopy();
    const { can, isAdmin, isSupplier, me, permissions } = usePermissions();
    const access = storeAccess(me?.roles, permissions);
    const [section, setSection] = useState(null);
    const commerce = access.canStoreAnalytics && section !== 'business';
    const [stats, setStats] = useState(null);
    const [err, setErr] = useState('');

    // Admin-only users: has Admin role and no business role (Merchant/Supplier/Customer/Employee).
    const roles = Array.isArray(me?.roles) ? me.roles : [];
    const hasBusinessRole = roles.some((r) => ['Merchant', 'Supplier', 'Customer', 'Employee'].includes(r));
    const isAdminOnly = isAdmin && !isSupplier && !hasBusinessRole;
    const loadDashboard = useCallback(async () => {
        if (isAdminOnly) return;
        const { data } = await api.get('/dashboard');
        return data;
    }, [isAdminOnly]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const data = await loadDashboard();
                if (!cancelled) setStats(data);
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
        { to: can('orders-in') ? '/orders/in' : '/orders/out', label: t('orders', 'Orders'), Icon: HiDocumentDuplicate, show: can('orders-in') || can('orders-out') },
        { to: '/products', label: t('products', 'Products'), Icon: HiCube, show: can('products-list') },
        { to: '/store/themes', label: ws('storeDesign'), Icon: HiOutlinePaintBrush, show: access.canStoreThemes },
        { to: '/feed', label: t('feed_title', 'Community'), Icon: HiOutlineMegaphone, show: true },
        { to: '/partners', label: t('nav_partners', 'Partners'), Icon: HiOutlineUserGroup, show: true },
        { to: '/company', label: ws('company'), Icon: HiOutlineUserGroup, show: true },
        { to: '/procurement', label: ws('procurement'), Icon: HiOutlineClipboardDocumentList, show: true },
    ].filter((item) => item.show);

    return (
        <div className="ws-dashboard">
            <div className="ws-dashboard-heading"><div><h1>{ws('welcome', { name: firstName })}</h1><p>{ws('welcomeHint')}</p></div><time className="ws-dashboard-date" dateTime={new Date().toISOString().slice(0, 10)}>{new Intl.DateTimeFormat(i18n.language, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date())}</time></div>
            <OnboardingChecklist />
            {access.canStoreAnalytics && <div className="ws-tabs" aria-label={t('overview')}><button type="button" aria-pressed={commerce} onClick={() => setSection('commerce')}>{ws('commerce')}</button><button type="button" aria-pressed={!commerce} onClick={() => setSection('business')}>{ws('business')}</button></div>}
            {commerce ? <StorePerformancePanel /> : <>
                {err && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{err}</div>}
                {!stats && !err && <p role="status" className="ws-note">{t('loading', 'Loading…')}</p>}
                {showEmptyDashboard && <div className="ws-panel ws-empty">{t('dashboard_no_visible_sections')}</div>}
                {stats && visibleStats.length > 0 && <section><div className="ws-panel-title"><h2>{ws('business')}</h2></div><div className="ws-kpi-grid">{visibleStats.filter(({ key }) => counts[key] != null).map(({ key, labelKey, Icon }) => <article className="ws-kpi" key={key}><div className="ws-kpi-top"><span>{t(labelKey)}</span><div className="ws-kpi-icon"><Icon aria-hidden="true" /></div></div><strong className="ws-kpi-value">{new Intl.NumberFormat(i18n.language).format(counts[key])}</strong></article>)}</div></section>}
                {stats && <DashboardAnalytics stats={stats} counts={counts} />}
            </>}
            {quickAccess.length > 0 && <section className="ws-panel"><div className="ws-panel-title"><div><h2>{ws('quickAccess')}</h2><p>{ws('quickHint')}</p></div></div><div className="ws-quick-grid">{quickAccess.map(({ to, label, Icon }) => <Link key={to} to={to} className="ws-quick-link"><div className="ws-quick-icon"><Icon aria-hidden="true" /></div><span>{label}</span></Link>)}</div></section>}
        </div>
    );
}
