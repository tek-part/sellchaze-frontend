import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Reveal from '../components/Reveal';
import {
    ArcElement,
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    Filler,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Tooltip,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
    HiOutlineArrowTrendingUp,
    HiOutlineBanknotes,
    HiOutlineClock,
    HiOutlineEnvelope,
    HiOutlineExclamationTriangle,
    HiOutlineShieldCheck,
    HiOutlineShoppingBag,
    HiOutlineSignal,
    HiOutlineUserGroup,
    HiOutlineUsers,
} from 'react-icons/hi2';
import api from '../api/client';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Filler,
    Tooltip,
    Legend
);

function StatCard({ icon: Icon, label, value, accent = 'text-brand', hint, index = 0 }) {
    return (
        <Reveal
            index={1 + index}
            className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs"
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
                    <p className={`mt-2 text-2xl font-bold ${accent}`}>{value ?? '—'}</p>
                    {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
                </div>
                <div className="rounded-xl bg-brand-light/70 p-2 text-brand">
                    <Icon className="h-6 w-6" aria-hidden />
                </div>
            </div>
        </Reveal>
    );
}

export default function AdminDashboardPage() {
    const { t, i18n } = useTranslation();
    const [data, setData] = useState(null);
    const [err, setErr] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                const { data } = await api.get('/admin/dashboard/overview');
                if (!cancelled) setData(data);
            } catch (e) {
                if (!cancelled) setErr(e.response?.data?.message || e.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const locale = i18n.language?.startsWith('ar') ? 'ar-EG' : 'en-US';

    const signupChart = useMemo(() => {
        const rows = data?.users_signup_chart ?? [];
        return {
            labels: rows.map((r) => new Date(r.date).toLocaleDateString(locale, { month: 'short', day: 'numeric' })),
            datasets: [
                {
                    label: t('admin_dashboard_new_users', 'New users'),
                    data: rows.map((r) => r.count),
                    borderColor: '#ff6a00',
                    backgroundColor: 'rgba(255,106,0,0.15)',
                    tension: 0.35,
                    fill: true,
                    pointRadius: 2,
                },
            ],
        };
    }, [data, locale, t]);

    const ordersChart = useMemo(() => {
        const rows = data?.orders_chart ?? [];
        return {
            labels: rows.map((r) => new Date(r.date).toLocaleDateString(locale, { month: 'short', day: 'numeric' })),
            datasets: [
                {
                    label: t('admin_dashboard_orders_30d', 'Orders'),
                    data: rows.map((r) => r.count),
                    backgroundColor: '#6366f1',
                    borderRadius: 6,
                },
            ],
        };
    }, [data, locale, t]);

    const rolesDoughnut = useMemo(() => {
        const rows = data?.roles_breakdown ?? [];
        return {
            labels: rows.map((r) => r.role),
            datasets: [
                {
                    data: rows.map((r) => r.count),
                    backgroundColor: ['#ff6a00', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#0ea5e9'],
                    borderWidth: 0,
                },
            ],
        };
    }, [data]);

    const chartOpts = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
    };

    const k = data?.kpis ?? {};

    return (
        <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6">
            <Reveal as="header" index={0}>
                <h1 className="text-2xl font-bold text-slate-900">{t('admin_dashboard_title', 'Admin Dashboard')}</h1>
                <p className="mt-1 text-sm text-slate-600">
                    {t('admin_dashboard_subtitle', 'Platform-wide KPIs, user growth, and system health.')}
                </p>
            </Reveal>

            {err ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>
            ) : null}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    index={0}
                    icon={HiOutlineUsers}
                    label={t('admin_dashboard_users_total', 'Total Users')}
                    value={loading ? '…' : k.users_total}
                    hint={
                        k.users_growth_30d_pct != null
                            ? `${k.users_growth_30d_pct > 0 ? '+' : ''}${k.users_growth_30d_pct}% ${t('admin_dashboard_vs_prev_30d', 'vs prev 30d')}`
                            : null
                    }
                />
                <StatCard
                    index={1}
                    icon={HiOutlineClock}
                    label={t('admin_dashboard_pending_regs', 'Pending Registrations')}
                    value={loading ? '…' : k.pending_registrations}
                    accent="text-amber-600"
                />
                <StatCard
                    index={2}
                    icon={HiOutlineShieldCheck}
                    label={t('admin_dashboard_pending_verifs', 'Pending Verifications')}
                    value={loading ? '…' : k.pending_verifications}
                    accent="text-indigo-600"
                />
                <StatCard
                    index={3}
                    icon={HiOutlineShoppingBag}
                    label={t('admin_dashboard_orders_30d', 'Orders (30d)')}
                    value={loading ? '…' : k.orders_30d}
                />
                <StatCard
                    index={4}
                    icon={HiOutlineBanknotes}
                    label={t('admin_dashboard_deals_usd_30d', 'Deals Accepted USD (30d)')}
                    value={loading ? '…' : `$${Number(k.deals_accepted_usd_30d ?? 0).toLocaleString()}`}
                    accent="text-emerald-600"
                />
                <StatCard
                    index={5}
                    icon={HiOutlineSignal}
                    label={t('admin_dashboard_active_sessions', 'Active Sessions')}
                    value={loading ? '…' : k.active_sessions}
                />
                <StatCard
                    index={6}
                    icon={HiOutlineArrowTrendingUp}
                    label={t('admin_dashboard_new_users_30d', 'New Users (30d)')}
                    value={loading ? '…' : k.users_new_30d}
                />
                <StatCard
                    index={7}
                    icon={HiOutlineEnvelope}
                    label={t('admin_dashboard_email_7d', 'Emails Sent (7d)')}
                    value={loading ? '…' : data?.email_stats_7d?.sent ?? 0}
                    hint={
                        data
                            ? `${data.email_stats_7d.failed} ${t('admin_dashboard_failed', 'failed')} / ${data.email_stats_7d.queued} ${t('admin_dashboard_queued', 'queued')}`
                            : null
                    }
                />
            </div>

            {/* Charts */}
            <Reveal index={9} className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs lg:col-span-2">
                    <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <HiOutlineArrowTrendingUp className="h-5 w-5 text-brand" aria-hidden />
                        {t('admin_dashboard_users_growth', 'User Growth (30d)')}
                    </h2>
                    <div className="h-64">
                        <Line data={signupChart} options={chartOpts} />
                    </div>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
                    <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <HiOutlineUserGroup className="h-5 w-5 text-indigo-500" aria-hidden />
                        {t('admin_dashboard_roles_breakdown', 'Roles Breakdown')}
                    </h2>
                    <div className="h-64">
                        <Doughnut data={rolesDoughnut} options={{ ...chartOpts, scales: {} }} />
                    </div>
                </div>
            </Reveal>

            <Reveal index={10} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
                    <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <HiOutlineShoppingBag className="h-5 w-5 text-indigo-500" aria-hidden />
                        {t('admin_dashboard_orders_volume', 'Orders Volume (30d)')}
                    </h2>
                    <div className="h-64">
                        <Bar data={ordersChart} options={chartOpts} />
                    </div>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
                    <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <HiOutlineExclamationTriangle className="h-5 w-5 text-red-500" aria-hidden />
                        {t('admin_dashboard_recent_errors', 'Recent System Errors')}
                    </h2>
                    <ul className="space-y-2 text-sm">
                        {(data?.recent_errors ?? []).length === 0 ? (
                            <li className="text-slate-500">{t('admin_dashboard_no_errors', 'No recent errors.')}</li>
                        ) : (
                            (data?.recent_errors ?? []).map((e, i) => (
                                <li key={i} className="rounded-sm border border-red-100 bg-red-50 p-2">
                                    <div className="font-medium text-red-800">{e.action}</div>
                                    {e.message ? <div className="text-xs text-red-700">{e.message}</div> : null}
                                    <div className="text-[10px] uppercase tracking-wide text-red-500">
                                        {new Date(e.created_at).toLocaleString(locale)}
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            </Reveal>

            {/* Pending queues */}
            <Reveal index={11} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                            <HiOutlineClock className="h-5 w-5 text-amber-500" aria-hidden />
                            {t('admin_dashboard_pending_regs', 'Pending Registrations')}
                        </h2>
                        <Link to="/admin/users?pending=1" className="text-xs font-medium text-brand hover:underline">
                            {t('view_all', 'View all')}
                        </Link>
                    </div>
                    <ul className="divide-y divide-slate-100">
                        {(data?.pending_queue?.registrations ?? []).length === 0 ? (
                            <li className="py-3 text-sm text-slate-500">
                                {t('admin_dashboard_no_pending', 'Nothing pending.')}
                            </li>
                        ) : (
                            (data?.pending_queue?.registrations ?? []).map((u) => (
                                <li key={u.id} className="flex items-center justify-between py-2 text-sm">
                                    <div>
                                        <div className="font-medium text-slate-800">{u.name}</div>
                                        <div className="text-xs text-slate-500">{u.email}</div>
                                    </div>
                                    <Link to={`/admin/users/${u.id}`} className="text-xs font-medium text-brand">
                                        {t('review', 'Review')}
                                    </Link>
                                </li>
                            ))
                        )}
                    </ul>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                            <HiOutlineShieldCheck className="h-5 w-5 text-indigo-500" aria-hidden />
                            {t('admin_dashboard_pending_verifs', 'Pending Verifications')}
                        </h2>
                        <Link to="/admin/verifications" className="text-xs font-medium text-brand hover:underline">
                            {t('view_all', 'View all')}
                        </Link>
                    </div>
                    <ul className="divide-y divide-slate-100">
                        {(data?.pending_queue?.verifications ?? []).length === 0 ? (
                            <li className="py-3 text-sm text-slate-500">
                                {t('admin_dashboard_no_pending', 'Nothing pending.')}
                            </li>
                        ) : (
                            (data?.pending_queue?.verifications ?? []).map((v) => (
                                <li key={v.id} className="flex items-center justify-between py-2 text-sm">
                                    <div>
                                        <div className="font-medium text-slate-800">{v.user_name}</div>
                                        <div className="text-xs text-slate-500">#{v.id}</div>
                                    </div>
                                    <Link to="/admin/verifications" className="text-xs font-medium text-brand">
                                        {t('review', 'Review')}
                                    </Link>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            </Reveal>
        </div>
    );
}
